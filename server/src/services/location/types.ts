import { ServiceType } from '../../types';

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface GeoJSONPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude] strictly in MongoDB GeoJSON format
}

/**
 * Explicitly converts a human-readable GeoPoint { latitude, longitude }
 * to a MongoDB GeoJSON Point { type: 'Point', coordinates: [longitude, latitude] }.
 */
export function toGeoJSONPoint(point: GeoPoint): GeoJSONPoint {
  return {
    type: 'Point',
    coordinates: [Number(point.longitude), Number(point.latitude)],
  };
}

/**
 * Explicitly extracts a human-readable GeoPoint { latitude, longitude }
 * from a GeoJSON coordinate array [longitude, latitude].
 */
export function fromGeoJSONPoint(coordinates: [number, number]): GeoPoint {
  return {
    longitude: Number(coordinates[0]),
    latitude: Number(coordinates[1]),
  };
}

export interface LocationSearchResult {
  formattedAddress: string;
  city?: string;
  district?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  locality?: string;
  subLocality?: string;
  latitude: number;
  longitude: number;
  placeId?: string;
  provider: 'nominatim' | 'fuzzy' | 'custom' | 'google_maps' | 'company_coverage';
  confidence?: number;
  isSuggestionOnly?: boolean;
}

export interface CoverageAreaSnapshot {
  locationName?: string;
  formattedAddress: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  latitude: number;
  longitude: number;
  center: GeoJSONPoint;
  radiusKm: number;
  services: ServiceType[];
  active: boolean;
}

export interface CustomerLocationSnapshot {
  inputText?: string;
  formattedAddress: string;
  city?: string;
  district?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  latitude: number;
  longitude: number;
  provider?: string;
  placeId?: string;
  resolvedAt: Date;
}
