const asyncHandler = require("express-async-handler");
const Order = require("../models/orderModel");

const createOrder = asyncHandler(async (req, res) => {
  const { items, shippingAddress } = req.body;

  // Validate the presence of items and shipping address
  if (!items || !shippingAddress) {
    return res
      .status(400)
      .json({ error: "Items and shipping address are required" });
  }

  const order = await Order.create({
    user: req.user._id,
    items,
    shippingAddress,
  });

  res.status(201).json(order);
});

const getOrdersByUser = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const orders = await Order.find({ user: userId }).populate("items.product");

  res.status(200).json(orders);
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const orderId = req.params.id;
  const { status } = req.body;

  // Validate if the status is valid
  if (status !== "completed") {
    return res.status(400).json({ error: "Invalid order status" });
  }

  const order = await Order.findById(orderId);

  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }

  // Update the order status
  order.paymentStatus = status;
  await order.save();

  res.status(200).json({ message: "Order status updated successfully", order });
});

const getAllOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find().populate("items.product");

  res.status(200).json(orders);
});

module.exports = {
  createOrder,
  getOrdersByUser,
  updateOrderStatus,
  getAllOrders,
};
