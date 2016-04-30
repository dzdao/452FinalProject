var express = require("express");
var app = express();
var server = require("http").createServer(app);
var io = require("socket.io")(server);
var bodyParser = require('body-parser')

// Parser for POST requests. Must be fed to the app.post() method.
var urlencodedParser = bodyParser.urlencoded({extended: false});

// Respond to the "connection" event. Fires upon client connecting to the server.
io.on("connection", function (client) {
	var id = client.id;
	var username;

	console.log("A user (" + id + ") has connected. ");

	// Respond to the client-initiated "set username" event .
	client.on("register username", function (data) {
		console.log("(" + id + ") set their username to: " + data.username);

		client.emit("set username", data.username);
		username = data.username;
	});

	// When the client sends a chat message, emit the message to everyone on the server socket.
	client.on("send chat message", function (data) {
		io.emit("new chat message", data);
	});

	// Respond to the client when they disconnect their connection.
	client.on("disconnect", function () {
		console.log("(" + id + ") disconnected.");
	});
});

// When the client requests the root directory, send back the index.html file.
app.get("/", function (req, res) {
	res.sendFile(__dirname + "/index.html");
});

app.post("/", urlencodedParser, function (req, res) {
	console.log("Received from user: " + req.body.name);
	var name = req.body.name;
	var html = "Hi there " + name + " <br>";
	res.send(html);
	res.end();
});

server.listen(8888, function (){
	console.log("server listening on port 8888");
});
