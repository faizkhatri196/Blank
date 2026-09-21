import React from 'react';
import { LocationMapPicker } from './LocationMapPicker';

export interface CoverageMapPickerProps {
  latitude?: number | null;
  longitude?: number | null;
  radiusKm?: number;
  locationName?: string;
  formattedAddress?: string;
  onChange: (loc: {
    latitude: number;
    longitude: number;
    radiusKm: number;
    locationName: string;
    formattedAddress: string;
    postalCode?: string;
    city?: string;
    state?: string;
    country?: string;
  }) => void;
  showRadius?: boolean;
  minRadius?: number;
  maxRadius?: number;
  className?: string;
}

export const CoverageMapPicker: React.FC<CoverageMapPickerProps> = (props) => {
  return <LocationMapPicker {...props} />;
};

export default CoverageMapPicker;
