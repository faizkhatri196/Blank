import { apiClient } from './client';

export interface LocationSuggestion {
  locationName: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  postalCode?: string;
  city?: string;
  state?: string;
  country?: string;
  rawType?: string;
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
      return data.map((item: any) => ({
        locationName:
          item.address?.city ||
          item.address?.town ||
          item.address?.village ||
          item.address?.suburb ||
          item.display_name.split(',')[0].trim(),
        formattedAddress: item.display_name,
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
        postalCode: item.address?.postcode || '',
        city: item.address?.city || item.address?.town || item.address?.village || '',
        state: item.address?.state || '',
        country: item.address?.country || '',
        rawType: item.type || 'place',
      }));
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
      return {
        locationName:
          item.address?.suburb ||
          item.address?.neighbourhood ||
          item.address?.city ||
          item.address?.town ||
          item.display_name.split(',')[0].trim(),
        formattedAddress: item.display_name,
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
        postalCode: item.address?.postcode || '',
        city: item.address?.city || item.address?.town || item.address?.village || '',
        state: item.address?.state || '',
        country: item.address?.country || '',
      };
    }
  } catch (err) {
    console.error('Direct reverse geocode failed:', err);
  }

  return null;
}
