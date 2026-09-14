import { describe, it, expect } from 'vitest';
import { DemoAIProvider } from '../../src/ai/DemoAIProvider';
import { aiOutputSchema } from '../../src/validators';

describe('DemoAIProvider Deterministic Rules Unit Tests', () => {
  const provider = new DemoAIProvider();

  it('should analyze Solar complaints and return schema-valid results with safety warnings', async () => {
    const result = await provider.analyzeServiceTicket({
      ticketNumber: 'SOL-2026-TEST',
      serviceType: 'SOLAR',
      complaint: 'Inverter showing Error 04 and generation dropped to zero',
      symptoms: ['Inverter offline', 'Zero generation'],
      errorCode: 'Error 04',
      assetDetails: {
        capacityKW: 10,
        inverterMake: 'Sungrow',
      },
    });

    const validated = aiOutputSchema.safeParse(result);
    expect(validated.success).toBe(true);

    expect(result.serviceType).toBe('SOLAR');
    expect(result.possibleIssues.length).toBeGreaterThan(0);
    expect(result.diagnosticSteps.length).toBeGreaterThan(0);
    expect(result.recommendedTools).toContain('MULTIMETER');
    expect(result.safetyWarnings.length).toBeGreaterThan(0);
  });

  it('should analyze AC complaints and return schema-valid results with safety warnings', async () => {
    const result = await provider.analyzeServiceTicket({
      ticketNumber: 'AC-2026-TEST',
      serviceType: 'AC',
      complaint: 'Split AC running but blowing warm air and not cooling',
      symptoms: ['Blowing warm air'],
      errorCode: '',
      assetDetails: {
        capacityTR: 1.5,
        brand: 'Daikin',
        acType: 'SPLIT',
      },
    });

    const validated = aiOutputSchema.safeParse(result);
    expect(validated.success).toBe(true);

    expect(result.serviceType).toBe('AC');
    expect(result.possibleIssues.length).toBeGreaterThan(0);
    expect(result.diagnosticSteps.length).toBeGreaterThan(0);
    expect(result.recommendedTools).toContain('MULTIMETER');
    expect(result.safetyWarnings.length).toBeGreaterThan(0);
  });
});
