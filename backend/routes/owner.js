import express from "express";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import auth from "../middleware/auth.js";
import OwnerProfile from "../models/OwnerProfile.js";
import multer from "multer";

const router = express.Router();
const JWT_SECRET = "supersecretkey";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});
const upload = multer({ storage });

// Admin creates a new owner
router.post("/add", auth, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    // Only allow admin to create owner
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: "Email already registered" });
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword, role: "owner" });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin views all owners
router.get("/all", auth, async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }
    const owners = await User.find({ role: "owner" });
    res.json({ owners });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin views details of a specific owner
router.get("/:id", auth, async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }
    const owner = await User.findOne({ _id: req.params.id, role: "owner" });
    if (!owner) return res.status(404).json({ error: "Owner not found" });
    res.json({ owner });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin deletes an owner (and their owner profile)
router.delete("/:id", auth, async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }
    const { id } = req.params;
    const user = await User.findOneAndDelete({ _id: id, role: "owner" });
    if (!user) return res.status(404).json({ error: "Owner not found" });
    // remove associated owner profile(s)
    await OwnerProfile.deleteMany({ userId: id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Owner (or admin) updates owner user + profile
router.put("/profile/:userId", auth, upload.fields([{ name: 'profile_photo', maxCount: 1 }, { name: 'documents', maxCount: 1 }]), async (req, res) => {
  try {
    const { userId } = req.params;
    // allow owner to update own profile or admin
    if (!req.user || (req.user.role !== 'admin' && String(req.user.id) !== String(userId))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updateUser = {};
    if (req.body.name) updateUser.name = req.body.name;
    if (req.body.phone) updateUser.phone = req.body.phone;
    if (req.files && req.files.profile_photo && req.files.profile_photo[0]) {
      updateUser.profile_photo = req.files.profile_photo[0].filename;
    }

    if (Object.keys(updateUser).length) {
      await User.findByIdAndUpdate(userId, updateUser);
    }

    // update or create owner profile
    const profileUpdate = {};
    if (req.body.licenseNumber) profileUpdate.licenseNumber = req.body.licenseNumber;
    if (req.files && req.files.documents && req.files.documents[0]) profileUpdate.documents = req.files.documents[0].filename;

    let ownerProfile = await OwnerProfile.findOne({ userId });
    if (ownerProfile) {
      await OwnerProfile.findOneAndUpdate({ userId }, { $set: profileUpdate }, { new: true });
    } else {
      await OwnerProfile.create({ userId, ...profileUpdate });
    }

    const user = await User.findById(userId);
    const profile = await OwnerProfile.findOne({ userId });
    res.json({ user, profile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

