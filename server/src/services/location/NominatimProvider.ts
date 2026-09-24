import { LocationSearchResult } from './types';
import { FuzzyNormalizer } from './FuzzyNormalizer';

interface NominatimAddress {
  house_number?: string;
  road?: string;
  neighbourhood?: string;
  suburb?: string;
  village?: string;
  town?: string;
  city?: string;
  municipality?: string;
  county?: string;
  district?: string;
  state_district?: string;
  state?: string;
  postcode?: string;
  country?: string;
  country_code?: string;
}

interface NominatimItem {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address?: NominatimAddress;
  importance?: number;
}

// In-memory cache for geocoding queries
const cache = new Map<string, { data: LocationSearchResult[]; timestamp: number }>();
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

export class NominatimLocationProvider {
  /**
   * Search for locations matching query with generic normalization.
   */
  public static async search(query: string, cityContext?: string): Promise<LocationSearchResult[]> {
    const rawTarget = cityContext
      ? (query && query.trim().length >= 2 && query.toLowerCase() !== cityContext.toLowerCase()
          ? `${query}, ${cityContext}`
          : cityContext)
      : query;

    if (!rawTarget || rawTarget.trim().length < 2) return [];

    const norm = FuzzyNormalizer.normalize(rawTarget);
    const effectiveQuery = norm.normalizedQuery;
    const cacheKey = `${effectiveQuery.toLowerCase().trim()}${cityContext ? `::${cityContext.toLowerCase().trim()}` : ''}`;

    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(
        effectiveQuery
      )}&limit=10`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'ServoraFieldService/1.0 (ops@servora.app)',
          'Accept-Language': 'en',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const rawResults = (await response.json()) as NominatimItem[];
        if (Array.isArray(rawResults) && rawResults.length > 0) {
          const mapped = rawResults.map((item) => this.mapNominatimItem(item, norm.hasTypoCorrection));
          cache.set(cacheKey, { data: mapped, timestamp: Date.now() });
          return mapped;
        }
      }
    } catch {
      // Network timeout or error — return empty without inventing hardcoded places
    }

    return [];
  }

  /**
   * Reverse geocode coordinates to structured address.
   */
  public static async reverseGeocode(latitude: number, longitude: number): Promise<LocationSearchResult | null> {
    if (typeof latitude !== 'number' || typeof longitude !== 'number' || isNaN(latitude) || isNaN(longitude)) {
      return null;
    }
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return null;
    }
    // Reject (0,0) - Gulf of Guinea / Null Island
    if (latitude === 0 && longitude === 0) {
      return null;
    }

    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&addressdetails=1&lat=${latitude}&lon=${longitude}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'ServoraFieldService/1.0 (ops@servora.app)',
          'Accept-Language': 'en',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const item = (await response.json()) as NominatimItem;
        const mapped = this.mapNominatimItem(item, false);
        const hasResolvedPlace = Boolean(
          mapped.city ||
          mapped.town ||
          mapped.village ||
          mapped.suburb ||
          mapped.neighbourhood ||
          mapped.road ||
          mapped.locality ||
          mapped.district
        );
        if (!hasResolvedPlace) {
          return null;
        }
        return mapped;
      }
    } catch {
      // Geocoding failure non-blocking, return null
    }

    return null;
  }

  public static mapNominatimItem(item: NominatimItem, wasCorrected = false): LocationSearchResult {
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
    // Rule: Postal PIN/postcode MUST come only from the geocoder's actual postcode field. If unavailable, undefined.
    const postcode = addr.postcode ? String(addr.postcode).trim() : undefined;
    const locality = suburb || neighbourhood || village || town || road || undefined;

    return {
      formattedAddress: item.display_name,
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
      postcode,
      postalCode: postcode,
      locality,
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      placeId: String(item.place_id),
      provider: 'nominatim',
      confidence: wasCorrected ? 0.85 : 0.98,
    };
  }
}
