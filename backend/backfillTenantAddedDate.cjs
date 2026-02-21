const mongoose = require('mongoose');
const Flat = require('./models/Flat');

async function backfillTenantAddedDate() {
  await mongoose.connect('mongodb://localhost/tenantmgmt');
  const result = await Flat.updateMany(
    { tenant: { $ne: null }, $or: [ { tenantAddedDate: null }, { tenantAddedDate: { $exists: false } } ] },
    { $set: { tenantAddedDate: new Date() } }
  );
  console.log('Updated flats:', result.modifiedCount);
  await mongoose.disconnect();
}

backfillTenantAddedDate();
