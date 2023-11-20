const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middlewares/authMiddleware");
const { createOrder, getOrdersByUser, updateOrderStatus, getAllOrders } = require("../controllers/orderController");

router.post("/", protect, createOrder);
router.get("/user", protect, getOrdersByUser);
router.get("/", protect, adminOnly, getAllOrders);
router.patch("/:id", protect, adminOnly, updateOrderStatus);

module.exports = router;
