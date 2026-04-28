const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institute",
      required: true,
      index: true
    },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    mobNo: { type: String, required: true },
    passwordHash: { type: String, required: true, select: false },
    roles: {
      type: [String],
      default: ["student"],
      enum: ["super_admin", "institute_admin", "teacher", "student"]
    },
    isApproved: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    lastLogin: { type: Date }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
