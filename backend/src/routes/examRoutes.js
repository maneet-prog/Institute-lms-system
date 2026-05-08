const express = require("express");
const controller = require("../controllers/examController");
const { protect, allowRoles } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get(
  "/exam-rendering/course/:courseId/exam-type/:examTypeId/module/:moduleId", protect,
  allowRoles("super_admin", "institute_admin", "teacher", "student"),
  controller.resolveCourseModuleExam
);
router.get(
  "/exam-submissions", protect,
  allowRoles("super_admin", "institute_admin", "teacher"),
  controller.listSubmissions
);

module.exports = router;
