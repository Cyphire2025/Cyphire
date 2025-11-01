// middlewares/checkPlanExpiry.js

import User from "../models/userModel.js";

/**
 * Middleware to check and handle plan expiry for any authenticated user.
 * - Auto-downgrades expired plans (sets to "free" and removes expiry)
 * - Refreshes req.user after potential downgrade (so downstream always has up-to-date info)
 * - Logs all downgrades for audit (can be plugged into winston/sentry)
 * - Future-proof: can add notifications, webhooks, or analytics hooks here
 */
export const checkPlanExpiry = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) return next();

    const now = Date.now();
    // Plan expiry logic
    if (
      user.plan !== "free" &&
      user.planExpiresAt &&
      now > user.planExpiresAt
    ) {
      // Downgrade and clear expiry
      const prevPlan = user.plan;
      user.plan = "free";
      user.planStartedAt = null;
      user.planExpiresAt = null;
      await user.save();

      // Audit log (plug into winston/sentry for enterprise)
      console.warn(
        `[PLAN EXPIRY] User ${user.email} (${user._id}) auto-downgraded from ${prevPlan} at ${new Date(now).toISOString()}`
      );

      // Optional: trigger webhook/notification/email here
    }

    // Always refresh req.user so downstream code has latest plan
    req.user = user;
    next();
  } catch (err) {
    console.error("checkPlanExpiry error:", err);
    // Still allow request; user may have been deleted
    next();
  }
};
