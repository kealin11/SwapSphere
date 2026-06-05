const jwt = require("jsonwebtoken");
const db = require("../config/db");

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;

  if (!token) {
    return res.status(401).json({ message: "Authentication token required" });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ message: "Authentication is not configured" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch the user from the database to get is_admin and status
    const [rows] = await db.query("SELECT * FROM users WHERE id = ?", [decoded.id]);

    if (rows.length === 0) {
      return res.status(401).json({ message: "User not found" });
    }

    // Block check
    if (rows[0].status === "blocked") {
      return res.status(403).json({ message: "Your account has been blocked. Please contact support." });
    }

    // Attach full user object to req.user so is_admin is available in all routes
    req.user = rows[0];
    return next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = authMiddleware;