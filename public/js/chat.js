// Global variables

var socket = io();

var conversation = document.getElementById("conversation");
var senderName = getParameterByName("name");
var chatReceiver;
var roomName;

/* Scroll to Bottom Function */
function scrollToBottom(){
    conversation.scrollTop = conversation.scrollHeight;
}

/* Fetching Query String from the URL */

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

// On Connection

socket.on('connect', function(){

    // Making the user join the chat on connection to the server

    socket.emit('join', {displayName: senderName}, 
        function(status){   // Acknowledgement (display name validity status)

            if(status.validity == "valid"){
                // console.log(status.onlineUsers);
                console.log("Connected Successfully");
            } else if(status.validity == "taken") {
                alert("This name is already taken! Please select a new Name.");
                window.location.href = "index.html";
            } else {
                alert("Name is required!");
                window.location.href = "index.html";
            }
        }

    );

});

// On new Message

socket.on('newMessage', function(msg){

    // Fetching room messages when a new message is sent to this room
    fetchRoomMessages();

});

// Setting a new Receiver and fetching messages

function setReceiver(receiver){

    var chatTitle = document.getElementById("chat-name");

    // Setting the chat receiver's name
    chatReceiver = receiver;
    chatTitle.textContent = receiver;

    // Getting the room name of the current receiver
    socket.emit("getRoom", {
        sender: senderName,
        receiver: receiver
    }, function(room) {
        roomName = room;
        // alert(roomName);
        // Fetching the messages of the current room
        fetchRoomMessages();
    });

}

// Fetching room messages

function fetchRoomMessages(){

    socket.emit('fetchRoomMessages', {roomName: roomName}, function(roomMsgs){

        console.log(roomMsgs);

        // Clearing off the current chat screen
        conversation.innerHTML = "";

        // Filling the conversation box with room messages

        if(roomMsgs != null && roomMsgs.length > 0) {  // If the current room contains messages

            // Filtering each room message based on the sender of the message

            roomMsgs.forEach(function(msg){

                // If message id from the sender

                if(msg.from == senderName) {
                    var template = document.getElementById("sender-msg-template").innerHTML;
                    var formattedTime = moment(msg.sentAt).format("hh:mm a");
                    var html = Mustache.render(template, {
                        text: msg.text,
                        sentAt: formattedTime
                    });
                    conversation.innerHTML += html;
                } // If message is from the receiver
                else if(msg.from == chatReceiver) {
                    var template = document.getElementById("receiver-msg-template").innerHTML;
                    var formattedTime = moment(msg.sentAt).format("hh:mm a");
                    var html = Mustache.render(template, {
                        text: msg.text,
                        sentAt: formattedTime
                    });
                    conversation.innerHTML += html;
                }
            });

        }
        else {

            alert('hello');

            conversation.innerHTML = '<h3 style="text-align: center; margin-top: 200px;">No messages to show from this chat.</h3>';

        }

        // Scrolling the chat conversation to the see lastest message
        scrollToBottom();

    });
}

// On Update Users List

socket.on('updateUsersList', function(data){

    var onlineUsers = document.getElementById("onlineUsers");

    // Clearing off the current online users list 
    onlineUsers.innerHTML = "";

    // Checking if users are online other than the current user 

    if(data.usersList.length > 1){

        var template = document.getElementById("user-list-template").innerHTML;

        // Showing users apart from the logged in user (removing the name of logged in user from the Online Users list)
        var otherUsers = data.usersList.filter((user) => user.name != senderName);

        otherUsers.forEach(function(user) {
            var html = Mustache.render(template, {name: user.name});
            onlineUsers.innerHTML += html;
        });

    }
    else {

        // Suggesting user to add the app in a new tab to add other online users

        onlineUsers.innerHTML = '<h3 style="text-align: center;">No user is online.<h3><p style="font-size: 14px; text-align: center;">(Open this App in a new tab also, to add other users).</p>';

    }

});


// Sending a new Message

document.getElementById("send-btn").addEventListener('click', function(){

    var msgBox = document.getElementById("comment");

    // Validating the contents of the message

    if(msgBox.value.trim() == ""){
        alert("Please enter a Message");
        return false;
    }

    // Checking if the chat receiver is set or not

    if(roomName != undefined){

        // alert(roomName);

        // Sending the new message
        socket.emit('sendMessage', {
            sender: senderName,
            roomName: roomName,
            text: msgBox.value.trim(),
            sentAt: new Date().getTime() 
        }, function(){
            msgBox.value = '';
            // Rerendering the current room's messages
            fetchRoomMessages();
        });  

    }
    else {

        // Notifying the user if the chat receiver is not set
        msgBox.value = '';
        alert("Please select a user first!");
    }

});