const { verifyToken } = require("../Middlewares/AuthMiddleware");
const express = require("express");
const router = express.Router();
const {OrdersModel} = require("../models/OrdersModel"); 
 const { PositionModel } = require("../models/PositionsModel"); 
const HoldingModel = require("../models/HoldingsModel");


router.get("/", verifyToken, async (req, res) => {
  
 try {
    const allOrders = await OrdersModel.find({ userId: req.user.id }); // all orders

    const userOrders = allOrders.filter(
      (order) => order.userId.toString() === req.user.id
    );
    res.status(200).json(userOrders);

  } catch (error) {
    res.status(500).json({ message: "Error fetching orders", error });
    console.error("❌ Error fetching orders:", error);
  }
});
router.post("/newOrder", verifyToken, async (req, res) => {
  console.log("Body received:", req.body);
  const { name, qty, price, mode, orderType, productType } = req.body;
  const userId = req.user.id;

  console.log("Creating new order:", { name, qty, price, mode, orderType, productType, userId });

  try {
    const newOrder = await OrdersModel.create({
      userId,
      name,
      qty,
      price,
      mode,
      status: "Executed",
      orderType,       // You can store orderType if you want
      productType,     // Optionally store productType in order doc
    });

    await updateHoldingsAfterOrder({ userId, name, qty, price, mode, orderId: newOrder._id });

    await updatePositionAfterOrder({ userId, name, qty, price, mode, orderType, productType });

    res.status(201).json({ order: newOrder, message: "Order placed successfully" });
  } catch (err) {
    console.error("❌ Error placing order or updating holdings/positions:", err);
    res.status(500).json({ message: "Failed to place order", error: err.message });
  }
});
// Helper function to update holdings after buy/sell order
async function updateHoldingsAfterOrder({ userId, name, qty, price, mode, orderId }) {
  let holding = await HoldingModel.findOne({ userId, name });

  if (mode === "BUY") {
    if (holding) {
      const totalQty = holding.qty + qty;
      const avgCost = ((holding.avg * holding.qty) + (price * qty)) / totalQty;
      holding.qty = totalQty;
      holding.avg = avgCost;
      holding.price = price;
      holding.orderId = orderId;
      holding.net = ((price - avgCost) * totalQty).toFixed(2);
      holding.day = "0.00"; // update as appropriate
      await holding.save();
    } else {
      holding = new HoldingModel({
        userId,
        name,
        qty,
        avg: price,
        price,
        orderId,
        net: "0.00",
        day: "0.00",
      });
      await holding.save();
    }
  } else if (mode === "SELL") {
    if (!holding) {
      throw new Error("No holdings found to sell from");
    }
    if (holding.qty < qty) {
      throw new Error("Insufficient quantity to sell");
    }
    holding.qty -= qty;
    if (holding.qty === 0) {
      await HoldingModel.deleteOne({ _id: holding._id });
    } else {
      holding.price = price;
      holding.net = ((price - holding.avg) * holding.qty).toFixed(2);
      holding.day = "0.00"; // update as appropriate
      holding.orderId = orderId;
      await holding.save();
    }
  }
}

// Helper function to update positions after buy/sell order
async function updatePositionAfterOrder({ userId, name, qty, price, mode, orderType = "Limit", productType = "CNC" }) {
  let position = await PositionModel.findOne({ userId, name, type: productType });

  if (position) {
    if (mode === "BUY") {
      const totalQty = position.qty + qty;
      const avgPrice = ((position.avg * position.qty) + (price * qty)) / totalQty;
      position.qty = totalQty;
      position.avg = avgPrice;
    } else if (mode === "SELL") {
      position.qty -= qty;
    }
    position.lastPrice = price;
    position.mtm = (position.lastPrice - position.avg) * position.qty;

    if (position.qty <= 0) {
      await PositionModel.deleteOne({ _id: position._id });
    } else {
      await position.save();
    }
  } else if (mode === "BUY") {
    await PositionModel.create({
      userId,
      name,
      qty,
      avg: price,
      type: productType,
      lastPrice: price,
      mtm: 0,
    });
  }
}



module.exports = router;