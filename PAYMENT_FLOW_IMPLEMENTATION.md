# SwapSphere Payment Flow - Production Implementation Guide

## Overview

This document describes the complete payment flow for SwapSphere, including:
- Payment initiation
- PayFast integration
- Fallback payment confirmation
- Order creation
- Wallet updates
- Listing status management

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (Vercel)                              │
│  User pays → Redirected to PayFast → Returns to /payment-success       │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
                ▼                         ▼
        ┌──────────────────┐    ┌─────────────────────┐
        │  PayFast ITN     │    │ /confirm-payment    │
        │  (if available)  │    │ (fallback, always)  │
        └────────┬─────────┘    └──────────┬──────────┘
                 │                         │
                 └────────────┬────────────┘
                              │
                              ▼
        ┌──────────────────────────────────────┐
        │  BACKEND (Render)                    │
        │  POST /api/payfast/notify            │
        │  POST /api/payfast/confirm-payment   │
        └────────────┬─────────────────────────┘
                     │
                     ▼
        ┌──────────────────────────────────────┐
        │  processPaymentSuccess()             │
        │  - Create order                      │
        │  - Create payment record             │
        │  - Update seller wallet              │
        │  - Create wallet transaction         │
        │  - Mark listing as sold              │
        └────────────┬─────────────────────────┘
                     │
                     ▼
        ┌──────────────────────────────────────┐
        │  DATABASE (Railway MySQL)            │
        │  Update users.wallet_balance         │
        │  Insert orders record                │
        │  Insert payments record              │
        │  Insert wallet_transactions record   │
        │  Update listings.status = 'sold'     │
        └──────────────────────────────────────┘
```

## Payment Flow Steps

### 1. Payment Initiation (`POST /api/payfast/pay`)

**Frontend calls:**
```javascript
POST /api/payfast/pay
{
  "amount": 5000,              // Amount in cents (R50.00)
  "item_name": "iPhone 14",
  "listing_id": 123,
  "user_id": 456              // Buyer ID
}
```

**Backend:**
- Validates input
- Logs payment initiation with timestamp
- Generates unique `m_payment_id` (timestamp-based)
- Constructs PayFast form data with return_url including query parameters
- Returns form submission data to frontend

**notify_url includes:**
- `${process.env.SERVER_URL}/api/payfast/notify` - For ITN callback
- **CRITICAL:** Uses `process.env.SERVER_URL`, NOT localhost

**return_url includes:**
- `${process.env.CLIENT_URL}/payment-success?listing_id=${listing_id}&buyer_id=${user_id}&amount=${amount}`
- Passes payment details as query parameters for fallback confirmation

### 2. Frontend Redirects to PayFast

**Frontend:**
- Creates hidden form with payment data
- Submits to PayFast
- User completes payment at PayFast

### 3. PayFast Processes Payment

**Two outcomes:**

#### A. ITN Callback (Ideal Path)
PayFast sends `POST /api/payfast/notify` with payment details

#### B. User Redirect (Fallback Path)
PayFast redirects user to `/payment-success?listing_id=...&buyer_id=...&amount=...`

### 4. Backend Processing

**Either path calls `processPaymentSuccess()` with these steps:**

#### Step 1: Duplicate Prevention
```sql
-- Check if payment already processed
SELECT id FROM payments WHERE transaction_id = ? AND status = 'completed'
-- Check if order already exists
SELECT id FROM orders WHERE listing_id = ? AND status = 'completed'
-- Check if listing already sold
SELECT status FROM listings WHERE id = ?
```

If any exist, skip processing and return success (already completed).

#### Step 2: Get Listing & Seller Info
```sql
SELECT id, user_id, title, price, status FROM listings WHERE id = ?
```

#### Step 3: Update Seller Wallet
```sql
UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?
```

#### Step 4: Create Order Record
```sql
INSERT INTO orders (listing_id, buyer_id, seller_id, amount, status)
VALUES (?, ?, ?, ?, 'completed')
```

#### Step 5: Create Payment Record
```sql
INSERT INTO payments (order_id, payment_method, transaction_id, amount, status, payfast_data)
VALUES (?, 'payfast', ?, ?, 'completed', JSON)
```

The unique constraint on `transaction_id` prevents duplicates.

#### Step 6: Create Wallet Transaction
```sql
INSERT INTO wallet_transactions (user_id, type, amount, description, related_order_id, status)
VALUES (?, 'credit', ?, ?, ?, 'completed')
```

#### Step 7: Mark Listing as Sold
```sql
UPDATE listings SET status = 'sold' WHERE id = ?
```

#### Step 8: Commit Transaction
All changes committed atomically. If any step fails, entire transaction rolls back.

### 5. Frontend Fallback Confirmation

**Frontend (PaymentSuccess.jsx):**

```javascript
// Extract from URL query parameters
const listing_id = searchParams.get('listing_id');
const buyer_id = searchParams.get('buyer_id');
const amount = searchParams.get('amount');

// Call fallback endpoint
POST /api/payfast/confirm-payment
{
  "listing_id": 123,
  "buyer_id": 456,
  "amount": 50.00
}
```

**Backend validation:**
- Verify `buyer_id` matches authenticated user
- Check if order already exists (skip if so)
- Call `processPaymentSuccess()` with source="FALLBACK"

### 6. Frontend Updates

**After payment:**

```javascript
// User navigates to Dashboard
// Dashboard automatically calls:
GET /api/wallet/:userId       // Shows updated wallet balance
GET /api/orders/bought/:userId // Shows purchase in My Purchases
GET /api/orders/sold/:userId    // Shows item in My Sales (if seller)
```

All pages fetch fresh data on mount, so they automatically reflect the new payment.

## Logging Output

### Successful Payment Flow

```
📋 [/pay] Payment initiation requested: { amount, item_name, listing_id, user_id }
🔗 [/pay] URLs configured: { clientUrl, serverUrl, notify_url }
✅ [/pay] Payment data prepared, m_payment_id: 1717356789123

[User completes payment on PayFast]

🔔 [/notify] PayFast ITN Received: { payer_id, m_payment_id, amount_gross }
📦 [processPaymentSuccess] Started (source: ITN): { buyerId, listingId, amount, paymentId }
📌 [processPaymentSuccess] Listing found: { listingId, title, sellerId, currentStatus }
💰 [processPaymentSuccess] Updating seller wallet: { sellerId, amount }
✅ [processPaymentSuccess] Wallet updated for seller: sellerId
✅ [processPaymentSuccess] Order created: { orderId, buyerId, sellerId, amount }
✅ [processPaymentSuccess] Payment record created: { paymentId, transactionId, amount }
✅ [processPaymentSuccess] Wallet transaction created: { txId, userId, amount }
✅ [processPaymentSuccess] Listing marked as sold: { listingId }
✅ [processPaymentSuccess] Transaction committed successfully: { buyerId, sellerId, listingId, orderId, amount }
✅ [/notify] Payment processed successfully from ITN

[If ITN unavailable:]

💳 [/confirm-payment] Fallback payment confirmation requested: { listing_id, buyer_id, amount }
✅ [/confirm-payment] Payment confirmed successfully via fallback
```

## Database Schema Verification

### Required Columns

**users:**
- `id` (INT PRIMARY KEY)
- `wallet_balance` (DECIMAL(10,2) DEFAULT 0.00)

**listings:**
- `id` (INT PRIMARY KEY)
- `user_id` (INT FOREIGN KEY)
- `title` (VARCHAR)
- `status` (ENUM: 'available', 'sold', 'removed')

**orders:**
- `id` (INT PRIMARY KEY AUTO_INCREMENT)
- `listing_id` (INT FOREIGN KEY)
- `buyer_id` (INT FOREIGN KEY)
- `seller_id` (INT FOREIGN KEY)
- `amount` (DECIMAL(10,2))
- `status` (ENUM: 'pending', 'completed', 'cancelled')
- `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

**payments:**
- `id` (INT PRIMARY KEY AUTO_INCREMENT)
- `order_id` (INT FOREIGN KEY)
- `payment_method` (VARCHAR DEFAULT 'payfast')
- `transaction_id` (VARCHAR(255) UNIQUE)
- `amount` (DECIMAL(10,2))
- `status` (ENUM: 'pending', 'completed', 'failed', 'refunded')
- `payfast_data` (JSON)
- `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

**wallet_transactions:**
- `id` (INT PRIMARY KEY AUTO_INCREMENT)
- `user_id` (INT FOREIGN KEY)
- `type` (ENUM: 'credit', 'debit', 'withdrawal')
- `amount` (DECIMAL(10,2))
- `description` (VARCHAR)
- `related_order_id` (INT FOREIGN KEY - nullable)
- `status` (ENUM: 'pending', 'completed', 'cancelled')
- `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

### Critical Indexes

- `payments.transaction_id` - UNIQUE (prevents duplicate payments)
- `orders.listing_id` - INDEX (for quick duplicate checks)
- `orders.buyer_id` - INDEX (for My Purchases)
- `orders.seller_id` - INDEX (for My Sales)
- `listings.status` - INDEX (for filtering sold listings)
- `users.id, wallet_balance` - COMPOSITE INDEX (wallet queries)

## Environment Variables Required

**Backend (.env file):**
```
# PayFast
PAYFAST_MERCHANT_ID=10000100
PAYFAST_MERCHANT_KEY=46f1db3175jsd94582
PAYFAST_URL=https://sandbox.payfast.co.za/eng/process

# URLs (MUST use production URLs in production)
SERVER_URL=https://your-backend.render.com
CLIENT_URL=https://your-frontend.vercel.app

# Database
DB_HOST=your-db.railway.app
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=swapsphere
DB_PORT=3306

# Server
PORT=5000
NODE_ENV=production
```

**Critical Notes:**
- `SERVER_URL` must be the FULL backend URL (no localhost)
- `CLIENT_URL` must be the FULL frontend URL
- `PAYFAST_URL` should use sandbox for testing, production for live
- All URLs should not have trailing slashes

## Testing Checklist

### 1. Test Payment Initiation
```bash
curl -X POST http://localhost:5000/api/payfast/pay \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 5000,
    "item_name": "Test Item",
    "listing_id": 1,
    "user_id": 1
  }'
```

Expected response:
```json
{
  "success": true,
  "url": "https://sandbox.payfast.co.za/eng/process",
  "data": { /* PayFast form data */ }
}
```

### 2. Test Fallback Endpoint (Authenticated)
```bash
curl -X POST http://localhost:5000/api/payfast/confirm-payment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "listing_id": 1,
    "buyer_id": 1,
    "amount": 50.00
  }'
```

### 3. Test Wallet Endpoint
```bash
curl http://localhost:5000/api/wallet/1
```

### 4. Test Orders Endpoints
```bash
# My Purchases
curl http://localhost:5000/api/orders/bought/1

# My Sales
curl http://localhost:5000/api/orders/sold/1
```

### 5. Check Logs
- Monitor Render logs for ITN processing
- Check for duplicate prevention in action
- Verify all database updates occurring

## Troubleshooting

### Problem: Orders not being created
**Solution:**
- Check `/api/payfast/notify` is not being called (check Render logs)
- Verify PayFast notify_url is correct (should use `SERVER_URL`)
- Fall back to `/api/payfast/confirm-payment` endpoint
- Check logs for specific error messages

### Problem: Wallet balance not updating
**Solution:**
- Verify `processPaymentSuccess()` is being called
- Check database connection is working
- Verify order was created (check orders table)
- Check wallet_transactions table for error details

### Problem: Listing remains "available"
**Solution:**
- Verify order was marked as "completed" (not "pending")
- Check listing_id is correct
- Verify UPDATE query is executing

### Problem: Duplicate orders created
**Solution:**
- Check `transaction_id` UNIQUE index exists on payments table
- Verify duplicate prevention logic is working
- Check logs for "Payment already processed" messages

### Problem: Frontend stuck on loading
**Solution:**
- Check frontend console for errors
- Verify authentication token is valid for `/confirm-payment`
- Check CORS settings in backend
- Verify API endpoints are accessible

## Production Deployment Steps

1. **Run SQL migration:**
   ```bash
   mysql -u root -p swapsphere < DATABASE_MIGRATION_PAYMENT_FLOW.sql
   ```

2. **Update environment variables on Render and Vercel**
   - Ensure `SERVER_URL` and `CLIENT_URL` are production URLs
   - Update to production PayFast credentials

3. **Deploy backend:**
   ```bash
   git push origin main
   # Render auto-deploys
   ```

4. **Deploy frontend:**
   ```bash
   git push origin main
   # Vercel auto-deploys
   ```

5. **Verify in production:**
   - Check Render logs for proper logging
   - Test payment flow with test PayFast account
   - Verify wallet updates immediately after payment
   - Verify orders appear in My Purchases and My Sales

6. **Monitor:**
   - Set up Render log alerts
   - Monitor database performance
   - Track duplicate prevention triggers
   - Monitor wallet balance accuracy

## Key Production Changes

1. **Comprehensive logging** throughout payment flow
2. **Duplicate prevention** at multiple levels
3. **Fallback endpoint** for when ITN unavailable
4. **Frontend integration** with fallback confirmation
5. **UNIQUE index** on payment transaction_id
6. **Database transaction** for atomic operations
7. **Error handling** and logging at each step
8. **Authentication** on fallback endpoint

## Support & Debugging

**Enable verbose logging:**
- Check all `console.log()` statements in payfast.js
- Monitor Render logs in real-time during testing
- Check database with:
  ```sql
  SELECT * FROM orders ORDER BY created_at DESC LIMIT 5;
  SELECT * FROM payments ORDER BY created_at DESC LIMIT 5;
  SELECT * FROM wallet_transactions ORDER BY created_at DESC LIMIT 5;
  SELECT wallet_balance FROM users WHERE id = 1;
  SELECT status FROM listings WHERE id = 1;
  ```

**Contact Support:**
- PayFast sandbox: sandbox@payfast.co.za
- Check PayFast API documentation for ITN configuration
- Review Render deployment logs for backend issues
- Check Vercel deployment logs for frontend issues
