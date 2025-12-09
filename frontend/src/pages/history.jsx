import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  Typography,
  IconButton
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";

export default function History() {
  const { getHistoryOfUser } = useContext(AuthContext);
  const [meetings, setMeetings] = useState([]);
  const navigate = useNavigate();

  // Fetch Meeting History
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await getHistoryOfUser();
        setMeetings(Array.isArray(res) ? res : []);
      } catch (err) {
        console.error("Error fetching history", err);
        setMeetings([]);
      }
    };

    fetchHistory();
  }, []); // FIXED: No dependency bug

  // Date Formatter
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";

    const d = date.getDate().toString().padStart(2, "0");
    const m = (date.getMonth() + 1).toString().padStart(2, "0");
    const y = date.getFullYear();

    return `${d}/${m}/${y}`;
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "auto" }}>

      {/* Header - Home + Title */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          cursor: "pointer",
          marginBottom: "12px"
        }}
        onClick={() => navigate("/home")}
      >
        <HomeIcon style={{ color: "#ffffffff", fontSize: 30 }} />
       <Typography
          variant="h5"
          fontWeight="600"
          style={{
          marginTop: "2px",
          background: "linear-gradient(90deg, #00f5ff, #0095ff)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
         }}
        >
           EchoWave
         </Typography>

      </div>

      {/* List or Empty Message */}
      {meetings.length > 0 ? (
        meetings.map((item, idx) => (
          <Card
            key={idx}
            variant="outlined"
            sx={{
              marginTop: 2,
              padding: 1.5,
              borderRadius: "14px",
              borderColor: "rgba(0,0,0,0.12)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
            }}
          >
            <CardContent>
              <Typography fontSize={15} color="text.primary" fontWeight={600}>
                Meeting Code: {item.meeting_code || item.meetingCode || "N/A"}
              </Typography>

              <Typography fontSize={14} color="text.secondary" mt={1}>
                Date: {formatDate(item.date)}
              </Typography>
            </CardContent>
          </Card>
        ))
      ) : (
        <Typography
          variant="h6"
          sx={{ textAlign: "center", marginTop: 5, opacity: 0.7 }}
        >
          No meeting history found.
        </Typography>
      )}
    </div>
  );
}
