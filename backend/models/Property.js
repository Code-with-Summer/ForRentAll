import mongoose from "mongoose";

const PropertySchema = new mongoose.Schema({
  name: String,
  address: String,
  images: [String], // Array of image URLs or file paths
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  // Payment details for tenants to pay
  paymentQr: String, // path to uploaded QR image (e.g. /property/<filename>)
  paymentInfo: {
    bankName: String,
    accountNumber: String,
    ifsc: String,
    upiId: String
  }
});

export default mongoose.model("Property", PropertySchema);
