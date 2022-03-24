const debug = require('debug')('chat:socket_controller');

let io = null; // socket.io server instance
var sessions = [] // Array for storage of sessions

/**
 * Function for the creation of session
 * Flow {
 *  checks if there is any sessions if no create
 *  - checks if there is a session available for join if so, join
 *  - else create a new one
 * }
 */
const createSession = function(socket, username) {

    // Just to hold the session to join id
    let sessionToJoin = null;
    // tells us if the current session is full
    let startGame = false;

    // intital create session
    if( sessions.length < 1) {
        sessions.push({
            id: socket.id,
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
                console.log('session joiner')
                // set username for player 2
                session.p2username = username;
                // set player 2 to the player trying to connect
                session.player2 = socket.id;
                // set the session to be full
                session.full = true;
                // and lastly changes the the session for the currect socket to join
                sessionToJoin = session.id;
                // tells the front end its go time
                startGame = true;
            } 
        })
        /* this just checks if its go time 
        and if its still false we know that there is no session to join.
        */
        if ( !startGame ) {
            console.log('session creater')
            // if all sessions are full add a new one
            sessions.push({
                id: socket.id,
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

/**
 * Function for the user connection
 * Flow {
 *  ask for a session and gets back if we should start the game
 *  Broadcast the data we need for frontend
 * }
 */
const handleUserJoined = function(username, callback) {
    
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

/**
 * Function for the user disconnection
 * Flow {
 *  checks if there is any sessions if no create
 *  - checks if there is a session available for join if so, join
 *  - else create a new one
 * }
 */
// Variables for handleDisconnect
let playerDisconnected;
let theSession = false;
const handleDisconnect = function() {
	debug(`Client ${this.id} disconnected :(`);

    // need to find the session with this.id and then tell erase them
    if (sessions.find(s => s.player1 === this.id)){
        // finds the session player disconnected from
        theSession = sessions.find(s => s.player1 === this.id)
        // holds who the disconnected player is
        playerDisconnected = theSession.p1username;
        // this is just an identifier so we know if we should delete current session
        theSession.player1 = '';
        console.log("player1 dissconnected in ", theSession)
        // this is to delete the current session if both left
        if(theSession.player2 === ''){
            sessions = sessions.filter(s => s.id !== theSession.id)
            console.log(sessions)
        }
    }

    // this does exactly the same as above except its player 2
    if (sessions.find(s => s.player2 === this.id)){
        theSession = sessions.find(s => s.player2 === this.id)
        playerDisconnected = theSession.p2username;
        theSession.player2 = '';
        console.log("player2 dissconnected in ", theSession)
        if(theSession.player1 === ''){
            sessions = sessions.filter(s => s.id !== theSession.id)
            console.log(sessions)
        }
    }

    // this only work if one of the above has ran, just to confirm
    if(theSession.id){
        io.in(theSession.id).emit('user:disconnect', playerDisconnected)
    }
}

/**
 * Function for the Handling of the game
 * Flow {
 *  checks if both users have come to the initial start of the game
 *  Generates the x and y cordinates and the time we want to delay before we show
 *  Structure the data in a object for frontend use
 *  return the "checker if both player" to false for later use
 * }
 */
// this is variables for all functions below, Keeper of player. Muy importante
let p1here = false;
let p2here = false;
const handleGame = function(session, player) {
    
    const theSesh = sessions.find(s => s.id === session)

    if ( theSesh.player1 === player) {
        p1here = true;
        console.log('player 1 has arrived in handlegame')
    }
    if ( theSesh.player2 === player ){
        p2here = true;
        console.log('player 2 has arrived in handlegame')
    }

    if( !p1here && p2here || p1here && !p2here ){
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


/**
 * Function for the Handling of the game
 * Flow {
 *  checks if both users have come to the initial start of the game
 *  Checks who won and the reaction time of each player
 *  structre object with data for frontend use
 * }
 */
// this is just holder variables for the function below, dont ask my why.
let compareReaction;
let winner;
let keepPlaying;
let p1react;
let p2react;
const handleGamePoint = function(reactionTime, player, session) {
    // todo: wait until both players has finished and make sure they are in the same game.
    // find the match session object
    const theSesh = sessions.find(s => s.id === session)

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

    // check reaction time of each player
    theSesh.player1 === player ? p1react = reactionTime : p2react = reactionTime;


    // add 1 to the rounds
    theSesh.rounds++;

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

    p1here = false;
    p2here = false;

    io.in(session).emit('game:result', winner, points, keepPlaying, session)
}


/**
 * Function for the Handling of the end sequence
 * Flow {
 *  Find match, who won? and tell
 * }
 */
let winnerGame;
const handleEndGame = function(session) {
   
    // find the match session object
    const theSesh = sessions.find(s => s.id === session)

    if( theSesh.p1wins > theSesh.p2wins ) {
        winnerGame = theSesh.player1;
    } else {
        winnerGame = theSesh.player2;
    }

    io.in(session).emit('game:endresult', winnerGame, session)
}


/**
 * Function for the Handling of the restart of game
 * Flow {
 *  Find session
 *  check if both players got here
 *  if so reset all points and rounds and tell frontend its go time again
 * }
 */
const handleRestart = function(session, player) {
    const theSesh = sessions.find(s => s.id === session)

    if ( theSesh.player1 === player) {
        p1here = true;
        console.log('player 1 has arrived in restart')
    }
    if ( theSesh.player2 === player ){
        p2here = true;
        console.log('player 2 has arrived in restart')
    }

    if( !p1here && p2here || p1here && !p2here ){
        return;
    }
    console.log('restared game from server')

    // this is just to reset the currect game if both want to keep playing
    theSesh.p1wins = 0;
    theSesh.p2wins = 0;
    theSesh.rounds = 0;

    p1here = false;
    p2here = false;

    io.in(session).emit('game:restarted', session)
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

    //handle the end sequence for the game
    socket.on('game:end', handleEndGame)

    // handle the restart of a game
    socket.on('game:restart', handleRestart)
}