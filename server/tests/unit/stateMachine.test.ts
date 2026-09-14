import { describe, it, expect } from 'vitest';
import { isValidStatusTransition } from '../../src/services/ticketService';

describe('Ticket State Machine Unit Tests', () => {
  it('should allow valid sequential status transitions for technician', () => {
    expect(isValidStatusTransition('NEW', 'AI_ANALYZED', false)).toBe(true);
    expect(isValidStatusTransition('AI_ANALYZED', 'ASSIGNED', false)).toBe(true);
    expect(isValidStatusTransition('ASSIGNED', 'ACCEPTED', false)).toBe(true);
    expect(isValidStatusTransition('ACCEPTED', 'ON_THE_WAY', false)).toBe(true);
    expect(isValidStatusTransition('ON_THE_WAY', 'ON_SITE', false)).toBe(true);
    expect(isValidStatusTransition('ON_SITE', 'DIAGNOSING', false)).toBe(true);
    expect(isValidStatusTransition('DIAGNOSING', 'REPAIRING', false)).toBe(true);
    expect(isValidStatusTransition('REPAIRING', 'COMPLETED', false)).toBe(true);
  });

  it('should reject invalid status jumps for non-manager', () => {
    // Technician cannot jump from NEW directly to COMPLETED
    expect(isValidStatusTransition('NEW', 'COMPLETED', false)).toBe(false);
    // Cannot jump from ASSIGNED directly to REPAIRING without being on site
    expect(isValidStatusTransition('ASSIGNED', 'REPAIRING', false)).toBe(false);
    // Terminal completed state cannot transition arbitrarily
    expect(isValidStatusTransition('COMPLETED', 'NEW', false)).toBe(false);
  });

  it('should allow manager operational overrides for open jobs', () => {
    expect(isValidStatusTransition('NEW', 'ASSIGNED', true)).toBe(true);
    expect(isValidStatusTransition('ASSIGNED', 'WAITING_FOR_ASSIGNMENT', true)).toBe(true);
  });
});
