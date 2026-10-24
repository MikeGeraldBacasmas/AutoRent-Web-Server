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
import billingRoutes from './routes/billing.js';
import chargesRoutes from './routes/charges.js';

const app  = express();
const PORT = SERVER_PORT;

// Trust proxy header when running behind Render / reverse proxy
app.set('trust proxy', 1);

// CORS configuration: allow all origins (local dev, Hostinger, previews, mobile)
const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests and reflect any browser origin so local dev,
    // Hostinger, preview URLs, and production domains are never blocked.
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));

// Health check endpoints for Render and monitoring
app.get('/', (_req, res) => res.json({ status: 'ok', service: 'AutoRent API', timestamp: new Date().toISOString() }));
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'AutoRent API', timestamp: new Date().toISOString() }));
app.get('/api/health', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT DATABASE() AS current_database');
    res.json({
      status: 'ok',
      service: 'AutoRent API',
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
app.use('/api/auth',          authRoutes);
app.use('/api/users',         usersRoutes);
app.use('/api/registrations', registrationsRoutes);
app.use('/api/vehicles',      vehiclesRoutes);
app.use('/api/reservations',  reservationsRoutes);
app.use('/api/rentals',       rentalsRoutes);
app.use('/api/maintenance',   maintenanceRoutes);
app.use('/api/damage-reports',damageRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/billings', billingRoutes);
app.use('/api/charges', chargesRoutes);

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// Explicitly bind to 0.0.0.0 for Render container support
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`RentRide API running on port ${PORT}`);
});

// Graceful shutdown handling for Render deployments / restarts
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
