const asyncHandler = require("express-async-handler");
const Payment = require("../models/paymentModel");
const Cart = require("../models/cartModel");
const axios = require("axios");

const initializePayment = asyncHandler(async (req, res) => {
  try {
    // Fetch user's cart
    const cart = await Cart.findOne({ user: req.user._id }).populate(
      "items.product"
    );

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    // Calculate total amount from cart items
    const amount = cart.items.reduce(
      (total, item) => total + item.product.amount * item.quantity,
      0
    );

    // Make a request to Paystack to initialize the payment
    const paystackResponse = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email: req.user.email,
        amount: Math.floor(amount * 100), // Round to the nearest kobo
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );
    console.log('Paystack Response:', paystackResponse.data);
    console.log('Paystack Request Payload:', {
      email: req.user.email,
      amount: Math.floor(amount * 100),
    });


    // Create a payment record
    const payment = await Payment.create({
      user: req.user._id,
      amount,
      reference: paystackResponse.data.data.reference,
    });

    res.status(201).json({
      paymentId: payment._id,
      reference: payment.reference,
      authorization_url: paystackResponse.data.data.authorization_url,
    });
  } catch (error) {
    console.error("Error initializing payment:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const verifyPayment = asyncHandler(async (req, res) => {
  const { reference } = req.body;

  if (!reference) {
    res.status(400);
    throw new Error("cannot validate payment");
  }

  try {
    // Paystack request to verify the payment
    const paystackResponse = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    // Retrieve payment record from the database
    const payment = await Payment.findOne({
      reference,
      user: req.user._id,
    });

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    payment.status =
      paystackResponse.data.data.status === "success" ? "success" : "failed";
    await payment.save();

    res.status(200).json({
      paymentId: payment._id,
      reference: payment.reference,
      amount: payment.amount,
      status: payment.status,
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = {
  initializePayment,
  verifyPayment,
};
