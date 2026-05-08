const express = require("express");
const controller = require("../controllers/contentController");
const validate = require("../middlewares/validateMiddleware");
const { protect, allowRoles } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");
const {
  contentSchema,
  contentUpdateSchema,
  reusableContentSchema,
  reusableContentUpdateSchema,
  reusableContentAssignSchema
} = require("../validations/commonValidation");

const router = express.Router();

router.use(protect);
router.post("/content/quiz-preview", allowRoles("super_admin", "institute_admin", "teacher"), upload.single("file"), controller.previewQuiz);
router.post("/content", allowRoles("super_admin", "institute_admin", "teacher"), upload.single("file"), validate(contentSchema), controller.add);
router.post(
  "/content-library",
  allowRoles("super_admin", "institute_admin"),
  upload.single("file"),
  validate(reusableContentSchema),
  controller.addReusable
);
router.get("/content/:contentId/tecai-exam", allowRoles("super_admin", "institute_admin", "teacher", "student"), controller.tecaiExam);
router.get("/modules/:moduleId/contents", allowRoles("super_admin", "institute_admin", "teacher", "student"), controller.listByModule);
router.get(
  "/content-library/modules/:moduleId",
  allowRoles("super_admin", "institute_admin"),
  controller.listReusableByModule
);
router.put("/content/:contentId", allowRoles("super_admin", "institute_admin", "teacher"), upload.single("file"), validate(contentUpdateSchema), controller.edit);
router.put(
  "/content-library/:contentId",
  allowRoles("super_admin", "institute_admin"),
  upload.single("file"),
  validate(reusableContentUpdateSchema),
  controller.editReusable
);
router.post(
  "/content-library/:contentId/assign",
  allowRoles("super_admin", "institute_admin"),
  validate(reusableContentAssignSchema),
  controller.assignReusable
);
router.delete("/content/:contentId", allowRoles("super_admin", "institute_admin", "teacher"), controller.remove);
router.delete("/content-library/:contentId", allowRoles("super_admin", "institute_admin"), controller.removeReusable);

module.exports = router;
