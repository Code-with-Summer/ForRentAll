import mongoose from "mongoose";

const PaymentHistorySchema = new mongoose.Schema({
  unit: { type: mongoose.Schema.Types.ObjectId, ref: "Unit" },
  amount: Number,
  date: String,
  screenshot: String,
  txnId: String,
  status: { type: String, default: "pending" },
  details: String
});

export default mongoose.model("PaymentHistory", PaymentHistorySchema);
