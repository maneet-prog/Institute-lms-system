const mongoose = require("mongoose");

const instituteSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    mobNo: { type: String, required: true },
    country: { type: String, required: true },
    state: { type: String, required: true },
    place: { type: String, required: true },
    pincode: { type: String, required: true },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Institute", instituteSchema);
