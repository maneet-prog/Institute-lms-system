const Module = require("../models/Module");
const UserProgress = require("../models/Progress");
const { UserBatch, UserModule } = require("../models/Enrollment");
const AppError = require("../utils/AppError");
const { serializeProgress } = require("../utils/serializers");
const { sameId } = require("./accessService");

const getInstituteId = (user, tenant) => tenant?.instituteId || user?.instituteId || null;

const canAccessModule = async ({ userId, instituteId, moduleId }) => {
  const legacyAssignment = await UserModule.findOne({
    userId,
    instituteId,
    moduleId,
    active: true
  });
  if (legacyAssignment) {
    return true;
  }

  const moduleItem = await Module.findOne({
    _id: moduleId,
    instituteId,
    active: true
  }).lean();
  if (!moduleItem) {
    return false;
  }

  const userBatches = await UserBatch.find({
    userId,
    instituteId,
    active: true
  })
    .populate("batchId")
    .lean();

  return userBatches.some(
    (assignment) =>
      assignment.batchId &&
      sameId(assignment.batchId.courseId, moduleItem.courseId) &&
      sameId(assignment.batchId.subcourseId, moduleItem.subcourseId) &&
      assignment.batchId.active !== false
  );
};

const markComplete = async (payload, user, tenant) => {
  const instituteId = getInstituteId(user, tenant);
  if (!instituteId) {
    throw new AppError("User institute is not configured.", 403);
  }

  const allowed = await canAccessModule({
    userId: user._id,
    instituteId,
    moduleId: payload.module_id
  });
  if (!allowed) {
    throw new AppError("Module not found for the current user.", 404);
  }

  const progress = await UserProgress.findOneAndUpdate(
    { userId: user._id, moduleId: payload.module_id, instituteId },
    {
      completed: payload.completed,
      progressPercent: payload.progress_percent,
      lastAccessed: new Date()
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return serializeProgress(progress);
};

const listMyProgress = async (user, tenant) => {
  const instituteId = getInstituteId(user, tenant);
  if (!instituteId) {
    throw new AppError("User institute is not configured.", 403);
  }

  const progress = await UserProgress.find({
    userId: user._id,
    instituteId
  }).sort({ lastAccessed: -1 });
  return progress.map(serializeProgress);
};

module.exports = { markComplete, listMyProgress };
