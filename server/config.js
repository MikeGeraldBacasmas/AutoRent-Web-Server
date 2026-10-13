import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Always load <project root>/.env regardless of the process working directory.
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

function required(name) {
  const value = process.env[name];
  if (value === undefined || value === '') {
    throw new Error(
      `Missing required environment variable "${name}". Copy .env.example to .env and fill it in.`
    );
  }
  return value;
}

export const dbConfig = {
  host:     required('DB_HOST'),
  port:     Number(process.env.DB_PORT) || 3306,
  user:     required('DB_USER'),
  password: required('DB_PASSWORD'),
  database: required('DB_NAME'),
};

export const JWT_SECRET = required('JWT_SECRET');

export const SERVER_PORT = process.env.SERVER_PORT || 4000;

export const CLIENT_ORIGINS = (process.env.CLIENT_ORIGIN || 'http://localhost:8443')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

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
