import React, { useContext, useState } from 'react';
import withAuth from '../utils/withAuth';
import { Navigate, useNavigate } from 'react-router-dom';
import "../App.css";
import { Button, IconButton, TextField } from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import { AuthContext } from "../contexts/AuthContext.jsx";
import MeetingImg from "../assets/Meeting.png"

function HomeComponent() {
    let navigate = useNavigate();
    const [meetingCode, setMeetingCode] = useState("");

    const { addToUserHistory } = useContext(AuthContext);

    const handleJoinVideoCall = async () => {
        if (!meetingCode.trim()) {
            alert("Please enter a meeting code");
            return;
        }

        try {
            await addToUserHistory(meetingCode);
            navigate(`/${meetingCode}`);
        } catch (err) {
            console.error("Failed to join meeting:", err);
        }
    }

    return (
        <>
           <div className="navBar" style={{ display: "flex", justifyContent: "space-between", padding: "10px 20px", background: "#111", color: "#fff", alignItems: "center" , width:"100vw"}}>
  <div style={{ display: "flex", alignItems: "center" }}>
    <h2 style={{ margin: 0 , cursor: "pointer" }} onClick={()=>{navigate("/")}}>EchoWave</h2>
  </div>

  <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
    {/* History Button */}
    <div 
      onClick={() => navigate("/history")}
      style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer", color: "#f1f1f1ff" }}
    >
      <RestoreIcon style={{ fontSize: 28, color: "#7fd4ffff" }} />
      <span style={{ fontWeight: 500 }}>History</span>
    </div>

    {/* Logout Button */}
    <Button
     variant="outlined"
      color="error"
      onClick={() => {
        localStorage.removeItem("token");
        navigate("/auth");
      }}
    >
      Logout
    </Button>
  </div>
</div>


            <div className="meetContainer">
                <div className="leftPanel">
                    <div>
                        <h2  style={{ marginBottom: '20px' }} >Bringing People Together Through Flawless, High-Quality Calls.</h2>
                        <div style={{ display: 'flex', gap: "10px" }}>
                            <TextField
                                value={meetingCode}
                                onChange={e => setMeetingCode(e.target.value)}
                                id="outlined-basic"
                                label="Meeting Code"
                                variant="outlined"
                                onKeyPress={(e) => { if (e.key === 'Enter') handleJoinVideoCall(); }}
                            />
                            <Button onClick={handleJoinVideoCall} variant='contained'>Join</Button>
                        </div>
                    </div>
                </div>
                <div className='rightPanel'>
                    <img src={MeetingImg} alt="Meeting" />
                    </div>
            </div>
        </>
    )
}

export default withAuth(HomeComponent);
