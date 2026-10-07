import mongoose from 'mongoose';
import { Company, ICompany } from '../../models/Company';
import { ServiceType } from '../../types';
import { calculateHaversineDistanceKm, isValidApplicationCoordinate } from './geospatial';
import { ServiceRegistry } from '../../config/serviceRegistry';

export interface CoverageCheckInput {
  latitude?: number | null;
  longitude?: number | null;
  city?: string | null;
  area?: string | null;
  pincode?: string | null;
  serviceType: ServiceType;
  requestedCompanyId?: string | mongoose.Types.ObjectId | null;
}

export interface CoverageMatchCandidate {
  companyId: mongoose.Types.ObjectId;
  companyName: string;
  serviceType: ServiceType;
  matchedBy: 'RADIUS' | 'PINCODE' | 'AREA' | 'CITY';
  tier: number; // 1: GPS RADIUS, 2: PINCODE, 3: AREA, 4: CITY
  distanceKm?: number;
  coverageRadiusKm?: number;
  coverageCenter?: { latitude: number; longitude: number };
  explanation: string;
  updatedAt?: Date;
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
  allMatches?: CoverageMatchCandidate[];
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
    providers: Array<{
      companyId: string;
      companyName: string;
      distanceKm?: number;
      coverageRadiusKm?: number;
      matchedBy: 'RADIUS' | 'PINCODE' | 'AREA' | 'CITY';
    }>;
  }>;
  availableServiceTypes: ServiceType[];
  message?: string;
}

/**
 * Authoritative, deterministic service coverage engine.
 * Used identically for both service discovery and final request validation.
 * Fairly evaluates all active companies, prioritizing coordinate proximity over fallback text.
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
  const candidates: CoverageMatchCandidate[] = [];

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
            candidates.push({
              companyId: comp._id as mongoose.Types.ObjectId,
              companyName: comp.name,
              serviceType: input.serviceType,
              matchedBy: 'RADIUS',
              tier: 1,
              distanceKm: Math.round(distKm * 10) / 10,
              coverageRadiusKm: radiusKm,
              coverageCenter: { latitude: aLat!, longitude: aLon! },
              explanation: `Customer is ${(Math.round(distKm * 10) / 10)} km away, within configured ${radiusKm} km coverage radius.`,
              updatedAt: comp.updatedAt,
            });
            break; // Move to next company (already matched best tier)
          }

          // If outside radius, check whether the area explicitly covers this locality or pincode
          const compAreas = (a.areas || []).map((ar: string) => ar.trim().toLowerCase());
          const areaExplicitlyListed = Boolean(
            (cleanArea && compAreas.includes(cleanArea)) || (cleanCity && compAreas.includes(cleanCity))
          );
          const pincodeExplicitlyListed = Boolean(cleanPincode && a.pincodes && a.pincodes.includes(cleanPincode));

          if (!areaExplicitlyListed && !pincodeExplicitlyListed) {
            continue;
          }
        }
      }

      // 2. EXPLICIT PINCODE MATCH
      if (cleanPincode && a.pincodes && a.pincodes.length > 0 && a.pincodes.includes(cleanPincode)) {
        candidates.push({
          companyId: comp._id as mongoose.Types.ObjectId,
          companyName: comp.name,
          serviceType: input.serviceType,
          matchedBy: 'PINCODE',
          tier: 2,
          explanation: `Customer pincode ${cleanPincode} is explicitly covered.`,
          updatedAt: comp.updatedAt,
        });
        break;
      }

      // 3. EXPLICIT LOCALITY / AREA MATCH
      if (a.areas && a.areas.length > 0) {
        const compAreas = a.areas.map((ar: string) => ar.trim().toLowerCase());
        const areaMatched = (cleanArea && compAreas.includes(cleanArea)) || (cleanCity && compAreas.includes(cleanCity));
        if (areaMatched) {
          candidates.push({
            companyId: comp._id as mongoose.Types.ObjectId,
            companyName: comp.name,
            serviceType: input.serviceType,
            matchedBy: 'AREA',
            tier: 3,
            explanation: `Customer locality is explicitly listed in company service areas.`,
            updatedAt: comp.updatedAt,
          });
          break;
        }
      }

      // 4. FALLBACK CITY MATCH (Only when coordinates are unavailable on at least one side)
      if (!hasCustCoords || !hasAreaCoords) {
        const aCityClean = (a.city || '').replace(/\s*\(\d+\)\s*$/, '').split(',')[0].trim().toLowerCase();
        if (cleanCity && aCityClean && aCityClean === cleanCity) {
          if (cleanPincode && a.pincodes && a.pincodes.length > 0 && !a.pincodes.includes(cleanPincode)) {
            continue; // Pincode mismatch inside city
          }
          candidates.push({
            companyId: comp._id as mongoose.Types.ObjectId,
            companyName: comp.name,
            serviceType: input.serviceType,
            matchedBy: 'CITY',
            tier: 4,
            explanation: `Service location matches operating city (${a.city}).`,
            updatedAt: comp.updatedAt,
          });
          break;
        }
      }
    }
  }

  if (candidates.length === 0) {
    return {
      covered: false,
      serviceType: input.serviceType,
      explanation: `No active company provides ${input.serviceType} coverage at the specified location.`,
    };
  }

  // Deduplicate by companyId, keeping the best tier & distance for each company
  const companyMap = new Map<string, CoverageMatchCandidate>();
  for (const c of candidates) {
    const key = c.companyId.toString();
    const existing = companyMap.get(key);
    if (!existing) {
      companyMap.set(key, c);
    } else {
      if (c.tier < existing.tier || (c.tier === existing.tier && (c.distanceKm ?? Infinity) < (existing.distanceKm ?? Infinity))) {
        companyMap.set(key, c);
      }
    }
  }

  const distinctCandidates = Array.from(companyMap.values());

  // Rank candidates:
  // 1. Requested company ID takes absolute priority if present
  // 2. Lower tier wins (Tier 1 GPS RADIUS > Tier 2 PINCODE > Tier 3 AREA > Tier 4 CITY)
  // 3. For Tier 1 (RADIUS), closest distanceKm wins
  // 4. For same tier/distance, most recently updated company wins
  const requestedIdStr = input.requestedCompanyId ? input.requestedCompanyId.toString() : null;

  distinctCandidates.sort((a, b) => {
    if (requestedIdStr) {
      if (a.companyId.toString() === requestedIdStr) return -1;
      if (b.companyId.toString() === requestedIdStr) return 1;
    }

    if (a.tier !== b.tier) {
      return a.tier - b.tier;
    }

    if (a.tier === 1 && typeof a.distanceKm === 'number' && typeof b.distanceKm === 'number') {
      return a.distanceKm - b.distanceKm;
    }

    const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return timeB - timeA;
  });

  const best = distinctCandidates[0];

  return {
    covered: true,
    companyId: best.companyId,
    companyName: best.companyName,
    serviceType: best.serviceType,
    matchedBy: best.matchedBy,
    distanceKm: best.distanceKm,
    coverageRadiusKm: best.coverageRadiusKm,
    coverageCenter: best.coverageCenter,
    explanation: best.explanation,
    allMatches: distinctCandidates,
  };
}

/**
 * Discover all services available at a given location across all service types.
 * Returns all matching certified providers per service type.
 */
export async function discoverAvailableServices(location: {
  latitude?: number | null;
  longitude?: number | null;
  city?: string | null;
  area?: string | null;
  pincode?: string | null;
  requestedCompanyId?: string | mongoose.Types.ObjectId | null;
}): Promise<AvailableServicesResult> {
  const serviceTypes: ServiceType[] = ServiceRegistry.getAllServices().map((s) => s.serviceType);
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
      requestedCompanyId: location.requestedCompanyId,
    });

    if (res.covered && res.companyId) {
      coveredTypes.add(serviceType);
      const providers = (res.allMatches || []).map((m) => ({
        companyId: m.companyId.toString(),
        companyName: m.companyName || 'Servora Partner',
        distanceKm: m.distanceKm,
        coverageRadiusKm: m.coverageRadiusKm,
        matchedBy: m.matchedBy,
      }));

      matchedServices.push({
        serviceType,
        companyId: res.companyId.toString(),
        companyName: res.companyName || 'Servora Partner',
        matchedBy: res.matchedBy!,
        distanceKm: res.distanceKm,
        coverageRadiusKm: res.coverageRadiusKm,
        providers: providers.length > 0
          ? providers
          : [{
              companyId: res.companyId.toString(),
              companyName: res.companyName || 'Servora Partner',
              distanceKm: res.distanceKm,
              coverageRadiusKm: res.coverageRadiusKm,
              matchedBy: res.matchedBy!,
            }],
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
