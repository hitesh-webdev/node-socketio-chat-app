var socket = io();

var conversation = document.getElementById("conversation");
var roomName;
var chatReceiver;

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

    var name = getParameterByName("name");

    socket.emit('join', {displayName: name}, 
        function(status){   // Acknowledgement

            if(status.validity == "valid"){
                console.log(status.activeUsers);
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

    fetchRoomMessages();

});

// Setting a new Receiver and fetching messages

function setReceiver(receiver){

    var name = getParameterByName("name");
    var chatName = document.getElementById("chat-name");
    chatReceiver = receiver;
    chatName.textContent = receiver;

    socket.emit("getRoom", {
        user: name,
        receiver: receiver
    }, function(room) {
        roomName = room;
        alert(roomName);
        fetchRoomMessages();
    });

}

// Fetching room messages

function fetchRoomMessages(){
    socket.emit('fetchRoomMessages', {roomName: roomName}, function(roomMsgs){
        // Filling the conversation box with room messages
        console.log(roomMsgs);

        var sender = getParameterByName("name");
        conversation.innerHTML = "";

        if(roomMsgs != null) {

            roomMsgs.forEach(function(msg){
                if(msg.from == sender) {
                    var template = document.getElementById("sender-msg-template").innerHTML;
                    var formattedTime = moment(msg.sentAt).format("hh:mm a");
                    var html = Mustache.render(template, {
                        text: msg.text,
                        sentAt: formattedTime
                    });
                    conversation.innerHTML += html;
                }
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

    });
}

// On Update Users List

socket.on('updateUsersList', function(data){

    var name = getParameterByName("name");

    var onlineUsers = document.getElementById("onlineUsers");
    onlineUsers.innerHTML = "";

    var template = document.getElementById("user-list-template").innerHTML;

    // Showing users apart from the logged in user
    var otherUsers = data.usersList.filter((user) => user.name != name);

    otherUsers.forEach(function(user) {
        var html = Mustache.render(template, {name: user.name});
        onlineUsers.innerHTML += html;
    });
});


// Sending a new Message

document.getElementById("send-btn").addEventListener('click', function(){

    if(roomName != undefined){

        var msgBox = document.getElementById("comment");
        var name = getParameterByName("name");

        // alert(roomName);
        
        socket.emit('sendMessage', {
            sender: name,
            roomName: roomName,
            text: msgBox.value,
            sentAt: new Date().getTime() 
        }, function(){
            msgBox.value = '';
            fetchRoomMessages();
        });  
    }
    else {
        alert("Please select a user first!");
    }

});