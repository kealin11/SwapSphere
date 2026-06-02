-- SwapSphere Wallet System Database Setup
-- Run this script to create the necessary tables for the seller wallet system

-- Ensure wallet_balance exists in users table (already created, but documented here)
-- ALTER TABLE users ADD COLUMN wallet_balance DECIMAL(10,2) DEFAULT 0.00;

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  listing_id INT NOT NULL,
  buyer_id INT NOT NULL,
  seller_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
  FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_buyer_id (buyer_id),
  INDEX idx_seller_id (seller_id),
  INDEX idx_listing_id (listing_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  payment_method VARCHAR(50) DEFAULT 'payfast',
  transaction_id VARCHAR(255) UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
  payfast_data JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_order_id (order_id),
  INDEX idx_status (status),
  INDEX idx_transaction_id (transaction_id),
  INDEX idx_created_at (created_at)
);

-- Create wallet_transactions table
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  type ENUM('credit', 'debit', 'withdrawal') DEFAULT 'credit',
  amount DECIMAL(10,2) NOT NULL,
  description VARCHAR(255),
  related_order_id INT,
  status ENUM('pending', 'completed', 'cancelled') DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (related_order_id) REFERENCES orders(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_type (type),
  INDEX idx_created_at (created_at),
  INDEX idx_status (status)
);

-- Update listings table to add status if not exists
-- ALTER TABLE listings ADD COLUMN status ENUM('available', 'sold', 'removed') DEFAULT 'available';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_wallet ON users(id, wallet_balance);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status, user_id);

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
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
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  conversation_id INT NOT NULL,
  sender_id INT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_messages_conversation (conversation_id, created_at),
  INDEX idx_messages_sender (sender_id)
);

-- Create offers table
CREATE TABLE IF NOT EXISTS offers (
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
);
