import { ITechnician } from '../models/Technician';
import { IServiceTicket } from '../models/ServiceTicket';
import { IAIAnalysis } from '../models/AIAnalysis';
import { TechnicianMatchResult } from '../types';
import { calculateHaversineDistanceKm, isValidApplicationCoordinate, extractValidCoords } from './location/geospatial';
import { ServiceRegistry } from '../config/serviceRegistry';

export interface CustomerLocationContext {
  city?: string;
  area?: string;
  pincode?: string;
  address?: string;
}

export function calculateTechnicianMatches(
  ticket: IServiceTicket,
  technicians: ITechnician[],
  aiAnalysis?: IAIAnalysis | null,
  locationContextInput?: CustomerLocationContext | string
): TechnicianMatchResult[] {
  const serviceType = ticket.serviceType;

  // Normalize location context
  let locationContext: CustomerLocationContext = {};
  if (typeof locationContextInput === 'string') {
    locationContext = { city: locationContextInput };
  } else if (locationContextInput) {
    locationContext = locationContextInput;
  }

  // Also read from ticket if not fully provided
  const ticketCity = locationContext.city || ticket.serviceLocation?.city || '';
  const ticketArea = locationContext.area || ticket.serviceLocation?.area || '';
  const ticketPincode = locationContext.pincode || ticket.serviceLocation?.pincode || '';
  const ticketAddress = locationContext.address || ticket.serviceLocation?.address || '';

    // Extract validated ticket/customer coordinates — reject (0,0) and NaN
    const ticketCoords = extractValidCoords({
      latitude: ticket.serviceLocationSnapshot?.latitude ?? ticket.serviceLocation?.coordinates?.latitude,
      longitude: ticket.serviceLocationSnapshot?.longitude ?? ticket.serviceLocation?.coordinates?.longitude,
    });
    const hasTicketCoords = ticketCoords !== null;
    const ticketLat = ticketCoords?.latitude;
    const ticketLon = ticketCoords?.longitude;

  const locText = `${ticketCity} ${ticketArea} ${ticketAddress} ${ticketPincode}`.toLowerCase().trim();
  const customerLocDisplay = [ticketArea, ticketCity].filter(Boolean).join(', ') || ticketCity || 'Customer location';

  // Extract required skills and tools from AI analysis, service registry, or defaults
  const serviceDef = ServiceRegistry.getService(serviceType);
  const requiredTools = aiAnalysis?.recommendedTools?.length
    ? aiAnalysis.recommendedTools
    : serviceDef?.recommendedTools || ['MULTIMETER', 'CLAMP_METER'];

  // Required skills based on service type and issue
  const requiredSkills: string[] = [];
  if (serviceType === 'SOLAR') {
    requiredSkills.push('ELECTRICAL_TROUBLESHOOTING');
    const complaint = (ticket.complaint || '').toLowerCase();
    if (complaint.includes('inverter') || ticket.errorCode) {
      requiredSkills.push('INVERTER_REPAIR');
    }
    if (complaint.includes('string') || complaint.includes('mc4') || complaint.includes('dc')) {
      requiredSkills.push('DC_WIRING');
    }
    if (complaint.includes('battery')) {
      requiredSkills.push('BATTERY_SYSTEMS');
    }
    if (complaint.includes('earthing') || complaint.includes('ground')) {
      requiredSkills.push('EARTHING_INSPECTION');
    }
  } else if (serviceType === 'AC') {
    requiredSkills.push('HVAC_DIAGNOSTICS');
    const complaint = (ticket.complaint || '').toLowerCase();
    if (complaint.includes('pcb') || ticket.errorCode) {
      requiredSkills.push('PCB_REPAIR');
    }
    if (complaint.includes('gas') || complaint.includes('cool') || complaint.includes('leak')) {
      requiredSkills.push('REFRIGERANT_CHARGING');
    }
    if (complaint.includes('compressor')) {
      requiredSkills.push('COMPRESSOR_REPAIR');
    }
  } else if (serviceType === 'PLUMBING') {
    requiredSkills.push('PIPE_FITTING', 'LEAK_REPAIR');
    const complaint = (ticket.complaint || '').toLowerCase();
    if (complaint.includes('drain') || complaint.includes('block') || complaint.includes('clog')) {
      requiredSkills.push('DRAIN_CLEARING');
    }
    if (complaint.includes('tap') || complaint.includes('faucet')) {
      requiredSkills.push('TAP_REPAIR');
    }
  } else if (serviceType === 'HOME_MAINTENANCE') {
    const complaint = (ticket.complaint || '').toLowerCase();
    if (complaint.includes('tile')) {
      requiredSkills.push('TILE_INSTALLATION_AND_REPAIR');
    } else if (complaint.includes('leak') || complaint.includes('seep') || complaint.includes('water')) {
      requiredSkills.push('WATERPROOFING_AND_SEEPAGE');
    } else if (complaint.includes('wall') || complaint.includes('plaster')) {
      requiredSkills.push('WALL_PLASTER_AND_CRACK_REPAIR');
    } else if (complaint.includes('floor')) {
      requiredSkills.push('FLOOR_REPAIR_AND_LEVELING');
    } else if (complaint.includes('door') || complaint.includes('window')) {
      requiredSkills.push('DOOR_WINDOW_CARPENTRY_FITMENT');
    } else if (complaint.includes('masonry') || complaint.includes('civil')) {
      requiredSkills.push('CIVIL_MASONRY');
    } else {
      requiredSkills.push(serviceDef?.requiredSkills?.[0] || 'CIVIL_MASONRY');
    }
  } else {
    if (serviceDef?.requiredSkills?.length) {
      requiredSkills.push(...serviceDef.requiredSkills.slice(0, 2));
    } else {
      requiredSkills.push('ELECTRICAL_TROUBLESHOOTING');
    }
  }

  // 1. FILTER: Active and certified for this ticket's serviceType
  const eligibleCandidates = technicians.filter(
    (tech) => tech.active && tech.serviceTypes.includes(serviceType)
  );

  const results: TechnicianMatchResult[] = eligibleCandidates.map((tech) => {
    const reasons: string[] = [];
    const missingSkills: string[] = [];
    const missingTools: string[] = [];

    const supportsService = tech.serviceTypes.includes(serviceType);
    const techAreas = tech.serviceAreas || [];
    const techPincodes = tech.pincodes || [];
    const techCoverageDisplay = techAreas.length > 0 ? techAreas.join(', ') : 'Universal Company Area';

    // Verify service area coverage
    let coversLocation = true;
    let coverageStatus: 'COVERS_LOCATION' | 'OUTSIDE_SERVICE_AREA' | 'NO_COVERAGE_CONFIGURED' = 'COVERS_LOCATION';
    let coverageExplanation = 'Customer location is inside service area';
    let ineligibilityReason: string | undefined = undefined;

    // Extract validated technician base coordinates — reject (0,0), schema defaults, and NaN
    const techCoords = extractValidCoords({
      latitude: tech.baseLocation?.latitude,
      longitude: tech.baseLocation?.longitude,
      center: tech.baseLocation?.center as any,
    });
    const hasTechCoords = techCoords !== null;
    const techLat = techCoords?.latitude;
    const techLon = techCoords?.longitude;

    // Radius must come from database configuration — NEVER hardcode
    const radiusKm = (typeof tech.coverageRadiusKm === 'number' && tech.coverageRadiusKm > 0)
      ? tech.coverageRadiusKm
      : null; // null = not configured, not a default fallback

    if (hasTicketCoords && hasTechCoords && radiusKm !== null) {
      const distKm = calculateHaversineDistanceKm(ticketLat!, ticketLon!, techLat!, techLon!);
      if (distKm <= radiusKm) {
        coversLocation = true;
        coverageStatus = 'COVERS_LOCATION';
        coverageExplanation = `Customer is ${distKm.toFixed(1)} km away (within ${radiusKm} km configured radius)`;
      } else {
        coversLocation = false;
        coverageStatus = 'OUTSIDE_SERVICE_AREA';
        coverageExplanation = `Customer is ${distKm.toFixed(1)} km away (exceeds ${radiusKm} km coverage radius)`;
        ineligibilityReason = `Customer location is outside technician's coverage radius (${distKm.toFixed(1)} km > ${radiusKm} km).`;
      }
    } else if (hasTicketCoords && hasTechCoords && radiusKm === null) {
      // Coordinates are valid but no radius configured — fall through to area text matching
      coverageStatus = 'NO_COVERAGE_CONFIGURED';
      coverageExplanation = 'Technician radius not configured — using service area text match';
    } else if (!hasTechCoords) {
      const matchedArea = techAreas.some((area) => {
        const a = area.toLowerCase().trim();
        if (!a) return false;
        return locText.includes(a) || (ticketCity && a.includes(ticketCity.toLowerCase()));
      });

      const matchedPincode = ticketPincode && techPincodes.length > 0 && techPincodes.includes(ticketPincode);

      if (locText && !matchedArea && !matchedPincode) {
        coversLocation = false;
        coverageStatus = 'OUTSIDE_SERVICE_AREA';
        coverageExplanation = `Customer location (${customerLocDisplay}) is outside technician coverage (${techCoverageDisplay})`;
        ineligibilityReason = 'Technician service area does not cover this customer location.';
      }
    } else {
      coverageStatus = 'NO_COVERAGE_CONFIGURED';
      coverageExplanation = 'Covers all company service areas';
    }

    if (!supportsService) {
      ineligibilityReason = `Technician is not certified for ${serviceType} service.`;
    } else if (!tech.active) {
      ineligibilityReason = 'Technician profile is currently deactivated.';
    }

    const isEligible = tech.active && supportsService && coversLocation;

    // Factor 1: Skill compatibility (40%)
    let skillScore = 0;
    if (requiredSkills.length > 0) {
      let matchedCount = 0;
      for (const reqSkill of requiredSkills) {
        if (tech.skills.includes(reqSkill)) {
          matchedCount++;
          reasons.push(`Has skill: ${reqSkill.replace(/_/g, ' ').toLowerCase()}`);
        } else {
          missingSkills.push(reqSkill);
        }
      }
      skillScore = (matchedCount / requiredSkills.length) * 40;
    } else {
      skillScore = 40;
    }

    // Factor 2: Tool compatibility (20%)
    let toolScore = 0;
    if (requiredTools.length > 0) {
      let toolMatchedCount = 0;
      for (const reqTool of requiredTools) {
        if (tech.tools.includes(reqTool)) {
          toolMatchedCount++;
          reasons.push(`Equipped with ${reqTool.replace(/_/g, ' ').toLowerCase()}`);
        } else {
          missingTools.push(reqTool);
        }
      }
      toolScore = (toolMatchedCount / requiredTools.length) * 20;
    } else {
      toolScore = 20;
    }

    // Factor 3: Availability (20%)
    let availScore = 0;
    if (tech.availability === 'AVAILABLE') {
      availScore = 20;
      reasons.push('Currently available for immediate dispatch');
    } else if (tech.availability === 'BUSY') {
      availScore = 8;
      reasons.push('Currently on active job (can be scheduled next)');
    } else {
      availScore = 0;
    }

    // Factor 4: Service area (10%)
    let areaScore = 0;
    if (coversLocation) {
      areaScore = 10;
      reasons.push(`Covers customer location (${customerLocDisplay})`);
    } else {
      areaScore = 0;
    }

    // Factor 5: Experience (10%)
    const expScore = Math.min(10, Math.round((tech.experienceYears / 7) * 10));
    if (tech.experienceYears >= 4) {
      reasons.push(`${tech.experienceYears} years of field service experience`);
    }

    const totalScore = Math.min(100, Math.round(skillScore + toolScore + availScore + areaScore + expScore));

    return {
      technicianId: (tech._id as any).toString(),
      technicianName: tech.name,
      phone: tech.phone,
      experienceYears: tech.experienceYears,
      serviceTypes: tech.serviceTypes,
      score: isEligible ? totalScore : Math.min(totalScore, 40),
      reasons: reasons.slice(0, 5),
      missingSkills,
      missingTools,
      availability: tech.availability,
      serviceCompatibility: supportsService,
      serviceAreas: tech.serviceAreas,
      coverageRadiusKm: tech.coverageRadiusKm,
      pincodes: tech.pincodes,
      isEligible,
      coverageStatus,
      coverageExplanation,
      ineligibilityReason,
      customerLocationSummary: customerLocDisplay,
      technicianCoverageSummary: techCoverageDisplay,
    };
  });

  // Sort: Eligible technicians first (sorted descending by match score), then Ineligible technicians
  results.sort((a, b) => {
    if (a.isEligible && !b.isEligible) return -1;
    if (!a.isEligible && b.isEligible) return 1;
    return b.score - a.score;
  });

  return results;
}
