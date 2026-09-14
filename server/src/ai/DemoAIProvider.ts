import { AIProvider, AITicketContext } from './AIProvider';
import { AIAnalysisResult, PossibleIssue } from '../types';
import { solarKnowledgeBase } from './solarKnowledge';
import { acKnowledgeBase } from './acKnowledge';
import { solarConfig } from '../config/serviceConfigs/solarConfig';
import { acConfig } from '../config/serviceConfigs/acConfig';

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
    const textCorpus = [
      input.complaint,
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
      return this.analyzeSolar(input, textCorpus);
    } else {
      return this.analyzeAC(input, textCorpus);
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

    let reasoning = `Analyzed ${input.assetDetails.capacityKW || 5} kW ${input.assetDetails.inverterMake || 'Solar'} system complaint. Primary hypothesis points towards ${primary.title.toLowerCase()}. Technician should verify open-circuit voltages and connection tightness on site.`;

    if (input.previousHistory && input.previousHistory.length > 0) {
      reasoning += ` Note: Asset has ${input.previousHistory.length} prior service visits on record. Past issue on ${input.previousHistory[0].date}: "${input.previousHistory[0].actualDiagnosis}".`;
    }

    return {
      serviceType: 'SOLAR',
      possibleIssues,
      diagnosticSteps,
      recommendedTools,
      possibleParts,
      safetyWarnings,
      confidence: topMatches.length > 0 ? 'HIGH' : 'MEDIUM',
      reasoning,
      knowledgeSources: ['Solar Field Service Knowledge Base v0.1', primary.id],
      promptVersion: 'solar-rules-v0.1',
      provider: 'DemoAIProvider',
      model: 'Deterministic-Solar-Engine-v0.1',
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
