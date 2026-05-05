import http from 'http';
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';

const app = express();
app.use(cors());

const port = 5123;
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

let rooms = {};
let roomCode = {};

app.get('/', (req, res) => {
  res.send("App is running.");
});

io.on("connection", (socket) => {

  socket.on("join_room", ({ room, user }) => {
    socket.join(room);

    if (!rooms[room]) rooms[room] = [];

    // remove duplicates (same socket)
    rooms[room] = rooms[room].filter(u => u.socketId !== socket.id);

    // add user
    rooms[room].push({
      socketId: socket.id,
      user
    });

    // send users list
    io.to(room).emit("room_users", rooms[room]);

    // 🔥 send current code to THIS user
    socket.emit("receive_code", roomCode[room] || "");
  });

  socket.on("send_code", ({ room, code }) => {
    if (code === undefined) return;   // allow empty string

    roomCode[room] = code;

    // send to others
    socket.to(room).emit("receive_code", code);
  });

  socket.on("disconnect", () => {
    for (let room in rooms) {
      rooms[room] = rooms[room].filter(u => u.socketId !== socket.id);
      io.to(room).emit("room_users", rooms[room]);
    }
  });

});

server.listen(port, () => {
  console.log(`Server is running at port ${port}`);
});