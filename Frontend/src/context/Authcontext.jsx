// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect } from "react";

// 1️⃣ Create the context
export const AuthContext = createContext();

// 2️⃣ Create the provider
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // store user object
  const [token, setToken] = useState(null); // store JWT token

  // When app loads, check if user/token exists in localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
  }, []);

  // Login function (called after successful authentication)
  const login = (userData, jwtToken) => {
    setUser(userData);
    setToken(jwtToken);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", jwtToken);
  };

  // Logout function
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
