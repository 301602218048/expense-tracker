const jwt = require("jsonwebtoken");
const Users = require("../models/user");
require("dotenv").config();

const authenticate = async (req, res, next) => {
  try {
    const token = req.header("Authorization").split(" ")[1];
    const user = jwt.verify(token, process.env.JWT_SECRET);
    const u = await Users.findByPk(user.userId);
    // console.log(u);
    req.user = u;
    next();
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Token not valid", success: false });
  }
};

module.exports = {
  authenticate,
};
