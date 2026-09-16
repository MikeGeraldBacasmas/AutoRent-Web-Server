-- ============================================================
-- RentRide Initial Seed Data
-- ============================================================
USE vr;

-- Default Administrator Account (password 'admin123' stored as bcrypt hash)
INSERT INTO users (id, username, full_name, password, role, is_active) VALUES
(1, 'admin', 'Admin User', '$2b$10$WEh74uhiThXFi8FTNaKQpOZuvlakqWOxbnfEyX9frwTcbpqd9lok.', 'admin', 1)
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), password = VALUES(password);

-- Sample fleet for public browsing and reservation testing
INSERT INTO vehicles
	(id, name, brand, model, year, type, license_plate, seats, transmission,
	 fuel_type, price_per_day, description, image, status, created_at)
VALUES
	('seed-vehicle-001', 'Toyota Vios', 'Toyota', 'Vios 1.3 XLE', 2024, 'Sedan', 'AUT-1001', 5, 'Automatic',
	 'Gasoline', 1800.00, 'Reliable and fuel-efficient sedan for city trips and everyday travel.',
	 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1200&q=80', 'Available', CURDATE()),
	('seed-vehicle-002', 'Toyota Fortuner', 'Toyota', 'Fortuner 2.4 V', 2023, 'SUV', 'AUT-1002', 7, 'Automatic',
	 'Diesel', 3500.00, 'Spacious SUV with comfortable seating for family trips and long drives.',
	'https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=1200&q=80', 'Available', CURDATE()),
	('seed-vehicle-003', 'Mitsubishi Xpander', 'Mitsubishi', 'Xpander GLS', 2024, 'MPV', 'AUT-1003', 7, 'Automatic',
	 'Gasoline', 2800.00, 'Flexible seven-seat MPV with generous room for passengers and luggage.',
	 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c4?auto=format&fit=crop&w=1200&q=80', 'Available', CURDATE()),
	('seed-vehicle-004', 'Honda City', 'Honda', 'City S', 2023, 'Sedan', 'AUT-1004', 5, 'Manual',
	 'Gasoline', 1600.00, 'Comfortable compact sedan that is easy to drive and economical to run.',
	 'https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=1200&q=80', 'Available', CURDATE()),
	('seed-vehicle-005', 'Ford Ranger', 'Ford', 'Ranger XLS', 2022, 'Pickup Truck', 'AUT-1005', 5, 'Automatic',
	 'Diesel', 3200.00, 'Capable pickup truck for work, cargo, and weekend adventures.',
	 'https://images.unsplash.com/photo-1551830820-330a71b99659?auto=format&fit=crop&w=1200&q=80', 'Available', CURDATE()),
	('seed-vehicle-006', 'Toyota HiAce', 'Toyota', 'HiAce Commuter', 2023, 'Van', 'AUT-1006', 12, 'Manual',
	 'Diesel', 4500.00, 'Practical commuter van for group transportation and special occasions.',
	 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80', 'Available', CURDATE()),
	('seed-vehicle-007', 'Honda Click 160', 'Honda', 'Click 160', 2024, 'Motorcycle', 'AUT-1007', 2, 'Automatic',
	 'Gasoline', 900.00, 'Agile and economical scooter for convenient city travel.',
	 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1200&q=80', 'Available', CURDATE()),
	('seed-vehicle-008', 'Suzuki Raider R150', 'Suzuki', 'Raider R150', 2023, 'Motorcycle', 'AUT-1008', 2, 'Manual',
	 'Gasoline', 750.00, 'Lightweight manual underbone motorcycle with responsive performance.',
	 'https://images.unsplash.com/photo-1558981285-6f0c94958bb6?auto=format&fit=crop&w=1200&q=80', 'Available', CURDATE()),
	('seed-vehicle-009', 'Kawasaki Z900', 'Kawasaki', 'Z900', 2024, 'Motorcycle', 'AUT-1009', 2, 'Manual',
	 'Gasoline', 2800.00, 'Powerful naked big bike for confident riders and open-road trips.',
	 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1200&q=80', 'Available', CURDATE()),
	('seed-vehicle-010', 'Yamaha MT-07', 'Yamaha', 'MT-07', 2023, 'Motorcycle', 'AUT-1010', 2, 'Manual',
	 'Gasoline', 2400.00, 'Compact and versatile manual big bike with an engaging ride.',
	 'https://images.unsplash.com/photo-1558980664-10ea8c0b8a3c?auto=format&fit=crop&w=1200&q=80', 'Available', CURDATE())
ON DUPLICATE KEY UPDATE
	name = VALUES(name), brand = VALUES(brand), model = VALUES(model), year = VALUES(year),
	type = VALUES(type), license_plate = VALUES(license_plate), seats = VALUES(seats),
	transmission = VALUES(transmission), fuel_type = VALUES(fuel_type), price_per_day = VALUES(price_per_day),
	description = VALUES(description), image = VALUES(image), status = VALUES(status);

-- Initial Maintenance Records
INSERT INTO maintenance
	(id, vehicle_id, reported_by, description, maintenance_date, cost, status)
VALUES
	('seed-maint-001', 'seed-vehicle-004', 'James Ronolo', 'Brake pad replacement and 20,000 km PMS service', CURDATE(), 3500.00, 'In Progress'),
	('seed-maint-002', 'seed-vehicle-005', 'James Ronolo', 'Transmission fluid flush and suspension bushing check', CURDATE(), 5800.00, 'Pending'),
	('seed-maint-003', 'seed-vehicle-007', 'James Ronolo', 'CVT drive belt maintenance and tire replacement', CURDATE(), 1450.00, 'In Progress')
ON DUPLICATE KEY UPDATE
	vehicle_id = VALUES(vehicle_id), reported_by = VALUES(reported_by),
	description = VALUES(description), maintenance_date = VALUES(maintenance_date),
	cost = VALUES(cost), status = VALUES(status);

