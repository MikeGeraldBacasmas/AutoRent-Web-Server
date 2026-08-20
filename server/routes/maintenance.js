import { Router } from 'express';
import { callProc } from '../db.js';

const router = Router();

// GET /api/maintenance
router.get('/', async (_req, res, next) => {
  try {
    const rows = await callProc('sp_get_all_maintenance');
    res.json(rows);
  } catch (err) { next(err); }
});

// GET /api/maintenance/:id
router.get('/:id', async (req, res, next) => {
  try {
    const rows = await callProc('sp_get_maintenance_by_id', [req.params.id]);
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Record not found.' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// POST /api/maintenance
router.post('/', async (req, res, next) => {
  try {
    const { vehicleId, reportedBy, description, maintenanceDate, cost } = req.body;
    const rows = await callProc('sp_create_maintenance', [
      vehicleId, reportedBy, description, maintenanceDate, cost ?? 0,
    ]);
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// PATCH /api/maintenance/:id
router.patch('/:id', async (req, res, next) => {
  try {
    const { status, cost } = req.body;
    const rows = await callProc('sp_update_maintenance', [
      req.params.id, status ?? null, cost ?? null,
    ]);
    res.json(rows[0]);
  } catch (err) { next(err); }
});

export default router;
