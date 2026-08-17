const courtModel = require("../models/court.model");

const getAllCourts = async () => {
  return await courtModel.getAll();
};

const getOneCourt = async (id) => {
  return await courtModel.getOne(id);
};

const deleteCourt = async (id) => {
  return await courtModel.deleteOne(id);
};

const updateCourt = async (id, data) => {
  return await courtModel.updateOne(id, data);
};

const createCourt = async (
  name,
  court_type,
  open_time,
  close_time,
  slot_minutes,
) => {
  return await courtModel.createOne(
    name,
    court_type,
    open_time,
    close_time,
    slot_minutes,
  );
};

// const createCourt = async
module.exports = {
  getAllCourts,
  getOneCourt,
  deleteCourt,
  updateCourt,
  createCourt,
};
