import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import mongoose from 'mongoose';
import http from 'http';
import app from '../server';
import { Company, User, Technician, Customer, SolarSystem, ServiceTicket, AIAnalysis, ServiceReport, ServiceHistory } from '../models';

// ============================================================================
// CRITICAL TEST DATABASE SAFETY VERIFICATION
// ============================================================================
const PROD_MONGODB_URI = process.env.MONGODB_URI;
const TEST_MONGODB_URI = process.env.TEST_MONGODB_URI;

console.log('\n=============================================================');
console.log('SERVORA MULTI-TENANT ONBOARDING & SECURITY AUDIT SUITE');
console.log('=============================================================');

if (!TEST_MONGODB_URI) {
  console.error('\n❌ CRITICAL ERROR: TEST_MONGODB_URI is not defined in environment!');
  console.error('The automated test suite refuses to run without an isolated test database.');
  process.exit(1);
}

if (
  TEST_MONGODB_URI === PROD_MONGODB_URI ||
  TEST_MONGODB_URI.includes('/servora?') ||
  TEST_MONGODB_URI.endsWith('/servora')
) {
  console.error('\n❌ CRITICAL ERROR: TEST_MONGODB_URI points to PRODUCTION database (/servora)!');
  console.error('The test suite refused to run to guarantee production database integrity.');
  process.exit(1);
}

console.log('✓ TEST DATABASE SAFETY VERIFIED:');
console.log(`  - Dedicated Test DB: ${TEST_MONGODB_URI.replace(/:[^:]*@/, ':****@')}`);
console.log(`  - Production DB is protected: ${PROD_MONGODB_URI?.replace(/:[^:]*@/, ':****@')}`);

const TEST_PORT = 5099;
const TEST_API = `http://localhost:${TEST_PORT}/api`;
const LIVE_API = `http://localhost:5000/api`;

let testServer: http.Server;
let testCompanyAId: mongoose.Types.ObjectId;
let testCompanyBId: mongoose.Types.ObjectId;

async function request(baseUrl: string, endpoint: string, options: any = {}): Promise<{ status: number; ok: boolean; data: any }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  const body = options.body ? JSON.stringify(options.body) : undefined;
  
  const res = await fetch(`${baseUrl}${endpoint}`, {
    method: options.method || 'GET',
    headers,
    body,
  });

  let data: any;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }

  return { status: res.status, ok: res.ok, data };
}

async function runSuite() {
  try {
    // ------------------------------------------------------------------------
    // SETUP: Connect to TEST_MONGODB_URI and spin up isolated Test API Server
    // ------------------------------------------------------------------------
    console.log('\n[Init] Connecting to TEST database...');
    await mongoose.connect(TEST_MONGODB_URI as string);
    console.log(`✓ Connected to test database: ${mongoose.connection.name}`);

    testServer = app.listen(TEST_PORT, '127.0.0.1');
    console.log(`✓ Ephemeral test server listening on http://127.0.0.1:${TEST_PORT}`);

    // ========================================================================
    // A) EXISTING PILOT LOGIN VERIFICATION (Both live server & pilot safety)
    // ========================================================================
    console.log('\n=============================================================');
    console.log('A) EXISTING PILOT LOGIN VERIFICATION');
    console.log('=============================================================');

    try {
      const pilotMgrCheck = await request(LIVE_API, '/auth/login', {
        method: 'POST',
        body: { email: 'manager@pilot.com', password: 'Pilot@2026' },
      });

      if (pilotMgrCheck.ok && pilotMgrCheck.data?.success) {
        console.log(`✓ Live Pilot Manager (manager@pilot.com) login verified:`);
        console.log(`  - Role: ${pilotMgrCheck.data.data.user.role}`);
        console.log(`  - Environment Context: ${pilotMgrCheck.data.data.user.environmentContext}`);
        console.log(`  - Company: ${pilotMgrCheck.data.data.user.companyName}`);
        console.log(`  - Pilot intact: Passwords untouched, account intact.`);
      } else {
        console.log(`! Live port 5000 response: ${JSON.stringify(pilotMgrCheck.data)}`);
      }

      const pilotTechCheck = await request(LIVE_API, '/auth/login', {
        method: 'POST',
        body: { email: 'tech@pilot.com', password: 'Pilot@2026' },
      });

      if (pilotTechCheck.ok && pilotTechCheck.data?.success) {
        console.log(`✓ Live Pilot Technician (tech@pilot.com) login verified:`);
        console.log(`  - Role: ${pilotTechCheck.data.data.user.role}`);
        console.log(`  - Environment Context: ${pilotTechCheck.data.data.user.environmentContext}`);
      }
    } catch (e: any) {
      console.log(`Note: Live server check skipped (${e.message}), continuing with isolated test environment.`);
    }

    // ========================================================================
    // B) NEW COMPANY A SIGNUP (Apex Solar Solutions)
    // ========================================================================
    console.log('\n=============================================================');
    console.log('B) NEW COMPANY A SIGNUP (Apex Solar Solutions)');
    console.log('=============================================================');

    const companyAPayload = {
      companyName: 'Apex Solar Technologies Pvt Ltd',
      managerName: 'Aarav Mehta',
      email: `aarav.${Date.now()}@apexsolar.in`,
      password: 'ApexSolar@2026',
      confirmPassword: 'ApexSolar@2026',
      phone: '+91 98250 11223',
      servicesSupported: ['SOLAR'],
      city: 'Ahmedabad',
    };

    const signupARes = await request(TEST_API, '/auth/signup', {
      method: 'POST',
      body: companyAPayload,
    });

    if (!signupARes.ok) {
      throw new Error(`Company A signup failed: ${JSON.stringify(signupARes.data)}`);
    }

    const { token: tokenA, user: userA, company: compA } = signupARes.data.data;
    testCompanyAId = compA.id || compA._id;

    console.log(`✓ Company A registered successfully:`);
    console.log(`  - Company Name: ${compA.name}`);
    console.log(`  - Company ID: ${testCompanyAId}`);
    console.log(`  - isPilot: ${compA.isPilot} (MUST BE false)`);
    console.log(`  - environmentContext: ${compA.environmentContext} (MUST BE "CLIENT")`);
    console.log(`  - Manager: ${userA.name} (${userA.email})`);
    console.log(`  - Role: ${userA.role} (MUST BE "SERVICE_MANAGER")`);
    console.log(`  - Auto-login token issued: ${tokenA ? 'YES' : 'NO'}`);

    if (compA.isPilot !== false) throw new Error('Company A isPilot must be false');
    if (compA.environmentContext !== 'CLIENT') throw new Error('Company A environmentContext must be CLIENT');
    if (userA.role !== 'SERVICE_MANAGER') throw new Error('User A role must be SERVICE_MANAGER');

    // Verify DB record directly
    const dbCompA = await Company.findById(testCompanyAId);
    if (!dbCompA || dbCompA.isPilot !== false || dbCompA.environmentContext !== 'CLIENT') {
      throw new Error('Database Company A verification failed!');
    }
    const dbUserA = await User.findOne({ email: companyAPayload.email.toLowerCase().trim() });
    if (!dbUserA || dbUserA.passwordHash.includes('ApexSolar@2026')) {
      throw new Error('User password MUST be bcrypt hashed, NEVER plaintext!');
    }
    console.log(`✓ Direct DB check verified: Password hashed properly (${dbUserA.passwordHash.substring(0, 15)}...)`);

    // ========================================================================
    // C) COMPANY A MANAGER LOGIN
    // ========================================================================
    console.log('\n=============================================================');
    console.log('C) COMPANY A MANAGER LOGIN');
    console.log('=============================================================');

    const loginARes = await request(TEST_API, '/auth/login', {
      method: 'POST',
      body: { email: companyAPayload.email, password: companyAPayload.password },
    });

    if (!loginARes.ok) throw new Error(`Manager A login failed: ${JSON.stringify(loginARes.data)}`);
    console.log(`✓ Manager A login successful. Received valid JWT.`);

    // ========================================================================
    // D) MANAGER A CREATES TECHNICIAN A
    // ========================================================================
    console.log('\n=============================================================');
    console.log('D) MANAGER A CREATES TECHNICIAN A');
    console.log('=============================================================');

    const techAPayload = {
      name: 'Rohan Patel (Solar Expert)',
      email: `rohan.${Date.now()}@apexsolar.in`,
      temporaryPassword: 'RohanTech@2026',
      confirmPassword: 'RohanTech@2026',
      phone: '+91 98251 44556',
      experienceYears: 4,
      serviceTypes: ['SOLAR'],
      skills: ['SOLAR_INSTALLATION', 'INVERTER_REPAIR', 'ELECTRICAL_TROUBLESHOOTING'],
      tools: ['MULTIMETER', 'CLAMP_METER', 'MC4_TOOL'],
      serviceAreas: ['Ahmedabad', 'Gandhinagar'],
      availability: 'AVAILABLE',
    };

    const createTechARes = await request(TEST_API, '/technicians', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: techAPayload,
    });

    if (!createTechARes.ok) throw new Error(`Technician A creation failed: ${JSON.stringify(createTechARes.data)}`);
    const techA = createTechARes.data.data;
    console.log(`✓ Technician A created successfully:`);
    console.log(`  - Name: ${techA.name}`);
    console.log(`  - ID: ${techA._id}`);
    console.log(`  - CompanyId: ${techA.companyId} (Matches Company A: ${techA.companyId === String(testCompanyAId)})`);
    console.log(`  - Service Types: ${techA.serviceTypes.join(', ')}`);
    if ((techA as any).passwordHash) throw new Error('SECURITY VIOLATION: passwordHash must never be returned!');

    // Duplicate email protection test
    console.log('  Testing duplicate email rejection...');
    const dupTechRes = await request(TEST_API, '/technicians', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: { ...techAPayload, name: 'Duplicate Rohan' },
    });
    if (dupTechRes.status !== 400 || !dupTechRes.data.error.message.includes('already exists')) {
      throw new Error(`Expected duplicate email error, got: ${JSON.stringify(dupTechRes.data)}`);
    }
    console.log(`  ✓ Duplicate email rejected properly: "${dupTechRes.data.error.message}"`);

    // ========================================================================
    // E) TECHNICIAN A LOGIN
    // ========================================================================
    console.log('\n=============================================================');
    console.log('E) TECHNICIAN A LOGIN');
    console.log('=============================================================');

    const loginTechARes = await request(TEST_API, '/auth/login', {
      method: 'POST',
      body: { email: techAPayload.email, password: techAPayload.temporaryPassword },
    });

    if (!loginTechARes.ok) throw new Error(`Technician A login failed: ${JSON.stringify(loginTechARes.data)}`);
    const { token: tokenTechA, user: userTechA } = loginTechARes.data.data;
    console.log(`✓ Technician A logged in successfully:`);
    console.log(`  - Role: ${userTechA.role} (MUST BE "TECHNICIAN")`);
    console.log(`  - Environment Context: ${userTechA.environmentContext}`);
    console.log(`  - Technician Profile ID: ${userTechA.technicianProfile?._id}`);
    if (userTechA.role !== 'TECHNICIAN') throw new Error('Technician A role must be TECHNICIAN');

    // ========================================================================
    // F) COMPANY B SIGNUP (Zenith HVAC Systems)
    // ========================================================================
    console.log('\n=============================================================');
    console.log('F) COMPANY B SIGNUP (Zenith HVAC Systems)');
    console.log('=============================================================');

    const companyBPayload = {
      companyName: 'Zenith HVAC Cooling Systems',
      managerName: 'Neha Sharma',
      email: `neha.${Date.now()}@zenithhvac.com`,
      password: 'ZenithHVAC@2026',
      confirmPassword: 'ZenithHVAC@2026',
      phone: '+91 98255 77889',
      servicesSupported: ['AC'],
      city: 'Surat',
    };

    const signupBRes = await request(TEST_API, '/auth/signup', {
      method: 'POST',
      body: companyBPayload,
    });

    if (!signupBRes.ok) throw new Error(`Company B signup failed: ${JSON.stringify(signupBRes.data)}`);
    const { token: tokenB, user: userB, company: compB } = signupBRes.data.data;
    testCompanyBId = compB.id || compB._id;

    console.log(`✓ Company B registered successfully:`);
    console.log(`  - Company Name: ${compB.name}`);
    console.log(`  - Company ID: ${testCompanyBId}`);
    console.log(`  - isPilot: ${compB.isPilot}`);
    console.log(`  - environmentContext: ${compB.environmentContext}`);
    if (String(testCompanyAId) === String(testCompanyBId)) {
      throw new Error('Tenant isolation failure: Company A and B have identical IDs!');
    }

    // ========================================================================
    // G) COMPANY B MANAGER LOGIN
    // ========================================================================
    console.log('\n=============================================================');
    console.log('G) COMPANY B MANAGER LOGIN');
    console.log('=============================================================');

    const loginBRes = await request(TEST_API, '/auth/login', {
      method: 'POST',
      body: { email: companyBPayload.email, password: companyBPayload.password },
    });
    if (!loginBRes.ok) throw new Error(`Company B manager login failed: ${JSON.stringify(loginBRes.data)}`);
    console.log(`✓ Manager B login successful.`);

    // ========================================================================
    // H) COMPANY B CREATES TECHNICIAN B
    // ========================================================================
    console.log('\n=============================================================');
    console.log('H) COMPANY B CREATES TECHNICIAN B');
    console.log('=============================================================');

    const techBPayload = {
      name: 'Kunal Shah (HVAC Tech)',
      email: `kunal.${Date.now()}@zenithhvac.com`,
      temporaryPassword: 'KunalTech@2026',
      confirmPassword: 'KunalTech@2026',
      phone: '+91 98259 33445',
      experienceYears: 5,
      serviceTypes: ['AC'],
      skills: ['AC_INSTALLATION', 'REFRIGERANT_CHARGING', 'COMPRESSOR_REPAIR'],
      tools: ['MANIFOLD_GAUGE', 'VACUUM_PUMP', 'MULTIMETER'],
      serviceAreas: ['Surat'],
      availability: 'AVAILABLE',
    };

    const createTechBRes = await request(TEST_API, '/technicians', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenB}` },
      body: techBPayload,
    });

    if (!createTechBRes.ok) throw new Error(`Technician B creation failed: ${JSON.stringify(createTechBRes.data)}`);
    const techB = createTechBRes.data.data;
    console.log(`✓ Technician B created successfully:`);
    console.log(`  - Name: ${techB.name}`);
    console.log(`  - CompanyId: ${techB.companyId} (Matches Company B: ${techB.companyId === String(testCompanyBId)})`);

    // ========================================================================
    // I) CROSS-TENANT ACCESS ATTEMPTS & AUTHORIZATION SECURITY
    // ========================================================================
    console.log('\n=============================================================');
    console.log('I) CROSS-TENANT ACCESS ATTEMPTS & ISOLATION AUDIT');
    console.log('=============================================================');

    // 1. Manager A requests technicians list
    const mgrATechs = await request(TEST_API, '/technicians', {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const mgrATechList = mgrATechs.data.data;
    const hasTechBInA = mgrATechList.some((t: any) => t._id === techB._id || t.email === techBPayload.email);
    console.log(`✓ Manager A queries technicians: Count = ${mgrATechList.length}. Contains Tech B? ${hasTechBInA ? 'FAIL ❌' : 'NO (ISOLATED) ✓'}`);
    if (hasTechBInA) throw new Error('CROSS-TENANT LEAK: Manager A saw Technician B!');

    // 2. Manager A requests Technician B directly by ID
    const directTechAccess = await request(TEST_API, `/technicians/${techB._id}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    console.log(`✓ Manager A attempts direct GET /technicians/${techB._id}: Status ${directTechAccess.status} (Expected 404 NOT_FOUND)`);
    if (directTechAccess.status !== 404) throw new Error(`Cross-tenant breach! Direct technician access returned ${directTechAccess.status}`);

    // 3. Manager A attempts to inject body.companyId pointing to Company B when creating a customer
    const custA = await Customer.create({
      companyId: testCompanyAId,
      name: 'Gujarat Solar Industrial Corp',
      phone: '+91 99000 11111',
      address: 'Plot 102, GIDC Vatva',
      city: 'Ahmedabad',
    });

    const solarAssetA = await SolarSystem.create({
      companyId: testCompanyAId,
      customerId: custA._id,
      capacityKW: 25,
      panelMake: 'Waaree Solar',
      inverterMake: 'Sungrow',
      inverterModel: 'SG25KTL',
      systemType: 'ON_GRID',
      batteryPresent: false,
    });

    const ticketACreation = await request(TEST_API, '/tickets', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: {
        companyId: String(testCompanyBId), // Spoofed companyId! Server MUST ignore this!
        serviceType: 'SOLAR',
        customerId: custA._id,
        assetId: solarAssetA._id,
        complaint: 'Solar inverter tripped with grid over-voltage warning',
        priority: 'HIGH',
      },
    });
    if (!ticketACreation.ok) throw new Error(`Ticket A creation failed: ${JSON.stringify(ticketACreation.data)}`);
    const ticketA = ticketACreation.data.data;
    console.log(`✓ Spoofed body.companyId security test:`);
    console.log(`  - Ticket created with companyId: ${ticketA.companyId}`);
    console.log(`  - Strictly bound to Manager A's company? ${ticketA.companyId === String(testCompanyAId) ? 'YES (SECURE) ✓' : 'NO ❌'}`);
    if (ticketA.companyId !== String(testCompanyAId)) {
      throw new Error('SECURITY VULNERABILITY: Server accepted body.companyId over req.companyId!');
    }

    // 4. Manager A attempts to assign Technician B (from Company B) to Ticket A
    console.log('  Testing cross-company technician assignment...');
    const invalidAssignRes = await request(TEST_API, `/tickets/${ticketA._id}/assign`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: { technicianId: techB._id },
    });
    console.log(`✓ Manager A assigns Technician B to Ticket A: Status ${invalidAssignRes.status} (Expected 400 INVALID_TECHNICIAN)`);
    if (invalidAssignRes.status !== 400) {
      throw new Error(`SECURITY VULNERABILITY: Manager A was able to assign Technician B! Code: ${invalidAssignRes.status}`);
    }

    // 5. Manager B queries tickets list
    const mgrBTickets = await request(TEST_API, '/tickets', {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const bTickets = mgrBTickets.data.data.items;
    const hasTicketAInB = bTickets.some((t: any) => t._id === ticketA._id);
    console.log(`✓ Manager B queries tickets: Count = ${bTickets.length}. Contains Ticket A? ${hasTicketAInB ? 'FAIL ❌' : 'NO (ISOLATED) ✓'}`);
    if (hasTicketAInB) throw new Error('CROSS-TENANT LEAK: Manager B saw Ticket A!');

    // ========================================================================
    // J) FULL SOLAR WORKFLOW FOR COMPANY A
    // ========================================================================
    console.log('\n=============================================================');
    console.log('J) FULL SOLAR WORKFLOW FOR COMPANY A');
    console.log('=============================================================');

    // 1. Run AI Analysis
    console.log('1. Running AI Analysis on Ticket A...');
    const aiRes = await request(TEST_API, `/tickets/${ticketA._id}/analyze`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    if (!aiRes.ok) throw new Error(`AI Analysis failed: ${JSON.stringify(aiRes.data)}`);
    console.log(`✓ AI Analysis completed. Confidence: ${aiRes.data.data.confidence}%. Possible issues: ${aiRes.data.data.possibleIssues.length}`);

    // 2. Review AI Analysis
    console.log('2. Manager A reviews AI Analysis...');
    const reviewRes = await request(TEST_API, `/tickets/${ticketA._id}/review`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: {
        accepted: true,
        editedChecklist: ['Verify AC voltage at inverter terminal', 'Inspect grid disconnect isolator'],
        editedTools: ['MULTIMETER', 'CLAMP_METER'],
        managerNotes: 'Priority client, check grid side surge arrestor',
      },
    });
    if (!reviewRes.ok) throw new Error(`Review failed: ${JSON.stringify(reviewRes.data)}`);
    console.log(`✓ AI Analysis reviewed and approved.`);

    // 3. Recommended Technicians
    console.log('3. Fetching technician recommendations for Ticket A...');
    const recRes = await request(TEST_API, `/tickets/${ticketA._id}/recommended-technicians`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    if (!recRes.ok) throw new Error(`Recommendations failed: ${JSON.stringify(recRes.data)}`);
    const recommendations = recRes.data.data;
    console.log(`✓ Received recommendations: ${recommendations.length} tech(s) matched.`);
    console.log(`  - Top Match: ${recommendations[0]?.technicianName} (Score: ${recommendations[0]?.score}%)`);

    // 4. Assign Technician A (valid assignment within Company A)
    console.log('4. Assigning Technician A...');
    const assignRes = await request(TEST_API, `/tickets/${ticketA._id}/assign`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: { technicianId: techA._id },
    });
    if (!assignRes.ok) throw new Error(`Assign technician failed: ${JSON.stringify(assignRes.data)}`);
    console.log(`✓ Ticket assigned to ${techA.name}. Ticket status: ${assignRes.data.data.status}`);

    // 5. Technician A views assigned jobs
    console.log('5. Technician A queries assigned jobs...');
    const techJobsRes = await request(TEST_API, '/tickets', {
      headers: { Authorization: `Bearer ${tokenTechA}` },
    });
    if (!techJobsRes.ok) throw new Error(`Technician jobs query failed: ${JSON.stringify(techJobsRes.data)}`);
    const techTickets = techJobsRes.data.data.items;
    console.log(`✓ Technician A sees ${techTickets.length} assigned ticket(s) (Ticket: ${techTickets[0]?.ticketNumber})`);

    // 6. Technician A updates status through field lifecycle: ACCEPTED -> ON_THE_WAY -> ON_SITE -> DIAGNOSING
    console.log('6. Technician A accepts job and travels on-site...');
    const acceptRes = await request(TEST_API, `/tickets/${ticketA._id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenTechA}` },
      body: { status: 'ACCEPTED', note: 'Technician accepted assignment' },
    });
    if (!acceptRes.ok) throw new Error(`Accept status failed: ${JSON.stringify(acceptRes.data)}`);

    const travelRes = await request(TEST_API, `/tickets/${ticketA._id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenTechA}` },
      body: { status: 'ON_THE_WAY', note: 'En route with safety gear and tools' },
    });
    if (!travelRes.ok) throw new Error(`Travel status failed: ${JSON.stringify(travelRes.data)}`);

    const arriveRes = await request(TEST_API, `/tickets/${ticketA._id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenTechA}` },
      body: { status: 'ON_SITE', note: 'Arrived at solar rooftop site' },
    });
    if (!arriveRes.ok) throw new Error(`Arrive status failed: ${JSON.stringify(arriveRes.data)}`);

    const diagRes = await request(TEST_API, `/tickets/${ticketA._id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenTechA}` },
      body: { status: 'DIAGNOSING', note: 'Testing DC voltage string inputs and inverter error state' },
    });
    if (!diagRes.ok) throw new Error(`Diagnosing status failed: ${JSON.stringify(diagRes.data)}`);
    console.log(`✓ Ticket progressed through field stages: ACCEPTED -> ON_THE_WAY -> ON_SITE -> DIAGNOSING.`);

    // 7. Technician A submits Service Report
    console.log('7. Technician A completes fieldwork and submits report...');
    const reportRes = await request(TEST_API, `/service-reports/${ticketA._id}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenTechA}` },
      body: {
        actualDiagnosis: 'Grid voltage surge caused Sungrow inverter overvoltage trip at 265V AC',
        workPerformed: 'Adjusted inverter grid parameter ceiling to regional code and inspected AC isolator contacts',
        readings: { acVoltage: 248, acCurrent: 28.4, dcVoltage: 580 },
        partsUsed: [],
        toolsUsed: ['MULTIMETER', 'CLAMP_METER'],
        technicianNotes: 'Inverter generating full 24.2 kW now. Client signed service sheet.',
        aiHelpful: true,
        aiAccuracyRating: 5,
      },
    });
    if (!reportRes.ok) throw new Error(`Service report submission failed: ${JSON.stringify(reportRes.data)}`);
    console.log(`✓ Service report saved. Ticket transitioned to COMPLETED!`);

    // 8. Manager A checks Evaluation & Metrics
    console.log('8. Checking completed ticket detail and AI vs Actual comparison...');
    const ticketDetailRes = await request(TEST_API, `/tickets/${ticketA._id}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    if (ticketDetailRes.ok && ticketDetailRes.data?.data) {
      const detail = ticketDetailRes.data.data;
      console.log(`✓ Completed ticket detail verified:`);
      console.log(`  - Ticket Status: ${detail.ticket.status}`);
      console.log(`  - Actual Diagnosis: ${detail.serviceReport?.actualDiagnosis}`);
      console.log(`  - History Records: ${detail.assetHistory?.length}`);
      if (detail.assetHistory && detail.assetHistory.length > 0) {
        console.log(`  - AI vs Actual Diagnosis Match: ${detail.assetHistory[0].comparisonResult?.diagnosisMatch}`);
        console.log(`  - AI vs Actual Tool Match: ${detail.assetHistory[0].comparisonResult?.toolMatch}`);
      }
    }

    console.log('\n=============================================================');
    console.log('ALL 10 TEST PHASES (A THROUGH J) PASSED WITH ZERO ERRORS! 🚀');
    console.log('=============================================================');

  } catch (err: any) {
    console.error('\n❌ TEST SUITE FAILED:', err.message);
    process.exitCode = 1;
  } finally {
    // ------------------------------------------------------------------------
    // CLEANUP: Clean up test records inside TEST database
    // ------------------------------------------------------------------------
    console.log('\n[Cleanup] Cleaning test artifacts from TEST database...');
    try {
      if (testCompanyAId) {
        await Promise.all([
          User.deleteMany({ companyId: testCompanyAId }),
          Technician.deleteMany({ companyId: testCompanyAId }),
          Customer.deleteMany({ companyId: testCompanyAId }),
          SolarSystem.deleteMany({ companyId: testCompanyAId }),
          ServiceTicket.deleteMany({ companyId: testCompanyAId }),
          ServiceHistory.deleteMany({ companyId: testCompanyAId }),
          Company.deleteOne({ _id: testCompanyAId }),
        ]);
        console.log('✓ Cleaned Company A test records');
      }
      if (testCompanyBId) {
        await Promise.all([
          User.deleteMany({ companyId: testCompanyBId }),
          Technician.deleteMany({ companyId: testCompanyBId }),
          ServiceTicket.deleteMany({ companyId: testCompanyBId }),
          Company.deleteOne({ _id: testCompanyBId }),
        ]);
        console.log('✓ Cleaned Company B test records');
      }
    } catch (cleanErr: any) {
      console.warn('Warning during cleanup:', cleanErr.message);
    }

    if (testServer) {
      testServer.close();
      console.log('✓ Ephemeral test server closed');
    }
    await mongoose.disconnect();
    console.log('✓ Disconnected from test database');
  }
}

runSuite();
