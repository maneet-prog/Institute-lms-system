const mongoose = require("mongoose");

const contentProfileSchema = new mongoose.Schema(
  {
    category: { type: String, default: "reading" },
    instructions: { type: String },
    downloadable: { type: Boolean, default: false },
    responseType: { type: String }
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
