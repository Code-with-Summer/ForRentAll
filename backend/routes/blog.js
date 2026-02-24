import express from "express";
import multer from "multer";
import BlogPost from "../models/BlogPost.js";
import auth from "../middleware/auth.js";
import User from "../models/User.js";

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

// Upload an image for use in blog content (admin only)
router.post("/upload-image", auth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    // Ensure user is admin
    const user = await User.findById(req.user.id);
    if (!user || user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
    return res.json({ filename: req.file.filename, url: `/${req.file.filename}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a blog post (admin only)
router.post("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
    const { title, content } = req.body;
    if (!title) return res.status(400).json({ error: "Title required" });
    const parsedContent = typeof content === "string" ? JSON.parse(content) : content || [];
    const post = await BlogPost.create({ title, content: parsedContent, createdBy: user._id });
    res.json({ post });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a blog post (admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const { title, content } = req.body;
    const parsedContent = typeof content === 'string' ? JSON.parse(content) : content || [];
    const updated = await BlogPost.findByIdAndUpdate(req.params.id, { title, content: parsedContent }, { new: true });
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json({ post: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a blog post (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const deleted = await BlogPost.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Public: list blog posts (brief)
router.get("/", async (req, res) => {
  try {
    const posts = await BlogPost.find().sort({ createdAt: -1 }).lean();
    const list = posts.map(p => ({
      _id: p._id,
      title: p.title,
      excerpt: (p.content.find(c => c.type === "text")?.text || "").slice(0, 200),
      cover: p.content.find(c => c.type === "image")?.image || null,
      createdAt: p.createdAt
    }));
    res.json({ posts: list });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Public: single blog post
router.get("/:id", async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id).lean();
    if (!post) return res.status(404).json({ error: "Not found" });
    res.json({ post });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
