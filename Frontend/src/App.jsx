import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import "./App.css";

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'aos/dist/aos.css';

import Navbar from "./components/Navbar";
import AppRoutes from "./routes/Approutes"; // assuming this contains your routes
import { AuthProvider } from "./context/Authcontext";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Navbar />
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
