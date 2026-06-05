const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

router.use(authMiddleware);
router.use(adminMiddleware);

// GET ALL USERS
router.get('/users', (req, res) => {
db.query(
'SELECT id, name, email, is_admin, wallet_balance, status, created_at FROM users ORDER BY created_at DESC',
(err, users) => {
if (err) {
console.error('Admin get users error:', err);
return res.status(500).json({ message: 'Server error', error: err.message });
}
res.json({ success: true, users });
}
);
});

// BLOCK A USER
router.patch('/users/:id/block', (req, res) => {
db.query('SELECT * FROM users WHERE id = ?', [req.params.id], (err, rows) => {
if (err) return res.status(500).json({ message: 'Server error', error: err.message });
if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
if (rows[0].is_admin === 1) return res.status(403).json({ message: 'Cannot block an admin' });

db.query('UPDATE users SET status = "blocked" WHERE id = ?', [req.params.id], (err2) => {
if (err2) return res.status(500).json({ message: 'Server error', error: err2.message });
res.json({ success: true, message: 'User blocked' });
});
});
});

// UNBLOCK A USER
router.patch('/users/:id/unblock', (req, res) => {
db.query('UPDATE users SET status = "active" WHERE id = ?', [req.params.id], (err) => {
if (err) return res.status(500).json({ message: 'Server error', error: err.message });
res.json({ success: true, message: 'User unblocked' });
});
});

// DELETE A USER — removes all related records first to avoid foreign key errors
router.delete('/users/:id', (req, res) => {
const userId = req.params.id;

db.query('SELECT * FROM users WHERE id = ?', [userId], (err, rows) => {
if (err) return res.status(500).json({ message: 'Server error', error: err.message });
if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
if (rows[0].is_admin === 1) return res.status(403).json({ message: 'Cannot delete an admin' });

// Step 1 — delete messages sent by user
db.query('DELETE FROM messages WHERE sender_id = ?', [userId], (err1) => {
if (err1) return res.status(500).json({ message: 'Failed at messages', error: err1.message });

// Step 2 — delete conversations the user is part of
db.query(
'DELETE FROM conversations WHERE buyer_id = ? OR seller_id = ?',
[userId, userId],
(err2) => {
if (err2) return res.status(500).json({ message: 'Failed at conversations', error: err2.message });

// Step 3 — delete offers made by or received by the user (FIXED: was offers_id, now seller_id)
db.query(
'DELETE FROM offers WHERE buyer_id = ? OR seller_id = ?',
[userId, userId],
(err3) => {
if (err3) return res.status(500).json({ message: 'Failed at offers', error: err3.message });

// Step 4 — delete wallet transactions
db.query(
'DELETE FROM wallet_transactions WHERE user_id = ?',
[userId],
(err4) => {
if (err4) return res.status(500).json({ message: 'Failed at wallet transactions', error: err4.message });

// Step 5 — delete payments linked to user orders
db.query(
'DELETE FROM payments WHERE order_id IN (SELECT id FROM orders WHERE buyer_id = ? OR seller_id = ?)',
[userId, userId],
(err5) => {
if (err5) return res.status(500).json({ message: 'Failed at payments', error: err5.message });

// Step 6 — delete orders
db.query(
'DELETE FROM orders WHERE buyer_id = ? OR seller_id = ?',
[userId, userId],
(err6) => {
if (err6) return res.status(500).json({ message: 'Failed at orders', error: err6.message });

// Step 7 — delete listings
db.query(
'DELETE FROM listings WHERE user_id = ?',
[userId],
(err7) => {
if (err7) return res.status(500).json({ message: 'Failed at listings', error: err7.message });

// Step 8 — finally delete the user
db.query('DELETE FROM users WHERE id = ?', [userId], (err8) => {
if (err8) return res.status(500).json({ message: 'Failed to delete user', error: err8.message });
res.json({ success: true, message: 'User and all related data removed successfully' });
});
}
);
}
);
}
);
}
);
}
);
}
);
});
});
});

// GET ALL LISTINGS
router.get('/listings', (req, res) => {
db.query(
`SELECT l.*, u.name AS seller_name
FROM listings l
JOIN users u ON l.user_id = u.id
ORDER BY l.created_at DESC`,
(err, listings) => {
if (err) {
console.error('Admin get listings error:', err);
return res.status(500).json({ message: 'Server error', error: err.message });
}
res.json({ success: true, listings });
}
);
});

// DELETE A LISTING — removes related offers and orders first
router.delete('/listings/:id', (req, res) => {
const listingId = req.params.id;

// Step 1 — delete offers on this listing
db.query('DELETE FROM offers WHERE listing_id = ?', [listingId], (err1) => {
if (err1) return res.status(500).json({ message: 'Failed at offers', error: err1.message });

// Step 2 — delete payments linked to orders for this listing
db.query(
'DELETE FROM payments WHERE order_id IN (SELECT id FROM orders WHERE listing_id = ?)',
[listingId],
(err2) => {
if (err2) return res.status(500).json({ message: 'Failed at payments', error: err2.message });

// Step 3 — delete orders for this listing
db.query('DELETE FROM orders WHERE listing_id = ?', [listingId], (err3) => {
if (err3) return res.status(500).json({ message: 'Failed at orders', error: err3.message });

// Step 4 — delete conversations for this listing
db.query(
'DELETE FROM conversations WHERE listing_id = ?',
[listingId],
(err4) => {
if (err4) return res.status(500).json({ message: 'Failed at conversations', error: err4.message });

// Step 5 — delete the listing
db.query('DELETE FROM listings WHERE id = ?', [listingId], (err5) => {
if (err5) return res.status(500).json({ message: 'Failed to delete listing', error: err5.message });
res.json({ success: true, message: 'Listing removed successfully' });
});
}
);
});
}
);
});
});

// GET ALL ORDERS
router.get('/orders', (req, res) => {
db.query(
`SELECT o.*,
b.name AS buyer_name,
s.name AS seller_name,
l.title AS listing_title
FROM orders o
JOIN users b ON o.buyer_id = b.id
JOIN users s ON o.seller_id = s.id
JOIN listings l ON o.listing_id = l.id
ORDER BY o.created_at DESC`,
(err, orders) => {
if (err) {
console.error('Admin get orders error:', err);
return res.status(500).json({ message: 'Server error', error: err.message });
}
res.json({ success: true, orders });
}
);
});

module.exports = router;


