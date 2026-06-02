const router = require("express").Router();
const db = require("../config/db");
const authenticate = require("../middleware/auth");

const offerSelect = `
  SELECT
    o.id,
    o.listing_id,
    o.buyer_id,
    o.seller_id,
    o.offered_price,
    o.status,
    o.created_at,
    l.title AS listing_title,
    l.price AS listing_price,
    l.image_url,
    buyer.name AS buyer_name,
    seller.name AS seller_name
  FROM offers o
  JOIN listings l ON l.id = o.listing_id
  JOIN users buyer ON buyer.id = o.buyer_id
  JOIN users seller ON seller.id = o.seller_id
`;

router.post("/", authenticate, (req, res) => {
  const buyerId = req.user.id;
  const { listing_id, offered_price } = req.body;
  const price = Number(offered_price);

  if (!listing_id || isNaN(listing_id)) {
    return res.status(400).json({ message: "Valid listing_id is required" });
  }

  if (!Number.isFinite(price) || price <= 0) {
    return res.status(400).json({ message: "Offer price must be greater than zero" });
  }

  db.query("SELECT id, user_id, status FROM listings WHERE id = ? LIMIT 1", [listing_id], (err, listings) => {
    if (err) {
      console.error("Offer listing lookup error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (!listings.length) {
      return res.status(404).json({ message: "Listing not found" });
    }

    const listing = listings[0];
    if (listing.user_id === buyerId) {
      return res.status(400).json({ message: "You cannot make an offer on your own listing" });
    }

    if (listing.status && listing.status !== "available") {
      return res.status(400).json({ message: "This listing is not available for offers" });
    }

    db.query(
      "INSERT INTO offers (listing_id, buyer_id, seller_id, offered_price, status) VALUES (?, ?, ?, ?, 'pending')",
      [listing_id, buyerId, listing.user_id, price],
      (insertErr, result) => {
        if (insertErr) {
          console.error("Offer create error:", insertErr);
          return res.status(500).json({ message: "Database error" });
        }

        res.status(201).json({
          id: result.insertId,
          listing_id,
          buyer_id: buyerId,
          seller_id: listing.user_id,
          offered_price: price,
          status: "pending",
        });
      }
    );
  });
});

router.get("/", authenticate, (req, res) => {
  const userId = req.user.id;

  db.query(
    `${offerSelect}
     WHERE o.buyer_id = ? OR o.seller_id = ?
     ORDER BY o.created_at DESC`,
    [userId, userId],
    (err, results) => {
      if (err) {
        console.error("Offers fetch error:", err);
        return res.status(500).json({ message: "Database error" });
      }

      res.json(results || []);
    }
  );
});

router.patch("/:id/accept", authenticate, (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return res.status(400).json({ message: "Invalid offer ID" });
  }

  db.beginTransaction((txErr) => {
    if (txErr) return res.status(500).json({ message: "Database error" });

    db.query("SELECT * FROM offers WHERE id = ? LIMIT 1", [id], (err, offers) => {
      if (err) return db.rollback(() => res.status(500).json({ message: "Database error" }));

      if (!offers.length || offers[0].seller_id !== req.user.id) {
        return db.rollback(() => res.status(404).json({ message: "Offer not found" }));
      }

      if (offers[0].status !== "pending") {
        return db.rollback(() => res.status(400).json({ message: "Only pending offers can be accepted" }));
      }

      db.query("UPDATE offers SET status = 'accepted' WHERE id = ?", [id], (acceptErr) => {
        if (acceptErr) return db.rollback(() => res.status(500).json({ message: "Database error" }));

        db.query(
          "UPDATE offers SET status = 'rejected' WHERE listing_id = ? AND id <> ? AND status = 'pending'",
          [offers[0].listing_id, id],
          (rejectErr) => {
            if (rejectErr) return db.rollback(() => res.status(500).json({ message: "Database error" }));

            db.commit((commitErr) => {
              if (commitErr) return db.rollback(() => res.status(500).json({ message: "Database error" }));
              res.json({ message: "Offer accepted", status: "accepted" });
            });
          }
        );
      });
    });
  });
});

router.patch("/:id/reject", authenticate, (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return res.status(400).json({ message: "Invalid offer ID" });
  }

  db.query("SELECT * FROM offers WHERE id = ? LIMIT 1", [id], (err, offers) => {
    if (err) {
      console.error("Offer lookup error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (!offers.length || offers[0].seller_id !== req.user.id) {
      return res.status(404).json({ message: "Offer not found" });
    }

    if (offers[0].status !== "pending") {
      return res.status(400).json({ message: "Only pending offers can be rejected" });
    }

    db.query("UPDATE offers SET status = 'rejected' WHERE id = ?", [id], (updateErr) => {
      if (updateErr) {
        console.error("Offer reject error:", updateErr);
        return res.status(500).json({ message: "Database error" });
      }

      res.json({ message: "Offer rejected", status: "rejected" });
    });
  });
});

module.exports = router;
