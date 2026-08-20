-- ============================================================
-- AutoRent Initial Seed Data
-- ============================================================
USE vr;

-- Default Administrator Account (password 'admin123' stored as bcrypt hash)
INSERT INTO users (id, username, full_name, password, role, is_active) VALUES
(1, 'admin', 'Admin User', '$2b$10$3I5vtf9m8hVUos3sQHFcIO6qXm9LUXV39x.yeTjQVL7MrBqVgGJ9m', 'admin', 1)
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), password = VALUES(password);
