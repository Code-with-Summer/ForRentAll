import express from "express";
import Ticket from "../models/Ticket.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import auth from "../middleware/auth.js";
const router = express.Router();

// Multer setup for ticket images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(process.cwd(), "uploads", "ticket");
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      cb(null, dir);
    } catch (err) {
      cb(err);
    }
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});
const upload = multer({ storage });

// Create ticket (tenant must be authenticated)
router.post("/", auth, upload.array("images", 10), async (req, res) => {
  try {
    const { subject, description } = req.body;
    const imagePaths = req.files ? req.files.map(f => "/ticket/" + f.filename) : [];
    const ticket = await Ticket.create({ subject, description, images: imagePaths, tenant: req.user.id });
    res.json(ticket);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// List tickets (populate tenant and unit)
router.get("/", auth, async (req, res) => {
  try {
    const tickets = await Ticket.find().populate("tenant", "name email").populate("unit", "number").sort({ createdAt: -1 });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update ticket status (owner only)
router.put("/:id/status", auth, async (req, res) => {
  try {
    if (req.user.role !== "owner") return res.status(403).json({ error: "Forbidden" });
    const updated = await Ticket.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true }).populate("tenant", "name email");
    if (!updated) return res.status(404).json({ error: "Ticket not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
