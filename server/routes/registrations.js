import { Router } from 'express';
import bcrypt from 'bcryptjs';
import pool, { callProc } from '../db.js';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import Tesseract from 'tesseract.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOADS_DIR = process.env.VERCEL
  ? path.join(os.tmpdir(), 'autorent-uploads', 'licenses')
  : path.join(__dirname, '..', 'uploads', 'licenses');
try {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
} catch (err) {
  console.warn('Could not initialize uploads directory:', err);
}

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
    licenseNumber: r.license_number ?? r.licenseNumber ?? '',
    licenseType: r.license_type ?? r.licenseType ?? '',
    licenseExpiry: r.license_expiry ?? r.licenseExpiry ?? '',
    licenseRestrictionCodes: r.license_restriction_codes ?? r.licenseRestrictionCodes ?? '',
    licenseFrontUrl: r.license_front_url ?? r.licenseFrontUrl ?? '',
    licenseBackUrl: r.license_back_url ?? r.licenseBackUrl ?? '',
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

// POST /api/registrations/upload-license
router.post('/upload-license', async (req, res) => {
  try {
    const { fileData, fileName, fileType } = req.body || {};

    if (!fileData || typeof fileData !== 'string') {
      return res.status(400).json({ error: 'No file data provided.' });
    }

    const matches = fileData.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    let mimeType = fileType || 'image/jpeg';
    let base64Buffer;

    if (matches && matches.length === 3) {
      mimeType = matches[1];
      base64Buffer = Buffer.from(matches[2], 'base64');
    } else {
      base64Buffer = Buffer.from(fileData, 'base64');
    }

    const MAX_SIZE = 5 * 1024 * 1024;
    if (base64Buffer.length > MAX_SIZE) {
      return res.status(400).json({ error: 'File size exceeds 5MB limit.' });
    }

    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];

    const ext = fileName ? path.extname(fileName).toLowerCase() : (mimeType === 'application/pdf' ? '.pdf' : '.jpg');
    if (!allowedExtensions.includes(ext) && !allowedMimes.includes(mimeType)) {
      return res.status(400).json({ error: 'Invalid file format.' });
    }

    const safeExt = allowedExtensions.includes(ext) ? ext : '.jpg';
    const storedFilename = `license_${Date.now()}_${Math.random().toString(36).substring(2, 10)}${safeExt}`;
    const targetPath = path.join(UPLOADS_DIR, storedFilename);

    await fs.promises.writeFile(targetPath, base64Buffer);

    // Build full URL so frontend can display the image regardless of which port it runs on
    const origin = `${req.protocol}://${req.get('host') || 'localhost:4000'}`;
    const fileUrl = `${origin}/api/reservations/license-file/${storedFilename}`;
    res.status(201).json({
      success: true,
      fileUrl,
      fileName: fileName || storedFilename,
      mimeType,
      sizeBytes: base64Buffer.length,
    });
  } catch (err) {
    console.error('License upload error:', err);
    res.status(500).json({ error: 'Failed to upload license document.' });
  }
});

// POST /api/registrations/ocr
router.post('/ocr', async (req, res) => {
  try {
    const { fileData } = req.body;
    if (!fileData) return res.status(400).json({ error: 'No image provided for OCR.' });
    
    let buffer;
    const matches = fileData.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      buffer = Buffer.from(matches[2], 'base64');
    } else {
      buffer = Buffer.from(fileData, 'base64');
    }

    const { data: { text } } = await Tesseract.recognize(buffer, 'eng');
    
    // Very basic regex-based extraction
    const numMatch = text.match(/[A-Z0-9]{1,3}-\d{2}-\d{6}/);
    const licenseNumber = numMatch ? numMatch[0] : '';
    
    let licenseType = '';
    const textUpper = text.toUpperCase();
    if (textUpper.includes('NON-PRO') || textUpper.includes('NON PRO')) licenseType = 'Non-Professional';
    else if (textUpper.includes('PRO') || textUpper.includes('PROFESSIONAL')) licenseType = 'Professional';
    else if (textUpper.includes('STUDENT')) licenseType = 'Student Permit';
    
    let licenseExpiry = '';
    const dateMatch = text.match(/(?:EXP|Expiration|Valid Until).*?(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4}|\d{4}[\/\-\.]\d{2}[\/\-\.]\d{2})/i)
                   || text.match(/(\d{4}[\/\-\.]\d{2}[\/\-\.]\d{2})/);
    if (dateMatch) {
       const rawDate = dateMatch[1].replace(/[\/\-\.]/g, '-');
       if (rawDate.match(/^\d{4}-\d{2}-\d{2}$/)) licenseExpiry = rawDate;
    }
    
    res.json({
       licenseNumber,
       licenseType,
       licenseExpiry,
       licenseRestrictionCodes: '',
       rawText: text
    });
  } catch (err) {
    console.error('OCR error:', err);
    res.status(500).json({ error: 'OCR failed.' });
  }
});

// GET /api/registrations/check-license?licenseNumber=...
router.get('/check-license', async (req, res, next) => {
  try {
    const rawNumber = req.query.licenseNumber;
    if (!rawNumber || typeof rawNumber !== 'string') {
      return res.status(400).json({ error: 'License number is required.' });
    }

    const clean = rawNumber.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!clean) {
      return res.json({ exists: false });
    }

    // 1. Check users table
    const [existingUsers] = await pool.query(
      `SELECT id, username, full_name, is_active FROM users 
       WHERE REPLACE(REPLACE(IFNULL(license_number, ''), '-', ''), ' ', '') = ? 
       LIMIT 1`,
      [clean]
    );

    if (existingUsers && existingUsers.length > 0) {
      return res.json({
        exists: true,
        type: 'registered',
        message: "This driver's license number is already registered to an account. If this is your account, please log in."
      });
    }

    // 2. Check pending / approved registration requests
    const [existingReqs] = await pool.query(
      `SELECT id, status, first_name, last_name FROM registration_requests 
       WHERE REPLACE(REPLACE(IFNULL(license_number, ''), '-', ''), ' ', '') = ? 
         AND status IN ('pending', 'approved')
       LIMIT 1`,
      [clean]
    );

    if (existingReqs && existingReqs.length > 0) {
      const isApproved = existingReqs[0].status === 'approved';
      return res.json({
        exists: true,
        type: isApproved ? 'registered' : 'pending',
        message: isApproved
          ? "This driver's license is already associated with an approved account. Please log in."
          : "An application with this driver's license number is already pending review by the administrator."
      });
    }

    return res.json({ exists: false });
  } catch (err) {
    next(err);
  }
});

// POST /api/registrations
router.post('/', async (req, res, next) => {
  try {
    const { lastName, firstName, middleName, gender, contactNumber, address, dateOfBirth, civilStatus, licenseNumber, licenseType, licenseExpiry, licenseRestrictionCodes, licenseFrontUrl, licenseBackUrl } = req.body;

    // Validate duplicate driver's license before creating request
    if (licenseNumber) {
      const clean = String(licenseNumber).trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (clean) {
        const [existingUsers] = await pool.query(
          `SELECT id FROM users 
           WHERE REPLACE(REPLACE(IFNULL(license_number, ''), '-', ''), ' ', '') = ? 
           LIMIT 1`,
          [clean]
        );
        if (existingUsers && existingUsers.length > 0) {
          return res.status(409).json({
            error: "This driver's license number is already registered to an existing account. Please log in or contact support."
          });
        }

        const [existingReqs] = await pool.query(
          `SELECT id, status FROM registration_requests 
           WHERE REPLACE(REPLACE(IFNULL(license_number, ''), '-', ''), ' ', '') = ? 
             AND status IN ('pending', 'approved')
           LIMIT 1`,
          [clean]
        );
        if (existingReqs && existingReqs.length > 0) {
          const isApproved = existingReqs[0].status === 'approved';
          return res.status(409).json({
            error: isApproved
              ? "This driver's license number is already registered to an approved account. Please log in."
              : "A registration request with this driver's license number is already pending administrator review."
          });
        }
      }
    }

    const rows = await callProc('sp_create_registration_request', [
      lastName, firstName, middleName ?? '', gender, contactNumber, address, dateOfBirth, civilStatus,
      licenseNumber ?? '', licenseType ?? '', licenseExpiry ?? null, licenseRestrictionCodes ?? '', licenseFrontUrl ?? '', licenseBackUrl ?? ''
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
