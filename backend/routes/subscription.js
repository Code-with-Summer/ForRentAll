import express from "express";
import auth from "../middleware/auth.js";
import PackagePlan from "../models/PackagePlan.js";
import OwnerSubscription from "../models/OwnerSubscription.js";
import User from "../models/User.js";
import Property from "../models/Property.js";
import AdminProfile from "../models/AdminProfile.js";
import { getActiveOwnerSubscription } from "../middleware/requireOwnerSubscription.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = express.Router();
const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    const uploadDir = path.join(process.cwd(), "uploads", "subscription-payments");
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: function (_req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

const toMoney = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round((n + Number.EPSILON) * 100) / 100;
};

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + Number(days || 0));
  return d;
};

const getRemainingDays = (endsAt) => {
  if (!endsAt) return 0;
  const diffMs = new Date(endsAt).getTime() - Date.now();
  if (!Number.isFinite(diffMs) || diffMs <= 0) return 0;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

const buildProration = ({ activeSubscription, newPlan }) => {
  const newPlanPrice = toMoney(newPlan?.price || 0);
  if (!activeSubscription) {
    return {
      hasActiveSubscription: false,
      currentPlan: null,
      remainingDays: 0,
      remainingValue: 0,
      newPlanPrice,
      finalPayableAmount: newPlanPrice,
    };
  }

  const remainingDays = getRemainingDays(activeSubscription.endsAt);
  const durationDays = Number(activeSubscription.durationDays || 0);
  const pricePaid = toMoney(activeSubscription.pricePaid || 0);
  const perDayCost = durationDays > 0 ? pricePaid / durationDays : 0;
  const remainingValue = toMoney(perDayCost * remainingDays);
  const finalPayableAmount = Math.max(0, toMoney(newPlanPrice - remainingValue));

  return {
    hasActiveSubscription: true,
    currentPlan: {
      planCode: activeSubscription.planCode,
      planName: activeSubscription.planName,
      pricePaid,
      durationDays,
      endsAt: activeSubscription.endsAt,
    },
    remainingDays,
    remainingValue,
    newPlanPrice,
    finalPayableAmount,
  };
};

// Public: read available packages
router.get("/plans", async (_req, res) => {
  try {
    const plans = await PackagePlan.find({ isActive: true }).sort({ price: 1 }).lean();
    res.json({ plans });
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(409).json({ error: "This transaction ID is already used." });
    }
    res.status(500).json({ error: err.message });
  }
});

// Owner/admin: get platform payment details (admin's bank/upi/qr)
router.get("/payment-info", auth, async (req, res) => {
  try {
    if (!req.user || (req.user.role !== "owner" && req.user.role !== "admin")) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const adminUser = await User.findOne({ role: "admin" }).lean();
    if (!adminUser) return res.json({ paymentInfo: null });
    const profile = await AdminProfile.findOne({ userId: adminUser._id }).lean();
    if (!profile) return res.json({ paymentInfo: null });
    res.json({
      paymentInfo: {
        adminName: adminUser.name || "",
        adminEmail: adminUser.email || "",
        adminPhone: adminUser.phone || "",
        officeAddress: profile.officeAddress || "",
        bankName: profile.bankName || "",
        accountNumber: profile.accountNumber || "",
        ifsc: profile.ifsc || "",
        upiId: profile.upiId || "",
        paymentQr: profile.paymentQr || "",
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Owner: check subscription status
router.get("/my", auth, async (req, res) => {
  try {
    if (!req.user || req.user.role !== "owner") return res.status(403).json({ error: "Forbidden" });
    const owner = await User.findById(req.user.id).lean();
    const activeSubscription = await getActiveOwnerSubscription(req.user.id);
    const pendingSubscription = await OwnerSubscription.findOne({
      owner: req.user.id,
      status: "pending",
    }).sort({ createdAt: -1 }).lean();
    const history = await OwnerSubscription.find({ owner: req.user.id }).sort({ createdAt: -1 }).limit(20).lean();
    let blockedReason = "";
    if (!owner || owner.isActive === false) blockedReason = "ADMIN_DEACTIVATED";
    else if (owner.subscriptionBlockedByAdmin) blockedReason = "ADMIN_CANCELLED_SUBSCRIPTION";
    else if (!activeSubscription && pendingSubscription) blockedReason = "PAYMENT_PENDING";
    else if (!activeSubscription) blockedReason = "PACKAGE_EXPIRED";

    const expiryWarning = (() => {
      if (!activeSubscription?.endsAt) return null;
      const now = new Date();
      const diffMs = new Date(activeSubscription.endsAt).getTime() - now.getTime();
      const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      if (daysLeft <= 7) {
        return { daysLeft: Math.max(daysLeft, 0), endsAt: activeSubscription.endsAt };
      }
      return null;
    })();

    const remainingDays = activeSubscription?.endsAt ? getRemainingDays(activeSubscription.endsAt) : 0;

    res.json({
      ownerActive: !!owner && owner.isActive !== false,
      hasActivePackage: !!activeSubscription,
      selfPurchaseAllowed: !!owner && owner.isActive !== false && !owner.subscriptionBlockedByAdmin,
      blockedReason,
      activeSubscription,
      activeSubscriptionRemainingDays: remainingDays,
      pendingSubscription,
      expiryWarning,
      history,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Owner: preview payable amount for a plan (with proration credit if active subscription exists)
router.get("/purchase-preview", auth, async (req, res) => {
  try {
    if (!req.user || req.user.role !== "owner") return res.status(403).json({ error: "Forbidden" });
    const planCode = String(req.query?.planCode || "").toUpperCase();
    if (!planCode) return res.status(400).json({ error: "planCode required" });

    const plan = await PackagePlan.findOne({ code: planCode, isActive: true }).lean();
    if (!plan) return res.status(404).json({ error: "Package not found" });

    const activeSubscription = await getActiveOwnerSubscription(req.user.id);
    const pricing = buildProration({ activeSubscription, newPlan: plan });
    res.json({ plan, pricing });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Owner: purchase package (simulated payment)
router.post("/purchase", auth, upload.single("screenshot"), async (req, res) => {
  try {
    if (!req.user || req.user.role !== "owner") return res.status(403).json({ error: "Forbidden" });
    const { planCode, paymentRef } = req.body;
    if (!planCode) return res.status(400).json({ error: "planCode required" });

    const owner = await User.findById(req.user.id);
    if (!owner) return res.status(404).json({ error: "Owner not found" });
    if (owner.isActive === false) return res.status(403).json({ error: "Owner account deactivated by admin." });
    if (owner.subscriptionBlockedByAdmin) {
      return res.status(403).json({ error: "Subscription is cancelled by admin. Please contact admin." });
    }

    const pendingExisting = await OwnerSubscription.findOne({ owner: req.user.id, status: "pending" });
    if (pendingExisting) {
      return res.status(409).json({ error: "You already have a pending subscription awaiting verification." });
    }

    const plan = await PackagePlan.findOne({ code: String(planCode).toUpperCase(), isActive: true });
    if (!plan) return res.status(404).json({ error: "Package not found" });

    const activeSubscription = await getActiveOwnerSubscription(req.user.id);
    const pricing = buildProration({ activeSubscription, newPlan: plan });
    let normalizedPaymentRef = String(paymentRef || "").trim();
    if (pricing.finalPayableAmount > 0 && !normalizedPaymentRef) {
      return res.status(400).json({ error: "paymentRef required" });
    }
    if (!normalizedPaymentRef) {
      normalizedPaymentRef = `UPGRADE-CREDIT-${Date.now()}`;
    }

    const existingPayment = await OwnerSubscription.findOne({ paymentRef: normalizedPaymentRef });
    if (existingPayment) {
      return res.status(409).json({ error: "This transaction ID is already used." });
    }

    const invoiceNumber = `PKG-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const sub = await OwnerSubscription.create({
      owner: req.user.id,
      planCode: plan.code,
      planName: plan.name,
      pricePaid: pricing.finalPayableAmount,
      durationDays: plan.durationDays,
      status: "pending",
      paymentRef: normalizedPaymentRef,
      screenshot: req.file ? `subscription-payments/${req.file.filename}` : "",
      invoiceNumber,
    });
    res.status(201).json({
      message: "Payment submitted for verification.",
      subscription: sub,
      pricing,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: update package price / duration / activation
router.put("/admin/plans/:code", auth, async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
    const code = String(req.params.code || "").toUpperCase();
    const update = {};
    if (typeof req.body.price !== "undefined") update.price = toMoney(req.body.price);
    if (typeof req.body.durationDays !== "undefined") update.durationDays = Number(req.body.durationDays);
    if (typeof req.body.isActive !== "undefined") update.isActive = !!req.body.isActive;
    const plan = await PackagePlan.findOneAndUpdate({ code }, update, { new: true });
    if (!plan) return res.status(404).json({ error: "Package not found" });
    res.json({ plan });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: manual owner activation/deactivation
router.put("/admin/owner/:ownerId/status", auth, async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
    const { ownerId } = req.params;
    const { isActive } = req.body;
    const owner = await User.findOneAndUpdate(
      { _id: ownerId, role: "owner" },
      { isActive: !!isActive },
      { new: true },
    );
    if (!owner) return res.status(404).json({ error: "Owner not found" });
    res.json({ owner });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: activate owner account + grant subscription immediately
router.post("/admin/owner/:ownerId/activate-subscription", auth, async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
    const { ownerId } = req.params;
    const requestedCode = req.body?.planCode ? String(req.body.planCode).toUpperCase() : "SILVER";

    const owner = await User.findOne({ _id: ownerId, role: "owner" });
    if (!owner) return res.status(404).json({ error: "Owner not found" });

    let plan = await PackagePlan.findOne({ code: requestedCode, isActive: true });
    if (!plan) {
      // fallback to the cheapest active package
      plan = await PackagePlan.findOne({ isActive: true }).sort({ price: 1 });
    }
    if (!plan) return res.status(400).json({ error: "No active package plan found." });

    const now = new Date();
    // expire stale active records
    await OwnerSubscription.updateMany(
      { owner: ownerId, status: "active", endsAt: { $lt: now } },
      { $set: { status: "expired" } },
    );

    const existingActive = await OwnerSubscription.findOne({
      owner: ownerId,
      status: "active",
      startsAt: { $lte: now },
      endsAt: { $gte: now },
    }).sort({ endsAt: -1 });

    let subscription = existingActive;
    if (!subscription) {
      const startsAt = now;
      const endsAt = addDays(startsAt, plan.durationDays);
      subscription = await OwnerSubscription.create({
        owner: ownerId,
        planCode: plan.code,
        planName: plan.name,
        pricePaid: toMoney(plan.price),
        durationDays: plan.durationDays,
        startsAt,
        endsAt,
        status: "active",
        paymentRef: "ADMIN_ACTIVATION",
        invoiceNumber: `PKG-ADMIN-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        reviewedBy: req.user.id,
        reviewedAt: new Date(),
      });
    }

    owner.isActive = true;
    owner.subscriptionBlockedByAdmin = false;
    await owner.save();
    await Property.updateMany({ owner: ownerId }, { $set: { subscriptionDeactivated: false } });

    res.json({ owner, subscription });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: cancel owner's subscription and block self reactivation
router.post("/admin/owner/:ownerId/cancel-subscription", auth, async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
    const { ownerId } = req.params;
    const owner = await User.findOne({ _id: ownerId, role: "owner" });
    if (!owner) return res.status(404).json({ error: "Owner not found" });

    const now = new Date();
    await OwnerSubscription.updateMany(
      { owner: ownerId, status: "active", startsAt: { $lte: now }, endsAt: { $gte: now } },
      { $set: { status: "cancelled", paymentRef: "ADMIN_CANCELLED" } },
    );
    owner.subscriptionBlockedByAdmin = true;
    await owner.save();
    await Property.updateMany({ owner: ownerId }, { $set: { subscriptionDeactivated: true } });
    res.json({ owner, message: "Owner subscription cancelled by admin." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: approve pending purchase (activate subscription)
router.post("/admin/purchases/:id/approve", auth, async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
    const sub = await OwnerSubscription.findById(req.params.id);
    if (!sub) return res.status(404).json({ error: "Subscription not found" });
    if (sub.status !== "pending") return res.status(400).json({ error: "Subscription is not pending" });

    const now = new Date();
    await OwnerSubscription.updateMany(
      {
        owner: sub.owner,
        status: "active",
        _id: { $ne: sub._id },
      },
      { $set: { status: "expired", endsAt: now } },
    );

    const startsAt = now;
    const endsAt = addDays(startsAt, sub.durationDays);

    sub.status = "active";
    sub.startsAt = startsAt;
    sub.endsAt = endsAt;
    sub.reviewedBy = req.user.id;
    sub.reviewedAt = new Date();
    sub.reviewNote = String(req.body?.reviewNote || "");
    await sub.save();

    await User.findByIdAndUpdate(sub.owner, { isActive: true, subscriptionBlockedByAdmin: false });
    await Property.updateMany({ owner: sub.owner }, { $set: { subscriptionDeactivated: false } });

    res.json({ subscription: sub });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: reject purchase anytime
router.post("/admin/purchases/:id/reject", auth, async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
    const sub = await OwnerSubscription.findById(req.params.id);
    if (!sub) return res.status(404).json({ error: "Subscription not found" });

    const prevStatus = sub.status;
    if (sub.status === "rejected") {
      return res.json({ subscription: sub, message: "Subscription already rejected" });
    }

    sub.status = "rejected";
    sub.reviewedBy = req.user.id;
    sub.reviewedAt = new Date();
    sub.reviewNote = String(req.body?.reviewNote || "");
    if (!sub.endsAt || new Date(sub.endsAt).getTime() > Date.now()) {
      sub.endsAt = new Date();
    }
    await sub.save();

    if (prevStatus === "active") {
      const now = new Date();
      const hasOtherActive = await OwnerSubscription.exists({
        owner: sub.owner,
        _id: { $ne: sub._id },
        status: "active",
        startsAt: { $lte: now },
        endsAt: { $gte: now },
      });

      if (!hasOtherActive) {
        await User.findByIdAndUpdate(sub.owner, { isActive: false });
        await Property.updateMany({ owner: sub.owner }, { $set: { subscriptionDeactivated: true } });
      }
    }

    res.json({ subscription: sub });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: manual listing activation/deactivation
router.put("/admin/property/:propertyId/status", auth, async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
    const { propertyId } = req.params;
    const { adminDeactivated } = req.body;
    const property = await Property.findByIdAndUpdate(
      propertyId,
      { adminDeactivated: !!adminDeactivated },
      { new: true },
    );
    if (!property) return res.status(404).json({ error: "Property not found" });
    res.json({ property });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: payments/invoices for package purchases
router.get("/admin/payments", auth, async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
    const now = new Date();
    await OwnerSubscription.updateMany(
      { status: "active", endsAt: { $lt: now } },
      { $set: { status: "expired" } },
    );
    const payments = await OwnerSubscription.find({})
      .populate("owner", "name email isActive")
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    const currentActiveByOwner = new Map();
    for (const p of payments) {
      const ownerId = String(p.owner?._id || p.owner || "");
      if (!ownerId || p.status !== "active") continue;
      const startsAt = p.startsAt ? new Date(p.startsAt) : null;
      const endsAt = p.endsAt ? new Date(p.endsAt) : null;
      const isCurrent = !!startsAt && !!endsAt && startsAt <= now && endsAt >= now;
      if (!isCurrent) continue;
      const existing = currentActiveByOwner.get(ownerId);
      if (!existing || new Date(p.endsAt).getTime() > new Date(existing.endsAt).getTime()) {
        currentActiveByOwner.set(ownerId, p);
      }
    }

    const normalizedPayments = payments.map((p) => {
      const ownerId = String(p.owner?._id || p.owner || "");
      if (!ownerId || p.status !== "active") return p;
      const current = currentActiveByOwner.get(ownerId);
      if (!current) return p;
      if (String(current._id) === String(p._id)) return p;
      return { ...p, statusDisplay: "expired" };
    });

    res.json({ payments: normalizedPayments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
