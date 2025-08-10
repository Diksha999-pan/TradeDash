// src/components/Logout.js
import { useEffect } from "react";

const Logout = () => {
  useEffect(() => {
    // Clear localStorage (if used)
    localStorage.removeItem("token");
    localStorage.removeItem("username");

    // Redirect to login page
    window.location.href = "http://localhost:3001/";
  }, []);

  return null; // No UI needed
};

export default Logout;

