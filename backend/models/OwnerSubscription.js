import mongoose from "mongoose";

const OwnerSubscriptionSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true, required: true },
    planCode: { type: String, required: true },
    planName: { type: String, required: true },
    pricePaid: { type: Number, required: true },
    durationDays: { type: Number, required: true },
    startsAt: { type: Date },
    endsAt: { type: Date },
    status: { type: String, enum: ["pending", "active", "expired", "cancelled", "rejected"], default: "pending" },
    paymentRef: { type: String, default: "" },
    screenshot: { type: String, default: "" },
    invoiceNumber: { type: String, index: true },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
    reviewNote: { type: String, default: "" },
  },
  { timestamps: true },
);

OwnerSubscriptionSchema.index({ owner: 1, status: 1, endsAt: -1 });

export default mongoose.model("OwnerSubscription", OwnerSubscriptionSchema);
