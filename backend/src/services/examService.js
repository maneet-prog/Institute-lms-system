const Batch = require("../models/Batch");
const Content = require("../models/Content");
const Course = require("../models/Course");
const Module = require("../models/Module");
const StudentSubmission = require("../models/StudentSubmission");
const Subcourse = require("../models/Subcourse");
const AppError = require("../utils/AppError");
const {
  asId,
  hasRole,
  sameId,
  getTeacherScope,
  getStudentBatchScope,
  getStudentEnrollmentScope
} = require("./accessService");
const {
  serializeContent,
  serializeCourse,
  serializeModule,
  serializeSubcourse,
  serializeStudentSubmission
} = require("../utils/serializers");
const { sanitizeRenderer, TECAI_WRITING_KIND, DEFAULT_TIMER_SECONDS } = require("../utils/tecaiReading");

const ensureArray = (value) => (Array.isArray(value) ? value : []);

const buildWritingRendererFromExam = (content) => {
  const exam = content?.profile?.exam;
  if (!exam || exam.rendererKind !== TECAI_WRITING_KIND || !exam.parts?.length) {
    return null;
  }

  return {
    kind: TECAI_WRITING_KIND,
    timer_seconds: Number(exam.timerSeconds || DEFAULT_TIMER_SECONDS) || DEFAULT_TIMER_SECONDS,
    instructions: content.profile?.instructions || "",
    parts: exam.parts.map((part, index) => ({
      part_id: String(part.partId || `part-${index + 1}`),
      title: String(part.title || `Task ${index + 1}`),
      kind: String(part.kind || "task"),
      instructions: part.instructions || "",
      prompt_html:
        part.answerData?.prompt_html ||
        part.answerData?.promptHtml ||
        ensureArray(part.resources).find((resource) => resource.type === "html")?.content ||
        "",
      prompt_text:
        part.answerData?.prompt_text ||
        part.answerData?.promptText ||
        ensureArray(part.questions)
          .map((question) => question.prompt)
          .filter(Boolean)
          .join("\n\n"),
      minimum_words: Math.max(
        0,
        Number(part.answerData?.minimum_words || part.answerData?.minimumWords || 0) || 0
      ),
      placeholder: part.answerData?.placeholder || "Start writing your response here...",
      resources: ensureArray(part.resources).map((resource, resourceIndex) => ({
        asset_id: String(resource.assetId || `asset-${index + 1}-${resourceIndex + 1}`),
        type: String(resource.type || "text"),
        title: resource.title || "",
        url: resource.url || "",
        content: resource.content || ""
      }))
    }))
  };
};

const getRenderer = (content) =>
  sanitizeRenderer(content?.profile?.quiz?.renderer) || buildWritingRendererFromExam(content);
const isContentVisibleToStudent = (content, userId) =>
  content.visibilityScope !== "selected_students" ||
  (content.assignedStudentIds || []).some((studentId) => String(studentId) === String(userId));

const getCourseOrThrow = async (courseId) => {
  const course = await Course.findById(courseId);
  if (!course) throw new AppError("Course not found.", 404);
  return course;
};

const getExamTypeOrThrow = async (examTypeId) => {
  const examType = await Subcourse.findById(examTypeId);
  if (!examType) throw new AppError("Exam type not found.", 404);
  return examType;
};

const getModuleOrThrow = async (moduleId) => {
  const moduleItem = await Module.findById(moduleId);
  if (!moduleItem) throw new AppError("Module not found.", 404);
  return moduleItem;
};

const getBatchOrThrow = async (batchId) => {
  const batch = await Batch.findById(batchId);
  if (!batch) throw new AppError("Batch not found.", 404);
  return batch;
};

const assertCoursePath = ({ course, examType, moduleItem }) => {
  if (!sameId(examType.courseId, course._id)) {
    throw new AppError("Exam type does not belong to the selected course.", 400);
  }
  if (!sameId(moduleItem.courseId, course._id) || !sameId(moduleItem.subcourseId, examType._id)) {
    throw new AppError("Module does not belong to the selected course/exam type path.", 400);
  }
};

const assertBatchPath = ({ batch, course, examType }) => {
  if (!sameId(batch.courseId, course._id) || !sameId(batch.subcourseId, examType._id)) {
    throw new AppError("Batch does not belong to the selected course/exam type path.", 400);
  }
};

const assertPathAccess = async ({ currentUser, instituteId, course, examType, batch }) => {
  if (hasRole(currentUser, "super_admin")) return;
  if (!sameId(course.instituteId, instituteId) || !sameId(examType.instituteId, instituteId)) {
    throw new AppError("Requested exam path is outside your institute.", 403);
  }
  if (hasRole(currentUser, "institute_admin")) return;

  const pairKey = `${asId(course._id)}::${asId(examType._id)}`;

  if (hasRole(currentUser, "teacher")) {
    const teacherScope = await getTeacherScope(currentUser._id, instituteId);
    if (batch) {
      if (!teacherScope.batchIds.has(asId(batch._id))) {
        throw new AppError("Teachers can only access exams for their assigned batches.", 403);
      }
      return;
    }
    if (!teacherScope.coursePairs.has(pairKey)) {
      throw new AppError("Teachers can only access exams in their assigned course paths.", 403);
    }
    return;
  }

  if (hasRole(currentUser, "student")) {
    const studentBatchScope = await getStudentBatchScope(currentUser._id, instituteId);
    if (batch) {
      if (!studentBatchScope.batchIds.has(asId(batch._id))) {
        throw new AppError("Students can only access exams for their assigned batches.", 403);
      }
      return;
    }
    if (studentBatchScope.coursePairs.has(pairKey)) {
      return;
    }
    const enrollmentScope = await getStudentEnrollmentScope(currentUser._id, instituteId);
    if (!enrollmentScope.coursePairs.has(pairKey)) {
      throw new AppError("Students can only access exams in their enrolled course paths.", 403);
    }
    return;
  }

  throw new AppError("Not enough privileges.", 403);
};

const resolveCourseModuleExam = async ({ courseId, examTypeId, moduleId, batchId, contentId }, currentUser, tenant) => {
  const course = await getCourseOrThrow(courseId);
  const examType = await getExamTypeOrThrow(examTypeId);
  const moduleItem = await getModuleOrThrow(moduleId);
  assertCoursePath({ course, examType, moduleItem });

  const batch = batchId ? await getBatchOrThrow(batchId) : null;
  if (batch) {
    assertBatchPath({ batch, course, examType });
  }

  await assertPathAccess({
    currentUser,
    instituteId: tenant?.instituteId || course.instituteId,
    course,
    examType,
    batch
  });

  const query = {
    instituteId: course.instituteId,
    moduleId: moduleItem._id,
    type: "quiz",
    active: true
  };

  if (batch) {
    query.batchId = batch._id;
  }
  if (contentId) {
    query._id = contentId;
  }

  const contents = await Content.find(query).sort({ orderIndex: 1, createdAt: -1, _id: -1 });
  const visibleContents = hasRole(currentUser, "student")
    ? contents.filter((item) => isContentVisibleToStudent(item, currentUser._id))
    : contents;
  const content = visibleContents.find((item) => Boolean(getRenderer(item)));
  if (!content) {
    throw new AppError("No exam renderer is configured for this course/exam/module path yet.", 404);
  }

  let submission = null;
  if (hasRole(currentUser, "student")) {
    const existing = await StudentSubmission.findOne({
      instituteId: content.instituteId,
      contentId: content._id,
      userId: currentUser._id
    });
    submission = existing ? serializeStudentSubmission(existing) : null;
  }

  return {
    route: {
      course_id: asId(course._id),
      exam_type_id: asId(examType._id),
      module_id: asId(moduleItem._id),
      batch_id: asId(content.batchId),
      content_id: asId(content._id)
    },
    course: serializeCourse(course),
    exam_type: serializeSubcourse(examType),
    module: serializeModule(moduleItem),
    content: serializeContent(content, { includeQuizAnswers: false }),
    renderer: getRenderer(content),
    submission,
    student_name: currentUser ? `${currentUser.firstName} ${currentUser.lastName}`.trim() : "Student"
  };
};

const listExamSubmissions = async ({ batchId, courseId, examTypeId, moduleId, contentId, userId }, currentUser, tenant) => {
  const instituteId = tenant?.instituteId || currentUser?.instituteId;
  if (!instituteId) {
    throw new AppError("User institute is not configured.", 403);
  }

  let accessibleBatchIds = null;
  if (hasRole(currentUser, "teacher")) {
    accessibleBatchIds = [...(await getTeacherScope(currentUser._id, instituteId)).batchIds];
  } else if (!hasRole(currentUser, "super_admin", "institute_admin")) {
    throw new AppError("Not enough privileges for submissions.", 403);
  }

  const contentQuery = {
    instituteId,
    type: "quiz",
    active: true
  };

  if (batchId) contentQuery.batchId = batchId;
  if (moduleId) contentQuery.moduleId = moduleId;
  if (contentId) contentQuery._id = contentId;
  if (accessibleBatchIds) {
    contentQuery.batchId = batchId || { $in: accessibleBatchIds };
  }

  const contents = await Content.find(contentQuery).populate("moduleId").lean();
  const examContents = contents.filter((content) => Boolean(getRenderer(content)));
  if (!examContents.length) {
    return [];
  }

  const filteredContentIds = examContents
    .filter((content) => {
      if (courseId && !sameId(content.moduleId?.courseId, courseId)) return false;
      if (examTypeId && !sameId(content.moduleId?.subcourseId, examTypeId)) return false;
      return true;
    })
    .map((content) => content._id);

  if (!filteredContentIds.length) {
    return [];
  }

  const submissions = await StudentSubmission.find({
    instituteId,
    contentId: { $in: filteredContentIds },
    ...(userId ? { userId } : {})
  }).populate("userId");

  const contentById = new Map(examContents.map((content) => [String(content._id), content]));
  const courseIds = [...new Set(examContents.map((content) => asId(content.moduleId?.courseId)).filter(Boolean))];
  const examTypeIds = [...new Set(examContents.map((content) => asId(content.moduleId?.subcourseId)).filter(Boolean))];
  const courseById = new Map((await Course.find({ _id: { $in: courseIds } }).lean()).map((course) => [String(course._id), course]));
  const examTypeById = new Map((await Subcourse.find({ _id: { $in: examTypeIds } }).lean()).map((item) => [String(item._id), item]));

  return submissions
    .map((submission) => {
      const content = contentById.get(String(submission.contentId));
      if (!content) return null;
      const moduleItem = content.moduleId;
      const course = courseById.get(asId(moduleItem?.courseId));
      const examType = examTypeById.get(asId(moduleItem?.subcourseId));
      const latestAttempt = submission.attempts?.length ? submission.attempts[submission.attempts.length - 1] : null;

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
        course: course ? serializeCourse(course) : null,
        exam_type: examType ? serializeSubcourse(examType) : null,
        module: moduleItem ? serializeModule(moduleItem) : null,
        content: {
          content_id: String(content._id),
          title: content.title,
          category: content.profile?.category || "reading"
        },
        latest_submitted_at: latestAttempt?.submittedAt || submission.submittedAt
      };
    })
    .filter(Boolean)
    .sort((left, right) => new Date(right.latest_submitted_at).getTime() - new Date(left.latest_submitted_at).getTime());
};

module.exports = {
  resolveCourseModuleExam,
  listExamSubmissions
};
