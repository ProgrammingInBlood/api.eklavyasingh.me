const mongoose = require("mongoose");

const Foods = mongoose.Schema({
  name: { type: String, required: false },
  description: { type: String, required: false },
  price: { type: Number, required: false },
  type: { type: String, required: false },
  image: { type: String, required: true },

  tags: [
    {
      name: { type: String, required: false },
    },
  ],
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose?.models?.foods || mongoose.model("foods", Foods);
