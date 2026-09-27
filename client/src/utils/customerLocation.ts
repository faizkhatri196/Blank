import { CanonicalLocation } from './universalLocation';

export interface CustomerLocation {
  city: string;
  state?: string;
  country?: string;
  area?: string;
  pincode?: string;
  postcode?: string;
  houseNumber?: string;
  road?: string;
  neighbourhood?: string;
  suburb?: string;
  village?: string;
  town?: string;
  district?: string;
  latitude?: number;
  longitude?: number;
  formattedAddress?: string;
  source?: string;
  accuracy?: number | null;
  timestamp?: string;
  placeId?: string;
  canonical?: CanonicalLocation;
}

const GUEST_STORAGE_KEY = 'servora.customer.guest_location';

/**
 * Purge any legacy un-scoped location keys that might linger in user's browser
 */
export function purgeLegacyLocationKeys(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('servora_customer_city');
    localStorage.removeItem('servora_customer_pincode');
    localStorage.removeItem('servora.location');
    localStorage.removeItem('defaultLocation');
    localStorage.removeItem('currentCity');
  } catch {}
}

/**
 * Returns customer-scoped location storage key
 */
export function getScopedLocationKey(userId?: string): string {
  if (userId && String(userId).trim().length > 0) {
    return `servora.customer.location.${String(userId).trim()}`;
  }
  return GUEST_STORAGE_KEY;
}

/**
 * Retrieve explicitly saved customer location.
 * For a brand-new customer with no explicitly saved location, returns NULL.
 * Never defaults to Ahmedabad or any other city.
 */
export function getCustomerSavedLocation(userId?: string): CustomerLocation | null {
  if (typeof window === 'undefined') return null;
  purgeLegacyLocationKeys();

  try {
    const key = getScopedLocationKey(userId);
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const effectiveCity = (
      parsed.city ||
      parsed.town ||
      parsed.village ||
      parsed.district ||
      parsed.suburb ||
      (parsed.formattedAddress ? parsed.formattedAddress.split(',')[0].trim() : '')
    );

    if (effectiveCity && typeof effectiveCity === 'string' && effectiveCity.trim().length > 0) {
      const pin = parsed.postcode || parsed.pincode;
      return {
        city: effectiveCity.trim(),
        state: parsed.state ? String(parsed.state).trim() : undefined,
        country: parsed.country ? String(parsed.country).trim() : undefined,
        area: parsed.area ? String(parsed.area).trim() : undefined,
        pincode: pin ? String(pin).trim() : undefined,
        postcode: pin ? String(pin).trim() : undefined,
        houseNumber: parsed.houseNumber ? String(parsed.houseNumber).trim() : undefined,
        road: parsed.road ? String(parsed.road).trim() : undefined,
        neighbourhood: parsed.neighbourhood ? String(parsed.neighbourhood).trim() : undefined,
        suburb: parsed.suburb ? String(parsed.suburb).trim() : undefined,
        village: parsed.village ? String(parsed.village).trim() : undefined,
        town: parsed.town ? String(parsed.town).trim() : undefined,
        district: parsed.district ? String(parsed.district).trim() : undefined,
        latitude: typeof parsed.latitude === 'number' ? parsed.latitude : undefined,
        longitude: typeof parsed.longitude === 'number' ? parsed.longitude : undefined,
        accuracy: typeof parsed.accuracy === 'number' ? parsed.accuracy : null,
        source: parsed.source ? String(parsed.source) : 'saved',
        timestamp: parsed.timestamp ? String(parsed.timestamp) : undefined,
        formattedAddress: parsed.formattedAddress ? String(parsed.formattedAddress).trim() : undefined,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Save customer location explicitly selected or confirmed by the customer.
 */
export function saveCustomerLocation(location: CustomerLocation, userId?: string): void {
  if (typeof window === 'undefined') return;
  purgeLegacyLocationKeys();

  try {
    if (!location) return;
    const effectiveCity = (
      location.city ||
      location.town ||
      location.village ||
      location.district ||
      location.suburb ||
      (location.formattedAddress ? location.formattedAddress.split(',')[0].trim() : '')
    );

    if (!effectiveCity || !effectiveCity.trim()) return;

    const pin = location.postcode || location.pincode;
    const cleanLocation: CustomerLocation = {
      city: effectiveCity.trim(),
      state: location.state ? String(location.state).trim() : undefined,
      country: location.country ? String(location.country).trim() : undefined,
      area: location.area ? String(location.area).trim() : undefined,
      pincode: pin ? String(pin).trim() : undefined,
      postcode: pin ? String(pin).trim() : undefined,
      houseNumber: location.houseNumber ? String(location.houseNumber).trim() : undefined,
      road: location.road ? String(location.road).trim() : undefined,
      neighbourhood: location.neighbourhood ? String(location.neighbourhood).trim() : undefined,
      suburb: location.suburb ? String(location.suburb).trim() : undefined,
      village: location.village ? String(location.village).trim() : undefined,
      town: location.town ? String(location.town).trim() : undefined,
      district: location.district ? String(location.district).trim() : undefined,
      latitude: typeof location.latitude === 'number' ? location.latitude : undefined,
      longitude: typeof location.longitude === 'number' ? location.longitude : undefined,
      accuracy: typeof location.accuracy === 'number' ? location.accuracy : null,
      source: location.source ? String(location.source) : 'saved',
      timestamp: location.timestamp || new Date().toISOString(),
      formattedAddress: location.formattedAddress ? String(location.formattedAddress).trim() : undefined,
    };
    const key = getScopedLocationKey(userId);
    localStorage.setItem(key, JSON.stringify(cleanLocation));
  } catch {}
}

/**
 * Clear customer-scoped location on logout or account switch.
 */
export function clearCustomerLocation(userId?: string): void {
  if (typeof window === 'undefined') return;
  purgeLegacyLocationKeys();

  try {
    if (userId) {
      localStorage.removeItem(`servora.customer.location.${String(userId).trim()}`);
    }
    localStorage.removeItem(GUEST_STORAGE_KEY);
  } catch {}
}
