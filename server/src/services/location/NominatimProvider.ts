import { LocationSearchResult } from './types';
import { FuzzyNormalizer } from './FuzzyNormalizer';
import { UniversalAddressParser, CanonicalLocation } from './UniversalAddressParser';
import { isValidApplicationCoordinate } from './geospatial';

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
  osm_id?: number;
  lat: string;
  lon: string;
  display_name: string;
  address?: NominatimAddress;
  importance?: number;
}

// In-memory cache for geocoding queries
const cache = new Map<string, { data: LocationSearchResult[]; timestamp: number }>();
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

export interface EnrichedReverseGeocodeResult extends LocationSearchResult {
  canonicalLocation?: CanonicalLocation;
}

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
          const mapped = rawResults.map((item) => this.mapNominatimItem(item));
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
   * Reverse geocode coordinates to structured address using UniversalAddressParser.
   * Coordinate-driven, zero city defaults.
   */
  public static async reverseGeocode(latitude: number, longitude: number): Promise<EnrichedReverseGeocodeResult | null> {
    if (!isValidApplicationCoordinate(latitude, longitude)) {
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
        const latNum = parseFloat(item.lat);
        const lonNum = parseFloat(item.lon);
        const finalLat = isFinite(latNum) ? latNum : latitude;
        const finalLon = isFinite(lonNum) ? lonNum : longitude;

        // Parse through UniversalAddressParser
        const canonical = UniversalAddressParser.parse({
          rawAddress: item.address,
          displayName: item.display_name,
          latitude: finalLat,
          longitude: finalLon,
          source: 'gps',
          provider: 'nominatim',
          placeId: String(item.place_id),
          osmId: item.osm_id ? String(item.osm_id) : undefined,
        });

        if (!canonical) {
          return null;
        }

        const hasResolvedPlace = Boolean(
          canonical.address.city ||
          canonical.address.town ||
          canonical.address.village ||
          canonical.address.suburb ||
          canonical.address.neighbourhood ||
          canonical.address.road ||
          canonical.address.district ||
          canonical.localityDisplayName
        );

        if (!hasResolvedPlace) {
          return null;
        }

        const legacy = this.mapNominatimItem(item);
        return {
          ...legacy,
          canonicalLocation: canonical,
        };
      }
    } catch {
      // Geocoding failure non-blocking, return null
    }

    return null;
  }

  public static mapNominatimItem(item: NominatimItem): LocationSearchResult {
    const latNum = parseFloat(item.lat);
    const lonNum = parseFloat(item.lon);

    const canonical = UniversalAddressParser.parse({
      rawAddress: item.address,
      displayName: item.display_name,
      latitude: latNum,
      longitude: lonNum,
      source: 'manual_search',
      provider: 'nominatim',
      placeId: String(item.place_id),
      osmId: item.osm_id ? String(item.osm_id) : undefined,
    });

    const addr = item.address || {};
    const houseNumber = canonical?.address.houseNumber;
    const road = canonical?.address.road;
    const neighbourhood = canonical?.address.neighbourhood;
    const suburb = canonical?.address.suburb;
    const village = canonical?.address.village;
    const town = canonical?.address.town;
    const hasPlace = Boolean(
      canonical?.address.city ||
      canonical?.address.town ||
      canonical?.address.village ||
      canonical?.address.suburb ||
      canonical?.address.neighbourhood ||
      canonical?.address.road ||
      canonical?.address.district ||
      canonical?.localityDisplayName
    );
    const city = hasPlace ? canonical?.cityDisplayName : undefined;
    const district = canonical?.address.district;
    const state = canonical?.address.state;
    const country = canonical?.address.country;
    // Strict postcode preservation: If missing from provider, undefined. Never guess!
    const postcode = canonical?.address.postcode || undefined;
    const locality = canonical?.localityDisplayName;

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
      latitude: latNum,
      longitude: lonNum,
      placeId: String(item.place_id),
      provider: 'nominatim',
      confidence: 0.98,
    };
  }
}
