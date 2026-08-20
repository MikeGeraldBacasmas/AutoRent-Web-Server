import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(rootDir, '.env') });

async function cleanDb() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'vr',
    password: process.env.DB_PASSWORD || 'vr',
    database: process.env.DB_NAME || 'vr',
    multipleStatements: true,
  });

  console.log('Cleaning mockup data from MySQL database...');
  await pool.query('SET FOREIGN_KEY_CHECKS = 0;');
  await pool.query('TRUNCATE TABLE damage_reports;');
  await pool.query('TRUNCATE TABLE maintenance;');
  await pool.query('TRUNCATE TABLE notifications;');
  await pool.query('TRUNCATE TABLE rentals;');
  await pool.query('TRUNCATE TABLE reservations;');
  await pool.query('TRUNCATE TABLE registration_requests;');
  await pool.query('TRUNCATE TABLE vehicles;');
  await pool.query('TRUNCATE TABLE users;');
  await pool.query('SET FOREIGN_KEY_CHECKS = 1;');

  // Insert default administrator account with bcrypt hashed password
  const adminHashedPassword = await bcrypt.hash('admin123', 10);
  const insertAdminSql = `
    INSERT INTO users (id, username, full_name, password, role, is_active)
    VALUES (1, 'admin', 'Admin User', ?, 'admin', 1)
    ON DUPLICATE KEY UPDATE password = VALUES(password);
  `;
  await pool.query(insertAdminSql, [adminHashedPassword]);

  const [users] = await pool.query('SELECT id, username, full_name, password, role, is_active, created_at, updated_at FROM users;');
  const [vehicles] = await pool.query('SELECT count(*) as count FROM vehicles;');
  const [reservations] = await pool.query('SELECT count(*) as count FROM reservations;');
  const [rentals] = await pool.query('SELECT count(*) as count FROM rentals;');

  console.log('\n📊 Database Status:');
  console.log(' - Users:', users);
  console.log(' - Vehicles Count:', vehicles[0].count);
  console.log(' - Reservations Count:', reservations[0].count);
  console.log(' - Rentals Count:', rentals[0].count);

  await pool.end();
  console.log('\n✅ Database reset with new users table schema successfully!');
}

cleanDb().catch(err => {
  console.error('❌ Failed to clean database:', err);
  process.exit(1);
});
