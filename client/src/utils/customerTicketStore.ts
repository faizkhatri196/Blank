import { CustomerSafeTicket } from '../types';
import { apiClient } from '../api/client';

export const TICKET_IDS_KEY = 'servora_customer_ticket_ids';
export const BOOKINGS_KEY = 'servora_customer_booking_history';

/**
 * Get list of stored ticket IDs from localStorage
 */
export function getStoredTicketIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(TICKET_IDS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string' && id.trim().length > 0) : [];
  } catch (err) {
    console.warn('[customerTicketStore] Failed to read ticket IDs from localStorage:', err);
    return [];
  }
}

/**
 * Normalizes any partial or legacy stored booking into a valid CustomerSafeTicket structure
 */
export function normalizeTicket(item: any): CustomerSafeTicket {
  const city = item?.serviceLocation?.city || item?.city || 'Local Area';
  const address = item?.serviceLocation?.address || item?.address || 'Service Location';
  const pincode = item?.serviceLocation?.pincode || item?.pincode;

  return {
    _id: String(item._id || item.id || `ticket_${Date.now()}`),
    ticketNumber: String(item.ticketNumber || 'SRV-PENDING'),
    serviceType: item.serviceType || 'SOLAR',
    problemCategory: item.problemCategory || item.category || 'General Service',
    problemCode: item.problemCode || 'GENERAL',
    rawComplaint: item.rawComplaint || item.complaint || '',
    normalizedComplaint: item.normalizedComplaint || item.complaint || 'Service request booked.',
    serviceLocation: {
      address,
      city,
      pincode,
      locationSource: item?.serviceLocation?.locationSource || item?.serviceLocation?.source || 'MANUAL',
      coordinates: item?.serviceLocation?.coordinates,
    },
    photos: Array.isArray(item.photos) ? item.photos : [],
    status: item.status || 'AI_ANALYZED',
    customerStatusLabel: item.customerStatusLabel || (item.status === 'COMPLETED' ? 'Completed' : item.status === 'CANCELLED' ? 'Cancelled' : 'Service Team Reviewing'),
    customerTimeline: Array.isArray(item.customerTimeline) && item.customerTimeline.length > 0
      ? item.customerTimeline
      : [
          { key: 'SUBMITTED', label: 'Request Submitted', status: 'COMPLETED', timestamp: item.createdAt || new Date().toISOString() },
          { key: 'REVIEWING', label: 'Service Team Reviewing', status: item.status === 'AI_ANALYZED' ? 'CURRENT' : 'COMPLETED' },
          { key: 'ASSIGNED', label: 'Service Professional Assigned', status: ['ASSIGNED', 'ACCEPTED', 'ON_THE_WAY', 'ON_SITE', 'IN_PROGRESS', 'COMPLETED'].includes(item.status) ? 'COMPLETED' : 'PENDING' },
          { key: 'ACCEPTED', label: 'Accepted', status: ['ACCEPTED', 'ON_THE_WAY', 'ON_SITE', 'IN_PROGRESS', 'COMPLETED'].includes(item.status) ? 'COMPLETED' : 'PENDING' },
          { key: 'ON_THE_WAY', label: 'On The Way', status: ['ON_THE_WAY', 'ON_SITE', 'IN_PROGRESS', 'COMPLETED'].includes(item.status) ? 'COMPLETED' : 'PENDING' },
          { key: 'ON_SITE', label: 'Arrived / On Site', status: ['ON_SITE', 'IN_PROGRESS', 'COMPLETED'].includes(item.status) ? 'COMPLETED' : 'PENDING' },
          { key: 'IN_PROGRESS', label: 'Service In Progress', status: ['IN_PROGRESS', 'COMPLETED'].includes(item.status) ? 'COMPLETED' : 'PENDING' },
          { key: 'COMPLETED', label: 'Completed', status: item.status === 'COMPLETED' ? 'COMPLETED' : 'PENDING' },
        ],
    assignedProfessionalRole: item.assignedProfessionalRole,
    assignedProfessionalName: item.assignedProfessionalName,
    approvedCompanyContact: item.approvedCompanyContact,
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: item.updatedAt || new Date().toISOString(),
    completedAt: item.completedAt,
    feedback: item.feedback,
    statusNote: item.statusNote,
    cancellationReason: item.cancellationReason,
  };
}

/**
 * Get all cached tickets from localStorage
 */
export function getStoredBookings(): CustomerSafeTicket[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(BOOKINGS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeTicket);
  } catch (err) {
    console.warn('[customerTicketStore] Failed to read stored bookings:', err);
    return [];
  }
}

/**
 * Save or update a ticket in localStorage
 */
export function saveTicketToStore(ticket: Partial<CustomerSafeTicket> & { _id: string }): CustomerSafeTicket {
  const normalized = normalizeTicket(ticket);
  if (typeof window === 'undefined') return normalized;

  try {
    // 1. Update ticket IDs
    const ids = getStoredTicketIds();
    if (!ids.includes(normalized._id)) {
      ids.unshift(normalized._id);
      localStorage.setItem(TICKET_IDS_KEY, JSON.stringify(ids));
    }

    // 2. Update booking history objects
    const current = getStoredBookings();
    const existingIndex = current.findIndex((b) => b._id === normalized._id);
    if (existingIndex >= 0) {
      current[existingIndex] = { ...current[existingIndex], ...normalized };
    } else {
      current.unshift(normalized);
    }
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(current.slice(0, 50)));
  } catch (err) {
    console.warn('[customerTicketStore] Failed to save ticket to localStorage:', err);
  }

  return normalized;
}

/**
 * Update the status of a stored ticket (e.g. cancellation)
 */
export function updateTicketStatusInStore(
  ticketId: string,
  status: any,
  customerStatusLabel: string,
  reason?: string
): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getStoredBookings();
    const target = current.find((t) => t._id === ticketId);
    if (target) {
      target.status = status;
      target.customerStatusLabel = customerStatusLabel;
      if (reason) target.cancellationReason = reason;
      target.updatedAt = new Date().toISOString();
      localStorage.setItem(BOOKINGS_KEY, JSON.stringify(current));
    }
  } catch (err) {
    console.warn('[customerTicketStore] Failed to update ticket status in store:', err);
  }
}

/**
 * Resilient customer tickets fetcher:
 * 1. Immediate retrieval from local cached bookings
 * 2. Background fetch via /customer-portal/requests if possible
 * 3. Fallback to parallel individual /customer-portal/requests/:id fetches (which work without auth)
 * 4. Merges, updates localStorage, and returns complete unified list
 */
export async function fetchCustomerTicketsResilient(userId?: string): Promise<CustomerSafeTicket[]> {
  const cachedTickets = getStoredBookings();
  const ticketMap = new Map<string, CustomerSafeTicket>();

  // Seed map with existing cached tickets
  cachedTickets.forEach((t) => ticketMap.set(t._id, t));

  const storedIds = getStoredTicketIds();

  // Try bulk request query
  let bulkSuccess = false;
  try {
    const queryParams = new URLSearchParams();
    if (storedIds.length > 0) {
      queryParams.set('ticketIds', storedIds.join(','));
    }
    const url = `/customer-portal/requests${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const res = await apiClient.get(url);

    if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
      bulkSuccess = true;
      res.data.data.forEach((srvTicket: any) => {
        const norm = normalizeTicket(srvTicket);
        ticketMap.set(norm._id, norm);
        saveTicketToStore(norm);
      });
    }
  } catch (bulkErr) {
    // Expected if remote server returns 401 for unauthenticated sessions
    console.debug('[customerTicketStore] Bulk requests query bypassed or unauthenticated:', bulkErr);
  }

  // If bulk didn't return any tickets but we have stored ticket IDs,
  // fetch each ticket directly via GET /customer-portal/requests/:id
  // This endpoint works publicly without requiring login!
  if (!bulkSuccess && storedIds.length > 0) {
    const fetchPromises = storedIds.slice(0, 20).map(async (id) => {
      try {
        const res = await apiClient.get(`/customer-portal/requests/${id}`);
        if (res.data?.success && res.data.data?._id) {
          const norm = normalizeTicket(res.data.data);
          ticketMap.set(norm._id, norm);
          saveTicketToStore(norm);
          return norm;
        }
      } catch (singleErr) {
        console.debug(`[customerTicketStore] Could not fetch ticket ${id} directly:`, singleErr);
      }
      return null;
    });

    await Promise.allSettled(fetchPromises);
  }

  // Convert map to array and sort newest first
  const result = Array.from(ticketMap.values()).sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime() || 0;
    const timeB = new Date(b.createdAt).getTime() || 0;
    return timeB - timeA;
  });

  return result;
}
