import mongoose from 'mongoose';
import { Company, ICompany } from '../../models/Company';
import { ServiceType } from '../../types';
import { calculateHaversineDistanceKm, isValidApplicationCoordinate } from './geospatial';

export interface CoverageCheckInput {
  latitude?: number | null;
  longitude?: number | null;
  city?: string | null;
  area?: string | null;
  pincode?: string | null;
  serviceType: ServiceType;
  requestedCompanyId?: string | mongoose.Types.ObjectId | null;
}

export interface CoverageMatchResult {
  covered: boolean;
  companyId?: mongoose.Types.ObjectId;
  companyName?: string;
  serviceType: ServiceType;
  matchedBy?: 'RADIUS' | 'PINCODE' | 'AREA' | 'CITY';
  distanceKm?: number;
  coverageRadiusKm?: number;
  coverageCenter?: { latitude: number; longitude: number };
  explanation: string;
}

export interface AvailableServicesResult {
  coverageAvailable: boolean;
  services: Array<{
    serviceType: ServiceType;
    companyId: string;
    companyName: string;
    matchedBy: 'RADIUS' | 'PINCODE' | 'AREA' | 'CITY';
    distanceKm?: number;
    coverageRadiusKm?: number;
  }>;
  availableServiceTypes: ServiceType[];
  message?: string;
}

/**
 * Authoritative, deterministic service coverage engine.
 * Used identically for both service discovery and final request validation.
 */
export async function resolveServiceCoverage(input: CoverageCheckInput): Promise<CoverageMatchResult> {
  const cleanCity = (input.city || '').replace(/\s*\(\d+\)\s*$/, '').split(',')[0].trim().toLowerCase();
  const cleanArea = (input.area || '').trim().toLowerCase();
  const cleanPincode = input.pincode ? String(input.pincode).trim() : undefined;
  const hasCustCoords = isValidApplicationCoordinate(input.latitude, input.longitude);

  const query: any = { active: true };
  if (input.requestedCompanyId) {
    query._id = input.requestedCompanyId;
  }

  const companies = await Company.find(query);

  for (const comp of companies) {
    const areas = comp.serviceAreas || [];

    for (const a of areas) {
      if (a.active === false) continue;

      const servicesForArea = a.services || comp.servicesSupported || ['SOLAR', 'AC'];
      if (!servicesForArea.includes(input.serviceType)) continue;

      const aLat = a.latitude ?? a.center?.coordinates?.[1];
      const aLon = a.longitude ?? a.center?.coordinates?.[0];
      const hasAreaCoords = isValidApplicationCoordinate(aLat, aLon);

      // 1. PRIMARY GEOGRAPHIC TRUTH: Coordinate distance vs. Configured Database Radius
      if (hasCustCoords && hasAreaCoords) {
        const distKm = calculateHaversineDistanceKm(input.latitude!, input.longitude!, aLat!, aLon!);
        const radiusKm = (typeof a.radiusKm === 'number' && a.radiusKm > 0)
          ? a.radiusKm
          : (typeof a.radius === 'number' && a.radius > 0)
          ? a.radius
          : null;

        if (radiusKm !== null) {
          if (distKm <= radiusKm) {
            return {
              covered: true,
              companyId: comp._id as mongoose.Types.ObjectId,
              companyName: comp.name,
              serviceType: input.serviceType,
              matchedBy: 'RADIUS',
              distanceKm: Math.round(distKm * 10) / 10,
              coverageRadiusKm: radiusKm,
              coverageCenter: { latitude: aLat!, longitude: aLon! },
              explanation: `Customer is ${(Math.round(distKm * 10) / 10)} km away, within configured ${radiusKm} km coverage radius.`,
            };
          }
          // Explicitly out of radius for this area — do NOT fall back to fuzzy string matching
          continue;
        }
      }

      // 2. EXPLICIT PINCODE MATCH
      if (cleanPincode && a.pincodes && a.pincodes.length > 0 && a.pincodes.includes(cleanPincode)) {
        return {
          covered: true,
          companyId: comp._id as mongoose.Types.ObjectId,
          companyName: comp.name,
          serviceType: input.serviceType,
          matchedBy: 'PINCODE',
          explanation: `Customer pincode ${cleanPincode} is explicitly covered.`,
        };
      }

      // 3. EXPLICIT LOCALITY / AREA MATCH
      if (a.areas && a.areas.length > 0) {
        const compAreas = a.areas.map((ar: string) => ar.trim().toLowerCase());
        const areaMatched = (cleanArea && compAreas.includes(cleanArea)) || (cleanCity && compAreas.includes(cleanCity));
        if (areaMatched) {
          return {
            covered: true,
            companyId: comp._id as mongoose.Types.ObjectId,
            companyName: comp.name,
            serviceType: input.serviceType,
            matchedBy: 'AREA',
            explanation: `Customer locality is explicitly listed in company service areas.`,
          };
        }
      }

      // 4. FALLBACK CITY MATCH (Only when coordinates are unavailable on at least one side)
      if (!hasCustCoords || !hasAreaCoords) {
        const aCityClean = (a.city || '').replace(/\s*\(\d+\)\s*$/, '').split(',')[0].trim().toLowerCase();
        if (cleanCity && aCityClean && aCityClean === cleanCity) {
          if (cleanPincode && a.pincodes && a.pincodes.length > 0 && !a.pincodes.includes(cleanPincode)) {
            continue; // Pincode mismatch inside city
          }
          return {
            covered: true,
            companyId: comp._id as mongoose.Types.ObjectId,
            companyName: comp.name,
            serviceType: input.serviceType,
            matchedBy: 'CITY',
            explanation: `Service location matches operating city (${a.city}).`,
          };
        }
      }
    }
  }

  return {
    covered: false,
    serviceType: input.serviceType,
    explanation: `No active company provides ${input.serviceType} coverage at the specified location.`,
  };
}

/**
 * Discover all services available at a given location across all service types.
 */
export async function discoverAvailableServices(location: {
  latitude?: number | null;
  longitude?: number | null;
  city?: string | null;
  area?: string | null;
  pincode?: string | null;
}): Promise<AvailableServicesResult> {
  const serviceTypes: ServiceType[] = ['SOLAR', 'AC'];
  const matchedServices: AvailableServicesResult['services'] = [];
  const coveredTypes = new Set<ServiceType>();

  for (const serviceType of serviceTypes) {
    const res = await resolveServiceCoverage({
      latitude: location.latitude,
      longitude: location.longitude,
      city: location.city,
      area: location.area,
      pincode: location.pincode,
      serviceType,
    });

    if (res.covered && res.companyId) {
      coveredTypes.add(serviceType);
      matchedServices.push({
        serviceType,
        companyId: res.companyId.toString(),
        companyName: res.companyName || 'Servora Partner',
        matchedBy: res.matchedBy!,
        distanceKm: res.distanceKm,
        coverageRadiusKm: res.coverageRadiusKm,
      });
    }
  }

  const coverageAvailable = matchedServices.length > 0;
  return {
    coverageAvailable,
    services: matchedServices,
    availableServiceTypes: Array.from(coveredTypes),
    message: coverageAvailable
      ? undefined
      : `Servora services are not currently available in ${location.city || 'this location'}.`,
  };
}
