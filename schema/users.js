const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  avatar: String,
  isVerified: { type: Boolean, default: false },
  password: String,
  isBlocked: { type: Boolean, default: false },
  address: Array,
  zip: Array,
  cardDetails: Array,
  timestamp: String,
});

module.exports =
  mongoose.models.userAccounts || mongoose.model("userAccounts", userSchema);
