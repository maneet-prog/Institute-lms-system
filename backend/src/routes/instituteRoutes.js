const express = require("express");
const controller = require("../controllers/instituteController");
const validate = require("../middlewares/validateMiddleware");
const { protect, allowRoles } = require("../middlewares/authMiddleware");
const { instituteCreateSchema, instituteUpdateSchema } = require("../validations/commonValidation");

const router = express.Router();

router.post("/", protect, allowRoles("super_admin"), validate(instituteCreateSchema), controller.create);
router.get("/", protect, allowRoles("super_admin", "institute_admin"), controller.list);
router.put("/:instituteId", protect, allowRoles("super_admin"), validate(instituteUpdateSchema), controller.update);
router.delete("/:instituteId", protect, allowRoles("super_admin"), controller.remove);

module.exports = router;
