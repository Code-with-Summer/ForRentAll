import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  age: Number,
  phone: String,
  address: String,
  profile_photo: String,
  gender: { type: String, enum: ["Male", "Female", "Other"], default: "Other" },
  role: { type: String, enum: ["admin", "owner", "tenant"], default: "tenant", required: true },
  job_details: {
    occupation: String,
    company: String,
    work_address: String
  },
  government_id: {
    id_type: String, // e.g. Aadhaar, PAN, Passport
    id_number: String,
    id_file: String // file path or filename
  },
  agreement_file: String, // file path or filename
  persons_living: { type: Number, default: 1 }
});

export default mongoose.model("User", UserSchema);
