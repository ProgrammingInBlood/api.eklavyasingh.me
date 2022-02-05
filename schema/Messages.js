const mongoose = require("mongoose");

const messageSchema = mongoose.Schema({
  conversationId: {
    type: String,
  },
  senderId: {
    type: String,
  },
  message: {
    type: String,
  },
  created_at: { type: Date, default: Date.now },
});

module.exports =
  mongoose?.models?.messages || mongoose.model("messages", messageSchema);
