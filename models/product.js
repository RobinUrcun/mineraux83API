const mongoose = require("mongoose");

const stoneSchema = mongoose.Schema(
  {
    title: { type: String, required: false },
    description: { type: String, required: false },
    price: { type: Number, required: false },
    size: { type: String, required: false },
    weight: { type: Number, required: false },
    origin: { type: String, required: false },
    reference: { type: String, required: false },
    mainFile: { type: String, required: false },
    file: { type: Array, required: false },
  },
  { versionKey: false }
);

module.exports = mongoose.model("Stone", stoneSchema);
