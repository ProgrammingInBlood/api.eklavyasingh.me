const mongoose = require("mongoose");

const nativeSchema = mongoose.Schema({
  userId: String,
  name: String,
  email: String,
  avatar: String,
  provider: String,
  password: String,
  timestamp: { type: Date, default: Date.now },
});

module.exports =
  mongoose.models.nativeUser || mongoose.model("nativeUser", nativeSchema);
