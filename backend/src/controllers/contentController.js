const asyncHandler = require("../utils/asyncHandler");
const service = require("../services/contentService");

exports.add = asyncHandler(async (req, res) =>
  res.status(201).json(await service.createContent(req.body, req.file, req.tenant, req.user))
);
exports.addReusable = asyncHandler(async (req, res) =>
  res.status(201).json(await service.createReusableContent(req.body, req.file, req.tenant, req.user))
);
exports.previewQuiz = asyncHandler(async (req, res) =>
  res.json(await service.previewQuiz(req.file, req.body))
);
exports.tecaiExam = asyncHandler(async (req, res) =>
  res.json(await service.getTecaiExamData(req.params.contentId, req.tenant, req.user))
);
exports.listByModule = asyncHandler(async (req, res) =>
  res.json(await service.listModuleContents(req.params.moduleId, req.query.batch_id, req.tenant, req.user))
);
exports.listReusableByModule = asyncHandler(async (req, res) =>
  res.json(await service.listReusableContents(req.params.moduleId, req.tenant, req.user))
);
exports.edit = asyncHandler(async (req, res) =>
  res.json(await service.updateContent(req.params.contentId, req.body, req.file, req.tenant, req.user))
);
exports.editReusable = asyncHandler(async (req, res) =>
  res.json(await service.updateReusableContent(req.params.contentId, req.body, req.file, req.tenant, req.user))
);
exports.assignReusable = asyncHandler(async (req, res) =>
  res.status(201).json(await service.assignReusableContent(req.params.contentId, req.body, req.tenant, req.user))
);
exports.remove = asyncHandler(async (req, res) => {
  await service.deleteContent(req.params.contentId, req.tenant, req.user);
  res.json({ message: "Content deleted successfully." });
});
exports.removeReusable = asyncHandler(async (req, res) => {
  await service.deleteReusableContent(req.params.contentId, req.tenant, req.user);
  res.json({ message: "Reusable content deleted successfully." });
});
