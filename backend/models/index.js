const Users = require("./user");
const Expenses = require("./expense");
const Orders = require("./order");
const DownloadFile = require("./downloadfile");
const ForgotPasswordRequests = require("./ForgotPasswordRequest");

Users.hasMany(Expenses);
Expenses.belongsTo(Users);

Users.hasMany(Orders);
Orders.belongsTo(Users);

Users.hasMany(DownloadFile);
DownloadFile.belongsTo(Users);

Users.hasMany(ForgotPasswordRequests);
ForgotPasswordRequests.belongsTo(Users);

module.exports = {
  Users,
  Expenses,
  Orders,
  ForgotPasswordRequests,
};
