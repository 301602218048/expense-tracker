const express = require("express");
const premiumController = require("../controllers/premiumController");
const userAuth = require("../middlewares/auth");
const router = express.Router();

router.get(
  "/showLeaderboard",
  userAuth.authenticate,
  premiumController.showLeaderboard
);

module.exports = router;
