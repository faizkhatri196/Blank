import { connectDB, disconnectDB } from '../config/db';
import { ServiceTicket } from '../models/ServiceTicket';
import { ServiceReport } from '../models/ServiceReport';

async function run() {
  console.log('Connecting to database...');
  await connectDB();
  console.log('Connected to MongoDB!');

  const ticket = await ServiceTicket.findOne({ serviceType: 'SOLAR' }).sort({ createdAt: -1 });
  if (!ticket) {
    console.error('No solar ticket found!');
    await disconnectDB();
    process.exit(1);
  }

  console.log(`Found ticket: ${ticket.ticketNumber} (Status: ${ticket.status})`);

  const now = new Date();
  const t1 = new Date(now.getTime() - 1000 * 60 * 60 * 2);
  const t2 = new Date(now.getTime() - 1000 * 60 * 45);
  const t3 = new Date(now.getTime() - 1000 * 60 * 30);
  const t4 = new Date(now.getTime() - 1000 * 60 * 15);

  ticket.status = 'COMPLETED';
  ticket.statusHistory.push(
    { status: 'ACCEPTED', changedBy: ticket.assignedTechnicianId as any, timestamp: t1, note: 'Technician accepted dispatch' },
    { status: 'ON_THE_WAY', changedBy: ticket.assignedTechnicianId as any, timestamp: t2, note: 'Technician en route to site' },
    { status: 'ON_SITE', changedBy: ticket.assignedTechnicianId as any, timestamp: t3, note: 'Technician arrived at site' },
    { status: 'DIAGNOSING', changedBy: ticket.assignedTechnicianId as any, timestamp: t4, note: 'Beginning physical diagnostics' },
    { status: 'COMPLETED', changedBy: ticket.assignedTechnicianId as any, timestamp: now, note: 'Service verified and completed' }
  );
  ticket.customerFeedback = {
    rating: 5,
    comment: 'Outstanding response! Inverter fixed and generating peak power.',
    onTime: true,
    resolved: true,
    submittedAt: now,
  };

  await ticket.save();
  console.log(`Updated ticket ${ticket.ticketNumber} to COMPLETED with 5-star customer feedback!`);

  let report = await ServiceReport.findOne({ ticketId: ticket._id });
  if (!report) {
    report = await ServiceReport.create({
      ticketId: ticket._id,
      companyId: ticket.companyId,
      technicianId: ticket.assignedTechnicianId,
      workDone: 'Inspected DC disconnect switch, reset thermal overload relay, tested solar string voltage under load (5.2 kW).',
      rootCause: 'Inverter thermal surge protection tripped due to peak afternoon voltage fluctuation.',
      resolutionStatus: 'RESOLVED',
      partsUsed: [
        { name: 'Thermal Overload Relay Reset', quantity: 1, cost: 0 },
        { name: 'MC4 Connector Inspection Seal', quantity: 2, cost: 150 },
      ],
      readings: {
        dcVoltage: '385 V',
        acVoltage: '232 V',
        outputPower: '5.2 kW',
        inverterTemperature: '48 C',
      },
      aiVsActual: {
        expectedIssue: 'Inverter Thermal / Overvoltage Surge Protection',
        actualFinding: 'Inverter thermal overload relay tripped due to peak afternoon grid fluctuation',
        aiAccuracyMatch: true,
        varianceNotes: 'AI diagnostic classification matched ground physical cause accurately',
      },
      completedAt: now,
    });
    console.log(`Created ServiceReport with AI vs Actual diagnostic comparison!`);
  } else {
    console.log(`ServiceReport already exists.`);
  }

  await disconnectDB();
  console.log('Done successfully!');
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
