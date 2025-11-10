import React from "react";
import { Routes, Route } from "react-router-dom";
import Login from "../pages/Login";
import Home from "../pages/home";
import Register from "../pages/Register";
// import Dashboard from "../pages/Dashboard";
import PrivateRoute from "./Protectedroutes";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Home/>} />
      <Route path="/register" element={<Register/>} />
      {/* Example of protected route:
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      /> */}
    </Routes>
  );
};

export default AppRoutes;
