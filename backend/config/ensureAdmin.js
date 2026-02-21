import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

export async function ensureAdminUser() {
  const adminEmail = "admin@admin.com";
  const existing = await User.findOne({ email: adminEmail });
  if (!existing) {
    const hashedPassword = await bcrypt.hash("12345", 10);
    await User.create({
      name: "Admin",
      email: adminEmail,
      password: hashedPassword,
      role: "admin"
    });
    console.log("Default admin user created.");
  } else {
    console.log("Admin user already exists.");
  }
}
