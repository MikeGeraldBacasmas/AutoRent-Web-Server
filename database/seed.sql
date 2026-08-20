-- ============================================================
-- AutoRent Initial Seed Data
-- ============================================================
USE vr;

-- Default Administrator Account (password 'admin123' stored as bcrypt hash)
INSERT INTO users (id, username, full_name, password, role, is_active) VALUES
(1, 'admin', 'Admin User', '$2b$10$WEh74uhiThXFi8FTNaKQpOZuvlakqWOxbnfEyX9frwTcbpqd9lok.', 'admin', 1)
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), password = VALUES(password);
