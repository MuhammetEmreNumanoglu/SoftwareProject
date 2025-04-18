import React from "react";
import { Route, Navigate } from "react-router-dom";

// Token kontrolü yapan PrivateRoute component'i
const PrivateRoute = ({ element, ...rest }) => {
  const token = localStorage.getItem("token"); // Token'ı localStorage'dan alıyoruz

  // Eğer token yoksa, login sayfasına yönlendir
  return token ? element : <Navigate to="/login" replace />;
};

export default PrivateRoute;
