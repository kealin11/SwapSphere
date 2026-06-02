const router = require("express").Router();
const db = require("../config/db");
const authenticate = require("../middleware/auth");

const ensureParticipant = (conversationId, userId, callback) => {
  db.query(
    "SELECT * FROM conversations WHERE id = ? AND (buyer_id = ? OR seller_id = ?) LIMIT 1",
    [conversationId, userId, userId],
    (err, conversations) => {
      if (err) return callback(err);
      callback(null, conversations[0] || null);
    }
  );
};

router.get("/:conversationId", authenticate, (req, res) => {
  const { conversationId } = req.params;

  if (!conversationId || isNaN(conversationId)) {
    return res.status(400).json({ message: "Invalid conversation ID" });
  }

  ensureParticipant(conversationId, req.user.id, (err, conversation) => {
    if (err) {
      console.error("Conversation permission error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    db.query(
      `SELECT m.id, m.conversation_id, m.sender_id, m.message, m.created_at, u.name AS sender_name
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE m.conversation_id = ?
       ORDER BY m.created_at ASC, m.id ASC`,
      [conversationId],
      (messageErr, messages) => {
        if (messageErr) {
          console.error("Messages fetch error:", messageErr);
          return res.status(500).json({ message: "Database error" });
        }

        res.json(messages || []);
      }
    );
  });
});

router.post("/", authenticate, (req, res) => {
  const { conversation_id, message } = req.body;
  const cleanMessage = String(message || "").trim();

  if (!conversation_id || isNaN(conversation_id)) {
    return res.status(400).json({ message: "Valid conversation_id is required" });
  }

  if (!cleanMessage) {
    return res.status(400).json({ message: "Message cannot be empty" });
  }

  ensureParticipant(conversation_id, req.user.id, (err, conversation) => {
    if (err) {
      console.error("Conversation permission error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    db.query(
      "INSERT INTO messages (conversation_id, sender_id, message) VALUES (?, ?, ?)",
      [conversation_id, req.user.id, cleanMessage],
      (insertErr, result) => {
        if (insertErr) {
          console.error("Message send error:", insertErr);
          return res.status(500).json({ message: "Database error" });
        }

        res.status(201).json({
          id: result.insertId,
          conversation_id,
          sender_id: req.user.id,
          message: cleanMessage,
        });
      }
    );
  });
});

module.exports = router;
