import pool from '../server/db.js';

async function migrate() {
  console.log('Starting MySQL migration for license fields...');

  const [cols] = await pool.query('DESCRIBE reservations');
  const colNames = cols.map(c => c.Field);
  console.log('Existing columns:', colNames);

  if (!colNames.includes('license_number')) {
    console.log('Adding column: license_number');
    await pool.query('ALTER TABLE reservations ADD COLUMN license_number VARCHAR(50) NULL');
  }
  if (!colNames.includes('license_type')) {
    console.log('Adding column: license_type');
    await pool.query("ALTER TABLE reservations ADD COLUMN license_type ENUM('Non-Professional','Professional','Student Permit') NULL");
  }
  if (!colNames.includes('license_expiry')) {
    console.log('Adding column: license_expiry');
    await pool.query('ALTER TABLE reservations ADD COLUMN license_expiry DATE NULL');
  }
  if (!colNames.includes('license_front_url')) {
    console.log('Adding column: license_front_url');
    await pool.query('ALTER TABLE reservations ADD COLUMN license_front_url VARCHAR(500) NULL');
  }
  if (!colNames.includes('license_back_url')) {
    console.log('Adding column: license_back_url');
    await pool.query('ALTER TABLE reservations ADD COLUMN license_back_url VARCHAR(500) NULL');
  }

  console.log('Updating stored procedures...');
  await pool.query('DROP PROCEDURE IF EXISTS sp_get_all_reservations');
  await pool.query(`CREATE PROCEDURE sp_get_all_reservations()
  BEGIN
      SELECT id, customer_id, vehicle_id,
             DATE_FORMAT(pickup_date,'%Y-%m-%d') AS pickup_date,
             TIME_FORMAT(pickup_time,'%H:%i')    AS pickup_time,
             DATE_FORMAT(return_date,'%Y-%m-%d') AS return_date,
             TIME_FORMAT(return_time,'%H:%i')    AS return_time,
             pickup_location, return_location, total_amount, status, label,
             grace_period_minutes, actual_pickup_time, no_show_at,
             no_show_reason, remarks,
             license_number, license_type,
             DATE_FORMAT(license_expiry,'%Y-%m-%d') AS license_expiry,
             license_front_url, license_back_url,
             DATE_FORMAT(created_at,'%Y-%m-%d')  AS created_at
      FROM reservations
      ORDER BY created_at DESC;
  END`);

  await pool.query('DROP PROCEDURE IF EXISTS sp_get_reservation_by_id');
  await pool.query(`CREATE PROCEDURE sp_get_reservation_by_id(IN p_id VARCHAR(36))
  BEGIN
      SELECT id, customer_id, vehicle_id,
             DATE_FORMAT(pickup_date,'%Y-%m-%d') AS pickup_date,
             TIME_FORMAT(pickup_time,'%H:%i')    AS pickup_time,
             DATE_FORMAT(return_date,'%Y-%m-%d') AS return_date,
             TIME_FORMAT(return_time,'%H:%i')    AS return_time,
             pickup_location, return_location, total_amount, status, label,
             grace_period_minutes, actual_pickup_time, no_show_at,
             no_show_reason, remarks,
             license_number, license_type,
             DATE_FORMAT(license_expiry,'%Y-%m-%d') AS license_expiry,
             license_front_url, license_back_url,
             DATE_FORMAT(created_at,'%Y-%m-%d')  AS created_at
      FROM reservations WHERE id = p_id;
  END`);

  await pool.query('DROP PROCEDURE IF EXISTS sp_create_reservation');
  await pool.query(`CREATE PROCEDURE sp_create_reservation(
      IN p_customer_id       VARCHAR(36),
      IN p_vehicle_id        VARCHAR(36),
      IN p_pickup_date       DATE,
      IN p_pickup_time       TIME,
      IN p_return_date       DATE,
      IN p_return_time       TIME,
      IN p_pickup_location   VARCHAR(200),
      IN p_return_location   VARCHAR(200),
      IN p_total_amount      DECIMAL(10,2),
      IN p_grace_period_mins SMALLINT,
      IN p_remarks           TEXT,
      IN p_license_number    VARCHAR(50),
      IN p_license_type      VARCHAR(50),
      IN p_license_expiry    DATE,
      IN p_license_front_url VARCHAR(500),
      IN p_license_back_url  VARCHAR(500)
  )
  BEGIN
      DECLARE v_id VARCHAR(36);
      IF EXISTS (
          SELECT 1
                  FROM reservations existing
          WHERE existing.customer_id = CAST(p_customer_id AS UNSIGNED)
                      AND (existing.label = 'In Use' OR EXISTS (
                              SELECT 1 FROM rentals r
                              WHERE r.reservation_id = existing.id AND r.status IN ('Active', 'Overdue')
                      ))
      ) THEN
          SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Customer already has an active rental and cannot rent another vehicle.';
      END IF;
      SET v_id = UUID();
      INSERT INTO reservations (id, customer_id, vehicle_id, pickup_date, pickup_time, return_date, return_time,
                                pickup_location, return_location, total_amount, grace_period_minutes, remarks,
                                license_number, license_type, license_expiry, license_front_url, license_back_url, created_at)
      VALUES (v_id, p_customer_id, p_vehicle_id, p_pickup_date, p_pickup_time, p_return_date, p_return_time,
              p_pickup_location, p_return_location, p_total_amount, p_grace_period_mins, p_remarks,
              p_license_number, p_license_type, p_license_expiry, p_license_front_url, p_license_back_url, CURDATE());
      CALL sp_get_reservation_by_id(v_id);
  END`);

  // Let's also update the most recent approved reservation for Jeffrey Filliar Peresores if it was missing license info
  const [recentRes] = await pool.query("SELECT * FROM reservations WHERE customer_id = 3 AND vehicle_id = 'seed-vehicle-010' LIMIT 1");
  if (recentRes && recentRes.length > 0) {
    console.log('Found recent reservation for Yamaha MT-07, updating sample valid license if empty...');
    if (!recentRes[0].license_number) {
      await pool.query(
        "UPDATE reservations SET license_number = 'N01-19-123456', license_type = 'Non-Professional', license_expiry = '2028-10-15' WHERE id = ?",
        [recentRes[0].id]
      );
    }
  }

  const [newCols] = await pool.query('DESCRIBE reservations');
  console.log('Migration successful! Updated columns:', newCols.map(c => c.Field));
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
