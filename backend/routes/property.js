import express from "express";
import Property from "../models/Property.js";
import Unit from "../models/Unit.js";
import User from "../models/User.js";
import auth from "../middleware/auth.js";
import requireOwnerSubscription from "../middleware/requireOwnerSubscription.js";
import OwnerSubscription from "../models/OwnerSubscription.js";
import multer from "multer";
import path from "path";
import fs from "fs";
const router = express.Router();

// Multer setup for multiple images + payment QR
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), "uploads", "property");
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});
const upload = multer({ storage });

const getActiveOwnerIds = async () => {
  const now = new Date();
  await OwnerSubscription.updateMany(
    { status: "active", endsAt: { $lt: now } },
    { $set: { status: "expired" } },
  );
  const activeSubs = await OwnerSubscription.find({
    status: "active",
    startsAt: { $lte: now },
    endsAt: { $gte: now },
  }).select("owner");
  const ownerIds = [...new Set(activeSubs.map((s) => String(s.owner)))];
  const activeOwners = await User.find({ _id: { $in: ownerIds }, isActive: { $ne: false } }).select("_id");
  return new Set(activeOwners.map((u) => String(u._id)));
};

// Create property with multiple images and optional payment QR
router.post("/", auth, requireOwnerSubscription, upload.fields([{ name: 'images', maxCount: 10 }, { name: 'paymentQr', maxCount: 1 }]), async (req, res) => {
  try {
    const imagePaths = (req.files && req.files.images) ? req.files.images.map(f => "/property/" + f.filename) : [];
    const paymentQrPath = (req.files && req.files.paymentQr && req.files.paymentQr[0]) ? "/property/" + req.files.paymentQr[0].filename : undefined;
    const prop = await Property.create({
      name: req.body.name,
      address: req.body.address,
      country: req.body.country || undefined,
      state: req.body.state || undefined,
      city: req.body.city || undefined,
      area: req.body.area || undefined,
      images: imagePaths,
      paymentQr: paymentQrPath,
      owner: req.user.id
    });
    res.json(prop);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/", async(req,res)=>{
  try {
    const activeOwnerIds = await getActiveOwnerIds();
    const { country, state, city, area } = req.query;
    const q = {};
    if (country) q.country = country;
    if (state) q.state = state;
    if (city) q.city = city;
    if (area) q.area = area;

    q.adminDeactivated = { $ne: true };
    q.subscriptionDeactivated = { $ne: true };
    const props = await Property.find(q);
    res.json(props.filter((p) => activeOwnerIds.has(String(p.owner))));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET properties owned by logged-in user
router.get("/me", auth, requireOwnerSubscription, async(req,res)=>{
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
  const activeOwnerIds = await getActiveOwnerIds();
  const property = await Property.findById(req.params.id).populate("owner", "name email");
  if (!property) return res.status(404).json({ error: "Property not found" });
  const ownerId = property?.owner?._id || property?.owner;
  if (property.adminDeactivated || property.subscriptionDeactivated || !ownerId || !activeOwnerIds.has(String(ownerId))) {
    return res.status(404).json({ error: "Property not found" });
  }
  res.json(property);
});

// Update property with multiple images
router.put("/:id", auth, requireOwnerSubscription, upload.fields([{ name: 'images', maxCount: 10 }, { name: 'paymentQr', maxCount: 1 }]), async (req, res) => {
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
      {
        name: req.body.name,
        address: req.body.address,
        country: req.body.country || property.country,
        state: req.body.state || property.state,
        city: req.body.city || property.city,
        area: req.body.area || property.area,
        images: imagePaths,
        paymentQr: paymentQrPath,
        paymentInfo
      },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Delete property
router.delete("/:id", auth, requireOwnerSubscription, async (req, res) => {
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
