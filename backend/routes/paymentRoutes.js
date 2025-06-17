const express = require("express");
const router = express.Router();
const userAuth = require("../middlewares/auth");
const paymentController = require("../controllers/paymentController");

router.post("/", userAuth.authenticate, paymentController.initiatePayment);
router.get("/payment-status/:orderId", paymentController.getOrderStatus);

module.exports = router;
