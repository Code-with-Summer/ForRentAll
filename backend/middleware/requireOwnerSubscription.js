import User from "../models/User.js";
import OwnerSubscription from "../models/OwnerSubscription.js";

export async function getActiveOwnerSubscription(ownerId) {
  const now = new Date();
  await OwnerSubscription.updateMany(
    { owner: ownerId, status: "active", endsAt: { $lt: now } },
    { $set: { status: "expired" } },
  );
  return OwnerSubscription.findOne({
    owner: ownerId,
    status: "active",
    startsAt: { $lte: now },
    endsAt: { $gte: now },
  }).sort({ endsAt: -1 });
}

export default async function requireOwnerSubscription(req, res, next) {
  try {
    if (!req.user || req.user.role !== "owner") return next();

    const owner = await User.findById(req.user.id).lean();
    if (!owner || owner.isActive === false) {
      return res.status(403).json({ error: "Owner account is deactivated by admin." });
    }

    const activeSub = await getActiveOwnerSubscription(req.user.id);
    if (!activeSub) {
      const pendingSub = await OwnerSubscription.findOne({
        owner: req.user.id,
        status: "pending",
      }).sort({ createdAt: -1 }).lean();
      if (pendingSub) {
        return res.status(403).json({ error: "Subscription payment is pending verification." });
      }
      return res.status(403).json({ error: "No active subscription found." });
    }

    req.activeSubscription = activeSub;
    return next();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
