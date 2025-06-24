const Users = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const JWT_SECRET = process.env.JWT_SECRET;

const addUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const e = await Users.findOne({ where: { email: email } });
    if (e) {
      return res
        .status(400)
        .json({ msg: "Email already exists", success: false });
    }
    const saltRounds = 10;
    const hashpass = await bcrypt.hash(password, saltRounds);
    await Users.create({
      name: name,
      email: email,
      password: hashpass,
    });
    res.status(201).json({ msg: "signed up successfully", success: true });
  } catch (error) {
    res.status(500).json({ msg: error.message, success: false });
  }
};

const userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const e = await Users.findOne({ where: { email } });
    if (!e) {
      return res.status(404).json({ msg: "User not found", success: false });
    }
    const isCorrect = await bcrypt.compare(password, e.password);
    if (!isCorrect) {
      return res
        .status(400)
        .json({ msg: "Password is incorrect", success: false });
    }
    const token = jwt.sign(
      { userId: e.id, premium: e.isPremiumUser, email: e.email },
      JWT_SECRET,
      { expiresIn: "2h" }
    );
    res
      .status(200)
      .json({ msg: "Logged in successfully", success: true, token });
  } catch (error) {
    res.status(500).json({ msg: error.message, success: false });
  }
};

module.exports = {
  addUser,
  userLogin,
};
