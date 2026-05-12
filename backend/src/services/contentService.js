const Batch = require("../models/Batch");
const Content = require("../models/Content");
const Module = require("../models/Module");
const User = require("../models/User");
const UserProgress = require("../models/Progress");
const StudentSubmission = require("../models/StudentSubmission");
const { UserBatch } = require("../models/Enrollment");
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
const { validateQuizDefinition } = require("../utils/quiz");
const {
  buildTecaiWritingRenderer,
  sanitizeRenderer,
  TECAI_READING_KIND,
  TECAI_WRITING_KIND,
  TECAI_LISTENING_KIND,
  DEFAULT_TIMER_SECONDS
} = require("../utils/tecaiReading");
const { serializeContent, serializeStudentSubmission } = require("../utils/serializers");
const { isContentVisibleToStudent } = require("./contentVisibilityService");
const { recalculateModuleProgress } = require("./progressTrackingService");

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
    if (!quiz && !fileUrl && !externalUrl) {
      throw new AppError("Quiz content requires an uploaded file, an external URL, or a quiz payload.", 400);
    }
    if (quiz) {
      validateQuizDefinition(quiz);
      if (quiz.renderer?.kind === TECAI_LISTENING_KIND) {
        if (!fileUrl || !externalUrl) {
          throw new AppError("Listening exams require both an uploaded prompt file and an audio link.", 400);
        }
      }
    }
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

const buildReusableUploadSegments = (instituteId, moduleId) => [
  "institutes",
  instituteId,
  "content-library",
  "modules",
  moduleId
];

const parseOptionalJson = (value, label) => {
  if (value == null || value === "") {
    return null;
  }
  if (typeof value !== "string") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    throw new AppError(`${label} must be valid JSON.`, 400);
  }
};

const ensureArray = (value) => (Array.isArray(value) ? value : []);

const cloneValue = (value) => (value == null ? value : JSON.parse(JSON.stringify(value)));

const inferModuleCategory = (moduleItem) => {
  const explicitType = moduleItem?.examType;
  if (explicitType && ["reading", "writing", "listening", "speaking", "general"].includes(explicitType)) {
    return explicitType;
  }

  const normalized = String(moduleItem?.moduleName || "").trim().toLowerCase();
  if (normalized.includes("reading")) return "reading";
  if (normalized.includes("writing")) return "writing";
  if (normalized.includes("listening") || normalized.includes("listing")) return "listening";
  if (normalized.includes("speaking") || normalized.includes("spoken")) return "speaking";
  return "general";
};

const parseIdList = (value) => {
  if (value == null || value === "") {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map(String).map((item) => item.trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return [];
    }

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map(String).map((item) => item.trim()).filter(Boolean);
      }
    } catch (error) {
      return trimmed
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return [];
};

const ensureReusableContentAccess = (currentUser, instituteId) => {
  if (hasRole(currentUser, "super_admin")) return;
  if (hasRole(currentUser, "institute_admin") && sameId(currentUser.instituteId, instituteId)) return;
  throw new AppError("Only admins can manage reusable content.", 403);
};

const deleteStorageKeyIfUnused = async (storageKey, excludedId = null) => {
  if (!storageKey) return;

  const existing = await Content.findOne({
    _id: excludedId ? { $ne: excludedId } : { $exists: true },
    storageKey,
    active: true
  })
    .select("_id")
    .lean();

  if (!existing) {
    await deleteFile(storageKey);
  }
};

const resolveAssignedStudents = async ({ payload, batch, instituteId }) => {
  const requestedIds = parseIdList(payload.assigned_student_ids);
  const requestedScope = payload.visibility_scope || (requestedIds.length ? "selected_students" : "batch");

  if (requestedScope !== "selected_students") {
    return {
      visibilityScope: "batch",
      assignedStudentIds: []
    };
  }

  if (!requestedIds.length) {
    throw new AppError("Select at least one student when content visibility is limited to specific students.", 400);
  }

  const batchAssignments = await UserBatch.find({
    instituteId,
    batchId: batch._id,
    userId: { $in: requestedIds },
    active: true
  })
    .select("userId")
    .lean();

  const assignedStudentIds = batchAssignments.map((row) => asId(row.userId));
  if (assignedStudentIds.length !== requestedIds.length) {
    throw new AppError("Selected student assignments must belong to the chosen batch.", 400);
  }

  return {
    visibilityScope: "selected_students",
    assignedStudentIds
  };
};

const normalizeExamAsset = (asset, index) => ({
  assetId: String(asset?.asset_id || asset?.assetId || `asset-${index + 1}`),
  type: String(asset?.type || "text"),
  title: asset?.title ? String(asset.title) : null,
  url: asset?.url ? String(asset.url) : null,
  storageKey: asset?.storage_key || asset?.storageKey || null,
  content: asset?.content ? String(asset.content) : null,
  mimeType: asset?.mime_type || asset?.mimeType || null,
  meta: asset?.meta || null
});

const normalizePartQuestion = (question, index) => ({
  questionId: String(question?.question_id || question?.questionId || `question-${index + 1}`),
  type: String(question?.type || "written"),
  prompt: String(question?.prompt || ""),
  instructions: question?.instructions ? String(question.instructions) : null,
  options: ensureArray(question?.options).map((option, optionIndex) => ({
    optionId: String(option?.option_id || option?.optionId || `option-${index + 1}-${optionIndex + 1}`),
    text: String(option?.text || "")
  })),
  answerData: question?.answer_data || question?.answerData || null,
  answerKey: question?.answer_key || question?.answerKey || null,
  maxMarks: Math.max(0, Number(question?.max_marks || question?.maxMarks || 0) || 0),
  orderIndex: Number(question?.order_index || question?.orderIndex || index) || index
});

const normalizeExamParts = (parts) =>
  ensureArray(parts).map((part, index) => ({
    partId: String(part?.part_id || part?.partId || `part-${index + 1}`),
    title: String(part?.title || `Part ${index + 1}`),
    kind: String(part?.kind || "part"),
    instructions: part?.instructions ? String(part.instructions) : null,
    timerSeconds: Math.max(0, Number(part?.timer_seconds || part?.timerSeconds || 0) || 0),
    passages: ensureArray(part?.passages).map(normalizeExamAsset),
    audio: ensureArray(part?.audio).map(normalizeExamAsset),
    images: ensureArray(part?.images).map(normalizeExamAsset),
    resources: ensureArray(part?.resources).map(normalizeExamAsset),
    questions: ensureArray(part?.questions).map(normalizePartQuestion),
    answerData: part?.answer_data || part?.answerData || null,
    orderIndex: Number(part?.order_index || part?.orderIndex || index) || index
  }));

const buildWritingRenderer = ({ instructions, timerSeconds, parts }) => ({
  kind: TECAI_WRITING_KIND,
  timer_seconds: Math.max(0, Number(timerSeconds || DEFAULT_TIMER_SECONDS) || DEFAULT_TIMER_SECONDS),
  instructions: instructions || "",
  parts: parts.map((part) => ({
    part_id: part.partId,
    title: part.title,
    kind: part.kind || "task",
    instructions: part.instructions || "",
    prompt_html:
      part.answerData?.prompt_html ||
      part.answerData?.promptHtml ||
      part.resources.find((resource) => resource.type === "html")?.content ||
      "",
    prompt_text:
      part.answerData?.prompt_text ||
      part.answerData?.promptText ||
      part.questions.map((question) => question.prompt).filter(Boolean).join("\n\n"),
    minimum_words: Math.max(
      0,
      Number(part.answerData?.minimum_words || part.answerData?.minimumWords || 0) || 0
    ),
    placeholder:
      part.answerData?.placeholder || "Start writing your response here...",
    resources: part.resources.map((resource) => ({
      asset_id: resource.assetId,
      type: resource.type,
      title: resource.title || "",
      url: resource.url || "",
      content: resource.content || ""
    }))
  }))
});

const buildReadingRenderer = ({ timerSeconds }) => ({
  kind: TECAI_READING_KIND,
  timer_seconds: Math.max(0, Number(timerSeconds || DEFAULT_TIMER_SECONDS) || DEFAULT_TIMER_SECONDS),
  paragraphs: []
});

const buildListeningRenderer = ({ timerSeconds, audioUrl, promptFileUrl, instructions }) => ({
  kind: TECAI_LISTENING_KIND,
  timer_seconds: Math.max(0, Number(timerSeconds || DEFAULT_TIMER_SECONDS) || DEFAULT_TIMER_SECONDS),
  audio_url: audioUrl || "",
  prompt_file_url: promptFileUrl || "",
  instructions: instructions || ""
});

const buildExamProfile = ({
  payload,
  moduleItem,
  rendererKind,
  timerSeconds,
  parts
}) => ({
  examTypeId: payload.exam_type_id || moduleItem.subcourseId,
  moduleId: moduleItem._id,
  moduleCode: payload.category || moduleItem.moduleName.toLowerCase(),
  moduleLabel: moduleItem.moduleName,
  rendererKind,
  timerSeconds,
  parts,
  metadata: parseOptionalJson(payload.exam_metadata, "exam_metadata")
});

const resolveExamRenderer = (content) => {
  const sanitized = sanitizeRenderer(content.profile?.quiz?.renderer);
  if (sanitized) {
    return sanitized;
  }

  if (content.profile?.exam?.rendererKind === TECAI_WRITING_KIND && content.profile?.exam?.parts?.length) {
    return buildWritingRenderer({
      instructions: content.profile?.instructions || "",
      timerSeconds: content.profile?.exam?.timerSeconds || DEFAULT_TIMER_SECONDS,
      parts: normalizeExamParts(content.profile.exam.parts)
    });
  }

  if (content.profile?.exam?.rendererKind === TECAI_READING_KIND) {
    return buildReadingRenderer({
      timerSeconds: content.profile?.exam?.timerSeconds || DEFAULT_TIMER_SECONDS
    });
  }

  if (content.profile?.exam?.rendererKind === TECAI_LISTENING_KIND) {
    return buildListeningRenderer({
      timerSeconds: content.profile?.exam?.timerSeconds || DEFAULT_TIMER_SECONDS,
      audioUrl: content.externalUrl || "",
      promptFileUrl: content.fileUrl || "",
      instructions: content.profile?.instructions || ""
    });
  }

  return null;
};

const previewQuiz = async (file, options = {}) => {
  return {
    mode: "written",
    attempt_limit: 999,
    questions: [],
    renderer: null
  };
};

const getTecaiExamData = async (contentId, tenant, currentUser) => {
  const content = await Content.findById(contentId);
  if (!content || (!hasRole(currentUser, "super_admin", "institute_admin") && !content.active)) {
    throw new AppError("Content not found.", 404);
  }

  const moduleItem = await getModuleOrThrow(content.moduleId);
  if (content.isReusableTemplate) {
    ensureReusableContentAccess(currentUser, asId(content.instituteId));
  } else {
    const batch = await getBatchOrThrow(content.batchId);
    assertBatchModuleLink(batch, moduleItem);
    await assertBatchAccess({
      currentUser,
      instituteId: asId(content.instituteId),
      batch,
      forWrite: false
    });
  }

  if (content.type !== "quiz") {
    throw new AppError("This content is not a quiz.", 400);
  }

  if (hasRole(currentUser, "student") && !isContentVisibleToStudent(content, currentUser._id)) {
    throw new AppError("Content not found.", 404);
  }

  const renderer = resolveExamRenderer(content) || null;

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
    submission,
    student_name: currentUser ? `${currentUser.firstName} ${currentUser.lastName}`.trim() : "Student"
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
    let examProfile = null;
    const category = inferModuleCategory(moduleItem);
    const rendererKind =
      payload.renderer_kind ||
      (category === "writing"
        ? TECAI_WRITING_KIND
        : category === "reading"
          ? TECAI_READING_KIND
          : category === "listening"
            ? TECAI_LISTENING_KIND
            : "custom");
    const timerSeconds =
      Math.max(0, Number(payload.timer_seconds || 0) || 0) ||
      Math.max(0, Number(payload.duration || 0) * 60 || 0) ||
      DEFAULT_TIMER_SECONDS;
    const parsedExamParts = normalizeExamParts(parseOptionalJson(payload.exam_parts, "exam_parts"));

    if (payload.type === "quiz") {
      if (!file) {
        if (rendererKind === TECAI_WRITING_KIND || category === "writing") {
          if (!parsedExamParts.length) {
            throw new AppError("Writing exams require a DOCX file or at least one task in exam_parts.", 400);
          }
          quiz = {
            mode: "written",
            attemptLimit: Math.max(0, Number(payload.attempt_limit) || 0),
            questions: [],
            renderer: buildWritingRenderer({
              instructions: payload.instructions || "",
              timerSeconds,
              parts: parsedExamParts
            })
          };
        }
      } else if (
        !quiz &&
        (rendererKind === TECAI_READING_KIND ||
          rendererKind === TECAI_WRITING_KIND ||
          rendererKind === TECAI_LISTENING_KIND)
      ) {
        quiz = {
          mode: "written",
          attemptLimit: Math.max(1, Number(payload.attempt_limit || 999) || 999),
          questions: [],
          renderer:
            rendererKind === TECAI_READING_KIND
              ? buildReadingRenderer({ timerSeconds })
              : rendererKind === TECAI_LISTENING_KIND
                ? buildListeningRenderer({
                    timerSeconds,
                    audioUrl: payload.external_url || "",
                    promptFileUrl: upload?.fileUrl || "",
                    instructions: payload.instructions || ""
                  })
                : {
                    kind: TECAI_WRITING_KIND,
                    timer_seconds:
                      Math.max(0, Number(timerSeconds || DEFAULT_TIMER_SECONDS) || DEFAULT_TIMER_SECONDS),
                    blocks: []
                  }
        };
      }
      if (quiz && payload.attempt_limit !== undefined) {
        quiz.attemptLimit = Math.max(0, Number(payload.attempt_limit) || 0);
      }
      examProfile = buildExamProfile({
        payload,
        moduleItem,
        rendererKind: quiz?.renderer?.kind || rendererKind,
        timerSeconds: quiz?.renderer?.timer_seconds || timerSeconds,
        parts: parsedExamParts
      });
    }
    const visibility = await resolveAssignedStudents({ payload, batch, instituteId });
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
      sourceContentId: null,
      createdBy: user._id,
      title: payload.title,
      type: payload.type,
      description: payload.description,
      externalUrl: payload.external_url,
      orderIndex: payload.order_index,
      duration: payload.duration,
      fileUrl: upload?.fileUrl,
      storageKey: upload?.storageKey,
      visibilityScope: visibility.visibilityScope,
      assignedStudentIds: visibility.assignedStudentIds,
      isReusableTemplate: false,
      profile: {
        category,
        instructions: payload.instructions,
        responseType: payload.response_type,
        quiz,
        exam: examProfile
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

  const query = {
    moduleId: moduleItem._id,
    batchId: batch._id,
    instituteId: batch.instituteId,
    isReusableTemplate: false,
    active: true
  };

  const contents = await Content.find(query).sort({ orderIndex: 1, createdAt: 1, _id: 1 });
  const visibleContents = hasRole(currentUser, "student")
    ? contents.filter((content) => isContentVisibleToStudent(content, currentUser._id))
    : contents;

  return visibleContents.map((content) => serializeContent(content, { includeQuizAnswers: true }));
};

const updateContent = async (id, payload, file, tenant, currentUser) => {
  const content = await Content.findById(id);
  if (!content) throw new AppError("Content not found.", 404);
  if (content.isReusableTemplate) {
    throw new AppError("Reusable library content must be updated from the content management page.", 400);
  }

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
  const nextCategory = inferModuleCategory(moduleItem);
  const visibility =
    payload.visibility_scope !== undefined || payload.assigned_student_ids !== undefined
      ? await resolveAssignedStudents({ payload, batch, instituteId })
      : {
          visibilityScope: content.visibilityScope || "batch",
          assignedStudentIds: (content.assignedStudentIds || []).map(asId).filter(Boolean)
        };
  const nextRendererKind =
    payload.renderer_kind ||
    content.profile?.exam?.rendererKind ||
    (nextCategory === "writing"
      ? TECAI_WRITING_KIND
      : nextCategory === "reading"
        ? TECAI_READING_KIND
        : nextCategory === "listening"
          ? TECAI_LISTENING_KIND
          : "custom");
  const nextTimerSeconds =
    Math.max(0, Number(payload.timer_seconds || 0) || 0) ||
    Math.max(0, Number(payload.duration ?? content.duration ?? 0) * 60 || 0) ||
    content.profile?.exam?.timerSeconds ||
    content.profile?.quiz?.renderer?.timer_seconds ||
    DEFAULT_TIMER_SECONDS;
  const parsedExamParts = normalizeExamParts(
    parseOptionalJson(payload.exam_parts, "exam_parts") ?? content.profile?.exam?.parts ?? []
  );
  let nextQuiz =
    nextType === "quiz" && !file
      ? (nextRendererKind === TECAI_WRITING_KIND || nextCategory === "writing")
        ? parsedExamParts.length
          ? {
              mode: "written",
              attemptLimit: Math.max(0, Number(payload.attempt_limit ?? content.profile?.quiz?.attemptLimit ?? 0) || 0),
              questions: [],
              renderer: buildWritingRenderer({
                instructions:
                  payload.instructions !== undefined ? payload.instructions || "" : content.profile?.instructions || "",
                timerSeconds: nextTimerSeconds,
                parts: parsedExamParts
              })
            }
          : content.profile?.quiz || null
        : content.profile?.quiz || null
      : content.profile?.quiz || null;

  if (
    !nextQuiz &&
    nextType === "quiz" &&
    (nextRendererKind === TECAI_READING_KIND ||
      nextRendererKind === TECAI_WRITING_KIND ||
      nextRendererKind === TECAI_LISTENING_KIND) &&
    (file || content.fileUrl || (nextRendererKind === TECAI_LISTENING_KIND && nextExternalUrl))
  ) {
    nextQuiz = {
      mode: "written",
      attemptLimit: Math.max(1, Number(payload.attempt_limit ?? content.profile?.quiz?.attemptLimit ?? 999) || 999),
      questions: [],
      renderer:
        nextRendererKind === TECAI_READING_KIND
          ? buildReadingRenderer({ timerSeconds: nextTimerSeconds })
          : nextRendererKind === TECAI_LISTENING_KIND
            ? buildListeningRenderer({
                timerSeconds: nextTimerSeconds,
                audioUrl: nextExternalUrl || "",
                promptFileUrl: nextFileUrl || "",
                instructions:
                  payload.instructions !== undefined ? payload.instructions || "" : content.profile?.instructions || ""
              })
            : {
                kind: TECAI_WRITING_KIND,
                timer_seconds:
                  Math.max(0, Number(nextTimerSeconds || DEFAULT_TIMER_SECONDS) || DEFAULT_TIMER_SECONDS),
                blocks: []
              }
    };
  }

  if (
    nextType === "quiz" &&
    (nextRendererKind === TECAI_WRITING_KIND || nextCategory === "writing") &&
    !file &&
    !parsedExamParts.length &&
    !content.profile?.quiz
  ) {
    if (uploaded?.storageKey) {
      await deleteFile(uploaded.storageKey);
    }
    throw new AppError("Writing exams require a DOCX file or at least one task in exam_parts.", 400);
  }

  if (nextQuiz && payload.attempt_limit !== undefined) {
    nextQuiz.attemptLimit = Math.max(0, Number(payload.attempt_limit) || 0);
  }

  const nextExamProfile =
    nextType === "quiz"
      ? buildExamProfile({
          payload: {
            ...payload,
            exam_type_id: payload.exam_type_id || content.profile?.exam?.examTypeId || moduleItem.subcourseId,
            category: nextCategory,
            exam_metadata:
              payload.exam_metadata !== undefined
                ? payload.exam_metadata
                : JSON.stringify(content.profile?.exam?.metadata || null)
          },
          moduleItem,
          rendererKind: nextQuiz?.renderer?.kind || nextRendererKind,
          timerSeconds: nextQuiz?.renderer?.timer_seconds || nextTimerSeconds,
          parts: parsedExamParts
        })
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
  content.visibilityScope = visibility.visibilityScope;
  content.assignedStudentIds = visibility.assignedStudentIds;
  content.profile.category = nextCategory;
  if (payload.instructions !== undefined) content.profile.instructions = payload.instructions;
  if (payload.response_type !== undefined) content.profile.responseType = payload.response_type;
  content.profile.quiz = nextQuiz;
  content.profile.exam = nextExamProfile;

  await content.save();
  if ((uploaded || payload.replace_file) && oldStorageKey && oldStorageKey !== nextStorageKey) {
    await deleteStorageKeyIfUnused(oldStorageKey, content._id);
  }

  return serializeContent(content, { includeQuizAnswers: true });
};

const deleteContent = async (id, tenant, currentUser) => {
  const content = await Content.findById(id);
  if (
    !content ||
    content.isReusableTemplate ||
    (!hasRole(currentUser, "super_admin", "institute_admin") && !content.active) ||
    (!hasRole(currentUser, "super_admin") && !sameId(content.instituteId, tenant.instituteId))
  ) {
    throw new AppError("Content not found.", 404);
  }

  const batch = await getBatchOrThrow(content.batchId);
  await assertContentWriteAccess(currentUser, tenant.instituteId, batch, content);
  content.active = false;
  await content.save();
  await deleteStorageKeyIfUnused(content.storageKey, content._id);
};

const updateStudentContentAccess = async (contentId, payload, tenant, currentUser) => {
  const content = await Content.findById(contentId);
  if (!content || content.isReusableTemplate || !content.active) {
    throw new AppError("Content not found.", 404);
  }
  if (!hasRole(currentUser, "super_admin") && !sameId(content.instituteId, tenant.instituteId)) {
    throw new AppError("Content not found.", 404);
  }

  const moduleItem = await getModuleOrThrow(content.moduleId);
  const batch = await getBatchOrThrow(content.batchId);
  assertBatchModuleLink(batch, moduleItem);
  await assertBatchAccess({
    currentUser,
    instituteId: asId(content.instituteId),
    batch,
    forWrite: true
  });

  const student = await User.findOne({
    _id: payload.student_id,
    instituteId: content.instituteId,
    active: true,
    roles: "student"
  }).select("_id");
  if (!student) {
    throw new AppError("Student not found.", 404);
  }

  const batchAssignment = await UserBatch.findOne({
    instituteId: content.instituteId,
    batchId: batch._id,
    userId: student._id,
    active: true
  }).select("_id");
  if (!batchAssignment) {
    throw new AppError("Student must belong to this batch.", 400);
  }

  const studentId = asId(student._id);
  const assignedStudentIds = new Set((content.assignedStudentIds || []).map(asId).filter(Boolean));
  const hiddenStudentIds = new Set((content.hiddenStudentIds || []).map(asId).filter(Boolean));

  if (content.visibilityScope === "selected_students") {
    if (payload.access_mode === "grant") {
      assignedStudentIds.add(studentId);
    } else {
      assignedStudentIds.delete(studentId);
    }
  } else if (payload.access_mode === "grant") {
    hiddenStudentIds.delete(studentId);
  } else {
    hiddenStudentIds.add(studentId);
  }

  content.assignedStudentIds = [...assignedStudentIds];
  content.hiddenStudentIds = [...hiddenStudentIds];
  await content.save();

  const existingProgress = await UserProgress.findOne({
    instituteId: content.instituteId,
    userId: student._id,
    moduleId: content.moduleId
  }).lean();

  await recalculateModuleProgress({
    instituteId: asId(content.instituteId),
    userId: studentId,
    moduleId: asId(content.moduleId),
    completedContentIds: existingProgress?.completedContentIds || [],
    lastAccessed: existingProgress?.lastAccessed || new Date()
  });

  return serializeContent(content, { includeQuizAnswers: true });
};

const createReusableContent = async (payload, file, tenant, user) => {
  const instituteId = await resolveInstituteScope({
    requestedInstituteId: payload.institute_id,
    tenant,
    currentUser: user
  });
  const moduleItem = await getModuleOrThrow(payload.module_id);
  if (!sameId(moduleItem.instituteId, instituteId)) {
    throw new AppError("Module not found.", 404);
  }
  ensureReusableContentAccess(user, instituteId);

  const upload = file
    ? await uploadFile(file, buildReusableUploadSegments(instituteId, payload.module_id))
    : null;

  try {
    let quiz = null;
    let examProfile = null;
    const category = inferModuleCategory(moduleItem);
    const rendererKind =
      payload.renderer_kind ||
      (category === "writing"
        ? TECAI_WRITING_KIND
        : category === "reading"
          ? TECAI_READING_KIND
          : category === "listening"
            ? TECAI_LISTENING_KIND
            : "custom");
    const timerSeconds =
      Math.max(0, Number(payload.timer_seconds || 0) || 0) ||
      Math.max(0, Number(payload.duration || 0) * 60 || 0) ||
      DEFAULT_TIMER_SECONDS;
    const parsedExamParts = normalizeExamParts(parseOptionalJson(payload.exam_parts, "exam_parts"));

    if (payload.type === "quiz") {
      if (!file) {
        if (rendererKind === TECAI_WRITING_KIND || category === "writing") {
          if (!parsedExamParts.length) {
            throw new AppError("Writing exams require a DOCX file or at least one task in exam_parts.", 400);
          }
          quiz = {
            mode: "written",
            attemptLimit: Math.max(0, Number(payload.attempt_limit) || 0),
            questions: [],
            renderer: buildWritingRenderer({
              instructions: payload.instructions || "",
              timerSeconds,
              parts: parsedExamParts
            })
          };
        }
      } else if (
        !quiz &&
        (rendererKind === TECAI_READING_KIND ||
          rendererKind === TECAI_WRITING_KIND ||
          rendererKind === TECAI_LISTENING_KIND)
      ) {
        quiz = {
          mode: "written",
          attemptLimit: Math.max(1, Number(payload.attempt_limit || 999) || 999),
          questions: [],
          renderer:
            rendererKind === TECAI_READING_KIND
              ? buildReadingRenderer({ timerSeconds })
              : rendererKind === TECAI_LISTENING_KIND
                ? buildListeningRenderer({
                    timerSeconds,
                    audioUrl: payload.external_url || "",
                    promptFileUrl: upload?.fileUrl || "",
                    instructions: payload.instructions || ""
                  })
                : {
                    kind: TECAI_WRITING_KIND,
                    timer_seconds:
                      Math.max(0, Number(timerSeconds || DEFAULT_TIMER_SECONDS) || DEFAULT_TIMER_SECONDS),
                    blocks: []
                  }
        };
      }
      if (quiz && payload.attempt_limit !== undefined) {
        quiz.attemptLimit = Math.max(0, Number(payload.attempt_limit) || 0);
      }
      examProfile = buildExamProfile({
        payload,
        moduleItem,
        rendererKind: quiz?.renderer?.kind || rendererKind,
        timerSeconds: quiz?.renderer?.timer_seconds || timerSeconds,
        parts: parsedExamParts
      });
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
      batchId: null,
      sourceContentId: null,
      createdBy: user._id,
      title: payload.title,
      type: payload.type,
      description: payload.description,
      externalUrl: payload.external_url,
      orderIndex: payload.order_index,
      duration: payload.duration,
      fileUrl: upload?.fileUrl,
      storageKey: upload?.storageKey,
      visibilityScope: "batch",
      assignedStudentIds: [],
      isReusableTemplate: true,
      profile: {
        category,
        instructions: payload.instructions,
        responseType: payload.response_type,
        quiz,
        exam: examProfile
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

const listReusableContents = async (moduleId, tenant, currentUser) => {
  const moduleItem = await getModuleOrThrow(moduleId);
  ensureReusableContentAccess(currentUser, tenant.instituteId);
  if (!hasRole(currentUser, "super_admin") && !sameId(moduleItem.instituteId, tenant.instituteId)) {
    throw new AppError("Module not found.", 404);
  }

  const contents = await Content.find({
    moduleId: moduleItem._id,
    instituteId: moduleItem.instituteId,
    batchId: null,
    isReusableTemplate: true,
    active: true
  }).sort({ orderIndex: 1, createdAt: 1, _id: 1 });

  return contents.map((content) => serializeContent(content, { includeQuizAnswers: true }));
};

const updateReusableContent = async (id, payload, file, tenant, currentUser) => {
  const content = await Content.findById(id);
  if (!content || !content.isReusableTemplate) {
    throw new AppError("Reusable content not found.", 404);
  }

  const instituteId = await resolveInstituteScope({
    requestedInstituteId: payload.institute_id,
    tenant,
    currentUser
  });
  if (!sameId(content.instituteId, instituteId)) {
    throw new AppError("Reusable content not found.", 404);
  }
  ensureReusableContentAccess(currentUser, instituteId);

  const nextModuleId = payload.module_id || content.moduleId;
  const moduleItem = await getModuleOrThrow(nextModuleId);
  if (!sameId(moduleItem.instituteId, instituteId)) {
    throw new AppError("Module not found.", 404);
  }

  const uploaded = file
    ? await uploadFile(file, buildReusableUploadSegments(instituteId, asId(moduleItem._id)))
    : null;
  const nextFileUrl = uploaded ? uploaded.fileUrl : payload.replace_file ? null : content.fileUrl;
  const nextStorageKey = uploaded ? uploaded.storageKey : payload.replace_file ? null : content.storageKey;
  const nextExternalUrl =
    payload.external_url !== undefined ? payload.external_url || null : content.externalUrl;
  const nextType = payload.type ?? content.type;
  const nextDescription = payload.description ?? content.description;
  const nextCategory = inferModuleCategory(moduleItem);
  const nextRendererKind =
    payload.renderer_kind ||
    content.profile?.exam?.rendererKind ||
    (nextCategory === "writing"
      ? TECAI_WRITING_KIND
      : nextCategory === "reading"
        ? TECAI_READING_KIND
        : nextCategory === "listening"
          ? TECAI_LISTENING_KIND
          : "custom");
  const nextTimerSeconds =
    Math.max(0, Number(payload.timer_seconds || 0) || 0) ||
    Math.max(0, Number(payload.duration ?? content.duration ?? 0) * 60 || 0) ||
    content.profile?.exam?.timerSeconds ||
    content.profile?.quiz?.renderer?.timer_seconds ||
    DEFAULT_TIMER_SECONDS;
  const parsedExamParts = normalizeExamParts(
    parseOptionalJson(payload.exam_parts, "exam_parts") ?? content.profile?.exam?.parts ?? []
  );
  let nextQuiz = null;

  if (nextType === "quiz") {
    if (!file) {
      if (nextRendererKind === TECAI_WRITING_KIND || nextCategory === "writing") {
        if (parsedExamParts.length) {
          nextQuiz = {
            mode: "written",
            attemptLimit: Math.max(0, Number(payload.attempt_limit ?? content.profile?.quiz?.attemptLimit ?? 0) || 0),
            questions: [],
            renderer: buildWritingRenderer({
              instructions:
                payload.instructions !== undefined ? payload.instructions || "" : content.profile?.instructions || "",
              timerSeconds: nextTimerSeconds,
              parts: parsedExamParts
            })
          };
        } else {
          nextQuiz = content.profile?.quiz || null;
        }
      } else {
        nextQuiz = content.profile?.quiz || null;
      }
    }
  }

  if (
    !nextQuiz &&
    nextType === "quiz" &&
    (nextRendererKind === TECAI_READING_KIND ||
      nextRendererKind === TECAI_WRITING_KIND ||
      nextRendererKind === TECAI_LISTENING_KIND) &&
    (file || content.fileUrl || (nextRendererKind === TECAI_LISTENING_KIND && nextExternalUrl))
  ) {
    nextQuiz = {
      mode: "written",
      attemptLimit: Math.max(1, Number(payload.attempt_limit ?? content.profile?.quiz?.attemptLimit ?? 999) || 999),
      questions: [],
      renderer:
        nextRendererKind === TECAI_READING_KIND
          ? buildReadingRenderer({ timerSeconds: nextTimerSeconds })
          : nextRendererKind === TECAI_LISTENING_KIND
            ? buildListeningRenderer({
                timerSeconds: nextTimerSeconds,
                audioUrl: nextExternalUrl || "",
                promptFileUrl: nextFileUrl || "",
                instructions:
                  payload.instructions !== undefined ? payload.instructions || "" : content.profile?.instructions || ""
              })
            : {
                kind: TECAI_WRITING_KIND,
                timer_seconds:
                  Math.max(0, Number(nextTimerSeconds || DEFAULT_TIMER_SECONDS) || DEFAULT_TIMER_SECONDS),
                blocks: []
              }
    };
  }

  if (
    nextType === "quiz" &&
    (nextRendererKind === TECAI_WRITING_KIND || nextCategory === "writing") &&
    !file &&
    !parsedExamParts.length &&
    !content.profile?.quiz
  ) {
    if (uploaded?.storageKey) {
      await deleteFile(uploaded.storageKey);
    }
    throw new AppError("Writing exams require a DOCX file or at least one task in exam_parts.", 400);
  }

  if (nextQuiz && payload.attempt_limit !== undefined) {
    nextQuiz.attemptLimit = Math.max(0, Number(payload.attempt_limit) || 0);
  }

  const nextExamProfile =
    nextType === "quiz"
      ? buildExamProfile({
          payload: {
            ...payload,
            exam_type_id: payload.exam_type_id || content.profile?.exam?.examTypeId || moduleItem.subcourseId,
            category: nextCategory,
            exam_metadata:
              payload.exam_metadata !== undefined
                ? payload.exam_metadata
                : JSON.stringify(content.profile?.exam?.metadata || null)
          },
          moduleItem,
          rendererKind: nextQuiz?.renderer?.kind || nextRendererKind,
          timerSeconds: nextQuiz?.renderer?.timer_seconds || nextTimerSeconds,
          parts: parsedExamParts
        })
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
  content.moduleId = nextModuleId;
  content.title = payload.title ?? content.title;
  content.type = nextType;
  content.description = nextDescription;
  content.externalUrl = nextExternalUrl;
  content.orderIndex = payload.order_index ?? content.orderIndex;
  content.duration = payload.duration ?? content.duration;
  content.fileUrl = nextFileUrl;
  content.storageKey = nextStorageKey;
  content.profile.category = nextCategory;
  if (payload.instructions !== undefined) content.profile.instructions = payload.instructions;
  if (payload.response_type !== undefined) content.profile.responseType = payload.response_type;
  content.profile.quiz = nextQuiz;
  content.profile.exam = nextExamProfile;

  await content.save();
  if ((uploaded || payload.replace_file) && oldStorageKey && oldStorageKey !== nextStorageKey) {
    await deleteStorageKeyIfUnused(oldStorageKey, content._id);
  }

  return serializeContent(content, { includeQuizAnswers: true });
};

const assignReusableContent = async (contentId, payload, tenant, currentUser) => {
  const template = await Content.findById(contentId);
  if (!template || !template.isReusableTemplate || !template.active) {
    throw new AppError("Reusable content not found.", 404);
  }

  const instituteId = await resolveInstituteScope({
    requestedInstituteId: payload.institute_id,
    tenant,
    currentUser
  });
  if (!sameId(template.instituteId, instituteId)) {
    throw new AppError("Reusable content not found.", 404);
  }
  ensureReusableContentAccess(currentUser, instituteId);

  const batch = await getBatchOrThrow(payload.batch_id);
  const moduleItem = await getModuleOrThrow(template.moduleId);
  assertBatchModuleLink(batch, moduleItem);

  const visibility = await resolveAssignedStudents({ payload, batch, instituteId });

  const existing = await Content.findOne({
    batchId: batch._id,
    sourceContentId: template._id,
    active: true
  });
  if (existing) {
    return serializeContent(existing, { includeQuizAnswers: true });
  }

  const content = await Content.create({
    instituteId,
    moduleId: template.moduleId,
    batchId: batch._id,
    sourceContentId: template._id,
    createdBy: currentUser._id,
    title: payload.title?.trim() || template.title,
    type: template.type,
    description: template.description,
    externalUrl: template.externalUrl,
    orderIndex: payload.order_index ?? template.orderIndex ?? 0,
    duration: template.duration ?? 0,
    fileUrl: template.fileUrl,
    storageKey: template.storageKey,
    visibilityScope: visibility.visibilityScope,
    assignedStudentIds: visibility.assignedStudentIds,
    isReusableTemplate: false,
    profile: cloneValue(template.profile) || {}
  });

  return serializeContent(content, { includeQuizAnswers: true });
};

const deleteReusableContent = async (id, tenant, currentUser) => {
  const content = await Content.findById(id);
  if (!content || !content.isReusableTemplate) {
    throw new AppError("Reusable content not found.", 404);
  }
  if (!hasRole(currentUser, "super_admin") && !sameId(content.instituteId, tenant.instituteId)) {
    throw new AppError("Reusable content not found.", 404);
  }

  ensureReusableContentAccess(currentUser, tenant.instituteId);
  content.active = false;
  await content.save();
  await deleteStorageKeyIfUnused(content.storageKey, content._id);
};

module.exports = {
  createContent,
  createReusableContent,
  previewQuiz,
  getTecaiExamData,
  listModuleContents,
  listReusableContents,
  updateContent,
  updateReusableContent,
  assignReusableContent,
  updateStudentContentAccess,
  deleteContent,
  deleteReusableContent
};
