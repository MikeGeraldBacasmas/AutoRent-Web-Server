import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     Number(process.env.DB_PORT) || 3306,
  user:     process.env.DB_USER     || 'vr',
  password: process.env.DB_PASSWORD || 'vr',
  database: process.env.DB_NAME     || 'vr',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
});

export default pool;

/** Execute a stored procedure and return the first result-set rows. */
export async function callProc(name, params = []) {
  const placeholders = params.map(() => '?').join(', ');
  const sql = `CALL ${name}(${placeholders})`;
  const [results] = await pool.execute(sql, params);
  return results[0]; // first result set
}
