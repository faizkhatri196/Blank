const API_BASE = 'http://localhost:5000/api';

async function request(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log('====================================================');
  console.log('SERVORA V2 LOCATION-BASED SERVICE DISCOVERY TESTS');
  console.log('====================================================\n');

  // Customer credentials
  const loginRes = await request(`${API_BASE}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({
      email: 'customer@demo.com',
      password: 'Demo@12345',
    }),
  });
  const token = loginRes.data.data.token;
  const authHeaders = { Authorization: `Bearer ${token}` };
  console.log('✓ Customer logged in successfully\n');

  let passedTests = 0;
  let totalTests = 7;

  // TEST 1: Ahmedabad + supported pincode (380015)
  console.log('--- TEST 1: Supported Location (Ahmedabad, 380015) ---');
  const t1Res = await request(`${API_BASE}/customer-portal/services/available`, {
    method: 'POST',
    body: JSON.stringify({
      city: 'Ahmedabad',
      pincode: '380015',
    }),
  });
  console.log('Response:', JSON.stringify(t1Res.data.data, null, 2));
  if (
    t1Res.data.success &&
    t1Res.data.data.coverageAvailable === true &&
    t1Res.data.data.services.length >= 2 &&
    t1Res.data.data.services.some((s) => s.serviceType === 'SOLAR') &&
    t1Res.data.data.services.some((s) => s.serviceType === 'AC')
  ) {
    console.log('✓ TEST 1 PASSED: Available services (SOLAR, AC) correctly returned for Ahmedabad 380015.\n');
    passedTests++;
  } else {
    console.error('✗ TEST 1 FAILED');
  }

  // TEST 2: Unsupported location (Mumbai, 400001)
  console.log('--- TEST 2: Unsupported Location (Mumbai, 400001) ---');
  const t2Res = await request(`${API_BASE}/customer-portal/services/available`, {
    method: 'POST',
    body: JSON.stringify({
      city: 'Mumbai',
      pincode: '400001',
    }),
  });
  console.log('Response:', JSON.stringify(t2Res.data.data, null, 2));
  if (
    t2Res.data.success &&
    t2Res.data.data.coverageAvailable === false &&
    t2Res.data.data.services.length === 0 &&
    t2Res.data.data.message.includes('not currently available')
  ) {
    console.log('✓ TEST 2 PASSED: Unsupported location returned coverageAvailable=false, empty services, and friendly message.\n');
    passedTests++;
  } else {
    console.error('✗ TEST 2 FAILED');
  }

  // TEST 3: Change location from supported location to unsupported location
  console.log('--- TEST 3: Dynamic Location Change (Supported -> Unsupported) ---');
  const t3_a = await request(`${API_BASE}/customer-portal/services/available`, {
    method: 'POST',
    body: JSON.stringify({ city: 'Ahmedabad', pincode: '380015' }),
  });
  const t3_b = await request(`${API_BASE}/customer-portal/services/available`, {
    method: 'POST',
    body: JSON.stringify({ city: 'Pune', pincode: '411001' }),
  });
  console.log('Supported count:', t3_a.data.data.services.length, '| Unsupported count:', t3_b.data.data.services.length);
  if (t3_a.data.data.coverageAvailable === true && t3_b.data.data.coverageAvailable === false && t3_b.data.data.services.length === 0) {
    console.log('✓ TEST 3 PASSED: State changes cleanly from supported to unsupported; services cleared immediately.\n');
    passedTests++;
  } else {
    console.error('✗ TEST 3 FAILED');
  }

  // TEST 4: Change from supported location A to supported location B where availability differs
  console.log('--- TEST 4: Change Between Service Areas ---');
  // TEST 4: Change from supported location A to supported location B where availability differs
  console.log('--- TEST 4: Change Between Service Areas ---');
  const t4_a = await request(`${API_BASE}/customer-portal/services/available`, {
    method: 'POST',
    body: JSON.stringify({ city: 'Ahmedabad', pincode: '380015' }),
  });
  const t4_b = await request(`${API_BASE}/customer-portal/services/available`, {
    method: 'POST',
    body: JSON.stringify({ city: 'Gandhinagar', pincode: '382007' }),
  });
  console.log('Ahmedabad coverage:', t4_a.data.data.coverageAvailable, 'services:', t4_a.data.data.services.map((s) => s.serviceType));
  console.log('Gandhinagar coverage:', t4_b.data.data.coverageAvailable, 'services:', t4_b.data.data.services.map((s) => s.serviceType));
  if (t4_a.data.data.coverageAvailable && t4_b.data.data.coverageAvailable) {
    console.log('✓ TEST 4 PASSED: Service availability dynamically re-queries and updates per location.\n');
    passedTests++;
  } else {
    console.error('✗ TEST 4 FAILED');
  }

  // TEST 5: Try submitting a request with a service not available in the selected location
  console.log('--- TEST 5: Backend Rejection of Request in Unsupported Location ---');
  const t5Res = await request(`${API_BASE}/customer-portal/requests`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      serviceType: 'SOLAR',
      problemCategory: 'INVERTER_NOT_WORKING',
      complaint: 'Solar inverter down in Mumbai',
      location: {
        city: 'Mumbai',
        pincode: '400001',
        address: 'Marine Drive, Mumbai',
      },
    }),
  });
  console.log('Response status:', t5Res.status, 'Payload:', JSON.stringify(t5Res.data, null, 2));
  if (t5Res.status === 400 && t5Res.data?.error?.code === 'SERVICE_UNAVAILABLE_AT_LOCATION') {
    console.log('✓ TEST 5 PASSED: Backend authoritatively rejected unsupported location with 400 and SERVICE_UNAVAILABLE_AT_LOCATION.\n');
    passedTests++;
  } else {
    console.error('✗ TEST 5 FAILED: Unexpected response:', t5Res);
  }

  // TEST 6: Supported location -> Solar -> Solar problem -> complaint -> photo -> AI preview -> submit
  console.log('--- TEST 6: End-to-End Supported Solar Flow Submission ---');
  const t6Res = await request(`${API_BASE}/customer-portal/requests`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      serviceType: 'SOLAR',
      problemCategory: 'INVERTER_NOT_WORKING',
      problemCode: 'INVERTER_NOT_WORKING',
      complaint: 'invrtr not wrkng genration bandh che red light blinking',
      location: {
        city: 'Ahmedabad',
        pincode: '380015',
        address: 'Bopal Crossroad, Ahmedabad',
        area: 'Bopal',
      },
      photos: ['https://images.unsplash.com/photo-1509391365360-2e959784a276'],
      triageAnswers: {
        inverterDisplay: 'BLANK',
        gridPower: 'YES',
      },
    }),
  });
  console.log('Solar ticket response status:', t6Res.status, 'Payload:', JSON.stringify(t6Res.data, null, 2));
  if (t6Res.status === 201 && t6Res.data.data?.ticketNumber && t6Res.data.data?.serviceType === 'SOLAR') {
    console.log('✓ TEST 6 PASSED: Solar request created and validated end-to-end.\n');
    passedTests++;
  } else {
    console.error('✗ TEST 6 FAILED');
  }

  // TEST 7: Supported location -> AC/HVAC -> AC problem -> complaint -> photo -> AI preview -> submit
  console.log('--- TEST 7: End-to-End Supported AC/HVAC Flow Submission ---');
  const t7Res = await request(`${API_BASE}/customer-portal/requests`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      serviceType: 'AC',
      problemCategory: 'NO_COOLING',
      problemCode: 'NO_COOLING',
      complaint: 'ac cool nai karto pani pade che inside room',
      location: {
        city: 'Ahmedabad',
        pincode: '380054',
        address: 'Drive In Road, Ahmedabad',
        area: 'Satellite',
      },
      photos: ['https://images.unsplash.com/photo-1621905251189-08b45d6a269e'],
      triageAnswers: {
        q_power: 'YES',
        q_cooling: 'WARM / NORMAL',
        q_leak: 'YES',
      },
    }),
  });
  console.log('AC ticket response status:', t7Res.status, 'Payload:', JSON.stringify(t7Res.data, null, 2));
  if (t7Res.status === 201 && t7Res.data.data?.ticketNumber && t7Res.data.data?.serviceType === 'AC') {
    console.log('✓ TEST 7 PASSED: AC/HVAC request created and validated end-to-end.\n');
    passedTests++;
  } else {
    console.error('✗ TEST 7 FAILED');
  }


  console.log('====================================================');
  console.log(`TOTAL RESULT: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('====================================================');
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
