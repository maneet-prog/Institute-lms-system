const { asId } = require("../services/accessService");
const { sanitizeRenderer } = require("./tecaiReading");

const serializeInstitute = (institute) => ({
  institute_id: asId(institute._id),
  name: institute.name,
  email: institute.email,
  mob_no: institute.mobNo,
  country: institute.country,
  state: institute.state,
  place: institute.place,
  pincode: institute.pincode,
  active: institute.active,
  created_at: institute.createdAt,
  updated_at: institute.updatedAt
});

const serializeUser = (user) => ({
  user_id: asId(user._id),
  institute_id: asId(user.instituteId?._id || user.instituteId),
  institute_name: user.instituteId?.name || null,
  first_name: user.firstName,
  last_name: user.lastName,
  email: user.email,
  mob_no: user.mobNo,
  is_approved: user.isApproved,
  active: user.active,
  role_names: [...new Set(user.roles || [])].sort(),
  created_at: user.createdAt
});

const serializeCourse = (course) => ({
  course_id: asId(course._id),
  institute_id: asId(course.instituteId),
  course_name: course.courseName,
  description: course.description ?? null,
  image_url: course.imageUrl ?? null,
  active: course.active
});

const serializeSubcourse = (subcourse) => ({
  subcourse_id: asId(subcourse._id),
  course_id: asId(subcourse.courseId),
  institute_id: asId(subcourse.instituteId),
  subcourse_name: subcourse.subcourseName,
  description: subcourse.description ?? null,
  image_url: subcourse.imageUrl ?? null,
  active: subcourse.active
});

const serializeModuleSubcategory = (subcategory) => ({
  subcategory_id: subcategory?.subcategoryId || subcategory?.subcategory_id || "general",
  name: subcategory?.name || "general",
  active: subcategory?.active !== false,
  is_default:
    (subcategory?.subcategoryId || subcategory?.subcategory_id || "general") === "general"
});

const serializeModuleSubcategories = (subcategories = []) => {
  const items = [{ subcategoryId: "general", name: "general", active: true }, ...subcategories];
  const seen = new Set();
  return items
    .map(serializeModuleSubcategory)
    .filter((item) => {
      if (!item.active || seen.has(item.subcategory_id)) {
        return false;
      }
      seen.add(item.subcategory_id);
      return true;
    });
};

const serializeModule = (module) => ({
  module_id: asId(module._id),
  course_id: asId(module.courseId),
  subcourse_id: asId(module.subcourseId),
  institute_id: asId(module.instituteId),
  module_name: module.moduleName,
  exam_type: module.examType ?? "general",
  module_subcategories: serializeModuleSubcategories(module.moduleSubcategories || []),
  active: module.active
});

const serializeExamAsset = (asset) => ({
  asset_id: asset?.assetId || asset?.asset_id || null,
  type: asset?.type || "text",
  title: asset?.title ?? null,
  url: asset?.url ?? null,
  content: asset?.content ?? null,
  mime_type: asset?.mimeType ?? asset?.mime_type ?? null,
  meta: asset?.meta ?? null
});

const serializeExamPart = (part) => ({
  part_id: part?.partId || part?.part_id || null,
  title: part?.title || "",
  kind: part?.kind || "part",
  instructions: part?.instructions ?? null,
  timer_seconds: part?.timerSeconds ?? part?.timer_seconds ?? 0,
  passages: (part?.passages || []).map(serializeExamAsset),
  audio: (part?.audio || []).map(serializeExamAsset),
  images: (part?.images || []).map(serializeExamAsset),
  resources: (part?.resources || []).map(serializeExamAsset),
  questions: (part?.questions || []).map((question) => ({
    question_id: question?.questionId || question?.question_id || null,
    type: question?.type || "written",
    prompt: question?.prompt || "",
    instructions: question?.instructions ?? null,
    options: (question?.options || []).map((option) => ({
      option_id: option.optionId || option.option_id || null,
      text: option.text || ""
    })),
    answer_data: question?.answerData ?? question?.answer_data ?? null,
    answer_key: question?.answerKey ?? question?.answer_key ?? null,
    max_marks: question?.maxMarks ?? question?.max_marks ?? 0,
    order_index: question?.orderIndex ?? question?.order_index ?? 0
  })),
  answer_data: part?.answerData ?? part?.answer_data ?? null,
  order_index: part?.orderIndex ?? part?.order_index ?? 0
});

const serializeExamProfile = (exam) =>
  exam
    ? {
        exam_type_id: asId(exam.examTypeId),
        module_id: asId(exam.moduleId),
        module_code: exam.moduleCode ?? null,
        module_label: exam.moduleLabel ?? null,
        renderer_kind: exam.rendererKind ?? null,
        timer_seconds: exam.timerSeconds ?? 0,
        parts: (exam.parts || []).map(serializeExamPart),
        metadata: exam.metadata ?? null
      }
    : null;

const serializeContent = (content, options = {}) => ({
  content_id: asId(content._id),
  institute_id: asId(content.instituteId),
  module_id: asId(content.moduleId),
  batch_id: asId(content.batchId),
  source_content_id: asId(content.sourceContentId),
  created_by: asId(content.createdBy),
  is_reusable_template: Boolean(content.isReusableTemplate),
  title: content.title,
  type: content.type,
  description: content.description ?? null,
  file_url: content.fileUrl ?? null,
  external_url: content.externalUrl ?? null,
  resolved_url: content.fileUrl || content.externalUrl || null,
  order_index: content.orderIndex ?? 0,
  category: content.profile?.category ?? "reading",
  body_text: content.description ?? null,
  instructions: content.profile?.instructions ?? null,
  response_type: content.profile?.responseType ?? null,
  visibility_scope: content.visibilityScope ?? "batch",
  assigned_student_ids: (content.assignedStudentIds || []).map(asId).filter(Boolean),
  hidden_student_ids: (content.hiddenStudentIds || []).map(asId).filter(Boolean),
  module_subcategory_id: content.moduleSubcategoryId ?? "general",
  module_subcategory_name: content.moduleSubcategoryName ?? "general",
  exam: serializeExamProfile(content.profile?.exam),
  quiz:
    content.profile?.quiz &&
    (
      Array.isArray(content.profile.quiz.questions) ||
      content.profile.quiz.renderer?.kind === "tecai_reading" ||
      content.profile.quiz.renderer?.kind === "tecai_writing" ||
      content.profile.quiz.renderer?.kind === "tecai_listening" ||
      content.profile.quiz.renderer?.kind === "tecai_speaking"
    )
      ? {
          mode: content.profile.quiz.mode || "mcq",
          attempt_limit: content.profile.quiz.attemptLimit ?? 999,
          questions: (content.profile.quiz.questions || []).map((question) => ({
            question_id: question.questionId,
            type: question.type,
            prompt: question.prompt,
            options: (question.options || []).map((option) => ({
              option_id: option.optionId,
              text: option.text
            })),
            correct_option_id: options.includeQuizAnswers === false ? null : question.correctOptionId ?? null,
            reference_answer: options.includeQuizAnswers === false ? null : question.referenceAnswer ?? null,
            max_marks: question.maxMarks ?? 1
          })),
          renderer: sanitizeRenderer(content.profile.quiz.renderer, options.includeQuizAnswers !== false)
        }
      : null,
  url: content.fileUrl || content.externalUrl || null,
  duration: content.duration ?? 0,
  created_at: content.createdAt,
  updated_at: content.updatedAt ?? null
});

const serializeBatch = (batch) => ({
  batch_id: asId(batch._id),
  institute_id: asId(batch.instituteId),
  course_id: asId(batch.courseId),
  subcourse_id: asId(batch.subcourseId),
  batch_name: batch.batchName,
  active: batch.active,
  detail: batch.detail
    ? {
        description: batch.detail.description ?? null,
        room_name: batch.detail.roomName ?? null,
        schedule_notes: batch.detail.scheduleNotes ?? null,
        start_date: batch.detail.startDate ?? null,
        end_date: batch.detail.endDate ?? null
      }
    : null
});

const serializeUserCourse = (row) => ({
  id: asId(row._id),
  institute_id: asId(row.instituteId),
  user_id: asId(row.userId),
  course_id: asId(row.courseId),
  subcourse_id: asId(row.subcourseId)
});

const serializeUserBatch = (row) => ({
  user_batch_id: asId(row._id),
  institute_id: asId(row.instituteId),
  user_id: asId(row.userId),
  batch_id: asId(row.batchId),
  active: row.active
});

const serializeBatchTeacher = (row) => ({
  id: asId(row._id),
  institute_id: asId(row.instituteId),
  batch_id: asId(row.batchId),
  user_id: asId(row.userId)
});

const serializeStudentSubmission = (submission) => ({
  submission_id: asId(submission._id),
  response_type: submission.responseType,
  response_text: submission.responseText ?? null,
  response_url: submission.responseUrl ?? null,
  submission_kind: submission.submissionKind ?? "activity",
  latest_attempt_number: submission.latestAttemptNumber ?? 1,
  latest_auto_score: submission.latestAutoScore ?? 0,
  latest_awarded_marks: submission.latestAwardedMarks ?? null,
  max_score: submission.maxScore ?? 0,
  review_status: submission.reviewStatus ?? "pending",
  feedback: submission.feedback ?? null,
  reviewed_at: submission.reviewedAt ?? null,
  reviewed_by: asId(submission.reviewedBy),
  attempts: (submission.attempts || []).map((attempt) => ({
    attempt_number: attempt.attemptNumber,
    response_type: attempt.responseType,
    response_text: attempt.responseText ?? null,
    response_url: attempt.responseUrl ?? null,
    renderer_kind: attempt.rendererKind ?? null,
    time_taken_seconds: attempt.timeTakenSeconds ?? 0,
    transcript_text: attempt.transcriptText ?? null,
    ai_evaluation: attempt.aiEvaluation ?? null,
    fluency_score: attempt.fluencyScore ?? null,
    grammar_score: attempt.grammarScore ?? null,
    pronunciation_score: attempt.pronunciationScore ?? null,
    vocabulary_score: attempt.vocabularyScore ?? null,
    auto_score: attempt.autoScore ?? 0,
    awarded_marks: attempt.awardedMarks ?? null,
    max_score: attempt.maxScore ?? 0,
    status: attempt.status ?? "submitted",
    feedback: attempt.feedback ?? null,
    reviewed_at: attempt.reviewedAt ?? null,
    reviewed_by: asId(attempt.reviewedBy),
    submitted_at: attempt.submittedAt,
    exam_responses: (attempt.examResponses || []).map((response) => ({
      part_id: response.partId ?? null,
      question_id: response.questionId ?? null,
      response_text: response.responseText ?? null,
      response_url: response.responseUrl ?? null,
      storage_key: response.storageKey ?? null,
      response_data: response.responseData ?? null,
      word_count: response.wordCount ?? 0,
      duration_seconds: response.durationSeconds ?? 0,
      transcript: response.transcript ?? null,
      evaluation: response.evaluation ?? null,
      score: response.score ?? null,
      fluency_score: response.fluencyScore ?? null,
      grammar_score: response.grammarScore ?? null,
      pronunciation_score: response.pronunciationScore ?? null,
      vocabulary_score: response.vocabularyScore ?? null
    })),
    answers: (attempt.answers || []).map((answer) => ({
      question_id: answer.questionId,
      prompt: answer.prompt,
      question_type: answer.questionType,
      selected_option_id: answer.selectedOptionId ?? null,
      selected_option_text: answer.selectedOptionText ?? null,
      response_text: answer.responseText ?? null,
      correct_option_id: answer.correctOptionId ?? null,
      is_correct: answer.isCorrect,
      auto_marks: answer.autoMarks ?? 0,
      max_marks: answer.maxMarks ?? 0
    }))
  })),
  submitted_at: submission.submittedAt
});

const serializeProgress = (progress) => ({
  id: asId(progress._id),
  institute_id: asId(progress.instituteId),
  user_id: asId(progress.userId),
  module_id: asId(progress.moduleId),
  completed: progress.completed,
  progress_percent: progress.progressPercent,
  completed_content_ids: (progress.completedContentIds || []).map(asId).filter(Boolean),
  total_content_count: progress.totalContentCount ?? 0,
  completed_content_count: progress.completedContentCount ?? 0,
  last_accessed: progress.lastAccessed
});

module.exports = {
  serializeInstitute,
  serializeUser,
  serializeCourse,
  serializeSubcourse,
  serializeModule,
  serializeExamProfile,
  serializeContent,
  serializeBatch,
  serializeUserCourse,
  serializeUserBatch,
  serializeBatchTeacher,
  serializeStudentSubmission,
  serializeProgress
};
