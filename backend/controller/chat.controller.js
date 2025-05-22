const { dbConnect } = require("../dbConnect");
const Chat = require("../models/chat");

const getChatsByRoomId = async (req, res) => {
  try {
    await dbConnect();
    const { roomId } = req.params;
    const { limit = 50, before } = req.query;

    let query = { room_id: roomId };

    if (before) {
      query.created_at = { $lt: parseInt(before) };
    }

    const chats = await Chat.find(query)
      .sort({ created_at: 1 })
      .limit(parseInt(limit));

    let hasMore = false;
    let nextBefore = null;

    if (chats.length === parseInt(limit)) {
      const newestTimestamp = chats[chats.length - 1]?.created_at;

      if (newestTimestamp) {
        const newerMessagesCount = await Chat.countDocuments({
          room_id: roomId,
          created_at: { $gt: newestTimestamp },
        });

        hasMore = newerMessagesCount > 0;
        nextBefore = newestTimestamp + 1;
      }
    }
    if (!before) {
      // Get total count of messages
      const totalMessages = await Chat.countDocuments({ room_id: roomId });

      if (totalMessages > parseInt(limit)) {
        // Get the most recent messages by skipping older ones
        const skip = Math.max(0, totalMessages - parseInt(limit));

        const recentChats = await Chat.find({ room_id: roomId })
          .sort({ created_at: 1 })
          .skip(skip)
          .limit(parseInt(limit));

        // Check if there are older messages
        hasMore = skip > 0;
        nextBefore = recentChats[0]?.created_at;

        return res.status(200).json({
          success: true,
          chats: recentChats,
          hasMore: hasMore,
          nextBefore: nextBefore,
          total: totalMessages,
          pagination: {
            currentPage: Math.ceil(totalMessages / parseInt(limit)),
            totalPages: Math.ceil(totalMessages / parseInt(limit)),
            limit: parseInt(limit),
          },
        });
      }
    }

    return res.status(200).json({
      success: true,
      chats: chats,
      hasMore: hasMore,
      nextBefore: nextBefore,
      pagination: {
        limit: parseInt(limit),
        returned: chats.length,
      },
    });
  } catch (error) {
    console.error("Error fetching chat history:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch chat history",
      error: error.message,
    });
  }
};

module.exports = {
  getChatsByRoomId,
};
