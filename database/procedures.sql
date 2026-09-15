-- ============================================================
-- AutoRent Stored Procedures
-- ============================================================
USE vr;

DELIMITER $$

-- ============================================================
-- AUTH
-- ============================================================

DROP PROCEDURE IF EXISTS sp_login $$
CREATE PROCEDURE sp_login(IN p_username VARCHAR(100))
BEGIN
    SELECT u.id, u.username, u.full_name, u.password, u.role, u.is_active,
           u.license_number, u.license_type, u.license_expiry, u.license_restriction_codes, u.license_front_url, u.license_back_url,
           DATE_FORMAT(u.created_at,'%Y-%m-%d %H:%i:%s') AS created_at,
           DATE_FORMAT(u.updated_at,'%Y-%m-%d %H:%i:%s') AS updated_at,
           r.first_name, r.middle_name, r.last_name, r.gender, r.contact_number, r.address,
           DATE_FORMAT(r.date_of_birth,'%Y-%m-%d') AS date_of_birth,
           r.civil_status,
           COALESCE(u.license_number, r.license_number) AS license_number_profile,
           COALESCE(u.license_type, r.license_type) AS license_type_profile,
           DATE_FORMAT(COALESCE(u.license_expiry, r.license_expiry),'%Y-%m-%d') AS license_expiry_profile,
           COALESCE(u.license_restriction_codes, r.license_restriction_codes) AS license_restriction_codes_profile,
           COALESCE(u.license_front_url, r.license_front_url) AS license_front_url_profile,
           COALESCE(u.license_back_url, r.license_back_url) AS license_back_url_profile,
           DATE_FORMAT(r.submitted_at,'%Y-%m-%d') AS submitted_at
    FROM users u
    LEFT JOIN registration_requests r ON r.approved_user_id = u.id
    WHERE u.username = p_username AND u.is_active = 1
    LIMIT 1;
END $$

-- ============================================================
-- USERS
-- ============================================================

DROP PROCEDURE IF EXISTS sp_get_all_users $$
CREATE PROCEDURE sp_get_all_users()
BEGIN
    SELECT u.id, u.username, u.full_name, u.role, u.is_active,
           u.license_number, u.license_type, u.license_expiry, u.license_restriction_codes, u.license_front_url, u.license_back_url,
           DATE_FORMAT(u.created_at,'%Y-%m-%d %H:%i:%s') AS created_at,
           DATE_FORMAT(u.updated_at,'%Y-%m-%d %H:%i:%s') AS updated_at,
           r.first_name, r.middle_name, r.last_name, r.gender, r.contact_number, r.address,
           DATE_FORMAT(r.date_of_birth,'%Y-%m-%d') AS date_of_birth,
           r.civil_status,
           COALESCE(u.license_number, r.license_number) AS license_number_profile,
           COALESCE(u.license_type, r.license_type) AS license_type_profile,
           DATE_FORMAT(COALESCE(u.license_expiry, r.license_expiry),'%Y-%m-%d') AS license_expiry_profile,
           COALESCE(u.license_restriction_codes, r.license_restriction_codes) AS license_restriction_codes_profile,
           COALESCE(u.license_front_url, r.license_front_url) AS license_front_url_profile,
           COALESCE(u.license_back_url, r.license_back_url) AS license_back_url_profile,
           DATE_FORMAT(r.submitted_at,'%Y-%m-%d') AS submitted_at
    FROM users u
    LEFT JOIN registration_requests r ON r.approved_user_id = u.id
    ORDER BY u.created_at DESC;
END $$

DROP PROCEDURE IF EXISTS sp_get_user_by_id $$
CREATE PROCEDURE sp_get_user_by_id(IN p_id INT)
BEGIN
    SELECT u.id, u.username, u.full_name, u.role, u.is_active,
           u.license_number, u.license_type, u.license_expiry, u.license_restriction_codes, u.license_front_url, u.license_back_url,
           DATE_FORMAT(u.created_at,'%Y-%m-%d %H:%i:%s') AS created_at,
           DATE_FORMAT(u.updated_at,'%Y-%m-%d %H:%i:%s') AS updated_at,
           r.first_name, r.middle_name, r.last_name, r.gender, r.contact_number, r.address,
           DATE_FORMAT(r.date_of_birth,'%Y-%m-%d') AS date_of_birth,
           r.civil_status,
           COALESCE(u.license_number, r.license_number) AS license_number_profile,
           COALESCE(u.license_type, r.license_type) AS license_type_profile,
           DATE_FORMAT(COALESCE(u.license_expiry, r.license_expiry),'%Y-%m-%d') AS license_expiry_profile,
           COALESCE(u.license_restriction_codes, r.license_restriction_codes) AS license_restriction_codes_profile,
           COALESCE(u.license_front_url, r.license_front_url) AS license_front_url_profile,
           COALESCE(u.license_back_url, r.license_back_url) AS license_back_url_profile,
           DATE_FORMAT(r.submitted_at,'%Y-%m-%d') AS submitted_at
    FROM users u
    LEFT JOIN registration_requests r ON r.approved_user_id = u.id
    WHERE u.id = p_id;
END $$

DROP PROCEDURE IF EXISTS sp_create_user $$
CREATE PROCEDURE sp_create_user(
    IN p_username   VARCHAR(100),
    IN p_full_name  VARCHAR(150),
    IN p_password   VARCHAR(255),
    IN p_role       ENUM('admin','staff','customer'),
    IN p_is_active  TINYINT(1)
)
BEGIN
    INSERT INTO users (username, full_name, password, role, is_active)
    VALUES (p_username, p_full_name, p_password, IFNULL(p_role, 'customer'), IFNULL(p_is_active, 1));
    CALL sp_get_user_by_id(LAST_INSERT_ID());
END $$

DROP PROCEDURE IF EXISTS sp_update_user $$
CREATE PROCEDURE sp_update_user(
    IN p_id             INT,
    IN p_full_name      VARCHAR(150),
    IN p_username       VARCHAR(100),
    IN p_password       VARCHAR(255),
    IN p_is_active      TINYINT(1),
    IN p_first_name     VARCHAR(80),
    IN p_middle_name    VARCHAR(80),
    IN p_last_name      VARCHAR(80),
    IN p_gender         VARCHAR(30),
    IN p_contact_number VARCHAR(30),
    IN p_address        VARCHAR(300),
    IN p_date_of_birth  VARCHAR(30),
    IN p_civil_status   VARCHAR(30)
)
BEGIN
    UPDATE users
    SET full_name = COALESCE(p_full_name, full_name),
        username  = COALESCE(p_username,  username),
        password  = COALESCE(p_password,  password),
        is_active = COALESCE(p_is_active, is_active)
    WHERE id = p_id;

    IF p_first_name IS NOT NULL OR p_last_name IS NOT NULL OR p_contact_number IS NOT NULL OR p_address IS NOT NULL OR p_date_of_birth IS NOT NULL OR p_gender IS NOT NULL OR p_civil_status IS NOT NULL THEN
        IF EXISTS (SELECT 1 FROM registration_requests WHERE approved_user_id = p_id) THEN
            UPDATE registration_requests
            SET first_name     = COALESCE(p_first_name, first_name),
                middle_name    = COALESCE(p_middle_name, middle_name),
                last_name      = COALESCE(p_last_name, last_name),
                gender         = COALESCE(p_gender, gender),
                contact_number = COALESCE(p_contact_number, contact_number),
                address        = COALESCE(p_address, address),
                date_of_birth  = IF(p_date_of_birth IS NOT NULL AND p_date_of_birth != '', STR_TO_DATE(p_date_of_birth, '%Y-%m-%d'), date_of_birth),
                civil_status   = COALESCE(p_civil_status, civil_status)
            WHERE approved_user_id = p_id;
        END IF;
    END IF;

    CALL sp_get_user_by_id(p_id);
END $$

DROP PROCEDURE IF EXISTS sp_toggle_user_status $$
CREATE PROCEDURE sp_toggle_user_status(IN p_id INT)
BEGIN
    UPDATE users
    SET is_active = IF(is_active = 1, 0, 1)
    WHERE id = p_id;
    CALL sp_get_user_by_id(p_id);
END $$

DROP PROCEDURE IF EXISTS sp_delete_user $$
CREATE PROCEDURE sp_delete_user(IN p_id INT)
BEGIN
    DELETE FROM users WHERE id = p_id;
    SELECT ROW_COUNT() AS affected;
END $$

-- ============================================================
-- REGISTRATION REQUESTS
-- ============================================================

DROP PROCEDURE IF EXISTS sp_get_all_registration_requests $$
CREATE PROCEDURE sp_get_all_registration_requests()
BEGIN
    SELECT id, last_name, first_name, middle_name, gender, contact_number, address,
           DATE_FORMAT(date_of_birth,'%Y-%m-%d') AS date_of_birth,
           civil_status, status, rejection_reason, approved_user_id,
           license_number, license_type, DATE_FORMAT(license_expiry,'%Y-%m-%d') AS license_expiry,
           license_restriction_codes, license_front_url, license_back_url,
           DATE_FORMAT(submitted_at,'%Y-%m-%d') AS submitted_at
    FROM registration_requests
    ORDER BY submitted_at DESC;
END $$

DROP PROCEDURE IF EXISTS sp_create_registration_request $$
CREATE PROCEDURE sp_create_registration_request(
    IN p_last_name      VARCHAR(80),
    IN p_first_name     VARCHAR(80),
    IN p_middle_name    VARCHAR(80),
    IN p_gender         VARCHAR(30),
    IN p_contact_number VARCHAR(30),
    IN p_address        VARCHAR(300),
    IN p_date_of_birth  DATE,
    IN p_civil_status   VARCHAR(30),
    IN p_license_number VARCHAR(50),
    IN p_license_type   VARCHAR(50),
    IN p_license_expiry DATE,
    IN p_license_restriction_codes VARCHAR(100),
    IN p_license_front_url VARCHAR(500),
    IN p_license_back_url  VARCHAR(500)
)
BEGIN
    DECLARE v_id VARCHAR(36);
    SET v_id = UUID();
    INSERT INTO registration_requests
        (id, last_name, first_name, middle_name, gender, contact_number, address, date_of_birth, civil_status,
         license_number, license_type, license_expiry, license_restriction_codes, license_front_url, license_back_url, submitted_at)
    VALUES
        (v_id, p_last_name, p_first_name, p_middle_name, p_gender, p_contact_number, p_address, p_date_of_birth, p_civil_status,
         p_license_number, p_license_type, p_license_expiry, p_license_restriction_codes, p_license_front_url, p_license_back_url, CURDATE());
    SELECT id, last_name, first_name, middle_name, gender, contact_number, address,
           DATE_FORMAT(date_of_birth,'%Y-%m-%d') AS date_of_birth,
           civil_status, status,
           license_number, license_type, DATE_FORMAT(license_expiry,'%Y-%m-%d') AS license_expiry,
           license_restriction_codes, license_front_url, license_back_url,
           DATE_FORMAT(submitted_at,'%Y-%m-%d') AS submitted_at
    FROM registration_requests WHERE id = v_id;
END $$

DROP PROCEDURE IF EXISTS sp_approve_registration $$
CREATE PROCEDURE sp_approve_registration(
    IN p_reg_id   VARCHAR(36),
    IN p_username VARCHAR(100),
    IN p_password VARCHAR(255)
)
BEGIN
    DECLARE v_last    VARCHAR(80);
    DECLARE v_first   VARCHAR(80);
    DECLARE v_middle  VARCHAR(80);
    DECLARE v_user_id INT UNSIGNED;
    DECLARE v_lic_num VARCHAR(50);
    DECLARE v_lic_typ VARCHAR(50);
    DECLARE v_lic_exp DATE;
    DECLARE v_lic_res VARCHAR(100);
    DECLARE v_lic_fro VARCHAR(500);
    DECLARE v_lic_bac VARCHAR(500);

    SELECT last_name, first_name, middle_name, license_number, license_type, license_expiry, license_restriction_codes, license_front_url, license_back_url
    INTO v_last, v_first, v_middle, v_lic_num, v_lic_typ, v_lic_exp, v_lic_res, v_lic_fro, v_lic_bac
    FROM registration_requests WHERE id = p_reg_id;

    INSERT INTO users (username, full_name, password, role, is_active,
                       license_number, license_type, license_expiry, license_restriction_codes, license_front_url, license_back_url)
    VALUES (p_username,
            CONCAT(v_first, IF(v_middle != '', CONCAT(' ', v_middle), ''), ' ', v_last),
            p_password, 'customer', 1,
            v_lic_num, v_lic_typ, v_lic_exp, v_lic_res, v_lic_fro, v_lic_bac);

    SET v_user_id = LAST_INSERT_ID();

    UPDATE registration_requests
    SET status = 'approved', approved_user_id = v_user_id
    WHERE id = p_reg_id;

    SELECT v_user_id AS user_id;
END $$

DROP PROCEDURE IF EXISTS sp_reject_registration $$
CREATE PROCEDURE sp_reject_registration(
    IN p_reg_id VARCHAR(36),
    IN p_reason VARCHAR(500)
)
BEGIN
    UPDATE registration_requests
    SET status = 'rejected', rejection_reason = p_reason
    WHERE id = p_reg_id;
    SELECT ROW_COUNT() AS affected;
END $$

-- ============================================================
-- VEHICLES
-- ============================================================

DROP PROCEDURE IF EXISTS sp_get_all_vehicles $$
CREATE PROCEDURE sp_get_all_vehicles()
BEGIN
    SELECT id, name, brand, model, year, type, license_plate, seats, transmission,
           fuel_type, price_per_day, description, image, status,
           DATE_FORMAT(created_at,'%Y-%m-%d') AS created_at
    FROM vehicles
    ORDER BY created_at DESC;
END $$

DROP PROCEDURE IF EXISTS sp_get_vehicle_by_id $$
CREATE PROCEDURE sp_get_vehicle_by_id(IN p_id VARCHAR(36))
BEGIN
    SELECT id, name, brand, model, year, type, license_plate, seats, transmission,
           fuel_type, price_per_day, description, image, status,
           DATE_FORMAT(created_at,'%Y-%m-%d') AS created_at
    FROM vehicles WHERE id = p_id;
END $$

DROP PROCEDURE IF EXISTS sp_create_vehicle $$
CREATE PROCEDURE sp_create_vehicle(
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
    IN p_status        VARCHAR(30)
)
BEGIN
    DECLARE v_id VARCHAR(36);
    SET v_id = UUID();
    INSERT INTO vehicles (id, name, brand, model, year, type, license_plate, seats, transmission,
                          fuel_type, price_per_day, description, image, status, created_at)
    VALUES (v_id, p_name, p_brand, p_model, p_year, p_type, p_license_plate, p_seats, p_transmission,
            p_fuel_type, p_price_per_day, p_description, p_image, p_status, CURDATE());
    CALL sp_get_vehicle_by_id(v_id);
END $$

DROP PROCEDURE IF EXISTS sp_update_vehicle $$
CREATE PROCEDURE sp_update_vehicle(
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
    IN p_status        VARCHAR(30)
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
        status        = COALESCE(p_status,        status)
    WHERE id = p_id;
    CALL sp_get_vehicle_by_id(p_id);
END $$

DROP PROCEDURE IF EXISTS sp_delete_vehicle $$
CREATE PROCEDURE sp_delete_vehicle(IN p_id VARCHAR(36))
BEGIN
    DELETE FROM vehicles WHERE id = p_id;
    SELECT ROW_COUNT() AS affected;
END $$

-- ============================================================
-- RESERVATIONS
-- ============================================================

DROP PROCEDURE IF EXISTS sp_get_all_reservations $$
CREATE PROCEDURE sp_get_all_reservations()
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
END $$

DROP PROCEDURE IF EXISTS sp_get_reservation_by_id $$
CREATE PROCEDURE sp_get_reservation_by_id(IN p_id VARCHAR(36))
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
END $$

DROP PROCEDURE IF EXISTS sp_create_reservation $$
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
END $$

DROP PROCEDURE IF EXISTS sp_update_reservation_status $$
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
END $$

DROP PROCEDURE IF EXISTS sp_update_reservation $$
CREATE PROCEDURE sp_update_reservation(
    IN p_id                VARCHAR(36),
    IN p_status            VARCHAR(30),
    IN p_label             VARCHAR(30),
    IN p_grace_period_mins SMALLINT,
    IN p_actual_pickup     DATETIME,
    IN p_no_show_at        DATETIME,
    IN p_no_show_reason    VARCHAR(500)
)
BEGIN
    UPDATE reservations
    SET status               = COALESCE(p_status,            status),
        label                = COALESCE(p_label,             label),
        grace_period_minutes = COALESCE(p_grace_period_mins, grace_period_minutes),
        actual_pickup_time   = COALESCE(p_actual_pickup,     actual_pickup_time),
        no_show_at           = COALESCE(p_no_show_at,        no_show_at),
        no_show_reason       = COALESCE(p_no_show_reason,    no_show_reason)
    WHERE id = p_id;
    CALL sp_get_reservation_by_id(p_id);
END $$

-- ============================================================
-- RENTALS
-- ============================================================

DROP PROCEDURE IF EXISTS sp_get_all_rentals $$
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
END $$

DROP PROCEDURE IF EXISTS sp_get_rental_by_id $$
CREATE PROCEDURE sp_get_rental_by_id(IN p_id VARCHAR(36))
BEGIN
    SELECT id, reservation_id, staff_id,
           DATE_FORMAT(release_date,'%Y-%m-%d')          AS release_date,
           DATE_FORMAT(expected_return_date,'%Y-%m-%d')  AS expected_return_date,
           DATE_FORMAT(actual_return_date,'%Y-%m-%d')    AS actual_return_date,
           status, balance, remarks,
           start_mileage, end_mileage, start_fuel, end_fuel
    FROM rentals WHERE id = p_id;
END $$

DROP PROCEDURE IF EXISTS sp_create_rental $$
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
END $$

DROP PROCEDURE IF EXISTS sp_update_rental $$
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
END $$

-- ============================================================
-- MAINTENANCE
-- ============================================================

DROP PROCEDURE IF EXISTS sp_get_all_charges $$
CREATE PROCEDURE sp_get_all_charges()
BEGIN
    SELECT id, rental_id, customer_id, vehicle_id, description, amount, status,
           DATE_FORMAT(paid_at, '%Y-%m-%d %H:%i:%s') AS paid_at,
           DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS created_at
    FROM charges ORDER BY created_at DESC;
END $$

DROP PROCEDURE IF EXISTS sp_create_charge $$
CREATE PROCEDURE sp_create_charge(
    IN p_rental_id VARCHAR(36), IN p_customer_id INT, IN p_vehicle_id VARCHAR(36),
    IN p_description TEXT, IN p_amount DECIMAL(10,2)
)
BEGIN
    DECLARE v_id VARCHAR(36);
    SET v_id = UUID();
    INSERT INTO charges (id, rental_id, customer_id, vehicle_id, description, amount)
    VALUES (v_id, p_rental_id, p_customer_id, p_vehicle_id, p_description, p_amount)
    ON DUPLICATE KEY UPDATE description = VALUES(description), amount = VALUES(amount);
    SELECT id, rental_id, customer_id, vehicle_id, description, amount, status,
           DATE_FORMAT(paid_at, '%Y-%m-%d %H:%i:%s') AS paid_at,
           DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS created_at
    FROM charges WHERE rental_id = p_rental_id;
END $$

DROP PROCEDURE IF EXISTS sp_pay_charge $$
CREATE PROCEDURE sp_pay_charge(IN p_id VARCHAR(36))
BEGIN
    UPDATE charges SET status = 'Paid', paid_at = NOW() WHERE id = p_id;
    SELECT id, rental_id, customer_id, vehicle_id, description, amount, status,
           DATE_FORMAT(paid_at, '%Y-%m-%d %H:%i:%s') AS paid_at,
           DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS created_at
    FROM charges WHERE id = p_id;
END $$

DROP PROCEDURE IF EXISTS sp_get_all_billings $$
CREATE PROCEDURE sp_get_all_billings()
BEGIN
    SELECT b.id, b.reservation_id, b.customer_id, b.total_amount, b.status,
           DATE_FORMAT(b.created_at, '%Y-%m-%d %H:%i:%s') AS created_at
    FROM billings b ORDER BY b.created_at DESC;
END $$

DROP PROCEDURE IF EXISTS sp_create_billing $$
CREATE PROCEDURE sp_create_billing(
    IN p_reservation_id VARCHAR(36), IN p_customer_id INT, IN p_total_amount DECIMAL(10,2)
)
BEGIN
    DECLARE v_id VARCHAR(36);
    SET v_id = UUID();
    INSERT INTO billings (id, reservation_id, customer_id, total_amount)
    VALUES (v_id, p_reservation_id, p_customer_id, p_total_amount)
    ON DUPLICATE KEY UPDATE total_amount = VALUES(total_amount);
    SELECT id, reservation_id, customer_id, total_amount, status,
           DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS created_at
    FROM billings WHERE reservation_id = p_reservation_id;
END $$

DROP PROCEDURE IF EXISTS sp_get_all_payments $$
CREATE PROCEDURE sp_get_all_payments()
BEGIN
    SELECT id, billing_id, customer_id, amount, change_amount, payment_method,
           DATE_FORMAT(paid_at, '%Y-%m-%d %H:%i:%s') AS paid_at
    FROM payments ORDER BY paid_at DESC;
END $$

DROP PROCEDURE IF EXISTS sp_create_payment $$
CREATE PROCEDURE sp_create_payment(
    IN p_billing_id VARCHAR(36), IN p_customer_id INT, IN p_amount DECIMAL(10,2),
    IN p_change_amount DECIMAL(10,2), IN p_payment_method VARCHAR(30)
)
BEGIN
    DECLARE v_id VARCHAR(36);
    SET v_id = UUID();
    INSERT INTO payments (id, billing_id, customer_id, amount, change_amount, payment_method)
    VALUES (v_id, p_billing_id, p_customer_id, p_amount, p_change_amount, p_payment_method);
    UPDATE billings SET status = 'Paid' WHERE id = p_billing_id;
    SELECT id, billing_id, customer_id, amount, change_amount, payment_method,
           DATE_FORMAT(paid_at, '%Y-%m-%d %H:%i:%s') AS paid_at
    FROM payments WHERE id = v_id;
END $$

DROP PROCEDURE IF EXISTS sp_get_all_maintenance $$
CREATE PROCEDURE sp_get_all_maintenance()
BEGIN
    SELECT id, vehicle_id, reported_by, description,
           DATE_FORMAT(maintenance_date,'%Y-%m-%d') AS maintenance_date,
           cost, status
    FROM maintenance
    ORDER BY maintenance_date DESC;
END $$

DROP PROCEDURE IF EXISTS sp_get_maintenance_by_id $$
CREATE PROCEDURE sp_get_maintenance_by_id(IN p_id VARCHAR(36))
BEGIN
    SELECT id, vehicle_id, reported_by, description,
           DATE_FORMAT(maintenance_date,'%Y-%m-%d') AS maintenance_date,
           cost, status
    FROM maintenance WHERE id = p_id;
END $$

DROP PROCEDURE IF EXISTS sp_create_maintenance $$
CREATE PROCEDURE sp_create_maintenance(
    IN p_vehicle_id        VARCHAR(36),
    IN p_reported_by       VARCHAR(150),
    IN p_description       TEXT,
    IN p_maintenance_date  DATE,
    IN p_cost              DECIMAL(10,2)
)
BEGIN
    DECLARE v_id VARCHAR(36);
    SET v_id = UUID();
    INSERT INTO maintenance (id, vehicle_id, reported_by, description, maintenance_date, cost)
    VALUES (v_id, p_vehicle_id, p_reported_by, p_description, p_maintenance_date, p_cost);
    UPDATE vehicles SET status = 'Maintenance' WHERE id = p_vehicle_id;
    CALL sp_get_maintenance_by_id(v_id);
END $$

DROP PROCEDURE IF EXISTS sp_update_maintenance $$
CREATE PROCEDURE sp_update_maintenance(
    IN p_id          VARCHAR(36),
    IN p_status      VARCHAR(30),
    IN p_cost        DECIMAL(10,2),
    IN p_description TEXT
)
BEGIN
    DECLARE v_vehicle_id VARCHAR(36);
    UPDATE maintenance
    SET status      = COALESCE(p_status,      status),
        cost        = COALESCE(p_cost,        cost),
        description = COALESCE(p_description, description)
    WHERE id = p_id;

    SELECT vehicle_id INTO v_vehicle_id FROM maintenance WHERE id = p_id;
    IF p_status = 'Completed' THEN
        -- Only set vehicle Available if there are no other active (Pending / In Progress) maintenance jobs
        IF (SELECT COUNT(*) FROM maintenance WHERE vehicle_id = v_vehicle_id AND status != 'Completed' AND id != p_id) = 0 THEN
            UPDATE vehicles SET status = 'Available' WHERE id = v_vehicle_id;
        END IF;
    ELSEIF p_status IN ('Pending', 'In Progress') THEN
        UPDATE vehicles SET status = 'Maintenance' WHERE id = v_vehicle_id;
    END IF;

    CALL sp_get_maintenance_by_id(p_id);
END $$

DROP PROCEDURE IF EXISTS sp_delete_maintenance $$
CREATE PROCEDURE sp_delete_maintenance(IN p_id VARCHAR(36))
BEGIN
    DECLARE v_vehicle_id VARCHAR(36);
    SELECT vehicle_id INTO v_vehicle_id FROM maintenance WHERE id = p_id;
    DELETE FROM maintenance WHERE id = p_id;

    IF v_vehicle_id IS NOT NULL THEN
        IF (SELECT COUNT(*) FROM maintenance WHERE vehicle_id = v_vehicle_id AND status != 'Completed') = 0 THEN
            UPDATE vehicles SET status = 'Available' WHERE id = v_vehicle_id AND status = 'Maintenance';
        END IF;
    END IF;
    SELECT 1 AS success;
END $$


-- ============================================================
-- DAMAGE REPORTS
-- ============================================================

DROP PROCEDURE IF EXISTS sp_get_all_damage_reports $$
CREATE PROCEDURE sp_get_all_damage_reports()
BEGIN
    SELECT id, rental_id, vehicle_id, reported_by, description, estimated_cost,
           DATE_FORMAT(created_at,'%Y-%m-%d') AS created_at
    FROM damage_reports ORDER BY created_at DESC;
END $$

DROP PROCEDURE IF EXISTS sp_create_damage_report $$
CREATE PROCEDURE sp_create_damage_report(
    IN p_rental_id      VARCHAR(36),
    IN p_vehicle_id     VARCHAR(36),
    IN p_reported_by    VARCHAR(150),
    IN p_description    TEXT,
    IN p_estimated_cost DECIMAL(10,2)
)
BEGIN
    DECLARE v_id VARCHAR(36);
    SET v_id = UUID();
    INSERT INTO damage_reports (id, rental_id, vehicle_id, reported_by, description, estimated_cost, created_at)
    VALUES (v_id, p_rental_id, p_vehicle_id, p_reported_by, p_description, p_estimated_cost, CURDATE());
    SELECT id, rental_id, vehicle_id, reported_by, description, estimated_cost,
           DATE_FORMAT(created_at,'%Y-%m-%d') AS created_at
    FROM damage_reports WHERE id = v_id;
END $$

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

DROP PROCEDURE IF EXISTS sp_get_notifications_for_user $$
CREATE PROCEDURE sp_get_notifications_for_user(IN p_user_id VARCHAR(36))
BEGIN
    SELECT id, user_id, message, type, is_read AS `read`,
           DATE_FORMAT(created_at,'%Y-%m-%d') AS created_at
    FROM notifications
    WHERE user_id = p_user_id
    ORDER BY created_at DESC;
END $$

DROP PROCEDURE IF EXISTS sp_create_notification $$
CREATE PROCEDURE sp_create_notification(
    IN p_user_id VARCHAR(36),
    IN p_message TEXT,
    IN p_type    VARCHAR(20)
)
BEGIN
    DECLARE v_id VARCHAR(36);
    SET v_id = UUID();
    INSERT INTO notifications (id, user_id, message, type, created_at)
    VALUES (v_id, p_user_id, p_message, p_type, CURDATE());
    SELECT id, user_id, message, type, is_read AS `read`,
           DATE_FORMAT(created_at,'%Y-%m-%d') AS created_at
    FROM notifications WHERE id = v_id;
END $$

DROP PROCEDURE IF EXISTS sp_mark_notification_read $$
CREATE PROCEDURE sp_mark_notification_read(IN p_id VARCHAR(36))
BEGIN
    UPDATE notifications SET is_read = 1 WHERE id = p_id;
    SELECT ROW_COUNT() AS affected;
END $$

DROP PROCEDURE IF EXISTS sp_mark_all_notifications_read $$
CREATE PROCEDURE sp_mark_all_notifications_read(IN p_user_id VARCHAR(36))
BEGIN
    UPDATE notifications SET is_read = 1 WHERE user_id = p_user_id;
    SELECT ROW_COUNT() AS affected;
END $$

DELIMITER ;
