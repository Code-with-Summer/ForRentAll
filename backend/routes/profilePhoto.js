import express from "express";
import User from "../models/User.js";
import multer from "multer";
const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});
const upload = multer({ storage });

// Upload or update profile photo
router.put("/:userId/photo", upload.single("profile_photo"), async (req, res) => {
  try {
    const { userId } = req.params;
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const user = await User.findByIdAndUpdate(userId, { profile_photo: req.file.filename }, { new: true });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
