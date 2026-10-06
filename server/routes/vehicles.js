import { Router } from 'express';
import { callProc } from '../db.js';

const router = Router();

function mapVehicle(v) {
  if (!v) return v;
  return {
    id: String(v.id),
    name: v.name ?? '',
    brand: v.brand ?? '',
    model: v.model ?? '',
    year: Number(v.year ?? 2024),
    type: v.type ?? 'Sedan',
    licensePlate: v.license_plate ?? v.licensePlate ?? '',
    seats: Number(v.seats ?? 4),
    transmission: v.transmission ?? 'Automatic',
    fuelType: v.fuel_type ?? v.fuelType ?? 'Gasoline',
    pricePerDay: Number(v.price_per_day ?? v.pricePerDay ?? 0),
    description: v.description ?? '',
    image: v.image ?? '',
    status: v.status ?? 'Available',
    orImage: v.or_image ?? v.orImage ?? '',
    crImage: v.cr_image ?? v.crImage ?? '',
    registrationExpiry: v.registration_expiry ?? v.registrationExpiry ?? '',
    chassisNumber: v.chassis_number ?? v.chassisNumber ?? '',
    engineNumber: v.engine_number ?? v.engineNumber ?? '',
    mvFileNumber: v.mv_file_number ?? v.mvFileNumber ?? '',
    registeredOwner: v.registered_owner ?? v.registeredOwner ?? '',
    insuranceProvider: v.insurance_provider ?? v.insuranceProvider ?? '',
    insurancePolicyNumber: v.insurance_policy_number ?? v.insurancePolicyNumber ?? '',
    insuranceExpiry: v.insurance_expiry ?? v.insuranceExpiry ?? '',
    color: v.color ?? '',
    displacement: v.displacement ?? '',
    createdAt: v.created_at ?? v.createdAt ?? new Date().toISOString().split('T')[0],
  };
}

// GET /api/vehicles
router.get('/', async (_req, res, next) => {
  try {
    const rows = await callProc('sp_get_all_vehicles');
    res.json((rows || []).map(mapVehicle));
  } catch (err) { next(err); }
});

// GET /api/vehicles/:id
router.get('/:id', async (req, res, next) => {
  try {
    const rows = await callProc('sp_get_vehicle_by_id', [req.params.id]);
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Vehicle not found.' });
    res.json(mapVehicle(rows[0]));
  } catch (err) { next(err); }
});

// POST /api/vehicles
router.post('/', async (req, res, next) => {
  try {
    const { name, brand, model, year, type, licensePlate, seats, transmission,
            fuelType, pricePerDay, description, image, status,
            orImage, crImage, registrationExpiry, chassisNumber, engineNumber, mvFileNumber,
            registeredOwner, insuranceProvider, insurancePolicyNumber, insuranceExpiry, color, displacement } = req.body;
    const rows = await callProc('sp_create_vehicle', [
      name, brand, model, year, type, licensePlate, seats,
      transmission, fuelType, pricePerDay, description ?? '', image ?? '', status ?? 'Available',
      orImage ?? null, crImage ?? null, registrationExpiry || null, chassisNumber ?? null, engineNumber ?? null, mvFileNumber ?? null,
      registeredOwner ?? null, insuranceProvider ?? null, insurancePolicyNumber ?? null, insuranceExpiry || null,
      color ?? null, displacement ?? null
    ]);
    res.status(201).json(mapVehicle(rows[0]));
  } catch (err) { next(err); }
});

// PATCH /api/vehicles/:id
router.patch('/:id', async (req, res, next) => {
  try {
    const { name, brand, model, year, type, licensePlate, seats, transmission,
            fuelType, pricePerDay, description, image, status,
            orImage, crImage, registrationExpiry, chassisNumber, engineNumber, mvFileNumber,
            registeredOwner, insuranceProvider, insurancePolicyNumber, insuranceExpiry, color, displacement } = req.body;
    const rows = await callProc('sp_update_vehicle', [
      req.params.id,
      name ?? null, brand ?? null, model ?? null, year ?? null, type ?? null,
      licensePlate ?? null, seats ?? null, transmission ?? null, fuelType ?? null,
      pricePerDay ?? null, description ?? null, image ?? null, status ?? null,
      orImage ?? null, crImage ?? null, registrationExpiry || null, chassisNumber ?? null, engineNumber ?? null, mvFileNumber ?? null,
      registeredOwner ?? null, insuranceProvider ?? null, insurancePolicyNumber ?? null, insuranceExpiry || null,
      color ?? null, displacement ?? null
    ]);
    res.json(mapVehicle(rows[0]));
  } catch (err) { next(err); }
});

// DELETE /api/vehicles/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await callProc('sp_delete_vehicle', [req.params.id]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
