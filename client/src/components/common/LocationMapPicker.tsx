import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { Search, MapPin, Navigation, Loader2, AlertTriangle } from 'lucide-react';
import { searchLocations, reverseGeocodeLocation, LocationSuggestion } from '../../api/location';

interface LocationMapPickerProps {
  latitude?: number | null;
  longitude?: number | null;
  radiusKm?: number;
  locationName?: string;
  formattedAddress?: string;
  onChange: (loc: {
    latitude: number;
    longitude: number;
    radiusKm: number;
    locationName: string;
    formattedAddress: string;
    postalCode?: string;
    city?: string;
    state?: string;
    country?: string;
  }) => void;
  showRadius?: boolean;
  minRadius?: number;
  maxRadius?: number;
  className?: string;
}

export const LocationMapPicker: React.FC<LocationMapPickerProps> = ({
  latitude,
  longitude,
  radiusKm = 25,
  locationName = '',
  formattedAddress = '',
  onChange,
  showRadius = true,
  minRadius = 1,
  maxRadius = 150,
  className = '',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);

  const [query, setQuery] = useState(locationName || formattedAddress || '');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [currentRadius, setCurrentRadius] = useState<number>(radiusKm);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [accuracyWarning, setAccuracyWarning] = useState<string | null>(null);
  const searchTimeoutRef = useRef<any>(null);

  // Sync radius state if prop changes externally
  useEffect(() => {
    setCurrentRadius(radiusKm);
  }, [radiusKm]);

  // Create custom modern SVG marker icon
  const createCustomIcon = () => {
    return L.divIcon({
      className: 'servora-map-pin',
      html: `<div style="
        background: #2563eb;
        color: white;
        width: 34px;
        height: 34px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(37,99,235,0.4);
        border: 2px solid white;
        cursor: grab;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      </div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 34],
    });
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Use selected coordinates if available, otherwise default viewport to a global center without setting values
    const initLat = latitude && !isNaN(latitude) ? latitude : 20.5937;
    const initLng = longitude && !isNaN(longitude) ? longitude : 78.9629;
    const initZoom = latitude && longitude ? 12 : 5;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [initLat, initLng],
        zoom: initZoom,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;

      // Handle map click
      map.on('click', async (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        updateLocationFromCoords(lat, lng, currentRadius);
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map marker and circle when coordinates or radius change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (latitude && longitude && !isNaN(latitude) && !isNaN(longitude)) {
      const latlng: L.LatLngTuple = [latitude, longitude];

      if (!markerRef.current) {
        const marker = L.marker(latlng, {
          icon: createCustomIcon(),
          draggable: true,
        }).addTo(map);

        marker.on('dragend', async (ev) => {
          const newLatLng = ev.target.getLatLng();
          updateLocationFromCoords(newLatLng.lat, newLatLng.lng, currentRadius);
        });

        markerRef.current = marker;
      } else {
        markerRef.current.setLatLng(latlng);
      }

      // Radius Circle
      if (showRadius) {
        const radiusMeters = currentRadius * 1000;
        if (!circleRef.current) {
          const circle = L.circle(latlng, {
            radius: radiusMeters,
            color: '#2563eb',
            fillColor: '#3b82f6',
            fillOpacity: 0.15,
            weight: 2,
            dashArray: '4, 6',
          }).addTo(map);
          circleRef.current = circle;
        } else {
          circleRef.current.setLatLng(latlng);
          circleRef.current.setRadius(radiusMeters);
        }
      }

      // Accuracy uncertainty circle if accuracy is known and > 150m
      if (locationAccuracy && locationAccuracy > 150) {
        if (!accuracyCircleRef.current) {
          const accCircle = L.circle(latlng, {
            radius: locationAccuracy,
            color: '#d97706',
            fillColor: '#f59e0b',
            fillOpacity: 0.1,
            weight: 1.5,
            dashArray: '3, 5',
          }).addTo(map);
          accuracyCircleRef.current = accCircle;
        } else {
          accuracyCircleRef.current.setLatLng(latlng);
          accuracyCircleRef.current.setRadius(locationAccuracy);
        }
      } else if (accuracyCircleRef.current) {
        accuracyCircleRef.current.remove();
        accuracyCircleRef.current = null;
      }

      // Fly to marker if view is far
      const currentCenter = map.getCenter();
      const dist = map.distance(currentCenter, latlng);
      if (dist > 100000 || map.getZoom() < 8) {
        map.setView(latlng, 12, { animate: true });
      }
    } else {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      if (circleRef.current) {
        circleRef.current.remove();
        circleRef.current = null;
      }
      if (accuracyCircleRef.current) {
        accuracyCircleRef.current.remove();
        accuracyCircleRef.current = null;
      }
    }
  }, [latitude, longitude, currentRadius, showRadius, locationAccuracy]);

  const updateLocationFromCoords = async (lat: number, lng: number, radius: number) => {
    try {
      const details = await reverseGeocodeLocation(lat, lng);
      const name = details?.locationName || `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
      const addr = details?.formattedAddress || name;
      setQuery(name);
      onChange({
        latitude: lat,
        longitude: lng,
        radiusKm: radius,
        locationName: name,
        formattedAddress: addr,
        postalCode: details?.postalCode,
        city: details?.city,
        state: details?.state,
        country: details?.country,
      });
    } catch (err) {
      onChange({
        latitude: lat,
        longitude: lng,
        radiusKm: radius,
        locationName: `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
        formattedAddress: `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`,
      });
    }
  };

  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (val.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchLocations(val);
        setSuggestions(results);
        setShowDropdown(true);
      } catch (err) {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  const handleSelectSuggestion = (item: LocationSuggestion) => {
    setQuery(item.locationName || item.formattedAddress);
    setShowDropdown(false);
    setSuggestions([]);
    setLocationAccuracy(null);
    setAccuracyWarning(null);

    onChange({
      latitude: item.latitude,
      longitude: item.longitude,
      radiusKm: currentRadius,
      locationName: item.locationName,
      formattedAddress: item.formattedAddress,
      postalCode: item.postalCode,
      city: item.city,
      state: item.state,
      country: item.country,
    });

    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([item.latitude, item.longitude], 12, { animate: true });
    }
  };

  const handleRadiusChange = (newRadius: number) => {
    setCurrentRadius(newRadius);
    if (latitude && longitude) {
      onChange({
        latitude,
        longitude,
        radiusKm: newRadius,
        locationName: locationName || query,
        formattedAddress: formattedAddress || query,
      });
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setIsLocating(true);
    setAccuracyWarning(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const acc = pos.coords.accuracy;
        setLocationAccuracy(acc || null);

        if (acc && acc > 1500) {
          setAccuracyWarning(
            `Network-assisted location detected (~${(acc / 1000).toFixed(1)} km accuracy). If this does not match your exact physical location, please search your city/area above or click directly on the map to pinpoint.`
          );
        } else {
          setAccuracyWarning(null);
        }

        updateLocationFromCoords(lat, lng, currentRadius);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lng], 13, { animate: true });
        }
      },
      (err) => {
        setIsLocating(false);
        alert('Could not retrieve current location: ' + err.message);
      },
      { timeout: 12000, enableHighAccuracy: true, maximumAge: 0 }
    );
  };

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Search Input Bar */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
            placeholder="Search address, landmark, town, city, pincode, or coordinates..."
            className="w-full pl-9 pr-10 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all shadow-sm"
          />
          {searching || isLocating ? (
            <Loader2 className="absolute right-3 w-4 h-4 text-blue-600 animate-spin" />
          ) : (
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isLocating}
              title="Use current GPS position"
              className="absolute right-2 p-1.5 text-slate-400 hover:text-blue-600 rounded hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              <Navigation className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Warning Banner for Coarse / Approximate Location */}
        {accuracyWarning && (
          <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2 animate-fadeIn">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-[11px] leading-relaxed">
              <span className="font-semibold">{accuracyWarning}</span>
            </div>
            <button
              type="button"
              onClick={() => setAccuracyWarning(null)}
              className="text-amber-500 hover:text-amber-800 text-xs font-bold px-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Autocomplete Dropdown */}
        {showDropdown && suggestions.length > 0 && (
          <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto divide-y divide-slate-100">
            {suggestions.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectSuggestion(item)}
                className="w-full text-left px-3.5 py-2.5 hover:bg-blue-50/70 transition-colors flex items-start gap-2.5 group"
              >
                <MapPin className="w-4 h-4 text-slate-400 group-hover:text-blue-600 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {item.locationName || item.formattedAddress}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{item.formattedAddress}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Interactive Map Box */}
      <div className="relative w-full h-64 sm:h-72 rounded-xl overflow-hidden border border-slate-200 shadow-inner bg-slate-50">
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {(!latitude || !longitude) && (
          <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[1px] flex items-center justify-center pointer-events-none z-20">
            <div className="bg-white/95 px-4 py-2 rounded-full shadow-lg border border-slate-200 flex items-center gap-2 text-xs font-medium text-slate-700">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>Search a location or click anywhere on the map</span>
            </div>
          </div>
        )}
      </div>

      {/* Radius Controls (if enabled) */}
      {showRadius && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Coverage Radius:</span>
            <span className="text-sm font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
              {currentRadius} km
            </span>
          </div>
          <div className="flex items-center gap-3 flex-1 sm:max-w-xs">
            <input
              type="range"
              min={minRadius}
              max={maxRadius}
              value={currentRadius}
              onChange={(e) => handleRadiusChange(parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <span className="text-xs text-slate-400 whitespace-nowrap">{maxRadius} km</span>
          </div>
        </div>
      )}

      {/* Selected Location Details pill */}
      {latitude && longitude && (
        <div className="text-xs text-slate-500 flex items-center justify-between px-1">
          <span className="truncate max-w-[280px]">
            {formattedAddress || locationName || 'Pinned coordinates'}
          </span>
          <span className="font-mono text-[11px] text-slate-400 shrink-0">
            {latitude.toFixed(4)}, {longitude.toFixed(4)}
          </span>
        </div>
      )}
    </div>
  );
};
