const { dbConnect } = require("../dbConnect");
const bcrypt = require("bcrypt");
const Room = require("../models/room");
const RoomAccess = require("../models/room_access");
const { default: mongoose } = require("mongoose");

const createRoom = async (req, res) => {
  try {
    await dbConnect();
    const { name, description, isPrivate, password, email } = req.body;

    const existingRoom = await Room.findOne({ room_name: name, email: email });

    if (existingRoom) {
      res.status(403).json({ message: "Room already exists" });
      return;
    }

    if (!name || !description || !email) {
      res.status(400).json({ message: "Name, description, email is required" });
      return;
    }

    if (isPrivate && !password) {
      res
        .status(400)
        .json({ message: "Password is required for secure rooms" });
      return;
    }

    let body;

    if (isPrivate) {
      const saltRounds = 10;
      const salt = await bcrypt.genSalt(saltRounds);
      const hashedPassword = await bcrypt.hash(password, salt);

      body = {
        room_name: name,
        room_description: description,
        is_private: isPrivate,
        room_password: hashedPassword,
        email,
      };
    } else {
      body = {
        room_name: name,
        email,
        room_description: description,
      };
    }
    const room = new Room(body);

    const savedRoom = room.save();
    res
      .status(201)
      .json({ message: "Room created successfully", room: savedRoom });
  } catch (error) {
    console.error("Error while creating room", error.message);
    res.status(500).json({ message: "Error while creating room" });
  }
};

const getRooms = async (req, res) => {
  try {
    await dbConnect();
    const rooms = await Room.find({});
    res.json({ rooms });
  } catch (err) {
    console.error("Error while fetching rooms", err.message);
    res.status(500).json({ message: "Error while fetching rooms" });
  }
};

const authenticateRoom = async (req, res) => {
  try {
    await dbConnect();

    const { email, password } = req.body;
    const roomId = req.params.id;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ message: "Invalid room ID" });
    }

    const objectRoomId = new mongoose.Types.ObjectId(roomId);

    const room = await Room.findById(objectRoomId);

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const userRoom = await RoomAccess.findOne({
      room_id: objectRoomId,
      user_id: email,
    });

    if (userRoom) {
      return res.status(200).json({ room });
    }

    if (room.is_private) {
      if (!password) {
        return res.status(400).json({ message: "Password is required" });
      }

      if (
        room.room_password &&
        !(await bcrypt.compare(password, room.room_password))
      ) {
        console.log(true);
        return res.status(401).json({ message: "Invalid password" });
      }
    }

    const roomAccess = new RoomAccess({
      user_id: email,
      room_id: objectRoomId,
    });

    await roomAccess.save();

    return res.status(200).json({ room });
  } catch (err) {
    console.error("Error while joining room", err);
    return res.status(500).json({ message: "Error while joining room" });
  }
};

const getAuthorizeRoom = async (req, res) => {
  try {
    await dbConnect();

    const email = req.user.payload.email;
    const roomId = req.params.room_id;

    console.log("email", email);
    console.log("room id", roomId);

    const userRoom = await RoomAccess.findOne({
      room_id: new mongoose.Types.ObjectId(roomId),
      user_id: email,
    });

    if (userRoom) {
      const room = await Room.findOne({
        _id: new mongoose.Types.ObjectId(roomId),
      });

      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }
      return res.status(200).json({ room });
    }

    const publicRoom = await Room.findOne({
      _id: new mongoose.Types.ObjectId(roomId),
    });
    if (!publicRoom.is_private) {
      return res.status(200).json({ room: publicRoom });
    }

    return res
      .status(200)
      .json({ authorized: false, message: "User is not authorized" });
  } catch (err) {
    console.error("Error while authorizing room", err);
    res
      .status(500)
      .json({ message: "Error while authorizing room", error: err.message });
  }
};

module.exports = {
  createRoom,
  getRooms,
  authenticateRoom,
  getAuthorizeRoom,
};
