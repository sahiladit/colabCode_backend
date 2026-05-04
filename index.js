import http from 'http';
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';

const app = express();
app.use(cors()); // frontend and backend are at diff urls

const port = 5123;

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*", 
    },
});

app.get('/', (req, res) => {
    res.send("App is running.");
});

let rooms = {};
let roomCode = {};


io.on("connection", (socket) => {

  socket.on("join_room", (room) => {
    socket.join(room);

    if (!rooms[room]) rooms[room] = [];
    if(!rooms[room].includes(socket.id)){
      rooms[room].push(socket.id);
    }

    io.to(room).emit("room_users", rooms[room]);

    if (roomCode[room]) {
    socket.emit("receive_code", roomCode[room]);
  }
  });

  socket.on("disconnect", () => {
    for (let room in rooms) {
      rooms[room] = rooms[room].filter(id => id !== socket.id);
      io.to(room).emit("room_users", rooms[room]);
    }
  });

  socket.on("send_code", ({ room, code }) => {
    roomCode[room] = code;
    socket.to(room).emit("receive_code", code);
  });

});

server.listen(port, () => {
    console.log(`Server is running at port ${port}`);
});