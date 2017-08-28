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
var rooms = {
    "hitesh-new": [
        {from: 'hitesh',text: 'Hi There! How are you?', sentAt: new Date().getTime()},
        {from: 'new',text: 'Hi Hitesh!', sentAt: new Date().getTime()}
    ]
};

io.on('connection', (socket) => {

    console.log("User Connected");

    socket.on('join', function(data, callback){

        // User has just joined the chat
        if(data.displayName.trim() != ""){

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

        } else{
            callback({validity: "invalid"});
        }

    });

    // Getting Room Name

    socket.on("getRoom", function(data, callback){
        var arr = [data.user,data.receiver];
        // Making a uniform roomName for the sender and receiver by sorting the names alphabetically.
        arr.sort();
        roomName = arr[0] + "-" + arr[1];
        // Checking whether chats of this room are availabe or not
        if(!rooms.hasOwnProperty(roomName)) {
            rooms[roomName] = [];
        }
        socket.join(roomName);
        callback(roomName);
    });

    // Fetching room messages

    socket.on('fetchRoomMessages', function(data,callback){
        callback(rooms[data.roomName]);
    });

    // Sending a new message

    socket.on('sendMessage', function(data,callback){
        rooms[data.roomName].push({from: data.sender, text: data.text, sentAt: data.sentAt});
        socket.broadcast.to(data.roomName).emit("newMessage", {data: rooms[data.roomName]});
        callback();
    })

    // Removing users from list when they disconnect

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