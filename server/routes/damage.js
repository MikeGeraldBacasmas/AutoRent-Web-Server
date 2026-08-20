import { Router } from 'express';
import { callProc } from '../db.js';

const router = Router();

// GET /api/damage-reports
router.get('/', async (_req, res, next) => {
  try {
    const rows = await callProc('sp_get_all_damage_reports');
    res.json(rows);
  } catch (err) { next(err); }
});

// POST /api/damage-reports
router.post('/', async (req, res, next) => {
  try {
    const { rentalId, vehicleId, reportedBy, description, estimatedCost } = req.body;
    const rows = await callProc('sp_create_damage_report', [
      rentalId, vehicleId, reportedBy, description, estimatedCost ?? 0,
    ]);
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

export default router;
