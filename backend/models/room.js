const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    room_name: {
      type: String,
      required: true,
      trim: true,
    },
    room_description: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
    },
    is_private: {
      type: Boolean,
      default: false,
    },
    room_password: {
      type: String,
      validate: {
        validator: function (value) {
          if (this.is_private) {
            return value && value.trim().length > 0;
          }
          return true;
        },
        message: "Password is required for private rooms",
      },
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

const Room = mongoose.model("Room", roomSchema);
module.exports = Room;
