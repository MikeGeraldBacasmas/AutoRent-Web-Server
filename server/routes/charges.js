import { Router } from 'express';
import { callProc } from '../db.js';

const router = Router();

function mapCharge(c) {
  return {
    id: String(c.id), rentalId: String(c.rental_id), customerId: String(c.customer_id), customerName: c.customer_name,
    vehicleId: String(c.vehicle_id), description: c.description ?? '', amount: Number(c.amount ?? 0),
    status: c.status ?? 'Unpaid', paidAt: c.paid_at ?? undefined, createdAt: c.created_at,
  };
}

router.get('/', async (_req, res, next) => {
  try { res.json((await callProc('sp_get_all_charges') || []).map(mapCharge)); } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { rentalId, customerId, vehicleId, description, amount } = req.body;
    const rows = await callProc('sp_create_charge', [rentalId, customerId, vehicleId, description, amount]);
    res.status(201).json(mapCharge(rows[0]));
  } catch (err) { next(err); }
});

router.post('/:id/pay', async (req, res, next) => {
  try {
    const rows = await callProc('sp_pay_charge', [req.params.id]);
    res.json(mapCharge(rows[0]));
  } catch (err) { next(err); }
});

export default router;
