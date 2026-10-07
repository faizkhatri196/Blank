import { AIProvider, AITicketContext } from './AIProvider';
import { AIAnalysisResult, PossibleIssue } from '../types';
import { solarKnowledgeBase } from './solarKnowledge';
import { acKnowledgeBase } from './acKnowledge';
import { solarConfig } from '../config/serviceConfigs/solarConfig';
import { acConfig } from '../config/serviceConfigs/acConfig';
import { homeMaintenanceConfig } from '../config/serviceConfigs/homeMaintenanceConfig';
import { plumbingConfig } from '../config/serviceConfigs/plumbingConfig';
import { electricalConfig } from '../config/serviceConfigs/electricalConfig';
import { ServiceRegistry } from '../config/serviceRegistry';
import { normalizeComplaint } from './complaintNormalizer';

export class DemoAIProvider implements AIProvider {
  name = 'DemoAIProvider';

  async healthCheck(): Promise<{ available: boolean; provider: string; details?: string }> {
    return {
      available: true,
      provider: 'DemoAIProvider',
      details: 'Deterministic local educational knowledge engine (Zero external API dependencies)',
    };
  }

  async analyzeServiceTicket(input: AITicketContext): Promise<AIAnalysisResult> {
    const normalized = normalizeComplaint(input.complaint, input.serviceType);

    // If customer report is vague / unknown, trigger UNKNOWN / NEEDS TRIAGE workflow
    if (normalized.isUnknownTriage) {
      if (input.serviceType === 'SOLAR') {
        return {
          serviceType: 'SOLAR',
          rawComplaint: normalized.rawComplaint,
          normalizedComplaint: normalized.normalizedComplaint,
          isUnknownTriage: true,
          knownFacts: normalized.knownFacts,
          unknownFacts: normalized.unknownFacts,
          missingInformation: normalized.missingInformation,
          statusMessage: normalized.statusMessage,
          possibleIssues: [
            {
              issue: 'Inverter operational sync or internal protective trip',
              probabilityLevel: 'MEDIUM',
              explanation: 'Inverter may be disconnected or in protective standby. Visual and multimeter verification required on site.',
            },
            {
              issue: 'Utility grid supply anomaly or tripped AC isolator',
              probabilityLevel: 'MEDIUM',
              explanation: 'Phase voltage fluctuation or blown AC fuse preventing inverter grid tie-in.',
            },
            {
              issue: 'Rooftop string open circuit or blown DC fuse',
              probabilityLevel: 'LOW',
              explanation: 'One or more DC strings may be de-energized due to loose wiring or blown combiner fuse.',
            },
            {
              issue: 'Loose MC4 connector or contact resistance heating',
              probabilityLevel: 'LOW',
              explanation: 'Rooftop connection degradation requiring physical inspection with MC4 disconnect tool.',
            },
            {
              issue: 'Generation loss due to heavy surface soiling or shading',
              probabilityLevel: 'LOW',
              explanation: 'Environmental dust or shading obstructing array output.',
            },
          ],
          diagnosticSteps: [
            'Inspect inverter LCD display: record whether screen is illuminated, in standby, or completely dark',
            'Measure Phase-to-Neutral AC voltage and Neutral-to-Earth floating voltage (< 3V AC) at ACDB with calibrated multimeter',
            'Measure open-circuit string voltage (Voc) at DC isolator test points using high-voltage DC multimeter',
            'Record error codes, LED light status, and physical meter readings in technician fieldwork report before attempting repairs',
          ],
          requiredEvidence: normalized.missingInformation,
          recommendedTools: ['MULTIMETER', 'CLAMP_METER', 'SCREWDRIVER_SET', 'VOLTAGE_DETECTOR'],
          possibleParts: ['AC MCB', 'DC String Fuses', 'MC4 Connectors'],
          safetyWarnings: [
            'VERIFY ON SITE: Lockout-Tagout (LOTO) both DC disconnect and AC isolator prior to physical inspection.',
            'Solar panels generate lethal DC voltages whenever light is present; circuits cannot be switched off at the panel.',
            'High-voltage DC array remains energized under sunlight even when main AC breaker is OFF.',
            'Qualified technician must verify zero voltage before touching exposed conductors.',
          ],
          confidence: 'LOW',
          reasoning: 'UNKNOWN / NEEDS TRIAGE — Customer provided an unspecified complaint without error code or technical symptoms. Servora does not invent a confirmed physical diagnosis without evidence. On-site technician verification required.',
          knowledgeSources: ['Solar Field Service Triage Protocol (Grounded in CEA Regulations)'],
          promptVersion: 'solar-triage-v0.2',
          provider: 'DemoAIProvider',
          model: 'Deterministic-Solar-Engine-v0.2',
        };
      } else {
        const sDef = ServiceRegistry.getService(input.serviceType);
        return {
          serviceType: input.serviceType,
          rawComplaint: normalized.rawComplaint,
          normalizedComplaint: normalized.normalizedComplaint,
          isUnknownTriage: true,
          knownFacts: normalized.knownFacts,
          unknownFacts: normalized.unknownFacts,
          missingInformation: normalized.missingInformation,
          statusMessage: normalized.statusMessage,
          possibleIssues: [
            {
              issue: `${sDef?.displayName || input.serviceType} on-site assessment required`,
              probabilityLevel: 'MEDIUM',
              explanation: 'Preliminary symptoms are unspecified. On-site inspection by a certified service professional is required.',
            },
          ],
          diagnosticSteps: [
            'Conduct visual and physical inspection of reported service area on site',
            'Verify operating supply lines and shutoff valves/breakers before dismantling fittings',
            'Record baseline measurements in the field report before initiating repairs',
          ],
          requiredEvidence: normalized.missingInformation,
          recommendedTools: sDef?.recommendedTools || ['MULTIMETER', 'SCREWDRIVER_SET'],
          possibleParts: [],
          safetyWarnings: sDef?.safetyRules || ['Observe standard safety procedures on site.'],
          confidence: 'LOW',
          reasoning: `UNKNOWN / NEEDS TRIAGE — Customer provided an unspecified complaint for ${sDef?.displayName || input.serviceType}. On-site professional verification required.`,
          knowledgeSources: [`${sDef?.displayName || input.serviceType} Standard Triage Protocol`],
          promptVersion: 'triage-v0.2',
          provider: 'DemoAIProvider',
          model: 'Deterministic-Triage-Engine-v0.2',
        };
      }
    }

    const textCorpus = [
      input.complaint,
      normalized.normalizedComplaint,
      normalized.inferredKeywords.join(' '),
      ...(input.symptoms || []),
      input.errorCode || '',
      input.assetDetails?.inverterMake || '',
      input.assetDetails?.inverterModel || '',
      input.assetDetails?.brand || '',
      input.assetDetails?.model || '',
    ]
      .join(' ')
      .toLowerCase();

    let res: AIAnalysisResult;
    if (input.serviceType === 'SOLAR') {
      res = this.analyzeSolar(input, textCorpus);
    } else if (input.serviceType === 'AC') {
      res = this.analyzeAC(input, textCorpus);
    } else if (input.serviceType === 'PLUMBING') {
      res = this.analyzePlumbing(input, textCorpus);
    } else if (input.serviceType === 'HOME_MAINTENANCE') {
      res = this.analyzeHomeMaintenance(input, textCorpus);
    } else if (input.serviceType === 'ELECTRICAL') {
      res = this.analyzeElectrical(input, textCorpus);
    } else {
      res = this.analyzeGenericService(input, textCorpus);
    }

    res.rawComplaint = normalized.rawComplaint;
    res.normalizedComplaint = normalized.normalizedComplaint;
    res.isUnknownTriage = false;
    res.knownFacts = normalized.knownFacts;
    res.unknownFacts = normalized.unknownFacts;
    res.missingInformation = normalized.missingInformation;
    res.statusMessage = normalized.statusMessage;
    return res;
  }

  private analyzeSolar(input: AITicketContext, textCorpus: string): AIAnalysisResult {
    // Score knowledge items by keyword frequency
    const scored = solarKnowledgeBase.map((item) => {
      let score = 0;
      for (const kw of item.keywords) {
        if (textCorpus.includes(kw.toLowerCase())) {
          score += 2;
        }
      }
      return { item, score };
    });

    scored.sort((a, b) => b.score - a.score);

    // Pick best match or fallback to top items
    const topMatches = scored.filter((s) => s.score > 0);
    const primary = topMatches.length > 0 ? topMatches[0].item : solarKnowledgeBase[0];
    const secondary = topMatches.length > 1 ? topMatches[1].item : solarKnowledgeBase[1];

    const possibleIssues: PossibleIssue[] = [
      {
        issue: primary.title,
        probabilityLevel: topMatches.length > 0 ? 'HIGH' : 'MEDIUM',
        explanation: `Matches reported symptom pattern: ${primary.possibleCauses[0]}. On-site multimeter and continuity verification is required before replacing components.`,
      },
      {
        issue: primary.possibleCauses[1] || secondary.title,
        probabilityLevel: 'MEDIUM',
        explanation: `Secondary operational hypothesis: ${primary.possibleCauses[1] || secondary.possibleCauses[0]}. Common in installations under prolonged thermal or environmental stress.`,
      },
      {
        issue: secondary.title,
        probabilityLevel: 'LOW',
        explanation: `Less likely but possible peripheral cause: ${secondary.possibleCauses[0]}. Check if primary measurements are within normal specification.`,
      },
    ];

    // Combine steps, tools, parts
    const diagnosticSteps = Array.from(
      new Set([
        ...primary.diagnosticSteps.slice(0, 3),
        ...secondary.diagnosticSteps.slice(0, 2),
        'Record DC and AC voltage and operating current readings in the field report before and after rectifying fault.',
      ])
    );

    const recommendedTools = Array.from(
      new Set([
        ...primary.recommendedTools,
        'MULTIMETER',
        'CLAMP_METER',
      ])
    );

    const possibleParts = Array.from(
      new Set([...primary.possibleParts, ...secondary.possibleParts.slice(0, 1)])
    );

    const safetyWarnings = Array.from(
      new Set([
        ...solarConfig.defaultSafetyWarnings.slice(0, 3),
        ...primary.safetyWarnings,
      ])
    );

    // Formulate evidence required before confirming root cause
    const requiredEvidence = [
      'Retrieve inverter historical event logs and exact alarm code timestamp',
      'Measure Phase-to-Neutral AC voltage and Neutral-to-Earth floating voltage (< 3V AC) at inverter AC terminals',
      'Record DC string open-circuit voltage (Voc) and operating current (Isc) under unshaded sunlight',
      'Capture clear photographs of inverter display, ACDB/DCDB breaker positions, and rooftop connections',
    ];

    if (textCorpus.includes('bill') || textCorpus.includes('tariff') || textCorpus.includes('consumption')) {
      requiredEvidence.push(
        'Collect last 6 months DISCOM utility bills to compare monthly total kWh consumption and tariff changes',
        'Verify bi-directional net-meter cumulative export and import unit registers'
      );
    }

    if (textCorpus.includes('deviation') || textCorpus.includes('monitoring') || textCorpus.includes('scada')) {
      requiredEvidence.push(
        'Correlate generation profile with solar irradiance (W/m2) from pyranometer or satellite weather data'
      );
    }

    let reasoning = `AI PRELIMINARY HYPOTHESIS — Insufficient remote evidence to confirm physical root cause. Technician must collect diagnostic evidence on site. Primary candidate issue: ${primary.title}. Verification required before any component replacement.`;

    if (input.previousHistory && input.previousHistory.length > 0) {
      reasoning += ` Asset has ${input.previousHistory.length} prior service visits on record (Past: "${input.previousHistory[0].actualDiagnosis}").`;
    }

    return {
      serviceType: 'SOLAR',
      possibleIssues,
      diagnosticSteps,
      requiredEvidence,
      recommendedTools,
      possibleParts,
      safetyWarnings: [
        'VERIFY ON SITE: Lockout-Tagout (LOTO) both DC disconnect and AC isolator prior to physical inspection.',
        'Solar panels generate lethal DC voltages whenever light is present; circuits cannot be switched off at the panel.',
        ...safetyWarnings,
      ],
      confidence: topMatches.length > 0 ? 'HIGH' : 'MEDIUM',
      reasoning,
      knowledgeSources: ['Solar Field Service Knowledge Base v0.2 (Grounded in Gujarat O&M Standards)', primary.id],
      promptVersion: 'solar-rules-v0.2',
      provider: 'DemoAIProvider',
      model: 'Deterministic-Solar-Engine-v0.2',
    };
  }

  private analyzeAC(input: AITicketContext, textCorpus: string): AIAnalysisResult {
    // Score knowledge items by keyword frequency
    const scored = acKnowledgeBase.map((item) => {
      let score = 0;
      for (const kw of item.keywords) {
        if (textCorpus.includes(kw.toLowerCase())) {
          score += 2;
        }
      }
      return { item, score };
    });

    scored.sort((a, b) => b.score - a.score);

    const topMatches = scored.filter((s) => s.score > 0);
    const primary = topMatches.length > 0 ? topMatches[0].item : acKnowledgeBase[0];
    const secondary = topMatches.length > 1 ? topMatches[1].item : acKnowledgeBase[1];

    const possibleIssues: PossibleIssue[] = [
      {
        issue: primary.title,
        probabilityLevel: topMatches.length > 0 ? 'HIGH' : 'MEDIUM',
        explanation: `Matches reported symptom: ${primary.possibleCauses[0]}. Technician must measure capacitor value and electrical current under load.`,
      },
      {
        issue: primary.possibleCauses[1] || secondary.title,
        probabilityLevel: 'MEDIUM',
        explanation: `Alternative cause: ${primary.possibleCauses[1] || secondary.possibleCauses[0]}. Check refrigerant suction pressure and thermal delta.`,
      },
      {
        issue: secondary.title,
        probabilityLevel: 'LOW',
        explanation: `Potential contributing factor: ${secondary.possibleCauses[0]}. Inspect filter coils and electrical contactors.`,
      },
    ];

    const diagnosticSteps = Array.from(
      new Set([
        ...primary.diagnosticSteps.slice(0, 3),
        ...secondary.diagnosticSteps.slice(0, 2),
        'Record air intake and return grille temperatures (Delta T) and compressor running current in service report.',
      ])
    );

    const recommendedTools = Array.from(
      new Set([
        ...primary.recommendedTools,
        'MULTIMETER',
        'CLAMP_METER',
      ])
    );

    const possibleParts = Array.from(
      new Set([...primary.possibleParts, ...secondary.possibleParts.slice(0, 1)])
    );

    const safetyWarnings = Array.from(
      new Set([
        ...acConfig.defaultSafetyWarnings.slice(0, 3),
        ...primary.safetyWarnings,
      ])
    );

    let reasoning = `Analyzed ${input.assetDetails.capacityTR || 1.5} TR ${input.assetDetails.brand || 'AC'} unit complaint. Primary hypothesis is ${primary.title.toLowerCase()}. Verify electrical capacitors and refrigerant charge on site.`;

    if (input.previousHistory && input.previousHistory.length > 0) {
      reasoning += ` Asset service history records ${input.previousHistory.length} previous visits. Last diagnosis: "${input.previousHistory[0].actualDiagnosis}".`;
    }

    return {
      serviceType: 'AC',
      possibleIssues,
      diagnosticSteps,
      recommendedTools,
      possibleParts,
      safetyWarnings,
      confidence: topMatches.length > 0 ? 'HIGH' : 'MEDIUM',
      reasoning,
      knowledgeSources: ['AC/HVAC Field Service Knowledge Base v0.1', primary.id],
      promptVersion: 'ac-rules-v0.1',
      provider: 'DemoAIProvider',
      model: 'Deterministic-AC-Engine-v0.1',
    };
  }

  private analyzePlumbing(input: AITicketContext, textCorpus: string): AIAnalysisResult {
    let issue = 'Pipeline Joint Leaking or Water Seepage';
    let explanation = 'Water leaking or seeping from pipe joints, concealed lines or fittings.';
    const parts: string[] = ['Teflon Thread Seal Tape', 'Rubber Washers & O-Rings'];

    if (textCorpus.includes('tap') || textCorpus.includes('faucet') || textCorpus.includes('nal')) {
      issue = 'Damaged Tap Spindle or Internal Ceramic Cartridge Wear';
      explanation = 'Continuous dripping or leaking from tap caused by worn spindle, seat washer, or ceramic disc.';
      parts.push('Tap Spindle', 'Brass Cartridge');
    } else if (textCorpus.includes('drain') || textCorpus.includes('block') || textCorpus.includes('clog')) {
      issue = 'Wastewater Drain Trap or Sewer Line Blockage';
      explanation = 'Accumulation of debris, hair, or grease in P-trap or waste drainage pipe.';
      parts.push('Drain Debris Cleanout Plug', 'PVC Trap Coupler');
    } else if (textCorpus.includes('pressure')) {
      issue = 'Water Supply Line Air-Lock or Line Pressure Restriction';
      explanation = 'Partial blockage, calcification in aerator, or air-lock in overhead supply line.';
      parts.push('Tap Aerator Mesh', 'Pressure Reducer Valve');
    } else if (textCorpus.includes('toilet') || textCorpus.includes('flush') || textCorpus.includes('cistern')) {
      issue = 'Toilet Cistern Flush Valve or Syphon Leakage';
      explanation = 'Worn flapper valve, ballcock seal, or siphon seal in flush tank causing continuous water loss.';
      parts.push('Flush Valve Flapper', 'Inlet Float Ball Valve');
    }

    const possibleIssues: PossibleIssue[] = [
      { issue, probabilityLevel: 'HIGH', explanation },
      { issue: 'Concealed Pipeline Joint Pressure Degradation', probabilityLevel: 'MEDIUM', explanation: 'Secondary seepage hypothesis under high supply pressure.' },
      { issue: 'Sanitary Fixture Sealant Erosion', probabilityLevel: 'LOW', explanation: 'Degraded silicone sealant around fixture base.' },
    ];

    const diagnosticSteps = [
      'Locate and close the isolation valve or main water stopcock before dismantling fixtures.',
      'Conduct static water pressure test and inspect pipe joints, thread sealant, and washers for active weeping.',
      'Check drain trap and sewer lines for unobstructed gravity drainage.',
      'Restore water pressure and verify complete leak tightness after fitting replacement.',
    ];

    return {
      serviceType: 'PLUMBING',
      possibleIssues,
      diagnosticSteps,
      recommendedTools: plumbingConfig.tools,
      possibleParts: parts,
      safetyWarnings: plumbingConfig.defaultSafetyWarnings,
      confidence: 'HIGH',
      reasoning: `Analyzed plumbing complaint: "${input.complaint}". Primary hypothesis is ${issue.toLowerCase()}. Confirm water stopcock accessibility and test under pressure on site.`,
      knowledgeSources: ['Plumbing & Water System Diagnostic Knowledge Base v0.1'],
      promptVersion: 'plumbing-rules-v0.1',
      provider: 'DemoAIProvider',
      model: 'Deterministic-Plumbing-Engine-v0.1',
    };
  }

  private analyzeHomeMaintenance(input: AITicketContext, textCorpus: string): AIAnalysisResult {
    let issue = 'General Home Maintenance / Civil Surface Repair';
    let explanation = 'Surface deterioration or civil touchup required.';
    const parts: string[] = ['Joint Sealant', 'Civil Compound'];

    if (textCorpus.includes('tile') || textCorpus.includes('ladi') || textCorpus.includes('grout')) {
      issue = 'Subfloor Tile Debonding / Cracked Tile Replacement';
      explanation = 'Hollow sounding, cracked, or loose tiles caused by adhesive bonding failure or expansion stress.';
      parts.push('Matching Replacement Tiles', 'Polymer Modified Tile Adhesive', 'Epoxy Grout');
    } else if (textCorpus.includes('leak') || textCorpus.includes('seep') || textCorpus.includes('bheej') || textCorpus.includes('damp')) {
      issue = 'Subsurface Wall Water Seepage / Waterproofing Membrane Failure';
      explanation = 'Moisture ingress through exterior wall cracks, adjacent bathroom tile joints, or plumbing chases.';
      parts.push('Waterproofing Barrier Coating', 'Elastomeric Crack Seal Compound');
    } else if (textCorpus.includes('wall') || textCorpus.includes('plaster') || textCorpus.includes('crack')) {
      issue = 'Wall Plaster Shrinkage Cracking & Surface Flaking';
      explanation = 'Plaster cracking from thermal movement or structural settlement requiring V-groove patching.';
      parts.push('Fiberglass Mesh Tape', 'Ready-mix Cementitious Plaster', 'Wall Primer');
    } else if (textCorpus.includes('floor')) {
      issue = 'Flooring Settlement & Floor Tile Leveling Defect';
      explanation = 'Sunken or uneven floor tiles requiring bedding mortar re-leveling.';
      parts.push('Floor Leveling Compound', 'Bedding Mortar');
    } else if (textCorpus.includes('door') || textCorpus.includes('window') || textCorpus.includes('hinge')) {
      issue = 'Door / Window Frame Alignment & Hinge Hardware Wear';
      explanation = 'Shifting frame or sagging hinge screws causing sticking, friction on floor, or latch jamming.';
      parts.push('Heavy Duty SS Hinges', 'Wood Screws & Shims');
    } else if (textCorpus.includes('masonry') || textCorpus.includes('civil') || textCorpus.includes('brick')) {
      issue = 'Minor Civil Masonry & Brickwork Surface Degradation';
      explanation = 'Exposed masonry mortar joints requiring repointing and cement plaster touchup.';
      parts.push('Portland Cement Grade 53', 'Coarse Sand Aggregate');
    }

    const possibleIssues: PossibleIssue[] = [
      { issue, probabilityLevel: 'HIGH', explanation },
      { issue: 'Adjacent Joint Sealant Degradation', probabilityLevel: 'MEDIUM', explanation: 'Secondary weathering or moisture ingress.' },
      { issue: 'Substrate Thermal Expansion Stress', probabilityLevel: 'LOW', explanation: 'Minor hairline settlement.' },
    ];

    const diagnosticSteps = [
      'Conduct visual surface assessment and sound test tiles/plaster with hollow check hammer.',
      'Verify location of concealed electrical conduits and plumbing pipelines before chipping, chiseling or drilling.',
      'Measure surface moisture percentage across damp wall/floor areas using digital moisture meter.',
      'Check substrate integrity and apply appropriate bonding primer prior to patch repair.',
    ];

    return {
      serviceType: 'HOME_MAINTENANCE',
      possibleIssues,
      diagnosticSteps,
      recommendedTools: homeMaintenanceConfig.tools,
      possibleParts: parts,
      safetyWarnings: homeMaintenanceConfig.defaultSafetyWarnings,
      confidence: 'HIGH',
      reasoning: `Analyzed home maintenance complaint: "${input.complaint}". Primary hypothesis is ${issue.toLowerCase()}. Verify concealed utilities and substrate sound condition on site.`,
      knowledgeSources: ['Home Maintenance & Civil Repair Diagnostic Knowledge Base v0.1'],
      promptVersion: 'home-maintenance-rules-v0.1',
      provider: 'DemoAIProvider',
      model: 'Deterministic-HomeMaintenance-Engine-v0.1',
    };
  }

  private analyzeElectrical(input: AITicketContext, textCorpus: string): AIAnalysisResult {
    let issue = 'Branch Circuit Overload or Neutral Imbalance';
    let explanation = 'Electrical circuit tripping or partial power interruption.';
    const parts: string[] = ['Single Pole MCB 16A/25A', 'Copper Terminal Lugs'];

    if (textCorpus.includes('spark') || textCorpus.includes('burnt') || textCorpus.includes('burning') || textCorpus.includes('smoke')) {
      issue = 'CRITICAL: Switchboard Terminal Contact Resistance / Short Circuit';
      explanation = 'Loose terminal screw or insulation breakdown causing localized arcing, sparks, and thermal burning.';
      parts.push('Modular Switch / Socket', 'FR Grade Copper Wire');
    } else if (textCorpus.includes('trip') || textCorpus.includes('mcb') || textCorpus.includes('fuse')) {
      issue = 'MCB Circuit Breaker Tripping Due to Earth Leakage or Overload';
      explanation = 'Circuit current exceeding breaker rating or internal insulation leakage to earth.';
      parts.push('RCCB / ELCB 30mA', 'B-Curve / C-Curve MCB');
    } else if (textCorpus.includes('phase') || textCorpus.includes('partial')) {
      issue = 'Incoming Utility Phase Loss or Neutral Conductor Drop';
      explanation = 'Single-phase dropout from utility pole or loose neutral link on distribution board.';
      parts.push('Three-Phase Rotary Selector Switch', 'Neutral Link Bar');
    }

    const possibleIssues: PossibleIssue[] = [
      { issue, probabilityLevel: 'HIGH', explanation },
      { issue: 'High Resistance Ground / Earthing Fault', probabilityLevel: 'MEDIUM', explanation: 'Earth pit loop impedance exceeding safe threshold (> 5 ohms).' },
      { issue: 'Concealed Wiring Insulation Aging', probabilityLevel: 'LOW', explanation: 'Moisture ingress in electrical conduits.' },
    ];

    const diagnosticSteps = [
      'Lockout-Tagout incoming mains isolator before opening distribution boards or switchboards.',
      'Measure Line-to-Neutral AC voltage (220-240V) and Neutral-to-Earth floating voltage (< 3V) with calibrated multimeter.',
      'Measure continuous circuit load current with clamp meter and compare against MCB trip threshold.',
      'Verify tight torque on all busbar terminals and confirm zero burning odor before re-energizing.',
    ];

    return {
      serviceType: 'ELECTRICAL',
      possibleIssues,
      diagnosticSteps,
      recommendedTools: electricalConfig.tools,
      possibleParts: parts,
      safetyWarnings: electricalConfig.defaultSafetyWarnings,
      confidence: 'HIGH',
      reasoning: `Analyzed electrical service complaint: "${input.complaint}". Primary hypothesis is ${issue.toLowerCase()}. Confirm zero voltage before touching conductors and test insulation on site.`,
      knowledgeSources: ['Electrical Power & Field Infrastructure Diagnostic Knowledge Base v0.1'],
      promptVersion: 'electrical-rules-v0.1',
      provider: 'DemoAIProvider',
      model: 'Deterministic-Electrical-Engine-v0.1',
    };
  }

  private analyzeGenericService(input: AITicketContext, textCorpus: string): AIAnalysisResult {
    const sDef = ServiceRegistry.getService(input.serviceType);
    return {
      serviceType: input.serviceType,
      possibleIssues: [
        {
          issue: `${sDef?.displayName || input.serviceType} Operational Anomaly`,
          probabilityLevel: 'MEDIUM',
          explanation: `Reported issue matching symptoms for ${sDef?.displayName || input.serviceType}. Requires on-site verification.`,
        },
      ],
      diagnosticSteps: [
        'Inspect equipment or operational site visually for physical wear or loose connections',
        'Verify supply parameters (voltage, pressure, structural base) before dismantling',
        'Test equipment operation and record fieldwork metrics in service report',
      ],
      recommendedTools: sDef?.recommendedTools || ['MULTIMETER', 'SCREWDRIVER_SET'],
      possibleParts: [],
      safetyWarnings: sDef?.safetyRules || ['Observe standard safety procedures on site.'],
      confidence: 'MEDIUM',
      reasoning: `Analyzed ${sDef?.displayName || input.serviceType} service complaint. On-site verification required by a certified professional.`,
      knowledgeSources: [`${sDef?.displayName || input.serviceType} Standard Technical Guide`],
      promptVersion: 'generic-rules-v0.1',
      provider: 'DemoAIProvider',
      model: 'Deterministic-Generic-Engine-v0.1',
    };
  }
}
