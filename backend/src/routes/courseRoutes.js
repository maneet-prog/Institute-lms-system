const express = require("express");
const controller = require("../controllers/courseController");
const validate = require("../middlewares/validateMiddleware");
const { protect, allowRoles } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");
const { courseSchema, subcourseSchema, moduleSchema } = require("../validations/commonValidation");

const router = express.Router();

router.get("/public/courses", controller.getPublicCourses);
router.get("/public/subcourses", controller.getPublicSubcourses);

router.use(protect);
router.post(
  "/courses",
  allowRoles("super_admin", "institute_admin"),
  upload.single("image"),
  validate(courseSchema),
  controller.addCourse
);
router.get("/courses", allowRoles("super_admin", "institute_admin", "teacher", "student"), controller.getCourses);
router.put(
  "/courses/:courseId",
  allowRoles("super_admin", "institute_admin"),
  upload.single("image"),
  validate(courseSchema),
  controller.editCourse
);
router.delete("/courses/:courseId", allowRoles("super_admin", "institute_admin"), controller.removeCourse);

router.post(
  "/subcourses",
  allowRoles("super_admin", "institute_admin"),
  upload.single("image"),
  validate(subcourseSchema),
  controller.addSubcourse
);
router.get("/subcourses", allowRoles("super_admin", "institute_admin", "teacher", "student"), controller.getSubcourses);
router.put(
  "/subcourses/:subcourseId",
  allowRoles("super_admin", "institute_admin"),
  upload.single("image"),
  validate(subcourseSchema),
  controller.editSubcourse
);
router.delete("/subcourses/:subcourseId", allowRoles("super_admin", "institute_admin"), controller.removeSubcourse);

router.post("/modules", allowRoles("super_admin", "institute_admin", "teacher"), validate(moduleSchema), controller.addModule);
router.get("/modules", allowRoles("super_admin", "institute_admin", "teacher", "student"), controller.getModules);

module.exports = router;
