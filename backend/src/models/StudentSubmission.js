const mongoose = require("mongoose");

const quizAnswerSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true },
    prompt: { type: String, required: true },
    questionType: { type: String, enum: ["mcq", "written"], required: true },
    selectedOptionId: { type: String, default: null },
    selectedOptionText: { type: String, default: null },
    responseText: { type: String, default: null },
    correctOptionId: { type: String, default: null },
    isCorrect: { type: Boolean, default: null },
    autoMarks: { type: Number, default: 0 },
    maxMarks: { type: Number, default: 0 }
  },
  { _id: false }
);

const examResponseSchema = new mongoose.Schema(
  {
    partId: { type: String, default: null },
    questionId: { type: String, default: null },
    responseText: { type: String, default: null },
    responseUrl: { type: String, default: null },
    storageKey: { type: String, default: null },
    responseData: { type: mongoose.Schema.Types.Mixed, default: null },
    wordCount: { type: Number, default: 0 },
    durationSeconds: { type: Number, default: 0 },
    transcript: { type: String, default: null },
    evaluation: { type: mongoose.Schema.Types.Mixed, default: null },
    score: { type: Number, default: null },
    fluencyScore: { type: Number, default: null },
    grammarScore: { type: Number, default: null },
    pronunciationScore: { type: Number, default: null },
    vocabularyScore: { type: Number, default: null }
  },
  { _id: false }
);

const submissionAttemptSchema = new mongoose.Schema(
  {
    attemptNumber: { type: Number, required: true },
    responseType: { type: String, required: true },
    responseText: { type: String, default: null },
    responseUrl: { type: String, default: null },
    answers: { type: [quizAnswerSchema], default: [] },
    examResponses: { type: [examResponseSchema], default: [] },
    rendererKind: { type: String, default: null },
    timeTakenSeconds: { type: Number, default: 0 },
    transcriptText: { type: String, default: null },
    aiEvaluation: { type: mongoose.Schema.Types.Mixed, default: null },
    fluencyScore: { type: Number, default: null },
    grammarScore: { type: Number, default: null },
    pronunciationScore: { type: Number, default: null },
    vocabularyScore: { type: Number, default: null },
    autoScore: { type: Number, default: 0 },
    awardedMarks: { type: Number, default: null },
    maxScore: { type: Number, default: 0 },
    status: { type: String, enum: ["submitted", "reviewed"], default: "submitted" },
    feedback: { type: String, default: null },
    reviewedAt: { type: Date, default: null },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    submittedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const studentSubmissionSchema = new mongoose.Schema(
  {
    instituteId: { type: mongoose.Schema.Types.ObjectId, ref: "Institute", required: true, index: true },
    contentId: { type: mongoose.Schema.Types.ObjectId, ref: "Content", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    responseType: { type: String, required: true },
    responseText: { type: String, default: null },
    responseUrl: { type: String, default: null },
    submissionKind: { type: String, enum: ["activity", "quiz"], default: "activity" },
    attempts: { type: [submissionAttemptSchema], default: [] },
    latestAttemptNumber: { type: Number, default: 1 },
    latestAutoScore: { type: Number, default: 0 },
    latestAwardedMarks: { type: Number, default: null },
    maxScore: { type: Number, default: 0 },
    reviewStatus: { type: String, enum: ["pending", "reviewed"], default: "pending" },
    feedback: { type: String, default: null },
    reviewedAt: { type: Date, default: null },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    submittedAt: { type: Date, default: Date.now },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

studentSubmissionSchema.index({ userId: 1, contentId: 1 }, { unique: true });

module.exports = mongoose.model("StudentSubmission", studentSubmissionSchema);
