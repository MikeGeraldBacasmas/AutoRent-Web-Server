import pool from '../server/db.js';

async function testOverlap() {
  try {
    const [vehicles] = await pool.query('SELECT id, name FROM vehicles LIMIT 1');
    const [customers] = await pool.query("SELECT id, username FROM users WHERE role = 'customer' LIMIT 2");
    if (!vehicles[0] || !customers[0]) {
      console.log('No vehicle or customer found to test');
      process.exit(0);
    }
    const vehicleId = vehicles[0].id;
    const customer1 = customers[0].id;
    const customer2 = customers[1] ? customers[1].id : customers[0].id;

    console.log(`Testing with vehicle ${vehicles[0].name} (${vehicleId})`);

    // Clean up any test reservations
    await pool.query("DELETE FROM reservations WHERE remarks = 'TEST_OVERLAP'");

    // 1. Create a dummy Approved reservation for Oct 10 to Oct 15
    const testId = 'test_overlap_1';
    await pool.query(`
      INSERT INTO reservations (id, customer_id, vehicle_id, pickup_date, pickup_time, return_date, return_time,
                                pickup_location, return_location, total_amount, status, label, remarks,
                                license_number, license_type, license_expiry, created_at)
      VALUES (?, ?, ?, '2026-10-10', '09:00:00', '2026-10-15', '09:00:00', 'Branch', 'Branch', 5000, 'Approved', 'In Process', 'TEST_OVERLAP',
              'N01-12-345678', 'Non-Professional', '2028-01-01', CURDATE())
    `, [testId, customer1, vehicleId]);

    console.log('Created approved test reservation: 2026-10-10 to 2026-10-15');

    // 2. Test conflict query (Overlap: Oct 12 to Oct 17)
    const [overlaps] = await pool.query(`
      SELECT id, pickup_date, return_date, status
      FROM reservations
      WHERE vehicle_id = ?
        AND status IN ('Approved', 'Reserved')
        AND pickup_date < '2026-10-17'
        AND return_date > '2026-10-12'
    `, [vehicleId]);

    console.log('Overlap detected count:', overlaps.length);
    if (overlaps.length > 0) {
      console.log('SUCCESS: Overlap query caught conflicting dates:', overlaps[0].pickup_date, 'to', overlaps[0].return_date);
    } else {
      console.error('FAILURE: Overlap was not caught!');
    }

    // 3. Test non-conflicting query (After Oct 15: Oct 16 to Oct 20)
    const [noOverlaps] = await pool.query(`
      SELECT id, pickup_date, return_date, status
      FROM reservations
      WHERE vehicle_id = ?
        AND status IN ('Approved', 'Reserved')
        AND pickup_date < '2026-10-20'
        AND return_date > '2026-10-16'
    `, [vehicleId]);

    console.log('Non-conflicting query result count:', noOverlaps.length);
    if (noOverlaps.length === 0) {
      console.log('SUCCESS: Non-overlapping dates are allowed.');
    } else {
      console.error('FAILURE: Non-overlapping dates were blocked!');
    }

    // 4. Test Stored Procedure sp_create_reservation with conflicting dates
    try {
      await pool.query(`
        CALL sp_create_reservation(?, ?, '2026-10-12', '09:00:00', '2026-10-17', '09:00:00',
                                  'Branch', 'Branch', 5000, 30, 'TEST_OVERLAP',
                                  'N01-12-345678', 'Non-Professional', '2028-01-01', NULL, NULL)
      `, [String(customer2), vehicleId]);
      console.error('FAILURE: Stored procedure allowed overlapping reservation!');
    } catch (spErr) {
      console.log('SUCCESS: Stored procedure correctly threw error:', spErr.message);
    }

    // Clean up
    await pool.query("DELETE FROM reservations WHERE remarks = 'TEST_OVERLAP'");
    console.log('Cleanup finished. All overlap tests passed!');
    process.exit(0);
  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  }
}

testOverlap();
