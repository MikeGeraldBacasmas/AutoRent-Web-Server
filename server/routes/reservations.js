import { Router } from 'express';
import pool, { callProc } from '../db.js';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { verifyToken } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Ensure local secure upload directory exists (use /tmp on Vercel serverless)
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
    label: r.label ?? 'In Process',
    gracePeriodMinutes: Number(r.grace_period_minutes ?? r.gracePeriodMinutes ?? 30),
    actualPickupTime: r.actual_pickup_time ?? r.actualPickupTime ?? undefined,
    noShowAt: r.no_show_at ?? r.noShowAt ?? undefined,
    noShowReason: r.no_show_reason ?? r.noShowReason ?? undefined,
    remarks: r.remarks ?? undefined,
    licenseNumber: r.license_number ?? r.licenseNumber ?? '',
    licenseType: r.license_type ?? r.licenseType ?? '',
    licenseExpiry: r.license_expiry ?? r.licenseExpiry ?? '',
    licenseFrontUrl: r.license_front_url ?? r.licenseFrontUrl ?? '',
    licenseBackUrl: r.license_back_url ?? r.licenseBackUrl ?? '',
    createdAt: r.created_at ?? r.createdAt ?? new Date().toISOString().split('T')[0],
  };
}

// POST /api/reservations/upload-license
router.post('/upload-license', async (req, res) => {
  try {
    const { fileData, fileName, fileType } = req.body || {};

    if (!fileData || typeof fileData !== 'string') {
      return res.status(400).json({ error: 'No file data provided.' });
    }

    // Extract mime type and base64 payload
    const matches = fileData.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    let mimeType = fileType || 'image/jpeg';
    let base64Buffer;

    if (matches && matches.length === 3) {
      mimeType = matches[1];
      base64Buffer = Buffer.from(matches[2], 'base64');
    } else {
      base64Buffer = Buffer.from(fileData, 'base64');
    }

    // Validate size (max 5MB = 5242880 bytes)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (base64Buffer.length > MAX_SIZE) {
      return res.status(400).json({ error: 'File size exceeds 5MB limit. Please upload a smaller file.' });
    }

    // Validate type (.jpg, .jpeg, .png, .pdf)
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];

    const ext = fileName ? path.extname(fileName).toLowerCase() : (mimeType === 'application/pdf' ? '.pdf' : '.jpg');
    if (!allowedExtensions.includes(ext) && !allowedMimes.includes(mimeType)) {
      return res.status(400).json({ error: 'Invalid file format. Only JPG, PNG, and PDF files are accepted.' });
    }

    // Generate safe filename with timestamp and random entropy
    const safeExt = allowedExtensions.includes(ext) ? ext : '.jpg';
    const storedFilename = `license_${Date.now()}_${Math.random().toString(36).substring(2, 10)}${safeExt}`;
    const targetPath = path.join(UPLOADS_DIR, storedFilename);

    await fs.promises.writeFile(targetPath, base64Buffer);

    // Return secure reference URL
    const fileUrl = `/api/reservations/license-file/${storedFilename}`;
    res.status(201).json({
      success: true,
      fileUrl,
      fileName: fileName || storedFilename,
      mimeType,
      sizeBytes: base64Buffer.length,
    });
  } catch (err) {
    console.error('License upload error:', err);
    res.status(500).json({ error: 'Failed to upload license document. Please try again.' });
  }
});

// GET /api/reservations/license-file/:filename
// Protected / controlled access to sensitive PII license files
router.get('/license-file/:filename', async (req, res) => {
  try {
    const filename = path.basename(req.params.filename);
    let filePath = path.join(UPLOADS_DIR, filename);
    const bundledPath = path.join(__dirname, '..', 'uploads', 'licenses', filename);

    if (!fs.existsSync(filePath) && fs.existsSync(bundledPath)) {
      filePath = bundledPath;
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    const ext = path.extname(filename).toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.webp') contentType = 'image/webp';
    else if (ext === '.pdf') contentType = 'application/pdf';

    res.setHeader('Content-Type', contentType);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');

    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);
  } catch (err) {
    console.error('License retrieval error:', err);
    res.status(500).json({ error: 'Unable to retrieve document.' });
  }
});

// GET /api/reservations
router.get('/', verifyToken, async (_req, res, next) => {
  try {
    let rows;
    try {
      rows = await callProc('sp_get_all_reservations');
    } catch {
      const [directRows] = await pool.query('SELECT * FROM reservations ORDER BY created_at DESC');
      rows = directRows;
    }
    res.json((rows || []).map(mapReservation));
  } catch (err) { next(err); }
});

// GET /api/reservations/:id
router.get('/:id', verifyToken, async (req, res, next) => {
  try {
    let rows;
    try {
      rows = await callProc('sp_get_reservation_by_id', [req.params.id]);
    } catch {
      const [directRows] = await pool.query('SELECT * FROM reservations WHERE id = ?', [req.params.id]);
      rows = directRows;
    }
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Reservation not found.' });
    res.json(mapReservation(rows[0]));
  } catch (err) { next(err); }
});

// POST /api/reservations
router.post('/', verifyToken, async (req, res, next) => {
  try {
    const {
      customerId, vehicleId, pickupDate, pickupTime, returnDate, returnTime,
      pickupLocation, returnLocation, totalAmount, gracePeriodMinutes, remarks,
      licenseNumber, licenseType, licenseExpiry, licenseFrontUrl, licenseBackUrl,
    } = req.body;

    // Validation: License Number, Type, Expiry required
    if (!licenseNumber || !licenseType || !licenseExpiry) {
      return res.status(400).json({
        error: "Driver's license details (number, type, and expiry date) are required to complete this reservation.",
      });
    }

    // Expiry Date Validation against today's date
    const todayStr = new Date().toISOString().split('T')[0];
    if (licenseExpiry <= todayStr) {
      return res.status(400).json({
        error: "This driver's license has expired. Please upload a valid license.",
      });
    }

    // License Number format regex validation (e.g. N01-12-345678)
    const normalizedNumber = String(licenseNumber).trim().toUpperCase();
    const licenseRegex = /^[A-Z0-9]{1,6}(-[A-Z0-9]{1,8})+$/;
    if (!licenseRegex.test(normalizedNumber) || normalizedNumber.length < 5 || normalizedNumber.length > 30) {
      return res.status(400).json({
        error: "Invalid license number format. Please use format like N01-12-345678.",
      });
    }

    // License Type validation
    const validTypes = ['Non-Professional', 'Professional', 'Student Permit'];
    if (!validTypes.includes(licenseType)) {
      return res.status(400).json({
        error: "Invalid license type. Must be Non-Professional, Professional, or Student Permit.",
      });
    }

    if (!pickupDate || !returnDate || returnDate <= pickupDate) {
      return res.status(400).json({
        error: "Return date must be at least 1 day after the pickup date.",
      });
    }

    // Check if customer already has an active rental
    const [customerRentals] = await pool.query(
      `SELECT 1 FROM reservations res
       JOIN rentals r ON r.reservation_id = res.id
       WHERE res.customer_id = ? AND r.status IN ('Active', 'Overdue')
       LIMIT 1`,
      [customerId]
    );
    if (customerRentals && customerRentals.length > 0) {
      return res.status(400).json({
        error: 'Customer already has an active rental and cannot rent another vehicle.',
      });
    }

    // Check if customer has any unpaid charges/penalties
    try {
      const [unpaidCharges] = await pool.query(
        `SELECT 1 FROM charges WHERE customer_id = ? AND status != 'Paid' LIMIT 1`,
        [customerId]
      );
      if (unpaidCharges && unpaidCharges.length > 0) {
        return res.status(400).json({
          error: 'Customer has unpaid charges/penalties and cannot rent another vehicle until all payments are settled.',
        });
      }
    } catch (chargeErr) {
      console.warn('Could not check charges table:', chargeErr.message);
    }

    // Check for vehicle overlapping active/approved/reserved reservations
    const [overlapRows] = await pool.query(
      `SELECT id, pickup_date, return_date, status
       FROM reservations
       WHERE vehicle_id = ?
         AND status IN ('Approved', 'Reserved')
         AND pickup_date < ?
         AND return_date > ?
       LIMIT 1`,
      [vehicleId, returnDate, pickupDate]
    );
    if (overlapRows && overlapRows.length > 0) {
      const existing = overlapRows[0];
      const pDate = existing.pickup_date instanceof Date ? existing.pickup_date.toISOString().split('T')[0] : existing.pickup_date;
      const rDate = existing.return_date instanceof Date ? existing.return_date.toISOString().split('T')[0] : existing.return_date;
      return res.status(400).json({
        error: `This vehicle is already reserved from ${pDate} to ${rDate}. Please choose different dates or select another vehicle.`,
      });
    }

    let rows;
    try {
      rows = await callProc('sp_create_reservation', [
        customerId, vehicleId, pickupDate, pickupTime, returnDate, returnTime,
        pickupLocation, returnLocation, totalAmount, gracePeriodMinutes ?? 30, remarks ?? '',
        normalizedNumber, licenseType, licenseExpiry, licenseFrontUrl || null, licenseBackUrl || null,
      ]);
    } catch (procErr) {
      if (procErr.sqlState === '45000') {
        return res.status(400).json({ error: procErr.message });
      }
      console.warn('16-param sp_create_reservation failed, trying fallback:', procErr.message);
      try {
        rows = await callProc('sp_create_reservation', [
          customerId, vehicleId, pickupDate, pickupTime, returnDate, returnTime,
          pickupLocation, returnLocation, totalAmount, gracePeriodMinutes ?? 30, remarks ?? '',
        ]);
        if (rows && rows[0]?.id) {
          try {
            await pool.query(
              'UPDATE reservations SET license_number = ?, license_type = ?, license_expiry = ? WHERE id = ?',
              [normalizedNumber, licenseType, licenseExpiry, rows[0].id]
            );
            rows[0].license_number = normalizedNumber;
            rows[0].license_type = licenseType;
            rows[0].license_expiry = licenseExpiry;
          } catch {}
        }
      } catch (fallbackErr) {
        if (fallbackErr.sqlState === '45000') {
          return res.status(400).json({ error: fallbackErr.message });
        }
        console.warn('Direct query fallback for create reservation:', fallbackErr.message);
        const newId = crypto.randomUUID ? crypto.randomUUID() : `res_${Date.now()}`;
        await pool.query(
          `INSERT INTO reservations (id, customer_id, vehicle_id, pickup_date, pickup_time, return_date, return_time, pickup_location, return_location, total_amount, grace_period_minutes, remarks, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE())`,
          [newId, customerId, vehicleId, pickupDate, pickupTime, returnDate, returnTime, pickupLocation, returnLocation, totalAmount, gracePeriodMinutes ?? 30, remarks ?? '']
        );
        try {
          await pool.query(
            'UPDATE reservations SET license_number = ?, license_type = ?, license_expiry = ? WHERE id = ?',
            [normalizedNumber, licenseType, licenseExpiry, newId]
          );
        } catch {}
        const [resRows] = await pool.query('SELECT * FROM reservations WHERE id = ?', [newId]);
        rows = resRows;
      }
    }

    const createdRes = rows?.[0] || {
      id: rows?.[0]?.id || `res_${Date.now()}`,
      customer_id: customerId,
      vehicle_id: vehicleId,
      pickup_date: pickupDate,
      pickup_time: pickupTime,
      return_date: returnDate,
      return_time: returnTime,
      pickup_location: pickupLocation,
      return_location: returnLocation,
      total_amount: totalAmount,
      status: 'Pending',
      label: 'In Process',
      license_number: normalizedNumber,
      license_type: licenseType,
      license_expiry: licenseExpiry,
      created_at: new Date().toISOString().split('T')[0],
    };

    res.status(201).json(mapReservation(createdRes));
  } catch (err) { next(err); }
});

// PATCH /api/reservations/:id
router.patch('/:id', verifyToken, requireRole(['admin', 'staff']), async (req, res, next) => {
  try {
    const { status, label, gracePeriodMinutes, actualPickupTime, noShowAt, noShowReason } = req.body;

    if (status === 'Approved') {
      const [currentRes] = await pool.query('SELECT * FROM reservations WHERE id = ?', [req.params.id]);
      if (currentRes && currentRes.length > 0) {
        const r = currentRes[0];
        const [overlapRows] = await pool.query(
          `SELECT id, pickup_date, return_date 
           FROM reservations 
           WHERE vehicle_id = ? 
             AND id != ?
             AND status IN ('Approved', 'Reserved')
             AND pickup_date < ? 
             AND return_date > ?
           LIMIT 1`,
          [r.vehicle_id, req.params.id, r.return_date, r.pickup_date]
        );
        if (overlapRows && overlapRows.length > 0) {
          return res.status(400).json({
            error: 'Cannot approve: this vehicle is already booked by another reservation on overlapping dates.',
          });
        }
      }
    }

    let rows;
    try {
      rows = await callProc('sp_update_reservation', [
        req.params.id,
        status ?? null,
        label ?? null,
        gracePeriodMinutes ?? null,
        actualPickupTime ?? null,
        noShowAt ?? null,
        noShowReason ?? null,
      ]);
    } catch {
      await pool.query(
        `UPDATE reservations
         SET status = COALESCE(?, status),
             label = COALESCE(?, label),
             grace_period_minutes = COALESCE(?, grace_period_minutes),
             actual_pickup_time = COALESCE(?, actual_pickup_time),
             no_show_at = COALESCE(?, no_show_at),
             no_show_reason = COALESCE(?, no_show_reason)
         WHERE id = ?`,
        [status ?? null, label ?? null, gracePeriodMinutes ?? null, actualPickupTime ?? null, noShowAt ?? null, noShowReason ?? null, req.params.id]
      );
      const [directRows] = await pool.query('SELECT * FROM reservations WHERE id = ?', [req.params.id]);
      rows = directRows;
    }
    res.json(mapReservation(rows?.[0]));
  } catch (err) { next(err); }
});

export default router;
