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
    if (err) return res.status(500).json({ message: 'Server error' });
    if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
    if (rows[0].is_admin === 1) return res.status(403).json({ message: 'Cannot block an admin' });

    db.query('UPDATE users SET status = "blocked" WHERE id = ?', [req.params.id], (err2) => {
      if (err2) return res.status(500).json({ message: 'Server error' });
      res.json({ success: true, message: 'User blocked' });
    });
  });
});

// UNBLOCK A USER
router.patch('/users/:id/unblock', (req, res) => {
  db.query('UPDATE users SET status = "active" WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    res.json({ success: true, message: 'User unblocked' });
  });
});

// DELETE A USER
router.delete('/users/:id', (req, res) => {
  db.query('SELECT * FROM users WHERE id = ?', [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
    if (rows[0].is_admin === 1) return res.status(403).json({ message: 'Cannot delete an admin' });

    db.query('DELETE FROM users WHERE id = ?', [req.params.id], (err2) => {
      if (err2) return res.status(500).json({ message: 'Server error' });
      res.json({ success: true, message: 'User removed' });
    });
  });
});

// GET ALL LISTINGS
router.get('/listings', (req, res) => {
  db.query(
    `SELECT l.*, u.name AS seller_name 
     FROM listings l 
     JOIN users u ON l.seller_id = u.id 
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

// DELETE A LISTING
router.delete('/listings/:id', (req, res) => {
  db.query('DELETE FROM listings WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    res.json({ success: true, message: 'Listing removed' });
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