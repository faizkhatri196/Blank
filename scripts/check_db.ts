import { connectDB, disconnectDB } from '../server/src/config/db';
import { Customer } from '../server/src/models/Customer';
import { SolarSystem } from '../server/src/models/SolarSystem';
import { Company } from '../server/src/models/Company';
import { User } from '../server/src/models/User';
import { ServiceTicket } from '../server/src/models/ServiceTicket';

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
