const db = require("../config/database");

const getAll = async () => {
  const [rows] = await db.query("select * from courts");

  return rows;
};

module.exports = {
  getAll,
};
