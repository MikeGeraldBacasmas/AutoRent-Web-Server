import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import { dbConfig } from '../server/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function splitStatements(sql) {
  const statements = [];
  let current = '';
  let inString = false;
  let stringChar = '';
  let inComment = false;
  let commentType = '';

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    const nextChar = sql[i + 1] || '';

    if (inComment) {
      current += char;
      if (commentType === '/*' && char === '*' && nextChar === '/') {
        current += '/';
        i++;
        inComment = false;
      } else if (commentType === '--' && (char === '\n' || char === '\r')) {
        inComment = false;
      }
      continue;
    }

    if (inString) {
      current += char;
      if (char === '\\') {
        current += nextChar;
        i++;
      } else if (char === stringChar) {
        if (nextChar === stringChar) {
          current += nextChar;
          i++;
        } else {
          inString = false;
        }
      }
      continue;
    }

    if (char === '/' && nextChar === '*') {
      inComment = true;
      commentType = '/*';
      current += '/*';
      i++;
      continue;
    }
    if (char === '-' && nextChar === '-') {
      inComment = true;
      commentType = '--';
      current += '--';
      i++;
      continue;
    }

    if (char === "'" || char === '"' || char === '`') {
      inString = true;
      stringChar = char;
      current += char;
      continue;
    }

    if (char === ';') {
      const trimmed = current.trim();
      if (trimmed.length > 0) {
        statements.push(trimmed);
      }
      current = '';
      continue;
    }

    current += char;
  }

  const trimmed = current.trim();
  if (trimmed.length > 0) {
    statements.push(trimmed);
  }

  return statements;
}

export async function migrate() {
  console.log('==================================================');
  console.log('🚀 Starting Database Migration to New Database');
  console.log(`Target Host:     ${dbConfig.host}:${dbConfig.port}`);
  console.log(`Target Database: ${dbConfig.database}`);
  console.log(`Target User:     ${dbConfig.user}`);
  console.log('==================================================\n');

  const backupPath = path.join(rootDir, 'database', 'backup.sql');
  if (!fs.existsSync(backupPath)) {
    console.error(`❌ Backup file not found at: ${backupPath}`);
    process.exit(1);
  }

  const rawSql = fs.readFileSync(backupPath, 'utf8');
  console.log(`📄 Read backup.sql (${(rawSql.length / 1024).toFixed(1)} KB)`);

  const procMarker = '/* Procedure structure for procedure';
  const procStartIdx = rawSql.indexOf(procMarker);

  if (procStartIdx === -1) {
    console.error('❌ Could not locate procedure section in backup.sql');
    process.exit(1);
  }

  const tableSection = rawSql.slice(0, procStartIdx);
  const procSection = rawSql.slice(procStartIdx);

  const conn = await mysql.createConnection({
    ...dbConfig,
    multipleStatements: true,
  });

  try {
    console.log('🔌 Connected to MySQL server.');

    // 1. Session variables to allow clean imports
    await conn.query(`
      SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
      SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
      SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO';
    `);

    // 2. Table structures and data
    const statements = splitStatements(tableSection);
    console.log(`📦 Executing ${statements.length} table schema and data statements...`);
    let executedCount = 0;
    for (const stmt of statements) {
      if (/^\s*CREATE\s+DATABASE/i.test(stmt) || /^\s*USE\s+/i.test(stmt)) {
        continue;
      }
      await conn.query(stmt);
      executedCount++;
    }
    console.log(`✅ Executed ${executedCount} table and data statements successfully.`);

    // 3. Stored procedures (without hardcoded DEFINER)
    console.log('\n⚙️ Processing stored procedures...');
    const procBlocks = procSection
      .split(/\/\*\s*Procedure structure for procedure/i)
      .filter(b => b.trim().length > 0);

    let createdProcs = 0;
    for (const block of procBlocks) {
      const nameMatch = block.match(/`([a-zA-Z0-9_]+)`/);
      if (!nameMatch) continue;
      const procName = nameMatch[1];

      const defMatch = block.match(/(?:\/\*!50003\s*)?CREATE\s+(?:DEFINER=[^\s]+\s+)?PROCEDURE\s+`?([a-zA-Z0-9_]+)`?([\s\S]*?)END(?:\s*\*\/)?\s*\$\$/i);
      if (!defMatch) {
        console.warn(`⚠️ Could not parse procedure: ${procName}`);
        continue;
      }

      const paramsAndBody = defMatch[2].trim();
      await conn.query(`DROP PROCEDURE IF EXISTS \`${procName}\`;`);
      await conn.query(`CREATE PROCEDURE \`${procName}\` ${paramsAndBody} END;`);
      createdProcs++;
    }
    console.log(`✅ Created ${createdProcs} stored procedures.`);

    // 4. Restore session variables
    await conn.query(`
      SET FOREIGN_KEY_CHECKS=1;
      SET UNIQUE_CHECKS=1;
    `);

    console.log('\n🎉 Database migration completed successfully!');
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

migrate();
