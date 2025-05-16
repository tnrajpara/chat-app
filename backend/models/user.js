const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    bio: {
      type: String,
      required: false,
    },
    created_at: {
      type: Number,
      default: () => Math.floor(Date.now() / 1000),
      get: (timestamp) => timestamp,
      set: (timestamp) => timestamp,
    },
  },
  {
    versionKey: false,
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

const User = mongoose.model("User", userSchema);
module.exports = User;
