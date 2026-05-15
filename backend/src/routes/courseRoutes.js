const express = require("express");
const controller = require("../controllers/courseController");
const validate = require("../middlewares/validateMiddleware");
const { protect, allowRoles } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");
const {
  courseSchema,
  subcourseSchema,
  moduleSchema,
  moduleUpdateSchema,
  moduleSubcategorySchema,
  moduleSubcategoryUpdateSchema
} = require("../validations/commonValidation");

const router = express.Router();

router.get("/public/courses", controller.getPublicCourses);
router.get("/public/subcourses", controller.getPublicSubcourses);


router.post(
  "/courses",
  protect,
  allowRoles("super_admin", "institute_admin"),
  upload.single("image"),
  validate(courseSchema),
  controller.addCourse
);
router.get("/courses", protect, allowRoles("super_admin", "institute_admin", "teacher", "student"), controller.getCourses);
router.put(
  "/courses/:courseId",
  protect,
  allowRoles("super_admin", "institute_admin"),
  upload.single("image"),
  validate(courseSchema),
  controller.editCourse
);
router.delete("/courses/:courseId", protect, allowRoles("super_admin", "institute_admin"), controller.removeCourse);

router.post(
  "/subcourses",
  protect,
  allowRoles("super_admin", "institute_admin"),
  upload.single("image"),
  validate(subcourseSchema),
  controller.addSubcourse
);
router.get("/subcourses", protect, allowRoles("super_admin", "institute_admin", "teacher", "student"), controller.getSubcourses);
router.put(
  "/subcourses/:subcourseId",
  protect,
  allowRoles("super_admin", "institute_admin"),
  upload.single("image"),
  validate(subcourseSchema),
  controller.editSubcourse
);
router.delete("/subcourses/:subcourseId", protect, allowRoles("super_admin", "institute_admin"), controller.removeSubcourse);

router.post("/modules", protect, allowRoles("super_admin", "institute_admin", "teacher"), validate(moduleSchema), controller.addModule);
router.get("/modules", protect, allowRoles("super_admin", "institute_admin", "teacher", "student"), controller.getModules);
router.put("/modules/:moduleId", protect, allowRoles("super_admin", "institute_admin", "teacher"), validate(moduleUpdateSchema), controller.editModule);
router.delete("/modules/:moduleId", protect, allowRoles("super_admin", "institute_admin", "teacher"), controller.removeModule);
router.post(
  "/modules/:moduleId/subcategories",
  protect,
  allowRoles("super_admin", "institute_admin"),
  validate(moduleSubcategorySchema),
  controller.addModuleSubcategory
);
router.put(
  "/modules/:moduleId/subcategories/:subcategoryId",
  protect,
  allowRoles("super_admin", "institute_admin"),
  validate(moduleSubcategoryUpdateSchema),
  controller.editModuleSubcategory
);
router.delete(
  "/modules/:moduleId/subcategories/:subcategoryId",
  protect,
  allowRoles("super_admin", "institute_admin"),
  controller.removeModuleSubcategory
);

module.exports = router;
