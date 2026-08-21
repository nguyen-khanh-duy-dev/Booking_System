const db = require("../config/database");

const findAll = async ({ limit, offset }, { court_type } = {}) => {
  const where = ["deleted_at IS NULL"];
  const params = [];

  if (court_type) {
    where.push("court_type = ?");
    params.push(court_type);
  }

  const whereSql = `WHERE ${where.join(" AND ")}`;

  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total FROM courts ${whereSql}`,
    params,
  );

  const [items] = await db.query(
    `SELECT id, name, court_type, open_time, close_time, slot_minutes, created_at
       FROM courts
       ${whereSql}
      ORDER BY id
      LIMIT ${limit} OFFSET ${offset}`,
    params,
  );

  return { items, total };
};

const findById = async (id) => {
  const [rows] = await db.query(
    `select * from courts where id = ? and deleted_at is null`,
    [id],
  );

  const court = rows[0];
  if (!court) {
    throw new Error(`Court ${id} is not found`);
  }

  return court;
};

const softDelete = async (id) => {
  const [result] = await db.query(
    "UPDATE courts SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at is null",
    [id],
  );

  return result;
};

const update = async (courtId, data) => {
  const fields = [];
  const values = [];

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

  const [result] = await db.query(
    `UPDATE courts
     SET ${fields.join(", ")}
     WHERE id = ?
     AND deleted_at IS NULL`,
    values,
  );

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
const create = async (
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
  findAll,
  findById,
  softDelete,
  update,
  create,
};
