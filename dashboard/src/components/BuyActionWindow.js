import React, { useState, useEffect } from "react";
import Modal from "@mui/material/Modal";
import axios from "axios";
import "./BuyActionWindow.css"; // Ensure your CSS styles are imported

const ORDER_TYPES = ["Market", "Limit"];
const PRODUCT_TYPES = ["CNC", "MIS"];

const BuyActionWindow = ({ uid, open, onClose ,onSuccess}) => {
  const [stockQuantity, setStockQuantity] = useState(1);
  const [stockPrice, setStockPrice] = useState("");
  const [orderType, setOrderType] = useState("");
  const [productType, setProductType] = useState("");
  const [actualPrice, setActualPrice] = useState(null);
  const [loading, setLoading] = useState(false);


useEffect(() => {
  if (actualPrice !== null) {
    setStockPrice(String(actualPrice)); // controlled input expects string
  }
}, [actualPrice]);

useEffect(() => {
  if (!uid || !open) return;

  const fetchPrice = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get(`http://localhost:3002/yahoo/quote?symbol=${uid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // The yahoo-finance2 quote returns a complex object, extract required price e.g., "regularMarketPrice"
      const price = res.data?.regularMarketPrice || null;

      setActualPrice(price);
      if (orderType === "Market" && price !== null) {
        setStockPrice(price);
      }
    } catch (err) {
      setActualPrice(null);
      setStockPrice(0);
      console.error("Error fetching price", err);
    }
  };

  fetchPrice();
}, [uid, open, orderType]);


const handleSetMarketPrice = async () => {
  const token = localStorage.getItem("token");
  try {
    const res = await axios.get(`http://localhost:3002/quote?symbol=${uid}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const price = res.data?.regularMarketPrice || null;
    setActualPrice(price);
    setStockPrice(price);
  } catch (err) {
    alert("Failed to refresh market price!");
    setActualPrice(null);
    setStockPrice(0);
  }
};


  // Handle change of order type dropdown
  const handleOrderTypeChange = (e) => {
    const selectedOrderType = e.target.value;
    setOrderType(selectedOrderType);
    if (selectedOrderType === "Market" && actualPrice !== null) {
      setStockPrice(actualPrice);
    }
  };

  const handleBuyClick = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    if (!token) {
      alert("You must be logged in.");
      return;
    }

    // Validate quantity
    if (stockQuantity < 1) {
      alert("Quantity must be at least 1.");
      return;
    }

    // Validate price if Limit order
    if (orderType === "Limit" && (stockPrice <= 0 || isNaN(stockPrice))) {
      alert("Please enter a valid price for Limit Order.");
      return;
    }

    setLoading(true);

    try {
      const orderPayload = {
        name: uid,
        qty: stockQuantity,
        price: stockPrice,
        mode: "BUY",
        orderType,
        productType,
      };

      // Place order API call
      const orderRes = await axios.post("http://localhost:3002/orders/newOrder", orderPayload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const orderId = orderRes.data.order._id;

      // Update funds
      await axios.patch(
        "http://localhost:3002/funds/update-used-amount",
        {
          type: "buy",
          amount: stockQuantity * stockPrice,
          stockName: uid,
          price: stockPrice,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update holdings
      await axios.post(
        "http://localhost:3002/allHoldings/create",
        {
          name: uid,
          qty: stockQuantity,
          price: stockPrice,
          orderId,
          mode: "BUY",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("✅ Buy order placed successfully!");
      if(onSuccess)  onSuccess();
      onClose();
    } catch (error) {
      alert(`❌ Failed to place order: ${error?.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Calculate total margin
  const totalMargin = (stockQuantity * stockPrice).toFixed(2);

  return (
   <Modal
  open={open}
  onClose={onClose}
  aria-labelledby="buy-modal-title"
  aria-describedby="buy-modal-description"
>
  <div className="buy-modal-container">
    <h2 id="buy-modal-title">Buy {uid}</h2>
    <form onSubmit={handleBuyClick}>
      <div className="inputs">
        {/* Order Type */}
      <label>
  Order Type:
  <select value={orderType} onChange={handleOrderTypeChange} required>
    <option value="" disabled>Select Order Type</option>
    {ORDER_TYPES.map((type) => (
      <option key={type} value={type}>{type}</option>
    ))}
  </select>
</label>

        {/* Product Type (No "Day") */}
       <label>
  Product Type:
  <select value={productType} onChange={e => setProductType(e.target.value)} required>
    <option value="" disabled>Select Product Type</option>
    {PRODUCT_TYPES.filter(t => t !== "Day").map((type) => (
      <option key={type} value={type}>{type}</option>
    ))}
  </select>
</label>


        {/* Quantity (starts empty) */}
        <label>
          Quantity:
          <input
            type="number"
            min={1}
            value={stockQuantity === undefined ? "" : stockQuantity}
            onChange={e => setStockQuantity(e.target.value === "" ? undefined : Number(e.target.value))}
            placeholder="Enter quantity"
            required
          />
        </label>

        {/* Price (starts empty, disabled for Market orders) */}
        <label>
          Price:
          <input
            type="number"
            min={0.01}
            step="0.05"
            value={stockPrice === undefined ? "" : stockPrice}
            onChange={e => setStockPrice(e.target.value === "" ? undefined : Number(e.target.value))}
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

        {/* Market price display for Market orders */}
        {orderType === "Market" && (
          <div className="market-price-wrapper">
            <label>
              Market Price:
              <input
                type="number"
                value={stockPrice === undefined ? "" : stockPrice}
                readOnly
                disabled
                className="market-price-input"
              />
            </label>
            <button
              type="button"
              onClick={handleSetMarketPrice}
              className="set-price-btn"
              title="Refresh Market Price"
            >
              Refresh Price
            </button>
          </div>
        )}

        <div className="margin-required">Margin Required: ₹{totalMargin}</div>
      </div>

      <div className="button-group">
        <button type="submit" disabled={loading}>
          {loading ? "Processing..." : "Buy"}
        </button>
        <button type="button" onClick={onClose} disabled={loading} className="cancel-btn">
          Cancel
        </button>
      </div>
    </form>
  </div>
</Modal>

  );
};

export default BuyActionWindow;
