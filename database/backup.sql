/*
SQLyog Ultimate v9.62 
MySQL - 5.7.43-log : Database - vr
*********************************************************************
*/


/*!40101 SET NAMES utf8 */;

/*!40101 SET SQL_MODE=''*/;

/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
CREATE DATABASE /*!32312 IF NOT EXISTS*/`vr` /*!40100 DEFAULT CHARACTER SET latin1 */;

USE `vr`;

/*Table structure for table `damage_reports` */

DROP TABLE IF EXISTS `damage_reports`;

CREATE TABLE `damage_reports` (
  `id` varchar(36) NOT NULL,
  `rental_id` varchar(36) NOT NULL,
  `vehicle_id` varchar(36) NOT NULL,
  `reported_by` varchar(150) NOT NULL,
  `description` text NOT NULL,
  `estimated_cost` decimal(10,2) NOT NULL DEFAULT '0.00',
  `created_at` date NOT NULL,
  PRIMARY KEY (`id`),
  KEY `rental_id` (`rental_id`),
  KEY `vehicle_id` (`vehicle_id`),
  CONSTRAINT `damage_reports_ibfk_1` FOREIGN KEY (`rental_id`) REFERENCES `rentals` (`id`) ON DELETE CASCADE,
  CONSTRAINT `damage_reports_ibfk_2` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Data for the table `damage_reports` */

/*Table structure for table `maintenance` */

DROP TABLE IF EXISTS `maintenance`;

CREATE TABLE `maintenance` (
  `id` varchar(36) NOT NULL,
  `vehicle_id` varchar(36) NOT NULL,
  `reported_by` varchar(150) NOT NULL,
  `description` text NOT NULL,
  `maintenance_date` date NOT NULL,
  `cost` decimal(10,2) NOT NULL DEFAULT '0.00',
  `status` enum('Pending','In Progress','Completed') NOT NULL DEFAULT 'Pending',
  PRIMARY KEY (`id`),
  KEY `idx_maint_vehicle` (`vehicle_id`),
  KEY `idx_maint_status` (`status`),
  CONSTRAINT `maintenance_ibfk_1` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Data for the table `maintenance` */

/*Table structure for table `notifications` */

DROP TABLE IF EXISTS `notifications`;

CREATE TABLE `notifications` (
  `id` varchar(36) NOT NULL,
  `user_id` int(10) unsigned NOT NULL,
  `message` text NOT NULL,
  `type` enum('info','success','warning','error') NOT NULL DEFAULT 'info',
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` date NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_notif_user` (`user_id`),
  KEY `idx_notif_read` (`is_read`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Data for the table `notifications` */

insert  into `notifications`(`id`,`user_id`,`message`,`type`,`is_read`,`created_at`) values ('062415b2-9f9e-11f1-ad6a-9c23d8d39a88',1,'Registration for Kevin D Esto approved. Account created with username \"kevin.esto\".','success',0,'2026-08-24'),('3d043a90-9f9a-11f1-ad6a-9c23d8d39a88',3,'Your rental has been completed. Thank you!','success',0,'2026-08-24'),('419bcdc8-9f9b-11f1-ad6a-9c23d8d39a88',3,'Your reservation has been submitted and is pending review.','info',0,'2026-08-24'),('42785418-9fa0-11f1-ad6a-9c23d8d39a88',1,'New registration request from Junryl Gunting.','info',0,'2026-08-24'),('4a01a0c5-9f93-11f1-ad6a-9c23d8d39a88',1,'New registration request from Jeffrey Peresores.','info',0,'2026-08-24'),('4f8fb278-9f9b-11f1-ad6a-9c23d8d39a88',3,'Your reservation for Honda City has been approved!','success',0,'2026-08-24'),('58b40584-9fa3-11f1-ad6a-9c23d8d39a88',4,'Your reservation has been submitted and is pending review.','info',0,'2026-08-24'),('69211b9f-9f93-11f1-ad6a-9c23d8d39a88',1,'Registration for Jeffrey Filliar Peresores approved. Account created with username \"jeff\".','success',0,'2026-08-24'),('6d0a5a18-9f9d-11f1-ad6a-9c23d8d39a88',1,'New registration request from Kevin Esto.','info',0,'2026-08-24'),('76f5a001-9fa3-11f1-ad6a-9c23d8d39a88',4,'Your reservation for Ford Ranger has been approved!','success',0,'2026-08-24'),('8d5b4427-9fa3-11f1-ad6a-9c23d8d39a88',4,'Vehicle released! Your rental is now active.','success',0,'2026-08-24'),('96b2a6e5-9f9c-11f1-ad6a-9c23d8d39a88',3,'Vehicle released! Your rental is now active.','success',0,'2026-08-24'),('d31b51b6-9f98-11f1-ad6a-9c23d8d39a88',3,'Your reservation has been submitted and is pending review.','info',0,'2026-08-24'),('dca250d4-9fa1-11f1-ad6a-9c23d8d39a88',1,'Registration for Kamada S Tanjiro approved. Account created with username \"kamada.tanjiro\".','success',0,'2026-08-24'),('dd64c293-9fa3-11f1-ad6a-9c23d8d39a88',1,'Registration for Junryl B Gunting approved. Account created with username \"junryl.gunting\".','success',0,'2026-08-24'),('e0b20663-9f98-11f1-ad6a-9c23d8d39a88',3,'Your reservation for Ford Ranger has been approved!','success',0,'2026-08-24'),('e520caf3-9f98-11f1-ad6a-9c23d8d39a88',3,'Vehicle released! Your rental is now active.','success',0,'2026-08-24'),('f224da0a-9fa0-11f1-ad6a-9c23d8d39a88',1,'New registration request from Kamada Tanjiro.','info',0,'2026-08-24'),('fff2a7d4-9fa3-11f1-ad6a-9c23d8d39a88',6,'Your reservation has been submitted and is pending review.','info',0,'2026-08-24');

/*Table structure for table `registration_requests` */

DROP TABLE IF EXISTS `registration_requests`;

CREATE TABLE `registration_requests` (
  `id` varchar(36) NOT NULL,
  `last_name` varchar(80) NOT NULL,
  `first_name` varchar(80) NOT NULL,
  `middle_name` varchar(80) DEFAULT NULL,
  `gender` varchar(30) NOT NULL,
  `contact_number` varchar(30) NOT NULL,
  `address` varchar(300) NOT NULL,
  `date_of_birth` date NOT NULL,
  `civil_status` varchar(30) NOT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `rejection_reason` varchar(500) DEFAULT NULL,
  `approved_user_id` int(10) unsigned DEFAULT NULL,
  `submitted_at` date NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_reg_status` (`status`),
  KEY `approved_user_id` (`approved_user_id`),
  CONSTRAINT `registration_requests_ibfk_1` FOREIGN KEY (`approved_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Data for the table `registration_requests` */

insert  into `registration_requests`(`id`,`last_name`,`first_name`,`middle_name`,`gender`,`contact_number`,`address`,`date_of_birth`,`civil_status`,`status`,`rejection_reason`,`approved_user_id`,`submitted_at`) values ('42762148-9fa0-11f1-ad6a-9c23d8d39a88','Gunting','Junryl','B','Male','09534568527','Kantujok, Katipunan, Bohol','2000-11-02','Married','approved',NULL,6,'2026-08-24'),('49ffd17e-9f93-11f1-ad6a-9c23d8d39a88','Peresores','Jeffrey','Filliar','Male','09292275743','Purok 4, Poblacion, San Miguel, Bohol','2003-10-01','Single','approved',NULL,3,'2026-08-24'),('6d0785da-9f9d-11f1-ad6a-9c23d8d39a88','Esto','Kevins','D','Male','09223471741','Bien Unido, Bohol','1997-10-16','Single','approved',NULL,4,'2026-08-24'),('f2225b8b-9fa0-11f1-ad6a-9c23d8d39a88','Tanjiro','Kamada','S','Male','09853258741','Langit','2026-08-24','Single','approved',NULL,5,'2026-08-24');

/*Table structure for table `rentals` */

DROP TABLE IF EXISTS `rentals`;

CREATE TABLE `rentals` (
  `id` varchar(36) NOT NULL,
  `reservation_id` varchar(36) NOT NULL,
  `staff_id` int(10) unsigned DEFAULT NULL,
  `release_date` date NOT NULL,
  `expected_return_date` date NOT NULL,
  `actual_return_date` date DEFAULT NULL,
  `status` enum('Active','Completed','Overdue') NOT NULL DEFAULT 'Active',
  `balance` enum('Fully Paid') NOT NULL DEFAULT 'Fully Paid',
  `remarks` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `reservation_id` (`reservation_id`),
  KEY `idx_rentals_status` (`status`),
  KEY `staff_id` (`staff_id`),
  CONSTRAINT `rentals_ibfk_1` FOREIGN KEY (`reservation_id`) REFERENCES `reservations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `rentals_ibfk_2` FOREIGN KEY (`staff_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Data for the table `rentals` */

insert  into `rentals`(`id`,`reservation_id`,`staff_id`,`release_date`,`expected_return_date`,`actual_return_date`,`status`,`balance`,`remarks`) values ('8d5b3cef-9fa3-11f1-ad6a-9c23d8d39a88','58ae1919-9fa3-11f1-ad6a-9c23d8d39a88',2,'2026-08-24','2026-08-31',NULL,'Active','Fully Paid',''),('96b23767-9f9c-11f1-ad6a-9c23d8d39a88','4197909e-9f9b-11f1-ad6a-9c23d8d39a88',2,'2026-08-24','2026-08-25',NULL,'Active','Fully Paid',''),('e520adcd-9f98-11f1-ad6a-9c23d8d39a88','d3171d64-9f98-11f1-ad6a-9c23d8d39a88',2,'2026-08-24','2026-08-25','2026-08-24','Completed','Fully Paid','');

/*Table structure for table `reservations` */

DROP TABLE IF EXISTS `reservations`;

CREATE TABLE `reservations` (
  `id` varchar(36) NOT NULL,
  `customer_id` int(10) unsigned DEFAULT NULL,
  `vehicle_id` varchar(36) NOT NULL,
  `pickup_date` date NOT NULL,
  `pickup_time` time NOT NULL,
  `return_date` date NOT NULL,
  `return_time` time NOT NULL,
  `pickup_location` varchar(200) NOT NULL,
  `return_location` varchar(200) NOT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `status` enum('Pending','Approved','Reserved','Rejected','Cancelled','No-Show','Completed') NOT NULL DEFAULT 'Pending',
  `label` enum('In Process','In Use','Returned') NOT NULL DEFAULT 'In Process',
  `grace_period_minutes` smallint(6) NOT NULL DEFAULT '30',
  `actual_pickup_time` datetime DEFAULT NULL,
  `no_show_at` datetime DEFAULT NULL,
  `no_show_reason` varchar(500) DEFAULT NULL,
  `remarks` text,
  `created_at` date NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_res_customer` (`customer_id`),
  KEY `idx_res_vehicle` (`vehicle_id`),
  KEY `idx_res_status` (`status`),
  KEY `idx_res_pickup` (`pickup_date`),
  CONSTRAINT `reservations_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reservations_ibfk_2` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Data for the table `reservations` */

insert  into `reservations`(`id`,`customer_id`,`vehicle_id`,`pickup_date`,`pickup_time`,`return_date`,`return_time`,`pickup_location`,`return_location`,`total_amount`,`status`,`label`,`grace_period_minutes`,`actual_pickup_time`,`no_show_at`,`no_show_reason`,`remarks`,`created_at`) values ('4197909e-9f9b-11f1-ad6a-9c23d8d39a88',3,'seed-vehicle-004','2026-08-24','09:00:00','2026-08-25','09:00:00','Makati Office','Makati Office','1600.00','Completed','In Use',120,'2026-08-24 09:17:00',NULL,NULL,'','2026-08-24'),('58ae1919-9fa3-11f1-ad6a-9c23d8d39a88',4,'seed-vehicle-005','2026-08-24','09:00:00','2026-08-31','09:00:00','Makati Office','Makati Office','22400.00','Completed','In Use',120,'2026-08-24 10:06:00',NULL,NULL,'abang ko','2026-08-24'),('d3171d64-9f98-11f1-ad6a-9c23d8d39a88',3,'seed-vehicle-005','2026-08-24','09:00:00','2026-08-25','09:00:00','Makati Office','Makati Office','3200.00','Completed','Returned',120,'2026-08-24 08:50:00',NULL,NULL,'','2026-08-24'),('fff0887f-9fa3-11f1-ad6a-9c23d8d39a88',6,'seed-vehicle-007','2026-08-24','09:00:00','2026-08-31','09:00:00','Makati Office','Makati Office','6300.00','Pending','In Process',120,NULL,NULL,NULL,'buang','2026-08-24');

/*Table structure for table `users` */

DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL,
  `full_name` varchar(150) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','staff','customer') NOT NULL DEFAULT 'customer',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_username` (`username`),
  KEY `idx_users_role` (`role`),
  KEY `idx_users_is_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=latin1;

/*Data for the table `users` */

insert  into `users`(`id`,`username`,`full_name`,`password`,`role`,`is_active`,`created_at`,`updated_at`) values (1,'admin','Admin User','$2b$10$WEh74uhiThXFi8FTNaKQpOZuvlakqWOxbnfEyX9frwTcbpqd9lok.','admin',1,'2026-08-24 12:45:03','2026-08-24 12:45:03'),(2,'james','James Ronolo','$2b$10$zdhvkBGEgWntqi7LF2XIH.8nTOWKJZ.wHCUIcM6DorlXFVPEP1oVO','staff',1,'2026-08-24 16:08:21','2026-08-24 16:08:21'),(3,'jeff','Jeffrey Filliar Peresores','$2b$10$qONlMhk/VC6B9WBDyr9bJu1PhTXyRKLL//AHvhQiSghmvxemgXPwy','customer',1,'2026-08-24 16:11:22','2026-08-24 16:11:22'),(4,'kevin.esto','Kevins D Esto','$2b$10$XSAb02iOx3LXv1wZndZ2..h0UQ6dEkOCEpyvqBfylzcidKRTBapjq','customer',1,'2026-08-24 17:27:20','2026-08-24 17:27:47'),(5,'kamada.tanjiro','Kamada S Tanjiro','$2b$10$8l.t/t97sUkfXoSPbxk2jejVZKeIgbqK83RjMFZfEYdSk5PpxwgBO','customer',1,'2026-08-24 17:54:48','2026-08-24 17:54:48'),(6,'junryl.gunting','Junryl B Gunting','$2b$10$Nc4f9ELbsp33jhNpB0Tipuk4il4C5ZFILAn2EL1Fbk205CKxyyn62','customer',1,'2026-08-24 18:09:09','2026-08-24 18:09:09');

/*Table structure for table `vehicles` */

DROP TABLE IF EXISTS `vehicles`;

CREATE TABLE `vehicles` (
  `id` varchar(36) NOT NULL,
  `name` varchar(150) NOT NULL,
  `brand` varchar(80) NOT NULL,
  `model` varchar(80) NOT NULL,
  `year` smallint(6) NOT NULL,
  `type` enum('Sedan','SUV','MPV','Van','Pickup Truck','Motorcycle') NOT NULL,
  `license_plate` varchar(30) NOT NULL,
  `seats` tinyint(4) NOT NULL,
  `transmission` enum('Automatic','Manual') NOT NULL,
  `fuel_type` enum('Gasoline','Diesel','Electric','Hybrid') NOT NULL,
  `price_per_day` decimal(10,2) NOT NULL,
  `description` text,
  `image` varchar(500) DEFAULT NULL,
  `status` enum('Available','Reserved','Rented','Maintenance','Unavailable') NOT NULL DEFAULT 'Available',
  `created_at` date NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `license_plate` (`license_plate`),
  KEY `idx_vehicles_status` (`status`),
  KEY `idx_vehicles_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Data for the table `vehicles` */

/*Table structure for table `billings` */

DROP TABLE IF EXISTS `billings`;

CREATE TABLE `billings` (
    `id` varchar(36) NOT NULL,
    `reservation_id` varchar(36) NOT NULL,
    `customer_id` int(10) unsigned NOT NULL,
    `total_amount` decimal(10,2) NOT NULL,
    `status` enum('Unpaid','Paid') NOT NULL DEFAULT 'Unpaid',
    `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`), UNIQUE KEY `reservation_id` (`reservation_id`), KEY `idx_billings_customer` (`customer_id`),
    CONSTRAINT `billings_ibfk_1` FOREIGN KEY (`reservation_id`) REFERENCES `reservations` (`id`) ON DELETE CASCADE,
    CONSTRAINT `billings_ibfk_2` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `payments` */

DROP TABLE IF EXISTS `payments`;

CREATE TABLE `payments` (
    `id` varchar(36) NOT NULL,
    `billing_id` varchar(36) NOT NULL,
    `customer_id` int(10) unsigned NOT NULL,
    `amount` decimal(10,2) NOT NULL,
    `change_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
    `payment_method` varchar(30) NOT NULL DEFAULT 'Cash',
    `paid_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`), KEY `idx_payments_customer` (`customer_id`),
    CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`billing_id`) REFERENCES `billings` (`id`) ON DELETE CASCADE,
    CONSTRAINT `payments_ibfk_2` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

insert  into `vehicles`(`id`,`name`,`brand`,`model`,`year`,`type`,`license_plate`,`seats`,`transmission`,`fuel_type`,`price_per_day`,`description`,`image`,`status`,`created_at`) values ('seed-vehicle-001','Toyota Vios','Toyota','Vios 1.3 XLE',2024,'Sedan','AUT-1001',5,'Automatic','Gasoline','1800.00','Reliable and fuel-efficient sedan for city trips and everyday travel.','https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1200&q=80','Available','2026-08-24'),('seed-vehicle-002','Toyota Fortuner','Toyota','Fortuner 2.4 V',2023,'SUV','AUT-1002',7,'Automatic','Diesel','3500.00','Spacious SUV with comfortable seating for family trips and long drives.','https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=1200&q=80','Available','2026-08-24'),('seed-vehicle-003','Mitsubishi Xpander','Mitsubishi','Xpander GLS',2024,'MPV','AUT-1003',7,'Automatic','Gasoline','2800.00','Flexible seven-seat MPV with generous room for passengers and luggage.','https://images.unsplash.com/photo-1605559424843-9e4c228bf1c4?auto=format&fit=crop&w=1200&q=80','Available','2026-08-24'),('seed-vehicle-004','Honda City','Honda','City S',2023,'Sedan','AUT-1004',5,'Manual','Gasoline','1600.00','Comfortable compact sedan that is easy to drive and economical to run.','https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=1200&q=80','Rented','2026-08-24'),('seed-vehicle-005','Ford Ranger','Ford','Ranger XLS',2022,'Pickup Truck','AUT-1005',5,'Automatic','Diesel','3200.00','Capable pickup truck for work, cargo, and weekend adventures.','https://images.unsplash.com/photo-1551830820-330a71b99659?auto=format&fit=crop&w=1200&q=80','Rented','2026-08-24'),('seed-vehicle-006','Toyota HiAce','Toyota','HiAce Commuter',2023,'Van','AUT-1006',12,'Manual','Diesel','4500.00','Practical commuter van for group transportation and special occasions.','https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80','Available','2026-08-24'),('seed-vehicle-007','Honda Click 160','Honda','Click 160',2024,'Motorcycle','AUT-1007',2,'Automatic','Gasoline','900.00','Agile and economical scooter for convenient city travel.','https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1200&q=80','Available','2026-08-24'),('seed-vehicle-008','Suzuki Raider R150','Suzuki','Raider R150',2023,'Motorcycle','AUT-1008',2,'Manual','Gasoline','750.00','Lightweight manual underbone motorcycle with responsive performance.','https://images.unsplash.com/photo-1558981285-6f0c94958bb6?auto=format&fit=crop&w=1200&q=80','Available','2026-08-24'),('seed-vehicle-009','Kawasaki Z900','Kawasaki','Z900',2024,'Motorcycle','AUT-1009',2,'Manual','Gasoline','2800.00','Powerful naked big bike for confident riders and open-road trips.','https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1200&q=80','Available','2026-08-24'),('seed-vehicle-010','Yamaha MT-07','Yamaha','MT-07',2023,'Motorcycle','AUT-1010',2,'Manual','Gasoline','2400.00','Compact and versatile manual big bike with an engaging ride.','https://images.unsplash.com/photo-1558980664-10ea8c0b8a3c?auto=format&fit=crop&w=1200&q=80','Available','2026-08-24');

/* Procedure structure for procedure `sp_approve_registration` */

/*!50003 DROP PROCEDURE IF EXISTS  `sp_approve_registration` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`vr`@`localhost` PROCEDURE `sp_approve_registration`(

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

END */$$
DELIMITER ;

/* Procedure structure for procedure `sp_create_damage_report` */

/*!50003 DROP PROCEDURE IF EXISTS  `sp_create_damage_report` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`vr`@`localhost` PROCEDURE `sp_create_damage_report`(

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

END */$$
DELIMITER ;

/* Procedure structure for procedure `sp_create_maintenance` */

/*!50003 DROP PROCEDURE IF EXISTS  `sp_create_maintenance` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`vr`@`localhost` PROCEDURE `sp_create_maintenance`(

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

END */$$
DELIMITER ;

/* Procedure structure for procedure `sp_create_notification` */

/*!50003 DROP PROCEDURE IF EXISTS  `sp_create_notification` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`vr`@`localhost` PROCEDURE `sp_create_notification`(

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

END */$$
DELIMITER ;

/* Procedure structure for procedure `sp_create_registration_request` */

/*!50003 DROP PROCEDURE IF EXISTS  `sp_create_registration_request` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`vr`@`localhost` PROCEDURE `sp_create_registration_request`(

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

END */$$
DELIMITER ;

/* Procedure structure for procedure `sp_create_rental` */

/*!50003 DROP PROCEDURE IF EXISTS  `sp_create_rental` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`vr`@`localhost` PROCEDURE `sp_create_rental`(

    IN p_reservation_id        VARCHAR(36),

    IN p_staff_id              VARCHAR(36),

    IN p_release_date          DATE,

    IN p_expected_return_date  DATE,

    IN p_remarks               TEXT

)
BEGIN

    DECLARE v_id VARCHAR(36);

    SET v_id = UUID();

    INSERT INTO rentals (id, reservation_id, staff_id, release_date, expected_return_date, balance, remarks)

    VALUES (v_id, p_reservation_id, p_staff_id, p_release_date, p_expected_return_date, 'Fully Paid', p_remarks);

    CALL sp_get_rental_by_id(v_id);

END */$$
DELIMITER ;

/* Procedure structure for procedure `sp_create_reservation` */

/*!50003 DROP PROCEDURE IF EXISTS  `sp_create_reservation` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`vr`@`localhost` PROCEDURE `sp_create_reservation`(

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

                              pickup_location, return_location, total_amount, grace_period_minutes, remarks, created_at)

    VALUES (v_id, p_customer_id, p_vehicle_id, p_pickup_date, p_pickup_time, p_return_date, p_return_time,

            p_pickup_location, p_return_location, p_total_amount, p_grace_period_mins, p_remarks, CURDATE());

    CALL sp_get_reservation_by_id(v_id);

END */$$
DELIMITER ;

/* Procedure structure for procedure `sp_create_user` */

/*!50003 DROP PROCEDURE IF EXISTS  `sp_create_user` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`vr`@`localhost` PROCEDURE `sp_create_user`(

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

END */$$
DELIMITER ;

/* Procedure structure for procedure `sp_create_vehicle` */

/*!50003 DROP PROCEDURE IF EXISTS  `sp_create_vehicle` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`vr`@`localhost` PROCEDURE `sp_create_vehicle`(

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

END */$$
DELIMITER ;

/* Procedure structure for procedure `sp_delete_user` */

/*!50003 DROP PROCEDURE IF EXISTS  `sp_delete_user` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`vr`@`localhost` PROCEDURE `sp_delete_user`(IN p_id INT)
BEGIN

    DELETE FROM users WHERE id = p_id;

    SELECT ROW_COUNT() AS affected;

END */$$
DELIMITER ;

/* Procedure structure for procedure `sp_delete_vehicle` */

/*!50003 DROP PROCEDURE IF EXISTS  `sp_delete_vehicle` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`vr`@`localhost` PROCEDURE `sp_delete_vehicle`(IN p_id VARCHAR(36))
BEGIN

    DELETE FROM vehicles WHERE id = p_id;

    SELECT ROW_COUNT() AS affected;

END */$$
DELIMITER ;

/* Procedure structure for procedure `sp_get_all_damage_reports` */

/*!50003 DROP PROCEDURE IF EXISTS  `sp_get_all_damage_reports` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`vr`@`localhost` PROCEDURE `sp_get_all_damage_reports`()
BEGIN

    SELECT id, rental_id, vehicle_id, reported_by, description, estimated_cost,

           DATE_FORMAT(created_at,'%Y-%m-%d') AS created_at

    FROM damage_reports ORDER BY created_at DESC;

END */$$
DELIMITER ;

/* Procedure structure for procedure `sp_get_all_billings` */

/*!50003 DROP PROCEDURE IF EXISTS `sp_get_all_billings` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`vr`@`localhost` PROCEDURE `sp_get_all_billings`()
BEGIN
    SELECT b.id, b.reservation_id, b.customer_id, b.total_amount, b.status,
           DATE_FORMAT(b.created_at, '%Y-%m-%d %H:%i:%s') AS created_at
    FROM billings b ORDER BY b.created_at DESC;
END */$$
DELIMITER ;

/* Procedure structure for procedure `sp_create_billing` */

/*!50003 DROP PROCEDURE IF EXISTS `sp_create_billing` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`vr`@`localhost` PROCEDURE `sp_create_billing`(
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
END */$$
DELIMITER ;

/* Procedure structure for procedure `sp_get_all_payments` */

/*!50003 DROP PROCEDURE IF EXISTS `sp_get_all_payments` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`vr`@`localhost` PROCEDURE `sp_get_all_payments`()
BEGIN
    SELECT id, billing_id, customer_id, amount, change_amount, payment_method,
           DATE_FORMAT(paid_at, '%Y-%m-%d %H:%i:%s') AS paid_at
    FROM payments ORDER BY paid_at DESC;
END */$$
DELIMITER ;

/* Procedure structure for procedure `sp_create_payment` */

/*!50003 DROP PROCEDURE IF EXISTS `sp_create_payment` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`vr`@`localhost` PROCEDURE `sp_create_payment`(
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
END */$$
DELIMITER ;

/* Procedure structure for procedure `sp_get_all_maintenance` */

/*!50003 DROP PROCEDURE IF EXISTS  `sp_get_all_maintenance` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`vr`@`localhost` PROCEDURE `sp_get_all_maintenance`()
BEGIN

    SELECT id, vehicle_id, reported_by, description,

           DATE_FORMAT(maintenance_date,'%Y-%m-%d') AS maintenance_date,

           cost, status

    FROM maintenance

    ORDER BY maintenance_date DESC;

END */$$
DELIMITER ;

/* Procedure structure for procedure `sp_get_all_registration_requests` */

/*!50003 DROP PROCEDURE IF EXISTS  `sp_get_all_registration_requests` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`vr`@`localhost` PROCEDURE `sp_get_all_registration_requests`()
BEGIN

    SELECT id, last_name, first_name, middle_name, gender, contact_number, address,

           DATE_FORMAT(date_of_birth,'%Y-%m-%d') AS date_of_birth,

           civil_status, status, rejection_reason, approved_user_id,

           DATE_FORMAT(submitted_at,'%Y-%m-%d') AS submitted_at

    FROM registration_requests

    ORDER BY submitted_at DESC;

END */$$
DELIMITER ;

/* Procedure structure for procedure `sp_get_all_rentals` */

/*!50003 DROP PROCEDURE IF EXISTS  `sp_get_all_rentals` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`vr`@`localhost` PROCEDURE `sp_get_all_rentals`()
BEGIN

    SELECT id, reservation_id, staff_id,

           DATE_FORMAT(release_date,'%Y-%m-%d')          AS release_date,

           DATE_FORMAT(expected_return_date,'%Y-%m-%d')  AS expected_return_date,

           DATE_FORMAT(actual_return_date,'%Y-%m-%d')    AS actual_return_date,

           status, balance, remarks

    FROM rentals

    ORDER BY release_date DESC;

END */$$
DELIMITER ;

/* Procedure structure for procedure `sp_get_all_reservations` */

/*!50003 DROP PROCEDURE IF EXISTS  `sp_get_all_reservations` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`vr`@`localhost` PROCEDURE `sp_get_all_reservations`()
BEGIN

    SELECT id, customer_id, vehicle_id,

           DATE_FORMAT(pickup_date,'%Y-%m-%d') AS pickup_date,

           TIME_FORMAT(pickup_time,'%H:%i')    AS pickup_time,

           DATE_FORMAT(return_date,'%Y-%m-%d') AS return_date,

           TIME_FORMAT(return_time,'%H:%i')    AS return_time,

           pickup_location, return_location, total_amount, status, label,

           grace_period_minutes, actual_pickup_time, no_show_at,

           no_show_reason, remarks,

           DATE_FORMAT(created_at,'%Y-%m-%d')  AS created_at

    FROM reservations

    ORDER BY created_at DESC;

END */$$
DELIMITER ;

/* Procedure structure for procedure `sp_get_all_users` */

/*!50003 DROP PROCEDURE IF EXISTS  `sp_get_all_users` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`vr`@`localhost` PROCEDURE `sp_get_all_users`()
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

END */$$
DELIMITER ;

/* Procedure structure for procedure `sp_get_all_vehicles` */

/*!50003 DROP PROCEDURE IF EXISTS  `sp_get_all_vehicles` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`vr`@`localhost` PROCEDURE `sp_get_all_vehicles`()
BEGIN

    SELECT id, name, brand, model, year, type, license_plate, seats, transmission,

           fuel_type, price_per_day, description, image, status,

           DATE_FORMAT(created_at,'%Y-%m-%d') AS created_at

    FROM vehicles

    ORDER BY created_at DESC;

END */$$
DELIMITER ;

/* Procedure structure for procedure `sp_get_maintenance_by_id` */

/*!50003 DROP PROCEDURE IF EXISTS  `sp_get_maintenance_by_id` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`vr`@`localhost` PROCEDURE `sp_get_maintenance_by_id`(IN p_id VARCHAR(36))
BEGIN

    SELECT id, vehicle_id, reported_by, description,

           DATE_FORMAT(maintenance_date,'%Y-%m-%d') AS maintenance_date,

           cost, status

    FROM maintenance WHERE id = p_id;

END */$$
DELIMITER ;

/* Procedure structure for procedure `sp_get_notifications_for_user` */

/*!50003 DROP PROCEDURE IF EXISTS  `sp_get_notifications_for_user` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`vr`@`localhost` PROCEDURE `sp_get_notifications_for_user`(IN p_user_id VARCHAR(36))
BEGIN

    SELECT id, user_id, message, type, is_read AS `read`,

           DATE_FORMAT(created_at,'%Y-%m-%d') AS created_at

    FROM notifications

    WHERE user_id = p_user_id

    ORDER BY created_at DESC;

END */$$
DELIMITER ;

/* Procedure structure for procedure `sp_get_rental_by_id` */

/*!50003 DROP PROCEDURE IF EXISTS  `sp_get_rental_by_id` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`vr`@`localhost` PROCEDURE `sp_get_rental_by_id`(IN p_id VARCHAR(36))
BEGIN

    SELECT id, reservation_id, staff_id,

           DATE_FORMAT(release_date,'%Y-%m-%d')          AS release_date,

           DATE_FORMAT(expected_return_date,'%Y-%m-%d')  AS expected_return_date,

           DATE_FORMAT(actual_return_date,'%Y-%m-%d')    AS actual_return_date,

           status, balance, remarks

    FROM rentals WHERE id = p_id;

END */$$
DELIMITER ;

/* Procedure structure for procedure `sp_get_reservation_by_id` */

/*!50003 DROP PROCEDURE IF EXISTS  `sp_get_reservation_by_id` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`vr`@`localhost` PROCEDURE `sp_get_reservation_by_id`(IN p_id VARCHAR(36))
BEGIN

    SELECT id, customer_id, vehicle_id,

           DATE_FORMAT(pickup_date,'%Y-%m-%d') AS pickup_date,

           TIME_FORMAT(pickup_time,'%H:%i')    AS pickup_time,

           DATE_FORMAT(return_date,'%Y-%m-%d') AS return_date,

           TIME_FORMAT(return_time,'%H:%i')    AS return_time,

           pickup_location, return_location, total_amount, status, label,

           grace_period_minutes, actual_pickup_time, no_show_at,

           no_show_reason, remarks,

           DATE_FORMAT(created_at,'%Y-%m-%d')  AS created_at

    FROM reservations WHERE id = p_id;

END */$$
DELIMITER ;

/* Procedure structure for procedure `sp_get_user_by_id` */

/*!50003 DROP PROCEDURE IF EXISTS  `sp_get_user_by_id` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`vr`@`localhost` PROCEDURE `sp_get_user_by_id`(IN p_id INT)
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

END */$$
DELIMITER ;

/* Procedure structure for procedure `sp_get_vehicle_by_id` */

/*!50003 DROP PROCEDURE IF EXISTS  `sp_get_vehicle_by_id` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`vr`@`localhost` PROCEDURE `sp_get_vehicle_by_id`(IN p_id VARCHAR(36))
BEGIN

    SELECT id, name, brand, model, year, type, license_plate, seats, transmission,

           fuel_type, price_per_day, description, image, status,

           DATE_FORMAT(created_at,'%Y-%m-%d') AS created_at

    FROM vehicles WHERE id = p_id;

END */$$
DELIMITER ;

/* Procedure structure for procedure `sp_login` */

/*!50003 DROP PROCEDURE IF EXISTS  `sp_login` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`vr`@`localhost` PROCEDURE `sp_login`(IN p_username VARCHAR(100))
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

END */$$
DELIMITER ;

/* Procedure structure for procedure `sp_mark_all_notifications_read` */

/*!50003 DROP PROCEDURE IF EXISTS  `sp_mark_all_notifications_read` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`vr`@`localhost` PROCEDURE `sp_mark_all_notifications_read`(IN p_user_id VARCHAR(36))
BEGIN

    UPDATE notifications SET is_read = 1 WHERE user_id = p_user_id;

    SELECT ROW_COUNT() AS affected;

END */$$
DELIMITER ;

/* Procedure structure for procedure `sp_mark_notification_read` */

/*!50003 DROP PROCEDURE IF EXISTS  `sp_mark_notification_read` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`vr`@`localhost` PROCEDURE `sp_mark_notification_read`(IN p_id VARCHAR(36))
BEGIN

    UPDATE notifications SET is_read = 1 WHERE id = p_id;

    SELECT ROW_COUNT() AS affected;

END */$$
DELIMITER ;

/* Procedure structure for procedure `sp_reject_registration` */

/*!50003 DROP PROCEDURE IF EXISTS  `sp_reject_registration` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`vr`@`localhost` PROCEDURE `sp_reject_registration`(

    IN p_reg_id VARCHAR(36),

    IN p_reason VARCHAR(500)

)
BEGIN

    UPDATE registration_requests

    SET status = 'rejected', rejection_reason = p_reason

    WHERE id = p_reg_id;

    SELECT ROW_COUNT() AS affected;

END */$$
DELIMITER ;

/* Procedure structure for procedure `sp_toggle_user_status` */

/*!50003 DROP PROCEDURE IF EXISTS  `sp_toggle_user_status` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`vr`@`localhost` PROCEDURE `sp_toggle_user_status`(IN p_id INT)
BEGIN

    UPDATE users

    SET is_active = IF(is_active = 1, 0, 1)

    WHERE id = p_id;

    CALL sp_get_user_by_id(p_id);

END */$$
DELIMITER ;

/* Procedure structure for procedure `sp_update_maintenance` */

/*!50003 DROP PROCEDURE IF EXISTS  `sp_update_maintenance` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`vr`@`localhost` PROCEDURE `sp_update_maintenance`(

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

END */$$
DELIMITER ;

/* Procedure structure for procedure `sp_update_rental` */

/*!50003 DROP PROCEDURE IF EXISTS  `sp_update_rental` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`vr`@`localhost` PROCEDURE `sp_update_rental`(

    IN p_id                 VARCHAR(36),

    IN p_actual_return_date DATE,

    IN p_status             VARCHAR(20),

    IN p_remarks            TEXT

)
BEGIN

    DECLARE v_reservation_id VARCHAR(36);

    SELECT reservation_id INTO v_reservation_id FROM rentals WHERE id = p_id;

    UPDATE rentals

    SET actual_return_date = COALESCE(p_actual_return_date, actual_return_date),

        status             = COALESCE(p_status,             status),

        remarks            = COALESCE(p_remarks,            remarks)

    WHERE id = p_id;

    IF p_status = 'Completed' THEN

        UPDATE reservations SET label = 'Returned' WHERE id = v_reservation_id;

    END IF;

    CALL sp_get_rental_by_id(p_id);

END */$$
DELIMITER ;

/* Procedure structure for procedure `sp_update_reservation` */

/*!50003 DROP PROCEDURE IF EXISTS  `sp_update_reservation` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`vr`@`localhost` PROCEDURE `sp_update_reservation`(

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

END */$$
DELIMITER ;

/* Procedure structure for procedure `sp_update_reservation_status` */

/*!50003 DROP PROCEDURE IF EXISTS  `sp_update_reservation_status` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`vr`@`localhost` PROCEDURE `sp_update_reservation_status`(

    IN p_id     VARCHAR(36),

    IN p_status VARCHAR(30)

)
BEGIN

    UPDATE reservations

    SET status = p_status,

        label = CASE

            WHEN p_status IN ('Pending', 'Approved', 'Reserved') THEN 'In Process'

            WHEN p_status IN ('Rejected', 'Cancelled', 'No-Show') THEN 'Returned'

            ELSE label

        END

    WHERE id = p_id;

    CALL sp_get_reservation_by_id(p_id);

END */$$
DELIMITER ;

/* Procedure structure for procedure `sp_update_user` */

/*!50003 DROP PROCEDURE IF EXISTS  `sp_update_user` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`vr`@`localhost` PROCEDURE `sp_update_user`(

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

END */$$
DELIMITER ;

/* Procedure structure for procedure `sp_update_vehicle` */

/*!50003 DROP PROCEDURE IF EXISTS  `sp_update_vehicle` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`vr`@`localhost` PROCEDURE `sp_update_vehicle`(

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

END */$$
DELIMITER ;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
