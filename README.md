# CPSC 452 Final Project - Secure Chat 

Implementing a secure chat web application.

## Authors

- David Dao
- Austin Greene
- Julia Nguyen
- Brian Rector
- Chris Tarazi

## Our Node.js Stack

- [Node.js](https://nodejs.org/en/)
- [Express.js](http://expressjs.com/), [Passport.js](http://passportjs.org/), [Socket.io](http://socket.io/)
- [Pug templates](https://github.com/pugjs/pug)
- [MongoDB](https://www.mongodb.org/)
- [Redis](http://redis.io/)

## Application architecture
	
```shell
Root directory
├── package.json            # Metadata for our application (lists all dependencies, etc.)
├── public                  # Static folder; all .js, .html, .css, images, etc. goes here.
│   └── index.js            # Client side JS for the main page (index).
├── server.js               # Our application.
└── views                   # All .pug (html) files go here.
	├── index.pug           # Our homepage.
	├── login.pug           # The login page.
	└── register.pug        # The registration page.
```