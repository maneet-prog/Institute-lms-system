const Content = require("../models/Content");
const UserProgress = require("../models/Progress");
const { UserBatch, UserContent } = require("../models/Enrollment");
const { asId } = require("./accessService");
const { isContentVisibleToStudent } = require("./contentVisibilityService");

const getVisibleModuleContentsForStudent = async ({ instituteId, userId, moduleId }) => {
  const [batchAssignments, directAssignments, contents] = await Promise.all([
    UserBatch.find({
      instituteId,
      userId,
      active: true
    })
      .select("batchId")
      .lean(),
    UserContent.find({
      instituteId,
      userId,
      active: true
    })
      .select("contentId")
      .lean(),
    Content.find({
      instituteId,
      moduleId,
      active: true
    })
      .select("moduleId batchId visibilityScope assignedStudentIds hiddenStudentIds")
      .lean()
  ]);

  const allowedBatchIds = new Set(batchAssignments.map((row) => asId(row.batchId)).filter(Boolean));
  const directContentIds = new Set(directAssignments.map((row) => asId(row.contentId)).filter(Boolean));

  return contents.filter((content) => {
    const contentId = asId(content._id);
    const batchId = asId(content.batchId);
    const hasBatchAccess = batchId ? allowedBatchIds.has(batchId) : false;
    const hasDirectAccess = directContentIds.has(contentId);

    if (!hasBatchAccess && !hasDirectAccess) {
      return false;
    }

    if (hasDirectAccess) {
      return true;
    }

    return isContentVisibleToStudent(content, userId);
  });
};

const recalculateModuleProgress = async ({
  instituteId,
  userId,
  moduleId,
  completedContentIds = [],
  lastAccessed = new Date()
}) => {
  const visibleContents = await getVisibleModuleContentsForStudent({
    instituteId,
    userId,
    moduleId
  });

  const visibleContentIds = new Set(visibleContents.map((content) => asId(content._id)).filter(Boolean));
  const normalizedCompletedIds = [...new Set(completedContentIds.map(asId).filter((id) => id && visibleContentIds.has(id)))];
  const totalContentCount = visibleContentIds.size;
  const completedContentCount = normalizedCompletedIds.length;
  const progressPercent =
    totalContentCount > 0 ? Math.round((completedContentCount / totalContentCount) * 100) : 0;
  const completed = totalContentCount > 0 && completedContentCount >= totalContentCount;

  const progress = await UserProgress.findOneAndUpdate(
    { instituteId, userId, moduleId },
    {
      completed,
      progressPercent,
      completedContentIds: normalizedCompletedIds,
      totalContentCount,
      completedContentCount,
      lastAccessed
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return progress;
};

const markContentCompletedForStudent = async ({ instituteId, userId, moduleId, contentId, completed = true }) => {
  const existing = await UserProgress.findOne({ instituteId, userId, moduleId }).lean();
  const completedIds = new Set((existing?.completedContentIds || []).map(asId).filter(Boolean));

  if (completed) {
    completedIds.add(asId(contentId));
  } else {
    completedIds.delete(asId(contentId));
  }

  return recalculateModuleProgress({
    instituteId,
    userId,
    moduleId,
    completedContentIds: [...completedIds],
    lastAccessed: new Date()
  });
};

module.exports = {
  getVisibleModuleContentsForStudent,
  recalculateModuleProgress,
  markContentCompletedForStudent
};
