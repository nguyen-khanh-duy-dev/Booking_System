const { successResponse } = require("../middlewares/response.middleware");
const pricingService = require("../services/pricing.service");
const asyncHandler = require("../utils/asyncHandler");

const getPricing = asyncHandler(async (req, res) => {
  const result = await pricingService.getPricing(req.params.id);

  successResponse(res, result);
});

const replacePricing = async (req, res) => {
  const data = await pricingService.replacePricing(
    req.params.id,
    req.body.rules,
  );
  res.json({ success: true, message: "Cập nhật bảng giá thành công", data });
};

module.exports = { getPricing, replacePricing };
