const courtModel = require("../models/court.model");

const getAllCourts = async () => {
  return await courtModel.getAll();
};

module.exports = { getAllCourts };
