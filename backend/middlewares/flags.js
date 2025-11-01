// middlewares/flags.js
export function isEnabled(name, expected = "1") {
  return String(process.env[name] || "").trim() === expected;
}

export function requireFlag(name, expected = "1") {
  return (req, res, next) => {
    if (isEnabled(name, expected)) return next();
    return res.status(403).json({ success: false, error: `Feature ${name} is disabled` });
  };
}
