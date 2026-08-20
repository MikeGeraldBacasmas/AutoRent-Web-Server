import { Router } from 'express';
import { callProc } from '../db.js';

const router = Router();

function mapReservation(r) {
  if (!r) return r;
  return {
    id: String(r.id),
    customerId: r.customer_id ? String(r.customer_id) : String(r.customerId ?? ''),
    vehicleId: String(r.vehicle_id ?? r.vehicleId ?? ''),
    pickupDate: r.pickup_date ?? r.pickupDate ?? '',
    pickupTime: r.pickup_time ?? r.pickupTime ?? '',
    returnDate: r.return_date ?? r.returnDate ?? '',
    returnTime: r.return_time ?? r.returnTime ?? '',
    pickupLocation: r.pickup_location ?? r.pickupLocation ?? '',
    returnLocation: r.return_location ?? r.returnLocation ?? '',
    totalAmount: Number(r.total_amount ?? r.totalAmount ?? 0),
    status: r.status ?? 'Pending',
    gracePeriodMinutes: Number(r.grace_period_minutes ?? r.gracePeriodMinutes ?? 30),
    actualPickupTime: r.actual_pickup_time ?? r.actualPickupTime ?? undefined,
    noShowAt: r.no_show_at ?? r.noShowAt ?? undefined,
    noShowReason: r.no_show_reason ?? r.noShowReason ?? undefined,
    remarks: r.remarks ?? undefined,
    createdAt: r.created_at ?? r.createdAt ?? new Date().toISOString().split('T')[0],
  };
}

// GET /api/reservations
router.get('/', async (_req, res, next) => {
  try {
    const rows = await callProc('sp_get_all_reservations');
    res.json((rows || []).map(mapReservation));
  } catch (err) { next(err); }
});

// GET /api/reservations/:id
router.get('/:id', async (req, res, next) => {
  try {
    const rows = await callProc('sp_get_reservation_by_id', [req.params.id]);
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Reservation not found.' });
    res.json(mapReservation(rows[0]));
  } catch (err) { next(err); }
});

// POST /api/reservations
router.post('/', async (req, res, next) => {
  try {
    const { customerId, vehicleId, pickupDate, pickupTime, returnDate, returnTime,
            pickupLocation, returnLocation, totalAmount, gracePeriodMinutes, remarks } = req.body;
    const rows = await callProc('sp_create_reservation', [
      customerId, vehicleId, pickupDate, pickupTime, returnDate, returnTime,
      pickupLocation, returnLocation, totalAmount, gracePeriodMinutes ?? 30, remarks ?? '',
    ]);
    res.status(201).json(mapReservation(rows[0]));
  } catch (err) { next(err); }
});

// PATCH /api/reservations/:id
router.patch('/:id', async (req, res, next) => {
  try {
    const { status, gracePeriodMinutes, actualPickupTime, noShowAt, noShowReason } = req.body;
    const rows = await callProc('sp_update_reservation', [
      req.params.id,
      status ?? null,
      gracePeriodMinutes ?? null,
      actualPickupTime ?? null,
      noShowAt ?? null,
      noShowReason ?? null,
    ]);
    res.json(mapReservation(rows[0]));
  } catch (err) { next(err); }
});

export default router;
