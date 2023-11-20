const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const {
  getUserCart,
  addItemToCart,
  updateCartItem,
  deleteCartItem,
  getCartTotal,
} = require("../controllers/cartController");

router.get("/", protect, getUserCart);
router.post("/", protect, addItemToCart);
router.put("/:productId", protect, updateCartItem);
router.delete("/:productId", protect, deleteCartItem);
router.get("/total", protect, getCartTotal);

module.exports = router;
