// middlewares/coerceJson.js

/**
 * Middleware to coerce specific body fields from JSON string to object.
 * - Handles only non-empty strings
 * - Catches JSON parse errors and returns a clear error (400)
 * - Logs all parse errors for debugging/audit
 * - Extensible: can support more formats/types in future
 * @param {Array<string>} fields - Body fields to parse as JSON
 * @returns middleware function
 */
export const coerceJson = (fields = []) => (req, res, next) => {
  try {
    for (const f of fields) {
      const v = req.body?.[f];
      if (typeof v === "string" && v.trim().length) {
        try {
          req.body[f] = JSON.parse(v);
        } catch (err) {
          console.error(`[COERCE JSON] Invalid JSON in "${f}":`, err.message);
          return res
            .status(400)
            .json({ error: `Invalid JSON in "${f}"`, message: err.message });
        }
      }
    }
    next();
  } catch (e) {
    console.error("[COERCE JSON] Fatal error:", e.message);
    return res
      .status(400)
      .json({ error: "Bad Request", message: e?.message || "Invalid payload" });
  }
};

/*
Example usage:
  router.post(
    "/some-endpoint",
    coerceJson(["metadata", "someOtherField"]),
    controllerFn
  );
*/

