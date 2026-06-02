const express = require("express");
const cors = require("cors");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, ".env") });
require("./config/db");

const app = express();

// CORS Configuration - Allow specific origins in production
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://swap-sphere-six.vercel.app",
  process.env.CLIENT_URL || "",
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/listings", require("./routes/listings"));
app.use("/api/payfast", require("./routes/payfast"));
app.use("/api/wallet", require("./routes/wallet"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/conversations", require("./routes/conversations"));
app.use("/api/messages", require("./routes/messages"));
app.use("/api/offers", require("./routes/offers"));

// Test route
app.get("/", (req, res) => {
  res.send("API running");
});

// Error handling middleware (must be last)
app.use((err, req, res, next) => {
  console.error("Error:", {
    message: err.message,
    code: err.code,
    status: err.status || 500,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });

  // Handle multer errors
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ message: "File is too large (max 5MB)" });
  }

  if (err.code === "LIMIT_FILE_COUNT") {
    return res.status(400).json({ message: "Too many files" });
  }

  if (err.message && err.message.includes("Only JPG, JPEG, PNG")) {
    return res.status(400).json({ message: err.message });
  }

  // Handle other errors
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
});

// Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});



