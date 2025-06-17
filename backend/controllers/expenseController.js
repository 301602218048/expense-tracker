const Expense = require("../models/expense");
const User = require("../models/user");
const Downloadfile = require("../models/downloadfile");
const sequelize = require("../utils/db-connection");
const s3Service = require("../services/s3Service");

const addExpense = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { amount, category, desc, note } = req.body;
    const expense = await Expense.create(
      {
        amount: parseInt(amount),
        description: desc,
        category: category,
        userId: req.user.id,
        note: note,
      },
      { transaction: t }
    );

    const user = await User.findByPk(req.user.id, { transaction: t });
    if (!user) {
      await t.rollback();
      return res.status(404).json({ msg: "User not found", success: false });
    }

    if (category !== "salary") {
      user.totalExpense += parseInt(amount);
      await user.save({ transaction: t });
    }

    await t.commit();
    res.status(201).json({
      msg: `Amount for ${category} successfully added`,
      success: true,
      data: expense,
    });
  } catch (error) {
    console.log(error);
    await t.rollback();
    res.status(500).json({ msg: error.message, success: false });
  }
};

const getAllExpense = async (req, res) => {
  try {
    const expense = await Expense.findAll({ where: { userId: req.user.id } });
    if (expense.length == 0) {
      res.status(404).json({ msg: "No expense in database", success: false });
      return;
    }
    res.status(200).json({
      msg: "Here is the list of all expenses",
      success: true,
      data: expense,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: error.message, success: false });
  }
};

const getPageExpense = async (req, res) => {
  try {
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 1;
    const ITEM_PER_PAGE = limit;
    const totalCounts = await Expense.count({ where: { UserId: req.user.id } });
    if (totalCounts === 0) {
      return res.status(404).json({ msg: "No expense found" });
    }
    const expense = await Expense.findAll({
      where: { UserId: req.user.id },
      offset: (page - 1) * ITEM_PER_PAGE,
      limit: ITEM_PER_PAGE,
    });
    res.status(200).json({
      CURRENT_PAGE: page,
      HAS_NEXT_PAGE: ITEM_PER_PAGE * page < totalCounts,
      NEXT_PAGE: page + 1,
      HAS_PREVIOUS_PAGE: page > 1,
      PREVIOUS_PAGE: page - 1,
      LAST_PAGE: Math.ceil(totalCounts / ITEM_PER_PAGE),
      data: expense,
      msg: "Here is your paged expenses",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: error.message, success: false });
  }
};

const deleteExpense = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const id = req.params.id;
    const user = await User.findByPk(req.user.id, { transaction: t });
    const expense = await Expense.findByPk(id, { transaction: t });

    if (!expense || !user) {
      await t.rollback();
      return res
        .status(404)
        .json({ msg: "Expense or user not found", success: false });
    }

    await Expense.destroy({
      where: { id: id, userId: req.user.id },
      transaction: t,
    });

    if (expense.category !== "salary") {
      user.totalExpense -= expense.amount;
      await user.save({ transaction: t });
    }

    await t.commit();
    res.status(200).json({
      msg: `Expense with id ${id} has been deleted`,
      success: true,
    });
  } catch (error) {
    console.log(error);
    await t.rollback();
    res.status(500).json({ msg: error.message, success: false });
  }
};

const fileDownload = async (req, res) => {
  try {
    const expense = await req.user.getExpenses();
    const StringifyExpense = JSON.stringify(expense);
    const userId = req.user.id;
    const filename = `Expense-${userId}-${new Date()}.txt`;
    const fileUrl = await s3Service.UploadToS3(StringifyExpense, filename);
    await req.user.createDownloadfile({
      fileUrl: fileUrl,
    });
    res.status(201).json({
      fileUrl: fileUrl,
      success: true,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Internal server error" });
  }
};

const downloadTable = async (req, res) => {
  try {
    const response = await req.user.getDownloadfiles();
    return res.status(200).json({
      success: true,
      data: response,
    });
  } catch (error) {
    return res.status(500).json({
      msg: "Internal server error",
      success: false,
    });
  }
};

module.exports = {
  addExpense,
  getAllExpense,
  deleteExpense,
  getPageExpense,
  fileDownload,
  downloadTable,
};
