import React, { useEffect, useState } from "react";
import axios from "axios";
import "./summary.css";

const Summary = () => {
  const [funds, setFunds] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [username, setUsername] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchSummaryData();
  });

  const fetchSummaryData = async () => {
    try {
      const [fundRes, holdingsRes] = await Promise.all([
        axios.get("http://localhost:3002/funds", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("http://localhost:3002/allHoldings", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setFunds(fundRes.data);
      setHoldings(holdingsRes.data);
      setUsername(fundRes.data.username);
    } catch (err) {
      console.error("Error fetching summary data:", err);
    }
  };

  if (!funds) return <p>Loading summary...</p>;

  // 🧮 Holdings calculations
  const totalInvestment = holdings.reduce(
  (acc, h) => acc + h.qty * h.avg, 0
);
const currentValue = holdings.reduce(
  (acc, h) => acc + h.qty * h.price, 0
);


  const pnl = currentValue - totalInvestment;
   const pnlPercent = totalInvestment ? (pnl / totalInvestment) * 100 : 0;

  return (
    <>
      <div className="username">
        <h6>Hi, {username}!! Welcome To Our Platform</h6>
      </div>
        <hr className="divider" />
<div className="summary-cards-row">
  <div className="summary-card equity-card">
    <span><p>Equity</p></span>
    <div className="data">
      <div className="first">
        <h3>₹{funds.availableAmount?.toFixed(2)}</h3>
        <p>Available Amount</p>
      </div>
      <div className="second">
        <p>Invested <span>₹{funds.InvestedAmount?.toFixed(2)}</span></p>
        <p>Opening Balance <span>₹{funds.openingBalance?.toFixed(2)}</span></p>
      </div>
    </div>
  </div>
  <div className="summary-card holdings-card">
    <span><p>Holdings ({holdings.length})</p></span>
    <div className="data">
      <div className="first">
        <h3 className={pnl >= 0 ? "profit" : "loss"}>
          ₹{pnl.toFixed(2)}
          <small>{pnl ? (pnlPercent >= 0 ? "+" : "") : ""}{pnlPercent.toFixed(2)}%</small>
        </h3>
        <p>P&L</p>
      </div>
      <div className="second">
        <p>Current Value <span>₹{currentValue.toFixed(2)}</span></p>
        <p>Total Investment <span>₹{totalInvestment.toFixed(2)}</span></p>
      </div>
    </div>
  </div>
</div>

    </>
  );
};

export default Summary;
