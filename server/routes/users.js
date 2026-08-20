import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { callProc } from '../db.js';

const router = Router();

function mapUser(u) {
  if (!u) return u;
  const isActive = u.is_active === 1 || u.is_active === true;
  return {
    id: String(u.id),
    username: u.username,
    name: u.full_name || u.username,
    fullName: u.full_name || u.username,
    role: u.role,
    status: isActive ? 'active' : 'inactive',
    isActive,
    createdAt: u.created_at ? u.created_at.split(' ')[0] : '',
    updatedAt: u.updated_at ? u.updated_at.split(' ')[0] : '',
  };
}

// GET /api/users
router.get('/', async (_req, res, next) => {
  try {
    const rows = await callProc('sp_get_all_users');
    res.json((rows || []).map(mapUser));
  } catch (err) { next(err); }
});

// GET /api/users/:id
router.get('/:id', async (req, res, next) => {
  try {
    const rows = await callProc('sp_get_user_by_id', [req.params.id]);
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'User not found.' });
    res.json(mapUser(rows[0]));
  } catch (err) { next(err); }
});

// POST /api/users (Hashes password before storing in MySQL)
router.post('/', async (req, res, next) => {
  try {
    const { username, password, role, status, isActive } = req.body;
    const fullName = req.body.fullName || req.body.name || [req.body.firstName, req.body.lastName].filter(Boolean).join(' ') || username;
    const activeFlag = status === 'inactive' || isActive === false ? 0 : 1;

    const hashedPassword = await bcrypt.hash(password || 'password123', 10);

    const rows = await callProc('sp_create_user', [
      username, fullName, hashedPassword, role ?? 'staff', activeFlag,
    ]);
    res.status(201).json(mapUser(rows[0]));
  } catch (err) { next(err); }
});

// PATCH /api/users/:id
router.patch('/:id', async (req, res, next) => {
  try {
    const { username, password, role: _role, status, isActive } = req.body;
    const fullName = req.body.fullName ?? req.body.name ?? null;

    let activeFlag = null;
    if (status !== undefined) {
      activeFlag = status === 'active' ? 1 : 0;
    } else if (isActive !== undefined) {
      activeFlag = isActive ? 1 : 0;
    }

    let hashedPassword = null;
    if (password && password.trim().length > 0) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const rows = await callProc('sp_update_user', [
      req.params.id,
      fullName,
      username ?? null,
      hashedPassword,
      activeFlag,
    ]);
    res.json(mapUser(rows[0]));
  } catch (err) { next(err); }
});

// PATCH /api/users/:id/toggle-status
router.patch('/:id/toggle-status', async (req, res, next) => {
  try {
    const rows = await callProc('sp_toggle_user_status', [req.params.id]);
    res.json(mapUser(rows[0]));
  } catch (err) { next(err); }
});

// DELETE /api/users/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await callProc('sp_delete_user', [req.params.id]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
