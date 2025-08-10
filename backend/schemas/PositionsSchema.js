const mongoose = require("mongoose");

const PositionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true }, // Symbol
  qty: { type: Number, required: true }, // Could be negative if net short
  avg: { type: Number, required: true },
  type: { type: String, enum: ["CNC", "MIS"], required: true }, // product type
  lastPrice: { type: Number, required: true }, // updated from LTP
  mtm: { type: Number, required: true }, // Mark-to-market profit/loss
  day: { type: String, default: "0.00" },
  createdAt: { type: Date, default: Date.now },
});
module.exports = mongoose.model("Position", PositionSchema);
