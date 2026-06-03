# SwapSphere Payment Flow - Testing Guide

## Prerequisites

- Running backend server (Render or local)
- Running frontend (Vercel or local)
- Access to database (Railway or local)
- PayFast sandbox account (for sandbox testing)
- JWT authentication token (for protected endpoints)

## Test Scenarios

### Scenario 1: Complete Payment Flow (ITN Path)

**Goal:** Verify complete payment processing via PayFast ITN callback

**Steps:**

1. **Initiate Payment**
   ```bash
   curl -X POST http://localhost:5000/api/payfast/pay \
     -H "Content-Type: application/json" \
     -d '{
       "amount": 5000,
       "item_name": "iPhone 14 256GB",
       "listing_id": 1,
       "user_id": 2
     }'
   ```

   **Expected Output:**
   ```
   📋 [/pay] Payment initiation requested: { amount: 5000, item_name: 'iPhone 14 256GB', listing_id: 1, user_id: 2 }
   🔗 [/pay] URLs configured: { clientUrl: 'https://...', serverUrl: 'https://...', notify_url: 'https://.../api/payfast/notify' }
   ✅ [/pay] Payment data prepared, m_payment_id: 1717356789123
   ```

   **Expected Response:**
   ```json
   {
     "success": true,
     "url": "https://sandbox.payfast.co.za/eng/process",
     "data": {
       "merchant_id": "10000100",
       "merchant_key": "46f1db3175jsd94582",
       "return_url": "https://swap-sphere-six.vercel.app/payment-success?...",
       "cancel_url": "https://swap-sphere-six.vercel.app/payment-cancelled",
       "notify_url": "https://your-backend.render.com/api/payfast/notify",
       "m_payment_id": "1717356789123",
       "amount": "50.00",
       "custom_int1": 2,
       "custom_int2": 1
     }
   }
   ```

2. **Simulate PayFast ITN Callback**
   ```bash
   curl -X POST http://localhost:5000/api/payfast/notify \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d 'payer_id=12345&m_payment_id=1717356789123&amount_gross=50.00&payment_status=COMPLETE&custom_int1=2&custom_int2=1&name_first=Test&email_address=test@example.com'
   ```

   **Expected Logs:**
   ```
   🔔 [/notify] PayFast ITN Received: { payer_id: '12345', m_payment_id: '1717356789123', amount_gross: '50.00', payment_status: 'COMPLETE' }
   📦 [processPaymentSuccess] Started (source: ITN): { buyerId: 2, listingId: 1, amount: 50, paymentId: '1717356789123' }
   ✅ [processPaymentSuccess] Transaction started
   📌 [processPaymentSuccess] Listing found: { listingId: 1, title: 'iPhone 14 256GB', sellerId: 3, currentStatus: 'available' }
   💰 [processPaymentSuccess] Updating seller wallet: { sellerId: 3, amount: 50 }
   ✅ [processPaymentSuccess] Wallet updated for seller: 3
   ✅ [processPaymentSuccess] Order created: { orderId: 5, buyerId: 2, sellerId: 3, amount: 50 }
   ✅ [processPaymentSuccess] Payment record created: { paymentId: 10, transactionId: '1717356789123', amount: 50 }
   ✅ [processPaymentSuccess] Wallet transaction created: { txId: 8, userId: 3, amount: 50 }
   ✅ [processPaymentSuccess] Listing marked as sold: { listingId: 1 }
   ✅ [processPaymentSuccess] Transaction committed successfully: { buyerId: 2, sellerId: 3, listingId: 1, orderId: 5, amount: 50 }
   ✅ [/notify] Payment processed successfully from ITN
   ```

3. **Verify Database Updates**
   ```sql
   -- Check order was created
   SELECT * FROM orders WHERE id = 5;
   -- Result: buyer_id=2, seller_id=3, amount=50, status='completed'

   -- Check payment was recorded
   SELECT * FROM payments WHERE order_id = 5;
   -- Result: status='completed', transaction_id='1717356789123'

   -- Check wallet was updated
   SELECT wallet_balance FROM users WHERE id = 3;
   -- Result: wallet_balance increased by 50

   -- Check wallet transaction was recorded
   SELECT * FROM wallet_transactions WHERE related_order_id = 5;
   -- Result: type='credit', amount=50, status='completed'

   -- Check listing status was updated
   SELECT status FROM listings WHERE id = 1;
   -- Result: status='sold'
   ```

4. **Verify Frontend Pages Show Updates**
   - User 2 (buyer): Navigate to "My Purchases" → Should see iPhone 14
   - User 3 (seller): Navigate to "My Sales" → Should see iPhone 14 as sold
   - User 3 (seller): Check Wallet → Balance should increase by R50.00

### Scenario 2: Fallback Payment Confirmation (Fallback Path)

**Goal:** Verify fallback endpoint when PayFast ITN is unavailable

**Steps:**

1. **Initiate Payment** (Same as Scenario 1, but skip ITN callback)
   ```bash
   curl -X POST http://localhost:5000/api/payfast/pay \
     -H "Content-Type: application/json" \
     -d '{"amount": 3000, "item_name": "iPad", "listing_id": 2, "user_id": 2}'
   ```

2. **User is redirected to PaymentSuccess page**
   - Frontend extracts query parameters: listing_id=2, buyer_id=2, amount=30.00
   - Frontend calls fallback endpoint:

   ```bash
   curl -X POST http://localhost:5000/api/payfast/confirm-payment \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -d '{
       "listing_id": 2,
       "buyer_id": 2,
       "amount": 30.00
     }'
   ```

   **Expected Logs:**
   ```
   💳 [/confirm-payment] Fallback payment confirmation requested: { listing_id: 2, buyer_id: 2, amount: 30.00, requestingUserId: 2 }
   📦 [processPaymentSuccess] Started (source: FALLBACK): { buyerId: 2, listingId: 2, amount: 30, paymentId: 'fallback-1717356789999' }
   ✅ [processPaymentSuccess] Transaction started
   📌 [processPaymentSuccess] Listing found: { listingId: 2, title: 'iPad', sellerId: 4, currentStatus: 'available' }
   💰 [processPaymentSuccess] Updating seller wallet: { sellerId: 4, amount: 30 }
   ✅ [processPaymentSuccess] Wallet updated for seller: 4
   ✅ [processPaymentSuccess] Order created: { orderId: 6, buyerId: 2, sellerId: 4, amount: 30 }
   ✅ [processPaymentSuccess] Payment record created: { paymentId: 11, transactionId: 'fallback-1717356789999', amount: 30 }
   ✅ [processPaymentSuccess] Wallet transaction created: { txId: 9, userId: 4, amount: 30 }
   ✅ [processPaymentSuccess] Listing marked as sold: { listingId: 2 }
   ✅ [processPaymentSuccess] Transaction committed successfully: { buyerId: 2, sellerId: 4, listingId: 2, orderId: 6, amount: 30 }
   ✅ [/confirm-payment] Payment confirmed successfully via fallback
   ```

   **Expected Response:**
   ```json
   {
     "success": true,
     "message": "Payment confirmed successfully",
     "amount": 30.00,
     "listing_id": 2
   }
   ```

### Scenario 3: Duplicate Payment Prevention

**Goal:** Verify that duplicate payments are not processed

**Steps:**

1. **First Payment** (Same as Scenario 1)
   - Process successful payment for listing 1

2. **Attempt Duplicate ITN**
   ```bash
   curl -X POST http://localhost:5000/api/payfast/notify \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d 'payer_id=12345&m_payment_id=1717356789123&amount_gross=50.00&payment_status=COMPLETE&custom_int1=2&custom_int2=1&name_first=Test&email_address=test@example.com'
   ```

   **Expected Logs:**
   ```
   🔔 [/notify] PayFast ITN Received: { payer_id: '12345', m_payment_id: '1717356789123', ... }
   📦 [processPaymentSuccess] Started (source: ITN): { buyerId: 2, listingId: 1, amount: 50, paymentId: '1717356789123' }
   ⚠️ [processPaymentSuccess] Payment already processed: { paymentId: '1717356789123', existingPaymentId: 10 }
   ⚠️ [/notify] Payment already processed or skipped
   ```

   **Database result:**
   ```sql
   -- Only one payment and one order should exist for listing 1
   SELECT COUNT(*) FROM payments WHERE transaction_id = '1717356789123';
   -- Result: 1

   SELECT COUNT(*) FROM orders WHERE listing_id = 1 AND status = 'completed';
   -- Result: 1
   ```

3. **Attempt Duplicate Fallback**
   ```bash
   curl -X POST http://localhost:5000/api/payfast/confirm-payment \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -d '{"listing_id": 1, "buyer_id": 2, "amount": 50.00}'
   ```

   **Expected Logs:**
   ```
   💳 [/confirm-payment] Fallback payment confirmation requested: { listing_id: 1, buyer_id: 2, ... }
   ⚠️ [/confirm-payment] Order already exists for listing: { listing_id: 1, orderId: 5 }
   ```

   **Expected Response:**
   ```json
   {
     "success": true,
     "message": "Order already processed",
     "orderId": 5,
     "alreadyProcessed": true
   }
   ```

### Scenario 4: Wallet Endpoints

**Goal:** Verify wallet information is correctly displayed

**Steps:**

1. **Get Wallet Info**
   ```bash
   curl http://localhost:5000/api/wallet/3
   ```

   **Expected Logs:**
   ```
   💰 [GET /wallet/:userId] Wallet info requested: { userId: '3' }
   ✅ [GET /wallet/:userId] Wallet info retrieved: { walletBalance: 50, totalSales: 50, soldListingsCount: 1, activeListingsCount: 2, userName: 'John Seller' }
   ```

   **Expected Response:**
   ```json
   {
     "walletBalance": 50.00,
     "totalSales": 50.00,
     "soldListingsCount": 1,
     "activeListingsCount": 2,
     "userName": "John Seller"
   }
   ```

2. **Get Withdrawal History**
   ```bash
   curl "http://localhost:5000/api/orders/transactions/3"
   ```

   **Expected Response:**
   ```json
   {
     "transactions": [
       {
         "id": 8,
         "user_id": 3,
         "type": "credit",
         "amount": 50.00,
         "description": "Sale of \"iPhone 14 256GB\" through PayFast",
         "related_order_id": 5,
         "status": "completed",
         "created_at": "2024-06-02T10:30:45.000Z"
       }
     ],
     "total": 1,
     "limit": 20,
     "offset": 0
   }
   ```

### Scenario 5: Orders Endpoints

**Goal:** Verify buy/sell pages show correct orders

**Steps:**

1. **Get Purchases (Buyer View)**
   ```bash
   curl http://localhost:5000/api/orders/bought/2
   ```

   **Expected Logs:**
   ```
   📦 [GET /orders/bought/:userId] Fetching purchased orders: { userId: '2' }
   ✅ [GET /orders/bought/:userId] Retrieved 2 orders
   ```

   **Expected Response:**
   ```json
   [
     {
       "orderId": 6,
       "listing_id": 2,
       "seller_id": 4,
       "amount": 30.00,
       "status": "completed",
       "created_at": "2024-06-02T10:35:00.000Z",
       "title": "iPad",
       "description": "iPad 10th Gen",
       "price": 3000,
       "image_url": "...",
       "sellerName": "Jane Seller",
       "sellerEmail": "jane@example.com"
     },
     {
       "orderId": 5,
       "listing_id": 1,
       "seller_id": 3,
       "amount": 50.00,
       "status": "completed",
       "created_at": "2024-06-02T10:30:45.000Z",
       "title": "iPhone 14 256GB",
       "description": "iPhone 14 256GB Black",
       "price": 5000,
       "image_url": "...",
       "sellerName": "John Seller",
       "sellerEmail": "john@example.com"
     }
   ]
   ```

2. **Get Sales (Seller View)**
   ```bash
   curl http://localhost:5000/api/orders/sold/3
   ```

   **Expected Logs:**
   ```
   📊 [GET /orders/sold/:userId] Fetching sold orders: { userId: '3' }
   ✅ [GET /orders/sold/:userId] Retrieved 1 orders
   ```

   **Expected Response:**
   ```json
   [
     {
       "orderId": 5,
       "listing_id": 1,
       "buyer_id": 2,
       "amount": 50.00,
       "status": "completed",
       "created_at": "2024-06-02T10:30:45.000Z",
       "title": "iPhone 14 256GB",
       "description": "iPhone 14 256GB Black",
       "price": 5000,
       "image_url": "...",
       "buyerName": "Bob Buyer",
       "buyerEmail": "bob@example.com"
     }
   ]
   ```

### Scenario 6: Authorization & Security

**Goal:** Verify authorization checks are working

**Steps:**

1. **Fallback endpoint without authentication**
   ```bash
   curl -X POST http://localhost:5000/api/payfast/confirm-payment \
     -H "Content-Type: application/json" \
     -d '{"listing_id": 3, "buyer_id": 5, "amount": 25.00}'
   ```

   **Expected Response:** 401 Unauthorized

2. **Fallback endpoint with wrong buyer_id**
   ```bash
   curl -X POST http://localhost:5000/api/payfast/confirm-payment \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer TOKEN_FOR_USER_2" \
     -d '{"listing_id": 3, "buyer_id": 5, "amount": 25.00}'
   ```

   **Expected Response:**
   ```json
   {
     "success": false,
     "message": "Unauthorized: Can only confirm own payment"
   }
   ```

   **Expected Logs:**
   ```
   ❌ [/confirm-payment] User ID mismatch: { buyer_id: 5, requestingUserId: 2 }
   ```

3. **Wallet withdrawal without authentication**
   ```bash
   curl -X POST http://localhost:5000/api/wallet/withdraw/3 \
     -H "Content-Type: application/json" \
     -d '{"amount": 10.00, "description": "Test"}'
   ```

   **Expected Response:** 401 Unauthorized

## Integration Test Checklist

- [ ] Payment initiation creates form with correct fields
- [ ] PayFast redirect URL is correct
- [ ] ITN callback reaches backend (check Render logs)
- [ ] Order is created with correct buyer_id, seller_id, listing_id, amount
- [ ] Seller wallet is updated correctly
- [ ] Wallet transaction is created
- [ ] Listing status changes to "sold"
- [ ] Duplicate payments are prevented
- [ ] Fallback endpoint works when ITN unavailable
- [ ] My Purchases shows completed orders
- [ ] My Sales shows completed orders
- [ ] Wallet page shows updated balance
- [ ] Authorization checks prevent unauthorized access
- [ ] Wallet withdrawals work correctly
- [ ] Transaction history shows all records
- [ ] Logging provides complete audit trail

## Performance Testing

**Test concurrent payments:**
```bash
# Test 10 concurrent payments
for i in {1..10}; do
  curl -X POST http://localhost:5000/api/payfast/pay \
    -H "Content-Type: application/json" \
    -d '{"amount": 5000, "item_name": "Item '$i'", "listing_id": '$i', "user_id": 2}' &
done
```

**Expected behavior:**
- All requests succeed
- No race conditions in database
- Each payment creates unique order
- Wallet balance updates correctly for all sellers

## Monitoring & Alerts

**Set up monitoring for:**
- Failed payment processing (check logs for ❌ errors)
- Duplicate payment attempts (check for ⚠️ warnings)
- ITN callback failures (verify notify_url receives requests)
- Database connection errors
- Transaction rollbacks
- Slow queries (orders with large datasets)

## Cleanup After Testing

```sql
-- Clean up test data (if needed)
DELETE FROM wallet_transactions WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'test%');
DELETE FROM payments WHERE order_id IN (SELECT id FROM orders WHERE buyer_id IN (SELECT id FROM users WHERE email LIKE 'test%'));
DELETE FROM orders WHERE buyer_id IN (SELECT id FROM users WHERE email LIKE 'test%');
UPDATE listings SET status = 'available' WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'test%');
UPDATE users SET wallet_balance = 0 WHERE email LIKE 'test%';
```

## Success Criteria

All tests pass if:
1. ✅ Payment created with correct details
2. ✅ Order created in database
3. ✅ Seller wallet updated
4. ✅ Listing marked as sold
5. ✅ Payment appears in My Purchases
6. ✅ Payment appears in My Sales
7. ✅ No duplicate orders created
8. ✅ Fallback works when ITN unavailable
9. ✅ Authorization checks working
10. ✅ Comprehensive logging present
