import { apiClient } from './client';

export interface LocationSuggestion {
  locationName: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  postalCode?: string;
  postcode?: string;
  houseNumber?: string;
  road?: string;
  neighbourhood?: string;
  suburb?: string;
  village?: string;
  town?: string;
  city?: string;
  district?: string;
  state?: string;
  country?: string;
  locality?: string;
  rawType?: string;
}

function parseNominatimItem(item: any): LocationSuggestion {
  const addr = item.address || {};
  const houseNumber = addr.house_number?.trim() || undefined;
  const road = addr.road?.trim() || undefined;
  const neighbourhood = addr.neighbourhood?.trim() || undefined;
  const suburb = addr.suburb?.trim() || undefined;
  const village = addr.village?.trim() || undefined;
  const town = addr.town?.trim() || undefined;
  const countyName = addr.county?.replace(/\s+(taluka|tehsil|mandal|subdistrict|block)\b/gi, '').trim() || undefined;
  const city = addr.city?.trim() || addr.town?.trim() || addr.village?.trim() || addr.municipality?.trim() || countyName || undefined;
  const district = addr.state_district?.trim() || addr.district?.trim() || addr.county?.trim() || undefined;
  const state = addr.state?.trim() || undefined;
  const country = addr.country?.trim() || undefined;
  const postcode = addr.postcode ? String(addr.postcode).trim() : undefined;
  const locality = suburb || neighbourhood || village || town || road || undefined;
  const locationName = locality || city || district || item.name || item.display_name;

  return {
    locationName,
    formattedAddress: item.display_name,
    latitude: parseFloat(item.lat),
    longitude: parseFloat(item.lon),
    postalCode: postcode,
    postcode,
    houseNumber,
    road,
    neighbourhood,
    suburb,
    village,
    town,
    city,
    district,
    state,
    country,
    locality,
    rawType: item.type || 'place',
  };
}

export async function searchLocations(query: string): Promise<LocationSuggestion[]> {
  const trimmed = (query || '').trim();
  if (!trimmed || trimmed.length < 2) return [];

  try {
    const res = await apiClient.get('/location/search', { params: { q: trimmed } });
    if (res.data?.success && Array.isArray(res.data.data)) {
      return res.data.data;
    }
  } catch (err) {
    console.warn('Backend location search failed, attempting direct Nominatim lookup...', err);
  }

  // Fallback directly to OpenStreetMap Nominatim if backend is unreachable
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      trimmed
    )}&format=json&addressdetails=1&limit=5`;
    const response = await fetch(url, {
      headers: {
        'Accept-Language': 'en',
      },
    });
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) {
        return data.map(parseNominatimItem);
      }
    }
  } catch (err) {
    console.error('All location search sources failed:', err);
  }

  return [];
}

export async function reverseGeocodeLocation(lat: number, lon: number): Promise<LocationSuggestion | null> {
  try {
    const res = await apiClient.get('/location/reverse', { params: { lat, lon } });
    if (res.data?.success && res.data.data) {
      return res.data.data;
    }
  } catch (err) {
    console.warn('Backend reverse geocode failed, attempting direct lookup...', err);
  }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;
    const response = await fetch(url, {
      headers: {
        'Accept-Language': 'en',
      },
    });
    if (response.ok) {
      const item = await response.json();
      if (item && !item.error) {
        return parseNominatimItem(item);
      }
    }
  } catch (err) {
    console.error('Direct reverse geocode failed:', err);
  }

  return null;
}
