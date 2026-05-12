const express = require("express");
const controller = require("../controllers/userController");
const validate = require("../middlewares/validateMiddleware");
const { protect, allowRoles } = require("../middlewares/authMiddleware");
const {
  userCreateSchema,
  userUpdateSchema,
  userApproveSchema,
  assignRolesSchema,
  assignInstituteSchema,
  profileUpdateSchema
} = require("../validations/userValidation");
const {
  enrollSchema,
  assignBatchSchema,
  submissionReviewSchema
} = require("../validations/enrollmentValidation");
const {
  contentSchema,
  contentUpdateSchema
} = require("../validations/commonValidation");

const router = express.Router();

router.get("/", protect, allowRoles("super_admin", "institute_admin"), controller.list);
router.get("/:userId/details", protect, allowRoles("super_admin", "institute_admin"), controller.getUserDetails);

// User enrollment management
router.post("/:userId/enroll", protect, allowRoles("super_admin", "institute_admin"), validate(enrollSchema), controller.enrollUser);
router.delete("/:userId/enroll/:enrollmentId", protect, allowRoles("super_admin", "institute_admin"), controller.removeUserEnrollment);

// User batch assignment management
router.post("/:userId/batches", protect, allowRoles("super_admin", "institute_admin"), validate(assignBatchSchema), controller.assignUserToBatch);
router.delete("/:userId/batches/:batchAssignmentId", protect, allowRoles("super_admin", "institute_admin"), controller.removeUserFromBatch);

// User content management (for teachers)
router.post("/:userId/content", protect, allowRoles("super_admin", "institute_admin"), validate(contentSchema), controller.createUserContent);
router.put("/:userId/content/:contentId", protect, allowRoles("super_admin", "institute_admin"), validate(contentUpdateSchema), controller.updateUserContent);
router.delete("/:userId/content/:contentId", protect, allowRoles("super_admin", "institute_admin"), controller.deleteUserContent);

// User submission management
router.put("/:userId/submissions/:submissionId/review", protect, allowRoles("super_admin", "institute_admin"), validate(submissionReviewSchema), controller.reviewUserSubmission);

router.post("/", protect, allowRoles("super_admin", "institute_admin"), validate(userCreateSchema), controller.create);
router.put("/:userId/approve", protect, allowRoles("super_admin", "institute_admin"), validate(userApproveSchema), controller.approve);
router.put("/:userId/assign-institute", protect, allowRoles("super_admin"), validate(assignInstituteSchema), controller.assignInstitute);
router.post("/:userId/roles", protect, allowRoles("super_admin", "institute_admin"), validate(assignRolesSchema), controller.assignRoles);
router.put("/:userId", protect, allowRoles("super_admin", "institute_admin"), validate(userUpdateSchema), controller.update);
router.delete("/:userId", protect, allowRoles("super_admin", "institute_admin"), controller.remove);
router.put("/me/profile", protect, validate(profileUpdateSchema), controller.updateProfile);

module.exports = router;
