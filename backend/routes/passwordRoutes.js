const express = require("express");
const passwordController = require("../controllers/passwordController");
const router = express.Router();

router.get("/resetpassword/:id", passwordController.resetPass);
router.post("/forgotpassword", passwordController.sendResetLink);
router.put("/updatepassword/:id", passwordController.updatePass);

module.exports = router;
