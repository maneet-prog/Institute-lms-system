const asyncHandler = require("../utils/asyncHandler");
const service = require("../services/studentService");

exports.enrolledCourses = asyncHandler(async (req, res) =>
  res.json(await service.getEnrolledCourses(req.user, req.tenant))
);
exports.modulesContent = asyncHandler(async (req, res) =>
  res.json(await service.getModulesContent(req.user, req.tenant))
);
exports.batches = asyncHandler(async (req, res) =>
  res.json(await service.getStudentBatches(req.user, req.tenant))
);
exports.batchWorkspace = asyncHandler(async (req, res) =>
  res.json(await service.getBatchWorkspace(req.params.batchId, req.query.category, req.user, req.tenant))
);
exports.submitContent = asyncHandler(async (req, res) =>
  res.status(201).json(await service.submitContent(req.body, req.user, req.tenant))
);
