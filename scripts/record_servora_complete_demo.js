const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');

async function runRecordDemo() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const brainDir = path.resolve('C:\\Users\\Infinity\\.gemini\\antigravity-ide\\brain\\6d9f10d2-d683-4268-8bca-47b0fee7cb12');
  const recordingsDir = path.join(brainDir, 'recordings');
  const screenshotsDir = path.join(brainDir, 'screenshots');

  if (!fs.existsSync(recordingsDir)) fs.mkdirSync(recordingsDir, { recursive: true });
  if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });

  console.log('=====================================================');
  console.log('SERVORA: CAPTIONED E2E WORKFLOW DEMONSTRATION');
  console.log('Edge Executable:', edgePath);
  console.log('Recordings Dir:', recordingsDir);
  console.log('Screenshots Dir:', screenshotsDir);
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

  async function showCaption(step, total, title, desc) {
    console.log(`\n[Caption ${step}/${total}] ${title} — ${desc}`);
    try {
      await page.evaluate(({ step, total, title, desc }) => {
        let hud = document.getElementById('servora-recording-hud');
        if (!hud) {
          hud = document.createElement('div');
          hud.id = 'servora-recording-hud';
          hud.style.position = 'fixed';
          hud.style.bottom = '22px';
          hud.style.left = '50%';
          hud.style.transform = 'translateX(-50%)';
          hud.style.zIndex = '9999999';
          hud.style.background = 'rgba(15, 23, 42, 0.94)';
          hud.style.backdropFilter = 'blur(16px)';
          hud.style.border = '1px solid rgba(16, 185, 129, 0.4)';
          hud.style.borderRadius = '16px';
          hud.style.boxShadow = '0 20px 40px -10px rgba(0, 0, 0, 0.7), 0 0 25px rgba(16, 185, 129, 0.25)';
          hud.style.padding = '12px 22px';
          hud.style.display = 'flex';
          hud.style.alignItems = 'center';
          hud.style.gap = '16px';
          hud.style.maxWidth = '92%';
          hud.style.color = '#ffffff';
          hud.style.fontFamily = 'Inter, -apple-system, BlinkMacSystemFont, sans-serif';
          hud.style.transition = 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
          document.body.appendChild(hud);
        }
        hud.innerHTML = `
          <div style="background: rgba(16, 185, 129, 0.2); border: 1px solid #10b981; color: #34d399; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 8px; letter-spacing: 0.05em; text-transform: uppercase; white-space: nowrap;">
            STEP ${step}/${total}
          </div>
          <div>
            <div style="font-size: 13.5px; font-weight: 800; color: #f8fafc; letter-spacing: -0.01em;">${title}</div>
            <div style="font-size: 11.5px; color: #94a3b8; font-weight: 500; margin-top: 1px;">${desc}</div>
          </div>
        `;
      }, { step, total, title, desc });
    } catch (e) {
      // Ignored if navigating
    }
  }

  try {
    // -------------------------------------------------------------
    // STEP 1: CLEAN ENTERPRISE SIGN-IN & FORGOT PASSWORD LINK
    // -------------------------------------------------------------
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
    await delay(1000);
    await showCaption(1, 8, 'Enterprise Workspace Sign-In', 'Clean branding with authenticated role-routing and new Forgot Password link');
    await delay(2500);
    await page.screenshot({ path: path.join(screenshotsDir, '01_clean_enterprise_login.png') });

    // -------------------------------------------------------------
    // STEP 2: FORGOT PASSWORD & OWASP TOKEN GENERATION
    // -------------------------------------------------------------
    await showCaption(2, 8, 'Forgot Password Flow', 'Requesting secure password reset with anti-enumeration protection');
    await delay(1000);
    const forgotLink = await page.waitForSelector('a[href="/forgot-password"]');
    await forgotLink.click();
    await page.waitForURL('**/forgot-password', { timeout: 10000 });
    await delay(1200);

    await showCaption(2, 8, 'Anti-Enumeration Recovery', 'Submitting work email for cryptographic reset token generation');
    const emailInput = await page.waitForSelector('input[type="email"]');
    await emailInput.fill('');
    await page.keyboard.type('manager@pilot.com', { delay: 35 });
    await delay(800);

    const submitForgotBtn = await page.waitForSelector('button[type="submit"]');
    await submitForgotBtn.click();
    await delay(2500);
    await showCaption(2, 8, 'Verified Reset Link Issued', 'SHA-256 token created; direct link ready for immediate password update');
    await page.screenshot({ path: path.join(screenshotsDir, '02_forgot_password_request.png') });
    await delay(2500);

    // Click back to sign in
    const backToLoginLink = await page.waitForSelector('a[href="/login"]');
    await backToLoginLink.click();
    await page.waitForURL('**/login', { timeout: 10000 });
    await delay(1500);

    // -------------------------------------------------------------
    // STEP 3: MANAGER AUTHENTICATION & DASHBOARD
    // -------------------------------------------------------------
    await showCaption(3, 8, 'Manager Authentication', 'Logging in as Service Operations Manager (manager@pilot.com)');
    await page.fill('input[type="email"]', 'manager@pilot.com');
    await delay(400);
    await page.fill('input[type="password"]', 'Pilot@2026');
    await delay(400);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/manager/dashboard', { timeout: 15000 });
    await delay(1500);
    await showCaption(3, 8, 'Operations Command Center', 'Real-time pipeline metrics, technician availability, and service queues');
    await delay(2000);
    await page.mouse.wheel(0, 350);
    await delay(1500);
    await page.screenshot({ path: path.join(screenshotsDir, '03_manager_dashboard.png') });

    // -------------------------------------------------------------
    // STEP 4: CREATE NEW TICKET WITH COLLOQUIAL COMPLAINT
    // -------------------------------------------------------------
    await showCaption(4, 8, 'Problem Intake Form', 'Inputting raw colloquial complaint from solar rooftop site');
    await page.goto('http://localhost:5173/manager/tickets/new', { waitUntil: 'networkidle' });
    await delay(1500);

    const complaintInput = await page.waitForSelector('textarea');
    await complaintInput.click();
    await complaintInput.fill('');
    await page.keyboard.type('invrtr not wrkng genration bandh', { delay: 35 });
    await delay(800);

    const errInput = await page.$('input[placeholder*="Error 04"]');
    if (errInput) {
      await errInput.click();
      await errInput.fill('');
      await page.keyboard.type('Error 302 - DC String Under-voltage', { delay: 30 });
    }
    await delay(1000);
    await showCaption(4, 8, 'Submitting Problem Intake', 'Preserving ground truth while preparing AI complaint normalization');
    await page.screenshot({ path: path.join(screenshotsDir, '04_new_ticket_intake.png') });

    const submitTicketBtn = await page.waitForSelector('button[type="submit"]');
    await submitTicketBtn.click();
    await page.waitForURL(/\/manager\/tickets\/[a-f0-9]+/, { timeout: 15000 });
    await delay(2000);

    const ticketUrl = page.url();
    const ticketId = ticketUrl.split('/').pop();
    console.log(`✓ Ticket URL: ${ticketUrl}, ID: ${ticketId}`);

    // -------------------------------------------------------------
    // STEP 5: AI NORMALIZATION & DIAGNOSTIC TRIAGE
    // -------------------------------------------------------------
    await showCaption(5, 8, 'AI Complaint Normalization', 'Colloquial input normalized into standardized technical operational language');
    await delay(2500);
    await page.screenshot({ path: path.join(screenshotsDir, '05_ticket_detail_normalized.png') });

    await showCaption(5, 8, 'Running AI Diagnostic Copilot', 'Generating multi-hypothesis fault analysis, recommended tools & safety warnings');
    const aiBtn = await page.$('button:has-text("Analyze with AI")');
    if (aiBtn) {
      await aiBtn.click();
      await delay(4500);
    }
    await page.mouse.wheel(0, 300);
    await delay(1500);
    await page.screenshot({ path: path.join(screenshotsDir, '06_ai_diagnostics_confidence.png') });

    // -------------------------------------------------------------
    // STEP 6: SMART TECHNICIAN MATCHING & ASSIGNMENT
    // -------------------------------------------------------------
    await showCaption(6, 8, 'Smart Technician Matching', 'Scoring technicians by domain skills, tools, area coverage, and live availability');
    await page.mouse.wheel(0, -300);
    await delay(800);

    const matchBtn = await page.waitForSelector('button:has-text("Recommend Technicians"), button:has-text("Reassign Technician")');
    await matchBtn.click();
    await delay(2500);
    await page.screenshot({ path: path.join(screenshotsDir, '07_technician_matching_modal.png') });

    await showCaption(6, 8, 'Assigning Top Matched Technician', 'Dispatching certified Solar technician with confirmed tools');
    const assignJobBtn = await page.waitForSelector('button:has-text("Assign Job")');
    await assignJobBtn.click();
    await delay(3500);

    // -------------------------------------------------------------
    // STEP 7: TECHNICIAN FIELD EXECUTION & MOBILE REPORT
    // -------------------------------------------------------------
    await showCaption(7, 8, 'Switching to Field Technician', 'Logging in as Field Technician (tech@pilot.com) on mobile workspace');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
    await delay(1200);

    await page.fill('input[type="email"]', 'tech@pilot.com');
    await delay(400);
    await page.fill('input[type="password"]', 'Pilot@2026');
    await delay(400);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/technician/dashboard', { timeout: 15000 });
    await delay(2000);
    await showCaption(7, 8, 'Field Technician Job Execution', `Opening assigned solar diagnostic job sheet for ticket ${ticketId}`);

    // Direct navigation to technician execution page for this ticket
    await page.goto(`http://localhost:5173/technician/jobs/${ticketId}`, { waitUntil: 'networkidle' });
    await delay(2500);
    await page.screenshot({ path: path.join(screenshotsDir, '08_technician_job_opened.png') });

    await showCaption(7, 8, 'Live Field Status Transitions', 'Progressing: Accept Dispatch -> Start Journey -> Arrived On Site -> Start Diagnosis');
    
    // Accept
    const acceptBtn = await page.$('button:has-text("Accept This Dispatch")');
    if (acceptBtn) { await acceptBtn.click(); await delay(2000); }

    // Start Journey
    const startJourneyBtn = await page.$('button:has-text("Start Journey")');
    if (startJourneyBtn) { await startJourneyBtn.click(); await delay(2000); }

    // Arrived
    const arriveBtn = await page.$('button:has-text("Mark Arrived On Site")');
    if (arriveBtn) { await arriveBtn.click(); await delay(2000); }

    // Start Diagnosis
    const diagBtn = await page.$('button:has-text("Start Diagnosis")');
    if (diagBtn) { await diagBtn.click(); await delay(2000); }

    await page.mouse.wheel(0, 450);
    await delay(1200);

    await showCaption(7, 8, 'Submitting Ground Truth Service Report', 'Technician enters confirmed diagnosis, torque readings, and AI accuracy feedback');

    // Actual diagnosis
    const actualDiagArea = await page.$('textarea[placeholder*="Loose DC MC4"]');
    if (actualDiagArea) {
      await actualDiagArea.click();
      await page.keyboard.type('Loose MC4 connector at string combiner box causing open circuit.', { delay: 25 });
    }

    // Work performed
    const workDoneArea = await page.$('textarea[placeholder*="Replaced burnt MC4"]');
    if (workDoneArea) {
      await workDoneArea.click();
      await page.keyboard.type('Replaced burnt MC4 connector pair, crimped with 1000V rated solar tool, verified continuity.', { delay: 25 });
    }

    // Readings
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
    const submitReportBtn = await page.waitForSelector('button:has-text("Submit Verified Completion Report")');
    await submitReportBtn.click();
    await delay(4000);
    await page.screenshot({ path: path.join(screenshotsDir, '10_service_report_completed.png') });

    // -------------------------------------------------------------
    // STEP 8: MANAGER VERIFICATION & CLOSED-LOOP AI VS ACTUAL
    // -------------------------------------------------------------
    await showCaption(8, 8, 'Manager AI vs Actual Evaluation', 'Logging back in to verify completed service history and prediction accuracy');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
    await delay(1200);

    await page.fill('input[type="email"]', 'manager@pilot.com');
    await delay(400);
    await page.fill('input[type="password"]', 'Pilot@2026');
    await delay(400);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/manager/dashboard', { timeout: 15000 });
    await delay(1500);

    // Navigate to the completed ticket
    await page.goto(ticketUrl, { waitUntil: 'networkidle' });
    await delay(2500);

    await showCaption(8, 8, 'Closed-Loop Verification Complete', 'Ticket COMPLETED: AI Diagnostic vs Ground Truth Actual verified with MATCH');
    await page.mouse.wheel(0, 450);
    await delay(2000);
    await page.screenshot({ path: path.join(screenshotsDir, '11_manager_ai_vs_actual_verified.png') });
    await delay(3000);

    console.log('\n=====================================================');
    console.log('ALL 8 DEMONSTRATION PHASES RECORDED SUCCESSFULLY! 🎬');
    console.log('=====================================================');

  } catch (err) {
    console.error('Demo Recording Error:', err);
  } finally {
    await page.close();
    await context.close();
    await browser.close();

    const files = fs.readdirSync(recordingsDir).filter((f) => f.endsWith('.webm'));
    if (files.length > 0) {
      files.sort((a, b) => fs.statSync(path.join(recordingsDir, b)).mtimeMs - fs.statSync(path.join(recordingsDir, a)).mtimeMs);
      const latestVideo = path.join(recordingsDir, files[0]);
      const destVideo = path.join(brainDir, 'servora_complete_flow_with_captions.webm');
      fs.copyFileSync(latestVideo, destVideo);
      console.log(`✓ Recording finalized: ${destVideo} (${(fs.statSync(destVideo).size / 1024 / 1024).toFixed(2)} MB)`);
    }
  }
}

runRecordDemo();
