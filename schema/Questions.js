const mongoose = require("mongoose");

const questionSchema = mongoose.Schema({
  question: {
    type: String,
    required: true,
  },
  answers: {
    type: Array,
    required: false,
    maxlength: 3,
  },
  author: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  comments: {
    type: Array,
    required: false,
    maxlength: 500,
  },
  points: {
    type: Number,
    required: false,
  },
  isBrainlist: {
    type: Boolean,
    required: false,
    default: false,
  },
  created_at: { type: Date, default: Date.now },
});

module.exports =
  mongoose?.models?.questions || mongoose.model("questions", questionSchema);
