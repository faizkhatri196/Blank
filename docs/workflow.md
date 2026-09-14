# End-to-End Operational Workflow

This document illustrates the step-by-step lifecycle of a field service request in AI Field Service Copilot, showing the interaction between the Customer, Service Manager, AI Diagnostics Subsystem, and Field Technician.

```mermaid
sequenceDiagram
    autonumber
    actor Customer
    actor Manager as Service Manager
    participant AI as Grounded AI Engine
    participant System as Core Backend & State Machine
    actor Tech as Field Technician

    %% 1. INTAKE
    Note over Customer, Manager: 1. Complaint Intake & Ticket Creation
    Customer->>Manager: Reports issue (e.g., Inverter Error 04 or AC Low Cooling)
    Manager->>System: Logs Ticket (Selects Solar or AC, Asset Specs, Priority)
    System-->>Manager: Generates Ticket (e.g. SOL-2026-0001)

    %% 2. AI DIAGNOSTICS
    Note over Manager, AI: 2. Grounded AI Diagnostic Preparation
    Manager->>AI: Triggers AI Analysis
    AI->>System: Loads System Specs + Past Service History + Failure Knowledge
    AI-->>Manager: Returns Possible Issues, Field Checklist, Required Tools, Parts & Safety Warnings
    Note right of Manager: AI marked: "AI ASSISTANCE — VERIFY ON SITE"

    %% 3. MATCHING & ASSIGNMENT
    Note over Manager, Tech: 3. Deterministic Technician Matching
    Manager->>System: Requests Technician Recommendations
    System->>System: Computes 5-Factor Score (Skill 40%, Tools 20%, Availability 20%, Area 10%, Exp 10%)
    System-->>Manager: Ranked Technicians with Explainable Reasons
    Manager->>System: Confirms Assignment (e.g., Dispatches Rahul Verma)
    System-->>Tech: Push Notification & Dispatch to Mobile Interface

    %% 4. FIELD EXECUTION
    Note over Tech, System: 4. Mobile Execution & Field Progress
    Tech->>System: Accepts Dispatch (Status: ACCEPTED)
    Tech->>Customer: 1-Click Phone Call to confirm access
    Tech->>System: Departs for site (Status: EN_ROUTE)
    Tech->>System: Arrives at physical location (Status: ON_SITE)
    Tech->>System: Begins inspection (Status: IN_PROGRESS)
    Note right of Tech: Reviews AI Checklist & Safety Warnings on mobile

    %% 5. GROUNDWORK & CLOSURE
    Note over Tech, System: 5. Groundwork Data Capture & AI Benchmark
    Tech->>System: Submits Field Service Report (Multimeter/Manifold Readings, Replaced Parts, Labor Time, Photos)
    System->>System: Executes AI vs Actual Evaluation Benchmark
    System->>System: Appends to Customer Asset Service History
    System-->>Tech: Job Marked COMPLETED
    System-->>Manager: Ticket Closed & Metrics Updated in Pilot Dashboard
```

---

## Key Operational Safeguards

1. **Manager in the Loop**: The AI never auto-assigns or auto-dispatches tickets without explicit operational review by a human Service Manager.
2. **Technician Ground Truth**: The physical readings recorded on site (e.g., actual DC string voltage, AC line voltage, suction pressure) and the physical parts used supersede any predictive AI assumptions.
3. **Audit Trail**: Every change in ticket status or field assignment is preserved in the ticket's `historyTimeline` with user references and timestamps.
4. **Asset History Continuity**: Every completed job becomes part of the asset's permanent history, ensuring the next technician and AI analysis are grounded in past maintenance context.
