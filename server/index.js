import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

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
const PORT = process.env.SERVER_PORT || 4000;

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:8443' }));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));

// Health check

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

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

app.listen(PORT, () => {
  console.log(`RentRide API running on http://localhost:${PORT}`);
});
