const express = require("express");
const chatController = require("../controller/chat.controller");
const router = express.Router();
const { authenticateToken } = require("../utils/jwtUtils");

router.get("/:roomId", authenticateToken, chatController.getChatsByRoomId);

module.exports = router;
