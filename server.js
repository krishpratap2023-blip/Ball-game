const http = require("http");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");


const server = http.createServer((req, res) => {
let file = req.url === "/" ? "/index.html" : req.url;
const filePath = path.join(__dirname, "public", file);
fs.readFile(filePath, (err, data) => {
if (err) { res.writeHead(404); res.end("Not found"); }
else { res.writeHead(200); res.end(data); }
});
});


const wss = new WebSocket.Server({ server });
const rooms = {}; // roomId -> { players }


wss.on("connection", ws => {
let pid = null;
let room = null;


ws.on("message", raw => {
const msg = JSON.parse(raw);


if (msg.type === "join") {
room = msg.room;
if (!rooms[room]) rooms[room] = {};
pid = Math.random().toString(36).slice(2);
rooms[room][pid] = { x:0, y:0, name:msg.name, color:msg.color };
}


if (msg.type === "move" && room && rooms[room][pid]) {
rooms[room][pid].x += msg.dx;
rooms[room][pid].y += msg.dy;
}


if (msg.type === "chat" && room && rooms[room][pid]) {
broadcast(room, { type:"chat", name:rooms[room][pid].name, text:msg.text });
}
});


ws.on("close", () => {
if (room && pid && rooms[room]) delete rooms[room][pid];
});


function broadcast(r, data) {
wss.clients.forEach(c => {
if (c.readyState === WebSocket.OPEN)
c.send(JSON.stringify({ ...data, players: rooms[r] }));
});
}
});


setInterval(() => {
for (const r in rooms) {
const payload = JSON.stringify({ type:"state", players: rooms[r] });
wss.clients.forEach(c => {
if (c.readyState === WebSocket.OPEN) c.send(payload);
            });
        }
    }
);
