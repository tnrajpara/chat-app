const jose = require("jose");
const { TextEncoder } = require("util");
require("dotenv").config();

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_ACCESS_EXPIRATION = "60m";
const JWT_REFRESH_EXPIRATION = "7d";

if (!JWT_ACCESS_SECRET || !JWT_REFRESH_SECRET) {
  console.error(
    "FATAL ERROR: JWT secrets are not defined in environment variables."
  );
  process.exit(1);
}

const accessSecretKey = new TextEncoder().encode(JWT_ACCESS_SECRET);
const refreshSecretKey = new TextEncoder().encode(JWT_REFRESH_SECRET);

const createAccessToken = async (payload) => {
  try {
    const token = await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(JWT_ACCESS_EXPIRATION)
      .sign(accessSecretKey);
    return token;
  } catch (error) {
    console.error("Error creating access token:", error);
    throw new Error("Could not create access token");
  }
};
const createRefreshToken = async (payload) => {
  try {
    const token = await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(JWT_REFRESH_EXPIRATION)
      .sign(refreshSecretKey);
    return token;
  } catch (error) {
    console.error("Error creating refresh token:", error);
    throw new Error("Could not create refresh token");
  }
};

const authenticateToken = async (req, res, next) => {
  const token = req.cookies.accessToken;

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const payload = await verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

const verifyAccessToken = async (token) => {
  try {
    const decoded = await jose.jwtVerify(token, accessSecretKey);
    return decoded;
  } catch (error) {
    console.error(
      "Access token verification failed:",
      error.code || error.message
    );
    if (error.code === "ERR_JWT_EXPIRED") {
      throw new Error("Access token expired");
    }
    throw new Error("Invalid access token");
  }
};

const verifyRefreshToken = async (token) => {
  try {
    const { payload } = await jose.jwtVerify(token, refreshSecretKey);
    return { payload, token };
  } catch (error) {
    console.error(
      "Refresh token verification failed:",
      error.code || error.message
    );
    if (error.code === "ERR_JWT_EXPIRED") {
      throw new Error("Refresh token expired");
    }
    throw new Error("Invalid refresh token");
  }
};
module.exports = {
  createAccessToken,
  createRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  authenticateToken,
};
