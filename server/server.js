const path = require('path');
const http = require('http');
const express = require('express');

const socketIO = require('socket.io');

const port = process.env.PORT || 3000;

const app = express();

var server = http.createServer(app);

var io = socketIO(server);

const publicPath = path.join(__dirname + '/../public');

app.use(express.static(publicPath));

io.on('connection', (socket) => {
    console.log("User Connected");
    console.log(socket);
})

server.listen(port, function(){
    console.log("Server is up on port: " + port);
});