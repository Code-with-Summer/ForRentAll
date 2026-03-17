import bcrypt from "bcryptjs";
import User from "../models/User.js";
import AdminProfile from "../models/AdminProfile.js";

const DEFAULT_ADMIN_NAME = process.env.DEFAULT_ADMIN_NAME || "Admin";
const DEFAULT_ADMIN_EMAIL = process.env.DEFAULT_ADMIN_EMAIL || "admin@tenantmgmt.local";
const DEFAULT_ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || "admin123";

export async function ensureAdminUser() {
  try {
    const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);

    // Find by configured email first, fall back to any admin role
    let admin = await User.findOne({ email: DEFAULT_ADMIN_EMAIL });

    if (admin) {
      // Ensure role is admin and password is up to date with env
      const needsUpdate =
        admin.role !== "admin" || !(await bcrypt.compare(DEFAULT_ADMIN_PASSWORD, admin.password));
      if (needsUpdate) {
        admin.role = "admin";
        admin.password = hashedPassword;
        admin.name = admin.name || DEFAULT_ADMIN_NAME;
        await admin.save();
        console.log("Admin credentials synced for:", DEFAULT_ADMIN_EMAIL);
      }
    } else {
      // No user with that email — check if any admin role exists and update its email/password
      admin = await User.findOne({ role: "admin" });
      if (admin) {
        admin.email = DEFAULT_ADMIN_EMAIL;
        admin.name = DEFAULT_ADMIN_NAME;
        admin.password = hashedPassword;
        await admin.save();
        console.log("Existing admin updated to:", DEFAULT_ADMIN_EMAIL);
      } else {
        admin = await User.create({
          name: DEFAULT_ADMIN_NAME,
          email: DEFAULT_ADMIN_EMAIL,
          password: hashedPassword,
          role: "admin",
        });
        console.log("Default admin user created:", DEFAULT_ADMIN_EMAIL);
      }
    }

    await AdminProfile.findOneAndUpdate(
      { userId: admin._id },
      { $setOnInsert: { userId: admin._id } },
      { upsert: true, new: true },
    );
  } catch (err) {
    console.error("ensureAdminUser failed:", err?.message || err);
  }
}
