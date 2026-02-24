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
    // If tenant, return only their tickets
    if (req.user && req.user.role === 'tenant') {
      const tickets = await Ticket.find({ tenant: req.user.id }).populate("tenant", "name email").populate("unit", "number").sort({ createdAt: -1 });
      return res.json(tickets);
    }

    // If owner, return only tickets for units belonging to this owner
    if (req.user && req.user.role === 'owner') {
      const Property = await import('../models/Property.js');
      const Unit = await import('../models/Unit.js');
      const props = await Property.default.find({ owner: req.user.id }, '_id');
      const propIds = props.map(p => p._id);
      const units = await Unit.default.find({ property: { $in: propIds } }, '_id tenant');
      const unitIds = units.map(u => u._id).filter(Boolean);
      const tenantIds = units.map(u => u.tenant).filter(Boolean);
      const tickets = await Ticket.find({ $or: [ { unit: { $in: unitIds } }, { tenant: { $in: tenantIds } } ] }).populate("tenant", "name email").populate("unit", "number").sort({ createdAt: -1 });
      return res.json(tickets);
    }

    // Admin / others: return all tickets
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
