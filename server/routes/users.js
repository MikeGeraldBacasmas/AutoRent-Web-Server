import { Router } from 'express';
import bcrypt from 'bcryptjs';
import pool, { callProc } from '../db.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

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
    createdAt: u.created_at || '',
    updatedAt: u.updated_at || '',
    firstName: u.first_name || '',
    middleName: u.middle_name || '',
    lastName: u.last_name || '',
    gender: u.gender || '',
    contactNumber: u.contact_number || '',
    phone: u.contact_number || '',
    address: u.address || '',
    dateOfBirth: u.date_of_birth || '',
    civilStatus: u.civil_status || '',
    licenseNumber: u.license_number_profile || u.license_number || '',
    licenseType: u.license_type_profile || u.license_type || '',
    licenseExpiry: u.license_expiry_profile || u.license_expiry || '',
    licenseRestrictionCodes: u.license_restriction_codes_profile || u.license_restriction_codes || '',
    licenseFrontUrl: u.license_front_url_profile || u.license_front_url || '',
    licenseBackUrl: u.license_back_url_profile || u.license_back_url || '',
    submittedAt: u.submitted_at || '',
  };
}

// GET /api/users
router.get('/', verifyToken, requireRole(['admin', 'staff']), async (_req, res, next) => {
  try {
    const rows = await callProc('sp_get_all_users');
    res.json((rows || []).map(mapUser));
  } catch (err) { next(err); }
});

// GET /api/users/:id
router.get('/:id', verifyToken, async (req, res, next) => {
  try {
    const rows = await callProc('sp_get_user_by_id', [req.params.id]);
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'User not found.' });
    res.json(mapUser(rows[0]));
  } catch (err) { next(err); }
});

// POST /api/users (Hashes password before storing in MySQL)
router.post('/', verifyToken, requireRole(['admin']), async (req, res, next) => {
  try {
    const { username, password, role, status, isActive } = req.body;
    const fullName = req.body.fullName || req.body.name || [req.body.firstName, req.body.lastName].filter(Boolean).join(' ') || username;
    const activeFlag = status === 'inactive' || isActive === false ? 0 : 1;
    const rawPassword = password || 'password123';

    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const rows = await callProc('sp_create_user', [
      username, fullName, hashedPassword, role ?? 'staff', activeFlag,
    ]);
    res.status(201).json(mapUser(rows[0]));
  } catch (err) { next(err); }
});

// PATCH /api/users/:id
router.patch('/:id', verifyToken, async (req, res, next) => {
  try {
    const {
      username, password, currentPassword, role: _role, status, isActive,
      firstName, middleName, lastName, gender, contactNumber, phone,
      address, dateOfBirth, civilStatus,
    } = req.body;

    let computedFullName = req.body.fullName ?? req.body.name ?? null;
    if (!computedFullName && (firstName || lastName)) {
      computedFullName = [firstName, middleName, lastName].filter(Boolean).join(' ');
    }

    let activeFlag = null;
    if (status !== undefined) {
      activeFlag = status === 'active' ? 1 : 0;
    } else if (isActive !== undefined) {
      activeFlag = isActive ? 1 : 0;
    }

    let hashedPassword = null;
    if (password && password.trim().length > 0) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required to change password.' });
      }
      const [existingUsers] = await pool.query('SELECT password FROM users WHERE id = ?', [req.params.id]);
      if (!existingUsers || existingUsers.length === 0) {
        return res.status(404).json({ error: 'User not found.' });
      }
      const existingUser = existingUsers[0];
      let isMatch = false;
      if (existingUser.password && (existingUser.password.startsWith('$2a$') || existingUser.password.startsWith('$2b$') || existingUser.password.startsWith('$2y$'))) {
        isMatch = await bcrypt.compare(currentPassword, existingUser.password);
      } else {
        isMatch = existingUser.password === currentPassword;
      }
      if (!isMatch) {
        return res.status(400).json({ error: 'Current password is incorrect.' });
      }
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const rows = await callProc('sp_update_user', [
      req.params.id,
      computedFullName,
      username ?? null,
      hashedPassword,
      activeFlag,
      firstName ?? null,
      middleName ?? null,
      lastName ?? null,
      gender ?? null,
      contactNumber ?? phone ?? null,
      address ?? null,
      dateOfBirth ?? null,
      civilStatus ?? null,
    ]);
    res.json(mapUser(rows[0]));
  } catch (err) { next(err); }
});

// PATCH /api/users/:id/toggle-status
router.patch('/:id/toggle-status', verifyToken, requireRole(['admin']), async (req, res, next) => {
  try {
    const rows = await callProc('sp_toggle_user_status', [req.params.id]);
    res.json(mapUser(rows[0]));
  } catch (err) { next(err); }
});

// DELETE /api/users/:id
router.delete('/:id', verifyToken, requireRole(['admin']), async (req, res, next) => {
  try {
    await callProc('sp_delete_user', [req.params.id]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
