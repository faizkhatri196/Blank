import mongoose from 'mongoose';
import { Company, ICompany } from '../models/Company';
import { Technician, ITechnician } from '../models/Technician';
import { ServiceType } from '../types';
import {
  isValidCoordinate,
  fromGeoJSONPoint,
  toGeoJSONPoint,
  detectCoordinateOrderIssue,
} from './location/geospatial';

export interface ValidateTechnicianCoverageParams {
  technicianId?: string | mongoose.Types.ObjectId;
  customerLatitude: number;
  customerLongitude: number;
  serviceId?: ServiceType;
  serviceType?: ServiceType;
  companyId?: string | mongoose.Types.ObjectId;
  customerAddress?: string;
  ticketId?: string | mongoose.Types.ObjectId;
}

export interface EvaluatedAreaSummary {
  areaId: string;
  areaName: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  radiusKm: number;
  withinRadius: boolean;
  serviceMatches: boolean;
  active: boolean;
  source: 'technician_base_location' | 'company_service_area';
}

export interface TechnicianCoverageValidationResult {
  eligible: boolean;
  reason?: string;
  distanceKm: number;
  radiusKm: number;
  coverageArea?: {
    id: string;
    name?: string;
    latitude: number;
    longitude: number;
    radiusKm: number;
    address?: string;
  };
  technician?: {
    id: string;
    name: string;
    latitude?: number;
    longitude?: number;
    baseAddress?: string;
    coverageRadiusKm: number;
    serviceTypes: ServiceType[];
  };
  coordinateSource: {
    customer: string;
    technician: string;
  };
  allAreasEvaluated?: EvaluatedAreaSummary[];
  coordinateOrderWarning?: string;
}


const EARTH_RADIUS_KM = 6371;

/**
 * Great-circle distance between two geographic coordinates using Haversine formula.
 * Returns full floating-point precision in kilometers (km).
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (lat1 === lat2 && lon1 === lon2) return 0;

  const toRad = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Authoritative great-circle distance between two geographic coordinates using Haversine formula.
 *
 * Semantic contract:
 * calculateDistance(customerLatitude, customerLongitude, coverageLatitude, coverageLongitude)
 *
 * lat1 = customer latitude
 * lon1 = customer longitude
 * lat2 = technician/coverage latitude
 * lon2 = technician/coverage longitude
 *
 * Returns distance in kilometers (km).
 */
export function calculateDistance(
  customerLatitude: number,
  customerLongitude: number,
  coverageLatitude: number,
  coverageLongitude: number
): number {
  return calculateHaversineDistance(
    customerLatitude,
    customerLongitude,
    coverageLatitude,
    coverageLongitude
  );
}

/**
 * Independent distance calculation using the Spherical Law of Cosines.
 * Used for independent mathematical cross-verification.
 */
export function calculateSphericalLawOfCosinesDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (lat1 === lat2 && lon1 === lon2) return 0;

  const toRad = (degrees: number) => (degrees * Math.PI) / 180;
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const deltaLambda = toRad(lon2 - lon1);

  const cosDistance =
    Math.sin(phi1) * Math.sin(phi2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

  // Clamp cosine to [-1, 1] to avoid domain errors
  const clampedCos = Math.max(-1, Math.min(1, cosDistance));
  return Math.acos(clampedCos) * EARTH_RADIUS_KM;
}

export interface AreaCoverageEvaluation {
  companyId: string;
  companyName: string;
  areaId: string;
  areaName: string;
  centerLatitude: number;
  centerLongitude: number;
  radiusKm: number;
  distanceKm: number;
  withinRadius: boolean;
  active: boolean;
  services: ServiceType[];
  serviceMatches: boolean;
  reason?: string;
}

export interface ServiceCoverageGroup {
  serviceType: ServiceType;
  name: string;
  description: string;
  companies: Array<{
    companyId: string;
    companyName: string;
    areaId: string;
    distanceKm: number;
    radiusKm: number;
  }>;
}

export interface CoverageEvaluationResult {
  coverageAvailable: boolean;
  services: ServiceCoverageGroup[];
  coverageAreas: AreaCoverageEvaluation[];
  distances: number[];
  customerCoordinates?: {
    latitude: number;
    longitude: number;
  };
  message?: string;
}

export interface TechnicianCoverageEvaluation {
  customer: {
    address?: string;
    latitude: number;
    longitude: number;
  };
  technician: {
    id: string;
    name: string;
    baseAddress?: string;
    latitude?: number;
    longitude?: number;
    geoJSONCoordinates?: [number, number];
    coverageRadiusKm: number;
    currentLocation?: {
      latitude?: number;
      longitude?: number;
      address?: string;
      timestamp?: Date;
    };
  };
  calculation: {
    calculatedDistanceKm: number;
    covered: boolean;
    requestedService?: ServiceType;
    reason?: string;
  };
  coordinateOrderWarning?: string;
}

export class CoverageService {
  /**
   * Evaluates single area coverage against customer coordinates.
   * Boundary rule: distanceKm <= radiusKm is covered.
   */
  public static checkAreaCoverage(
    customerLat: number,
    customerLon: number,
    area: {
      _id?: any;
      locationName?: string;
      formattedAddress?: string;
      city?: string;
      latitude?: number;
      longitude?: number;
      center?: { type: string; coordinates: [number, number] };
      radiusKm?: number;
      radius?: number;
      services?: ServiceType[];
      active?: boolean;
    },
    companyId: string = '',
    companyName: string = '',
    requestedServiceType?: ServiceType
  ): AreaCoverageEvaluation {
    const areaLat = area.latitude ?? (area.center?.coordinates ? area.center.coordinates[1] : undefined);
    const areaLon = area.longitude ?? (area.center?.coordinates ? area.center.coordinates[0] : undefined);
    const radiusKm = area.radiusKm ?? area.radius;
    const areaId = area._id ? area._id.toString() : '';
    const areaName = area.locationName || area.city || area.formattedAddress || 'Service Area';
    const services = (area.services && area.services.length > 0 ? area.services : []) as ServiceType[];
    const isActive = area.active !== false;

    if (!isValidCoordinate(customerLat, customerLon)) {
      return {
        companyId,
        companyName,
        areaId,
        areaName,
        centerLatitude: areaLat || 0,
        centerLongitude: areaLon || 0,
        radiusKm: radiusKm || 0,
        distanceKm: Infinity,
        withinRadius: false,
        active: isActive,
        services,
        serviceMatches: false,
        reason: 'LOCATION_COORDINATES_REQUIRED',
      };
    }

    if (!isValidCoordinate(areaLat, areaLon)) {
      return {
        companyId,
        companyName,
        areaId,
        areaName,
        centerLatitude: 0,
        centerLongitude: 0,
        radiusKm: radiusKm || 0,
        distanceKm: Infinity,
        withinRadius: false,
        active: isActive,
        services,
        serviceMatches: false,
        reason: 'COVERAGE_COORDINATES_MISSING',
      };
    }

    if (typeof radiusKm !== 'number' || radiusKm <= 0) {
      return {
        companyId,
        companyName,
        areaId,
        areaName,
        centerLatitude: areaLat!,
        centerLongitude: areaLon!,
        radiusKm: 0,
        distanceKm: Infinity,
        withinRadius: false,
        active: isActive,
        services,
        serviceMatches: false,
        reason: 'INVALID_CONFIGURED_RADIUS',
      };
    }

    const distanceKm = calculateHaversineDistance(customerLat, customerLon, areaLat!, areaLon!);
    const withinRadius = distanceKm <= radiusKm;
    const serviceMatches = requestedServiceType ? services.includes(requestedServiceType) : services.length > 0;

    return {
      companyId,
      companyName,
      areaId,
      areaName,
      centerLatitude: areaLat!,
      centerLongitude: areaLon!,
      radiusKm,
      distanceKm,
      withinRadius,
      active: isActive,
      services,
      serviceMatches,
      reason: !isActive
        ? 'AREA_INACTIVE'
        : !withinRadius
        ? `OUTSIDE_RADIUS (${distanceKm.toFixed(2)} km > ${radiusKm} km)`
        : !serviceMatches
        ? 'SERVICE_NOT_SUPPORTED_IN_AREA'
        : undefined,
    };
  }

  /**
   * Authoritative coverage evaluation across all active companies and their service areas.
   * Evaluates EVERY active service area independently.
   */
  public static async evaluateCoverage(
    customerLat: number,
    customerLon: number,
    requestedServiceType?: ServiceType,
    targetCompanyId?: string
  ): Promise<CoverageEvaluationResult> {
    if (!isValidCoordinate(customerLat, customerLon)) {
      return {
        coverageAvailable: false,
        services: [],
        coverageAreas: [],
        distances: [],
        customerCoordinates: { latitude: customerLat, longitude: customerLon },
        message: 'Valid latitude (-90..90) and longitude (-180..180) are required for coverage calculation.',
      };
    }

    const query: any = { active: true };
    if (targetCompanyId) {
      query._id = targetCompanyId;
    }

    const companies = await Company.find(query).lean<ICompany[]>();

    const allAreaEvaluations: AreaCoverageEvaluation[] = [];
    const serviceProvidersMap = new Map<ServiceType, Array<{
      companyId: string;
      companyName: string;
      areaId: string;
      distanceKm: number;
      radiusKm: number;
    }>>();

    for (const company of companies) {
      const companyIdStr = company._id ? company._id.toString() : '';
      const companyNameStr = company.name || 'Company';
      const areas = company.serviceAreas || [];

      for (const area of areas) {
        if (area.active === false) {
          continue;
        }

        const evaluation = this.checkAreaCoverage(
          customerLat,
          customerLon,
          area,
          companyIdStr,
          companyNameStr,
          requestedServiceType
        );

        allAreaEvaluations.push(evaluation);

        if (evaluation.withinRadius && evaluation.active) {
          for (const service of evaluation.services) {
            if (requestedServiceType && service !== requestedServiceType) {
              continue;
            }

            const existing = serviceProvidersMap.get(service) || [];
            existing.push({
              companyId: companyIdStr,
              companyName: companyNameStr,
              areaId: evaluation.areaId,
              distanceKm: evaluation.distanceKm,
              radiusKm: evaluation.radiusKm,
            });
            serviceProvidersMap.set(service, existing);
          }
        }
      }
    }

    const availableServices: ServiceCoverageGroup[] = [];
    const distances: number[] = [];

    const SERVICE_DESCRIPTIONS: Record<ServiceType, { name: string; description: string }> = {
      SOLAR: {
        name: 'Solar Photovoltaic Maintenance & O&M',
        description: 'Comprehensive rooftop & utility solar diagnostics, inverter triage, and maintenance.',
      },
      AC: {
        name: 'Air Conditioning & HVAC Service',
        description: 'Commercial & residential AC diagnostics, gas charging, compressor repairs, and seasonal AMC.',
      },
    };

    for (const [serviceType, providers] of serviceProvidersMap.entries()) {
      if (providers.length > 0) {
        providers.sort((a, b) => a.distanceKm - b.distanceKm);
        distances.push(...providers.map((p) => Math.round(p.distanceKm * 100) / 100));

        const info = SERVICE_DESCRIPTIONS[serviceType] || {
          name: serviceType,
          description: `${serviceType} service coverage`,
        };

        availableServices.push({
          serviceType,
          name: info.name,
          description: info.description,
          companies: providers,
        });
      }
    }

    const coverageAvailable = availableServices.length > 0;

    return {
      coverageAvailable,
      services: availableServices,
      coverageAreas: allAreaEvaluations,
      distances,
      customerCoordinates: { latitude: customerLat, longitude: customerLon },
      message: coverageAvailable
        ? undefined
        : 'No active service coverage was found at this location.',
    };
  }

  /**
   * Authoritative technician operating-radius coverage evaluation.
   *
   * Semantic rules:
   * 1. Customer coordinates: (customerLat, customerLon).
   * 2. Technician coordinates come strictly from technician.baseLocation.
   *    currentLocation is telemetry ONLY and is NEVER used for coverage determination.
   * 3. GeoJSON coordinates are checked for canonical [longitude, latitude] ordering.
   * 4. Distance is computed using calculateDistance(customerLat, customerLon, techLat, techLon).
   * 5. Boundary rule: distanceKm <= technician.coverageRadiusKm (inclusive).
   * 6. Radius comes from the database record (technician.coverageRadiusKm).
   */
  public static checkTechnicianCoverage(
    customerLat: number,
    customerLon: number,
    technician: any,
    requestedServiceType?: ServiceType,
    customerAddress?: string
  ): TechnicianCoverageEvaluation {
    const techId = technician?._id ? technician._id.toString() : technician?.id || '';
    const techName = technician?.name || 'Technician';
    const baseLoc = technician?.baseLocation;
    const baseAddress = baseLoc?.formattedAddress || baseLoc?.city || 'Technician Base Location';
    const coverageRadiusKm =
      typeof technician?.coverageRadiusKm === 'number' && technician.coverageRadiusKm > 0
        ? technician.coverageRadiusKm
        : 20;

    // Real-time telemetry metadata (strictly informational, NEVER used for coverage calculation)
    const telemetry = technician?.currentLocation
      ? {
          latitude: technician.currentLocation.latitude,
          longitude: technician.currentLocation.longitude,
          address: technician.currentLocation.address,
          timestamp: technician.currentLocation.timestamp,
        }
      : undefined;

    // Customer coordinates check
    if (!isValidCoordinate(customerLat, customerLon)) {
      return {
        customer: { address: customerAddress, latitude: customerLat, longitude: customerLon },
        technician: {
          id: techId,
          name: techName,
          baseAddress,
          latitude: baseLoc?.latitude,
          longitude: baseLoc?.longitude,
          geoJSONCoordinates: baseLoc?.center?.coordinates,
          coverageRadiusKm,
          currentLocation: telemetry,
        },
        calculation: {
          calculatedDistanceKm: Infinity,
          covered: false,
          requestedService: requestedServiceType,
          reason: 'CUSTOMER_COORDINATES_INVALID',
        },
      };
    }

    // Resolve technician base coordinates:
    // 1. Check human-readable baseLocation.latitude & baseLocation.longitude
    // 2. Check GeoJSON baseLocation.center.coordinates [longitude, latitude]
    let techLat: number | undefined = undefined;
    let techLon: number | undefined = undefined;
    const storedGeoJSON = baseLoc?.center?.coordinates as [number, number] | undefined;

    if (isValidCoordinate(baseLoc?.latitude, baseLoc?.longitude)) {
      techLat = baseLoc.latitude;
      techLon = baseLoc.longitude;
    } else if (storedGeoJSON && Array.isArray(storedGeoJSON) && storedGeoJSON.length >= 2) {
      const pt = fromGeoJSONPoint(storedGeoJSON);
      if (isValidCoordinate(pt.latitude, pt.longitude)) {
        techLat = pt.latitude;
        techLon = pt.longitude;
      }
    }

    // Inspect GeoJSON coordinates for coordinate-order issues ([lat, lon] instead of [lon, lat])
    const coordinateOrderWarning = detectCoordinateOrderIssue(
      storedGeoJSON,
      baseLoc?.latitude,
      baseLoc?.longitude
    );

    if (!isValidCoordinate(techLat, techLon)) {
      return {
        customer: { address: customerAddress, latitude: customerLat, longitude: customerLon },
        technician: {
          id: techId,
          name: techName,
          baseAddress,
          latitude: techLat,
          longitude: techLon,
          geoJSONCoordinates: storedGeoJSON,
          coverageRadiusKm,
          currentLocation: telemetry,
        },
        calculation: {
          calculatedDistanceKm: Infinity,
          covered: false,
          requestedService: requestedServiceType,
          reason: coordinateOrderWarning || 'TECHNICIAN_BASE_LOCATION_COORDINATES_MISSING_OR_INVALID',
        },
        coordinateOrderWarning,
      };
    }

    // Authoritative Haversine distance with standard float boundary tolerance (1mm)
    const distanceKm = calculateDistance(customerLat, customerLon, techLat!, techLon!);
    const withinRadius = distanceKm <= coverageRadiusKm || Math.abs(distanceKm - coverageRadiusKm) < 1e-6;

    // Service certification check
    const techServices = Array.isArray(technician?.serviceTypes) ? technician.serviceTypes : [];
    const serviceMatches = requestedServiceType ? techServices.includes(requestedServiceType) : true;
    const isActive = technician?.active !== false;

    const covered = withinRadius && serviceMatches && isActive;

    let reason: string | undefined = undefined;
    if (!isActive) {
      reason = 'TECHNICIAN_INACTIVE';
    } else if (!withinRadius) {
      reason = `OUTSIDE_OPERATING_RADIUS (${distanceKm.toFixed(2)} km > ${coverageRadiusKm} km)`;
    } else if (!serviceMatches) {
      reason = `SERVICE_NOT_CERTIFIED (${requestedServiceType} not supported by technician)`;
    }

    return {
      customer: {
        address: customerAddress,
        latitude: customerLat,
        longitude: customerLon,
      },
      technician: {
        id: techId,
        name: techName,
        baseAddress,
        latitude: techLat!,
        longitude: techLon!,
        geoJSONCoordinates: storedGeoJSON || [techLon!, techLat!],
        coverageRadiusKm,
        currentLocation: telemetry,
      },
      calculation: {
        calculatedDistanceKm: Math.round(distanceKm * 100) / 100,
        covered,
        requestedService: requestedServiceType,
        reason,
      },
      coordinateOrderWarning,
    };
  }

  /**
   * Diagnostic inspector for managers and developers.
   * Returns complete real runtime evaluation details adhering to the generic diagnostic contract.
   */
  public static async diagnoseCoverage(
    customerLat: number,
    customerLon: number,
    companyId?: string,
    serviceType?: ServiceType,
    technicianId?: string,
    customerMeta?: { city?: string; area?: string; pincode?: string; address?: string } | string
  ): Promise<{
    customer: {
      latitude: number;
      longitude: number;
      city?: string;
      area?: string;
      pincode?: string;
      address?: string;
    };
    technician?: {
      id: string;
      name: string;
    };
    coverage: {
      id: string;
      latitude: number;
      longitude: number;
      area?: string;
      city?: string;
      radiusKm: number;
      services: ServiceType[];
      active: boolean;
    };
    distanceKm: number;
    withinRadius: boolean;
    serviceAvailable: boolean;
    coordinateSource: 'technician_base_location' | 'company_service_area';
    coordinateOrderWarning?: string;
    areas: AreaCoverageEvaluation[];
    coverageAvailable: boolean;
    matchingServices: ServiceType[];
    technicianEvaluation?: TechnicianCoverageEvaluation;
  }> {
    const meta = typeof customerMeta === 'string' ? { address: customerMeta } : (customerMeta || {});
    const customerAddress = meta.address;

    const result = await this.evaluateCoverage(customerLat, customerLon, serviceType, companyId);
    const matchingServices = result.services.map((s) => s.serviceType);

    let technicianEvaluation: TechnicianCoverageEvaluation | undefined = undefined;
    let techSummary: { id: string; name: string } | undefined = undefined;
    let coverageData: {
      id: string;
      latitude: number;
      longitude: number;
      area?: string;
      city?: string;
      radiusKm: number;
      services: ServiceType[];
      active: boolean;
    };
    let distanceKm = Infinity;
    let withinRadius = false;
    let serviceAvailable = false;
    let coordinateSource: 'technician_base_location' | 'company_service_area' = 'company_service_area';
    let coordinateOrderWarning: string | undefined = undefined;

    if (technicianId) {
      const tech = await Technician.findById(technicianId).lean();
      if (tech) {
        techSummary = {
          id: (tech._id || technicianId).toString(),
          name: tech.name,
        };
        technicianEvaluation = this.checkTechnicianCoverage(
          customerLat,
          customerLon,
          tech,
          serviceType,
          customerAddress
        );

        coordinateSource = 'technician_base_location';
        coordinateOrderWarning = technicianEvaluation.coordinateOrderWarning;
        distanceKm = technicianEvaluation.calculation.calculatedDistanceKm;
        withinRadius = technicianEvaluation.calculation.covered;
        serviceAvailable = technicianEvaluation.calculation.covered;

        coverageData = {
          id: (tech as any).baseLocation?.placeId || (tech._id || technicianId).toString(),
          latitude: technicianEvaluation.technician.latitude || 0,
          longitude: technicianEvaluation.technician.longitude || 0,
          area: (tech as any).baseLocation?.area || (tech as any).baseLocation?.city,
          city: (tech as any).baseLocation?.city,
          radiusKm: technicianEvaluation.technician.coverageRadiusKm,
          services: tech.serviceTypes || [],
          active: tech.active !== false,
        };
      } else {
        coverageData = {
          id: 'unknown',
          latitude: 0,
          longitude: 0,
          radiusKm: 0,
          services: [],
          active: false,
        };
      }
    } else {
      // Pick best covering area or closest area from company evaluation
      const coveringArea = result.coverageAreas.find((a) => a.withinRadius && a.serviceMatches);
      const closestArea = result.coverageAreas.slice().sort((a, b) => a.distanceKm - b.distanceKm)[0];
      const selectedArea = coveringArea || closestArea;

      coordinateSource = 'company_service_area';
      if (selectedArea) {
        distanceKm = Math.round(selectedArea.distanceKm * 100) / 100;
        withinRadius = selectedArea.withinRadius;
        serviceAvailable = selectedArea.withinRadius && selectedArea.serviceMatches;
        coverageData = {
          id: selectedArea.areaId,
          latitude: selectedArea.centerLatitude,
          longitude: selectedArea.centerLongitude,
          area: selectedArea.areaName,
          city: selectedArea.areaName,
          radiusKm: selectedArea.radiusKm,
          services: selectedArea.services,
          active: selectedArea.active,
        };
      } else {
        coverageData = {
          id: 'none',
          latitude: 0,
          longitude: 0,
          radiusKm: 0,
          services: [],
          active: false,
        };
      }
    }

    return {
      customer: {
        latitude: customerLat,
        longitude: customerLon,
        city: meta.city,
        area: meta.area,
        pincode: meta.pincode,
        address: customerAddress,
      },
      technician: techSummary,
      coverage: coverageData,
      distanceKm,
      withinRadius,
      serviceAvailable,
      coordinateSource,
      coordinateOrderWarning,
      areas: result.coverageAreas,
      coverageAvailable: result.coverageAvailable,
      matchingServices,
      technicianEvaluation,
    };
  }

  /**
   * Authoritative Unified Technician Coverage Validation Engine.
   * Single Source of Truth for BOTH Customer Request Flow and Manager Assignment Flow.
   *
   * Semantic Contract:
   * 1. Multi-Company Isolation: Strictly verifies companyId matches.
   * 2. Active Status: Technician and coverage area must be active.
   * 3. Service Certification: Technician must be certified for requested serviceType.
   * 4. Multi-Area Evaluation (Section 13): Evaluates all applicable active areas for the technician
   *    (baseLocation + company.serviceAreas). If customer is within ANY area, covered = true.
   * 5. Boundary Condition: distanceKm <= radiusKm (inclusive).
   * 6. Real Coordinates Only: Guards against invalid coordinates and (0, 0) Null Island.
   */
  public static async validateTechnicianCoverage(
    params: ValidateTechnicianCoverageParams
  ): Promise<TechnicianCoverageValidationResult> {
    const serviceType = params.serviceType || params.serviceId;
    const { customerLatitude, customerLongitude, customerAddress, companyId, technicianId } = params;

    const customerCoordSource = 'customer_request_coordinates';
    let techCoordSource = 'technician_base_location';

    // 1. Guard against invalid customer coordinates or Null Island
    if (!isValidCoordinate(customerLatitude, customerLongitude)) {
      return {
        eligible: false,
        reason: 'CUSTOMER_COORDINATES_INVALID',
        distanceKm: Infinity,
        radiusKm: 0,
        coordinateSource: {
          customer: customerCoordSource,
          technician: techCoordSource,
        },
      };
    }

    // CASE A: Targeted Technician Validation (Manager assignment / selection)
    if (technicianId) {
      const techQuery: any = { _id: technicianId };
      if (companyId) {
        techQuery.companyId = companyId;
      }
      const tech = await Technician.findOne(techQuery).lean<ITechnician>();

      if (!tech) {
        // Multi-tenant check: check if technician exists under another company
        const existsElsewhere = await Technician.findById(technicianId).lean<ITechnician>();
        const reason = existsElsewhere
          ? 'CROSS_COMPANY_ACCESS_DENIED: Technician does not belong to this company'
          : 'TECHNICIAN_NOT_FOUND';
        return {
          eligible: false,
          reason,
          distanceKm: Infinity,
          radiusKm: 0,
          coordinateSource: {
            customer: customerCoordSource,
            technician: 'unknown',
          },
        };
      }

      if ((tech as any).active === false) {
        return {
          eligible: false,
          reason: 'TECHNICIAN_INACTIVE: Technician profile is currently deactivated',
          distanceKm: Infinity,
          radiusKm: tech.coverageRadiusKm || 20,
          technician: {
            id: tech._id.toString(),
            name: tech.name,
            latitude: tech.baseLocation?.latitude,
            longitude: tech.baseLocation?.longitude,
            baseAddress: tech.baseLocation?.formattedAddress || tech.baseLocation?.city,
            coverageRadiusKm: tech.coverageRadiusKm || 20,
            serviceTypes: tech.serviceTypes,
          },
          coordinateSource: {
            customer: customerCoordSource,
            technician: techCoordSource,
          },
        };
      }

      // Check service certification
      if (serviceType && !tech.serviceTypes.includes(serviceType)) {
        return {
          eligible: false,
          reason: `SERVICE_NOT_CERTIFIED: Technician ${tech.name} is not certified for ${serviceType} service`,
          distanceKm: Infinity,
          radiusKm: tech.coverageRadiusKm || 20,
          technician: {
            id: tech._id.toString(),
            name: tech.name,
            latitude: tech.baseLocation?.latitude,
            longitude: tech.baseLocation?.longitude,
            baseAddress: tech.baseLocation?.formattedAddress || tech.baseLocation?.city,
            coverageRadiusKm: tech.coverageRadiusKm || 20,
            serviceTypes: tech.serviceTypes,
          },
          coordinateSource: {
            customer: customerCoordSource,
            technician: techCoordSource,
          },
        };
      }

      // Collect all candidate coverage areas for this technician (Section 13)
      const evaluatedAreas: EvaluatedAreaSummary[] = [];

      // Area A: Technician's direct baseLocation
      const baseLoc = tech.baseLocation;
      let techBaseLat: number | undefined = undefined;
      let techBaseLon: number | undefined = undefined;

      if (isValidCoordinate(baseLoc?.latitude, baseLoc?.longitude)) {
        techBaseLat = baseLoc!.latitude;
        techBaseLon = baseLoc!.longitude;
      } else if (
        baseLoc?.center?.coordinates &&
        isValidCoordinate(baseLoc.center.coordinates[1], baseLoc.center.coordinates[0])
      ) {
        techBaseLat = baseLoc.center.coordinates[1];
        techBaseLon = baseLoc.center.coordinates[0];
      }

      const techRadius = (typeof tech.coverageRadiusKm === 'number' && tech.coverageRadiusKm > 0)
        ? tech.coverageRadiusKm
        : 20;

      if (isValidCoordinate(techBaseLat, techBaseLon)) {
        const d = calculateHaversineDistance(customerLatitude, customerLongitude, techBaseLat!, techBaseLon!);
        evaluatedAreas.push({
          areaId: tech._id.toString(),
          areaName: baseLoc?.formattedAddress || baseLoc?.city || `${tech.name} Base Location`,
          latitude: techBaseLat!,
          longitude: techBaseLon!,
          distanceKm: Math.round(d * 100) / 100,
          radiusKm: techRadius,
          withinRadius: d <= techRadius || Math.abs(d - techRadius) < 1e-6,
          serviceMatches: serviceType ? tech.serviceTypes.includes(serviceType) : true,
          active: (tech as any).active !== false,
          source: 'technician_base_location',
        });
      }

      // Area B+: Linked Company Service Areas (Section 13: Multi-coverage area evaluation)
      const effectiveCompanyId = tech.companyId || companyId;
      if (effectiveCompanyId) {
        const company = await Company.findById(effectiveCompanyId).lean<ICompany>();
        if (company && Array.isArray(company.serviceAreas)) {
          for (const sa of company.serviceAreas) {
            if ((sa as any).active === false) continue;
            // Check if technician covers this service area
            const techAssigned =
              (!tech.serviceAreas || tech.serviceAreas.length === 0) ||
              tech.serviceAreas.some((areaNameOrId) => {
                const name = (sa.locationName || sa.city || sa.formattedAddress || '').toLowerCase();
                const target = areaNameOrId.toLowerCase();
                return name.includes(target) || target.includes(name) || (sa._id && sa._id.toString() === areaNameOrId);
              });

            if (!techAssigned) continue;

            let saLat: number | undefined = undefined;
            let saLon: number | undefined = undefined;

            if (isValidCoordinate(sa.latitude, sa.longitude)) {
              saLat = sa.latitude;
              saLon = sa.longitude;
            } else if (
              sa.center?.coordinates &&
              isValidCoordinate(sa.center.coordinates[1], sa.center.coordinates[0])
            ) {
              saLat = sa.center.coordinates[1];
              saLon = sa.center.coordinates[0];
            }

            const saRadius = (sa.radiusKm ?? sa.radius) || 20;
            const saServices = sa.services || [];
            const serviceMatches = serviceType ? saServices.includes(serviceType) : true;

            if (isValidCoordinate(saLat, saLon)) {
              const d = calculateHaversineDistance(customerLatitude, customerLongitude, saLat!, saLon!);
              evaluatedAreas.push({
                areaId: sa._id ? sa._id.toString() : 'company-area',
                areaName: sa.locationName || sa.city || sa.formattedAddress || 'Company Area',
                latitude: saLat!,
                longitude: saLon!,
                distanceKm: Math.round(d * 100) / 100,
                radiusKm: saRadius,
                withinRadius: d <= saRadius || Math.abs(d - saRadius) < 1e-6,
                serviceMatches,
                active: (sa as any).active !== false,
                source: 'company_service_area',
              });
            }
          }
        }
      }

      if (evaluatedAreas.length === 0) {
        return {
          eligible: false,
          reason: 'TECHNICIAN_BASE_LOCATION_COORDINATES_MISSING_OR_INVALID',
          distanceKm: Infinity,
          radiusKm: techRadius,
          technician: {
            id: tech._id.toString(),
            name: tech.name,
            latitude: undefined,
            longitude: undefined,
            baseAddress: baseLoc?.formattedAddress || baseLoc?.city,
            coverageRadiusKm: techRadius,
            serviceTypes: tech.serviceTypes,
          },
          coordinateSource: {
            customer: customerCoordSource,
            technician: 'unconfigured',
          },
        };
      }

      // Check for coordinate ordering warnings
      const coordWarning = detectCoordinateOrderIssue(
        baseLoc?.center?.coordinates as [number, number],
        baseLoc?.latitude,
        baseLoc?.longitude
      );

      // Check if any applicable area covers the customer (withinRadius && serviceMatches && active)
      const coveringArea = evaluatedAreas.find((a) => a.withinRadius && a.serviceMatches && a.active);

      if (coveringArea) {
        techCoordSource = coveringArea.source;
        return {
          eligible: true,
          distanceKm: coveringArea.distanceKm,
          radiusKm: coveringArea.radiusKm,
          coverageArea: {
            id: coveringArea.areaId,
            name: coveringArea.areaName,
            latitude: coveringArea.latitude,
            longitude: coveringArea.longitude,
            radiusKm: coveringArea.radiusKm,
            address: coveringArea.areaName,
          },
          technician: {
            id: tech._id.toString(),
            name: tech.name,
            latitude: techBaseLat ?? coveringArea.latitude,
            longitude: techBaseLon ?? coveringArea.longitude,
            baseAddress: baseLoc?.formattedAddress || baseLoc?.city || coveringArea.areaName,
            coverageRadiusKm: techRadius,
            serviceTypes: tech.serviceTypes,
          },
          coordinateSource: {
            customer: customerCoordSource,
            technician: techCoordSource,
          },
          allAreasEvaluated: evaluatedAreas,
          coordinateOrderWarning: coordWarning,
        };
      }

      // Outside all applicable areas: select closest area for diagnostic report
      evaluatedAreas.sort((a, b) => a.distanceKm - b.distanceKm);
      const closestArea = evaluatedAreas[0];
      techCoordSource = closestArea.source;

      return {
        eligible: false,
        reason: `OUTSIDE_COVERAGE: Technician is ${closestArea.distanceKm} km away, exceeding configured radius of ${closestArea.radiusKm} km`,
        distanceKm: closestArea.distanceKm,
        radiusKm: closestArea.radiusKm,
        coverageArea: {
          id: closestArea.areaId,
          name: closestArea.areaName,
          latitude: closestArea.latitude,
          longitude: closestArea.longitude,
          radiusKm: closestArea.radiusKm,
          address: closestArea.areaName,
        },
        technician: {
          id: tech._id.toString(),
          name: tech.name,
          latitude: techBaseLat ?? closestArea.latitude,
          longitude: techBaseLon ?? closestArea.longitude,
          baseAddress: baseLoc?.formattedAddress || baseLoc?.city || closestArea.areaName,
          coverageRadiusKm: techRadius,
          serviceTypes: tech.serviceTypes,
        },
        coordinateSource: {
          customer: customerCoordSource,
          technician: techCoordSource,
        },
        allAreasEvaluated: evaluatedAreas,
        coordinateOrderWarning: coordWarning,
      };
    }

    // CASE B: Pool Evaluation (Customer Request Flow - technicianId omitted)
    const companyQuery: any = { active: true };
    if (companyId) {
      companyQuery._id = companyId;
    }
    const companies = await Company.find(companyQuery).lean<ICompany[]>();

    const allTechEvaluations: Array<{
      techId: string;
      techName: string;
      result: TechnicianCoverageValidationResult;
    }> = [];

    for (const comp of companies) {
      const techQuery: any = { companyId: comp._id, active: true };
      if (serviceType) {
        techQuery.serviceTypes = serviceType;
      }
      const techs = await Technician.find(techQuery).lean<ITechnician[]>();

      for (const t of techs) {
        const val = await this.validateTechnicianCoverage({
          technicianId: t._id,
          customerLatitude,
          customerLongitude,
          serviceType,
          companyId: comp._id,
          customerAddress,
        });

        allTechEvaluations.push({
          techId: t._id.toString(),
          techName: t.name,
          result: val,
        });

        if (val.eligible) {
          // Found an eligible covering technician!
          return val;
        }
      }
    }

    if (allTechEvaluations.length > 0) {
      allTechEvaluations.sort((a, b) => a.result.distanceKm - b.result.distanceKm);
      const closest = allTechEvaluations[0].result;
      return {
        ...closest,
        eligible: false,
        reason: closest.reason || 'NO_TECHNICIANS_COVERING_LOCATION: Closest technician is outside operating radius',
      };
    }

    return {
      eligible: false,
      reason: 'NO_ACTIVE_CERTIFIED_TECHNICIANS: No active certified technicians found for this service',
      distanceKm: Infinity,
      radiusKm: 0,
      coordinateSource: {
        customer: customerCoordSource,
        technician: 'none_available',
      },
    };
  }
}
