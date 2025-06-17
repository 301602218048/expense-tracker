const { DataTypes } = require("sequelize");
const sequelize = require("../utils/db-connection");

const ForgotPasswordRequests = sequelize.define(
  "ForgotPasswordRequests",
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    timestamps: false,
    freezeTableName: true,
  }
);

module.exports = ForgotPasswordRequests;
