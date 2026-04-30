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

const submissionAttemptSchema = new mongoose.Schema(
  {
    attemptNumber: { type: Number, required: true },
    responseType: { type: String, required: true },
    responseText: { type: String, default: null },
    responseUrl: { type: String, default: null },
    answers: { type: [quizAnswerSchema], default: [] },
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
    submittedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

studentSubmissionSchema.index({ userId: 1, contentId: 1 }, { unique: true });

module.exports = mongoose.model("StudentSubmission", studentSubmissionSchema);
