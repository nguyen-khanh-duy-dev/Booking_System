const db = require("../config/database");

const getAll = async () => {
  const [rows] = await db.query(
    "select * from courts where deleted_at is null",
  );

  return rows;
};

const getOne = async (courtId) => {
  const [rows] = await db.query(
    `select * from courts where id = ${courtId} and deleted_at is null`,
  );

  const court = rows[0];
  if (!court) {
    throw new Error(`Court ${courtId} is not found`);
  }

  return court;
};

const deleteOne = async (courtId) => {
  const [result] = await db.query(
    "UPDATE courts SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at is null",
    [courtId],
  );

  return result;
};

const updateOne = async (courtId, data) => {
  const fields = [];
  const values = [];
  console.log(courtId);

  if (data.name !== undefined) {
    fields.push("name = ?");
    values.push(data.name);
  }

  if (data.court_type !== undefined) {
    fields.push("court_type = ?");
    values.push(data.court_type);
  }

  if (data.open_time !== undefined) {
    fields.push("open_time = ?");
    values.push(data.open_time);
  }

  if (data.close_time !== undefined) {
    fields.push("close_time = ?");
    values.push(data.close_time);
  }

  if (data.slot_minutes !== undefined) {
    fields.push("slot_minutes = ?");
    values.push(data.slot_minutes);
  }

  if (fields.length === 0) {
    return null;
  }

  values.push(courtId);

  console.log(values);

  const [result] = await db.query(
    `UPDATE courts
     SET ${fields.join(", ")}
     WHERE id = ?
     AND deleted_at IS NULL`,
    values,
  );

  console.log(result);

  if (result.affectedRows === 0) {
    return null;
  }

  const [rows] = await db.query(
    `SELECT *
     FROM courts
     WHERE id = ?`,
    [courtId],
  );

  return rows[0];
};
const createOne = async (
  name,
  court_type,
  open_time,
  close_time,
  slot_minutes,
) => {
  const values = [name, court_type, open_time, close_time, slot_minutes];

  const [result] = await db.query(
    `INSERT INTO courts (name, court_type, open_time, close_time, slot_minutes) values (?, ?, ?, ?, ?)`,
    values,
  );

  const [rows] = await db.query("select * from courts where id = ?", [
    result.insertId,
  ]);

  const insertedCourt = rows[0];

  return rows[0];
};

module.exports = {
  getAll,
  getOne,
  deleteOne,
  updateOne,
  createOne,
};
