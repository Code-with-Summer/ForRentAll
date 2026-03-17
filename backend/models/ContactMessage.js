import mongoose from "mongoose";

const ContactMessageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  subject: { type: String },
  message: { type: String, required: true },
  resolved: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model("ContactMessage", ContactMessageSchema);
