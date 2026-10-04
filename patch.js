import pool, { callProc } from './server/db.js';

async function patch() {
  try {
    console.log("Adding columns to vehicles table...");
    await pool.query(`ALTER TABLE vehicles 
      ADD COLUMN or_image MEDIUMTEXT NULL,
      ADD COLUMN cr_image MEDIUMTEXT NULL,
      ADD COLUMN registration_expiry DATE NULL,
      ADD COLUMN chassis_number VARCHAR(100) NULL,
      ADD COLUMN engine_number VARCHAR(100) NULL,
      ADD COLUMN mv_file_number VARCHAR(100) NULL,
      ADD COLUMN registered_owner VARCHAR(150) NULL,
      ADD COLUMN insurance_provider VARCHAR(150) NULL,
      ADD COLUMN insurance_policy_number VARCHAR(100) NULL,
      ADD COLUMN insurance_expiry DATE NULL;
    `);
  } catch(e) { console.log(e.message); }

  console.log("Updating stored procedures...");
  await pool.query(`DROP PROCEDURE IF EXISTS sp_get_all_vehicles;`);
  await pool.query(`CREATE PROCEDURE sp_get_all_vehicles()
BEGIN
    SELECT id, name, brand, model, year, type, license_plate, seats, transmission,
           fuel_type, price_per_day, description, image, status,
           or_image, cr_image, DATE_FORMAT(registration_expiry,'%Y-%m-%d') AS registration_expiry,
           chassis_number, engine_number, mv_file_number, registered_owner,
           insurance_provider, insurance_policy_number, DATE_FORMAT(insurance_expiry,'%Y-%m-%d') AS insurance_expiry,
           DATE_FORMAT(created_at,'%Y-%m-%d') AS created_at
    FROM vehicles
    ORDER BY created_at DESC;
END;`);

  await pool.query(`DROP PROCEDURE IF EXISTS sp_get_vehicle_by_id;`);
  await pool.query(`CREATE PROCEDURE sp_get_vehicle_by_id(IN p_id VARCHAR(36))
BEGIN
    SELECT id, name, brand, model, year, type, license_plate, seats, transmission,
           fuel_type, price_per_day, description, image, status,
           or_image, cr_image, DATE_FORMAT(registration_expiry,'%Y-%m-%d') AS registration_expiry,
           chassis_number, engine_number, mv_file_number, registered_owner,
           insurance_provider, insurance_policy_number, DATE_FORMAT(insurance_expiry,'%Y-%m-%d') AS insurance_expiry,
           DATE_FORMAT(created_at,'%Y-%m-%d') AS created_at
    FROM vehicles WHERE id = p_id;
END;`);

  await pool.query(`DROP PROCEDURE IF EXISTS sp_create_vehicle;`);
  await pool.query(`CREATE PROCEDURE sp_create_vehicle(
    IN p_name          VARCHAR(150),
    IN p_brand         VARCHAR(80),
    IN p_model         VARCHAR(80),
    IN p_year          SMALLINT,
    IN p_type          VARCHAR(30),
    IN p_license_plate VARCHAR(30),
    IN p_seats         TINYINT,
    IN p_transmission  VARCHAR(20),
    IN p_fuel_type     VARCHAR(20),
    IN p_price_per_day DECIMAL(10,2),
    IN p_description   TEXT,
    IN p_image         MEDIUMTEXT,
    IN p_status        VARCHAR(30),
    IN p_or            MEDIUMTEXT,
    IN p_cr            MEDIUMTEXT,
    IN p_reg_exp       DATE,
    IN p_chassis       VARCHAR(100),
    IN p_engine        VARCHAR(100),
    IN p_mv            VARCHAR(100),
    IN p_owner         VARCHAR(150),
    IN p_ins_prov      VARCHAR(150),
    IN p_ins_pol       VARCHAR(100),
    IN p_ins_exp       DATE
)
BEGIN
    DECLARE v_id VARCHAR(36);
    SET v_id = UUID();
    INSERT INTO vehicles (id, name, brand, model, year, type, license_plate, seats, transmission,
                          fuel_type, price_per_day, description, image, status, created_at,
                          or_image, cr_image, registration_expiry, chassis_number, engine_number, mv_file_number,
                          registered_owner, insurance_provider, insurance_policy_number, insurance_expiry)
    VALUES (v_id, p_name, p_brand, p_model, p_year, p_type, p_license_plate, p_seats, p_transmission,
            p_fuel_type, p_price_per_day, p_description, p_image, p_status, CURDATE(),
            p_or, p_cr, p_reg_exp, p_chassis, p_engine, p_mv, p_owner, p_ins_prov, p_ins_pol, p_ins_exp);
    CALL sp_get_vehicle_by_id(v_id);
END;`);

  await pool.query(`DROP PROCEDURE IF EXISTS sp_update_vehicle;`);
  await pool.query(`CREATE PROCEDURE sp_update_vehicle(
    IN p_id            VARCHAR(36),
    IN p_name          VARCHAR(150),
    IN p_brand         VARCHAR(80),
    IN p_model         VARCHAR(80),
    IN p_year          SMALLINT,
    IN p_type          VARCHAR(30),
    IN p_license_plate VARCHAR(30),
    IN p_seats         TINYINT,
    IN p_transmission  VARCHAR(20),
    IN p_fuel_type     VARCHAR(20),
    IN p_price_per_day DECIMAL(10,2),
    IN p_description   TEXT,
    IN p_image         MEDIUMTEXT,
    IN p_status        VARCHAR(30),
    IN p_or            MEDIUMTEXT,
    IN p_cr            MEDIUMTEXT,
    IN p_reg_exp       DATE,
    IN p_chassis       VARCHAR(100),
    IN p_engine        VARCHAR(100),
    IN p_mv            VARCHAR(100),
    IN p_owner         VARCHAR(150),
    IN p_ins_prov      VARCHAR(150),
    IN p_ins_pol       VARCHAR(100),
    IN p_ins_exp       DATE
)
BEGIN
    UPDATE vehicles
    SET name          = COALESCE(p_name,          name),
        brand         = COALESCE(p_brand,         brand),
        model         = COALESCE(p_model,         model),
        year          = COALESCE(p_year,          year),
        type          = COALESCE(p_type,          type),
        license_plate = COALESCE(p_license_plate, license_plate),
        seats         = COALESCE(p_seats,         seats),
        transmission  = COALESCE(p_transmission,  transmission),
        fuel_type     = COALESCE(p_fuel_type,     fuel_type),
        price_per_day = COALESCE(p_price_per_day, price_per_day),
        description   = COALESCE(p_description,   description),
        image         = COALESCE(p_image,         image),
        status        = COALESCE(p_status,        status),
        or_image      = COALESCE(p_or,            or_image),
        cr_image      = COALESCE(p_cr,            cr_image),
        registration_expiry = COALESCE(p_reg_exp, registration_expiry),
        chassis_number = COALESCE(p_chassis,      chassis_number),
        engine_number = COALESCE(p_engine,        engine_number),
        mv_file_number = COALESCE(p_mv,           mv_file_number),
        registered_owner = COALESCE(p_owner,      registered_owner),
        insurance_provider = COALESCE(p_ins_prov, insurance_provider),
        insurance_policy_number = COALESCE(p_ins_pol, insurance_policy_number),
        insurance_expiry = COALESCE(p_ins_exp,    insurance_expiry)
    WHERE id = p_id;
    CALL sp_get_vehicle_by_id(p_id);
END;`);
  console.log("DB patched!");
  process.exit(0);
}
patch();
