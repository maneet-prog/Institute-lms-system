const AppError = require("./AppError");

const ensureArray = (value) => (Array.isArray(value) ? value : []);

const normalizeQuestion = (question, index) => {
  const questionId = String(
    question.question_id ||
      question.questionId ||
      question.id ||
      `question-${index + 1}`
  );
  const type = question.type === "written" ? "written" : "mcq";
  const options = ensureArray(question.options).map((option, optionIndex) => ({
    optionId: String(option.option_id || option.optionId || option.id || `option-${index + 1}-${optionIndex + 1}`),
    text: String(option.text || option.label || option.value || "").trim()
  }));
  return {
    questionId,
    type,
    prompt: String(question.prompt || question.question || "").trim(),
    options,
    correctOptionId:
      question.correct_option_id ||
      question.correctOptionId ||
      (type === "mcq" && typeof question.answer === "string"
        ? options.find((option) => option.text === question.answer || option.optionId === question.answer)?.optionId || null
        : null),
    referenceAnswer: question.reference_answer || question.referenceAnswer || null,
    maxMarks: Number(question.max_marks || question.maxMarks || 1) || 1
  };
};

const normalizeQuizPayload = (raw) => {
  if (!raw) {
    return null;
  }

  let parsed = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      throw new AppError("Quiz payload must be valid JSON.", 400);
    }
  }

  const questions = ensureArray(parsed.questions).map(normalizeQuestion);
  if (!questions.length) {
    return null;
  }

  const hasWritten = questions.some((question) => question.type === "written");
  const hasMcq = questions.some((question) => question.type === "mcq");

  return {
    mode:
      parsed.mode ||
      (hasWritten && hasMcq ? "mixed" : hasWritten ? "written" : "mcq"),
    attemptLimit: Math.max(1, Number(parsed.attempt_limit || parsed.attemptLimit || 1) || 1),
    questions
  };
};

const resolveQuizFromContent = (content) => {
  const structuredQuiz = normalizeQuizPayload(content?.profile?.quiz || null);
  if (structuredQuiz) {
    return structuredQuiz;
  }

  if (!content?.description) {
    return null;
  }

  return normalizeQuizPayload(content.description);
};

const validateQuizDefinition = (quiz) => {
  if (!quiz || !quiz.questions?.length) {
    throw new AppError("Quiz content requires at least one question.", 400);
  }

  for (const question of quiz.questions) {
    if (!question.prompt) {
      throw new AppError("Each quiz question must include a prompt.", 400);
    }
    if (question.type === "mcq") {
      if (!question.options.length || question.options.some((option) => !option.text)) {
        throw new AppError("MCQ questions require non-empty options.", 400);
      }
      if (!question.correctOptionId) {
        throw new AppError("MCQ questions require a correct option.", 400);
      }
      const hasCorrectOption = question.options.some((option) => option.optionId === question.correctOptionId);
      if (!hasCorrectOption) {
        throw new AppError("Each MCQ correct option must exist in the option list.", 400);
      }
    }
  }
};

const gradeQuizSubmission = (quiz, answers = []) => {
  const answerMap = new Map(
    ensureArray(answers).map((answer) => [
      String(answer.question_id || answer.questionId || ""),
      answer
    ])
  );

  let autoScore = 0;
  let maxScore = 0;
  let requiresManualReview = false;

  const normalizedAnswers = quiz.questions.map((question) => {
    const answer = answerMap.get(question.questionId) || {};
    const maxMarks = Number(question.maxMarks || 1) || 1;
    maxScore += maxMarks;

    if (question.type === "written") {
      requiresManualReview = true;
      return {
        questionId: question.questionId,
        prompt: question.prompt,
        questionType: question.type,
        selectedOptionId: null,
        selectedOptionText: null,
        responseText: answer.response_text || answer.responseText || null,
        correctOptionId: null,
        isCorrect: null,
        autoMarks: 0,
        maxMarks
      };
    }

    const selectedOptionId = answer.selected_option_id || answer.selectedOptionId || null;
    const selectedOption = question.options.find((option) => option.optionId === selectedOptionId) || null;
    const isCorrect = Boolean(selectedOptionId && selectedOptionId === question.correctOptionId);
    const autoMarks = isCorrect ? maxMarks : 0;
    autoScore += autoMarks;

    return {
      questionId: question.questionId,
      prompt: question.prompt,
      questionType: question.type,
      selectedOptionId,
      selectedOptionText: selectedOption?.text || null,
      responseText: null,
      correctOptionId: question.correctOptionId,
      isCorrect,
      autoMarks,
      maxMarks
    };
  });

  return {
    answers: normalizedAnswers,
    autoScore,
    maxScore,
    requiresManualReview
  };
};

module.exports = {
  normalizeQuizPayload,
  resolveQuizFromContent,
  validateQuizDefinition,
  gradeQuizSubmission
};
