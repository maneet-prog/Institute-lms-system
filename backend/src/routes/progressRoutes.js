const express = require("express");
const controller = require("../controllers/progressController");
const validate = require("../middlewares/validateMiddleware");
const { protect, allowRoles } = require("../middlewares/authMiddleware");
const { progressSchema } = require("../validations/enrollmentValidation");

const router = express.Router();
router.post("/mark-complete", protect, allowRoles("student"), validate(progressSchema), controller.markComplete);
router.get("/me", protect, allowRoles("student"), controller.myProgress);

module.exports = router;
