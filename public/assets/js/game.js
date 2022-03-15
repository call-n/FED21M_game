const socket = io();

const startEl = document.querySelector('#start');
const gameWrapperEl = document.querySelector('#game-wrapper');
const usernameForm = document.querySelector('#username-form');
const gameboardEl = document.querySelector('#game-board');
const waitingEl = document.querySelector('#waiting');

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

const renderGame = () => {
    // hide the wating view
    waitingEl.classList.add('hide')
    // show the game view
    gameWrapperEl.classList.remove('hide');

    // render the gameboard
    gameboardEl.innerHTML = gameboard.map(y => 
        `<div class="row">
        ${
            y.map(x => 
                `<div class="col" data-x="${x}">
                    ${x}
                </div>`
            ).join('')
        }
        </div>`
    ).join('')
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
        renderGame();
    }
});

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
            } else {
                // render the game
                renderGame();
            }
		}
	});
});