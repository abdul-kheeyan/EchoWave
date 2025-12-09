import React from 'react';
import "../App.css";
import { Link, useNavigate } from "react-router-dom";
import backgrund from "../assets/backgrund.jpg";  
import phone from "../assets/ph.png";

export default function LandingPage() {
  
  const router = useNavigate();   // ✅ FIXED

  return (
    <div
      className='landingPageContainer'
      style={{
        backgroundImage: `url(${backgrund})`,
      }}
    >
      <nav>
        <div className='navHeader'>
          <h2>EchoWave</h2>
        </div>

        <div className='navlist'>
          <p onClick={() => router("/gui8989")}>Join as Guest</p>

          <p onClick={() => router("/auth")}>Register</p>

          <div onClick={() => router("/auth")} role='button'>
            <p>Login</p>
          </div>
        </div>
      </nav>

      <div className="landingMainContainer">
        <div>
          <h1>
            <span style={{
              background: "linear-gradient(90deg, #00f5ff, #0095ff)",
              WebkitBackgroundClip: "text",
              color: "transparent"
            }}>Stay Close,</span> even miles apart
          </h1>

          <p style={{ marginTop: "1rem", fontSize: "2rem" }}>EchoWave connects you</p>

          <div role='button'>
            <Link to={"/auth"}>Get Started</Link>
          </div>
        </div>

        <div>
          <img src={phone} alt="Mobile" />
        </div>
      </div>
    </div>
  );
}
