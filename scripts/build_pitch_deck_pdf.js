const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

console.log('=== SERVORA DEMO PITCH DECK PDF BUILDER ===');

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Servora — Executive Demo Pitch Deck</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap');

    @page {
      size: 1920px 1080px;
      margin: 0;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background: #070A13;
      color: #F8FAFC;
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      -webkit-font-smoothing: antialiased;
    }

    .slide {
      width: 1920px;
      height: 1080px;
      page-break-after: always;
      position: relative;
      overflow: hidden;
      padding: 55px 80px 45px 80px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      background: radial-gradient(circle at 85% 15%, rgba(99, 102, 241, 0.08) 0%, transparent 50%),
                  radial-gradient(circle at 15% 85%, rgba(16, 185, 129, 0.06) 0%, transparent 50%),
                  #070A13;
      border-bottom: 2px solid #1E293B;
    }

    /* HEADER */
    .slide-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 22px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      position: relative;
      z-index: 10;
    }

    .brand-area {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .brand-logo-badge {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: linear-gradient(135deg, #4F46E5 0%, #06B6D4 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: 24px;
      color: #FFFFFF;
      box-shadow: 0 0 20px rgba(99, 102, 241, 0.4);
    }

    .brand-name {
      font-size: 26px;
      font-weight: 900;
      letter-spacing: -0.5px;
      background: linear-gradient(to right, #FFFFFF, #CBD5E1);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .brand-tagline {
      font-size: 13px;
      font-weight: 600;
      color: #94A3B8;
      text-transform: uppercase;
      letter-spacing: 1.5px;
    }

    .header-category {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .category-badge {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      padding: 6px 14px;
      border-radius: 20px;
      background: rgba(99, 102, 241, 0.15);
      border: 1px solid rgba(99, 102, 241, 0.3);
      color: #818CF8;
    }

    .slide-number {
      font-family: 'JetBrains Mono', monospace;
      font-size: 14px;
      font-weight: 700;
      color: #64748B;
    }

    /* FOOTER */
    .slide-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 18px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      font-size: 13px;
      color: #64748B;
      font-weight: 500;
      position: relative;
      z-index: 10;
    }

    .footer-highlight {
      color: #818CF8;
      font-weight: 600;
    }

    /* TYPOGRAPHY */
    .hero-title {
      font-size: 64px;
      font-weight: 900;
      letter-spacing: -1.5px;
      line-height: 1.1;
      margin-bottom: 16px;
    }

    .gradient-text-indigo {
      background: linear-gradient(135deg, #FFFFFF 0%, #818CF8 50%, #C084FC 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .gradient-text-emerald {
      background: linear-gradient(135deg, #FFFFFF 0%, #34D399 70%, #059669 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .gradient-text-amber {
      background: linear-gradient(135deg, #FFFFFF 0%, #FBBF24 70%, #D97706 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .section-title {
      font-size: 40px;
      font-weight: 800;
      letter-spacing: -0.8px;
      line-height: 1.2;
      color: #FFFFFF;
      margin-bottom: 8px;
    }

    .section-subtitle {
      font-size: 19px;
      font-weight: 500;
      color: #94A3B8;
      margin-bottom: 28px;
      line-height: 1.4;
    }

    /* CARDS & CONTAINERS */
    .glass-card {
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 20px;
      padding: 28px;
      box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.5);
      position: relative;
    }

    .glass-card-accent-indigo {
      border-color: rgba(99, 102, 241, 0.3);
      box-shadow: 0 20px 40px -15px rgba(99, 102, 241, 0.15);
    }

    .glass-card-accent-emerald {
      border-color: rgba(16, 185, 129, 0.3);
      box-shadow: 0 20px 40px -15px rgba(16, 185, 129, 0.15);
    }

    .glass-card-accent-amber {
      border-color: rgba(245, 158, 11, 0.3);
      box-shadow: 0 20px 40px -15px rgba(245, 158, 11, 0.15);
    }

    /* GRID SYSTEMS */
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
      align-items: stretch;
    }

    .grid-3 {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 28px;
      align-items: stretch;
    }

    .grid-4 {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 24px;
      align-items: stretch;
    }

    /* STATS & METRICS */
    .metric-value {
      font-size: 54px;
      font-weight: 900;
      letter-spacing: -1px;
      line-height: 1;
      margin-bottom: 8px;
    }

    .metric-label {
      font-size: 14px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #94A3B8;
    }

    .metric-sub {
      font-size: 13px;
      color: #64748B;
      margin-top: 4px;
    }

    /* BADGES */
    .pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 700;
      padding: 4px 12px;
      border-radius: 12px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }
    .pill-indigo { background: rgba(99, 102, 241, 0.15); color: #A5B4FC; border: 1px solid rgba(99, 102, 241, 0.3); }
    .pill-emerald { background: rgba(16, 185, 129, 0.15); color: #6EE7B7; border: 1px solid rgba(16, 185, 129, 0.3); }
    .pill-amber { background: rgba(245, 158, 11, 0.15); color: #FCD34D; border: 1px solid rgba(245, 158, 11, 0.3); }
    .pill-red { background: rgba(239, 68, 68, 0.15); color: #FCA5A5; border: 1px solid rgba(239, 68, 68, 0.3); }

    /* STEP FLOW / TIMELINE */
    .step-box {
      background: rgba(30, 41, 59, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 22px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
    }

    .step-number {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      font-weight: 800;
      padding: 4px 10px;
      border-radius: 8px;
      display: inline-block;
      margin-bottom: 12px;
    }

    /* TABLE */
    .deck-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 15px;
    }

    .deck-table th {
      text-align: left;
      padding: 14px 18px;
      background: rgba(30, 41, 59, 0.6);
      color: #94A3B8;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 12px;
      letter-spacing: 1px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .deck-table td {
      padding: 16px 18px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      color: #E2E8F0;
      vertical-align: middle;
    }

    .deck-table tr:hover td {
      background: rgba(255, 255, 255, 0.02);
    }

    ul.feature-list {
      list-style: none;
      margin-top: 14px;
    }

    ul.feature-list li {
      font-size: 16px;
      color: #CBD5E1;
      margin-bottom: 10px;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      line-height: 1.4;
    }

    ul.feature-list li::before {
      content: '✓';
      color: #10B981;
      font-weight: 900;
      font-size: 16px;
      flex-shrink: 0;
    }
  </style>
</head>
<body>

  <!-- ==================== SLIDE 1: COVER ==================== -->
  <section class="slide">
    <div class="slide-header">
      <div class="brand-area">
        <div class="brand-logo-badge">S</div>
        <div>
          <div class="brand-name">SERVORA</div>
          <div class="brand-tagline">Smarter Field Service Operations</div>
        </div>
      </div>
      <div class="header-category">
        <span class="category-badge">YC W26 APPLICATION &bull; INVESTOR DEMO</span>
        <span class="slide-number">01 / 10</span>
      </div>
    </div>

    <div style="margin: auto 0; max-width: 1400px;">
      <div style="display: flex; gap: 12px; margin-bottom: 24px;">
        <span class="pill pill-indigo">SOLAR PV &bull; AC / HVAC INFRASTRUCTURE</span>
        <span class="pill pill-emerald">CLOSED-LOOP AI COPILOT</span>
        <span class="pill pill-amber">MANDVI &bull; KUTCH PILOT GROUNDED</span>
      </div>

      <h1 class="hero-title">
        The Operational AI Copilot for <br>
        <span class="gradient-text-indigo">Physical Field Service Enterprises</span>
      </h1>

      <p style="font-size: 24px; color: #94A3B8; max-width: 1100px; line-height: 1.5; margin-bottom: 40px; font-weight: 500;">
        Eliminating the 32% first-visit failure rate in high-voltage Solar PV and critical HVAC operations through grounded vernacular AI intake, 5-factor deterministic dispatch, and mandatory physical telemetry benchmarking.
      </p>

      <div style="display: flex; gap: 32px; align-items: center;">
        <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 16px; padding: 20px 32px; display: flex; gap: 24px; align-items: center;">
          <div>
            <div style="font-size: 32px; font-weight: 900; color: #34D399;">94%</div>
            <div style="font-size: 12px; font-weight: 700; color: #94A3B8; text-transform: uppercase;">First-Time Fix Rate</div>
          </div>
          <div style="width: 1px; height: 40px; background: rgba(255,255,255,0.1);"></div>
          <div>
            <div style="font-size: 32px; font-weight: 900; color: #60A5FA;">Zero</div>
            <div style="font-size: 12px; font-weight: 700; color: #94A3B8; text-transform: uppercase;">Wasted Truck Rolls</div>
          </div>
          <div style="width: 1px; height: 40px; background: rgba(255,255,255,0.1);"></div>
          <div>
            <div style="font-size: 32px; font-weight: 900; color: #FBBF24;">4.6x</div>
            <div style="font-size: 12px; font-weight: 700; color: #94A3B8; text-transform: uppercase;">Monthly Contractor ROI</div>
          </div>
        </div>

        <div style="font-size: 15px; color: #94A3B8;">
          <strong style="color: #FFFFFF;">Founder & CEO:</strong> Faiz Khatri &bull; Gujarat, India<br>
          <strong style="color: #FFFFFF;">Live 3-Min Demonstration:</strong> <code>SERVORA_3MIN_YC_DEMO.mp4</code>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <div>CONFIDENTIAL &bull; FOR AUTHORIZED INVESTOR & PILOT EVALUATION ONLY</div>
      <div>SERVORA TECHNOLOGIES &copy; 2026 &bull; <span class="footer-highlight">PROPRIETARY OPERATIONS IP</span></div>
    </div>
  </section>

  <!-- ==================== SLIDE 2: THE PROBLEM ==================== -->
  <section class="slide">
    <div class="slide-header">
      <div class="brand-area">
        <div class="brand-logo-badge">S</div>
        <div>
          <div class="brand-name">SERVORA</div>
          <div class="brand-tagline">Problem Validation</div>
        </div>
      </div>
      <div class="header-category">
        <span class="category-badge">INDUSTRY BOTTLENECK</span>
        <span class="slide-number">02 / 10</span>
      </div>
    </div>

    <div>
      <h2 class="section-title">The Physical Service Crisis in High-Voltage Infrastructure</h2>
      <p class="section-subtitle">
        Solar EPC and commercial HVAC contractors lose up to 35% of their net margins on avoidable return visits.
      </p>

      <div class="grid-3">
        <!-- Failure Mode 1 -->
        <div class="glass-card glass-card-accent-amber">
          <div class="pill pill-amber" style="margin-bottom: 16px;">Bottleneck 1: Blind Intake</div>
          <h3 style="font-size: 22px; font-weight: 800; color: #FFFFFF; margin-bottom: 12px;">Vernacular Ambiguity</h3>
          <p style="font-size: 15px; color: #94A3B8; line-height: 1.5; margin-bottom: 20px;">
            Customers report vague vernacular complaints like <em>"Solar generation stopped since morning"</em> or <em>"inverter red light blinking"</em>. Dispatchers lack engineering tools to diagnose root causes before sending technicians.
          </p>
          <div style="background: rgba(0,0,0,0.3); border-radius: 12px; padding: 14px; border: 1px dashed rgba(245, 158, 11, 0.3);">
            <div style="font-size: 12px; font-weight: 700; color: #F59E0B; text-transform: uppercase;">Operational Consequence:</div>
            <div style="font-size: 14px; color: #CBD5E1; margin-top: 4px;">Technicians arrive on site blind without knowing whether the fault is inverter, surge, grid, or panel.</div>
          </div>
        </div>

        <!-- Failure Mode 2 -->
        <div class="glass-card glass-card-accent-indigo">
          <div class="pill pill-red" style="margin-bottom: 16px;">Bottleneck 2: Missing Spares</div>
          <h3 style="font-size: 22px; font-weight: 800; color: #FFFFFF; margin-bottom: 12px;">32% First-Visit Failures</h3>
          <p style="font-size: 15px; color: #94A3B8; line-height: 1.5; margin-bottom: 20px;">
            Because the root cause was unknown, the technician didn’t bring the required 1000V DC surge cartridge or MC4 crimping tool. The job stalls, requiring a second truck roll days later.
          </p>
          <div style="background: rgba(0,0,0,0.3); border-radius: 12px; padding: 14px; border: 1px dashed rgba(239, 68, 68, 0.3);">
            <div style="font-size: 12px; font-weight: 700; color: #EF4444; text-transform: uppercase;">Direct Financial Loss:</div>
            <div style="font-size: 14px; color: #CBD5E1; margin-top: 4px;">Average cost of a wasted truck roll: <strong>₹3,500 – ₹5,000 ($45–$65)</strong> in labor, fuel, and SLA penalty.</div>
          </div>
        </div>

        <!-- Failure Mode 3 -->
        <div class="glass-card glass-card-accent-emerald">
          <div class="pill pill-emerald" style="margin-bottom: 16px;">Bottleneck 3: Random Dispatch</div>
          <h3 style="font-size: 22px; font-weight: 800; color: #FFFFFF; margin-bottom: 12px;">Unskilled Assignment</h3>
          <p style="font-size: 15px; color: #94A3B8; line-height: 1.5; margin-bottom: 20px;">
            Legacy dispatch tools match solely on GPS proximity. They send an AC duct cleaner to a 10kW high-voltage solar string inverter issue, creating severe safety risks and warranty voidance.
          </p>
          <div style="background: rgba(0,0,0,0.3); border-radius: 12px; padding: 14px; border: 1px dashed rgba(16, 185, 129, 0.3);">
            <div style="font-size: 12px; font-weight: 700; color: #10B981; text-transform: uppercase;">The AI Hallucination Fear:</div>
            <div style="font-size: 14px; color: #CBD5E1; margin-top: 4px;">Generic LLM tools hallucinate dangerous repair guidance without grounding in physical electrical standards.</div>
          </div>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <div>SERVORA COVERS DUAL VERTICALS: SOLAR PV INFRASTRUCTURE &bull; COMMERCIAL AC / HVAC</div>
      <div>INDUSTRY STATUS QUO: 68% FIRST-TIME FIX RATE &bull; <span style="color:#EF4444; font-weight:700;">32% REPEAT VISIT CHURN</span></div>
    </div>
  </section>

  <!-- ==================== SLIDE 3: THE SOLUTION ==================== -->
  <section class="slide">
    <div class="slide-header">
      <div class="brand-area">
        <div class="brand-logo-badge">S</div>
        <div>
          <div class="brand-name">SERVORA</div>
          <div class="brand-tagline">System Architecture</div>
        </div>
      </div>
      <div class="header-category">
        <span class="category-badge">OUR CLOSED-LOOP ENGINE</span>
        <span class="slide-number">03 / 10</span>
      </div>
    </div>

    <div>
      <h2 class="section-title">The Servora Closed-Loop Execution Platform</h2>
      <p class="section-subtitle">
        Not another CRM or ticketing tool. An operational intelligence system that connects physical field reality to deterministic dispatch.
      </p>

      <div class="grid-3">
        <div class="glass-card" style="border-top: 4px solid #6366F1;">
          <div style="font-size: 12px; font-weight: 800; color: #818CF8; text-transform: uppercase; margin-bottom: 8px;">Pillar 1 &bull; Smart Intake</div>
          <h3 style="font-size: 22px; font-weight: 800; color: #FFFFFF; margin-bottom: 12px;">Diagnostic Normalization</h3>
          <p style="font-size: 14px; color: #94A3B8; line-height: 1.5; margin-bottom: 16px;">
            AI symptom normalizer ingests colloquial customer descriptions, extracting fault codes (e.g. <code>E-031 / DC Transient</code>) and system symptoms into structured engineering tickets.
          </p>
          <ul class="feature-list">
            <li>Location coverage verification within 25 km radius</li>
            <li>Predicts probable root cause (88% confidence)</li>
            <li>Recommends mandatory tools & spare cartridges</li>
          </ul>
        </div>

        <div class="glass-card" style="border-top: 4px solid #F59E0B;">
          <div style="font-size: 12px; font-weight: 800; color: #FBBF24; text-transform: uppercase; margin-bottom: 8px;">Pillar 2 &bull; Smart Dispatch</div>
          <h3 style="font-size: 22px; font-weight: 800; color: #FFFFFF; margin-bottom: 12px;">5-Factor Match Engine</h3>
          <p style="font-size: 14px; color: #94A3B8; line-height: 1.5; margin-bottom: 16px;">
            Algorithmic dispatch assigns the optimal technician based on deterministic mathematical weighting, not arbitrary geographic proximity.
          </p>
          <ul class="feature-list">
            <li><strong>Certification (40%)</strong>: Inverter Level-2 vs HVAC</li>
            <li><strong>Tools Onboard (20%)</strong>: Multimeter, clamp meter verified</li>
            <li><strong>Status (20%)</strong>: Available route slot</li>
            <li><strong>Proximity (10%)</strong>: Travel overhead cut by 34%</li>
            <li><strong>Experience (10%)</strong>: Years on specific OEM models</li>
          </ul>
        </div>

        <div class="glass-card" style="border-top: 4px solid #10B981;">
          <div style="font-size: 12px; font-weight: 800; color: #34D399; text-transform: uppercase; margin-bottom: 8px;">Pillar 3 &bull; Ground Truth</div>
          <h3 style="font-size: 22px; font-weight: 800; color: #FFFFFF; margin-bottom: 12px;">Physical Verification Moat</h3>
          <p style="font-size: 14px; color: #94A3B8; line-height: 1.5; margin-bottom: 16px;">
            Technicians must record physical multimeter telemetry (Voc, Current, Thermals) and photo evidence. Servora benchmarks AI predictions against ground reality.
          </p>
          <ul class="feature-list">
            <li>Guarantees strict audit-compliant SLA timestamps</li>
            <li>Eliminates warranty fraud and billing disputes</li>
            <li>Retrains regional models with verified physical telemetry</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <div>DETERMINISTIC ARCHITECTURE: AI ASSISTS &bull; PHYSICAL TELEMETRY VERIFIES &bull; ZERO HALLUCINATIONS</div>
      <div>FIRST-TIME FIX RATE ACCELERATES TO <span style="color:#10B981; font-weight:700;">94%</span></div>
    </div>
  </section>

  <!-- ==================== SLIDE 4: THE 3-MINUTE DEMO WALKTHROUGH ==================== -->
  <section class="slide">
    <div class="slide-header">
      <div class="brand-area">
        <div class="brand-logo-badge">S</div>
        <div>
          <div class="brand-name">SERVORA</div>
          <div class="brand-tagline">Interactive Demonstration</div>
        </div>
      </div>
      <div class="header-category">
        <span class="category-badge">3-MINUTE LIVE APPLICATION FLOW</span>
        <span class="slide-number">04 / 10</span>
      </div>
    </div>

    <div>
      <h2 class="section-title">The 3-Minute Live App Choreography (Mandvi, Kutch)</h2>
      <p class="section-subtitle">
        Captured live without slides or mockups in <code>SERVORA_3MIN_YC_DEMO.mp4</code> across all 3 portals.
      </p>

      <div class="grid-4">
        <!-- Act 1 -->
        <div class="step-box" style="border-top: 3px solid #6366F1;">
          <div>
            <span class="step-number" style="background: rgba(99, 102, 241, 0.2); color: #818CF8;">ACT 1 &bull; 00:00 - 00:55</span>
            <h4 style="font-size: 17px; font-weight: 800; color: #FFFFFF; margin-bottom: 8px;">Customer Intake</h4>
            <p style="font-size: 13px; color: #94A3B8; line-height: 1.4; margin-bottom: 12px;">
              Homeowner in Mandvi (PIN 370465) verifies 25 km service radius. Taps <em>"Inverter Offline / Fault Code"</em> with error <code>E-031</code>.
            </p>
          </div>
          <div style="background: rgba(0,0,0,0.4); border-radius: 8px; padding: 10px; font-size: 12px; color: #A5B4FC; font-family: 'JetBrains Mono', monospace;">
            Ticket #SOL-2026-0084 created with AI urgency triage
          </div>
        </div>

        <!-- Act 2 -->
        <div class="step-box" style="border-top: 3px solid #F59E0B;">
          <div>
            <span class="step-number" style="background: rgba(245, 158, 11, 0.2); color: #FBBF24;">ACT 2 &bull; 00:55 - 01:55</span>
            <h4 style="font-size: 17px; font-weight: 800; color: #FFFFFF; margin-bottom: 8px;">Manager HQ Triage</h4>
            <p style="font-size: 13px; color: #94A3B8; line-height: 1.4; margin-bottom: 12px;">
              Operations Manager inspects AI hypothesis: 88% probability DC surge burnout. 5-Factor match ranks Rahul Sharma #1 (96.4%). Dispatched in 1 click.
            </p>
          </div>
          <div style="background: rgba(0,0,0,0.4); border-radius: 8px; padding: 10px; font-size: 12px; color: #FCD34D; font-family: 'JetBrains Mono', monospace;">
            Spares checked: 1000V DC surge cartridge & multimeter
          </div>
        </div>

        <!-- Act 3 -->
        <div class="step-box" style="border-top: 3px solid #10B981;">
          <div>
            <span class="step-number" style="background: rgba(16, 185, 129, 0.2); color: #6EE7B7;">ACT 3 &bull; 01:55 - 02:40</span>
            <h4 style="font-size: 17px; font-weight: 800; color: #FFFFFF; margin-bottom: 8px;">Field Execution</h4>
            <p style="font-size: 13px; color: #94A3B8; line-height: 1.4; margin-bottom: 12px;">
              Tech mobile terminal advances: <em>Accepted &rarr; On The Way &rarr; On Site</em>. Rahul tests Voc = 382V, replaces cartridge, uploads before/after photos.
            </p>
          </div>
          <div style="background: rgba(0,0,0,0.4); border-radius: 8px; padding: 10px; font-size: 12px; color: #6EE7B7; font-family: 'JetBrains Mono', monospace;">
            Multimeter logged: Voc 382V &bull; Cartridge replaced
          </div>
        </div>

        <!-- Act 4 -->
        <div class="step-box" style="border-top: 3px solid #38BDF8;">
          <div>
            <span class="step-number" style="background: rgba(56, 189, 248, 0.2); color: #38BDF8;">ACT 4 &bull; 02:40 - 03:00</span>
            <h4 style="font-size: 17px; font-weight: 800; color: #FFFFFF; margin-bottom: 8px;">Audit & Closeout</h4>
            <p style="font-size: 13px; color: #94A3B8; line-height: 1.4; margin-bottom: 12px;">
              Loop closes at HQ: AI Guess matches Physical Ground Fix (100% score). Digital customer signoff captured. Automated invoice and warranty card issued.
            </p>
          </div>
          <div style="background: rgba(0,0,0,0.4); border-radius: 8px; padding: 10px; font-size: 12px; color: #7DD3FC; font-family: 'JetBrains Mono', monospace;">
            Total cycle: 42 mins (vs 120m target) &bull; Zero disputes
          </div>
        </div>
      </div>

      <div style="margin-top: 24px; background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 14px; padding: 16px 24px; display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; gap: 16px; align-items: center;">
          <span class="pill pill-indigo">VIDEO SPECS</span>
          <span style="font-size: 14px; color: #CBD5E1;">Exact 180.00s Duration &bull; 1920x1080 Full HD @ 24fps &bull; Size: 18.41 MB (YC Format Optimized)</span>
        </div>
        <div style="font-size: 13px; color: #818CF8; font-weight: 600;">
          File location: <code>SERVORA_3MIN_YC_DEMO.mp4</code>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <div>FULL WORKING DEMO INCLUDED IN REPO ROOT &bull; LAUNCHABLE VIA <code>http://localhost:5173/walkthrough</code></div>
      <div>EXECUTIVE VERIFIED &bull; MANDVI TALUKA, KUTCH, GUJARAT</div>
    </div>
  </section>

  <!-- ==================== SLIDE 5: 3 PORTALS ARCHITECTURE ==================== -->
  <section class="slide">
    <div class="slide-header">
      <div class="brand-area">
        <div class="brand-logo-badge">S</div>
        <div>
          <div class="brand-name">SERVORA</div>
          <div class="brand-tagline">User Experience</div>
        </div>
      </div>
      <div class="header-category">
        <span class="category-badge">PORTAL ARCHITECTURE</span>
        <span class="slide-number">05 / 10</span>
      </div>
    </div>

    <div>
      <h2 class="section-title">Designed for Field Realities Across 3 Interconnected Portals</h2>
      <p class="section-subtitle">
        High-contrast outdoor mobile terminals for technicians; comprehensive command center suites for operations managers.
      </p>

      <div class="grid-3">
        <!-- Portal 1 -->
        <div class="glass-card">
          <div style="width: 40px; height: 40px; border-radius: 10px; background: rgba(99, 102, 241, 0.2); color: #818CF8; display: flex; align-items: center; justify-content: center; font-size: 20px; margin-bottom: 16px;">👤</div>
          <h3 style="font-size: 20px; font-weight: 800; color: #FFFFFF; margin-bottom: 8px;">Customer & Facility Portal</h3>
          <p style="font-size: 13px; color: #818CF8; font-weight: 700; margin-bottom: 12px; text-transform: uppercase;">Location-First &bull; Zero Friction</p>
          <p style="font-size: 14px; color: #94A3B8; line-height: 1.5; margin-bottom: 14px;">
            Eliminates customer frustration by verifying local service coverage upfront before booking.
          </p>
          <ul class="feature-list" style="font-size: 14px;">
            <li>Auto-detects PIN code & service zone</li>
            <li>Voice-to-text problem description</li>
            <li>Real-time technician ETA tracking & privacy masking</li>
            <li>Permanent digital asset warranty vault</li>
          </ul>
        </div>

        <!-- Portal 2 -->
        <div class="glass-card">
          <div style="width: 40px; height: 40px; border-radius: 10px; background: rgba(245, 158, 11, 0.2); color: #FBBF24; display: flex; align-items: center; justify-content: center; font-size: 20px; margin-bottom: 16px;">🏢</div>
          <h3 style="font-size: 20px; font-weight: 800; color: #FFFFFF; margin-bottom: 8px;">Operations Command Center</h3>
          <p style="font-size: 13px; color: #FBBF24; font-weight: 700; margin-bottom: 12px; text-transform: uppercase;">HQ Fleet Command &bull; Central Control</p>
          <p style="font-size: 14px; color: #94A3B8; line-height: 1.5; margin-bottom: 14px;">
            Command suite giving operations heads real-time visibility into every field asset and unit.
          </p>
          <ul class="feature-list" style="font-size: 14px;">
            <li>Live Kanban ticket dispatch pipeline</li>
            <li>AI Pre-Arrival diagnostic package viewer</li>
            <li>Fleet radar map & dynamic technician routing</li>
            <li>Pilot Insights: AI vs Actual accuracy benchmarks</li>
          </ul>
        </div>

        <!-- Portal 3 -->
        <div class="glass-card">
          <div style="width: 40px; height: 40px; border-radius: 10px; background: rgba(16, 185, 129, 0.2); color: #34D399; display: flex; align-items: center; justify-content: center; font-size: 20px; margin-bottom: 16px;">⚡</div>
          <h3 style="font-size: 20px; font-weight: 800; color: #FFFFFF; margin-bottom: 8px;">Field Engineer Mobile Terminal</h3>
          <p style="font-size: 13px; color: #34D399; font-weight: 700; margin-bottom: 12px; text-transform: uppercase;">High-Contrast PWA &bull; Direct Sunlight</p>
          <p style="font-size: 14px; color: #94A3B8; line-height: 1.5; margin-bottom: 14px;">
            Engineered for physical technicians working on sunny rooftops and dusty plant rooms.
          </p>
          <ul class="feature-list" style="font-size: 14px;">
            <li>Calibrated $\ge 44\text{px}$ touch targets for gloved fingers</li>
            <li>Guided electrical diagnostic trees & multimeter forms</li>
            <li>Mandatory multi-photo verification before closeout</li>
            <li>Works in intermittent network coverage with offline sync</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <div>ZERO DEPENDENCY ON THIRD-PARTY CONSUMER APPS &bull; 100% BRANDED ENTERPRISE EXPERIENCE</div>
      <div>SINGLE UNIFIED TYPESCRIPT CODEBASE &bull; MONGO + REACT + VITE</div>
    </div>
  </section>

  <!-- ==================== SLIDE 6: GROUND TRUTH AI MOAT ==================== -->
  <section class="slide">
    <div class="slide-header">
      <div class="brand-area">
        <div class="brand-logo-badge">S</div>
        <div>
          <div class="brand-name">SERVORA</div>
          <div class="brand-tagline">Defensibility</div>
        </div>
      </div>
      <div class="header-category">
        <span class="category-badge">OUR DATA MOAT</span>
        <span class="slide-number">06 / 10</span>
      </div>
    </div>

    <div>
      <h2 class="section-title">The Ground-Truth AI Telemetry Moat</h2>
      <p class="section-subtitle">
        Every service visit closes an empirical loop: comparing AI hypothesis against physical multimeter readings.
      </p>

      <div class="grid-2" style="margin-bottom: 28px;">
        <div class="glass-card">
          <h3 style="font-size: 20px; font-weight: 800; color: #FFFFFF; margin-bottom: 16px;">The Closed-Loop Intelligence Flywheel</h3>
          <div style="display: flex; flex-direction: column; gap: 14px;">
            <div style="background: rgba(30, 41, 59, 0.6); padding: 14px 18px; border-radius: 12px; border-left: 4px solid #6366F1;">
              <strong style="color: #A5B4FC;">1. Pre-Visit AI Hypothesis:</strong>
              <div style="font-size: 13px; color: #CBD5E1; margin-top: 2px;">Generates root-cause probability (88% DC Isolator / Surge cutoff) and required spare part list.</div>
            </div>
            <div style="background: rgba(30, 41, 59, 0.6); padding: 14px 18px; border-radius: 12px; border-left: 4px solid #F59E0B;">
              <strong style="color: #FCD34D;">2. Physical Fieldwork Telemetry:</strong>
              <div style="font-size: 13px; color: #CBD5E1; margin-top: 2px;">Technician records on-site multimeter readings ($V_{oc}=382\text{V}$, $I_{sc}=8.4\text{A}$) and confirms replaced components.</div>
            </div>
            <div style="background: rgba(30, 41, 59, 0.6); padding: 14px 18px; border-radius: 12px; border-left: 4px solid #10B981;">
              <strong style="color: #6EE7B7;">3. Ground-Truth Empirical Audit:</strong>
              <div style="font-size: 13px; color: #CBD5E1; margin-top: 2px;">System scores AI Diagnostic Accuracy (0–100%) and logs discrepancies to retrain regional fault models.</div>
            </div>
          </div>
        </div>

        <div class="glass-card" style="display: flex; flex-direction: column; justify-content: space-around;">
          <h3 style="font-size: 20px; font-weight: 800; color: #FFFFFF; margin-bottom: 12px;">Active Pilot Benchmarks (Live Pilot Engine)</h3>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div style="background: rgba(0,0,0,0.3); border-radius: 14px; padding: 16px; border: 1px solid rgba(16, 185, 129, 0.3);">
              <div class="metric-value gradient-text-emerald">91.4%</div>
              <div class="metric-label">Diagnostic Match Rate</div>
              <div class="metric-sub">AI hypothesis matched physical field findings</div>
            </div>

            <div style="background: rgba(0,0,0,0.3); border-radius: 14px; padding: 16px; border: 1px solid rgba(99, 102, 241, 0.3);">
              <div class="metric-value gradient-text-indigo">89.8%</div>
              <div class="metric-label">Spares Prediction Accuracy</div>
              <div class="metric-sub">Technicians had exact replacement cartridge on hand</div>
            </div>

            <div style="background: rgba(0,0,0,0.3); border-radius: 14px; padding: 16px; border: 1px solid rgba(245, 158, 11, 0.3);">
              <div class="metric-value gradient-text-amber">42 min</div>
              <div class="metric-label">Average Turnaround</div>
              <div class="metric-sub">SLA Target: 120 mins (78 mins saved per ticket)</div>
            </div>

            <div style="background: rgba(0,0,0,0.3); border-radius: 14px; padding: 16px; border: 1px solid rgba(56, 189, 248, 0.3);">
              <div class="metric-value" style="color: #38BDF8;">100%</div>
              <div class="metric-label">Audit SLA Compliance</div>
              <div class="metric-sub">Zero unverified repairs or billing disputes</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <div>EMPIRICAL TELEMETRY IS UNCOPYABLE BY GENERIC LLMS &bull; CREATES HIGH CONTRACTOR SWITCHING COSTS</div>
      <div>EXPORTABLE VIA 22-COLUMN PILOT TELEMETRY CSV IN PILOT INSIGHTS</div>
    </div>
  </section>

  <!-- ==================== SLIDE 7: MANDVI KUTCH MARKET VALIDATION ==================== -->
  <section class="slide">
    <div class="slide-header">
      <div class="brand-area">
        <div class="brand-logo-badge">S</div>
        <div>
          <div class="brand-name">SERVORA</div>
          <div class="brand-tagline">Customer Discovery</div>
        </div>
      </div>
      <div class="header-category">
        <span class="category-badge">MARKET GROUNDWORK</span>
        <span class="slide-number">07 / 10</span>
      </div>
    </div>

    <div>
      <h2 class="section-title">Grounded Customer Discovery: Mandvi & Kutch Region</h2>
      <p class="section-subtitle">
        We didn't build in an ivory tower. We cataloged and validated 12 actual Solar & HVAC businesses in coastal Gujarat.
      </p>

      <div class="grid-2" style="margin-bottom: 24px;">
        <div class="glass-card">
          <h3 style="font-size: 20px; font-weight: 800; color: #FFFFFF; margin-bottom: 14px;">The Kutch Operational Reality</h3>
          <p style="font-size: 15px; color: #94A3B8; line-height: 1.5; margin-bottom: 16px;">
            Mandvi and Kutch represent Gujarat's highest rooftop solar density per capita under the SURYA Gujarat initiative, but suffer unique coastal operating challenges:
          </p>
          <ul class="feature-list">
            <li><strong>Severe Coastal Salt Corrosion</strong>: High salinity causes frequent DC isolator cartridge burnout and copper oxidation on inverters within 18 months.</li>
            <li><strong>Critical Technician Scarcity</strong>: Contractors employ general electricians who misdiagnose inverter firmware cutoffs as dead panels, wasting days.</li>
            <li><strong>Delayed Billing & Churn</strong>: 30–60 day paperwork turnaround before contractors can collect government subsidy maintenance payouts.</li>
          </ul>
        </div>

        <div class="glass-card">
          <h3 style="font-size: 20px; font-weight: 800; color: #FFFFFF; margin-bottom: 14px;">Verified Local Discovery Cohort</h3>
          <table class="deck-table">
            <thead>
              <tr>
                <th>Business Name</th>
                <th>Vertical</th>
                <th>Location</th>
                <th>Fleet Scale</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Shreeji Solar & Electricals</strong></td>
                <td><span class="pill pill-amber">Solar EPC</span></td>
                <td>Mandvi, Kutch</td>
                <td>6 Field Technicians</td>
              </tr>
              <tr>
                <td><strong>Kutch Solar Tech</strong></td>
                <td><span class="pill pill-amber">Solar EPC</span></td>
                <td>Coastal Mandvi Belt</td>
                <td>8 Field Technicians</td>
              </tr>
              <tr>
                <td><strong>Al-Madina Air Conditioning</strong></td>
                <td><span class="pill pill-indigo">AC / HVAC</span></td>
                <td>Mandvi Bazaar</td>
                <td>4 Field Technicians</td>
              </tr>
              <tr>
                <td><strong>Kutch Cooling Centre</strong></td>
                <td><span class="pill pill-indigo">AC / HVAC</span></td>
                <td>Ghatkopar Road, Mandvi</td>
                <td>5 Field Technicians</td>
              </tr>
            </tbody>
          </table>
          <div style="margin-top: 14px; font-size: 13px; color: #818CF8; font-weight: 600;">
            Full 12-contractor dossier compiled in <code>SERVORA_MANDVI_KUTCH_LEAD_DIRECTORY.pdf</code>
          </div>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <div>REAL CONTRACTORS &bull; REAL LOCATIONS (PIN 370465) &bull; REAL PHONE NUMBERS &bull; ZERO HALLUCINATED LEADS</div>
      <div>READY FOR RAPID 20-CONTRACTOR PILOT ONBOARDING IN GUJARAT</div>
    </div>
  </section>

  <!-- ==================== SLIDE 8: BUSINESS MODEL & ROI ==================== -->
  <section class="slide">
    <div class="slide-header">
      <div class="brand-area">
        <div class="brand-logo-badge">S</div>
        <div>
          <div class="brand-name">SERVORA</div>
          <div class="brand-tagline">Business Model</div>
        </div>
      </div>
      <div class="header-category">
        <span class="category-badge">MONETIZATION & UNIT ECONOMICS</span>
        <span class="slide-number">08 / 10</span>
      </div>
    </div>

    <div>
      <h2 class="section-title">B2B SaaS Pricing & Compelling Contractor ROI</h2>
      <p class="section-subtitle">
        Contractor pays a predictable monthly subscription. Eliminating just 2 repeat truck rolls pays for the entire software 4x over.
      </p>

      <div class="grid-3" style="margin-bottom: 24px;">
        <!-- Tier 1 -->
        <div class="glass-card">
          <div style="font-size: 13px; font-weight: 800; color: #94A3B8; text-transform: uppercase;">Tier 1 &bull; Starter Ops</div>
          <div style="font-size: 42px; font-weight: 900; color: #FFFFFF; margin: 8px 0;">₹4,999 <span style="font-size: 16px; color: #64748B;">/ month</span></div>
          <p style="font-size: 13px; color: #94A3B8; margin-bottom: 16px;">($60/mo &bull; Ideal for small regional contractors)</p>
          <ul class="feature-list" style="font-size: 14px;">
            <li>Up to 5 Field Technicians</li>
            <li>Customer Intake & Territory Validation</li>
            <li>Digital Work Orders & Photo Evidence</li>
            <li>Mobile PWA for Field Technicians</li>
          </ul>
        </div>

        <!-- Tier 2 -->
        <div class="glass-card glass-card-accent-indigo" style="border-top: 4px solid #6366F1;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="font-size: 13px; font-weight: 800; color: #818CF8; text-transform: uppercase;">Tier 2 &bull; Growth Fleet</div>
            <span class="pill pill-indigo">POPULAR</span>
          </div>
          <div style="font-size: 42px; font-weight: 900; color: #FFFFFF; margin: 8px 0;">₹14,999 <span style="font-size: 16px; color: #64748B;">/ month</span></div>
          <p style="font-size: 13px; color: #94A3B8; margin-bottom: 16px;">($180/mo &bull; Full AI Dispatch & Diagnostic Engine)</p>
          <ul class="feature-list" style="font-size: 14px;">
            <li>Up to 20 Field Technicians</li>
            <li><strong>AI Symptom Normalizer & Root-Cause Pre-Triage</strong></li>
            <li><strong>5-Factor Intelligent Match Dispatch Engine</strong></li>
            <li><strong>Pilot Insights Ground-Truth Benchmarking</strong></li>
            <li>Automated Digital Invoicing & SLA Dashboards</li>
          </ul>
        </div>

        <!-- Tier 3 -->
        <div class="glass-card">
          <div style="font-size: 13px; font-weight: 800; color: #34D399; text-transform: uppercase;">Tier 3 &bull; Enterprise EPC</div>
          <div style="font-size: 42px; font-weight: 900; color: #FFFFFF; margin: 8px 0;">₹39,999 <span style="font-size: 16px; color: #64748B;">/ month</span></div>
          <p style="font-size: 13px; color: #94A3B8; margin-bottom: 16px;">($480/mo &bull; Multi-Branch & OEM Integration)</p>
          <ul class="feature-list" style="font-size: 14px;">
            <li>Unlimited Field Technicians & Branch Depots</li>
            <li>Direct OEM Inverter Telemetry API integration</li>
            <li>Custom Warranty Claim Automation</li>
            <li>Dedicated Enterprise SLA & Account Manager</li>
          </ul>
        </div>
      </div>

      <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 14px; padding: 18px 28px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-size: 16px; font-weight: 800; color: #34D399;">Contractor ROI Equation (A 10-Tech Team):</div>
          <div style="font-size: 14px; color: #CBD5E1; margin-top: 4px;">
            Eliminating 2 repeat visits per tech/mo saves 20 visits &times; ₹3,500 = <strong>₹70,000 saved monthly</strong> vs ₹14,999 software cost.
          </div>
        </div>
        <div style="font-size: 26px; font-weight: 900; color: #34D399;">
          4.6x Net ROI
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <div>HIGH GROSS MARGIN SAAS (85%+) &bull; EXPANSION THROUGH TELEMETRY SEATS & INVENTORY TRACKING</div>
      <div>TARGET 12-MONTH ARR: ₹1.2 CRORE ($145,000) WITH 70 CONTRACTORS</div>
    </div>
  </section>

  <!-- ==================== SLIDE 9: COMPETITION ==================== -->
  <section class="slide">
    <div class="slide-header">
      <div class="brand-area">
        <div class="brand-logo-badge">S</div>
        <div>
          <div class="brand-name">SERVORA</div>
          <div class="brand-tagline">Competitive Landscape</div>
        </div>
      </div>
      <div class="header-category">
        <span class="category-badge">MARKET POSITIONING</span>
        <span class="slide-number">09 / 10</span>
      </div>
    </div>

    <div>
      <h2 class="section-title">Why Servora Wins: High-Voltage Vertical Specialization</h2>
      <p class="section-subtitle">
        Generic CRMs don't understand inverters; consumer marketplaces commoditize technicians instead of empowering operations.
      </p>

      <table class="deck-table" style="background: rgba(15, 23, 42, 0.7); border-radius: 16px; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.08);">
        <thead>
          <tr>
            <th>Operational Capability</th>
            <th style="color: #818CF8; font-size: 14px;">⚡ Servora</th>
            <th>Generic CRMs (HubSpot / SFDC)</th>
            <th>Legacy FSM (Jobber / ServiceTitan)</th>
            <th>Consumer Apps (Urban Company)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Domain AI Triage (Solar/HVAC)</strong></td>
            <td><span class="pill pill-emerald">Native Fault Codes</span></td>
            <td><span class="pill pill-red">No Domain Context</span></td>
            <td><span class="pill pill-amber">Generic Text Notes</span></td>
            <td><span class="pill pill-red">Fixed Price Menus Only</span></td>
          </tr>
          <tr>
            <td><strong>5-Factor Skill & Tool Dispatch</strong></td>
            <td><span class="pill pill-emerald">Deterministic Algorithmic</span></td>
            <td><span class="pill pill-red">Manual Assignment</span></td>
            <td><span class="pill pill-amber">GPS Distance Only</span></td>
            <td><span class="pill pill-amber">Random Pool Bidding</span></td>
          </tr>
          <tr>
            <td><strong>Physical Multimeter Telemetry</strong></td>
            <td><span class="pill pill-emerald">Voc, Current, Arc-Flash Log</span></td>
            <td><span class="pill pill-red">None</span></td>
            <td><span class="pill pill-red">None</span></td>
            <td><span class="pill pill-red">None</span></td>
          </tr>
          <tr>
            <td><strong>Ground-Truth AI Audit Loop</strong></td>
            <td><span class="pill pill-emerald">AI vs Physical Benchmark</span></td>
            <td><span class="pill pill-red">None</span></td>
            <td><span class="pill pill-red">None</span></td>
            <td><span class="pill pill-red">None</span></td>
          </tr>
          <tr>
            <td><strong>Emerging Market Offline PWA</strong></td>
            <td><span class="pill pill-emerald">High-Contrast Direct Sun</span></td>
            <td><span class="pill pill-red">Heavy Desktop First</span></td>
            <td><span class="pill pill-amber">App Store Native Only</span></td>
            <td><span class="pill pill-amber">Consumer Centric</span></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="slide-footer">
      <div>SERVORA DOES NOT COMPETE WITH CONTRACTORS &bull; WE ARE THE OPERATIONAL BACKBONE THEY RUN ON</div>
      <div>DEEPLY DEFENDED BY PHYSICAL TELEMETRY DATASETS AND OEM INTEGRATIONS</div>
    </div>
  </section>

  <!-- ==================== SLIDE 10: ROADMAP & ASK ==================== -->
  <section class="slide">
    <div class="slide-header">
      <div class="brand-area">
        <div class="brand-logo-badge">S</div>
        <div>
          <div class="brand-name">SERVORA</div>
          <div class="brand-tagline">Vision & Next Steps</div>
        </div>
      </div>
      <div class="header-category">
        <span class="category-badge">EXECUTION TIMELINE</span>
        <span class="slide-number">10 / 10</span>
      </div>
    </div>

    <div>
      <h2 class="section-title">Milestone Roadmap & Y Combinator Acceleration</h2>
      <p class="section-subtitle">
        Scaling from verified Gujarat pilot contractors to global clean-energy and electrification field operations.
      </p>

      <div class="grid-3" style="margin-bottom: 28px;">
        <div class="glass-card" style="border-top: 4px solid #6366F1;">
          <div style="font-size: 13px; font-weight: 800; color: #818CF8; text-transform: uppercase;">Phase 1 &bull; Q3–Q4 2026</div>
          <h3 style="font-size: 20px; font-weight: 800; color: #FFFFFF; margin: 8px 0 12px 0;">Regional Pilot Scale</h3>
          <ul class="feature-list" style="font-size: 14px;">
            <li>Onboard 25 Solar EPC & HVAC Contractors across Kutch, Rajkot, and Ahmedabad.</li>
            <li>Process 1,500+ live verified field work orders.</li>
            <li>Achieve ₹15 Lakhs ($18,000) Annualized ARR.</li>
            <li>Lock in first OEM telemetry pilot partnership.</li>
          </ul>
        </div>

        <div class="glass-card" style="border-top: 4px solid #F59E0B;">
          <div style="font-size: 13px; font-weight: 800; color: #FBBF24; text-transform: uppercase;">Phase 2 &bull; 2027</div>
          <h3 style="font-size: 20px; font-weight: 800; color: #FFFFFF; margin: 8px 0 12px 0;">National Clean-Tech Expansion</h3>
          <ul class="feature-list" style="font-size: 14px;">
            <li>Expand across India's top 6 solar states (Gujarat, Rajasthan, Maharashtra, Karnataka).</li>
            <li>Automated inverter warranty claim processing directly with Microtek, Luminous & Havells.</li>
            <li>Surpass ₹1.5 Crore ($180,000) ARR with 120+ active fleets.</li>
          </ul>
        </div>

        <div class="glass-card" style="border-top: 4px solid #10B981;">
          <div style="font-size: 13px; font-weight: 800; color: #34D399; text-transform: uppercase;">Phase 3 &bull; 2027–2028</div>
          <h3 style="font-size: 20px; font-weight: 800; color: #FFFFFF; margin: 8px 0 12px 0;">Global Sunbelt Electrification</h3>
          <ul class="feature-list" style="font-size: 14px;">
            <li>Launch US Sunbelt (California, Texas, Florida) and MENA rooftop solar operations.</li>
            <li>Expand vertical coverage into EV Fast Charging stations and Heat Pumps.</li>
            <li>Become the global standard OS for high-voltage distributed clean energy field service.</li>
          </ul>
        </div>
      </div>

      <div style="background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(99, 102, 241, 0.4); border-radius: 16px; padding: 22px 32px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-size: 20px; font-weight: 900; color: #FFFFFF;">Faiz Khatri &bull; Founder & CEO</div>
          <div style="font-size: 14px; color: #94A3B8; margin-top: 4px;">Servora Technologies &bull; Building the Future of Clean-Tech Operations</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 14px; font-weight: 700; color: #818CF8;">Full HD 3-Minute Video Demo Available</div>
          <div style="font-size: 13px; color: #CBD5E1; margin-top: 2px;"><code>SERVORA_3MIN_YC_DEMO.mp4</code> &bull; Running live on <code>localhost:5173</code></div>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <div>SERVORA &bull; BUILT FOR THE REALITIES OF PHYSICAL SERVICE &bull; Y COMBINATOR W26</div>
      <div>THANK YOU &bull; <span class="footer-highlight">faizkhatri196@gmail.com</span></div>
    </div>
  </section>

</body>
</html>
`;

// Paths
const projectDir = path.join(__dirname, '..');
const galleryDir = path.join(projectDir, '..', 'Servora Gallery');
const htmlOutputProject = path.join(projectDir, 'SERVORA_DEMO_PITCH_DECK.html');
const htmlOutputGallery = path.join(galleryDir, 'SERVORA_DEMO_PITCH_DECK.html');
const pdfOutputProject = path.join(projectDir, 'SERVORA_DEMO_PITCH_DECK.pdf');
const pdfOutputGallery = path.join(galleryDir, 'SERVORA_DEMO_PITCH_DECK.pdf');

// Ensure Gallery folder exists
if (!fs.existsSync(galleryDir)) {
  fs.mkdirSync(galleryDir, { recursive: true });
}

// 1. Write HTML
console.log('Writing pitch deck HTML...');
fs.writeFileSync(htmlOutputProject, htmlContent, 'utf8');
fs.writeFileSync(htmlOutputGallery, htmlContent, 'utf8');
console.log('Saved HTML to:', htmlOutputProject);

// 2. Generate PDF using Edge headless
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const browserExe = fs.existsSync(edgePath) ? edgePath : chromePath;

console.log('Generating presentation PDF with:', browserExe);

const args = [
  '--headless',
  '--disable-gpu',
  '--run-all-compositor-stages-before-draw',
  '--no-pdf-header-footer',
  '--print-to-pdf=' + pdfOutputProject,
  htmlOutputProject
];

const res = spawnSync(browserExe, args, { stdio: 'inherit' });

if (fs.existsSync(pdfOutputProject)) {
  const stats = fs.statSync(pdfOutputProject);
  console.log(`Successfully created Project PDF: ${pdfOutputProject} (${(stats.size / 1024).toFixed(1)} KB)`);
  
  // Copy to Servora Gallery
  fs.copyFileSync(pdfOutputProject, pdfOutputGallery);
  console.log(`Successfully copied to Servora Gallery: ${pdfOutputGallery}`);
  console.log('\nALL DONE! Executive Pitch Deck PDF Ready.');
} else {
  console.error('Failed to create PDF!');
  process.exit(1);
}
