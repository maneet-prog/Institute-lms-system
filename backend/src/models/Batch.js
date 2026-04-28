const mongoose = require("mongoose");

const batchDetailSchema = new mongoose.Schema(
  {
    description: String,
    roomName: String,
    scheduleNotes: String,
    startDate: String,
    endDate: String
  },
  { _id: false }
);

const batchSchema = new mongoose.Schema(
  {
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institute",
      required: true,
      index: true
    },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    subcourseId: { type: mongoose.Schema.Types.ObjectId, ref: "Subcourse", required: true },
    batchName: { type: String, required: true, trim: true },
    active: { type: Boolean, default: true },
    detail: { type: batchDetailSchema, default: null }
  },
  { timestamps: true }
);

batchSchema.index({ instituteId: 1, batchName: 1 }, { unique: true });

module.exports = mongoose.model("Batch", batchSchema);
