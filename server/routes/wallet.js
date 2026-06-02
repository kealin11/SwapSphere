const router = require("express").Router();
const db = require("../config/db");
const authenticate = require("../middleware/auth");

const safeNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

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
              walletBalance: safeNumber(user.wallet_balance),
              totalSales: safeNumber(sales[0]?.totalSales),
              soldListingsCount: safeNumber(sales[0]?.soldCount),
              activeListingsCount: safeNumber(listings[0]?.activeListing),
              userName: user.name,
            });
          }
        );
      }
    );
  });
});

// POST WITHDRAW - Simulate wallet withdrawal (Protected route)
router.post("/withdraw/:userId", authenticate, (req, res) => {
  const { userId } = req.params;
  const { amount, description } = req.body;
  const requestingUserId = req.user.id;

  if (!userId || isNaN(userId)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  // Verify the user can only withdraw from their own wallet
  if (Number(userId) !== Number(requestingUserId)) {
    return res.status(403).json({ message: "You can only withdraw from your own wallet" });
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

    const currentBalance = safeNumber(users[0].wallet_balance);

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
