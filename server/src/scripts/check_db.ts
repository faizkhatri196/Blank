import { connectDB, disconnectDB } from '../config/db';
import { Customer } from '../models/Customer';
import { SolarSystem } from '../models/SolarSystem';
import { Company } from '../models/Company';
import { ServiceTicket } from '../models/ServiceTicket';

async function check() {
  await connectDB();
  const companies = await Company.find();
  console.log('--- COMPANIES ---');
  for (const c of companies) {
    console.log(`Company: ${c.name} (${c._id}) isPilot: ${c.isPilot}`);
    const custCount = await Customer.countDocuments({ companyId: c._id });
    const solarCount = await SolarSystem.countDocuments({ companyId: c._id });
    const ticketCount = await ServiceTicket.countDocuments({ companyId: c._id });
    console.log(`  -> Customers: ${custCount}, Solar: ${solarCount}, Tickets: ${ticketCount}`);
  }
  await disconnectDB();
}

check().catch(console.error);
