const db = require("../config/database");

// Find Pricing By Court
const findByCourt = async (courtId) => {
  const [rows] = await db.query(
    `SELECT * FROM pricing_rules WHERE court_id = ?`,
    [courtId],
  );

  return rows;
};

const deleteByCourt = async (courtId, conn) => {
  const executor = conn || db;
  await executor.query(`DELETE FROM pricing_rules WHERE court_id = ?`, [
    courtId,
  ]);
};

const bulkInsert = async (courtId, rules, conn) => {
  if (!rules.length) return;

  const executor = conn || db;
  const values = rules.map((r) => [
    courtId,
    r.day_type,
    r.start_time,
    r.end_time,
    r.price_per_hour,
  ]);

  await executor.query(
    `INSERT INTO pricing_rules
       (court_id, day_type, start_time, end_time, price_per_hour)
     VALUES ?`,
    [values],
  );
};

module.exports = { findByCourt, deleteByCourt, bulkInsert };
