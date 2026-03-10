import mongoose from "mongoose";

const TenantProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true },
  address: String,
  emergencyContact: String,
  idProof: String,
  numberOfPersons: { type: Number, default: 1 },
  rentAgreement: String
  ,
  locked: { type: Boolean, default: false }
});

export default mongoose.model("TenantProfile", TenantProfileSchema);
