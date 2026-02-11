import express from "express";
import Property from "../models/Property.js";
import Unit from "../models/Unit.js";
import auth from "../middleware/auth.js";
import multer from "multer";
import path from "path";
const router = express.Router();

// Multer setup for multiple images + payment QR
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/property/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});
const upload = multer({ storage });

// Create property with multiple images and optional payment QR
router.post("/", auth, upload.fields([{ name: 'images', maxCount: 10 }, { name: 'paymentQr', maxCount: 1 }]), async (req, res) => {
  try {
    const imagePaths = (req.files && req.files.images) ? req.files.images.map(f => "/property/" + f.filename) : [];
    const paymentQrPath = (req.files && req.files.paymentQr && req.files.paymentQr[0]) ? "/property/" + req.files.paymentQr[0].filename : undefined;
    const paymentInfo = {
      bankName: req.body.bankName || undefined,
      accountNumber: req.body.accountNumber || undefined,
      ifsc: req.body.ifsc || undefined,
      upiId: req.body.upiId || undefined
    };
    const prop = await Property.create({
      ...req.body,
      images: imagePaths,
      paymentQr: paymentQrPath,
      paymentInfo,
      owner: req.user.id
    });
    res.json(prop);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/", async(req,res)=>{
  res.json(await Property.find());
});

// GET properties owned by logged-in user
router.get("/me", auth, async(req,res)=>{
  const properties = await Property.find({ owner: req.user.id });
  const propertiesWithUnits = await Promise.all(properties.map(async prop => {
    const units = await Unit.find({ property: prop._id });
    return { ...prop.toObject(), units };
  }));
  res.json(propertiesWithUnits);
});

// GET all properties with owner populated (authenticated)
router.get("/all", auth, async (req, res) => {
  const props = await Property.find().populate("owner", "name email");
  res.json(props);
});

router.get("/:id", async(req,res)=>{
  res.json(await Property.findById(req.params.id).populate("owner", "name email"));
});

// Update property with multiple images
router.put("/:id", auth, upload.fields([{ name: 'images', maxCount: 10 }, { name: 'paymentQr', maxCount: 1 }]), async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ error: "Property not found" });
    if (String(property.owner) !== String(req.user.id)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    let imagePaths = property.images || [];
    if (req.files && req.files.images && req.files.images.length > 0) {
      imagePaths = req.files.images.map(f => "/property/" + f.filename);
    }
    const paymentQrPath = (req.files && req.files.paymentQr && req.files.paymentQr[0]) ? "/property/" + req.files.paymentQr[0].filename : property.paymentQr;
    const paymentInfo = {
      bankName: req.body.bankName || property.paymentInfo?.bankName,
      accountNumber: req.body.accountNumber || property.paymentInfo?.accountNumber,
      ifsc: req.body.ifsc || property.paymentInfo?.ifsc,
      upiId: req.body.upiId || property.paymentInfo?.upiId
    };
    const updated = await Property.findByIdAndUpdate(
      req.params.id,
      { name: req.body.name, address: req.body.address, images: imagePaths, paymentQr: paymentQrPath, paymentInfo },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Delete property
router.delete("/:id", auth, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ error: "Property not found" });

    // Only owner can delete
    if (String(property.owner) !== String(req.user.id)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Delete all units associated with this property
    await Unit.deleteMany({ property: req.params.id });
    
    await Property.findByIdAndDelete(req.params.id);
    res.json({ message: "Property deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
