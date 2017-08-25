const path = require('path');
const http = require('http');
const express = require('express');

const socketIO = require('socket.io');

const port = process.env.PORT || 3300;

const app = express();

var server = http.createServer(app);

var io = socketIO(server);

const publicPath = path.join(__dirname + '/../public');

app.use(express.static(publicPath));

var users = [];

io.on('connection', (socket) => {

    console.log("User Connected");

    socket.on('join', function(data, callback){
        if(data.displayName.trim() != ""){
            if(users.indexOf(data.displayName) == -1){
                console.log(data.displayName);
                callback({validity: "valid", activeUsers: users});
                users.push(data.displayName);
            }
            else{
                callback({validity: "taken"});
            }
        }
        else{
            callback({validity: "invalid"});
        }
    });

    socket.on('disconnect', function(data){
        console.log("User disconnected");
    });

})

server.listen(port, function(){
    console.log("Server is up on port: " + port);
});