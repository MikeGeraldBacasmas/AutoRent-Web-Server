import express from 'express';
import cors from 'cors';
import { SERVER_PORT, CLIENT_ORIGINS } from './config.js';
import pool from './db.js';

import authRoutes          from './routes/auth.js';
import usersRoutes         from './routes/users.js';
import registrationsRoutes from './routes/registrations.js';
import vehiclesRoutes      from './routes/vehicles.js';
import reservationsRoutes  from './routes/reservations.js';
import rentalsRoutes       from './routes/rentals.js';
import maintenanceRoutes   from './routes/maintenance.js';
import damageRoutes        from './routes/damage.js';
import notificationsRoutes from './routes/notifications.js';
import billingRoutes       from './routes/billing.js';
import chargesRoutes       from './routes/charges.js';

const app  = express();
const PORT = SERVER_PORT;

// Trust proxy header when running behind Vercel / Render / reverse proxy
app.set('trust proxy', 1);

// CORS configuration: allow all origins (local dev, Hostinger, Vercel previews, mobile)
const corsOptions = {
  origin: (_origin, callback) => {
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Access-Control-Request-Private-Network'],
};

// Handle Chrome Private Network Access preflights when public sites (e.g. https://rentride.bscs4b.com) call localhost
app.use((req, res, next) => {
  if (req.headers['access-control-request-private-network']) {
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
  }
  next();
});

app.use(cors(corsOptions));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));

// Health check endpoints for Vercel, Render, and frontend monitoring
app.get('/', (_req, res) => res.json({ status: 'ok', service: 'AutoRent API', platform: process.env.VERCEL ? 'vercel' : 'node', timestamp: new Date().toISOString() }));
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'AutoRent API', platform: process.env.VERCEL ? 'vercel' : 'node', timestamp: new Date().toISOString() }));
app.get('/api/health', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT DATABASE() AS current_database');
    res.json({
      status: 'ok',
      service: 'AutoRent API',
      platform: process.env.VERCEL ? 'vercel' : 'node',
      database: rows[0]?.current_database || 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(503).json({
      status: 'degraded',
      service: 'AutoRent API',
      database: 'disconnected',
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Routes
app.use('/api/auth',           authRoutes);
app.use('/api/users',          usersRoutes);
app.use('/api/registrations',  registrationsRoutes);
app.use('/api/vehicles',       vehiclesRoutes);
app.use('/api/reservations',   reservationsRoutes);
app.use('/api/rentals',        rentalsRoutes);
app.use('/api/maintenance',    maintenanceRoutes);
app.use('/api/damage-reports', damageRoutes);
app.use('/api/notifications',  notificationsRoutes);
app.use('/api/billings',       billingRoutes);
app.use('/api/charges',        chargesRoutes);

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// Export Express app for Vercel Serverless Functions
export default app;

// Only bind a TCP listener when running outside Vercel Serverless (e.g. local laptop or Render container)
if (!process.env.VERCEL) {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`RentRide API running on port ${PORT}`);
  });

  const shutdown = (signal) => {
    console.log(`${signal} received: closing server...`);
    server.close(async () => {
      try {
        await pool.end();
        console.log('Database connections closed cleanly.');
      } catch (e) {
        console.error('Error closing database pool:', e);
      }
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}
