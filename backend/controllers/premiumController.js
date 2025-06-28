const Users = require("../models/user");

const showLeaderboard = async (req, res) => {
  try {
    if (req.user.isPremiumUser) {
      const leaderboard = await Users.findAll({
        attributes: ["id", "name", "totalExpense"],
        group: ["users.id"],
        order: [["totalExpense", "DESC"]],
      });
      if (!leaderboard || leaderboard.length === 0) {
        return res.status(404).json({ msg: "Not found", success: false });
      }
      res.status(200).json({
        msg: "Current Leaderboard",
        leaderboard,
        success: true,
      });
    } else {
      return res.status(401).json({ msg: "Unauthorised", success: false });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Something went wrong", success: false });
  }
};

module.exports = {
  showLeaderboard,
};
