import express from "express";
import Invoice from "../models/Invoice.js";
import Unit from "../models/Unit.js";
import User from "../models/User.js";
import PaymentHistory from "../models/PaymentHistory.js";
import auth from "../middleware/auth.js";
const router = express.Router();
// Update invoice status by ID
import multer from "multer";
const upload = multer({ dest: "uploads/" });

// Update invoice status by ID, support payment proof upload
router.put('/:id', upload.single('screenshot'), async (req, res) => {
  try {
    const { status, txnId, action } = req.body;
    const updateObj = {};
    if (status) updateObj.status = status;
    if (txnId) updateObj.txnId = txnId;
    if (typeof action !== 'undefined') updateObj.action = action;
    if (req.file) updateObj.screenshot = req.file.filename;
    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      updateObj,
      { new: true }
    );
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    // If payment is made, create PaymentHistory record
    if (status === 'paid') {
      // Get the unit for details
      const unit = await Unit.findById(invoice.unit);
      // Use invoice month as date (first of month)
      let date = invoice.month ? invoice.month + '-01' : new Date().toISOString().slice(0,10);
      // Always use the latest invoice.amount (rent + amenities)
      await PaymentHistory.create({
        unit: invoice.unit,
        amount: invoice.amount,
        date,
        screenshot: invoice.screenshot || (req.file ? req.file.filename : undefined),
        txnId: invoice.txnId || txnId,
        status: 'paid',
        details: `Rent + amenities for ${invoice.month || ''}`
      });
    }

    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all invoices for all units owned by the logged-in owner, generate if missing for current month
router.get("/all-owner", auth, async (req, res) => {
  try {
    // Only allow owner
    if (!req.user || req.user.role !== "owner") return res.status(403).json({ error: "Forbidden" });

    // Get all units owned by this owner
    const units = await Unit.find().populate("property");
    const ownerUnits = units.filter(u => u.property && String(u.property.owner) === String(req.user.id) && u.tenant);

    // Get current month string (e.g. 2026-02)
    const now = new Date();
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Ensure current-month invoices exist for each owner unit (do not remove or overwrite owner invoices)
    for (const unit of ownerUnits) {
      if (!unit.tenant || !unit.tenantAddedDate) continue;
      const assignDate = new Date(unit.tenantAddedDate);
      if (assignDate > now) continue;
      const assignMonth = `${assignDate.getFullYear()}-${String(assignDate.getMonth() + 1).padStart(2, '0')}`;
      if (monthStr < assignMonth) continue;

      let invoice = await Invoice.findOne({ unit: unit._id, month: monthStr, origin: 'owner' });
      if (!invoice) invoice = await Invoice.findOne({ unit: unit._id, month: monthStr });
      if (!invoice) {
        const amenities = [];
        let amenitiesTotal = 0;
        for (let i = 1; i <= 4; i++) {
          const name = unit[`amenity${i}`];
          const cost = unit[`amenity${i}Expense`];
          if (name && name !== "" && cost > 0) {
            amenities.push({ name, cost });
            amenitiesTotal += cost;
          }
        }
        await Invoice.create({
          unit: unit._id,
          amount: unit.rent + amenitiesTotal,
          month: monthStr,
          status: "pending",
          amenities,
          origin: 'monthly'
        });
      }
    }

    // Return all invoices for owner's units so owner-created invoices are visible
    const unitIds = ownerUnits.map(u => u._id);
    const allInv = await Invoice.find({ unit: { $in: unitIds } }).sort({ month: -1, createdAt: -1 });
    const out = [];
    for (const inv of allInv) {
      const unitObj = await Unit.findById(inv.unit);
      const tenant = unitObj && unitObj.tenant ? await User.findById(unitObj.tenant) : null;
      out.push({ ...inv.toObject(), tenantName: tenant ? tenant.name : '', unitNumber: unitObj ? unitObj.number : '' });
    }
    res.json(out);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create invoice: owner only, one per month per unit
// Create invoice: owner can create for a specific unit, all units in a property, or all owner units
router.post("/", auth, async (req, res) => {
  try {
    if (!req.user || req.user.role !== "owner") return res.status(403).json({ error: "Forbidden" });
    const { target } = req.body; // 'specific' | 'property' | 'all'
    const month = req.body.month;
    if (!month) return res.status(400).json({ error: 'month required' });

    // Helper to create invoice for a unit if missing
    const createForUnit = async (unitDoc, body) => {
      if (!unitDoc || !unitDoc._id || !unitDoc.tenant) return null; // skip units without tenant
      const unitId = unitDoc._id;
      const existing = await Invoice.findOne({ unit: unitId, month: body.month });

      // Determine amenityList
      let amenityList = [];
      if (body.amenities) {
        if (typeof body.amenities === 'string') {
          try { amenityList = JSON.parse(body.amenities); } catch (e) { amenityList = []; }
        } else if (Array.isArray(body.amenities)) amenityList = body.amenities;
      } else {
        for (let i = 1; i <= 4; i++) {
          const name = unitDoc[`amenity${i}`];
          const cost = unitDoc[`amenity${i}Expense`];
          if (name && cost && cost > 0) amenityList.push({ name, cost });
        }
      }

      // calculate amount
      let amenitiesTotal = 0;
      amenityList.forEach(a => { if (a && a.cost) amenitiesTotal += Number(a.cost || 0); });
      const amount = body.amount ? Number(body.amount) : (Number(unitDoc.rent || 0) + amenitiesTotal);

      // If existing found, handle overwrite if requested
      if (existing) {
        if (body.overwrite) {
          existing.amount = amount;
          existing.amenities = amenityList;
          existing.description = body.description || existing.description;
          existing.dueDate = body.dueDate ? new Date(body.dueDate) : existing.dueDate;
          await existing.save();
          const tenant = await User.findById(unitDoc.tenant);
          return { ...existing.toObject(), tenantName: tenant ? tenant.name : '', unitNumber: unitDoc.number };
        }
        // otherwise allow creating another owner invoice (duplicate)
      }

      const inv = await Invoice.create({
        unit: unitId,
        amount,
        month: body.month,
        status: 'due',
        amenities: amenityList,
        description: body.description || undefined,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        origin: 'owner'
      });
      // do not auto-create monthly invoice here; monthly invoices are generated by scheduled/monthly logic
      const tenant = await User.findById(unitDoc.tenant);
      return { ...inv.toObject(), tenantName: tenant ? tenant.name : '', unitNumber: unitDoc.number };
    };

    const created = [];

    if (target === 'specific') {
      const unitId = req.body.unit;
      if (!unitId) return res.status(400).json({ error: 'unit required for specific target' });
      const unitDoc = await Unit.findById(unitId).populate('property');
      if (!unitDoc) return res.status(404).json({ error: 'Unit not found' });
      if (!unitDoc.property || String(unitDoc.property.owner) !== String(req.user.id)) return res.status(403).json({ error: 'Forbidden' });
      const inv = await createForUnit(unitDoc, req.body);
      if (!inv) return res.status(400).json({ error: 'Invoice already exists or unit has no tenant' });
      created.push(inv);
      return res.status(201).json(created[0]);
    }

    if (target === 'property') {
      const propertyId = req.body.property;
      if (!propertyId) return res.status(400).json({ error: 'property required for property target' });
      const prop = await (await import('../models/Property.js')).default.findById(propertyId);
      if (!prop) return res.status(404).json({ error: 'Property not found' });
      if (String(prop.owner) !== String(req.user.id)) return res.status(403).json({ error: 'Forbidden' });
      const units = await Unit.find({ property: propertyId }).populate('tenant');
      for (const unitDoc of units) {
        const inv = await createForUnit(unitDoc, req.body);
        if (inv) created.push(inv);
      }
      return res.status(201).json(created);
    }

    // default: target === 'all'
    if (target === 'all') {
      const units = await Unit.find().populate('property').populate('tenant');
      const ownerUnits = units.filter(u => u.property && String(u.property.owner) === String(req.user.id));
      for (const unitDoc of ownerUnits) {
        const inv = await createForUnit(unitDoc, req.body);
        if (inv) created.push(inv);
      }
      return res.status(201).json(created);
    }

    return res.status(400).json({ error: 'Invalid target' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all invoices for a unit, including amenity breakdown
router.get("/unit/:id", async (req, res) => {
  try {
    // Get the unit details (for rent and amenities)
    const unit = await Unit.findById(req.params.id);
    if (!unit) return res.status(404).json({ error: "Unit not found" });

    // Prepare amenity breakdown
    const amenities = [];
    let amenitiesTotal = 0;
    for (let i = 1; i <= 4; i++) {
      const name = unit[`amenity${i}`];
      const cost = unit[`amenity${i}Expense`];
      if (name && name !== "" && cost > 0) {
        amenities.push({ name, cost });
        amenitiesTotal += cost;
      }
    }

    // Generate all missing invoices from tenantAddedDate to current month
    const now = new Date();
    // Exclude tenant copies so tenants see only owner or auto-generated invoices
    const invoices = await Invoice.find({ unit: req.params.id, origin: { $ne: 'tenant' } });
    // Map invoices by month to an array (allow duplicates/adjustments)
    let invoiceMap = {};
    invoices.forEach(inv => { invoiceMap[inv.month] = invoiceMap[inv.month] || []; invoiceMap[inv.month].push(inv); });

    let assignDate = unit.tenantAddedDate ? new Date(unit.tenantAddedDate) : null;
    if (!assignDate) {
      // No tenant assigned, just return existing invoices (preserve duplicates)
      const result = invoices.map(inv => {
        const base = inv.toObject();
        return {
          ...base,
          rent: unit.rent,
          amenities,
          amount: (base.amount || unit.rent + amenitiesTotal),
          amountBreakdown: {
            rent: unit.rent,
            amenities: amenitiesTotal,
            total: unit.rent + amenitiesTotal
          }
        };
      });
      return res.json(result);
    }

    // Generate months from assignDate to now
    let months = [];
    let d = new Date(assignDate.getFullYear(), assignDate.getMonth(), 1);
    let end = new Date(now.getFullYear(), now.getMonth(), 1);
    while (d <= end) {
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
      d.setMonth(d.getMonth() + 1);
    }

    // For each month, ensure at least one invoice exists; preserve arrays for duplicates
    for (const month of months) {
      if (!invoiceMap[month] || invoiceMap[month].length === 0) {
        // Upsert monthly invoice to avoid creating duplicates under concurrent calls
        const newInvoice = await Invoice.findOneAndUpdate(
          { unit: unit._id, month, origin: 'monthly' },
          { $setOnInsert: { unit: unit._id, amount: unit.rent + amenitiesTotal, month, status: 'pending', amenities, origin: 'monthly' } },
          { upsert: true, new: true }
        );
        invoiceMap[month] = [newInvoice];
      }
    }

    // Flatten all invoice arrays while preserving possible multiple invoices per month
    const allInvoices = Object.keys(invoiceMap)
      .sort()
      .flatMap(month => invoiceMap[month]);

    const result = allInvoices.map(inv => {
      const base = inv.toObject();
      return {
        ...base,
        rent: unit.rent,
        amenities,
        amount: (base.amount || unit.rent + amenitiesTotal),
        amountBreakdown: {
          rent: unit.rent,
          amenities: amenitiesTotal,
          total: unit.rent + amenitiesTotal
        }
      };
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
