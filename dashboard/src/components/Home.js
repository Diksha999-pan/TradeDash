import React, { useEffect, useState } from "react";
import Dashboard from "./Dashboard";
import TopBar from "./TopBar";
import ProtectedRoute from "./ProtectedRoute";

const Home = () => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get("token");
    const usernameFromUrl = params.get("username");

    if (tokenFromUrl && usernameFromUrl) {
      localStorage.setItem("token", tokenFromUrl);
      localStorage.setItem("username", usernameFromUrl);
      console.log("Token and username set from URL parameters.");
    }

    setIsInitialized(true); // ✅ mark initialization done
  }, []);

  if (!isInitialized) return null; // or a loader

  return (
    <ProtectedRoute>
      <TopBar />
      <Dashboard />
    </ProtectedRoute>
  );
};

export default Home;
