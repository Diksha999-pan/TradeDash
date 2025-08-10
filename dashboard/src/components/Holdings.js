import React, { useState, useEffect } from "react";
import axios from 'axios';
import { VerticalGraph } from "./VerticalGraph";
import "./Holdings.css";

const Holdings = () => {
  const [allHoldings, setAllHoldings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("Authentication token missing.");
      setLoading(false);
      return;
    }

    axios.get("http://localhost:3002/allHoldings", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        console.log("Holdings from backend:", res.data);
        setAllHoldings(res.data);
        setError(null);
      })
      .catch((err) => {
        if (err.response) {
          console.error("❌ Server responded with error:", err.response.data);
          setError(`Server error: ${err.response.data.message || err.response.data}`);
        } else if (err.request) {
          console.error("❌ No response received:", err.request);
          setError("No response received from server.");
        } else {
          console.error("❌ Error setting up request:", err.message);
          setError(err.message);
        }
        setAllHoldings([]);
      })
      .finally(() => setLoading(false));
  }, []);

  
  // Ensure numerical values for totals
  const totalInvestment = allHoldings.reduce(
    (acc, stock) => acc + (Number(stock.avg) || 0) * (Number(stock.qty) || 0),
    0
  );

  const currentValue = allHoldings.reduce(
    (acc, stock) => acc + (Number(stock.price) || 0) * (Number(stock.qty) || 0),
    0
  );

  const totalPL = currentValue - totalInvestment;

  const plPercentage = totalInvestment > 0 ? (totalPL / totalInvestment) * 100 : 0;

  // Prepare data for VerticalGraph
  const labels = allHoldings.map(item => item.name);
  const data = {
    labels,
    datasets: [
      {
        label: 'Stock Price',
        data: allHoldings.map(stock => Number(stock.price) || 0),
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
    ],
  };

  // Currency formatter for INR
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  });

  if (loading) return <div className="holdings-container"><p>Loading holdings...</p></div>;
  if (error) return <div className="holdings-container"><p style={{ color: "red" }}>Error: {error}</p></div>;

  return (
    <div className="holdings-container">
      <h3 className="title">Holdings ({allHoldings.length})</h3>

      {allHoldings.length === 0 ? (
        <p>No holdings found.</p>
      ) : (
        <div className="order-table">
          <table>
            <thead>
              <tr>
                <th>Instrument</th>
                <th>Qty.</th>
                <th>Avg. cost</th>
                <th>LTP</th>
                <th>Cur. val</th>
                <th>P&L</th>
                <th>Net chg.</th>
                <th>Day chg.</th>
              </tr>
            </thead>
            <tbody>
              {allHoldings.map((stock, index) => {
                const qty = Number(stock.qty) || 0;
                const avg = Number(stock.avg) || 0;

                // Use backend fields price and prevClose
                const price = Number(stock.price) || 0;
                const prevClose = Number(stock.prevClose) || price;

                // Use backend calculated net and day if present
                const netChange = Number(stock.net) || 0;
                const dayChangeAmount = Number(stock.day) || 0;

                // Calculate day change percent safely
                let dayChangePercent = 0;
                if (qty > 0 && prevClose !== 0) {
                  dayChangePercent = (dayChangeAmount / (qty * prevClose)) * 100;
                }
                const dayChangeDisplay = dayChangePercent.toFixed(2) + "%";

                // P&L same as net change
                const pnl = netChange;

                return (
                  <tr key={stock._id || index}>
                    <td>{stock.name}</td>
                    <td>{qty}</td>
                    <td>{avg.toFixed(2)}</td>
                    <td>{price.toFixed(2)}</td>
                    <td>{(price * qty).toFixed(2)}</td>
                    <td className={pnl >= 0 ? "profit" : "loss"}>
                      {isFinite(pnl) ? pnl.toFixed(2) : "0.00"}
                    </td>
                    <td className={netChange >= 0 ? "profit" : "loss"}>
                      {isFinite(netChange) ? netChange.toFixed(2) : "0.00"}
                    </td>
                    <td className={dayChangePercent >= 0 ? "profit" : "loss"}>
                      {dayChangeDisplay}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="row">
        <div className="col">
          <h5>{formatter.format(totalInvestment)}</h5>
          <p>Total investment</p>
        </div>
        <div className="col">
          <h5>{formatter.format(currentValue)}</h5>
          <p>Current value</p>
        </div>
        <div className="col">
          <h5>{formatter.format(totalPL)} ({plPercentage.toFixed(2)}%)</h5>
          <p>P&L</p>
        </div>
      </div>

      <VerticalGraph data={data} />
    </div>
  );
};

export default Holdings;
