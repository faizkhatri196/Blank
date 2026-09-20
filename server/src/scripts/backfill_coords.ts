import dns from 'node:dns';
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {}
import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { Company } from '../models/Company';

async function run() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log('Connected to DB');

  const companies = await Company.find({});
  for (const c of companies) {
    let modified = false;
    for (const sa of c.serviceAreas) {
      if (sa.city && sa.city.toLowerCase().includes('mundra')) {
        if (!sa.latitude || !sa.longitude || !sa.center || sa.center.coordinates[0] === 0) {
          sa.latitude = 22.8393153;
          sa.longitude = 69.7249477;
          sa.center = { type: 'Point', coordinates: [69.7249477, 22.8393153] };
          modified = true;
          console.log(`Updated coordinates for Mundra in company: ${c.name}`);
        }
      }
    }
    if (modified) {
      await c.save();
    }
  }

  console.log('Done backfilling coordinates.');
  await mongoose.disconnect();
}

run().catch(console.error);
