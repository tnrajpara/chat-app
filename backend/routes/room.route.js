const express = require("express");
const roomController = require("../controller/room.controller");
const router = express.Router();
const { authenticateToken } = require("../utils/jwtUtils");

router.post("/", authenticateToken, roomController.createRoom);

router.get("/", authenticateToken, roomController.getRooms);

router.post("/:id", authenticateToken, roomController.authenticateRoom);

router.get("/:room_id", authenticateToken, roomController.getAuthorizeRoom);

module.exports = router;
