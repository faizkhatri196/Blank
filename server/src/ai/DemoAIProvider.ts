import { AIProvider, AITicketContext } from './AIProvider';
import { AIAnalysisResult, PossibleIssue } from '../types';
import { solarKnowledgeBase } from './solarKnowledge';
import { acKnowledgeBase } from './acKnowledge';
import { solarConfig } from '../config/serviceConfigs/solarConfig';
import { acConfig } from '../config/serviceConfigs/acConfig';

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
    if (normalized.isUnknownTriage && input.serviceType === 'SOLAR') {
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
    }

    const textCorpus = [
      input.complaint,
      normalized.normalizedComplaint,
      normalized.inferredKeywords.join(' '),
      ...(input.symptoms || []),
      input.errorCode || '',
      input.assetDetails.inverterMake || '',
      input.assetDetails.inverterModel || '',
      input.assetDetails.brand || '',
      input.assetDetails.model || '',
    ]
      .join(' ')
      .toLowerCase();

    if (input.serviceType === 'SOLAR') {
      const res = this.analyzeSolar(input, textCorpus);
      res.rawComplaint = normalized.rawComplaint;
      res.normalizedComplaint = normalized.normalizedComplaint;
      res.isUnknownTriage = false;
      res.knownFacts = normalized.knownFacts;
      res.unknownFacts = normalized.unknownFacts;
      res.missingInformation = normalized.missingInformation;
      res.statusMessage = normalized.statusMessage;
      return res;
    } else {
      const res = this.analyzeAC(input, textCorpus);
      res.rawComplaint = normalized.rawComplaint;
      res.normalizedComplaint = normalized.normalizedComplaint;
      res.isUnknownTriage = false;
      res.knownFacts = normalized.knownFacts;
      res.unknownFacts = normalized.unknownFacts;
      res.missingInformation = normalized.missingInformation;
      res.statusMessage = normalized.statusMessage;
      return res;
    }
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
}
