# SERVORA — Real Screen Walkthrough Recording Guide

This guide defines the exact, 38-step recording sequence and verbatim voiceover script for producing the **real product walkthrough video** directly from the deployed SERVORA application.

> [!IMPORTANT]
> **Operational Authenticity Rule**:
> Record 100% from the real, running SERVORA application.
> Do NOT use fake UI animations, stock video footage, artificial GPS mockups, or synthetic dashboards. The real product software is the hero.

---

## 1. Video Specifications

- **Resolution**: 1920 × 1080 (1080p) or 2560 × 1440 (1440p)
- **Framerate**: 60 FPS (smooth UI scrolling & state transitions)
- **Format**: MP4 (H.264 / AAC)
- **Audio**: Clean, studio-grade voiceover; subtle ambient background audio (optional, low volume)
- **Target Duration**: ~4 minutes (~240 seconds)
- **Deployment URL**: Deployed production Vercel/Render instance or local testing environment (`http://localhost:5173`)

---

## 2. Pre-Recording Data Safety Checklist

Before recording, ensure:
- [ ] Only demo accounts are used (`customer@demo.com`, `jay@demo.com`, `manager@demo.com`).
- [ ] No real customer phone numbers, personal emails, or private addresses appear on screen.
- [ ] Browser developer tools and URL bar extensions are hidden.
- [ ] No API keys, JWTs, database connection strings, or cloud provider consoles are captured.
- [ ] Browser zoom is set to 100% or 110% for crisp typography.

---

## 3. The 38-Step Recording Sequence

### ACT 1: Customer Intake & Location-First Discovery (00:00 – 01:15)
1. **Open Application**: Navigate to `http://localhost:5173/customer`.
2. **Customer State**: Show customer interface with initial status: **"Select Location"** and prompt **"Where do you need service?"**.
3. **Zero Location State**: Highlight that zero services are displayed before location selection.
4. **Enter Location**: Type `Rajkot` (or pick from demonstration cities).
5. **Backend Verification**: Show available services loading (`Solar Service`, `AC Repair`, etc.) specifically covered in that region.
6. **Select Service**: Click **Solar Service**.
7. **Select Problem**: Choose **Inverter Fault / Error Code**.
8. **Enter Complaint**: Type a realistic customer description: *"Inverter error code E04 displayed since morning. Solar panels not feeding power to battery."*
9. **Attach Evidence**: Upload or select photo showing the solar inverter unit.
10. **AI Understanding**: Show the generated AI triage summary (urgency, predicted equipment, safety advisories).
11. **Submit Request**: Click **Submit Service Request**.
12. **Tracking View**: Show the confirmation and customer-safe tracking view with ticket status **SUBMITTED**.

### ACT 2: Manager Operations & Dispatch (01:15 – 02:10)
13. **Switch to Manager**: Open Manager Operations Center (`/manager/dashboard` or sign in as `manager@demo.com`).
14. **Incoming Triage Queue**: Show the newly created ticket appearing at the top of the queue.
15. **Open Ticket**: Click into the ticket detail view.
16. **Review AI Assessment**: Review AI classification, confidence score, urgency rating, and suggested parts.
17. **Review Location & Coverage**: Verify customer service address snapshot (`Rajkot`).
18. **Assign Technician**: Open dispatch drawer, select certified technician (`Vikas Patel`), and confirm assignment.
19. **Field Operations Telemetry**: Open Field Operations view showing the newly assigned technician.
20. **Location Freshness**: Show telemetry indicators with freshness badge (`FRESH < 2 min`).
21. **Ticket Status**: Show ticket transitioned to **ASSIGNED**.

### ACT 3: Technician Field Execution (02:10 – 03:05)
22. **Switch to Technician**: Open Technician Terminal (`/technician/dashboard` or mobile viewport).
23. **Assigned Job**: Show job notification: *Solar Inverter Diagnosis & Repair*.
24. **State Transition 1 — Accept**: Click **Accept Job** → status updates to **ACCEPTED**.
25. **State Transition 2 — Travel**: Click **Start Travel** → status updates to **ON_THE_WAY** (triggers GPS broadcast).
26. **State Transition 3 — Arrival**: Click **Arrived on Site** → status updates to **ON_SITE**.
27. **Diagnosis**: Click **Begin Diagnosis** → enter inspection findings: *"Blown DC input surge fuse and loose terminal connection."*
28. **Diagnostic Readings**: Log multimeter measurements (e.g., *DC Voltage: 420V, AC Output: 230V*).
29. **Evidence Photos**: Upload on-site closeout photo.
30. **Parts Record**: Record replacement parts used (*1x 1000V 20A DC Fuse*).
31. **Digital Report**: Review generated completion summary and sign off.
32. **Complete Job**: Click **Complete Service** → ticket advances to **COMPLETED**.

### ACT 4: Field Operations & Ground Truth Verification (03:05 – 03:35)
33. **Return to Manager**: Switch back to Operations Manager view.
34. **Active Fleet Update**: Show completed jobs KPI incremented and field operation closed.
35. **AI vs Actual Comparison**: Open ticket evaluation tab comparing:
    - *Initial AI Prediction*: Inverter Fault / DC Infeed
    - *Field Ground Truth*: DC Fuse blown, terminal tightened
    - *Accuracy Assessment*: Diagnostic agreement verified.

### ACT 5: Customer Feedback & History (03:35 – 04:00)
36. **Return to Customer**: View `/customer/requests` on customer account.
37. **Verified Completion**: Show verified completion badge and safe technician summary.
38. **Submit Rating & Review**: Give 5-star rating with review comment: *"Prompt arrival, identified the blown fuse immediately, solar back online!"*.

---

## 4. Verbatim Voiceover Script

### [00:00] Act 1 — The Operational Journey & Customer Intake
> *"Every service request has a journey — from the moment a customer reports an equipment problem to the moment a certified service professional completes the job on site.*
> 
> *With SERVORA, that journey begins with location. Customers specify where they need service, and SERVORA immediately verifies which certified service lines are actively covered in that area. Zero guesswork, zero fallback to unrelated cities.*
> 
> *The customer selects their service, describes the issue, attaches visual evidence, and reviews an AI-assisted diagnostic understanding before submitting their ticket."*

### [01:15] Act 2 — Manager Dispatch & Operations
> *"Instantly, the operations manager receives the request in their command dashboard. Managers inspect the AI triage breakdown — including urgency classification, required toolsets, and safety advisories — before assigning the best-suited certified technician with a single click."*

### [02:10] Act 3 — Technician Field Execution
> *"On the road, the field technician manages the entire job lifecycle through a high-contrast mobile terminal. As they move from Accepted, to On The Way, to On Site, every transition is captured.*
> 
> *Technicians log multimeter readings, attach proof-of-work photos, record replaced parts, and generate a tamper-evident digital service report right from the field."*

### [03:05] Act 4 — Live Telemetry & Ground Truth Audit
> *"Back at headquarters, managers monitor fleet progress in real time. Coordinate freshness is strictly categorized — Fresh, Warm, or Stale — ensuring managers never mistake cached coordinates for live GPS.*
> 
> *Once the job concludes, SERVORA preserves the immutable service record and benchmarks the initial AI diagnosis against physical ground truth to continuously improve fleet efficiency."*

### [03:35] Act 5 — Customer Feedback & Platform Closing
> *"Customers follow every milestone with complete peace of mind, receiving certified completion receipts and providing verified feedback.*
> 
> *SERVORA connects the entire field service operation — customer, manager, and technician — in one unified platform.*
> 
> *SERVORA. AI-powered field service operations."*

---

## 5. Embedding the Video in the Application

Once the video file is recorded and exported:
1. Upload the video to your CDN, storage bucket (Cloud Storage, S3, Cloudinary), or place it in `client/public/video/servora_walkthrough.mp4`.
2. Configure your environment variable:
   ```env
   VITE_SERVORA_WALKTHROUGH_VIDEO_URL="https://your-cdn.com/servora_walkthrough.mp4"
   VITE_SERVORA_WALKTHROUGH_POSTER_URL="https://your-cdn.com/servora_poster.jpg"
   ```
3. If the final cut timings differ by a few seconds, adjust the timestamp markers in `client/src/config/walkthroughConfig.ts`.
4. The `<ProductWalkthrough />` component will automatically switch from the placeholder to the real native video player with interactive chapter seeking.
