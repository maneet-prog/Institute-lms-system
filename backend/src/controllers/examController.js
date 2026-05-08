const asyncHandler = require("../utils/asyncHandler");
const service = require("../services/examService");

exports.resolveCourseModuleExam = asyncHandler(async (req, res) =>
  res.json(
    await service.resolveCourseModuleExam(
      {
        courseId: req.params.courseId,
        examTypeId: req.params.examTypeId,
        moduleId: req.params.moduleId,
        batchId: req.query.batch_id,
        contentId: req.query.content_id
      },
      req.user,
      req.tenant
    )
  )
);

exports.listSubmissions = asyncHandler(async (req, res) =>
  res.json(
    await service.listExamSubmissions(
      {
        batchId: req.query.batch_id,
        courseId: req.query.course_id,
        examTypeId: req.query.exam_type_id,
        moduleId: req.query.module_id,
        contentId: req.query.content_id,
        userId: req.query.user_id
      },
      req.user,
      req.tenant
    )
  )
);
