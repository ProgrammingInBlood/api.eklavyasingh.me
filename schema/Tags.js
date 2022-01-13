const mongoose = require("mongoose");

const Tags = mongoose.Schema({
  title: { type: String, required: false },
  description: { type: String, required: false },
  tags: { type: String, required: false },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose?.models?.tags || mongoose.model("tags", Tags);
