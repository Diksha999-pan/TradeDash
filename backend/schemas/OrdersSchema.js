const mongoose = require("mongoose");
const { Schema } = mongoose;

const OrdersSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // for later population
    required: true,
  },

  name: {
    type: String,
    required: true, // Stock Symbol (e.g., "INFY.NS")
  },

  qty: {
    type: Number,
    required: true,
    min: 1,
  },

  price: {
    type: Number,
    required: true,
    min: 0,
  },

  mode: {
    type: String,
    enum: ["BUY", "SELL"],
    required: true,
  },

  status: {
    type: String,
    enum: ["Pending", "Executing", "Executed", "Cancelled"],
    default: "Pending",
  },

  orderType: {
    type: String,
    enum: ["Market", "Limit", "Stop Loss"], // Extendable
    default: "Limit",
  },

  productType: {
    type: String,
    enum: ["CNC", "MIS"], // Add more like BO/CO as needed
    default: "CNC",
  },

  validity: {
    type: String,
    enum: ["DAY", "IOC", "GTT"],
    default: "DAY",
  },

  triggerPrice: {
    type: Number,
    default: null,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },

  executedAt: {
    type: Date,
    default: null,
  },

  exchangeOrderId: {
    type: String, // ID from exchange or broker system if integrated
    default: null,
  },

  remarks: {
    type: String,
    default: "",
  },
});

module.exports = { OrdersSchema };