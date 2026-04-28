const express = require("express");
const controller = require("../controllers/enrollmentController");
const validate = require("../middlewares/validateMiddleware");
const { protect, allowRoles } = require("../middlewares/authMiddleware");
const { enrollSchema, assignBatchSchema, removeAssignmentSchema } = require("../validations/enrollmentValidation");

const router = express.Router();
router.use(protect, allowRoles("super_admin", "institute_admin"));

router.post("/enroll", validate(enrollSchema), controller.enroll);
router.post("/assign-batch", validate(assignBatchSchema), controller.assignBatch);
router.delete("/assign-batch", validate(removeAssignmentSchema), controller.removeBatchAssignment);

module.exports = router;
