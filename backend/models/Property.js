import mongoose from "mongoose";

const PropertySchema = new mongoose.Schema({
  name: String,
  address: String,
  country: { type: String, index: true },
  state: { type: String, index: true },
  city: { type: String, index: true },
  area: { type: String, index: true },
  images: [String], // Array of image URLs or file paths
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  // Payment details for tenants to pay
  paymentQr: String, // path to uploaded QR image (e.g. /property/<filename>)
  paymentInfo: {
    bankName: String,
    accountNumber: String,
    ifsc: String,
    upiId: String
  },
  adminDeactivated: { type: Boolean, default: false },
  subscriptionDeactivated: { type: Boolean, default: false }
});

export default mongoose.model("Property", PropertySchema);
