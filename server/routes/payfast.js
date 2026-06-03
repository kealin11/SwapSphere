const router = require("express").Router();
const db = require("../config/db");
const authenticate = require("../middleware/auth");

/**
 * POST /api/payfast/pay
 * Initiates a PayFast payment and returns the payment form data
 * Frontend uses this to redirect user to PayFast
 */
router.post("/pay", async (req, res) => {
  try {
    const { amount, item_name, listing_id, user_id } = req.body;

    console.log("📋 [/pay] Payment initiation requested:", {
      amount,
      item_name,
      listing_id,
      user_id,
      timestamp: new Date().toISOString(),
    });

    if (!amount || !item_name) {
      console.warn("❌ [/pay] Missing required fields: amount or item_name");
      return res.status(400).json({
        message: "Amount and item name are required",
      });
    }

    if (!listing_id || !user_id) {
      console.warn("❌ [/pay] Missing listing_id or user_id");
      return res.status(400).json({
        message: "Listing ID and user ID are required",
      });
    }

    const merchant_id = process.env.PAYFAST_MERCHANT_ID?.trim();
    const merchant_key = process.env.PAYFAST_MERCHANT_KEY?.trim();

    if (!merchant_id || !merchant_key) {
      console.error("❌ [/pay] PayFast credentials not configured");
      return res.status(500).json({
        message: "PayFast is not configured. Add PAYFAST_MERCHANT_ID and PAYFAST_MERCHANT_KEY to server/.env, then restart the server.",
      });
    }

    const amountInRand = (Number(amount) / 100).toFixed(2);

    const clientUrl = process.env.CLIENT_URL?.replace(/\/$/, "") || "http://localhost:5173";
    const serverUrl = process.env.SERVER_URL?.replace(/\/$/, "") || "http://localhost:5000";

    console.log("🔗 [/pay] URLs configured:", {
      clientUrl,
      serverUrl,
      notify_url: `${serverUrl}/api/payfast/notify`,
    });

    const paymentData = {
      merchant_id,
      merchant_key,

      return_url: `${clientUrl}/payment-success?listing_id=${listing_id}&buyer_id=${user_id}&amount=${amountInRand}`,
      cancel_url: `${clientUrl}/payment-cancelled`,
      notify_url: `${serverUrl}/api/payfast/notify`,

      name_first: "SwapSphere",
      email_address: "buyer@test.com",

      m_payment_id: Date.now().toString(),

      amount: amountInRand,
      item_name,

      custom_int1: user_id || 0,
      custom_int2: listing_id || 0,
    };

    console.log("✅ [/pay] Payment data prepared, m_payment_id:", paymentData.m_payment_id);

    res.json({
      success: true,
      url: process.env.PAYFAST_URL || "https://sandbox.payfast.co.za/eng/process",
      data: paymentData,
    });
  } catch (error) {
    console.error("❌ [/pay] Error:", error);
    res.status(500).json({
      message: "Payment failed",
      error: error.message,
    });
  }
});

// Utility function to update seller wallet and create order/payment records
const processPaymentSuccess = async (data, source = "ITN") => {
  return new Promise((resolve, reject) => {
    const {
      custom_int1: buyerId,
      custom_int2: listingId,
      amount,
      m_payment_id: paymentId,
    } = data;

    console.log(`📦 [processPaymentSuccess] Started (source: ${source}):`, {
      buyerId,
      listingId,
      amount,
      paymentId,
      timestamp: new Date().toISOString(),
    });

    // Validate required data
    if (!buyerId || !listingId || !amount) {
      console.error("❌ [processPaymentSuccess] Missing required payment data:", {
        buyerId: !!buyerId,
        listingId: !!listingId,
        amount: !!amount,
      });
      return reject(new Error("Missing required payment data"));
    }

    // Check if payment already processed (prevent duplicates)
    db.query(
      "SELECT id FROM payments WHERE transaction_id = ? AND status = ?",
      [paymentId, "completed"],
      (err, existingPayments) => {
        if (err) {
          console.error("❌ [processPaymentSuccess] Error checking existing payments:", err);
          return reject(err);
        }

        if (existingPayments && existingPayments.length > 0) {
          console.warn("⚠️ [processPaymentSuccess] Payment already processed:", {
            paymentId,
            existingPaymentId: existingPayments[0].id,
          });
          return resolve(false);
        }

        // Start transaction
        db.beginTransaction((err) => {
          if (err) {
            console.error("❌ [processPaymentSuccess] Error starting transaction:", err);
            return reject(err);
          }

          console.log("✅ [processPaymentSuccess] Transaction started");

          // Step 1: Get listing and seller info
          db.query("SELECT id, user_id, title, price, status FROM listings WHERE id = ?", [listingId], (err, listings) => {
            if (err) {
              console.error("❌ [processPaymentSuccess] Error fetching listing:", err);
              return db.rollback(() => reject(err));
            }

            if (!listings || listings.length === 0) {
              console.error("❌ [processPaymentSuccess] Listing not found:", { listingId });
              return db.rollback(() => reject(new Error("Listing not found")));
            }

            const listing = listings[0];
            const sellerId = listing.user_id;

            console.log("📌 [processPaymentSuccess] Listing found:", {
              listingId: listing.id,
              title: listing.title,
              sellerId,
              currentStatus: listing.status,
            });

            // Prevent duplicate processing - check if listing already sold
            if (listing.status === "sold") {
              console.warn("⚠️ [processPaymentSuccess] Listing already marked as sold, skipping");
              return db.rollback(() => resolve(false));
            }

            // Check if completed order already exists for this listing
            db.query(
              "SELECT id FROM orders WHERE listing_id = ? AND status = ?",
              [listingId, "completed"],
              (err, existingOrders) => {
                if (err) {
                  console.error("❌ [processPaymentSuccess] Error checking existing orders:", err);
                  return db.rollback(() => reject(err));
                }

                if (existingOrders && existingOrders.length > 0) {
                  console.warn("⚠️ [processPaymentSuccess] Completed order already exists for listing:", {
                    listingId,
                    orderId: existingOrders[0].id,
                  });
                  return db.rollback(() => resolve(false));
                }

                // Step 2: Update seller wallet balance
                const sellerAmount = parseFloat(amount);

                console.log("💰 [processPaymentSuccess] Updating seller wallet:", {
                  sellerId,
                  amount: sellerAmount,
                });

                db.query(
                  "UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?",
                  [sellerAmount, sellerId],
                  (err) => {
                    if (err) {
                      console.error("❌ [processPaymentSuccess] Error updating wallet:", err);
                      return db.rollback(() => reject(err));
                    }

                    console.log("✅ [processPaymentSuccess] Wallet updated for seller:", sellerId);

                    // Step 3: Create order record
                    db.query(
                      "INSERT INTO orders (listing_id, buyer_id, seller_id, amount, status) VALUES (?, ?, ?, ?, ?)",
                      [listingId, buyerId, sellerId, sellerAmount, "completed"],
                      (err, orderResult) => {
                        if (err) {
                          console.error("❌ [processPaymentSuccess] Error creating order:", err);
                          return db.rollback(() => reject(err));
                        }

                        const orderId = orderResult.insertId;

                        console.log("✅ [processPaymentSuccess] Order created:", {
                          orderId,
                          buyerId,
                          sellerId,
                          amount: sellerAmount,
                        });

                        // Step 4: Create payment record
                        db.query(
                          "INSERT INTO payments (order_id, payment_method, transaction_id, amount, status, payfast_data) VALUES (?, ?, ?, ?, ?, ?)",
                          [orderId, "payfast", paymentId, sellerAmount, "completed", JSON.stringify(data)],
                          (err, paymentResult) => {
                            if (err) {
                              console.error("❌ [processPaymentSuccess] Error creating payment record:", err);
                              return db.rollback(() => reject(err));
                            }

                            console.log("✅ [processPaymentSuccess] Payment record created:", {
                              paymentId: paymentResult.insertId,
                              transactionId: paymentId,
                              amount: sellerAmount,
                            });

                            // Step 5: Create wallet transaction record
                            db.query(
                              "INSERT INTO wallet_transactions (user_id, type, amount, description, related_order_id, status) VALUES (?, ?, ?, ?, ?, ?)",
                              [sellerId, "credit", sellerAmount, `Sale of "${listing.title}" through PayFast`, orderId, "completed"],
                              (err, txResult) => {
                                if (err) {
                                  console.error("❌ [processPaymentSuccess] Error creating wallet transaction:", err);
                                  return db.rollback(() => reject(err));
                                }

                                console.log("✅ [processPaymentSuccess] Wallet transaction created:", {
                                  txId: txResult.insertId,
                                  userId: sellerId,
                                  amount: sellerAmount,
                                });

                                // Step 6: Update listing status to sold
                                db.query(
                                  "UPDATE listings SET status = ? WHERE id = ?",
                                  ["sold", listingId],
                                  (err) => {
                                    if (err) {
                                      console.error("❌ [processPaymentSuccess] Error updating listing status:", err);
                                      return db.rollback(() => reject(err));
                                    }

                                    console.log("✅ [processPaymentSuccess] Listing marked as sold:", { listingId });

                                    // Commit transaction
                                    db.commit((err) => {
                                      if (err) {
                                        console.error("❌ [processPaymentSuccess] Error committing transaction:", err);
                                        return db.rollback(() => reject(err));
                                      }

                                      console.log("✅ [processPaymentSuccess] Transaction committed successfully:", {
                                        buyerId,
                                        sellerId,
                                        listingId,
                                        orderId,
                                        amount: sellerAmount,
                                      });

                                      resolve(true);
                                    });
                                  }
                                );
                              }
                            );
                          }
                        );
                      }
                    );
                  }
                );
              }
            );
          });
        });
      }
    );
  });
};

/**
 * POST /api/payfast/notify
 * PayFast Instant Transaction Notification (ITN) callback
 * Called by PayFast after payment is processed (server-to-server)
 */
router.post("/notify", async (req, res) => {
  try {
    console.log("\n🔔 [/notify] PayFast ITN Received:", {
      timestamp: new Date().toISOString(),
      payer_id: req.body.payer_id,
      m_payment_id: req.body.m_payment_id,
      amount_gross: req.body.amount_gross,
      payment_status: req.body.payment_status,
    });

    // Validate payment status
    if (req.body.payment_status !== "COMPLETE") {
      console.warn("⚠️ [/notify] Payment not complete, status:", req.body.payment_status);
      return res.status(200).send("OK");
    }

    // Process the payment
    const success = await processPaymentSuccess(req.body, "ITN");

    if (success) {
      console.log("✅ [/notify] Payment processed successfully from ITN");
      return res.status(200).send("OK");
    } else {
      console.log("⚠️ [/notify] Payment already processed or skipped");
      return res.status(200).send("OK");
    }
  } catch (error) {
    console.error("❌ [/notify] Payment processing error:", error);
    return res.status(200).send("OK"); // Still return 200 to acknowledge ITN
  }
});

/**
 * POST /api/payfast/confirm-payment
 * Fallback endpoint for payment confirmation when PayFast ITN is unavailable
 * Frontend calls this after user is redirected to payment-success page
 * This ensures payment is processed even if ITN callback fails
 */
router.post("/confirm-payment", authenticate, async (req, res) => {
  try {
    const { listing_id, buyer_id, amount } = req.body;
    const requestingUserId = req.user?.id;

    console.log("\n💳 [/confirm-payment] Fallback payment confirmation requested:", {
      timestamp: new Date().toISOString(),
      listing_id,
      buyer_id,
      amount,
      requestingUserId,
    });

    // Validate required fields
    if (!listing_id || !buyer_id || !amount) {
      console.warn("❌ [/confirm-payment] Missing required fields");
      return res.status(400).json({
        success: false,
        message: "Missing required fields: listing_id, buyer_id, amount",
      });
    }

    // Validate that the requesting user is the buyer
    if (Number(buyer_id) !== Number(requestingUserId)) {
      console.warn("❌ [/confirm-payment] User ID mismatch:", {
        buyer_id,
        requestingUserId,
      });
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Can only confirm own payment",
      });
    }

    // Check if completed order already exists (prevent duplicates)
    db.query(
      "SELECT id FROM orders WHERE listing_id = ? AND status = ?",
      [listing_id, "completed"],
      async (err, existingOrders) => {
        if (err) {
          console.error("❌ [/confirm-payment] Error checking existing orders:", err);
          return res.status(500).json({
            success: false,
            message: "Database error",
            error: err.message,
          });
        }

        if (existingOrders && existingOrders.length > 0) {
          console.warn("⚠️ [/confirm-payment] Order already exists for listing:", {
            listing_id,
            orderId: existingOrders[0].id,
          });
          return res.status(200).json({
            success: true,
            message: "Order already processed",
            orderId: existingOrders[0].id,
            alreadyProcessed: true,
          });
        }

        // Construct payment data for processPaymentSuccess
        const paymentData = {
          custom_int1: buyer_id,
          custom_int2: listing_id,
          amount: parseFloat(amount),
          m_payment_id: `fallback-${Date.now()}`,
        };

        try {
          const success = await processPaymentSuccess(paymentData, "FALLBACK");

          if (success) {
            console.log("✅ [/confirm-payment] Payment confirmed successfully via fallback");
            return res.status(200).json({
              success: true,
              message: "Payment confirmed successfully",
              amount,
              listing_id,
            });
          } else {
            console.warn("⚠️ [/confirm-payment] Payment already processed");
            return res.status(200).json({
              success: true,
              message: "Payment already processed",
              amount,
              listing_id,
            });
          }
        } catch (error) {
          console.error("❌ [/confirm-payment] Error processing payment:", error);
          return res.status(500).json({
            success: false,
            message: "Error processing payment",
            error: error.message,
          });
        }
      }
    );
  } catch (error) {
    console.error("❌ [/confirm-payment] Unexpected error:", error);
    res.status(500).json({
      success: false,
      message: "Payment confirmation failed",
      error: error.message,
    });
  }
});

module.exports = router;
