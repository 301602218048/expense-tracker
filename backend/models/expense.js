const { DataTypes } = require("sequelize");
const sequelize = require("../utils/db-connection");

const Expenses = sequelize.define(
  "expenses",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    note: {
      type: DataTypes.STRING,
    },
  },
  {
    tableName: "expenses",
  }
);

module.exports = Expenses;
