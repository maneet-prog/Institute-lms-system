const mongoose = require("mongoose");

const speakingAudioCacheSchema = new mongoose.Schema(
  {
    provider: { type: String, required: true, trim: true, index: true },
    voiceId: { type: String, required: true, trim: true, index: true },
    textHash: { type: String, required: true, trim: true, index: true },
    text: { type: String, required: true },
    fileUrl: { type: String, required: true },
    storageKey: { type: String, default: null },
    mimeType: { type: String, default: "audio/mpeg" },
    meta: { type: mongoose.Schema.Types.Mixed, default: null }
  },
  { timestamps: true }
);

speakingAudioCacheSchema.index({ provider: 1, voiceId: 1, textHash: 1 }, { unique: true });

module.exports = mongoose.model("SpeakingAudioCache", speakingAudioCacheSchema);
