import mongoose from "mongoose";

import { setServers } from "node:dns/promises";
setServers(["1.1.1.1", "8.8.8.8"]);

const uri = "mongodb+srv://rr30666492_db_user:bfSbl9zh2wahw0hD@cluster0.o9yvmzs.mongodb.net/Tenant_Mgmt";

export async function connectDB() {
  try {
    await mongoose.connect(uri, {
      dbName: "Tenant_Mgmt",
      autoIndex: true,
    });
    console.log("✅ MongoDB connected via Mongoose");
  } catch (error) {
    console.error("❌ Mongo connection failed:", error.message);
    console.error(error);
    process.exit(1);
  }
}
export default connectDB;