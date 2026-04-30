const asyncHandler = require("../utils/asyncHandler");
const service = require("../services/submissionService");

exports.list = asyncHandler(async (req, res) =>
  res.json(await service.listSubmissions({ batchId: req.query.batch_id }, req.user, req.tenant))
);

exports.review = asyncHandler(async (req, res) =>
  res.json(await service.reviewSubmission(req.params.submissionId, req.body, req.user, req.tenant))
);
