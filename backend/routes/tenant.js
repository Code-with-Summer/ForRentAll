import express from "express";
import TenantProfile from "../models/TenantProfile.js";
import multer from "multer";
import auth from "../middleware/auth.js";
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

// Update tenant profile (tenant themselves or owner)
router.put("/:userId", auth, upload.fields([{ name: 'idProof', maxCount: 1 }, { name: 'rentAgreement', maxCount: 1 }]), async (req, res) => {
  try {
    const { userId } = req.params;
    // Only allow the owner or the tenant themselves to update this profile
    if (req.user.role !== 'owner' && String(req.user.id) !== String(userId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    // Check if profile is locked
    const existing = await TenantProfile.findOne({ userId });
    if (existing && existing.locked) {
      return res.status(403).json({ error: 'Profile is locked and cannot be edited' });
    }
    const update = {
      address: req.body.address,
      emergencyContact: req.body.emergencyContact
    };
    if (req.files && req.files.idProof && req.files.idProof[0]) {
      update.idProof = req.files.idProof[0].filename;
    }
    if (req.files && req.files.rentAgreement && req.files.rentAgreement[0]) {
      update.rentAgreement = req.files.rentAgreement[0].filename;
    }
    if (req.body.numberOfPersons !== undefined) {
      const num = parseInt(req.body.numberOfPersons, 10);
      if (!isNaN(num)) update.numberOfPersons = num;
    }
    const profile = await TenantProfile.findOneAndUpdate(
      { userId },
      { $set: update, $setOnInsert: { userId } },
      { new: true, upsert: true }
    );
    res.json({ profile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Lock tenant profile (tenant can lock their own profile once complete)
router.put("/:userId/lock", auth, async (req, res) => {
  try {
    const { userId } = req.params;
    if (String(req.user.id) !== String(userId) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const profile = await TenantProfile.findOne({ userId });
    if (!profile) return res.status(400).json({ error: 'Profile not found' });
    // Ensure required fields are present before locking
    if (!profile.address || !profile.emergencyContact || !profile.idProof) {
      return res.status(400).json({ error: 'Profile incomplete; cannot lock' });
    }
    profile.locked = true;
    await profile.save();
    res.json({ profile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
