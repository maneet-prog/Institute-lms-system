const Course = require("../models/Course");
const Module = require("../models/Module");
const Subcourse = require("../models/Subcourse");
const User = require("../models/User");
const { UserCourse, UserModule } = require("../models/Enrollment");
const AppError = require("../utils/AppError");
const { resolveInstituteScope, sameId } = require("./accessService");
const { serializeUserCourse } = require("../utils/serializers");

const enrollUser = async (payload, tenant, currentUser) => {
  const instituteId = await resolveInstituteScope({
    requestedInstituteId: payload.institute_id,
    tenant,
    currentUser
  });

  const user = await User.findById(payload.user_id);
  if (!user || !sameId(user.instituteId, instituteId)) {
    throw new AppError("User not found.", 404);
  }

  const course = await Course.findOne({ _id: payload.course_id, instituteId });
  const subcourse = await Subcourse.findOne({ _id: payload.subcourse_id, instituteId });
  if (!course || !subcourse || !sameId(subcourse.courseId, course._id)) {
    throw new AppError("Course/subcourse not found.", 404);
  }

  const existingEnrollment = await UserCourse.findOne({
    instituteId,
    userId: payload.user_id,
    courseId: payload.course_id,
    subcourseId: payload.subcourse_id
  });
  if (existingEnrollment) {
    throw new AppError("User already enrolled for selected course.", 409);
  }

  const enrollment = await UserCourse.create({
    instituteId,
    userId: payload.user_id,
    courseId: payload.course_id,
    subcourseId: payload.subcourse_id
  });

  const existingModules = await UserModule.find({ userId: payload.user_id, instituteId });
  const existingModuleIds = new Set(existingModules.map((item) => String(item.moduleId)));
  const modules = await Module.find({ instituteId, subcourseId: payload.subcourse_id }).lean();

  for (const moduleItem of modules) {
    if (existingModuleIds.has(String(moduleItem._id))) continue;
    await UserModule.create({
      instituteId,
      userId: payload.user_id,
      moduleId: moduleItem._id,
      active: true
    });
    existingModuleIds.add(String(moduleItem._id));
  }

  return serializeUserCourse(enrollment);
};

module.exports = { enrollUser };
