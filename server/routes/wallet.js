const router = require("express").Router();
const db = require("../config/db");

// GET WALLET INFO - Get user wallet balance, total sales, and sold listings
router.get("/:userId", (req, res) => {
  const { userId } = req.params;

  if (!userId || isNaN(userId)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  // Get wallet balance and user info
  db.query("SELECT id, wallet_balance, name FROM users WHERE id = ?", [userId], (err, users) => {
    if (err) {
      return res.status(500).json({ message: "Database error", error: err });
    }

    if (!users || users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = users[0];

    // Get total sales amount and count
    db.query(
      "SELECT COUNT(*) as soldCount, SUM(amount) as totalSales FROM orders WHERE seller_id = ? AND status = ?",
      [userId, "completed"],
      (err, sales) => {
        if (err) {
          return res.status(500).json({ message: "Database error", error: err });
        }

        // Get active and sold listings count
        db.query(
          "SELECT COUNT(CASE WHEN status = 'available' THEN 1 END) as activeListing, COUNT(CASE WHEN status = 'sold' THEN 1 END) as soldListings FROM listings WHERE user_id = ?",
          [userId],
          (err, listings) => {
            if (err) {
              return res.status(500).json({ message: "Database error", error: err });
            }

            res.json({
              walletBalance: user.wallet_balance || 0,
              totalSales: sales[0]?.totalSales || 0,
              soldListingsCount: sales[0]?.soldCount || 0,
              activeListingsCount: listings[0]?.activeListing || 0,
              userName: user.name,
            });
          }
        );
      }
    );
  });
});

// POST WITHDRAW - Simulate wallet withdrawal
router.post("/withdraw/:userId", (req, res) => {
  const { userId } = req.params;
  const { amount, description } = req.body;

  if (!userId || isNaN(userId)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  if (!amount || amount <= 0 || isNaN(amount)) {
    return res.status(400).json({ message: "Invalid withdrawal amount" });
  }

  // Get current wallet balance
  db.query("SELECT wallet_balance FROM users WHERE id = ?", [userId], (err, users) => {
    if (err) {
      return res.status(500).json({ message: "Database error", error: err });
    }

    if (!users || users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const currentBalance = users[0].wallet_balance || 0;

    // Check if sufficient balance
    if (currentBalance < amount) {
      return res.status(400).json({ message: "Insufficient wallet balance" });
    }

    // Start transaction
    db.beginTransaction((err) => {
      if (err) return res.status(500).json({ message: "Database error", error: err });

      // Deduct from wallet
      db.query("UPDATE users SET wallet_balance = wallet_balance - ? WHERE id = ?", [amount, userId], (err) => {
        if (err) {
          return db.rollback(() => res.status(500).json({ message: "Database error", error: err }));
        }

        // Create wallet transaction record
        db.query(
          "INSERT INTO wallet_transactions (user_id, type, amount, description, status) VALUES (?, ?, ?, ?, ?)",
          [userId, "withdrawal", amount, description || "Wallet withdrawal", "completed"],
          (err, result) => {
            if (err) {
              return db.rollback(() => res.status(500).json({ message: "Database error", error: err }));
            }

            // Commit transaction
            db.commit((err) => {
              if (err) {
                return db.rollback(() => res.status(500).json({ message: "Database error", error: err }));
              }

              res.json({
                success: true,
                message: "Withdrawal processed successfully",
                transactionId: result.insertId,
                amountWithdrawn: amount,
                newBalance: currentBalance - amount,
              });
            });
          }
        );
      });
    });
  });
});

module.exports = router;
