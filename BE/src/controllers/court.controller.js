const courtService = require("../services/court.service");
const {
  successResponse,
  errorResponse,
} = require("../middlewares/response.middleware");
const asyncHandler = require("../utils/asyncHandler");

const getAll = asyncHandler(async (req, res) => {
  const { page, limit, is_active, court_type } = req.query;

  const result = await courtService.getAllCourts({
    page,
    limit,
    is_active,
    court_type,
  });

  return successResponse(res, result, "Lấy danh sách court thành công");
});

const getOne = asyncHandler(async (req, res) => {
  const court = await courtService.getOneCourt(req.params.id);

  successResponse(res, court);
});

const deleteCourt = asyncHandler(async (req, res) => {
  const result = await courtService.deleteCourt(req.params.id);

  if (result.affectedRows === 0) {
    return errorResponse(res, "Court không tồn tại hoặc đã bị xóa", 404);
  }

  successResponse(res);
});

const updateCourt = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const updatedCourt = await courtService.updateCourt(id, req.body);

  if (!updatedCourt) {
    return errorResponse(res, "Không tìm thấy court", 404);
  }

  successResponse(res, updatedCourt);
});

const createCourt = asyncHandler(async (req, res) => {
  const { name, court_type, open_time, close_time, slot_minutes } = req.body;

  const createdCourt = await courtService.createCourt(
    name,
    court_type,
    open_time,
    close_time,
    slot_minutes,
  );

  successResponse(res, createdCourt);
});

module.exports = { getAll, getOne, deleteCourt, updateCourt, createCourt };
