const express = require('express');
const router = express.Router();
const yf = require('yahoo-finance2').default;

router.get('/quote', async (req, res) => {
  try {
    const symbol = req.query.symbol; // E.g. "INFY.NS" for Infosys (NSE)
    const data = await yf.quote(symbol);
      const lastPrice = data.regularMarketPrice;
    // res.json({ symbol, lastPrice });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

