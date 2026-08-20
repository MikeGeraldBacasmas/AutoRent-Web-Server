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
           DATE_FORMAT(u.created_at,'%Y-%m-%d %H:%i:%s') AS created_at,
           DATE_FORMAT(u.updated_at,'%Y-%m-%d %H:%i:%s') AS updated_at,
           r.first_name, r.middle_name, r.last_name, r.gender, r.contact_number, r.address,
           DATE_FORMAT(r.date_of_birth,'%Y-%m-%d') AS date_of_birth,
           r.civil_status,
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
           DATE_FORMAT(u.created_at,'%Y-%m-%d %H:%i:%s') AS created_at,
           DATE_FORMAT(u.updated_at,'%Y-%m-%d %H:%i:%s') AS updated_at,
           r.first_name, r.middle_name, r.last_name, r.gender, r.contact_number, r.address,
           DATE_FORMAT(r.date_of_birth,'%Y-%m-%d') AS date_of_birth,
           r.civil_status,
           DATE_FORMAT(r.submitted_at,'%Y-%m-%d') AS submitted_at
    FROM users u
    LEFT JOIN registration_requests r ON r.approved_user_id = u.id
    ORDER BY u.created_at DESC;
END $$

DROP PROCEDURE IF EXISTS sp_get_user_by_id $$
CREATE PROCEDURE sp_get_user_by_id(IN p_id INT)
BEGIN
    SELECT u.id, u.username, u.full_name, u.role, u.is_active,
           DATE_FORMAT(u.created_at,'%Y-%m-%d %H:%i:%s') AS created_at,
           DATE_FORMAT(u.updated_at,'%Y-%m-%d %H:%i:%s') AS updated_at,
           r.first_name, r.middle_name, r.last_name, r.gender, r.contact_number, r.address,
           DATE_FORMAT(r.date_of_birth,'%Y-%m-%d') AS date_of_birth,
           r.civil_status,
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
    IN p_civil_status   VARCHAR(30)
)
BEGIN
    DECLARE v_id VARCHAR(36);
    SET v_id = UUID();
    INSERT INTO registration_requests
        (id, last_name, first_name, middle_name, gender, contact_number, address, date_of_birth, civil_status, submitted_at)
    VALUES
        (v_id, p_last_name, p_first_name, p_middle_name, p_gender, p_contact_number, p_address, p_date_of_birth, p_civil_status, CURDATE());
    SELECT id, last_name, first_name, middle_name, gender, contact_number, address,
           DATE_FORMAT(date_of_birth,'%Y-%m-%d') AS date_of_birth,
           civil_status, status,
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

    SELECT last_name, first_name, middle_name
    INTO v_last, v_first, v_middle
    FROM registration_requests WHERE id = p_reg_id;

    INSERT INTO users (username, full_name, password, role, is_active)
    VALUES (p_username,
            CONCAT(v_first, IF(v_middle != '', CONCAT(' ', v_middle), ''), ' ', v_last),
            p_password, 'customer', 1);

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
    IN p_image         VARCHAR(500),
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
    IN p_image         VARCHAR(500),
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
           pickup_location, return_location, total_amount, status,
           grace_period_minutes, actual_pickup_time, no_show_at,
           no_show_reason, remarks,
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
           pickup_location, return_location, total_amount, status,
           grace_period_minutes, actual_pickup_time, no_show_at,
           no_show_reason, remarks,
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
    IN p_remarks           TEXT
)
BEGIN
    DECLARE v_id VARCHAR(36);
    SET v_id = UUID();
    INSERT INTO reservations (id, customer_id, vehicle_id, pickup_date, pickup_time, return_date, return_time,
                              pickup_location, return_location, total_amount, grace_period_minutes, remarks, created_at)
    VALUES (v_id, p_customer_id, p_vehicle_id, p_pickup_date, p_pickup_time, p_return_date, p_return_time,
            p_pickup_location, p_return_location, p_total_amount, p_grace_period_mins, p_remarks, CURDATE());
    CALL sp_get_reservation_by_id(v_id);
END $$

DROP PROCEDURE IF EXISTS sp_update_reservation_status $$
CREATE PROCEDURE sp_update_reservation_status(
    IN p_id     VARCHAR(36),
    IN p_status VARCHAR(30)
)
BEGIN
    UPDATE reservations SET status = p_status WHERE id = p_id;
    CALL sp_get_reservation_by_id(p_id);
END $$

DROP PROCEDURE IF EXISTS sp_update_reservation $$
CREATE PROCEDURE sp_update_reservation(
    IN p_id                VARCHAR(36),
    IN p_status            VARCHAR(30),
    IN p_grace_period_mins SMALLINT,
    IN p_actual_pickup     DATETIME,
    IN p_no_show_at        DATETIME,
    IN p_no_show_reason    VARCHAR(500)
)
BEGIN
    UPDATE reservations
    SET status               = COALESCE(p_status,            status),
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
           status, remarks
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
           status, remarks
    FROM rentals WHERE id = p_id;
END $$

DROP PROCEDURE IF EXISTS sp_create_rental $$
CREATE PROCEDURE sp_create_rental(
    IN p_reservation_id        VARCHAR(36),
    IN p_staff_id              VARCHAR(36),
    IN p_release_date          DATE,
    IN p_expected_return_date  DATE,
    IN p_remarks               TEXT
)
BEGIN
    DECLARE v_id VARCHAR(36);
    SET v_id = UUID();
    INSERT INTO rentals (id, reservation_id, staff_id, release_date, expected_return_date, remarks)
    VALUES (v_id, p_reservation_id, p_staff_id, p_release_date, p_expected_return_date, p_remarks);
    CALL sp_get_rental_by_id(v_id);
END $$

DROP PROCEDURE IF EXISTS sp_update_rental $$
CREATE PROCEDURE sp_update_rental(
    IN p_id                 VARCHAR(36),
    IN p_actual_return_date DATE,
    IN p_status             VARCHAR(20),
    IN p_remarks            TEXT
)
BEGIN
    UPDATE rentals
    SET actual_return_date = COALESCE(p_actual_return_date, actual_return_date),
        status             = COALESCE(p_status,             status),
        remarks            = COALESCE(p_remarks,            remarks)
    WHERE id = p_id;
    CALL sp_get_rental_by_id(p_id);
END $$

-- ============================================================
-- MAINTENANCE
-- ============================================================

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
    IN p_id     VARCHAR(36),
    IN p_status VARCHAR(30),
    IN p_cost   DECIMAL(10,2)
)
BEGIN
    DECLARE v_vehicle_id VARCHAR(36);
    UPDATE maintenance
    SET status = COALESCE(p_status, status),
        cost   = COALESCE(p_cost,   cost)
    WHERE id = p_id;

    IF p_status = 'Completed' THEN
        SELECT vehicle_id INTO v_vehicle_id FROM maintenance WHERE id = p_id;
        UPDATE vehicles SET status = 'Available' WHERE id = v_vehicle_id;
    END IF;
    CALL sp_get_maintenance_by_id(p_id);
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
