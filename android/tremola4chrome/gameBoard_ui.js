//gameBoard_ui.js

"use strict";
function closeGameOverlay() {
    // Hide all game overlays and status information
    const overlays = ['levelOne_overlay', 'levelTwo_overlay', 'levelThree_overlay'];
    const statusInfos = ['statusInfoOne', 'statusInfoTwo', 'statusInfoThree'];

    overlays.forEach(id => document.getElementById(id).style.display = 'none');
    statusInfos.forEach(id => document.getElementById(id).style.display = 'none');
}

function create_gameBoard(level) {//level:levelOne,levelTwo,levelThree
    closeOverlay();
    closeGameOverlay();
    prev_scenario= "game_lobby";
    setScenario("game_board");

    document.getElementById('div:game_board').style.display="block";
    document.getElementById("tremolaTitle").style.display = 'none';
    var c = document.getElementById("conversationTitle");
    c.style.display = null;

    if (level === 'levelOne') {//9x9 Grid
        create_cells('levelOne_overlay', 9);
        document.getElementById("statusInfoOne").style.display="block";
        c.innerHTML = "<font size=+1><strong>current: Level One</strong></font>";
    } else if (level === 'levelTwo') {//11x11
        create_cells('levelTwo_overlay', 11);
        document.getElementById("statusInfoTwo").style.display="block";
        c.innerHTML = "<font size=+1><strong>current: Level Two</strong></font>";
    } else if (level === 'levelThree') {//14x14
        create_cells('levelThree_overlay', 14);
        document.getElementById("statusInfoThree").style.display="block";
        c.innerHTML = "<font size=+1><strong>current: Level Three</strong></font>";
    } else {
        console.error('Unknown game level:', level);
    }
}

function create_cells(id, size) {
    var containerNum;
    if( size == 9 ) {
        containerNum='One';
    } else if ( size == 11){
        containerNum='Two';
    } else {
        containerNum = 'Three';
    }
    const container = document.getElementById('cellContainer'+containerNum);
    container.innerHTML = ''; // Clear any existing grid items

    container.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    container.style.gridTemplateRows = `repeat(${size}, 1fr)`;
    //create x*x single cells
    for (var i = 0; i < size*size; i++) {
        const cellItem = document.createElement("div");
        cellItem.classList.add('cell-item');

        const cellContent = document.createElement("div");
        cellContent.classList.add('cell-content');
        cellContent.onclick = () => {
            //TODO: game logic
            cellContent.style.backgroundColor = 'pink';
        }

        cellItem.appendChild(cellContent);
        container.appendChild(cellItem);
    }
    document.getElementById(id).style.display = 'block';
}

function show_game_manual() { //in game lobby
    closeOverlay();
    document.getElementById("gameLobby-manual-overlay").style.display = 'initial';
    document.getElementById("overlay-bg").style.display = 'initial';
    overlayIsActive = true;
}

function show_my_achievement() {//in game lobby
    closeOverlay();
    document.getElementById("gameLobby-achievement-overlay").style.display = 'initial';
    document.getElementById("overlay-bg").style.display = 'initial';
    overlayIsActive = true;

    //TODO: data will be changed if we have the real data
    const data = [
        { id: 1, date: '02-07-2024', score: 12, level: 1, name: 'Sam' },
        { id: 2, date: '02-07-2024', score: 11, level: 2, name: 'Sam' },
        { id: 3, date: '02-07-2024', score: 12, level: 1, name: 'Sam' },
        { id: 4, date: '02-07-2024', score: 12, level: 1, name: 'Sam' },
        { id: 5, date: '02-07-2024', score: 12, level: 1, name: 'Sam' },
        { id: 6, date: '02-07-2024', score: 12, level: 1, name: 'Sam' }
    ];

    const tableBody = document.getElementById('myAchievementTableBody');
    tableBody.innerHTML='';

    data.forEach((item, index) => {
        const row = document.createElement('tr');
        if (index === 0) {
            row.classList.add('active-row');
        }
        row.innerHTML = `
            <td>${item.id}</td>
            <td>${item.date}</td>
            <td>${item.score}</td>
            <td>${item.level}</td>
            <td>${item.name}</td>
        `;
        tableBody.appendChild(row);
    });
}

function show_game_history() {//in game lobby
    closeOverlay();
    document.getElementById("gameLobby-history-overlay").style.display = 'initial';
    document.getElementById("overlay-bg").style.display = 'initial';
    overlayIsActive = true;
    //TODO: get data from game play and update table
    //gameID, time, winner, snake length, level number, partner, game status
}

function leave_curr_game() {
    closeOverlay();
    // if (tremola.game_board[curr_gameBoard].flags.includes(GAME_FLAG.FINISHED)) {
    //     setScenario('game_lobby');
    //     return
    // }
    // if (tremola.game_board[curr_gameBoard].flags.includes(GAME_FLAG.UNMATCHED)) {
    //     setScenario('game_lobby');
    //     return
    // }
    // if (tremola.game_board[curr_gameBoard].flags.includes(GAME_FLAG.ONGOING)) {
        const userConfirmed = confirm("Game is ongoing, Do you really want to leave?")
        if(userConfirmed) {
            //leave_game(curr_gameBoard)
            setScenario('game_lobby')
        } else {
            launch_snackbar("You chose to stay in the game :)");
        }
    //}

}

function unmatch_curr_partner() {
    closeOverlay();
    if (tremola.game_board[curr_gameBoard].flags.includes(GAME_FLAG.MATCHED)) {
        const userConfirmed = confirm("Do you really want to unmatch your current partner?")
        if(userConfirmed) {
            unmatch_partner(curr_gameBoard);
        } else {
            launch_snackbar("You chose to keep the current partner :)");
        }
    }
}

function play_again_with_curr_partner() {
    closeOverlay();
    if (tremola.game_board[curr_gameBoard].flags.includes(GAME_FLAG.FINISHED)) {
        restart_game();
    }
    launch_snackbar("cannot restart the game!")
}

function invite_partner() {
    closeOverlay()
    document.getElementById("div:gameBoard_invite_menu").style.display = 'initial';
    document.getElementById("overlay-bg").style.display = 'initial';
	
	document.getElementById("gameBoard_menu_invite_content").innerHTML = ''
	for (var c in tremola.contacts) {
        partner_invite_create_entry(c)
    }
}

function partner_invite_create_entry(id) {
    if (document.getElementById("div:gameBoard_invite_menu").style.display == 'none')
        return
	var invHTML = "	<div id='invite_" + id + "' class='kanban_invitation_container light' style='width:95%; margin: 5px 0px 7px 5px;' >"
    invHTML += "<div class='kanban_invitation_text_container' >"
    invHTML += "<div style='grid-area: name; padding-top: 5px; padding-left: 10px;font-size:15px'>" + tremola.contacts[id].alias + "</div>"
	invHTML += "<div id='invite_author_" + id + "' style='grid-area: author; padding-top: 2px; padding-left: 10px;font-size:8px'></div></div>"
    invHTML += "<div style='grid-area: btns;justify-self:end;display: flex;justify-content: center;align-items: center;'>"
    invHTML += "<div style='padding-right:8px;'>"
	invHTML += "<button id='invite_btn_" + id + "' class='flat passive buttontext' style=\"height: 40px; color: red; background-image: url('img/send.svg');width: 35px;\" >&nbsp;</button>"
	invHTML += "</div></div></div>"
	document.getElementById("gameBoard_menu_invite_content").innerHTML += invHTML
}

function gameOver_show_result() {
    closeOverlay();
    document.getElementById("gameBoard_gameOver_overlay").style.display = 'initial';
    document.getElementById("overlay-bg").style.display = 'initial';

    const winnerNameElement = document.getElementById('winner_name');
    const winnerSnakeLengthElement = document.getElementById('winner_snake_length');
    const mySnakeLengthElement = document.getElementById('my_snake_length');

    //the real values should be changed later
    const name = 'sam';
    const winnerLength = 15;
    const myLength = 8;

    winnerNameElement.textContent = `WINNER: ${name}`;
    winnerSnakeLengthElement.textContent = `Winner's snake length: ${winnerLength}`;
    mySnakeLengthElement.textContent = `My snake length: ${myLength}`;
}