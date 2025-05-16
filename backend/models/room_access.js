const mongoose = require("mongoose");

const roomAccessSchema = mongoose.Schema(
  {
    room_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    user_id: {
      type: String,
      ref: "User",
      required: true,
    },
    granted_at: {
      type: Date,
      default: () => Math.floor(Date.now() / 1000),
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

const RoomAccess = mongoose.model("RoomAccess", roomAccessSchema);

module.exports = RoomAccess;
