// middlewares/checkPlanExpiry.js
import User from "../models/userModel.js";

export const checkPlanExpiry = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return next();

    if (user.plan !== "free" && user.planExpiresAt && Date.now() > user.planExpiresAt) {
      // Auto-downgrade
      user.plan = "free";
      user.planExpiresAt = null;
      await user.save();
    }

    req.user = user; // refresh req.user
    next();
  } catch (err) {
    console.error("checkPlanExpiry error:", err);
    next();
  }
};
