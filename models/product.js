const mongoose = require("mongoose");

const stoneSchema = mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    userId: { type: String, required: true },
    price: { type: Number, required: true },
    size: { type: String, required: false },
    reference: { type: String, required: true },
    origin: { type: String, required: false },
  },
  { versionKey: false }
);

module.exports = mongoose.model("Stone", stoneSchema);
