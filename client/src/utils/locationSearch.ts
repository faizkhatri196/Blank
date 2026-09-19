/**
 * SERVORA Location Search & Geocoding Service
 * Uses OpenStreetMap Nominatim with India country bounds and contextual filtering.
 * Zero hardcoded lists, zero silent city defaulting.
 */

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

const NOMINATIM_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEOCODING_API_URL) ||
  'https://nominatim.openstreetmap.org';

let activeAbortController: AbortController | null = null;

export async function searchLocations(
  query: string,
  cityContext?: string
): Promise<StructuredLocationSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }

  // Cancel any in-flight request
  if (activeAbortController) {
    activeAbortController.abort();
  }
  activeAbortController = new AbortController();

  try {
    // Construct query: if a contextual city is provided, bias with that city
    const searchQuery = cityContext && !trimmed.toLowerCase().includes(cityContext.toLowerCase())
      ? `${trimmed}, ${cityContext}`
      : trimmed;

    const params = new URLSearchParams({
      q: searchQuery,
      format: 'json',
      addressdetails: '1',
      limit: '6',
      countrycodes: 'in',
    });

    const url = `${NOMINATIM_BASE_URL}/search?${params.toString()}`;

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
        addr.district ||
        addr.state_district ||
        addr.county ||
        '';

      const state = addr.state || 'Gujarat';
      const country = addr.country || 'India';
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

      // Build clean formatted address e.g. "Bopal, Ahmedabad, Gujarat 380058"
      const parts = [area, city, state].filter(Boolean);
      let formattedAddress = parts.join(', ');
      if (pincode) {
        formattedAddress += ` ${pincode}`;
      }

      if (city) {
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
