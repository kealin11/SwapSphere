const express = require("express");
const cors = require("cors");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, ".env") });
require("./config/db");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded images as static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

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

// Server
app.listen(5000, () => {
  console.log("Server running on port 5000");
});



