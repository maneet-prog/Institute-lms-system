const Batch = require("../models/Batch");
const Content = require("../models/Content");
const Module = require("../models/Module");
const StudentSubmission = require("../models/StudentSubmission");
const { BatchTeacher } = require("../models/Enrollment");
const AppError = require("../utils/AppError");
const { hasRole, sameId } = require("./accessService");
const { serializeStudentSubmission } = require("../utils/serializers");

const getInstituteId = (user, tenant) => tenant?.instituteId || user?.instituteId || null;

const getAccessibleBatchIds = async (user, instituteId) => {
  if (hasRole(user, "super_admin", "institute_admin")) {
    const batches = await Batch.find({ instituteId, active: true }).select("_id").lean();
    return new Set(batches.map((batch) => String(batch._id)));
  }

  if (hasRole(user, "teacher")) {
    const assignments = await BatchTeacher.find({ instituteId, userId: user._id }).lean();
    return new Set(assignments.map((assignment) => String(assignment.batchId)));
  }

  throw new AppError("Not enough privileges for submissions.", 403);
};

const listSubmissions = async ({ batchId }, user, tenant) => {
  const instituteId = getInstituteId(user, tenant);
  if (!instituteId) {
    throw new AppError("User institute is not configured.", 403);
  }

  const accessibleBatchIds = await getAccessibleBatchIds(user, instituteId);
  if (!accessibleBatchIds.size) {
    return [];
  }
  if (batchId && !accessibleBatchIds.has(String(batchId))) {
    throw new AppError("Batch access denied.", 403);
  }

  const contentFilterBatchIds = batchId ? [batchId] : [...accessibleBatchIds];
  const contents = await Content.find({
    instituteId,
    batchId: { $in: contentFilterBatchIds }
  }).lean();
  if (!contents.length) {
    return [];
  }

  const submissions = await StudentSubmission.find({
    instituteId,
    contentId: { $in: contents.map((content) => content._id) }
  }).populate("userId reviewedBy");
  if (!submissions.length) {
    return [];
  }

  const modules = await Module.find({
    _id: { $in: contents.map((content) => content.moduleId) }
  }).lean();
  const batches = await Batch.find({
    _id: { $in: contents.map((content) => content.batchId) }
  }).lean();

  const contentById = new Map(contents.map((content) => [String(content._id), content]));
  const moduleById = new Map(modules.map((moduleItem) => [String(moduleItem._id), moduleItem]));
  const batchById = new Map(batches.map((batch) => [String(batch._id), batch]));

  return submissions
    .map((submission) => {
      const content = contentById.get(String(submission.contentId));
      if (!content) {
        return null;
      }
      const batch = batchById.get(String(content.batchId));
      const moduleItem = moduleById.get(String(content.moduleId));
      if (!batch || !moduleItem) {
        return null;
      }

      const latestAttempt = submission.attempts?.length
        ? submission.attempts[submission.attempts.length - 1]
        : null;

      return {
        ...serializeStudentSubmission(submission),
        student: submission.userId
          ? {
              user_id: String(submission.userId._id),
              first_name: submission.userId.firstName,
              last_name: submission.userId.lastName,
              email: submission.userId.email,
              mob_no: submission.userId.mobNo
            }
          : null,
        batch: {
          batch_id: String(batch._id),
          batch_name: batch.batchName
        },
        module: {
          module_id: String(moduleItem._id),
          module_name: moduleItem.moduleName
        },
        content: {
          content_id: String(content._id),
          title: content.title,
          type: content.type,
          category: content.profile?.category || "reading"
        },
        latest_submitted_at: latestAttempt?.submittedAt || submission.submittedAt
      };
    })
    .filter(Boolean)
    .sort((left, right) => new Date(right.latest_submitted_at).getTime() - new Date(left.latest_submitted_at).getTime());
};

const reviewSubmission = async (submissionId, payload, user, tenant) => {
  const instituteId = getInstituteId(user, tenant);
  if (!instituteId) {
    throw new AppError("User institute is not configured.", 403);
  }

  const submission = await StudentSubmission.findById(submissionId);
  if (!submission || !sameId(submission.instituteId, instituteId)) {
    throw new AppError("Submission not found.", 404);
  }

  const content = await Content.findById(submission.contentId);
  if (!content) {
    throw new AppError("Submission content not found.", 404);
  }

  const accessibleBatchIds = await getAccessibleBatchIds(user, instituteId);
  if (!accessibleBatchIds.has(String(content.batchId))) {
    throw new AppError("Batch access denied.", 403);
  }

  const attemptNumber = payload.attempt_number || submission.latestAttemptNumber || submission.attempts?.length || 1;
  const attemptIndex = (submission.attempts || []).findIndex((attempt) => attempt.attemptNumber === attemptNumber);
  if (attemptIndex === -1) {
    throw new AppError("Requested attempt not found.", 404);
  }
  const attemptMaxScore = submission.attempts[attemptIndex].maxScore || 0;
  if (attemptMaxScore > 0 && payload.awarded_marks > attemptMaxScore) {
    throw new AppError(`Awarded marks cannot exceed ${attemptMaxScore} for this attempt.`, 400);
  }

  submission.attempts[attemptIndex].awardedMarks = payload.awarded_marks;
  submission.attempts[attemptIndex].feedback = payload.feedback || null;
  submission.attempts[attemptIndex].status = "reviewed";
  submission.attempts[attemptIndex].reviewedAt = new Date();
  submission.attempts[attemptIndex].reviewedBy = user._id;

  if (attemptNumber === submission.latestAttemptNumber) {
    submission.latestAwardedMarks = payload.awarded_marks;
    submission.reviewStatus = "reviewed";
    submission.feedback = payload.feedback || null;
    submission.reviewedAt = submission.attempts[attemptIndex].reviewedAt;
    submission.reviewedBy = user._id;
  }

  await submission.save();
  return serializeStudentSubmission(submission);
};

module.exports = {
  listSubmissions,
  reviewSubmission
};
