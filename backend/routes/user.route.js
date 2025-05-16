const express = require("express");
const userController = require("../controller/user.controller");
const { authenticateToken } = require("../utils/jwtUtils");
const router = express.Router();

router.post("/", userController.createUser);

router.get("/", userController.getAllUsers);

router.post("/login", userController.loginUser);

router.post("/logout", authenticateToken, userController.logoutUser);

router.get("/verify", authenticateToken, userController.verify);

router.get("/:id", authenticateToken, userController.getUserById);

router.put("/:id", userController.updateUser);

router.delete("/:id", userController.deleteUser);

module.exports = router;
