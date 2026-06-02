const router = require("express").Router();
const db = require("../config/db");

router.post("/pay", async (req, res) => {
  try {
    const { amount, item_name, listing_id, user_id } = req.body;

    if (!amount || !item_name) {
      return res.status(400).json({
        message: "Amount and item name are required",
      });
    }

    const merchant_id = process.env.PAYFAST_MERCHANT_ID?.trim();
    const merchant_key = process.env.PAYFAST_MERCHANT_KEY?.trim();

    if (!merchant_id || !merchant_key) {
      return res.status(500).json({
        message: "PayFast is not configured. Add PAYFAST_MERCHANT_ID and PAYFAST_MERCHANT_KEY to server/.env, then restart the server.",
      });
    }

    const amountInRand = (Number(amount) / 100).toFixed(2);

    const paymentData = {
      merchant_id,
      merchant_key,

      return_url: "http://localhost:5173/payment-success",
      cancel_url: "http://localhost:5173/payment-cancelled",
      notify_url: "http://localhost:5000/api/payfast/notify",

      name_first: "SwapSphere",
      email_address: "buyer@test.com",

      m_payment_id: Date.now().toString(),

      amount: amountInRand,
      item_name,

      custom_int1: user_id || 0,
      custom_int2: listing_id || 0,
    };

    res.json({
      success: true,
      url: process.env.PAYFAST_URL || "https://sandbox.payfast.co.za/eng/process",
      data: paymentData,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Payment failed",
    });
  }
});

// Utility function to update seller wallet and create order/payment records
const processPaymentSuccess = async (data) => {
  return new Promise((resolve, reject) => {
    const {
      custom_int1: buyerId,
      custom_int2: listingId,
      amount,
      m_payment_id: paymentId,
    } = data;

    // Validate required data
    if (!buyerId || !listingId || !amount) {
      console.log("❌ Missing required payment data");
      return reject(new Error("Missing required payment data"));
    }

    // Start transaction
    db.beginTransaction((err) => {
      if (err) return reject(err);

      // Step 1: Get listing and seller info
      db.query("SELECT id, user_id, title, price, status FROM listings WHERE id = ?", [listingId], (err, listings) => {
        if (err) {
          return db.rollback(() => reject(err));
        }

        if (!listings || listings.length === 0) {
          return db.rollback(() => reject(new Error("Listing not found")));
        }

        const listing = listings[0];
        const sellerId = listing.user_id;

        // Prevent duplicate processing
        if (listing.status === "sold") {
          console.log("⚠️ Listing already marked as sold, skipping payment processing");
          return db.rollback(() => resolve(false));
        }

        // Step 2: Update seller wallet balance
        const sellerAmount = parseFloat(amount);
        db.query("UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?", [sellerAmount, sellerId], (err) => {
          if (err) {
            return db.rollback(() => reject(err));
          }

          // Step 3: Create order record
          db.query(
            "INSERT INTO orders (listing_id, buyer_id, seller_id, amount, status) VALUES (?, ?, ?, ?, ?)",
            [listingId, buyerId, sellerId, sellerAmount, "completed"],
            (err, orderResult) => {
              if (err) {
                return db.rollback(() => reject(err));
              }

              const orderId = orderResult.insertId;

              // Step 4: Create payment record
              db.query(
                "INSERT INTO payments (order_id, payment_method, transaction_id, amount, status, payfast_data) VALUES (?, ?, ?, ?, ?, ?)",
                [orderId, "payfast", paymentId, sellerAmount, "completed", JSON.stringify(data)],
                (err) => {
                  if (err) {
                    return db.rollback(() => reject(err));
                  }

                  // Step 5: Create wallet transaction record
                  db.query(
                    "INSERT INTO wallet_transactions (user_id, type, amount, description, related_order_id, status) VALUES (?, ?, ?, ?, ?, ?)",
                    [sellerId, "credit", sellerAmount, `Sale of "${listing.title}" through PayFast`, orderId, "completed"],
                    (err) => {
                      if (err) {
                        return db.rollback(() => reject(err));
                      }

                      // Step 6: Update listing status to sold
                      db.query("UPDATE listings SET status = ? WHERE id = ?", ["sold", listingId], (err) => {
                        if (err) {
                          return db.rollback(() => reject(err));
                        }

                        // Commit transaction
                        db.commit((err) => {
                          if (err) {
                            return db.rollback(() => reject(err));
                          }
                          resolve(true);
                        });
                      });
                    }
                  );
                }
              );
            }
          );
        });
      });
    });
  });
};

router.post("/notify", async (req, res) => {
  try {
    console.log("PayFast ITN Received:", {
      payer_id: req.body.payer_id,
      m_payment_id: req.body.m_payment_id,
      amount_gross: req.body.amount_gross,
    });

    // Process the payment
    const success = await processPaymentSuccess(req.body);

    if (success) {
      console.log("✅ Payment processed successfully");
      return res.status(200).send("OK");
    } else {
      console.log("⚠️ Payment already processed");
      return res.status(200).send("OK");
    }
  } catch (error) {
    console.error("❌ Payment processing error:", error);
    return res.status(200).send("OK"); // Still return 200 to acknowledge ITN
  }
});

module.exports = router;
