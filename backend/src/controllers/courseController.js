const asyncHandler = require("../utils/asyncHandler");
const service = require("../services/courseService");

exports.addCourse = asyncHandler(async (req, res) =>
  res.status(201).json(await service.createCourse(req.body, req.file, req.tenant, req.user))
);
exports.getCourses = asyncHandler(async (req, res) =>
  res.json(await service.listCourses({ tenant: req.tenant, currentUser: req.user, instituteId: req.query.institute_id }))
);
exports.getPublicCourses = asyncHandler(async (req, res) => res.json(await service.listPublicCourses()));
exports.editCourse = asyncHandler(async (req, res) =>
  res.json(await service.updateCourse(req.params.courseId, req.body, req.file, req.tenant, req.user))
);
exports.removeCourse = asyncHandler(async (req, res) => {
  await service.deleteCourse(req.params.courseId, req.tenant, req.user);
  res.json({ message: "Course deleted successfully." });
});

exports.addSubcourse = asyncHandler(async (req, res) =>
  res.status(201).json(await service.createSubcourse(req.body, req.file, req.tenant, req.user))
);
exports.getSubcourses = asyncHandler(async (req, res) =>
  res.json(
    await service.listSubcourses({
      tenant: req.tenant,
      currentUser: req.user,
      instituteId: req.query.institute_id,
      courseId: req.query.course_id
    })
  )
);
exports.getPublicSubcourses = asyncHandler(async (req, res) => res.json(await service.listPublicSubcourses(req.query.course_id)));
exports.editSubcourse = asyncHandler(async (req, res) =>
  res.json(await service.updateSubcourse(req.params.subcourseId, req.body, req.file, req.tenant, req.user))
);
exports.removeSubcourse = asyncHandler(async (req, res) => {
  await service.deleteSubcourse(req.params.subcourseId, req.tenant, req.user);
  res.json({ message: "Subcourse deleted successfully." });
});

exports.addModule = asyncHandler(async (req, res) =>
  res.status(201).json(await service.createModule(req.body, req.tenant, req.user))
);
exports.getModules = asyncHandler(async (req, res) =>
  res.json(
    await service.listModules({
      tenant: req.tenant,
      currentUser: req.user,
      instituteId: req.query.institute_id,
      courseId: req.query.course_id,
      subcourseId: req.query.subcourse_id
    })
  )
);
