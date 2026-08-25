import { Router } from 'express';
import { callProc } from '../db.js';

const router = Router();

function mapMaintenance(m) {
  if (!m) return m;
  return {
    id: String(m.id),
    vehicleId: String(m.vehicle_id ?? m.vehicleId ?? ''),
    reportedBy: String(m.reported_by ?? m.reportedBy ?? ''),
    description: m.description ?? '',
    maintenanceDate: m.maintenance_date ?? m.maintenanceDate ?? new Date().toISOString().split('T')[0],
    cost: Number(m.cost ?? 0),
    status: m.status ?? 'Pending',
  };
}

// GET /api/maintenance
router.get('/', async (_req, res, next) => {
  try {
    const rows = await callProc('sp_get_all_maintenance');
    res.json((rows || []).map(mapMaintenance));
  } catch (err) { next(err); }
});

// GET /api/maintenance/:id
router.get('/:id', async (req, res, next) => {
  try {
    const rows = await callProc('sp_get_maintenance_by_id', [req.params.id]);
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Record not found.' });
    res.json(mapMaintenance(rows[0]));
  } catch (err) { next(err); }
});

// POST /api/maintenance
router.post('/', async (req, res, next) => {
  try {
    const { vehicleId, reportedBy, description, maintenanceDate, cost } = req.body;
    const rows = await callProc('sp_create_maintenance', [
      vehicleId,
      reportedBy,
      description,
      maintenanceDate || new Date().toISOString().split('T')[0],
      cost ?? 0,
    ]);
    res.status(201).json(mapMaintenance(rows[0]));
  } catch (err) { next(err); }
});

// PATCH /api/maintenance/:id
router.patch('/:id', async (req, res, next) => {
  try {
    const { status, cost, description } = req.body;
    const rows = await callProc('sp_update_maintenance', [
      req.params.id,
      status ?? null,
      cost !== undefined ? Number(cost) : null,
      description ?? null,
    ]);
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Record not found.' });
    res.json(mapMaintenance(rows[0]));
  } catch (err) { next(err); }
});

// DELETE /api/maintenance/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await callProc('sp_delete_maintenance', [req.params.id]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;

