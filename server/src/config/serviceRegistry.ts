import { ServiceType, CustomerProblemCard } from '../types';
import { solarConfig } from './serviceConfigs/solarConfig';
import { acConfig } from './serviceConfigs/acConfig';

export interface ServiceDefinition {
  serviceType: ServiceType;
  displayName: string;
  shortDescription: string;
  icon: string;
  heroImage: string;
  ticketPrefix: string;
  problemCategories: CustomerProblemCard[];
  triageQuestions: Array<{
    id: string;
    question: string;
    options: string[];
  }>;
  allowedEvidenceTypes: Array<'PHOTO' | 'VIDEO' | 'DOCUMENT'>;
  requiredSkills: string[];
  recommendedTools: string[];
  safetyRules: string[];
  readingDefinitions: Record<string, string>;
  customerSafeRoleName: string;
}

export const SOLAR_SERVICE_DEFINITION: ServiceDefinition = {
  serviceType: 'SOLAR',
  displayName: 'Solar Service',
  shortDescription: 'Solar panels, inverter, generation & routine maintenance',
  icon: 'Sun',
  heroImage: '/assets/services/solar-hero.svg',
  ticketPrefix: 'SOL',
  customerSafeRoleName: 'Solar Service Professional',
  problemCategories: [
    {
      code: 'INVERTER_NOT_WORKING',
      title: 'Inverter not working',
      description: 'Your solar inverter is off, dark, or not operating.',
      image: '/assets/problems/solar-inverter.svg',
      alt: 'Solar inverter offline or display dark',
      recommendedEvidence: ['Inverter display screen photo', 'AC/DC distribution box photo'],
    },
    {
      code: 'LOW_GENERATION',
      title: 'Solar generation is low',
      description: 'Solar power generation is lower than usual despite sunny weather.',
      image: '/assets/problems/solar-low-gen.svg',
      alt: 'Solar system producing lower output',
      recommendedEvidence: ['Inverter daily generation screen photo', 'Rooftop solar panel photo'],
    },
    {
      code: 'GENERATION_STOPPED',
      title: 'Solar generation stopped',
      description: 'Solar generation has dropped completely to zero or halted.',
      image: '/assets/problems/solar-stopped.svg',
      alt: 'Solar generation completely halted',
      recommendedEvidence: ['Inverter front panel and LED indicator photo'],
    },
    {
      code: 'INVERTER_ERROR_CODE',
      title: 'Inverter showing an error',
      description: 'Warning light or error code (e.g. F04, Relay, ISO) is displayed.',
      image: '/assets/problems/solar-error.svg',
      alt: 'Inverter displaying an active fault error code',
      recommendedEvidence: ['Close-up photo of the error code on the inverter screen'],
    },
    {
      code: 'PANEL_DAMAGE_DIRT',
      title: 'Panel problem or cleaning',
      description: 'Panel surface is soiled, discolored, or showing physical glass damage.',
      image: '/assets/problems/solar-panels.svg',
      alt: 'Solar panels requiring cleaning or showing damage',
      recommendedEvidence: ['Overview photo of the affected solar panel array'],
    },
    {
      code: 'WIRING_CONNECTOR_ISSUE',
      title: 'Wiring / connector issue',
      description: 'Loose cables, hot MC4 connector, burning odor, or sparking.',
      image: '/assets/problems/solar-wiring.svg',
      alt: 'Solar DC cabling or connector anomaly',
      recommendedEvidence: ['Safe photo of wiring area from a distance (Do not touch wires)'],
    },
    {
      code: 'HIGH_ELECTRICITY_BILL',
      title: 'Electricity bill problem',
      description: 'Electricity bill is unexpectedly high despite solar running.',
      image: '/assets/problems/solar-bill.svg',
      alt: 'Electricity bill and net-meter assessment',
      recommendedEvidence: ['Photo of recent electricity utility bills and net meter'],
    },
    {
      code: 'ROUTINE_MAINTENANCE',
      title: 'Routine maintenance & checkup',
      description: 'Scheduled preventive health check, earthing test, and inspection.',
      image: '/assets/problems/solar-maintenance.svg',
      alt: 'Comprehensive solar system routine checkup',
      recommendedEvidence: ['Photo of complete solar installation area'],
    },
    {
      code: 'SOMETHING_ELSE',
      title: 'Something else',
      description: 'An issue not described in the cards above.',
      image: '/assets/problems/service-other.svg',
      alt: 'Other solar system operational issue',
      recommendedEvidence: ['Photo of the equipment or area of concern'],
    },
    {
      code: 'NOT_SURE_TRIAGE',
      title: "I'm not sure what's wrong",
      description: "We'll ask a few simple questions to understand what might be happening.",
      image: '/assets/problems/service-unsure.svg',
      alt: 'Undetermined solar problem requiring triage assessment',
      recommendedEvidence: ['General photo of the inverter and rooftop setup if safe'],
      triageQuestions: [
        {
          id: 'q_generation',
          question: 'Is your solar system producing electricity normally?',
          options: ['YES', 'NO', "I DON'T KNOW"],
        },
        {
          id: 'q_display',
          question: 'Is the inverter display screen illuminated?',
          options: ['YES', 'NO', "I DON'T KNOW"],
        },
        {
          id: 'q_error',
          question: 'Do you see any warning code or red light on the inverter?',
          options: ['YES', 'NO', "I DON'T KNOW"],
        },
        {
          id: 'q_sudden',
          question: 'Did the problem start suddenly or after a weather/power cut event?',
          options: ['YES', 'NO', "I DON'T KNOW"],
        },
      ],
    },
  ],
  triageQuestions: [
    {
      id: 'q_generation',
      question: 'Is your solar system producing electricity normally?',
      options: ['YES', 'NO', "I DON'T KNOW"],
    },
    {
      id: 'q_display',
      question: 'Is the inverter display screen illuminated?',
      options: ['YES', 'NO', "I DON'T KNOW"],
    },
    {
      id: 'q_error',
      question: 'Do you see any warning code or red light on the inverter?',
      options: ['YES', 'NO', "I DON'T KNOW"],
    },
    {
      id: 'q_sudden',
      question: 'Did the problem start suddenly or after a weather/power cut event?',
      options: ['YES', 'NO', "I DON'T KNOW"],
    },
  ],
  allowedEvidenceTypes: ['PHOTO'],
  requiredSkills: solarConfig.skills,
  recommendedTools: solarConfig.tools,
  safetyRules: [
    'VERIFY ON SITE: Solar DC strings remain energized under sunlight. Customer must never touch conductors.',
    'Do not open high-voltage inverter enclosures or distribution boxes.',
    'Qualified technician must verify zero voltage before touching exposed conductors.',
  ],
  readingDefinitions: {
    dcVoltage: 'DC String Voltage (Voc)',
    dcCurrent: 'DC String Current (Isc)',
    acVoltage: 'AC Grid Phase Voltage (Vac)',
    acCurrent: 'AC Operating Current (Iac)',
    dailyGenerationKWh: 'Daily Energy Generation (kWh)',
  },
};

export const AC_SERVICE_DEFINITION: ServiceDefinition = {
  serviceType: 'AC',
  displayName: 'AC & HVAC Service',
  shortDescription: 'Cooling, water leakage, unusual noise & seasonal maintenance',
  icon: 'Wind',
  heroImage: '/assets/services/ac-hero.svg',
  ticketPrefix: 'AC',
  customerSafeRoleName: 'AC Service Professional',
  problemCategories: [
    {
      code: 'NOT_COOLING',
      title: 'AC not cooling',
      description: 'AC is running but blowing normal or warm air instead of cooling.',
      image: '/assets/problems/ac-not-cooling.svg',
      alt: 'AC blowing warm air / weak cooling',
      recommendedEvidence: ['Photo of indoor AC display showing temperature', 'Outdoor unit if safely accessible'],
    },
    {
      code: 'WATER_LEAKING',
      title: 'Water leaking',
      description: 'Water is dripping or overflowing from the indoor AC unit.',
      image: '/assets/problems/ac-water-leak.svg',
      alt: 'Indoor AC unit dripping or leaking water',
      recommendedEvidence: ['Photo of the indoor unit showing water dripping area'],
    },
    {
      code: 'UNUSUAL_NOISE',
      title: 'AC making unusual noise',
      description: 'Loud rattling, vibrating, humming, or screeching sound.',
      image: '/assets/problems/ac-noise.svg',
      alt: 'AC unit producing abnormal vibration or noise',
      recommendedEvidence: ['Photo of the indoor or outdoor unit location'],
    },
    {
      code: 'NOT_TURNING_ON',
      title: 'AC not turning ON',
      description: 'No power response; indoor unit does not turn on or beep with switch or remote.',
      image: '/assets/problems/ac-power.svg',
      alt: 'Total power failure on AC unit',
      recommendedEvidence: ['Photo of power socket and indoor display panel'],
    },
    {
      code: 'OUTDOOR_UNIT_ISSUE',
      title: 'Outdoor unit problem',
      description: 'Outdoor compressor or fan is not spinning, tripping breaker, or hot.',
      image: '/assets/problems/ac-outdoor.svg',
      alt: 'Outdoor compressor or fan anomaly',
      recommendedEvidence: ['Safe photo of outdoor condenser unit if accessible without risk'],
    },
    {
      code: 'WEAK_AIRFLOW',
      title: 'Weak airflow / blower issue',
      description: 'Air coming out is very slow or louvers are stuck.',
      image: '/assets/problems/ac-airflow.svg',
      alt: 'Indoor unit weak airflow or restricted blower',
      recommendedEvidence: ['Photo of indoor AC front grille and louvers'],
    },
    {
      code: 'BAD_SMELL',
      title: 'Bad smell from AC',
      description: 'Musty, foul, or burning odor coming from AC airflow.',
      image: '/assets/problems/ac-smell.svg',
      alt: 'Unpleasant odor emitted from AC',
      recommendedEvidence: ['Photo of indoor unit and surroundings'],
    },
    {
      code: 'PERIODIC_SERVICE',
      title: 'Deep cleaning & servicing',
      description: 'Seasonal jet-pump wash, filter cleaning, and gas pressure check.',
      image: '/assets/problems/ac-service.svg',
      alt: 'Routine AC seasonal jet servicing and checkup',
      recommendedEvidence: ['Photo of indoor and outdoor units'],
    },
    {
      code: 'SOMETHING_ELSE',
      title: 'Something else',
      description: 'Other AC problem not listed above.',
      image: '/assets/problems/service-other.svg',
      alt: 'Other AC operational issue',
      recommendedEvidence: ['Photo of AC equipment showing issue'],
    },
    {
      code: 'NOT_SURE_TRIAGE',
      title: "I'm not sure what's wrong",
      description: "We'll ask a few simple questions to understand what might be happening.",
      image: '/assets/problems/service-unsure.svg',
      alt: 'Undetermined AC problem requiring triage',
      recommendedEvidence: ['Photo of the indoor AC unit'],
      triageQuestions: [
        {
          id: 'q_power',
          question: 'Is the AC turning on with the power switch or remote?',
          options: ['YES', 'NO', "I DON'T KNOW"],
        },
        {
          id: 'q_air',
          question: 'Is air blowing out of the indoor vents?',
          options: ['YES', 'NO', "I DON'T KNOW"],
        },
        {
          id: 'q_cooling',
          question: 'Is the airflow cool or warm/normal?',
          options: ['COOL', 'WARM / NORMAL', "I DON'T KNOW"],
        },
        {
          id: 'q_leak',
          question: 'Do you see any water dripping or leaking?',
          options: ['YES', 'NO', "I DON'T KNOW"],
        },
        {
          id: 'q_sound',
          question: 'Is there an unusual sound or vibration?',
          options: ['YES', 'NO', "I DON'T KNOW"],
        },
      ],
    },
  ],
  triageQuestions: [
    {
      id: 'q_power',
      question: 'Is the AC turning on with the power switch or remote?',
      options: ['YES', 'NO', "I DON'T KNOW"],
    },
    {
      id: 'q_air',
      question: 'Is air blowing out of the indoor vents?',
      options: ['YES', 'NO', "I DON'T KNOW"],
    },
    {
      id: 'q_cooling',
      question: 'Is the airflow cool or warm/normal?',
      options: ['COOL', 'WARM / NORMAL', "I DON'T KNOW"],
    },
    {
      id: 'q_leak',
      question: 'Do you see any water dripping or leaking?',
      options: ['YES', 'NO', "I DON'T KNOW"],
    },
    {
      id: 'q_sound',
      question: 'Is there an unusual sound or vibration?',
      options: ['YES', 'NO', "I DON'T KNOW"],
    },
  ],
  allowedEvidenceTypes: ['PHOTO'],
  requiredSkills: acConfig.skills,
  recommendedTools: acConfig.tools,
  safetyRules: [
    'VERIFY ON SITE: Disconnect power isolator before servicing electrical contacts.',
    'Refrigerant systems operate under high pressure. Customer must not probe lines.',
    'Do not perform risky outdoor climbing to photograph high-mount outdoor units.',
  ],
  readingDefinitions: {
    indoorTemp: 'Indoor Return Air Temperature (°C)',
    grilleTemp: 'Indoor Supply / Grille Temperature (°C)',
    operatingCurrent: 'Compressor Operating Current (A)',
    suctionPressurePSI: 'Suction Gas Pressure (PSI)',
  },
};

export const ELECTRICAL_SERVICE_DEFINITION: ServiceDefinition = {
  serviceType: 'ELECTRICAL',
  displayName: 'Electrical Service',
  shortDescription: 'Wiring, MCB tripping, switchboard, short circuits & heavy appliances',
  icon: 'Zap',
  heroImage: '/assets/services/electrical-hero.svg',
  ticketPrefix: 'ELE',
  customerSafeRoleName: 'Certified Electrician',
  problemCategories: [
    {
      code: 'MCB_TRIPPING',
      title: 'MCB / Fuse frequently tripping',
      description: 'The main circuit breaker or sub-MCB keeps tripping when power is turned on.',
      image: '/assets/problems/mcb-tripping.svg',
      alt: 'MCB tripping on distribution board',
      recommendedEvidence: ['Photo of the tripped breaker in DB box'],
    },
    {
      code: 'WIRING_SPARK_BURNT',
      title: 'Sparking, burning smell or short circuit',
      description: 'Visible sparks, burning odor from switchboard, socket or wiring.',
      image: '/assets/problems/sparking-wires.svg',
      alt: 'Switchboard sparking or burnt socket',
      recommendedEvidence: ['Safe photo of switchboard showing burn marks'],
    },
    {
      code: 'POWER_OUTAGE_PARTIAL',
      title: 'Partial power loss in rooms',
      description: 'Some rooms or phase lines have lost power while others are working.',
      image: '/assets/problems/partial-outage.svg',
      alt: 'Partial phase power outage',
      recommendedEvidence: ['Photo of main phase indicator lamps'],
    },
    {
      code: 'SOMETHING_ELSE',
      title: 'Other electrical issue',
      description: 'General electrical installation, wiring check, or fixture repair.',
      image: '/assets/problems/electrical-general.svg',
      alt: 'General electrical repair',
      recommendedEvidence: ['Photo of the electrical equipment'],
    },
  ],
  triageQuestions: [
    { id: 'q_ele_sparks', question: 'Are you seeing active smoke, fire, or burning smell?', options: ['YES', 'NO', 'NOT SURE'] },
    { id: 'q_ele_mcb', question: 'Did you attempt resetting the breaker?', options: ['TRIPS IMMEDIATELY', 'STAYS ON TEMPORARILY', 'HAVE NOT TOUCHED'] },
  ],
  allowedEvidenceTypes: ['PHOTO'],
  requiredSkills: ['ELECTRICAL_TROUBLESHOOTING', 'WIRING_INSPECTION', 'LOAD_BALANCING'],
  recommendedTools: ['MULTIMETER', 'INSULATION_TESTER', 'CLAMP_METER', 'SCREWDRIVER_SET'],
  safetyRules: [
    'Turn off the main incoming isolator switch before touching any exposed wiring.',
    'Never touch wet switchboards or submerged wiring.',
  ],
  readingDefinitions: {
    lineVoltage: 'Supply Line Voltage (V)',
    loadCurrent: 'Phase Load Current (A)',
    earthResistance: 'Earth Resistance (Ohms)',
  },
};

export const PLUMBING_SERVICE_DEFINITION: ServiceDefinition = {
  serviceType: 'PLUMBING',
  displayName: 'Plumbing Service',
  shortDescription: 'Pipe leakage, tap repairs, blockage, water pressure & drainage issues',
  icon: 'Wrench',
  heroImage: '/assets/services/plumbing-hero.svg',
  ticketPrefix: 'PLM',
  customerSafeRoleName: 'Plumbing Specialist',
  problemCategories: [
    {
      code: 'PIPE_LEAKAGE',
      title: 'Burst pipe or water leakage',
      description: 'Water dripping, spraying, or seeping through wall/ceiling pipes.',
      image: '/assets/problems/pipe-leak.svg',
      alt: 'Burst or leaking pipe line',
      recommendedEvidence: ['Photo of leaking joint or seepage area'],
    },
    {
      code: 'DRAIN_BLOCKED',
      title: 'Clogged drain or sewer blockage',
      description: 'Water backing up in sink, shower drain, or toilet.',
      image: '/assets/problems/clogged-drain.svg',
      alt: 'Blocked drain or slow water drainage',
      recommendedEvidence: ['Photo of blocked fixture'],
    },
    {
      code: 'LOW_WATER_PRESSURE',
      title: 'Low water pressure from taps',
      description: 'Very weak water flow from bathroom or kitchen taps.',
      image: '/assets/problems/low-pressure.svg',
      alt: 'Low water pressure in tap',
      recommendedEvidence: ['Photo of water flow from tap'],
    },
    {
      code: 'SOMETHING_ELSE',
      title: 'Other plumbing work',
      description: 'Fixture installation, valve replacement, or pump repair.',
      image: '/assets/problems/plumbing-general.svg',
      alt: 'General plumbing fixture repair',
      recommendedEvidence: ['Photo of the plumbing fixture'],
    },
  ],
  triageQuestions: [
    { id: 'q_plm_source', question: 'Can you turn off the main water stopcock?', options: ['YES, TURNED OFF', 'CANNOT FIND STOPCOCK', 'LEAK IS CONTROLLED'] },
  ],
  allowedEvidenceTypes: ['PHOTO'],
  requiredSkills: ['PIPE_FITTING', 'LEAK_REPAIR', 'DRAIN_CLEARING'],
  recommendedTools: ['PIPE_WRENCH', 'PLUMBERS_TAPE', 'DRAIN_AUGER'],
  safetyRules: ['Close the main stopcock valve immediately in case of severe water gushing.'],
  readingDefinitions: {
    waterPressurePSI: 'Static Water Pressure (PSI)',
  },
};

export const RO_SERVICE_DEFINITION: ServiceDefinition = {
  serviceType: 'RO_PURIFIER',
  displayName: 'Water Purifier / RO Service',
  shortDescription: 'Filter replacement, membrane cleaning, bad taste & motor leakage',
  icon: 'Droplet',
  heroImage: '/assets/services/ro-hero.svg',
  ticketPrefix: 'ROP',
  customerSafeRoleName: 'RO Water Specialist',
  problemCategories: [
    {
      code: 'NO_WATER_DISPENSING',
      title: 'No water dispensing or tank empty',
      description: 'Water is not flowing from purifier tap or tank is not filling up.',
      image: '/assets/problems/ro-no-water.svg',
      alt: 'RO purifier not dispensing water',
      recommendedEvidence: ['Photo of front panel LED indicators'],
    },
    {
      code: 'WATER_LEAKAGE',
      title: 'Purifier leaking water',
      description: 'Water dripping from the purifier body, base, or connector pipe.',
      image: '/assets/problems/ro-leak.svg',
      alt: 'Water purifier leaking',
      recommendedEvidence: ['Photo of leakage origin'],
    },
    {
      code: 'BAD_TASTE_ODOR',
      title: 'Bad taste, foul smell or high TDS',
      description: 'Purified water tastes bitter, salty, or smells unpleasant.',
      image: '/assets/problems/ro-taste.svg',
      alt: 'Purified water quality issue',
      recommendedEvidence: ['Photo of TDS display if available'],
    },
    {
      code: 'ROUTINE_SERVICE',
      title: 'Routine filter replacement / Service',
      description: 'Periodic maintenance, pre-filter, carbon, or membrane replacement.',
      image: '/assets/problems/ro-service.svg',
      alt: 'Routine RO maintenance',
      recommendedEvidence: ['Photo of complete purifier unit'],
    },
  ],
  triageQuestions: [
    { id: 'q_ro_pump', question: 'Do you hear the booster pump buzzing when switched on?', options: ['YES, PUMP RUNS', 'SILENT / NO SOUND', 'UNUSUAL VIBRATION'] },
  ],
  allowedEvidenceTypes: ['PHOTO'],
  requiredSkills: ['RO_MEMBRANE_REPAIR', 'TDS_CALIBRATION', 'PRESSURE_PUMP_SERVICE'],
  recommendedTools: ['TDS_METER', 'PRESSURE_GAUGE', 'TUBE_CUTTER'],
  safetyRules: ['Unplug power adapter before opening the purifier casing.'],
  readingDefinitions: {
    rawWaterTDS: 'Raw Water Input TDS (ppm)',
    purifiedTDS: 'Purified Output TDS (ppm)',
    pumpPressurePSI: 'Booster Pump Pressure (PSI)',
  },
};

export const APPLIANCE_SERVICE_DEFINITION: ServiceDefinition = {
  serviceType: 'APPLIANCE_REPAIR',
  displayName: 'Appliance Repair',
  shortDescription: 'Refrigerator, washing machine, microwave & home appliances',
  icon: 'Tv',
  heroImage: '/assets/services/appliance-hero.svg',
  ticketPrefix: 'APP',
  customerSafeRoleName: 'Appliance Specialist',
  problemCategories: [
    {
      code: 'NOT_TURNING_ON',
      title: 'Appliance not turning on',
      description: 'Complete power loss, no display, or no reaction to power button.',
      image: '/assets/problems/appliance-dead.svg',
      alt: 'Home appliance dead power',
      recommendedEvidence: ['Photo of the appliance rating label & power cord'],
    },
    {
      code: 'NOT_COOLING_HEATING',
      title: 'Not cooling or not heating',
      description: 'Appliance runs but does not achieve required temperature.',
      image: '/assets/problems/appliance-temp.svg',
      alt: 'Appliance temperature failure',
      recommendedEvidence: ['Photo of the appliance model number'],
    },
    {
      code: 'UNUSUAL_NOISE_VIBRATION',
      title: 'Loud noise, rattling or heavy vibration',
      description: 'Extreme sound or shaking during motor or compressor cycle.',
      image: '/assets/problems/appliance-noise.svg',
      alt: 'Appliance mechanical noise',
      recommendedEvidence: ['Photo of the appliance'],
    },
  ],
  triageQuestions: [
    { id: 'q_app_brand', question: 'Is the appliance still under manufacturer warranty?', options: ['YES, IN WARRANTY', 'OUT OF WARRANTY', 'NOT SURE'] },
  ],
  allowedEvidenceTypes: ['PHOTO'],
  requiredSkills: ['APPLIANCE_DIAGNOSTICS', 'MOTOR_REPAIR', 'PCB_INSPECTION'],
  recommendedTools: ['MULTIMETER', 'TEMPERATURE_PROBE', 'SOCKET_SET'],
  safetyRules: ['Unplug appliance from wall socket before physical inspection.'],
  readingDefinitions: {
    operatingWattage: 'Operating Wattage (W)',
    windingResistance: 'Motor Winding Resistance (Ohms)',
  },
};

export class ServiceRegistry {
  private static services: Map<ServiceType, ServiceDefinition> = new Map([
    ['SOLAR', SOLAR_SERVICE_DEFINITION],
    ['AC', AC_SERVICE_DEFINITION],
    ['ELECTRICAL', ELECTRICAL_SERVICE_DEFINITION],
    ['PLUMBING', PLUMBING_SERVICE_DEFINITION],
    ['RO_PURIFIER', RO_SERVICE_DEFINITION],
    ['APPLIANCE_REPAIR', APPLIANCE_SERVICE_DEFINITION],
  ]);

  public static getService(serviceType: ServiceType): ServiceDefinition | undefined {
    return this.services.get(serviceType);
  }

  public static getAllServices(): ServiceDefinition[] {
    return Array.from(this.services.values());
  }

  public static getAvailableServicesForLocation(
    city: string,
    pincode?: string,
    supportedByCompany?: ServiceType[]
  ): ServiceDefinition[] {
    const list = this.getAllServices();
    if (!supportedByCompany || supportedByCompany.length === 0) {
      return list;
    }
    return list.filter((s) => supportedByCompany.includes(s.serviceType));
  }
}
