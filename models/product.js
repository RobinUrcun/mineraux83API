const { create } = require("domain");
const mongoose = require("mongoose");
const { type } = require("os");

const stoneSchema = mongoose.Schema(
  {
    title: { type: String, required: false },
    description: { type: String, required: false },
    price: { type: Number, required: false },
    size: { type: String, required: false },
    weight: { type: Number, required: false },
    origin: { type: String, required: false },
    reference: { type: String, required: false },
    sold: { type: Boolean, required: true },
    mainFile: { type: Array, required: false },
    file: { type: Array, required: false },
    categories: { type: Array, required: false },
    createdAt: { type: Number, required: false },
  },
  { versionKey: false }
);

module.exports = mongoose.model("Stone", stoneSchema);
