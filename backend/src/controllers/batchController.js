const asyncHandler = require("../utils/asyncHandler");
const service = require("../services/batchService");

exports.add = asyncHandler(async (req, res) =>
  res.status(201).json(await service.createBatch(req.body, req.tenant, req.user))
);
exports.edit = asyncHandler(async (req, res) =>
  res.json(await service.updateBatch(req.params.batchId, req.body, req.tenant, req.user))
);
exports.assignTeacher = asyncHandler(async (req, res) =>
  res.status(201).json(await service.assignTeacher(req.body, req.tenant, req.user))
);
exports.removeTeacher = asyncHandler(async (req, res) => {
  await service.removeTeacher(req.body, req.tenant, req.user);
  res.json({ message: "Teacher removed from batch." });
});
exports.list = asyncHandler(async (req, res) =>
  res.json(await service.listBatches({ tenant: req.tenant, currentUser: req.user, instituteId: req.query.institute_id }))
);
exports.detail = asyncHandler(async (req, res) =>
  res.json(await service.getBatchDetail(req.params.batchId, req.tenant, req.user, req.query.institute_id))
);
exports.remove = asyncHandler(async (req, res) => {
  await service.deleteBatch(req.params.batchId, req.tenant, req.user);
  res.json({ message: "Batch deleted successfully." });
});
