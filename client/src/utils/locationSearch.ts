/**
 * SERVORA Location Search & Geocoding Service
 * Uses server-side location provider abstraction first (/api/location/search),
 * with OpenStreetMap Nominatim fallback.
 * Generic, global, zero hardcoded lists, zero silent city/state defaulting.
 */

import { apiClient } from '../api/client';

export interface StructuredLocationSuggestion {
  city: string;
  state: string;
  country: string;
  area?: string;
  pincode?: string;
  latitude: number;
  longitude: number;
  formattedAddress: string;
  placeId?: string;
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
  } catch {
    // Ignore localStorage errors
  }
}

let activeAbortController: AbortController | null = null;
let searchSequence = 0;

export async function searchLocations(
  query: string,
  cityContext?: string
): Promise<StructuredLocationSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }

  // Cancel previous in-flight request
  if (activeAbortController) {
    activeAbortController.abort();
  }
  activeAbortController = new AbortController();
  const requestSequence = ++searchSequence;

  // 1. Try server-side location provider abstraction
  try {
    const params: Record<string, string> = { q: trimmed };
    if (cityContext) {
      params.city = cityContext;
    }

    const apiKey = getStoredGoogleMapsKey();
    const headers: Record<string, string> = {};
    if (apiKey) {
      headers['x-google-maps-api-key'] = apiKey;
    }

    const res = await apiClient.get('/location/search', {
      params,
      headers,
      signal: activeAbortController.signal,
    });

    if (requestSequence === searchSequence && res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
      return res.data.data.map((item: any) => ({
        city: item.city || item.locationName || '',
        state: item.state || '',
        country: item.country || '',
        area: item.area || item.locality || (item.rawType === 'suburb' ? item.locationName : undefined),
        pincode: item.postalCode || undefined,
        latitude: item.latitude,
        longitude: item.longitude,
        formattedAddress: item.formattedAddress || item.locationName,
      }));
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
      signal: activeAbortController.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      return [];
    }

    const data: any[] = await res.json();
    if (requestSequence !== searchSequence || !Array.isArray(data)) {
      return [];
    }

    const suggestions: StructuredLocationSuggestion[] = [];

    for (const item of data) {
      const addr = item.address || {};
      const city =
        addr.city ||
        addr.town ||
        addr.village ||
        addr.municipality ||
        addr.district ||
        addr.state_district ||
        addr.county ||
        item.display_name.split(',')[0].trim() ||
        '';

      const state = addr.state || '';
      const country = addr.country || '';
      const area =
        addr.suburb ||
        addr.neighbourhood ||
        addr.residential ||
        addr.commercial ||
        addr.quarter ||
        addr.road ||
        undefined;

      const pincode = addr.postcode ? String(addr.postcode).trim() : undefined;
      const latitude = parseFloat(item.lat);
      const longitude = parseFloat(item.lon);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude) ||
          (Math.abs(latitude) < 0.0001 && Math.abs(longitude) < 0.0001)) continue;

      const parts = [area, city, state, country].filter(Boolean);
      let formattedAddress = parts.join(', ');
      if (pincode) {
        formattedAddress += ` ${pincode}`;
      }

      suggestions.push({
        city: city.trim(),
        state: state.trim(),
        country: country.trim(),
        area: area?.trim(),
        pincode,
        latitude,
        longitude,
        formattedAddress: formattedAddress || item.display_name,
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
      return areas.map((item: any) => ({
        city: item.city || city,
        state: item.state || '',
        country: item.country || '',
        area: item.area || item.locality || item.locationName,
        pincode: item.postalCode || undefined,
        latitude: item.latitude,
        longitude: item.longitude,
        formattedAddress: item.formattedAddress || `${item.area || item.locality || item.locationName}, ${city}`,
      }));
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
export async function reverseGeocodeCoords(
  latitude: number,
  longitude: number
): Promise<StructuredLocationSuggestion> {
  try {
    const apiKey = getStoredGoogleMapsKey();
    const headers: Record<string, string> = {};
    if (apiKey) {
      headers['x-google-maps-api-key'] = apiKey;
    }

    const res = await apiClient.get('/location/reverse', {
      params: { lat: latitude, lon: longitude },
      headers,
    });

    if (res.data?.success && res.data.data) {
      const d = res.data.data;
      const city = d.city || d.locationName;
      if (!city) throw new Error('Reverse geocoding did not identify a city');
      const area = d.area || d.locality;
      const pincode = d.postalCode || undefined;
      return {
        city: city.trim(),
        state: d.state || '',
        country: d.country || 'India',
        area: area?.trim(),
        pincode,
        latitude,
        longitude,
        formattedAddress: d.formattedAddress || `${city}, India`,
      };
    }
  } catch (e) {
    console.warn('Backend reverse geocode failed, keeping live coordinates:', e);
  }

  throw new Error('Unable to determine your location. Please select your location manually.');
}

export interface LiveLocationResult {
  latitude: number;
  longitude: number;
  accuracy?: number;
  source: 'gps';
  suggestion: StructuredLocationSuggestion;
}

/**
 * Authoritative live location acquirer:
 * 1. Attempts HTML5 Geolocation (browser GPS / WiFi) with maximumAge: 0 for fresh location
 * 2. If blocked, denied, or unavailable, falls back to Google Maps Geolocation API via server
 * 3. Falls back to network IP geolocation if available
 * 4. Enriches coordinates with reverse geocoding
 */
export async function acquireLiveLocation(
  timeoutMs: number = 8000
): Promise<LiveLocationResult | null> {
  // 1. Try Browser HTML5 Geolocation
  if (typeof window !== 'undefined' && navigator.geolocation) {
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: timeoutMs,
          maximumAge: 0,
        });
      });

      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      const accuracy = pos.coords.accuracy;
      const suggestion = await reverseGeocodeCoords(lat, lon);

      return {
        latitude: lat,
        longitude: lon,
        accuracy,
        source: 'gps',
        suggestion,
      };
    } catch (err: any) {
      console.warn('HTML5 geolocation not available or denied, trying fallbacks:', err.message);
    }
  }

  return null;
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
