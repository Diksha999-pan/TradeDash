const express = require('express');
const router = express.Router();
const { verifyToken } = require('../Middlewares/AuthMiddleware');
const {PositionModel} = require('../models/PositionsModel');
const mongoose = require('mongoose');

router.get("/", verifyToken, async (req, res) => {
  try {
     const userId = new mongoose.Types.ObjectId(req.user.id);
    const positions = await PositionModel.find({ userId });
    console.log(`Positions fetched for user ${userId}:`, positions.length);
    res.json(positions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
