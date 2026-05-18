const express = require("express");
const controller = require("../controllers/studentController");
const validate = require("../middlewares/validateMiddleware");
const { protect, allowRoles } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");
const { studentSubmissionSchema } = require("../validations/enrollmentValidation");

const router = express.Router();
router.get("/dashboard", protect, allowRoles("student"), controller.dashboard);
router.get("/enrolled-courses", protect, allowRoles("student"), controller.enrolledCourses);
router.get("/modules-content", protect, allowRoles("student"), controller.modulesContent);
router.get("/batches", protect, allowRoles("student"), controller.batches);
router.get("/batch-workspace/:batchId", protect, allowRoles("student"), controller.batchWorkspace);
router.post("/content-submissions/audio-upload", protect, allowRoles("student"), upload.single("audio"), controller.uploadSpeakingAudio);
router.post("/content-submissions", protect, allowRoles("student"), validate(studentSubmissionSchema), controller.submitContent);

module.exports = router;
