import PaymentHistory from "../models/PaymentHistory.js";
import express from "express";
import auth from "../middleware/auth.js";
import Unit from "../models/Unit.js";
import Property from "../models/Property.js";
const router = express.Router();

// Add dummy payment history
router.post("/dummy", async (req, res) => {
  try {
    const dummy = [
      {
        unit: null,
        amount: 1200,
        date: "2026-02-01",
        screenshot: "https://via.placeholder.com/150",
        txnId: "TXN123456",
        status: "paid",
        details: "Rent for February"
      },
      {
        unit: null,
        amount: 800,
        date: "2026-01-01",
        screenshot: "https://via.placeholder.com/150",
        txnId: "TXN654321",
        status: "paid",
        details: "Rent for January"
      },
      {
        unit: null,
        amount: 0,
        date: "2025-12-01",
        screenshot: "",
        txnId: "TXN000000",
        status: "pending",
        details: "No payment for December"
      }
    ];
    await PaymentHistory.insertMany(dummy);
    res.json({ message: "Dummy payment history added." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get payment history
router.get("/history", auth, async (req, res) => {
  try {
    // If owner, return only payments belonging to units under owner's properties
    if (req.user && req.user.role === "owner") {
      const props = await Property.find({ owner: req.user.id }, "_id");
      const propIds = props.map(p => p._id);
      const units = await Unit.find({ property: { $in: propIds } }, "_id");
      const unitIds = units.map(u => u._id);
      const history = await PaymentHistory.find({ unit: { $in: unitIds } }).sort({ date: -1 });
      return res.json({ history });
    }

    // If tenant, return only payments for the tenant's unit
    if (req.user && req.user.role === "tenant") {
      const unit = await Unit.findOne({ tenant: req.user.id }, "_id");
      const unitId = unit ? unit._id : null;
      const history = unitId ? await PaymentHistory.find({ unit: unitId }).sort({ date: -1 }) : [];
      return res.json({ history });
    }

    // Fallback (admin or other roles) - return all
    const history = await PaymentHistory.find().sort({ date: -1 });
    res.json({ history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
