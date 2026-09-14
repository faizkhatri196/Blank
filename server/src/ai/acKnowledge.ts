export interface ACKnowledgeItem {
  id: string;
  category: 'COOLING' | 'ELECTRICAL' | 'REFRIGERANT' | 'DRAINAGE' | 'COMPRESSOR' | 'PCB' | 'FAN';
  title: string;
  keywords: string[];
  possibleCauses: string[];
  diagnosticSteps: string[];
  recommendedTools: string[];
  possibleParts: string[];
  safetyWarnings: string[];
}

export const acKnowledgeBase: ACKnowledgeItem[] = [
  {
    id: 'ac-not-cooling-split',
    category: 'COOLING',
    title: 'Split AC Running but Not Cooling (Blowing Ambient Air)',
    keywords: ['not cooling', 'blowing warm air', 'no cooling', 'cooling stopped', 'warm air'],
    possibleCauses: [
      'Failed outdoor unit compressor run capacitor (e.g. 35uF - 55uF dual run capacitor open)',
      'Refrigerant loss due to pinhole leak at indoor flare joint or outdoor service valve',
      'Outdoor condenser coil heavily choked with road dust/lint preventing heat rejection',
      'Inverter AC outdoor IPM (Intelligent Power Module) / PCB driver trip',
    ],
    diagnosticSteps: [
      'Measure AC voltage at outdoor unit input terminals while indoor unit calls for cooling',
      'Test compressor capacitor capacitance using digital multimeter with capacitance setting (uF)',
      'Connect digital or analog manifold gauge to suction service port to read low-side operating pressure (PSI)',
      'Measure operating current draw (Amps) on compressor phase line using clamp meter and compare with nameplate rated current',
      'Inspect indoor evaporator coil and outdoor condenser coil for heavy dirt or oil residue indicating a leak',
    ],
    recommendedTools: ['MULTIMETER', 'CLAMP_METER', 'MANIFOLD_GAUGE', 'THERMOMETER_INFRARED', 'LEAK_DETECTOR'],
    possibleParts: ['Run Capacitor (45uF/50uF/450V)', 'R32 / R410A Refrigerant Canister', 'Compressor Contactor Relay'],
    safetyWarnings: [
      'High-pressure refrigerant lines: never unscrew service port caps without verifying valve seating.',
      'Capacitors retain dangerous charge: discharge terminals with a 20k ohm 5W resistor before probing with bare hands.',
      'Moving outdoor fan blades: ensure unit is powered down before working near fan shroud.',
    ],
  },
  {
    id: 'ac-water-leakage-indoor',
    category: 'DRAINAGE',
    title: 'Indoor Unit Water Dripping / Overflowing Down Wall',
    keywords: ['water leak', 'dripping', 'water leakage', 'water overflow', 'water dripping from indoor'],
    possibleCauses: [
      'Drainage pipe clogged with slime, fungal growth, or dust sediment',
      'Drain hose slope reversed or kinked behind wall mounting bracket',
      'Cracked internal drain tray or disconnected condensate drain nipple',
      'Ice melting rapidly on evaporator coil due to low refrigerant or choked filter',
    ],
    diagnosticSteps: [
      'Remove front decorative grill and inspect condensate collection pan for water overflow',
      'Pour 500ml of clean water into the drain pan and check for smooth drainage at outdoor discharge point',
      'Use pressurized nitrogen, hand pump, or wet vacuum to clear blockage from drain line',
      'Inspect copper suction pipe insulation inside wall hole for condensed water sweat dripping',
      'Check if evaporator coil has frost or ice accumulation (symptom of choked filter or low gas)',
    ],
    recommendedTools: ['SCREWDRIVER_SET', 'PRESSURE_WASHER', 'THERMOMETER_INFRARED'],
    possibleParts: ['Flexible Condensate Drain Hose (16mm/20mm)', 'Drain Pan Sealing Epoxy', 'Rubber Insulating Tape'],
    safetyWarnings: [
      'Ensure water does not splash onto the indoor display PCB or terminal block.',
      'Keep electrical power isolated while removing and washing plastic front filters.',
    ],
  },
  {
    id: 'ac-compressor-tripping',
    category: 'COMPRESSOR',
    title: 'Compressor Starts then Trips After 2-5 Minutes (Short Cycling)',
    keywords: ['trips', 'compressor trip', 'stops after 2 minutes', 'overload', 'short cycling', 'thermal trip'],
    possibleCauses: [
      'Outdoor fan motor capacitor weak causing high condenser head pressure and thermal overload trip',
      'Severe low line voltage (< 195V AC) under summer neighborhood peak load',
      'Compressor internal thermal protector (OLP) opening due to low refrigerant suction cooling',
      'Capillary tube or electronic expansion valve (EEV) partial restriction',
    ],
    diagnosticSteps: [
      'Observe outdoor fan rotation speed and listen for compressor struggle or hum before trip',
      'Check outdoor fan run capacitor (typically 2.5uF - 4uF)',
      'Measure continuous line voltage at compressor terminal during startup and run phases',
      'Monitor suction pressure and discharge pipe temperature during the 2-3 minutes of run time',
      'Check compressor winding resistance between Common, Run, and Start (C-R, C-S, R-S) for internal short or balance',
    ],
    recommendedTools: ['MULTIMETER', 'CLAMP_METER', 'MANIFOLD_GAUGE', 'THERMOMETER_INFRARED'],
    possibleParts: ['Outdoor Fan Motor Capacitor (2.5uF/3uF)', 'External Overload Protector (OLP)', 'Inverter Outdoor PCB'],
    safetyWarnings: [
      'Compressor casing can reach temperatures above 90°C; avoid bare skin contact to prevent burns.',
      'Wait at least 3 minutes before restarting after a trip to allow refrigerant pressures to equalize.',
    ],
  },
  {
    id: 'ac-ice-formation-pipes',
    category: 'REFRIGERANT',
    title: 'Ice Formation on Thin/Thick Copper Pipes or Evaporator Coil',
    keywords: ['ice formation', 'frost on pipe', 'copper pipe white', 'frozen coil', 'ice on indoor'],
    possibleCauses: [
      'Low refrigerant level causing evaporating temperature to drop below 0°C (freezing point)',
      'Severely choked indoor air filters or blower wheel preventing heat absorption from room air',
      'Indoor blower motor speed low due to weak fan capacitor or clogged blower fan bearings',
    ],
    diagnosticSteps: [
      'Inspect indoor mesh filters; if choked with dust, clean immediately and test air throw',
      'Inspect blower wheel blades for lint crust reducing CFM air volume',
      'Measure suction line operating pressure with manifold gauge while unit is running at max cooling',
      'Apply electronic leak detector or soapy water bubble solution to all flare nuts and service valves',
      'Measure air temperature difference (Delta T) across indoor inlet and return grille (should be 8°C - 12°C)',
    ],
    recommendedTools: ['MANIFOLD_GAUGE', 'LEAK_DETECTOR', 'THERMOMETER_INFRARED', 'CLAMP_METER', 'FLARING_TOOL'],
    possibleParts: ['Brass Flare Nuts (1/4", 3/8", 1/2")', 'Schrader Service Valve Core', 'R32 / R410A Gas'],
    safetyWarnings: [
      'Allow ice to melt naturally or with warm water; NEVER chip ice with screwdrivers or sharp objects as aluminum fins and copper tubes puncture easily.',
    ],
  },
  {
    id: 'ac-inverter-error-code',
    category: 'PCB',
    title: 'Inverter AC Error Code Blinking (Communication / IPM / Sensor Fault)',
    keywords: ['error code', 'blinking light', 'e6', 'e4', 'f1', 'ch05', 'communication error', 'pcb error'],
    possibleCauses: [
      'Communication wire signal disruption between indoor and outdoor PCB (Signal wire loose/broken)',
      'Outdoor inverter power module (IPM) short-circuit due to lizards, insects, or voltage surge',
      'Defective room ambient or copper coil temperature sensor (thermistor resistance drifted)',
    ],
    diagnosticSteps: [
      'Identify brand-specific error code from manufacturer diagnostic chart or indoor LED blink count',
      'Measure DC pulse voltage between Terminal 1/2 and Signal terminal (S) with multimeter (should fluctuate ~0-24V DC)',
      'Disconnect power, pull temperature sensor plugs and measure thermistor resistance in kilo-ohms (kΩ) at room temperature',
      'Inspect outdoor PCB conformal coating for burnt traces, carbon soot, or gecko/lizard electrocution marks',
    ],
    recommendedTools: ['MULTIMETER', 'SCREWDRIVER_SET', 'CLAMP_METER'],
    possibleParts: ['Coil Temperature Sensor Thermistor (5kΩ/10kΩ)', 'Universal Inverter Outdoor PCB Kit', 'Shielded 4-core Signal Cable'],
    safetyWarnings: [
      'High-voltage DC rail on inverter outdoor PCBs remains charged at 300V-400V DC for several minutes after AC power is cut.',
      'Always use static-safe handling when touching sensitive electronic microprocessor boards.',
    ],
  },
];
