import pool from '../server/db.js';

async function updateCharges() {
  try {
    console.log('Checking indexes on charges table...');
    const [indexes] = await pool.query("SHOW INDEX FROM charges WHERE Key_name = 'uq_charges_rental'");
    if (indexes && indexes.length > 0) {
      console.log('Migrating FK and unique constraint on rental_id...');
      await pool.query('ALTER TABLE charges ADD INDEX idx_charges_rental (rental_id)');
      await pool.query('ALTER TABLE charges DROP FOREIGN KEY charges_ibfk_1');
      await pool.query('ALTER TABLE charges DROP INDEX uq_charges_rental');
      await pool.query('ALTER TABLE charges ADD CONSTRAINT charges_ibfk_1 FOREIGN KEY (rental_id) REFERENCES rentals (id) ON DELETE CASCADE');
      console.log('Constraints migrated successfully!');
    } else {
      console.log('Index uq_charges_rental already dropped.');
    }

    console.log('Re-creating sp_create_charge procedure...');
    await pool.query('DROP PROCEDURE IF EXISTS sp_create_charge');
    const procSql = `
CREATE PROCEDURE sp_create_charge(
    IN p_rental_id VARCHAR(36),
    IN p_customer_id INT,
    IN p_vehicle_id VARCHAR(36),
    IN p_description TEXT,
    IN p_amount DECIMAL(10,2)
)
BEGIN
    DECLARE v_id VARCHAR(36);
    SET v_id = UUID();
    INSERT INTO charges (id, rental_id, customer_id, vehicle_id, description, amount)
    VALUES (v_id, p_rental_id, p_customer_id, p_vehicle_id, p_description, p_amount);
    
    SELECT id, rental_id, customer_id, vehicle_id, description, amount, status,
           DATE_FORMAT(paid_at, '%Y-%m-%d %H:%i:%s') AS paid_at,
           DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS created_at
    FROM charges WHERE id = v_id;
END;
`;
    await pool.query(procSql);
    console.log('Successfully updated charges schema and sp_create_charge!');
    process.exit(0);
  } catch (err) {
    console.error('Error updating charges schema:', err);
    process.exit(1);
  }
}

updateCharges();
