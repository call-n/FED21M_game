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

const createSession = function(socket, username) {

    // Just to hold the session to join id
    let sessionToJoin = null;
    // tells us if the current session is full
    let startGame = false;

    // intital create session
    if( sessions.length < 1) {
        sessions.push({
            p1username: username,
            player1: socket.id,
            p2username: '',
            player2: '',
            full: false,
            p1wins: 0,
            p2wins: 0,
            rounds: 0,
        })
        sessionToJoin = socket.id;
    } else {
        // maps over the session to see if they are full
        sessions.map(session => {
            if (session.full === false) {
                // set username for player 2
                session.p2username = username;
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
                    p1username: username,
                    player1: socket.id,
                    p2username: '',
                    player2: '',
                    full: false,
                    p1wins: 0,
                    p2wins: 0,
                    rounds: 0,
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
    io.in(sessionToJoin).emit('user:session', username, sessionToJoin, startGame);

    return {
        start: startGame,
        session: sessionToJoin,
        player: socket.id
    };
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
        start: startGame.start,
        session: startGame.session,
        player: startGame.player
    });
}

let p1here = false;
let p2here = false;
const handleGame = function(session, player) {
    
    const theSesh = sessions.find(s => s.player1 === session)

    if ( theSesh.player1 === player) {
        p1here = true;
        console.log('player 1 has arrived')
    }
    if ( theSesh.player2 === player ){
        p2here = true;
        console.log('player 2 has arrived')
    }

    if( !p1here && !p2here ){
        return;
    }

    // todo: generate random cords between 1,15 and 1,10
    const y = Math.floor(Math.random() * 10) + 1;
    const x = Math.floor(Math.random() * 15) + 1;

    // todo: generate random time between 1 and 5
    const time = Math.floor(Math.random() * 4000) + 1;

    const data = {
        success: true,
        session,
        y: y,
        x: x,
        time: time
    }

    p1here = false;
    p2here = false;

    io.in(session).emit('game:success', data)
}

let compareReaction;
let winner;
let keepPlaying;
let p1react;
let p2react;
const handleGamePoint = function(reactionTime, player, session) {
    // todo: wait until both players has finished and make sure they are in the same game.
    // find the match session object
    const theSesh = sessions.find(s => s.player1 === session)

    if ( theSesh.player1 === player) {
        p1here = true;
        console.log('player 1 has arrived in gamepoint')
    }
    if ( theSesh.player2 === player ){
        p2here = true;
        console.log('player 2 has arrived in gamepoint')
    }

    if( !p1here && p2here || p1here && !p2here ){
        compareReaction = {
            reactionTime, 
            player
        };
        return;
    }

    // set the players reactiontimes for frontend use
    theSesh.player1 === compareReaction.player ? p1react = compareReaction.reactionTime : p2react = compareReaction.reactionTime;

    theSesh.player1 === player ? p1react = reactionTime : p2react = reactionTime;


    // add 1 to the rounds
    theSesh.rounds++;
    console.log(theSesh.rounds)

    // todo: compate the two reaction times and store the point in the same session for the winning player
    compareReaction.reactionTime > reactionTime ? winner = player : winner = compareReaction.player

    theSesh.player1 === winner ? theSesh.p1wins++ : theSesh.p2wins++;

    if( theSesh.rounds === 10 ){
        keepPlaying = false;
    } else {
        keepPlaying = true
    }

    const points = {
        p1name: theSesh.p1username,
        player1: theSesh.player1,
        player1points: theSesh.p1wins,
        p1react: p1react,
        p2name: theSesh.p2username,
        player2: theSesh.player2,
        player2points: theSesh.p2wins,
        p2react: p2react
    }

    io.in(session).emit('game:result', winner, points, keepPlaying, session)
}

module.exports = function(socket, _io) {
	io = _io;

	// handle user disconnect
	socket.on('disconnect', handleDisconnect);

	// handle user joined
	socket.on('user:joined', handleUserJoined);

    //handle game start
    socket.on('user:startgame', handleGame)

    //determine who the score goes to and update it on the frontend
    socket.on('game:point', handleGamePoint)

}