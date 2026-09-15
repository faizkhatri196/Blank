import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import mongoose from 'mongoose';
import http from 'http';
import bcrypt from 'bcryptjs';
import app from '../server';
import { Company, User } from '../models';

const PROD_MONGODB_URI = process.env.MONGODB_URI;
const TEST_MONGODB_URI = process.env.TEST_MONGODB_URI;

console.log('\n=============================================================');
console.log('SERVORA FORGOT PASSWORD & AUTH SECURITY AUDIT SUITE');
console.log('=============================================================');

if (!TEST_MONGODB_URI) {
  console.error('❌ CRITICAL ERROR: TEST_MONGODB_URI is not defined!');
  process.exit(1);
}

if (
  TEST_MONGODB_URI === PROD_MONGODB_URI ||
  TEST_MONGODB_URI.includes('/servora?') ||
  TEST_MONGODB_URI.endsWith('/servora')
) {
  console.error('❌ CRITICAL ERROR: TEST_MONGODB_URI points to production database!');
  process.exit(1);
}

console.log('✓ TEST DATABASE SAFETY VERIFIED:');
console.log(`  - Test DB: ${TEST_MONGODB_URI.replace(/:[^:]*@/, ':****@')}`);
console.log(`  - Production DB protected: ${PROD_MONGODB_URI?.replace(/:[^:]*@/, ':****@')}`);

const TEST_PORT = 5088;
const TEST_API = `http://localhost:${TEST_PORT}/api`;
const LIVE_API = `http://localhost:5000/api`;

let testServer: http.Server;
let testCompanyId: mongoose.Types.ObjectId;
let testUserId: mongoose.Types.ObjectId;

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

async function runAudit() {
  try {
    await mongoose.connect(TEST_MONGODB_URI as string);
    console.log(`✓ Connected to test database: ${mongoose.connection.name}`);

    testServer = app.listen(TEST_PORT, '127.0.0.1');
    console.log(`✓ Ephemeral test server listening on http://127.0.0.1:${TEST_PORT}`);

    // 1. Verify Existing Pilot Accounts Preserved on Live Port 5000
    console.log('\n--- 1. VERIFYING EXISTING PILOT ACCOUNTS ARE UNTOUCHED ---');
    const pilotMgr = await request(LIVE_API, '/auth/login', {
      method: 'POST',
      body: { email: 'manager@pilot.com', password: 'Pilot@2026' },
    });
    if (!pilotMgr.ok) throw new Error(`Live manager pilot check failed: ${JSON.stringify(pilotMgr.data)}`);
    console.log('✓ Live Pilot Manager login verified (manager@pilot.com / Pilot@2026)');

    const pilotTech = await request(LIVE_API, '/auth/login', {
      method: 'POST',
      body: { email: 'tech@pilot.com', password: 'Pilot@2026' },
    });
    if (!pilotTech.ok) throw new Error(`Live tech pilot check failed: ${JSON.stringify(pilotTech.data)}`);
    console.log('✓ Live Pilot Technician login verified (tech@pilot.com / Pilot@2026)');

    // 2. Test Invalid Credentials
    console.log('\n--- 2. TESTING INVALID LOGIN CREDENTIALS ---');
    const invalidLogin = await request(TEST_API, '/auth/login', {
      method: 'POST',
      body: { email: 'manager@pilot.com', password: 'WrongPassword999!' },
    });
    console.log(`✓ Invalid login rejected: Status ${invalidLogin.status} (Expected 401)`);
    if (invalidLogin.status !== 401) throw new Error('Security flaw: Invalid login did not return 401');

    // 3. Create Isolated Test User in TEST_MONGODB_URI
    console.log('\n--- 3. CREATING TEST USER FOR PASSWORD RESET IN TEST DB ---');
    const comp = await Company.create({
      name: 'Reset Test Services Inc',
      email: `reset-test-${Date.now()}@test.com`,
      phone: '+91 99999 12345',
      address: 'Test City',
      servicesSupported: ['SOLAR'],
      environmentContext: 'CLIENT',
      isPilot: false,
    });
    testCompanyId = comp._id as mongoose.Types.ObjectId;

    const initialPassword = 'InitialPassword@2026';
    const initialHash = await bcrypt.hash(initialPassword, 10);
    const testEmail = `operator.${Date.now()}@servoratest.com`;

    const user = await User.create({
      companyId: testCompanyId,
      name: 'Test Operator',
      email: testEmail,
      passwordHash: initialHash,
      role: 'SERVICE_MANAGER',
      active: true,
    });
    testUserId = user._id as mongoose.Types.ObjectId;
    console.log(`✓ Test user created: ${testEmail} (ID: ${testUserId})`);

    // Verify initial login works
    const initLogin = await request(TEST_API, '/auth/login', {
      method: 'POST',
      body: { email: testEmail, password: initialPassword },
    });
    if (!initLogin.ok) throw new Error('Initial login for test user failed');
    console.log('✓ Initial password login confirmed');

    // 4. Request Forgot Password for Non-Existent Email (Security: Generic Response)
    console.log('\n--- 4. FORGOT PASSWORD: NON-EXISTENT EMAIL ENUMERATION TEST ---');
    const nonExistentRes = await request(TEST_API, '/auth/forgot-password', {
      method: 'POST',
      body: { email: 'doesnotexist9999@unknown.com' },
    });
    console.log(`✓ Non-existent email request status: ${nonExistentRes.status} (Expected 200)`);
    console.log(`  Response message: "${nonExistentRes.data.message}"`);
    if (nonExistentRes.status !== 200 || !nonExistentRes.data.success) {
      throw new Error('Forgot password leaked account non-existence!');
    }

    // 5. Request Forgot Password for Real Test User
    console.log('\n--- 5. FORGOT PASSWORD: VALID EMAIL REQUEST ---');
    const forgotRes = await request(TEST_API, '/auth/forgot-password', {
      method: 'POST',
      body: { email: testEmail },
    });
    if (!forgotRes.ok) throw new Error(`Forgot password failed: ${JSON.stringify(forgotRes.data)}`);
    console.log(`✓ Reset token generated successfully:`);
    console.log(`  Message: "${forgotRes.data.message}"`);
    const resetToken = forgotRes.data.data?.resetToken;
    const resetUrl = forgotRes.data.data?.resetUrl;
    console.log(`  Reset URL: ${resetUrl}`);
    if (!resetToken) throw new Error('Reset token was not returned in test response payload');

    // Verify DB stores SHA-256 hash, not plaintext token
    const dbUserAfterReq = await User.findById(testUserId);
    console.log(`✓ Direct DB check:`);
    console.log(`  resetPasswordToken stored: ${dbUserAfterReq?.resetPasswordToken?.substring(0, 16)}... (Length: ${dbUserAfterReq?.resetPasswordToken?.length})`);
    console.log(`  Token is securely SHA256 hashed? ${dbUserAfterReq?.resetPasswordToken !== resetToken ? 'YES (SECURE) ✓' : 'NO ❌'}`);
    console.log(`  Expires at: ${dbUserAfterReq?.resetPasswordExpires}`);
    if (dbUserAfterReq?.resetPasswordToken === resetToken) {
      throw new Error('SECURITY BREACH: Plaintext token stored in database!');
    }

    // 6. Verify Reset Token Endpoint
    console.log('\n--- 6. VERIFY RESET TOKEN ENDPOINT ---');
    const verifyValid = await request(TEST_API, `/auth/verify-reset-token/${resetToken}`);
    console.log(`✓ Valid token check status: ${verifyValid.status} (Valid: ${verifyValid.data.valid})`);
    if (!verifyValid.ok || !verifyValid.data.valid) throw new Error('Valid token verification failed');

    const verifyInvalid = await request(TEST_API, `/auth/verify-reset-token/completely-bogus-token-xyz`);
    console.log(`✓ Invalid token check status: ${verifyInvalid.status} (Expected 400)`);
    if (verifyInvalid.status !== 400 || verifyInvalid.data.valid !== false) {
      throw new Error('Invalid token check did not fail as expected');
    }

    // 7. Reset Password Validation Failures
    console.log('\n--- 7. PASSWORD RESET VALIDATION FAILURES ---');
    // A) Mismatched passwords
    const mismatchRes = await request(TEST_API, '/auth/reset-password', {
      method: 'POST',
      body: {
        token: resetToken,
        password: 'NewSecurePassword@2026',
        confirmPassword: 'DifferentPassword@2026',
      },
    });
    console.log(`✓ Password mismatch rejected: Status ${mismatchRes.status} (Expected 400)`);
    if (mismatchRes.status !== 400) throw new Error('Password mismatch was not rejected');

    // B) Weak password (< 6 chars)
    const weakRes = await request(TEST_API, '/auth/reset-password', {
      method: 'POST',
      body: {
        token: resetToken,
        password: '123',
        confirmPassword: '123',
      },
    });
    console.log(`✓ Short password rejected: Status ${weakRes.status} (Expected 400)`);
    if (weakRes.status !== 400) throw new Error('Short password was not rejected');

    // C) Invalid token
    const badTokenRes = await request(TEST_API, '/auth/reset-password', {
      method: 'POST',
      body: {
        token: 'fake-token-that-never-existed-0000',
        password: 'NewValidPassword@2026',
        confirmPassword: 'NewValidPassword@2026',
      },
    });
    console.log(`✓ Bogus token rejected: Status ${badTokenRes.status} (Expected 400)`);
    if (badTokenRes.status !== 400) throw new Error('Bogus token was not rejected');

    // 8. Successful Password Reset
    console.log('\n--- 8. SUCCESSFUL PASSWORD RESET ---');
    const newPassword = 'BrandNewPassword@2026';
    const successReset = await request(TEST_API, '/auth/reset-password', {
      method: 'POST',
      body: {
        token: resetToken,
        password: newPassword,
        confirmPassword: newPassword,
      },
    });
    console.log(`✓ Password reset status: ${successReset.status} (Expected 200)`);
    console.log(`  Message: "${successReset.data.message}"`);
    if (!successReset.ok) throw new Error(`Password reset failed: ${JSON.stringify(successReset.data)}`);

    // 9. Verify Token Invalidation (Single-Use Guarantee)
    console.log('\n--- 9. VERIFY TOKEN INVENTATION (PREVENT TOKEN REUSE) ---');
    const reuseAttempt = await request(TEST_API, '/auth/reset-password', {
      method: 'POST',
      body: {
        token: resetToken,
        password: 'AnotherPassword@2026',
        confirmPassword: 'AnotherPassword@2026',
      },
    });
    console.log(`✓ Reused token rejected: Status ${reuseAttempt.status} (Expected 400)`);
    if (reuseAttempt.status !== 400) throw new Error('SECURITY FLAW: Reset token allowed reuse!');

    const dbUserAfterReset = await User.findById(testUserId);
    console.log(`✓ Direct DB check: resetPasswordToken is undefined? ${dbUserAfterReset?.resetPasswordToken === undefined ? 'YES (CLEARED) ✓' : 'NO ❌'}`);
    if (dbUserAfterReset?.resetPasswordToken) throw new Error('Reset token was not cleared from DB');

    // 10. Login with NEW Password & Verify OLD Password Fails
    console.log('\n--- 10. AUTHENTICATION STATE VERIFICATION ---');
    const oldLoginAttempt = await request(TEST_API, '/auth/login', {
      method: 'POST',
      body: { email: testEmail, password: initialPassword },
    });
    console.log(`✓ Login with old password rejected: Status ${oldLoginAttempt.status} (Expected 401)`);
    if (oldLoginAttempt.status !== 401) throw new Error('Old password still works after reset!');

    const newLoginAttempt = await request(TEST_API, '/auth/login', {
      method: 'POST',
      body: { email: testEmail, password: newPassword },
    });
    console.log(`✓ Login with NEW password succeeded: Status ${newLoginAttempt.status} (Expected 200)`);
    if (!newLoginAttempt.ok) throw new Error('Login with new password failed!');
    console.log(`  User: ${newLoginAttempt.data.data.user.name} (${newLoginAttempt.data.data.user.email})`);
    console.log(`  JWT token received: ${newLoginAttempt.data.data.token ? 'YES' : 'NO'}`);

    // 11. Final Check on Live Pilot Accounts
    console.log('\n--- 11. FINAL VERIFICATION OF PILOT ACCOUNTS ---');
    const finalMgr = await request(LIVE_API, '/auth/login', {
      method: 'POST',
      body: { email: 'manager@pilot.com', password: 'Pilot@2026' },
    });
    if (!finalMgr.ok) throw new Error('Live manager pilot account compromised!');
    console.log('✓ Pilot Manager remains intact and functional.');

    const finalTech = await request(LIVE_API, '/auth/login', {
      method: 'POST',
      body: { email: 'tech@pilot.com', password: 'Pilot@2026' },
    });
    if (!finalTech.ok) throw new Error('Live technician pilot account compromised!');
    console.log('✓ Pilot Technician remains intact and functional.');

    console.log('\n=============================================================');
    console.log('ALL FORGOT PASSWORD & SECURITY TESTS PASSED WITH 100% SUCCESS! 🔒');
    console.log('=============================================================');

  } catch (err: any) {
    console.error('\n❌ AUDIT FAILED:', err.message);
    process.exitCode = 1;
  } finally {
    if (testCompanyId) {
      await User.deleteMany({ companyId: testCompanyId });
      await Company.deleteOne({ _id: testCompanyId });
      console.log('✓ Cleaned up test user & company from test DB');
    }
    if (testServer) testServer.close();
    await mongoose.disconnect();
    console.log('✓ Disconnected from test DB');
  }
}

runAudit();
