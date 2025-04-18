import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/auth/Login";
import Dashboard from "./pages/Dashboard/Dashboard";
import PrivateRoute from "./component/PrivateRoute";
import DashboardIns from "./pages/Dashboard/DashboardIns";
import DashboardSecr from "./pages/Dashboard/DashboardSecr ";

import Announcement from "./component/Announcement";
import Makeup from "./pages/Dashboard/Makeup";
const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/announcement" element={<Announcement />} />
        <Route
          path="student/dashboard"
          element={<PrivateRoute element={<Dashboard />} />}
        />

        <Route
          path="student/makeup"
          element={<PrivateRoute element={<Makeup />} />}
        />

        <Route
          path="instructor/dashboard"
          element={<PrivateRoute element={<DashboardIns />} />}
        />
        <Route
          path="secretary/dashboard"
          element={<PrivateRoute element={<DashboardSecr />} />}
        />
      </Routes>
    </Router>
  );
};
export default App;
