# SwapSphere Payment Flow - Production Deployment Checklist

## Pre-Deployment Verification

### 1. Code Review
- [ ] Review all changes in `server/routes/payfast.js`
- [ ] Review all changes in `server/routes/wallet.js`
- [ ] Review all changes in `server/routes/orders.js`
- [ ] Review all changes in `client/src/pages/PaymentSuccess.jsx`
- [ ] Verify no console.log with sensitive data
- [ ] Verify error handling is complete
- [ ] Verify logging format is consistent

### 2. Environment Variables Verification
- [ ] `SERVER_URL` is set to production Render URL (not localhost)
- [ ] `CLIENT_URL` is set to production Vercel URL (not localhost)
- [ ] `PAYFAST_MERCHANT_ID` is production ID (not sandbox)
- [ ] `PAYFAST_MERCHANT_KEY` is production key (not sandbox)
- [ ] `PAYFAST_URL` is production URL (https://www.payfast.co.za/eng/process)
- [ ] All URLs do NOT have trailing slashes
- [ ] Database credentials are correct
- [ ] All environment variables are set on Render and Vercel

### 3. Database Verification
- [ ] Database backup created
- [ ] Migration script tested on staging database first
- [ ] All required columns exist:
  - [ ] `users.wallet_balance`
  - [ ] `listings.status`
  - [ ] `orders.status`, `orders.created_at`
  - [ ] `payments.transaction_id`, `payments.payfast_data`
  - [ ] `wallet_transactions.created_at`
- [ ] All required indexes created:
  - [ ] `payments.transaction_id` (UNIQUE)
  - [ ] `orders.buyer_id`, `orders.seller_id`
  - [ ] `orders.listing_id`, `orders.status`
  - [ ] All other performance indexes
- [ ] No corrupted data in orders/payments/wallet_transactions tables
- [ ] Foreign key relationships verified

### 4. API Endpoints Verification
- [ ] `POST /api/payfast/pay` returns correct form data
- [ ] `POST /api/payfast/notify` is accessible from PayFast servers
- [ ] `POST /api/payfast/confirm-payment` requires authentication
- [ ] `GET /api/wallet/:userId` returns correct balance
- [ ] `GET /api/orders/bought/:userId` returns correct orders
- [ ] `GET /api/orders/sold/:userId` returns correct orders
- [ ] All endpoints have proper error handling

### 5. Frontend Verification
- [ ] PaymentSuccess page loads without errors
- [ ] Query parameters are extracted correctly
- [ ] Fallback endpoint is called automatically
- [ ] Error handling displays properly
- [ ] Confirmation data displays correctly
- [ ] Navigation buttons work correctly
- [ ] No CORS errors in browser console

### 6. Security Verification
- [ ] Authentication required for sensitive endpoints
- [ ] Authorization checks buyer_id in confirm-payment
- [ ] No sensitive data in logs
- [ ] No sensitive data in error responses
- [ ] HTTPS is enforced in production
- [ ] CORS is configured correctly
- [ ] JWT tokens are validated

### 7. Logging Verification
- [ ] All payment steps logged with timestamps
- [ ] Emoji prefix used for quick scanning
- [ ] Error messages are descriptive
- [ ] No duplicate logs for same operation
- [ ] Logs include user IDs, amounts, statuses
- [ ] Render logs can be accessed and monitored

## Deployment Steps

### Phase 1: Database Migration

**Step 1.1: Backup Database**
```bash
# On Railway MySQL
mysqldump -u root -p swapsphere > swapsphere_backup_$(date +%Y%m%d_%H%M%S).sql
```
- [ ] Backup completed successfully
- [ ] Backup file size verified (should be > 1MB for existing DB)
- [ ] Backup stored in secure location

**Step 1.2: Run Migration Script**
```bash
# SSH to Railway or run via Railway dashboard
mysql -u root -p swapsphere < DATABASE_MIGRATION_PAYMENT_FLOW.sql
```
- [ ] Migration script executed without errors
- [ ] All ALTER TABLE statements succeeded
- [ ] All INDEX creation statements succeeded
- [ ] No "already exists" errors (expected with IF NOT EXISTS)

**Step 1.3: Verify Migration**
```sql
-- Run verification queries
SELECT VERSION();
SHOW COLUMNS FROM orders;
SHOW COLUMNS FROM payments;
SHOW COLUMNS FROM wallet_transactions;
SHOW INDEXES FROM payments WHERE Column_name = 'transaction_id';
```
- [ ] All columns verified as correct types
- [ ] UNIQUE index on `payments.transaction_id` confirmed
- [ ] All foreign keys intact
- [ ] No data loss

### Phase 2: Backend Deployment

**Step 2.1: Update Environment Variables on Render**
```bash
# Go to Render dashboard → SwapSphere backend → Environment
# Update:
SERVER_URL=https://swapsphere-api.render.com (or your URL)
CLIENT_URL=https://swap-sphere-six.vercel.app (or your URL)
PAYFAST_MERCHANT_ID=<production_id>
PAYFAST_MERCHANT_KEY=<production_key>
PAYFAST_URL=https://www.payfast.co.za/eng/process
```
- [ ] SERVER_URL updated (no localhost)
- [ ] CLIENT_URL updated (no localhost)
- [ ] PayFast production credentials updated
- [ ] All URLs verified without trailing slashes

**Step 2.2: Push Code to GitHub**
```bash
cd server
git add routes/payfast.js routes/wallet.js routes/orders.js
git commit -m "Production: Payment flow - add logging, fallback, duplicate prevention"
git push origin main
```
- [ ] Files staged correctly
- [ ] Commit message describes changes
- [ ] Push successful

**Step 2.3: Verify Render Deployment**
```bash
# Check Render logs
# Look for deployment success message
# Monitor for errors in first 2 minutes
```
- [ ] Render detected new push
- [ ] Build process completed successfully
- [ ] No build errors in logs
- [ ] Service restarted cleanly
- [ ] Logs show "Server running on port 5000"

### Phase 3: Frontend Deployment

**Step 3.1: Push Code to GitHub**
```bash
cd client
git add src/pages/PaymentSuccess.jsx
git commit -m "Production: Payment flow - add fallback confirmation"
git push origin main
```
- [ ] Files staged correctly
- [ ] Commit message describes changes
- [ ] Push successful

**Step 3.2: Verify Vercel Deployment**
```bash
# Check Vercel dashboard
# Look for deployment success
# Monitor for build errors
```
- [ ] Vercel detected new push
- [ ] Build process completed successfully
- [ ] No build errors
- [ ] Preview deployment working
- [ ] Production deployment working

### Phase 4: Documentation Deployment

**Step 4.1: Push Documentation**
```bash
git add PAYMENT_FLOW_IMPLEMENTATION.md PAYMENT_TESTING_GUIDE.md DATABASE_MIGRATION_PAYMENT_FLOW.sql IMPLEMENTATION_SUMMARY.md
git commit -m "Add comprehensive payment flow documentation"
git push origin main
```
- [ ] All documentation files added
- [ ] Commit successful
- [ ] Documentation accessible in repository

## Post-Deployment Testing

### Test 1: Payment Initiation
```bash
curl -X POST https://your-backend.render.com/api/payfast/pay \
  -H "Content-Type: application/json" \
  -d '{"amount": 5000, "item_name": "Test Item", "listing_id": 1, "user_id": 1}'
```
- [ ] Response includes success flag
- [ ] Response includes PayFast URL
- [ ] Response includes form data with all fields
- [ ] Logs show "Payment data prepared"
- [ ] No errors in response

### Test 2: Fallback Endpoint
```bash
curl -X POST https://your-backend.render.com/api/payfast/confirm-payment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"listing_id": 1, "buyer_id": 1, "amount": 50.00}'
```
- [ ] Response shows success
- [ ] Logs show fallback processing
- [ ] Database records created
- [ ] No 500 errors

### Test 3: Wallet Endpoint
```bash
curl https://your-backend.render.com/api/wallet/1
```
- [ ] Response includes wallet_balance
- [ ] Response includes totalSales
- [ ] Response includes listing counts
- [ ] Logs show endpoint called

### Test 4: Orders Endpoints
```bash
curl https://your-backend.render.com/api/orders/bought/1
curl https://your-backend.render.com/api/orders/sold/1
```
- [ ] Both endpoints return arrays (empty or populated)
- [ ] Logs show endpoints called
- [ ] No errors in response

### Test 5: Complete Payment Flow (if PayFast available)
1. [ ] Frontend payment initiation works
2. [ ] User redirected to PayFast
3. [ ] PayFast payment completed
4. [ ] User redirected back to PaymentSuccess
5. [ ] Frontend calls confirm-payment endpoint
6. [ ] Logs show all steps completed
7. [ ] Database shows order created
8. [ ] Database shows payment recorded
9. [ ] Database shows wallet updated
10. [ ] Database shows listing marked sold

### Test 6: Duplicate Prevention
1. [ ] Process payment once successfully
2. [ ] Attempt to process same payment again
3. [ ] Second attempt returns "already processed"
4. [ ] Only one order exists in database
5. [ ] Only one payment exists in database

### Test 7: Authorization
1. [ ] Call fallback without authentication → 401
2. [ ] Call fallback with wrong buyer_id → 403
3. [ ] Call with correct auth and buyer_id → 200

### Test 8: Frontend Page
1. [ ] Navigate to payment-success page
2. [ ] Page shows loading state initially
3. [ ] Page calls confirm-payment endpoint
4. [ ] Page displays success message
5. [ ] Page shows payment details
6. [ ] Navigation buttons work

## Monitoring Setup

### Render Logs Monitoring
- [ ] Set up log alerts for errors
- [ ] Monitor for ❌ error messages
- [ ] Monitor for ⚠️ warning messages
- [ ] Set up real-time log viewing

**Key phrases to monitor:**
- `❌ [` - Any error condition
- `Payment processing error` - Error in payment processing
- `Database error` - Database connection issues
- `transaction_id already exists` - Duplicate transaction attempt

### Database Monitoring
```sql
-- Set up queries to run periodically
SELECT COUNT(*) as total_payments FROM payments;
SELECT COUNT(*) as total_orders FROM orders;
SELECT COUNT(*) as pending_orders FROM orders WHERE status = 'pending';
SELECT AVG(wallet_balance) as avg_wallet FROM users;
```
- [ ] Run verification queries
- [ ] Document baseline numbers
- [ ] Set up regular monitoring

### Frontend Monitoring
- [ ] Check Vercel analytics
- [ ] Monitor PaymentSuccess page errors
- [ ] Check for CORS errors
- [ ] Monitor API response times

## Rollback Plan

**If issues occur, rollback to previous version:**

### Step 1: Rollback Database
```bash
# Restore from backup
mysql -u root -p swapsphere < swapsphere_backup_YYYYMMDD_HHMMSS.sql
```

### Step 2: Rollback Backend
```bash
git revert HEAD
git push origin main
# Render auto-deploys
```

### Step 3: Rollback Frontend
```bash
# Go to Vercel dashboard
# Select previous deployment
# Click "Promote to Production"
```

## Sign-Off Checklist

### Development Team
- [ ] Code review completed
- [ ] All tests pass
- [ ] Logging verified
- [ ] Documentation complete

### QA Team
- [ ] Integration tests passed
- [ ] Payment flow tested end-to-end
- [ ] Duplicate prevention verified
- [ ] Authorization checks passed
- [ ] Database updates verified

### DevOps Team
- [ ] Database migration executed
- [ ] Environment variables updated
- [ ] Monitoring configured
- [ ] Logs accessible
- [ ] Rollback plan documented

### Business Owner
- [ ] Payment flow meets business requirements
- [ ] All payments recorded correctly
- [ ] Wallet balances accurate
- [ ] Customer communication plan ready
- [ ] Support team trained

## Post-Deployment Activities

### Day 1 (Go-Live)
- [ ] Monitor logs continuously
- [ ] Test with small payment amount
- [ ] Verify wallet updates
- [ ] Check for duplicate orders
- [ ] Monitor database performance
- [ ] Support team on standby

### Day 2-3 (Stability)
- [ ] Monitor error rates
- [ ] Check for any ITN failures
- [ ] Verify fallback endpoint usage
- [ ] Check database consistency
- [ ] Monitor Vercel/Render performance

### Day 4-7 (Normalization)
- [ ] Reduce monitoring frequency to every 1-2 hours
- [ ] Document any issues encountered
- [ ] Collect customer feedback
- [ ] Plan for Phase 2 improvements

### Week 2+ (Optimization)
- [ ] Analyze payment success rate
- [ ] Optimize database indexes if needed
- [ ] Plan for additional features
- [ ] Schedule retrospective meeting

## Success Criteria

✅ **Deployment is successful when:**
1. All endpoints respond without errors
2. Payment initiation works
3. Fallback confirmation works
4. Database records created correctly
5. Wallet balances updated immediately
6. Listings marked as sold immediately
7. No duplicate orders in 24 hours
8. Comprehensive logs available
9. All authorization checks working
10. Team confident in production system

## Deployment Timeline

| Phase | Duration | Owner | Status |
|-------|----------|-------|--------|
| Pre-deployment checks | 1-2 hours | Dev + QA | ⏳ |
| Database migration | 15-30 min | DevOps | ⏳ |
| Backend deployment | 10-20 min | DevOps | ⏳ |
| Frontend deployment | 10-20 min | DevOps | ⏳ |
| Documentation | 5 min | Dev | ⏳ |
| Post-deployment testing | 30-45 min | QA | ⏳ |
| Monitoring setup | 15-30 min | DevOps | ⏳ |
| **TOTAL** | **2-3 hours** | All | ⏳ |

## Emergency Contacts

- **DevOps Lead:** [Name, Phone, Email]
- **Backend Engineer:** [Name, Phone, Email]
- **Frontend Engineer:** [Name, Phone, Email]
- **Database Admin:** [Name, Phone, Email]
- **PayFast Support:** support@payfast.co.za
- **Render Support:** support@render.com
- **Vercel Support:** support@vercel.com

## Final Notes

- ✅ This checklist should be completed in order
- ✅ Each step has explicit verification criteria
- ✅ Rollback procedure documented for safety
- ✅ Team should be trained before deployment
- ✅ Monitoring should be active before go-live
- ✅ Support team should have documentation
- ✅ All critical changes are documented
- ✅ Zero downtime deployment approach
