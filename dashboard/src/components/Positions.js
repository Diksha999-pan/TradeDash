import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Positions.css";

const Positions = () => {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPositions = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("User not authenticated.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await axios.get("http://localhost:3002/positions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Positions fetched:", res.data);
      setPositions(res.data);
    } catch (err) {
      console.error("Error fetching positions:", err);
      setError("Failed to fetch positions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPositions();
  }, []);

  const formatNumber = (num) => (num !== undefined && num !== null ? num.toFixed(2) : "--");

  return (
    <div className="positions-container">
      <h3 className="title">Positions ({positions.length})</h3>

      {loading && <p>Loading positions...</p>}
      {error && <p className="error-message">{error}</p>}

      {!loading && !error && (
        <>
          <div className="positions-table">
            <table>
              <thead>
                <tr>
                  <th>Instrument</th>
                  <th>Quantity</th>
                  <th>Avg. Price</th>
                  <th>Last Price</th>
                  <th>Mark-to-Market (MTM)</th>
                  <th>Type</th>
                </tr>
              </thead>
              <tbody>
                {positions.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", padding: "20px" }}>
                      No open positions.
                    </td>
                  </tr>
                )}
                {positions.map((pos) => {
                  const mtmValue = pos.mtm ?? 0;
                  const mtmClass = mtmValue >= 0 ? "profit" : "loss";

                  return (
                    <tr key={pos._id || pos.name}>
                      <td>{pos.name}</td>
                      <td>{pos.qty}</td>
                      <td>{formatNumber(pos.avg)}</td>
                      <td>{formatNumber(pos.lastPrice)}</td>
                      <td className={mtmClass}>{formatNumber(mtmValue)}</td>
                      <td>{pos.type}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <button className="refresh-button" onClick={fetchPositions} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh Positions"}
          </button>
        </>
      )}
    </div>
  );
};

export default Positions;
