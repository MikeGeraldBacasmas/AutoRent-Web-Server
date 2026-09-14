import pool from '../server/db.js';

async function migrate() {
  try {
    // 1. Add columns to rentals if they don't exist
    const columns = [
      { name: 'start_mileage', type: 'INT UNSIGNED DEFAULT NULL' },
      { name: 'end_mileage', type: 'INT UNSIGNED DEFAULT NULL' },
      { name: 'start_fuel', type: 'VARCHAR(30) DEFAULT NULL' },
      { name: 'end_fuel', type: 'VARCHAR(30) DEFAULT NULL' },
    ];

    for (const col of columns) {
      const [existing] = await pool.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'rentals' AND COLUMN_NAME = ?`,
        [col.name]
      );
      if (existing.length === 0) {
        console.log(`Adding column ${col.name} to rentals...`);
        await pool.query(`ALTER TABLE rentals ADD COLUMN ${col.name} ${col.type}`);
      } else {
        console.log(`Column ${col.name} already exists.`);
      }
    }

    // 2. Re-create sp_get_all_rentals
    await pool.query('DROP PROCEDURE IF EXISTS sp_get_all_rentals');
    await pool.query(`
      CREATE PROCEDURE sp_get_all_rentals()
      BEGIN
          SELECT id, reservation_id, staff_id,
                 DATE_FORMAT(release_date,'%Y-%m-%d')          AS release_date,
                 DATE_FORMAT(expected_return_date,'%Y-%m-%d')  AS expected_return_date,
                 DATE_FORMAT(actual_return_date,'%Y-%m-%d')    AS actual_return_date,
                 status, balance, remarks,
                 start_mileage, end_mileage, start_fuel, end_fuel
          FROM rentals
          ORDER BY release_date DESC;
      END
    `);
    console.log('sp_get_all_rentals updated.');

    // 3. Re-create sp_get_rental_by_id
    await pool.query('DROP PROCEDURE IF EXISTS sp_get_rental_by_id');
    await pool.query(`
      CREATE PROCEDURE sp_get_rental_by_id(IN p_id VARCHAR(36))
      BEGIN
          SELECT id, reservation_id, staff_id,
                 DATE_FORMAT(release_date,'%Y-%m-%d')          AS release_date,
                 DATE_FORMAT(expected_return_date,'%Y-%m-%d')  AS expected_return_date,
                 DATE_FORMAT(actual_return_date,'%Y-%m-%d')    AS actual_return_date,
                 status, balance, remarks,
                 start_mileage, end_mileage, start_fuel, end_fuel
          FROM rentals WHERE id = p_id;
      END
    `);
    console.log('sp_get_rental_by_id updated.');

    // 4. Re-create sp_create_rental
    await pool.query('DROP PROCEDURE IF EXISTS sp_create_rental');
    await pool.query(`
      CREATE PROCEDURE sp_create_rental(
          IN p_reservation_id        VARCHAR(36),
          IN p_staff_id              VARCHAR(36),
          IN p_release_date          DATE,
          IN p_expected_return_date  DATE,
          IN p_remarks               TEXT,
          IN p_start_mileage         INT,
          IN p_start_fuel            VARCHAR(30)
      )
      BEGIN
          DECLARE v_id VARCHAR(36);
          SET v_id = UUID();
          INSERT INTO rentals (id, reservation_id, staff_id, release_date, expected_return_date, balance, remarks, start_mileage, start_fuel)
          VALUES (v_id, p_reservation_id, p_staff_id, p_release_date, p_expected_return_date, 'Fully Paid', p_remarks, p_start_mileage, p_start_fuel);
          CALL sp_get_rental_by_id(v_id);
      END
    `);
    console.log('sp_create_rental updated.');

    // 5. Re-create sp_update_rental
    await pool.query('DROP PROCEDURE IF EXISTS sp_update_rental');
    await pool.query(`
      CREATE PROCEDURE sp_update_rental(
          IN p_id                 VARCHAR(36),
          IN p_actual_return_date DATE,
          IN p_status             VARCHAR(20),
          IN p_remarks            TEXT,
          IN p_end_mileage        INT,
          IN p_end_fuel           VARCHAR(30)
      )
      BEGIN
          DECLARE v_reservation_id VARCHAR(36);
          SELECT reservation_id INTO v_reservation_id FROM rentals WHERE id = p_id;
          UPDATE rentals
          SET actual_return_date = COALESCE(p_actual_return_date, actual_return_date),
              status             = COALESCE(p_status,             status),
              remarks            = COALESCE(p_remarks,            remarks),
              end_mileage        = COALESCE(p_end_mileage,        end_mileage),
              end_fuel           = COALESCE(p_end_fuel,           end_fuel)
          WHERE id = p_id;
          IF p_status = 'Completed' THEN
              UPDATE reservations SET label = 'Returned' WHERE id = v_reservation_id;
          END IF;
          CALL sp_get_rental_by_id(p_id);
      END
    `);
    console.log('sp_update_rental updated.');

    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
