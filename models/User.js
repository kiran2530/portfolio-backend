const mongoose = require("mongoose");

// Define User Schema
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
  },
  {
    timestamps: true,
  }
);

// Create User Model
module.exports = mongoose.model("User", userSchema);
