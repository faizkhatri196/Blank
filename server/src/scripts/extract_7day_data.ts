import { connectDB, disconnectDB } from '../config/db';
import { Company } from '../models/Company';
import { User } from '../models/User';
import { Customer } from '../models/Customer';
import { Technician } from '../models/Technician';
import { ServiceTicket } from '../models/ServiceTicket';
import { ServiceReport } from '../models/ServiceReport';
import fs from 'fs';
import path from 'path';

async function extract() {
  await connectDB();

  const now = new Date();
  const start7DaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const start14DaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  console.log(`[Report Extraction] Current Time: ${now.toISOString()}`);
  console.log(`[Report Extraction] Last 7 Days Range: ${start7DaysAgo.toISOString()} -> ${now.toISOString()}`);
  console.log(`[Report Extraction] Previous 7 Days Range: ${start14DaysAgo.toISOString()} -> ${start7DaysAgo.toISOString()}`);

  // Fetch all companies
  const allCompanies = await Company.find().lean();
  const allUsers = await User.find().lean();
  const allCustomers = await Customer.find().lean();
  const allTechnicians = await Technician.find().lean();
  const allTickets = await ServiceTicket.find().lean();
  const allReports = await ServiceReport.find().lean();

  console.log(`[DB Stats] Total in DB: Companies=${allCompanies.length}, Users=${allUsers.length}, Customers=${allCustomers.length}, Technicians=${allTechnicians.length}, Tickets=${allTickets.length}, Reports=${allReports.length}`);

  // Masking helpers
  const maskEmail = (email?: string | null) => {
    if (!email) return 'N/A';
    const parts = email.split('@');
    if (parts.length !== 2) return email;
    const name = parts[0];
    const domain = parts[1];
    if (name.length <= 2) return `${name[0]}*@${domain}`;
    return `${name.substring(0, 2)}${'*'.repeat(Math.min(4, name.length - 2))}@${domain}`;
  };

  const maskPhone = (phone?: string | null) => {
    if (!phone) return 'N/A';
    const clean = phone.trim();
    if (clean.length <= 4) return '****';
    const last4 = clean.slice(-4);
    const prefix = clean.startsWith('+91') ? '+91 ' : (clean.startsWith('+') ? clean.slice(0, 3) + ' ' : '');
    return `${prefix}******${last4}`;
  };

  // Compile raw payload
  const payload = {
    reportGeneratedAt: now.toISOString(),
    timezone: 'Asia/Kolkata (IST, UTC+05:30) / UTC',
    timeRanges: {
      last7Days: {
        start: start7DaysAgo.toISOString(),
        end: now.toISOString(),
      },
      previous7Days: {
        start: start14DaysAgo.toISOString(),
        end: start7DaysAgo.toISOString(),
      },
    },
    rawStats: {
      totalCompanies: allCompanies.length,
      totalUsers: allUsers.length,
      totalCustomers: allCustomers.length,
      totalTechnicians: allTechnicians.length,
      totalTickets: allTickets.length,
      totalReports: allReports.length,
    },
    companies: allCompanies.map(c => {
      // Find associated records
      const cTechs = allTechnicians.filter(t => t.companyId?.toString() === c._id.toString());
      const cCusts = allCustomers.filter(cust => cust.companyId?.toString() === c._id.toString());
      const cTickets = allTickets.filter(t => t.companyId?.toString() === c._id.toString());
      
      // Calculate latest activity
      const activityDates: Date[] = [];
      if (c.updatedAt) activityDates.push(new Date(c.updatedAt));
      if (c.createdAt) activityDates.push(new Date(c.createdAt));
      cTickets.forEach(t => {
        if (t.updatedAt) activityDates.push(new Date(t.updatedAt));
        if (t.createdAt) activityDates.push(new Date(t.createdAt));
      });
      cTechs.forEach(t => {
        if (t.updatedAt) activityDates.push(new Date(t.updatedAt));
      });
      activityDates.sort((a, b) => b.getTime() - a.getTime());

      // Extract unique cities from serviceAreas
      const serviceAreaCities = Array.from(new Set(c.serviceAreas?.map(sa => sa.city).filter(Boolean) || []));

      return {
        id: c._id.toString(),
        name: c.name,
        email: c.email,
        phone: c.phone,
        address: c.address,
        active: c.active,
        isPilot: c.isPilot,
        environmentContext: c.environmentContext,
        servicesSupported: c.servicesSupported || [],
        serviceAreasCount: c.serviceAreas?.length || 0,
        serviceAreaCities,
        serviceAreasDetails: c.serviceAreas || [],
        registeredTechniciansCount: cTechs.length,
        registeredCustomersCount: cCusts.length,
        serviceRequestsCount: cTickets.length,
        createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : null,
        updatedAt: c.updatedAt ? new Date(c.updatedAt).toISOString() : null,
        lastActivity: activityDates.length > 0 ? activityDates[0].toISOString() : (c.createdAt ? new Date(c.createdAt).toISOString() : null),
        isNewInLast7Days: c.createdAt ? new Date(c.createdAt) >= start7DaysAgo : false,
        isNewInPrev7Days: c.createdAt ? (new Date(c.createdAt) >= start14DaysAgo && new Date(c.createdAt) < start7DaysAgo) : false,
      };
    }),
    customers: allCustomers.map(cust => {
      const custTickets = allTickets.filter(t => t.customerId?.toString() === cust._id.toString());
      const cCompany = allCompanies.find(c => c._id.toString() === cust.companyId?.toString());
      const usedServices = Array.from(new Set(custTickets.map(t => t.serviceType).filter(Boolean)));
      
      const activityDates: Date[] = [];
      if (cust.updatedAt) activityDates.push(new Date(cust.updatedAt));
      if (cust.createdAt) activityDates.push(new Date(cust.createdAt));
      custTickets.forEach(t => {
        if (t.updatedAt) activityDates.push(new Date(t.updatedAt));
      });
      activityDates.sort((a, b) => b.getTime() - a.getTime());

      return {
        id: cust._id.toString(),
        name: cust.name,
        maskedEmail: maskEmail(cust.email),
        maskedPhone: maskPhone(cust.phone),
        companyId: cust.companyId?.toString() || null,
        companyName: cCompany?.name || 'Missing / Orphaned',
        city: cust.city || 'N/A',
        state: cust.state || 'N/A',
        address: cust.address || 'N/A',
        requestsCount: custTickets.length,
        usedServices,
        lastActivity: activityDates.length > 0 ? activityDates[0].toISOString() : (cust.createdAt ? new Date(cust.createdAt).toISOString() : null),
        createdAt: cust.createdAt ? new Date(cust.createdAt).toISOString() : null,
        isNewInLast7Days: cust.createdAt ? new Date(cust.createdAt) >= start7DaysAgo : false,
        isNewInPrev7Days: cust.createdAt ? (new Date(cust.createdAt) >= start14DaysAgo && new Date(cust.createdAt) < start7DaysAgo) : false,
      };
    }),
    technicians: allTechnicians.map(tech => {
      const techTickets = allTickets.filter(t => t.assignedTechnicianId?.toString() === tech._id.toString());
      const completedTickets = techTickets.filter(t => t.status === 'COMPLETED');
      const tCompany = allCompanies.find(c => c._id.toString() === tech.companyId?.toString());

      const activityDates: Date[] = [];
      if (tech.updatedAt) activityDates.push(new Date(tech.updatedAt));
      if (tech.createdAt) activityDates.push(new Date(tech.createdAt));
      techTickets.forEach(t => {
        if (t.updatedAt) activityDates.push(new Date(t.updatedAt));
      });
      activityDates.sort((a, b) => b.getTime() - a.getTime());

      return {
        id: tech._id.toString(),
        name: tech.name,
        companyId: tech.companyId?.toString() || null,
        companyName: tCompany?.name || 'Missing / Orphaned',
        serviceTypes: tech.serviceTypes || [],
        skills: tech.skills || [],
        serviceAreas: tech.serviceAreas || [],
        baseLocation: tech.baseLocation || {},
        availability: tech.availability || 'UNKNOWN',
        active: tech.active,
        assignedTicketsCount: techTickets.length,
        completedTicketsCount: completedTickets.length,
        lastActivity: activityDates.length > 0 ? activityDates[0].toISOString() : (tech.createdAt ? new Date(tech.createdAt).toISOString() : null),
        createdAt: tech.createdAt ? new Date(tech.createdAt).toISOString() : null,
        isNewInLast7Days: tech.createdAt ? new Date(tech.createdAt) >= start7DaysAgo : false,
        isNewInPrev7Days: tech.createdAt ? (new Date(tech.createdAt) >= start14DaysAgo && new Date(tech.createdAt) < start7DaysAgo) : false,
      };
    }),
    tickets: allTickets.map(t => {
      const tCompany = allCompanies.find(c => c._id.toString() === t.companyId?.toString());
      const tCust = allCustomers.find(c => c._id.toString() === t.customerId?.toString());
      const tTech = allTechnicians.find(tech => tech._id.toString() === t.assignedTechnicianId?.toString());

      return {
        id: t._id.toString(),
        ticketNumber: t.ticketNumber,
        serviceType: t.serviceType,
        status: t.status,
        priority: t.priority,
        complaint: t.complaint,
        city: t.serviceLocation?.city || t.serviceLocationSnapshot?.city || 'N/A',
        area: t.serviceLocation?.area || 'N/A',
        pincode: t.serviceLocation?.pincode || t.serviceLocationSnapshot?.postalCode || 'N/A',
        companyId: t.companyId?.toString() || null,
        companyName: tCompany?.name || 'Missing Company',
        customerId: t.customerId?.toString() || null,
        customerName: tCust?.name || 'Missing Customer',
        assignedTechnicianId: t.assignedTechnicianId?.toString() || null,
        technicianName: tTech?.name || (t.assignedTechnicianId ? 'Unknown Technician' : 'Unassigned'),
        isDemoData: t.isDemoData || false,
        createdAt: t.createdAt ? new Date(t.createdAt).toISOString() : null,
        updatedAt: t.updatedAt ? new Date(t.updatedAt).toISOString() : null,
        completedAt: t.completedAt ? new Date(t.completedAt).toISOString() : null,
        isNewInLast7Days: t.createdAt ? new Date(t.createdAt) >= start7DaysAgo : false,
        isNewInPrev7Days: t.createdAt ? (new Date(t.createdAt) >= start14DaysAgo && new Date(t.createdAt) < start7DaysAgo) : false,
      };
    }),
    users: allUsers.map(u => ({
      id: u._id.toString(),
      name: u.name,
      role: u.role,
      active: u.active,
      companyId: u.companyId?.toString() || null,
      createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : null,
      isNewInLast7Days: u.createdAt ? new Date(u.createdAt) >= start7DaysAgo : false,
      isNewInPrev7Days: u.createdAt ? (new Date(u.createdAt) >= start14DaysAgo && new Date(u.createdAt) < start7DaysAgo) : false,
    }))
  };

  const outputPath = path.resolve(__dirname, '../../../report_db_dump.json');
  fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2), 'utf-8');
  console.log(`[Success] Raw report data dumped to: ${outputPath}`);

  await disconnectDB();
}

extract().catch(err => {
  console.error('[Error] Extraction failed:', err);
  process.exit(1);
});
