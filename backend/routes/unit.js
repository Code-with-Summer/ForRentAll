import express from "express";
import Unit from "../models/Unit.js";
import Property from "../models/Property.js";
import User from "../models/User.js";
import Invoice from "../models/Invoice.js";
import auth from "../middleware/auth.js";
import Maintenance from "../models/Maintenance.js";

const router = express.Router();
import multer from "multer";
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, "uploads/");
	},
	filename: function (req, file, cb) {
		cb(null, Date.now() + "-" + file.originalname);
	}
});

/**
 * Get all tenants assigned to units owned by the logged-in owner
 */
router.get("/owner-tenants", auth, async (req, res) => {
	try {
		// Find units owned by this owner with assigned tenants
		const units = await Unit.find({ tenant: { $ne: null } })
			.populate("property", "owner name")
			.populate("tenant", "name email _id");
		const ownerUnits = units.filter(u => u.property && String(u.property.owner) === String(req.user.id));
		// Map tenants with unit and property info
		const tenants = ownerUnits.map(u => ({
			_id: u.tenant._id,
			name: u.tenant.name,
			email: u.tenant.email,
			unit: u.number,
			unitId: u._id,
			property: u.property.name
		}));
		res.json(tenants);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});
const upload = multer({ storage });

// Get all maintenance requests (owner view)
router.get("/maintenance/all", auth, async (req, res) => {
	try {
		// Only owner can view all
		if (req.user.role !== "owner") return res.status(403).json({ error: "Forbidden" });
		const requests = await Maintenance.find()
			.populate("unit", "number")
			.populate("tenant", "name email")
			.sort({ createdAt: -1 });
		res.json(requests);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Update maintenance status (owner)
router.put("/maintenance/:id/status", auth, async (req, res) => {
	try {
		if (req.user.role !== "owner") return res.status(403).json({ error: "Forbidden" });
		const reqDoc = await Maintenance.findByIdAndUpdate(
			req.params.id,
			{ status: req.body.status, updatedAt: Date.now() },
			{ new: true }
		);
		res.json(reqDoc);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Get single maintenance request (for dropdown details)
router.get("/maintenance/:id", auth, async (req, res) => {
	try {
		const reqDoc = await Maintenance.findById(req.params.id)
			.populate("unit", "number")
			.populate("tenant", "name email");
		res.json(reqDoc);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

/**
 * Get all units for a property
 */
router.get("/property/:id", auth, async (req, res) => {
	try {
		const units = await Unit.find({ property: req.params.id })
			.populate("tenant", "name email");
		res.json(units);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

/**
 * Create unit
 */
router.post("/", auth, upload.array("photos"), async (req, res) => {
	try {
		const property = await Property.findById(req.body.property);
		if (!property) return res.status(404).json({ error: "Property not found" });

		if (String(property.owner) !== String(req.user.id)) {
			return res.status(403).json({ error: "Forbidden" });
		}

		// Handle photos
		const photoUrls = req.files ? req.files.map(f => f.filename) : [];

		const unit = new Unit({
			number: req.body.number,
			rent: req.body.rent,
			property: req.body.property,
			amenity1: req.body.amenity1,
			amenity1Expense: req.body.amenity1Expense,
			amenity2: req.body.amenity2,
			amenity2Expense: req.body.amenity2Expense,
			amenity3: req.body.amenity3,
			amenity3Expense: req.body.amenity3Expense,
			amenity4: req.body.amenity4,
			amenity4Expense: req.body.amenity4Expense,
			photos: photoUrls,
			rooms: req.body.rooms,
			halls: req.body.halls,
			bathrooms: req.body.bathrooms,
			balcony: req.body.balcony,
			mapLink: req.body.mapLink,
			description: req.body.description
		});
		await unit.save();
		res.status(201).json(unit);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

/**
 * Get all tenants
 */
router.get("/tenants", auth, async (req, res) => {
	try {
		// Return all users with role 'tenant'
		const tenants = await User.find({ role: "tenant" }, "_id name email");
		res.json(tenants);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

/**
 * Assign tenant to unit
 */
router.put("/assign-tenant/:id", auth, async (req, res) => {
	try {
		const unit = await Unit.findById(req.params.id).populate("property");
		if (!unit) return res.status(404).json({ error: "Unit not found" });

		if (String(unit.property.owner) !== String(req.user.id)) {
			return res.status(403).json({ error: "Forbidden" });
		}

		if (req.body.tenant && !unit.tenantAddedDate) {
			unit.tenantAddedDate = new Date();
		}

		unit.tenant = req.body.tenant || null;
		await unit.save();

		// Create invoice for this month if tenant assigned
		if (req.body.tenant) {
			const now = new Date();
			const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
			// Ensure single monthly invoice exists (use upsert to avoid race-created duplicates)
			await Invoice.findOneAndUpdate(
				{ unit: unit._id, month: monthStr, origin: 'monthly' },
				{ $setOnInsert: { unit: unit._id, amount: unit.rent, month: monthStr, status: 'pending', origin: 'monthly' } },
				{ upsert: true, new: true }
			);
		}

		const updatedUnit = await Unit.findById(unit._id)
			.populate("tenant", "name email");

		res.json(updatedUnit);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

/**
 * Get unit of logged-in tenant
 */
router.get("/my-unit", auth, async (req, res) => {
	try {
		const unit = await Unit.findOne({ tenant: req.user.id })
			.populate("property");
		res.json(unit);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

/**
 * Get unit by tenant id
 */
router.get("/by-tenant/:tenantId", auth, async (req, res) => {
	try {
		const unit = await Unit.findOne({ tenant: req.params.tenantId })
			.populate("property")
			.populate("tenant", "name email");
		if (!unit) return res.status(404).json({ error: "Unit not found for tenant" });
		res.json(unit);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

/**
 * Get single unit
 */
router.get("/:id", auth, async (req, res) => {
	try {
		const unit = await Unit.findById(req.params.id)
			.populate("property")
			.populate("tenant", "name email");

		if (!unit) return res.status(404).json({ error: "Unit not found" });
		res.json(unit);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

/**
 * Update unit
 */
router.put("/:id", auth, upload.array("photos"), async (req, res) => {
	try {
		const unit = await Unit.findById(req.params.id).populate("property");
		if (!unit) return res.status(404).json({ error: "Unit not found" });

		if (String(unit.property.owner) !== String(req.user.id)) {
			return res.status(403).json({ error: "Forbidden" });
		}

		// Handle photos
		let updatedPhotos = unit.photos || [];
		// Remove deleted photos
		if (req.body.existingPhotos) {
			const keepPhotos = JSON.parse(req.body.existingPhotos);
			const deletedPhotos = updatedPhotos.filter(p => !keepPhotos.includes(p));
			// Delete files from server
			const fs = await import('fs');
			deletedPhotos.forEach(photo => {
				const filePath = `uploads/${photo}`;
				if (fs.existsSync(filePath)) {
					try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }
				}
			});
			updatedPhotos = keepPhotos;
		}
		// Add new uploaded photos
		if (req.files && req.files.length > 0) {
			const newPhotos = req.files.map(f => f.filename);
			updatedPhotos = [...updatedPhotos, ...newPhotos];
		}

		// Build update object
		const updateObj = {
			number: req.body.number,
			rent: req.body.rent,
			amenity1: req.body.amenity1,
			amenity1Expense: req.body.amenity1Expense,
			amenity2: req.body.amenity2,
			amenity2Expense: req.body.amenity2Expense,
			amenity3: req.body.amenity3,
			amenity3Expense: req.body.amenity3Expense,
			amenity4: req.body.amenity4,
			amenity4Expense: req.body.amenity4Expense,
			rooms: req.body.rooms,
			halls: req.body.halls,
			bathrooms: req.body.bathrooms,
			balcony: req.body.balcony,
			mapLink: req.body.mapLink,
			description: req.body.description,
			photos: updatedPhotos
		};

		const updated = await Unit.findByIdAndUpdate(
			req.params.id,
			updateObj,
			{ new: true }
		).populate("tenant", "name email");

		res.json(updated);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

/**
 * Delete unit
 */
router.delete("/:id", auth, async (req, res) => {
	try {
		const unit = await Unit.findById(req.params.id).populate("property");
		if (!unit) return res.status(404).json({ error: "Unit not found" });

		if (String(unit.property.owner) !== String(req.user.id)) {
			return res.status(403).json({ error: "Forbidden" });
		}

		await Unit.findByIdAndDelete(req.params.id);
		res.json({ message: "Unit deleted successfully" });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

export default router;
