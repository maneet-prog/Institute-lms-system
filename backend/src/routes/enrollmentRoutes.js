const express = require("express");
const controller = require("../controllers/enrollmentController");
const validate = require("../middlewares/validateMiddleware");
const { protect, allowRoles } = require("../middlewares/authMiddleware");
const { enrollSchema, assignBatchSchema, removeAssignmentSchema } = require("../validations/enrollmentValidation");

const router = express.Router();
router.post("/enroll", protect, allowRoles("super_admin", "institute_admin"), validate(enrollSchema), controller.enroll);
router.post(
  "/assign-batch",
  protect,
  allowRoles("super_admin", "institute_admin"),
  validate(assignBatchSchema),
  controller.assignBatch
);
router.delete(
  "/assign-batch",
  protect,
  allowRoles("super_admin", "institute_admin"),
  validate(removeAssignmentSchema),
  controller.removeBatchAssignment
);

module.exports = router;
