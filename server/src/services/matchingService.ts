import { ITechnician } from '../models/Technician';
import { IServiceTicket } from '../models/ServiceTicket';
import { IAIAnalysis } from '../models/AIAnalysis';
import { TechnicianMatchResult } from '../types';

export function calculateTechnicianMatches(
  ticket: IServiceTicket,
  technicians: ITechnician[],
  aiAnalysis?: IAIAnalysis | null,
  customerCity?: string
): TechnicianMatchResult[] {
  const serviceType = ticket.serviceType;

  // Extract required skills and tools from AI analysis or defaults
  const requiredTools = aiAnalysis?.recommendedTools || ['MULTIMETER', 'CLAMP_METER'];

  // Required skills based on service type and issue
  const requiredSkills: string[] = [];
  if (serviceType === 'SOLAR') {
    requiredSkills.push('ELECTRICAL_TROUBLESHOOTING');
    const complaint = ticket.complaint.toLowerCase();
    if (complaint.includes('inverter') || ticket.errorCode) {
      requiredSkills.push('INVERTER_REPAIR');
    }
    if (complaint.includes('string') || complaint.includes('mc4') || complaint.includes('dc')) {
      requiredSkills.push('DC_WIRING');
    }
    if (complaint.includes('battery')) {
      requiredSkills.push('BATTERY_SYSTEMS');
    }
  } else {
    requiredSkills.push('ELECTRICAL_TROUBLESHOOTING');
    const complaint = ticket.complaint.toLowerCase();
    if (complaint.includes('pcb') || ticket.errorCode) {
      requiredSkills.push('PCB_REPAIR');
    }
    if (complaint.includes('gas') || complaint.includes('cool') || complaint.includes('leak')) {
      requiredSkills.push('REFRIGERANT_CHARGING');
    }
    if (complaint.includes('compressor')) {
      requiredSkills.push('COMPRESSOR_REPAIR');
    }
  }

  // 1. FILTER: Active and supports this specific serviceType
  const eligible = technicians.filter(
    (tech) => tech.active && tech.serviceTypes.includes(serviceType)
  );

  const results: TechnicianMatchResult[] = eligible.map((tech) => {
    const reasons: string[] = [];
    const missingSkills: string[] = [];
    const missingTools: string[] = [];

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
      skillScore = 40; // No special skills needed
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
    let areaScore = 5; // default partial
    if (customerCity && tech.serviceAreas && tech.serviceAreas.length > 0) {
      const cityLower = customerCity.toLowerCase();
      const areaMatch = tech.serviceAreas.some((a) =>
        a.toLowerCase().includes(cityLower) || cityLower.includes(a.toLowerCase())
      );
      if (areaMatch) {
        areaScore = 10;
        reasons.push(`Covers customer city (${customerCity})`);
      } else {
        areaScore = 2;
      }
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
      score: totalScore,
      reasons: reasons.slice(0, 5),
      missingSkills,
      missingTools,
      availability: tech.availability,
      serviceCompatibility: true,
      serviceAreas: tech.serviceAreas,
    };
  });

  // Sort descending by match score
  results.sort((a, b) => b.score - a.score);

  return results;
}
