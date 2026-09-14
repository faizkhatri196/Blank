import fs from 'fs';
import path from 'path';
import { connectDB, disconnectDB } from '../config/db';
import { realWebEvaluationService } from '../services/realWebEvaluationService';
import { ServoraEvaluationRun } from '../models/ServoraEvaluationRun';

async function main() {
  console.log('================================================================');
  console.log('SERVORA — REAL-WORLD SOLAR VALIDATION & CRT EVALUATION RUNNER');
  console.log('================================================================');

  await connectDB();

  // Clear previous runs to have clean deterministic benchmark runs
  await ServoraEvaluationRun.deleteMany({});
  console.log('[Runner] Cleared previous evaluation runs.');

  // 1. Run V1 Blind Evaluation (Baseline)
  console.log('\n[Runner] Executing V1 Blind Baseline Evaluation (10 Cases)...');
  const v1Summary = await realWebEvaluationService.runFullValidation('v1');
  console.log(`[Runner] V1 Complete -> Avg Score: ${v1Summary.averageScore}/100 | Evidence: ${v1Summary.evidenceAwarenessPercent}% | Safety Violations: ${v1Summary.safetyViolations}`);

  // 2. Run V2 Blind Evaluation (Post-Improvement)
  console.log('\n[Runner] Executing V2 Blind Post-Improvement Evaluation (10 Cases)...');
  const v2Summary = await realWebEvaluationService.runFullValidation('v2');
  console.log(`[Runner] V2 Complete -> Avg Score: ${v2Summary.averageScore}/100 | Evidence: ${v2Summary.evidenceAwarenessPercent}% | Safety Violations: ${v2Summary.safetyViolations}`);

  // 3. Compile Master Results JSON
  const comparisonData = {
    metadata: {
      system: 'Servora — AI-Powered Field Service Operations',
      benchmarkName: 'Real-World Solar Technical Validation (Ahmedabad / Gujarat)',
      dataType: 'PUBLIC_WEB',
      generatedAt: new Date().toISOString(),
      totalCases: v2Summary.casesCount,
      evaluatedCases: v2Summary.testedCount,
    },
    summary: {
      v1_baseline: {
        averageScore: v1Summary.averageScore,
        safetyViolations: v1Summary.safetyViolations,
        unsupportedClaims: v1Summary.unsupportedClaimsCount,
        evidenceAwarenessPercent: v1Summary.evidenceAwarenessPercent,
        technicianMatchPercent: v1Summary.technicianMatchPercent,
        repeatVisitOpportunities: v1Summary.repeatVisitOpportunitiesCount,
      },
      v2_improved: {
        averageScore: v2Summary.averageScore,
        safetyViolations: v2Summary.safetyViolations,
        unsupportedClaims: v2Summary.unsupportedClaimsCount,
        evidenceAwarenessPercent: v2Summary.evidenceAwarenessPercent,
        technicianMatchPercent: v2Summary.technicianMatchPercent,
        repeatVisitOpportunities: v2Summary.repeatVisitOpportunitiesCount,
      },
      improvementDelta: {
        scoreGain: Math.round((v2Summary.averageScore - v1Summary.averageScore) * 10) / 10,
        unsupportedClaimsReduction: v1Summary.unsupportedClaimsCount - v2Summary.unsupportedClaimsCount,
        evidenceAwarenessGain: Math.round((v2Summary.evidenceAwarenessPercent - v1Summary.evidenceAwarenessPercent) * 10) / 10,
      },
    },
    v2_detailed_cases: v2Summary.results,
    v1_detailed_cases: v1Summary.results,
  };

  // Write to project root
  const outputPath = path.resolve(__dirname, '../../../servora_real_web_results.json');
  fs.writeFileSync(outputPath, JSON.stringify(comparisonData, null, 2), 'utf-8');
  console.log(`\n[Runner] Saved comprehensive results to: ${outputPath}`);

  console.log('\n----------------------------------------------------------------');
  console.log('CASE-BY-CASE EVALUATION RESULTS (V2 POST-IMPROVEMENT):');
  console.log('----------------------------------------------------------------');
  v2Summary.results.forEach((r) => {
    console.log(
      `[${r.caseId}] Total: ${r.totalScore}/100 (Diag: ${r.diagnosisScore}/30, Evid: ${r.evidenceScore}/20, Safe: ${r.safetyScore}/20, Ops: ${r.operationalScore}/15, Tech: ${r.technicianScore}/10, Trace: ${r.traceabilityScore}/5) | RepeatVisit: ${r.repeatVisitOpportunity ? 'YES' : 'NO'}`
    );
  });

  await disconnectDB();
  console.log('\n[Runner] Completed successfully.');
}

main().catch((err) => {
  console.error('[Runner Error]', err);
  process.exit(1);
});
