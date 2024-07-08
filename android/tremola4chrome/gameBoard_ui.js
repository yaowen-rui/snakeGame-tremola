//gameBoard_ui.js

"use strict";

var cells = []
var clickedCell = -1
var cellColors = {}

function closeGameOverlay() {
    // Hide all game overlays and status information
    const overlays = ['levelOne_overlay', 'levelTwo_overlay', 'levelThree_overlay'];
    const statusInfos = ['statusInfoOne', 'statusInfoTwo', 'statusInfoThree'];
    const partnerInfos = ['partnerInfoOne', 'partnerInfoTwo', 'partnerInfoThree']
    overlays.forEach(id => document.getElementById(id).style.display = 'none');
    statusInfos.forEach(id => document.getElementById(id).style.display = 'none');
    partnerInfos.forEach(id => document.getElementById(id).style.display = 'none');
}

function create_gameBoard(level) {//level:levelOne,levelTwo,levelThree
    var gid = Math.floor(1000000*Math.random());
    console.log("Created game with ID: " + gid);
    closeOverlay();
    closeGameOverlay();
    prev_scenario= "game_lobby";
    setScenario("game_board");

    document.getElementById('div:game_board').style.display="block";
    document.getElementById("tremolaTitle").style.display = 'none';
    var c = document.getElementById('conversationTitle');
    c.style.display = null;

    //TODO: something wrong with create_cells function, the 3 code lines below will not be executed
    if (level === 'levelOne') {//9x9 Grid
        create_cells('levelOne_overlay', 9, gid);
        document.getElementById("statusInfoOne").style.display="block";
        document.getElementById("partnerInfoOne").style.display="block";//TODO: value should be updated when user found a match
        c.innerHTML = "<font size=+1><strong>current: Level One</strong></font>";
    } else if (level === 'levelTwo') {//11x11
        create_cells('levelTwo_overlay', 11, gid);
        document.getElementById("statusInfoTwo").style.display="block";
        document.getElementById("partnerInfoTwo").style.display="block";//TODO: value should be updated when user found a match
        c.innerHTML = "<font size=+1><strong>current: Level Two</strong></font>";
    } else if (level === 'levelThree') {//14x14
        create_cells('levelThree_overlay', 14, gid);
        document.getElementById("statusInfoThree").style.display="block";
        document.getElementById("partnerInfoThree").style.display="block";//TODO: value should be updated when user found a match
        c.innerHTML = "<font size=+1><strong>current: Level Three</strong></font>";
    } else {
        console.error('Unknown game level:', level);
    }
}

function create_cells(id, size, gid) {
    cells = []
    clickedCell = -1
    cellColors = {}
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

        const position = i;
        cellContent.onclick = () => {
            cellClick(position);
        }

        cellItem.appendChild(cellContent);
        container.appendChild(cellItem);
        cells.push(cellContent)
    }

    // Create button to submit current turn
    const button = document.createElement('button');
    button.textContent = 'Submit turn';
    button.className = 'submit-btn';
    const div =  document.getElementById('sendingButton'+containerNum)
    div.innerHTML = '';
    div.appendChild(button);
    button.onclick = () => {
        processTurn(clickedCell, size, gid);
    }
    document.getElementById(id).style.display = 'block';

    // Load current game state if GID exists, else create new game
    loadCurrentGameState(gid, size);
}

// When a cell gets clicked
function cellClick(position){
    if(clickedCell != -1){
        if(clickedCell in cellColors){
            colorCell(clickedCell, cellColors[clickedCell], true);
        }
        else{
            colorCell(clickedCell, "white", true);
        }
    }
    clickedCell = position
    colorCell(position, "black", true);
}

// Colors the cell in the desired color
function colorCell(position, color, clickedOnly){
    cells[position].style.backgroundColor = color;
    // If the flag "clickedOnly" is set, it means that the color change won't be persistent and only should indicate that the cell is currently highlighted
    if(!clickedOnly){
        cellColors[position] = color;
    }
    console.log("Set color " + color + " at position " + position);
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

function invite_partner( pid, gid) {
    closeOverlay()
    inviteUserToGame( gid, pid)
    launch_snackbar("Invited " + tremola.contacts[pid].alias)
}

function invite_partner_menu() {
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
	invHTML += "<button id='invite_btn_" + id + "' class='flat passive buttontext' style=\"height: 40px; color: red; background-image: url('img/send.svg');width: 35px;\" onclick='invite_partner(\"" + id + "\", \"" + curr_gameBoard + "\")'>&nbsp;</button>"
	invHTML += "</div></div></div>"
	document.getElementById("gameBoard_menu_invite_content").innerHTML += invHTML
}

function receive_invitation_popUp() {
    closeOverlay();
    //TODO: sender's info should be displayed in the invitation
    var bid = 100101;
    var level = 'levelOne';
    var inviteUserName = 'lily';

    var invHTML = "<div id='received_invitation_" + bid + "' class='kanban_invitation_container'>"
    invHTML += "<div class='kanban_invitation_text_container'>"
    invHTML += "<div id='received_invitation_" + bid + "_name' style='grid-area: name; padding-top: 5px; padding-left: 10px;font-size:20px'>" + level + "</div>"
    invHTML += "<div style='grid-area: author; padding-top: 2px; padding-left: 10px;font-size:15px'>From: " + inviteUserName + "</div></div>"

    invHTML += "<div style='grid-area: btns;justify-self:end;display: flex;justify-content: center;align-items: center;'>"
    invHTML += "<div style='padding-right:8px;'>"
    //invHTML += "<div style='padding-right:10px;'>"
    invHTML += "<button class='flat passive buttontext' style=\"height: 40px; background-image: url('img/checked.svg'); width: 35px;margin-right:10px;background-color: var(--passive)\" onclick='btn_invite_accept(\"" + bid + "\")'>&nbsp;</button>"//</div>"
    invHTML += "<button class='flat passive buttontext' style=\"height: 40px; color: red; background-image: url('img/cancel.svg');width: 35px;background-color: var(--passive)\" onclick='btn_invite_decline(\"" + bid + "\")'>&nbsp;</button>"
    invHTML += "</div></div></div>"

    document.getElementById("received_invitations").innerHTML += invHTML
}

function btn_invite_accept(bid) {
    // gameInviteAccept(bid, tremola.game_board[bid].pendingInvitations[myId])
    // delete tremola.game_board[bid].pendingInvitations[myId]
    document.getElementById('receive_invitation_overlay').style.display = 'none'
    launch_snackbar("Invitation accepted")

}

function btn_invite_decline(bid) {
    // gameInviteDecline(bid, tremola.game_board[bid].pendingInvitations[myId])
    // delete tremola.game_board[bid].pendingInvitations[myId]
    document.getElementById('receive_invitation_overlay').style.display = 'none'
    launch_snackbar("Invitation declined")
}

function gameOver_show_result() { //pop up when game terminated
    closeOverlay();
    document.getElementById("gameBoard_gameOver_overlay").style.display = 'initial';
    document.getElementById("overlay-bg").style.display = 'initial';

    const finalValues = getFinalValues();

    document.getElementById('winner_name').textContent = finalValues.winner_name;
    document.getElementById('partner_name').textContent = finalValues.partner_name;
    document.getElementById('partner_snake_length').textContent = finalValues.partner_snake_length;
    document.getElementById('my_snake_length').textContent = finalValues.my_snake_length;
}

function show_all_screenshots() { //in game lobby
    closeOverlay();
    document.getElementById("gameLobby-screenshots-overlay").style.display = 'initial';
    document.getElementById("overlay-bg").style.display = 'initial';
    overlayIsActive = true;

    // Get the modal
    var modal = document.getElementById('myModal');

    // Get the <span> element that closes the modal
    var span = document.getElementsByClassName('close')[0];

    // When the user clicks on <span> (x), close the modal
    span.onclick = function() {
        modal.style.display = "none";
    }

    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }
}

function showDeleteContextMenu(e, img) {

    var contextMenu = document.getElementById('delete-screenshot-menu');
    contextMenu.style.display = 'block';
    contextMenu.style.left = e.clientX + 'px';
    contextMenu.style.top = e.clientY + 'px';

    document.getElementById('delete-option').onclick = function() {
        console.log('you clicked on delete');
        img.remove();
        contextMenu.style.display = 'none';
    }

    window.onclick = function() {
        contextMenu.style.display = 'none';
    }
}

function take_screenshot() { //in game board
    //TODO: screenshot can not be saved permanently now
    closeOverlay();
    var screenshotIndex = 1;
    html2canvas(document.getElementById('div:game_board'), {useCORS: true, allowTaint: false}).then(function(canvas) {
        var imgURL = canvas.toDataURL("images/png");

        //download screenshot to local
        var imgID = 'screenshot_' + (screenshotIndex++);
        //const aDom = document.createElement('a');
        //aDom.download = imgID;
        //aDom.href = imgURL;
        // document.body.appendChild(aDom);
        // aDom.click();
        // aDom.remove();//remove created element after download

        //screenshot will be displayed in gameBoard-screenshot-overlay
        var img = document.createElement('img');
        img.src = imgURL;
        img.id = imgID;
        img.classList.add('screenshot-thumbnail');
        document.getElementById('screenshot').appendChild(img);
        //add click event to the img to open modal
        img.addEventListener('click', function() {
            document.getElementById('gameLobby-screenshots-overlay').style.display = 'none';
            var modal = document.getElementById('myModal');
            var modalImg = document.getElementById('modalImg');
            modal.style.display = 'block';
            modalImg.src = imgURL;
        })
        //add right-click event to img to show delete context menu
        img.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            console.log('img right-clicked');
            showDeleteContextMenu(e, img);
        })
    });
    launch_snackbar("screenshot took!")
}


// Loads all snake games that the current user is in
function loadSnakeGames(){
    document.getElementById('lst:game_list').innerHTML = '';
    setScenario('game_list');
    var ownId = tremola.id;
    console.log(tremola.contacts[myId].alias)
    
    for(const [key, value] of Object.entries(tremola.game_board)){
        if(value.players.includes(ownId)){
            displayGame(value);
        }
    }
}

// Displays a snake game as a clickable button with the relevant information
function displayGame(game){
    var gid = game.key;
    var board = tremola.game_board[gid];
    var p0 = board.player0 != null ? tremola.contacts[board.player0].alias : "Nobody";
    var p1 = board.player1 != null ? tremola.contacts[board.player1].alias : "Nobody";
    var turn = board.currentPlayer == 0 ? p0 != "Nobody" ? p0 : "You need to invite an opponent first!" : p1 != "Nobody" ? p1 : "You need to invite an opponent first!";
    console.log("Found game with ID: " + gid + "!");
    var entryHTML = "<div class='w100' style='padding: 5px 5px 5px;'>";
        entryHTML += "<button class='game-list-entry' onclick='openGame(" + gid + ")'; style='display: table;float:right;overflow: hidden; width: calc(100% - 4.4em); margin-right:10px'>"; //TODO: add style for class
        entryHTML += "Game ID: " + gid + " | Players: " + p0 + " vs " + p1 + " | Current turn: " + turn
        entryHTML += "</button></div>";

    document.getElementById('lst:game_list').innerHTML += entryHTML;
}

// Opens the ongoing game
function openGame(gid){
    setScenario('game_board');
    var board = tremola.game_board[gid];
    var size = board.size;
    var id = "";
    switch (size){
        case '9': id = "levelOne_overlay"; break;
        case '11': id = "levelTwo_overlay"; break;
        case '14': id = "levelThree_overlay"; break;
    }
    console.log(id);
    console.log(size)
    create_cells(id, size, gid);

}