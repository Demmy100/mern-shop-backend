const express = require("express");
const {
  createProduct,
  getProducts,
  deleteProduct,
  getSingleProduct,
  updateProduct,
} = require("../controllers/productController");
const { protect, adminOnly } = require("../middlewares/authMiddleware");
const router = express.Router();
const { upload } = require("../utils/fileUpload");

router.post("/", protect, adminOnly, upload.array("image", 5), createProduct);
router.get("/", getProducts);
router.get("/:id", getSingleProduct);
router.patch("/:id", protect, adminOnly, upload.array("image", 5), updateProduct);
router.delete("/:id", protect, adminOnly, deleteProduct);

module.exports = router;
