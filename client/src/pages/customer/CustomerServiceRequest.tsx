import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { SERVICE_CATALOG_MAP } from '../../config/serviceCatalog';
import { CustomerProblemCard, ServiceType, AvailableServiceItem } from '../../types';
import { CustomerLocation, getCustomerSavedLocation, saveCustomerLocation } from '../../utils/customerLocation';
import { reverseGeocodeCoords, geocodeAddressOrCity, acquireLiveLocation } from '../../utils/locationSearch';
import { LocationAutocompleteInput } from '../../components/common/LocationAutocompleteInput';
import { LocationHierarchySelector } from '../../components/common/LocationHierarchySelector';
import {
  Sun,
  Wind,
  Zap,
  Droplet,
  Wrench,
  Camera,
  UploadCloud,
  X,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  HelpCircle,
  MapPin,
  FileText,
  AlertCircle,
  Compass,
  Check,
  Loader2,
} from 'lucide-react';

export const CustomerServiceRequest: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  // Step state:
  // 1: Location Check ("Where do you need service?")
  // 2: Available Services ("What service do you need?")
  // 3: Problem Selection ("What seems to be the problem?")
  // 4: Complaint & Triage ("Tell us what happened")
  // 5: Contact & Submit ("Schedule Visit")
  const [step, setStep] = useState<number>(1);

  // Step 1: Location Verification State (Strictly null/empty if fresh customer)
  const initialService = (searchParams.get('service') as ServiceType) || '';
  const savedLoc = getCustomerSavedLocation(user?.id);
  const initialCity = searchParams.get('city') || savedLoc?.city || '';
  const initialArea = searchParams.get('area') || savedLoc?.area || '';
  const initialPincode = searchParams.get('pincode') || savedLoc?.pincode || '';
  const rawLat = searchParams.get('lat');
  const rawLng = searchParams.get('lng');
  const initialLat = rawLat !== null && !isNaN(Number(rawLat)) ? Number(rawLat) : savedLoc?.latitude;
  const initialLng = rawLng !== null && !isNaN(Number(rawLng)) ? Number(rawLng) : savedLoc?.longitude;
  const initialAddress = searchParams.get('address') || savedLoc?.formattedAddress || '';

  const [city, setCity] = useState<string>(initialCity);
  const [area, setArea] = useState<string>(initialArea);
  const [pincode, setPincode] = useState<string>(initialPincode);
  const [lat, setLat] = useState<number | undefined>(initialLat);
  const [lng, setLng] = useState<number | undefined>(initialLng);
  const [address, setAddress] = useState<string>(initialAddress);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState<boolean>(false);
  const [isLocationAvailable, setIsLocationAvailable] = useState<boolean>(false);
  const [availableServices, setAvailableServices] = useState<AvailableServiceItem[]>([]);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Step 2 & 3: Service & Problem Selection State
  const [serviceType, setServiceType] = useState<ServiceType | ''>(initialService);
  const [selectedProblem, setSelectedProblem] = useState<CustomerProblemCard | null>(null);

  // Problem Selection
  const catalog = SERVICE_CATALOG_MAP[serviceType as ServiceType] || SERVICE_CATALOG_MAP.SOLAR;

  // Step 4: Complaint & Interactive AI Triage
  const [complaint, setComplaint] = useState<string>('');
  const [isAnalyzingTriage, setIsAnalyzingTriage] = useState<boolean>(false);
  const [triageAnswers, setTriageAnswers] = useState<Record<string, string>>({});
  const [triageSummary, setTriageSummary] = useState<any>(null);

  // Step 5: Photo Evidence
  const [photos, setPhotos] = useState<string[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Customer Contact Details
  const [customerName, setCustomerName] = useState<string>(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState<string>(user?.phone || '');
  const [preferredDate, setPreferredDate] = useState<string>('');
  const [preferredSlot, setPreferredSlot] = useState<string>('MORNING');

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Auto-request live location when starting the service request flow if coordinates not present
  useEffect(() => {
    let isMounted = true;
    if (lat === undefined || lng === undefined) {
      setIsLocating(true);
      acquireLiveLocation(8000)
        .then((result) => {
          if (!isMounted || !result) return;
          const { suggestion, latitude, longitude } = result;
          setLat(latitude);
          setLng(longitude);
          if (suggestion.city && (!city || city === 'Current Location')) {
            setCity(suggestion.city);
            if (suggestion.area) setArea(suggestion.area);
            if (suggestion.pincode) setPincode(suggestion.pincode);
            if (suggestion.formattedAddress) setAddress(suggestion.formattedAddress);
            checkServiceAvailability(suggestion.city, suggestion.pincode || '', latitude, longitude);
          }
        })
        .catch((e) => {
          console.warn('Auto live location detection failed on mount:', e);
        })
        .finally(() => {
          if (isMounted) setIsLocating(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, []);

  const handleUseLiveLocation = async () => {
    setIsLocating(true);
    setLocationError(null);
    try {
      const result = await acquireLiveLocation(10000);
      if (result) {
        const { suggestion, latitude, longitude } = result;
        setLat(latitude);
        setLng(longitude);
        setCity(suggestion.city);
        if (suggestion.area) setArea(suggestion.area);
        if (suggestion.pincode) setPincode(suggestion.pincode);
        if (suggestion.formattedAddress) setAddress(suggestion.formattedAddress);
        await checkServiceAvailability(suggestion.city, suggestion.pincode || '', latitude, longitude);
      } else {
        setLocationError('Unable to detect live location. Please select your city manually.');
      }
    } catch (err: any) {
      console.warn('Live location error:', err);
      setLocationError('Failed to acquire live coordinates.');
    } finally {
      setIsLocating(false);
    }
  };

  // Structured location handler
  const handleStructuredLocationSelect = (selectedLoc: CustomerLocation) => {
    setCity(selectedLoc.city);
    setArea(selectedLoc.area || '');
    setPincode(selectedLoc.pincode || '');
    setLat(selectedLoc.latitude);
    setLng(selectedLoc.longitude);
    if (selectedLoc.area || selectedLoc.formattedAddress) {
      setAddress((prev) => prev ? prev : (selectedLoc.formattedAddress || selectedLoc.area || ''));
    }
    setServiceType('');
    setSelectedProblem(null);
    setComplaint('');
    setTriageAnswers({});
    setTriageSummary(null);
    setPhotos([]);
    setAvailableServices([]);

    saveCustomerLocation(selectedLoc, user?.id);
    checkServiceAvailability(selectedLoc.city, selectedLoc.pincode || '', selectedLoc.latitude, selectedLoc.longitude);
  };

  // Location Change Handler (Rule 8 & 9: Clear downstream state when location changes)
  // Location Change Handler (Rule 8 & 9: Clear downstream state when location changes)
  const handleLocationChange = (newCity: string, newPincode: string, newLat?: number, newLng?: number) => {
    setCity(newCity);
    setPincode(newPincode);
    setLat(newLat);
    setLng(newLng);
    setServiceType('');
    setSelectedProblem(null);
    setComplaint('');
    setTriageAnswers({});
    setTriageSummary(null);
    setPhotos([]);
    setAvailableServices([]);

    if (newCity && newCity.trim()) {
      saveCustomerLocation(
        {
          city: newCity.trim(),
          pincode: newPincode?.trim() || undefined,
          latitude: newLat,
          longitude: newLng,
        },
        user?.id
      );
      checkServiceAvailability(newCity, newPincode, newLat, newLng);
    } else {
      setIsLocationAvailable(false);
    }
  };

  // Query service availability whenever city or pincode changes
  const checkServiceAvailability = async (
    checkCity: string,
    checkPincode: string,
    checkLat?: number,
    checkLng?: number
  ) => {
    if (!checkCity || !checkCity.trim()) {
      setIsLocationAvailable(false);
      setAvailableServices([]);
      return;
    }
    setIsCheckingAvailability(true);
    setLocationError(null);

    try {
      const res = await apiClient.post('/customer-portal/services/available', {
        city: checkCity.trim(),
        pincode: checkPincode ? checkPincode.trim() : undefined,
        latitude: checkLat ?? lat,
        longitude: checkLng ?? lng,
        query: checkCity.trim(),
      });

      if (res.data.success) {
        const isCovered = Boolean(res.data.data.coverageAvailable);
        setIsLocationAvailable(isCovered);
        const services: AvailableServiceItem[] = res.data.data.services || [];
        setAvailableServices(services);

        const resolvedLat = res.data.data.latitude;
        const resolvedLon = res.data.data.longitude;
        if (typeof resolvedLat === 'number' && typeof resolvedLon === 'number') {
          if (lat === undefined || lng === undefined) {
            setLat(resolvedLat);
            setLng(resolvedLon);
          }
        }

        if (!isCovered) {
          setLocationError(res.data.data.message || `Servora services are not currently available in ${checkCity}.`);
        } else {
          // If current serviceType is not available in this location, switch to first available
          if (services.length > 0 && (!serviceType || !services.some((s) => s.serviceType === serviceType))) {
            setServiceType(services[0].serviceType);
            setSelectedProblem(null);
          }
        }
      }
    } catch (err: any) {
      console.error('Availability check failed:', err);
      setLocationError(err.response?.data?.error?.message || 'Unable to verify location coverage. Please check your network.');
      setIsLocationAvailable(false);
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  // Run availability check on initial mount only if city is already explicitly known
  useEffect(() => {
    if (city && city.trim()) {
      checkServiceAvailability(city, pincode, lat, lng);
    }
  }, []);

  // Browser Geolocation with real reverse geocoding (ZERO fallback to Ahmedabad)
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser. Please enter your city manually.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const latitude = pos.coords.latitude;
        const longitude = pos.coords.longitude;

        try {
          const geo = await reverseGeocodeCoords(latitude, longitude);

          handleStructuredLocationSelect({
            city: geo.city,
            area: geo.area,
            state: geo.state,
            country: geo.country || 'India',
            pincode: geo.pincode,
            latitude,
            longitude,
            formattedAddress: geo.formattedAddress,
          });
        } catch {
          // Even if reverse geocoding fails, NEVER drop real GPS coordinates
          handleStructuredLocationSelect({
            city: 'Current Location',
            latitude,
            longitude,
            formattedAddress: `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`,
          });
        } finally {
          setIsLocating(false);
        }
      },
      (_err) => {
        setIsLocating(false);
        alert('Location permission denied. Please enter your city or area manually.');
      },
      { timeout: 12000, enableHighAccuracy: true, maximumAge: 0 }
    );
  };

  // Handle Photo Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size exceeds 5MB limit. Please upload a smaller photo.');
      return;
    }

    const formData = new FormData();
    formData.append('photo', file);

    setIsUploadingPhoto(true);
    setUploadError(null);

    try {
      const res = await apiClient.post('/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success && res.data.data.url) {
        setPhotos((prev) => [...prev, res.data.data.url]);
      }
    } catch (err: any) {
      console.error('Upload failed:', err);
      setUploadError('Failed to upload image. Please try again.');
    } finally {
      setIsUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit Final Service Request
  const handleSubmitRequest = async () => {
    if (isSubmitting) return; // Prevent duplicate submissions
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      let resolvedLat = lat;
      let resolvedLng = lng;
      if (resolvedLat === undefined || resolvedLng === undefined) {
        const query = [address, area, city, pincode].filter(Boolean).join(', ') || city;
        if (query) {
          try {
            const geoRes = await geocodeAddressOrCity(query, city);
            if (geoRes) {
              resolvedLat = geoRes.latitude;
              resolvedLng = geoRes.longitude;
              setLat(resolvedLat);
              setLng(resolvedLng);
            }
          } catch (e) {
            console.warn('Geocoding before submit failed:', e);
          }
        }
      }

      const hasCoords = typeof resolvedLat === 'number' && typeof resolvedLng === 'number' && !isNaN(resolvedLat) && !isNaN(resolvedLng);
      const cleanAddress = address.trim() || 'Service Site Address';
      const cleanCity = city.trim();
      const cleanPincode = pincode.trim();
      const payload = {
        serviceType,
        problemCode: selectedProblem?.code || 'OTHER',
        problemCategory: selectedProblem?.title || 'General Service',
        complaint: complaint.trim(),
        photos,
        location: {
          address: cleanAddress,
          city: cleanCity,
          area: area?.trim() || undefined,
          pincode: cleanPincode,
          latitude: resolvedLat,
          longitude: resolvedLng,
          coordinates: hasCoords ? { latitude: resolvedLat, longitude: resolvedLng } : undefined,
          formattedAddress: cleanAddress !== 'Service Site Address'
            ? `${cleanAddress}, ${cleanCity}${cleanPincode ? ' ' + cleanPincode : ''}`
            : `${cleanCity}${cleanPincode ? ' ' + cleanPincode : ''}`,
        },
        latitude: resolvedLat,
        longitude: resolvedLng,
        customerDetails: {
          name: customerName.trim() || user?.name || 'Customer',
          phone: customerPhone.trim() || user?.phone || '+91 98765 00000',
        },
        isUnknownTriage: selectedProblem?.code === 'NOT_SURE_TRIAGE',
        triageAnswers,
      };

      const res = await apiClient.post('/customer-portal/requests', payload);

      if (res.data.success && res.data.data._id) {
        navigate(`/customer/requests/${res.data.data._id}`, { replace: true });
      } else {
        setSubmitError(res.data.error?.message || 'Failed to create request. Please try again.');
        setIsSubmitting(false);
      }
    } catch (err: any) {
      console.error('Submission failed:', err);
      setSubmitError(err.response?.data?.error?.message || 'Network error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
      {/* Back button & Step Tracker */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            if (step > 1) setStep(step - 1);
            else navigate('/customer');
          }}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{step === 1 ? 'Cancel' : 'Previous Step'}</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-indigo-600">Step {step} of 6</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5, 6].map((s) => (
              <span
                key={s}
                className={`w-3.5 h-1.5 rounded-full transition-all ${
                  s === step ? 'bg-indigo-600 w-6' : s < step ? 'bg-indigo-300' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STEP 1: LOCATION FIRST — WHERE DO YOU NEED SERVICE?                       */}
      {/* ========================================================================= */}
      {step === 1 && (
        <div className="space-y-6 animate-fadeIn">
          <div className="text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold mb-2">
              <MapPin className="w-3.5 h-3.5" />
              <span>Location-Based Service Discovery</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Where do you need service?
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Servora checks certified operations coverage at your location before displaying available services.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Select City & Service Area
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                {lat !== undefined && lng !== undefined && (
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-mono font-bold flex items-center gap-1.5 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live GPS: {lat.toFixed(4)}°N, {lng.toFixed(4)}°E
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleUseLiveLocation}
                  disabled={isLocating}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200 hover:border-emerald-200 text-slate-700 text-xs font-bold transition-all disabled:opacity-50"
                  title="Detect coordinates using GPS or Google Maps Geolocation"
                >
                  {isLocating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                  ) : (
                    <Compass className="w-3.5 h-3.5 text-emerald-600" />
                  )}
                  <span>{isLocating ? 'Detecting...' : '📍 Use Live GPS'}</span>
                </button>
              </div>
            </div>

            {/* Hierarchical Verified Location Selector (City -> Area / Locality) */}
            <LocationHierarchySelector
              currentLocation={city ? { city, area, pincode, latitude: lat, longitude: lng } : null}
              onLocationSelected={handleStructuredLocationSelect}
              onClearLocation={() => handleLocationChange('', '')}
            />

            {/* Quick Presets for Convenient Testing & One-Click Selection */}
            <div className="flex items-center gap-1.5 flex-wrap text-xs pt-1">
              <span className="text-slate-400 font-medium text-[11px]">Quick Selection:</span>
              {[
                { city: 'Mundra', lat: 22.8393, lon: 69.7249, pin: '370421' },
                { city: 'Mandvi', lat: 22.8330, lon: 69.3550, pin: '370465' },
                { city: 'Koday', lat: 22.8680, lon: 69.5250, pin: '370460' },
                { city: 'Bhuj', lat: 23.2420, lon: 69.6669, pin: '370001' },
                { city: 'Rajkot', lat: 22.3039, lon: 70.8022, pin: '360001' },
              ].map((loc) => (
                <button
                  key={loc.city}
                  type="button"
                  onClick={() =>
                    handleStructuredLocationSelect({
                      city: loc.city,
                      state: 'Gujarat',
                      country: 'India',
                      pincode: loc.pin,
                      latitude: loc.lat,
                      longitude: loc.lon,
                      formattedAddress: `${loc.city}, Gujarat ${loc.pin}, India`,
                    })
                  }
                  className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg font-semibold text-slate-700 text-xs transition-colors"
                >
                  📍 {loc.city}
                </button>
              ))}
            </div>

            {/* Street / Building Address */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Complete Street Address / Building / Flat <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Flat 402, Sunset Heights, Main Road"
                className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                required
              />
            </div>

            {/* Real-time Coverage Status Feedback */}
            <div className="pt-2">
              {!city || !city.trim() ? (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                      Select your location
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Search and select your city or locality above to verify certified technician coverage.
                    </p>
                  </div>
                </div>
              ) : isCheckingAvailability ? (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3 text-slate-600 text-xs animate-pulse">
                  <div className="w-4 h-4 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
                  <span>Checking service coverage in {city}...</span>
                </div>
              ) : isLocationAvailable ? (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-emerald-950">
                      Service Available in {city} {pincode ? `(${pincode})` : ''}
                    </h4>
                    <p className="text-xs text-emerald-800 mt-0.5">
                      {availableServices.length} certified service vertical{availableServices.length > 1 ? 's' : ''} active at this location ({availableServices.map((s) => s.displayName).join(', ')}).
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-amber-950">
                      Servora services are not currently available in your area.
                    </h4>
                    <p className="text-xs text-amber-800 mt-0.5">
                      {locationError || `We do not have active field service coverage deployed in ${city}.`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action to proceed to Step 2 */}
          <div className="flex justify-end">
            <button
              onClick={() => {
                if (!address.trim()) {
                  alert('Please enter your street address or landmark to proceed.');
                  return;
                }
                setStep(2);
              }}
              disabled={!isLocationAvailable || isCheckingAvailability || !city.trim()}
              className="w-full sm:w-auto px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <span>View Available Services</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: AVAILABLE SERVICES AT THIS LOCATION                               */}
      {/* ========================================================================= */}
      {step === 2 && (
        <div className="space-y-6 animate-fadeIn">
          {/* Confirmed Location Badge */}
          <div className="bg-slate-100/80 rounded-2xl p-3 px-4 flex items-center justify-between border border-slate-200 text-xs">
            <div className="flex items-center gap-2 text-slate-700 font-medium truncate">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="truncate">
                {address ? `${address}, ` : ''}{area ? `${area}, ` : ''}{city} {pincode ? `(${pincode})` : ''}
              </span>
            </div>
            <button
              onClick={() => setStep(1)}
              className="text-emerald-700 font-bold hover:text-emerald-800 transition-colors shrink-0 ml-3"
            >
              Change Location
            </button>
          </div>

          <div className="text-center sm:text-left">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              What service do you need?
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Select an available service covered at your location.
            </p>
          </div>

          {/* Available Service Cards (ONLY Services Configured for this Location) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {availableServices.map((srv) => {
              const isSelected = serviceType === srv.serviceType;
              const getServiceTheme = (type: string) => {
                switch (type) {
                  case 'SOLAR':
                    return {
                      icon: <Sun className="w-6 h-6" />,
                      iconBg: 'bg-amber-100 text-amber-600',
                      selectedRing: 'border-amber-500 bg-amber-50/40 ring-amber-500/20',
                      selectedRadio: 'bg-amber-500 border-amber-500',
                    };
                  case 'AC':
                    return {
                      icon: <Wind className="w-6 h-6" />,
                      iconBg: 'bg-cyan-100 text-cyan-600',
                      selectedRing: 'border-cyan-500 bg-cyan-50/40 ring-cyan-500/20',
                      selectedRadio: 'bg-cyan-500 border-cyan-500',
                    };
                  case 'ELECTRICAL':
                    return {
                      icon: <Zap className="w-6 h-6" />,
                      iconBg: 'bg-yellow-100 text-yellow-600',
                      selectedRing: 'border-yellow-500 bg-yellow-50/40 ring-yellow-500/20',
                      selectedRadio: 'bg-yellow-500 border-yellow-500',
                    };
                  case 'PLUMBING':
                    return {
                      icon: <Droplet className="w-6 h-6" />,
                      iconBg: 'bg-blue-100 text-blue-600',
                      selectedRing: 'border-blue-500 bg-blue-50/40 ring-blue-500/20',
                      selectedRadio: 'bg-blue-500 border-blue-500',
                    };
                  default:
                    return {
                      icon: <Wrench className="w-6 h-6" />,
                      iconBg: 'bg-indigo-100 text-indigo-600',
                      selectedRing: 'border-indigo-500 bg-indigo-50/40 ring-indigo-500/20',
                      selectedRadio: 'bg-indigo-500 border-indigo-500',
                    };
                }
              };

              const theme = getServiceTheme(srv.serviceType);

              return (
                <div
                  key={srv.serviceType}
                  onClick={() => {
                    setServiceType(srv.serviceType);
                    setSelectedProblem(null);
                  }}
                  className={`group relative rounded-3xl p-6 border transition-all cursor-pointer flex flex-col justify-between overflow-hidden ${
                    isSelected
                      ? `${theme.selectedRing} shadow-sm ring-2`
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${theme.iconBg}`}>
                      {theme.icon}
                    </div>

                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                        isSelected
                          ? `${theme.selectedRadio} text-white`
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>

                  <div className="mt-4">
                    <h3 className="font-extrabold text-slate-900 text-lg">
                      {srv.displayName}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1 line-clamp-2">
                      {srv.shortDescription}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setStep(3)}
              disabled={!serviceType}
              className="w-full sm:w-auto px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <span>Next: Select Problem</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: VISUAL PROBLEM CATALOG CARDS                                      */}
      {/* ========================================================================= */}
      {step === 3 && (
        <div className="space-y-6 animate-fadeIn">
          {/* Confirmed Location & Service Pill */}
          <div className="bg-slate-100/80 rounded-2xl p-3 px-4 flex items-center justify-between border border-slate-200 text-xs">
            <div className="flex items-center gap-2 text-slate-700 font-medium truncate">
              <span className="font-bold text-indigo-700">
                {catalog.title}
              </span>
              <span className="text-slate-400">|</span>
              <span className="truncate">{city}</span>
            </div>
            <button
              onClick={() => setStep(2)}
              className="text-indigo-600 font-bold hover:text-indigo-800 transition-colors shrink-0 ml-3"
            >
              Change Service
            </button>
          </div>

          <div className="text-center sm:text-left">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              What problem are you facing?
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Select the option that best describes what is happening with your {catalog.title.toLowerCase()}.
            </p>
          </div>

          {/* Visual Problem Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            {catalog.problemCards.map((p) => {
              const isSelected = selectedProblem?.code === p.code;
              const isUnsure = p.code === 'NOT_SURE_TRIAGE';

              return (
                <div
                  key={p.code}
                  onClick={() => setSelectedProblem(p)}
                  className={`group relative rounded-2xl p-4 border transition-all cursor-pointer flex items-start gap-3.5 ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/40 shadow-sm ring-2 ring-indigo-600/20'
                      : isUnsure
                      ? 'border-dashed border-indigo-300 bg-indigo-50/20 hover:border-indigo-400'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200/80 relative">
                    <img
                      src={p.image}
                      alt={p.alt}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        (e.target as any).style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400 -z-10">
                      <HelpCircle className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 flex-wrap">
                      <h4 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                        {p.title}
                      </h4>
                      <div className="flex items-center gap-1 shrink-0">
                        {p.photoRequirement === 'REQUIRED' && (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                            Photo required
                          </span>
                        )}
                        {p.photoRequirement === 'RECOMMENDED' && (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                            Photo recommended
                          </span>
                        )}
                        {isUnsure && (
                          <span className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded-full">
                            Guided
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setStep(4)}
              disabled={!selectedProblem}
              className="w-full sm:w-auto px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <span>Next: Describe Problem</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 4: COMPLAINT & ADAPTIVE TRIAGE QUESTIONS                             */}
      {/* ========================================================================= */}
      {step === 4 && (
        <div className="space-y-6 animate-fadeIn">
          <div>
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
              {selectedProblem?.title}
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
              Tell us what happened
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Explain in your own words. English, Hindi, Gujarati, or Hinglish accepted.
            </p>
          </div>

          {/* Natural Language Input */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Describe the problem <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                value={complaint}
                onChange={(e) => setComplaint(e.target.value)}
                placeholder={
                  serviceType === 'SOLAR'
                    ? 'e.g. Inverter display is blank, red error light is flashing, or generation stopped suddenly'
                    : 'e.g. AC is running but not cooling, or water is leaking from the indoor unit'
                }
                className="w-full px-4 py-3 text-sm border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-normal"
                required
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Tip: Vernacular phrases like "invrtr not wrkng" or "ac cool nai karto" are automatically understood.
              </p>
            </div>

            {/* If "I'm Not Sure" was selected, show adaptive triage questions */}
            {selectedProblem?.code === 'NOT_SURE_TRIAGE' && selectedProblem.triageQuestions && (
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <div className="flex items-center gap-2 text-indigo-700">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Guided Diagnostic Questions</span>
                </div>

                <div className="space-y-3.5">
                  {selectedProblem.triageQuestions.map((q) => (
                    <div key={q.id} className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2">
                      <p className="text-xs font-semibold text-slate-800">{q.question}</p>
                      <div className="flex flex-wrap gap-2">
                        {q.options.map((opt) => (
                          <button
                            type="button"
                            key={opt}
                            onClick={() => setTriageAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                              triageAnswers[q.id] === opt
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-300'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setStep(5)}
              disabled={!complaint.trim()}
              className="w-full sm:w-auto px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <span>Next: Add Photos</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 5: PHOTO EVIDENCE UPLOAD                                             */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* STEP 5: PHOTO EVIDENCE UPLOAD                                             */}
      {/* ========================================================================= */}
      {step === 5 && (() => {
        const photoReq = selectedProblem?.photoRequirement || 'OPTIONAL';

        if (photoReq === 'NOT_USEFUL') {
          return (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Photo Evidence
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Evidence verification for {selectedProblem?.title || 'your service request'}.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-8 text-center space-y-4">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900">
                    No Photograph Required
                  </h3>
                  <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                    For <strong>{selectedProblem?.title}</strong>, a photograph is not needed. Field issues like sounds, vibrations, or odors are directly verified on site by the certified technician using diagnostic instruments.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setStep(6)}
                    className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-2xl shadow-sm transition-all flex items-center gap-2 mx-auto active:scale-95"
                  >
                    <span>Continue to Review AI Understanding</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        }

        return (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Add Photo Evidence
                </h1>
                {photoReq === 'REQUIRED' && (
                  <span className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                    Photo required
                  </span>
                )}
                {photoReq === 'RECOMMENDED' && (
                  <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                    Photo recommended
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Photos help the service team bring the correct testing equipment and spare parts.
              </p>
            </div>

            {/* Requirement Banners */}
            {photoReq === 'REQUIRED' ? (
              <div className="bg-rose-50/80 border border-rose-200 rounded-3xl p-4 sm:p-5 flex items-start gap-3.5">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="text-xs text-rose-950 space-y-1">
                  <p className="font-bold text-rose-900">Photo Required for Submission:</p>
                  <p className="text-rose-900 leading-relaxed">
                    For <strong>{selectedProblem?.title}</strong>, at least one photo is required to verify the equipment model and component state prior to technician dispatch. Submission is blocked until a photo is uploaded.
                  </p>
                </div>
              </div>
            ) : photoReq === 'RECOMMENDED' ? (
              <div className="bg-amber-50/80 border border-amber-200 rounded-3xl p-4 sm:p-5 flex items-start gap-3.5">
                <Camera className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-950 space-y-1">
                  <p className="font-bold text-amber-900">Photo Strongly Recommended:</p>
                  <p className="text-amber-900 leading-relaxed">
                    A clear photo of <strong>{selectedProblem?.title}</strong> helps the technician arrive prepared with correct tools on the first visit. You may still proceed without one if you cannot take a photo now.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-indigo-50/70 border border-indigo-100 rounded-3xl p-4 sm:p-5 flex items-start gap-3.5">
                <Camera className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div className="text-xs text-indigo-950 space-y-1">
                  <p className="font-bold">Contextual Guidance:</p>
                  <p className="text-indigo-900">
                    {serviceType === 'SOLAR'
                      ? 'Take a clear photo of the inverter display, any error code, or solar panel array. Never touch or open electrical components.'
                      : 'Take a clear photo of the indoor unit display, outdoor condenser unit, or where water is leaking.'}
                  </p>
                </div>
              </div>
            )}

            {/* Upload Area */}
            <div className="bg-white rounded-3xl p-6 border-2 border-dashed border-slate-300 hover:border-indigo-400 transition-colors text-center">
              <label className="cursor-pointer flex flex-col items-center justify-center gap-2">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <span className="text-sm font-bold text-slate-800">Click to upload photo</span>
                <span className="text-xs text-slate-400">PNG, JPG up to 5MB</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={isUploadingPhoto}
                  className="hidden"
                />
              </label>

              {isUploadingPhoto && (
                <p className="text-xs text-indigo-600 font-semibold mt-3 animate-pulse">
                  Uploading photo...
                </p>
              )}

              {uploadError && (
                <p className="text-xs text-rose-600 font-semibold mt-2">{uploadError}</p>
              )}
            </div>

            {/* Uploaded Photos Preview List */}
            {photos.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Attached Photos ({photos.length})
                </h4>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {photos.map((url, idx) => (
                    <div key={idx} className="relative group rounded-2xl overflow-hidden border border-slate-200 aspect-square bg-slate-100">
                      <img src={url} alt={`Evidence ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-slate-900/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warning if photos.length === 0 and required */}
            {photoReq === 'REQUIRED' && photos.length === 0 && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Please upload at least 1 photo to continue.</span>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex justify-between items-center pt-2">
              {photoReq !== 'REQUIRED' ? (
                <button
                  type="button"
                  onClick={() => setStep(6)}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold transition-colors"
                >
                  {photoReq === 'RECOMMENDED' ? 'Continue without photo' : 'Skip photo upload'}
                </button>
              ) : (
                <div />
              )}

              <button
                onClick={() => setStep(6)}
                disabled={photoReq === 'REQUIRED' && photos.length === 0}
                className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm rounded-2xl shadow-sm transition-all flex items-center gap-2 active:scale-95"
              >
                <span>Review AI Understanding</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* STEP 6: AI UNDERSTANDING PREVIEW & FINAL SUBMISSION                       */}
      {/* ========================================================================= */}
      {step === 6 && (
        <div className="space-y-6 animate-fadeIn">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Transparent AI Understanding</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Here's how Servora understood your request
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Please review how your request will be presented to the service operations team.
            </p>
          </div>

          {/* AI Understanding Summary Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-100 text-xs">
              <div>
                <span className="font-bold text-slate-400 uppercase text-[10px]">Service Vertical</span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">
                  {serviceType === 'SOLAR' ? '☀️ Solar Energy Service' : '❄️ AC & HVAC Service'}
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-400 uppercase text-[10px]">Problem Category</span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">
                  {selectedProblem?.title}
                </p>
              </div>

              <div className="sm:col-span-2">
                <span className="font-bold text-slate-400 uppercase text-[10px]">Verified Service Location</span>
                <p className="font-semibold text-slate-800 text-xs mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>{address}, {city} {pincode ? `(${pincode})` : ''}</span>
                </p>
              </div>
            </div>

            {/* Customer Raw Message vs AI Normalized Summary */}
            <div className="space-y-3">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Your Message</span>
                <p className="text-xs text-slate-800 font-medium mt-1 italic">"{complaint}"</p>
              </div>

              <div className="bg-indigo-50/50 p-3.5 rounded-2xl border border-indigo-100/80">
                <div className="flex items-center gap-1.5 text-indigo-700">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-bold uppercase">Servora AI Operational Summary</span>
                </div>
                <p className="text-xs text-indigo-950 font-medium mt-1">
                  {serviceType === 'SOLAR'
                    ? `Solar ${selectedProblem?.title.toLowerCase() || 'system inspection'} reported. Operational priority: Medium. Physical verification required on site.`
                    : `AC ${selectedProblem?.title.toLowerCase() || 'cooling inspection'} reported. Certified technician will verify pressure and electrical readings on site.`}
                </p>
              </div>
            </div>

            {/* Customer Contact Details */}
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-500 uppercase block mb-2">
                Customer Contact Details
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Your Full Name"
                  className="px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  required
                />
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Your Phone Number"
                  className="px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  required
                />
              </div>
            </div>

            {/* Error message */}
            {submitError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}
          </div>

          {/* Submit Action */}
          <div className="flex justify-end pt-2">
            <button
              onClick={handleSubmitRequest}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Submitting Request...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit Service Request</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
