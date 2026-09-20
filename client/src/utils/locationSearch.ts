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
}

let activeAbortController: AbortController | null = null;

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

  // 1. Try server-side location provider abstraction
  try {
    const params: Record<string, string> = { q: trimmed };
    if (cityContext) {
      params.city = cityContext;
    }

    const res = await apiClient.get('/location/search', {
      params,
      signal: activeAbortController.signal,
    });

    if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
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
    if (!Array.isArray(data)) {
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
        latitude: isNaN(latitude) ? 0 : latitude,
        longitude: isNaN(longitude) ? 0 : longitude,
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
