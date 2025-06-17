const { DataTypes } = require("sequelize");
const sequelize = require("../utils/db-connection");

const DownloadFile = sequelize.define(
  "downloadfile",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    fileUrl: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    freezeTableName: true,
  }
);

module.exports = DownloadFile;
