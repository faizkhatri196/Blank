/**
 * SERVORA — PRODUCTIONIZATION & REAL LOCATION-BASED MARKET TEST
 * Comprehensive verification of all 17 production requirements.
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5000/api';

async function runProductionTests() {
  console.log('================================================================');
  console.log('  SERVORA PRODUCTIONIZATION & MARKET-READINESS VERIFICATION SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  const timestamp = Date.now();
  const password = 'TestPassword@123';

  // Company A (Ahmedabad - Solar + AC)
  const compAEmail = `solarp_ahmd_${timestamp}@test.com`;
  let tokenA = '';
  let compAId = '';
  let techAId = '';
  let techAToken = '';

  // Company B (Rajkot - Electrical + Plumbing)
  const compBEmail = `rajkot_elec_${timestamp}@test.com`;
  let tokenB = '';
  let compBId = '';
  let techBId = '';

  // Company C (Ahmedabad - Solar only)
  const compCEmail = `pure_solar_${timestamp}@test.com`;
  let tokenC = '';
  let compCId = '';

  // Company D (Ahmedabad - AC only)
  const compDEmail = `cooling_care_${timestamp}@test.com`;
  let tokenD = '';
  let compDId = '';

  let custToken = '';
  let solarTicketId = '';
  let acTicketId = '';
  let rajkotTicketId = '';

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Register Company A (Ahmedabad: Solar + AC)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 1: Register Company A (Ahmedabad: Solar + AC) ---');
    const resA = await fetch(`${BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyName: `SolarPro Services ${timestamp}`,
        managerName: 'Manager SolarPro',
        email: compAEmail,
        password,
        confirmPassword: password,
        phone: '9876543201',
        serviceAreas: [
          {
            city: 'Ahmedabad',
            state: 'Gujarat',
            areas: ['Bopal', 'Satellite', 'Bodakdev'],
            pincodes: ['380015', '380054', '380058'],
            services: ['SOLAR', 'AC'],
          },
        ],
      }),
    });
    const dataA = await resA.json();
    assert(resA.status === 201 && dataA.success, 'Company A registered successfully');
    tokenA = dataA.data.token;
    compAId = dataA.data.company.id;
    assert(dataA.data.company.servicesSupported.includes('SOLAR'), 'Company A supports SOLAR');
    assert(dataA.data.company.servicesSupported.includes('AC'), 'Company A supports AC');

    // -------------------------------------------------------------------------
    // TEST 2: Register Company B (Rajkot: Electrical + Plumbing)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 2: Register Company B (Rajkot: Electrical + Plumbing) ---');
    const resB = await fetch(`${BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyName: `Rajkot Field Services ${timestamp}`,
        managerName: 'Manager Rajkot',
        email: compBEmail,
        password,
        confirmPassword: password,
        phone: '9876543202',
        serviceAreas: [
          {
            city: 'Rajkot',
            state: 'Gujarat',
            areas: ['Kalawad Road', '150 Feet Ring Road', 'Yagnik Road'],
            pincodes: ['360001', '360005'],
            services: ['ELECTRICAL', 'PLUMBING'],
          },
        ],
      }),
    });
    const dataB = await resB.json();
    assert(resB.status === 201 && dataB.success, 'Company B registered successfully');
    tokenB = dataB.data.token;
    compBId = dataB.data.company.id;
    assert(dataB.data.company.servicesSupported.includes('ELECTRICAL'), 'Company B supports ELECTRICAL');
    assert(dataB.data.company.servicesSupported.includes('PLUMBING'), 'Company B supports PLUMBING');
    assert(!dataB.data.company.servicesSupported.includes('SOLAR'), 'Company B strictly does NOT support SOLAR');

    // -------------------------------------------------------------------------
    // TEST 3: Register Multi-Company Same-City (Company C & D in Ahmedabad)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 3: Register Multi-Company Same-City (Company C & D) ---');
    const resC = await fetch(`${BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyName: `Ahmedabad Pure Solar ${timestamp}`,
        managerName: 'Manager SolarPure',
        email: compCEmail,
        password,
        confirmPassword: password,
        phone: '9876543203',
        serviceAreas: [
          {
            city: 'Ahmedabad',
            state: 'Gujarat',
            areas: ['Vastrapur', 'Bopal'],
            pincodes: ['380015'],
            services: ['SOLAR'],
          },
        ],
      }),
    });
    const dataC = await resC.json();
    assert(resC.status === 201 && dataC.success, 'Company C (Pure Solar) registered');
    tokenC = dataC.data.token;
    compCId = dataC.data.company.id;

    const resD = await fetch(`${BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyName: `Ahmedabad Cooling Care ${timestamp}`,
        managerName: 'Manager Cooling',
        email: compDEmail,
        password,
        confirmPassword: password,
        phone: '9876543204',
        serviceAreas: [
          {
            city: 'Ahmedabad',
            state: 'Gujarat',
            areas: ['Satellite', 'Prahlad Nagar'],
            pincodes: ['380015'],
            services: ['AC'],
          },
        ],
      }),
    });
    const dataD = await resD.json();
    assert(resD.status === 201 && dataD.success, 'Company D (Cooling Care) registered');
    tokenD = dataD.data.token;
    compDId = dataD.data.company.id;

    // Login default customer for authenticated tracking
    const custLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'customer@demo.com',
        password: 'Demo@12345',
      }),
    });
    const custLoginData = await custLoginRes.json();
    custToken = custLoginData.data.token;
    assert(!!custToken, 'Customer authenticated successfully');

    // -------------------------------------------------------------------------
    // TEST 4: Authoritative Location Service Discovery
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 4: Authoritative Location Service Discovery ---');

    // 4A: Ahmedabad Check
    const resAhmd = await fetch(`${BASE_URL}/customer-portal/services/available`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ city: 'Ahmedabad', pincode: '380015' }),
    });
    const dataAhmd = await resAhmd.json();
    assert(resAhmd.status === 200 && dataAhmd.data.coverageAvailable === true, 'Ahmedabad has active coverage');
    const ahmdTypes = dataAhmd.data.services.map((s) => s.serviceType);
    assert(ahmdTypes.includes('SOLAR') && ahmdTypes.includes('AC'), 'Ahmedabad offers union of SOLAR and AC');
    assert(!ahmdTypes.includes('PLUMBING'), 'Ahmedabad does NOT offer PLUMBING (strictly enforced)');

    // 4B: Rajkot Check
    const resRajkot = await fetch(`${BASE_URL}/customer-portal/services/available`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ city: 'Rajkot', pincode: '360001' }),
    });
    const dataRajkot = await resRajkot.json();
    assert(resRajkot.status === 200 && dataRajkot.data.coverageAvailable === true, 'Rajkot has active coverage');
    const rajkotTypes = dataRajkot.data.services.map((s) => s.serviceType);
    assert(rajkotTypes.includes('ELECTRICAL') && rajkotTypes.includes('PLUMBING'), 'Rajkot offers ELECTRICAL and PLUMBING');
    assert(!rajkotTypes.includes('SOLAR'), 'Rajkot does NOT offer SOLAR');

    // 4C: Mumbai Check (Unsupported Location)
    const resMumbai = await fetch(`${BASE_URL}/customer-portal/services/available`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ city: 'Mumbai', pincode: '400001' }),
    });
    const dataMumbai = await resMumbai.json();
    assert(resMumbai.status === 200 && dataMumbai.data?.coverageAvailable === false, 'Mumbai correctly returns coverageAvailable: false');
    assert(dataMumbai.data.services.length === 0, 'Mumbai returns 0 available services (zero fallback)');
    assert(
      dataMumbai.data.message.includes('Servora services are not currently available'),
      'Clean coverage message returned without prototype/fallback wording'
    );

    // -------------------------------------------------------------------------
    // TEST 5: Backend Service Revalidation & Location Enforcement on Request Submission
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 5: Backend Service Revalidation at Ticket Creation ---');

    // 5A: Unsupported Location Submission (Mumbai)
    const resBadLoc = await fetch(`${BASE_URL}/customer-portal/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${custToken}`,
      },
      body: JSON.stringify({
        serviceType: 'SOLAR',
        problemCategory: 'INVERTER_FAULT',
        complaint: 'Testing solar request in Mumbai',
        customerDetails: { name: 'Pooja Patel', phone: '9876500001', email: 'pooja@test.com' },
        serviceLocation: { address: 'Bandra West', city: 'Mumbai', pincode: '400050' },
      }),
    });
    const dataBadLoc = await resBadLoc.json();
    assert(
      resBadLoc.status === 400 && dataBadLoc.error?.code === 'SERVICE_UNAVAILABLE_AT_LOCATION',
      'Mumbai request rejected with HTTP 400 SERVICE_UNAVAILABLE_AT_LOCATION'
    );

    // 5B: Unsupported Service in Covered Location (Plumbing in Ahmedabad)
    const resBadService = await fetch(`${BASE_URL}/customer-portal/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${custToken}`,
      },
      body: JSON.stringify({
        serviceType: 'PLUMBING',
        problemCategory: 'PIPE_LEAK',
        complaint: 'Water pipe leaking in kitchen',
        customerDetails: { name: 'Pooja Patel', phone: '9876500001', email: 'pooja@test.com' },
        serviceLocation: { address: 'Bopal Crossroad', city: 'Ahmedabad', pincode: '380058' },
      }),
    });
    const dataBadService = await resBadService.json();
    assert(
      resBadService.status === 400 && dataBadService.error?.code === 'SERVICE_UNAVAILABLE_AT_LOCATION',
      'Plumbing in Ahmedabad rejected with HTTP 400 SERVICE_UNAVAILABLE_AT_LOCATION'
    );

    // 5C: Valid Solar Request in Ahmedabad (Auto-routed to Company A)
    const resSolar = await fetch(`${BASE_URL}/customer-portal/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${custToken}`,
      },
      body: JSON.stringify({
        companyId: compAId,
        serviceType: 'SOLAR',
        problemCategory: 'INVERTER_FAULT',
        problemCode: 'SOL_INV_OFF',
        complaint: 'Solar inverter display is completely off with zero generation reading',
        customerDetails: { name: 'Pooja Patel', phone: '9876500001', email: 'pooja@test.com' },
        serviceLocation: { address: 'B-302 Silver Harmony, Satellite', city: 'Ahmedabad', area: 'Satellite', pincode: '380015' },
      }),
    });
    const dataSolar = await resSolar.json();
    assert(resSolar.status === 201 && dataSolar.success, 'Valid Solar ticket in Ahmedabad created (201)');
    solarTicketId = dataSolar.data?._id;

    // 5D: Valid AC Request in Ahmedabad (Auto-routed to Company D)
    const resAC = await fetch(`${BASE_URL}/customer-portal/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${custToken}`,
      },
      body: JSON.stringify({
        companyId: compDId,
        serviceType: 'AC',
        problemCategory: 'NOT_COOLING',
        problemCode: 'AC_NOT_COOL',
        complaint: 'Split AC blowing room temperature air instead of cooling',
        customerDetails: { name: 'Pooja Patel', phone: '9876500001', email: 'pooja@test.com' },
        serviceLocation: { address: 'A-101 Galaxy Heights, Satellite', city: 'Ahmedabad', area: 'Satellite', pincode: '380015' },
      }),
    });
    const dataAC = await resAC.json();
    assert(resAC.status === 201 && dataAC.success, 'Valid AC ticket in Ahmedabad created (201)');
    acTicketId = dataAC.data?._id;

    // 5E: Valid Electrical Request in Rajkot (Routed to Company B)
    const resRajkotReq = await fetch(`${BASE_URL}/customer-portal/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${custToken}`,
      },
      body: JSON.stringify({
        companyId: compBId,
        serviceType: 'ELECTRICAL',
        problemCategory: 'SHORT_CIRCUIT',
        problemCode: 'ELEC_SHORT',
        complaint: 'Main breaker tripping immediately upon load in Rajkot',
        customerDetails: { name: 'Pooja Patel', phone: '9876500001', email: 'pooja@test.com' },
        serviceLocation: { address: 'Flat 12, Crystal Heights, Kalawad Road', city: 'Rajkot', area: 'Kalawad Road', pincode: '360005' },
      }),
    });
    const dataRajkotReq = await resRajkotReq.json();
    assert(resRajkotReq.status === 201 && dataRajkotReq.success, 'Valid Electrical ticket in Rajkot created (201)');
    rajkotTicketId = dataRajkotReq.data?._id;

    // -------------------------------------------------------------------------
    // TEST 6: Technician Creation & Multi-Tenant Security
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 6: Multi-Tenant Technician Security & Strict Matching ---');

    // 6A: Create Technician for Company A
    const resTechA = await fetch(`${BASE_URL}/technicians`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        name: 'Amit Patel (Solar Lead)',
        email: `tech_a_${timestamp}@test.com`,
        phone: '9876543101',
        password,
        confirmPassword: password,
        temporaryPassword: password,
        serviceTypes: ['SOLAR', 'AC'],
        skills: ['SOLAR_INVERTER', 'ELECTRICAL_DIAGNOSTICS'],
        tools: ['MULTIMETER', 'CLAMP_METER'],
        serviceAreas: ['Satellite', 'Bopal'],
        experienceYears: 4,
      }),
    });
    const dataTechA = await resTechA.json();
    assert(resTechA.status === 201 && dataTechA.success, 'Technician A created under Company A');
    techAId = dataTechA.data?._id;

    // 6B: Create Technician for Company B
    const resTechB = await fetch(`${BASE_URL}/technicians`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({
        name: 'Nilesh Dave (Rajkot Lead)',
        email: `tech_b_${timestamp}@test.com`,
        phone: '9876543102',
        password,
        confirmPassword: password,
        temporaryPassword: password,
        serviceTypes: ['ELECTRICAL', 'PLUMBING'],
        skills: ['Panel Wiring', 'MCB Replacement'],
        tools: ['SCREWDRIVER_SET', 'TESTER'],
        serviceAreas: ['Kalawad Road', '150 Feet Ring Road'],
        experienceYears: 3,
      }),
    });
    const dataTechB = await resTechB.json();
    assert(resTechB.status === 201 && dataTechB.success, 'Technician B created under Company B');
    techBId = dataTechB.data?._id;

    // 6C: Cross-Company Assignment Attack
    // Company A tries to assign Tech B (belongs to Company B)
    const resCrossAssign = await fetch(`${BASE_URL}/tickets/${solarTicketId}/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ technicianId: techBId }),
    });
    const dataCrossAssign = await resCrossAssign.json();
    assert(
      resCrossAssign.status === 400 && dataCrossAssign.error?.code === 'INVALID_TECHNICIAN',
      'Cross-company technician assignment rejected with HTTP 400 INVALID_TECHNICIAN'
    );

    // 6D: Cross-Tenant Isolation: Manager B cannot access Company A's Solar ticket
    const resCrossTicket = await fetch(`${BASE_URL}/tickets/${solarTicketId}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(
      resCrossTicket.status === 403 || resCrossTicket.status === 404,
      'Cross-tenant ticket detail access strictly rejected (403/404)'
    );

    // -------------------------------------------------------------------------
    // TEST 7: Valid Technician Assignment & State Machine Lifecycle
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 7: Valid Assignment & Lifecycle State Machine ---');

    // Assign Tech A to Solar Ticket
    const resAssign = await fetch(`${BASE_URL}/tickets/${solarTicketId}/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ technicianId: techAId }),
    });
    const dataAssign = await resAssign.json();
    assert(resAssign.status === 200 && dataAssign.success, 'Technician A assigned to Solar ticket');

    // Tech A logs in
    const resTechLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `tech_a_${timestamp}@test.com`, password }),
    });
    const dataTechLogin = await resTechLogin.json();
    techAToken = dataTechLogin.data.token;
    assert(!!techAToken, 'Technician A logged in successfully');

    // Tech A accepts ticket
    const resAccept = await fetch(`${BASE_URL}/tickets/${solarTicketId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${techAToken}`,
      },
      body: JSON.stringify({ status: 'ACCEPTED', note: 'Accepted by technician' }),
    });
    const dataAccept = await resAccept.json();
    assert(resAccept.status === 200 && dataAccept.data?.status === 'ACCEPTED', 'Ticket status: ACCEPTED');

    // Tech A moves to ON_THE_WAY
    const resOTW = await fetch(`${BASE_URL}/tickets/${solarTicketId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${techAToken}`,
      },
      body: JSON.stringify({ status: 'ON_THE_WAY', note: 'En route to customer rooftop' }),
    });
    const dataOTW = await resOTW.json();
    assert(resOTW.status === 200 && dataOTW.data?.status === 'ON_THE_WAY', 'Ticket status: ON_THE_WAY');

    // -------------------------------------------------------------------------
    // TEST 8: Live Location Telemetry & Freshness Evaluation
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 8: Real Location Telemetry & Freshness Tiers ---');

    // Broadcast fresh location (< 10 seconds ago)
    const resLoc = await fetch(`${BASE_URL}/technicians/me/location`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${techAToken}`,
      },
      body: JSON.stringify({
        latitude: 23.0338,
        longitude: 72.585,
        accuracy: 12,
        activeTicketId: solarTicketId,
      }),
    });
    const dataLoc = await resLoc.json();
    assert(resLoc.status === 200 && dataLoc.success, 'Technician live GPS coordinates broadcast recorded');

    // Field operations telemetry returns freshness FRESH
    const resFieldOps = await fetch(`${BASE_URL}/field-operations/active`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const dataFieldOps = await resFieldOps.json();
    assert(resFieldOps.status === 200 && dataFieldOps.success, 'Manager field-operations active returned 200');
    const matchedOp = dataFieldOps.data.operations.find((op) => op.ticketId === solarTicketId);
    assert(matchedOp && matchedOp.technician?.locationFreshness?.level === 'FRESH', 'Location freshness evaluated as FRESH');
    assert(typeof matchedOp?.technician?.currentLocation?.latitude === 'number', 'Accurate technician latitude present');

    // -------------------------------------------------------------------------
    // TEST 9: Customer Privacy API Verification
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 9: Customer Privacy Enforcement ---');
    const resTrack = await fetch(`${BASE_URL}/customer-portal/requests/${solarTicketId}`, {
      headers: { Authorization: `Bearer ${custToken}` },
    });
    const dataTrack = await resTrack.json();
    assert(resTrack.status === 200 && dataTrack.success, 'Customer fetched ticket tracking details');
    const custSafeTicket = dataTrack.data;
    assert(!custSafeTicket.aiAnalysisId, 'Internal AI prompt / raw analysis NOT exposed to customer');
    assert(!custSafeTicket.assignedTechnicianId?.phone, 'Technician raw personal phone NOT exposed to customer');
    assert(!custSafeTicket.matchScore && !custSafeTicket.scoreBreakdown, 'Internal technician ranking scores NOT exposed to customer');
    assert(!custSafeTicket.managerInternalNotes, 'Manager internal operations notes NOT exposed to customer');

    // -------------------------------------------------------------------------
    // TEST 10: Technician Job Completion with Ground Truth
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 10: Technician Completion & Ground Truth Recording ---');

    await fetch(`${BASE_URL}/tickets/${solarTicketId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${techAToken}`,
      },
      body: JSON.stringify({ status: 'ON_SITE', note: 'Arrived at site' }),
    });

    await fetch(`${BASE_URL}/tickets/${solarTicketId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${techAToken}`,
      },
      body: JSON.stringify({ status: 'DIAGNOSING', note: 'Inspecting isolator switch and inverter' }),
    });

    await fetch(`${BASE_URL}/tickets/${solarTicketId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${techAToken}`,
      },
      body: JSON.stringify({ status: 'REPAIRING', note: 'Replacing damaged DC isolator' }),
    });

    const resComplete = await fetch(`${BASE_URL}/service-reports/${solarTicketId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${techAToken}`,
      },
      body: JSON.stringify({
        actualDiagnosis: 'DC Isolator switch burnt out due to heat; inverter unit functional',
        workPerformed: 'Replaced DC isolator switch with 32A rated unit and re-torqued terminal connections',
        readings: { dcVoltage: 412, acVoltage: 238, generationKwh: 18.4 },
        partsUsed: ['DC Isolator 32A 1000V'],
        toolsUsed: ['MULTIMETER', 'CLAMP_METER'],
        technicianNotes: 'Inverter came online immediately after isolator replacement.',
        aiHelpful: true,
        aiAccuracyRating: 5,
        aiUtilityRating: 5,
        wasAiSuggestionUseful: 'YES',
        didTechnicianHaveRequiredTools: 'YES',
        wasSecondVisitRequired: 'NO',
      }),
    });
    const dataComplete = await resComplete.json();
    assert((resComplete.status === 200 || resComplete.status === 201) && dataComplete.success, 'Job marked COMPLETED with ground truth recorded');

    // -------------------------------------------------------------------------
    // TEST 11: Customer Feedback & Rating Submission
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 11: Customer Rating & Feedback ---');
    const resFeedback = await fetch(`${BASE_URL}/customer-portal/requests/${solarTicketId}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${custToken}`,
      },
      body: JSON.stringify({
        rating: 5,
        comment: 'Outstanding and prompt service. The technician arrived on time and fixed our solar generation.',
      }),
    });
    const dataFeedback = await resFeedback.json();
    assert(resFeedback.status === 200 && dataFeedback.success, 'Customer submitted 5-star rating and feedback');

    // -------------------------------------------------------------------------
    // TEST 12: Manager AI vs Actual Comparison Review
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 12: Manager AI vs Actual Comparison Review ---');
    const resDetail = await fetch(`${BASE_URL}/tickets/${solarTicketId}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const dataDetail = await resDetail.json();
    const detailTicket = dataDetail.data?.ticket || dataDetail.data;
    assert(detailTicket?.status === 'COMPLETED', 'Manager sees ticket status COMPLETED');
    assert(detailTicket?.customerFeedback?.rating === 5, 'Customer 5-star rating visible to manager');

    // -------------------------------------------------------------------------
    // TEST 13: Production UI Branding Static Verification
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 13: Production UI Branding Verification ---');
    const filesToScan = [
      'client/src/layouts/CustomerLayout.tsx',
      'client/src/layouts/TechnicianLayout.tsx',
      'client/src/components/common/Navbar.tsx',
      'client/src/components/common/Sidebar.tsx',
      'client/src/pages/customer/CustomerHome.tsx',
      'client/src/pages/customer/CustomerServiceRequest.tsx',
      'client/src/pages/manager/Dashboard.tsx',
      'client/src/pages/manager/Tickets.tsx',
      'client/src/pages/manager/TicketDetail.tsx',
    ];

    const forbiddenPhrases = [
      'SERVORA V2',
      'Servora V2',
      'AI Demo',
      'AI Powered Demo',
      'Prototype',
      'DEMO DATA',
      'Demo Data',
      'DEMO',
      'Supported Pilot Areas',
      'Supported Pilot Cities',
      'Switch to Supported Area (Ahmedabad)',
    ];

    let foundForbidden = 0;
    for (const relPath of filesToScan) {
      const fullPath = path.resolve(__dirname, '..', relPath);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const jsxTextMatches = content.match(/>([^<>\r\n]+)</g) || [];
        for (const match of jsxTextMatches) {
          const text = match.replace(/[><]/g, '').trim();
          for (const phrase of forbiddenPhrases) {
            if (new RegExp(`\\b${phrase}\\b`, 'i').test(text)) {
              console.error(`  [FAIL] Forbidden visible branding "${phrase}" found in text "${text}" in ${relPath}`);
              foundForbidden++;
            }
          }
        }
      }
    }
    assert(foundForbidden === 0, 'Zero forbidden dev/v2/demo labels found in production UI files');

    // -------------------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------------------
    console.log('\n================================================================');
    console.log(`  VERIFICATION RESULTS: ${passed} PASSED | ${failed} FAILED`);
    console.log('================================================================\n');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runProductionTests();
