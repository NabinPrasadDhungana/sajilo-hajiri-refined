// src/components/Auth/Login.jsx
import React, { useState, useEffect, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "../api/api";
import { AuthContext } from "../context/Authcontext";
import "../assets/login.css";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    remember: false,
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Auto-fill remembered email
  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setFormData((prev) => ({ ...prev, email: savedEmail, remember: true }));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validateForm = () => {
    const { email, password } = formData;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || !emailRegex.test(email)) {
      toast.warning("⚠️ Please enter a valid email");
      return false;
    }

    if (!password || password.length < 6) {
      toast.warning("⚠️ Password must be at least 6 characters");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);

    try {
      const response = await api.post("token/", {
        email: formData.email,
        password: formData.password,
      });

      const data = response.data; // { access: "...", refresh: "..." }

      // Decode token payload (optional)
      const payload = JSON.parse(atob(data.access.split(".")[1]));
      const userData = {
        email: payload.email,
        role: payload.role || "user",
      };

      // Remember email if checked
      if (formData.remember) {
        localStorage.setItem("rememberedEmail", formData.email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      // Save token + user
      login(userData, data.access);

      toast.success("✅ Login successful");
      setTimeout(() => {
        navigate(userData.role === "admin" ? "/admin" : "/dashboard");
      }, 1000);
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error("❌ Invalid email or password");
      } else {
        toast.error("❗ Server error, please try again");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <ToastContainer position="top-right" autoClose={2500} />
      <div className="login-form-container">
        <h2>Login</h2>

        <form onSubmit={handleSubmit} className="login-form">
          {/* Email Input */}
          <div className="input-with-icon">
            <span className="icon">📧</span>
            <input
              type="email"
              name="email"
              placeholder="Email address"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          {/* Password Input */}
          <div className="input-with-icon">
            <span className="icon">🔒</span>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <span
              className="toggle-password"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? "🙈" : "👁️"}
            </span>
          </div>

          {/* Remember Me */}
          <div className="form-check mb-2">
            <input
              className="form-check-input"
              type="checkbox"
              name="remember"
              checked={formData.remember}
              onChange={handleChange}
              id="remember"
            />
            <label className="form-check-label" htmlFor="remember">
              Remember me
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`btn btn-primary w-100 ${loading ? "loading" : ""}`}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Back to Home */}
        <div className="text-center mt-3">
          <Link
            to="/"
            className="btn btn-link text-decoration-none"
            style={{ color: "#4a5568", fontSize: "0.875rem" }}
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
