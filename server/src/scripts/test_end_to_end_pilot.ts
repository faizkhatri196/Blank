const API_BASE = 'http://localhost:5000/api';

async function request(url: string, options: any = {}): Promise<any> {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  const body = options.body ? JSON.stringify(options.body) : undefined;
  const res = await fetch(`${API_BASE}${url}`, {
    method: options.method || 'GET',
    headers,
    body,
  });
  const data: any = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || `HTTP ${res.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

async function testFullFlow() {
  console.log('====================================================');
  console.log('1. TESTING MANAGER LOGIN (manager@pilot.com)');
  console.log('====================================================');
  const mgrLogin = await request('/auth/login', {
    method: 'POST',
    body: { email: 'manager@pilot.com', password: 'Pilot@2026' },
  });
  const mgrToken = mgrLogin.data.token;
  const mgrUser = mgrLogin.data.user;
  console.log(`✓ Manager authenticated: ${mgrUser.name} (${mgrUser.companyName})`);

  console.log('\n====================================================');
  console.log('2. FETCHING PILOT CUSTOMERS & ASSETS');
  console.log('====================================================');
  const custRes = await request('/customers', {
    headers: { Authorization: `Bearer ${mgrToken}` },
  });
  const customers = custRes.data;
  console.log(`✓ Found ${customers.length} pilot customer(s):`, customers.map((c: any) => c.name));
  const targetCustomer = customers[0];

  const assetRes = await request(`/assets/solar-systems?customerId=${targetCustomer._id}`, {
    headers: { Authorization: `Bearer ${mgrToken}` },
  });
  const targetAsset = assetRes.data[0];
  console.log(`✓ Found Solar Asset: ${targetAsset.inverterMake} ${targetAsset.inverterModel} (${targetAsset.capacityKW} kW)`);

  console.log('\n====================================================');
  console.log('3. CREATING TICKET WITH BAD SPELLING COMPLAINT');
  console.log('====================================================');
  const rawComplaint = 'invrtr not wrkng genration bandh';
  const ticketRes = await request('/tickets', {
    method: 'POST',
    headers: { Authorization: `Bearer ${mgrToken}` },
    body: {
      serviceType: 'SOLAR',
      customerId: targetCustomer._id,
      assetId: targetAsset._id,
      complaint: rawComplaint,
      symptoms: ['Inverter display dark', 'Zero generation on meter'],
      priority: 'HIGH',
    },
  });
  const ticket = ticketRes.data;
  console.log(`✓ Ticket Created Successfully: ${ticket.ticketNumber} (ID: ${ticket._id})`);
  console.log(`  - Raw Complaint: "${ticket.rawComplaint}"`);
  console.log(`  - Normalized: "${ticket.normalizedComplaint}"`);
  console.log(`  - Status: ${ticket.status}`);

  console.log('\n====================================================');
  console.log('4. RUNNING AI ANALYSIS');
  console.log('====================================================');
  const aiRes = await request(`/tickets/${ticket._id}/analyze`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${mgrToken}` },
  });
  const analysis = aiRes.data?.analysis || aiRes.data;
  console.log(`✓ AI Analysis Generated:`);
  console.log(`  - Confidence: ${analysis?.confidence}`);
  console.log(`  - Possible Issues:`, analysis.possibleIssues.map((p: any) => p.issue));
  console.log(`  - Recommended Tools:`, analysis.recommendedTools);

  console.log('\n====================================================');
  console.log('5. MATCHING & ASSIGNING TECHNICIAN');
  console.log('====================================================');
  const matchRes = await request(`/tickets/${ticket._id}/recommended-technicians`, {
    headers: { Authorization: `Bearer ${mgrToken}` },
  });
  const matches = matchRes.data;
  console.log(`✓ Technician Matches Found (${matches.length}):`);
  matches.forEach((m: any) => console.log(`  - ${m.technicianName}: Score ${m.score}%`));

  const assignedTechId = matches[0].technicianId;
  await request(`/tickets/${ticket._id}/assign`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${mgrToken}` },
    body: { technicianId: assignedTechId },
  });
  console.log(`✓ Assigned ticket to technician: ${matches[0].technicianName}`);

  console.log('\n====================================================');
  console.log('6. TECHNICIAN WORKFLOW (tech@pilot.com)');
  console.log('====================================================');
  const techLogin = await request('/auth/login', {
    method: 'POST',
    body: { email: 'tech@pilot.com', password: 'Pilot@2026' },
  });
  const techToken = techLogin.data.token;
  console.log(`✓ Technician authenticated: ${techLogin.data.user.name}`);

  // Technician advances status
  for (const nextStatus of ['ACCEPTED', 'ON_THE_WAY', 'ON_SITE', 'DIAGNOSING']) {
    await request(`/tickets/${ticket._id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${techToken}` },
      body: { status: nextStatus },
    });
    console.log(`  -> Advanced to: ${nextStatus}`);
  }

  console.log('\n====================================================');
  console.log('7. SUBMITTING FIELD SERVICE REPORT & PILOT FEEDBACK');
  console.log('====================================================');
  const reportRes = await request(`/service-reports/${ticket._id}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${techToken}` },
    body: {
      actualDiagnosis: 'Loose MC4 connector at string combiner box causing open circuit.',
      workPerformed: 'Replaced burnt MC4 connector pair, crimped with 1000V rated solar tool, verified continuity.',
      readings: { dcVoltage: 485, acVoltage: 238, dcCurrent: 14.2 },
      partsUsed: ['MC4 Connector Pair'],
      toolsUsed: ['MULTIMETER', 'CLAMP_METER', 'MC4_TOOL'],
      aiAccuracyRating: 5,
      aiUtilityRating: 5,
      wasAiSuggestionUseful: 'YES',
      didTechnicianHaveRequiredTools: 'YES',
      wasSecondVisitRequired: 'NO',
      additionalFeedback: 'AI triage accurately highlighted MC4 / DC connection fault.',
    },
  });

  const { report, comparison } = reportRes.data;
  console.log(`✓ Service Report Recorded:`);
  console.log(`  - Actual Diagnosis: "${report.actualDiagnosis}"`);
  console.log(`  - AI vs Actual Alignment: ${comparison.diagnosisMatch}`);
  console.log(`  - Tool Match: ${comparison.toolMatch}`);
  console.log(`  - Part Match: ${comparison.partMatch}`);
  console.log('\n====================================================');
  console.log('✅ ALL OPERATIONS COMPLETED 100% SUCCESSFULLY!');
  console.log('====================================================');
}

testFullFlow().catch((err) => {
  console.error('❌ Test Failed:', err.message);
  process.exit(1);
});
