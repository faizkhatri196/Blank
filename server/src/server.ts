import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import { ENV, validateEnv } from './config/env';
import { connectDB, disconnectDB } from './config/db';
import apiRoutes from './routes';

validateEnv();

const app = express();

// Security and middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

const allowedOrigins = ENV.CLIENT_URL ? ENV.CLIENT_URL.split(',').map((u) => u.trim()) : [];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman)
      if (!origin) return callback(null, true);
      // Allow localhost in development
      if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        return callback(null, true);
      }
      // Check configured CLIENT_URL
      if (allowedOrigins.length > 0 && allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      // If no specific client origin is set or in non-production, permit for testing
      if (ENV.NODE_ENV !== 'production' || allowedOrigins.length === 0) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS policy'));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (ENV.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Serve uploaded images statically
const uploadPath = path.resolve(process.cwd(), ENV.UPLOAD_DIR);
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}
app.use('/uploads', express.static(uploadPath));

// Public deployment health check endpoint (as specified: GET /health -> { "status": "ok" })
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

// API router (includes /api/health with detailed DB/AI telemetry)
app.use('/api', apiRoutes);

// Serve client static build if available (unified full-stack deployment)
const potentialDistPaths = [
  path.resolve(process.cwd(), '../client/dist'),
  path.resolve(process.cwd(), 'client/dist'),
  path.resolve(__dirname, '../../client/dist'),
];
const clientDist = potentialDistPaths.find((p) => fs.existsSync(path.join(p, 'index.html')));

if (clientDist) {
  console.log(`[Static] Serving frontend SPA from: ${clientDist}`);
  app.use(express.static(clientDist));
  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.startsWith('/health')) {
      return next();
    }
    res.sendFile(path.join(clientDist, 'index.html'));
  });
} else {
  // Fallback API root greeting if client not built into dist
  app.get('/', (_req: Request, res: Response) => {
    res.json({
      name: 'Servora API',
      tagline: 'AI-powered field service operations',
      status: 'online',
      version: '0.1.0',
      mode: ENV.NODE_ENV,
      health: '/health',
      telemetry: '/api/health',
    });
  });
}

// 404 Handler for unhandled API routes
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Cannot ${req.method} ${req.originalUrl}`,
    },
  });
});

// Global Error Handler (Production-safe, never leaks stack traces or credentials)
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Server Error]', err.message || err);

  const statusCode = err.status || err.statusCode || 500;
  const message = ENV.NODE_ENV === 'production' && statusCode === 500
    ? 'Internal server error. Please try again later.'
    : err.message || 'An unexpected error occurred';

  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'SERVER_ERROR',
      message,
    },
  });
});

let serverInstance: any = null;

export async function startServer() {
  try {
    await connectDB();
    serverInstance = app.listen(ENV.PORT, '0.0.0.0', () => {
      console.log(`[Server] Servora API running at http://0.0.0.0:${ENV.PORT}`);
    });
  } catch (error: any) {
    console.error('[Fatal] Failed to start server:', error.message);
    process.exit(1);
  }
}

// Handle termination signals
process.on('SIGINT', async () => {
  console.log('\n[Process] SIGINT received, shutting down gracefully...');
  if (serverInstance) serverInstance.close();
  await disconnectDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n[Process] SIGTERM received, shutting down gracefully...');
  if (serverInstance) serverInstance.close();
  await disconnectDB();
  process.exit(0);
});

// Start if not imported as module
if (require.main === module) {
  startServer();
}

export default app;
