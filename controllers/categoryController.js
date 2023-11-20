const asyncHandler = require("express-async-handler");
const Category = require("../models/categoryModel");

const createCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  const categoryExists = await Category.findOne({ name });

  if (categoryExists) {
    return res.status(400).json({ error: "Category already exists" });
  }

  const category = await Category.create({
    name,
    description,
  });

  res.status(201).json(category);
});

const updateCategory = asyncHandler(async (req, res) => {
  const categoryId = req.params.id;
  const { name, description } = req.body;

  const category = await Category.findById(categoryId);

  if (!category) {
    return res.status(404).json({ error: "Category not found" });
  }

  category.name = name || category.name;
  category.description = description || category.description;

  await category.save();

  res.status(200).json(category);
});

const deleteCategory = asyncHandler(async (req, res) => {
  const categoryId = req.params.id;

  const category = await Category.findById(categoryId);

  if (!category) {
    return res.status(404).json({ error: "Category not found" });
  }

  await category.deleteOne();

  res.status(200).json({ message: "Category deleted successfully" });
});

const getAllCategory = asyncHandler(async (req, res) => {
  const category = await Category.find().sort("-createdAt");
  if (!category) {
    res.status(400);
    throw new Error("No category found");
  } else {
    res.status(200).json(category);
  }
});

module.exports = {
  createCategory,
  updateCategory,
  deleteCategory,
  getAllCategory,
};
