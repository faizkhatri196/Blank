import { TicketStatus, ServiceType } from '../types';
import { ServiceTicket, IServiceTicket } from '../models/ServiceTicket';
import mongoose from 'mongoose';

const VALID_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  NEW: ['AI_ANALYZED', 'WAITING_FOR_ASSIGNMENT', 'ASSIGNED', 'CANCELLED'],
  AI_ANALYZED: ['WAITING_FOR_ASSIGNMENT', 'ASSIGNED', 'CANCELLED'],
  WAITING_FOR_ASSIGNMENT: ['ASSIGNED', 'CANCELLED'],
  ASSIGNED: ['ACCEPTED', 'CANCELLED', 'WAITING_FOR_ASSIGNMENT'],
  ACCEPTED: ['ON_THE_WAY', 'ON_SITE', 'CANCELLED'],
  ON_THE_WAY: ['ON_SITE', 'CANCELLED'],
  ON_SITE: ['DIAGNOSING', 'REPAIRING', 'COMPLETED', 'CANCELLED'],
  DIAGNOSING: ['REPAIRING', 'COMPLETED', 'CANCELLED'],
  REPAIRING: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [], // terminal state
  CANCELLED: [], // terminal state
};

export function isValidStatusTransition(
  currentStatus: TicketStatus,
  targetStatus: TicketStatus,
  isManager = false
): boolean {
  if (currentStatus === targetStatus) return true;
  // Managers have override capability for operational reassignments, but cannot resurrect cancelled/completed without re-opening
  if (isManager && targetStatus !== currentStatus) {
    return true;
  }
  const allowed = VALID_TRANSITIONS[currentStatus] || [];
  return allowed.includes(targetStatus);
}

export async function generateTicketNumber(
  companyId: mongoose.Types.ObjectId,
  serviceType: ServiceType
): Promise<string> {
  const prefix = serviceType === 'SOLAR' ? 'SOL' : 'AC';
  const year = new Date().getFullYear();

  // Find highest existing sequence for this company and serviceType this year
  const regex = new RegExp(`^${prefix}-${year}-(\\d{4})$`);
  const tickets = await ServiceTicket.find({
    companyId,
    ticketNumber: { $regex: regex },
  })
    .select('ticketNumber')
    .sort({ ticketNumber: -1 })
    .limit(1);

  let nextSeq = 1;
  if (tickets.length > 0) {
    const match = tickets[0].ticketNumber.match(regex);
    if (match && match[1]) {
      nextSeq = parseInt(match[1], 10) + 1;
    }
  }

  const paddedSeq = String(nextSeq).padStart(4, '0');
  return `${prefix}-${year}-${paddedSeq}`;
}
