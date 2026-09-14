# Founder's Guide: Running Real-World Pilot Tests

This guide provides a practical, step-by-step protocol for founders and engineering teams to validate AI Field Service Copilot with a prospective solar or AC service partner.

---

## Phase 1: The 20-Job Historical Ground-Truth Test (Pre-Pilot Validation)

Before dispatching technicians in real time, run a **historical blind test** using 10–20 past completed service tickets provided by the partner company.

### Protocol:
1. **Obtain Past Job Sheets**: Collect 10 Solar and/or 10 AC historical service complaints from the partner (complaint description + customer asset specs), but **hide the actual fix and parts used**.
2. **Input Complaint**: Log each historical complaint into AI Field Service Copilot as a Service Manager.
3. **Run AI Diagnostics**: Trigger AI analysis.
4. **Compare Predictions with Partner's Actual Historical Resolution**:
   - Was the actual root cause identified in the AI's top 3 possible issues?
   - Were the required replacement parts listed in the AI's expected parts list?
   - Did the suggested tools cover the actual tools needed?
5. **Score Match Rate**:
   $$\text{Historical Accuracy} = \frac{\text{Jobs where AI predicted correct root cause}}{\text{Total Historical Jobs}}$$
6. **Present to Business Owner**:
   Open the **Pilot Evaluation Dashboard** and show the side-by-side comparison:
   > *"On your last 20 jobs, our AI correctly prepared the technician with the right checklist and parts in 75% of cases before the technician left the shop."*

---

## Phase 2: Live Parallel Field Pilot (2–4 Weeks)

Run the platform alongside the company's existing workflow (WhatsApp, phone calls, paper slips).

### Daily Routine:
1. **Morning Intake**: As customer calls arrive, the Service Manager logs them in AI Field Service Copilot.
2. **Pre-Dispatch Preparation**:
   - The manager reviews AI-recommended tools and parts.
   - The manager checks the **Technician Recommendations** list to dispatch the technician with the best skill and tool match.
3. **Field Dispatch**:
   - The technician opens their mobile phone to `http://<server-ip>:5173`.
   - They click **Accept**, tap to call the customer, and tap **On Site** upon arrival.
   - Before troubleshooting, the technician glances at the **AI Diagnostic Checklist** and **Safety Warnings**.
4. **Groundwork Completion**:
   - After completing the fix, the technician fills out the 60-second mobile report (actual root cause, multimeter readings, parts replaced, photos).
   - The technician rates the AI recommendation (1–5 stars) and adds a quick note.
5. **Evening Review**:
   - Manager reviews the **Pilot Insights** tab to see First-Time Fix Rate, Repeat Visit Rate, and AI Accuracy.
   - 1-click download the CSV export for the weekly stakeholder report.

---

## Phase 3: What to Measure & Success Criteria

| Metric | Target | Business Value |
|---|---|---|
| **AI Root Cause Match Rate** | $\ge 70\%$ | Better technician mental preparation; avoids guessing on site |
| **First-Time Fix Rate** | $\ge 85\%$ | Fewer return trips; saving fuel and labor costs |
| **Technician AI Rating** | $\ge 4.0 / 5.0$ | High field adoption and trust from technicians |
| **Repeat Visit Rate** | $\le 10\%$ | Higher customer satisfaction and reduced unbilled warranty trips |
| **Time to Dispatch** | $< 5 \text{ minutes}$ | Explainable matching saves manager scheduling overhead |
