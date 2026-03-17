import express from "express";
import ContactMessage from "../models/ContactMessage.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// POST /contact — public route, submit a contact form message
router.post("/", async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: "Name, email, and message are required." });
    }
    const msg = await ContactMessage.create({ name, email, phone, subject, message });
    res.status(201).json({ message: "Message received. We will get back to you soon.", id: msg._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /contact/messages — admin only, paginated
router.get("/messages", auth, async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }
    const page = Math.max(0, parseInt(req.query.page) || 0);
    const limit = parseInt(req.query.limit) || 6;
    const total = await ContactMessage.countDocuments();
    const messages = await ContactMessage.find()
      .sort({ createdAt: -1 })
      .skip(page * limit)
      .limit(limit)
      .lean();
    res.json({ messages, total, page, limit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /contact/messages/:id/resolve — admin only, mark as resolved
router.put("/messages/:id/resolve", auth, async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }
    const msg = await ContactMessage.findByIdAndUpdate(
      req.params.id,
      { resolved: true },
      { new: true }
    );
    if (!msg) return res.status(404).json({ error: "Message not found" });
    res.json({ message: "Marked as resolved", data: msg });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
