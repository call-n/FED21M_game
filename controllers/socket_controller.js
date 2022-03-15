const debug = require('debug')('chat:socket_controller');

let io = null; // socket.io server instance

const users = {};
const sessions = []

const handleDisconnect = function() {
	debug(`Client ${this.id} disconnected :(`);

    // let everyone connected know that user has disconnected
    this.broadcast.emit('user:disconnected', users[this.id]);

    // remove user from list of connected users
    delete users[this.id];
}

// Handle when a user has joined the chat
const handleUserJoined = function(username, callback) {
    
	users[this.id] = username;

    // calls to create a session or join one and gets back a boolean if its time to start
    const startGame = createSession(this, username);

    debug(`User ${username} with socket id ${this.id} joined`);

    // let everyone know that someone has connected to the chat
    this.broadcast.emit('user:connected', username);

    // confirm join
    callback({
        success: true,
        start: startGame
    });
}

const createSession = function(socket, username) {

    // Just to hold the session to join id
    let sessionToJoin = null;
    // tells us if the current session is full
    let startGame = false;

    // intital create session
    if( sessions.length < 1) {
        sessions.push({
            player1: socket.id,
            player2: '',
            full: false
        })
        sessionToJoin = socket.id;
    } else {
        // maps over the session to see if they are full
        sessions.map(session => {
            if (session.full === false) {
                // set player 2 to the player trying to connect
                session.player2 = socket.id;
                // set the session to be full
                session.full = true;
                // and lastly changes the the session for the currect socket to join
                sessionToJoin = session.player1;
                // tells the front end its go time
                startGame = true;
            } else {
                // if all sessions are full add a new one
                sessions.push({
                    player1: socket.id,
                    player2: '',
                    full: false
                })
                sessionToJoin = socket.id;
            }
        })
    }

    debug(sessions);
    
    // join the session specified above
    socket.join(sessionToJoin)

    debug(`User ${username} joined session ${sessionToJoin}`);

    // broadcast to the current session that someone has joined had send the username and if its time to start the game
    socket.broadcast.to(sessionToJoin).emit('user:session', username, sessionToJoin, startGame);

    return startGame;
}

module.exports = function(socket, _io) {
	io = _io;

	// handle user disconnect
	socket.on('disconnect', handleDisconnect);

	// handle user joined
	socket.on('user:joined', handleUserJoined);

}