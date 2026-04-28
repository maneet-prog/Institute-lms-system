const asyncHandler = require("../utils/asyncHandler");
const service = require("../services/contentService");

exports.add = asyncHandler(async (req, res) =>
  res.status(201).json(await service.createContent(req.body, req.file, req.tenant, req.user))
);
exports.listByModule = asyncHandler(async (req, res) =>
  res.json(await service.listModuleContents(req.params.moduleId, req.query.batch_id, req.tenant, req.user))
);
exports.edit = asyncHandler(async (req, res) =>
  res.json(await service.updateContent(req.params.contentId, req.body, req.file, req.tenant, req.user))
);
exports.remove = asyncHandler(async (req, res) => {
  await service.deleteContent(req.params.contentId, req.tenant, req.user);
  res.json({ message: "Content deleted successfully." });
});
