import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import {
  MapPin,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Compass,
  ChevronRight,
  Building2,
  Wrench,
  Search,
  X,
  Loader2,
  ClipboardList,
  Sun,
  Wind,
  Plus,
} from 'lucide-react';
import { AvailableServiceItem, CustomerSafeTicket } from '../../types';
import { LocationAutocompleteInput } from '../../components/common/LocationAutocompleteInput';
import { LocationHierarchySelector } from '../../components/common/LocationHierarchySelector';
import { FAQAccordion } from '../../components/common/FAQAccordion';
import {
  CustomerLocation,
} from '../../utils/customerLocation';
import { useCustomerLocation } from '../../contexts/LocationContext';
import {
  acquireLiveLocation,
  geocodeAddressOrCity,
} from '../../utils/locationSearch';
import {
  getStoredBookings,
  fetchCustomerTicketsResilient,
  saveTicketToStore,
} from '../../utils/customerTicketStore';

export const CustomerHome: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { location, setLocation, clearLocation } = useCustomerLocation();

  // Form input state for location selection
  const [cityInput, setCityInput] = useState('');
  const [pincodeInput, setPincodeInput] = useState('');
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationFeedback, setLocationFeedback] = useState<string | null>(null);

  // Services State: strictly empty until an explicit location has been validated
  const [availableServices, setAvailableServices] = useState<AvailableServiceItem[]>([]);
  const [isCoverageAvailable, setIsCoverageAvailable] = useState<boolean>(true);
  const [coverageMessage, setCoverageMessage] = useState<string>('');
  const [isLoadingServices, setIsLoadingServices] = useState<boolean>(false);

  // Customer ticket and history state - initialized from store for 0ms load
  const [customerTickets, setCustomerTickets] = useState<CustomerSafeTicket[]>(() => getStoredBookings());
  const [activeTicket, setActiveTicket] = useState<CustomerSafeTicket | null>(() => {
    const stored = getStoredBookings();
    return stored.find((t) => t.status !== 'COMPLETED' && t.status !== 'CANCELLED') || null;
  });

  // Manual ticket lookup on customer home
  const [homeLookupId, setHomeLookupId] = useState('');
  const [isHomeLookingUp, setIsHomeLookingUp] = useState(false);
  const [homeLookupFeedback, setHomeLookupFeedback] = useState<string | null>(null);

  // Computed summary metrics
  const bookingCounts = useMemo(() => {
    return {
      total: customerTickets.length,
      active: customerTickets.filter((t) => t.status !== 'COMPLETED' && t.status !== 'CANCELLED').length,
      accepted: customerTickets.filter((t) => t.status === 'ACCEPTED').length,
      completed: customerTickets.filter((t) => t.status === 'COMPLETED').length,
      cancelled: customerTickets.filter((t) => t.status === 'CANCELLED').length,
    };
  }, [customerTickets]);

  // Fetch all customer service requests resiliently
  const fetchCustomerTickets = useCallback(async () => {
    if (isAuthLoading) return;

    try {
      const tickets = await fetchCustomerTicketsResilient(user?.id);
      setCustomerTickets(tickets);

      const active = tickets.find(
        (t: CustomerSafeTicket) => t.status !== 'COMPLETED' && t.status !== 'CANCELLED'
      );
      setActiveTicket(active || null);
    } catch (e: any) {
      console.error('[CustomerHome] Failed to load service history:', e?.message || e);
    }
  }, [isAuthLoading, user?.id]);

  const handleHomeLookup = async (e?: React.FormEvent, directId?: string) => {
    if (e) e.preventDefault();
    const idToFind = (directId || homeLookupId).trim();
    if (!idToFind) return;

    setIsHomeLookingUp(true);
    setHomeLookupFeedback(null);
    try {
      const res = await apiClient.get(`/customer-portal/requests/${idToFind}`);
      if (res.data?.success && res.data.data?._id) {
        const saved = saveTicketToStore(res.data.data);
        setCustomerTickets((prev) => {
          const filtered = prev.filter((t) => t._id !== saved._id);
          return [saved, ...filtered];
        });
        if (saved.status !== 'COMPLETED' && saved.status !== 'CANCELLED') {
          setActiveTicket(saved);
        }
        setHomeLookupId('');
        setHomeLookupFeedback(`Found booking #${saved.ticketNumber}! Added to your service history.`);
        setTimeout(() => setHomeLookupFeedback(null), 4000);
      } else {
        setHomeLookupFeedback('Booking not found with this ID.');
      }
    } catch (err) {
      setHomeLookupFeedback('Could not find this request. Please check the ticket ID.');
    } finally {
      setIsHomeLookingUp(false);
    }
  };

  // Fetch available services whenever an explicit location is present
  useEffect(() => {
    async function fetchServices() {
      // Guard against invalid placeholder city (e.g., when GPS fires but geocoding fails)
      if (!location || !location.city || !location.city.trim() || location.city === 'Current Location') {
        setAvailableServices([]);
        setIsCoverageAvailable(true);
        setIsLoadingServices(false);
        return;
      }

      setIsLoadingServices(true);
      setLocationFeedback(null);

      try {
        const res = await apiClient.post('/customer-portal/services/available', {
          city: location.city.trim(),
          pincode: location.pincode ? location.pincode.trim() : undefined,
          latitude: location.latitude,
          longitude: location.longitude,
          query: location.formattedAddress || location.city,
        });

        if (res.data.success) {
          const isCovered = Boolean(res.data.data.coverageAvailable);
          setIsCoverageAvailable(isCovered);
          setAvailableServices(res.data.data.services || []);
          if (!isCovered) {
            setCoverageMessage(
              res.data.data.message ||
                `Servora services are not currently available in ${location.city}.`
            );
          }
        }
      } catch (err: any) {
        console.error('Failed to fetch available services:', err);
        setIsCoverageAvailable(false);
        setAvailableServices([]);
        setCoverageMessage(
          err.response?.data?.error?.message ||
            'Servora services are not currently available in this area.'
        );
      } finally {
        setIsLoadingServices(false);
      }
    }

    fetchServices();
  }, [location]);

  // Select structured location from autocomplete
  const handleStructuredLocationSelect = (selectedLoc: CustomerLocation) => {
    // Reset downstream selection immediately
    setAvailableServices([]);
    setIsCoverageAvailable(true);
    setCoverageMessage('');
    setLocation({ ...selectedLoc, source: 'MANUAL' });
    setIsEditingLocation(false);
    setLocationFeedback(null);
  };

  // Submit explicit location
  const handleApplyLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityInput.trim()) {
      setLocationFeedback('Please enter a valid city name.');
      return;
    }

    const cleanCity = cityInput.trim();
    const cleanPin = pincodeInput.trim();

    // Reset downstream selection immediately
    setAvailableServices([]);
    setIsCoverageAvailable(true);

    const geocoded = await geocodeAddressOrCity(`${cleanCity} ${cleanPin}`.trim());
    if (!geocoded) {
      setLocationFeedback('Unable to verify that location. Please select a verified search result.');
      return;
    }

    const newLoc: CustomerLocation = {
      city: geocoded.city || cleanCity,
      area: geocoded?.area,
      state: geocoded?.state,
      country: geocoded.country,
      pincode: geocoded.pincode || cleanPin || undefined,
      latitude: geocoded.latitude,
      longitude: geocoded.longitude,
      formattedAddress: geocoded.formattedAddress,
      source: 'MANUAL',
    };

    setLocation(newLoc);
    setIsEditingLocation(false);
    setLocationFeedback(null);
  };

  // Reset/Clear location to pure initial state (location = null)
  const handleClearLocation = () => {
    setLocation(null);
    setCityInput('');
    setPincodeInput('');
    setAvailableServices([]);
    setIsCoverageAvailable(true);
    setCoverageMessage('');
    clearLocation();
    setIsEditingLocation(false);
    setLocationFeedback(null);
  };

  // Authoritative Geolocation (Browser GPS with Google Maps fallback)
  const handleUseCurrentLocation = async () => {
    setIsLocating(true);
    setLocationFeedback(null);

    try {
      const result = await acquireLiveLocation(10000);
      if (result) {
        const { suggestion, latitude, longitude } = result;
        const newLoc: CustomerLocation = {
          city: suggestion.city,
          area: suggestion.area,
          state: suggestion.state,
          country: suggestion.country,
          pincode: suggestion.pincode,
          latitude,
          longitude,
          formattedAddress: suggestion.formattedAddress,
          source: 'GPS',
          accuracy: result.accuracy,
          timestamp: new Date().toISOString(),
        };

        setAvailableServices([]);
        setLocation(newLoc);
        setIsEditingLocation(false);
        const isApprox = typeof result.accuracy === 'number' && result.accuracy > 1500;
        const sourceLabel = isApprox ? ' (Approximate)' : '';
        const feedbackMsg = isApprox
          ? `📍 Detected location${sourceLabel}: ${suggestion.city || suggestion.formattedAddress}. Tap "Change Location" if inaccurate.`
          : `📍 Live location active${sourceLabel}: ${suggestion.formattedAddress || suggestion.city}`;
        setLocationFeedback(feedbackMsg);
        setTimeout(() => setLocationFeedback(null), isApprox ? 8000 : 4000);
      } else {
        setLocationFeedback('Unable to detect live location. Please enter your city or area manually.');
      }
    } catch (err: any) {
      console.warn('Geolocation detection error:', err);
      setLocationFeedback('Location detection failed. Please enter your city or area manually.');
    } finally {
      setIsLocating(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Top Multi-Portal Directory Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-3 sm:px-4 sm:py-3 shadow-sm border border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
          <span className="text-xs font-semibold text-slate-200">
            Viewing: <strong className="text-white">Customer Portal</strong>
          </span>
          <span className="text-slate-500 hidden sm:inline">•</span>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Homeowner & Facility Service Gateway
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/portals"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-400 hover:text-indigo-300 bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg border border-white/10 transition-colors"
          >
            <Building2 className="w-3 h-3" />
            <span>Switch to Manager / Technician Portal</span>
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Active Service Tracking Banner (if any active request exists) */}
      {activeTicket && (
        <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 text-white rounded-2xl p-4 sm:p-5 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-amber-300 animate-spin" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">
                  Active Service
                </span>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-mono font-bold">
                  #{activeTicket.ticketNumber}
                </span>
              </div>
              <p className="font-bold text-sm sm:text-base mt-0.5">
                {activeTicket.serviceType} — {activeTicket.customerStatusLabel}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate(`/customer/requests/${activeTicket._id}`)}
            className="w-full sm:w-auto px-4 py-2 bg-white text-indigo-700 hover:bg-indigo-50 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 shrink-0 active:scale-95"
          >
            <span>Track Live Status</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Service Bookings & History Quick Dashboard */}
      {customerTickets.length > 0 ? (
        <section className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                    My Service History
                  </h2>
                  <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-200">
                    {customerTickets.length} Request{customerTickets.length === 1 ? '' : 's'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time status of all your booked Solar & AC services.
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate('/customer/requests')}
              className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto shadow-xs active:scale-95"
            >
              <span>View All History</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Booked
              </span>
              <span className="text-xl font-black text-slate-800">{bookingCounts.total}</span>
            </div>
            <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-100">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                Active / En Route
              </span>
              <span className="text-xl font-black text-blue-900">{bookingCounts.active}</span>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">
                Completed
              </span>
              <span className="text-xl font-black text-emerald-900">{bookingCounts.completed}</span>
            </div>
            <div className="p-3 rounded-2xl bg-rose-50/70 border border-rose-100">
              <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">
                Cancelled / Rejected
              </span>
              <span className="text-xl font-black text-rose-900">{bookingCounts.cancelled}</span>
            </div>
          </div>

          {/* Recent Bookings Cards */}
          <div className="space-y-2.5 pt-1">
            {customerTickets.slice(0, 3).map((ticket) => {
              const isSolar = ticket.serviceType === 'SOLAR';
              const isAccepted = ticket.status === 'ACCEPTED';
              const isDone = ticket.status === 'COMPLETED';
              const isCancelled = ticket.status === 'CANCELLED';

              const badgeClass = isDone
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : isAccepted
                ? 'bg-teal-50 text-teal-700 border-teal-200 ring-2 ring-teal-100/70'
                : isCancelled
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-blue-50 text-blue-700 border-blue-200';

              return (
                <div
                  key={ticket._id}
                  onClick={() => navigate(`/customer/requests/${ticket._id}`)}
                  className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/90 border border-slate-200 hover:border-indigo-300 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs ${
                        isSolar
                          ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                          : 'bg-gradient-to-br from-cyan-500 to-blue-600'
                      }`}
                    >
                      {isSolar ? <Sun className="w-5 h-5" /> : <Wind className="w-5 h-5" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">
                          #{ticket.ticketNumber}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${badgeClass}`}
                        >
                          {ticket.customerStatusLabel}
                        </span>
                        {isAccepted && (
                          <span className="text-[9px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            <span>Pro Confirmed</span>
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs font-bold text-slate-800 truncate mt-1">
                        {ticket.problemCategory || ticket.normalizedComplaint}
                      </h4>

                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5 font-medium">
                        <span className="flex items-center gap-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {ticket.serviceLocation.city}
                        </span>
                        <span>•</span>
                        <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-bold text-indigo-600 bg-white hover:bg-indigo-50 px-3 py-1.5 rounded-xl border border-slate-200/80 transition-colors self-end sm:self-center shrink-0">
                    <span>Track</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                  My Service History
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Track your booked solar and AC service requests in real-time.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleHomeLookup(undefined, '6ab3453536130fcff950ce48')}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                title="Load sample solar booking to test"
              >
                Load Sample Booking
              </button>
              <button
                onClick={() => navigate('/customer/request')}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors flex items-center gap-1 shadow-xs active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Book Service</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
            <p className="text-xs text-slate-500">
              No recent bookings found on this device. Already booked with a ticket ID?
            </p>
            <form onSubmit={handleHomeLookup} className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  value={homeLookupId}
                  onChange={(e) => setHomeLookupId(e.target.value)}
                  placeholder="Enter Ticket ID..."
                  className="px-3 py-1.5 pl-8 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium w-48"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
              <button
                type="submit"
                disabled={isHomeLookingUp || !homeLookupId.trim()}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-colors shrink-0"
              >
                {isHomeLookingUp ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Find'}
              </button>
            </form>
          </div>

          {homeLookupFeedback && (
            <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>{homeLookupFeedback}</span>
            </div>
          )}
        </section>
      )}

      {/* Location Bar / Selector Header */}
      <section className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Service Location
              </span>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                  {location ? (
                    <span>
                      {location.city} {location.pincode ? `(${location.pincode})` : ''}
                    </span>
                  ) : (
                    <span className="text-indigo-600">Select Location</span>
                  )}
                </h3>
                {location && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {location && (
              <button
                type="button"
                onClick={handleClearLocation}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                title="Clear location"
              >
                Clear
              </button>
            )}
            <button
              onClick={() => {
                setIsEditingLocation(!isEditingLocation);
                setLocationFeedback(null);
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
            >
              {isEditingLocation ? 'Close' : location ? 'Change Location' : 'Enter Location'}
            </button>
            <button
              onClick={handleUseCurrentLocation}
              disabled={isLocating}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-1.5"
            >
              <Compass className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-indigo-600' : ''}`} />
              <span>{isLocating ? 'Detecting...' : 'Use GPS'}</span>
            </button>
          </div>
        </div>

        {/* Location Selection Drawer */}
        {isEditingLocation && (
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-3 animate-fadeIn">
            <LocationHierarchySelector
              currentLocation={location}
              onLocationSelected={handleStructuredLocationSelect}
              onClearLocation={handleClearLocation}
              autoOpen={true}
            />

            {locationFeedback && (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>{locationFeedback}</span>
              </div>
            )}

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setIsEditingLocation(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </section>

      {/* STATE 1: LOCATION_REQUIRED (When customer location is null) */}
      {!location ? (
        <section className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm text-center max-w-2xl mx-auto space-y-6 animate-fadeIn">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <MapPin className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Where do you need service?
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm font-normal max-w-md mx-auto">
              Search your city and area to check certified field engineering coverage for Solar & HVAC systems.
            </p>
          </div>

          {locationFeedback && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2 max-w-md mx-auto text-left">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>{locationFeedback}</span>
            </div>
          )}

          <div className="max-w-md mx-auto text-left pt-2">
            <LocationHierarchySelector
              currentLocation={null}
              onLocationSelected={handleStructuredLocationSelect}
              autoOpen={true}
            />
          </div>
        </section>
      ) : (
        /* STATE 2: LOCATION_KNOWN -> Check Coverage & Render Services */
        <>
          {/* Hero Welcome Section */}
          <section className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Services available in {location.city}
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm font-normal max-w-2xl">
              AI assists problem classification; verified local service companies and technicians perform on-site diagnosis and repair.
            </p>
          </section>

          {/* Loading Services */}
          {isLoadingServices ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-44 bg-slate-200/70 rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : !isCoverageAvailable || availableServices.length === 0 ? (
            /* STATE 3: ZERO-SERVICE LOCATION */
            <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xs text-center max-w-xl mx-auto space-y-5 animate-fadeIn">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-slate-900">
                  Coverage Not Available in {location.city}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500">
                  {coverageMessage || 'Servora services are not currently available in this area.'}
                </p>
              </div>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingLocation(true)}
                  className="w-full sm:w-auto px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                >
                  Try Another City
                </button>
                <button
                  type="button"
                  onClick={handleClearLocation}
                  className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                >
                  Reset Location
                </button>
              </div>
            </div>
          ) : (
            /* Available Service Cards */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {availableServices.map((service) => {
                const isSolar = service.serviceType === 'SOLAR';
                return (
                  <div
                    key={service.serviceType}
                    onClick={() => {
                      const q = new URLSearchParams({
                        service: service.serviceType,
                        city: location.city,
                      });
                      if (location.latitude !== undefined) q.set('lat', String(location.latitude));
                      if (location.longitude !== undefined) q.set('lng', String(location.longitude));
                      if (location.pincode) q.set('pincode', location.pincode);
                      if (location.area) q.set('area', location.area);
                      if (location.formattedAddress) q.set('address', location.formattedAddress);
                      navigate(`/customer/request?${q.toString()}`);
                    }}
                    className="group bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs hover:shadow-md hover:border-indigo-400 transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold shadow-xs ${
                            isSolar ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {isSolar ? '☀️' : '❄️'}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Active in {location.city}</span>
                        </span>
                      </div>

                      <h3 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {service.displayName}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {service.shortDescription}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-600 group-hover:text-indigo-700 flex items-center gap-1">
                        <span>Book Service</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {(service.providerCount ?? 0) > 0
                          ? `${service.providerCount} Certified Provider${
                              (service.providerCount ?? 0) > 1 ? 's' : ''
                            }`
                          : 'Available'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Trust & Quality Banner */}
      <section className="bg-slate-50 rounded-3xl p-6 border border-slate-200/80">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Verified Service Companies</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Every technician is certified, background-verified, and equipped with precision testing tools.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">AI-Guided Problem Triage</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Smart problem categorization identifies exact parts and tools before the technician arrives.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Digital Completion Reports</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Receive before-and-after photo verification, electrical readings, and digital warranty receipts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Production FAQ Section */}
      <section className="pt-2">
        <FAQAccordion />
      </section>
    </div>
  );
};
