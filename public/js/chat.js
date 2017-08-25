var socket = io();

var conversation = document.getElementById("conversation");

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

socket.on('connect', function(){

    var name = getParameterByName("name");
    var receiver = getParameterByName("receiver");

    socket.emit('join', {displayName: name, receiver: receiver}, 
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

socket.on('newMessage', function(msg){

    var template = document.getElementById("receiver-msg-template").innerHTML;
    var formattedTime = moment(msg.sentAt).format("hh:mm a");
    var html = Mustache.render(template, {
        text: msg.text,
        sentAt: formattedTime
    });
    conversation.innerHTML += html;

});

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
})

document.getElementById("send-btn").addEventListener('click', function(){
    var msgBox = document.getElementById("comment");
    
    socket.emit('sendMessage', {
        text: msgBox.value,
        sentAt: new Date().getTime() 
    }, function(){
        msgBox.value = '';
    });  

})