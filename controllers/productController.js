const asyncHandler = require("express-async-handler");
const Product = require("../models/productModel");
const cloudinary = require("cloudinary").v2;
const { fileSizeFormatter } = require("../utils/fileUpload");
const Category = require("../models/categoryModel")
//const mongoose = require("mongoose")
//const { ObjectId } = mongoose.Types;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const createProduct = asyncHandler(async (req, res) => {
  const { name, category, quantity, amount, description } = req.body;

  // Validation
  if (!name || !category || !quantity || !amount || !description) {
    console.log("Request Body:", req.body);
    res.status(400);
    throw new Error("Please fill in all fields");
  }

  // Handle Image upload using Multer
  let fileData = [];
  if (req.files && req.files.length > 0) {
    fileData = req.files.map((file) => ({
      fileName: file.originalname,
      filePath: `/uploads/${file.filename}`,
      fileType: file.mimetype,
      fileSize: fileSizeFormatter(file.size, 2),
    }));
  }

  // Check if the category exists
  const existingCategory = await Category.findOne({ name: category });

  if (!existingCategory) {
    res.status(404);
    throw new Error("Category not found");
  }

  // Create Product
  const product = await Product.create({
    user: req.user._id,
    name,
    category,
    quantity,
    amount,
    description,
    image: fileData,
  });

  res.status(201).json(product);
});

//get all products
const getProducts = asyncHandler(async (req, res) => {
  const products = await Product.find().sort("-createdAt");
  res.status(200).json(products);
});

//get single product
const getSingleProduct = asyncHandler(async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    res.status(200).json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//delete products only admin
const deleteProduct = asyncHandler(async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      console.error("Product not found:", req.params.id);
      res.status(404).json({ message: "Product not found" });
      return;
    }

    if (req.user.role !== "admin") {
      console.error("User not authorized to delete product:", req.user);
      res.status(403).json({ message: "Only admin can delete a product" });
      return;
    }

    await Product.deleteOne({ _id: req.params.id });
    res.status(200).json({ message: "Product Deleted" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//update products only admin
//update products only admin
const updateProduct = asyncHandler(async (req, res) => {
  const { name, category, quantity, price, description } = req.body;
  const { id } = req.params;

  try {
    // Check if the user is an admin
    if (req.user.role !== "admin") {
      res.status(401).json({ message: "Only admin can update a product" });
      return;
    }

    const product = await Product.findById(id);

    // if product doesn't exist
    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    // Update Product
    product.name = name || product.name;
    product.category = category || product.category;
    product.quantity = quantity || product.quantity;
    product.price = price || product.price;
    product.description = description || product.description;

    // Handle Image upload if there are files
    if (req.files && req.files.length > 0) {
      // Replace existing images with new ones
      product.image = req.files.map((file) => ({
        fileName: file.originalname,
        filePath: `/uploads/${file.filename}`,
        fileType: file.mimetype,
        fileSize: fileSizeFormatter(file.size, 2),
      }));
    }

    // Save the updated product
    const updatedProduct = await product.save();

    res.status(200).json(updatedProduct);
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = {
  createProduct,
  getProducts,
  deleteProduct,
  getSingleProduct,
  updateProduct,
};
