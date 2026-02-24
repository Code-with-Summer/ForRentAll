import mongoose from "mongoose";

const TicketSchema = new mongoose.Schema({
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  unit: { type: mongoose.Schema.Types.ObjectId, ref: "Unit" },
  subject: String,
  description: String,
  images: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  status: { type: String, default: "open" }
});

export default mongoose.model("Ticket", TicketSchema);
