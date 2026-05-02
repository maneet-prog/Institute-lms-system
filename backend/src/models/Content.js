const mongoose = require("mongoose");

const quizOptionSchema = new mongoose.Schema(
  {
    optionId: { type: String, required: true },
    text: { type: String, required: true, trim: true }
  },
  { _id: false }
);

const quizQuestionSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true },
    type: { type: String, enum: ["mcq", "written"], required: true },
    prompt: { type: String, required: true, trim: true },
    options: { type: [quizOptionSchema], default: [] },
    correctOptionId: { type: String, default: null },
    referenceAnswer: { type: String, default: null },
    maxMarks: { type: Number, min: 0, default: 1 }
  },
  { _id: false }
);

const quizProfileSchema = new mongoose.Schema(
  {
    mode: { type: String, enum: ["mcq", "written", "mixed"], default: "mcq" },
    attemptLimit: { type: Number, min: 1, default: 1 },
    questions: { type: [quizQuestionSchema], default: [] },
    renderer: { type: mongoose.Schema.Types.Mixed, default: null }
  },
  { _id: false }
);

const contentProfileSchema = new mongoose.Schema(
  {
    category: { type: String, default: "reading" },
    instructions: { type: String },
    downloadable: { type: Boolean, default: false },
    responseType: { type: String },
    quiz: { type: quizProfileSchema, default: null }
  },
  { _id: false }
);

const contentSchema = new mongoose.Schema(
  {
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institute",
      required: true,
      index: true
    },
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Module",
      required: true,
      index: true
    },
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      required: true,
      index: true
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    title: { type: String, required: true, trim: true },
    type: {
      type: String,
      required: true,
      enum: ["text", "video", "audio", "pdf", "document", "quiz"]
    },
    description: { type: String },
    fileUrl: { type: String },
    externalUrl: { type: String },
    storageKey: { type: String },
    orderIndex: { type: Number, default: 0 },
    duration: { type: Number, default: 0 },
    profile: { type: contentProfileSchema, default: () => ({}) }
  },
  { timestamps: true }
);

contentSchema.index({ instituteId: 1, batchId: 1, moduleId: 1, orderIndex: 1, createdAt: 1 });

module.exports = mongoose.model("Content", contentSchema);
