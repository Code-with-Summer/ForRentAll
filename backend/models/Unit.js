import mongoose from "mongoose";

const amenityOptions = ["Parking", "Electricity", "Maintenance", "Water", "Internet", "Other", ""];

const UnitSchema = new mongoose.Schema({
	number: String,
	rent: Number,
	property: { type: mongoose.Schema.Types.ObjectId, ref: "Property" },
	tenant: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
	tenantAddedDate: { type: Date },
	amenity1: { type: String, enum: amenityOptions, default: "" },
	amenity1Expense: { type: Number, default: 0 },
	amenity2: { type: String, enum: amenityOptions, default: "" },
	amenity2Expense: { type: Number, default: 0 },
	amenity3: { type: String, enum: amenityOptions, default: "" },
	amenity3Expense: { type: Number, default: 0 },
	amenity4: { type: String, enum: amenityOptions, default: "" },
	amenity4Expense: { type: Number, default: 0 }
,
  photos: [{ type: String }], // URLs or filenames
  rooms: { type: Number, default: 1 },
  halls: { type: Number, default: 1 },
  bathrooms: { type: Number, default: 1 },
  balcony: { type: String, enum: ["Yes", "No"], default: "No" },
  mapLink: { type: String, default: "" },
  description: { type: String, default: "" }
});

export default mongoose.model("Unit", UnitSchema);
