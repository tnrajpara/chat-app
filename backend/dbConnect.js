const mongoose = require("mongoose");
require("dotenv").config();

const MONGO_URI = process.env.MONGO_URI;

const dbConnect = async () => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  if (!MONGO_URI) {
    console.error(
      "ERROR: MONGO_URI is not defined in your environment variables."
    );
    process.exit(1);
  }
  try {
    await mongoose.connect(MONGO_URI);
    console.log("db connected", MONGO_URI);
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

module.exports = { dbConnect };
