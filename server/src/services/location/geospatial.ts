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
 * Creates a GeoJSON Point object from latitude and longitude.
 * Note: GeoJSON coordinates are ordered [longitude, latitude].
 */
export function createGeoPoint(latitude: number, longitude: number): GeoPoint {
  return {
    type: 'Point',
    coordinates: [Number(longitude), Number(latitude)],
  };
}

/**
 * Validates if coordinates are valid latitude and longitude.
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
 * Rejects (0,0), null, undefined, NaN, and infinite values.
 */
export function isValidApplicationCoordinate(latitude?: number | null, longitude?: number | null): boolean {
  if (latitude === null || latitude === undefined) return false;
  if (longitude === null || longitude === undefined) return false;
  if (!isValidCoordinate(latitude, longitude)) return false;
  if (latitude === 0 && longitude === 0) return false;
  return true;
}
