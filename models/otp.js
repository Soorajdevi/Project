const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: "10m", // Set expiration time for OTP, e.g., 1 minute
  },
});
module.exports = mongoose.model("otp", otpSchema);
