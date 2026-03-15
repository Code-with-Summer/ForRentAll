
import express from "express";
import User from "../models/User.js";
import OwnerProfile from "../models/OwnerProfile.js";
import TenantProfile from "../models/TenantProfile.js";
import AdminProfile from "../models/AdminProfile.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import auth from "../middleware/auth.js";
import multer from "multer";
import path from "path";
import fs from "fs";
const router = express.Router();
const ownerProfileUploadStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), "uploads", "owner-payment");
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});
const ownerProfileUpload = multer({ storage: ownerProfileUploadStorage });
const adminProfileUploadStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), "uploads", "admin-payment");
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});
const adminProfileUpload = multer({ storage: adminProfileUploadStorage });

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
    } else if (user.role === "admin") {
      profile = await AdminProfile.findOne({ userId });
    }
    // Serialize profile_photo to a consumable URL when stored as binary
    const userObj = user.toObject();
    if (userObj.profile_photo && userObj.profile_photo.data) {
      userObj.profile_photo = `user-photo/${userId}`;
    }

    res.json({ user: userObj, profile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update owner profile (owner themselves or admin)
router.put("/owner-profile/:userId", auth, ownerProfileUpload.single("paymentQr"), async (req, res) => {
  try {
    const { userId } = req.params;
    if (String(req.user.id) !== String(userId) && req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }
    const update = {};
    if (req.body.licenseNumber !== undefined) update.licenseNumber = req.body.licenseNumber;
    if (req.body.documents !== undefined) update.documents = req.body.documents;
    if (req.body.bankName !== undefined) update.bankName = req.body.bankName;
    if (req.body.accountNumber !== undefined) update.accountNumber = req.body.accountNumber;
    if (req.body.ifsc !== undefined) update.ifsc = req.body.ifsc;
    if (req.body.upiId !== undefined) update.upiId = req.body.upiId;
    if (req.file) update.paymentQr = `owner-payment/${req.file.filename}`;
    if (req.body.verified !== undefined && req.user.role === "admin") update.verified = req.body.verified;

    const prof = await OwnerProfile.findOneAndUpdate({ userId }, update, { new: true, upsert: true });
    res.json({ profile: prof });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update admin profile (admin themselves)
router.put("/admin-profile/:userId", auth, adminProfileUpload.single("paymentQr"), async (req, res) => {
  try {
    const { userId } = req.params;
    if (String(req.user.id) !== String(userId) && req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }
    const update = {};
    ["title", "phone", "photo", "bio", "officeAddress", "bankName", "accountNumber", "ifsc", "upiId"].forEach(k => {
      if (req.body[k] !== undefined) update[k] = req.body[k];
    });
    if (req.file) update.paymentQr = `admin-payment/${req.file.filename}`;
    if (req.body.permissions !== undefined) {
      // accept comma-separated or array
      update.permissions = Array.isArray(req.body.permissions) ? req.body.permissions : String(req.body.permissions).split(",").map(s => s.trim()).filter(Boolean);
    }

    const prof = await AdminProfile.findOneAndUpdate({ userId }, update, { new: true, upsert: true });
    res.json({ profile: prof });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update basic user fields (name, phone, address)
router.put("/user/:userId", auth, async (req, res) => {
  try {
    const { userId } = req.params;
    if (String(req.user.id) !== String(userId) && req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }
    const update = {};
    if (req.body.name !== undefined) update.name = req.body.name;
    if (req.body.phone !== undefined) update.phone = req.body.phone;
    if (req.body.address !== undefined) update.address = req.body.address;

    const user = await User.findByIdAndUpdate(userId, update, { new: true });
    res.json({ user });
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
