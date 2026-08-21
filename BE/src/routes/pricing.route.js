const express = require("express");
const router = express.Router({ mergeParams: true });
const pricingController = require("../controllers/pricing.controller");

router.get("/:id", pricingController.getPricing);
router.put("/", pricingController.replacePricing);

module.exports = router;
