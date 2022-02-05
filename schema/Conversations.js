const mongoose = require("mongoose");

const conversationSchema = mongoose.Schema(
  {
    members: {
      type: Array,
    },
    lastMessage: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose?.models?.conversations ||
  mongoose.model("conversations", conversationSchema);
