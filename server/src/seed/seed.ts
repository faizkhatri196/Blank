import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../config/db';
import {
  Company,
  User,
  Technician,
  Customer,
  SolarSystem,
  ACUnit,
  ServiceTicket,
  AIAnalysis,
  ServiceReport,
  ServiceHistory,
  PilotFeedback,
  AuditLog,
} from '../models';

export async function seedDatabase() {
  console.log('[Seed] Connecting to database...');
  await connectDB();

  console.log('[Seed] Clearing existing demo data...');
  const demoCompany = await Company.findOne({ email: 'contact@demofieldservices.com' });
  if (demoCompany) {
    const cId = demoCompany._id;
    await Promise.all([
      User.deleteMany({ companyId: cId }),
      Technician.deleteMany({ companyId: cId }),
      Customer.deleteMany({ companyId: cId }),
      SolarSystem.deleteMany({ companyId: cId }),
      ACUnit.deleteMany({ companyId: cId }),
      ServiceTicket.deleteMany({ companyId: cId }),
      ServiceHistory.deleteMany({ companyId: cId }),
      PilotFeedback.deleteMany({ companyId: cId }),
      AuditLog.deleteMany({ companyId: cId }),
      Company.deleteOne({ _id: cId }),
    ]);
  }

  console.log('[Seed] Creating Demo Company...');
  const company = await Company.create({
    name: 'Demo Field Services',
    email: 'contact@demofieldservices.com',
    phone: '+91 98765 00000',
    address: 'B-402, Titanium City Centre, Prahlad Nagar, Ahmedabad, Gujarat 380015',
    servicesSupported: ['SOLAR', 'AC'],
    isPilot: false,
    environmentContext: 'DEMO',
    settings: {
      allowBlindEvaluation: true,
      defaultCurrency: 'INR',
    },
    active: true,
  });
  const companyId = company._id as mongoose.Types.ObjectId;

  console.log('[Seed] Creating Users and Technicians...');
  const demoPasswordHash = await bcrypt.hash('Demo@12345', 10);

  // 1. Service Manager
  const managerUser = await User.create({
    companyId,
    name: 'Rajesh Mehta',
    email: 'manager@demo.com',
    phone: '+91 98765 11111',
    passwordHash: demoPasswordHash,
    role: 'SERVICE_MANAGER',
    active: true,
  });

  // 2. 5 Distinct Technicians
  const techProfilesData = [
    {
      name: 'Rahul Sharma',
      email: 'rahul@demo.com',
      phone: '+91 98765 22221',
      experienceYears: 5,
      serviceTypes: ['SOLAR'] as const,
      skills: ['SOLAR_INSTALLATION', 'INVERTER_REPAIR', 'DC_WIRING', 'ELECTRICAL_TROUBLESHOOTING'],
      tools: ['MULTIMETER', 'CLAMP_METER', 'MC4_TOOL', 'CRIMPING_TOOL', 'SCREWDRIVER_SET'],
      serviceAreas: ['Ahmedabad West', 'Sanand', 'Bopal', 'Prahlad Nagar'],
      availability: 'AVAILABLE' as const,
    },
    {
      name: 'Amit Patel',
      email: 'amit@demo.com',
      phone: '+91 98765 22222',
      experienceYears: 2,
      serviceTypes: ['SOLAR'] as const,
      skills: ['SOLAR_MAINTENANCE', 'PANEL_TROUBLESHOOTING', 'ELECTRICAL_TROUBLESHOOTING'],
      tools: ['MULTIMETER', 'MC4_TOOL', 'SCREWDRIVER_SET', 'PRESSURE_WASHER'],
      serviceAreas: ['Gandhinagar', 'Infocity', 'Chandkheda'],
      availability: 'AVAILABLE' as const,
    },
    {
      name: 'Jay Dave',
      email: 'jay@demo.com',
      phone: '+91 98765 22223',
      experienceYears: 7,
      serviceTypes: ['SOLAR', 'AC'] as const,
      skills: [
        'INVERTER_REPAIR',
        'BATTERY_SYSTEMS',
        'ELECTRICAL_TROUBLESHOOTING',
        'PCB_REPAIR',
        'REFRIGERANT_CHARGING',
        'COMPRESSOR_REPAIR',
      ],
      tools: [
        'MULTIMETER',
        'CLAMP_METER',
        'INSULATION_TESTER',
        'MANIFOLD_GAUGE',
        'VACUUM_PUMP',
        'LEAK_DETECTOR',
        'THERMOMETER_INFRARED',
      ],
      serviceAreas: ['Ahmedabad Central', 'Ahmedabad West', 'Gandhinagar'],
      availability: 'AVAILABLE' as const,
    },
    {
      name: 'Vikram Solanki',
      email: 'vikram@demo.com',
      phone: '+91 98765 22224',
      experienceYears: 4,
      serviceTypes: ['AC'] as const,
      skills: ['AC_INSTALLATION', 'REFRIGERANT_CHARGING', 'COMPRESSOR_REPAIR', 'ELECTRICAL_TROUBLESHOOTING'],
      tools: ['MANIFOLD_GAUGE', 'VACUUM_PUMP', 'FLARING_TOOL', 'CLAMP_METER', 'MULTIMETER'],
      serviceAreas: ['Ahmedabad East', 'Maninagar', 'Vastral', 'Odhav'],
      availability: 'AVAILABLE' as const,
    },
    {
      name: 'Sneha Joshi',
      email: 'sneha@demo.com',
      phone: '+91 98765 22225',
      experienceYears: 3,
      serviceTypes: ['AC'] as const,
      skills: ['ELECTRICAL_TROUBLESHOOTING', 'LEAK_DETECTION', 'DRAINAGE_REPAIR', 'COIL_CLEANING'],
      tools: ['MULTIMETER', 'LEAK_DETECTOR', 'THERMOMETER_INFRARED', 'PRESSURE_WASHER', 'SCREWDRIVER_SET'],
      serviceAreas: ['Gandhinagar', 'Gift City', 'Motera'],
      availability: 'AVAILABLE' as const,
    },
    {
      name: 'Demo Technician',
      email: 'technician@demo.com',
      phone: '+91 98765 22220',
      experienceYears: 6,
      serviceTypes: ['SOLAR', 'AC'] as const,
      skills: [
        'SOLAR_INSTALLATION',
        'INVERTER_REPAIR',
        'DC_WIRING',
        'ELECTRICAL_TROUBLESHOOTING',
        'AC_INSTALLATION',
        'REFRIGERANT_CHARGING',
        'COMPRESSOR_REPAIR',
        'PCB_REPAIR',
        'LEAK_DETECTION',
      ],
      tools: [
        'MULTIMETER',
        'CLAMP_METER',
        'MC4_TOOL',
        'CRIMPING_TOOL',
        'MANIFOLD_GAUGE',
        'VACUUM_PUMP',
        'LEAK_DETECTOR',
        'THERMOMETER_INFRARED',
        'SCREWDRIVER_SET',
      ],
      serviceAreas: ['Ahmedabad West', 'Sanand', 'Bopal', 'Gandhinagar', 'Prahlad Nagar'],
      availability: 'AVAILABLE' as const,
    },
  ];

  const technicians: any[] = [];
  for (const t of techProfilesData) {
    const user = await User.create({
      companyId,
      name: t.name,
      email: t.email,
      phone: t.phone,
      passwordHash: demoPasswordHash,
      role: 'TECHNICIAN',
      active: true,
    });

    const tech = await Technician.create({
      userId: user._id,
      companyId,
      name: t.name,
      email: t.email,
      phone: t.phone,
      experienceYears: t.experienceYears,
      serviceTypes: t.serviceTypes,
      skills: t.skills,
      tools: t.tools,
      certifications: ['Certified Field Technician Level II'],
      serviceAreas: t.serviceAreas,
      availability: t.availability,
      active: true,
    });
    technicians.push(tech);
  }

  console.log('[Seed] Creating 10 Solar Customers & 10 AC Customers...');
  const customerNames = [
    // 10 Solar
    { name: 'Kiritbhai Shah', phone: '+91 94260 10001', address: 'Plot 14, Shivalik Bungalows, Bodakdev', city: 'Ahmedabad' },
    { name: 'Pooja Industries Ltd', phone: '+91 94260 10002', address: 'Shed C-12, GIDC Phase 2, Sanand', city: 'Sanand' },
    { name: 'Harishbhai Vaghela', phone: '+91 94260 10003', address: '42, Suryoday Society, Satellite', city: 'Ahmedabad' },
    { name: 'Greenleaf Textiles', phone: '+91 94260 10004', address: 'Survey 281, Changodar Industrial Estate', city: 'Ahmedabad' },
    { name: 'Dr. Nidhi Trivedi', phone: '+91 94260 10005', address: 'Villa 9, Orchid Whitefield, Makarba', city: 'Ahmedabad' },
    { name: 'Navkar Cold Storage', phone: '+91 94260 10006', address: 'National Highway 8, Bareja', city: 'Ahmedabad' },
    { name: 'Chirag Engineering Works', phone: '+91 94260 10007', address: 'Plot 45, GIDC Naroda', city: 'Ahmedabad' },
    { name: 'Bhavna Ben Patel', phone: '+91 94260 10008', address: '18, Swagat Residency, Sector 21', city: 'Gandhinagar' },
    { name: 'Somnath Agro Feeds', phone: '+91 94260 10009', address: 'Near Railway Crossing, Dholka', city: 'Dholka' },
    { name: 'Ashok Leyland Service Centre', phone: '+91 94260 10010', address: 'Sarkhej-Bavla Road, Moraiya', city: 'Ahmedabad' },

    // 10 AC
    { name: 'Vantage Coworking Spaces', phone: '+91 98250 20001', address: 'Floor 7, Venus Stratum, Nehrunagar', city: 'Ahmedabad' },
    { name: 'Apex Diagnostic Laboratory', phone: '+91 98250 20002', address: 'Ground Floor, City Pulse, Navrangpura', city: 'Ahmedabad' },
    { name: 'Kalyan Jewellers Showroom', phone: '+91 98250 20003', address: 'CG Road, Ellisbridge', city: 'Ahmedabad' },
    { name: 'Prashant Choksi', phone: '+91 98250 20004', address: 'Flat 902, Goyal Intercity, Drive-In Road', city: 'Ahmedabad' },
    { name: 'Hotel Royal Palace', phone: '+91 98250 20005', address: 'Opp. Circuit House, Shahibaug', city: 'Ahmedabad' },
    { name: 'Dr. S.K. Rathore Clinic', phone: '+91 98250 20006', address: '102, Sachet 3, Mirzapur', city: 'Ahmedabad' },
    { name: 'Silver Oak University Admin', phone: '+91 98250 20007', address: 'Gota Gam, SG Highway', city: 'Ahmedabad' },
    { name: 'Meena Ben Parmar', phone: '+91 98250 20008', address: 'B-21, Suryoday Park, Maninagar', city: 'Ahmedabad' },
    { name: 'Cafe Coffee Day Franchise', phone: '+91 98250 20009', address: 'Shop 4, AlphaOne Mall, Vastrapur', city: 'Ahmedabad' },
    { name: 'Torrent Power Substation Office', phone: '+91 98250 20010', address: 'Sabarmati Power Station Compound', city: 'Ahmedabad' },
  ];

  const customers: any[] = [];
  for (const c of customerNames) {
    const cust = await Customer.create({
      companyId,
      name: c.name,
      phone: c.phone,
      address: c.address,
      city: c.city,
      email: `${c.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@example.com`,
    });
    customers.push(cust);
  }

  console.log('[Seed] Creating 10 Solar Systems and 10 AC Units...');
  const solarSystems: any[] = [];
  const solarCapacities = [5, 25, 3.3, 50, 10, 30, 15, 6.6, 12, 40];
  const solarInverters = ['Growatt 5000TL-X', 'Sungrow SG33CX', 'Solis 3G-3.3K', 'Delta RPI M50A', 'Fronius Primo 10.0', 'Polycab 30KW', 'Microtek 15kW', 'GoodWe 6.6kW', 'Huawei SUN2000-12K', 'Sungrow SG50CX'];

  for (let i = 0; i < 10; i++) {
    const sys = await SolarSystem.create({
      companyId,
      customerId: customers[i]._id,
      capacityKW: solarCapacities[i],
      panelMake: 'Adani Solar / Tata Power',
      panelModel: 'Mono PERC 540W',
      inverterMake: solarInverters[i].split(' ')[0],
      inverterModel: solarInverters[i],
      inverterSerial: `INV-2024-${88000 + i}`,
      systemType: i % 4 === 0 ? 'HYBRID' : 'ON_GRID',
      batteryPresent: i % 4 === 0,
    });
    solarSystems.push(sys);
  }

  const acUnits: any[] = [];
  const acBrands = ['Daikin', 'Voltas', 'Blue Star', 'Mitsubishi Heavy', 'LG Inverter', 'O General', 'Carrier', 'Hitachi', 'Panasonic', 'Daikin VRV'];
  const acTonnages = [2.0, 1.5, 3.0, 1.8, 1.5, 2.0, 1.5, 2.5, 1.5, 4.0];

  for (let i = 0; i < 10; i++) {
    const unit = await ACUnit.create({
      companyId,
      customerId: customers[i + 10]._id,
      brand: acBrands[i].split(' ')[0],
      model: acBrands[i],
      serialNumber: `AC-SR-${77000 + i}`,
      acType: i % 3 === 0 ? 'CASSETTE' : 'SPLIT',
      capacityTR: acTonnages[i],
      refrigerantType: i % 2 === 0 ? 'R32' : 'R410A',
      compressorType: 'INVERTER',
    });
    acUnits.push(unit);
  }

  console.log('[Seed] Seeding 20 Service Tickets (10 Completed Historical Cases with Ground Truth + 10 Active)...');

  // Ground Truth Cases: 5 Solar Completed, 5 AC Completed
  const historicalSolarCases = [
    {
      custIdx: 0,
      complaint: 'Inverter showing Error 04 and generation dropped to zero during sunny afternoon',
      symptoms: ['Inverter screen red LED', 'No power delivery to meter'],
      errorCode: 'Error 04',
      aiPredicted: 'Inverter Grid Voltage / Frequency Disconnect or Fault (Error 04 / F04)',
      actualDiagnosis: 'High AC grid voltage surge caused inverter internal protective relay trip; terminal block screw was slightly loose causing resistance heating.',
      workPerformed: 'Re-tightened AC distribution terminal block screws to 3.5Nm torque; cleared inverter trip log; adjusted grid reconnect delay to 60 seconds.',
      partsUsed: ['Heavy-duty Copper Lugs'],
      toolsUsed: ['MULTIMETER', 'CLAMP_METER', 'TORQUE_WRENCH'],
      readings: { acVoltage: 242, acCurrent: 18.5, dcVoltage: 480, inverterStatus: 'NORMAL GENERATION' },
      techIdx: 0, // Rahul
    },
    {
      custIdx: 1,
      complaint: 'String 2 input voltage is 0V; plant total generation down by 50%',
      symptoms: ['Zero generation on MPPT 2', 'Inverter display shows PV2 0V'],
      errorCode: 'PV2 Low Voc',
      aiPredicted: 'Zero Generation / Inverter Display Dark or Low DC Input',
      actualDiagnosis: 'Rodent damage severed positive DC cable beneath rooftop solar mounting rail near module #8.',
      workPerformed: 'Cut out damaged section, installed UV conduit sleeve, spliced and crimped fresh 1000V rated solar DC wire with MC4 connector.',
      partsUsed: ['1000V DC MC4 Connectors (Male/Female pair)', '4 sq mm Solar DC Cable'],
      toolsUsed: ['MULTIMETER', 'MC4_TOOL', 'CRIMPING_TOOL'],
      readings: { dcVoltage: 620, dcCurrent: 14.2, acVoltage: 415 },
      techIdx: 2, // Jay
    },
    {
      custIdx: 2,
      complaint: 'Inverter trips with Error 02 (Isolation Fault) every morning during morning dew',
      symptoms: ['Error 02 early morning', 'System restarts automatically around 10 AM'],
      errorCode: 'Error 02 ISO',
      aiPredicted: 'Inverter Isolation Fault / Ground Resistance Low (Error 02 / ISO Fault)',
      actualDiagnosis: 'Water ingress inside rooftop junction box through loose IP65 rubber grommet; insulation resistance measured only 0.2 MΩ under moisture.',
      workPerformed: 'Drained condensation, dried junction box with hot air, applied silicon sealant to cable glands, tested insulation resistance restored to > 50 MΩ.',
      partsUsed: ['Weatherproof Junction Box (IP65)', 'UV-resistant Conduit / Cable Sleeving'],
      toolsUsed: ['INSULATION_TESTER', 'MULTIMETER', 'SCREWDRIVER_SET'],
      readings: { dcVoltage: 380, insulationMOhms: 55 },
      techIdx: 0, // Rahul
    },
    {
      custIdx: 3,
      complaint: 'Solar plant generating only 18 units per day instead of expected 45 units',
      symptoms: ['Partial generation', 'Inverter fans running at maximum RPM constantly'],
      errorCode: 'Derating',
      aiPredicted: 'Generation Significantly Lower than Nominal Capacity (Partial Output)',
      actualDiagnosis: 'Inverter rear aluminum heatsink completely choked with industrial dust from adjacent textile mill; inverter entered thermal derating mode.',
      workPerformed: 'Deep cleaned heatsink fins with dry pressurized blower; inspected DC string currents; generation returned to nominal 44 kWh/day.',
      partsUsed: [],
      toolsUsed: ['CLAMP_METER', 'MULTIMETER', 'THERMAL_IMAGER'],
      readings: { dailyGenerationKWh: 44.8, inverterTempC: 48 },
      techIdx: 1, // Amit
    },
    {
      custIdx: 4,
      complaint: 'Solar monitoring app offline since 4 days; inverter generation unknown',
      symptoms: ['Wi-Fi stick red light', 'App says device disconnected'],
      errorCode: 'WIFI-DISCONN',
      aiPredicted: 'Monitoring Portal Offline / Communication Stick Disconnected',
      actualDiagnosis: 'Customer changed home Wi-Fi broadband router; Wi-Fi datalogger stick lost authentication credentials.',
      workPerformed: 'Re-configured Wi-Fi datalogger in AP mode using installer tool with customer new Wi-Fi SSID and password; verified real-time cloud data upload.',
      partsUsed: [],
      toolsUsed: ['SCREWDRIVER_SET'],
      readings: { wifiSignalPercent: 85, cloudStatus: 'ONLINE' },
      techIdx: 1, // Amit
    },
  ];

  const historicalACCases = [
    {
      custIdx: 0,
      complaint: 'Split AC 2.0 Ton is blowing room temperature air; outdoor unit compressor not engaging',
      symptoms: ['No cooling', 'Outdoor fan running but no compressor hum'],
      errorCode: 'No Error Code',
      aiPredicted: 'Split AC Running but Not Cooling (Blowing Ambient Air)',
      actualDiagnosis: 'Outdoor unit compressor run capacitor (50uF/450V) open circuit / blown top seal.',
      workPerformed: 'Safely discharged old capacitor; installed new heavy-duty 50uF dual run capacitor; verified compressor startup current at 9.2A.',
      partsUsed: ['Run Capacitor (45uF/50uF/450V)'],
      toolsUsed: ['MULTIMETER', 'CLAMP_METER', 'SCREWDRIVER_SET'],
      readings: { operatingCurrent: 9.2, indoorTemp: 23, grilleTemp: 13 },
      techIdx: 3, // Vikram
    },
    {
      custIdx: 1,
      complaint: 'Indoor AC unit leaking water continuously down lab wall onto diagnostic equipment',
      symptoms: ['Water dripping from right corner of indoor unit', 'Gurgling sound in drain line'],
      errorCode: 'Water Leak',
      aiPredicted: 'Indoor Unit Water Dripping / Overflowing Down Wall',
      actualDiagnosis: 'Condensate drain tray outlet clogged with fungal jelly; drain hose had slight reverse slope behind wall mounting plate.',
      workPerformed: 'Flushed condensate drain tray with chemical cleaner; re-aligned drain hose with negative slope; tested with 1 liter water flush test.',
      partsUsed: ['Flexible Condensate Drain Hose (16mm/20mm)'],
      toolsUsed: ['SCREWDRIVER_SET', 'PRESSURE_WASHER'],
      readings: { drainageFlowRate: 'Smooth Gravity Discharge' },
      techIdx: 4, // Sneha
    },
    {
      custIdx: 2,
      complaint: 'AC turns on, runs for exactly 3 minutes, then compressor trips and outdoor unit stops',
      symptoms: ['Short cycling', 'Outdoor unit very hot to touch'],
      errorCode: 'OLP Trip',
      aiPredicted: 'Compressor Starts then Trips After 2-5 Minutes (Short Cycling)',
      actualDiagnosis: 'Outdoor fan motor run capacitor degraded from 3.0uF down to 0.8uF; condenser fan rotating too slowly causing thermal overload trip.',
      workPerformed: 'Replaced outdoor fan motor capacitor (3.0uF/450V); washed condenser coil fins; compressor head pressure stabilized at 125 PSI.',
      partsUsed: ['Outdoor Fan Motor Capacitor (2.5uF/3uF)'],
      toolsUsed: ['MULTIMETER', 'CLAMP_METER', 'MANIFOLD_GAUGE'],
      readings: { operatingCurrent: 7.8, suctionPressurePSI: 125 },
      techIdx: 2, // Jay
    },
    {
      custIdx: 3,
      complaint: 'Thin copper pipe at outdoor unit has thick white ice layer; very weak air flow from indoor unit',
      symptoms: ['Ice on suction pipe', 'Cooling very low'],
      errorCode: 'Ice Formation',
      aiPredicted: 'Ice Formation on Thin/Thick Copper Pipes or Evaporator Coil',
      actualDiagnosis: 'Indoor unit air mesh filters and blower wheel completely clogged with dust crust, reducing airflow by ~70% and freezing the coil.',
      workPerformed: 'Removed and pressure-cleaned indoor filters and cross-flow blower wheel; allowed ice to thaw; checked operating refrigerant pressure.',
      partsUsed: [],
      toolsUsed: ['PRESSURE_WASHER', 'THERMOMETER_INFRARED', 'MANIFOLD_GAUGE'],
      readings: { suctionPressurePSI: 130, grilleTemp: 12, deltaTC: 11 },
      techIdx: 4, // Sneha
    },
    {
      custIdx: 4,
      complaint: 'Daikin Inverter AC blinking green timer light 5 times; outdoor unit completely inactive',
      symptoms: ['Error code U4', 'No cooling in banquet hall'],
      errorCode: 'U4',
      aiPredicted: 'Inverter AC Error Code Blinking (Communication / IPM / Sensor Fault)',
      actualDiagnosis: 'Inter-connecting 4-core communication signal wire severed by pigeon nesting on outdoor unit brackets.',
      workPerformed: 'Replaced damaged communication cable section with armored 4-core shielded cable; verified DC pulse communication signal.',
      partsUsed: ['Shielded 4-core Signal Cable'],
      toolsUsed: ['MULTIMETER', 'SCREWDRIVER_SET', 'WIRE_STRIPPER'],
      readings: { commPulseVoltsDC: 18, acVolts: 232 },
      techIdx: 3, // Vikram
    },
  ];

  let ticketSeq = 1;

  // Insert 5 Completed Solar
  for (const c of historicalSolarCases) {
    const tNum = `SOL-2026-${String(ticketSeq++).padStart(4, '0')}`;
    const cust = customers[c.custIdx];
    const asset = solarSystems[c.custIdx];
    const tech = technicians[c.techIdx];

    const ai = await AIAnalysis.create({
      provider: 'DemoAIProvider',
      model: 'Deterministic-Solar-Engine-v0.1',
      serviceType: 'SOLAR',
      possibleIssues: [
        {
          issue: c.aiPredicted,
          probabilityLevel: 'HIGH',
          explanation: `Consistent with symptom: ${c.complaint}. On-site electrical inspection required.`,
        },
      ],
      diagnosticSteps: [
        'Inspect AC and DC terminal blocks with multimeter',
        'Verify operating voltage and current under sunlight',
      ],
      recommendedTools: c.toolsUsed,
      possibleParts: c.partsUsed,
      safetyWarnings: ['Ensure DC isolator is switched off before opening terminal compartment.'],
      confidence: 'HIGH',
      reasoning: `Historical baseline evaluation case for ${asset.inverterMake} system.`,
      knowledgeSources: ['Solar Field Ops Knowledge Base v0.1'],
      promptVersion: 'solar-rules-v0.1',
    });

    const ticket = await ServiceTicket.create({
      companyId,
      ticketNumber: tNum,
      serviceType: 'SOLAR',
      customerId: cust._id,
      assetId: asset._id,
      assetType: 'SolarSystem',
      complaint: c.complaint,
      symptoms: c.symptoms,
      errorCode: c.errorCode,
      priority: 'HIGH',
      status: 'COMPLETED',
      aiAnalysisId: ai._id,
      assignedTechnicianId: tech._id,
      isDemoData: true,
      createdBy: managerUser._id,
      startedAt: new Date(Date.now() - 86400000 * 3),
      completedAt: new Date(Date.now() - 86400000 * 3 + 3600000 * 2),
      statusHistory: [
        { status: 'NEW', changedBy: managerUser._id, timestamp: new Date(Date.now() - 86400000 * 3) },
        { status: 'AI_ANALYZED', changedBy: managerUser._id, timestamp: new Date(Date.now() - 86400000 * 3 + 120000) },
        { status: 'ASSIGNED', changedBy: managerUser._id, timestamp: new Date(Date.now() - 86400000 * 3 + 300000) },
        { status: 'ON_SITE', changedBy: tech.userId, timestamp: new Date(Date.now() - 86400000 * 3 + 3600000) },
        { status: 'COMPLETED', changedBy: tech.userId, timestamp: new Date(Date.now() - 86400000 * 3 + 7200000) },
      ],
    });

    ai.ticketId = ticket._id;
    await ai.save();

    await ServiceReport.create({
      ticketId: ticket._id,
      technicianId: tech._id,
      actualDiagnosis: c.actualDiagnosis,
      workPerformed: c.workPerformed,
      readings: c.readings,
      partsUsed: c.partsUsed,
      toolsUsed: c.toolsUsed,
      aiHelpful: true,
      aiAccuracyRating: 5,
      toolsHelpful: true,
      partsHelpful: true,
      completedAt: ticket.completedAt,
    });

    await ServiceHistory.create({
      companyId,
      customerId: cust._id,
      assetId: asset._id,
      assetType: 'SolarSystem',
      serviceType: 'SOLAR',
      ticketId: ticket._id,
      ticketNumber: tNum,
      complaint: c.complaint,
      aiPredictionSummary: c.aiPredicted,
      actualDiagnosis: c.actualDiagnosis,
      workPerformed: c.workPerformed,
      partsUsed: c.partsUsed,
      readings: c.readings,
      technicianName: tech.name,
      comparisonResult: {
        diagnosisMatch: 'MATCH',
        toolMatch: 'MATCH',
        partMatch: c.partsUsed.length > 0 ? 'MATCH' : 'NOT APPLICABLE',
      },
      completedAt: ticket.completedAt,
    });

    await PilotFeedback.create({
      companyId,
      ticketId: ticket._id,
      userId: managerUser._id,
      role: 'SERVICE_MANAGER',
      serviceType: 'SOLAR',
      aiUtilityRating: 5,
      diagnosisHelpfulness: 5,
      toolHelpfulness: 5,
      partsHelpfulness: 5,
      technicianMatchingHelpfulness: 5,
      timeSavedMinutes: 35,
      comments: `AI accurately alerted technician regarding ${c.aiPredicted}. Prepared right tools and parts.`,
    });
  }

  // Insert 5 Completed AC
  let acTicketSeq = 1;
  for (const c of historicalACCases) {
    const tNum = `AC-2026-${String(acTicketSeq++).padStart(4, '0')}`;
    const cust = customers[c.custIdx + 10];
    const asset = acUnits[c.custIdx];
    const tech = technicians[c.techIdx];

    const ai = await AIAnalysis.create({
      provider: 'DemoAIProvider',
      model: 'Deterministic-AC-Engine-v0.1',
      serviceType: 'AC',
      possibleIssues: [
        {
          issue: c.aiPredicted,
          probabilityLevel: 'HIGH',
          explanation: `Matches reported symptom: ${c.complaint}. Verify electrical and refrigeration states.`,
        },
      ],
      diagnosticSteps: ['Inspect operating current and capacitor values', 'Verify refrigerant pressures'],
      recommendedTools: c.toolsUsed,
      possibleParts: c.partsUsed,
      safetyWarnings: ['Ensure outdoor power isolator is turned off before touching electrical terminals.'],
      confidence: 'HIGH',
      reasoning: `Historical baseline evaluation case for ${asset.brand} AC unit.`,
      knowledgeSources: ['AC Field Ops Knowledge Base v0.1'],
      promptVersion: 'ac-rules-v0.1',
    });

    const ticket = await ServiceTicket.create({
      companyId,
      ticketNumber: tNum,
      serviceType: 'AC',
      customerId: cust._id,
      assetId: asset._id,
      assetType: 'ACUnit',
      complaint: c.complaint,
      symptoms: c.symptoms,
      errorCode: c.errorCode,
      priority: 'HIGH',
      status: 'COMPLETED',
      aiAnalysisId: ai._id,
      assignedTechnicianId: tech._id,
      isDemoData: true,
      createdBy: managerUser._id,
      startedAt: new Date(Date.now() - 86400000 * 2),
      completedAt: new Date(Date.now() - 86400000 * 2 + 3600000 * 1.5),
      statusHistory: [
        { status: 'NEW', changedBy: managerUser._id, timestamp: new Date(Date.now() - 86400000 * 2) },
        { status: 'AI_ANALYZED', changedBy: managerUser._id, timestamp: new Date(Date.now() - 86400000 * 2 + 180000) },
        { status: 'ASSIGNED', changedBy: managerUser._id, timestamp: new Date(Date.now() - 86400000 * 2 + 360000) },
        { status: 'ON_SITE', changedBy: tech.userId, timestamp: new Date(Date.now() - 86400000 * 2 + 2500000) },
        { status: 'COMPLETED', changedBy: tech.userId, timestamp: new Date(Date.now() - 86400000 * 2 + 5400000) },
      ],
    });

    ai.ticketId = ticket._id;
    await ai.save();

    await ServiceReport.create({
      ticketId: ticket._id,
      technicianId: tech._id,
      actualDiagnosis: c.actualDiagnosis,
      workPerformed: c.workPerformed,
      readings: c.readings,
      partsUsed: c.partsUsed,
      toolsUsed: c.toolsUsed,
      aiHelpful: true,
      aiAccuracyRating: 5,
      toolsHelpful: true,
      partsHelpful: true,
      completedAt: ticket.completedAt,
    });

    await ServiceHistory.create({
      companyId,
      customerId: cust._id,
      assetId: asset._id,
      assetType: 'ACUnit',
      serviceType: 'AC',
      ticketId: ticket._id,
      ticketNumber: tNum,
      complaint: c.complaint,
      aiPredictionSummary: c.aiPredicted,
      actualDiagnosis: c.actualDiagnosis,
      workPerformed: c.workPerformed,
      partsUsed: c.partsUsed,
      readings: c.readings,
      technicianName: tech.name,
      comparisonResult: {
        diagnosisMatch: 'MATCH',
        toolMatch: 'MATCH',
        partMatch: c.partsUsed.length > 0 ? 'MATCH' : 'NOT APPLICABLE',
      },
      completedAt: ticket.completedAt,
    });

    await PilotFeedback.create({
      companyId,
      ticketId: ticket._id,
      userId: managerUser._id,
      role: 'SERVICE_MANAGER',
      serviceType: 'AC',
      aiUtilityRating: 5,
      diagnosisHelpfulness: 5,
      toolHelpfulness: 5,
      partsHelpfulness: 5,
      technicianMatchingHelpfulness: 5,
      timeSavedMinutes: 40,
      comments: 'Technician took the correct 50uF capacitor directly from shop inventory based on AI triage.',
    });
  }

  // 10 Active Queue Tickets (5 Solar, 5 AC)
  console.log('[Seed] Seeding 10 Active Queue Tickets (Ready for interactive demo testing)...');
  const activeSolarComplaints = [
    {
      complaint: 'Customer reports intermittent inverter shutdown every day around 1:30 PM under peak sun',
      symptoms: ['Overheating warning', 'Daily midday restart'],
      errorCode: 'TEMP_HIGH',
      priority: 'HIGH' as const,
      status: 'AI_ANALYZED' as const,
      custIdx: 5,
    },
    {
      complaint: 'Panel output lower than expected; dirty layer after dust storm in Sanand industrial belt',
      symptoms: ['Generation down by 25%'],
      errorCode: '',
      priority: 'MEDIUM' as const,
      status: 'NEW' as const,
      custIdx: 6,
    },
    {
      complaint: 'Inverter communication stick offline; customer cannot see daily export units',
      symptoms: ['Datalogger LED unlit'],
      errorCode: 'COMM_ERR',
      priority: 'LOW' as const,
      status: 'ASSIGNED' as const,
      custIdx: 7,
      techIdx: 5, // Demo Technician (technician@demo.com)
    },
    {
      complaint: 'Routine quarterly maintenance inspection and string Voc measurement test',
      symptoms: ['Scheduled checkup'],
      errorCode: '',
      priority: 'LOW' as const,
      status: 'NEW' as const,
      custIdx: 8,
    },
    {
      complaint: 'Battery bank not holding charge overnight on hybrid 10kW system',
      symptoms: ['Inverter trips to grid at 8 PM', 'Battery voltage drops rapidly'],
      errorCode: 'BAT_UNDERV',
      priority: 'URGENT' as const,
      status: 'ON_SITE' as const,
      custIdx: 9,
      techIdx: 2, // Jay
    },
  ];

  for (const ac of activeSolarComplaints) {
    const tNum = `SOL-2026-${String(ticketSeq++).padStart(4, '0')}`;
    const cust = customers[ac.custIdx];
    const asset = solarSystems[ac.custIdx];
    const assignedTech = ac.techIdx !== undefined ? technicians[ac.techIdx]._id : undefined;

    await ServiceTicket.create({
      companyId,
      ticketNumber: tNum,
      serviceType: 'SOLAR',
      customerId: cust._id,
      assetId: asset._id,
      assetType: 'SolarSystem',
      complaint: ac.complaint,
      symptoms: ac.symptoms,
      errorCode: ac.errorCode,
      priority: ac.priority,
      status: ac.status,
      assignedTechnicianId: assignedTech,
      isDemoData: true,
      createdBy: managerUser._id,
      statusHistory: [{ status: ac.status, changedBy: managerUser._id, timestamp: new Date() }],
    });
  }

  const activeACComplaints = [
    {
      complaint: 'Split AC running with loud buzzing noise from outdoor compressor bracket',
      symptoms: ['Vibration sound', 'Cooling normal but noisy'],
      errorCode: '',
      priority: 'MEDIUM' as const,
      status: 'NEW' as const,
      custIdx: 5,
    },
    {
      complaint: 'Cassette AC in diagnostic lab showing E4 error code; fan stops after 1 minute',
      symptoms: ['Error E4', 'Blower stall'],
      errorCode: 'E4',
      priority: 'HIGH' as const,
      status: 'AI_ANALYZED' as const,
      custIdx: 6,
    },
    {
      complaint: 'AC blowing foul moldy odor upon startup; indoor air flow feels restricted',
      symptoms: ['Foul smell', 'Restricted CFM'],
      errorCode: '',
      priority: 'LOW' as const,
      status: 'ASSIGNED' as const,
      custIdx: 7,
      techIdx: 5, // Demo Technician (technician@demo.com)
    },
    {
      complaint: 'Water dripping directly onto CEO desk from ceiling cassette unit',
      symptoms: ['Ceiling damp patch', 'Rapid water dripping'],
      errorCode: 'DRAIN_FAIL',
      priority: 'URGENT' as const,
      status: 'ON_SITE' as const,
      custIdx: 8,
      techIdx: 3, // Vikram
    },
    {
      complaint: 'Split AC 1.5 TR cooling very slowly; takes over 2 hours to reach 26 degrees',
      symptoms: ['Weak cooling', 'Continuous compressor run'],
      errorCode: '',
      priority: 'MEDIUM' as const,
      status: 'NEW' as const,
      custIdx: 9,
    },
  ];

  for (const ac of activeACComplaints) {
    const tNum = `AC-2026-${String(acTicketSeq++).padStart(4, '0')}`;
    const cust = customers[ac.custIdx + 10];
    const asset = acUnits[ac.custIdx];
    const assignedTech = ac.techIdx !== undefined ? technicians[ac.techIdx]._id : undefined;

    await ServiceTicket.create({
      companyId,
      ticketNumber: tNum,
      serviceType: 'AC',
      customerId: cust._id,
      assetId: asset._id,
      assetType: 'ACUnit',
      complaint: ac.complaint,
      symptoms: ac.symptoms,
      errorCode: ac.errorCode,
      priority: ac.priority,
      status: ac.status,
      assignedTechnicianId: assignedTech,
      isDemoData: true,
      createdBy: managerUser._id,
      statusHistory: [{ status: ac.status, changedBy: managerUser._id, timestamp: new Date() }],
    });
  }

  // ---------------------------------------------------------
  // REAL CLIENT PILOT TENANT INITIALIZATION
  // Dedicated, isolated company for real-world solar client
  // Starts 100% clean: 0 demo customers, 0 demo tickets, 0 fake history
  // ---------------------------------------------------------
  console.log('[Seed] Initializing Real Client Pilot Tenant...');
  let pilotCompany = await Company.findOne({ email: 'pilot@gujaratsolar.com' });
  if (!pilotCompany) {
    pilotCompany = await Company.create({
      name: 'Gujarat Solar O&M Pilot',
      email: 'pilot@gujaratsolar.com',
      phone: '+91 79 2650 0000',
      address: 'GIDC Electronic Estate, Sector 25, Gandhinagar, Gujarat 382024',
      servicesSupported: ['SOLAR'],
      isPilot: true,
      environmentContext: 'PILOT',
      settings: {
        allowBlindEvaluation: false,
        defaultCurrency: 'INR',
      },
      active: true,
    });
  }

  const pilotPasswordHash = await bcrypt.hash('Pilot@2026', 10);

  // Pilot Manager
  const pilotManagerEmail = process.env.PILOT_MANAGER_EMAIL || 'manager@pilot.com';
  let pilotManager = await User.findOne({ email: pilotManagerEmail });
  if (!pilotManager) {
    pilotManager = await User.create({
      companyId: pilotCompany._id,
      name: 'Kirit Patel (Pilot Manager)',
      email: pilotManagerEmail,
      phone: '+91 98765 99991',
      passwordHash: pilotPasswordHash,
      role: 'SERVICE_MANAGER',
      active: true,
    });
  }

  // Pilot Solar Technician
  const pilotTechEmail = process.env.PILOT_TECH_EMAIL || 'tech@pilot.com';
  let pilotTechUser = await User.findOne({ email: pilotTechEmail });
  if (!pilotTechUser) {
    pilotTechUser = await User.create({
      companyId: pilotCompany._id,
      name: 'Dhaval Shah (Solar Specialist)',
      email: pilotTechEmail,
      phone: '+91 98765 99992',
      passwordHash: pilotPasswordHash,
      role: 'TECHNICIAN',
      active: true,
    });

    await Technician.create({
      companyId: pilotCompany._id,
      userId: pilotTechUser._id,
      name: 'Dhaval Shah',
      email: pilotTechEmail,
      phone: '+91 98765 99992',
      experienceYears: 6,
      serviceTypes: ['SOLAR'],
      skills: ['SOLAR_INSTALLATION', 'INVERTER_REPAIR', 'ELECTRICAL_TROUBLESHOOTING', 'DC_WIRING'],
      tools: ['MULTIMETER', 'CLAMP_METER', 'MC4_TOOL', 'CRIMPING_TOOL', 'SCREWDRIVER_SET', 'INSULATION_TESTER'],
      serviceAreas: ['Ahmedabad', 'Gandhinagar', 'Sanand'],
      availability: 'AVAILABLE',
      rating: 4.9,
      totalJobsCompleted: 0,
      active: true,
    });
  }

  console.log('[Seed] Database seeded successfully!');
  console.log('================================================================');
  console.log('1. PUBLIC DEMO CREDENTIALS:');
  console.log('  Manager:    manager@demo.com  / Demo@12345');
  console.log('  Technician: rahul@demo.com    / Demo@12345 (Solar Specialist)');
  console.log('  Technician: jay@demo.com      / Demo@12345 (Solar + AC Specialist)');
  console.log('----------------------------------------------------------------');
  console.log('2. REAL CLIENT PILOT CREDENTIALS (Clean Isolated Environment):');
  console.log('  Pilot Co:   Gujarat Solar O&M Pilot (isPilot: true)');
  console.log('  Manager:    manager@pilot.com / Pilot@2026');
  console.log('  Technician: tech@pilot.com    / Pilot@2026 (Solar Specialist)');
  console.log('================================================================');
}

// Run if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => disconnectDB())
    .catch((err) => {
      console.error('[Seed Error]', err);
      process.exit(1);
    });
}
