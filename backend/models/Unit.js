import mongoose from "mongoose";

const UnitSchema = new mongoose.Schema(
  {
    number: { type: String, required: true },
    rent: { type: Number, default: 0 },
    property: { type: mongoose.Schema.Types.ObjectId, ref: "Property", required: true },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    tenantAddedDate: { type: Date, default: null },

    amenity1: { type: String, default: "" },
    amenity1Expense: { type: Number, default: 0 },
    amenity2: { type: String, default: "" },
    amenity2Expense: { type: Number, default: 0 },
    amenity3: { type: String, default: "" },
    amenity3Expense: { type: Number, default: 0 },
    amenity4: { type: String, default: "" },
    amenity4Expense: { type: Number, default: 0 },

    photos: [{ type: String }],
    rooms: { type: Number, default: 0 },
    halls: { type: Number, default: 0 },
    bathrooms: { type: Number, default: 0 },
    balcony: { type: Number, default: 0 },
    mapLink: { type: String, default: "" },
    description: { type: String, default: "" },
  },
  { timestamps: true },
);

export default mongoose.model("Unit", UnitSchema);
