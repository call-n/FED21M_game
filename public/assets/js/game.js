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
    // keep track of the y
    let i = 1;

    socket.emit('user:startgame', (status) => {

        console.log(status)
        if (status.success) {
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

        let cords = document.querySelector(`[data-y="${status.y}"] [data-x="${status.x}"]`);

        setTimeout(() => {
            var start = Date.now();

            cords.addEventListener('click', e => {
                var reactionTime = Date.now() - start;

                console.log(reactionTime)
                
            })
            cords.classList.add('ronavirus')
        }, status.time)
        }
    });
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