const express = require("express");
const router = express.Router();

const courtController = require("../controllers/court.controller");

// [GET] /api/courts
router.get("/", courtController.getAll);
// [GET] /api/courts/:id
router.get("/:id", courtController.getOne);
// [DELETE] /api/courts/:id
router.delete("/:id", courtController.deleteCourt);
// [PATCH] /api/courts/:id
router.patch("/:id", courtController.updateCourt);
// [POST] /api/courts
router.post("/", courtController.createCourt);

module.exports = router;
