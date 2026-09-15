import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(rootDir, '.env') });

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'vr',
  password: process.env.DB_PASSWORD || 'vr',
  database: process.env.DB_NAME || 'vr',
  multipleStatements: true,
};

async function main() {
  let connection;
  try {
    connection = await mysql.createConnection(config);
    console.log('Connected to MySQL. Running ALTER TABLE...');
    
    // Add columns to users if they don't exist
    const [userCols] = await connection.query(`SHOW COLUMNS FROM users LIKE 'license_number'`);
    if (userCols.length === 0) {
      await connection.query(`
        ALTER TABLE users 
        ADD COLUMN license_number VARCHAR(50) NULL,
        ADD COLUMN license_type ENUM('Non-Professional','Professional','Student Permit') NULL,
        ADD COLUMN license_expiry DATE NULL,
        ADD COLUMN license_restriction_codes VARCHAR(100) NULL,
        ADD COLUMN license_front_url VARCHAR(500) NULL,
        ADD COLUMN license_back_url VARCHAR(500) NULL
      `);
      console.log('Added license columns to users table.');
    } else {
      console.log('License columns already exist in users table.');
    }

    // Add columns to registration_requests if they don't exist
    const [regCols] = await connection.query(`SHOW COLUMNS FROM registration_requests LIKE 'license_number'`);
    if (regCols.length === 0) {
      await connection.query(`
        ALTER TABLE registration_requests 
        ADD COLUMN license_number VARCHAR(50) NULL,
        ADD COLUMN license_type ENUM('Non-Professional','Professional','Student Permit') NULL,
        ADD COLUMN license_expiry DATE NULL,
        ADD COLUMN license_restriction_codes VARCHAR(100) NULL,
        ADD COLUMN license_front_url VARCHAR(500) NULL,
        ADD COLUMN license_back_url VARCHAR(500) NULL
      `);
      console.log('Added license columns to registration_requests table.');
    } else {
      console.log('License columns already exist in registration_requests table.');
    }

    console.log('Done altering tables. Now running setup-db to update procedures...');
  } catch (err) {
    console.error('Error during migration:', err);
  } finally {
    if (connection) await connection.end();
  }
}

main();
