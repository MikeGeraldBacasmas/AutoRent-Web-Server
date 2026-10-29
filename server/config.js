import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Always load <project root>/.env regardless of the process working directory.
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

function envOrDefault(name, fallbackValue) {
  const value = process.env[name];
  if (value !== undefined && String(value).trim() !== '') {
    return value;
  }
  return fallbackValue;
}

export const dbConfig = {
  host:     envOrDefault('DB_HOST', '195.35.61.31'),
  port:     Number(process.env.DB_PORT) || 3306,
  user:     envOrDefault('DB_USER', 'u463580331_rr'),
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'RentRide123',
  database: envOrDefault('DB_NAME', 'u463580331_rr'),
  ...(process.env.DB_SSL === 'true' ? { ssl: { rejectUnauthorized: false } } : {}),
};

export const JWT_SECRET = envOrDefault(
  'JWT_SECRET',
  '38091c32816ea851add42e8d530cc7ac9bc746153c0c5cabbdb14a597e5949df0587ecc401b9aa7e065dcb201ab2cb1c'
);

// Vercel / Render / Local port
export const SERVER_PORT = Number(process.env.PORT || process.env.SERVER_PORT) || 4000;

const rawOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:8443,https://rentride.bscs4b.com';
export const CLIENT_ORIGINS = rawOrigin.trim() === '*'
  ? '*'
  : rawOrigin.split(',').map((o) => o.trim().replace(/\/+$/, '')).filter(Boolean);

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

/**
 * Guard for destructive maintenance scripts (setup/seed/truncate).
 * Refuses to touch a remote (live) database unless `--force` is passed.
 */
export function assertSafeToModify(scriptName) {
  if (LOCAL_HOSTS.has(dbConfig.host) || process.argv.includes('--force')) return;
  console.error(
    `Refusing to run ${scriptName} against remote database ${dbConfig.host}/${dbConfig.database}.\n` +
    'Re-run with --force if you really intend to modify the live database.'
  );
  process.exit(1);
}
