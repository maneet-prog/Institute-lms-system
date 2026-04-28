const mongoose = require("mongoose");

const moduleSchema = new mongoose.Schema(
  {
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institute",
      required: true,
      index: true
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true
    },
    subcourseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subcourse",
      required: true,
      index: true
    },
    moduleName: { type: String, required: true, trim: true },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

moduleSchema.index({ subcourseId: 1, moduleName: 1 }, { unique: true });

module.exports = mongoose.model("Module", moduleSchema);
