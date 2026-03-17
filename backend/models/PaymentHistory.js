import mongoose from "mongoose";

const PaymentHistorySchema = new mongoose.Schema(
  {
    unit: { type: mongoose.Schema.Types.ObjectId, ref: "Unit", default: null },
    amount: { type: Number, default: 0 },
    date: { type: Date, default: Date.now },
    screenshot: { type: String, default: "" },
    txnId: { type: String, default: "" },
    status: { type: String, default: "pending" },
    details: { type: String, default: "" },
  },
  { timestamps: true },
);

export default mongoose.model("PaymentHistory", PaymentHistorySchema);
