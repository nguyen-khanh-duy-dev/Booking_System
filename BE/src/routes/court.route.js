const express = require("express");
const router = express.Router();

const courtController = require("../controllers/court.controller");

// [GET] /api/courts
router.get("/", courtController.getAll);

module.exports = router;
