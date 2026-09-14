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
