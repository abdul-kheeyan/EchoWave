import React, { useState } from "react";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Box from "@mui/material/Box";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { useAuth } from "../contexts/AuthContext";
import "./auth.css";

const theme = createTheme();

/* =======================================
   SIGN IN COMPONENT
======================================= */
export function SignIn() {
  const { handleLogin } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setErrorMsg("");
    const newErrors = {};

    if (!username) newErrors.username = "Username is required";
    if (!password) newErrors.password = "Password is required";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      await handleLogin(username, password); // login function
      setMsg("Login successful!");
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || "Login failed!");
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <div className="auth-wrapper">
        <div className="auth-card">
          <Avatar className="auth-avatar">
            <LockOutlinedIcon />
          </Avatar>

          <h2 className="auth-title">Sign In</h2>
          <p className="auth-subtitle">Welcome back!</p>

          {/* SUCCESS or ERROR MESSAGE */}
          {msg && <p className="success-msg">{msg}</p>}
          {errorMsg && <p className="error-msg">{errorMsg}</p>}

          <Box component="form" onSubmit={handleSubmit} className="auth-form">
            <TextField
              fullWidth
              margin="normal"
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              error={!!errors.username}
              helperText={errors.username}
            />

            <TextField
              fullWidth
              margin="normal"
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={!!errors.password}
              helperText={errors.password}
            />

            <FormControlLabel
              control={<Checkbox color="primary" />}
              label="Remember me"
            />

            <Button type="submit" fullWidth className="auth-btn">
              Sign In
            </Button>
          </Box>
        </div>
      </div>
    </ThemeProvider>
  );
}

/* =======================================
   SIGN UP COMPONENT
======================================= */
export function SignUp() {
  const { handleRegister } = useAuth();

  const [fullname, setFullname] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setErrorMsg("");

    const newErrors = {};
    if (!fullname) newErrors.fullname = "Full name is required";
    if (!username) newErrors.username = "Username is required";
    if (!password) newErrors.password = "Password is required";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      const response = await handleRegister(fullname, username, password);
      setMsg(response); // success message from backend
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || "Signup failed!");
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <div className="auth-wrapper">
        <div className="auth-card">
          <Avatar className="auth-avatar">
            <LockOutlinedIcon />
          </Avatar>

          <h2 className="auth-title">Sign Up</h2>
          <p className="auth-subtitle">Create your account</p>

          {/* SUCCESS or ERROR MESSAGE */}
          {msg && <p className="success-msg">{msg}</p>}
          {errorMsg && <p className="error-msg">{errorMsg}</p>}

          <Box component="form" onSubmit={handleSubmit} className="auth-form">
            <TextField
              fullWidth
              margin="normal"
              label="Full Name"
              value={fullname}
              onChange={(e) => setFullname(e.target.value)}
              error={!!errors.fullname}
              helperText={errors.fullname}
            />

            <TextField
              fullWidth
              margin="normal"
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              error={!!errors.username}
              helperText={errors.username}
            />

            <TextField
              fullWidth
              margin="normal"
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={!!errors.password}
              helperText={errors.password}
            />

            <Button type="submit" fullWidth className="auth-btn">
              Sign Up
            </Button>
          </Box>
        </div>
      </div>
    </ThemeProvider>
    
  );
}

/* =======================================
   AUTH PAGE (TOGGLE)
======================================= */
export default function AuthPage() {
  const [mode, setMode] = useState("signin");

  return (
    <div className="auth-container">
      {mode === "signin" ? (
        <>
          <SignIn />
          <p className="toggle-text">
            Don’t have an account?
            <span onClick={() => setMode("signup")}> Create Account</span>
          </p>
        </>
      ) : (
        <>
          <SignUp />
          <p className="toggle-text">
            Already have an account?
            <span onClick={() => setMode("signin")}> Sign In</span>
          </p>
        </>
      )}
    </div>
  );
}
