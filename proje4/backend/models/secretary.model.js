const mongoose = require("mongoose");

const SecretarySchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    surname: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
  },
  { timestamps: true }
);

const Secretary = mongoose.model("Secretary", SecretarySchema);
module.exports = Secretary;
