const { v4: uuidv4 } = require("uuid");
const cashfreeService = require("../services/cashfreeService");
const sequelize = require("../utils/db-connection");
const Orders = require("../models/order");
const User = require("../models/user");

const initiatePayment = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const userId = req.user.id;
    const email = req.user.email;
    const orderId = uuidv4();
    const amount = 100.0;

    await Orders.create(
      {
        orderId,
        amount,
        status: "PENDING",
        userId,
      },
      { transaction: t }
    );

    const paymentSessionId = await cashfreeService.createOrder(
      orderId,
      amount,
      "INR",
      userId,
      email
    );
    if (!paymentSessionId) {
      await t.rollback();
      return res.status(500).json({ msg: "Failed to get Session Id" });
    }
    await t.commit();
    res.status(201).json({ paymentSessionId, orderId });
  } catch (error) {
    console.error("Payment initiation failed:", error.message);
    await t.rollback();
    res.status(500).json({ error: "Failed to initiate payment" });
  }
};

const getOrderStatus = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const orderId = req.params.orderId;
    const orderStatus = await cashfreeService.getPaymentStatus(orderId);

    const order = await Orders.findOne({ where: { orderId }, transaction: t });
    if (!order) {
      await t.rollback();
      return res.status(404).json({ msg: "Order not found" });
    }
    order.status = orderStatus;
    await order.save({ transaction: t });

    if (orderStatus === "Success") {
      await User.update(
        { isPremiumUser: true },
        { where: { id: order.userId }, transaction: t }
      );
    }
    await t.commit();
    res
      .status(200)
      .json({ msg: "This is your order status", order, orderStatus });
  } catch (error) {
    await t.rollback();
    console.log("Fetching OrderStatus Failed", error.message);
    res.status(500).json({ error: "Failed to fetch order status" });
  }
};

module.exports = { initiatePayment, getOrderStatus };
