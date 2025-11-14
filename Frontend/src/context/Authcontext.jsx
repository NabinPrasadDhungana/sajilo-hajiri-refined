// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [access, setAccess] = useState(null);
  const [refresh, setRefresh] = useState(null);
  const [loading, setLoading] = useState(true); // ✅ Add loading flag

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedAccess = localStorage.getItem("access");
    const storedRefresh = localStorage.getItem("refresh");

    if (storedUser) setUser(JSON.parse(storedUser));
    if (storedAccess) setAccess(storedAccess);
    if (storedRefresh) setRefresh(storedRefresh);

    setLoading(false); // ✅ Finished restoring
  }, []);

  const login = (userData, accessToken, refreshToken = null) => {
    setUser(userData);
    setAccess(accessToken);
    if (refreshToken) setRefresh(refreshToken);

    localStorage.setItem("user", JSON.stringify(userData));
    if (accessToken) localStorage.setItem("access", accessToken);
    if (refreshToken) localStorage.setItem("refresh", refreshToken);
  };

  const logout = () => {
    setUser(null);
    setAccess(null);
    setRefresh(null);
    localStorage.removeItem("user");
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        access,
        refresh,
        token: access,
        login,
        logout,
        loading, // ✅ Expose loading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
