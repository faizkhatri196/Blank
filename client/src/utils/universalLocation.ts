/**
 * UNIVERSAL LOCATION MODEL & ADDRESS PARSER (CLIENT)
 *
 * Strict Architectural Rules:
 * 1. ZERO hardcoded cities, towns, areas, or PIN codes.
 * 2. ZERO hardcoded default locations (no Ahmedabad, no Rajkot, etc.).
 * 3. Never invent or calculate a postal code. If missing from provider, postcode is null.
 * 4. Coordinate validation rejects [0,0] and out-of-range values.
 * 5. Universal multi-tier administrative mapping (village, town, suburb, city, district).
 */

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
    rawAddress?: Record<string, any>;
    rawDisplayName?: string;
  };
  // Backwards compatibility legacy fields
  city?: string;
  area?: string;
  locality?: string;
  pincode?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

/**
 * Validates a coordinate pair as a legitimate real-world geographic location.
 * Rejects (0,0), NaN, Infinity, and coordinates outside [-90..90, -180..180].
 */
export function isValidCoordinate(latitude?: unknown, longitude?: unknown): boolean {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') return false;
  if (!isFinite(latitude) || !isFinite(longitude)) return false;
  if (isNaN(latitude) || isNaN(longitude)) return false;
  if (latitude < -90 || latitude > 90) return false;
  if (longitude < -180 || longitude > 180) return false;
  // Reject (0,0) — Null Island
  if (latitude === 0 && longitude === 0) return false;
  return true;
}

function cleanStr(val: unknown): string | undefined {
  if (typeof val !== 'string') {
    if (typeof val === 'number') return String(val).trim();
    return undefined;
  }
  const trimmed = val.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export class ClientAddressParser {
  public static parse(params: {
    rawAddress?: Record<string, any>;
    displayName?: string;
    latitude: number;
    longitude: number;
    accuracy?: number | null;
    source: 'gps' | 'manual_search' | 'saved';
    provider?: string;
    placeId?: string;
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
      confidence,
      timestamp = new Date().toISOString(),
    } = params;

    if (!isValidCoordinate(latitude, longitude)) {
      return null;
    }

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

    // POSTCODE RULE: Strictly preserve provider result. If missing, null. NEVER invent.
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

    const localityDisplayName =
      suburb ||
      neighbourhood ||
      village ||
      town ||
      road ||
      undefined;

    const cityDisplayName =
      city ||
      town ||
      village ||
      suburb ||
      district ||
      localityDisplayName ||
      (displayName ? displayName.split(',')[0].trim() : 'Location');

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

    const loc: CanonicalLocation = {
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
        rawAddress,
        rawDisplayName: cleanStr(displayName),
      },
      // Backwards compatibility mappings
      city: cityDisplayName,
      area: localityDisplayName,
      locality: localityDisplayName,
      pincode: rawPostcode || undefined,
      state,
      country,
      latitude,
      longitude,
    };

    return loc;
  }
}
