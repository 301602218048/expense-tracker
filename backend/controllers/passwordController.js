const ForgotPasswordRequest = require("../models/ForgotPasswordRequest");
const User = require("../models/user");
const { v4: uuidv4 } = require("uuid");
const sequelize = require("../utils/db-connection");
const sgMail = require("@sendgrid/mail");
const bcrypt = require("bcrypt");
const path = require("path");
require("dotenv").config();

const sendResetLink = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } }, { transaction: t });
    if (!user) {
      t.rollback();
      return res.status(404).json({ msg: "Email not found", success: false });
    }
    const id = uuidv4();

    await ForgotPasswordRequest.create(
      {
        id: id,
        isActive: true,
        userId: user.id,
      },
      { transaction: t }
    );

    sgMail.setApiKey(process.env.SENDGRID_KEY);
    const link = `http://localhost:3000/password/resetpassword/${id}`;

    const msg = {
      to: email,
      from: "abhinav.sharma29032000@gmail.com",
      subject: "Reset Password Link",
      text: "Click on the link to reset your password.",
      html: `<strong>Click on the below link to reset your password.</strong><a href="${link}">${link}</a>`,
    };
    await sgMail.send(msg);
    t.commit();
    res.status(200).json({ msg: "Email with reset link sent", success: true });
  } catch (error) {
    t.rollback();
    console.error(error);
    res.status(500).json({ msg: error.message, success: false });
  }
};

const resetPass = async (req, res) => {
  try {
    const id = req.params.id;
    const forgotpassrequest = await ForgotPasswordRequest.findByPk(id);

    if (!forgotpassrequest || forgotpassrequest.isActive !== true) {
      return res
        .status(404)
        .json({ msg: "forgot password request not found", success: false });
    }

    res.sendFile(
      path.join(__dirname, "..", "..", "frontend", "html", "reset.html")
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: error.message, success: false });
  }
};

const updatePass = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const id = req.params.id;
    const { newPassword } = req.body;

    const forgotpassrequest = await ForgotPasswordRequest.findByPk(id, {
      transaction: t,
    });

    if (!forgotpassrequest || forgotpassrequest.isActive !== true) {
      await t.rollback();
      return res
        .status(400)
        .json({ msg: "Invalid or expired link", success: false });
    }

    const user = await User.findByPk(forgotpassrequest.userId, {
      transaction: t,
    });

    if (!user) {
      await t.rollback();
      return res.status(404).json({ msg: "User not found", success: false });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save({ transaction: t });

    forgotpassrequest.isActive = false;
    await forgotpassrequest.save({ transaction: t });

    await t.commit();
    res
      .status(200)
      .json({ msg: "Password successfully updated", success: true });
  } catch (error) {
    await t.rollback();
    console.error(error);
    res.status(500).json({ msg: error.message, success: false });
  }
};

module.exports = {
  sendResetLink,
  resetPass,
  updatePass,
};
