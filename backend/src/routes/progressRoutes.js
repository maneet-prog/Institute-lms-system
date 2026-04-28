const express = require("express");
const controller = require("../controllers/progressController");
const validate = require("../middlewares/validateMiddleware");
const { protect } = require("../middlewares/authMiddleware");
const { progressSchema } = require("../validations/enrollmentValidation");

const router = express.Router();
router.use(protect);
router.post("/mark-complete", validate(progressSchema), controller.markComplete);
router.get("/me", controller.myProgress);

module.exports = router;
