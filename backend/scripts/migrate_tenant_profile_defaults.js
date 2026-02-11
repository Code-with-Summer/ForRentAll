import connectDB from '../config/db.js';
import TenantProfile from '../models/TenantProfile.js';

async function migrate() {
  await connectDB();
  try {
    // Set numberOfPersons = 1 where missing or null
    const res = await TenantProfile.updateMany(
      { $or: [ { numberOfPersons: { $exists: false } }, { numberOfPersons: null } ] },
      { $set: { numberOfPersons: 1 } }
    );
    console.log('TenantProfile migration result:', res);

    // Note: rentAgreement is optional; no action needed for existing docs.
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit(0);
  }
}

migrate();
