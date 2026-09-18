import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { ServiceTicket } from '../models/ServiceTicket';
import { Technician } from '../models/Technician';
import { Customer } from '../models/Customer';
import { ActiveFieldOperation, LocationFreshness, TicketStatus } from '../types';

export async function getActiveFieldOperations(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.companyId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Company context required' } });
      return;
    }

    const companyId = req.companyId;

    // Active status filter
    const activeStatuses: TicketStatus[] = ['ASSIGNED', 'ACCEPTED', 'ON_THE_WAY', 'ON_SITE', 'DIAGNOSING', 'REPAIRING'];

    // Start of today (UTC midnight)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [activeTickets, completedTodayCount] = await Promise.all([
      ServiceTicket.find({
        companyId,
        status: { $in: activeStatuses },
      })
        .populate('assignedTechnicianId')
        .populate('customerId')
        .sort({ updatedAt: -1 }),
      ServiceTicket.countDocuments({
        companyId,
        status: 'COMPLETED',
        updatedAt: { $gte: startOfToday },
      }),
    ]);

    let onTheWayCount = 0;
    let onSiteCount = 0;
    let diagnosingCount = 0;
    let repairingCount = 0;

    const operations: ActiveFieldOperation[] = activeTickets.map((ticket) => {
      const techDoc: any = ticket.assignedTechnicianId;
      const custDoc: any = ticket.customerId;

      if (ticket.status === 'ON_THE_WAY') onTheWayCount++;
      if (ticket.status === 'ON_SITE') onSiteCount++;
      if (ticket.status === 'DIAGNOSING') diagnosingCount++;
      if (ticket.status === 'REPAIRING') repairingCount++;

      // Location freshness calculation
      let freshness: LocationFreshness = {
        level: 'UNAVAILABLE',
        label: 'Location unavailable',
        color: 'slate',
      };

      if (techDoc?.currentLocation?.timestamp) {
        const diffMs = Date.now() - new Date(techDoc.currentLocation.timestamp).getTime();
        const diffMinutes = Math.floor(diffMs / 60000);
        freshness.minutesAgo = diffMinutes;

        if (diffMinutes < 2) {
          freshness = {
            level: 'FRESH',
            label: diffMinutes === 0 ? 'Updated just now' : `Updated ${diffMinutes}m ago`,
            color: 'emerald',
            minutesAgo: diffMinutes,
          };
        } else if (diffMinutes <= 10) {
          freshness = {
            level: 'WARM',
            label: `Updated ${diffMinutes}m ago`,
            color: 'amber',
            minutesAgo: diffMinutes,
          };
        } else {
          freshness = {
            level: 'STALE',
            label: `Last known ${diffMinutes}m ago`,
            color: 'rose',
            minutesAgo: diffMinutes,
          };
        }
      }

      // Progress milestones
      const statusOrder: TicketStatus[] = ['ASSIGNED', 'ACCEPTED', 'ON_THE_WAY', 'ON_SITE', 'DIAGNOSING', 'REPAIRING', 'COMPLETED'];
      const currentIndex = statusOrder.indexOf(ticket.status);

      const progressSteps = [
        { key: 'ASSIGNED', label: 'Assigned', completed: currentIndex >= 0, current: ticket.status === 'ASSIGNED' },
        { key: 'ACCEPTED', label: 'Accepted', completed: currentIndex >= 1, current: ticket.status === 'ACCEPTED' },
        { key: 'ON_THE_WAY', label: 'On The Way', completed: currentIndex >= 2, current: ticket.status === 'ON_THE_WAY' },
        { key: 'ON_SITE', label: 'On Site', completed: currentIndex >= 3, current: ticket.status === 'ON_SITE' },
        { key: 'DIAGNOSING', label: 'Diagnosing', completed: currentIndex >= 4, current: ticket.status === 'DIAGNOSING' },
        { key: 'REPAIRING', label: 'Repairing', completed: currentIndex >= 5, current: ticket.status === 'REPAIRING' },
        { key: 'COMPLETED', label: 'Completed', completed: currentIndex >= 6, current: ticket.status === 'COMPLETED' },
      ];

      // ETA estimation
      let etaMinutes: number | undefined;
      if (ticket.status === 'ON_THE_WAY') {
        const onTheWayEntry = ticket.statusHistory.find((h) => h.status === 'ON_THE_WAY');
        if (onTheWayEntry) {
          const elapsedMin = Math.floor((Date.now() - new Date(onTheWayEntry.timestamp).getTime()) / 60000);
          etaMinutes = Math.max(2, 20 - elapsedMin);
        } else {
          etaMinutes = 18;
        }
      }

      // Latest technician activity
      const latestHistory = ticket.statusHistory[ticket.statusHistory.length - 1];
      const latestActivity = {
        action: latestHistory ? `Status moved to ${latestHistory.status.replace(/_/g, ' ')}` : 'Job dispatched',
        timestamp: latestHistory ? latestHistory.timestamp.toISOString() : ticket.updatedAt.toISOString(),
        note: latestHistory?.note || (ticket.status === 'ON_THE_WAY' ? 'Technician started travelling to customer location.' : undefined),
      };

      const statusLabels: Record<string, string> = {
        ASSIGNED: 'Assigned to Tech',
        ACCEPTED: 'Job Accepted',
        ON_THE_WAY: 'On The Way',
        ON_SITE: 'Arrived On Site',
        DIAGNOSING: 'Diagnosing',
        REPAIRING: 'Repairing Issue',
        COMPLETED: 'Completed',
      };

      return {
        ticketId: ticket._id.toString(),
        ticketNumber: ticket.ticketNumber,
        serviceType: ticket.serviceType,
        problemCategory: ticket.problemCategory || (ticket.serviceType === 'SOLAR' ? 'Solar Service' : 'AC Service'),
        customerName: custDoc?.name || 'Customer Site',
        customerPhone: custDoc?.phone,
        serviceLocation: {
          address: custDoc?.address || 'Site Address',
          city: custDoc?.city || 'Service Area',
          area: custDoc?.area,
          pincode: custDoc?.pincode,
        },
        technician: techDoc
          ? {
              id: techDoc._id.toString(),
              name: techDoc.name,
              phone: techDoc.phone,
              profilePhoto: techDoc.profilePhoto,
              currentLocation: techDoc.currentLocation
                ? {
                    latitude: techDoc.currentLocation.latitude,
                    longitude: techDoc.currentLocation.longitude,
                    address: techDoc.currentLocation.address,
                    accuracy: techDoc.currentLocation.accuracy,
                    timestamp: techDoc.currentLocation.timestamp?.toISOString(),
                  }
                : undefined,
              locationFreshness: freshness,
            }
          : null,
        status: ticket.status,
        statusLabel: statusLabels[ticket.status] || ticket.status,
        etaMinutes,
        startedAt: ticket.startedAt?.toISOString(),
        latestActivity,
        progressSteps,
      };
    });

    res.json({
      success: true,
      data: {
        kpis: {
          activeCount: activeTickets.length,
          activeServices: activeTickets.length,
          onTheWayCount,
          onTheWay: onTheWayCount,
          onSiteCount,
          onSite: onSiteCount,
          diagnosingCount,
          diagnosing: diagnosingCount,
          repairingCount,
          repairing: repairingCount,
          completedTodayCount,
          completedToday: completedTodayCount,
        },
        operations,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}
