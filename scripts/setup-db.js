import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import { dbConfig, assertSafeToModify } from '../server/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const config = {
  ...dbConfig,
  multipleStatements: true,
};

async function main() {
  assertSafeToModify('setup-db.js');
  console.log(`Connecting to MySQL at ${config.host}:${config.port} as user '${config.user}'...`);

  let connection;
  try {
    connection = await mysql.createConnection(config);
    console.log('✅ Connected to MySQL successfully!');
  } catch (err) {
    console.error('❌ Failed to connect to MySQL:', err.message);
    console.error('Please ensure MySQL service is running and credentials in .env are correct.');
    process.exit(1);
  }

  try {
    const dbName = dbConfig.database;
    console.log(`Using database '${dbName}' (must already exist).`);

    // 1. Run schema.sql
    const schemaPath = path.join(rootDir, 'database', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      console.log('📄 Executing database/schema.sql...');
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await connection.query(schemaSql);
      console.log('✅ Schema and tables created successfully.');
    }



    // 2. Run procedures.sql
    const procPath = path.join(rootDir, 'database', 'procedures.sql');
    if (fs.existsSync(procPath)) {
      console.log('📄 Executing database/procedures.sql...');
      const procSql = fs.readFileSync(procPath, 'utf8');

      // Stored procedures often use DELIMITER $$, so we strip delimiter statements and split by $$ or execute
      const cleaned = procSql
        .replace(/--.*$/gm, '') // remove comments
        .replace(/DELIMITER \$\$/g, '')
        .replace(/DELIMITER ;/g, '');

      const statements = cleaned
        .split('$$')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      for (const statement of statements) {
        if (statement.length > 0) {
          await connection.query(statement);
        }
      }
      console.log(`✅ Stored procedures created successfully (${statements.length} blocks processed).`);
    }

    // 3. Run seed.sql
    const seedPath = path.join(rootDir, 'database', 'seed.sql');
    if (fs.existsSync(seedPath)) {
      console.log('📄 Executing database/seed.sql...');
      const seedSql = fs.readFileSync(seedPath, 'utf8');
      await connection.query(seedSql);
      console.log('✅ Seed data inserted successfully.');
    }

    // Check created tables
    const [tables] = await connection.query(`SHOW TABLES;`);
    console.log('\n📊 Created Tables:');
    tables.forEach(row => {
      console.log(` - ${Object.values(row)[0]}`);
    });

    // Check created procedures
    const [procs] = await connection.query(
      `SELECT ROUTINE_NAME FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA = ? AND ROUTINE_TYPE = 'PROCEDURE';`,
      [dbName]
    );
    console.log(`\n⚙️ Stored Procedures (${procs.length}):`);
    procs.forEach(p => console.log(` - ${p.ROUTINE_NAME}`));

    console.log('\n🎉 Database setup completed successfully!');
  } catch (err) {
    console.error('❌ Error executing database scripts:');
    console.error('Message:', err.sqlMessage || err.message);
    console.error('Code:', err.code);
    if (err.sql) {
      console.error('Failed SQL:', err.sql.slice(0, 300));
    }
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

main();
