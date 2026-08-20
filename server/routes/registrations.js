import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { callProc } from '../db.js';

const router = Router();

function mapRegistration(r) {
  if (!r) return r;
  return {
    id: String(r.id),
    lastName: r.last_name ?? r.lastName ?? '',
    firstName: r.first_name ?? r.firstName ?? '',
    middleName: r.middle_name ?? r.middleName ?? '',
    gender: r.gender ?? '',
    contactNumber: r.contact_number ?? r.contactNumber ?? '',
    address: r.address ?? '',
    dateOfBirth: r.date_of_birth ?? r.dateOfBirth ?? '',
    civilStatus: r.civil_status ?? r.civilStatus ?? '',
    status: r.status ?? 'pending',
    rejectionReason: r.rejection_reason ?? r.rejectionReason ?? undefined,
    approvedUserId: r.approved_user_id ? String(r.approved_user_id) : (r.approvedUserId ? String(r.approvedUserId) : undefined),
    submittedAt: r.submitted_at ?? r.submittedAt ?? new Date().toISOString().split('T')[0],
  };
}

// GET /api/registrations
router.get('/', async (_req, res, next) => {
  try {
    const rows = await callProc('sp_get_all_registration_requests');
    res.json((rows || []).map(mapRegistration));
  } catch (err) { next(err); }
});

// POST /api/registrations
router.post('/', async (req, res, next) => {
  try {
    const { lastName, firstName, middleName, gender, contactNumber, address, dateOfBirth, civilStatus } = req.body;
    const rows = await callProc('sp_create_registration_request', [
      lastName, firstName, middleName ?? '', gender, contactNumber, address, dateOfBirth, civilStatus,
    ]);
    res.status(201).json(mapRegistration(rows[0]));
  } catch (err) { next(err); }
});

// POST /api/registrations/:id/approve (Hashes password before storing)
router.post('/:id/approve', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password are required.' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const rows = await callProc('sp_approve_registration', [req.params.id, username, hashedPassword]);
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// POST /api/registrations/:id/reject
router.post('/:id/reject', async (req, res, next) => {
  try {
    const { reason } = req.body;
    await callProc('sp_reject_registration', [req.params.id, reason ?? '']);
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
