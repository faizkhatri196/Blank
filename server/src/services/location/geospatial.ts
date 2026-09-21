import {
  GeoPoint,
  GeoJSONPoint,
  toGeoJSONPoint,
  fromGeoJSONPoint,
} from './types';

export { GeoPoint, GeoJSONPoint, toGeoJSONPoint, fromGeoJSONPoint };

const EARTH_RADIUS_KM = 6371; // Earth's mean radius in kilometers

/**
 * Calculates great-circle distance between two geographic coordinates using the Haversine formula.
 *
 * Semantic contract:
 * calculateDistance(customerLatitude, customerLongitude, coverageLatitude, coverageLongitude)
 *
 * lat1 = customer latitude
 * lon1 = customer longitude
 * lat2 = technician/coverage latitude
 * lon2 = technician/coverage longitude
 *
 * @returns Distance in kilometers (km)
 */
export function calculateDistance(
  customerLatitude: number,
  customerLongitude: number,
  coverageLatitude: number,
  coverageLongitude: number
): number {
  if (customerLatitude === coverageLatitude && customerLongitude === coverageLongitude) {
    return 0;
  }

  const toRad = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = toRad(coverageLatitude - customerLatitude);
  const dLon = toRad(coverageLongitude - customerLongitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(customerLatitude)) *
      Math.cos(toRad(coverageLatitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Great-circle distance between two geographic coordinates using Haversine formula.
 * Alias for calculateDistance adhering to existing caller signatures.
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  return calculateDistance(lat1, lon1, lat2, lon2);
}

/**
 * Creates a MongoDB GeoJSON Point object from latitude and longitude.
 * Explicitly places longitude at index 0 and latitude at index 1: [longitude, latitude].
 */
export function createGeoPoint(latitude: number, longitude: number): GeoJSONPoint {
  return toGeoJSONPoint({ latitude: Number(latitude), longitude: Number(longitude) });
}

/**
 * Validates if coordinates are valid, non-null, real geographic coordinates.
 * Strictly guards against uninitialized (0, 0) defaults (Null Island in the Atlantic Ocean).
 */
export function isValidCoordinate(latitude?: number, longitude?: number): boolean {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') return false;
  if (isNaN(latitude) || isNaN(longitude)) return false;
  if (latitude < -90 || latitude > 90) return false;
  if (longitude < -180 || longitude > 180) return false;
  // Guard against uninitialized (0, 0) defaults (Null Island)
  if (Math.abs(latitude) < 0.0001 && Math.abs(longitude) < 0.0001) return false;
  return true;
}

/**
 * Checks if a GeoPoint object contains valid coordinates.
 */
export function isValidGeoPoint(point?: { latitude?: number; longitude?: number } | null): boolean {
  if (!point) return false;
  return isValidCoordinate(point.latitude, point.longitude);
}

/**
 * Analyzes stored GeoJSON coordinates against human-readable lat/lon fields
 * and geographic boundaries to detect inverted coordinate ordering or Null Island.
 */
export function detectCoordinateOrderIssue(
  geoJSONCoordinates?: [number, number],
  humanLat?: number,
  humanLon?: number
): string | undefined {
  if (!geoJSONCoordinates || !Array.isArray(geoJSONCoordinates) || geoJSONCoordinates.length < 2) {
    return undefined;
  }

  const [c0, c1] = geoJSONCoordinates;

  // 1. Check for uninitialized Null Island (0, 0)
  if (Math.abs(c0) < 0.0001 && Math.abs(c1) < 0.0001) {
    return 'CRITICAL: Coordinates are uninitialized (0, 0) Null Island in Atlantic Ocean.';
  }

  // 2. Check against human-readable lat/lon if both are provided
  if (typeof humanLat === 'number' && typeof humanLon === 'number' && Math.abs(humanLat - humanLon) > 0.01) {
    // Expected GeoJSON is [humanLon, humanLat]
    // If stored as [humanLat, humanLon], coordinates are inverted
    if (Math.abs(c0 - humanLat) < 0.0001 && Math.abs(c1 - humanLon) < 0.0001) {
      return `WARNING: Inverted GeoJSON coordinate order! Stored as [latitude, longitude] = [${c0}, ${c1}]. GeoJSON MUST be [longitude, latitude] = [${humanLon}, ${humanLat}].`;
    }
  }

  // 3. Range check for India coordinates (Lat 6..38 N, Lon 68..98 E)
  // If c0 is in latitude range (6..38) and c1 is in longitude range (68..98),
  // they were almost certainly passed as [lat, lon] instead of [lon, lat].
  if (c0 >= 6 && c0 <= 38 && c1 >= 68 && c1 <= 98) {
    return `WARNING: Suspicious coordinate order detected: [${c0}, ${c1}] has latitude (${c0}) at index 0 and longitude (${c1}) at index 1. GeoJSON format requires [longitude, latitude].`;
  }

  return undefined;
}
