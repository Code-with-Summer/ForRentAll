import express from "express";
import User from "../models/User.js";
import multer from "multer";
const router = express.Router();

// Use memory storage so we can save the file buffer into the database
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Upload or update profile photo
router.put("/:userId/photo", upload.single("profile_photo"), async (req, res) => {
  try {
    const { userId } = req.params;
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const update = {
      profile_photo: {
        data: req.file.buffer,
        contentType: req.file.mimetype
      }
    };

    const user = await User.findByIdAndUpdate(userId, update, { new: true });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
