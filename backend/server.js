import express from "express";
import connectDB from "./config/db.js";
import { ensureAdminUser } from "./config/ensureAdmin.js";
import { ensureSubscriptionPlans } from "./config/ensureSubscriptionPlans.js";
import auth from "./routes/auth.js";
import User from "./models/User.js";
import property from "./routes/property.js";
import profilePhoto from "./routes/profilePhoto.js";
import blog from "./routes/blog.js";
import tenantProfile from "./routes/tenant.js";
import unit from "./routes/unit.js";
import invoice from "./routes/invoice.js";
import ticket from "./routes/ticket.js";
import owner from "./routes/owner.js";
import paymentHistory from "./routes/paymentHistory.js";
import subscription from "./routes/subscription.js";
import contact from "./routes/contact.js";
import OwnerSubscription from "./models/OwnerSubscription.js";
import Property from "./models/Property.js";
import cors from "cors";
import path from "path";

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(process.cwd(), "uploads")));

// Simple request logger to help debug route issues
app.use((req, res, next) => {
	console.log(new Date().toISOString(), req.method, req.originalUrl);
	next();
});

const dbConnected = await connectDB();

if (dbConnected) {
	await ensureAdminUser();
	await ensureSubscriptionPlans();
} else {
	console.warn("Skipping admin/subscription bootstrap because MongoDB is not connected.");
}

const runSubscriptionMaintenance = async () => {
	try {
		const now = new Date();
		await OwnerSubscription.updateMany(
			{ status: "active", endsAt: { $lt: now } },
			{ $set: { status: "expired" } },
		);

		const activeOwnerIds = await OwnerSubscription.find({
			status: "active",
			startsAt: { $lte: now },
			endsAt: { $gte: now },
		}).distinct("owner");

		await Property.updateMany(
			{ owner: { $in: activeOwnerIds } },
			{ $set: { subscriptionDeactivated: false } },
		);

		await Property.updateMany(
			{ owner: { $nin: activeOwnerIds } },
			{ $set: { subscriptionDeactivated: true } },
		);
	} catch (err) {
		console.error("Subscription maintenance error:", err?.message || err);
	}
};

if (dbConnected) {
	runSubscriptionMaintenance();
	setInterval(runSubscriptionMaintenance, 6 * 60 * 60 * 1000);
}

app.use("/auth", auth);
app.use("/property", property);
app.use("/unit", unit);
app.use("/invoice", invoice);
app.use("/ticket", ticket);
app.use("/owner", owner);
app.use("/payment-history", paymentHistory);
app.use("/subscription", subscription);
app.use("/tenant-profile", tenantProfile);
app.use("/profile-photo", profilePhoto);
app.use("/blog", blog);
app.use("/contact", contact);

// Serve profile photos stored in DB at /user-photo/:userId
app.get('/user-photo/:userId', async (req, res) => {
	try {
		const { userId } = req.params;
		const user = await User.findById(userId).lean();
		if (!user || !user.profile_photo) return res.status(404).send('Not found');

		const photo = user.profile_photo;
		// If photo stored as binary
		if (photo.data) {
			res.set('Content-Type', photo.contentType || 'application/octet-stream');
			return res.send(photo.data.buffer ? photo.data.buffer : photo.data);
		}

		// If photo is a filename/path, redirect to static file served from uploads
		return res.redirect('/' + photo);
	} catch (err) {
		res.status(500).send('Server error');
	}
});

app.listen(5000,()=>console.log("Server running"));

// Debug route: list registered routes
app.get('/__routes', (req, res) => {
	const routes = [];
	app._router.stack.forEach(mw => {
		if (mw.route) {
			const methods = Object.keys(mw.route.methods).join(',').toUpperCase();
			routes.push({ path: mw.route.path, methods });
		} else if (mw.name === 'router' && mw.handle && mw.handle.stack) {
			mw.handle.stack.forEach(r => {
				if (r.route) routes.push({ path: r.route.path, methods: Object.keys(r.route.methods).join(',').toUpperCase() });
			});
		}
	});
	res.json(routes);
});
