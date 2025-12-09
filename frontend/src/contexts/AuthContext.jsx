import axios from "axios";
import httpStatus from "http-status";
import { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";


export const AuthContext = createContext(null);

const server = import.meta.env.VITE_SERVER_URL || "https://echowave-5fdo.onrender.com";

const client = axios.create({
  baseURL: `${server}/api/v1/users`,
});

export const AuthProvider = ({ children }) => {
  const router = useNavigate();
  const [userData, setUserData] = useState(null);

  // REGISTER
  const handleRegister = async (fullname, username, password) => {
    try {
      const res = await client.post("/register", {
        name: fullname,
        username,
        password,
      });

      if (res.status === httpStatus.CREATED) {
        return res.data.message;
      }
    } catch (err) {
      console.log("REGISTER ERROR:", err.response?.data);
      throw err.response?.data || err;
    }
  };

  // LOGIN
  const handleLogin = async (username, password) => {
    try {
      const res = await client.post("/login", {
        username,
        password,
      });

      if (res.status === httpStatus.OK) {
        localStorage.setItem("token", res.data.token);
        setUserData(res.data.user);
        router("/home");
      }
    } catch (err) {
      console.log("LOGIN ERROR:", err.response?.data);
      throw err.response?.data || err;
    }
  };

// ADD HISTORY
const addToUserHistory = async (meetingCode) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Token missing");

    const res = await client.post(
      `/add-history`,
      { meeting_code: meetingCode },
      { headers: { Authorization: `Bearer ${token}` } } // ✅ token in headers
    );

    console.log("Added to history:", res.data);
  } catch (err) {
    console.error("ADD HISTORY ERROR:", err.response?.data || err);
    throw err;
  }
};

// GET HISTORY
const getHistoryOfUser = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return [];

    const res = await client.get(`/get-history`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return res.data;
  } catch (err) {
    console.error("GET HISTORY ERROR:", err.response?.data || err);
    return [];
  }
};



  return (
    <AuthContext.Provider
      value={{
        userData,
        setUserData,
        handleRegister,
        handleLogin,
        addToUserHistory,
        getHistoryOfUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
