import { Router } from 'express';
import { callProc } from '../db.js';

const router = Router();

function mapRental(r) {
  if (!r) return r;
  return {
    id: String(r.id),
    reservationId: String(r.reservation_id ?? r.reservationId ?? ''),
    staffId: r.staff_id ? String(r.staff_id) : String(r.staffId ?? ''),
    releaseDate: r.release_date ?? r.releaseDate ?? '',
    expectedReturnDate: r.expected_return_date ?? r.expectedReturnDate ?? '',
    actualReturnDate: r.actual_return_date ?? r.actualReturnDate ?? undefined,
    status: r.status ?? 'Active',
    remarks: r.remarks ?? undefined,
  };
}

// GET /api/rentals
router.get('/', async (_req, res, next) => {
  try {
    const rows = await callProc('sp_get_all_rentals');
    res.json((rows || []).map(mapRental));
  } catch (err) { next(err); }
});

// GET /api/rentals/:id
router.get('/:id', async (req, res, next) => {
  try {
    const rows = await callProc('sp_get_rental_by_id', [req.params.id]);
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Rental not found.' });
    res.json(mapRental(rows[0]));
  } catch (err) { next(err); }
});

// POST /api/rentals
router.post('/', async (req, res, next) => {
  try {
    const { reservationId, staffId, releaseDate, expectedReturnDate, remarks } = req.body;
    const rows = await callProc('sp_create_rental', [
      reservationId, staffId, releaseDate, expectedReturnDate, remarks ?? '',
    ]);
    res.status(201).json(mapRental(rows[0]));
  } catch (err) { next(err); }
});

// PATCH /api/rentals/:id
router.patch('/:id', async (req, res, next) => {
  try {
    const { actualReturnDate, status, remarks } = req.body;
    const rows = await callProc('sp_update_rental', [
      req.params.id,
      actualReturnDate ?? null,
      status ?? null,
      remarks ?? null,
    ]);
    res.json(mapRental(rows[0]));
  } catch (err) { next(err); }
});

export default router;
