/**
 * Handle all the requires and configure all the modules.
 */

var express 			= require("express");
var session 			= require('express-session');
var app 				= express();
var server 				= require("http").createServer(app);
var io 					= require("socket.io")(server);
var passportSocketIo 	= require("passport.socketio");
var cookieParser 		= require('cookie-parser');
var bodyParser 			= require('body-parser')
var passport 			= require('passport');
var Strategy 			= require('passport-local').Strategy;
var redis 				= require("redis").createClient();
var RedisStore 			= require('connect-redis')(session);
var socketioRedis 		= require("passport-socketio-redis");

// Allow our app to use bodyParser for POST requests. 
app.use(bodyParser.urlencoded({ extended: true }) );

// Set templating parsing engine to parse Pug files (.pug).
app.set('view engine', 'pug');

// Configure our app to use 'public' as the static files directory.
app.use(express.static('public'));

// Redis Store for storing user sessions.
var redisStore = new RedisStore({host: 'localhost', port: 6379, client: redis});

// Set Redis to log any errors to the console.
redis.on("error", function (err) {
	console.log("redis error: " + err);
});

// Configure our app's session storage.
// Using Redis to store the user sessions; 
// Sessions last 24 hours and set sessions to be destroy after logout.
app.use(session({
	resave: false, 
	saveUninitialized: false, 
	secret: "secret key", 		// Keep your secret key 
	key: "express.sid", 
	store: redisStore,
	cookie: {maxAge: 86400},
	unset: "destroy"
}));

// Configure our app to use passportJS middleware for authentication. 
app.use(passport.initialize());
app.use(passport.session());

// Configure our sockets to use the same settings as above.
io.use(socketioRedis.authorize({
	passport: passport,
	cookieParser: cookieParser,
	key: 'express.sid',       
	secret: 'secret key',    
	store: redisStore,
	unset: "destroy",
	success: authorizeSuccess,  		// Call authorizeSucess() on success.
	fail: authorizeFail    				// Call authorizeFail() on failure. 
}));

function authorizeSuccess(data, accept) {
	console.log('Authorized Success');
	accept();
}
 
function authorizeFail(data, message, error, accept) {
	if(error) return accept(new Error(message));
	console.log("Unauthorized user connected");
	return accept();
}

// TODO: Remove this when mongodb is implemented.
// Define test user login records.
records = [
	{
		id: 1, username: "chris", password: "pass", displayName: "Chris", emails: [ {value: "chris@example.com"} ]
	},
	{
		id: 2, username: "bob", password: "pass", displayName: "Bob", emails: [ {value: "bob@example.com"} ]
	}
];

// Configure passport to use local (username-password) strategy for authentication.
// More info about the passportJS authentication:
// http://toon.io/understanding-passportjs-authentication-flow/
passport.use(new Strategy(
	function (username, password, done) {

		// TODO: Change this to query mongodb instead of predefined array.

		// Find the user by username from the records array.
		for (var i = records.length - 1; i >= 0; i--) {
			if (records[i].username === username && 
				records[i].password == password) {
				return done(null, records[i]);
			}
		}
		return done(null, false);
}));

// Called by req.login().
passport.serializeUser(function (user, callback) {
	callback(null, user.id);
});

passport.deserializeUser(function (id, callback) {

	// TODO: Change this to query mongodb instead of predefined array.
	
	// Find the user by id from the records array.
	for (var i = records.length - 1; i >= 0; i--) {
		if (records[i].id === id) {
			return callback(null, records[i]);
		}
	}
	return callback(new Error("User with ID " + id + " does not exit."));
});


/**
 * Handle all the routing of the application.
 */

// When the client requests the root directory, 
// send back the rendered index.pug template.
app.get("/", function (req, res) {
	res.render("index", {user: req.user});	// Expose req.user to the template.
});

// Logout the user and destroy the session.
app.get("/logout", function (req, res) {
	req.logout();
	req.session.destroy();
	res.redirect("/");
});

// This is the login page.
app.get("/login", function (req, res) {

	var message;
	if (req.isAuthenticated()) { message = "Welcome " + req.user.username + "!"; }
	else { message = "Please login"; }

	res.render("login", {message: message});
});

// This is the reregistration page.
app.get("/register", function (req, res) {
	if (req.isAuthenticated()) { res.redirect("/"); }
	else { res.render("register", {}); }
});

// Handle the user submitting the login form.
app.post("/login", 
	passport.authenticate("local", {failureRedirect: "/fail"}),
	function (req, res) {
		res.redirect("/");
		console.log("User logged in: " + req.user.username);
		console.log("Cookie will expire in " + req.session.cookie.maxAge + " seconds");
	}
);

// Handle user registration.
app.post("/register", function (req, res) {

	// bodyParser middleware allows us to access the body of the request object.
	console.log("Username: " + req.body['username']);
	console.log("Password: " + req.body['password']);

	// TODO: Implement the below code for mongodb for user account creation.

	// //Create user account object.
	// var userAcc = {
	// 		id: need to figure something out here
	// 		username: req.body['username'], 
	// 		password: req.body['password']
	// }
	
	// //Find if username is already taken.
	// // .next() will return null if there's no results.
	// if (mongodb.find({username: userAcc.username}).limit(1).next() !== null) {
	// 		console.log("Username is already taken");
	// }
	// else {
	// 		mongodb.insertOne(userAcc, function (error, result) {
			
	// 			//http://mongodb.github.io/node-mongodb-native/2.0/api/Collection.html#~insertOneWriteOpCallback
	// 			if (error) console.log("Error creating new user account");
	// 			else if (result.ok) {
	// 				console.log("Successfully created new account");
	// 				//Perform authentication and redirect user back to home page.			
	// 			}
	// 			else console.log("Something really strange happened with MongoDB");
	// 			});
	// }
});


/**
 * Handle the socket.io events.
 */

// Respond to the "connection" event. Fires upon client connecting to the server.
io.on("connection", function (client) {
	var id = client.id;
	var username = client.request.user.username;

	console.log("A user with id = " + id + " has connected. ");

	//console.log("all: " + Object.getOwnPropertyNames(client));
	//console.log("cliennt:" + Object.getOwnPropertyNames(client.request));
	//console.log("headers: " + Object.getOwnPropertyNames(client.handshake.headers));
	
	console.log("Cookie: " + client.handshake.headers.cookie + "\n\n");

	// When the client sends a chat message, emit the message to everyone on the server socket.
	client.on("sendChatMessage", function (data) {
		io.emit("newChatMessage", data);
	});

	// Respond to the client when they disconnect their connection.
	client.on("disconnect", function () {
		console.log(id + " has disconnected.");
	});
});


/**
 * Set server to listen on 8888 or if we're running on 
 * Heroku, let them pick a port number. 
 */

server.listen(process.env.PORT || 8888, function (){
	console.log("server listening on port 8888");
});
