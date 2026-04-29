const Batch = require("../models/Batch");
const Content = require("../models/Content");
const Module = require("../models/Module");
const UserProgress = require("../models/Progress");
const StudentSubmission = require("../models/StudentSubmission");
const { UserBatch, UserCourse, UserModule } = require("../models/Enrollment");
const AppError = require("../utils/AppError");
const { serializeContent, serializeStudentSubmission } = require("../utils/serializers");

const getInstituteId = (user, tenant) => tenant?.instituteId || user?.instituteId || null;
const average = (values) =>
  values.length ? Math.round(values.reduce((sum, value) => sum + Number(value || 0), 0) / values.length) : 0;

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
        content: contents.map(serializeContent)
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
      ...serializeContent(content),
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
        average_progress_percent: 0
      },
      batches: [],
      modules: []
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
        .select("moduleId batchId title duration")
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
  const dashboardModules = [];
  const batchSummaries = [];

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

  return {
    student,
    overview: {
      batch_count: batchSummaries.length,
      module_count: dashboardModules.length,
      completed_module_count: dashboardModules.filter((item) => item.completed).length,
      pending_module_count: dashboardModules.filter((item) => !item.completed).length,
      average_progress_percent: average(dashboardModules.map((item) => item.progress_percent))
    },
    batches: batchSummaries,
    modules: dashboardModules
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

  const submission = await StudentSubmission.findOneAndUpdate(
    {
      userId: user._id,
      instituteId,
      contentId: payload.content_id
    },
    {
      responseType: payload.response_type,
      responseText: payload.response_text,
      responseUrl: payload.response_url,
      submittedAt: new Date()
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

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
