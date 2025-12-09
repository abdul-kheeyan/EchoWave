// src/components/VideoMeet.js
import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useParams } from "react-router-dom";
import {
  Badge,
  IconButton,
  TextField,
  Button
} from "@mui/material";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import CallEndIcon from "@mui/icons-material/CallEnd";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import StopScreenShareIcon from "@mui/icons-material/StopScreenShare";
import ChatIcon from "@mui/icons-material/Chat";
import "../styles/videoComponent.css"; // plain CSS import (not CSS module)


// SERVER URL: use .env VITE_SERVER_URL or fallback
const SERVER_URL = import.meta.env.VITE_SERVER_URL || "https://echowave-5fdo.onrender.com";


const peerConfig = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

export default function VideoMeetComponent() {
  // socket and local refs
   const { url } = useParams();

    console.log("Meeting code:", url);
  const socketRef = useRef(null);
  const socketIdRef = useRef(null);

  // local video element ref
  const localVideoRef = useRef(null);

  // mapping peerId -> RTCPeerConnection
  const connectionsRef = useRef({});

  // video elements state: array of { socketId, stream }
  const [videos, setVideos] = useState([]);
  const videosRef = useRef([]);
  videosRef.current = videos;

  // local media state
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [screenEnabled, setScreenEnabled] = useState(false);
  const [screenAvailable, setScreenAvailable] = useState(false);

  // UI / chat state
  const [showChat, setShowChat] = useState(true);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [newMessagesCount, setNewMessagesCount] = useState(0);

  // username/lobby
  const [askForUsername, setAskForUsername] = useState(true);
  const [username, setUsername] = useState("");

  /* -------------------------
     Helper: manage video list
  ------------------------- */
  const addOrUpdateVideo = (socketId, stream) => {
    setVideos((prev) => {
      const exists = prev.find((v) => v.socketId === socketId);
      if (exists) {
        return prev.map((v) => (v.socketId === socketId ? { ...v, stream } : v));
      } else {
        return [...prev, { socketId, stream }];
      }
    });
  };

  const removeVideo = (socketId) => {
    setVideos((prev) => prev.filter((v) => v.socketId !== socketId));
  };

  /* -------------------------
     Initial permissions & local stream
     runs once on mount
  ------------------------- */
  useEffect(() => {
    const getPermissions = async () => {
      try {
        setScreenAvailable(!!navigator.mediaDevices.getDisplayMedia);

        // Try to get camera + mic with current settings
        const stream = await navigator.mediaDevices.getUserMedia({
          video: videoEnabled,
          audio: audioEnabled
        });

        window.localStream = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      } catch (err) {
        console.warn("Media permission error:", err);
        window.localStream = null;
      }
    };

    getPermissions();

    // cleanup on unmount
    return () => {
      try {
        const s = window.localStream;
        if (s && s.getTracks) s.getTracks().forEach((t) => t.stop());
      } catch (e) {e}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once

  /* -------------------------
     Peer connection creator
  ------------------------- */
  const createPeerConnection = (remoteId) => {
    const pc = new RTCPeerConnection(peerConfig);

    // add local tracks if available
    try {
      const localStream = window.localStream;
      if (localStream) {
        for (const track of localStream.getTracks()) {
          pc.addTrack(track, localStream);
        }
      }
    } catch (e) {
      console.warn("Error adding local tracks:", e);
    }

    // when remote track arrives
    pc.ontrack = (event) => {
      const stream = event.streams && event.streams[0];
      if (stream) addOrUpdateVideo(remoteId, stream);
    };

    pc.onicecandidate = (evt) => {
      if (evt.candidate) {
        socketRef.current && socketRef.current.emit("signal", remoteId, JSON.stringify({ ice: evt.candidate }));
      }
    };

    return pc;
  };

  /* -------------------------
     Handle incoming signalling
  ------------------------- */
  const handleSignal = async (fromId, message) => {
    let signal;
    try {
      signal = JSON.parse(message);
    } catch (e) {
      console.warn("Invalid signal JSON", e);
      return;
    }

    if (fromId === socketIdRef.current) return;

    if (!connectionsRef.current[fromId]) {
      connectionsRef.current[fromId] = createPeerConnection(fromId);
    }
    const pc = connectionsRef.current[fromId];

    if (signal.sdp) {
      const sdp = signal.sdp;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        if (sdp.type === "offer") {
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socketRef.current.emit("signal", fromId, JSON.stringify({ sdp: pc.localDescription }));
        }
      } catch (e) {
        console.error("Error handling SDP:", e);
      }
    }

    if (signal.ice) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(signal.ice));
      } catch (e) {
        console.warn("Error adding ICE candidate:", e);
      }
    }
  };

  /* -------------------------
     Connect to signalling server
  ------------------------- */
  const connectToServer = () => {
    if (socketRef.current) return; // already connected

    socketRef.current = io(SERVER_URL, { transports: ["websocket"] });

    socketRef.current.on("connect", () => {
      socketIdRef.current = socketRef.current.id;
      console.log("Connected to signalling server:", socketIdRef.current);
      socketRef.current.emit("join-call", window.location.href);
    });

    socketRef.current.on("signal", handleSignal);

    socketRef.current.on("chat-message", (data, sender, socketIdSender) => {
        if (socketIdSender !== socketIdRef.current) {
    addMessage(data, sender, socketIdSender);
  }
    });

    socketRef.current.on("user-left", (id) => {
      if (connectionsRef.current[id]) {
        try { connectionsRef.current[id].close(); } catch (e) {e}
        delete connectionsRef.current[id];
      }
      removeVideo(id);
    });

    // Depending on server, user-joined may send (id, clients)
    socketRef.current.on("user-joined", async (id, clients) => {
      // create peer for each existing client (except self)
      if (!Array.isArray(clients)) clients = [];
      clients.forEach(async (socketListId) => {
        if (socketListId === socketIdRef.current) return;
        if (!connectionsRef.current[socketListId]) {
          connectionsRef.current[socketListId] = createPeerConnection(socketListId);
        }
        const pc = connectionsRef.current[socketListId];

        try {
          const localStream = window.localStream;
          if (localStream) {
            for (const track of localStream.getTracks()) {
              pc.addTrack(track, localStream);
            }
          }
        } catch (e) { e }

        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socketRef.current.emit("signal", socketListId, JSON.stringify({ sdp: pc.localDescription }));
        } catch (e) {
          console.warn("Offer creation failed:", e);
        }
      });
    });
  };

  /* -------------------------
     Join flow: get media then connect
  ------------------------- */
  const handleConnect = () => {
    if (!username) return alert("Enter username");
    setAskForUsername(false);
    getLocalMediaForCall().then(() => connectToServer());
  };

  /* -------------------------
     Get (or refresh) local media and attach/senders
  ------------------------- */
  const getLocalMediaForCall = async () => {
    try {
      try {
        const old = window.localStream;
        if (old && old.getTracks) old.getTracks().forEach((t) => t.stop());
      } catch (e) { e }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoEnabled,
        audio: audioEnabled
      });
      window.localStream = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      // Add tracks to existing peer connections
      Object.values(connectionsRef.current).forEach((pc) => {
        try {
          stream.getTracks().forEach((track) => pc.addTrack(track, stream));
        } catch (e) { e }
      });
    } catch (err) {
      console.warn("Unable to get user media:", err);
    }
  };

  /* -------------------------
     Toggle screen share (replace tracks)
  ------------------------- */
  const toggleScreen = async () => {
    if (!screenEnabled) {
      if (!screenAvailable) return alert("Screen share not supported");
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
        window.localDisplayStream = displayStream;

        Object.values(connectionsRef.current).forEach((pc) => {
          const senders = pc.getSenders().filter(s => s.track && s.track.kind === "video");
          if (senders.length > 0 && displayStream.getVideoTracks().length > 0) {
            try { senders[0].replaceTrack(displayStream.getVideoTracks()[0]); } catch (e) {e}
          }
        });

        if (localVideoRef.current) localVideoRef.current.srcObject = displayStream;
        setScreenEnabled(true);

        displayStream.getVideoTracks()[0].onended = async () => {
          setScreenEnabled(false);
          await getLocalMediaForCall();
        };
      } catch (e) {
        console.warn("Screen share error:", e);
      }
    } else {
      try {
        const ds = window.localDisplayStream;
        if (ds && ds.getTracks) ds.getTracks().forEach(t => t.stop());
      } catch (e) { e }
      setScreenEnabled(false);
      await getLocalMediaForCall();
    }
  };

  /* -------------------------
     Toggle camera / mic
  ------------------------- */
  const toggleVideo = () => {
    setVideoEnabled((prev) => {
      const next = !prev;
      setTimeout(() => getLocalMediaForCall(), 0);
      return next;
    });
  };

  const toggleAudio = () => {
    setAudioEnabled((prev) => {
      const next = !prev;
      setTimeout(() => getLocalMediaForCall(), 0);
      return next;
    });
  };

  /* -------------------------
     Chat helpers
  ------------------------- */
  const addMessage = (data, sender, socketIdSender) => {
    setMessages(prev => [...prev, { sender, data }]);
    if (socketIdSender !== socketIdRef.current) setNewMessagesCount(n => n + 1);
  };

  const sendMessage = () => {
    if (!message || !socketRef.current) return;
    socketRef.current.emit("chat-message", message, username);
    addMessage(message, username, socketIdRef.current);
    setMessage("");
  };

  /* -------------------------
     End call cleanup
  ------------------------- */
  const handleEndCall = () => {
    try {
      const s = window.localStream;
      if (s && s.getTracks) s.getTracks().forEach(t => t.stop());
    } catch (e) { e }

    Object.values(connectionsRef.current).forEach(pc => {
      try { pc.close(); } catch (e) { e }
    });
    connectionsRef.current = {};

    try { socketRef.current && socketRef.current.disconnect(); } catch (e) { e }
    socketRef.current = null;

    window.location.href = "/";
  };

  /* -------------------------
     Cleanup on unmount
  ------------------------- */
  useEffect(() => {
    return () => {
      try {
        const s = window.localStream;
        if (s && s.getTracks) s.getTracks().forEach(t => t.stop());
      } catch (e) { e }

      if (socketRef.current) {
        try { socketRef.current.disconnect(); } catch (e) { e }
      }
      Object.values(connectionsRef.current).forEach(pc => {
        try { pc.close(); } catch (e) { e }
      });
      connectionsRef.current = {};
    };
  }, []);

  /* -------------------------
     Render
  ------------------------- */
  return (
    <div>
      {askForUsername ? (
        <div style={{ padding: 20 }}>
          <h2>Enter into Lobby</h2>
          <TextField
            id="username"
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            variant="outlined"
            style={{ marginRight: 12 }}
          />
          <Button variant="contained" onClick={handleConnect}>Connect</Button>

          <div style={{ marginTop: 16 }}>
            <video ref={localVideoRef} autoPlay muted style={{ width: 320, background: "#000" }} />
          </div>
        </div>
      ) : (
        <div className="meetVideoContainer">
          {showChat && (
            <div className="chatRoom">
              <div className="chatContainer">
                <h1>Chat</h1>
                <div className="chattingDisplay" style={{ maxHeight: 300, overflowY: "auto" }}>
                  {messages.length ? messages.map((item, i) => (
                    <div style={{ marginBottom: 12 }} key={i}>
                      <p style={{ fontWeight: "bold", margin: 0 }}>{item.sender}</p>
                      <p style={{ margin: 0 }}>{item.data}</p>
                    </div>
                  )) : <p>No Messages Yet</p>}
                </div>

                <div className="chattingArea" style={{ marginTop: 12 }}>
                  <TextField
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    id="chat-input"
                    label="Enter Your chat"
                    variant="outlined"
                    style={{ width: "70%", marginRight: 8 }}
                  />
                  <Button variant="contained" onClick={sendMessage}>Send</Button>
                </div>
              </div>
            </div>
          )}

          <div className="buttonContainers" style={{ display: "flex", gap: 8 }}>
            <IconButton onClick={toggleVideo} style={{ color: "white" }}>
              {videoEnabled ? <VideocamIcon /> : <VideocamOffIcon />}
            </IconButton>

            <IconButton onClick={handleEndCall} style={{ color: "red" }}>
              <CallEndIcon />
            </IconButton>

            <IconButton onClick={toggleAudio} style={{ color: "white" }}>
              {audioEnabled ? <MicIcon /> : <MicOffIcon />}
            </IconButton>

            {screenAvailable && (
              <IconButton onClick={toggleScreen} style={{ color: "white" }}>
                {screenEnabled ? <StopScreenShareIcon /> : <ScreenShareIcon />}
              </IconButton>
            )}

            <Badge badgeContent={newMessagesCount} max={999} color="secondary">
              <IconButton onClick={() => { setShowChat(prev => !prev); setNewMessagesCount(0); }} style={{ color: "white" }}>
                <ChatIcon />
              </IconButton>
            </Badge>
          </div>

          {/* Local preview */}
          <video className="meetUserVideo" ref={localVideoRef} autoPlay muted style={{ width: 320, marginTop: 12 }} />

          {/* Remote peers */}
          <div className="conferenceView" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
            {videos.map((v) => (
              <div key={v.socketId} style={{ width: 240, height: 180, background: "#000" }}>
                <video
                  data-socket={v.socketId}
                  ref={(ref) => {
                    if (ref && v.stream) {
                      ref.srcObject = v.stream;
                    }
                  }}
                  autoPlay
                  playsInline
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
