
import express from "express";
import User from "../models/User.js";
import OwnerProfile from "../models/OwnerProfile.js";
import TenantProfile from "../models/TenantProfile.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
const router = express.Router();

// Change password
router.put("/change-password/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { oldPassword, password } = req.body;
    if (!oldPassword || !password || password.length < 6) {
      return res.status(400).json({ error: "Old password and new password (min 6 chars) required." });
    }
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) return res.status(400).json({ error: "Old password is incorrect." });
    const hashed = await bcrypt.hash(password, 10);
    await User.findByIdAndUpdate(userId, { password: hashed });
    res.json({ message: "Password updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const JWT_SECRET = "supersecretkey";

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const roleToUse = role || "tenant";
    const user = await User.create({ name, email, password: hashedPassword, role: roleToUse });

    // Create profile based on role
    if (roleToUse === "owner") {
      await OwnerProfile.create({ userId: user._id });
    } else if (roleToUse === "tenant") {
      await TenantProfile.create({ userId: user._id, numberOfPersons: 1 });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
// Fetch profile by userId and role
router.get("/profile/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    let profile = null;
    if (user.role === "owner") {
      profile = await OwnerProfile.findOne({ userId });
    } else if (user.role === "tenant") {
      profile = await TenantProfile.findOne({ userId });
    }
    res.json({ user, profile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  console.log("Login attempt for:", email);
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ error: "User not found" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ error: "Wrong password" });

  const token = jwt.sign(
    { id: user._id, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({ token, user });
});

export default router;