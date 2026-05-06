const asyncHandler = require("../utils/asyncHandler");
const service = require("../services/resourceService");

exports.assign = asyncHandler(async (req, res) =>
  res.status(201).json(await service.assignResource(req.body, req.user, req.tenant))
);

exports.remove = asyncHandler(async (req, res) =>
  res.json(await service.removeResource(req.body, req.user, req.tenant))
);
