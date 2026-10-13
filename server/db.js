import mysql from 'mysql2/promise';
import { dbConfig } from './config.js';

const pool = mysql.createPool({
  ...dbConfig,
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
