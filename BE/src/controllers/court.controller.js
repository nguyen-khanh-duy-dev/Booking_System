const courtService = require("../services/court.service");
const {
  successResponse,
  errorResponse,
} = require("../middlewares/response.middleware");
const asyncHandler = require("../utils/asyncHandler");

const getAll = asyncHandler(async (req, res) => {
  const courts = await courtService.getAllCourts();

  successResponse(res, courts);
});

module.exports = { getAll };
