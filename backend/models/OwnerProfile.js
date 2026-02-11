import mongoose from "mongoose";

const OwnerProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true },
  licenseNumber: String,
  documents: String,
  verified: { type: Boolean, default: false }
});

export default mongoose.model("OwnerProfile", OwnerProfileSchema);
