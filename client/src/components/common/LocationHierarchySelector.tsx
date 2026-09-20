import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Loader2, X, Check, Compass, Building, ChevronRight, CornerDownRight } from 'lucide-react';
import { searchLocations, fetchCityLocalities, StructuredLocationSuggestion } from '../../utils/locationSearch';
import { CustomerLocation } from '../../utils/customerLocation';

interface LocationHierarchySelectorProps {
  currentLocation?: CustomerLocation | null;
  onLocationSelected: (location: CustomerLocation) => void;
  onClearLocation?: () => void;
  className?: string;
  autoOpen?: boolean;
}

export const LocationHierarchySelector: React.FC<LocationHierarchySelectorProps> = ({
  currentLocation,
  onLocationSelected,
  onClearLocation,
  className = '',
  autoOpen = false,
}) => {
  // Stage 1: City search query & results
  const [cityQuery, setCityQuery] = useState(currentLocation?.city || '');
  const [citySuggestions, setCitySuggestions] = useState<StructuredLocationSuggestion[]>([]);
  const [isCityLoading, setIsCityLoading] = useState(false);
  const [isCityOpen, setIsCityOpen] = useState(false);

  // Selected intermediate city state
  const [selectedCity, setSelectedCity] = useState<{
    city: string;
    state?: string;
    country?: string;
    pincode?: string;
    latitude?: number;
    longitude?: number;
    formattedAddress?: string;
  } | null>(
    currentLocation?.city
      ? {
          city: currentLocation.city,
          state: currentLocation.state,
          country: currentLocation.country,
          pincode: currentLocation.pincode,
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          formattedAddress: currentLocation.formattedAddress,
        }
      : null
  );

  // Stage 2: Area / locality
  const [areaQuery, setAreaQuery] = useState(currentLocation?.area || '');
  const [areaSuggestions, setAreaSuggestions] = useState<StructuredLocationSuggestion[]>([]);
  const [verifiedCityLocalities, setVerifiedCityLocalities] = useState<StructuredLocationSuggestion[]>([]);
  const [isAreaLoading, setIsAreaLoading] = useState(false);
  const [isAreaOpen, setIsAreaOpen] = useState(false);

  // GPS locating state
  const [isLocating, setIsLocating] = useState(false);

  // Mode: 'confirmed' | 'select_city' | 'select_area'
  const [mode, setMode] = useState<'confirmed' | 'select_city' | 'select_area'>(() => {
    if (autoOpen || !currentLocation?.city) return 'select_city';
    return 'confirmed';
  });

  const containerRef = useRef<HTMLDivElement>(null);

  // Sync external currentLocation changes
  useEffect(() => {
    if (currentLocation?.city) {
      setSelectedCity({
        city: currentLocation.city,
        state: currentLocation.state,
        country: currentLocation.country,
        pincode: currentLocation.pincode,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        formattedAddress: currentLocation.formattedAddress,
      });
      setAreaQuery(currentLocation.area || '');
      setMode('confirmed');
    } else {
      setSelectedCity(null);
      setAreaQuery('');
      setCityQuery('');
      setMode('select_city');
    }
  }, [currentLocation]);

  // Click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsCityOpen(false);
        setIsAreaOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced City search
  useEffect(() => {
    if (mode !== 'select_city' || !cityQuery || cityQuery.trim().length < 2) {
      setCitySuggestions([]);
      setIsCityLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCityLoading(true);
      const results = await searchLocations(cityQuery);
      setCitySuggestions(results);
      setIsCityLoading(false);
      setIsCityOpen(results.length > 0);
    }, 250);

    return () => clearTimeout(timer);
  }, [cityQuery, mode]);

  // Load verified localities whenever selectedCity is set
  useEffect(() => {
    if (!selectedCity?.city) {
      setVerifiedCityLocalities([]);
      return;
    }

    let isMounted = true;
    async function loadLocalities() {
      if (!selectedCity) return;
      const list = await fetchCityLocalities(selectedCity.city);
      if (isMounted) {
        setVerifiedCityLocalities(list);
      }
    }
    loadLocalities();

    return () => {
      isMounted = false;
    };
  }, [selectedCity?.city]);

  // Debounced Area search within selectedCity
  useEffect(() => {
    if (mode !== 'select_area' || !selectedCity || !areaQuery || areaQuery.trim().length < 2) {
      setAreaSuggestions([]);
      setIsAreaLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsAreaLoading(true);
      const results = await searchLocations(areaQuery, selectedCity.city);
      setAreaSuggestions(results);
      setIsAreaLoading(false);
      setIsAreaOpen(results.length > 0);
    }, 250);

    return () => clearTimeout(timer);
  }, [areaQuery, selectedCity, mode]);

  // Handler: City selected
  const handleSelectCity = (item: StructuredLocationSuggestion) => {
    const cityData = {
      city: item.city || item.formattedAddress.split(',')[0].trim(),
      state: item.state,
      country: item.country || 'India',
      pincode: item.pincode,
      latitude: item.latitude,
      longitude: item.longitude,
      formattedAddress: item.formattedAddress,
    };
    setSelectedCity(cityData);
    setCityQuery(cityData.city);
    setIsCityOpen(false);
    setCitySuggestions([]);
    setAreaQuery('');

    // Transition to Area selection stage
    setMode('select_area');
  };

  // Handler: Area selected
  const handleSelectArea = (item: StructuredLocationSuggestion) => {
    if (!selectedCity) return;

    const areaName = item.area || item.formattedAddress.split(',')[0].trim();
    const finalPincode = item.pincode || selectedCity.pincode;
    const finalLat = item.latitude || selectedCity.latitude;
    const finalLon = item.longitude || selectedCity.longitude;

    const parts = [areaName, selectedCity.city, selectedCity.state, selectedCity.country].filter(Boolean);
    const formatted = `${parts.join(', ')}${finalPincode ? ` ${finalPincode}` : ''}`;

    const finalLocation: CustomerLocation = {
      city: selectedCity.city,
      area: areaName,
      state: selectedCity.state,
      country: selectedCity.country,
      pincode: finalPincode,
      latitude: finalLat,
      longitude: finalLon,
      formattedAddress: formatted,
    };

    setAreaQuery(areaName);
    setIsAreaOpen(false);
    setMode('confirmed');
    onLocationSelected(finalLocation);
  };

  // Handler: Continue with whole city (Skip area)
  const handleSkipArea = () => {
    if (!selectedCity) return;

    const parts = [selectedCity.city, selectedCity.state, selectedCity.country].filter(Boolean);
    const formatted = `${parts.join(', ')}${selectedCity.pincode ? ` ${selectedCity.pincode}` : ''}`;

    const finalLocation: CustomerLocation = {
      city: selectedCity.city,
      state: selectedCity.state,
      country: selectedCity.country,
      pincode: selectedCity.pincode,
      latitude: selectedCity.latitude,
      longitude: selectedCity.longitude,
      formattedAddress: formatted,
    };

    setMode('confirmed');
    onLocationSelected(finalLocation);
  };

  // GPS Detection
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`,
            { headers: { Accept: 'application/json' } }
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const city = addr.city || addr.town || addr.village || addr.municipality || 'Rajkot';
            const state = addr.state || 'Gujarat';
            const area = addr.suburb || addr.neighbourhood || addr.residential;
            const pincode = addr.postcode ? String(addr.postcode).trim() : undefined;

            const finalLoc: CustomerLocation = {
              city,
              area,
              state,
              country: addr.country || 'India',
              pincode,
              latitude: lat,
              longitude: lon,
              formattedAddress: data.display_name,
            };

            setSelectedCity({
              city,
              state,
              country: addr.country || 'India',
              pincode,
              latitude: lat,
              longitude: lon,
              formattedAddress: data.display_name,
            });
            setAreaQuery(area || '');
            setMode('confirmed');
            onLocationSelected(finalLoc);
          }
        } catch (err) {
          console.error('Reverse geocode failed:', err);
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        console.warn('Geolocation denied or failed:', err);
      },
      { timeout: 8000 }
    );
  };

  return (
    <div ref={containerRef} className={`w-full ${className}`}>
      {/* ========================================================================= */}
      {/* STATE A: CONFIRMED LOCATION BADGE / SUMMARY                               */}
      {/* ========================================================================= */}
      {mode === 'confirmed' && selectedCity && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 sm:p-4 flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Verified Location
                </span>
                <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded font-mono">
                  ACTIVE
                </span>
              </div>
              <p className="font-extrabold text-slate-900 text-sm truncate">
                {selectedCity.city}
                {areaQuery ? (
                  <span className="text-emerald-700 font-bold"> • {areaQuery}</span>
                ) : null}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {selectedCity.state}
                {selectedCity.pincode ? ` — Pincode: ${selectedCity.pincode}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end xs:self-center w-full xs:w-auto justify-end pt-1 xs:pt-0 border-t xs:border-t-0 border-slate-200/60">
            <button
              type="button"
              onClick={() => setMode('select_area')}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-emerald-700 hover:bg-white transition-colors border border-transparent hover:border-slate-200"
            >
              {areaQuery ? 'Change Area' : '+ Add Area'}
            </button>
            <button
              type="button"
              onClick={() => {
                setCityQuery('');
                setMode('select_city');
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
            >
              Change City
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STATE B: STEP 1 — SELECT CITY                                            */}
      {/* ========================================================================= */}
      {mode === 'select_city' && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-black">1</span>
              <span>Where do you need service? (Search City)</span>
              <span className="text-rose-500">*</span>
            </label>
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isLocating}
              className="text-[11px] font-semibold text-slate-500 hover:text-emerald-600 flex items-center gap-1 transition-colors"
            >
              <Compass className={`w-3 h-3 ${isLocating ? 'animate-spin text-emerald-600' : ''}`} />
              <span>{isLocating ? 'Locating...' : 'Use GPS'}</span>
            </button>
          </div>

          <div className="relative">
            <MapPin className="w-4 h-4 text-emerald-600 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              value={cityQuery}
              onChange={(e) => {
                setCityQuery(e.target.value);
                setIsCityOpen(true);
              }}
              onFocus={() => {
                if (citySuggestions.length > 0) setIsCityOpen(true);
              }}
              placeholder="Type city name (e.g. Mundra, Ahmedabad, Rajkot, Surat)..."
              className="w-full pl-10 pr-9 py-2.5 text-sm border border-slate-300 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white text-slate-900 font-medium shadow-2xs"
              autoFocus
            />
            {isCityLoading ? (
              <Loader2 className="w-4 h-4 text-slate-400 animate-spin absolute right-3.5 top-3 pointer-events-none" />
            ) : cityQuery ? (
              <button
                type="button"
                onClick={() => {
                  setCityQuery('');
                  setCitySuggestions([]);
                  setIsCityOpen(false);
                }}
                className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : null}

            {/* City Suggestions Dropdown */}
            {isCityOpen && citySuggestions.length > 0 && (
              <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-64 overflow-y-auto divide-y divide-slate-100">
                <div className="px-3.5 py-2 text-[10px] font-black text-slate-400 uppercase tracking-wider bg-slate-50 flex items-center justify-between">
                  <span>SELECT VERIFIED LOCATION</span>
                  <span className="text-[9px] text-slate-400 font-normal">Tap to confirm</span>
                </div>
                {citySuggestions.map((s, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => handleSelectCity(s)}
                    className="w-full px-3.5 py-3 text-left text-xs flex items-center justify-between gap-2.5 hover:bg-emerald-50/80 transition-colors group"
                  >
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                      <div className="min-w-0 flex-1">
                        <div className="font-extrabold text-slate-900 text-sm truncate">
                          {s.city || s.formattedAddress.split(',')[0]}
                        </div>
                        <div className="text-xs text-slate-500 truncate mt-0.5">
                          {s.state} {s.pincode ? `• Pincode: ${s.pincode}` : ''} • {s.country || 'India'}
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] bg-slate-100 text-slate-700 group-hover:bg-emerald-600 group-hover:text-white px-2.5 py-1 rounded-lg font-bold shrink-0 transition-colors">
                      Select
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-500 pt-1">
            <span className="text-slate-400 font-medium">Quick Select:</span>
            {['Mundra', 'Ahmedabad', 'Rajkot', 'Surat'].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setCityQuery(c);
                  searchLocations(c).then((res) => {
                    if (res.length > 0) handleSelectCity(res[0]);
                  });
                }}
                className="px-2 py-0.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 rounded-md font-semibold text-slate-700 transition-colors text-[11px]"
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STATE C: STEP 2 — SELECT AREA / LOCALITY                                  */}
      {/* ========================================================================= */}
      {mode === 'select_area' && selectedCity && (
        <div className="bg-slate-50/90 border border-emerald-200 rounded-2xl p-4 space-y-4 shadow-2xs">
          {/* Selected City summary banner */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] flex items-center justify-center font-black">✓</span>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  City Confirmed
                </span>
                <p className="font-black text-slate-900 text-sm">
                  {selectedCity.city}, {selectedCity.state} {selectedCity.pincode ? `(${selectedCity.pincode})` : ''}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setCityQuery('');
                setMode('select_city');
              }}
              className="text-xs font-bold text-emerald-700 hover:underline px-2 py-1"
            >
              Change City
            </button>
          </div>

          {/* Area / Locality Search */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-black">2</span>
                <span>Select Area / Locality in {selectedCity.city}</span>
              </label>
              <span className="text-[11px] text-slate-400 font-medium">Optional / Recommended</span>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-emerald-600 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="text"
                value={areaQuery}
                onChange={(e) => {
                  setAreaQuery(e.target.value);
                  setIsAreaOpen(true);
                }}
                onFocus={() => {
                  if (areaSuggestions.length > 0) setIsAreaOpen(true);
                }}
                placeholder={`Search area in ${selectedCity.city} (e.g. Samaghoga, Baroi, Mundra Port)...`}
                className="w-full pl-10 pr-9 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white text-slate-900 font-medium shadow-2xs"
              />
              {isAreaLoading ? (
                <Loader2 className="w-4 h-4 text-slate-400 animate-spin absolute right-3.5 top-3 pointer-events-none" />
              ) : areaQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    setAreaQuery('');
                    setAreaSuggestions([]);
                    setIsAreaOpen(false);
                  }}
                  className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : null}

              {/* Area Suggestions Dropdown */}
              {isAreaOpen && areaSuggestions.length > 0 && (
                <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto divide-y divide-slate-100">
                  <div className="px-3.5 py-2 text-[10px] font-black text-slate-400 uppercase tracking-wider bg-slate-50">
                    SUGGESTED LOCALITIES IN {selectedCity.city.toUpperCase()}
                  </div>
                  {areaSuggestions.map((s, idx) => {
                    const localityName = s.area || s.formattedAddress.split(',')[0].trim();
                    return (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => handleSelectArea(s)}
                        className="w-full px-3.5 py-2.5 text-left text-xs flex items-center justify-between gap-2.5 hover:bg-emerald-50/80 transition-colors group"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <Building className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <span className="font-extrabold text-slate-900 text-xs truncate block">
                              {localityName}
                            </span>
                            <span className="text-[11px] text-slate-400 truncate block">
                              {s.pincode ? `Pincode: ${s.pincode}` : selectedCity.city}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] bg-slate-100 text-slate-700 group-hover:bg-emerald-600 group-hover:text-white px-2 py-1 rounded-md font-bold shrink-0 transition-colors">
                          Select Area
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Verified Area Chips if available */}
            {verifiedCityLocalities.length > 0 && (
              <div className="pt-2">
                <span className="text-[11px] font-bold text-slate-600 block mb-1.5">
                  Verified Localities / Hubs in {selectedCity.city}:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {verifiedCityLocalities.map((item, idx) => {
                    const name = item.area || item.formattedAddress.split(',')[0].trim();
                    const isSelected = areaQuery.toLowerCase() === name.toLowerCase();
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectArea(item)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50'
                        }`}
                      >
                        <Building className="w-3 h-3 text-emerald-600" />
                        <span>{name}</span>
                        {item.pincode && (
                          <span className={`text-[10px] font-mono ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                            ({item.pincode})
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleSkipArea}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 underline"
              >
                Continue for all of {selectedCity.city} (No specific area)
              </button>

              <button
                type="button"
                onClick={handleSkipArea}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 active:scale-95"
              >
                <span>Confirm Location</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
