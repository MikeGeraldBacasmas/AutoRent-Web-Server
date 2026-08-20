import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { callProc } from '../db.js';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password are required.' });

    const rows = await callProc('sp_login', [username]);
    if (!rows || rows.length === 0) return res.status(401).json({ error: 'Invalid username or password.' });

    const user = rows[0];

    // Check hashed password with bcrypt (supports bcrypt hash and legacy plain text fallback)
    let isMatch = false;
    if (user.password && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$') || user.password.startsWith('$2y$'))) {
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      isMatch = user.password === password;
    }

    if (!isMatch) return res.status(401).json({ error: 'Invalid username or password.' });

    // Map to frontend-friendly shape; never send password
    const isActive = user.is_active === 1 || user.is_active === true;
    res.json({
      user: {
        id: String(user.id),
        username: user.username,
        name: user.full_name || user.username,
        fullName: user.full_name || user.username,
        role: user.role,
        status: isActive ? 'active' : 'inactive',
        isActive,
        createdAt: user.created_at || '',
        updatedAt: user.updated_at || '',
        firstName: user.first_name || '',
        middleName: user.middle_name || '',
        lastName: user.last_name || '',
        gender: user.gender || '',
        contactNumber: user.contact_number || '',
        phone: user.contact_number || '',
        address: user.address || '',
        dateOfBirth: user.date_of_birth || '',
        civilStatus: user.civil_status || '',
        submittedAt: user.submitted_at || '',
      }
    });
  } catch (err) { next(err); }
});

export default router;
