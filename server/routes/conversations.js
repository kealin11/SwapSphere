const router = require("express").Router();
const db = require("../config/db");
const authenticate = require("../middleware/auth");

const conversationSelect = `
  SELECT
    c.id,
    c.listing_id,
    c.buyer_id,
    c.seller_id,
    c.created_at,
    l.title AS listing_title,
    l.price AS listing_price,
    l.image_url,
    buyer.name AS buyer_name,
    seller.name AS seller_name,
    other_user.name AS other_user_name,
    other_user.email AS other_user_email,
    last_message.message AS last_message,
    last_message.created_at AS last_message_at,
    (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id) AS message_count
  FROM conversations c
  JOIN listings l ON l.id = c.listing_id
  JOIN users buyer ON buyer.id = c.buyer_id
  JOIN users seller ON seller.id = c.seller_id
  JOIN users other_user ON other_user.id = CASE WHEN c.buyer_id = ? THEN c.seller_id ELSE c.buyer_id END
  LEFT JOIN messages last_message ON last_message.id = (
    SELECT id FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC, id DESC LIMIT 1
  )
`;

router.post("/", authenticate, (req, res) => {
  const buyerId = req.user.id;
  const { listing_id, initial_message } = req.body;

  if (!listing_id || isNaN(listing_id)) {
    return res.status(400).json({ message: "Valid listing_id is required" });
  }

  db.query("SELECT id, user_id, title FROM listings WHERE id = ? LIMIT 1", [listing_id], (err, listings) => {
    if (err) {
      console.error("Conversation listing lookup error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (!listings.length) {
      return res.status(404).json({ message: "Listing not found" });
    }

    const listing = listings[0];
    const sellerId = listing.user_id;

    if (sellerId === buyerId) {
      return res.status(400).json({ message: "You cannot message yourself about your own listing" });
    }

    db.query(
      "SELECT id FROM conversations WHERE listing_id = ? AND buyer_id = ? AND seller_id = ? LIMIT 1",
      [listing_id, buyerId, sellerId],
      (findErr, existing) => {
        if (findErr) {
          console.error("Conversation lookup error:", findErr);
          return res.status(500).json({ message: "Database error" });
        }

        const createInitialMessage = (conversationId) => {
          const message = String(initial_message || "").trim();
          if (!message) {
            return res.status(existing.length ? 200 : 201).json({ id: conversationId, listing_id, buyer_id: buyerId, seller_id: sellerId });
          }

          db.query(
            "INSERT INTO messages (conversation_id, sender_id, message) VALUES (?, ?, ?)",
            [conversationId, buyerId, message],
            (messageErr) => {
              if (messageErr) {
                console.error("Initial message error:", messageErr);
                return res.status(500).json({ message: "Conversation created, but message could not be sent" });
              }

              return res.status(existing.length ? 200 : 201).json({ id: conversationId, listing_id, buyer_id: buyerId, seller_id: sellerId });
            }
          );
        };

        if (existing.length) {
          return createInitialMessage(existing[0].id);
        }

        db.query(
          "INSERT INTO conversations (listing_id, buyer_id, seller_id) VALUES (?, ?, ?)",
          [listing_id, buyerId, sellerId],
          (insertErr, result) => {
            if (insertErr) {
              console.error("Conversation create error:", insertErr);
              return res.status(500).json({ message: "Database error" });
            }

            return createInitialMessage(result.insertId);
          }
        );
      }
    );
  });
});

router.get("/", authenticate, (req, res) => {
  const userId = req.user.id;

  db.query(
    `${conversationSelect}
     WHERE c.buyer_id = ? OR c.seller_id = ?
     ORDER BY COALESCE(last_message.created_at, c.created_at) DESC`,
    [userId, userId, userId],
    (err, results) => {
      if (err) {
        console.error("Conversations fetch error:", err);
        return res.status(500).json({ message: "Database error" });
      }

      res.json(results || []);
    }
  );
});

router.get("/:id", authenticate, (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return res.status(400).json({ message: "Invalid conversation ID" });
  }

  db.query(
    `${conversationSelect}
     WHERE c.id = ? AND (c.buyer_id = ? OR c.seller_id = ?)
     LIMIT 1`,
    [userId, id, userId, userId],
    (err, results) => {
      if (err) {
        console.error("Conversation fetch error:", err);
        return res.status(500).json({ message: "Database error" });
      }

      if (!results.length) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      res.json(results[0]);
    }
  );
});

module.exports = router;
