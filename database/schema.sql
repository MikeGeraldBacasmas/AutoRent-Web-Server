-- ============================================================
-- AutoRent Database Schema
-- Engine: MySQL 8.0+ / MariaDB  |  Compatible with SQLyog
-- ============================================================

CREATE DATABASE IF NOT EXISTS vr CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE vr;

-- ------------------------------------------------------------
-- 1. USERS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    username   VARCHAR(100) NOT NULL,
    full_name  VARCHAR(150) NULL,
    password   VARCHAR(255) NOT NULL,
    role       ENUM('admin','staff','customer') NOT NULL DEFAULT 'customer',
    is_active  TINYINT(1)   NOT NULL DEFAULT 1,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_username (username),
    INDEX idx_users_role (role),
    INDEX idx_users_is_active (is_active)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 2. REGISTRATION REQUESTS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS registration_requests (
    id              VARCHAR(36)  NOT NULL,
    last_name       VARCHAR(80)  NOT NULL,
    first_name      VARCHAR(80)  NOT NULL,
    middle_name     VARCHAR(80)  NULL,
    gender          VARCHAR(30)  NOT NULL,
    contact_number  VARCHAR(30)  NOT NULL,
    address         VARCHAR(300) NOT NULL,
    date_of_birth   DATE         NOT NULL,
    civil_status    VARCHAR(30)  NOT NULL,
    status          ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
    rejection_reason VARCHAR(500) NULL,
    approved_user_id INT UNSIGNED NULL,
    submitted_at    DATE         NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_reg_status (status),
    FOREIGN KEY (approved_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 3. VEHICLES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vehicles (
    id            VARCHAR(36)  NOT NULL,
    name          VARCHAR(150) NOT NULL,
    brand         VARCHAR(80)  NOT NULL,
    model         VARCHAR(80)  NOT NULL,
    year          SMALLINT     NOT NULL,
    type          ENUM('Sedan','SUV','MPV','Van','Pickup Truck','Motorcycle') NOT NULL,
    license_plate VARCHAR(30)  NOT NULL UNIQUE,
    seats         TINYINT      NOT NULL,
    transmission  ENUM('Automatic','Manual') NOT NULL,
    fuel_type     ENUM('Gasoline','Diesel','Electric','Hybrid') NOT NULL,
    price_per_day DECIMAL(10,2) NOT NULL,
    description   TEXT         NULL,
    image         VARCHAR(500) NULL,
    status        ENUM('Available','Reserved','Rented','Maintenance','Unavailable') NOT NULL DEFAULT 'Available',
    created_at    DATE         NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_vehicles_status (status),
    INDEX idx_vehicles_type   (type)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 4. RESERVATIONS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reservations (
    id                  VARCHAR(36)   NOT NULL,
    customer_id         INT UNSIGNED  NULL,
    vehicle_id          VARCHAR(36)   NOT NULL,
    pickup_date         DATE          NOT NULL,
    pickup_time         TIME          NOT NULL,
    return_date         DATE          NOT NULL,
    return_time         TIME          NOT NULL,
    pickup_location     VARCHAR(200)  NOT NULL,
    return_location     VARCHAR(200)  NOT NULL,
    total_amount        DECIMAL(10,2) NOT NULL,
    status              ENUM('Pending','Approved','Reserved','Rejected','Cancelled','No-Show','Completed') NOT NULL DEFAULT 'Pending',
    label               ENUM('In Process','In Use','Returned') NOT NULL DEFAULT 'In Process',
    grace_period_minutes SMALLINT     NOT NULL DEFAULT 30,
    actual_pickup_time  DATETIME      NULL,
    no_show_at          DATETIME      NULL,
    no_show_reason      VARCHAR(500)  NULL,
    remarks             TEXT          NULL,
    created_at          DATE          NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_res_customer  (customer_id),
    INDEX idx_res_vehicle   (vehicle_id),
    INDEX idx_res_status    (status),
    INDEX idx_res_pickup    (pickup_date),
    FOREIGN KEY (customer_id) REFERENCES users(id)    ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id)  REFERENCES vehicles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS billings (
    id             VARCHAR(36) NOT NULL,
    reservation_id VARCHAR(36) NOT NULL UNIQUE,
    customer_id    INT UNSIGNED NOT NULL,
    total_amount   DECIMAL(10,2) NOT NULL,
    status         ENUM('Unpaid','Paid') NOT NULL DEFAULT 'Unpaid',
    created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_billings_customer (customer_id),
    FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS payments (
    id         VARCHAR(36) NOT NULL,
    billing_id VARCHAR(36) NOT NULL,
    customer_id INT UNSIGNED NOT NULL,
    amount     DECIMAL(10,2) NOT NULL,
    change_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    payment_method VARCHAR(30) NOT NULL DEFAULT 'Cash',
    paid_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_payments_customer (customer_id),
    FOREIGN KEY (billing_id) REFERENCES billings(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

SET @add_reservation_label = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE reservations ADD COLUMN label ENUM(\'In Process\',\'In Use\',\'Returned\') NOT NULL DEFAULT \'In Process\' AFTER status',
        'SELECT 1'
    )
    FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'reservations' AND column_name = 'label'
);
PREPARE add_reservation_label FROM @add_reservation_label;
EXECUTE add_reservation_label;
DEALLOCATE PREPARE add_reservation_label;

-- ------------------------------------------------------------
-- 5. RENTALS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rentals (
    id                   VARCHAR(36)  NOT NULL,
    reservation_id       VARCHAR(36)  NOT NULL UNIQUE,
    staff_id             INT UNSIGNED NULL,
    release_date         DATE         NOT NULL,
    expected_return_date DATE         NOT NULL,
    actual_return_date   DATE         NULL,
    status               ENUM('Active','Completed','Overdue') NOT NULL DEFAULT 'Active',
    balance              ENUM('Fully Paid') NOT NULL DEFAULT 'Fully Paid',
    remarks              TEXT         NULL,
    PRIMARY KEY (id),
    INDEX idx_rentals_status  (status),
    FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id)       REFERENCES users(id)        ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS charges (
    id           VARCHAR(36) NOT NULL,
    rental_id    VARCHAR(36) NOT NULL,
    customer_id  INT UNSIGNED NOT NULL,
    vehicle_id   VARCHAR(36) NOT NULL,
    description  TEXT NOT NULL,
    amount       DECIMAL(10,2) NOT NULL,
    status       ENUM('Unpaid','Paid') NOT NULL DEFAULT 'Unpaid',
    paid_at      DATETIME NULL,
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_charges_rental (rental_id),
    INDEX idx_charges_customer (customer_id),
    FOREIGN KEY (rental_id) REFERENCES rentals(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

SET @add_rental_balance = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE rentals ADD COLUMN balance ENUM(\'Fully Paid\') NOT NULL DEFAULT \'Fully Paid\' AFTER status',
        'SELECT 1'
    )
    FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'rentals' AND column_name = 'balance'
);
PREPARE add_rental_balance FROM @add_rental_balance;
EXECUTE add_rental_balance;
DEALLOCATE PREPARE add_rental_balance;

-- ------------------------------------------------------------
-- 6. MAINTENANCE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS maintenance (
    id               VARCHAR(36)  NOT NULL,
    vehicle_id       VARCHAR(36)  NOT NULL,
    reported_by      VARCHAR(150) NOT NULL,
    description      TEXT         NOT NULL,
    maintenance_date DATE         NOT NULL,
    cost             DECIMAL(10,2) NOT NULL DEFAULT 0,
    status           ENUM('Pending','In Progress','Completed') NOT NULL DEFAULT 'Pending',
    PRIMARY KEY (id),
    INDEX idx_maint_vehicle (vehicle_id),
    INDEX idx_maint_status  (status),
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 7. DAMAGE REPORTS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS damage_reports (
    id              VARCHAR(36)  NOT NULL,
    rental_id       VARCHAR(36)  NOT NULL,
    vehicle_id      VARCHAR(36)  NOT NULL,
    reported_by     VARCHAR(150) NOT NULL,
    description     TEXT         NOT NULL,
    estimated_cost  DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at      DATE         NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (rental_id)  REFERENCES rentals(id)  ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 8. NOTIFICATIONS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    id         VARCHAR(36)  NOT NULL,
    user_id    INT UNSIGNED NOT NULL,
    message    TEXT         NOT NULL,
    type       ENUM('info','success','warning','error') NOT NULL DEFAULT 'info',
    is_read    TINYINT(1)   NOT NULL DEFAULT 0,
    created_at DATE         NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_notif_user   (user_id),
    INDEX idx_notif_read   (is_read),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;
