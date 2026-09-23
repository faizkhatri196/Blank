import { LocationSearchResult } from './types';
import { ENV } from '../../config/env';

interface GoogleAddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

interface GoogleGeocodeResult {
  place_id: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
    location_type: string;
  };
  address_components: GoogleAddressComponent[];
}

interface GoogleGeocodeResponse {
  results: GoogleGeocodeResult[];
  status: string;
  error_message?: string;
}

interface GoogleGeolocationResponse {
  location: {
    lat: number;
    lng: number;
  };
  accuracy: number;
}

export class GoogleMapsLocationProvider {
  private static getEffectiveApiKey(customKey?: string): string {
    return (
      customKey ||
      process.env.GOOGLE_MAPS_API_KEY ||
      (ENV as any).GOOGLE_MAPS_API_KEY ||
      ''
    ).trim();
  }

  public static isConfigured(customKey?: string): boolean {
    const key = this.getEffectiveApiKey(customKey);
    return Boolean(key && key.length >= 10);
  }

  /**
   * Forward geocoding query using Google Maps Geocoding API
   */
  public static async search(
    query: string,
    cityContext?: string,
    customApiKey?: string
  ): Promise<LocationSearchResult[]> {
    const apiKey = this.getEffectiveApiKey(customApiKey);
    if (!apiKey) {
      return [];
    }

    const trimmed = query.trim();
    if (!trimmed) return [];

    const fullQuery = cityContext && !trimmed.toLowerCase().includes(cityContext.toLowerCase())
      ? `${trimmed}, ${cityContext}`
      : trimmed;

    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        fullQuery
      )}&key=${apiKey}`;

      const res = await fetch(url);
      if (!res.ok) {
        console.warn(`[GoogleMaps] HTTP error ${res.status}: ${res.statusText}`);
        return [];
      }

      const data = (await res.json()) as GoogleGeocodeResponse;
      if (data.status !== 'OK' || !Array.isArray(data.results)) {
        if (data.status !== 'ZERO_RESULTS') {
          console.warn(`[GoogleMaps] API status ${data.status}: ${data.error_message || ''}`);
        }
        return [];
      }

      return data.results.map((item) => this.mapGoogleItem(item));
    } catch (err: any) {
      console.error('[GoogleMaps] Search failed:', err.message);
      return [];
    }
  }

  /**
   * Reverse geocode coordinates to human-readable address using Google Maps
   */
  public static async reverseGeocode(
    latitude: number,
    longitude: number,
    customApiKey?: string
  ): Promise<LocationSearchResult | null> {
    const apiKey = this.getEffectiveApiKey(customApiKey);
    if (!apiKey) {
      return null;
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`;
      const res = await fetch(url);
      if (!res.ok) {
        console.warn(`[GoogleMaps] Reverse geocode HTTP error ${res.status}`);
        return null;
      }

      const data = (await res.json()) as GoogleGeocodeResponse;
      if (data.status !== 'OK' || !Array.isArray(data.results) || data.results.length === 0) {
        return null;
      }

      return this.mapGoogleItem(data.results[0]);
    } catch (err: any) {
      console.error('[GoogleMaps] Reverse geocode failed:', err.message);
      return null;
    }
  }

  /**
   * Geolocate device / IP using Google Maps Geolocation API
   */
  public static async geolocate(
    customApiKey?: string
  ): Promise<{ latitude: number; longitude: number; accuracy: number } | null> {
    const apiKey = this.getEffectiveApiKey(customApiKey);
    if (!apiKey) {
      return null;
    }

    try {
      const url = `https://www.googleapis.com/geolocation/v1/geolocate?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ considerIp: true }),
      });

      if (!res.ok) {
        console.warn(`[GoogleMaps] Geolocation HTTP error ${res.status}`);
        return null;
      }

      const data = (await res.json()) as GoogleGeolocationResponse;
      if (data && data.location && typeof data.location.lat === 'number' && typeof data.location.lng === 'number') {
        return {
          latitude: data.location.lat,
          longitude: data.location.lng,
          accuracy: data.accuracy || 100,
        };
      }
      return null;
    } catch (err: any) {
      console.error('[GoogleMaps] Geolocation failed:', err.message);
      return null;
    }
  }

  private static mapGoogleItem(item: GoogleGeocodeResult): LocationSearchResult {
    const components = item.address_components || [];
    const getComponent = (types: string[]): string | undefined => {
      const found = components.find((c) => types.some((t) => c.types.includes(t)));
      return found?.long_name;
    };

    const city =
      getComponent(['locality']) ||
      getComponent(['administrative_area_level_2']) ||
      getComponent(['postal_town']) ||
      undefined;

    const district = getComponent(['administrative_area_level_2']) || undefined;
    const state = getComponent(['administrative_area_level_1']) || undefined;
    const country = getComponent(['country']) || 'India';
    const postalCode = getComponent(['postal_code']) || undefined;
    const locality =
      getComponent(['sublocality_level_1']) ||
      getComponent(['sublocality']) ||
      getComponent(['neighborhood']) ||
      getComponent(['route']) ||
      undefined;

    return {
      formattedAddress: item.formatted_address,
      city,
      district,
      locality,
      state,
      country,
      postalCode,
      latitude: item.geometry.location.lat,
      longitude: item.geometry.location.lng,
      placeId: item.place_id,
      provider: 'google_maps',
      confidence: 0.99,
    };
  }
}
