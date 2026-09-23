import { GeoPoint } from './types';

/**
 * Calculates great-circle distance between two geographic coordinates using Haversine formula.
 * @returns Distance in kilometers (km)
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (lat1 === lat2 && lon1 === lon2) return 0;

  const R = 6371; // Earth's mean radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Validates a coordinate pair as mathematically valid lat/lng.
 * NOTE: This does NOT reject (0,0). Use isValidApplicationCoordinate for that.
 */
export function isValidCoordinate(latitude?: number, longitude?: number): boolean {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') return false;
  if (!isFinite(latitude) || !isFinite(longitude)) return false;
  if (isNaN(latitude) || isNaN(longitude)) return false;
  if (latitude < -90 || latitude > 90) return false;
  if (longitude < -180 || longitude > 180) return false;
  return true;
}

/**
 * Validates a coordinate pair as a real application location.
 * Rejects (0,0) — the Gulf of Guinea — which is NEVER a legitimate SERVORA service location.
 * Rejects null/undefined/NaN/Infinity/-Infinity.
 * Use this for ALL customer, company, and technician location checks.
 */
export function isValidApplicationCoordinate(latitude?: number | null, longitude?: number | null): boolean {
  if (latitude === null || latitude === undefined) return false;
  if (longitude === null || longitude === undefined) return false;
  if (!isValidCoordinate(latitude, longitude)) return false;
  // Reject (0,0) — schema defaults that leaked into the database
  if (latitude === 0 && longitude === 0) return false;
  return true;
}

/**
 * Safely parses a numeric coordinate from any input type.
 * Returns null if invalid or results in (0,0).
 */
export function parseCoordinateSafe(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = typeof value === 'number' ? value : parseFloat(String(value));
  if (!isFinite(n) || isNaN(n)) return null;
  return n;
}

/**
 * Extract a validated [latitude, longitude] pair from an object.
 * Returns null if coordinates are missing, invalid, or are (0,0).
 */
export function extractValidCoords(obj: {
  latitude?: number | null;
  longitude?: number | null;
  center?: { coordinates?: [number, number] };
} | null | undefined): { latitude: number; longitude: number } | null {
  if (!obj) return null;

  // Direct fields take priority
  if (isValidApplicationCoordinate(obj.latitude, obj.longitude)) {
    return { latitude: obj.latitude!, longitude: obj.longitude! };
  }

  // GeoJSON center [longitude, latitude] — note the swapped order per GeoJSON spec
  if (obj.center?.coordinates && Array.isArray(obj.center.coordinates)) {
    const geoLon = obj.center.coordinates[0];
    const geoLat = obj.center.coordinates[1];
    if (isValidApplicationCoordinate(geoLat, geoLon)) {
      return { latitude: geoLat, longitude: geoLon };
    }
  }

  return null;
}

/**
 * Creates a GeoJSON Point object from latitude and longitude.
 * Note: GeoJSON coordinates are ordered [longitude, latitude].
 */
export function createGeoPoint(latitude: number, longitude: number): GeoPoint {
  return {
    type: 'Point',
    coordinates: [Number(longitude), Number(latitude)],
  };
}
