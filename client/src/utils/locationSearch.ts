/**
 * SERVORA Location Search & Geocoding Service
 * Uses server-side location provider abstraction first (/api/location/search),
 * with OpenStreetMap Nominatim fallback.
 * Generic, global, zero hardcoded lists, zero silent city/state defaulting.
 *
 * Race-condition protection: Each call creates its own AbortController.
 * Callers must pass the signal and cancel appropriately.
 */

import { apiClient } from '../api/client';

export interface StructuredLocationSuggestion {
  city: string;
  state: string;
  country: string;
  area?: string;
  pincode?: string;
  postcode?: string;
  houseNumber?: string;
  road?: string;
  neighbourhood?: string;
  suburb?: string;
  village?: string;
  town?: string;
  district?: string;
  latitude: number;
  longitude: number;
  formattedAddress: string;
  geocodingStatus?: 'VERIFIED' | 'MISSING';
}

export function getStoredGoogleMapsKey(): string {
  try {
    return (
      localStorage.getItem('servora_google_maps_key') ||
      (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY ||
      ''
    ).trim();
  } catch {
    return '';
  }
}

export function setStoredGoogleMapsKey(key: string): void {
  try {
    if (key.trim()) {
      localStorage.setItem('servora_google_maps_key', key.trim());
    } else {
      localStorage.removeItem('servora_google_maps_key');
    }
  } catch {}
}

/**
 * Validate that coordinates are a real application location.
 * Rejects: null, undefined, NaN, Infinity, out of range, and (0,0).
 */
function isValidApplicationCoordinate(lat: unknown, lon: unknown): boolean {
  if (typeof lat !== 'number' || typeof lon !== 'number') return false;
  if (!isFinite(lat) || !isFinite(lon)) return false;
  if (isNaN(lat) || isNaN(lon)) return false;
  if (lat < -90 || lat > 90) return false;
  if (lon < -180 || lon > 180) return false;
  // Reject (0,0) — Gulf of Guinea, never a valid SERVORA location
  if (lat === 0 && lon === 0) return false;
  return true;
}

/**
 * Search for locations by text query.
 * Returns suggestions with coordinates.
 *
 * RACE CONDITION PROTECTION: Pass an AbortSignal from the caller's AbortController.
 * The caller should abort the previous request when a new search starts.
 */
export async function searchLocations(
  query: string,
  cityContext?: string,
  signal?: AbortSignal
): Promise<StructuredLocationSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }

  // 1. Try server-side location provider abstraction
  try {
    const params: Record<string, string> = { q: trimmed };
    if (cityContext) {
      params.city = cityContext;
    }

    const res = await apiClient.get('/location/search', {
      params,
      signal,
    });

    if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
      return res.data.data
        .map((item: any) => {
          const lat = typeof item.latitude === 'number' ? item.latitude : undefined;
          const lon = typeof item.longitude === 'number' ? item.longitude : undefined;
          const pin = item.postcode || item.postalCode || undefined;
          return {
            city: item.city || item.locationName || '',
            state: item.state || '',
            country: item.country || '',
            area: item.area || item.locality || (item.rawType === 'suburb' ? item.locationName : undefined),
            pincode: pin,
            postcode: pin,
            houseNumber: item.houseNumber || undefined,
            road: item.road || undefined,
            neighbourhood: item.neighbourhood || undefined,
            suburb: item.suburb || undefined,
            village: item.village || undefined,
            town: item.town || undefined,
            district: item.district || undefined,
            // Only attach valid non-(0,0) coordinates; otherwise leave undefined
            latitude: isValidApplicationCoordinate(lat, lon) ? lat! : undefined,
            longitude: isValidApplicationCoordinate(lat, lon) ? lon! : undefined,
            formattedAddress: item.formattedAddress || item.locationName,
            geocodingStatus: item.geocodingStatus || (isValidApplicationCoordinate(lat, lon) ? 'VERIFIED' : 'MISSING'),
          } as StructuredLocationSuggestion;
        })
        .filter((s: StructuredLocationSuggestion) => s.city || s.area);
    }
  } catch (err: any) {
    if (err.name === 'CanceledError' || err.name === 'AbortError') {
      return [];
    }
    // Fall back to direct Nominatim query below
  }

  // 2. Direct Nominatim fallback
  try {
    const searchQuery = cityContext && !trimmed.toLowerCase().includes(cityContext.toLowerCase())
      ? `${trimmed}, ${cityContext}`
      : trimmed;

    const params = new URLSearchParams({
      q: searchQuery,
      format: 'json',
      addressdetails: '1',
      limit: '6',
    });

    const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;

    const res = await fetch(url, {
      signal,
      headers: {
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      return [];
    }

    const data: any[] = await res.json();
    if (!Array.isArray(data)) {
      return [];
    }

    const suggestions: StructuredLocationSuggestion[] = [];

    for (const item of data) {
      const addr = item.address || {};
      const houseNumber = addr.house_number?.trim() || undefined;
      const road = addr.road?.trim() || undefined;
      const neighbourhood = addr.neighbourhood?.trim() || undefined;
      const suburb = addr.suburb?.trim() || undefined;
      const village = addr.village?.trim() || undefined;
      const town = addr.town?.trim() || undefined;
      const district = addr.state_district?.trim() || addr.district?.trim() || addr.county?.trim() || undefined;
      const city =
        addr.city?.trim() ||
        addr.town?.trim() ||
        addr.village?.trim() ||
        addr.municipality?.trim() ||
        district ||
        '';

      const state = addr.state?.trim() || '';
      const country = addr.country?.trim() || '';
      const area = suburb || neighbourhood || village || town || road || undefined;
      const pincode = addr.postcode ? String(addr.postcode).trim() : undefined;
      const latitude = parseFloat(item.lat);
      const longitude = parseFloat(item.lon);

      // Only include result if coordinates are valid and not (0,0)
      if (!isValidApplicationCoordinate(latitude, longitude)) {
        continue;
      }

      suggestions.push({
        city,
        state,
        country,
        area,
        pincode,
        postcode: pincode,
        houseNumber,
        road,
        neighbourhood,
        suburb,
        village,
        town,
        district,
        latitude,
        longitude,
        formattedAddress: item.display_name,
        geocodingStatus: 'VERIFIED',
      });
    }

    return suggestions;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return [];
    }
    console.error('Location search failed:', err);
    return [];
  }
}

/**
 * Fetches verified localities/suburbs/service areas for a selected city from the server
 */
export async function fetchCityLocalities(city: string): Promise<StructuredLocationSuggestion[]> {
  if (!city || city.trim().length < 2) return [];
  try {
    const res = await apiClient.get('/location/search', {
      params: { q: city.trim(), city: city.trim() },
    });

    if (res.data?.success && Array.isArray(res.data.data)) {
      // Filter suggestions that have an area, locality, or rawType === 'suburb'
      const areas = res.data.data.filter(
        (item: any) => item.area || item.locality || item.rawType === 'suburb'
      );
      return areas.map((item: any) => {
        const lat = typeof item.latitude === 'number' ? item.latitude : undefined;
        const lon = typeof item.longitude === 'number' ? item.longitude : undefined;
        return {
          city: item.city || city,
          state: item.state || '',
          country: item.country || '',
          area: item.area || item.locality || item.locationName,
          pincode: item.postalCode || undefined,
          // Only expose valid non-(0,0) coordinates
          latitude: isValidApplicationCoordinate(lat, lon) ? lat! : undefined,
          longitude: isValidApplicationCoordinate(lat, lon) ? lon! : undefined,
          formattedAddress: item.formattedAddress || `${item.area || item.locality || item.locationName}, ${city}`,
          geocodingStatus: item.geocodingStatus || (isValidApplicationCoordinate(lat, lon) ? 'VERIFIED' : 'MISSING'),
        } as StructuredLocationSuggestion;
      });
    }
    return [];
  } catch (err) {
    console.error('Failed to fetch localities for city:', city, err);
    return [];
  }
}

/**
 * Reverse geocodes coordinates via internal server endpoint to avoid CORS and browser rate-limits.
 * Guarantees that live GPS coordinates are NEVER dropped.
 */
import { gpsEngine } from '../services/gpsEngine';
import { ClientAddressParser } from './universalLocation';

/**
 * Reverse geocodes coordinates via internal server endpoint to avoid CORS and browser rate-limits.
 * Universal and coordinate-driven without hardcoded city/country fallbacks.
 */
export async function reverseGeocodeCoords(
  latitude: number,
  longitude: number
): Promise<StructuredLocationSuggestion> {
  if (!isValidApplicationCoordinate(latitude, longitude)) {
    throw new Error('Invalid coordinates supplied for reverse geocoding');
  }

  // 1. Try internal server endpoint first
  try {
    const res = await apiClient.get('/location/reverse', {
      params: { lat: latitude, lon: longitude },
    });

    if (res.data?.success && res.data.data) {
      const d = res.data.data;
      const canonical = d.canonicalLocation || ClientAddressParser.parse({
        rawAddress: {
          house_number: d.houseNumber,
          road: d.road,
          neighbourhood: d.neighbourhood,
          suburb: d.suburb || d.area,
          village: d.village,
          town: d.town,
          city: d.city,
          district: d.district,
          state: d.state,
          country: d.country,
          postcode: d.postcode || d.postalCode,
        },
        displayName: d.formattedAddress,
        latitude,
        longitude,
        source: 'gps',
        provider: 'server_nominatim',
      });

      if (canonical) {
        return {
          city: canonical.cityDisplayName,
          state: canonical.address.state || '',
          country: canonical.address.country || '',
          area: canonical.localityDisplayName,
          pincode: canonical.address.postcode || undefined,
          postcode: canonical.address.postcode || undefined,
          latitude,
          longitude,
          formattedAddress: canonical.formattedAddress,
          geocodingStatus: 'VERIFIED',
        };
      }
    }
  } catch (e) {
    console.warn('Backend reverse geocode failed, trying client fallback:', e);
  }

  // 2. Direct client-side OpenStreetMap reverse geocode fallback
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
    });

    if (res.ok) {
      const item = await res.json();
      const canonical = ClientAddressParser.parse({
        rawAddress: item.address || {},
        displayName: item.display_name,
        latitude,
        longitude,
        source: 'gps',
        provider: 'client_nominatim',
        placeId: String(item.place_id),
      });

      if (canonical) {
        return {
          city: canonical.cityDisplayName,
          state: canonical.address.state || '',
          country: canonical.address.country || '',
          area: canonical.localityDisplayName,
          pincode: canonical.address.postcode || undefined,
          postcode: canonical.address.postcode || undefined,
          latitude,
          longitude,
          formattedAddress: canonical.formattedAddress,
          geocodingStatus: 'VERIFIED',
        };
      }
    }
  } catch (err) {
    console.warn('Client reverse geocoding fallback failed:', err);
  }

  // 3. Fallback: preserve live coordinates honestly without inventing place names
  return {
    city: 'Current Location',
    state: '',
    country: '',
    latitude,
    longitude,
    formattedAddress: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
    geocodingStatus: 'VERIFIED',
  };
}

export interface LiveLocationResult {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  source: 'gps';
  suggestion: StructuredLocationSuggestion;
}

/**
 * Authoritative live location acquirer:
 * Uses 2-stage retry GPS Engine (high-accuracy -> standard accuracy).
 * Never uses IP or server location.
 */
export async function acquireLiveLocation(): Promise<LiveLocationResult | null> {
  const result = await gpsEngine.acquireCurrentLocation();
  if (!result.success || !result.location) {
    return null;
  }

  const loc = result.location;
  return {
    latitude: loc.coordinates.latitude,
    longitude: loc.coordinates.longitude,
    accuracy: loc.accuracy,
    source: 'gps',
    suggestion: {
      city: loc.cityDisplayName,
      state: loc.address.state || '',
      country: loc.address.country || '',
      area: loc.localityDisplayName,
      pincode: loc.address.postcode || undefined,
      postcode: loc.address.postcode || undefined,
      latitude: loc.coordinates.latitude,
      longitude: loc.coordinates.longitude,
      formattedAddress: loc.formattedAddress,
      geocodingStatus: 'VERIFIED',
    },
  };
}

/**
 * Checks server location provider status (Google Maps vs Nominatim)
 */
export async function fetchLocationStatus(): Promise<{
  activeProvider: string;
  googleMapsConfigured: boolean;
}> {
  try {
    const apiKey = getStoredGoogleMapsKey();
    const headers: Record<string, string> = {};
    if (apiKey) {
      headers['x-google-maps-api-key'] = apiKey;
    }
    const res = await apiClient.get('/location/status', { headers });
    if (res.data?.success && res.data.data) {
      return res.data.data;
    }
  } catch (err) {
    console.warn('Failed to query location status:', err);
  }
  return { activeProvider: 'nominatim', googleMapsConfigured: false };
}

/**
 * Forward geocodes an address or city query to obtain authoritative latitude & longitude
 */
export async function geocodeAddressOrCity(
  query: string,
  cityContext?: string
): Promise<{
  latitude: number;
  longitude: number;
  city?: string;
  area?: string;
  state?: string;
  country?: string;
  pincode?: string;
  formattedAddress?: string;
} | null> {
  if (!query || query.trim().length < 2) return null;
  try {
    const results = await searchLocations(query, cityContext);
    if (results && results.length > 0) {
      const top = results[0];
      if (typeof top.latitude === 'number' && typeof top.longitude === 'number' && !isNaN(top.latitude) && !isNaN(top.longitude)) {
        return {
          latitude: top.latitude,
          longitude: top.longitude,
          city: top.city,
          area: top.area,
          state: top.state,
          country: top.country,
          pincode: top.pincode,
          formattedAddress: top.formattedAddress,
        };
      }
    }
  } catch (err) {
    console.warn('Geocoding query failed:', query, err);
  }
  return null;
}

/**
 * Standard Haversine distance calculator in kilometers for client-side diagnostics
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}
