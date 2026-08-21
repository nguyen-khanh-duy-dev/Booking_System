const courtModel = require("../models/court.model");
const { normalizePaging } = require("../utils/pagination");
const { AppError } = require("../utils/AppError");

const COURT_TYPES = ["STANDARD", "VIP"];

/** Ép về số nguyên dương, giá trị bẩn (âm, 0, chữ, NaN) thì lấy mặc định */

const getAllCourts = async ({ page, limit, court_type } = {}) => {
  if (court_type !== undefined && !COURT_TYPES.includes(court_type)) {
    throw AppError.badRequest(
      `court_type phải là một trong: ${COURT_TYPES.join(", ")}`,
    );
  }

  const paging = normalizePaging({ page, limit });
  const result = await courtModel.findAll(paging, { court_type });

  return {
    items: result.items,
    pagination: {
      ...paging,
      total: result.total,
      totalPages: Math.ceil(result.total / paging.limit),
    },
  };
};

const getOneCourt = async (id) => {
  return await courtModel.findById(id);
};

const deleteCourt = async (id) => {
  return await courtModel.softDelete(id);
};

const updateCourt = async (id, data) => {
  return await courtModel.update(id, data);
};

const createCourt = async (
  name,
  court_type,
  open_time,
  close_time,
  slot_minutes,
) => {
  return await courtModel.create(
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
