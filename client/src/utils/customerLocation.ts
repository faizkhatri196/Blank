export interface CustomerLocation {
  city: string;
  state?: string;
  country?: string;
  area?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  formattedAddress?: string;
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
    if (parsed && typeof parsed.city === 'string' && parsed.city.trim().length > 0) {
      return {
        city: parsed.city.trim(),
        state: parsed.state ? String(parsed.state).trim() : undefined,
        country: parsed.country ? String(parsed.country).trim() : undefined,
        area: parsed.area ? String(parsed.area).trim() : undefined,
        pincode: parsed.pincode ? String(parsed.pincode).trim() : undefined,
        latitude: typeof parsed.latitude === 'number' ? parsed.latitude : undefined,
        longitude: typeof parsed.longitude === 'number' ? parsed.longitude : undefined,
        formattedAddress: parsed.formattedAddress ? String(parsed.formattedAddress).trim() : undefined,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Save customer location explicitly selected by the customer.
 */
export function saveCustomerLocation(location: CustomerLocation, userId?: string): void {
  if (typeof window === 'undefined') return;
  purgeLegacyLocationKeys();

  try {
    if (!location || !location.city || !location.city.trim()) return;
    const cleanLocation: CustomerLocation = {
      city: location.city.trim(),
      state: location.state ? String(location.state).trim() : undefined,
      country: location.country ? String(location.country).trim() : undefined,
      area: location.area ? String(location.area).trim() : undefined,
      pincode: location.pincode ? String(location.pincode).trim() : undefined,
      latitude: typeof location.latitude === 'number' ? location.latitude : undefined,
      longitude: typeof location.longitude === 'number' ? location.longitude : undefined,
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
