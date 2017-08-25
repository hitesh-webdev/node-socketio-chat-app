var socket = io();

var conversation = document.getElementById("conversation");

function scrollToBottom(){
    conversation.scrollTop = conversation.scrollHeight;
}

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

    socket.emit('join', {
        displayName: name
    }, function(data){
        if(data.validity){
            console.log("Connected Successfully");
        } else {
            alert("Name is required!");
            window.location.href = "index.html";
        } //Acknowledgement
    });

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

document.getElementById("send-btn").addEventListener('click', function(){
    var msgBox = document.getElementById("comment");
    
    socket.emit('sendMessage', {
        text: msgBox.value,
        sentAt: new Date().getTime() 
    }, function(){
        msgBox.value = '';
    });  

})