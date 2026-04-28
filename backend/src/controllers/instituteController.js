const asyncHandler = require("../utils/asyncHandler");
const service = require("../services/instituteService");

exports.create = asyncHandler(async (req, res) => res.status(201).json(await service.createInstitute(req.body)));
exports.list = asyncHandler(async (req, res) => res.json(await service.listInstitutes(req.user)));
exports.update = asyncHandler(async (req, res) => res.json(await service.updateInstitute(req.params.instituteId, req.body)));
exports.remove = asyncHandler(async (req, res) => {
  await service.deleteInstitute(req.params.instituteId);
  res.json({ message: "Institute deleted successfully." });
});
