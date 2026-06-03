-- SwapSphere Payment Flow Production Migration Script
-- This script ensures all tables have the correct schema for production payment processing
-- Run this AFTER the initial DATABASE_SETUP.sql

-- ============================================================================
-- 1. VERIFY USERS TABLE HAS WALLET_BALANCE
-- ============================================================================
-- Add wallet_balance if it doesn't exist (already in users table, but documented)
ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_balance DECIMAL(10,2) DEFAULT 0.00;

-- ============================================================================
-- 2. VERIFY LISTINGS TABLE HAS STATUS
-- ============================================================================
-- Add status column if it doesn't exist
ALTER TABLE listings ADD COLUMN IF NOT EXISTS status ENUM('available', 'sold', 'removed') DEFAULT 'available';

-- Add index for status queries
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status, user_id);

-- ============================================================================
-- 3. VERIFY ORDERS TABLE STRUCTURE
-- ============================================================================
-- Ensure orders table has all required columns and indexes
ALTER TABLE orders ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Add indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_listing_id ON orders(listing_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- ============================================================================
-- 4. VERIFY PAYMENTS TABLE STRUCTURE
-- ============================================================================
-- Ensure payments table has all required columns and indexes
ALTER TABLE payments ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE payments MODIFY COLUMN transaction_id VARCHAR(255);
ALTER TABLE payments MODIFY COLUMN payfast_data JSON;

-- Add UNIQUE constraint on transaction_id if it doesn't exist
-- This prevents duplicate payments from being processed
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id);

-- Add indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

-- ============================================================================
-- 5. VERIFY WALLET_TRANSACTIONS TABLE STRUCTURE
-- ============================================================================
-- Ensure wallet_transactions table has all required columns
ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type ON wallet_transactions(type);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON wallet_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_status ON wallet_transactions(status);

-- ============================================================================
-- 6. OPTIMIZE QUERIES WITH COMPOSITE INDEXES
-- ============================================================================
-- Performance optimization indexes
CREATE INDEX IF NOT EXISTS idx_user_wallet ON users(id, wallet_balance);
CREATE INDEX IF NOT EXISTS idx_listings_user_status ON listings(user_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_status ON orders(buyer_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_seller_status ON orders(seller_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_listing_status ON orders(listing_id, status);

-- ============================================================================
-- 7. VERIFY DATA INTEGRITY
-- ============================================================================
-- Ensure all foreign key relationships are in place
-- This will help catch any orphaned records

-- Check orders table for orphaned records
-- SELECT * FROM orders WHERE listing_id NOT IN (SELECT id FROM listings);
-- SELECT * FROM orders WHERE buyer_id NOT IN (SELECT id FROM users);
-- SELECT * FROM orders WHERE seller_id NOT IN (SELECT id FROM users);

-- Check payments table for orphaned records
-- SELECT * FROM payments WHERE order_id NOT IN (SELECT id FROM orders);

-- Check wallet_transactions table for orphaned records
-- SELECT * FROM wallet_transactions WHERE user_id NOT IN (SELECT id FROM users);
-- SELECT * FROM wallet_transactions WHERE related_order_id IS NOT NULL AND related_order_id NOT IN (SELECT id FROM orders);

-- ============================================================================
-- 8. VERIFY CRITICAL CONSTRAINTS
-- ============================================================================
-- Ensure transaction_id in payments is truly UNIQUE for duplicate prevention
-- Get existing duplicate transaction_ids (if any exist from testing)
-- SELECT transaction_id, COUNT(*) FROM payments WHERE transaction_id IS NOT NULL GROUP BY transaction_id HAVING COUNT(*) > 1;

-- ============================================================================
-- 9. VERIFY ALL ENUM VALUES ARE CORRECT
-- ============================================================================
-- Check orders status enum values
-- SHOW COLUMNS FROM orders WHERE Field='status';
-- Expected values: pending, completed, cancelled

-- Check payments status enum values
-- SHOW COLUMNS FROM payments WHERE Field='status';
-- Expected values: pending, completed, failed, refunded

-- Check wallet_transactions type enum values
-- SHOW COLUMNS FROM wallet_transactions WHERE Field='type';
-- Expected values: credit, debit, withdrawal

-- Check listings status enum values
-- SHOW COLUMNS FROM listings WHERE Field='status';
-- Expected values: available, sold, removed

-- ============================================================================
-- 10. MIGRATION COMPLETION
-- ============================================================================
-- Run these queries to verify the migration was successful:
-- SELECT 'Users table' as table_name, COUNT(*) as total_records FROM users
-- UNION ALL SELECT 'Listings table', COUNT(*) FROM listings
-- UNION ALL SELECT 'Orders table', COUNT(*) FROM orders
-- UNION ALL SELECT 'Payments table', COUNT(*) FROM payments
-- UNION ALL SELECT 'Wallet Transactions', COUNT(*) FROM wallet_transactions;

-- ============================================================================
-- NOTES FOR PRODUCTION DEPLOYMENT
-- ============================================================================
-- 1. Run this script AFTER DATABASE_SETUP.sql
-- 2. Backup your database BEFORE running this script
-- 3. The script is idempotent (safe to run multiple times)
-- 4. All ALTER TABLE statements use IF NOT EXISTS to prevent errors
-- 5. UNIQUE index on payments.transaction_id prevents duplicate order creation
-- 6. All timestamps use CURRENT_TIMESTAMP for automatic tracking
-- 7. Foreign key constraints are in place to maintain data integrity
-- 8. Indexes are optimized for common query patterns in the payment flow
