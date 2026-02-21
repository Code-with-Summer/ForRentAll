import express from "express";
import connectDB from "./config/db.js";
import { ensureAdminUser } from "./config/ensureAdmin.js";
import auth from "./routes/auth.js";
import property from "./routes/property.js";
import profilePhoto from "./routes/profilePhoto.js";
import tenantProfile from "./routes/tenant.js";
import unit from "./routes/unit.js";
import invoice from "./routes/invoice.js";
import ticket from "./routes/ticket.js";
import owner from "./routes/owner.js";
import paymentHistory from "./routes/paymentHistory.js";
import cors from "cors";
import path from "path";

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(process.cwd(), "uploads")));

connectDB();
ensureAdminUser();

app.use("/auth", auth);
app.use("/property", property);
app.use("/unit", unit);
app.use("/invoice", invoice);
app.use("/ticket", ticket);
app.use("/owner", owner);
app.use("/payment-history", paymentHistory);
app.use("/tenant-profile", tenantProfile);
app.use("/profile-photo", profilePhoto);

app.listen(5000,()=>console.log("Server running"));
