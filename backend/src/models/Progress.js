const mongoose = require("mongoose");

const progressSchema = new mongoose.Schema(
  {
    instituteId: { type: mongoose.Schema.Types.ObjectId, ref: "Institute", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    moduleId: { type: mongoose.Schema.Types.ObjectId, ref: "Module", required: true, index: true },
    completed: { type: Boolean, default: false },
    progressPercent: { type: Number, min: 0, max: 100, default: 0 },
    completedContentIds: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Content" }],
      default: []
    },
    totalContentCount: { type: Number, min: 0, default: 0 },
    completedContentCount: { type: Number, min: 0, default: 0 },
    lastAccessed: { type: Date, default: Date.now },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

progressSchema.index({ userId: 1, moduleId: 1 }, { unique: true });

module.exports = mongoose.model("UserProgress", progressSchema);
