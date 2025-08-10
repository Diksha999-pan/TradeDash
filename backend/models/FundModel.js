const mongoose = require("mongoose");

const FundSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  availableAmount: {
    type: Number,
    default: 0,
  },

  InvestedAmount: {
    type: Number,
    default: 0,
  },

  openingBalance: {
    type: Number,
    default: 0,
  },

  payin: {
    type: Number,
    default: 0,
  },

  payout: {
    type: Number,
    default: 0,
  },

  transactions: [
    {
      type: {
        type: String,
        enum: ["add", "withdraw", "buy", "sell"],
        required: true,
      },
      amount: Number,
      date: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});

module.exports = mongoose.model("Fund", FundSchema);
