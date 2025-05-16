const mongoose = require("mongoose");

const chatSchema = mongoose.Schema(
  {
    room_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    sender: {
      type: String,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
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

const Chat = mongoose.model("Chat", chatSchema);

module.exports = Chat;
