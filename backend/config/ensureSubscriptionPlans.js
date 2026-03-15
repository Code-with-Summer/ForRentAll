import PackagePlan from "../models/PackagePlan.js";

const DEFAULT_PLANS = [
  { code: "SILVER", name: "Silver Package", price: 99, durationDays: 30 },
  { code: "GOLD", name: "Gold Package", price: 299, durationDays: 180 },
  { code: "PLATINUM", name: "Platinum Package", price: 499, durationDays: 365 },
];

export async function ensureSubscriptionPlans() {
  for (const plan of DEFAULT_PLANS) {
    await PackagePlan.findOneAndUpdate(
      { code: plan.code },
      { $setOnInsert: plan },
      { upsert: true, new: true },
    );
  }
}

