import { Router } from 'express';
import { callProc } from '../db.js';

const router = Router();

function mapNotification(n) {
  if (!n) return n;
  return {
    id: String(n.id),
    userId: String(n.user_id ?? n.userId ?? ''),
    message: n.message ?? '',
    type: n.type ?? 'info',
    read: Boolean(n.read ?? n.is_read),
    createdAt: n.created_at ?? n.createdAt ?? new Date().toISOString().split('T')[0],
  };
}

// GET /api/notifications?userId=xxx
router.get('/', async (req, res, next) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId query param required.' });
    const rows = await callProc('sp_get_notifications_for_user', [userId]);
    res.json((rows || []).map(mapNotification));
  } catch (err) { next(err); }
});

// POST /api/notifications
router.post('/', async (req, res, next) => {
  try {
    const { userId, message, type } = req.body;
    const rows = await callProc('sp_create_notification', [userId, message, type ?? 'info']);
    res.status(201).json(mapNotification(rows[0]));
  } catch (err) { next(err); }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', async (req, res, next) => {
  try {
    await callProc('sp_mark_notification_read', [req.params.id]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// PATCH /api/notifications/read-all?userId=xxx
router.patch('/read-all', async (req, res, next) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId query param required.' });
    await callProc('sp_mark_all_notifications_read', [userId]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
