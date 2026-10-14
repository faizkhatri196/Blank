import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from local or parent directory
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const ENV = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  UPLOAD_DIR: process.env.UPLOAD_DIR || path.resolve(process.cwd(), 'uploads'),
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/ai_field_service_copilot',
  TEST_MONGODB_URI: process.env.TEST_MONGODB_URI || '',
  JWT_SECRET: process.env.JWT_SECRET || 'fallback-dev-secret-change-in-production-min-32-chars',
  AI_PROVIDER: (process.env.AI_PROVIDER || 'demo').toLowerCase(),
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  GROQ_MODEL: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  SARVAM_API_KEY: process.env.SARVAM_API_KEY || '',
};

export function validateEnv() {
  const missing: string[] = [];
  if (!ENV.MONGODB_URI) missing.push('MONGODB_URI');
  if (!ENV.JWT_SECRET) missing.push('JWT_SECRET');

  if (missing.length > 0) {
    console.warn(`[Config Warning] Missing suggested env vars: ${missing.join(', ')}`);
  }

  console.log(`[Config] Servora initialized: Mode=${ENV.NODE_ENV}, Port=${ENV.PORT}, AI Provider=${ENV.AI_PROVIDER}`);
}

