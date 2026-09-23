import { ServiceType } from '../../types';

export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude] in GeoJSON format
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
  provider: 'nominatim' | 'fuzzy' | 'custom';
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
  center: GeoPoint;
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
