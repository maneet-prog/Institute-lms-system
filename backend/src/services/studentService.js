const Batch = require("../models/Batch");
const Content = require("../models/Content");
const Module = require("../models/Module");
const UserProgress = require("../models/Progress");
const StudentSubmission = require("../models/StudentSubmission");
const { UserBatch, UserCourse, UserModule } = require("../models/Enrollment");
const AppError = require("../utils/AppError");
const { serializeContent, serializeStudentSubmission } = require("../utils/serializers");
const { gradeQuizSubmission, resolveQuizFromContent } = require("../utils/quiz");

const getInstituteId = (user, tenant) => tenant?.instituteId || user?.instituteId || null;
const average = (values) =>
  values.length ? Math.round(values.reduce((sum, value) => sum + Number(value || 0), 0) / values.length) : 0;
const formatChartLabel = (date) =>
  new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });

const getLastAttempt = (submission) => {
  const attempts = submission?.attempts || [];
  return attempts.length ? attempts[attempts.length - 1] : null;
};

const buildSubmissionSummary = ({ submission, content, moduleItem, batch }) => {
  const serialized = serializeStudentSubmission(submission);
  const latestAttempt = getLastAttempt(submission);
  return {
    ...serialized,
    content_id: String(content._id),
    content_title: content.title,
    content_type: content.type,
    module_id: String(moduleItem._id),
    module_name: moduleItem.moduleName,
    batch_id: batch.batch_id,
    batch_name: batch.batch_name,
    latest_submitted_at: latestAttempt?.submittedAt || submission.submittedAt
  };
};

const mapAssignmentRowToBatchInfo = (row) => ({
  batch_id: String(row.batchId._id),
  batch_name: row.batchId.batchName,
  course_id: String(row.batchId.courseId?._id || row.batchId.courseId),
  course_name: row.batchId.courseId?.courseName || String(row.batchId.courseId),
  course_description: row.batchId.courseId?.description ?? null,
  course_image_url: row.batchId.courseId?.imageUrl ?? null,
  subcourse_id: String(row.batchId.subcourseId?._id || row.batchId.subcourseId),
  subcourse_name: row.batchId.subcourseId?.subcourseName || String(row.batchId.subcourseId),
  subcourse_description: row.batchId.subcourseId?.description ?? null,
  subcourse_image_url: row.batchId.subcourseId?.imageUrl ?? null,
  description: row.batchId.detail?.description ?? null,
  room_name: row.batchId.detail?.roomName ?? null,
  schedule_notes: row.batchId.detail?.scheduleNotes ?? null,
  start_date: row.batchId.detail?.startDate ?? null,
  end_date: row.batchId.detail?.endDate ?? null
});

const getStudentBatches = async (user, tenant) => {
  const instituteId = getInstituteId(user, tenant);
  if (!instituteId) {
    throw new AppError("User institute is not configured.", 403);
  }

  const assignments = await UserBatch.find({
    userId: user._id,
    instituteId,
    active: true
  }).populate({
    path: "batchId",
    populate: [{ path: "courseId" }, { path: "subcourseId" }]
  });

  const activeAssignments = assignments.filter((row) => row.batchId?.active);
  if (activeAssignments.length) {
    return activeAssignments.map(mapAssignmentRowToBatchInfo);
  }

  // Transitional fallback for pre-batch students: expose matching active batches for their legacy course enrollments.
  const legacyEnrollments = await UserCourse.find({
    userId: user._id,
    instituteId
  }).lean();
  if (!legacyEnrollments.length) {
    return [];
  }

  const matchedBatches = await Batch.find({
    instituteId,
    active: true,
    $or: legacyEnrollments.map((row) => ({
      courseId: row.courseId,
      subcourseId: row.subcourseId
    }))
  }).populate("courseId subcourseId");

  return matchedBatches.map((batch) => ({
    batch_id: String(batch._id),
    batch_name: batch.batchName,
    course_id: String(batch.courseId?._id || batch.courseId),
    course_name: batch.courseId?.courseName || String(batch.courseId),
    course_description: batch.courseId?.description ?? null,
    course_image_url: batch.courseId?.imageUrl ?? null,
    subcourse_id: String(batch.subcourseId?._id || batch.subcourseId),
    subcourse_name: batch.subcourseId?.subcourseName || String(batch.subcourseId),
    subcourse_description: batch.subcourseId?.description ?? null,
    subcourse_image_url: batch.subcourseId?.imageUrl ?? null,
    description: batch.detail?.description ?? null,
    room_name: batch.detail?.roomName ?? null,
    schedule_notes: batch.detail?.scheduleNotes ?? null,
    start_date: batch.detail?.startDate ?? null,
    end_date: batch.detail?.endDate ?? null
  }));
};

const getEnrolledCourses = async (user, tenant) => {
  const instituteId = getInstituteId(user, tenant);
  if (!instituteId) {
    throw new AppError("User institute is not configured.", 403);
  }

  const enrolled = await UserCourse.find({
    userId: user._id,
    instituteId
  }).populate("courseId subcourseId");

  return enrolled
    .filter((item) => item.courseId?.active && item.subcourseId?.active)
    .map((item) => ({
      course_id: String(item.courseId._id),
      course_name: item.courseId.courseName,
      course_description: item.courseId.description ?? null,
      course_image_url: item.courseId.imageUrl ?? null,
      subcourse_id: String(item.subcourseId._id),
      subcourse_name: item.subcourseId.subcourseName,
      subcourse_description: item.subcourseId.description ?? null,
      subcourse_image_url: item.subcourseId.imageUrl ?? null
    }));
};

const getModulesContent = async (user, tenant) => {
  const instituteId = getInstituteId(user, tenant);
  if (!instituteId) {
    throw new AppError("User institute is not configured.", 403);
  }

  const batches = await getStudentBatches(user, tenant);
  const output = [];

  for (const batch of batches) {
    const modules = await Module.find({
      instituteId,
      courseId: batch.course_id,
      subcourseId: batch.subcourse_id,
      active: true
    }).sort({ createdAt: 1 });

    for (const moduleItem of modules) {
      const contents = await Content.find({
        moduleId: moduleItem._id,
        batchId: batch.batch_id,
        instituteId
      }).sort({ orderIndex: 1, createdAt: 1, _id: 1 });

      output.push({
        batch_id: batch.batch_id,
        batch_name: batch.batch_name,
        module_id: String(moduleItem._id),
        module_name: moduleItem.moduleName,
        content: contents.map((content) => serializeContent(content, { includeQuizAnswers: false }))
      });
    }
  }

  if (output.length) {
    return output;
  }

  // Fallback for legacy students that still have user-module assignments but no batch-scoped content rows yet.
  const userModules = await UserModule.find({
    userId: user._id,
    instituteId,
    active: true
  }).lean();
  for (const row of userModules) {
    const moduleItem = await Module.findOne({
      _id: row.moduleId,
      instituteId,
      active: true
    });
    if (!moduleItem) continue;

    output.push({
      batch_id: "",
      batch_name: "Legacy Access",
      module_id: String(moduleItem._id),
      module_name: moduleItem.moduleName,
      content: []
    });
  }

  return output;
};

const getBatchWorkspace = async (batchId, category, user, tenant) => {
  const instituteId = getInstituteId(user, tenant);
  if (!instituteId) {
    throw new AppError("User institute is not configured.", 403);
  }

  const batches = await getStudentBatches(user, tenant);
  const batch = batches.find((item) => item.batch_id === batchId);
  if (!batch) {
    throw new AppError("Batch access denied.", 403);
  }

  const modules = await Module.find({
    instituteId,
    courseId: batch.course_id,
    subcourseId: batch.subcourse_id,
    active: true
  }).sort({ createdAt: 1 });

  const contents = modules.length
    ? await Content.find({
        instituteId,
        batchId: batch.batch_id,
        moduleId: { $in: modules.map((moduleItem) => moduleItem._id) }
      }).sort({ orderIndex: 1, createdAt: 1, _id: 1 })
    : [];

  const submissions = contents.length
    ? await StudentSubmission.find({
        userId: user._id,
        instituteId,
        contentId: { $in: contents.map((content) => content._id) }
      })
    : [];
  const submissionsByContent = new Map(
    submissions.map((submission) => [String(submission.contentId), serializeStudentSubmission(submission)])
  );

  const availableCategories = [...new Set(contents.map((content) => content.profile?.category).filter(Boolean))].sort();
  const filteredContents = category
    ? contents.filter((content) => content.profile?.category === category)
    : contents;

  const contentByModule = new Map();
  for (const content of filteredContents) {
    const serialized = {
      ...serializeContent(content, { includeQuizAnswers: false }),
      submission: submissionsByContent.get(String(content._id)) || null
    };
    if (!contentByModule.has(String(content.moduleId))) {
      contentByModule.set(String(content.moduleId), []);
    }
    contentByModule.get(String(content.moduleId)).push(serialized);
  }

  return {
    batch_id: batch.batch_id,
    batch_name: batch.batch_name,
    course_id: batch.course_id,
    course_name: batch.course_name,
    course_description: batch.course_description ?? null,
    course_image_url: batch.course_image_url ?? null,
    subcourse_id: batch.subcourse_id,
    subcourse_name: batch.subcourse_name,
    subcourse_description: batch.subcourse_description ?? null,
    subcourse_image_url: batch.subcourse_image_url ?? null,
    content_categories: availableCategories,
    selected_category: category || null,
    modules: modules
      .filter((moduleItem) => (contentByModule.get(String(moduleItem._id)) || []).length)
      .map((moduleItem) => ({
        module_id: String(moduleItem._id),
        module_name: moduleItem.moduleName,
        subcourse_id: String(moduleItem.subcourseId),
        subcourse_name: batch.subcourse_name,
        batch_id: batch.batch_id,
        batch_name: batch.batch_name,
        content: contentByModule.get(String(moduleItem._id)) || []
      }))
  };
};

const getDashboard = async (user, tenant) => {
  const instituteId = getInstituteId(user, tenant);
  if (!instituteId) {
    throw new AppError("User institute is not configured.", 403);
  }

  const batches = await getStudentBatches(user, tenant);
  const student = {
    user_id: String(user._id),
    institute_id: String(instituteId),
    first_name: user.firstName,
    last_name: user.lastName,
    email: user.email
  };

  if (!batches.length) {
    return {
      student,
      overview: {
        batch_count: 0,
        module_count: 0,
        completed_module_count: 0,
        pending_module_count: 0,
        average_progress_percent: 0,
        submission_count: 0,
        reviewed_submission_count: 0
      },
      activity_chart: [],
      batches: [],
      modules: [],
      submissions: []
    };
  }

  const batchIds = batches.map((batch) => batch.batch_id);
  const pairs = [...new Map(
    batches.map((batch) => [
      `${batch.course_id}::${batch.subcourse_id}`,
      { courseId: batch.course_id, subcourseId: batch.subcourse_id }
    ])
  ).values()];

  const modules = pairs.length
    ? await Module.find({
        instituteId,
        active: true,
        $or: pairs.map((pair) => ({
          courseId: pair.courseId,
          subcourseId: pair.subcourseId
        }))
      })
        .sort({ createdAt: 1 })
        .lean()
    : [];

  const moduleIds = modules.map((moduleItem) => moduleItem._id);
  const contents = moduleIds.length
    ? await Content.find({
        instituteId,
        batchId: { $in: batchIds },
        moduleId: { $in: moduleIds }
      })
        .select("moduleId batchId title duration type")
        .sort({ orderIndex: 1, createdAt: 1, _id: 1 })
        .lean()
    : [];
  const progressRows = moduleIds.length
    ? await UserProgress.find({
        instituteId,
        userId: user._id,
        moduleId: { $in: moduleIds }
      }).lean()
    : [];
  const submissions = contents.length
    ? await StudentSubmission.find({
        instituteId,
        userId: user._id,
        contentId: { $in: contents.map((content) => content._id) }
      }).lean()
    : [];

  const modulesByPair = new Map();
  for (const moduleItem of modules) {
    const key = `${String(moduleItem.courseId)}::${String(moduleItem.subcourseId)}`;
    const list = modulesByPair.get(key) || [];
    list.push(moduleItem);
    modulesByPair.set(key, list);
  }

  const contentByBatchModule = new Map();
  for (const content of contents) {
    const key = `${String(content.batchId)}::${String(content.moduleId)}`;
    const current = contentByBatchModule.get(key) || {
      content_count: 0,
      total_duration_minutes: 0,
      next_content_title: null
    };
    current.content_count += 1;
    current.total_duration_minutes += Number(content.duration || 0);
    if (!current.next_content_title) {
      current.next_content_title = content.title;
    }
    contentByBatchModule.set(key, current);
  }

  const progressByModule = new Map(progressRows.map((row) => [String(row.moduleId), row]));
  const contentById = new Map(contents.map((content) => [String(content._id), content]));
  const moduleById = new Map(modules.map((moduleItem) => [String(moduleItem._id), moduleItem]));
  const dashboardModules = [];
  const batchSummaries = [];
  const submissionSummaries = [];

  for (const batch of batches) {
    const pairKey = `${batch.course_id}::${batch.subcourse_id}`;
    const pairModules = modulesByPair.get(pairKey) || [];
    const visibleModules = [];

    for (const moduleItem of pairModules) {
      const moduleId = String(moduleItem._id);
      const contentMeta = contentByBatchModule.get(`${batch.batch_id}::${moduleId}`) || null;
      const progressMeta = progressByModule.get(moduleId) || null;

      if (!contentMeta && !progressMeta) {
        continue;
      }

      const item = {
        module_id: moduleId,
        module_name: moduleItem.moduleName,
        batch_id: batch.batch_id,
        batch_name: batch.batch_name,
        course_id: batch.course_id,
        course_name: batch.course_name,
        subcourse_id: batch.subcourse_id,
        subcourse_name: batch.subcourse_name,
        content_count: contentMeta?.content_count || 0,
        total_duration_minutes: contentMeta?.total_duration_minutes || 0,
        next_content_title: contentMeta?.next_content_title || null,
        completed: Boolean(progressMeta?.completed),
        progress_percent: Number(progressMeta?.progressPercent || 0),
        last_accessed: progressMeta?.lastAccessed || null
      };

      visibleModules.push(item);
      dashboardModules.push(item);
    }

    batchSummaries.push({
      ...batch,
      module_count: visibleModules.length,
      completed_module_count: visibleModules.filter((item) => item.completed).length,
      average_progress_percent: average(visibleModules.map((item) => item.progress_percent))
    });
  }

  dashboardModules.sort((left, right) => {
    if (left.completed !== right.completed) {
      return Number(left.completed) - Number(right.completed);
    }
    if (right.progress_percent !== left.progress_percent) {
      return right.progress_percent - left.progress_percent;
    }
    return left.module_name.localeCompare(right.module_name);
  });

  for (const submission of submissions) {
    const content = contentById.get(String(submission.contentId));
    if (!content) continue;
    const moduleItem = moduleById.get(String(content.moduleId));
    if (!moduleItem) continue;
    const batch = batches.find((item) => item.batch_id === String(content.batchId));
    if (!batch) continue;
    submissionSummaries.push(
      buildSubmissionSummary({
        submission,
        content,
        moduleItem,
        batch
      })
    );
  }

  submissionSummaries.sort((left, right) => {
    const leftDate = new Date(left.latest_submitted_at || left.submitted_at || 0).getTime();
    const rightDate = new Date(right.latest_submitted_at || right.submitted_at || 0).getTime();
    return rightDate - leftDate;
  });

  const today = new Date();
  const activityChart = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const current = new Date(today);
    current.setHours(0, 0, 0, 0);
    current.setDate(current.getDate() - offset);
    activityChart.push({
      iso: current.toISOString().slice(0, 10),
      label: formatChartLabel(current),
      submissions: 0,
      module_completions: 0
    });
  }
  const chartByDay = new Map(activityChart.map((row) => [row.iso, row]));
  for (const row of progressRows) {
    if (!row.lastAccessed || !row.completed) continue;
    const chartPoint = chartByDay.get(new Date(row.lastAccessed).toISOString().slice(0, 10));
    if (chartPoint) {
      chartPoint.module_completions += 1;
    }
  }
  for (const submission of submissions) {
    const latestAttempt = getLastAttempt(submission);
    const submittedAt = latestAttempt?.submittedAt || submission.submittedAt;
    if (!submittedAt) continue;
    const chartPoint = chartByDay.get(new Date(submittedAt).toISOString().slice(0, 10));
    if (chartPoint) {
      chartPoint.submissions += 1;
    }
  }

  return {
    student,
    overview: {
      batch_count: batchSummaries.length,
      module_count: dashboardModules.length,
      completed_module_count: dashboardModules.filter((item) => item.completed).length,
      pending_module_count: dashboardModules.filter((item) => !item.completed).length,
      average_progress_percent: average(dashboardModules.map((item) => item.progress_percent)),
      submission_count: submissionSummaries.length,
      reviewed_submission_count: submissionSummaries.filter((item) => item.review_status === "reviewed").length
    },
    activity_chart: activityChart.map(({ iso, ...row }) => row),
    batches: batchSummaries,
    modules: dashboardModules,
    submissions: submissionSummaries
  };
};

const submitContent = async (payload, user, tenant) => {
  const instituteId = getInstituteId(user, tenant);
  if (!instituteId) {
    throw new AppError("User institute is not configured.", 403);
  }

  const content = await Content.findById(payload.content_id);
  if (!content) throw new AppError("Content not found.", 400);

  const batch = await Batch.findById(content.batchId);
  if (!batch) throw new AppError("Content not found.", 400);

  const assignments = await UserBatch.find({
    userId: user._id,
    instituteId,
    batchId: batch._id,
    active: true
  });
  if (!assignments.length) {
    throw new AppError("Content access denied.", 400);
  }

  const existingSubmission = await StudentSubmission.findOne({
    userId: user._id,
    instituteId,
    contentId: payload.content_id
  });

  if (content.type === "quiz") {
    const quiz = resolveQuizFromContent(content);
    if (!quiz) {
      throw new AppError("Quiz details are missing for this assessment.", 400);
    }

    const attemptLimit = Number(quiz.attemptLimit || 1) || 1;
    const currentAttemptCount = existingSubmission?.attempts?.length || 0;
    if (currentAttemptCount >= attemptLimit) {
      throw new AppError(`This quiz allows only ${attemptLimit} attempt${attemptLimit > 1 ? "s" : ""}.`, 400);
    }

    const attemptNumber = currentAttemptCount + 1;

    if (quiz.renderer?.kind === "tecai_reading") {
      if (!(payload.response_text || "").trim()) {
        throw new AppError("Exam answers are missing for this submission.", 400);
      }

      const attempt = {
        attemptNumber,
        responseType: "quiz",
        responseText: payload.response_text,
        responseUrl: null,
        answers: [],
        autoScore: 0,
        awardedMarks: null,
        maxScore: 0,
        status: "submitted",
        feedback: null,
        reviewedAt: null,
        reviewedBy: null,
        submittedAt: new Date()
      };

      const submission = existingSubmission || new StudentSubmission({
        instituteId,
        contentId: payload.content_id,
        userId: user._id
      });

      submission.responseType = "quiz";
      submission.responseText = payload.response_text;
      submission.responseUrl = null;
      submission.submissionKind = "quiz";
      submission.attempts = [...(submission.attempts || []), attempt];
      submission.latestAttemptNumber = attemptNumber;
      submission.latestAutoScore = 0;
      submission.latestAwardedMarks = null;
      submission.maxScore = 0;
      submission.reviewStatus = "pending";
      submission.feedback = null;
      submission.reviewedAt = null;
      submission.reviewedBy = null;
      submission.submittedAt = attempt.submittedAt;
      await submission.save();
      return serializeStudentSubmission(submission);
    }

    const grading = gradeQuizSubmission(quiz, payload.answers || []);
    const attempt = {
      attemptNumber,
      responseType: "quiz",
      responseText: null,
      responseUrl: null,
      answers: grading.answers,
      autoScore: grading.autoScore,
      awardedMarks: grading.requiresManualReview ? null : grading.autoScore,
      maxScore: grading.maxScore,
      status: grading.requiresManualReview ? "submitted" : "reviewed",
      feedback: null,
      reviewedAt: grading.requiresManualReview ? null : new Date(),
      reviewedBy: null,
      submittedAt: new Date()
    };

    const submission = existingSubmission || new StudentSubmission({
      instituteId,
      contentId: payload.content_id,
      userId: user._id
    });

    submission.responseType = "quiz";
    submission.responseText = null;
    submission.responseUrl = null;
    submission.submissionKind = "quiz";
    submission.attempts = [...(submission.attempts || []), attempt];
    submission.latestAttemptNumber = attemptNumber;
    submission.latestAutoScore = grading.autoScore;
    submission.latestAwardedMarks = grading.requiresManualReview ? null : grading.autoScore;
    submission.maxScore = grading.maxScore;
    submission.reviewStatus = grading.requiresManualReview ? "pending" : "reviewed";
    submission.feedback = null;
    submission.reviewedAt = grading.requiresManualReview ? null : new Date();
    submission.reviewedBy = null;
    submission.submittedAt = attempt.submittedAt;
    await submission.save();
    return serializeStudentSubmission(submission);
  }

  const attempt = {
    attemptNumber: 1,
    responseType: payload.response_type,
    responseText: payload.response_text || null,
    responseUrl: payload.response_url || null,
    answers: [],
    autoScore: 0,
    awardedMarks: null,
    maxScore: 0,
    status: "submitted",
    feedback: null,
    reviewedAt: null,
    reviewedBy: null,
    submittedAt: new Date()
  };

  const submission = existingSubmission || new StudentSubmission({
    instituteId,
    contentId: payload.content_id,
    userId: user._id
  });
  submission.responseType = payload.response_type;
  submission.responseText = payload.response_text || null;
  submission.responseUrl = payload.response_url || null;
  submission.submissionKind = "activity";
  submission.attempts = [attempt];
  submission.latestAttemptNumber = 1;
  submission.latestAutoScore = 0;
  submission.latestAwardedMarks = null;
  submission.maxScore = 0;
  submission.reviewStatus = "pending";
  submission.feedback = null;
  submission.reviewedAt = null;
  submission.reviewedBy = null;
  submission.submittedAt = attempt.submittedAt;
  await submission.save();

  return serializeStudentSubmission(submission);
};

module.exports = {
  getEnrolledCourses,
  getModulesContent,
  getStudentBatches,
  getDashboard,
  getBatchWorkspace,
  submitContent
};
