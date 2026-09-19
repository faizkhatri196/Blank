import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { AvailableServiceItem, CustomerSafeTicket } from '../../types';
import {
  CustomerLocation,
  getCustomerSavedLocation,
  saveCustomerLocation,
  clearCustomerLocation,
} from '../../utils/customerLocation';

export const CustomerHome: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Location State: Starts strictly as NULL for any brand-new customer
  const [location, setLocation] = useState<CustomerLocation | null>(() =>
    getCustomerSavedLocation(user?.id)
  );

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

  // Active ticket state
  const [activeTicket, setActiveTicket] = useState<CustomerSafeTicket | null>(null);

  // Fetch available services whenever an explicit location is present
  useEffect(() => {
    async function fetchServices() {
      if (!location || !location.city || !location.city.trim()) {
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

  // Fetch active ticket if user is logged in
  useEffect(() => {
    async function fetchUserActiveTicket() {
      if (!user) return;
      try {
        const res = await apiClient.get('/customer-portal/requests');
        if (res.data.success && res.data.data.length > 0) {
          const active = res.data.data.find(
            (t: CustomerSafeTicket) => t.status !== 'COMPLETED' && t.status !== 'CANCELLED'
          );
          if (active) {
            setActiveTicket(active);
          }
        }
      } catch (e) {
        // Silently ignore
      }
    }
    fetchUserActiveTicket();
  }, [user]);

  // Submit explicit location
  const handleApplyLocation = (e: React.FormEvent) => {
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

    const newLoc: CustomerLocation = {
      city: cleanCity,
      pincode: cleanPin || undefined,
    };

    setLocation(newLoc);
    saveCustomerLocation(newLoc, user?.id);
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
    clearCustomerLocation(user?.id);
    setIsEditingLocation(false);
    setLocationFeedback(null);
  };

  // Browser Geolocation (strictly user-initiated, NO fallback to Ahmedabad!)
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationFeedback(
        'Geolocation is not supported by your browser. Please enter your city manually.'
      );
      return;
    }

    setIsLocating(true);
    setLocationFeedback(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
            { headers: { Accept: 'application/json' } }
          );

          if (geoRes.ok) {
            const data = await geoRes.json();
            const detectedCity =
              data.address?.city ||
              data.address?.town ||
              data.address?.district ||
              data.address?.state_district;
            const detectedPin = data.address?.postcode;

            if (detectedCity && typeof detectedCity === 'string') {
              const newLoc: CustomerLocation = {
                city: detectedCity.trim(),
                pincode: detectedPin ? String(detectedPin).trim() : undefined,
              };

              // Reset downstream state
              setAvailableServices([]);
              setLocation(newLoc);
              saveCustomerLocation(newLoc, user?.id);
              setIsLocating(false);
              setIsEditingLocation(false);
              return;
            }
          }
          // If reverse geocoding cannot determine city, prompt manual entry (NEVER fallback to Ahmedabad)
          setLocationFeedback('Could not determine city from GPS. Please enter your city or area manually.');
        } catch (e) {
          setLocationFeedback('Unable to reach location service. Please enter your city manually.');
        } finally {
          setIsLocating(false);
        }
      },
      (_err) => {
        setIsLocating(false);
        setLocationFeedback('Location permission denied. Please enter your city or area manually.');
      },
      { timeout: 8000 }
    );
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
          <form
            onSubmit={handleApplyLocation}
            className="mt-4 pt-4 border-t border-slate-100 space-y-3 animate-fadeIn"
          >
            <p className="text-xs text-slate-600 font-medium">
              Enter your city or area to verify service coverage:
            </p>

            {locationFeedback && (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>{locationFeedback}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase">City / Town *</label>
                <input
                  type="text"
                  value={cityInput}
                  onChange={(e) => setCityInput(e.target.value)}
                  placeholder="e.g. Rajkot, Surat, Ahmedabad, Vadodara"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 bg-white"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase">Pincode (Optional)</label>
                <input
                  type="text"
                  value={pincodeInput}
                  onChange={(e) => setPincodeInput(e.target.value)}
                  placeholder="e.g. 360001"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 bg-white"
                />
              </div>
            </div>

            {/* Quick city suggestions */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] font-bold text-slate-400">Sample Cities:</span>
              {[
                { name: 'Rajkot', pin: '360001' },
                { name: 'Ahmedabad', pin: '380015' },
                { name: 'Gandhinagar', pin: '382007' },
                { name: 'Surat', pin: '395001' },
                { name: 'Mumbai', pin: '400001' },
              ].map((c) => (
                <button
                  type="button"
                  key={c.name}
                  onClick={() => {
                    setCityInput(c.name);
                    setPincodeInput(c.pin);
                  }}
                  className="px-2 py-0.5 rounded-lg text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium border border-slate-200 transition-colors"
                >
                  {c.name}
                </button>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditingLocation(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
              >
                Verify Coverage
              </button>
            </div>
          </form>
        )}
      </section>

      {/* STATE 1: LOCATION_REQUIRED (When customer location is null) */}
      {!location ? (
        <section className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm text-center max-w-2xl mx-auto space-y-6 animate-fadeIn">
          <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-inner">
            <MapPin className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Where do you need service?
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm font-normal max-w-md mx-auto">
              Please provide your city or area to check live service availability and discover certified field engineers near you.
            </p>
          </div>

          {locationFeedback && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2 max-w-md mx-auto text-left">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>{locationFeedback}</span>
            </div>
          )}

          <form onSubmit={handleApplyLocation} className="max-w-md mx-auto space-y-3 text-left">
            <div>
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                City / Area *
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={cityInput}
                  onChange={(e) => setCityInput(e.target.value)}
                  placeholder="Enter your city (e.g. Rajkot, Surat, Ahmedabad)"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Pincode (Optional)
              </label>
              <input
                type="text"
                value={pincodeInput}
                onChange={(e) => setPincodeInput(e.target.value)}
                placeholder="e.g. 360001"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 bg-white"
              />
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
              <button
                type="submit"
                className="w-full sm:flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>Check Available Services</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={isLocating}
                className="w-full sm:w-auto py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0"
              >
                <Compass className={`w-4 h-4 ${isLocating ? 'animate-spin text-indigo-600' : ''}`} />
                <span>{isLocating ? 'Locating...' : 'Use GPS'}</span>
              </button>
            </div>
          </form>

          <div className="pt-4 border-t border-slate-100 max-w-md mx-auto">
            <span className="text-[11px] text-slate-400 block mb-2">Supported Demonstration Cities:</span>
            <div className="flex flex-wrap justify-center gap-1.5">
              {[
                { name: 'Rajkot', pin: '360001' },
                { name: 'Ahmedabad', pin: '380015' },
                { name: 'Gandhinagar', pin: '382007' },
                { name: 'Surat', pin: '395001' },
              ].map((c) => (
                <button
                  type="button"
                  key={c.name}
                  onClick={() => {
                    setCityInput(c.name);
                    setPincodeInput(c.pin);
                  }}
                  className="px-2.5 py-1 text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 font-medium"
                >
                  {c.name}
                </button>
              ))}
            </div>
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
                    onClick={() =>
                      navigate(
                        `/customer/request?service=${service.serviceType}&city=${encodeURIComponent(
                          location.city
                        )}`
                      )
                    }
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
    </div>
  );
};
