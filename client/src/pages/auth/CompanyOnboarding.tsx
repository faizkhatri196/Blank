import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import {
  Building2,
  MapPin,
  Wrench,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Sun,
  Wind,
  Zap,
  Droplet,
  Tv,
  Check,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Globe,
  Phone,
  Mail,
  Lock,
} from 'lucide-react';

interface ServiceOption {
  type: string;
  name: string;
  description: string;
  icon: any;
  color: string;
}

const AVAILABLE_SERVICES: ServiceOption[] = [
  {
    type: 'SOLAR',
    name: 'Solar Energy',
    description: 'Inverters, rooftop panels, generation & maintenance',
    icon: Sun,
    color: 'amber',
  },
  {
    type: 'AC',
    name: 'AC & HVAC',
    description: 'Cooling issues, compressor, water leakage & servicing',
    icon: Wind,
    color: 'sky',
  },
];

interface CoverageAreaInput {
  locationName?: string;
  formattedAddress?: string;
  latitude?: number;
  longitude?: number;
  city: string;
  state: string;
  country: string;
  areas: string[];
  pincodes: string[];
  radius?: number;
  services: string[];
}

export const CompanyOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [step, setStep] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Company Details
  const [companyName, setCompanyName] = useState<string>('');
  const [managerName, setManagerName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [website, setWebsite] = useState<string>('');

  // Step 2 & 4: Service Areas with assigned services
  const [serviceAreas, setServiceAreas] = useState<CoverageAreaInput[]>([
    {
      locationName: '',
      formattedAddress: '',
      city: '',
      state: '',
      country: '',
      areas: [],
      pincodes: [],
      radius: 25,
      services: ['SOLAR', 'AC'],
    },
  ]);

  // Step 3: Global services chosen by company
  const [selectedGlobalServices, setSelectedGlobalServices] = useState<string[]>(['SOLAR', 'AC']);

  // Temporary input buffers for area chips and pincodes
  const [tempAreaInput, setTempAreaInput] = useState<Record<number, string>>({});
  const [tempPincodeInput, setTempPincodeInput] = useState<Record<number, string>>({});
  const [radiusInputs, setRadiusInputs] = useState<Record<number, string>>({});

  const addAreaChip = (index: number) => {
    const val = (tempAreaInput[index] || '').trim();
    if (!val) return;
    setServiceAreas((prev) => {
      const copy = [...prev];
      if (!copy[index].areas.includes(val)) {
        copy[index].areas.push(val);
      }
      return copy;
    });
    setTempAreaInput((prev) => ({ ...prev, [index]: '' }));
  };

  const removeAreaChip = (areaIdx: number, chipIdx: number) => {
    setServiceAreas((prev) => {
      const copy = [...prev];
      copy[areaIdx].areas.splice(chipIdx, 1);
      return copy;
    });
  };

  const addPincodeChip = (index: number) => {
    const val = (tempPincodeInput[index] || '').trim();
    if (!val) return;
    setServiceAreas((prev) => {
      const copy = [...prev];
      if (!copy[index].pincodes.includes(val)) {
        copy[index].pincodes.push(val);
      }
      return copy;
    });
    setTempPincodeInput((prev) => ({ ...prev, [index]: '' }));
  };

  const removePincodeChip = (areaIdx: number, pinIdx: number) => {
    setServiceAreas((prev) => {
      const copy = [...prev];
      copy[areaIdx].pincodes.splice(pinIdx, 1);
      return copy;
    });
  };

  const addNewAreaRow = () => {
    setServiceAreas((prev) => [
      ...prev,
      {
        city: '',
        state: '',
        country: 'India',
        areas: [],
        pincodes: [],
        radius: 20,
        services: [...selectedGlobalServices],
      },
    ]);
  };

  const removeAreaRow = (idx: number) => {
    if (serviceAreas.length <= 1) return;
    setServiceAreas((prev) => prev.filter((_, i) => i !== idx));
  };

  // Step 1 Validation
  const validateStep1 = () => {
    if (!companyName.trim() || !managerName.trim() || !email.trim() || !phone.trim() || !password) {
      setError('Please fill all required company information fields.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please provide a valid email address.');
      return false;
    }
    const phoneClean = phone.replace(/[\s\-\(\)\+]/g, '');
    if (!/^\d{8,15}$/.test(phoneClean)) {
      setError('Please enter a valid phone number (8 to 15 digits).');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return false;
    }
    setError(null);
    return true;
  };

  // Step 2 Validation
  const validateStep2 = () => {
    for (let i = 0; i < serviceAreas.length; i++) {
      if (!serviceAreas[i].city.trim()) {
        setError(`Please specify a city for Service Area #${i + 1}.`);
        return false;
      }
    }
    setError(null);
    return true;
  };

  // Step 3 Validation
  const validateStep3 = () => {
    if (selectedGlobalServices.length === 0) {
      setError('Please select at least one service category that your company provides.');
      return false;
    }
    // Pre-populate service areas with selected services if area services are empty
    setServiceAreas((prev) =>
      prev.map((sa) => ({
        ...sa,
        services: sa.services.length > 0 ? sa.services : [...selectedGlobalServices],
      }))
    );
    setError(null);
    return true;
  };

  // Step 4 Validation
  const validateStep4 = () => {
    for (let i = 0; i < serviceAreas.length; i++) {
      if (serviceAreas[i].services.length === 0) {
        setError(`Please assign at least one active service to ${serviceAreas[i].city || 'Area #' + (i + 1)}.`);
        return false;
      }
    }
    setError(null);
    return true;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    if (step === 3 && !validateStep3()) return;
    if (step === 4 && !validateStep4()) return;
    setError(null);
    setStep((s) => s + 1);
  };

  const handleCreateCompany = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const payload = {
        companyName: companyName.trim(),
        managerName: managerName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
        confirmPassword,
        address: address.trim(),
        website: website.trim(),
        servicesSupported: selectedGlobalServices,
        serviceAreas: serviceAreas.map((sa) => ({
          city: sa.city.trim(),
          state: sa.state.trim(),
          country: sa.country.trim(),
          areas: sa.areas,
          pincodes: sa.pincodes,
          radius: sa.radius || 20,
          services: sa.services,
        })),
      };

      const res = await apiClient.post('/auth/signup', payload);

      if (res.data.success && res.data.data.token) {
        login(res.data.data.token, res.data.data.user);
        navigate('/manager/dashboard', { replace: true });
      } else {
        setError(res.data.error?.message || 'Failed to complete registration.');
      }
    } catch (err: any) {
      console.error('Onboarding failed:', err);
      const safeReason =
        err.response?.data?.error?.message ||
        err.message ||
        'An error occurred during company creation.';
      setError(safeReason);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl w-full mx-auto space-y-8">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 mb-2">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Register Your Service Enterprise
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            Configure your company profile, service areas, and operational verticals to enable intelligent customer discovery.
          </p>
        </div>

        {/* 5-Step Indicator */}
        <div className="bg-white rounded-2xl p-2.5 sm:p-5 border border-slate-200/80 shadow-xs">
          <div className="grid grid-cols-5 gap-1 sm:gap-2 text-center text-xs font-bold">
            {[
              { num: 1, label: 'Company' },
              { num: 2, label: 'Coverage' },
              { num: 3, label: 'Services' },
              { num: 4, label: 'Mapping' },
              { num: 5, label: 'Review' },
            ].map((s) => (
              <div
                key={s.num}
                className={`py-2 px-0.5 sm:px-1 rounded-xl transition-all ${
                  step === s.num
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : step > s.num
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                <span className="block text-[9px] xs:text-[10px] sm:text-[11px] uppercase tracking-wider truncate">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Wizard Form Container */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
          {/* STEP 1: COMPANY DETAILS */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-emerald-600" />
                  Company & Administrator Information
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter your business identity and service manager login credentials.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Company Name *
                  </label>
                  <input
                    id="onboarding-company-name"
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Apex Climate & Solar Services"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Service Manager Name *
                  </label>
                  <input
                    id="onboarding-manager-name"
                    type="text"
                    required
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    placeholder="e.g. Vikram Sharma"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Business Email *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      id="onboarding-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@apexservices.com"
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Direct Contact Phone *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      id="onboarding-phone"
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      id="onboarding-password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      id="onboarding-confirm-password"
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Registered Office Address (Optional)
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Suite 501, Titanium Square, SG Highway"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: WHERE DO YOU PROVIDE SERVICE? */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                  Where do you provide your services?
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tell Servora where your field team operates so customers discover the right services in their area.
                </p>
              </div>

              <div className="space-y-4">
                {serviceAreas.map((area, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        Operational Area #{idx + 1}
                      </span>
                      {serviceAreas.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeAreaRow(idx)}
                          className="text-rose-600 hover:text-rose-700 text-xs font-bold flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                          City *
                        </label>
                        <input
                          id={`onboarding-city-${idx}`}
                          type="text"
                          required
                          value={area.city}
                          onChange={(e) => {
                            const val = e.target.value;
                            setServiceAreas((prev) => {
                              const copy = [...prev];
                              copy[idx].city = val;
                              return copy;
                            });
                          }}
                          placeholder="e.g. Rajkot"
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                          State
                        </label>
                        <input
                          id={`onboarding-state-${idx}`}
                          type="text"
                          value={area.state}
                          onChange={(e) => {
                            const val = e.target.value;
                            setServiceAreas((prev) => {
                              const copy = [...prev];
                              copy[idx].state = val;
                              return copy;
                            });
                          }}
                          placeholder="e.g. Gujarat"
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                          Service Radius (km)
                        </label>
                        <input
                          id={`onboarding-radius-${idx}`}
                          type="text"
                          inputMode="numeric"
                          value={radiusInputs[idx] !== undefined ? radiusInputs[idx] : String(area.radius ?? 20)}
                          onChange={(e) => {
                            const raw = e.target.value;
                            setRadiusInputs((prev) => ({ ...prev, [idx]: raw }));
                            const val = Number(raw.trim());
                            if (!isNaN(val) && val > 0) {
                              setServiceAreas((prev) => {
                                const copy = [...prev];
                                copy[idx].radius = val;
                                return copy;
                              });
                            }
                          }}
                          onBlur={() => {
                            const raw = radiusInputs[idx];
                            if (raw !== undefined) {
                              const val = Number(raw.trim());
                              if (isNaN(val) || val <= 0) {
                                setRadiusInputs((prev) => ({ ...prev, [idx]: '20' }));
                                setServiceAreas((prev) => {
                                  const copy = [...prev];
                                  copy[idx].radius = 20;
                                  return copy;
                                });
                              }
                            }
                          }}
                          placeholder="e.g. 20"
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white font-medium"
                        />
                      </div>
                    </div>

                    {/* Localities / Areas Chips */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Covered Localities / Neighborhoods
                      </label>
                      <div className="flex gap-2 mb-2">
                        <input
                          id={`onboarding-locality-input-${idx}`}
                          type="text"
                          value={tempAreaInput[idx] || ''}
                          onChange={(e) => setTempAreaInput((prev) => ({ ...prev, [idx]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addAreaChip(idx);
                            }
                          }}
                          placeholder="e.g. Kalawad Road (Press Enter)"
                          className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500"
                        />
                        <button
                          id={`onboarding-add-locality-btn-${idx}`}
                          type="button"
                          onClick={() => addAreaChip(idx)}
                          className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl"
                        >
                          Add
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {area.areas.map((a, cIdx) => (
                          <span
                            key={cIdx}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-100/70 text-emerald-800 text-[11px] font-semibold"
                          >
                            {a}
                            <button
                              type="button"
                              onClick={() => removeAreaChip(idx, cIdx)}
                              className="text-emerald-700 hover:text-emerald-900"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Pincodes */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Covered Pincodes
                      </label>
                      <div className="flex gap-2 mb-2">
                        <input
                          id={`onboarding-pincode-input-${idx}`}
                          type="text"
                          value={tempPincodeInput[idx] || ''}
                          onChange={(e) => setTempPincodeInput((prev) => ({ ...prev, [idx]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addPincodeChip(idx);
                            }
                          }}
                          placeholder="e.g. 360005 (Press Enter)"
                          className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500"
                        />
                        <button
                          id={`onboarding-add-pincode-btn-${idx}`}
                          type="button"
                          onClick={() => addPincodeChip(idx)}
                          className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl"
                        >
                          Add
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {area.pincodes.map((pin, pIdx) => (
                          <span
                            key={pIdx}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-blue-100/70 text-blue-800 text-[11px] font-semibold"
                          >
                            {pin}
                            <button
                              type="button"
                              onClick={() => removePincodeChip(idx, pIdx)}
                              className="text-blue-700 hover:text-blue-900"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addNewAreaRow}
                  className="w-full py-2.5 px-4 rounded-xl border border-dashed border-emerald-400 text-emerald-700 hover:bg-emerald-50 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <Plus className="w-4 h-4" /> + Add Another Service Area
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: WHAT SERVICES DO YOU PROVIDE? */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-emerald-600" />
                  What services does your company provide?
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select all the domain verticals your certified technicians are equipped to service.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {AVAILABLE_SERVICES.map((srv) => {
                  const Icon = srv.icon;
                  const isSelected = selectedGlobalServices.includes(srv.type);
                  return (
                    <div
                      key={srv.type}
                      id={`service-card-${srv.type}`}
                      onClick={() => {
                        setSelectedGlobalServices((prev) =>
                          isSelected ? prev.filter((s) => s !== srv.type) : [...prev, srv.type]
                        );
                      }}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs sm:text-sm font-bold text-slate-900">{srv.name}</h3>
                          {isSelected && <Check className="w-4 h-4 text-emerald-600" />}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{srv.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: SERVICE + LOCATION CONFIGURATION */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  Configure Services per Location
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Companies can offer different services in different cities. Toggle the services active in each market.
                </p>
              </div>

              <div className="space-y-4">
                {serviceAreas.map((area, aIdx) => (
                  <div key={aIdx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-slate-900">
                        {area.city || `Area #${aIdx + 1}`} ({area.state})
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {selectedGlobalServices.map((srvType) => {
                        const isEnabled = area.services.includes(srvType);
                        const meta = AVAILABLE_SERVICES.find((s) => s.type === srvType);
                        return (
                          <button
                            type="button"
                            key={srvType}
                            id={`service-toggle-${aIdx}-${srvType}`}
                            onClick={() => {
                              setServiceAreas((prev) => {
                                const copy = [...prev];
                                if (isEnabled) {
                                  copy[aIdx].services = copy[aIdx].services.filter((s) => s !== srvType);
                                } else {
                                  copy[aIdx].services.push(srvType);
                                }
                                return copy;
                              });
                            }}
                            className={`p-2.5 rounded-xl border text-xs font-bold text-left flex items-center justify-between transition-all ${
                              isEnabled
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <span className="truncate">{meta?.name || srvType}</span>
                            {isEnabled && <Check className="w-3.5 h-3.5 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: REVIEW */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  Review & Confirm Company Setup
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verify your company information and coverage details before launching your Servora operations workspace.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 text-xs">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-slate-200/60 pb-2.5 gap-1">
                  <span className="text-slate-500 font-semibold shrink-0">Company Name</span>
                  <span className="font-bold text-slate-900 break-words min-w-0 sm:text-right">{companyName}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-slate-200/60 pb-2.5 gap-1">
                  <span className="text-slate-500 font-semibold shrink-0">Service Manager</span>
                  <span className="font-bold text-slate-900 break-words min-w-0 sm:text-right">{managerName} ({email})</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-slate-200/60 pb-2.5 gap-1">
                  <span className="text-slate-500 font-semibold shrink-0">Direct Phone</span>
                  <span className="font-bold text-slate-900 break-words min-w-0 sm:text-right">{phone}</span>
                </div>

                <div className="pt-1">
                  <span className="text-slate-500 font-bold block mb-2 uppercase text-[10px] tracking-wider">
                    Configured Service Coverage
                  </span>
                  <div className="space-y-2">
                    {serviceAreas.map((sa, idx) => (
                      <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-1 flex-wrap">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="break-words">{sa.city}</span>
                          {sa.state && <span className="text-slate-400 font-normal">({sa.state})</span>}
                        </div>
                        {sa.areas.length > 0 && (
                          <div className="text-[11px] text-slate-600 mb-1 break-words">
                            <span className="font-semibold text-slate-700">Areas: </span>
                            {sa.areas.join(', ')}
                          </div>
                        )}
                        {sa.pincodes.length > 0 && (
                          <div className="text-[11px] text-slate-600 mb-1 break-words">
                            <span className="font-semibold text-slate-700">Pincodes: </span>
                            {sa.pincodes.join(', ')}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {sa.services.map((srv) => (
                            <span
                              key={srv}
                              className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200"
                            >
                              {srv}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-100">
            {step > 1 ? (
              <button
                id="onboarding-back-btn"
                type="button"
                onClick={() => {
                  setError(null);
                  setStep((s) => s - 1);
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            ) : (
              <Link
                to="/login"
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 text-center sm:text-left py-2"
              >
                Already registered? Sign in
              </Link>
            )}

            {step < 5 ? (
              <button
                id="onboarding-continue-btn"
                type="button"
                onClick={handleNext}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg transition-all"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                id="onboarding-launch-btn"
                type="button"
                disabled={isLoading}
                onClick={handleCreateCompany}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                    <span>Creating Workspace...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Launch Company Operations</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
