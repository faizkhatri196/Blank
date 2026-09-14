import mongoose from 'mongoose';
import dns from 'node:dns';
import { ENV } from './env';

// Configure reliable DNS servers for MongoDB Atlas SRV lookup on Windows
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignore if not permitted
}

let isConnected = false;

export async function connectDB(): Promise<typeof mongoose> {
  if (isConnected) {
    return mongoose;
  }

  try {
    const conn = await mongoose.connect(ENV.MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
    });
    isConnected = true;
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}, database: ${conn.connection.name}`);
    return conn;
  } catch (error: any) {
    console.error('[MongoDB] Connection error:', error.message);
    throw error;
  }
}

export function getDBStatus(): { isConnected: boolean; host?: string; dbName?: string } {
  const state = mongoose.connection.readyState;
  return {
    isConnected: state === 1,
    host: mongoose.connection.host || 'unknown',
    dbName: mongoose.connection.name || 'unknown',
  };
}

export async function disconnectDB(): Promise<void> {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
    console.log('[MongoDB] Disconnected gracefully');
  }
}
