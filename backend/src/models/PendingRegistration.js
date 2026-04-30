const mongoose = require("mongoose");

const pendingRegistrationSchema = new mongoose.Schema(
  {
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institute",
      required: true,
      index: true
    },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true },
    mobNo: { type: String, required: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", default: null },
    subcourseId: { type: mongoose.Schema.Types.ObjectId, ref: "Subcourse", default: null },
    emailOtpHash: { type: String, required: true, select: false },
    mobileOtpHash: { type: String, required: true, select: false },
    emailVerifiedAt: { type: Date, default: null },
    mobileVerifiedAt: { type: Date, default: null },
    expiresAt: { type: Date, required: true },
    lastSentAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

pendingRegistrationSchema.index({ email: 1 }, { unique: true });
pendingRegistrationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("PendingRegistration", pendingRegistrationSchema);
