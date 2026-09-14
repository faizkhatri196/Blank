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

export function normalizeComplaint(rawInput: string, serviceType: 'SOLAR' | 'AC' = 'SOLAR'): NormalizedComplaintResult {
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

  // Construct structured professional statement
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
