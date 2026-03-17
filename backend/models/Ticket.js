import mongoose from "mongoose";

const TicketSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true },
    description: { type: String, default: "" },
    images: [{ type: String }],
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    unit: { type: mongoose.Schema.Types.ObjectId, ref: "Unit", default: null },
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "closed"],
      default: "open",
    },
  },
  { timestamps: true },
);

export default mongoose.model("Ticket", TicketSchema);
