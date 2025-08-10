import React, { useState, useEffect } from "react";
import Modal from "@mui/material/Modal";
import axios from "axios";
import "./SellActionWindow.css";

const ORDER_TYPES = ["Market", "Limit"];
const PRODUCT_TYPES = ["CNC", "MIS"];

const SellActionWindow = ({ uid, open, onClose, onSuccess }) => {
  const [stockQuantity, setStockQuantity] = useState("");
  const [stockPrice, setStockPrice] = useState("");
  const [orderType, setOrderType] = useState("");
  const [productType, setProductType] = useState("");
  const [actualPrice, setActualPrice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [availableQty, setAvailableQty] = useState(null);

  // Fetch latest price and user's available quantity when modal opens or uid changes
  useEffect(() => {
    if (!uid || !open) return;

    const fetchPriceAndHoldings = async () => {
      const token = localStorage.getItem("token");
      try {
        // Fetch latest market price from /quote endpoint
        const priceRes = await axios.get(`http://localhost:3002/yahoo/quote?symbol=${uid}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const price = priceRes.data?.regularMarketPrice ?? null;

        setActualPrice(price);

        // If it's market order, stockPrice should reflect actualPrice
        if (orderType === "Market" && price !== null) {
          setStockPrice(String(price));
        }

        // Fetch user's holdings quantity to sell
        const holdingsRes = await axios.get(`http://localhost:3002/allHoldings/quantity/${uid}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setAvailableQty(holdingsRes.data.quantity);
setStockQuantity("");

      } catch (err) {
        setStockPrice("");
        setActualPrice(null);
        setAvailableQty(0);
        console.error("Error fetching price or holdings", err);
      }
    };

    fetchPriceAndHoldings();
  }, [uid, open, orderType]); // Added orderType to update price properly on changes

  // Sync stockPrice to actualPrice when actualPrice changes and orderType is Market
  useEffect(() => {
    if (orderType === "Market" && actualPrice !== null) {
      setStockPrice(String(actualPrice));
    }
  }, [actualPrice, orderType]);


  // Set market price button handler
  const handleSetMarketPrice = () => {
    if (actualPrice !== null) setStockPrice(String(actualPrice));
  };

  // Handle Sell form submit
  const handleSellClick = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
      alert("You must be logged in.");
      return;
    }

    // Parse quantity and price numbers safely
    const qty = Number(stockQuantity);
    const price = Number(stockPrice);

    if (!qty || qty < 1) {
      alert("Please enter a valid quantity.");
      return;
    }
    if (availableQty !== null && qty > availableQty) {
      alert(`You cannot sell more than your current holdings (${availableQty}).`);
      return;
    }
    if (orderType === "Limit" && (!price || price <= 0)) {
      alert("Enter a valid price for Limit order.");
      return;
    }
    if (!orderType) {
      alert("Please select an order type.");
      return;
    }
    if (!productType) {
      alert("Please select a product type.");
      return;
    }

    setLoading(true);

    try {
      const orderPayload = {
        name: uid,
        qty,
        price,
        mode: "SELL",
        orderType,
        productType,
      };

      // Place SELL order
      const orderRes = await axios.post("http://localhost:3002/orders/newOrder", orderPayload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Update funds (add proceeds of sale)
     const fundsRes = await axios.patch(
        "http://localhost:3002/funds/update-used-amount",
        {
          type: "sell",
          amount: qty * price,
          stockName: uid,
          price,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("✅ Sell order placed successfully!");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("❌ Sell failed:", err);
      alert("❌ Failed to place sell order: " + (err?.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = (e) => {
    e.preventDefault();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} aria-labelledby="sell-modal-title" aria-describedby="sell-modal-description">
      <div className="sell-modal-container">
        <h2 id="sell-modal-title">Sell {uid}</h2>
        <form onSubmit={handleSellClick}>
          <div className="inputs">
            {/* Order Type */}
            <label>
              Order Type:
              <select value={orderType} onChange={(e) => setOrderType(e.target.value)} required>
                <option value="" disabled>
                  Select Order Type
                </option>
                {ORDER_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            {/* Product Type */}
            <label>
              Product Type:
              <select value={productType} onChange={(e) => setProductType(e.target.value)} required>
                <option value="" disabled>
                  Select Product Type
                </option>
                {PRODUCT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            {/* Quantity */}
            <label>
              Quantity:
              <input
                type="number"
                min="1"
                max={availableQty ?? undefined}
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                required
              />
              {availableQty !== null && <small>Available: {availableQty}</small>}
            </label>

            {/* Price */}
            <label>
              Price:
              <input
                type="number"
                min="0.01"
                step="0.05"
                value={stockPrice}
                onChange={(e) => setStockPrice(e.target.value)}
                disabled={orderType === "Market"}
                placeholder={orderType === "Limit" ? "Set your limit price" : "Market order"}
                required={orderType === "Limit"}
              />
              {orderType === "Limit" && (
                <button type="button" onClick={handleSetMarketPrice} className="set-price-btn">
                  Set Market Price
                </button>
              )}
            </label>

            <div className="margin-required">Estimated Proceeds: ₹{(Number(stockQuantity) * Number(stockPrice)).toFixed(2)}</div>
          </div>

          <div className="button-group">
            <button type="submit" disabled={loading}>
              {loading ? "Processing..." : "Sell"}
            </button>
            <button type="button" onClick={handleCancelClick} disabled={loading} className="cancel-btn">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default SellActionWindow;
