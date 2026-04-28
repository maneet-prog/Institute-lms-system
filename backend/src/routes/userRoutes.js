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

const router = express.Router();

router.use(protect);
router.get("/", allowRoles("super_admin", "institute_admin"), controller.list);
router.post("/", allowRoles("super_admin", "institute_admin"), validate(userCreateSchema), controller.create);
router.put("/:userId/approve", allowRoles("super_admin", "institute_admin"), validate(userApproveSchema), controller.approve);
router.put("/:userId/assign-institute", allowRoles("super_admin"), validate(assignInstituteSchema), controller.assignInstitute);
router.post("/:userId/roles", allowRoles("super_admin", "institute_admin"), validate(assignRolesSchema), controller.assignRoles);
router.put("/:userId", allowRoles("super_admin", "institute_admin"), validate(userUpdateSchema), controller.update);
router.delete("/:userId", allowRoles("super_admin", "institute_admin"), controller.remove);
router.put("/me/profile", validate(profileUpdateSchema), controller.updateProfile);

module.exports = router;
