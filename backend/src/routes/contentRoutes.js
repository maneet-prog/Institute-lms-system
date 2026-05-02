const express = require("express");
const controller = require("../controllers/contentController");
const validate = require("../middlewares/validateMiddleware");
const { protect, allowRoles } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");
const { contentSchema, contentUpdateSchema } = require("../validations/commonValidation");

const router = express.Router();

router.use(protect);
router.post("/content/quiz-preview", allowRoles("super_admin", "institute_admin", "teacher"), upload.single("file"), controller.previewQuiz);
router.post("/content", allowRoles("super_admin", "institute_admin", "teacher"), upload.single("file"), validate(contentSchema), controller.add);
router.get("/content/:contentId/tecai-exam", allowRoles("super_admin", "institute_admin", "teacher", "student"), controller.tecaiExam);
router.get("/modules/:moduleId/contents", allowRoles("super_admin", "institute_admin", "teacher", "student"), controller.listByModule);
router.put("/content/:contentId", allowRoles("super_admin", "institute_admin", "teacher"), upload.single("file"), validate(contentUpdateSchema), controller.edit);
router.delete("/content/:contentId", allowRoles("super_admin", "institute_admin", "teacher"), controller.remove);

module.exports = router;
