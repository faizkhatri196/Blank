/**
 * SERVORA V2 — 20-SCENARIO COMPREHENSIVE LOCATION ONBOARDING & FIELD OPERATIONS VERIFICATION
 */

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('================================================================');
  console.log('  SERVORA V2 — LOCATION-BASED DISCOVERY & FIELD TELEMETRY VERIFICATION');
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
  const companyAEmail = `co_ahmd_${timestamp}@test.com`;
  const companyBEmail = `co_rajk_${timestamp}@test.com`;
  const customerEmail = `cust_${timestamp}@test.com`;
  const password = 'TestPassword@123';

  let tokenA = '';
  let companyAId = '';
  let tokenB = '';
  let companyBId = '';
  let custToken = '';
  let ticketSolarAhmdId = '';
  let ticketElecRajkotId = '';
  let techAId = '';
  let techAToken = '';
  let techBId = '';

  try {
    // ---------------------------------------------------------
    // SCENARIO 1: Company A registers in Ahmedabad for SOLAR & AC
    // ---------------------------------------------------------
    console.log('\n--- SCENARIO 1: Company A registers in Ahmedabad (Solar + AC) ---');
    const resA = await fetch(`${BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyName: `Solar & AC Pros ${timestamp}`,
        managerName: 'Manager Ahmedabad',
        email: companyAEmail,
        password,
        confirmPassword: password,
        phone: '9876543210',
        serviceAreas: [
          {
            city: 'Ahmedabad',
            state: 'Gujarat',
            areas: ['Bodakdev', 'Vastrapur', 'Satellite'],
            pincodes: ['380015', '380054'],
            services: ['SOLAR', 'AC'],
          },
        ],
      }),
    });
    const dataA = await resA.json();
    if (!dataA.success) console.error('Company A signup error:', dataA);
    assert(resA.status === 201 && dataA.success, 'Company A registered successfully');
    tokenA = dataA.data.token;
    companyAId = dataA.data.company.id;
    assert(dataA.data.company.servicesSupported.includes('SOLAR'), 'Company A supports SOLAR');
    assert(dataA.data.company.servicesSupported.includes('AC'), 'Company A supports AC');

    // ---------------------------------------------------------
    // SCENARIO 2: Company B registers in Rajkot for ELECTRICAL & PLUMBING only
    // ---------------------------------------------------------
    console.log('\n--- SCENARIO 2: Company B registers in Rajkot (Electrical + Plumbing) ---');
    const resB = await fetch(`${BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyName: `Rajkot Quick Services ${timestamp}`,
        managerName: 'Manager Rajkot',
        email: companyBEmail,
        password,
        confirmPassword: password,
        phone: '9876543211',
        serviceAreas: [
          {
            city: 'Rajkot',
            state: 'Gujarat',
            areas: ['Kalavad Road', 'Yagnik Road'],
            pincodes: ['360001', '360005'],
            services: ['ELECTRICAL', 'PLUMBING'],
          },
        ],
      }),
    });
    const dataB = await resB.json();
    if (!dataB.success) console.error('Company B signup error:', dataB);
    assert(resB.status === 201 && dataB.success, 'Company B registered successfully in Rajkot');
    tokenB = dataB.data.token;
    companyBId = dataB.data.company.id;
    assert(dataB.data.company.servicesSupported.includes('ELECTRICAL'), 'Company B supports ELECTRICAL');
    assert(dataB.data.company.servicesSupported.includes('PLUMBING'), 'Company B supports PLUMBING');
    assert(!dataB.data.company.servicesSupported.includes('SOLAR'), 'Company B strictly does NOT support SOLAR');

    // ---------------------------------------------------------
    // SCENARIO 3: Customer searches Ahmedabad -> receives Solar and AC
    // ---------------------------------------------------------
    console.log('\n--- SCENARIO 3: Customer searches Ahmedabad ---');
    const resDiscAhmd = await fetch(`${BASE_URL}/customer-portal/services/available`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        city: 'Ahmedabad',
        pincode: '380015',
      }),
    });
    const discAhmdData = await resDiscAhmd.json();
    assert(resDiscAhmd.status === 200 && discAhmdData.success, 'Discovery in Ahmedabad returned 200');
    const ahmdTypes = discAhmdData.data.availableServices.map((s) => s.serviceType);
    assert(ahmdTypes.includes('SOLAR'), 'Ahmedabad discovery includes SOLAR');
    assert(ahmdTypes.includes('AC'), 'Ahmedabad discovery includes AC');

    // ---------------------------------------------------------
    // SCENARIO 4: Customer searches Rajkot -> receives Electrical and Plumbing (NO Solar/AC)
    // ---------------------------------------------------------
    console.log('\n--- SCENARIO 4: Customer searches Rajkot ---');
    const resDiscRajkot = await fetch(`${BASE_URL}/customer-portal/services/available`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        city: 'Rajkot',
        pincode: '360001',
      }),
    });
    const discRajkotData = await resDiscRajkot.json();
    assert(resDiscRajkot.status === 200 && discRajkotData.success, 'Discovery in Rajkot returned 200');
    const rajkotTypes = discRajkotData.data.availableServices.map((s) => s.serviceType);
    assert(rajkotTypes.includes('ELECTRICAL'), 'Rajkot discovery includes ELECTRICAL');
    assert(rajkotTypes.includes('PLUMBING'), 'Rajkot discovery includes PLUMBING');
    assert(!rajkotTypes.includes('SOLAR'), 'Rajkot discovery does NOT include SOLAR');
    assert(!rajkotTypes.includes('AC'), 'Rajkot discovery does NOT include AC');

    // ---------------------------------------------------------
    // SCENARIO 5: Customer searches unserved city (Mumbai) -> receives empty / unavailable, ZERO Ahmedabad fallback
    // ---------------------------------------------------------
    console.log('\n--- SCENARIO 5: Customer searches unserved city (Mumbai) ---');
    const resDiscMumbai = await fetch(`${BASE_URL}/customer-portal/services/available`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        city: 'Mumbai',
        pincode: '400001',
      }),
    });
    const discMumbaiData = await resDiscMumbai.json();
    assert(resDiscMumbai.status === 200 && discMumbaiData.success, 'Discovery in unserved city returned 200');
    assert(
      discMumbaiData.data.availableServices.length === 0,
      `Unserved city has 0 available services (NO false fallback to Ahmedabad). Count: ${discMumbaiData.data.availableServices.length}`
    );

    // Login customer for authenticated tracking & feedback tests
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

    // ---------------------------------------------------------
    // SCENARIO 6: Customer submits Solar request in Ahmedabad -> succeeded
    // ---------------------------------------------------------
    console.log('\n--- SCENARIO 6: Customer submits Solar request in Ahmedabad ---');
    const reqSolarAhmd = await fetch(`${BASE_URL}/customer-portal/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        companyId: companyAId,
        serviceType: 'SOLAR',
        problemCategory: 'INVERTER_FAULT',
        problemCode: 'SOL_INV_OFF',
        complaint: 'Solar inverter red light blinking and generation showing 0 kWh since morning.',
        customerDetails: {
          name: 'Pooja Patel',
          phone: '9876500001',
          email: customerEmail,
        },
        serviceLocation: {
          city: 'Ahmedabad',
          address: '101 Sunrise Heights, Bodakdev',
          area: 'Bodakdev',
          pincode: '380015',
        },
      }),
    });
    const solarAhmdData = await reqSolarAhmd.json();
    if (!solarAhmdData.success) console.error('Scenario 6 error:', solarAhmdData);
    assert(reqSolarAhmd.status === 201 && solarAhmdData.success, 'Solar request created in Ahmedabad');
    ticketSolarAhmdId = solarAhmdData.data?._id || solarAhmdData.data?.ticket?._id || solarAhmdData.data?.ticketId;
    console.log('  -> ticketSolarAhmdId:', ticketSolarAhmdId);

    // ---------------------------------------------------------
    // SCENARIO 7: Customer attempts submitting Solar request in Rajkot -> REJECTED (400, SERVICE_UNAVAILABLE_AT_LOCATION)
    // ---------------------------------------------------------
    console.log('\n--- SCENARIO 7: Customer submits Solar request in Rajkot (Unsupported) ---');
    const reqSolarRajkot = await fetch(`${BASE_URL}/customer-portal/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        serviceType: 'SOLAR',
        problemCategory: 'INVERTER_FAULT',
        complaint: 'Solar issue in Rajkot',
        customerDetails: {
          name: 'Rajkot Citizen',
          phone: '9876500002',
          email: `rajkot_${timestamp}@test.com`,
        },
        serviceLocation: {
          city: 'Rajkot',
          address: 'Kalavad Road, Rajkot',
          area: 'Kalavad Road',
          pincode: '360001',
        },
      }),
    });
    const solarRajkotData = await reqSolarRajkot.json();
    assert(
      reqSolarRajkot.status === 400 && solarRajkotData.error?.code === 'SERVICE_UNAVAILABLE_AT_LOCATION',
      `Correctly rejected unsupported service at location: HTTP 400 with code ${solarRajkotData.error?.code}`
    );

    // ---------------------------------------------------------
    // SCENARIO 8: Customer submits Electrical request in Rajkot -> succeeded
    // ---------------------------------------------------------
    console.log('\n--- SCENARIO 8: Customer submits Electrical request in Rajkot ---');
    const reqElecRajkot = await fetch(`${BASE_URL}/customer-portal/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        companyId: companyBId,
        serviceType: 'ELECTRICAL',
        problemCategory: 'SHORT_CIRCUIT',
        complaint: 'Main MCB tripping repeatedly on load in Rajkot home',
        customerDetails: {
          name: 'Pooja Patel',
          phone: '9876500001',
          email: customerEmail,
        },
        serviceLocation: {
          city: 'Rajkot',
          address: 'Kalavad Road, Rajkot',
          area: 'Kalavad Road',
          pincode: '360001',
        },
      }),
    });
    const elecRajkotData = await reqElecRajkot.json();
    if (!elecRajkotData.success) console.error('Scenario 8 error:', elecRajkotData);
    assert(reqElecRajkot.status === 201 && elecRajkotData.success, 'Electrical request created in Rajkot');
    ticketElecRajkotId = elecRajkotData.data?._id || elecRajkotData.data?.ticket?._id || elecRajkotData.data?.ticketId;
    console.log('  -> ticketElecRajkotId:', ticketElecRajkotId);

    // ---------------------------------------------------------
    // SCENARIO 9: Multi-tenant isolation: Manager A cannot see Company B tickets
    // ---------------------------------------------------------
    console.log('\n--- SCENARIO 9: Multi-tenant isolation: Manager A checks tickets ---');
    const ticketsARes = await fetch(`${BASE_URL}/tickets`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const ticketsAData = await ticketsARes.json();
    const ticketsAIds = ticketsAData.data.items.map((t) => t._id);
    assert(ticketsAIds.includes(ticketSolarAhmdId), "Manager A sees Company A's Ahmedabad ticket");
    assert(!ticketsAIds.includes(ticketElecRajkotId), "Manager A CANNOT see Company B's Rajkot ticket");

    // ---------------------------------------------------------
    // SCENARIO 10: Multi-tenant isolation: Manager B cannot see Company A tickets
    // ---------------------------------------------------------
    console.log('\n--- SCENARIO 10: Multi-tenant isolation: Manager B checks tickets ---');
    const ticketsBRes = await fetch(`${BASE_URL}/tickets`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const ticketsBData = await ticketsBRes.json();
    const ticketsBIds = ticketsBData.data.items.map((t) => t._id);
    assert(ticketsBIds.includes(ticketElecRajkotId), "Manager B sees Company B's Rajkot ticket");
    assert(!ticketsBIds.includes(ticketSolarAhmdId), "Manager B CANNOT see Company A's Ahmedabad ticket");

    // ---------------------------------------------------------
    // SCENARIO 11: Manager updates Company coverage dynamically -> Customer discovery updates
    // ---------------------------------------------------------
    console.log('\n--- SCENARIO 11: Company A adds Vadodara with RO_PURIFIER ---');
    const addCoverageRes = await fetch(`${BASE_URL}/company/coverage/area`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        city: 'Vadodara',
        state: 'Gujarat',
        areas: ['Alkapuri', 'Gotri'],
        pincodes: ['390007'],
        services: ['RO_PURIFIER'],
      }),
    });
    const addCoverageData = await addCoverageRes.json();
    if (!addCoverageData.success) console.error('Add coverage error:', addCoverageData);
    assert((addCoverageRes.status === 200 || addCoverageRes.status === 201) && addCoverageData.success, 'Coverage area added to Company A');

    // Customer searches Vadodara
    const resDiscBaroda = await fetch(`${BASE_URL}/customer-portal/services/available`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        city: 'Vadodara',
        pincode: '390007',
      }),
    });
    const discBarodaData = await resDiscBaroda.json();
    const barodaTypes = discBarodaData.data.availableServices.map((s) => s.serviceType);
    assert(barodaTypes.includes('RO_PURIFIER'), 'Vadodara now dynamically discovers RO_PURIFIER');
    assert(!barodaTypes.includes('SOLAR'), 'Vadodara does not offer SOLAR');

    // ---------------------------------------------------------
    // SCENARIO 12: Manager field operations API returns active jobs & KPIs
    // ---------------------------------------------------------
    console.log('\n--- SCENARIO 12: Manager field operations API ---');
    const techCreateRes = await fetch(`${BASE_URL}/technicians`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        name: 'Vikas Sharma',
        email: `vikas_${timestamp}@test.com`,
        phone: '9876599901',
        password,
        confirmPassword: password,
        temporaryPassword: password,
        serviceTypes: ['SOLAR', 'AC'],
        skills: ['SOLAR_INVERTER', 'ELECTRICAL_DIAGNOSTICS'],
        tools: ['MULTIMETER', 'CLAMP_METER'],
        serviceAreas: ['Bodakdev', 'Satellite'],
        experienceYears: 4,
      }),
    });
    const techCreateData = await techCreateRes.json();
    if (!techCreateData.success) console.error('Technician create error:', techCreateData);
    assert(techCreateRes.status === 201 && techCreateData.success, 'Technician Vikas created under Company A');
    techAId = techCreateData.data._id;

    // Assign ticket to technician
    const assignRes = await fetch(`${BASE_URL}/tickets/${ticketSolarAhmdId}/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ technicianId: techAId }),
    });
    assert(assignRes.status === 200, 'Ticket assigned to technician Vikas');

    // Query field operations active
    const fieldOpsRes = await fetch(`${BASE_URL}/field-operations/active`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const fieldOpsData = await fieldOpsRes.json();
    assert(fieldOpsRes.status === 200 && fieldOpsData.success, 'Field operations API returned 200');
    assert(fieldOpsData.data.kpis.activeServices >= 1, `Active services KPI is ${fieldOpsData.data.kpis.activeServices}`);
    assert(fieldOpsData.data.operations.length >= 1, `Active operations count is ${fieldOpsData.data.operations.length}`);

    // ---------------------------------------------------------
    // SCENARIO 13: Technician logs in and updates location
    // ---------------------------------------------------------
    console.log('\n--- SCENARIO 13: Technician updates location ---');
    const techLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `vikas_${timestamp}@test.com`,
        password,
      }),
    });
    const techLoginData = await techLoginRes.json();
    assert(techLoginRes.status === 200 && techLoginData.success, 'Technician logged in');
    techAToken = techLoginData.data.token;

    const locUpdateRes = await fetch(`${BASE_URL}/technicians/me/location`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${techAToken}`,
      },
      body: JSON.stringify({
        latitude: 23.0338,
        longitude: 72.5074,
        accuracy: 12.5,
        address: 'Near Iscon Cross Road, Bodakdev',
        activeTicketId: ticketSolarAhmdId,
      }),
    });
    const locUpdateData = await locUpdateRes.json();
    assert(locUpdateRes.status === 200 && locUpdateData.success, 'Technician location updated successfully');

    // ---------------------------------------------------------
    // SCENARIO 14: Cross-technician location security: Technician cannot update another technician
    // ---------------------------------------------------------
    console.log('\n--- SCENARIO 14: Cross-technician location security ---');
    // Create a second technician
    const tech2Res = await fetch(`${BASE_URL}/technicians`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        name: 'Rohan Joshi',
        email: `rohan_${timestamp}@test.com`,
        phone: '9876599902',
        password,
        confirmPassword: password,
        temporaryPassword: password,
        serviceTypes: ['SOLAR'],
        skills: ['SOLAR_PANELS'],
        tools: ['MULTIMETER'],
        serviceAreas: ['Bodakdev'],
        experienceYears: 2,
      }),
    });
    const tech2Data = await tech2Res.json();
    if (!tech2Data.success) console.error('Technician 2 create error:', tech2Data);
    techBId = tech2Data.data._id;

    // Tech A attempts to update Tech B's location
    const illegalLocRes = await fetch(`${BASE_URL}/technicians/${techBId}/location`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${techAToken}`,
      },
      body: JSON.stringify({
        latitude: 23.05,
        longitude: 72.52,
      }),
    });
    assert(illegalLocRes.status === 403, `Cross-technician location update strictly rejected with 403 (Actual: ${illegalLocRes.status})`);

    // ---------------------------------------------------------
    // SCENARIO 15: Manager field operations reflects fresh location (< 2m, FRESH)
    // ---------------------------------------------------------
    console.log('\n--- SCENARIO 15: Field operations reflects FRESH location ---');
    const fieldOpsCheck = await fetch(`${BASE_URL}/field-operations/active`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const fieldOpsCheckData = await fieldOpsCheck.json();
    const opItem = fieldOpsCheckData.data.operations.find((op) => op.ticketId === ticketSolarAhmdId);
    assert(opItem !== undefined, 'Found active operation in telemetry');
    assert(opItem.technician.locationFreshness.level === 'FRESH', `Location freshness is FRESH (Actual: ${opItem.technician.locationFreshness.level})`);
    assert(opItem.technician.currentLocation.latitude === 23.0338, 'Accurate latitude returned');

    // ---------------------------------------------------------
    // SCENARIO 16: Customer tracking endpoint returns safe customer-facing data
    // ---------------------------------------------------------
    console.log('\n--- SCENARIO 16: Customer safe tracking endpoint ---');
    const custTrackRes = await fetch(`${BASE_URL}/customer-portal/requests/${ticketSolarAhmdId}`);
    const custTrackData = await custTrackRes.json();
    assert(custTrackRes.status === 200 && custTrackData.success, 'Customer request track returned 200');
    const safeTicket = custTrackData.data.ticket || custTrackData.data;
    assert(safeTicket.customerStatusLabel !== undefined, 'Customer status label provided');
    assert(safeTicket.assignedProfessionalRole.includes('Service Professional'), `Safe role: ${safeTicket.assignedProfessionalRole}`);
    assert(safeTicket.scoreBreakdown === undefined, 'No internal scoreBreakdown leaked to customer');
    assert(safeTicket.matchScore === undefined, 'No internal matchScore leaked to customer');

    // ---------------------------------------------------------
    // SCENARIO 17: Technician sequentially advances status to COMPLETED
    // ---------------------------------------------------------
    console.log('\n--- SCENARIO 17: Technician advances job states ---');
    const transitions = [
      { status: 'ACCEPTED', note: 'Technician acknowledged dispatch' },
      { status: 'ON_THE_WAY', note: 'En route to customer site' },
      { status: 'ON_SITE', note: 'Arrived at site' },
      { status: 'DIAGNOSING', note: 'Testing string voltage' },
      { status: 'REPAIRING', note: 'Fixing loose wire' },
    ];

    for (const t of transitions) {
      const stepRes = await fetch(`${BASE_URL}/tickets/${ticketSolarAhmdId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${techAToken}`,
        },
        body: JSON.stringify(t),
      });
      assert(stepRes.status === 200, `Technician transitioned to ${t.status}`);
    }

    // Complete job with service report
    const closeoutRes = await fetch(`${BASE_URL}/service-reports/${ticketSolarAhmdId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${techAToken}`,
      },
      body: JSON.stringify({
        actualDiagnosis: 'Loose DC connector crimp at string combiner box',
        workPerformed: 'Replaced and recrimped MC4 connector pair and tested continuity',
        readings: { dcVoltage: 480, acVoltage: 235, dcCurrent: 12.4 },
        partsUsed: ['MC4 Connector Pair'],
        toolsUsed: ['MULTIMETER', 'CRIMPING_TOOL'],
        technicianNotes: 'System normal and producing 3.2 kW',
        aiHelpful: true,
        aiAccuracyRating: 5,
        aiUtilityRating: 5,
        wasAiSuggestionUseful: 'YES',
        didTechnicianHaveRequiredTools: 'YES',
        wasSecondVisitRequired: 'NO',
      }),
    });
    const closeoutData = await closeoutRes.json();
    assert((closeoutRes.status === 200 || closeoutRes.status === 201) && closeoutData.success, 'Technician submitted service report and closed job');

    // ---------------------------------------------------------
    // SCENARIO 18: Manager dashboard field operations KPIs reflect completed job
    // ---------------------------------------------------------
    console.log('\n--- SCENARIO 18: Manager field operations KPIs update ---');
    const finalOpsRes = await fetch(`${BASE_URL}/field-operations/active`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const finalOpsData = await finalOpsRes.json();
    const completedCount = finalOpsData.data?.kpis?.completedToday ?? finalOpsData.data?.kpis?.completedTodayCount ?? 0;
    assert(completedCount >= 1, `Completed today KPI incremented (Count: ${completedCount})`);

    // ---------------------------------------------------------
    // SCENARIO 19: Customer submits feedback rating
    // ---------------------------------------------------------
    console.log('\n--- SCENARIO 19: Customer submits feedback ---');
    const feedbackRes = await fetch(`${BASE_URL}/customer-portal/requests/${ticketSolarAhmdId}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rating: 5,
        comment: 'Fast and courteous technician! Solar generation restored immediately.',
        onTime: true,
        resolved: true,
      }),
    });
    const feedbackData = await feedbackRes.json();
    assert(feedbackRes.status === 200 && feedbackData.success, 'Customer feedback recorded successfully');

    // ---------------------------------------------------------
    // SCENARIO 20: Verified demo & pilot accounts remain intact
    // ---------------------------------------------------------
    console.log('\n--- SCENARIO 20: Verify demo and pilot accounts intact ---');
    const demoLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'manager@demo.com',
        password: 'Demo@12345',
      }),
    });
    const demoLoginData = await demoLoginRes.json();
    assert(demoLoginRes.status === 200 && demoLoginData.success, 'Demo manager account intact and functional');

    const pilotLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'manager@pilot.com',
        password: 'Pilot@2026',
      }),
    });
    const pilotLoginData = await pilotLoginRes.json();
    assert(pilotLoginRes.status === 200 && pilotLoginData.success, 'Pilot manager account intact and functional');

  } catch (err) {
    console.error('Fatal error during verification:', err);
    failed++;
  }

  console.log('\n================================================================');
  console.log(`  VERIFICATION RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
