import mongoose from "mongoose";

const InvoiceSchema = new mongoose.Schema({
  unit: { type: mongoose.Schema.Types.ObjectId, ref: "Unit" },
  amount: Number,
  month: String,
  // Payment proof fields
  screenshot: { type: String }, // filename of uploaded payment screenshot
  txnId: { type: String }, // transaction reference/UTR
  tenantAddedDate: Date,
  description: { type: String },
  dueDate: { type: Date },
  origin: { type: String }, // optional marker: 'owner' or 'tenant'
  linkedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  status: { type: String, default: "pending" },
  action: { type: String, default: "pending" }, // owner verification action
  amenities: [
    {
      name: String,
      cost: Number,
      description: String
    }
  ]
});

// Ensure at most one monthly-generated invoice per unit+month
InvoiceSchema.index({ unit: 1, month: 1 }, { unique: true, partialFilterExpression: { origin: 'monthly' } });

export default mongoose.model("Invoice", InvoiceSchema);
