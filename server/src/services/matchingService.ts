import { ITechnician } from '../models/Technician';
import { IServiceTicket } from '../models/ServiceTicket';
import { IAIAnalysis } from '../models/AIAnalysis';
import { TechnicianMatchResult } from '../types';

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

  const locText = `${ticketCity} ${ticketArea} ${ticketAddress} ${ticketPincode}`.toLowerCase().trim();
  const customerLocDisplay = [ticketArea, ticketCity].filter(Boolean).join(', ') || ticketCity || 'Customer location';

  // Extract required skills and tools from AI analysis or defaults
  const requiredTools = aiAnalysis?.recommendedTools || ['MULTIMETER', 'CLAMP_METER'];

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
  } else if (serviceType === 'AC') {
    requiredSkills.push('ELECTRICAL_TROUBLESHOOTING');
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
  } else {
    requiredSkills.push('ELECTRICAL_TROUBLESHOOTING');
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

    if (techAreas.length > 0) {
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
