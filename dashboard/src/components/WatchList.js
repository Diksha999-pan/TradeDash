import React, { useState, useEffect, useContext } from "react";
import { Tooltip, Grow } from "@mui/material";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import KeyBoardArrowDown from "@mui/icons-material/KeyboardArrowDown";
import KeyBoardArrowUp from "@mui/icons-material/KeyboardArrowUp";
import axios from "axios";
import BuyActionWindow from "./BuyActionWindow";
import SellActionWindow from "./SellActionWindow";
import GeneralContext from "./GeneralContext";
import { DoughnutChart } from "./DoughnutChart";
import Positions from "./Positions";


// Remove duplicate entries in initialStocks
const initialStocks = [
  { symbol: "INFY.NS", name: "Infosys" },
  { symbol: "TCS.NS", name: "TCS" },
  { symbol: "RELIANCE.NS", name: "Reliance Industries" },
  { symbol: "ICICIBANK.NS", name: "ICICI Bank" },
  { symbol: "KOTAKBANK.NS", name: "Kotak Mahindra Bank" },
  { symbol: "SBIN.NS", name: "State Bank of India" },
  { symbol: "IRFC.NS", name: "Indian Railway Finance Corporation" },
];

const WatchList = () => {
  const [stocks, setStocks] = useState(
    initialStocks.map((stock) => ({
      ...stock,
      price: null,
      percent: null,
      isDown: false,
    }))
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
const [positions, setPositions] = useState([]);
 

// Consume context values for buy window
  const {  buyWindowOpen, buySymbol, closeBuyWindow } = useContext(GeneralContext);
const { sellWindowOpen, sellSymbol, closeSellWindow } = useContext(GeneralContext);
 
const refreshPositions = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await axios.get("http://localhost:3002/positions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPositions(res.data);
    } catch (error) {
      console.error("Failed to refresh positions", error);
    }
  };
 // Initial fetch
  useEffect(() => {
    refreshPositions();
  }, []);
// Fetch quotes on mount and every 60 seconds
  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        setErrorMsg("");
        const updatedStocks = await Promise.all(
          stocks.map(async (stock) => {
            const res = await fetch(`http://localhost:3002/yahoo/quote?symbol=${stock.symbol}`);

            if (!res.ok) {
              console.error(`Fetch error for ${stock.symbol}: HTTP ${res.status}`);
              return { ...stock, price: null, percent: null, isDown: false };
            }

            const dataText = await res.text();

            if (!dataText) {
              console.error(`Empty response for ${stock.symbol}`);
              return { ...stock, price: null, percent: null, isDown: false };
            }

            try {
              const data = JSON.parse(dataText);
              const price = data.regularMarketPrice ?? null;
              const percentChange = data.regularMarketChangePercent ?? 0;
              return {
                ...stock,
                price,
                percent: percentChange.toFixed(2),
                isDown: percentChange < 0,
              };
            } catch (jsonParseError) {
              console.error(`JSON parse error for ${stock.symbol}:`, jsonParseError);
              console.error("Response text was:", dataText);
              return { ...stock, price: null, percent: null, isDown: false };
            }
          })
        );
        setStocks(updatedStocks);
      } catch (error) {
        console.error("Failed to fetch Yahoo Finance data", error);
      }
    };
    fetchQuotes();
    const interval = setInterval(fetchQuotes, 60000);
    return () => clearInterval(interval);
  }, []); // empty dependency to run once

  // Filter stocks by symbol or name (case-insensitive)
  const filteredStocks = stocks.filter(
    (stock) =>
      stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const labels = filteredStocks.map((s) => s.name);
  const data = {
    labels,
    datasets: [
      {
        label: "Price",
        data: filteredStocks.map((stock) => stock.price ?? 0),
        backgroundColor: [
          "rgba(255, 99, 132, 0.5)",
          "rgba(54, 162, 235, 0.5)",
          "rgba(255, 206, 86, 0.5)",
          "rgba(75, 192, 192, 0.5)",
        ],
        borderColor: [
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);
    setSearchResult(null);

    try {
      let symbolToSearch = searchTerm.trim();

      if (!symbolToSearch.endsWith(".NS")) {
        setErrorMsg("Please enter the NSE symbol, e.g., INFY.NS");
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/yahoo/quote?symbol=${symbolToSearch}`);
      const data = await res.json();
      if (data && data.regularMarketPrice) {
        setSearchResult(data);
      } else {
        setErrorMsg("No data found for this symbol.");
      }
    } catch (err) {
      setErrorMsg("Fetch error. Please try a valid symbol.");
    }
    setLoading(false);
  };

  return (
    <div className="watchlist-container">
      <div className="search-container">
        <form onSubmit={handleSearch} style={{ marginBottom: 16 }}>
          <input
            type="text"
            placeholder="Search symbol or name..."
            className="search"
            value={searchTerm}
            style={{ color: "black" }}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit" disabled={loading}>
            Search
          </button>
        </form>
        {loading && <p>Loading...</p>}
        {errorMsg && <div style={{ color: "red" }}>{errorMsg}</div>}
      </div>

      {searchResult && (
        <div className="search-result">
          <h4>
            {searchResult.shortName} ({searchResult.symbol})
          </h4>
          <div>Price: {searchResult.regularMarketPrice}</div>
          <div>
            Change: {searchResult.regularMarketChange} (
            {searchResult.regularMarketChangePercent.toFixed(2)}%)
          </div>
          <div>
            Day High: {searchResult.regularMarketDayHigh} | Day Low:{" "}
            {searchResult.regularMarketDayLow}
          </div>
          <div>Market Cap: {searchResult.marketCap}</div>
          {/* Add "Add to Watchlist" button if needed */}
        </div>
      )}

      <ul className="list">
        {filteredStocks.map((stock, idx) => (
          <WatchListItem stock={stock} key={idx} />
        ))}
      </ul>

      {/* Buy order modal window, controlled by context */}
      <BuyActionWindow uid={buySymbol} open={buyWindowOpen} onClose={closeBuyWindow}onSuccess={refreshPositions}   />
<SellActionWindow uid={sellSymbol} open={sellWindowOpen} onClose={closeSellWindow}  onSuccess={refreshPositions} />

      <DoughnutChart data={data} />
    </div>
  );
};

export default WatchList;

// -------- WatchListItem Component --------



export const WatchListItem = ({ stock }) => {
  const [showWatchList, setShowWatchList] = useState(false);
  const { openBuyWindow, openSellWindow } = useContext(GeneralContext);

  const handleMouseEnter = () => setShowWatchList(true);
  const handleMouseLeave = () => setShowWatchList(false);

  return (
    <li
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
      tabIndex={0}
    >
      <div className="item">
        <p className={stock.isDown ? "down" : "up"}>{stock.name}</p>
        <div className="itemInfo">
          <span className="percent">
            {stock.percent !== null ? `${stock.percent}%` : "--"}
          </span>
          {stock.isDown ? (
            <KeyBoardArrowDown className="down" />
          ) : (
            <KeyBoardArrowUp className="up" />
          )}
          <span className="price">
            {stock.price !== null ? stock.price.toFixed(2) : "--"}
          </span>
        </div>
      </div>
      {showWatchList && <WatchListActions uid={stock.symbol} price={stock.price} />}
    </li>
  );
};

// -------- WatchListActions Component --------

export const WatchListActions = ({ uid, price }) => {
  const { openBuyWindow, openSellWindow } = useContext(GeneralContext);

  const handleBuyClick = () => openBuyWindow(uid);
  const handleSellClick = () => openSellWindow(uid);

  return (
    <span className="actions">
      <Tooltip title="Buy (B)" placement="top" arrow TransitionComponent={Grow}>
        <button className="buy" onClick={handleBuyClick}>
          Buy
        </button>
      </Tooltip>

      <Tooltip title="Sell (S)" placement="top" arrow TransitionComponent={Grow}>
        <button className="sell" onClick={handleSellClick}>
          Sell
        </button>
      </Tooltip>

      <Tooltip title="Analytics (A)" placement="top" arrow TransitionComponent={Grow}>
        <button className="action">
          <BarChartOutlinedIcon className="icon" />
        </button>
      </Tooltip>

      <Tooltip title="More" placement="top" arrow TransitionComponent={Grow}>
        <button className="action">
          <MoreHorizIcon className="icon" />
        </button>
      </Tooltip>
    </span>
  );
};

