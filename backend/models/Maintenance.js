import mongoose from "mongoose";

const MaintenanceSchema = new mongoose.Schema(
  {
    unit: { type: mongoose.Schema.Types.ObjectId, ref: "Unit", required: true },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    subject: { type: String, default: "" },
    description: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true },
);

export default mongoose.model("Maintenance", MaintenanceSchema);
