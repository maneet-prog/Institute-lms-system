const mongoose = require("mongoose");

const studentSubmissionSchema = new mongoose.Schema(
  {
    instituteId: { type: mongoose.Schema.Types.ObjectId, ref: "Institute", required: true, index: true },
    contentId: { type: mongoose.Schema.Types.ObjectId, ref: "Content", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    responseType: { type: String, required: true },
    responseText: String,
    responseUrl: String,
    submittedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

studentSubmissionSchema.index({ userId: 1, contentId: 1 }, { unique: true });

module.exports = mongoose.model("StudentSubmission", studentSubmissionSchema);
