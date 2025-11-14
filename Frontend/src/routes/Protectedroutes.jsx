// src/components/PrivateRoute.jsx
import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/Authcontext";

const PrivateRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  // Wait until auth state is loaded
  if (loading) {
    return <div>Loading...</div>; // You can replace this with a spinner
  }

  // Only redirect once we know user is really not logged in
  return user ? children : <Navigate to="/login" />;
};

export default PrivateRoute;
