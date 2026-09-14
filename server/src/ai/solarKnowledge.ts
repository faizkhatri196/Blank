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
];
