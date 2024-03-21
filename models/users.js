const mongoose = require("mongoose");
const UniqueValidator = require("mongoose-unique-validator");

const userSchema = mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  surname: { type: String, required: true },
  role: { type: String, required: true },
});

userSchema.plugin(UniqueValidator);

module.exports = mongoose.model("user", userSchema);
