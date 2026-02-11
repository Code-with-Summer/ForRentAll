import mongoose from "mongoose";

const MaintenanceSchema = new mongoose.Schema({
  unit: { type: mongoose.Schema.Types.ObjectId, ref: "Unit", required: true },
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  description: { type: String, required: true },
  image: { type: String }, // optional image filename
  status: { type: String, enum: ["pending", "resolved"], default: "pending" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model("Maintenance", MaintenanceSchema);
