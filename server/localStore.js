import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKUP_SQL_PATH = path.resolve(__dirname, '..', 'database', 'backup.sql');
// On Vercel Serverless, /var/task is read-only; use os.tmpdir() (/tmp) for runtime persistence.
const DATA_DIR = process.env.VERCEL
  ? path.join(os.tmpdir(), 'autorent-data')
  : path.resolve(__dirname, 'data');
const LOCAL_DB_FILE = path.join(DATA_DIR, 'local-db.json');

const TABLE_COLUMNS = {
  users: [
    'id', 'username', 'full_name', 'password', 'role', 'is_active',
    'created_at', 'updated_at', 'license_number', 'license_type',
    'license_expiry', 'license_restriction_codes', 'license_front_url', 'license_back_url',
  ],
  registration_requests: [
    'id', 'last_name', 'first_name', 'middle_name', 'gender', 'contact_number',
    'address', 'date_of_birth', 'civil_status', 'status', 'rejection_reason',
    'approved_user_id', 'submitted_at', 'license_number', 'license_type',
    'license_expiry', 'license_restriction_codes', 'license_front_url', 'license_back_url',
  ],
  vehicles: [
    'id', 'name', 'brand', 'model', 'year', 'type', 'license_plate', 'seats',
    'transmission', 'fuel_type', 'price_per_day', 'description', 'image', 'status',
    'created_at', 'or_image', 'cr_image', 'registration_expiry', 'chassis_number',
    'engine_number', 'mv_file_number', 'registered_owner', 'insurance_provider',
    'insurance_policy_number', 'insurance_expiry', 'color', 'displacement',
  ],
  reservations: [
    'id', 'customer_id', 'vehicle_id', 'pickup_date', 'pickup_time', 'return_date',
    'return_time', 'pickup_location', 'return_location', 'total_amount', 'status',
    'label', 'grace_period_minutes', 'actual_pickup_time', 'no_show_at',
    'no_show_reason', 'remarks', 'created_at', 'license_number', 'license_type',
    'license_expiry', 'license_front_url', 'license_back_url',
  ],
  rentals: [
    'id', 'reservation_id', 'staff_id', 'release_date', 'expected_return_date',
    'actual_return_date', 'status', 'balance', 'remarks', 'start_mileage',
    'end_mileage', 'start_fuel', 'end_fuel',
  ],
  billings: ['id', 'reservation_id', 'customer_id', 'total_amount', 'status', 'created_at'],
  payments: ['id', 'billing_id', 'customer_id', 'amount', 'change_amount', 'payment_method', 'paid_at'],
  charges: ['id', 'rental_id', 'customer_id', 'vehicle_id', 'description', 'amount', 'status', 'paid_at', 'created_at'],
  maintenance: ['id', 'vehicle_id', 'reported_by', 'description', 'maintenance_date', 'cost', 'status'],
  damage_reports: ['id', 'rental_id', 'vehicle_id', 'reported_by', 'description', 'estimated_cost', 'created_at'],
  notifications: ['id', 'user_id', 'message', 'type', 'is_read', 'created_at'],
};

let store = null;

function parseSqlValues(valuesPart) {
  const rows = [];
  let i = 0;
  const len = valuesPart.length;

  while (i < len) {
    while (i < len && valuesPart[i] !== '(') i++;
    if (i >= len) break;
    i++; // skip '('

    const row = [];
    while (i < len && valuesPart[i] !== ')') {
      while (i < len && /\s/.test(valuesPart[i])) i++;
      if (valuesPart[i] === "'") {
        i++; // skip opening quote
        let val = '';
        while (i < len) {
          if (valuesPart[i] === '\\' && i + 1 < len) {
            const next = valuesPart[i + 1];
            if (next === 'n') val += '\n';
            else if (next === 'r') val += '\r';
            else if (next === 't') val += '\t';
            else val += next;
            i += 2;
          } else if (valuesPart[i] === "'" && valuesPart[i + 1] === "'") {
            val += "'";
            i += 2;
          } else if (valuesPart[i] === "'") {
            i++; // skip closing quote
            break;
          } else {
            val += valuesPart[i];
            i++;
          }
        }
        row.push(val);
      } else {
        let raw = '';
        while (i < len && valuesPart[i] !== ',' && valuesPart[i] !== ')') {
          raw += valuesPart[i];
          i++;
        }
        raw = raw.trim();
        if (raw.toUpperCase() === 'NULL') {
          row.push(null);
        } else if (raw !== '' && !Number.isNaN(Number(raw))) {
          row.push(Number(raw));
        } else {
          row.push(raw);
        }
      }
      while (i < len && /\s/.test(valuesPart[i])) i++;
      if (valuesPart[i] === ',') i++;
    }
    if (valuesPart[i] === ')') i++;
    rows.push(row);
  }
  return rows;
}

function seedFromBackupSql() {
  const db = {};
  for (const table of Object.keys(TABLE_COLUMNS)) {
    db[table] = [];
  }

  if (!fs.existsSync(BACKUP_SQL_PATH)) {
    console.warn('[AutoRent LocalStore] backup.sql not found at:', BACKUP_SQL_PATH);
    return db;
  }

  const sql = fs.readFileSync(BACKUP_SQL_PATH, 'utf8');
  const lines = sql.split(/\r?\n/);

  for (const line of lines) {
    const match = line.match(/^insert\s+into\s+`(\w+)`\s*\(([^)]+)\)\s*values\s*(.+);$/i);
    if (!match) continue;

    const tableName = match[1];
    const cols = match[2].split(',').map((c) => c.trim().replace(/^`|`$/g, ''));
    const valuesStr = match[3];

    if (!db[tableName]) db[tableName] = [];
    const parsedRows = parseSqlValues(valuesStr);
    for (const tuple of parsedRows) {
      const obj = {};
      cols.forEach((col, idx) => {
        obj[col] = tuple[idx] !== undefined ? tuple[idx] : null;
      });
      db[tableName].push(obj);
    }
  }

  return db;
}

function getStore() {
  if (store) return store;

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(LOCAL_DB_FILE)) {
      const raw = fs.readFileSync(LOCAL_DB_FILE, 'utf8');
      store = JSON.parse(raw);
      return store;
    }
  } catch (err) {
    console.warn('[AutoRent LocalStore] Error reading local-db.json, re-seeding:', err.message);
  }

  store = seedFromBackupSql();
  saveStore();
  return store;
}

function saveStore() {
  if (!store) return;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(LOCAL_DB_FILE, JSON.stringify(store, null, 2), 'utf8');
  } catch (err) {
    console.warn('[AutoRent LocalStore] Could not persist local-db.json:', err.message);
  }
}

function nowDate() {
  return new Date().toISOString().split('T')[0];
}

function nowDateTime() {
  return new Date().toISOString().replace('T', ' ').substring(0, 19);
}

function fmtDate(val) {
  if (!val) return null;
  return String(val).substring(0, 10);
}

function fmtTime(val) {
  if (!val) return null;
  return String(val).substring(0, 5);
}

function buildUserJoinedRow(u, db) {
  if (!u) return null;
  const reg = (db.registration_requests || []).find(
    (r) => String(r.approved_user_id) === String(u.id)
  );
  return {
    ...u,
    created_at: u.created_at || '',
    updated_at: u.updated_at || '',
    first_name: reg?.first_name ?? null,
    middle_name: reg?.middle_name ?? null,
    last_name: reg?.last_name ?? null,
    gender: reg?.gender ?? null,
    contact_number: reg?.contact_number ?? null,
    address: reg?.address ?? null,
    date_of_birth: fmtDate(reg?.date_of_birth),
    civil_status: reg?.civil_status ?? null,
    license_number_profile: u.license_number ?? reg?.license_number ?? null,
    license_type_profile: u.license_type ?? reg?.license_type ?? null,
    license_expiry_profile: fmtDate(u.license_expiry ?? reg?.license_expiry),
    license_restriction_codes_profile: u.license_restriction_codes ?? reg?.license_restriction_codes ?? null,
    license_front_url_profile: u.license_front_url ?? reg?.license_front_url ?? null,
    license_back_url_profile: u.license_back_url ?? reg?.license_back_url ?? null,
    submitted_at: fmtDate(reg?.submitted_at),
  };
}

export async function localCallProc(name, params = []) {
  const db = getStore();

  switch (name) {
    case 'sp_login': {
      const [username] = params;
      const u = (db.users || []).find(
        (user) =>
          String(user.username).toLowerCase() === String(username).trim().toLowerCase() &&
          (user.is_active === 1 || user.is_active === true)
      );
      return u ? [buildUserJoinedRow(u, db)] : [];
    }

    case 'sp_get_all_users': {
      return [...(db.users || [])]
        .sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))
        .map((u) => buildUserJoinedRow(u, db));
    }

    case 'sp_get_user_by_id': {
      const [id] = params;
      const u = (db.users || []).find((user) => String(user.id) === String(id));
      return u ? [buildUserJoinedRow(u, db)] : [];
    }

    case 'sp_create_user': {
      const [username, full_name, password, role, is_active] = params;
      const nextId =
        (db.users || []).reduce((max, u) => Math.max(max, Number(u.id) || 0), 0) + 1;
      const newUser = {
        id: nextId,
        username,
        full_name,
        password,
        role: role || 'customer',
        is_active: is_active !== undefined && is_active !== null ? Number(is_active) : 1,
        created_at: nowDateTime(),
        updated_at: nowDateTime(),
        license_number: null,
        license_type: null,
        license_expiry: null,
        license_restriction_codes: null,
        license_front_url: null,
        license_back_url: null,
      };
      db.users.push(newUser);
      saveStore();
      return [buildUserJoinedRow(newUser, db)];
    }

    case 'sp_update_user': {
      const [
        id, full_name, username, password, is_active,
        first_name, middle_name, last_name, gender,
        contact_number, address, date_of_birth, civil_status,
      ] = params;
      const u = (db.users || []).find((user) => String(user.id) === String(id));
      if (!u) return [];
      if (full_name !== null && full_name !== undefined) u.full_name = full_name;
      if (username !== null && username !== undefined) u.username = username;
      if (password !== null && password !== undefined) u.password = password;
      if (is_active !== null && is_active !== undefined) u.is_active = Number(is_active);
      u.updated_at = nowDateTime();

      const reg = (db.registration_requests || []).find(
        (r) => String(r.approved_user_id) === String(id)
      );
      if (reg) {
        if (first_name !== null && first_name !== undefined) reg.first_name = first_name;
        if (middle_name !== null && middle_name !== undefined) reg.middle_name = middle_name;
        if (last_name !== null && last_name !== undefined) reg.last_name = last_name;
        if (gender !== null && gender !== undefined) reg.gender = gender;
        if (contact_number !== null && contact_number !== undefined) reg.contact_number = contact_number;
        if (address !== null && address !== undefined) reg.address = address;
        if (date_of_birth !== null && date_of_birth !== undefined && date_of_birth !== '') {
          reg.date_of_birth = fmtDate(date_of_birth);
        }
        if (civil_status !== null && civil_status !== undefined) reg.civil_status = civil_status;
      }
      saveStore();
      return [buildUserJoinedRow(u, db)];
    }

    case 'sp_toggle_user_status': {
      const [id] = params;
      const u = (db.users || []).find((user) => String(user.id) === String(id));
      if (!u) return [];
      u.is_active = u.is_active === 1 ? 0 : 1;
      u.updated_at = nowDateTime();
      saveStore();
      return [buildUserJoinedRow(u, db)];
    }

    case 'sp_delete_user': {
      const [id] = params;
      const before = db.users.length;
      db.users = (db.users || []).filter((user) => String(user.id) !== String(id));
      saveStore();
      return [{ affected: before - db.users.length }];
    }

    case 'sp_get_all_registration_requests': {
      return [...(db.registration_requests || [])]
        .sort((a, b) => String(b.submitted_at || '').localeCompare(String(a.submitted_at || '')))
        .map((r) => ({
          ...r,
          date_of_birth: fmtDate(r.date_of_birth),
          license_expiry: fmtDate(r.license_expiry),
          submitted_at: fmtDate(r.submitted_at),
        }));
    }

    case 'sp_create_registration_request': {
      const [
        last_name, first_name, middle_name, gender, contact_number, address,
        date_of_birth, civil_status, license_number, license_type,
        license_expiry, license_restriction_codes, license_front_url, license_back_url,
      ] = params;
      const newReq = {
        id: crypto.randomUUID(),
        last_name,
        first_name,
        middle_name: middle_name ?? '',
        gender,
        contact_number,
        address,
        date_of_birth: fmtDate(date_of_birth),
        civil_status,
        status: 'pending',
        rejection_reason: null,
        approved_user_id: null,
        submitted_at: nowDate(),
        license_number: license_number || null,
        license_type: license_type || null,
        license_expiry: fmtDate(license_expiry),
        license_restriction_codes: license_restriction_codes || null,
        license_front_url: license_front_url || null,
        license_back_url: license_back_url || null,
      };
      db.registration_requests.push(newReq);
      saveStore();
      return [newReq];
    }

    case 'sp_approve_registration': {
      const [regId, username, password] = params;
      const reg = (db.registration_requests || []).find((r) => String(r.id) === String(regId));
      if (!reg) throw new Error('Registration request not found.');
      const nextId =
        (db.users || []).reduce((max, u) => Math.max(max, Number(u.id) || 0), 0) + 1;
      const fullName = [reg.first_name, reg.middle_name, reg.last_name]
        .filter((p) => p && String(p).trim() !== '')
        .join(' ');
      const newUser = {
        id: nextId,
        username,
        full_name: fullName,
        password,
        role: 'customer',
        is_active: 1,
        created_at: nowDateTime(),
        updated_at: nowDateTime(),
        license_number: reg.license_number ?? null,
        license_type: reg.license_type ?? null,
        license_expiry: reg.license_expiry ?? null,
        license_restriction_codes: reg.license_restriction_codes ?? null,
        license_front_url: reg.license_front_url ?? null,
        license_back_url: reg.license_back_url ?? null,
      };
      db.users.push(newUser);
      reg.status = 'approved';
      reg.approved_user_id = nextId;
      saveStore();
      return [{ user_id: nextId }];
    }

    case 'sp_reject_registration': {
      const [regId, reason] = params;
      const reg = (db.registration_requests || []).find((r) => String(r.id) === String(regId));
      if (reg) {
        reg.status = 'rejected';
        reg.rejection_reason = reason ?? '';
        saveStore();
      }
      return [{ affected: reg ? 1 : 0 }];
    }

    case 'sp_get_all_vehicles': {
      return [...(db.vehicles || [])]
        .sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))
        .map((v) => ({
          ...v,
          registration_expiry: fmtDate(v.registration_expiry),
          insurance_expiry: fmtDate(v.insurance_expiry),
          created_at: fmtDate(v.created_at),
        }));
    }

    case 'sp_get_vehicle_by_id': {
      const [id] = params;
      const v = (db.vehicles || []).find((veh) => String(veh.id) === String(id));
      return v
        ? [
            {
              ...v,
              registration_expiry: fmtDate(v.registration_expiry),
              insurance_expiry: fmtDate(v.insurance_expiry),
              created_at: fmtDate(v.created_at),
            },
          ]
        : [];
    }

    case 'sp_create_vehicle': {
      const [
        name, brand, model, year, type, license_plate, seats,
        transmission, fuel_type, price_per_day, description, image, status,
        or_image, cr_image, registration_expiry, chassis_number, engine_number,
        mv_file_number, registered_owner, insurance_provider, insurance_policy_number,
        insurance_expiry, color, displacement,
      ] = params;
      const newVeh = {
        id: crypto.randomUUID(),
        name,
        brand,
        model,
        year: Number(year),
        type,
        license_plate,
        seats: Number(seats),
        transmission,
        fuel_type,
        price_per_day: Number(price_per_day),
        description: description ?? '',
        image: image ?? '',
        status: status ?? 'Available',
        created_at: nowDate(),
        or_image: or_image ?? null,
        cr_image: cr_image ?? null,
        registration_expiry: fmtDate(registration_expiry),
        chassis_number: chassis_number ?? null,
        engine_number: engine_number ?? null,
        mv_file_number: mv_file_number ?? null,
        registered_owner: registered_owner ?? null,
        insurance_provider: insurance_provider ?? null,
        insurance_policy_number: insurance_policy_number ?? null,
        insurance_expiry: fmtDate(insurance_expiry),
        color: color ?? null,
        displacement: displacement ?? null,
      };
      db.vehicles.push(newVeh);
      saveStore();
      return [newVeh];
    }

    case 'sp_update_vehicle': {
      const [
        id, name, brand, model, year, type, license_plate, seats,
        transmission, fuel_type, price_per_day, description, image, status,
        or_image, cr_image, registration_expiry, chassis_number, engine_number,
        mv_file_number, registered_owner, insurance_provider, insurance_policy_number,
        insurance_expiry, color, displacement,
      ] = params;
      const v = (db.vehicles || []).find((veh) => String(veh.id) === String(id));
      if (!v) return [];
      const assignIf = (key, val) => {
        if (val !== null && val !== undefined) v[key] = val;
      };
      assignIf('name', name);
      assignIf('brand', brand);
      assignIf('model', model);
      assignIf('year', year !== null && year !== undefined ? Number(year) : null);
      assignIf('type', type);
      assignIf('license_plate', license_plate);
      assignIf('seats', seats !== null && seats !== undefined ? Number(seats) : null);
      assignIf('transmission', transmission);
      assignIf('fuel_type', fuel_type);
      assignIf('price_per_day', price_per_day !== null && price_per_day !== undefined ? Number(price_per_day) : null);
      assignIf('description', description);
      assignIf('image', image);
      assignIf('status', status);
      assignIf('or_image', or_image);
      assignIf('cr_image', cr_image);
      assignIf('registration_expiry', fmtDate(registration_expiry));
      assignIf('chassis_number', chassis_number);
      assignIf('engine_number', engine_number);
      assignIf('mv_file_number', mv_file_number);
      assignIf('registered_owner', registered_owner);
      assignIf('insurance_provider', insurance_provider);
      assignIf('insurance_policy_number', insurance_policy_number);
      assignIf('insurance_expiry', fmtDate(insurance_expiry));
      assignIf('color', color);
      assignIf('displacement', displacement);
      saveStore();
      return [v];
    }

    case 'sp_delete_vehicle': {
      const [id] = params;
      db.vehicles = (db.vehicles || []).filter((v) => String(v.id) !== String(id));
      saveStore();
      return [{ affected: 1 }];
    }

    case 'sp_get_all_reservations': {
      return [...(db.reservations || [])]
        .sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))
        .map((r) => ({
          ...r,
          pickup_date: fmtDate(r.pickup_date),
          pickup_time: fmtTime(r.pickup_time),
          return_date: fmtDate(r.return_date),
          return_time: fmtTime(r.return_time),
          license_expiry: fmtDate(r.license_expiry),
          created_at: fmtDate(r.created_at),
        }));
    }

    case 'sp_get_reservation_by_id': {
      const [id] = params;
      const r = (db.reservations || []).find((res) => String(res.id) === String(id));
      return r
        ? [
            {
              ...r,
              pickup_date: fmtDate(r.pickup_date),
              pickup_time: fmtTime(r.pickup_time),
              return_date: fmtDate(r.return_date),
              return_time: fmtTime(r.return_time),
              license_expiry: fmtDate(r.license_expiry),
              created_at: fmtDate(r.created_at),
            },
          ]
        : [];
    }

    case 'sp_create_reservation': {
      const [
        customer_id, vehicle_id, pickup_date, pickup_time, return_date, return_time,
        pickup_location, return_location, total_amount, grace_period_mins, remarks,
        license_number, license_type, license_expiry, license_front_url, license_back_url,
      ] = params;
      const newRes = {
        id: crypto.randomUUID(),
        customer_id: Number(customer_id) || customer_id,
        vehicle_id,
        pickup_date: fmtDate(pickup_date),
        pickup_time: fmtTime(pickup_time),
        return_date: fmtDate(return_date),
        return_time: fmtTime(return_time),
        pickup_location,
        return_location,
        total_amount: Number(total_amount),
        status: 'Pending',
        label: 'In Process',
        grace_period_minutes: Number(grace_period_mins ?? 30),
        actual_pickup_time: null,
        no_show_at: null,
        no_show_reason: null,
        remarks: remarks ?? '',
        created_at: nowDate(),
        license_number: license_number ?? null,
        license_type: license_type ?? null,
        license_expiry: fmtDate(license_expiry),
        license_front_url: license_front_url ?? null,
        license_back_url: license_back_url ?? null,
      };
      db.reservations.push(newRes);
      saveStore();
      return [newRes];
    }

    case 'sp_update_reservation': {
      const [
        id, status, label, grace_period_mins,
        actual_pickup, no_show_at, no_show_reason,
      ] = params;
      const r = (db.reservations || []).find((res) => String(res.id) === String(id));
      if (!r) return [];
      if (status !== null && status !== undefined) r.status = status;
      if (label !== null && label !== undefined) r.label = label;
      if (grace_period_mins !== null && grace_period_mins !== undefined) {
        r.grace_period_minutes = Number(grace_period_mins);
      }
      if (actual_pickup !== null && actual_pickup !== undefined) r.actual_pickup_time = actual_pickup;
      if (no_show_at !== null && no_show_at !== undefined) r.no_show_at = no_show_at;
      if (no_show_reason !== null && no_show_reason !== undefined) r.no_show_reason = no_show_reason;
      saveStore();
      return localCallProc('sp_get_reservation_by_id', [id]);
    }

    case 'sp_get_all_rentals': {
      return [...(db.rentals || [])]
        .sort((a, b) => String(b.release_date || '').localeCompare(String(a.release_date || '')))
        .map((r) => ({
          ...r,
          release_date: fmtDate(r.release_date),
          expected_return_date: fmtDate(r.expected_return_date),
          actual_return_date: fmtDate(r.actual_return_date),
        }));
    }

    case 'sp_get_rental_by_id': {
      const [id] = params;
      const r = (db.rentals || []).find((ren) => String(ren.id) === String(id));
      return r
        ? [
            {
              ...r,
              release_date: fmtDate(r.release_date),
              expected_return_date: fmtDate(r.expected_return_date),
              actual_return_date: fmtDate(r.actual_return_date),
            },
          ]
        : [];
    }

    case 'sp_create_rental': {
      const [
        reservation_id, staff_id, release_date, expected_return_date,
        remarks, start_mileage, start_fuel,
      ] = params;
      const newRental = {
        id: crypto.randomUUID(),
        reservation_id,
        staff_id: Number(staff_id) || staff_id,
        release_date: fmtDate(release_date),
        expected_return_date: fmtDate(expected_return_date),
        actual_return_date: null,
        status: 'Active',
        balance: 'Fully Paid',
        remarks: remarks ?? '',
        start_mileage: start_mileage ?? null,
        end_mileage: null,
        start_fuel: start_fuel ?? null,
        end_fuel: null,
      };
      db.rentals.push(newRental);
      saveStore();
      return [newRental];
    }

    case 'sp_update_rental': {
      const [id, actual_return_date, status, remarks, end_mileage, end_fuel] = params;
      const r = (db.rentals || []).find((ren) => String(ren.id) === String(id));
      if (!r) return [];
      if (actual_return_date !== null && actual_return_date !== undefined) {
        r.actual_return_date = fmtDate(actual_return_date);
      }
      if (status !== null && status !== undefined) r.status = status;
      if (remarks !== null && remarks !== undefined) r.remarks = remarks;
      if (end_mileage !== null && end_mileage !== undefined) r.end_mileage = Number(end_mileage);
      if (end_fuel !== null && end_fuel !== undefined) r.end_fuel = end_fuel;
      if (status === 'Completed') {
        const res = (db.reservations || []).find((x) => String(x.id) === String(r.reservation_id));
        if (res) res.label = 'Returned';
      }
      saveStore();
      return [r];
    }

    case 'sp_get_all_billings': {
      return [...(db.billings || [])].sort((a, b) =>
        String(b.created_at || '').localeCompare(String(a.created_at || ''))
      );
    }

    case 'sp_create_billing': {
      const [reservation_id, customer_id, total_amount] = params;
      let bill = (db.billings || []).find((b) => String(b.reservation_id) === String(reservation_id));
      if (bill) {
        bill.total_amount = Number(total_amount);
      } else {
        bill = {
          id: crypto.randomUUID(),
          reservation_id,
          customer_id: Number(customer_id) || customer_id,
          total_amount: Number(total_amount),
          status: 'Unpaid',
          created_at: nowDateTime(),
        };
        db.billings.push(bill);
      }
      saveStore();
      return [bill];
    }

    case 'sp_get_all_payments': {
      return [...(db.payments || [])].sort((a, b) =>
        String(b.paid_at || '').localeCompare(String(a.paid_at || ''))
      );
    }

    case 'sp_create_payment': {
      const [billing_id, customer_id, amount, change_amount, payment_method] = params;
      const payment = {
        id: crypto.randomUUID(),
        billing_id,
        customer_id: Number(customer_id) || customer_id,
        amount: Number(amount),
        change_amount: Number(change_amount ?? 0),
        payment_method: payment_method || 'Cash',
        paid_at: nowDateTime(),
      };
      db.payments.push(payment);
      const bill = (db.billings || []).find((b) => String(b.id) === String(billing_id));
      if (bill) bill.status = 'Paid';
      saveStore();
      return [payment];
    }

    case 'sp_get_all_charges': {
      return [...(db.charges || [])].sort((a, b) =>
        String(b.created_at || '').localeCompare(String(a.created_at || ''))
      );
    }

    case 'sp_create_charge': {
      const [rental_id, customer_id, vehicle_id, description, amount] = params;
      let ch = (db.charges || []).find((c) => String(c.rental_id) === String(rental_id));
      if (ch) {
        ch.description = description;
        ch.amount = Number(amount);
      } else {
        ch = {
          id: crypto.randomUUID(),
          rental_id,
          customer_id: Number(customer_id) || customer_id,
          vehicle_id,
          description,
          amount: Number(amount),
          status: 'Unpaid',
          paid_at: null,
          created_at: nowDateTime(),
        };
        db.charges.push(ch);
      }
      saveStore();
      return [ch];
    }

    case 'sp_pay_charge': {
      const [id] = params;
      const ch = (db.charges || []).find((c) => String(c.id) === String(id));
      if (ch) {
        ch.status = 'Paid';
        ch.paid_at = nowDateTime();
        saveStore();
      }
      return ch ? [ch] : [];
    }

    case 'sp_get_all_maintenance': {
      return [...(db.maintenance || [])].sort((a, b) =>
        String(b.maintenance_date || '').localeCompare(String(a.maintenance_date || ''))
      );
    }

    case 'sp_get_maintenance_by_id': {
      const [id] = params;
      const m = (db.maintenance || []).find((x) => String(x.id) === String(id));
      return m ? [m] : [];
    }

    case 'sp_create_maintenance': {
      const [vehicle_id, reported_by, description, maintenance_date, cost] = params;
      const m = {
        id: crypto.randomUUID(),
        vehicle_id,
        reported_by,
        description,
        maintenance_date: fmtDate(maintenance_date) || nowDate(),
        cost: Number(cost ?? 0),
        status: 'Pending',
      };
      db.maintenance.push(m);
      const veh = (db.vehicles || []).find((v) => String(v.id) === String(vehicle_id));
      if (veh) veh.status = 'Maintenance';
      saveStore();
      return [m];
    }

    case 'sp_update_maintenance': {
      const [id, status, cost, description] = params;
      const m = (db.maintenance || []).find((x) => String(x.id) === String(id));
      if (!m) return [];
      if (status !== null && status !== undefined) m.status = status;
      if (cost !== null && cost !== undefined) m.cost = Number(cost);
      if (description !== null && description !== undefined) m.description = description;
      const veh = (db.vehicles || []).find((v) => String(v.id) === String(m.vehicle_id));
      if (veh) {
        if (m.status === 'Completed') {
          const otherActive = (db.maintenance || []).some(
            (x) =>
              String(x.vehicle_id) === String(m.vehicle_id) &&
              String(x.id) !== String(id) &&
              x.status !== 'Completed'
          );
          if (!otherActive) veh.status = 'Available';
        } else if (m.status === 'Pending' || m.status === 'In Progress') {
          veh.status = 'Maintenance';
        }
      }
      saveStore();
      return [m];
    }

    case 'sp_delete_maintenance': {
      const [id] = params;
      const m = (db.maintenance || []).find((x) => String(x.id) === String(id));
      db.maintenance = (db.maintenance || []).filter((x) => String(x.id) !== String(id));
      if (m) {
        const otherActive = (db.maintenance || []).some(
          (x) => String(x.vehicle_id) === String(m.vehicle_id) && x.status !== 'Completed'
        );
        if (!otherActive) {
          const veh = (db.vehicles || []).find((v) => String(v.id) === String(m.vehicle_id));
          if (veh && veh.status === 'Maintenance') veh.status = 'Available';
        }
      }
      saveStore();
      return [{ success: 1 }];
    }

    case 'sp_get_all_damage_reports': {
      return [...(db.damage_reports || [])].sort((a, b) =>
        String(b.created_at || '').localeCompare(String(a.created_at || ''))
      );
    }

    case 'sp_create_damage_report': {
      const [rental_id, vehicle_id, reported_by, description, estimated_cost] = params;
      const d = {
        id: crypto.randomUUID(),
        rental_id,
        vehicle_id,
        reported_by,
        description,
        estimated_cost: Number(estimated_cost ?? 0),
        created_at: nowDate(),
      };
      db.damage_reports.push(d);
      saveStore();
      return [d];
    }

    case 'sp_get_notifications_for_user': {
      const [userId] = params;
      return (db.notifications || [])
        .filter((n) => String(n.user_id) === String(userId))
        .sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))
        .map((n) => ({
          ...n,
          read: n.is_read === 1 || n.is_read === true,
          created_at: fmtDate(n.created_at),
        }));
    }

    case 'sp_create_notification': {
      const [user_id, message, type] = params;
      const n = {
        id: crypto.randomUUID(),
        user_id: Number(user_id) || user_id,
        message,
        type: type || 'info',
        is_read: 0,
        created_at: nowDate(),
      };
      db.notifications.push(n);
      saveStore();
      return [{ ...n, read: false }];
    }

    case 'sp_mark_notification_read': {
      const [id] = params;
      const n = (db.notifications || []).find((x) => String(x.id) === String(id));
      if (n) {
        n.is_read = 1;
        saveStore();
      }
      return [{ affected: n ? 1 : 0 }];
    }

    case 'sp_mark_all_notifications_read': {
      const [userId] = params;
      let count = 0;
      for (const n of db.notifications || []) {
        if (String(n.user_id) === String(userId) && !n.is_read) {
          n.is_read = 1;
          count++;
        }
      }
      if (count > 0) saveStore();
      return [{ affected: count }];
    }

    default:
      return [];
  }
}

export async function localQuery(sql, params = []) {
  const db = getStore();
  const s = String(sql).trim();

  if (/SELECT\s+DATABASE\(\)/i.test(s)) {
    return [[{ current_database: 'local_backup_store' }]];
  }

  // Check license in users table
  if (/FROM\s+users/i.test(s) && /license_number/i.test(s)) {
    const clean = String(params[0] || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const found = (db.users || []).filter(
      (u) => String(u.license_number || '').toUpperCase().replace(/[^A-Z0-9]/g, '') === clean
    );
    return [found];
  }

  // Check license in registration_requests table
  if (/FROM\s+registration_requests/i.test(s) && /license_number/i.test(s)) {
    const clean = String(params[0] || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const found = (db.registration_requests || []).filter(
      (r) =>
        String(r.license_number || '').toUpperCase().replace(/[^A-Z0-9]/g, '') === clean &&
        ['pending', 'approved'].includes(String(r.status).toLowerCase())
    );
    return [found];
  }

  // SELECT password FROM users WHERE id = ?
  if (/SELECT\s+password\s+FROM\s+users\s+WHERE\s+id\s*=\s*\?/i.test(s)) {
    const u = (db.users || []).find((x) => String(x.id) === String(params[0]));
    return [u ? [{ password: u.password }] : []];
  }

  // Active rental check for customer
  if (/FROM\s+reservations\s+res\s+JOIN\s+rentals/i.test(s)) {
    const customerId = String(params[0]);
    const custResIds = new Set(
      (db.reservations || [])
        .filter((r) => String(r.customer_id) === customerId)
        .map((r) => String(r.id))
    );
    const active = (db.rentals || []).filter(
      (ren) => custResIds.has(String(ren.reservation_id)) && ['Active', 'Overdue'].includes(ren.status)
    );
    return [active.length > 0 ? [{ 1: 1 }] : []];
  }

  // Unpaid charges check
  if (/FROM\s+charges\s+WHERE\s+customer_id\s*=\s*\?/i.test(s)) {
    const customerId = String(params[0]);
    const unpaid = (db.charges || []).filter(
      (c) => String(c.customer_id) === customerId && c.status !== 'Paid'
    );
    return [unpaid.length > 0 ? [{ 1: 1 }] : []];
  }

  // Vehicle overlapping reservations check
  if (/FROM\s+reservations/i.test(s) && /pickup_date\s*<\s*\?/i.test(s)) {
    if (params.length === 4) {
      const [vehicleId, excludeId, returnDate, pickupDate] = params;
      const overlaps = (db.reservations || []).filter(
        (r) =>
          String(r.vehicle_id) === String(vehicleId) &&
          String(r.id) !== String(excludeId) &&
          ['Approved', 'Reserved'].includes(r.status) &&
          fmtDate(r.pickup_date) < fmtDate(returnDate) &&
          fmtDate(r.return_date) > fmtDate(pickupDate)
      );
      return [overlaps];
    } else {
      const [vehicleId, returnDate, pickupDate] = params;
      const overlaps = (db.reservations || []).filter(
        (r) =>
          String(r.vehicle_id) === String(vehicleId) &&
          ['Approved', 'Reserved'].includes(r.status) &&
          fmtDate(r.pickup_date) < fmtDate(returnDate) &&
          fmtDate(r.return_date) > fmtDate(pickupDate)
      );
      return [overlaps];
    }
  }

  // SELECT * FROM reservations WHERE id = ?
  if (/SELECT\s+\*\s+FROM\s+reservations\s+WHERE\s+id\s*=\s*\?/i.test(s)) {
    const rows = await localCallProc('sp_get_reservation_by_id', [params[0]]);
    return [rows];
  }

  // SELECT * FROM reservations ORDER BY created_at DESC
  if (/SELECT\s+\*\s+FROM\s+reservations/i.test(s)) {
    const rows = await localCallProc('sp_get_all_reservations');
    return [rows];
  }

  return [[]];
}

