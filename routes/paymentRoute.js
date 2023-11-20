const express = require("express")
const router = express.Router()
const {protect} = require("../middlewares/authMiddleware")
const { initializePayment, verifyPayment } = require("../controllers/paymentController")

router.post("/initialize", protect, initializePayment);
router.post("/verify", protect, verifyPayment);

module.exports = router