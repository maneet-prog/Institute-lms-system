const mongoose = require("mongoose");

const userCourseSchema = new mongoose.Schema(
  {
    instituteId: { type: mongoose.Schema.Types.ObjectId, ref: "Institute", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    subcourseId: { type: mongoose.Schema.Types.ObjectId, ref: "Subcourse", required: true },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);
userCourseSchema.index({ userId: 1, courseId: 1, subcourseId: 1 }, { unique: true });

const userSelectedCourseSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    subcourseId: { type: mongoose.Schema.Types.ObjectId, ref: "Subcourse", required: true },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);
userSelectedCourseSchema.index({ userId: 1, courseId: 1, subcourseId: 1 }, { unique: true });

const userModuleSchema = new mongoose.Schema(
  {
    instituteId: { type: mongoose.Schema.Types.ObjectId, ref: "Institute", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    moduleId: { type: mongoose.Schema.Types.ObjectId, ref: "Module", required: true },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);
userModuleSchema.index({ userId: 1, moduleId: 1 }, { unique: true });

const userBatchSchema = new mongoose.Schema(
  {
    instituteId: { type: mongoose.Schema.Types.ObjectId, ref: "Institute", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: "Batch", required: true },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);
userBatchSchema.index({ userId: 1, batchId: 1 }, { unique: true });

const batchTeacherSchema = new mongoose.Schema(
  {
    instituteId: { type: mongoose.Schema.Types.ObjectId, ref: "Institute", required: true, index: true },
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: "Batch", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);
batchTeacherSchema.index({ batchId: 1, userId: 1 }, { unique: true });

const userContentSchema = new mongoose.Schema(
  {
    instituteId: { type: mongoose.Schema.Types.ObjectId, ref: "Institute", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    contentId: { type: mongoose.Schema.Types.ObjectId, ref: "Content", required: true },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);
userContentSchema.index({ userId: 1, contentId: 1 }, { unique: true });

module.exports = {
  UserCourse: mongoose.model("UserCourse", userCourseSchema),
  UserSelectedCourse: mongoose.model("UserSelectedCourse", userSelectedCourseSchema),
  UserModule: mongoose.model("UserModule", userModuleSchema),
  UserBatch: mongoose.model("UserBatch", userBatchSchema),
  BatchTeacher: mongoose.model("BatchTeacher", batchTeacherSchema),
  UserContent: mongoose.model("UserContent", userContentSchema)
};
