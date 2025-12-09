import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

import connectToSocket from "./src/controlers/socketManager.js";
import userRoutes from "./src/routes/user.routes.js";

const app = express();
const server = createServer(app);

// SOCKET.IO
const io = connectToSocket(server);

// USE PORT FROM ENV
const PORT = process.env.PORT || 8000;

// CORS MIDDLEWARE
app.use(
  cors({
    origin: "https://echowave-1.onrender.com", // <-- URL should be a string, no dot or slash at the end
    methods: ["GET", "POST", "PUT", "DELETE"], // <-- array recommended
    credentials: true,
  })
);

app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ extended: true, limit: "40kb" }));
app.use(express.static("public"));

// ROUTES
app.use("/api/v1/users", userRoutes);

// TEST ROUTE
app.get("/home", (req, res) => {
  return res.json({ hello: "world" });
});

// DATABASE + SERVER START
const start = async () => {
  try {
    const connectionDb = await mongoose.connect(process.env.MONGO_URL);
    console.log(`MONGO CONNECTED: ${connectionDb.connection.host}`);

    server.listen(PORT, () => {
      console.log(`SERVER RUNNING ON PORT ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Error connecting to MongoDB:", error.message);
    process.exit(1);
  }
};

start();