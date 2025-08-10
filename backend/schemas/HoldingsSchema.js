const mongoose = require("mongoose");
const { Schema } = mongoose;

const HoldingsSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  qty: {
    type: Number,
    required: true,
  },
  avg: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  net: {
    type: String,
    required: true,
  },
  day: {
    type: String,
    required: true,
  },
   orderId: {
    type: mongoose.Schema.Types.ObjectId, // or String if orders are stored differently
    ref: "Order", 
  },
  prevClose: {
     type: Number,
      default: 0
 },
});

module.exports = mongoose.model("Holding", HoldingsSchema);