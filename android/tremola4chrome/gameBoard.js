//gameBoard.js

"use strict";

var curr_gameBoard;
var displayedFinish = false;
var game_interrupted = false;
var game_began = false;
var game_unmatched = false;

const GAME_FLAG = {
    UNMATCHED: 'no_partner_yet',
    MATCHED: 'partner_matched_game_not_start',
    ONGOING : 'ongoing',
    FINISHED: 'finished',
    INTERRUPTED : 'interrupted'
}

// Defined operations
const snakeOperation = {
    GAME_CREATE: 'game/create',
    GAME_FINISH: 'game/finish',
    SET_CELL: 'game/cell',
    CHANGE_COLOR: 'game/color',
    INVITE: 'invite',
    //INVITE_ACCEPT: 'invite/accept',
    //INVITE_DECLINE: 'invite/decline',
    LEAVE: 'leave',
    UNMATCH : 'unmatch',
}

// Gets called after a cell gets clicked
function processTurn(position, size, gid) {
    var board = tremola.game_board[gid];
    if(board.currentPlayer == 0){
        if(!(board.player0 == tremola.id)){
            alert("It's not your turn currently!");
            return;
        }
    }
    else if(!(board.player1 == tremola.id)){
        alert("It's not your turn currently!");
        return;
    }
    if(position == -1){
        alert("You need to select a cell first!");
        return;
    }
    var size = board.size;
    var id = "";
    switch (size){
        case '9': id = "One"; break;
        case '11': id = "Two"; break;
        case '14': id = "Three"; break;
    }
    var currentTurn = Number(document.getElementById("statusInfo_level" + id).textContent);
    if(currentTurn != board.turnNumber){
        alert("You can only play your turn if you're viewing the current game state!")
        return;
    }

    var snake = board.currentPlayer == 0 ? board.snake0 : board.snake1;
    console.log("Current snake: " + snake)
    // If position is valid, set cell
    if(validPosition(position, size, snake, gid)){
        var data = {
            'gid' : gid,
            'op' : snakeOperation.SET_CELL,
            'args' : position,
            'prev' : tremola.game_board[gid].currPrev
        };
        snakeSendToBackend(data);
    }
}

// Checks if position is valid
function validPosition(position, size, currentSnake, gid){
    var board = tremola.game_board[gid];

    // Checks if the cell is already part of the opponents snake (must be checked first in case they were first)
    var opponentSnake = board.currentPlayer == 0 ? board.snake1 : board.snake0;
    if(opponentSnake.includes(position)){
        alert("Clicked cell already part of opponent snake!");
        return false;
    }

    // First cell
    if(currentSnake.length == 0){
        board.flags = GAME_FLAG.ONGOING // First time someone sets their head, set flag from "matched" to "ongoing" at latest now
        return true;
    }
    // Checks if the cell is already part of the own snake
    if(currentSnake.includes(position)){
        alert("Clicked cell already part of own snake!");
        return false;
    }

    //Checks if the cell is adjacent to the head
    var currentX = returnX(position, size);
    var currentY = returnY(position, size);

    var head = board.currentPlayer == 0 ? board.snakeHead0 : board.snakeHead1;
    console.log("Head: " + head);
    var headX = returnX(head, size);
    var headY = returnY(head, size);
    if(currentX == headX - 1  && currentY == headY || // x - 1
        currentX == headX + 1 && currentY == headY || // x + 1
        currentY == headY - 1 && currentX == headX || // y - 1
        currentY == headY + 1 && currentX == headX){  // y + 1
        return true;
    }
    alert("Current position not adjacent to head!");
    return false;
}

// Checks if there are any available cells left to extend the snake to
function checkIfValidTurnAvailable(gid){
    console.log("Checking if there are valid turns left...");
    var board = tremola.game_board[gid];
    var size = Number(board.size);
    var head0 = Number(board.snakeHead0);
    var markedCells = board.snake0.concat(board.snake1);
    var lost0 = false;
    if((markedCells.includes(head0 - 1) || head0 % size == 0) &&                   // x - 1 and if cell at left wall
        (markedCells.includes(head0 + 1) || head0 % size == size - 1) &&           // x + 1 and if cell at right wall
        (markedCells.includes(head0 - size) || head0 - size < 0) &&                // y - 1 and if cell at top wall
        (markedCells.includes(head0 + size) || head0 + size > size*size - 1)){     // y + 1 and if cell at bottom wall
        lost0 = true;
    }
    var head1 = Number(board.snakeHead1);
    var lost1 = false;
    if((markedCells.includes(head1 - 1) || head1 % size == 0) &&                   // x - 1 and if cell at left wall
        (markedCells.includes(head1 + 1) || head1 % size == size - 1) &&           // x + 1 and if cell at right wall
        (markedCells.includes(head1 - size) || head1 - size < 0) &&                // y - 1 and if cell at top wall
        (markedCells.includes(head1 + size) || head1 + size > size*size - 1)){     // y + 1 and if cell at bottom wall
        lost1 = true;
    }
    var p0 = board.player0 != null ? tremola.contacts[board.player0].alias : "Nobody";
    var p1 = board.player1 != null ? tremola.contacts[board.player1].alias : "Nobody";
    if(lost0 && lost1){
        alert("Both players have no moves left, it's a draw!")
        finishGame(gid, "draw");
    }
    else if(lost0){
        alert("Player " + p0 + " has no more moves left, " + p1 + " has won the game!");
        finishGame(gid, p1);
    }
    else if(lost1){
        alert("Player " + p1 + " has no more moves left, " + p0 + " has won the game!");
        finishGame(gid, p0);
    }
}

// Sends data to the backend
function snakeSendToBackend(data){
    var gid = data['gid'] != null ? data['gid'] : "null";
    var prevs = data['prev'] != null ? btoa(data['prev'].map(btoa)) : "null";
    var op = data['op'];
    var args = data['args'];
    var to_backend = ['snake', gid, prevs, op, args];
    backend(to_backend.join(" "));
}

// Called when new event happens
function snakeNewEvent(e){
    var op = e.public[3];
    var gid = e.public[1]
    var prev = e.public[2] != "null" ? e.public[2] : [];
    var args = (e.public[4]).split('//');

    // Add new entry if new board
    if(!(gid in tremola.game_board)) {
        tremola.game_board[gid] = { // TODO: extend and only keep necessary fields
            "key": gid.toString(),
            "size": args[0],
            "operations": {}, // all received operations for this board
            "sortedOperations": new Timeline(), // sorted list of operations
            "players": [e.header.fid], // all players
            "currPrev": [], // prev pointer
            "currentPlayer": 0, // Current player
            "player0": args[1], // Player 0 ID
            "player1": null, // Player 1 ID
            "colorSnake0": "DeepSkyBlue", // Colors for now predefined, chosen randomly, will change for sure
            "colorHead0": "DarkBlue",
            "colorSnake1": null,
            "colorHead1": null,
            "colorScheme0": "Blue",
            "colorScheme1": null,
            "snake0": [], // Player 0 snake
            "snakeHead0": -1, // Player 0 snake head
            "snake1": [], // Player 0 snake
            "snakeHead1": -1, // Player 0 snake head
            "flags": GAME_FLAG.UNMATCHED,
            "winner": "",
            "turns": {}, // Saves turns done during this game
            "turnNumber": 0
        };
    }

    var board = tremola.game_board[gid]

    // deserialize ScuttleSort-Timeline
    if (!(board.sortedOperations instanceof Timeline)) {
        board.sortedOperations = Timeline.fromJSON(board.sortedOperations);
    }

    if (e.header.ref in board.operations)
        return;

    if (op === snakeOperation.INVITE){
        addPartner(gid, args[0])
    }

    if (op === snakeOperation.CHANGE_COLOR){
        changeColor(gid, args[0], args[1]);
    }
    // Store operation
    var body = {
        'gid': gid,
        'cmd': [op].concat(args),
        'prev': prev
    };
    var p = {"key": e.header.ref, "fid": e.header.fid, "fid_seq": e.header.seq, "body": body, "when": e.header.tst};
    board["operations"][e.header.ref] = p;

    if ( op == snakeOperation.SET_CELL && gid == curr_gameBoard){
        board.turns[board.turnNumber + 1] = args[0];
        board.turnNumber++;
        console.log(board.turns);
        addCellToSnake(args[0], gid)
        displayToTurn(gid, board.turnNumber);
        checkIfValidTurnAvailable(gid)
    }

    board.sortedOperations.add(e.header.ref, prev);

    board.currPrev = board.sortedOperations.get_tips();


}

// Creates a new game with given size and sets own id as player 0
function createGame(gid, size){
    var data = {
        'gid' : gid,
        'op' : snakeOperation.GAME_CREATE,
        'args' : size + "//" + tremola.id,
        'prev' : null
    };
    snakeSendToBackend(data);
}

// Finishes a game
function finishGame(gid, winner){
    var board = tremola.game_board[gid];
    board.flags = GAME_FLAG.FINISHED
    board.winner = winner;
    var data = {
        'gid' : gid,
        'op' : snakeOperation.GAME_FINISH,
        'args' : winner,
        'prev' : board.currPrev
    };
    snakeSendToBackend(data);
}

//leave the game midway, attention: the interrupted game, it's info will not be displayed in myAchievement and history
// interrupted game will not be displayed on ongoing game list
function interrupt_game(gid) {
    var board = tremola.game_board[gid];
    if (board.flags === GAME_FLAG.UNMATCHED) {
        alert("You are not matched, you can go back to game lobby")
        setScenario("game_lobby")
    }
    board.flags = GAME_FLAG.INTERRUPTED
    board.winner = "interrupted";
    var data = {
        'gid' : gid,
        'op' : snakeOperation.LEAVE,
        'args' : gid,
        'prev' : board.currPrev
    }
    snakeSendToBackend(data);
}

function replay_game(gid) {//TODO: need to be tested
    if(gid != null) {
        var board = tremola.game_board[gid];
        var size = board.size;
        var partnerId = board.player0 === tremola.id ? board.player1 : board.player0
        var overlayId = '';
        var new_gid;
        overlayId = (size === 9) ? "levelOne_overlay" :
            (size === 11) ? "levelTwo_overlay" :
                "levelThree_overlay";

        new_gid =  Math.floor(1000000*Math.random());
        currentGid = gid
        console.log(" replay: created new game with GID: " + gid);

        create_gameBoard(size, new_gid)
        inviteUserToGame(new_gid, partnerId);
    }
}
function unmatch(gid, pid) {
    var board = tremola.game_board[gid];
    board.players.filter(id => id === tremola.id);
    if (pid === board.player0) {
        tremola.id === board.player0 ? board.player1 = null : board.player0 = null
    } else if( pid === board.player1) {
        tremola.id === board.player1 ? board.player0 = null : board.player1 = null
    }
    loadCurrentGameState(gid, board.size)
}

function unmatch_partner(gid, pid) {//pid:partnerId
    var board = tremola.game_board[gid];
    if (game_began === true) {
        alert("Game began! To late to unmatch with your current player!")
        return;
    }
    if ( board.flags === GAME_FLAG.UNMATCHED) {
        alert("You are unmatched !")
        return;
    }
    setScenario("game_main");
    board.flags = GAME_FLAG.UNMATCHED
    board.players.filter(id => id === tremola.id);
    if (pid === board.player0) {
        tremola.id === board.player0 ? board.player1 = null : board.player0 = null
    } else if( pid === board.player1) {
        tremola.id === board.player1 ? board.player0 = null : board.player1 = null
    }

    var data = {
        'gid' : gid,
        'op' : snakeOperation.UNMATCH,
        'args' : gid + "//" + pid,
        'prev' : board.currPrev
    }
    snakeSendToBackend(data);
    loadCurrentGameState(gid, board.size)
    console.log("unmatch the current player")
}

// Creates a new entry in the log to change the color of the snake
function changeColorLog(gid, pid, color){
    var board = tremola.game_board[gid];
    if(pid == board.player0){
        if(board.colorScheme1 == color){
            alert("Opponent already has this color, you have to choose another one!");
            return;
        }
        if(board.colorScheme0 == color){
            return;
        }
    }
    else if(board.colorScheme0 == color){
        alert("Opponent already has this color, you have to choose another one!");
        return;
    }
    else if(board.colorScheme0 == color){
        return;
    }
    var data = {
        'gid' : gid,
        'op' : snakeOperation.CHANGE_COLOR,
        'args' : pid + "//" + color,
        'prev' : board.currPrev
    };
    snakeSendToBackend(data);
    changeColor(gid, pid, color);
}

// Changes the color of the snake based on the given color scheme
function changeColor(gid, pid, color){
    var board = tremola.game_board[gid];
    if(pid == board.player0){
        board.colorScheme0 = color;
        switch(color){
            case "Red":
                board.colorSnake0 = "OrangeRed";
                board.colorHead0 = "DarkRed";
                break;
            case "Green":
                board.colorSnake0 = "Chartreuse";
                board.colorHead0 = "Green";
                break;
            case "Yellow":
                board.colorSnake0 = "Yellow";
                board.colorHead0 = "Orange";
                break;
            case "Blue":
                board.colorSnake0 = "DeepSkyBlue";
                board.colorHead0 = "DarkBlue";
                break;
            case "Pink":
                board.colorSnake0 = "Pink";
                board.colorHead0 = "PaleVioletRed";
                break;
            case "Violet":
                board.colorSnake0 = "Violet";
                board.colorHead0 = "BlueViolet";
                break;
            case "Brown":
                board.colorSnake0 = "Peru";
                board.colorHead0 = "SaddleBrown";
                break;
            
        }
    }
    else{
        board.colorScheme1 = color;
        switch(color){
            case "Red":
                board.colorSnake1 = "OrangeRed";
                board.colorHead1 = "DarkRed";
                break;
            case "Green":
                board.colorSnake1 = "Chartreuse";
                board.colorHead1 = "Green";
                break;
            case "Yellow":
                board.colorSnake1 = "Yellow";
                board.colorHead1 = "Orange";
                break;
            case "Blue":
                board.colorSnake1 = "DeepSkyBlue";
                board.colorHead1 = "DarkBlue";
                break;
            case "Pink":
                board.colorSnake1 = "Pink";
                board.colorHead1 = "PaleVioletRed";
                break;
            case "Violet":
                board.colorSnake1 = "Violet";
                board.colorHead1 = "BlueViolet";
                break;
            case "Brown":
                board.colorSnake1 = "Peru";
                board.colorHead1 = "SaddleBrown";
                break;
        }
    }
    recolorCells(gid, pid);
}

// Recolors all cells of the player that changed their snake color
function recolorCells(gid, pid){
    var board = tremola.game_board[gid];
    if(pid == board.player0){
        console.log(board.snake0);
        for(const pos of board.snake0){
            colorCell(pos, board.colorSnake0, false);
        }
        if(board.snakeHead0 != -1){
            colorCell(board.snakeHead0, board.colorHead0, false);
        }
    }
    else{
        console.log(board.snake0);
        for(const pos of board.snake1){
            colorCell(pos, board.colorSnake1, false);
        }
        if(board.snakeHead1 != -1){
            colorCell(board.snakeHead1, board.colorHead1, false);
        }
    }
    var size = board.size;
    var id = "";
    switch (size){
        case '9': id = "One"; break;
        case '11': id = "Two"; break;
        case '14': id = "Three"; break;
    }
    if(pid == board.player0 && pid != tremola.id){
        document.getElementById("partnerColorLevel" + id).textContent = board.colorScheme0;
    }
    else if(pid == board.player1 && pid != tremola.id){
        document.getElementById("partnerColorLevel" + id).textContent = board.colorScheme1;
    }
    else{
        document.getElementById("partnerColorLevel" + id).textContent = "None";
    }
}

// Adds cell to the snake at the given position with the board specific colors
function addCellToSnake(pos, gid){
    var x = returnX(pos, 9);
    var y = returnY(pos, 9);
    var board = tremola.game_board[gid];
    var snake = board.currentPlayer == 0 ? board.snake0 : board.snake1;
    var snakeColor = board.currentPlayer == 0 ? board.colorSnake0 : board.colorSnake1;
    var head = board.currentPlayer == 0 ? board.snakeHead0 : board.snakeHead1;
    var headColor = board.currentPlayer == 0 ? board.colorHead0 : board.colorHead1;
    console.log("Set cell at (" + x + "," + y + ")!");
    if(head != -1){
        colorCell(head, snakeColor, false)
    }
    colorCell(pos, headColor, false);
    snake.push(Number(pos));
    head = pos
    if(board.currentPlayer == 0){
        board.snake0 = snake;
        board.snakeHead0 = head;
    }
    else{
        board.snake1 = snake;
        board.snakeHead1 = head;
    }
    board.currentPlayer = (board.currentPlayer + 1) % 2;

    var size = board.size
    var id = "";
    switch (size){
        case '9': id = "One"; break;
        case '11': id = "Two"; break;
        case '14': id = "Three"; break;
    }
    document.getElementById("statusInfo_level" + id).textContent = board.turnNumber;

}
function addPartner(gid, pid){
    var board = tremola.game_board[gid];
    board.player1 = pid;
    board.players.push(pid);
    board.flags = GAME_FLAG.MATCHED
    var size = board.size;
    var id = "";

    var color = board.colorScheme0 == "Red" ? "Blue" : "Red";
    changeColorLog(gid, pid, color);

    switch (size){
        case '9': id = "One"; break;
        case '11': id = "Two"; break;
        case '14': id = "Three"; break;
    }
    document.getElementById("partnerNameLevel" + id).textContent = tremola.contacts[pid].alias;
    document.getElementById("partnerColorLevel" + id).textContent = board.colorScheme1;
}
// Applies called operation
function applyOperation(gid, operationID){
    console.log("Apply: " + operationID);
    var board = tremola.game_board[gid];
    var currOp = board['operations'][operationID];
    switch (currOp.body.cmd[0]){
        case snakeOperation.GAME_CREATE:
            console.log("Created game!");
            break;
        case snakeOperation.SET_CELL:
            var pos = currOp.body.cmd[1];
            addCellToSnake(pos, gid);
            board.turns[board.turnNumber + 1] = pos;
            board.turnNumber++;
            game_began = true;
            break;
        case snakeOperation.GAME_FINISH:
            if(!displayedFinish){
                console.log("Finished game!");
                if(board.winner != "draw"){
                    alert("Game is already over, " + board.winner + " won!");
                    gameOver_show_result(gid);
                }
                else{
                    alert("Game is already over, it was a draw!");
                }
                displayedFinish = true;
            }
            break;
        case snakeOperation.CHANGE_COLOR:
            changeColor(gid, currOp.body.cmd[1], currOp.body.cmd[2]);
            break;
        case snakeOperation.LEAVE:
            if(!game_interrupted) {
                alert("The game is interrupted, one player left this game midway!")
                gameOver_show_result(gid);
                setScenario("game_lobby");
                delete tremola.game_board[gid];
            }
            game_interrupted = true;
            break;
        case snakeOperation.UNMATCH:
            if(tremola.game_board[gid].flags === GAME_FLAG.UNMATCHED) {
                launch_snackbar("Partner unmatched, invite a partner!")
                unmatch(gid, currOp.body.cmd[1]);
            }

            break;
    }

}

// Loads the previous game state of the given GID if the game already exists
function loadCurrentGameState(gid, size){
    // Reset variables so everything is back to zero before loading the game
    var board = tremola.game_board[gid];
    curr_gameBoard = gid
    if(!(board == undefined)){
        board.turnNumber = 0; // Always reset because it's buggy else
        var operations = linearTimeline(board.sortedOperations);
        board.currentPlayer = 0; // needed for correct colours
        for(var i in operations){
            //console.log(operations[i]);
            applyOperation(gid, operations[i]);
        }
        var size = board.size;
        var id = "";
        switch (size){
            case '9': id = "One"; break;
            case '11': id = "Two"; break;
            case '14': id = "Three"; break;
        }
        if(tremola.id == board.player0 && board.player1 != null){
            document.getElementById("partnerNameLevel" + id).textContent = tremola.contacts[board.player1].alias;
            document.getElementById("partnerColorLevel" + id).textContent = board.colorScheme1;
        }
        else if(tremola.id == board.player1 && board.player0 != null){
            document.getElementById("partnerNameLevel" + id).textContent = tremola.contacts[board.player0].alias;
            document.getElementById("partnerColorLevel" + id).textContent = board.colorScheme0;
        }
        else{
            document.getElementById("partnerNameLevel" + id).textContent = "Nothing";
            document.getElementById("partnerColorLevel" + id).textContent = "None";
        }
        document.getElementById("statusInfo_level" + id).textContent = board.turnNumber;
    }
    // Create new game if game with given GID does not exist
    else {
        console.log("GID not found, creating new game...");
        createGame(gid, size);
    }
}

// Returns the X coordinate of the given position
function returnX(position, size) {
    return Math.floor(position / size);
}

// Returns the Y coordinate of the given position
function returnY(position, size) {
    return position % size;
}

// Creates a linear timeline of the given
function linearTimeline(timeline) {
    var lst = [];
    for (let n of timeline.linear) {
        var validPrevs = 0;
        for (let p of n.prev) {
            if ((typeof p != "string") && !(p.name in timeline.pending))
                validPrevs++;
        }
        if (validPrevs > 0 || n.prev.length == 0) {
            lst.push(n.name);
        }
    }

    return lst;
}



function inviteUserToGame(gid, userID) {//userID:partner's ID TODO
    var board = tremola.game_board[gid]
    var data = {
        'gid' : gid,
        'op' : snakeOperation.INVITE,
        'args' : userID,
        'prev' : board.currPrev
    };
    snakeSendToBackend(data);
}


function getFinalValues(gid) {

    var winnerName = ' ';
    var partnerName = ' ';
    var partnerSnakeLength = 0;
    var mySnakeLength = 0;
    var game = tremola.game_board[gid];
    if(tremola.game_board[gid].flags === GAME_FLAG.FINISHED) {
        var name0 = game.player0;
        var name1 = game.player1;
        var score0 = game.snake0.length
        var score1 = game.snake1.length;

        winnerName = game.winner
        partnerName = game.player0 !== tremola.id ? name0 : name1;
        partnerSnakeLength = game.player0 !== tremola.id ? score0 : score1;
        mySnakeLength = game.player0 !== tremola.id ? score1 : score0;
    }

    if(tremola.game_board[gid].flags === GAME_FLAG.INTERRUPTED) {
        winnerName = "interrupted";
    }
    return {
        winner_name: winnerName,
        partner_name: partnerName,
        partner_snake_length : partnerSnakeLength,
        my_snake_length: mySnakeLength
    };
}

function getMyAchievement() {
    var data = [];

    var gid = ' ';
    var size = 0;
    var partner = ' ';
    var myself = ' ';
    var snakeLength = 0;
    for( const [key, value] of Object.entries(tremola.game_board)) {
        var game =value;
        if(game.flags === GAME_FLAG.FINISHED) {
           gid = game.key;
           size = game.size;//game_board size
           partner = game.player0 === tremola.id? game.player1: game.player0;
           myself = game.player0 === tremola.id? game.snake0: game.snake1;
           snakeLength = myself.length;

           data.push({
               gid: gid,
               size: size,
               score: snakeLength,
               partner: partner
            });
        }
    }
    data.sort((a,b) => b.score-a.score);
    data.forEach((game, index) => {
        game.rankNum = index + 1;
    });
}

function getGameHistory() {
    var data = []

    var gid = ' '
    var winner = ' '
    var winnerSnakeLength = 0
    var levelNum = 0
    var partner = ' '
    for( const [key, value] of Object.entries(tremola.game_board)) {
        var game = value;
        gid = game.key
        winner = game.winner;
        winnerSnakeLength = tremola.contacts[game.player0].alias === winner ? game.snake0.length : game.snake1.length
        levelNum = game.size
        partner = game.player0 === tremola.id? game.player1: game.player0;

        data.push({
            gid: gid,
            winner: winner,
            winnerSnakeLength: winnerSnakeLength,
            levelNum: levelNum,
            partner: partner
        })
    }
    return data
}

// Displays the game one turn prior
function goBackTurn(){
    var board = tremola.game_board[curr_gameBoard];
    var size = board.size;
    var id = "";
    switch (size){
        case '9': id = "One"; break;
        case '11': id = "Two"; break;
        case '14': id = "Three"; break;
    }
    var currentTurn = Number(document.getElementById("statusInfo_level" + id).textContent);
    if(currentTurn == 0){
        alert("Already at start of game, can't go back further!");
        return;
    }
    document.getElementById("statusInfo_level" + id).textContent = currentTurn - 1;
    displayToTurn(curr_gameBoard, currentTurn - 1);
}

// Displays the game one turn after
function goForwardTurn(){
    var board = tremola.game_board[curr_gameBoard];
    var size = board.size;
    var id = "";
    switch (size){
        case '9': id = "One"; break;
        case '11': id = "Two"; break;
        case '14': id = "Three"; break;
    }
    var currentTurn = Number(document.getElementById("statusInfo_level" + id).textContent);
    if(currentTurn == board.turnNumber){
        alert("Already at end of game, can't go forward further!");
        return;
    }
    document.getElementById("statusInfo_level" + id).textContent = currentTurn + 1;
    displayToTurn(curr_gameBoard, currentTurn + 1);
}

// Display the game up to the specified turn
function displayToTurn(gid, turnNumber){
    var board = tremola.game_board[gid];
    for(var i = 1; i <= turnNumber; i++){
        if(i % 2 == 0){
            colorCell(board.turns[i], board.colorSnake1, false);
        }
        else{
            colorCell(board.turns[i], board.colorSnake0, false);
        }
    }
    for(var i = turnNumber + 1; i <= board.turnNumber; i++){
        colorCell(board.turns[i], "White", false);
    }
    if(turnNumber % 2 == 0 && turnNumber > 1){
        colorCell(board.turns[turnNumber], board.colorHead1, false);
        colorCell(board.turns[turnNumber - 1], board.colorHead0, false);
    }
    else if(turnNumber % 2 == 1 && turnNumber > 1){
        colorCell(board.turns[turnNumber], board.colorHead0, false);
        colorCell(board.turns[turnNumber - 1], board.colorHead1, false);
    }
    else if(turnNumber == 1){
        colorCell(board.turns[turnNumber], board.colorHead0, false);
    }
}