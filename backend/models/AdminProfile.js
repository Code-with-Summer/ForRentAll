import mongoose from "mongoose";

const AdminProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true, required: true },
  managedProperties: [{ type: mongoose.Schema.Types.ObjectId, ref: "Property" }],
  bankName: String,
  accountNumber: String,
  ifsc: String,
  upiId: String,
  paymentQr: String
}, { timestamps: true });

export default mongoose.model("AdminProfile", AdminProfileSchema);
