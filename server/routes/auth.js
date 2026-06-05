const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SALT_ROUNDS = 12;

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

const publicUserFields =
  "id, name, email, role_id, created_at, profile_image, is_admin, status";

const createToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign(
    {
      id: user.id,
      email: user.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

router.post("/register", async (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || "");

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email, and password are required" });
  }

  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ message: "Please provide a valid email address" });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  try {
    db.query("SELECT id FROM users WHERE email = ? LIMIT 1", [email], async (findErr, users) => {
      if (findErr) {
        console.error("Register lookup error:", findErr);
        return res.status(500).json({ message: "Unable to register user" });
      }

      if (users.length > 0) {
        return res.status(409).json({ message: "Email is already registered" });
      }

      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      db.query(
        "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
        [name, email, hashedPassword],
        (insertErr) => {
          if (insertErr) {
            console.error("Register insert error:", insertErr);
            return res.status(500).json({ message: "Unable to register user" });
          }

          return res.status(201).json({ message: "Registration successful. Please log in." });
        }
      );
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ message: "Unable to register user" });
  }
});

router.post("/login", (req, res) => {
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || "");

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ message: "Please provide a valid email address" });
  }

  db.query(
    `SELECT ${publicUserFields}, password FROM users WHERE email = ? LIMIT 1`,
    [email],
    async (err, users) => {
      if (err) {
        console.error("Login lookup error:", err);
        return res.status(500).json({ message: "Unable to log in" });
      }

      if (users.length === 0) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const userRecord = users[0];
      const passwordMatches = await bcrypt.compare(password, userRecord.password);

      if (!passwordMatches) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Blocked user check
      if (userRecord.status === "blocked") {
        return res.status(403).json({ message: "Your account has been blocked. Please contact support." });
      }

      const { password: _password, ...user } = userRecord;

      try {
        const token = createToken(user);
        return res.json({ token, user });
      } catch (tokenErr) {
        console.error("JWT error:", tokenErr);
        return res.status(500).json({ message: "Unable to log in" });
      }
    }
  );
});

module.exports = router;