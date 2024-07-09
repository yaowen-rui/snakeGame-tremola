//gameBoard.js

"use strict";

var curr_gameBoard;
var displayedFinish = false;

const GAME_FLAG = {
    UNMATCHED: 'no_partner_yet',
    MATCHED: 'partner_matched_game_not_start',
    ONGOING : 'ongoing',
    FINISHED: 'finished',
}

// Defined operations
const snakeOperation = {
    GAME_CREATE: 'game/create',
    GAME_FINISH: 'game/finish',
    SET_CELL: 'game/cell',
    INVITE: 'invite',
    INVITE_ACCEPT: 'invite/accept',
    INVITE_DECLINE: 'invite/decline',
    LEAVE: 'leave'
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
            "colorSnake1": "Orange",
            "colorHead1": "Red",
            "snake0": [], // Player 0 snake
            "snakeHead0": -1, // Player 0 snake head
            "snake1": [], // Player 0 snake
            "snakeHead1": -1, // Player 0 snake head
            "flags": GAME_FLAG.UNMATCHED,
            "winner": ""
        };
    }

    var board = tremola.game_board[gid]

    // deserialize ScuttleSort-Timeline
    if (!(board.sortedOperations instanceof Timeline)) {
        board.sortedOperations = Timeline.fromJSON(board.sortedOperations);
    }

    if (e.header.ref in board.operations)
        return;

    if (op == snakeOperation.INVITE){
        addPartner(gid, args[0])
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
        addCellToSnake(args[0], gid)
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
    colorCell(pos, headColor, false);
    if(head != -1){
        colorCell(head, snakeColor, false)
    }
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

}
function addPartner(gid, pid){
    var board = tremola.game_board[gid];
    board.player1 = pid;
    board.players.push(pid);
    board.flags = GAME_FLAG.MATCHED
}
// Applies called operation
function applyOperation(gid, operationID){
    console.log("Apply: " + operationID);
    var board = tremola.game_board[gid];
    var currOp = board['operations'][operationID];
    switch (currOp.body.cmd[0]){
        case snakeOperation.GAME_CREATE: //TODO: do sth useful
            console.log("Created game!");
            break;
        case snakeOperation.SET_CELL:
            var pos = currOp.body.cmd[1];
            addCellToSnake(pos, gid)
            break;
        case snakeOperation.GAME_FINISH: //TODO: do sth useful
            if(!displayedFinish){
                console.log("Finished game!");
                if(board.winner != "draw"){
                    alert("Game is already over, " + board.winner + " won!");
                }
                else{
                    alert("Game is already over, it was a draw!");
                }
                displayedFinish = true;
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
        var operations = linearTimeline(board.sortedOperations);
        board.currentPlayer = 0; // needed for correct colours
        for(var i in operations){
            //onsole.log(operations[i]);
            applyOperation(gid, operations[i]);
        }
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



function inviteUserToGame(gid, userID) {//TODO
    var board = tremola.game_board[gid]
    var data = {
        'gid' : gid,
        'op' : snakeOperation.INVITE,
        'args' : userID,
        'prev' : board.currPrev
    };
    snakeSendToBackend(data);
}

function gameInviteAccept(bid, prev) {//TODO

}

function gameInviteDecline(bid, prev) {//TODO

}

function leave_game(bid) {

}

function unmatch_partner(bid) {

}

function getFinalValues(gid) {

    var winnerName = ' ';
    var partnerName = ' ';
    var partnerSnakeLength = '0';
    var mySnakeLength = '0';
    if(tremola.game_board[gid].operations.flags.contains(snakeOperation.GAME_FINISH)) {
        var game = tremola.game_board[gid];
        var name0 = game.player0;
        var name1 = game.player1;
        var score0 = game.player0.score;//TODO: didnt find the player's final scores
        var score1 = game.player1.score;

        if (score0 !== score1) {
            winnerName = score0 > score1 ? game.player0 : game.player1;
        } else {
            winnerName = name0 + " and " + name1;
        }
        partnerName = game.player0 !== tremola.id ? name0 : name1;
        partnerSnakeLength = game.player0 !== tremola.id ? score0 : score1;
        mySnakeLength = game.player0 !== tremola.id ? score1 : score0;
    }

    return {
        winner_name: winnerName,
        partner_name: partnerName,
        partner_snake_length : partnerSnakeLength,
        my_snake_length: mySnakeLength
    };
}

function getMyAchievement() {
    var data = []
    var gid = ' ';
    var size = '0';
    var partner = ' ';
    var myself = ' ';
    var snakeLength = ' ';
    for( const [key, value] of Object.entries(tremola.game_board)) {
        var game =value;
        if(game.operations.contains(GAME_FLAG.FINISHED)) {
           gid = game.key;
           size = game.size;//game_board size
           partner = game.player0 === tremola.id? game.player1: game.player0;
           myself = game.player0 === tremola.id? game.player0: game.player1;
           snakeLength = myself.score;

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
    var gid = ''
    var time = ''
    var winner = ''
    var winnerSnakeLength = '0'
    var levelNum = '0'
    var partner = ''
    for( const [key, value] of Object.entries(tremola.game_board)) {
        var game = value;
        gid = game.key
        //TODO

    }

}