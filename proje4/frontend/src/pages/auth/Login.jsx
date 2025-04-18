import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import backgroundImage from "../../assets/on.jpg";

const Login = () => {
  const [activeForm, setActiveForm] = useState("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // API endpoint'ini aktif form türüne göre belirle
      const endpoint = `/api/${activeForm}/login`;
      const response = await axiosInstance.post(endpoint, { email, password });

      if (response.data?.token) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("userType", activeForm);
        navigate(`/${activeForm}/dashboard`);
      } else {
        setError("No token received");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const formConfig = {
    student: {
      title: "Student Login",
      description: "Enter your student credentials to access your dashboard",
    },
    instructor: {
      title: "Teacher Login",
      description: "Enter your teacher credentials to access your panel",
    },
    secretary: {
      title: "Admin Login",
      description: "Enter admin credentials to access management system",
    },
  };

  return (
    <div
      className="min-h-screen  bg-cover bg-center bg-no-repeat bg-gray-100 flex items-center justify-around p-4"
      //style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="flex justify-between items-center mb-6">
          <img
            className="w-20 h-20 p-3"
            src="https://uskudar.edu.tr/template/app/dist/img/logo/yazisiz-logo.png"
          />
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveForm("student")}
              className={`px-3 py-1 rounded-md text-sm ${
                activeForm === "student"
                  ? " bg-teal-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Student
            </button>
            <button
              onClick={() => setActiveForm("instructor")}
              className={`px-3 py-1 rounded-md text-sm ${
                activeForm === "instructor"
                  ? " bg-teal-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              instructor
            </button>
            <button
              onClick={() => setActiveForm("secretary")}
              className={`px-3 py-1 rounded-md text-sm ${
                activeForm === "secretary"
                  ? " bg-teal-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Secretary
            </button>
          </div>
        </div>

        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          {formConfig[activeForm].title}
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          {formConfig[activeForm].description}
        </p>

        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleLogin}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder={`${activeForm}@example.com`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 px-4 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Logging in..." : `Login as ${activeForm}`}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
