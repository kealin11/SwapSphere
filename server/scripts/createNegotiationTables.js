const db = require("../config/db");

const statements = [
  `CREATE TABLE IF NOT EXISTS conversations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    listing_id INT NOT NULL,
    buyer_id INT NOT NULL,
    seller_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
    FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_listing_buyer_seller (listing_id, buyer_id, seller_id),
    INDEX idx_conversations_buyer (buyer_id),
    INDEX idx_conversations_seller (seller_id),
    INDEX idx_conversations_listing (listing_id),
    INDEX idx_conversations_created_at (created_at)
  )`,
  `CREATE TABLE IF NOT EXISTS messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    conversation_id INT NOT NULL,
    sender_id INT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_messages_conversation (conversation_id, created_at),
    INDEX idx_messages_sender (sender_id)
  )`,
  `CREATE TABLE IF NOT EXISTS offers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    listing_id INT NOT NULL,
    buyer_id INT NOT NULL,
    seller_id INT NOT NULL,
    offered_price DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
    FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_offers_listing (listing_id),
    INDEX idx_offers_buyer (buyer_id),
    INDEX idx_offers_seller (seller_id),
    INDEX idx_offers_status (status),
    INDEX idx_offers_created_at (created_at)
  )`,
];

const run = async () => {
  for (const statement of statements) {
    await new Promise((resolve, reject) => {
      db.query(statement, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
};

run()
  .then(() => {
    console.log("Negotiation tables are ready");
    db.end();
  })
  .catch((err) => {
    console.error("Failed to create negotiation tables:", err);
    db.end();
    process.exit(1);
  });
