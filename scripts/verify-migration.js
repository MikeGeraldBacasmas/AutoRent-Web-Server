import mysql from 'mysql2/promise';
import { dbConfig } from '../server/config.js';

async function verify() {
  console.log('==================================================');
  console.log('🔍 FINAL DATABASE VERIFICATION');
  console.log(`Database: ${dbConfig.database} @ ${dbConfig.host}`);
  console.log('==================================================\n');

  const conn = await mysql.createConnection({
    ...dbConfig,
    multipleStatements: true,
  });

  try {
    // 1. Re-enable checks
    await conn.query(`
      SET FOREIGN_KEY_CHECKS=1;
      SET UNIQUE_CHECKS=1;
    `);

    // 2. Check Tables and Row Counts
    const [tables] = await conn.query('SHOW TABLES;');
    const tableKey = Object.keys(tables[0] || {})[0];
    const tableNames = tables.map(r => r[tableKey]);

    console.log(`📊 Tables in database (${tableNames.length}):`);
    let totalRows = 0;
    for (const t of tableNames) {
      const [countResult] = await conn.query(`SELECT COUNT(*) as cnt FROM \`${t}\`;`);
      const cnt = countResult[0].cnt;
      totalRows += cnt;
      console.log(` - ${t.padEnd(25)} : ${String(cnt).padStart(5)} rows`);
    }
    console.log(` Total rows across all tables: ${totalRows}`);

    // 3. Check Stored Procedures
    const [procs] = await conn.query(
      `SELECT ROUTINE_NAME, DEFINER FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA = ? AND ROUTINE_TYPE = 'PROCEDURE' ORDER BY ROUTINE_NAME;`,
      [dbConfig.database]
    );
    console.log(`\n⚙️ Stored Procedures (${procs.length}):`);
    procs.forEach(p => console.log(` - ${p.ROUTINE_NAME.padEnd(35)} (DEFINER: ${p.DEFINER})`));

    // 4. Test Key Procedures with live data
    console.log('\n🧪 Testing stored procedure execution...');

    // Vehicles
    const [vehicles] = await conn.query('CALL sp_get_all_vehicles();');
    console.log(`✅ CALL sp_get_all_vehicles() -> returned ${vehicles[0].length} vehicles.`);

    // Users
    const [users] = await conn.query('CALL sp_get_all_users();');
    console.log(`✅ CALL sp_get_all_users() -> returned ${users[0].length} users.`);

    // Rentals
    const [rentals] = await conn.query('CALL sp_get_all_rentals();');
    console.log(`✅ CALL sp_get_all_rentals() -> returned ${rentals[0].length} rentals.`);

    // Reservations
    const [reservations] = await conn.query('CALL sp_get_all_reservations();');
    console.log(`✅ CALL sp_get_all_reservations() -> returned ${reservations[0].length} reservations.`);

    // Billings
    const [billings] = await conn.query('CALL sp_get_all_billings();');
    console.log(`✅ CALL sp_get_all_billings() -> returned ${billings[0].length} billings.`);

    // Payments
    const [payments] = await conn.query('CALL sp_get_all_payments();');
    console.log(`✅ CALL sp_get_all_payments() -> returned ${payments[0].length} payments.`);

    console.log('\n==================================================');
    console.log('🎉 DATABASE MIGRATION AND VERIFICATION COMPLETED 100%!');
    console.log('==================================================');
  } catch (err) {
    console.error('❌ Verification failed:', err.message);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

verify();
