import React, { useEffect, useState } from "react";
import axios from "axios";

const Funds = () => {
  const [funds, setFunds] = useState(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token"); // ✅ Get token

  useEffect(() => {
  const fetchFunds = async () => {
    try {
      const res = await axios.get("http://localhost:3002/funds", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setFunds(res.data);
    } catch (err) {
      console.error("Error fetching funds:", err);
    }
  };
fetchFunds();
   // call immediately
}, [token]); // ✅ include only external dependency


  const handleAddFunds = async () => {
    if (!amount) return;
    setLoading(true);
    try {
      await axios.post(
        "http://localhost:3002/funds/add",
        { amount: Number(amount) },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setAmount("");
// Re-fetch after update
      const res = await axios.get("http://localhost:3002/funds", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setFunds(res.data);
    } catch (err) {
      console.error("Error adding funds:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawFunds = async () => {
    if (!amount) return;
    setLoading(true);
    try {
      await axios.post(
        "http://localhost:3002/funds/withdraw",
        { amount: Number(amount) },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setAmount("");
// Re-fetch after update
      const res = await axios.get("http://localhost:3002/funds", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setFunds(res.data);
    } catch (err) {
      console.error("Error withdrawing funds:", err);
    } finally {
      setLoading(false);
    }
  };
  if (!funds) return <p>Loading funds...</p>;

  return (
     <div className="funds-container">
      <div className="funds-header">
        <p>💸 Funds Management</p>
        <div className="funds-actions">
          <input
            type="number"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="amount-input"
          />
          <button className="btn add-btn" onClick={handleAddFunds} disabled={loading}>
            Add funds
          </button>
          <button className="btn withdraw-btn" onClick={handleWithdrawFunds} disabled={loading}>
            Withdraw
          </button>
        </div>
      </div>

      <div className="funds-summary">
        <h2>Equity Fund Summary</h2>
        <div className="funds-table">
          <div className="funds-row">
            <span>Available Amount</span>
            <span className="highlight positive">₹{funds.availableAmount ?? 0}</span>
          </div>
          <div className="funds-row">
            <span>Invested Amount</span>
            <span className="highlight">₹{funds.InvestedAmount ?? 0}</span>
          </div>
          <div className="funds-row">
            <span>Opening Balance</span>
            <span>₹{funds.openingBalance ?? 0}</span>
          </div>
          <div className="funds-row">
            <span>Pay-in</span>
            <span>₹{funds.payin ?? 0}</span>
          </div>
          <div className="funds-row">
            <span>Pay-out</span>
            <span>₹{funds.payout ? funds.payout.toFixed(2) : "0.00"}</span>
          </div>
        </div>
      </div>
      <div className="transactions-section">
  <h3>🧾 Transaction History</h3>
  {funds.transactions.length === 0 ? (
    <p>No transactions yet.</p>
  ) : (
    <table className="transactions-table">
      <thead>
        <tr>
          <th>Type</th>
          <th>Amount (₹)</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>
        {funds.transactions
          .slice()
          .reverse()
          .map((txn, index) => (
            <tr key={index}>
              <td className={`txn-type ${txn.type}`}>{txn.type}</td>
              <td>{txn.amount.toFixed(2)}</td>
              <td>{new Date(txn.date).toLocaleString()}</td>
            </tr>
        ))}
      </tbody>
    </table>
  )}
</div>

    </div>
  );
};


export default Funds;
