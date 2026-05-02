const Batch = require("../models/Batch");
const Content = require("../models/Content");
const Module = require("../models/Module");
const StudentSubmission = require("../models/StudentSubmission");
const AppError = require("../utils/AppError");
const {
  asId,
  hasRole,
  resolveInstituteScope,
  getTeacherScope,
  getStudentBatchScope,
  sameId
} = require("./accessService");
const { uploadFile, deleteFile } = require("./storageService");
const { normalizeQuizPayload, validateQuizDefinition } = require("../utils/quiz");
const { buildTecaiQuizFromDocx, sanitizeRenderer } = require("../utils/tecaiReading");
const { serializeContent, serializeStudentSubmission } = require("../utils/serializers");

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

const assertBatchModuleLink = (batch, moduleItem) => {
  if (
    !sameId(batch.instituteId, moduleItem.instituteId) ||
    !sameId(batch.courseId, moduleItem.courseId) ||
    !sameId(batch.subcourseId, moduleItem.subcourseId)
  ) {
    throw new AppError("Selected module does not belong to the selected batch course path.", 400);
  }
};

const assertBatchAccess = async ({ currentUser, instituteId, batch, forWrite }) => {
  if (hasRole(currentUser, "super_admin")) return;
  if (!sameId(batch.instituteId, instituteId)) {
    throw new AppError("Batch not found.", 404);
  }
  if (hasRole(currentUser, "institute_admin")) return;

  if (hasRole(currentUser, "teacher")) {
    const teacherScope = await getTeacherScope(currentUser._id, instituteId);
    if (!teacherScope.batchIds.has(asId(batch._id))) {
      throw new AppError("Teachers can only access content for their assigned batches.", 403);
    }
    return;
  }

  if (!forWrite && hasRole(currentUser, "student")) {
    const studentScope = await getStudentBatchScope(currentUser._id, instituteId);
    if (!studentScope.batchIds.has(asId(batch._id))) {
      throw new AppError("Students can only access content for their assigned batches.", 403);
    }
    return;
  }

  throw new AppError("Not enough privileges.", 403);
};

const assertContentWriteAccess = async (currentUser, instituteId, batch, content) => {
  if (hasRole(currentUser, "super_admin", "institute_admin")) return;
  if (hasRole(currentUser, "teacher") && sameId(content.createdBy, currentUser._id)) {
    await assertBatchAccess({
      currentUser,
      instituteId,
      batch,
      forWrite: true
    });
    return;
  }
  throw new AppError("Only admins or the creating teacher can modify this content.", 403);
};

const validateContentState = ({ contentType, description, fileUrl, externalUrl, quiz }) => {
  if (contentType === "text" && fileUrl) {
    throw new AppError("Text content cannot include uploaded files.", 400);
  }
  if (["video", "audio", "pdf", "document"].includes(contentType) && !(fileUrl || externalUrl)) {
    throw new AppError("File content requires either an uploaded file or an external URL.", 400);
  }
  if (contentType === "quiz") {
    if (!quiz) {
      throw new AppError("Quiz content requires a generated DOCX source or quiz payload.", 400);
    }
    validateQuizDefinition(quiz);
  } else if (contentType === "text" && !((description || "").trim() || externalUrl)) {
    throw new AppError("Text content requires a description or an external URL.", 400);
  }
};

const buildContentUploadSegments = (instituteId, batchId, moduleId) => [
  "institutes",
  instituteId,
  "batches",
  batchId,
  "modules",
  moduleId
];

const previewQuiz = async (file) => {
  const quiz = await buildTecaiQuizFromDocx(file);
  return {
    mode: quiz.mode,
    attempt_limit: quiz.attemptLimit ?? 999,
    questions: (quiz.questions || []).map((question) => ({
      question_id: question.questionId,
      type: question.type,
      prompt: question.prompt,
      options: (question.options || []).map((option) => ({
        option_id: option.optionId,
        text: option.text
      })),
      correct_option_id: question.correctOptionId ?? null,
      reference_answer: question.referenceAnswer ?? null,
      max_marks: question.maxMarks ?? 1
    })),
    renderer: sanitizeRenderer(quiz.renderer)
  };
};

const getTecaiExamData = async (contentId, tenant, currentUser) => {
  const content = await Content.findById(contentId);
  if (!content) {
    throw new AppError("Content not found.", 404);
  }

  const moduleItem = await getModuleOrThrow(content.moduleId);
  const batch = await getBatchOrThrow(content.batchId);
  assertBatchModuleLink(batch, moduleItem);
  await assertBatchAccess({
    currentUser,
    instituteId: asId(content.instituteId),
    batch,
    forWrite: false
  });

  if (content.type !== "quiz") {
    throw new AppError("This content is not a quiz.", 400);
  }

  const renderer = sanitizeRenderer(content.profile?.quiz?.renderer);
  if (!renderer) {
    throw new AppError("TECAI exam data is not configured for this quiz.", 400);
  }

  let submission;
  if (hasRole(currentUser, "student")) {
    const existingSubmission = await StudentSubmission.findOne({
      instituteId: content.instituteId,
      contentId: content._id,
      userId: currentUser._id
    });
    submission = existingSubmission ? serializeStudentSubmission(existingSubmission) : null;
  }

  return {
    content: serializeContent(content, { includeQuizAnswers: false }),
    renderer,
    submission
  };
};

const createContent = async (payload, file, tenant, user) => {
  const instituteId = await resolveInstituteScope({
    requestedInstituteId: payload.institute_id,
    tenant,
    currentUser: user
  });
  const moduleItem = await getModuleOrThrow(payload.module_id);
  const batch = await getBatchOrThrow(payload.batch_id);
  assertBatchModuleLink(batch, moduleItem);
  await assertBatchAccess({ currentUser: user, instituteId, batch, forWrite: true });

  const upload = file
    ? await uploadFile(file, buildContentUploadSegments(instituteId, payload.batch_id, payload.module_id))
    : null;
  try {
    let quiz = null;
    if (payload.type === "quiz") {
      quiz = file ? await buildTecaiQuizFromDocx(file) : normalizeQuizPayload(payload.quiz_payload);
    }
    validateContentState({
      contentType: payload.type,
      description: payload.description,
      fileUrl: upload?.fileUrl || null,
      externalUrl: payload.external_url,
      quiz
    });

    const content = await Content.create({
      instituteId,
      moduleId: payload.module_id,
      batchId: payload.batch_id,
      createdBy: user._id,
      title: payload.title,
      type: payload.type,
      description: payload.description,
      externalUrl: payload.external_url,
      orderIndex: payload.order_index,
      duration: payload.duration,
      fileUrl: upload?.fileUrl,
      storageKey: upload?.storageKey,
      profile: {
        category: payload.category,
        instructions: payload.instructions,
        downloadable: payload.downloadable,
        responseType: payload.response_type,
        quiz
      }
    });

    return serializeContent(content, { includeQuizAnswers: true });
  } catch (error) {
    if (upload?.storageKey) {
      await deleteFile(upload.storageKey);
    }
    throw error;
  }
};

const listModuleContents = async (moduleId, batchId, tenant, currentUser) => {
  if (!batchId) throw new AppError("batch_id is required.", 400);

  const moduleItem = await getModuleOrThrow(moduleId);
  const batch = await getBatchOrThrow(batchId);
  assertBatchModuleLink(batch, moduleItem);
  await assertBatchAccess({
    currentUser,
    instituteId: tenant.instituteId,
    batch,
    forWrite: false
  });

  const contents = await Content.find({
    moduleId: moduleItem._id,
    batchId: batch._id,
    instituteId: batch.instituteId
  }).sort({ orderIndex: 1, createdAt: 1, _id: 1 });

  return contents.map((content) => serializeContent(content, { includeQuizAnswers: true }));
};

const updateContent = async (id, payload, file, tenant, currentUser) => {
  const content = await Content.findById(id);
  if (!content) throw new AppError("Content not found.", 404);

  const instituteId = await resolveInstituteScope({
    requestedInstituteId: payload.institute_id,
    tenant,
    currentUser
  });
  if (!sameId(content.instituteId, instituteId)) {
    throw new AppError("Content not found.", 404);
  }

  const moduleItem = await getModuleOrThrow(content.moduleId);
  const batch = await getBatchOrThrow(content.batchId);
  assertBatchModuleLink(batch, moduleItem);
  if (payload.batch_id && !sameId(payload.batch_id, content.batchId)) {
    throw new AppError("Content cannot be moved to another batch through update.", 400);
  }

  await assertContentWriteAccess(currentUser, instituteId, batch, content);

  const uploaded = file
    ? await uploadFile(file, buildContentUploadSegments(instituteId, asId(batch._id), asId(moduleItem._id)))
    : null;
  const nextFileUrl = uploaded ? uploaded.fileUrl : payload.replace_file ? null : content.fileUrl;
  const nextStorageKey = uploaded ? uploaded.storageKey : payload.replace_file ? null : content.storageKey;
  const nextExternalUrl =
    payload.external_url !== undefined ? payload.external_url || null : content.externalUrl;
  const nextType = payload.type ?? content.type;
  const nextDescription = payload.description ?? content.description;
  const nextQuiz =
    nextType === "quiz"
      ? file
        ? await buildTecaiQuizFromDocx(file)
        : normalizeQuizPayload(payload.quiz_payload !== undefined ? payload.quiz_payload : content.profile?.quiz || null)
      : null;

  try {
    validateContentState({
      contentType: nextType,
      description: nextDescription,
      fileUrl: nextFileUrl,
      externalUrl: nextExternalUrl,
      quiz: nextQuiz
    });
  } catch (error) {
    if (uploaded?.storageKey) {
      await deleteFile(uploaded.storageKey);
    }
    throw error;
  }

  const oldStorageKey = content.storageKey;
  if (!content.profile) {
    content.profile = {};
  }
  content.title = payload.title ?? content.title;
  content.type = nextType;
  content.description = nextDescription;
  content.externalUrl = nextExternalUrl;
  content.orderIndex = payload.order_index ?? content.orderIndex;
  content.duration = payload.duration ?? content.duration;
  content.fileUrl = nextFileUrl;
  content.storageKey = nextStorageKey;
  content.profile.category = payload.category ?? content.profile.category;
  if (payload.instructions !== undefined) content.profile.instructions = payload.instructions;
  if (payload.downloadable !== undefined) content.profile.downloadable = payload.downloadable;
  if (payload.response_type !== undefined) content.profile.responseType = payload.response_type;
  content.profile.quiz = nextQuiz;

  await content.save();
  if ((uploaded || payload.replace_file) && oldStorageKey && oldStorageKey !== nextStorageKey) {
    await deleteFile(oldStorageKey);
  }

  return serializeContent(content, { includeQuizAnswers: true });
};

const deleteContent = async (id, tenant, currentUser) => {
  const content = await Content.findById(id);
  if (!content) throw new AppError("Content not found.", 404);

  if (!hasRole(currentUser, "super_admin") && !sameId(content.instituteId, tenant.instituteId)) {
    throw new AppError("Content not found.", 404);
  }

  const batch = await getBatchOrThrow(content.batchId);
  await assertContentWriteAccess(currentUser, tenant.instituteId, batch, content);
  await deleteFile(content.storageKey);
  await Content.findByIdAndDelete(id);
};

module.exports = {
  createContent,
  previewQuiz,
  getTecaiExamData,
  listModuleContents,
  updateContent,
  deleteContent
};
