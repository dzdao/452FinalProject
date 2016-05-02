var errorField = $("#error");
var greetingBox = $("#greeting");
var chatMessage = $("#chatMessage");
var chatBox = $("#chat");
var setBtn = $("#setUserName");
var sendBtn = $("#sendMessage");
var username = $("span.myNickname")[0].innerHTML;
var socket = io();

// Respond to receiving a new message on the chat.
socket.on("newChatMessage", function(data) {
	var clazz;
	if (data.msgFrom === username)
		clazz = "myNickname";
	else
		clazz = "nicknames";
	chatBox.append("<span class=" + clazz + "><b>" + data.msgFrom + "</b></span>: " + data.message + " <br>");
});

// Send over the chat message to the server.
sendBtn.click(function() {
	if (username.length !== 0) {
		if (chatMessage.val().length !== 0) {
			socket.emit("sendChatMessage", {message: chatMessage.val(), msgFrom: username});
			errorField.html("");
			chatMessage.val("");
		} else {
			errorField.html("Message cannot be empty.");
		}
	} else {
		errorField.html("Please register a username first.");
	}
});

