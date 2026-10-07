/**
 * SERVORA AI Complaint Normalizer & Triage Classifier
 *
 * Handles:
 * 1. Non-technical, colloquial, Hinglish, Gujarati, and misspelled customer input.
 * 2. Normalizes bad spelling into professional operational summaries while preserving the raw input.
 * 3. Identifies UNKNOWN / UNCERTAIN problems and flags them as 'UNKNOWN / NEEDS TRIAGE'.
 * 4. Strictly avoids false confirmed diagnoses when evidence is absent.
 */

export interface NormalizedComplaintResult {
  rawComplaint: string;
  normalizedComplaint: string;
  isUnknownTriage: boolean;
  triageClassification: 'KNOWN_PROBLEM' | 'UNKNOWN_TRIAGE' | 'PERFORMANCE_ISSUE' | 'SAFETY_CRITICAL';
  knownFacts: string[];
  unknownFacts: string[];
  missingInformation: string[];
  statusMessage: string;
  inferredKeywords: string[];
}

import { ServiceType } from '../types';

export function normalizeComplaint(rawInput: string, serviceType: ServiceType | string = 'SOLAR'): NormalizedComplaintResult {
  const trimmed = (rawInput || '').trim();
  const lower = trimmed.toLowerCase();

  // Pattern matching for unknown / vague complaints
  const unknownPatterns = [
    'dont know',
    "don't know",
    'not know',
    'unknown',
    'not working properly',
    'please check my solar',
    'please check solar',
    'check solar',
    'check my solar',
    'check machine',
    'kuch problem hai',
    'kahi problem che',
    'something wrong',
    'dont know what happened',
    "don't know what happened",
    'just check',
  ];

  // Specific keyword indicators
  const hasGridLost = lower.includes('grid lost') || lower.includes('grid fault') || lower.includes('f04') || lower.includes('grid high');
  const hasMc4 = lower.includes('mc4') || lower.includes('connector') || lower.includes('spark') || lower.includes('loose wire');
  const hasDerating = lower.includes('hot') || lower.includes('afternoon') || lower.includes('derating') || lower.includes('garmi');
  const hasBillIssue = lower.includes('bill') || lower.includes('tariff') || lower.includes('consumption') || lower.includes('net meter') || lower.includes('light bill');
  const hasStringFault = lower.includes('string') || lower.includes('fuse') || lower.includes('half generation') || lower.includes('combiner');
  const hasEarthing = lower.includes('earthing') || lower.includes('ground') || lower.includes('shock') || lower.includes('earth pit') || lower.includes('current lag raha');
  const hasMonitoring = lower.includes('scada') || lower.includes('wifi') || lower.includes('dongle') || lower.includes('offline') || lower.includes('monitoring');
  const hasSafety = lower.includes('smoke') || lower.includes('spark') || lower.includes('burning') || lower.includes('fire') || lower.includes('blast');

  // Check if input is unknown / vague
  const isVague = unknownPatterns.some((pattern) => lower.includes(pattern));
  const hasNoSpecificIssue = !hasGridLost && !hasMc4 && !hasDerating && !hasBillIssue && !hasStringFault && !hasEarthing && !hasMonitoring && !hasSafety;

  if ((isVague && hasNoSpecificIssue) || (lower.length < 25 && hasNoSpecificIssue && (lower.includes('not working') || lower.includes('bandh') || lower.includes('problem')))) {
    return {
      rawComplaint: trimmed,
      normalizedComplaint:
        'Customer reports solar system is not working or requires inspection. No specific error code or fault symptoms reported. System classified for triage assessment.',
      isUnknownTriage: true,
      triageClassification: 'UNKNOWN_TRIAGE',
      knownFacts: [
        'Customer reports solar system is not working or requires on-site inspection.',
        'No specific physical damage, smoke, or error code stated in initial report.',
      ],
      unknownFacts: [
        'Exact equipment fault is not confirmed remotely.',
        'Inverter operational display status (ON vs Dark) is unverified.',
        'Current solar generation capacity status is unverified.',
      ],
      missingInformation: [
        'Is the inverter display screen illuminated, or is it completely dark?',
        'Is any specific error or fault code (e.g. F04, ISO, Relay) displayed?',
        'What LED indicator lights (green, red, yellow) are active on the inverter?',
        'When did the problem start (exact time of day / weather condition)?',
        'Is daily generation completely zero or partially reduced?',
        'Can the customer provide a clear photograph of the inverter display and distribution board?',
      ],
      statusMessage: 'DIAGNOSIS NOT CONFIRMED. TECHNICIAN VERIFICATION REQUIRED (VERIFY ON SITE).',
      inferredKeywords: ['unknown', 'inspection', 'triage', 'display', 'grid', 'inverter'],
    };
  }

  // Domain Normalizations (Colloquial / Misspellings / Hinglish)
  const replacements: Array<{ regex: RegExp; replacement: string }> = [
    { regex: /invrtr|invrter|invter|invertr|inv/gi, replacement: 'inverter' },
    { regex: /not wrkng|not working|kam nai karto|kaam nahi kar raha/gi, replacement: 'not operating' },
    { regex: /genration|genretion|gnration|gen/gi, replacement: 'solar generation' },
    { regex: /bandh|band|stopped|halting/gi, replacement: 'zero / halted' },
    { regex: /soler|solar pannel|pannel|panal/gi, replacement: 'solar panels' },
    { regex: /red light|laal light/gi, replacement: 'red fault indicator LED' },
    { regex: /error coming|aaraha hai|aave che/gi, replacement: 'displaying fault alarm' },
    { regex: /light is not coming|current nathi aavto/gi, replacement: 'zero AC power delivery to load' },
    { regex: /garmi ma|dhoop me|hot time/gi, replacement: 'during hot peak hours' },
    { regex: /current lag raha|shock aave che/gi, replacement: 'leakage voltage / touch potential hazard' },
  ];

  let normalized = trimmed;
  for (const { regex, replacement } of replacements) {
    normalized = normalized.replace(regex, replacement);
  }

  // If HOME_MAINTENANCE serviceType, handle Home Maintenance & Civil domain logic
  if (serviceType === 'HOME_MAINTENANCE') {
    const hasTileIssue = lower.includes('tile') || lower.includes('ladi') || lower.includes('ladiyo') || lower.includes('grout') || lower.includes('chipped') || lower.includes('loose tile');
    const hasWaterSeepage = lower.includes('seep') || lower.includes('leak') || lower.includes('bheej') || lower.includes('damp') || lower.includes('moisture') || lower.includes('waterproofing') || lower.includes('pani');
    const hasWallIssue = lower.includes('wall') || lower.includes('diwal') || lower.includes('deewar') || lower.includes('plaster') || lower.includes('crack') || lower.includes('paint peeling');
    const hasFloorIssue = lower.includes('floor') || lower.includes('bhon') || lower.includes('sinking') || lower.includes('uneven') || lower.includes('leveling');
    const hasBathroomIssue = lower.includes('bathroom') || lower.includes('nahan') || lower.includes('shower') || lower.includes('toilet');
    const hasKitchenIssue = lower.includes('kitchen') || lower.includes('rasoi') || lower.includes('platform') || lower.includes('granite') || lower.includes('sink joint');
    const hasDoorWindowIssue = lower.includes('door') || lower.includes('barana') || lower.includes('darwaja') || lower.includes('window') || lower.includes('bari') || lower.includes('khidki') || lower.includes('hinge') || lower.includes('latch');
    const hasMasonryIssue = lower.includes('masonry') || lower.includes('cement') || lower.includes('brick') || lower.includes('plastering') || lower.includes('chuno');

    const hasNoSpecificHomeIssue = !hasTileIssue && !hasWaterSeepage && !hasWallIssue && !hasFloorIssue && !hasBathroomIssue && !hasKitchenIssue && !hasDoorWindowIssue && !hasMasonryIssue;

    if ((isVague && hasNoSpecificHomeIssue) || (lower.length < 25 && hasNoSpecificHomeIssue && (lower.includes('repair') || lower.includes('problem') || lower.includes('check') || lower.includes('maintenance')))) {
      return {
        rawComplaint: trimmed,
        normalizedComplaint:
          'Customer reports home maintenance / civil repair issue requiring on-site assessment. No specific damage location or material details stated in initial report.',
        isUnknownTriage: true,
        triageClassification: 'UNKNOWN_TRIAGE',
        knownFacts: [
          'Customer reports home maintenance / civil repair issue requiring on-site inspection.',
          'Specific damaged element (tiles, walls, plumbing, woodwork) unconfirmed in initial description.',
        ],
        unknownFacts: [
          'Exact surface, structural condition, or substrate damage is unverified.',
          'Presence of concealed electrical or water pipes in damaged area is unverified.',
        ],
        missingInformation: [
          'Which area of the property is affected (bathroom, kitchen, bedroom, exterior)?',
          'Is the issue related to tiles, wall plaster, flooring, or carpentry?',
          'Is there active water leakage or moisture dampness present?',
          'Can the customer provide a clear photograph showing the damage and surrounding area?',
        ],
        statusMessage: 'DIAGNOSIS NOT CONFIRMED. HOME PROFESSIONAL VERIFICATION REQUIRED (VERIFY ON SITE).',
        inferredKeywords: ['home maintenance', 'civil', 'inspection', 'triage'],
      };
    }

    let hmtNormalized = `Customer reports home maintenance issue: "${trimmed}".`;
    const hmtKeywords: string[] = ['home maintenance', 'civil'];

    if (hasTileIssue) {
      hmtNormalized = 'Customer reports damaged, broken, hollow or loose tiles requiring replacement and regrouting.';
      hmtKeywords.push('tiles', 'replacement', 'grouting');
    } else if (hasWaterSeepage) {
      hmtNormalized = 'Customer reports water leakage / dampness seepage on wall, ceiling or floor requiring waterproofing assessment.';
      hmtKeywords.push('water leakage', 'seepage', 'waterproofing');
    } else if (hasWallIssue) {
      hmtNormalized = 'Customer reports wall damage, plaster cracking or surface repair required.';
      hmtKeywords.push('wall damage', 'plaster repair');
    } else if (hasFloorIssue) {
      hmtNormalized = 'Customer reports flooring damage, uneven level or sunken tiles requiring repair.';
      hmtKeywords.push('floor damage', 'leveling');
    } else if (hasBathroomIssue) {
      hmtNormalized = 'Customer reports bathroom civil or tile repair required (waterproofing / joint sealant).';
      hmtKeywords.push('bathroom repair', 'tile grouting');
    } else if (hasKitchenIssue) {
      hmtNormalized = 'Customer reports kitchen platform, granite counter or sink edge joint civil repair required.';
      hmtKeywords.push('kitchen repair', 'counter joint');
    } else if (hasDoorWindowIssue) {
      hmtNormalized = 'Customer reports door/window fitting, hinge alignment or carpentry repair required.';
      hmtKeywords.push('door window', 'carpentry', 'hinges');
    } else if (hasMasonryIssue) {
      hmtNormalized = 'Customer reports minor civil / masonry touchup, cement plastering or brickwork repair required.';
      hmtKeywords.push('masonry', 'cement plaster');
    }

    return {
      rawComplaint: trimmed,
      normalizedComplaint: hmtNormalized,
      isUnknownTriage: false,
      triageClassification: 'KNOWN_PROBLEM',
      knownFacts: [`Customer reported: "${trimmed}"`],
      unknownFacts: ['Subsurface condition and substrate integrity must be inspected on site.'],
      missingInformation: [
        'Approximate square feet / area of damaged section',
        'Availability of matching replacement tiles or materials',
        'Photographs of the damaged area showing distance and close-up view',
      ],
      statusMessage: 'AI PRELIMINARY HYPOTHESIS. REQUIRES ON-SITE CIVIL INSPECTION.',
      inferredKeywords: hmtKeywords,
    };
  }

  // If PLUMBING serviceType, handle Plumbing domain logic
  if (serviceType === 'PLUMBING') {
    const hasBurstLeak = lower.includes('leak') || lower.includes('burst') || lower.includes('pipe') || lower.includes('spray') || lower.includes('drip') || lower.includes('tuti gaya') || lower.includes('pani');
    const hasTapIssue = lower.includes('tap') || lower.includes('faucet') || lower.includes('nal') || lower.includes('chakli') || lower.includes('valve') || lower.includes('spindle');
    const hasDrainBlocked = lower.includes('block') || lower.includes('clog') || lower.includes('drain') || lower.includes('choke') || lower.includes('gali') || lower.includes('sink');
    const hasBathroomPlumbing = lower.includes('flush') || lower.includes('cistern') || lower.includes('commode') || lower.includes('toilet') || lower.includes('shower') || lower.includes('diverter');
    const hasLowPressure = lower.includes('pressure') || lower.includes('slow water') || lower.includes('ochu pani') || lower.includes('kam pani') || lower.includes('flow');

    const hasNoSpecificPlumbIssue = !hasBurstLeak && !hasTapIssue && !hasDrainBlocked && !hasBathroomPlumbing && !hasLowPressure;

    if ((isVague && hasNoSpecificPlumbIssue) || (lower.length < 25 && hasNoSpecificPlumbIssue && (lower.includes('not working') || lower.includes('problem') || lower.includes('check')))) {
      return {
        rawComplaint: trimmed,
        normalizedComplaint:
          'Customer reports plumbing issue requiring inspection. Specific fixture or pipeline symptom not stated in initial report.',
        isUnknownTriage: true,
        triageClassification: 'UNKNOWN_TRIAGE',
        knownFacts: [
          'Customer reports plumbing issue requiring on-site inspection.',
          'No specific water overflow, pipe burst or fixture confirmed in report.',
        ],
        unknownFacts: [
          'Pipeline pressure, concealed pipe condition, and water supply stopcock status unverified.',
        ],
        missingInformation: [
          'Can you shut off the main water stopcock?',
          'Is water actively overflowing or dripping slowly?',
          'Which fixture is affected (kitchen sink, bathroom tap, main pipe)?',
          'Can the customer share a photograph of the leaking or damaged fixture?',
        ],
        statusMessage: 'DIAGNOSIS NOT CONFIRMED. PLUMBER VERIFICATION REQUIRED (VERIFY ON SITE).',
        inferredKeywords: ['plumbing', 'inspection', 'triage', 'water'],
      };
    }

    let plumbNormalized = `Customer reports plumbing issue: "${trimmed}".`;
    const plumbKeywords: string[] = ['plumbing'];

    if (hasTapIssue) {
      plumbNormalized = 'Customer reports leaking, dripping or damaged tap / faucet fixture requiring repair.';
      plumbKeywords.push('tap repair', 'faucet');
    } else if (hasDrainBlocked) {
      plumbNormalized = 'Customer reports clogged or blocked drain causing water backup.';
      plumbKeywords.push('drain blockage', 'clogged drain');
    } else if (hasBathroomPlumbing) {
      plumbNormalized = 'Customer reports bathroom plumbing issue (flush valve, diverter or sanitary fitting).';
      plumbKeywords.push('bathroom plumbing', 'flush valve');
    } else if (hasLowPressure) {
      plumbNormalized = 'Customer reports low water pressure or restricted water flow from taps.';
      plumbKeywords.push('low water pressure', 'flow');
    } else if (hasBurstLeak) {
      plumbNormalized = 'Customer reports pipe leakage or water seepage from pipeline joints.';
      plumbKeywords.push('pipe leakage', 'joint leak');
    }

    return {
      rawComplaint: trimmed,
      normalizedComplaint: plumbNormalized,
      isUnknownTriage: false,
      triageClassification: 'KNOWN_PROBLEM',
      knownFacts: [`Customer reported: "${trimmed}"`],
      unknownFacts: ['Water line pressure and concealed joint status require on-site inspection.'],
      missingInformation: [
        'Location of main stopcock valve',
        'Concealed vs exposed pipeline location',
        'Photographs of leaking joint or dripping tap',
      ],
      statusMessage: 'AI PRELIMINARY HYPOTHESIS. REQUIRES ON-SITE PLUMBING VERIFICATION.',
      inferredKeywords: plumbKeywords,
    };
  }

  // If ELECTRICAL serviceType, handle Electrical domain logic
  if (serviceType === 'ELECTRICAL') {
    const hasMcbTripping = lower.includes('mcb') || lower.includes('trip') || lower.includes('fuse') || lower.includes('breaker');
    const hasSparks = lower.includes('spark') || lower.includes('burnt') || lower.includes('burning') || lower.includes('smoke') || lower.includes('odor') || lower.includes('smell');
    const hasPartialOutage = lower.includes('phase') || lower.includes('partial') || lower.includes('half light') || lower.includes('some rooms') || lower.includes('no light');

    const hasNoSpecificElecIssue = !hasMcbTripping && !hasSparks && !hasPartialOutage;

    if ((isVague && hasNoSpecificElecIssue) || (lower.length < 25 && hasNoSpecificElecIssue && (lower.includes('not working') || lower.includes('problem') || lower.includes('check')))) {
      return {
        rawComplaint: trimmed,
        normalizedComplaint:
          'Customer reports electrical issue requiring on-site inspection. Specific breaker or fixture symptom not stated in initial report.',
        isUnknownTriage: true,
        triageClassification: 'UNKNOWN_TRIAGE',
        knownFacts: [
          'Customer reports electrical system issue requiring on-site inspection.',
          'No specific burning smell, spark, or tripped breaker confirmed in initial report.',
        ],
        unknownFacts: [
          'Line voltage, phase balance, and insulation resistance unverified.',
        ],
        missingInformation: [
          'Did the main circuit breaker (MCB) trip?',
          'Is there any active burning smell, smoke, or sparking?',
          'Is power out across the entire home or only specific rooms?',
        ],
        statusMessage: 'DIAGNOSIS NOT CONFIRMED. ELECTRICIAN VERIFICATION REQUIRED (VERIFY ON SITE).',
        inferredKeywords: ['electrical', 'inspection', 'triage'],
      };
    }

    let elecNormalized = `Customer reports electrical issue: "${trimmed}".`;
    const elecKeywords: string[] = ['electrical'];

    if (hasSparks) {
      elecNormalized = 'SAFETY ALERT: Visible sparks, burning smell or electrical short circuit reported.';
      elecKeywords.push('sparking', 'burning', 'safety hazard');
    } else if (hasMcbTripping) {
      elecNormalized = 'Customer reports frequent MCB breaker or fuse tripping on distribution board.';
      elecKeywords.push('mcb tripping', 'breaker');
    } else if (hasPartialOutage) {
      elecNormalized = 'Customer reports partial phase power outage affecting specific rooms/circuits.';
      elecKeywords.push('phase outage', 'power loss');
    }

    return {
      rawComplaint: trimmed,
      normalizedComplaint: elecNormalized,
      isUnknownTriage: false,
      triageClassification: hasSparks ? 'SAFETY_CRITICAL' : 'KNOWN_PROBLEM',
      knownFacts: [`Customer reported: "${trimmed}"`],
      unknownFacts: ['Phase voltage and earthing loop resistance require multimeter measurement.'],
      missingInformation: [
        'Has the main isolator been turned off safely?',
        'Number of affected circuits / appliances',
        'Photographs of the main distribution box (DB)',
      ],
      statusMessage: 'AI PRELIMINARY HYPOTHESIS. REQUIRES ON-SITE ELECTRICAL MEASUREMENTS.',
      inferredKeywords: elecKeywords,
    };
  }

  // If AC serviceType, handle AC specific domain logic
  if (serviceType === 'AC') {
    const hasCoolingIssue = lower.includes('cool') || lower.includes('thanda') || lower.includes('thando') || lower.includes('warm') || lower.includes('garam');
    const hasWaterLeak = lower.includes('leak') || lower.includes('pani') || lower.includes('paani') || lower.includes('water') || lower.includes('drip') || lower.includes('pade che');
    const hasNoise = lower.includes('noise') || lower.includes('sound') || lower.includes('awaj') || lower.includes('awaaz') || lower.includes('vibrat');
    const hasPowerIssue = lower.includes('not turn') || lower.includes('chalu nathi') || lower.includes('start nahi') || lower.includes('dead') || lower.includes('power');
    const hasOutdoorIssue = lower.includes('outdoor') || lower.includes('compressor') || lower.includes('fan');
    const hasSmell = lower.includes('smell') || lower.includes('odor') || lower.includes('vas') || lower.includes('bad');

    const hasNoSpecificACIssue = !hasCoolingIssue && !hasWaterLeak && !hasNoise && !hasPowerIssue && !hasOutdoorIssue && !hasSmell && !hasSafety;

    if ((isVague && hasNoSpecificACIssue) || (lower.length < 25 && hasNoSpecificACIssue && (lower.includes('not working') || lower.includes('problem') || lower.includes('check')))) {
      return {
        rawComplaint: trimmed,
        normalizedComplaint:
          'Customer reports AC / HVAC system is not working or requires inspection. No specific symptoms reported. System classified for triage assessment.',
        isUnknownTriage: true,
        triageClassification: 'UNKNOWN_TRIAGE',
        knownFacts: [
          'Customer reports AC system is not working or requires on-site inspection.',
          'No specific water leakage, smoke, or error code stated in initial report.',
        ],
        unknownFacts: [
          'Exact AC equipment fault is not confirmed remotely.',
          'Indoor blower fan and cooling operation status unverified.',
          'Refrigerant operating pressure and electrical voltage unverified.',
        ],
        missingInformation: [
          'Is the AC unit turning ON with the remote or power switch?',
          'Is air blowing out from the indoor unit vents?',
          'Is the airflow cold, or is it normal room temperature / warm?',
          'Is there any water dripping or overflowing from the indoor unit?',
          'Is there any unusual rattling, vibrating, or buzzing noise?',
        ],
        statusMessage: 'DIAGNOSIS NOT CONFIRMED. TECHNICIAN VERIFICATION REQUIRED (VERIFY ON SITE).',
        inferredKeywords: ['ac', 'inspection', 'triage', 'cooling', 'hvac'],
      };
    }

    let acNormalized = 'Customer reports AC operational issue.';
    const acKeywords: string[] = ['ac'];

    if (hasCoolingIssue && hasWaterLeak) {
      acNormalized = 'AC is not cooling and water leakage has been reported from the unit.';
      acKeywords.push('not cooling', 'water leak');
    } else if (hasCoolingIssue) {
      acNormalized = 'AC is running but not cooling (blowing normal or warm air).';
      acKeywords.push('not cooling', 'compressor', 'refrigerant');
    } else if (hasWaterLeak) {
      acNormalized = 'Water leakage / dripping reported from indoor AC unit.';
      acKeywords.push('water leak', 'drainage');
    } else if (hasNoise) {
      acNormalized = 'Abnormal noise or vibration reported from AC unit.';
      acKeywords.push('noise', 'blower', 'motor');
    } else if (hasPowerIssue) {
      acNormalized = 'AC unit is not turning ON / power supply failure.';
      acKeywords.push('power', 'electrical', 'pcb');
    } else if (hasOutdoorIssue) {
      acNormalized = 'Outdoor condenser unit or compressor issue reported.';
      acKeywords.push('outdoor', 'compressor', 'fan');
    } else {
      acNormalized = `Reported AC operational issue: "${trimmed}". Remote diagnosis unconfirmed — requires physical inspection on site.`;
    }

    return {
      rawComplaint: trimmed,
      normalizedComplaint: acNormalized,
      isUnknownTriage: false,
      triageClassification: 'KNOWN_PROBLEM',
      knownFacts: [`Customer reported: "${trimmed}"`],
      unknownFacts: ['Refrigerant charge and electrical components require on-site measurement.'],
      missingInformation: [
        'Indoor grille return air and supply air temperature',
        'Operating current (Amperes) clamp measurement',
        'Suction and discharge line pressures',
      ],
      statusMessage: 'AI PRELIMINARY HYPOTHESIS. REQUIRES ON-SITE AC VERIFICATION.',
      inferredKeywords: acKeywords,
    };
  }

  // Construction of Solar structured statement (existing behavior preserved)
  let normalizedComplaint = normalized;
  const inferredKeywords: string[] = [];

  if (hasSafety) {
    normalizedComplaint = `CRITICAL SAFETY ALERT: Customer reports thermal or electrical hazard (${trimmed}). Immediate Lockout-Tagout and certified inspection required.`;
    inferredKeywords.push('safety', 'fire', 'loto', 'hazard');
    return {
      rawComplaint: trimmed,
      normalizedComplaint,
      isUnknownTriage: false,
      triageClassification: 'SAFETY_CRITICAL',
      knownFacts: ['Customer reported potential smoke, spark, or high thermal anomaly.'],
      unknownFacts: ['Full extent of internal terminal or cell damage.'],
      missingInformation: ['Has AC and DC isolator been switched OFF immediately by customer?'],
      statusMessage: 'CRITICAL SAFETY HAZARD. IMMEDIATE ON-SITE LOCKOUT-TAGOUT REQUIRED.',
      inferredKeywords,
    };
  }

  if (hasGridLost) {
    normalizedComplaint = `Inverter reporting Grid Lost / Utility Sync Disconnect. Symptom: ${trimmed}. Possible AC grid fluctuation, neutral floating voltage, or tripped AC isolator.`;
    inferredKeywords.push('grid lost', 'f04', 'voltage', 'utility', 'isolator', 'spd');
  } else if (hasMc4) {
    normalizedComplaint = `Suspected rooftop MC4 DC connector contact resistance or heating anomaly. Symptom: ${trimmed}. Visual and thermal inspection required.`;
    inferredKeywords.push('mc4', 'connector', 'crimping', 'dc wiring');
  } else if (hasDerating) {
    normalizedComplaint = `Inverter thermal derating during peak hot periods. Symptom: ${trimmed}. Requires heatsink clearance and ventilation inspection.`;
    inferredKeywords.push('hot', 'derating', 'heatsink', 'ventilation', 'temperature');
  } else if (hasBillIssue) {
    normalizedComplaint = `Customer inquiry regarding increased electricity bill despite operating solar system. Symptom: ${trimmed}. Triage requires utility bills and net-meter review before truck roll.`;
    inferredKeywords.push('bill', 'tariff', 'net meter', 'consumption');
  } else if (hasStringFault) {
    normalizedComplaint = `Partial solar array generation drop indicating potential string disconnection or blown DC fuse. Symptom: ${trimmed}.`;
    inferredKeywords.push('string', 'fuse', 'combiner', 'voc', 'isc');
  } else if (hasEarthing) {
    normalizedComplaint = `Potential solar earthing fault or touch-potential leakage. Symptom: ${trimmed}. Earth pit resistance Megger verification (< 5 ohms) required.`;
    inferredKeywords.push('earthing', 'ground', 'megger', 'earth pit');
  } else if (hasMonitoring) {
    normalizedComplaint = `Solar monitoring portal or datalogger communication loss. Symptom: ${trimmed}. Verify Wi-Fi stick LED link and internet gateway.`;
    inferredKeywords.push('scada', 'monitoring', 'wifi', 'datalogger');
  } else if (
    (lower.includes('invrtr') || lower.includes('inverter') || lower.includes('invter')) &&
    (lower.includes('genration') || lower.includes('generation') || lower.includes('bandh') || lower.includes('zero'))
  ) {
    normalizedComplaint = `Solar inverter appears to be offline/not operating and the customer reports zero generation. Remote diagnosis unconfirmed — requires physical multimeter readings on site.`;
    inferredKeywords.push('inverter', 'offline', 'generation', 'multimeter');
  } else {
    normalizedComplaint = `Reported solar operational issue: "${normalized}". Remote diagnosis unconfirmed — requires physical multimeter readings on site.`;
    inferredKeywords.push('inverter', 'solar', 'multimeter');
  }

  return {
    rawComplaint: trimmed,
    normalizedComplaint,
    isUnknownTriage: false,
    triageClassification: hasBillIssue ? 'PERFORMANCE_ISSUE' : 'KNOWN_PROBLEM',
    knownFacts: [`Customer reported: "${trimmed}"`],
    unknownFacts: ['Physical component status requires verification on site.'],
    missingInformation: [
      'Inverter error code display',
      'Phase-to-Neutral and Neutral-to-Earth voltages',
      'DC string Voc and Isc clamp measurements',
    ],
    statusMessage: 'AI PRELIMINARY HYPOTHESIS. REQUIRES ON-SITE ELECTRICAL VERIFICATION.',
    inferredKeywords,
  };
}
