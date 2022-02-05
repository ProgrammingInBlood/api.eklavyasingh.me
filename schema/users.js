const mongoose = require("mongoose");

const nativeSchema = mongoose.Schema(
  {
    userId: String,
    username: String,
    age: Number,
    name: String,
    email: String,
    avatar: String,
    provider: String,
    password: String,
    description: String,
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "nativeUser",
      },
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "nativeUser",
      },
    ],
    isRegistered: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.nativeUser || mongoose.model("nativeUser", nativeSchema);
