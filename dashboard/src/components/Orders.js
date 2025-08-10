
import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Order.css"
const Orders = () => {
  const [allOrders, setAllOrders] = useState([]);

  useEffect(() => {
     const token = localStorage.getItem("token");
  axios
    .get("http://localhost:3002/orders", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        console.log(res.data);
        setAllOrders(res.data);
      })
      .catch((err) => {
        console.error("Error fetching orders:", err);
      });
  }, []);

  return (
    <>
      <div className="orders-heading-row">
  <h3 className="orders-title">
    Orders <span className="orders-count">({allOrders.length})</span>
  </h3>
  </div>
      {/* <h3 className="title">Orders ({allOrders.length})</h3> */}

      <div className="order-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Mode</th>
               <th>Product Type</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {allOrders.map((order, index) => {
              const modeClass = order.mode === "BUY" ? "buy" : "sell";
              const statusClass = order.status === "Executed" ? "executed" : "pending";

              return (
                <tr key={index}>
                  <td>{order.name}</td>
                  <td>{order.qty}</td>
                  <td>{order.price.toFixed(2)}</td>
                  <td className="mode-col">
  <span className={`mode-badge ${modeClass}`}>{order.mode}</span>
</td>
 <td>{order.productType || "-"}</td>
                  {/* <td className={`mode-badge ${modeClass}`}>{order.mode}</td> */}
                  <td className={statusClass}>{order.status}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default Orders;

