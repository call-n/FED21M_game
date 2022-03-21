const socket = io();

const startEl = document.querySelector('#start');
const gameWrapperEl = document.querySelector('#game-wrapper');
const usernameForm = document.querySelector('#username-form');
const gameboardEl = document.querySelector('#game-board');
const waitingEl = document.querySelector('#waiting');
const scoreEl = document.querySelector('#score');
const reactionEl = document.querySelector('#reaction');
const timerEl = document.querySelector('#timer');
const endgameEl = document.querySelector('#endgame');
const endgametextEl = document.querySelector('#endgametext');
const playagainEl = document.querySelector('#playagain');

const gameboard = [
    [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
    [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
    [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
    [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
    [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
    [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
    [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
    [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
    [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
    [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
]

const renderGame = (session) => {
    // hide the wating view
    waitingEl.classList.add('hide')
    // show the game view
    gameWrapperEl.classList.remove('hide');
    // tell the server its time to generate a game
    socket.emit('user:startgame', session, socket.id);
}

socket.on('user:connected', (username) => {
	console.log(`${username} connected 🥳`);
});

socket.on('user:disconnected', (username) => {
	console.log(`${username} disconnected 😢`);
});

socket.on('user:session', (username, session, startGame) => {
	console.log(`${username} joined session ${session}`);

    if( startGame ){
        renderGame(session);
    }
});

socket.on('game:success', data => {
   
    // keep track of the y
    let i = 1;

    if (data.success) {
        // render the gameboard
        gameboardEl.innerHTML = gameboard.map(y => 
            `<div class="row" data-y="${i}">
            ${i++,
                y.map(x => 
                    `<div class="col" data-x="${x}">
                        
                    </div>`
                ).join('')
            }
            </div>`
        ).join('')

        // get the requested div with the cords from server
        let cords = document.querySelector(`[data-y="${data.y}"] [data-x="${data.x}"]`);

        // set a timeout for how long we should wait before displaying the virus for the users acording to the server
        setTimeout(() => {
            var start = Date.now();

            cords.addEventListener('click', e => {
                var reactionTime = Date.now() - start;
                clicked = true;

                cords.classList.remove('ronavirus')
                cords.classList.add('killedvirus')

                socket.emit('game:point', reactionTime, socket.id, data.session)
            })

            cords.classList.add('ronavirus')
        }, data.time)
    }
});

socket.on('game:result', (winner, points, keepPlaying, session) => {
    console.log(points)
    if(points.player1 === socket.id ){
        scoreEl.innerHTML = `
        <span>${points.player1points}</span>
        -
        <span>${points.player2points}</span>
        `
        timerEl.innerHTML = ''
        reactionEl.innerHTML = `
        <span>${points.p1name} - ${points.p1react}</span>
        <br>
        <span>${points.p2name} - ${points.p2react}</span>
        `
    } else {
        scoreEl.innerHTML = `
        <span>${points.player2points}</span>
        -
        <span>${points.player1points}</span>
        `
        timerEl.innerHTML = ''
        reactionEl.innerHTML = `
            <span>${points.p2name} - ${points.p2react}</span>
            <br>
            <span>${points.p1name} - ${points.p1react}</span>
        `
    }
    if ( keepPlaying ) {
        winner === socket.id ? console.log('du vann') : console.log('loser L')
        setTimeout(() => {
            console.log('new round')
            renderGame(session);
        }, 2000)
    } else {
        console.log('slut')
        socket.emit('game:end', session, socket.id);
    }
})

socket.on('game:endresult', (winnerGame, session) => {
    if( winnerGame === socket.id ){
        endgameEl.classList.remove('hide')
        endgametextEl.innerHTML = `
        <div class="alert alert-info">WINNER WINNER CHICKEN DINNER</div>
        `;
    } else {
        endgameEl.classList.remove('hide')
        endgametextEl.innerHTML = `
        <div class="alert alert-danger">lol, u lost xd</div>
        `;
    }

    playagainEl.addEventListener('click', () => {
        // reset the score
        scoreEl.innerHTML = `
        <span>0</span>
        -
        <span>0</span>
        `;
        // reset reaction time
        reactionEl.innerHTML = '';
        waitingEl.classList.remove('hide')
        endgameEl.classList.add('hide')
        socket.emit('game:restart', session, socket.id);
    })
})

socket.on('game:restarted', (session) => {
    console.log("game restarded")
    renderGame(session);
})

usernameForm.addEventListener('submit', e => {
	e.preventDefault();

	username = usernameForm.username.value;

	socket.emit('user:joined', username, (status) => {
		// we've received acknowledgement from the server
		console.log("Server acknowledged that user joined", status);

		if (status.success) {
			// hide start view
			startEl.classList.add('hide');

            // show wating for players
            if( !status.start) {
                waitingEl.classList.remove('hide')
            }
		}
	});
});