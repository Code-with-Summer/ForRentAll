import mongoose from "mongoose";

const PackagePlanSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true, required: true }, // SILVER | GOLD | PLATINUM
    name: { type: String, required: true },
    price: { type: Number, required: true },
    durationDays: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export default mongoose.model("PackagePlan", PackagePlanSchema);

