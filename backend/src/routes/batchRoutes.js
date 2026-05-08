const express = require("express");
const controller = require("../controllers/batchController");
const validate = require("../middlewares/validateMiddleware");
const { protect, allowRoles } = require("../middlewares/authMiddleware");
const { batchSchema } = require("../validations/commonValidation");
const { assignTeacherSchema, removeAssignmentSchema } = require("../validations/enrollmentValidation");

const router = express.Router();

router.post("/batches", protect, allowRoles("super_admin", "institute_admin"), validate(batchSchema), controller.add);
router.put("/batches/:batchId", protect, allowRoles("super_admin", "institute_admin"), validate(batchSchema), controller.edit);
router.post("/assign-teacher", protect, allowRoles("super_admin", "institute_admin"), validate(assignTeacherSchema), controller.assignTeacher);
router.delete(
  "/assign-teacher", protect,
  allowRoles("super_admin", "institute_admin"),
  validate(removeAssignmentSchema),
  controller.removeTeacher
);
router.get("/batches", protect, allowRoles("super_admin", "institute_admin", "teacher", "student"), controller.list);
router.get("/batches/:batchId/details", protect, allowRoles("super_admin", "institute_admin", "teacher", "student"), controller.detail);
router.delete("/batches/:batchId", protect, allowRoles("super_admin", "institute_admin"), controller.remove);

module.exports = router;
