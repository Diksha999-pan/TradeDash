const axios = require('axios'); // Add this import at the top
const express = require("express");
const router = express.Router();
const { verifyToken } = require("../Middlewares/AuthMiddleware");
const HoldingModel = require("../models/HoldingsModel");
const yf = require('yahoo-finance2').default;


// Refresh all holdings prices by fetching live data from Yahoo Finance
async function refreshAllHoldingsPrices() {
  const allHoldings = await HoldingModel.find();
  for (const holding of allHoldings) {
    try {
      const quote = await yf.quote(holding.name);
      const ltp = Number(quote.regularMarketPrice) ?? holding.price;  // use nullish coalescing
      const prevClose = Number(quote.regularMarketPreviousClose) ?? ltp;
      
      // Calculate net and day change using correct variables and store as numbers
      holding.price = ltp;
      holding.prevClose = prevClose;
      holding.net = parseFloat(((ltp - holding.avg) * holding.qty).toFixed(2));
      holding.day = parseFloat(((ltp - prevClose) * holding.qty).toFixed(2));

      await holding.save();
    } catch (err) {
      console.error(`Failed to update ${holding.name}:`, err.message);
    }
  }
}


// GET all holdings for logged-in user
router.get("/", verifyToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const userHoldings = await HoldingModel.find({ userId });
    res.json(userHoldings);
  } catch (err) {
    console.error("❌ Error fetching holdings:", err);
    res.status(500).json({ message: "Server Error" });
  }
});


// POST create or update holding after buy order (upsert)
router.post("/create", verifyToken, async (req, res) => {
  try {
    const { name, qty, price, orderId } = req.body;
    const userId = req.user.id;

    if (!name || !qty || qty <= 0 || !price || price <= 0) {
      return res.status(400).json({ message: "Invalid input data" });
    }

    let lastPrice = price;
    let prevClose = price;  // fallback price if API call fails

    try {
      const quoteRes = await axios.get(`http://localhost:3002/yahoo/quote`, {
        params: { symbol: name },
      });
      if (quoteRes.data) {
        lastPrice = Number(quoteRes.data.regularMarketPrice) ?? price;
        prevClose = Number(quoteRes.data.regularMarketPreviousClose) ?? price;
      }
    } catch (e) {
      console.error("Error fetching quote data:", e.message);
    }

    let holding = await HoldingModel.findOne({ userId, name });

    if (holding) {
      const totalQty = holding.qty + qty;
      const avgPrice = ((holding.avg * holding.qty) + (price * qty)) / totalQty;

      holding.qty = totalQty;
      holding.avg = avgPrice;
      holding.price = lastPrice;
      holding.prevClose = prevClose;
      holding.orderId = orderId;

      holding.net = parseFloat(((lastPrice - avgPrice) * totalQty).toFixed(2));
      holding.day = parseFloat(((lastPrice - prevClose) * totalQty).toFixed(2));

      await holding.save();
      return res.status(200).json({ message: "✅ Holding updated", data: holding });
    } else {
      const newHolding = new HoldingModel({
        userId,
        name,
        qty,
        avg: price,
        price: lastPrice,
        prevClose,
        orderId,
        net: 0.00,
        day: 0.00,
      });

      await newHolding.save();
      return res.status(200).json({ message: "✅ Holding created", data: newHolding });
    }
  } catch (err) {
    console.error("❌ Error creating/updating holding", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});


// POST update holding after sell order (reduce qty or delete holding)
router.post("/update-sell", verifyToken, async (req, res) => {
  try {
    const { name, qty, price, orderId } = req.body;
    const userId = req.user.id;

    if (!name || !qty || qty <= 0 || !price || price <= 0) {
      return res.status(400).json({ message: "Invalid input data" });
    }

    let holding = await HoldingModel.findOne({ userId, name });
    if (!holding) {
      return res.status(404).json({ message: "Holding not found" });
    }

    if (holding.qty < qty) {
      return res.status(400).json({ message: "Insufficient holdings quantity" });
    }

    let lastPrice = price;
    let prevClose = price; // fallback

    try {
      const quoteRes = await axios.get(`http://localhost:3002/yahoo/quote`, {
        params: { symbol: name },
      });
      if (quoteRes.data) {
        lastPrice = Number(quoteRes.data.regularMarketPrice) ?? price;
        prevClose = Number(quoteRes.data.regularMarketPreviousClose) ?? price;
      }
    } catch (err) {
      console.error("Error fetching quote data:", err.message);
    }

    holding.qty -= qty;

    if (holding.qty === 0) {
      await HoldingModel.deleteOne({ _id: holding._id });
      return res.status(200).json({ message: "Holding sold out and removed" });
    }

    holding.price = lastPrice;
    holding.prevClose = prevClose;
    holding.net = parseFloat(((lastPrice - holding.avg) * holding.qty).toFixed(2));
    holding.day = parseFloat(((lastPrice - prevClose) * holding.qty).toFixed(2));
    holding.orderId = orderId;

    await holding.save();
    return res.status(200).json({ message: "Holding updated", data: holding });
  } catch (err) {
    console.error("❌ Error updating holding on sell", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


// Optional API - current quantity for a stock
router.get("/quantity/:stockName", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const stockName = req.params.stockName;

    const holding = await HoldingModel.findOne({ userId, name: stockName });

    if (!holding) {
      return res.status(200).json({ quantity: 0 });
    }

    const quantity = Number(holding.qty) || 0;
    return res.status(200).json({ quantity });
  } catch (err) {
    console.error("❌ Error fetching holding quantity:", err);
    return res.status(500).json({ error: "Server Error" });
  }
});

module.exports = { router, refreshAllHoldingsPrices };
