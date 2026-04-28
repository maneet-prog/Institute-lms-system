const UserProgress = require("../models/Progress");
const { UserModule } = require("../models/Enrollment");
const AppError = require("../utils/AppError");
const { serializeProgress } = require("../utils/serializers");

const getInstituteId = (user, tenant) => tenant?.instituteId || user?.instituteId || null;

const markComplete = async (payload, user, tenant) => {
  const instituteId = getInstituteId(user, tenant);
  if (!instituteId) {
    throw new AppError("User institute is not configured.", 403);
  }

  const userModule = await UserModule.findOne({
    userId: user._id,
    instituteId,
    moduleId: payload.module_id,
    active: true
  });
  if (!userModule) {
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
