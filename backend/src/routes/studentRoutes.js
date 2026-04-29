const express = require("express");
const controller = require("../controllers/studentController");
const validate = require("../middlewares/validateMiddleware");
const { protect, allowRoles } = require("../middlewares/authMiddleware");
const { studentSubmissionSchema } = require("../validations/enrollmentValidation");

const router = express.Router();
router.use(protect, allowRoles("student"));
router.get("/dashboard", controller.dashboard);
router.get("/enrolled-courses", controller.enrolledCourses);
router.get("/modules-content", controller.modulesContent);
router.get("/batches", controller.batches);
router.get("/batch-workspace/:batchId", controller.batchWorkspace);
router.post("/content-submissions", validate(studentSubmissionSchema), controller.submitContent);

module.exports = router;
