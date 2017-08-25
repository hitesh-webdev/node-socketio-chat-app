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

        // User has just joined the chat
        if(data.displayName.trim() != "" && data.receiver == undefined){

            var userExists = users.some((user) => user.name == data.displayName);

            if(!userExists){
                console.log(data.displayName);
                callback({validity: "valid", activeUsers: users});
                users.push({name: data.displayName, socketID: socket.id});
                // Broadcasting the new users list
                io.emit('updateUsersList', {
                    usersList: users
                });
            }
            else{
                callback({validity: "taken"});
            }

        } // User has chosen the receiver
        else if (data.displayName.trim() != "" && data.receiver.trim() != "") {

            console.log("User: " + data.displayName + "and Receiver: " + data.receiver);

        }
        else{
            callback({validity: "invalid"});
        }

    });

    socket.on("getRoom", function(data, callback){
        roomName = data.user + "-" + data.receiver;
        callback(roomName);
    });

    socket.on('disconnect', function(){
        console.log("User disconnected");
        // Removing the disconnected user from the Online users list
        newUsers = users.filter((user) => user.socketID != socket.id);
        users = newUsers;
        io.emit('updateUsersList', {
            usersList: users
        });
    });

})

server.listen(port, function(){
    console.log("Server is up on port: " + port);
});