import { Server } from "socket.io";

let connections = {};
let messages = {};
let timeOnline = {};

const connectToSocket = (server) => {
  const io = new Server(server,{
    cors: {
      origin: "*",
      methodss: ["GET", "POST"],
      allowedHeaders:["*"],
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    // When a user joins a call
    socket.on("join-call", (path) => {
      if (connections[path] === undefined) {
        connections[path] = [];
      }
      connections[path].push(socket.id);

      timeOnline[socket.id] = new Date();

      // Notify other users that a new user joined
      for (let i = 0; i < connections[path].length; i++) {
        const userSocketId = connections[path][i];
        if (userSocketId !== socket.id) {
          io.to(userSocketId).emit("user-joined", socket.id, connections[path]);
        }
      }

      // Send old chat messages to the newly joined user
      if (messages[path] !== undefined) {
        for (let i = 0; i < messages[path].length; i++) {
          io.to(socket.id).emit(
            "chat-message",
            messages[path][i]["data"],
            messages[path][i]["sender"],
            messages[path][i]["socket-id-sender"]
          );
        }
      }
    });

    // When one user sends WebRTC signal to another
    socket.on("signal", (toId, message) => {
      io.to(toId).emit("signal", socket.id, message);
    });

    // When a user sends a chat message
    socket.on("chat-message", (data, sender) => {
      let matchingRoom = null;

      for (const [roomKey, roomValue] of Object.entries(connections)) {
        if (roomValue.includes(socket.id)) {
          matchingRoom = roomKey;
          break;
        }
      }

      if (matchingRoom) {
        if (messages[matchingRoom] === undefined) {
          messages[matchingRoom] = [];
        }

        messages[matchingRoom].push({
          sender: sender,
          data: data,
          "socket-id-sender": socket.id,
        });

        console.log("message in room", matchingRoom, ":", sender, data);

        // Send message to everyone in the same room
        connections[matchingRoom].forEach((elem) => {
          io.to(elem).emit("chat-message", data, sender, socket.id);
        });
      }
    });

    // When a user disconnects
    socket.on("disconnect", () => {
      const diffTime = Math.abs(new Date() - timeOnline[socket.id]);

      for (const [key, value] of Object.entries(connections)) {
        const index = value.indexOf(socket.id);
        if (index !== -1) {
          // Notify others in the same room that user left
          for (let i = 0; i < connections[key].length; i++) {
            io.to(connections[key][i]).emit("user-left", socket.id);
          }

          connections[key].splice(index, 1);

          if (connections[key].length === 0) {
            delete connections[key];
          }

          break;
        }
      }

      console.log(
        `Socket ${socket.id} disconnected after ${Math.floor(diffTime / 1000)} seconds`
      );
    });
  });

  return io;
};

export default connectToSocket;
