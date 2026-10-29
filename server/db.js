import mysql from 'mysql2/promise';
import { dbConfig } from './config.js';
import { localCallProc, localQuery } from './localStore.js';

const primaryPool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  connectTimeout: 3500,
});

// Optional Local MySQL fallback pool (for XAMPP / WAMP / Local MySQL when running on laptop)
let localMysqlPool = null;
function getLocalMysqlPool() {
  if (process.env.VERCEL) return null;
  if (!localMysqlPool) {
    localMysqlPool = mysql.createPool({
      host: process.env.LOCAL_DB_HOST || '127.0.0.1',
      port: Number(process.env.LOCAL_DB_PORT) || 3306,
      user: process.env.LOCAL_DB_USER || 'root',
      password: process.env.LOCAL_DB_PASSWORD || '',
      database: process.env.LOCAL_DB_NAME || 'u463580331_vrent',
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
      connectTimeout: 1500,
    });
  }
  return localMysqlPool;
}

// Track active database tier so we don't repeatedly wait 3.5s when remote MySQL is unreachable
let activeTier = 'primary'; // 'primary' | 'local_mysql' | 'local_store'
let lastPrimaryFailureAt = 0;
const RETRY_PRIMARY_AFTER_MS = 60000; // Re-test primary remote MySQL every 60s

function isConnectionError(err) {
  if (!err) return false;
  const code = String(err.code || '');
  const msg = String(err.message || '');
  return (
    code === 'ETIMEDOUT' ||
    code === 'ECONNREFUSED' ||
    code === 'ENOTFOUND' ||
    code === 'EHOSTUNREACH' ||
    code === 'ECONNRESET' ||
    code === 'PROTOCOL_CONNECTION_LOST' ||
    code === 'ER_ACCESS_DENIED_ERROR' ||
    code === 'ER_DBACCESS_DENIED_ERROR' ||
    code === 'ER_BAD_DB_ERROR' ||
    msg.includes('ETIMEDOUT') ||
    msg.includes('ECONNREFUSED') ||
    msg.includes('ENOTFOUND') ||
    msg.includes('Access denied')
  );
}

function shouldTryPrimary() {
  if (activeTier === 'primary') return true;
  if (Date.now() - lastPrimaryFailureAt > RETRY_PRIMARY_AFTER_MS) {
    return true;
  }
  return false;
}

const pool = {
  async query(sql, params = []) {
    if (shouldTryPrimary()) {
      try {
        const res = await primaryPool.query(sql, params);
        activeTier = 'primary';
        return res;
      } catch (err) {
        if (!isConnectionError(err)) throw err;
        lastPrimaryFailureAt = Date.now();
        console.warn(`[AutoRent DB] Remote MySQL (${dbConfig.host}) unreachable (${err.code || err.message}). Activating fallback...`);
      }
    }

    if (activeTier !== 'local_store' && !process.env.VERCEL) {
      const lPool = getLocalMysqlPool();
      if (lPool) {
        try {
          const res = await lPool.query(sql, params);
          activeTier = 'local_mysql';
          return res;
        } catch (localErr) {
          if (!isConnectionError(localErr)) throw localErr;
        }
      }
    }

    activeTier = 'local_store';
    return localQuery(sql, params);
  },

  async execute(sql, params = []) {
    return this.query(sql, params);
  },

  async end() {
    try {
      await primaryPool.end();
    } catch {}
    if (localMysqlPool) {
      try {
        await localMysqlPool.end();
      } catch {}
    }
  },
};

export default pool;

/** Execute a stored procedure and return the first result-set rows. */
export async function callProc(name, params = []) {
  const placeholders = params.map(() => '?').join(', ');
  const sql = `CALL ${name}(${placeholders})`;

  if (shouldTryPrimary()) {
    try {
      const [results] = await primaryPool.execute(sql, params);
      activeTier = 'primary';
      return results[0];
    } catch (err) {
      if (!isConnectionError(err)) throw err;
      lastPrimaryFailureAt = Date.now();
      console.warn(`[AutoRent DB] Remote MySQL (${dbConfig.host}) failed on ${name} (${err.code || err.message}). Falling back...`);
    }
  }

  if (activeTier !== 'local_store' && !process.env.VERCEL) {
    const lPool = getLocalMysqlPool();
    if (lPool) {
      try {
        const [results] = await lPool.execute(sql, params);
        activeTier = 'local_mysql';
        return results[0];
      } catch (localErr) {
        if (!isConnectionError(localErr)) throw localErr;
      }
    }
  }

  activeTier = 'local_store';
  return localCallProc(name, params);
}
