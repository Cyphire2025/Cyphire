export const validate =
  (schema) =>
  (req, res, next) => {
    try {
      const data = schema.parse({
        body: req.body,
        params: req.params,
        query: req.query,
      });
      req.body = data.body || req.body;
      req.params = data.params || req.params;
      // req.query = data.query || req.query;   <-- REMOVE THIS LINE
      next();
    } catch (err) {
      return res.status(400).json({ error: "ValidationError", details: err.errors || err.message });
    }
  };
