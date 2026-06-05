const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

router.use(authMiddleware);
router.use(adminMiddleware);

// GET ALL USERS
router.get('/users', async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, name, email, is_admin, wallet_balance, status, created_at FROM users ORDER BY created_at DESC'
    );
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// BLOCK A USER
router.patch('/users/:id/block', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
    if (rows[0].is_admin === 1) return res.status(403).json({ message: 'Cannot block an admin' });
    await db.query('UPDATE users SET status = "blocked" WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'User blocked' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// UNBLOCK A USER
router.patch('/users/:id/unblock', async (req, res) => {
  try {
    await db.query('UPDATE users SET status = "active" WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'User unblocked' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE A USER
router.delete('/users/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
    if (rows[0].is_admin === 1) return res.status(403).json({ message: 'Cannot delete an admin' });
    await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'User removed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET ALL LISTINGS
router.get('/listings', async (req, res) => {
  try {
    const [listings] = await db.query(
      `SELECT l.*, u.name AS seller_name 
       FROM listings l 
       JOIN users u ON l.seller_id = u.id 
       ORDER BY l.created_at DESC`
    );
    res.json({ success: true, listings });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE A LISTING
router.delete('/listings/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM listings WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Listing removed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET ALL ORDERS
router.get('/orders', async (req, res) => {
  try {
    const [orders] = await db.query(
      `SELECT o.*, 
              b.name AS buyer_name, 
              s.name AS seller_name,
              l.title AS listing_title
       FROM orders o
       JOIN users b ON o.buyer_id = b.id
       JOIN users s ON o.seller_id = s.id
       JOIN listings l ON o.listing_id = l.id
       ORDER BY o.created_at DESC`
    );
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;