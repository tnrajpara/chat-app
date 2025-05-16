const { dbConnect } = require("../dbConnect");
const Chat = require("../models/chat");

const getChatsByRoomId = async (req, res) => {
  try {
    dbConnect();
    const { roomId } = req.params;
    const { limit = 50, before } = req.query;

    let query = { room_id: roomId };

    if (before) {
      query.createdAt = { $lt: new Date(parseInt(before)) };
    }

    const chats = await Chat.find(query)
      .sort({ created_at: -1 })
      .limit(parseInt(limit));

    return res.status(200).json({ chats: chats.reverse() });
  } catch (error) {
    console.error("Error fetching chat history:", error);
    return res.status(500).json({
      message: "Failed to fetch chat history",
      error: error.message,
    });
  }
};

module.exports = {
  getChatsByRoomId,
};
