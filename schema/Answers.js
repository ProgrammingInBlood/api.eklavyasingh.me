const mongoose = require("mongoose");

const answerSchema = mongoose.Schema({
  answer: {
    type: String,
    required: true,
  },
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "questions",
  },
  author: {
    type: String,
    required: true,
  },
  comments: {
    type: Array,
    required: false,
    maxLength: 500,
  },
  likes: {
    type: Array,
    required: false,
  },
  created_at: { type: Date, default: Date.now },
});

module.exports =
  mongoose?.models?.answers || mongoose.model("answers", answerSchema);
