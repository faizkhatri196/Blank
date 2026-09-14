# REST API Specification

## 1. Authentication & Base Headers

All operational endpoints require JWT Bearer authentication:
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

Tenant context is derived automatically from the authenticated JWT token (`req.user.companyId`), eliminating tenant injection vulnerabilities.

---

## 2. API Endpoints

### 2.1. System & Health
#### `GET /api/health`
Checks server status, database connection, and active AI engine.
- **Response `200 OK`**:
```json
{
  "status": "healthy",
  "database": "connected",
  "ai": {
    "gemini": true,
    "groq": true,
    "fallback": "DemoAIProvider available"
  },
  "timestamp": "2026-09-13T19:30:00.000Z"
}
```

---

### 2.2. Authentication (`/api/auth`)

#### `POST /api/auth/login`
Authenticates a Service Manager or Field Technician.
- **Request Body**:
```json
{
  "email": "manager@demo.com",
  "password": "Demo@12345"
}
```
- **Response `200 OK`**:
```json
{
  "token": "eyJhbGciOi...",
  "user": {
    "id": "60d0fe4f...",
    "email": "manager@demo.com",
    "name": "Arjun Sharma",
    "role": "SERVICE_MANAGER",
    "companyId": "60d0fe4f..."
  }
}
```

#### `GET /api/auth/me`
Retrieves current session identity and role permissions.

---

### 2.3. Service Tickets (`/api/tickets`)

#### `GET /api/tickets`
Lists tickets with multi-service and status filtering.
- **Query Parameters**:
  - `serviceType`: `SOLAR` | `AC_HVAC` (optional)
  - `status`: Ticket status filter (optional)
  - `search`: Complaint, customer name, or ticket number keyword search
- **Response `200 OK`**: Array of ticket objects with populated customer, asset, and assigned technician.

#### `POST /api/tickets`
Creates a new customer service ticket with optional customer/asset creation.
- **Request Body**:
```json
{
  "serviceType": "SOLAR",
  "customerId": "60d0fe...",
  "solarSystemId": "60d0fe...",
  "complaint": "Solar inverter display flashing Error Code 04 and clicking intermittently. No solar power generation.",
  "priority": "HIGH"
}
```
- **Response `201 Created`**: Returns created ticket with auto-generated formatted number `SOL-2026-0011`.

#### `GET /api/tickets/:id`
Fetches complete ticket details including AI analysis, recommendations, field report, benchmark reviews, and audit timeline.

#### `POST /api/tickets/:id/analyze`
Triggers grounded AI diagnostic analysis.
- **Response `200 OK`**:
```json
{
  "summary": "Grid overvoltage or AC disconnection trip suspected...",
  "possibleIssues": [
    {
      "issue": "Grid AC Overvoltage / Undervoltage Trip",
      "probability": 75,
      "rootCauses": ["Grid voltage fluctuation > 265V", "Loose AC cabling"],
      "severity": "HIGH"
    }
  ],
  "recommendedChecklist": [
    "Isolate AC and DC disconnect switches",
    "Measure AC grid line voltage with true-RMS multimeter"
  ],
  "requiredTools": [
    { "tool": "Digital Multimeter (True RMS)", "reason": "Measure AC grid and DC string voltage", "isMandatory": true }
  ],
  "expectedParts": [
    { "partName": "AC Surge Protection Device (SPD)", "probability": 40, "estimatedCost": 1200 }
  ],
  "safetyWarnings": [
    "High DC voltage (>350V) present even in cloudy weather. Wear insulated PPE."
  ],
  "estimatedDurationMinutes": 60,
  "provider": "GEMINI"
}
```

#### `POST /api/tickets/:id/recommend-technicians`
Executes 5-factor matching algorithm and returns ranked technicians.
- **Response `200 OK`**:
```json
[
  {
    "technician": { "id": "...", "name": "Rahul Verma", "status": "AVAILABLE" },
    "score": 92,
    "breakdown": {
      "skillScore": 40,
      "toolScore": 20,
      "availabilityScore": 20,
      "distanceScore": 7,
      "experienceScore": 5
    },
    "reasons": [
      "Matched 3/3 required skills (Inverter Diagnostics, Grid-Tied Troubleshooting)",
      "Possesses all mandatory tools",
      "Currently Available with 0 active jobs"
    ]
  }
]
```

#### `POST /api/tickets/:id/assign`
Dispatches a technician to the ticket.
- **Request Body**: `{ "technicianId": "60d0fe..." }`
- **Response `200 OK`**: Ticket status updated to `ASSIGNED`.

#### `PATCH /api/tickets/:id/status`
Advances ticket state machine (`ACCEPTED`, `EN_ROUTE`, `ON_SITE`, `IN_PROGRESS`).

---

### 2.4. Field Service Reports (`/api/reports`)

#### `POST /api/reports`
Submitted by the technician upon physical job completion.
- **Request Body**:
```json
{
  "ticketId": "60d0fe...",
  "actualRootCause": "Grid surge tripped AC breaker and damaged 40A AC contactor",
  "workPerformed": "Replaced AC contactor, tightened terminal lugs, re-commissioned inverter",
  "partsUsed": [
    { "partName": "40A AC Contactor", "partNumber": "CON-40A-2P", "quantity": 1, "cost": 1400 }
  ],
  "toolsUsed": ["Digital Multimeter", "Insulated Screwdriver Set"],
  "laborMinutes": 55,
  "readings": {
    "gridVoltage": 242,
    "stringVoc": 380,
    "groundResistance": 2.1
  },
  "technicianRatingOfAI": 5,
  "technicianNotesOnAI": "AI checklist was spot on; flagged the loose AC contactor early."
}
```
- **Response `201 Created`**: Automatically executes AI vs Actual evaluation benchmark and closes ticket as `COMPLETED`.

---

### 2.5. Pilot Insights & CSV Export (`/api/pilot`)

#### `GET /api/pilot/metrics`
Returns grounded, un-faked operational metrics for the founder/manager:
- **Response `200 OK`**:
```json
{
  "totalCompletedJobs": 10,
  "issuePredictionMatchRate": "7 / 10 (70%)",
  "partsPredictionMatchRate": "6 / 10 (60%)",
  "avgTechnicianRating": "4.6 / 5.0",
  "firstTimeFixRate": "9 / 10 (90%)",
  "repeatVisitRate": "1 / 10 (10%)",
  "avgLaborTimeMinutes": 62,
  "serviceBreakdown": {
    "solar": { "total": 6, "matched": 5 },
    "ac": { "total": 4, "matched": 3 }
  }
}
```

#### `GET /api/pilot/export-csv`
Streams a UTF-8 CSV download containing every field job, customer, asset, AI prediction, technician assignment, ground readings, actual parts, and match evaluation.
