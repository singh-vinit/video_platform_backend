import { Server as SocketIOServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { prisma } from "../db/prisma";

interface AuthPayload {
  id: string;
  role: string;
}

export function setupSocket(io: SocketIOServer) {

  // Auth middleware — runs before every connection
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("No token provided"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as AuthPayload;
      socket.data.userId = decoded.id;
      socket.data.role = decoded.role;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const userId = socket.data.userId as string;

    // Join a video room
    socket.on("join_video", (videoId: string) => {
      socket.join(videoId);
    });

    // Leave a video room
    socket.on("leave_video", (videoId: string) => {
      socket.leave(videoId);
    });

    // New comment event
    socket.on("send_comment", async ({ videoId, content }: { videoId: string; content: string }) => {
      if (!videoId || !content?.trim()) {
        socket.emit("error", { message: "videoId and content are required" });
        return;
      }

      try {
        const comment = await prisma.comment.create({
          data: { content, userId, videoId },
          include: {
            user: { select: { id: true, name: true } },
          },
        });

        // Broadcast to everyone in the room including sender
        io.to(videoId).emit("new_comment", comment);
      } catch {
        socket.emit("error", { message: "Failed to post comment" });
      }
    });

    socket.on("disconnect", () => {
      // Socket.IO handles room cleanup automatically
    });
  });
}