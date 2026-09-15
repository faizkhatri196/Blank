const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');

async function runRecordDemo() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const recordingsDir = path.resolve('C:\\Users\\Infinity\\.gemini\\antigravity-ide\\brain\\6d9f10d2-d683-4268-8bca-47b0fee7cb12\\recordings');
  const screenshotsDir = path.resolve('C:\\Users\\Infinity\\.gemini\\antigravity-ide\\brain\\6d9f10d2-d683-4268-8bca-47b0fee7cb12\\screenshots');

  if (!fs.existsSync(recordingsDir)) fs.mkdirSync(recordingsDir, { recursive: true });
  if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });

  console.log('=====================================================');
  console.log('SERVORA: PILOT DEMONSTRATION RECORDING');
  console.log('Edge executable:', edgePath);
  console.log('Target Recordings Directory:', recordingsDir);
  console.log('Target Screenshots Directory:', screenshotsDir);
  console.log('=====================================================');

  const browser = await chromium.launch({
    executablePath: edgePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,850'],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 850 },
    recordVideo: {
      dir: recordingsDir,
      size: { width: 1280, height: 850 },
    },
  });

  const page = await context.newPage();
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  try {
    // -------------------------------------------------------------
    // STEP 1: CLEAN ENTERPRISE LOGIN
    // -------------------------------------------------------------
    console.log('[1/8] Opening Servora Enterprise Portal (Clean Login)...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
    await delay(2000);
    await page.screenshot({ path: path.join(screenshotsDir, '01_clean_enterprise_login.png') });

    console.log('[2/8] Logging in as Service Operations Manager (manager@pilot.com)...');
    await page.fill('input[type="email"]', 'manager@pilot.com');
    await delay(600);
    await page.fill('input[type="password"]', 'Pilot@2026');
    await delay(600);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/manager/dashboard', { timeout: 15000 });
    await delay(3000);
    await page.screenshot({ path: path.join(screenshotsDir, '02_manager_dashboard.png') });

    // -------------------------------------------------------------
    // STEP 2: CREATE NEW TICKET WITH RAW COLLOQUIAL COMPLAINT
    // -------------------------------------------------------------
    console.log('[3/8] Opening New Ticket intake form...');
    await page.goto('http://localhost:5173/manager/tickets/new', { waitUntil: 'networkidle' });
    await delay(2500);

    // Enter raw complaint description
    const complaintInput = await page.waitForSelector('textarea');
    await complaintInput.click();
    await complaintInput.fill('');
    await page.keyboard.type('invrtr not wrkng genration bandh', { delay: 40 });
    await delay(1000);

    // Enter error code
    const errInput = await page.$('input[placeholder*="Error 04"]');
    if (errInput) {
      await errInput.click();
      await errInput.fill('');
      await page.keyboard.type('Error 302 - DC String Under-voltage', { delay: 30 });
    }
    await delay(1000);

    await page.screenshot({ path: path.join(screenshotsDir, '03_new_ticket_intake.png') });

    console.log('[4/8] Submitting Service Ticket...');
    const submitBtn = await page.waitForSelector('button[type="submit"]');
    await submitBtn.click();

    // Wait for redirect to /manager/tickets/:id
    await page.waitForURL(/\/manager\/tickets\/[a-f0-9]+/, { timeout: 15000 });
    await delay(3000);

    const ticketUrl = page.url();
    const ticketId = ticketUrl.split('/').pop();
    console.log(`✓ Ticket created successfully! URL: ${ticketUrl}, ID: ${ticketId}`);

    await page.screenshot({ path: path.join(screenshotsDir, '04_ticket_detail_normalized.png') });

    // -------------------------------------------------------------
    // STEP 3: RUN AI DIAGNOSTICS & REVIEW
    // -------------------------------------------------------------
    console.log('[5/8] Running AI Diagnostic Analysis...');
    const aiBtn = await page.$('button:has-text("Analyze with AI")');
    if (aiBtn) {
      await aiBtn.click();
      await delay(4500);
    }
    await page.screenshot({ path: path.join(screenshotsDir, '05_ai_diagnostics_confidence.png') });

    // -------------------------------------------------------------
    // STEP 4: TECHNICIAN MATCHING & ASSIGNMENT
    // -------------------------------------------------------------
    console.log('[6/8] Matching & Assigning Certified Technician...');
    const matchBtn = await page.waitForSelector('button:has-text("Recommend Technicians"), button:has-text("Reassign Technician")');
    await matchBtn.click();
    await delay(2500);
    await page.screenshot({ path: path.join(screenshotsDir, '06_technician_matching_modal.png') });

    // Click "Assign Job" in modal
    const assignJobBtn = await page.waitForSelector('button:has-text("Assign Job")');
    await assignJobBtn.click();
    await delay(3500);

    await page.screenshot({ path: path.join(screenshotsDir, '07_ticket_assigned.png') });

    // -------------------------------------------------------------
    // STEP 5: TECHNICIAN LOGIN & MOBILE FIELD EXECUTION
    // -------------------------------------------------------------
    console.log('[7/8] Switching to Technician View (tech@pilot.com)...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
    await delay(1500);

    await page.fill('input[type="email"]', 'tech@pilot.com');
    await delay(600);
    await page.fill('input[type="password"]', 'Pilot@2026');
    await delay(600);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/technician/dashboard', { timeout: 15000 });
    await delay(2500);

    // Open the assigned job execution page
    console.log(`[8/8] Navigating to technician job execution /technician/jobs/${ticketId}...`);
    await page.goto(`http://localhost:5173/technician/jobs/${ticketId}`, { waitUntil: 'networkidle' });
    await delay(2500);
    await page.screenshot({ path: path.join(screenshotsDir, '08_technician_job_opened.png') });

    // Sequence 1: Accept Dispatch
    console.log('  -> Action: Accept This Dispatch');
    const acceptBtn = await page.$('button:has-text("Accept This Dispatch")');
    if (acceptBtn) {
      await acceptBtn.click();
      await delay(2500);
    }

    // Sequence 2: Start Journey
    console.log('  -> Action: Start Journey (On The Way)');
    const startJourneyBtn = await page.$('button:has-text("Start Journey")');
    if (startJourneyBtn) {
      await startJourneyBtn.click();
      await delay(2500);
    }

    // Sequence 3: Mark Arrived On Site
    console.log('  -> Action: Mark Arrived On Site');
    const arriveBtn = await page.$('button:has-text("Mark Arrived On Site")');
    if (arriveBtn) {
      await arriveBtn.click();
      await delay(2500);
    }

    // Sequence 4: Start Diagnosis
    console.log('  -> Action: Start Diagnosis');
    const diagBtn = await page.$('button:has-text("Start Diagnosis")');
    if (diagBtn) {
      await diagBtn.click();
      await delay(2500);
    }

    // Fill Field Service Groundwork Form
    console.log('  -> Action: Entering Actual Diagnosis & Readings');
    const actualDiagArea = await page.$('textarea[placeholder*="Loose DC MC4"]');
    if (actualDiagArea) {
      await actualDiagArea.click();
      await page.keyboard.type('Loose MC4 connector at string combiner box causing open circuit.', { delay: 25 });
    }

    const workDoneArea = await page.$('textarea[placeholder*="Replaced burnt MC4"]');
    if (workDoneArea) {
      await workDoneArea.click();
      await page.keyboard.type('Replaced burnt MC4 connector pair, crimped with 1000V rated solar tool, verified continuity.', { delay: 25 });
    }

    // Readings: DC Volts, AC Volts, Current
    const dcVoltInput = await page.$('input[placeholder*="480"]');
    if (dcVoltInput) await dcVoltInput.fill('485');

    const acVoltInput = await page.$('input[placeholder*="235"]');
    if (acVoltInput) await acVoltInput.fill('238');

    const dcCurrInput = await page.$('input[placeholder*="14.5"]');
    if (dcCurrInput) await dcCurrInput.fill('14.2');

    // Spare parts
    const partsInput = await page.$('input[placeholder*="MC4 Connector"]');
    if (partsInput) await partsInput.fill('MC4 Connector Pair');

    await delay(2000);
    await page.screenshot({ path: path.join(screenshotsDir, '09_technician_service_report_filled.png') });

    // Submit report
    console.log('  -> Action: Submit Verified Completion Report');
    const submitReportBtn = await page.waitForSelector('button:has-text("Submit Verified Completion Report")');
    await submitReportBtn.click();
    await delay(4000);

    // Return to ticket or show completed state
    await page.screenshot({ path: path.join(screenshotsDir, '10_service_report_completed.png') });

    // Also navigate manager back to inspect the completed ticket with AI vs Actual audit
    console.log('Re-verifying ticket status in Manager Command Center...');
    await page.goto(`http://localhost:5173/manager/tickets/${ticketId}`, { waitUntil: 'networkidle' });
    await delay(3000);
    await page.screenshot({ path: path.join(screenshotsDir, '11_manager_ai_vs_actual_verified.png') });

    console.log('=====================================================');
    console.log('SUCCESS: RECORDING AND WORKFLOW COMPLETED!');
    console.log('=====================================================');
  } catch (error) {
    console.error('Execution encountered error:', error);
  } finally {
    await delay(3500);
    const video = page.video();
    await page.close();
    await context.close();
    await browser.close();

    if (video) {
      const originalVideoPath = await video.path();
      const namedVideoPath = path.join(recordingsDir, 'servora_complete_solar_workflow.webm');
      try {
        fs.copyFileSync(originalVideoPath, namedVideoPath);
        console.log(`[VIDEO ARTIFACT CREATED]`);
        console.log(`Video File: ${namedVideoPath}`);
        const stats = fs.statSync(namedVideoPath);
        console.log(`Size: ${(stats.size / 1024).toFixed(1)} KB`);
      } catch (err) {
        console.log('Original video maintained at:', originalVideoPath);
      }
    }
  }
}

runRecordDemo();
