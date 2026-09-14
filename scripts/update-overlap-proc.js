import pool from '../server/db.js';

async function main() {
  try {
    await pool.query('DROP PROCEDURE IF EXISTS sp_create_reservation');
    await pool.query(`
      CREATE PROCEDURE sp_create_reservation(
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

          -- Prevent overlapping reservations for the same vehicle
          IF EXISTS (
              SELECT 1
              FROM reservations existing
              WHERE existing.vehicle_id = p_vehicle_id
                AND existing.status IN ('Approved', 'Reserved')
                AND existing.pickup_date < p_return_date
                AND existing.return_date > p_pickup_date
          ) THEN
              SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'This vehicle is already reserved for the selected dates. Please choose different dates.';
          END IF;

          SET v_id = UUID();
          INSERT INTO reservations (id, customer_id, vehicle_id, pickup_date, pickup_time, return_date, return_time,
                                    pickup_location, return_location, total_amount, grace_period_minutes, remarks,
                                    license_number, license_type, license_expiry, license_front_url, license_back_url, created_at)
          VALUES (v_id, p_customer_id, p_vehicle_id, p_pickup_date, p_pickup_time, p_return_date, p_return_time,
                  p_pickup_location, p_return_location, p_total_amount, p_grace_period_mins, p_remarks,
                  p_license_number, p_license_type, p_license_expiry, p_license_front_url, p_license_back_url, CURDATE());
          CALL sp_get_reservation_by_id(v_id);
      END
    `);
    console.log('sp_create_reservation updated successfully');

    await pool.query('DROP PROCEDURE IF EXISTS sp_update_reservation_status');
    await pool.query(`
      CREATE PROCEDURE sp_update_reservation_status(
          IN p_id     VARCHAR(36),
          IN p_status VARCHAR(30)
      )
      BEGIN
          IF p_status = 'Approved' THEN
              IF EXISTS (
                  SELECT 1
                  FROM reservations r_target
                  JOIN reservations existing ON existing.vehicle_id = r_target.vehicle_id
                  WHERE r_target.id = p_id
                    AND existing.id != p_id
                    AND existing.status IN ('Approved', 'Reserved')
                    AND existing.pickup_date < r_target.return_date
                    AND existing.return_date > r_target.pickup_date
              ) THEN
                  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot approve: vehicle is already booked for overlapping dates by another reservation.';
              END IF;
          END IF;

          UPDATE reservations
          SET status = p_status,
              label = CASE
                  WHEN p_status IN ('Pending', 'Approved', 'Reserved') THEN 'In Process'
                  WHEN p_status IN ('Rejected', 'Cancelled', 'No-Show') THEN 'Returned'
                  ELSE label
              END
          WHERE id = p_id;
          CALL sp_get_reservation_by_id(p_id);
      END
    `);
    console.log('sp_update_reservation_status updated successfully');
    process.exit(0);
  } catch (err) {
    console.error('Error applying procedures:', err);
    process.exit(1);
  }
}

main();
