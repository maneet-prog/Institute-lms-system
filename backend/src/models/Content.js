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
    attemptLimit: { type: Number, min: 0, default: 1 },
    questions: { type: [quizQuestionSchema], default: [] },
    renderer: { type: mongoose.Schema.Types.Mixed, default: null }
  },
  { _id: false }
);

const examAssetSchema = new mongoose.Schema(
  {
    assetId: { type: String, required: true },
    type: {
      type: String,
      enum: ["audio", "image", "passage", "document", "chart", "html", "text"],
      required: true
    },
    title: { type: String, default: null },
    url: { type: String, default: null },
    storageKey: { type: String, default: null },
    content: { type: String, default: null },
    mimeType: { type: String, default: null },
    meta: { type: mongoose.Schema.Types.Mixed, default: null }
  },
  { _id: false }
);

const examPartQuestionSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true },
    type: {
      type: String,
      enum: [
        "mcq",
        "written",
        "true_false",
        "fill_blank",
        "matching",
        "short_answer",
        "essay"
      ],
      default: "written"
    },
    prompt: { type: String, required: true },
    instructions: { type: String, default: null },
    options: { type: [quizOptionSchema], default: [] },
    answerData: { type: mongoose.Schema.Types.Mixed, default: null },
    answerKey: { type: mongoose.Schema.Types.Mixed, default: null },
    maxMarks: { type: Number, min: 0, default: 0 },
    orderIndex: { type: Number, default: 0 }
  },
  { _id: false }
);

const examPartSchema = new mongoose.Schema(
  {
    partId: { type: String, required: true },
    title: { type: String, required: true },
    kind: { type: String, enum: ["part", "section", "task"], default: "part" },
    instructions: { type: String, default: null },
    timerSeconds: { type: Number, min: 0, default: 0 },
    passages: { type: [examAssetSchema], default: [] },
    audio: { type: [examAssetSchema], default: [] },
    images: { type: [examAssetSchema], default: [] },
    resources: { type: [examAssetSchema], default: [] },
    questions: { type: [examPartQuestionSchema], default: [] },
    answerData: { type: mongoose.Schema.Types.Mixed, default: null },
    orderIndex: { type: Number, default: 0 }
  },
  { _id: false }
);

const examProfileSchema = new mongoose.Schema(
  {
    examTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subcourse",
      default: null
    },
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Module",
      default: null
    },
    moduleCode: { type: String, default: null },
    moduleLabel: { type: String, default: null },
    rendererKind: {
      type: String,
      enum: [
        "tecai_reading",
        "tecai_writing",
        "tecai_listening",
        "structured_reading",
        "structured_writing",
        "custom"
      ],
      default: "custom"
    },
    timerSeconds: { type: Number, min: 0, default: 0 },
    parts: { type: [examPartSchema], default: [] },
    metadata: { type: mongoose.Schema.Types.Mixed, default: null }
  },
  { _id: false }
);

const contentProfileSchema = new mongoose.Schema(
  {
    category: { type: String, default: "reading" },
    instructions: { type: String },
    responseType: { type: String },
    quiz: { type: quizProfileSchema, default: null },
    exam: { type: examProfileSchema, default: null }
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
      default: null,
      index: true
    },
    sourceContentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Content",
      default: null,
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
    profile: { type: contentProfileSchema, default: () => ({}) },
    visibilityScope: {
      type: String,
      enum: ["batch", "selected_students"],
      default: "batch"
    },
    assignedStudentIds: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      default: []
    },
    hiddenStudentIds: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      default: []
    },
    isReusableTemplate: {
      type: Boolean,
      default: false,
      index: true
    },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

contentSchema.index({ instituteId: 1, batchId: 1, moduleId: 1, orderIndex: 1, createdAt: 1 });
contentSchema.index({ instituteId: 1, moduleId: 1, isReusableTemplate: 1, active: 1, createdAt: 1 });

module.exports = mongoose.model("Content", contentSchema);
