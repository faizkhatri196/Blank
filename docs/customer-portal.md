# SERVORA V2 — Customer Portal & Field Operations Operations Architecture

## 1. Overview & Positioning

**SERVORA** is an AI-powered Field Service Operations Platform connecting Customers, Service Managers, and Certified Technicians.
In Version 2 (Customer Experience & Location-based Discovery), Servora provides an end-to-end consumer-to-technician lifecycle:

```
CUSTOMER
  ↓
LOCATION (Ahmedabad, Gandhinagar, Sanand, etc.)
  ↓
AVAILABLE SERVICES (Coverage filtered)
  ↓
SERVICE SELECTION (Solar, AC & HVAC)
  ↓
VISUAL PROBLEM CARDS (Inverter, low generation, not cooling, water leak, etc.)
  ↓
CUSTOMER DESCRIPTION (Supports everyday colloquial Hinglish/Gujarati)
  ↓
PHOTO EVIDENCE (Inverter display, leak area — safe photo taking)
  ↓
AI COMPLAINT NORMALIZATION & TRIAGE ("VERIFY ON SITE")
  ↓
SERVICE REQUEST CREATION (#SOL-XXXX / #AC-XXXX)
  ↓
MANAGER REVIEW & TECHNICIAN MATCHING (40% Skills, 20% Tools, 20% Availability, 10% Area, 10% Exp)
  ↓
TECHNICIAN MOBILE EXECUTION (Accept → On The Way → On Site → Diagnosis & Readings → Complete)
  ↓
CUSTOMER LIVE TRACKING TIMELINE
  ↓
CUSTOMER 5-STAR FEEDBACK
  ↓
AI VS ACTUAL VALIDATION LOOP
```

---

## 2. Privacy & Security Guardrails (Non-Negotiable)

1. **Technician Privacy**:
   - Customers **never** see technician matching scores (e.g. 96%), internal rankings, or internal workload metrics.
   - Customers **never** see technician personal phone numbers.
   - Contact CTA strictly uses `Company.approvedContactNumber` or `Company.phone` (e.g. `+91 79 4000 1234`).
   - Technician names are hidden by default (`showTechnicianNameToCustomer: false`), displaying role only (e.g. *"Solar Service Professional"*).
2. **Location Privacy**:
   - Customer location is snapshotted into `ServiceTicket.serviceLocation` at creation time.
   - Exact coordinates are only shared with the assigned technician during active dispatches.
   - No customer can view another customer's address or tickets.
3. **Tenant & Role Isolation**:
   - Customer endpoints enforce customer ownership (`ticket.customerId === authenticatedUser._id`).
   - Cross-tenant queries are blocked (`ticket.companyId === authenticatedUser.companyId`).
   - Customers cannot access manager or technician dashboards.

---

## 3. Service Configuration Engine

First-class services are defined in `server/src/config/serviceRegistry.ts`:
- **SOLAR**: Photovoltaic systems, inverters, DC/AC wiring, routine washing, and string inspection.
- **AC**: Air conditioning, split/window units, refrigerant circuits, water leakage, and compressor troubleshooting.

Each service defines:
- `problemCategories`: Visual cards with title, description, image, alt text, and recommended evidence.
- `"I'm not sure what's wrong"` mode: Adaptive triage questions for undetermined complaints.
- `allowedEvidenceTypes`, `requiredSkills`, `recommendedTools`, `safetyRules` (with *"VERIFY ON SITE"* requirement), and `readingDefinitions`.

Future services (`RO`, `ELECTRICAL`, `PLUMBING`) can be registered by adding a config definition without modifying core customer UI logic.

---

## 4. API Endpoints

### Customer Portal Endpoints (`/api/customer-portal`)
- `POST /services/available`: Takes `{ city, pincode }` and returns services actively covered by registered service companies. Does not fabricate availability.
- `GET /services/:serviceType`: Returns public service catalog, visual problem cards, and triage questions.
- `POST /requests`: Creates a new customer service request. Snapshots location, runs complaint normalization, generates ticket number, and triggers initial AI triage.
- `GET /requests`: Authenticated customer retrieves their own requests.
- `GET /requests/:id`: Retrieves customer-safe ticket view with status timeline and approved company contact.
- `POST /requests/:id/feedback`: Submits 5-star rating, resolution confirmation, on-time flag, and comments for completed jobs.

---

## 5. How to Test Customer Demo

1. **Sign In as Customer**:
   - Open `/login?demo=true`
   - Click **Customer: customer@demo.com** (Password: `Demo@12345`)
   - Redirects to `/customer`
2. **Select Location**:
   - Location defaults to **Ahmedabad (380015)**.
   - Both **Solar Service** and **AC & HVAC Service** are available.
3. **Create Request**:
   - Click **Solar Service** → Choose **Inverter not working**.
   - Input: *"invrtr not wrkng genration bandh"*
   - Upload safe photo of inverter display.
   - Enter service address: *"402 Titanium City Centre, Prahlad Nagar"*.
   - Review AI Understanding Preview and click **Submit Service Request**.
4. **Track Live Progress**:
   - Request created with ticket number (e.g. `SOL-2026-XXXX`).
   - Open Manager in another tab (`manager@demo.com` / `Demo@12345`) to assign technician.
   - Open Technician (`technician@demo.com` / `Demo@12345`) to Accept → On The Way → On Site → Complete.
   - Customer tracking timeline updates live without page reload.
   - Submit 5-star feedback upon completion.
