const router = require("express").Router();
const db = require("../config/db");

// GET BOUGHT ORDERS - Get items purchased by a user
router.get("/bought/:userId", (req, res) => {
  const { userId } = req.params;

  if (!userId || isNaN(userId)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  db.query(
    `SELECT 
      o.id as orderId,
      o.listing_id,
      o.seller_id,
      o.amount,
      o.status,
      o.created_at,
      l.title,
      l.description,
      l.price,
      l.image_url,
      u.name as sellerName,
      u.email as sellerEmail
    FROM orders o
    JOIN listings l ON o.listing_id = l.id
    JOIN users u ON o.seller_id = u.id
    WHERE o.buyer_id = ?
    ORDER BY o.created_at DESC`,
    [userId],
    (err, results) => {
      if (err) {
        console.error("Error fetching bought orders:", err);
        return res.status(500).json({ message: "Database error", error: err });
      }

      res.json(results || []);
    }
  );
});

// GET SOLD ORDERS - Get items sold by a user
router.get("/sold/:userId", (req, res) => {
  const { userId } = req.params;

  if (!userId || isNaN(userId)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  db.query(
    `SELECT 
      o.id as orderId,
      o.listing_id,
      o.buyer_id,
      o.amount,
      o.status,
      o.created_at,
      l.title,
      l.description,
      l.price,
      l.image_url,
      u.name as buyerName,
      u.email as buyerEmail
    FROM orders o
    JOIN listings l ON o.listing_id = l.id
    JOIN users u ON o.buyer_id = u.id
    WHERE o.seller_id = ?
    ORDER BY o.created_at DESC`,
    [userId],
    (err, results) => {
      if (err) {
        console.error("Error fetching sold orders:", err);
        return res.status(500).json({ message: "Database error", error: err });
      }

      res.json(results || []);
    }
  );
});

// GET TRANSACTION HISTORY - Get wallet transactions for a user
router.get("/transactions/:userId", (req, res) => {
  const { userId } = req.params;
  const limit = req.query.limit ? parseInt(req.query.limit) : 20;
  const offset = req.query.offset ? parseInt(req.query.offset) : 0;

  if (!userId || isNaN(userId)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  db.query(
    `SELECT 
      id,
      user_id,
      type,
      amount,
      description,
      related_order_id,
      status,
      created_at
    FROM wallet_transactions
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?`,
    [userId, limit, offset],
    (err, results) => {
      if (err) {
        console.error("Error fetching transactions:", err);
        return res.status(500).json({ message: "Database error", error: err });
      }

      // Get total count for pagination
      db.query("SELECT COUNT(*) as total FROM wallet_transactions WHERE user_id = ?", [userId], (err, count) => {
        if (err) {
          return res.status(500).json({ message: "Database error", error: err });
        }

        res.json({
          transactions: results || [],
          total: count[0]?.total || 0,
          limit,
          offset,
        });
      });
    }
  );
});

module.exports = router;
