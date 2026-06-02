const router = require("express").Router();
const db = require("../config/db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp + random number + original extension
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, name + "-" + uniqueSuffix + ext);
  },
});

// Filter to allow only specific image types
const fileFilter = (req, file, cb) => {
  const allowedMimes = ["image/jpeg", "image/png", "image/webp"];
  const allowedExts = [".jpg", ".jpeg", ".png", ".webp"];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimes.includes(file.mimetype) && allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, JPEG, PNG, and WebP files are allowed"), false);
  }
};

// Create multer instance with size limit of 5MB
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// GET ALL LISTINGS
router.get("/", (req, res) => {
  db.query(
    `SELECT l.*, u.name AS seller_name, u.email AS seller_email
     FROM listings l
     LEFT JOIN users u ON u.id = l.user_id
     ORDER BY l.created_at DESC`,
    (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results);
    }
  );
});

// GET LISTING BY ID
router.get("/:id", (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return res.status(400).json({ message: "Invalid listing ID" });
  }

  db.query(
    `SELECT l.*, u.name AS seller_name, u.email AS seller_email
     FROM listings l
     LEFT JOIN users u ON u.id = l.user_id
     WHERE l.id = ?
     LIMIT 1`,
    [id],
    (err, results) => {
      if (err) return res.status(500).json(err);
      if (!results.length) return res.status(404).json({ message: "Listing not found" });
      res.json(results[0]);
    }
  );
});

// GET ALL LISTINGS
router.get("/legacy/all", (req, res) => {
  db.query("SELECT * FROM listings", (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

// GET LISTINGS BY USER ID
router.get("/user/:id", (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  db.query("SELECT * FROM listings WHERE user_id = ?", [id], (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    res.json(results);
  });
});

// CREATE LISTING
router.post("/", upload.single("image"), (req, res) => {
  const { title, description, price, category, user_id } = req.body;
  let imageUrl = null;

  // Validate required fields
  if (!title || !description || !price || !user_id) {
    // Clean up uploaded file if validation fails
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error deleting file:", err);
      });
    }
    return res.status(400).json({ message: "Missing required fields: title, description, price, user_id" });
  }

  // Set image URL if file was uploaded
  if (req.file) {
    imageUrl = `/uploads/${req.file.filename}`;
  }

  db.query(
    "INSERT INTO listings (title, description, price, category, user_id, image_url) VALUES (?, ?, ?, ?, ?, ?)",
    [title, description, price, category || null, user_id, imageUrl],
    (err, result) => {
      if (err) {
        // Clean up uploaded file if database insertion fails
        if (req.file) {
          fs.unlink(req.file.path, (err) => {
            if (err) console.error("Error deleting file:", err);
          });
        }
        return res.status(500).json({ message: "Database error", error: err });
      }
      res.status(201).json({ 
        message: "Listing created successfully", 
        listingId: result.insertId,
        imageUrl: imageUrl
      });
    }
  );
});

// DELETE LISTING BY ID
router.delete("/:id", (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return res.status(400).json({ message: "Invalid listing ID" });
  }

  db.query("DELETE FROM listings WHERE id = ?", [id], (err, result) => {
    if (err) return res.status(500).json({ message: "Database error" });

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Listing not found" });
    }

    res.json({ message: "Listing deleted successfully" });
  });
});

module.exports = router;
