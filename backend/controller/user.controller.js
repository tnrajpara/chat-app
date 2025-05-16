const User = require("../models/user");
const { dbConnect } = require("../dbConnect");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const { createAccessToken, createRefreshToken } = require("../utils/jwtUtils");

const verify = async (req, res) => {
  try {
    console.log("user", req.user);
    res.json({ user: req.user });
  } catch (error) {
    console.error("Verification error:", error);
    res.status(401).json({ error: error.message });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Please provide email and password" });
  }

  try {
    await dbConnect();
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      const payload = { email, name: user.name };
      const accessToken = await createAccessToken(payload);
      const refreshToken = await createRefreshToken(payload);

      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 2 * 60 * 60 * 1000,
        path: "/",
      });

      res.status(200).json({
        message: "Login successful",
        user: {
          _id: user._id,
          email: user.email,
          bio: user.bio,
        },
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    console.error("Login error:", error);
    res
      .status(500)
      .json({ message: "Server error during login", error: error.message });
  }
};

const logoutUser = async (req, res) => {
  try {
    res.clearCookie("accessToken");
    res.status(200).json({ message: "Logout successfully" });
  } catch (err) {
    console.err("Logout error:", err);
    res
      .status(500)
      .json({ message: "Server error during logout", error: err.message });
  }
};

const createUser = async (req, res) => {
  try {
    await dbConnect();
    const { email, password, name, bio } = req.body;

    if (!email || !password || !bio || !name) {
      return res
        .status(400)
        .json({ message: "Email, password, bio are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(409)
        .json({ message: "User already exists with this email" });
    }

    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      email,
      password: hashedPassword,
      name,
      bio: bio || "",
    });

    const savedUser = await newUser.save();

    const userResponse = {
      _id: savedUser._id,
      email: savedUser.email,
      name,
      bio: savedUser.bio,
      created_at: savedUser.created_at,
    };

    res
      .status(201)
      .json({ message: "User created successfully", user: userResponse });
  } catch (error) {
    console.error("Error creating user:", error);
    res
      .status(500)
      .json({ message: "Server error creating user", error: error.message });
  }
};
const getAllUsers = async (req, res) => {
  try {
    await dbConnect();
    const users = await User.find().select("-password -salt");
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res
      .status(500)
      .json({ message: "Server error fetching users", error: error.message });
  }
};

const getUserById = async (req, res) => {
  try {
    await dbConnect();

    const userId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    const user = await User.findById(userId).select("-password -salt");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    res
      .status(500)
      .json({ message: "Server error fetching user", error: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    await dbConnect();

    const userId = req.params.id;
    const { email, bio } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { email, bio },
      { new: true, runValidators: true }
    ).select("-password -salt");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res
      .status(200)
      .json({ message: "User updated successfully", user: updatedUser });
  } catch (error) {
    console.error("Error updating user:", error);

    if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
      return res
        .status(409)
        .json({ message: "Email already in use by another account." });
    }
    res
      .status(500)
      .json({ message: "Server error updating user", error: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    await dbConnect();

    const userId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res
      .status(200)
      .json({ message: "User deleted successfully", userId: userId });
  } catch (error) {
    console.error("Error deleting user:", error);
    res
      .status(500)
      .json({ message: "Server error deleting user", error: error.message });
  }
};

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  loginUser,
  logoutUser,
  verify,
};
