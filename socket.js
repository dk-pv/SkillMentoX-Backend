// socket.js (ESM)
import { Server } from "socket.io";

let io;

export function initSocket(server) {
    if (io) return io;

    io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL || "http://localhost:3000",
            credentials: true,
            methods: ["GET", "POST"],
        },
    });

    io.on("connection", (socket) => {
        console.log("socket is connected:", socket.id);

        socket.on("chatMessage", (msg) => {
            console.log("Message received:", msg);
            io.emit("chatMessage", msg);
        });

        socket.on("disconnect", (reason) => {
            console.log("Client disconnected:", socket.id, "Reason:", reason);
        });

        socket.on("error", (error) => {
            console.error("Socket.IO error:", error);
        });
    });

    console.log("Socket.IO Connected");
    return io;
}

export function getSocket() {
    if (!io) throw new Error("Socket.io not initialized!");
    return io;
}
