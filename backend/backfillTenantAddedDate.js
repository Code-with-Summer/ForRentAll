const mongoose = require('mongoose');
const Unit = require('./models/Unit');

async function backfillTenantAddedDate() {
  await mongoose.connect('mongodb://localhost/tenantmgmt');
  const result = await Unit.updateMany(
    { tenant: { $ne: null }, $or: [ { tenantAddedDate: null }, { tenantAddedDate: { $exists: false } } ] },
    { $set: { tenantAddedDate: new Date() } }
  );
  console.log('Updated units:', result.modifiedCount);
  await mongoose.disconnect();
}

backfillTenantAddedDate();
