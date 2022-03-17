const socket = io();

const startEl = document.querySelector('#start');
const gameWrapperEl = document.querySelector('#game-wrapper');
const usernameForm = document.querySelector('#username-form');
const gameboardEl = document.querySelector('#game-board');
const waitingEl = document.querySelector('#waiting');
const scoreEl = document.querySelector('#score')

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

const renderGame = (session, player) => {
    // hide the wating view
    waitingEl.classList.add('hide')
    // show the game view
    gameWrapperEl.classList.remove('hide');
    // tell the server its time to generate a game
    socket.emit('user:startgame', session, player);
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
        renderGame(session, username);
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

                cords.classList.remove('ronavirus')
                cords.classList.add('killedvirus')

                socket.emit('game:point', reactionTime, socket.id, data.session)
            })
            cords.classList.add('ronavirus')
        }, data.time)
    }
});

const score1 = 0;
const score2 = 0; 
socket.on('game:result', (player) => {
    if( socket.id === player ){
        scoreEl.innerHTML = `
                <span class="you">${score1 + 1}</span>
                -
                <span>${score2}</span>
            `
        alert('u won');
    } else {
        scoreEl.innerHTML = `
                <span class="you">${score2}</span>
                -
                <span>${score1 + 1}</span>
            `
        alert('u lost');
    }
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