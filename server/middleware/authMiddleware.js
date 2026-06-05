const jwt = require("jsonwebtoken");
const db = require("../config/db");

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ message: "JWT is not configured" });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  db.query(
    `SELECT id, name, email, role_id, is_admin, status,
            wallet_balance, profile_image, created_at
     FROM users WHERE id = ? LIMIT 1`,
    [decoded.id],
    (err, rows) => {
      if (err) {
        console.error("Auth middleware DB error:", err);
        return res.status(500).json({ message: "Server error during authentication" });
      }

      if (rows.length === 0) {
        return res.status(401).json({ message: "User not found" });
      }

      if (rows[0].status === "blocked") {
        return res.status(403).json({ message: "Your account has been blocked. Please contact support." });
      }

      req.user = rows[0];
      return next();
    }
  );
};

module.exports = authMiddleware;