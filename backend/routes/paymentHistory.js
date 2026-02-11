import PaymentHistory from "../models/PaymentHistory.js";
import express from "express";
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
router.get("/history", async (req, res) => {
  try {
    const history = await PaymentHistory.find().sort({ date: -1 });
    res.json({ history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
