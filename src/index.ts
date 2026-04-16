import http from "http";
import app from "./app";
import { setupSocket } from "./socket/commentSocket";
import { Server as SocketIOServer } from "socket.io";

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: "*", // Lock this down to your frontend URL in production
    methods: ["GET", "POST"],
  },
  path: "/socket.io",
  transports: ["websocket"],
});

setupSocket(io);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.IO ready at ws://localhost:${PORT}/socket.io`);
});