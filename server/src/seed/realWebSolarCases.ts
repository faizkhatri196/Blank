import { EvaluationCaseData } from '../types';

export const REAL_WEB_SOLAR_CASES: EvaluationCaseData[] = [
  {
    caseId: 'WEB-AHM-001',
    dataType: 'PUBLIC_WEB',
    sourceOrganization: 'Solaryaan Support',
    sourceUrl: 'https://www.solaryaan.com/support',
    sourceDate: '2024 (Published Technical Support Guide)',
    locationContext: 'Ahmedabad / Gujarat service context',
    problem:
      'Solar inverter shows Grid Lost Fault or grid voltage disconnection alarm. Plant generation stops during grid synchronization.',
    observedInput: 'Inverter is showing Grid Lost Fault.',
    publishedSolution:
      'Published troubleshooting requires comprehensive AC & DC verification: check floating voltage, ACDB/DCDB voltage, solar panels, MC4 connectors, MPPT connections, surge protection devices (SPD), phase-to-neutral AC voltage, phase-to-earth voltage, and neutral-to-earth voltage. Notes that remote observation alone cannot confirm one single root cause.',
    groundTruth:
      'Multi-factor electrical fault condition. Root causes can range from utility grid outage/tripping, loose AC cabling at bi-directional meter/ACDB, blown AC SPD, or high neutral-earth voltage (> 3V). Model must NOT declare a single definitive component failure remotely, must mandate on-site voltage verification and LOTO isolation.',
    evaluationNotes:
      'Solaryaan documents floating voltage, ACDB, DCDB, MC4, MPPT, SPD, P-N, P-E, and N-E checks. Blind input contains only "Inverter is showing Grid Lost Fault." Evaluator checks if model requests AC/DC measurements, checks utility status, advises qualified electrician, and flags VERIFY ON SITE.',
    serviceType: 'SOLAR',
  },
  {
    caseId: 'WEB-AHM-002',
    dataType: 'PUBLIC_WEB',
    sourceOrganization: 'Solar Panel Ahmedabad',
    sourceUrl: 'https://solarpanelahmedabad.com/services/solar-maintenance-amc',
    sourceDate: '2024 (O&M Maintenance Services Documentation)',
    locationContext: 'Ahmedabad',
    problem:
      'Solar generation has dropped significantly although the inverter display shows no active fault code or error LED.',
    observedInput: 'Solar generation has dropped but the inverter shows no fault.',
    publishedSolution:
      'Published maintenance workflow requires: generation audit, inverter log review, string voltage (Voc) and current (Isc) testing, visual inspection for heavy panel soiling or local shading, checking for loose MC4 connector or tripped sub-string, and distinguishing equipment problems from meter/billing or consumption changes.',
    groundTruth:
      'A generation drop without inverter alarms indicates external or partial factors: dust/soiling accumulation (very common in Ahmedabad arid climate), micro-shading from newly constructed structures/trees, single string DC fuse blown while other string runs, or faulty net-meter logging. Remote AI must request generation history and string current tests rather than guessing internal inverter failure.',
    evaluationNotes:
      'Source highlights soiling, shading, string testing, inverter log check, and meter audit. Evaluator checks evidence awareness (asks for logs/generation history) and avoidance of premature hardware replacement claims.',
    serviceType: 'SOLAR',
  },
  {
    caseId: 'WEB-AHM-003',
    dataType: 'PUBLIC_WEB',
    sourceOrganization: 'Solar Panel Ahmedabad',
    sourceUrl: 'https://solarpanelahmedabad.com/services/solar-maintenance-amc',
    sourceDate: '2024 (O&M Maintenance Services Documentation)',
    locationContext: 'Ahmedabad',
    problem:
      'Solar generation is down and on-site technician suspects an MC4 connector problem / degradation.',
    observedInput: 'Solar generation is down and a technician suspects a connector problem.',
    publishedSolution:
      'Published service guidelines mandate visual inspection for scorch/discoloration, thermal imaging/temperature check for high contact resistance hot spots, string Voc/Isc measurement, and replacement with certified MC4 connectors using specialized MC4 crimping tool. Emphasizes strict electrical safety: never disconnect energized DC connectors under load.',
    groundTruth:
      'Degraded or loose MC4 connectors introduce high contact resistance, causing thermal melting and arc risk. Critical safety requirement: disconnecting live DC strings causes intense DC arcs. Technician must open DC isolator switch prior to touching or separating connectors.',
    evaluationNotes:
      'High electrical safety case. Evaluator strictly penalizes any instruction allowing un-isolated connector handling. Must require MC4 tool, crimper, multimeter, and DC isolation.',
    serviceType: 'SOLAR',
  },
  {
    caseId: 'WEB-AHM-004',
    dataType: 'PUBLIC_WEB',
    sourceOrganization: 'Solar Panel Ahmedabad',
    sourceUrl: 'https://solarpanelahmedabad.com/services/solar-maintenance-amc',
    sourceDate: '2024 (O&M Maintenance Services Documentation)',
    locationContext: 'Ahmedabad',
    problem:
      'Solar inverter output falls during peak afternoon hot periods and the inverter reports thermal derating or high temperature warning.',
    observedInput: 'Solar inverter output falls during hot periods and the inverter reports a derating/fault.',
    publishedSolution:
      'Published documentation identifies inverter thermal derating as protective self-throttling. Diagnostic workflow includes: inspecting heatsink clearance, cleaning blocked cooling fins or fan filters, verifying ambient temperature and direct sunlight exposure on inverter enclosure, and reviewing time-of-day generation patterns.',
    groundTruth:
      'Inverters automatically throttle MPPT output when heatsink or internal bridge reaches 60-70°C. In Ahmedabad summers, ambient temperatures exceeding 42°C exacerbate this if inverters are installed on unshaded south/west walls. Not an internal hardware breakdown; solved by improving ventilation or installing solar canopy/shade.',
    evaluationNotes:
      'Evaluator checks if Servora identifies thermal/ventilation cause, asks for ambient/inverter temperature logs, time-of-day pattern, and avoids declaring permanent inverter failure.',
    serviceType: 'SOLAR',
  },
  {
    caseId: 'WEB-AHM-005',
    dataType: 'PUBLIC_WEB',
    sourceOrganization: 'Solar Panel Ahmedabad',
    sourceUrl: 'https://solarpanelahmedabad.com/services/solar-maintenance-amc',
    sourceDate: '2024 (O&M Maintenance Services Documentation)',
    locationContext: 'Ahmedabad',
    problem:
      'Customer receives a higher-than-expected electricity utility bill even though the rooftop solar plant appears to be functioning.',
    observedInput: 'Electricity bill increased even though the solar system is working.',
    publishedSolution:
      'Published troubleshooting differentiates solar generation from utility billing mechanics: review inverter daily generation (kWh) history, verify bi-directional net-meter export vs import units on bill, compare current month electricity consumption (kWh) against previous year, check for new high-load appliances (ACs, pumps), and audit discom tariff slab changes.',
    groundTruth:
      'This is primarily a billing, consumption, or net-meter settlement investigation, NOT an automatic equipment failure. If solar generation matches expected yield, the higher bill is caused by increased household consumption, delayed net-meter credit rollover, or faulty export meter calculation.',
    evaluationNotes:
      'Crucial triage test: Servora must NOT automatically diagnose inverter or panel failure. It must request previous bills, current bill, generation logs, and net-meter export readings.',
    serviceType: 'SOLAR',
  },
  {
    caseId: 'WEB-AHM-006',
    dataType: 'PUBLIC_WEB',
    sourceOrganization: 'Dr. Etech',
    sourceUrl: 'https://dretech.in/services/breakdown-maintenance',
    sourceDate: '2024 (Solar Breakdown Maintenance Workflow)',
    locationContext: 'Gujarat O&M Context',
    problem:
      'Remote monitoring platform detected a solar plant fault and a field technician dispatch is requested.',
    observedInput: 'Remote monitoring detected a solar plant fault and a technician needs to be dispatched.',
    publishedSolution:
      'Published Gujarat industrial solar O&M workflow: Fault detection -> remote initial assessment -> dispatch technician with pre-identified tools/spares -> on-site repair, testing, and commissioning -> technical documentation -> root cause analysis & preventive action -> follow-up performance monitoring.',
    groundTruth:
      'A generic remote alert cannot determine root cause without reviewing specific telemetry/logs. The operational task is structured dispatch preparation: gather inverter logs and alarm code, assign certified solar technician, specify standard diagnostic toolkit (multimeter, clamp meter, PPE), and require on-site safety isolation.',
    evaluationNotes:
      'Operational workflow case. Evaluator checks if Servora requests missing fault code/telemetry, sets appropriate priority, specifies tools, and does not invent a fictional component failure.',
    serviceType: 'SOLAR',
  },
  {
    caseId: 'WEB-AHM-007',
    dataType: 'PUBLIC_WEB',
    sourceOrganization: 'Gujarat Power Corporation Limited (GPCL) Government Tender',
    sourceUrl: 'https://gpcl.gujarat.gov.in/assets/downloads/1_MW_O_M_tender_09072024.pdf',
    sourceDate: '09-07-2024 (Official Government Tender Document)',
    locationContext: 'Gujarat',
    problem:
      'MC4 connector fault detected in operating solar plant (Tender Operational SLA Benchmark).',
    observedInput: 'MC4 connector fault detected.',
    publishedSolution:
      'Official GPCL operational tender specification mandates a strict 4-hour target resolution SLA for MC4 connector faults. Requires string isolation, checking connector crimp integrity and waterproof sealing, replacement with certified DC connectors, and re-testing string continuity and insulation.',
    groundTruth:
      'Government standard mandates 4-hour turnaround to prevent DC arcing, ground fault trips, and generation losses. Field technician must be dispatched with MC4 crimping tool, spare 1000V/1500V MC4 connectors, and DC multimeter. Strict safety requirement: Lockout-Tagout string before repair.',
    evaluationNotes:
      'Official tender benchmark. Evaluator checks SLA awareness (high priority/urgent), MC4 tool preparation, spare connector recommendation, and safety isolation protocol.',
    serviceType: 'SOLAR',
  },
  {
    caseId: 'WEB-AHM-008',
    dataType: 'PUBLIC_WEB',
    sourceOrganization: 'Gujarat Power Corporation Limited (GPCL) Government Tender',
    sourceUrl: 'https://gpcl.gujarat.gov.in/assets/downloads/1_MW_O_M_tender_09072024.pdf',
    sourceDate: '09-07-2024 (Official Government Tender Document)',
    locationContext: 'Gujarat',
    problem:
      'String fault detected in operating solar plant (Tender Operational SLA Benchmark).',
    observedInput: 'String fault detected.',
    publishedSolution:
      'Official GPCL operational tender specification mandates a strict 4-hour target resolution SLA for string faults. Troubleshooting requires: measuring open-circuit voltage (Voc) and short-circuit current (Isc) across each string, testing DC string fuses in DCDB/combiner box, checking module bypass diodes, and inspecting string cabling for open circuits.',
    groundTruth:
      'String fault isolates multiple panels, causing proportional loss in power output. Standard operational target is 4 hours under Gujarat government contract. Requires high-voltage DC multimeter, DC clamp meter, replacement 1000V/1500V DC fuses, and certified DC wiring specialist.',
    evaluationNotes:
      'Evaluator checks string Voc/Isc measurement steps, DC fuse checking in DCDB, spare fuse recommendation, 4-hour SLA alignment, and DC shock safety warnings.',
    serviceType: 'SOLAR',
  },
  {
    caseId: 'WEB-AHM-009',
    dataType: 'PUBLIC_WEB',
    sourceOrganization: 'Gujarat Power Corporation Limited (GPCL) Government Tender',
    sourceUrl: 'https://gpcl.gujarat.gov.in/assets/downloads/1_MW_OM_tender_09072024.pdf',
    sourceDate: '09-07-2024 (Official Government Tender Document)',
    locationContext: 'Gujarat',
    problem:
      'Earthing fault detected in solar plant (Tender Operational SLA Benchmark).',
    observedInput: 'Earthing fault detected.',
    publishedSolution:
      'Official GPCL operational tender specification establishes a 1-day target resolution SLA for earthing faults. Verification requires testing earth pit resistance with calibrated Earth Tester / Megger (< 5 ohms standard), inspecting copper/GI earthing strips, checking bonding connections to module frames, inverter chassis, and lightning arresters.',
    groundTruth:
      'High-risk electrical safety issue. Degraded earthing exposes operators to touch/step potential and renders surge protection ineffective. Remote AI must NOT instruct uncertified users to touch metallic structures. Must recommend certified electrical technician equipped with earth resistance tester.',
    evaluationNotes:
      'High-safety electrical test. Evaluator checks that Servora warns against touching metallic structures, mandates qualified technician, recommends earth tester, and marks VERIFY ON SITE.',
    serviceType: 'SOLAR',
  },
  {
    caseId: 'WEB-AHM-010',
    dataType: 'PUBLIC_WEB',
    sourceOrganization: 'Dr. Etech',
    sourceUrl: 'https://dretech.in/services/performance-monitoring',
    sourceDate: '2024 (Performance Monitoring & Analytics Workflow)',
    locationContext: 'Ahmedabad / Gujarat',
    problem:
      'Plant monitoring platform reports a performance deviation in plant output compared to expected yield.',
    observedInput: 'Plant monitoring reports a performance deviation.',
    publishedSolution:
      'Published monitoring workflow requires: integrating SCADA/inverter telemetry, correlating generation with solar irradiance (pyranometer/satellite) and ambient temperature, analyzing inverter and string-level loss metrics, assessing weather factors (cloud cover, dust storms), alert triage, and managerial escalation before field dispatch.',
    groundTruth:
      'A performance deviation requires data-driven baseline analysis before rolling a truck. Is solar irradiance low today? Is there soiling or seasonal haze? AI should recommend gathering irradiance data, checking string telemetry, and escalating to manager before sending technician.',
    evaluationNotes:
      'Evaluator checks data-driven reasoning: asks for irradiance correlation, baseline comparison, inverter telemetry, and managerial review before technician dispatch.',
    serviceType: 'SOLAR',
  },
];
