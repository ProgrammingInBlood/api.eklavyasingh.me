const mongoose = require("mongoose");

const nativeSchema = mongoose.Schema({
  userId: String,
  name: String,
  email: String,
  avatar: String,
  password: String,
  otp: String,
  token: String,
  timestamp: { type: Date, default: Date.now },
});

module.exports =
  mongoose.models.nativeToken || mongoose.model("nativeToken", nativeSchema);
