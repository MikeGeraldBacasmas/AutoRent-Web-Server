import { Router } from 'express';
import { callProc } from '../db.js';

const router = Router();

const mapBilling = b => ({
  id: String(b.id), reservationId: String(b.reservation_id), customerId: String(b.customer_id),
  totalAmount: Number(b.total_amount), status: b.status, createdAt: b.created_at,
});
const mapPayment = p => ({
  id: String(p.id), billingId: String(p.billing_id), customerId: String(p.customer_id),
  amount: Number(p.amount), changeAmount: Number(p.change_amount), paymentMethod: p.payment_method, paidAt: p.paid_at,
});

router.get('/', async (_req, res, next) => {
  try { res.json((await callProc('sp_get_all_billings') || []).map(mapBilling)); } catch (err) { next(err); }
});
router.post('/', async (req, res, next) => {
  try {
    const { reservationId, customerId, totalAmount } = req.body;
    const rows = await callProc('sp_create_billing', [reservationId, customerId, totalAmount]);
    res.status(201).json(mapBilling(rows[0]));
  } catch (err) { next(err); }
});
router.get('/payments', async (_req, res, next) => {
  try { res.json((await callProc('sp_get_all_payments') || []).map(mapPayment)); } catch (err) { next(err); }
});
router.post('/payments', async (req, res, next) => {
  try {
    const { billingId, customerId, amount, changeAmount, paymentMethod } = req.body;
    const rows = await callProc('sp_create_payment', [billingId, customerId, amount, changeAmount, paymentMethod ?? 'Cash']);
    res.status(201).json(mapPayment(rows[0]));
  } catch (err) { next(err); }
});

export default router;
