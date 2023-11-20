const asyncHandler = require("express-async-handler");
const Cart = require("../models/cartModel");

const getUserCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate(
    "items.product"
  );
  res.status(200).json(cart);
});

const addItemToCart = asyncHandler(async (req, res) => {
  const { product, quantity } = req.body;

  let cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    cart = await Cart.create({
      user: req.user._id,
      items: [{ product, quantity }],
    });
  } else {
    const existingItem = cart.items.find(
      (item) => item.product.toString() === product
    );
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ product, quantity });
    }

    await cart.save();
  }

  res.status(201).json(cart);
});

const updateCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { quantity } = req.body;

  let cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    return res.status(404).json({ error: "Cart not found" });
  }

  const existingItem = cart.items.find(
    (item) => item.product.toString() === productId
  );

  if (!existingItem) {
    return res.status(404).json({ error: "Item not found in cart" });
  }

  // Validate if quantity is less than 1
  if (quantity < 1) {
    return res.status(400).json({ error: "Quantity should be 1 or more" });
  }

  existingItem.quantity = quantity;

  await cart.save();

  res.status(200).json(cart);
});

const deleteCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  let cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    return res.status(404).json({ error: "Cart not found" });
  }

  cart.items = cart.items.filter(
    (item) => item.product.toString() !== productId
  );

  await cart.save();

  res.status(200).json(cart);
});

const getCartTotal = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate(
    "items.product"
  );

  if (!cart) {
    return res.status(404).json({ error: "Cart not found" });
  }

  const total = cart.items.reduce((acc, item) => {
    const productAmount = item.product.amount;
    const quantity = parseInt(item.quantity, 10); // Convert quantity to a number

    if (
      isNaN(productAmount) ||
      typeof productAmount !== "number" ||
      isNaN(quantity)
    ) {
      console.error(
        `Invalid amount or quantity for product: ${item.product.name}`
      );
      return acc;
    }

    return acc + productAmount * quantity;
  }, 0);

  res.status(200).json({ total });
});

module.exports = {
  getUserCart,
  addItemToCart,
  updateCartItem,
  deleteCartItem,
  getCartTotal,
};
