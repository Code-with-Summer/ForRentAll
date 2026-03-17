import mongoose from "mongoose";
import dotenv from "dotenv";
import { setServers } from "node:dns/promises";
setServers(["1.1.1.1", "8.8.8.8"]);

dotenv.config();

export default async function connectDB() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!mongoUri) {
    console.error("MongoDB connection string is missing. Set MONGO_URI or MONGODB_URI in environment variables.");
    return false;
  }

  try {
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected");
    return true;
  } catch (err) {
    console.error("MongoDB connection failed:", err?.message || err);
    return false;
  }
}
