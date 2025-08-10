const express = require("express");
const router = express.Router();
const FundModel = require("../models/FundModel");
const { verifyToken } = require("../Middlewares/AuthMiddleware"); // JWT middleware
const HoldingModel = require("../models/HoldingsModel"); 

// ✅ Get funds
router.get("/", verifyToken, async (req, res) => {
  const userId = req.user.id;
  try {
    let fund = await FundModel.findOne({ userId }).populate("userId", "username");;
    if (!fund) {
      fund = await FundModel.create({
    userId,
    availableAmount: 0,
    InvestedAmount: 0,
    openingBalance: 0,
    payin: 0,
    payout: 0,
    transactions: [],
  });
  await fund.populate("userId", "username");
}
    // Now fund.userId is the user object with .username!
    res.json({
      ...fund.toObject(),
      username: fund.userId.username,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Add funds
router.post("/add", verifyToken, async (req, res) => {
  const { amount } = req.body;
  const userId = req.user.id;
  try {
    const fund = await FundModel.findOneAndUpdate(
      { userId },
      {
        $inc: {
          availableAmount: amount,
          payin: amount,
          openingBalance: amount,
        },
        $push: {
          transactions: { type: "add", amount ,date: new Date()},
        },
      },
      { new: true }
    );
    res.json(fund);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Withdraw funds
router.post("/withdraw", verifyToken, async (req, res) => {
  const { amount } = req.body;
  const userId = req.user.id;
  try {
    const fund = await FundModel.findOne({ userId });
    if (fund.availableAmount < amount) {
      return res.status(400).json({ message: "Insufficient funds" });
    }

    fund.availableAmount -= amount;
    fund.payout += amount;
    fund.openingBalance -= amount;
    fund.transactions.push({ type: "withdraw", amount ,date: new Date()});
    await fund.save();

    res.json(fund);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Update on buy/sell

 router.patch("/update-used-amount", verifyToken, async (req, res) => {
  const { type, amount, stockName, price } = req.body;
  const userId = req.user.id;

 console.log("🔍 Incoming PATCH: ", { type, amount, stockName, price });
  try {
    const fund = await FundModel.findOne({ userId });

    if (!fund) {
      return res.status(404).json({ message: "Fund record not found" });
    }

   if (type === "buy") {
  // Try get the stock in holdings
  const actualStock = await HoldingModel.findOne({ name: stockName, userId });
  let actualPrice;
  if (actualStock) {
    actualPrice = actualStock.price;
    if (price < actualPrice) {
      return res.status(400).json({
        message: `❌ Cannot buy below actual price ₹${actualPrice}`,
      });
    }
  }
  // If not present in holdings, treat as first-time buy -- accept any price
  // (You could apply market validation if you want. Else, skip this check.)

  // Check funds
  if (fund.availableAmount < amount) {
    return res.status(400).json({ message: "❌ Insufficient funds" });
  }

  // Proceed buy
  fund.availableAmount -= amount;
  fund.InvestedAmount += amount;
  fund.transactions.push({ type, amount ,date: new Date()});
  await fund.save();

  return res.status(200).json({
    message: "✅ Buy order successful"
  });
}


   else if (type === "sell") {
  // 🧠 1. Fetch user's holding for the given stock
  const userHolding = await HoldingModel.findOne({
    name: stockName,
    userId, // ✅ Match only this user's holdings
  });

  if (!userHolding) {
    return res.status(404).json({ message: "❌ You don't hold this stock." });
  }

  // 🔍 2. Calculate quantity to sell
  const sellQty = amount / price; // 💡 Total amount / stock price = quantity

  if (userHolding.qty < sellQty) {
    return res.status(400).json({
      message: `❌ You have only ${userHolding.qty} shares. Cannot sell ${sellQty.toFixed(2)}.`,
    });
  }

  // 📝 3. Update holding qty
  userHolding.qty -= sellQty;

  // If all shares sold, remove holding
  if (userHolding.qty === 0) {
    await userHolding.deleteOne();
  } else {
    await userHolding.save();
  }

  // 💰 4. Update funds
  fund.availableAmount += amount;
  fund.InvestedAmount -= amount;
}
    // 🧾 5. Record transaction
    fund.transactions.push({ type, amount ,date: new Date()});

    await fund.save();
    res.json(fund);
  } catch (err) {
  console.error("❌ Error in /update-used-amount:", err.message, err.stack);
  res.status(500).json({ message: "Server Error", error: err.message });
}
});
module.exports = router;