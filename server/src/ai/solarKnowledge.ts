export interface SolarKnowledgeItem {
  id: string;
  category: 'INVERTER' | 'PANEL' | 'DC_WIRING' | 'AC_WIRING' | 'MONITORING' | 'BATTERY' | 'ISOLATION';
  title: string;
  keywords: string[];
  possibleCauses: string[];
  diagnosticSteps: string[];
  recommendedTools: string[];
  possibleParts: string[];
  safetyWarnings: string[];
}

export const solarKnowledgeBase: SolarKnowledgeItem[] = [
  {
    id: 'sol-inv-err-04',
    category: 'INVERTER',
    title: 'Inverter Grid Voltage / Frequency Disconnect or Fault (Error 04 / F04)',
    keywords: ['error 04', 'f04', 'grid fault', 'voltage trip', 'grid disconnected', 'generation stopped'],
    possibleCauses: [
      'AC grid over-voltage or under-voltage beyond inverter protection threshold',
      'Loose AC wiring connection at bidirectional meter or main distribution board',
      'Blown AC surge protection device (SPD) or tripped AC miniature circuit breaker (MCB)',
      'Internal inverter AC filter / relay board failure',
    ],
    diagnosticSteps: [
      'Measure AC voltage between Phase and Neutral at inverter terminals with calibrated multimeter',
      'Check AC voltage between Neutral and Earth (should normally be < 3V AC)',
      'Inspect AC distribution box (ACDB) breakers and surge protectors for trip indicators',
      'Check inverter event log for historical grid voltage fluctuations during peak sunshine hours',
      'Verify AC terminal screw torque tightness to prevent resistive heating',
    ],
    recommendedTools: ['MULTIMETER', 'CLAMP_METER', 'SCREWDRIVER_SET', 'TORQUE_WRENCH'],
    possibleParts: ['AC MCB (32A/63A)', 'AC Surge Protection Device (SPD)', 'Heavy-duty Copper Lugs'],
    safetyWarnings: [
      'Turn OFF both AC isolator and DC disconnect switch before inspecting internal terminal blocks.',
      'Always verify circuit de-energization with a proven two-pole voltage detector.',
    ],
  },
  {
    id: 'sol-dc-zero-gen',
    category: 'DC_WIRING',
    title: 'Zero Generation / Inverter Display Dark or Low DC Input',
    keywords: ['zero generation', 'not generating', 'inverter dark', 'no power', 'generation dropped to zero', 'dc disconnect'],
    possibleCauses: [
      'Loose or burnt MC4 connector on primary DC string line',
      'Blown DC string fuse inside DC Distribution Box (DCDB)',
      'Open circuit in string cabling caused by rodent damage or mechanical abrasion',
      'DC rotary isolator switch contact failure or melted terminal',
    ],
    diagnosticSteps: [
      'Measure open-circuit string voltage (Voc) at DCDB test points using high-voltage DC multimeter',
      'Compare measured string Voc with theoretical panel calculation (Voc_per_panel * panels_in_series)',
      'Inspect all accessible roof MC4 connectors for scorch marks, corrosion, or improper crimping',
      'Test continuity of DC string fuses with multimeter set to ohms/continuity mode',
      'Check DC isolator switch for high contact resistance under sunlight',
    ],
    recommendedTools: ['MULTIMETER', 'CLAMP_METER', 'MC4_TOOL', 'CRIMPING_TOOL', 'DC_TESTER'],
    possibleParts: ['1000V DC MC4 Connectors (Male/Female pair)', '1000V DC Fuse 15A/20A', '4 sq mm Solar DC Cable'],
    safetyWarnings: [
      'Solar panels generate lethal DC voltage as long as sunlight is present; DC circuits cannot be turned off at the source.',
      'NEVER disconnect an MC4 connector while current is actively flowing; DC arcs can cause severe flash burns.',
    ],
  },
  {
    id: 'sol-iso-ground-fault',
    category: 'ISOLATION',
    title: 'Inverter Isolation Fault / Ground Resistance Low (Error 02 / ISO Fault)',
    keywords: ['isolation', 'ground fault', 'iso error', 'error 02', 'earth fault', 'insulation low'],
    possibleCauses: [
      'Damaged DC cable insulation touching metallic roof structure or solar mounting rail',
      'Water ingress inside rooftop junction box or poorly sealed MC4 connector',
      'Degraded panel backsheet allowing moisture path between cell circuit and grounded frame',
      'Inadequate or loose chemical earthing electrode connection',
    ],
    diagnosticSteps: [
      'Disconnect DC strings from inverter and measure insulation resistance (Megger test) between DC+ to Ground and DC- to Ground',
      'Visually inspect roof cable trays and module clamps where cables may be pinched or chafed against sharp galvanized edges',
      'Check all combiner boxes and module junction boxes for accumulated rainwater or condensation',
      'Test earth pit resistance using earth tester (< 5 ohms recommended for residential/commercial installations)',
    ],
    recommendedTools: ['INSULATION_TESTER', 'MULTIMETER', 'CLAMP_METER', 'SCREWDRIVER_SET'],
    possibleParts: ['Weatherproof Junction Box (IP65)', 'UV-resistant Conduit / Cable Sleeving', 'MC4 Waterproof Caps'],
    safetyWarnings: [
      'Perform Megger test only with all inverter inputs safely disconnected to prevent damaging internal electronics.',
      'Ground fault condition may energize module frames; do not touch metal racking with bare hands without testing first.',
    ],
  },
  {
    id: 'sol-low-gen-shading',
    category: 'PANEL',
    title: 'Generation Significantly Lower than Nominal Capacity (Partial Output)',
    keywords: ['low generation', 'generation lower', 'partial generation', 'drop in units', 'poor performance'],
    possibleCauses: [
      'Heavy dust, soot, or bird droppings on panels causing hot-spot or bypass diode conduction',
      'One bypass diode short-circuited inside solar panel junction box',
      'One complete string offline while second string is operating normally',
      'Inverter maximum power point tracker (MPPT) operating in derated thermal mode due to clogged heatsink',
    ],
    diagnosticSteps: [
      'Measure operating DC current (Imp) across each string using DC clamp meter under clear sunshine',
      'Inspect module front glass for heavy localized soiling or physical microcracks',
      'Inspect panel rear side with thermal imager or infrared thermometer to detect hot-spot cells',
      'Inspect inverter aluminum heat sink fins for dust buildup or fan blockage',
      'Compare daily generation curve in monitoring app with adjacent sunny days',
    ],
    recommendedTools: ['CLAMP_METER', 'MULTIMETER', 'THERMAL_IMAGER', 'PRESSURE_WASHER'],
    possibleParts: ['Schottky Bypass Diode 15A/45V', 'Cleaning Wiper Kit', 'Inverter Cooling Fan'],
    safetyWarnings: [
      'Clean panels only during early morning or late afternoon when panels are cool to avoid thermal shock glass breakage.',
    ],
  },
  {
    id: 'sol-mon-comm-failure',
    category: 'MONITORING',
    title: 'Monitoring Portal Offline / Communication Stick Disconnected',
    keywords: ['monitoring', 'wifi stick', 'portal offline', 'app not updating', 'communication error', 'rs485'],
    possibleCauses: [
      'Customer Wi-Fi router password changed or signal degraded at inverter location',
      'Inverter Wi-Fi/4G datalogger stick hung or loose USB/RS485 connection',
      'Datalogger firmware corrupted or cloud server synchronization delay',
    ],
    diagnosticSteps: [
      'Verify status LEDs on Wi-Fi data stick (Power, Net, Inverter link)',
      'Reseat Wi-Fi datalogger into inverter RS485/USB port and tighten locking ring',
      'Check Wi-Fi signal strength at inverter location using smartphone (minimum 2 bars required)',
      'Re-provision Wi-Fi credentials via configuration AP mode using manufacturer installer tool',
    ],
    recommendedTools: ['MULTIMETER', 'SCREWDRIVER_SET'],
    possibleParts: ['Wi-Fi Datalogger Stick', 'Wi-Fi Range Extender / Repeater', 'RS485 Communication Cable'],
    safetyWarnings: [
      'Ensure dry hands and safe ladder positioning when reaching high-mounted inverters.',
    ],
  },
  {
    id: 'sol-grid-lost-fault',
    category: 'INVERTER',
    title: 'Inverter Grid Lost Fault / Utility Disconnect (Solaryaan Support Benchmark)',
    keywords: ['grid lost', 'grid lost fault', 'grid fault', 'f04', 'error 04', 'grid disconnect', 'grid high voltage'],
    possibleCauses: [
      'Utility AC grid blackout, phase outage, or frequency outside inverter synchronization window',
      'High neutral-to-earth floating voltage (> 3V AC) caused by degraded utility transformer or loose neutral',
      'Blown AC Surge Protection Device (SPD) or tripped AC miniature circuit breaker (MCB) in ACDB',
      'Loose AC wiring terminal screw connection at bi-directional net meter or main distribution board',
    ],
    diagnosticSteps: [
      'Measure Phase-to-Neutral AC voltage at inverter AC terminals with calibrated true-RMS multimeter',
      'Measure Neutral-to-Earth floating voltage (must strictly be < 3V AC for stable inverter grid sync)',
      'Measure Phase-to-Earth voltage to verify symmetrical utility power supply',
      'Inspect ACDB breakers, fuses, and AC Surge Protection Device (SPD) flag indicators for trip state',
      'Check DCDB and solar array DC floating voltages to confirm array DC isolation',
      'Review inverter event log for historical utility grid under/over-voltage events during peak hours',
    ],
    recommendedTools: ['MULTIMETER', 'CLAMP_METER', 'SCREWDRIVER_SET', 'VOLTAGE_DETECTOR'],
    possibleParts: ['AC Surge Protection Device (SPD)', 'AC MCB / MCCB (32A/63A)', 'Heavy-duty Copper Lugs'],
    safetyWarnings: [
      'Turn OFF both AC isolator and DC disconnect switch before inspecting internal terminal blocks. VERIFY ON SITE.',
      'Always test de-energization with a calibrated two-pole voltage detector before touching electrical terminals.',
    ],
  },
  {
    id: 'sol-hot-derating',
    category: 'INVERTER',
    title: 'Solar Inverter Output Thermal Derating during Hot Periods (Solar Panel Ahmedabad Benchmark)',
    keywords: ['hot periods', 'derating', 'hot', 'thermal', 'inverter temperature', 'temperature high', 'output falls during hot'],
    possibleCauses: [
      'Inverter internal bridge/heatsink reached thermal threshold (> 60°C), triggering protective MPPT derating',
      'Inadequate heatsink clearance, direct unshaded sunlight on inverter enclosure, or poor ambient ventilation',
      'Cooling fan failed or heatsink fins clogged with airborne dust/debris (Ahmedabad summer ambient > 42°C)',
    ],
    diagnosticSteps: [
      'Inspect inverter ambient installation location for direct sunlight exposure during peak afternoon hours',
      'Check clearance around inverter heatsink (minimum 300mm top/bottom and 200mm sides required)',
      'Clean heatsink aluminum fins and inspect cooling fan rotation under full operational load',
      'Review inverter internal temperature logs and generation vs time-of-day profile',
      'Consider installing a ventilated canopy or sunshade over inverter outdoor enclosure',
    ],
    recommendedTools: ['THERMOMETER', 'MULTIMETER', 'CLEANING_BRUSH', 'AIR_BLOWER'],
    possibleParts: ['Inverter External Fan Kit', 'Solar Inverter Canopy / Sunshield'],
    safetyWarnings: [
      'Inverter heatsink can exceed 70°C during peak operation; allow unit to cool before touching. VERIFY ON SITE.',
    ],
  },
  {
    id: 'sol-net-meter-billing',
    category: 'MONITORING',
    title: 'Electricity Bill Increase Audit vs Solar Generation (Solar Panel Ahmedabad Benchmark)',
    keywords: ['bill increased', 'electricity bill', 'bill higher', 'bill problem', 'net meter', 'tariff', 'consumption'],
    possibleCauses: [
      'Increased household/commercial energy consumption (e.g. additional air conditioners, pumps, EV charging)',
      'Discom utility tariff slab changes, delayed net-meter credit rollover, or peak-hour billing adjustment',
      'Bi-directional net-meter recording discrepancy or failure to record export units accurately',
      'Solar inverter generation partially curtailed or string offline while system appears superficially active',
    ],
    diagnosticSteps: [
      'Collect previous 6 months electricity bills and compare monthly total kWh consumption history',
      'Audit inverter total cumulative kWh generation against bi-directional net-meter export reading',
      'Verify DISCOM tariff bill calculation, fixed charges, and solar adjustment credit line',
      'Conduct customer load survey to identify new heavy electrical loads installed during billing cycle',
      'Only schedule on-site physical dispatch if inverter generation log proves drop in physical generation',
    ],
    recommendedTools: ['MULTIMETER', 'CLAMP_METER'],
    possibleParts: ['Bi-directional Net Meter (Discom replacement request)'],
    safetyWarnings: [
      'Do not dismantle utility revenue net-meter; meter seal tampering is a legal and electrical violation. VERIFY ON SITE.',
    ],
  },
  {
    id: 'sol-mc4-sla-4hr',
    category: 'DC_WIRING',
    title: 'MC4 Connector Fault / Heating Degradation (GPCL Tender 4-Hour SLA Benchmark)',
    keywords: ['mc4 connector', 'connector problem', 'mc4 fault', 'connector fault', 'mc4 degradation'],
    possibleCauses: [
      'High contact resistance in loose, corroded, or poorly crimped MC4 connector pair',
      'Thermal degradation / melting of connector plastic casing from resistive I^2R heating',
      'Mismatched connector brands (cross-mating different manufacturers causes micro-arcing)',
    ],
    diagnosticSteps: [
      'Perform string isolation and visual inspection for scorch marks or heat deformation',
      'Check connector temperatures under sunlight using thermal imaging / infrared probe',
      'Measure string Voc open-circuit voltage and continuity before and after connection',
      'Cut degraded connector and crimp certified 1000V/1500V MC4 using ratcheting MC4 crimper',
      'Target resolution within 4 hours to comply with Gujarat government O&M contract standards',
    ],
    recommendedTools: ['MC4_TOOL', 'CRIMPING_TOOL', 'MULTIMETER', 'CLAMP_METER', 'THERMAL_IMAGER'],
    possibleParts: ['1000V/1500V MC4 Connectors (Male/Female pair)', 'Solar DC Cable 4/6 sq mm'],
    safetyWarnings: [
      'NEVER disconnect MC4 connectors while DC string current is flowing. DC arcs cause severe flash burns. VERIFY ON SITE.',
      'Isolate DC disconnect switch and verify zero current with clamp meter before opening connections.',
    ],
  },
  {
    id: 'sol-string-fault-sla',
    category: 'DC_WIRING',
    title: 'String Fault / Low String Output (GPCL Tender 4-Hour SLA Benchmark)',
    keywords: ['string fault', 'string problem', 'string offline', 'string disconnected'],
    possibleCauses: [
      'Blown 1000V/1500V gPV DC string fuse inside DC combiner box / DCDB',
      'Open circuit in solar string caused by cable abrasion, rodent cut, or loose MC4 joint',
      'Bypass diode short-circuited or open in solar panel junction box',
      'Single module string ground fault tripping DC input',
    ],
    diagnosticSteps: [
      'Measure open-circuit voltage (Voc) of affected string at DCDB test terminals',
      'Compare measured Voc against theoretical string formula (Voc_module * number_of_modules)',
      'Test continuity of DC string fuses with multimeter in continuity mode',
      'Measure operating string current (Isc/Imp) using DC clamp meter under full irradiance',
      'Resolve within 4-hour SLA benchmark to restore full plant generation capacity',
    ],
    recommendedTools: ['MULTIMETER', 'CLAMP_METER', 'MC4_TOOL', 'SCREWDRIVER_SET'],
    possibleParts: ['1000V/1500V 15A/20A gPV Solar DC Fuses', 'MC4 Connectors', '4 sq mm DC Solar Cable'],
    safetyWarnings: [
      'High DC string voltages (up to 1000V/1500V DC) are present even under cloudy skies. VERIFY ON SITE.',
      'Wear arc-rated gloves and eye protection when testing DC combiner boxes.',
    ],
  },
  {
    id: 'sol-earthing-fault-sla',
    category: 'ISOLATION',
    title: 'Solar Earthing Fault / Ground Electrode Degradation (GPCL Tender 1-Day SLA Benchmark)',
    keywords: ['earthing fault', 'earth fault', 'earthing problem', 'ground fault detected', 'earth resistance high'],
    possibleCauses: [
      'Chemical earth pit resistance exceeded allowable limit (> 5 ohms) due to dry soil',
      'Loose or severed GI/copper earthing strip connection to solar structure or inverter frame',
      'Lightning surge arrester (LA) down-conductor bonding disconnected',
      'DC or AC phase cable insulation breakdown leaking current to metallic frame',
    ],
    diagnosticSteps: [
      'Measure earth pit electrode resistance using 3-point or 4-point Earth Resistance Tester / Megger',
      'Verify earth pit resistance is strictly < 5 ohms (as required by Gujarat O&M tenders and CEA regulations)',
      'Inspect physical bonding of copper/GI earthing strips from inverter, ACDB, DCDB, and module frames',
      'Test earth pit moisture level and recharge with chemical compound / salt-charcoal if resistance is high',
      'Achieve resolution within 1-day SLA benchmark to protect human operators from shock hazards',
    ],
    recommendedTools: ['EARTH_TESTER', 'INSULATION_TESTER', 'MULTIMETER', 'WRENCH_SET'],
    possibleParts: ['Chemical Earthing Compound / Bentonite', 'Copper Earthing Lugs & Fasteners', 'GI Earthing Strip'],
    safetyWarnings: [
      'HIGH RISK ELECTRICAL HAZARD. Faulty earthing can energize metallic mounting structures. VERIFY ON SITE.',
      'Do not touch metallic solar structures with bare hands. Work must be performed by certified electrical wireman.',
    ],
  },
  {
    id: 'sol-plant-monitoring-dev',
    category: 'MONITORING',
    title: 'Solar Plant Performance Deviation / Irradiance Loss Analysis (Dr. Etech Benchmark)',
    keywords: ['performance deviation', 'plant monitoring', 'deviation', 'scada monitoring', 'monitoring deviation'],
    possibleCauses: [
      'Reduction in solar irradiance due to cloud cover, seasonal haze, or local air pollution',
      'Heavy surface soiling / dust accumulation across solar array',
      'Inverter clipping, thermal derating, or sub-string disconnect',
      'SCADA communication sensor calibration drift or pyranometer fouling',
    ],
    diagnosticSteps: [
      'Correlate real-time solar generation against local solar irradiance (W/m2) from pyranometer or satellite',
      'Calculate Performance Ratio (PR) and Specific Yield (kWh/kWp) for current operational window',
      'Compare inverter string-level currents to detect whether deviation is plant-wide or localized',
      'Audit plant soiling index before recommending physical maintenance dispatch',
      'Escalate to operations manager for data review prior to scheduling physical technician visit',
    ],
    recommendedTools: ['MULTIMETER', 'CLAMP_METER', 'PYRANOMETER'],
    possibleParts: ['SCADA Communication Module', 'Pyranometer Sensor'],
    safetyWarnings: [
      'Perform data-driven triage remotely before rolling service trucks. VERIFY ON SITE when inspecting array.',
    ],
  },
  {
    id: 'sol-breakdown-dispatch',
    category: 'INVERTER',
    title: 'Industrial Solar Breakdown Maintenance & Structured Dispatch (Dr. Etech Benchmark)',
    keywords: ['plant fault', 'technician needs to be dispatched', 'breakdown maintenance', 'remote monitoring detected'],
    possibleCauses: [
      'Unspecified solar plant breakdown alert requiring systematic initial assessment',
      'Inverter tripped on internal or external electrical anomaly',
      'Grid synchronization failure or protective relay actuation',
    ],
    diagnosticSteps: [
      'Execute Stage 1 Remote Assessment: retrieve exact inverter error code, alarm timestamp, and generation log',
      'Stage 2 Dispatch Preparation: identify required certified technician, tools, and anticipated spares',
      'Stage 3 On-Site Execution: follow Lockout-Tagout (LOTO), measure DC/AC voltages, perform repair',
      'Stage 4 Commissioning: verify inverter restart and synchronized export power',
      'Stage 5 Documentation: record root cause, replace component, and schedule follow-up monitoring',
    ],
    recommendedTools: ['MULTIMETER', 'CLAMP_METER', 'SCREWDRIVER_SET', 'MC4_TOOL'],
    possibleParts: ['AC MCB', 'DC String Fuses', 'MC4 Connectors'],
    safetyWarnings: [
      'Do not dispatch technicians without identifying plant single-line diagram and safety hazards. VERIFY ON SITE.',
    ],
  },
];

