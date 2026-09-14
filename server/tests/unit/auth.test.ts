import { describe, it, expect } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

describe('Auth & Password Security Unit Tests', () => {
  it('should securely hash and verify passwords using bcrypt', async () => {
    const rawPassword = 'Demo@12345';
    const hash = await bcrypt.hash(rawPassword, 10);

    expect(hash).not.toBe(rawPassword);
    expect(hash.startsWith('$2')).toBe(true);

    const isMatch = await bcrypt.compare(rawPassword, hash);
    expect(isMatch).toBe(true);

    const isWrong = await bcrypt.compare('WrongPass@123', hash);
    expect(isWrong).toBe(false);
  });

  it('should sign and verify JWT tokens containing user identity and role', () => {
    const payload = {
      userId: '65f1234567890abcdef12345',
      companyId: '65f1234567890abcdef99999',
      role: 'SERVICE_MANAGER',
    };
    const secret = 'test-secret-key-123456';

    const token = jwt.sign(payload, secret, { expiresIn: '1h' });
    expect(typeof token).toBe('string');

    const decoded = jwt.verify(token, secret) as typeof payload;
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.role).toBe('SERVICE_MANAGER');
  });
});
