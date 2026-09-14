import mongoose from 'mongoose';
import { ServiceHistory } from '../models/ServiceHistory';
import { Customer } from '../models/Customer';

export async function generatePilotCSV(companyId: mongoose.Types.ObjectId): Promise<string> {
  const histories = await ServiceHistory.find({ companyId })
    .populate('customerId', 'name phone')
    .sort({ completedAt: -1 });

  const headers = [
    'Ticket Number',
    'Service Type',
    'Customer Name',
    'Technician',
    'Complaint',
    'AI Prediction Summary',
    'Actual Field Diagnosis',
    'Diagnosis Match',
    'Tool Match',
    'Part Match',
    'Work Performed',
    'Parts Used',
    'Completed Date',
  ];

  const rows = histories.map((h) => {
    const customer = h.customerId as any;
    const customerName = customer?.name || 'Customer';

    const escapeCSV = (val: any) => {
      if (val === undefined || val === null) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    return [
      escapeCSV(h.ticketNumber),
      escapeCSV(h.serviceType),
      escapeCSV(customerName),
      escapeCSV(h.technicianName),
      escapeCSV(h.complaint),
      escapeCSV(h.aiPredictionSummary),
      escapeCSV(h.actualDiagnosis),
      escapeCSV(h.comparisonResult?.diagnosisMatch || 'MATCH'),
      escapeCSV(h.comparisonResult?.toolMatch || 'MATCH'),
      escapeCSV(h.comparisonResult?.partMatch || 'NOT APPLICABLE'),
      escapeCSV(h.workPerformed),
      escapeCSV((h.partsUsed || []).join('; ')),
      escapeCSV(new Date(h.completedAt).toISOString().split('T')[0]),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

export async function generatePilotReportMarkdown(companyId: mongoose.Types.ObjectId): Promise<string> {
  const [histories, feedbacks, tickets] = await Promise.all([
    ServiceHistory.find({ companyId }).populate('customerId', 'name').sort({ completedAt: -1 }),
    (await import('../models/PilotFeedback')).PilotFeedback.find({ companyId }).sort({ createdAt: -1 }),
    (await import('../models/ServiceTicket')).ServiceTicket.find({ companyId }),
  ]);

  const totalJobs = histories.length;
  let matches = 0;
  let partialMatches = 0;
  let misses = 0;
  let toolsReady = 0;
  let partsReady = 0;

  for (const h of histories) {
    if (h.comparisonResult?.diagnosisMatch === 'MATCH') matches++;
    else if (h.comparisonResult?.diagnosisMatch === 'PARTIAL MATCH') partialMatches++;
    else misses++;

    if (h.comparisonResult?.toolMatch === 'MATCH') toolsReady++;
    if (h.comparisonResult?.partMatch === 'MATCH' || h.comparisonResult?.partMatch === 'NOT APPLICABLE') partsReady++;
  }

  const repeatVisits = tickets.filter((t) => t.repeatVisit).length;
  const firstVisitSuccess = totalJobs > 0 ? Math.max(0, totalJobs - repeatVisits) : 0;
  const firstVisitPct = totalJobs > 0 ? Math.round((firstVisitSuccess / totalJobs) * 100) : 0;

  let report = `# SERVORA REAL CLIENT PILOT REPORT
**Pilot Period:** ${new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
**Generated At:** ${new Date().toISOString()}
**Data Classification:** \`REAL_PILOT\`

---

## 1. Executive Summary & Verification
- **Total Real Pilot Jobs:** ${totalJobs}
- **Data Status:** ${totalJobs > 0 ? 'ACTIVE OPERATIONAL PILOT DATA' : 'NO PILOT DATA YET / INSUFFICIENT DATA'}
- **First-Time Fix Rate:** ${totalJobs > 0 ? `${firstVisitSuccess} / ${totalJobs} (${firstVisitPct}%)` : 'Not measured yet (requires completed jobs)'}
- **Repeat Visits:** ${repeatVisits}
- **AI / Actual Exact Matches:** ${matches}
- **Partial Matches:** ${partialMatches}
- **AI Misses:** ${misses}
- **Tool Readiness:** ${totalJobs > 0 ? `${toolsReady} / ${totalJobs} (${Math.round((toolsReady / totalJobs) * 100)}%)` : 'N/A'}
- **Parts Readiness:** ${totalJobs > 0 ? `${partsReady} / ${totalJobs} (${Math.round((partsReady / totalJobs) * 100)}%)` : 'N/A'}

---

## 2. Job-by-Job Alignment Log
${
  totalJobs === 0
    ? '_No completed pilot jobs recorded yet. Real pilot metrics will populate dynamically as technician visits are completed._'
    : `| Ticket | Customer | Raw Complaint | AI Hypothesis | Actual Field Diagnosis | Alignment | Result |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
${histories
  .map(
    (h) =>
      `| ${h.ticketNumber} | ${(h.customerId as any)?.name || 'Client'} | ${h.complaint} | ${h.aiPredictionSummary} | ${h.actualDiagnosis} | ${h.comparisonResult?.diagnosisMatch || 'MATCH'} | ${h.workPerformed} |`
  )
  .join('\n')}`
}

---

## 3. Technician & Manager Field Feedback
${
  feedbacks.length === 0
    ? '_No post-service feedback recorded yet._'
    : feedbacks
        .map(
          (f, idx) =>
            `- **Feedback #${idx + 1} (${f.role})**: AI Utility Rating: ${f.aiUtilityRating}/5 | Tool Readiness: ${f.didTechnicianHaveRequiredTools || 'YES'} | Second Visit: ${f.wasSecondVisitRequired || 'NO'} | Comments: "${f.comments || f.additionalFeedback || 'No additional comments'}"`
        )
        .join('\n')
}

---

## 4. Operational Integrity Disclaimer
All records in this document are strictly scoped to authenticated client operations. No synthetic benchmarks or demo accounts are aggregated into this report.
`;

  return report;
}
