const Batch = require("../models/Batch");
const SystemSetting = require("../models/SystemSetting");
const { BatchTeacher, UserBatch, UserCourse } = require("../models/Enrollment");
const AppError = require("../utils/AppError");

const asId = (value) => (value == null ? null : String(value));

const sameId = (left, right) => {
  if (left == null || right == null) return false;
  return asId(left) === asId(right);
};

const roleSet = (user) => new Set(user?.roles || []);

const hasRole = (user, ...roles) => roles.some((role) => roleSet(user).has(role));

const resolveInstituteScope = async ({ requestedInstituteId, tenant, currentUser }) => {
  if (!requestedInstituteId || sameId(requestedInstituteId, tenant?.instituteId)) {
    return asId(tenant?.instituteId);
  }

  if (hasRole(currentUser, "super_admin")) {
    const settings = await SystemSetting.findOne().lean();
    if (!settings || settings.allowMultiTenant !== false) {
      return asId(requestedInstituteId);
    }
  }

  throw new AppError("You can only access data for your own institute.", 403);
};

const getTeacherAssignedBatches = async (userId, instituteId) => {
  const assignments = await BatchTeacher.find({ userId, instituteId }).lean();
  if (!assignments.length) return [];

  return Batch.find({
    _id: { $in: assignments.map((assignment) => assignment.batchId) },
    instituteId
  }).lean();
};

const getTeacherScope = async (userId, instituteId) => {
  const batches = await getTeacherAssignedBatches(userId, instituteId);
  return {
    batchIds: new Set(batches.map((batch) => asId(batch._id))),
    courseIds: new Set(batches.map((batch) => asId(batch.courseId))),
    coursePairs: new Set(
      batches.map((batch) => `${asId(batch.courseId)}::${asId(batch.subcourseId)}`)
    )
  };
};

const getStudentEnrollmentScope = async (userId, instituteId) => {
  const enrollments = await UserCourse.find({ userId, instituteId }).lean();
  return {
    courseIds: new Set(enrollments.map((row) => asId(row.courseId))),
    coursePairs: new Set(
      enrollments.map((row) => `${asId(row.courseId)}::${asId(row.subcourseId)}`)
    )
  };
};

const getStudentAssignedBatches = async (userId, instituteId) => {
  const assignments = await UserBatch.find({ userId, instituteId, active: true }).lean();
  if (!assignments.length) return [];

  return Batch.find({
    _id: { $in: assignments.map((assignment) => assignment.batchId) },
    instituteId,
    active: true
  }).lean();
};

const getStudentBatchScope = async (userId, instituteId) => {
  const batches = await getStudentAssignedBatches(userId, instituteId);
  return {
    batchIds: new Set(batches.map((batch) => asId(batch._id))),
    courseIds: new Set(batches.map((batch) => asId(batch.courseId))),
    coursePairs: new Set(
      batches.map((batch) => `${asId(batch.courseId)}::${asId(batch.subcourseId)}`)
    )
  };
};

module.exports = {
  asId,
  sameId,
  roleSet,
  hasRole,
  resolveInstituteScope,
  getTeacherAssignedBatches,
  getTeacherScope,
  getStudentEnrollmentScope,
  getStudentAssignedBatches,
  getStudentBatchScope
};
