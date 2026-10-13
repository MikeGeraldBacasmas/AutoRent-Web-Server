import pool, { callProc } from '../server/db.js';

async function testMileageFuel() {
  try {
    const [existingRentals] = await pool.query('SELECT * FROM rentals LIMIT 1');
    if (!existingRentals || existingRentals.length === 0) {
      console.log('No rentals available in DB for test');
      process.exit(0);
    }
    const testRental = existingRentals[0];
    console.log(`Testing with existing rental ID: ${testRental.id}`);

    // Update with endMileage and endFuel
    await callProc('sp_update_rental', [
      testRental.id,
      '2026-08-31',
      testRental.status,
      'TEST_INSPECTION_REMARKS',
      45600,
      'Full (8/8)',
    ]);

    const rows = await callProc('sp_get_rental_by_id', [testRental.id]);
    const r = rows[0];
    console.log('Retrieved rental after update:', {
      id: r.id,
      endMileage: r.end_mileage,
      endFuel: r.end_fuel,
      status: r.status,
    });

    if (r.end_mileage === 45600 && r.end_fuel === 'Full (8/8)') {
      console.log('SUCCESS: Mileage and Fuel level saved and retrieved correctly via stored procedures!');
    } else {
      console.error('FAILURE: Values did not match!');
    }

    process.exit(0);
  } catch (err) {
    console.error('Error during test:', err);
    process.exit(1);
  }
}

testMileageFuel();
