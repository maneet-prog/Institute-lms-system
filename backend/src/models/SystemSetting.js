const mongoose = require("mongoose");

const systemSettingSchema = new mongoose.Schema(
  {
    defaultInstituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institute",
      default: null
    },
    allowMultiTenant: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("SystemSetting", systemSettingSchema);
