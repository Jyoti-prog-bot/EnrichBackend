const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const router = express.Router();

const ACCESS_SECRET = "ACCESS_SECRET";
const REFRESH_SECRET = "REFRESH_SECRET";

// TOKEN FUNCTIONS
const createAccessToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, ACCESS_SECRET, {
    expiresIn: "15m"
  });

const createRefreshToken = (user) =>
  jwt.sign({ id: user._id }, REFRESH_SECRET, {
    expiresIn: "7d"
  });

// REGISTER
router.post("/register", async (req, res) => {
  const hash = await bcrypt.hash(req.body.password, 10);

  const user = new User({
    username: req.body.username,
    password: hash,
    role: req.body.role || "user"
  });

  await user.save();
  res.send("User Created");
});

// LOGIN
router.post("/login", async (req, res) => {
  const user = await User.findOne({ username: req.body.username });

  if (!user) return res.status(400).send("User not found");

  const match = await bcrypt.compare(req.body.password, user.password);

  if (!match) return res.status(400).send("Wrong password");

  const accessToken = createAccessToken(user);
  const refreshToken = createRefreshToken(user);

  user.refreshToken = refreshToken;
  await user.save();

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: false,
    sameSite: "strict"
  });

  res.json({ accessToken });
});

// REFRESH
router.post("/refresh", async (req, res) => {
  const token = req.cookies.refreshToken;

  if (!token) return res.status(401).send("No refresh token");

  try {
    const decoded = jwt.verify(token, REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== token) {
      return res.status(403).send("Invalid refresh token");
    }

    const newAccessToken = createAccessToken(user);
    res.json({ accessToken: newAccessToken });

  } catch {
    res.status(403).send("Refresh expired");
  }
});

// LOGOUT
router.post("/logout", async (req, res) => {
  const token = req.cookies.refreshToken;

  if (token) {
    const user = await User.findOne({ refreshToken: token });
    if (user) {
      user.refreshToken = null;
      await user.save();
    }
  }

  res.clearCookie("refreshToken");
  res.send("Logged out");
});

module.exports = router;   // ✅ FIXED (IMPORTANT)