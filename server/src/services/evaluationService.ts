import { IAIAnalysis } from '../models/AIAnalysis';
import { IServiceReport } from '../models/ServiceReport';
import { EvaluationComparison } from '../types';

export function compareAIVsActual(
  aiAnalysis?: IAIAnalysis | null,
  serviceReport?: IServiceReport | null
): EvaluationComparison {
  if (!aiAnalysis || !serviceReport) {
    return {
      diagnosisMatch: 'PARTIAL MATCH',
      toolMatch: 'PARTIAL MATCH',
      partMatch: 'NOT APPLICABLE',
      technicianMatch: 'MATCH',
      aiHelpful: true,
      notes: 'Initial evaluation baseline created upon job completion.',
    };
  }

  const actualDiagLower = serviceReport.actualDiagnosis.toLowerCase();

  // 1. Diagnosis Match Check
  let diagnosisMatch: 'MATCH' | 'PARTIAL MATCH' | 'NO MATCH' = 'NO MATCH';

  const issueTexts = aiAnalysis.possibleIssues.map(
    (i) => `${i.issue} ${i.explanation}`.toLowerCase()
  );

  for (const text of issueTexts) {
    // Check key symptom/component tokens
    const tokens = actualDiagLower
      .split(/[\s,.-]+/)
      .filter((t) => t.length > 3 && !['with', 'that', 'from', 'this', 'have', 'been'].includes(t));

    const matchCount = tokens.filter((t) => text.includes(t)).length;

    if (matchCount >= 2 || (tokens.length === 1 && matchCount === 1)) {
      diagnosisMatch = 'MATCH';
      break;
    } else if (matchCount === 1) {
      diagnosisMatch = 'PARTIAL MATCH';
    }
  }

  // 2. Tool Match Check
  const aiTools = (aiAnalysis.recommendedTools || []).map((t) => t.toUpperCase());
  const actualTools = (serviceReport.toolsUsed || []).map((t) => t.toUpperCase());

  let toolMatch: 'MATCH' | 'PARTIAL MATCH' | 'NO MATCH' = 'PARTIAL MATCH';
  if (actualTools.length > 0) {
    const common = actualTools.filter((t) => aiTools.includes(t));
    if (common.length >= Math.min(2, actualTools.length)) {
      toolMatch = 'MATCH';
    } else if (common.length > 0) {
      toolMatch = 'PARTIAL MATCH';
    } else {
      toolMatch = 'NO MATCH';
    }
  } else {
    toolMatch = 'MATCH';
  }

  // 3. Part Match Check
  const aiParts = (aiAnalysis.possibleParts || []).map((p) => p.toLowerCase());
  const actualParts = (serviceReport.partsUsed || []).map((p) => p.toLowerCase());

  let partMatch: 'MATCH' | 'PARTIAL MATCH' | 'NO MATCH' | 'NOT APPLICABLE' = 'NOT APPLICABLE';
  if (actualParts.length === 0) {
    partMatch = 'NOT APPLICABLE';
  } else {
    let partMatched = false;
    for (const act of actualParts) {
      if (aiParts.some((aip) => aip.includes(act) || act.includes(aip))) {
        partMatched = true;
        break;
      }
    }
    partMatch = partMatched ? 'MATCH' : 'PARTIAL MATCH';
  }

  const aiHelpful =
    serviceReport.aiHelpful !== undefined
      ? serviceReport.aiHelpful
      : diagnosisMatch === 'MATCH' || diagnosisMatch === 'PARTIAL MATCH';

  return {
    diagnosisMatch,
    toolMatch,
    partMatch,
    technicianMatch: 'MATCH',
    aiHelpful,
    notes: `Field diagnosis: "${serviceReport.actualDiagnosis}". AI primary hypothesis: "${aiAnalysis.possibleIssues[0]?.issue || 'N/A'}".`,
  };
}
