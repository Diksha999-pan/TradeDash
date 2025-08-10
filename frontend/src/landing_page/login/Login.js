import React, { useState } from "react";
import axios from "axios";
import "./Login.css";

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const res = await axios.post("http://localhost:3002/login", form);

    if (res.data.success && res.data.user?.username) {
      // ✅ Save token and username
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("username", res.data.user.username);

      setMessage("✅ Logged in!");
      window.location.href = `http://localhost:3001/?token=${res.data.token}&username=${encodeURIComponent(JSON.stringify(res.data.user.username))}`;
}
 else {
      setMessage(`❌ ${res.data.message || "Unknown error"}`);
    }
    }
   catch (err) {
    console.error("Login error:", err);
    setMessage("❌ Something went wrong during login.");
  }
};

  return (
    <div className="login-container">
      <h2>Login</h2>
      {message && <p>{message}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
        />
        <button type="submit">Login</button>
      </form>
      <p>
        Don’t have an account? <a href="/signup">Signup here</a>
      </p>
    </div>
  );
};

export default Login;
