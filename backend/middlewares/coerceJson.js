// backend/middlewares/coerceJson.js
export const coerceJson = (fields = []) => (req, res, next) => {
  try {
    for (const f of fields) {
      const v = req.body?.[f];
      if (typeof v === "string" && v.trim().length) {
        try {
          req.body[f] = JSON.parse(v);
        } catch {
          return res.status(400).json({ error: `Invalid JSON in "${f}"` });
        }
      }
    }
    next();
  } catch (e) {
    return res.status(400).json({ error: "Bad Request", message: e?.message || "Invalid payload" });
  }
};
