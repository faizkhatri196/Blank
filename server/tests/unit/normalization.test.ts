import { describe, it, expect } from 'vitest';
import { normalizeComplaint } from '../../src/ai/complaintNormalizer';
import { calculatePilotMetrics } from '../../src/services/metricsService';

describe('AI Complaint Normalization & Unknown Triage', () => {
  it('should normalize bad spelling and Hinglish customer complaints while preserving raw input', () => {
    const rawInput = 'invrtr not wrkng genration bandh';
    const result = normalizeComplaint(rawInput, 'SOLAR');

    expect(result.rawComplaint).toBe(rawInput);
    expect(result.normalizedComplaint).toContain('Solar inverter appears to be offline');
    expect(result.normalizedComplaint).toContain('generation');
    expect(result.isUnknownTriage).toBe(false);
  });

  it('should classify vague/unknown complaints as UNKNOWN / NEEDS TRIAGE without guessing confirmed diagnosis', () => {
    const rawInput = 'Solar not working properly, don\'t know problem';
    const result = normalizeComplaint(rawInput, 'SOLAR');

    expect(result.isUnknownTriage).toBe(true);
    expect(result.statusMessage).toContain('DIAGNOSIS NOT CONFIRMED');
    expect(result.statusMessage).toContain('VERIFY ON SITE');
    expect(result.knownFacts).toBeDefined();
    expect(result.knownFacts.length).toBeGreaterThan(0);
    expect(result.unknownFacts).toBeDefined();
    expect(result.missingInformation).toBeDefined();
    expect(result.missingInformation.length).toBeGreaterThanOrEqual(5);
    // Ensure it asks key triage questions
    expect(result.missingInformation.some(q => q.includes('error code') || q.includes('indicator') || q.includes('display'))).toBe(true);
  });

  it('should handle non-technical phrases like "please check solar"', () => {
    const result = normalizeComplaint('please check solar', 'SOLAR');
    expect(result.isUnknownTriage).toBe(true);
  });

  it('should flag smoke/spark complaints as SAFETY_CRITICAL with Lockout-Tagout', () => {
    const result = normalizeComplaint('smoke coming from solar inverter', 'SOLAR');
    expect(result.triageClassification).toBe('SAFETY_CRITICAL');
    expect(result.normalizedComplaint).toContain('CRITICAL SAFETY ALERT');
    expect(result.statusMessage).toContain('LOCKOUT-TAGOUT');
  });

  it('should preserve original customer input verbatim in rawComplaint', () => {
    const rawInput = '   soler pannel not work red light in invrter   ';
    const result = normalizeComplaint(rawInput, 'SOLAR');
    expect(result.rawComplaint).toBe(rawInput.trim());
    expect(result.normalizedComplaint).not.toBe(rawInput);
  });
});
