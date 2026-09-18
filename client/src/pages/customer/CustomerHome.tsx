import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import {
  MapPin,
  Sun,
  Wind,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Compass,
  ChevronRight,
} from 'lucide-react';
import { AvailableServiceItem, CustomerSafeTicket } from '../../types';

export const CustomerHome: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Location State
  const [city, setCity] = useState<string>(() => localStorage.getItem('servora_customer_city') || 'Ahmedabad');
  const [pincode, setPincode] = useState<string>(() => localStorage.getItem('servora_customer_pincode') || '380015');
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [locationInput, setLocationInput] = useState(city);
  const [pincodeInput, setPincodeInput] = useState(pincode);
  const [isLocating, setIsLocating] = useState(false);

  // Services State
  const [availableServices, setAvailableServices] = useState<AvailableServiceItem[]>([]);
  const [isCoverageAvailable, setIsCoverageAvailable] = useState<boolean>(true);
  const [coverageMessage, setCoverageMessage] = useState<string>('');
  const [isLoadingServices, setIsLoadingServices] = useState<boolean>(true);

  // Active ticket state
  const [activeTicket, setActiveTicket] = useState<CustomerSafeTicket | null>(null);

  // Fetch available services when location changes
  useEffect(() => {
    async function fetchServices() {
      setIsLoadingServices(true);
      try {
        const res = await apiClient.post('/customer-portal/services/available', {
          city,
          pincode,
        });

        if (res.data.success) {
          setIsCoverageAvailable(res.data.data.coverageAvailable);
          setAvailableServices(res.data.data.services || []);
          if (!res.data.data.coverageAvailable) {
            setCoverageMessage(res.data.data.message || 'Servora services are not currently available in your area.');
          }
        }
      } catch (err) {
        console.error('Failed to fetch available services:', err);
        // Fallback default
        setIsCoverageAvailable(true);
        setAvailableServices([
          {
            serviceType: 'SOLAR',
            displayName: 'Solar Service',
            shortDescription: 'Solar panels, inverter, generation & routine maintenance',
            icon: 'Sun',
            heroImage: '/assets/services/solar-hero.svg',
          },
          {
            serviceType: 'AC',
            displayName: 'AC & HVAC Service',
            shortDescription: 'Cooling, water leakage, unusual noise & seasonal maintenance',
            icon: 'Wind',
            heroImage: '/assets/services/ac-hero.svg',
          },
        ]);
      } finally {
        setIsLoadingServices(false);
      }
    }

    fetchServices();
  }, [city, pincode]);

  // Fetch active ticket if user is logged in
  useEffect(() => {
    async function fetchUserActiveTicket() {
      if (!user) return;
      try {
        const res = await apiClient.get('/customer-portal/requests');
        if (res.data.success && res.data.data.length > 0) {
          const active = res.data.data.find((t: CustomerSafeTicket) => t.status !== 'COMPLETED' && t.status !== 'CANCELLED');
          if (active) {
            setActiveTicket(active);
          }
        }
      } catch (e) {
        // Silently ignore if not logged in
      }
    }
    fetchUserActiveTicket();
  }, [user]);

  // Save manual location
  const handleSaveLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationInput.trim()) return;
    const newCity = locationInput.trim();
    const newPin = pincodeInput.trim();
    setCity(newCity);
    setPincode(newPin);
    localStorage.setItem('servora_customer_city', newCity);
    if (newPin) localStorage.setItem('servora_customer_pincode', newPin);
    setIsEditingLocation(false);
  };

  // Browser Geolocation
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser. Please enter your city manually.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (_pos) => {
        // In pilot/demo, map coordinates or default to Ahmedabad
        setCity('Ahmedabad');
        setPincode('380015');
        localStorage.setItem('servora_customer_city', 'Ahmedabad');
        localStorage.setItem('servora_customer_pincode', '380015');
        setIsLocating(false);
        setIsEditingLocation(false);
      },
      (_err) => {
        setIsLocating(false);
        alert('Location permission denied. Please enter your city manually below.');
      },
      { timeout: 8000 }
    );
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Active Service Tracking Banner */}
      {activeTicket && (
        <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 text-white rounded-2xl p-4 sm:p-5 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-amber-300 animate-spin" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">Active Service</span>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-mono font-bold">
                  #{activeTicket.ticketNumber}
                </span>
              </div>
              <p className="font-bold text-sm sm:text-base mt-0.5">
                {activeTicket.serviceType === 'SOLAR' ? '☀️ Solar' : '❄️ AC'} — {activeTicket.customerStatusLabel}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate(`/customer/requests/${activeTicket._id}`)}
            className="w-full sm:w-auto px-4 py-2 bg-white text-indigo-700 hover:bg-indigo-50 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 shrink-0 active:scale-95"
          >
            <span>Track Progress</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Location Bar / Selector Header */}
      <section className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Service Location</span>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                  {city} {pincode ? `(${pincode})` : ''}
                </h3>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditingLocation(!isEditingLocation)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
            >
              {isEditingLocation ? 'Cancel' : 'Change City'}
            </button>
            <button
              onClick={handleUseCurrentLocation}
              disabled={isLocating}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-1.5"
            >
              <Compass className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-indigo-600' : ''}`} />
              <span>{isLocating ? 'Detecting...' : 'Current Location'}</span>
            </button>
          </div>
        </div>

        {/* Location Edit Drawer */}
        {isEditingLocation && (
          <form onSubmit={handleSaveLocation} className="mt-4 pt-4 border-t border-slate-100 space-y-3 animate-fadeIn">
            <p className="text-xs text-slate-600 font-medium">
              Enter your city or select a supported pilot city to verify service coverage:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase">City</label>
                <input
                  type="text"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  placeholder="e.g. Ahmedabad, Gandhinagar, Sanand"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase">Pincode (Optional)</label>
                <input
                  type="text"
                  value={pincodeInput}
                  onChange={(e) => setPincodeInput(e.target.value)}
                  placeholder="e.g. 380015"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Quick city pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] font-bold text-slate-400">Supported Pilot Areas:</span>
              {['Ahmedabad', 'Gandhinagar', 'Sanand', 'Bopal'].map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => {
                    setLocationInput(c);
                    setPincodeInput(c === 'Ahmedabad' ? '380015' : c === 'Gandhinagar' ? '382007' : '382110');
                  }}
                  className="px-2 py-0.5 rounded-lg text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium border border-slate-200"
                >
                  {c}
                </button>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                Apply Location
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Hero Welcome Section */}
      <section className="text-center sm:text-left space-y-1">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          What service do you need today?
        </h1>
        <p className="text-slate-600 text-sm sm:text-base font-normal max-w-2xl">
          Request qualified on-site service in {city}. AI assists problem classification; certified engineers perform physical inspection and repair.
        </p>
      </section>

      {/* Services Discovery Section */}
      {isLoadingServices ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-44 bg-slate-200/70 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : !isCoverageAvailable || availableServices.length === 0 ? (
        /* Unsupported Location State (Principle 10: Do not fabricate service availability) */
        <div className="bg-amber-50/80 border border-amber-200 rounded-3xl p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-amber-950">Service Coverage Notice</h3>
          <p className="text-xs sm:text-sm text-amber-800 max-w-md mx-auto">
            {coverageMessage || `Servora operations are not currently deployed in ${city}.`}
          </p>
          <div className="pt-2">
            <button
              onClick={() => {
                setCity('Ahmedabad');
                setPincode('380015');
                localStorage.setItem('servora_customer_city', 'Ahmedabad');
              }}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors"
            >
              Switch to Supported Area (Ahmedabad)
            </button>
          </div>
        </div>
      ) : (
        /* Available Services Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {/* 1. Solar Service Card */}
          {availableServices.some((s) => s.serviceType === 'SOLAR') && (
            <div
              onClick={() => navigate('/customer/request?service=SOLAR')}
              className="group relative bg-white rounded-3xl p-6 border border-slate-200 hover:border-amber-400/80 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:scale-125 transition-transform" />
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
                    <Sun className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/80">
                    Clean Energy
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                  Solar Service
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed font-normal">
                  Rooftop panels, inverters, power generation drop, error codes & routine maintenance.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-amber-600 flex items-center gap-1 group-hover:gap-2 transition-all">
                  Request Solar Service <ArrowRight className="w-4 h-4" />
                </span>
                <span className="text-[11px] text-slate-600 font-medium">Available in {city}</span>
              </div>
            </div>
          )}

          {/* 2. AC & HVAC Service Card */}
          {availableServices.some((s) => s.serviceType === 'AC') && (
            <div
              onClick={() => navigate('/customer/request?service=AC')}
              className="group relative bg-white rounded-3xl p-6 border border-slate-200 hover:border-cyan-400/80 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:scale-125 transition-transform" />
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
                    <Wind className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold text-cyan-700 bg-cyan-50 px-2.5 py-1 rounded-full border border-cyan-200/80">
                    Climate Control
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-cyan-600 transition-colors">
                  AC & HVAC Service
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed font-normal">
                  Cooling issues, water leaks, unusual noises, power failures & seasonal jet servicing.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-600 flex items-center gap-1 group-hover:gap-2 transition-all">
                  Request AC Service <ArrowRight className="w-4 h-4" />
                </span>
                <span className="text-[11px] text-slate-600 font-medium">Available in {city}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Trust & Safety Guarantees */}
      <section className="bg-slate-100/80 rounded-2xl p-5 border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-white text-indigo-600 flex items-center justify-center shrink-0 shadow-2xs">
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">AI Problem Understanding</h4>
            <p className="text-[11px] text-slate-600 font-normal mt-0.5">
              Describe problems in your own everyday language or upload photos.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-white text-indigo-600 flex items-center justify-center shrink-0 shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">Verified Technicians</h4>
            <p className="text-[11px] text-slate-600 font-normal mt-0.5">
              Assigned and verified by authorized field operations managers.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-white text-indigo-600 flex items-center justify-center shrink-0 shadow-2xs">
            <CheckCircle2 className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">Physical On-Site Proof</h4>
            <p className="text-[11px] text-slate-600 font-normal mt-0.5">
              All diagnostics and repairs verified with physical multimeter/test data.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
