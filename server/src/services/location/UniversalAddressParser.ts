/**
 * UNIVERSAL ADDRESS PARSER
 *
 * Maps diverse geocoder provider responses (OpenStreetMap Nominatim, Google Maps, etc.)
 * into a single canonical, production-grade location representation.
 *
 * CRITICAL ARCHITECTURAL RULES:
 * 1. Zero hardcoded cities, areas, states, or countries.
 * 2. Zero hardcoded PIN / postal code dictionaries.
 * 3. Never invent or calculate a postal code from coordinates or city name.
 * 4. If the provider returns no postal code, postcode is strictly null.
 * 5. Preserves all administrative and locality tiers rather than prematurely flattening them.
 * 6. Validates coordinates and rejects [0,0] (Null Island) and invalid coordinate ranges.
 */

import { isValidApplicationCoordinate } from './geospatial';

export interface CanonicalAddress {
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
  postcode: string | null;
}

export interface CanonicalLocation {
  coordinates: {
    latitude: number;
    longitude: number;
  };
  accuracy?: number | null;
  address: CanonicalAddress;
  formattedAddress: string;
  localityDisplayName?: string;
  cityDisplayName: string;
  source: 'gps' | 'manual_search' | 'saved';
  confidence?: number;
  timestamp: string; // ISO-8601
  rawProviderData?: {
    provider: string;
    placeId?: string;
    osmId?: string;
    rawAddress?: Record<string, any>;
    rawDisplayName?: string;
  };
}

export class UniversalAddressParser {
  /**
   * Normalizes any provider item into a CanonicalLocation.
   */
  public static parse(params: {
    rawAddress?: Record<string, any>;
    displayName?: string;
    latitude: number;
    longitude: number;
    accuracy?: number | null;
    source: 'gps' | 'manual_search' | 'saved';
    provider?: string;
    placeId?: string;
    osmId?: string;
    confidence?: number;
    timestamp?: string;
  }): CanonicalLocation | null {
    const {
      rawAddress = {},
      displayName = '',
      latitude,
      longitude,
      accuracy = null,
      source,
      provider = 'nominatim',
      placeId,
      osmId,
      confidence,
      timestamp = new Date().toISOString(),
    } = params;

    // Reject invalid or null coordinates and (0,0)
    if (!isValidApplicationCoordinate(latitude, longitude)) {
      return null;
    }

    // Extract address components generically
    const houseNumber =
      cleanStr(rawAddress.house_number) ||
      cleanStr(rawAddress.houseNumber) ||
      cleanStr(rawAddress.street_number) ||
      cleanStr(rawAddress.premise) ||
      undefined;

    const road =
      cleanStr(rawAddress.road) ||
      cleanStr(rawAddress.street) ||
      cleanStr(rawAddress.route) ||
      cleanStr(rawAddress.path) ||
      cleanStr(rawAddress.pedestrian) ||
      undefined;

    const neighbourhood =
      cleanStr(rawAddress.neighbourhood) ||
      cleanStr(rawAddress.neighborhood) ||
      cleanStr(rawAddress.residential) ||
      cleanStr(rawAddress.subdivision) ||
      undefined;

    const suburb =
      cleanStr(rawAddress.suburb) ||
      cleanStr(rawAddress.subdistrict) ||
      cleanStr(rawAddress.sub_district) ||
      cleanStr(rawAddress.tehsil) ||
      cleanStr(rawAddress.taluk) ||
      cleanStr(rawAddress.taluka) ||
      undefined;

    const village =
      cleanStr(rawAddress.village) ||
      cleanStr(rawAddress.hamlet) ||
      cleanStr(rawAddress.isolated_dwelling) ||
      undefined;

    const town =
      cleanStr(rawAddress.town) ||
      cleanStr(rawAddress.municipality) ||
      cleanStr(rawAddress.borough) ||
      undefined;

    const city =
      cleanStr(rawAddress.city) ||
      cleanStr(rawAddress.city_district) ||
      undefined;

    const district =
      cleanStr(rawAddress.state_district) ||
      cleanStr(rawAddress.district) ||
      cleanStr(rawAddress.county) ||
      undefined;

    const state =
      cleanStr(rawAddress.state) ||
      cleanStr(rawAddress.province) ||
      cleanStr(rawAddress.region) ||
      cleanStr(rawAddress.state_code) ||
      undefined;

    const country =
      cleanStr(rawAddress.country) ||
      cleanStr(rawAddress.country_name) ||
      undefined;

    // POSTAL CODE RULE:
    // Strictly preserve what the provider returned. If missing or blank, store null.
    // NEVER invent, calculate, or guess a postal code!
    const rawPostcode =
      cleanStr(rawAddress.postcode) ||
      cleanStr(rawAddress.postal_code) ||
      cleanStr(rawAddress.postalCode) ||
      cleanStr(rawAddress.zip) ||
      cleanStr(rawAddress.zipcode) ||
      null;

    const canonicalAddress: CanonicalAddress = {
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
      postcode: rawPostcode,
    };

    // Generic Locality Resolution:
    // Identifies the immediate local neighbourhood, suburb, village, town, or road
    const localityDisplayName =
      suburb ||
      neighbourhood ||
      village ||
      town ||
      road ||
      undefined;

    // Generic City / Administrative Place Resolution:
    // Prioritizes actual city, then town, then village, then municipality, then district/suburb
    const cityDisplayName =
      city ||
      town ||
      village ||
      suburb ||
      district ||
      localityDisplayName ||
      (displayName ? displayName.split(',')[0].trim() : 'Location');

    // Build clean formatted address
    let formatted = cleanStr(displayName);
    if (!formatted) {
      const parts = [
        houseNumber,
        road,
        neighbourhood,
        suburb,
        village,
        town,
        city,
        district,
        state,
        rawPostcode,
        country,
      ].filter(Boolean);
      formatted = parts.join(', ');
    }

    return {
      coordinates: {
        latitude,
        longitude,
      },
      accuracy: typeof accuracy === 'number' && isFinite(accuracy) ? accuracy : null,
      address: canonicalAddress,
      formattedAddress: formatted || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
      localityDisplayName,
      cityDisplayName,
      source,
      confidence: typeof confidence === 'number' ? confidence : (source === 'gps' ? 1.0 : 0.9),
      timestamp,
      rawProviderData: {
        provider,
        placeId: cleanStr(placeId),
        osmId: cleanStr(osmId),
        rawAddress,
        rawDisplayName: cleanStr(displayName),
      },
    };
  }
}

function cleanStr(val: unknown): string | undefined {
  if (typeof val !== 'string') {
    if (typeof val === 'number') return String(val).trim();
    return undefined;
  }
  const trimmed = val.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
