const path = require('path');
const http = require('http');
const express = require('express');
const socketIO = require('socket.io');

// Setting up the PORT
const port = process.env.PORT || 3300;

// Setting up express server
const app = express();
var server = http.createServer(app);

// Configuring the server to use Socket.IO
var io = socketIO(server);

// Serving the public directory statically
const publicPath = path.join(__dirname + '/../public');
app.use(express.static(publicPath));

/* Chat Application code start
====================================================== */

// Global Variables
var users = [];
var rooms = {};

// On Socket Connection
io.on('connection', (socket) => {

    // console.log("User Connected");

    socket.on('join', function(data, callback){

        // User has just joined the chat
        if(data.displayName.trim() != ""){

            // Checking the existence of user with the new display name
            var userExists = users.some((user) => user.name == data.displayName);

            if(!userExists){

                //console.log(data.displayName);
                callback({validity: "valid", onlineUsers: users});

                // Inserting the current user to the online users list 
                users.push({name: data.displayName, socketID: socket.id});

                // Broadcasting the new users list
                io.emit('updateUsersList', {
                    usersList: users
                });
            }
            else{
                // A user with the current display name already exists
                callback({validity: "taken"});
            }

        } else{
            // The display name is either empty or invalid
            callback({validity: "invalid"});
        }

    });

    // Getting Room Name

    socket.on("getRoom", function(data, callback){

        var arr = [data.sender,data.receiver];
        // Making a uniform roomName for the sender and receiver by sorting the names alphabetically.
        arr.sort();
        roomName = arr[0] + "-" + arr[1];

        // Checking whether older chats of this room are availabe or not
        if(!rooms.hasOwnProperty(roomName)) {
            rooms[roomName] = [];
        }

        // Making the user join the current Room
        socket.join(roomName);

        // Sending back the room name(in acknowledgement function)
        callback(roomName);
    });

    // Fetching room messages

    socket.on('fetchRoomMessages', function(data,callback){

        // Sending back the room messages(in acknowledgement function)
        callback(rooms[data.roomName]);

    });

    // Sending a new message

    socket.on('sendMessage', function(data,callback){

        // Inserting the new message to the current room's array
        rooms[data.roomName].push({from: data.sender, text: data.text, sentAt: data.sentAt});

        // Broadcasting the new message to the current room
        socket.broadcast.to(data.roomName).emit("newMessage", {data: rooms[data.roomName]});

        // Rerendering the current room's messages
        callback();
    })

    // Removing users from list when they disconnect

    socket.on('disconnect', function(){

        console.log("User disconnected");

        // Removing the disconnected user from the Online users list
        newUsers = users.filter((user) => user.socketID != socket.id);

        // Setting the new online users list
        users = newUsers;

        // Broadcasting all users to update their Online User's list
        io.emit('updateUsersList', {
            usersList: users
        });

        // Clearing all the rooms and their messages when all users disconnect (to keep the server file size optimized as server side array is used and not a persistent storage like database)

        if(users.length == 0){
            rooms = {};
        }

    });

});

// Listening the server on the setup port

server.listen(port, function(){
    console.log("Server is up on port: " + port);
});