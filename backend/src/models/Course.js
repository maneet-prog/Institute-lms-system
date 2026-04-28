const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institute",
      required: true,
      index: true
    },
    courseName: { type: String, required: true, trim: true },
    description: { type: String, default: null },
    imageUrl: { type: String, default: null },
    imageStorageKey: { type: String, default: null },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

courseSchema.index({ instituteId: 1, courseName: 1 }, { unique: true });

module.exports = mongoose.model("Course", courseSchema);
