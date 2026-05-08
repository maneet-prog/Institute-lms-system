const express = require("express");
const controller = require("../controllers/submissionController");
const validate = require("../middlewares/validateMiddleware");
const { protect, allowRoles } = require("../middlewares/authMiddleware");
const { submissionReviewSchema } = require("../validations/enrollmentValidation");

const router = express.Router();

router.get("/", protect, allowRoles("super_admin", "institute_admin", "teacher"), controller.list);
router.put("/:submissionId/review", protect, allowRoles("super_admin", "institute_admin", "teacher"), validate(submissionReviewSchema), controller.review);

module.exports = router;
