const asyncHandler = require("../utils/asyncHandler");
const service = require("../services/progressService");

exports.markComplete = asyncHandler(async (req, res) =>
  res.status(201).json(await service.markComplete(req.body, req.user, req.tenant))
);
exports.myProgress = asyncHandler(async (req, res) =>
  res.json(await service.listMyProgress(req.user, req.tenant))
);
