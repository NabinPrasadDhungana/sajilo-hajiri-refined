import React from "react";
import { Routes, Route } from "react-router-dom";
import Login from "../pages/login";
import Home from "../pages/home";
import Register from "../pages/Register";
import Dashboard from "../pages/Dashboard";
import PrivateRoute from "./Protectedroutes";
import AdminPanel from "../pages/AdminPanel";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Home/>} />
      <Route path="/register" element={<Register/>} />
      <Route path="/admin" element={<PrivateRoute><AdminPanel /></PrivateRoute>} />
     
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
    </Routes>
  );
};

export default AppRoutes;
