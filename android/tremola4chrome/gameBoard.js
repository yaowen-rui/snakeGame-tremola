//gameBoard.js

"use strict";

var opponentSnake = []
var snake = []; //own snake, keeping this name for now so I don't have to change everything else here
var head = -1;

// Defined operations
const snakeOperation = { 
    GAME_CREATE: 'game/create',
    GAME_FINISH: 'game/finish',
    SET_CELL: 'game/cell'
}

// Gets called after a cell gets clicked
function processTurn(position, size, gid) {
    if(position == -1){
        console.log("You need to select a cell first!");
        return;
    }
    console.log("Current snake: " + snake)
    // If position is valid, set cell
    if(validPosition(position, size, snake)){
        addCellToSnake(position)
        var data = {
            'gid' : gid,
            'op' : snakeOperation.SET_CELL,
            'args' : position,
            'prev' : tremola.game_board[gid].currPrev
        };
        snakeSendToBackend(data);
    }

    // If no more option are available, do sth
    if(!checkIfValidTurnAvailable(size)){
        console.log("You have no more moves left!");
        finishGame(gid);
        alert("Game is over!");
    }
}

// Checks if position is valid
function validPosition(position, size, currentSnake){
    // First cell
    if(currentSnake.length == 0){
        return true;
    }
    // Checks if the cell is already part of the snake
    if(currentSnake.includes(position)){
        console.log("Clicked cell already part of snake!");
        return false;
    }
    if(opponentSnake.includes(position)){
        console.log("Clicked cell already part of opponent snake!");
        return false;
    }

    //Checks if the cell is adjacent to the head
    var currentX = returnX(position, size);
    var currentY = returnY(position, size);
    console.log("Head: " + head);
    var headX = returnX(head, size);
    var headY = returnY(head, size);
    if(currentX == headX - 1  && currentY == headY || // x - 1
        currentX == headX + 1 && currentY == headY || // x + 1
        currentY == headY - 1 && currentX == headX || // y - 1
        currentY == headY + 1 && currentX == headX){  // y + 1
        return true;
    }
    console.log("Current position not adjacent to head!");
    return false;
}

// Checks if there are any available cells left to extend the snake to
function checkIfValidTurnAvailable(size){
    var markedCells = snake.concat(opponentSnake);
    if((markedCells.includes(head - 1) || head % size == 0) &&                   // x - 1 and if cell at left wall
        (markedCells.includes(head + 1) || head % size == size - 1) &&           // x + 1 and if cell at right wall
        (markedCells.includes(head - size) || head - size < 0) &&                // y - 1 and if cell at top wall
        (markedCells.includes(head + size) || head + size > size*size - 1)){     // y + 1 and if cell at bottom wall
        return false;
    }
    return true;
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
    var args = e.public[4];

    // Add new entry if new board
    if(!(gid in tremola.game_board)) {
        tremola.game_board[gid] = { // TODO: extend and only keep necessary fields
            "operations": {}, // all received operations for this board
            "sortedOperations": new Timeline(), // sorted list of operations
            "players": [e.header.fid], // all players
            "currPrev": [] // prev pointer
        };
    }

    var board = tremola.game_board[gid]

    // deserialize ScuttleSort-Timeline
    if (!(board.sortedOperations instanceof Timeline)) { 
        board.sortedOperations = Timeline.fromJSON(board.sortedOperations);
    }

    if (e.header.ref in board.operations)
        return;
    
    // Store operation
    var body = {
        'gid': gid,
        'cmd': [op].concat(args),
        'prev': prev
    };
    var p = {"key": e.header.ref, "fid": e.header.fid, "fid_seq": e.header.seq, "body": body, "when": e.header.tst};
    board["operations"][e.header.ref] = p;

    board.sortedOperations.add(e.header.ref, prev);

    board.currPrev = board.sortedOperations.get_tips();

    
}

// Creates a new game
function createGame(gid){
    var data = {
        'gid' : gid,
        'op' : snakeOperation.GAME_CREATE,
        'args' : "null",
        'prev' : null
    };
    snakeSendToBackend(data);
}

// Creates a new game
function finishGame(gid){
    var board = tremola.game_board[gid];
    var data = {
        'gid' : gid,
        'op' : snakeOperation.GAME_FINISH,
        'args' : "null",
        'prev' : board.currPrev
    };
    snakeSendToBackend(data);
}

// Adds cell to the snake at the given position, colors head DarkBlue and body DeepSkyBlue
function addCellToSnake(pos){
    var x = returnX(pos, 9);
    var y = returnY(pos, 9);
    console.log("Set cell at (" + x + "," + y + ")!");
    colorCell(pos, "DarkBlue", false);
    if(head != -1){
        colorCell(head, "DeepSkyBlue", false)
    }
    snake.push(Number(pos));
    head = pos
    //console.log(snake)
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
            addCellToSnake(pos)
            break;
        case snakeOperation.GAME_FINISH: //TODO: do sth useful
            console.log("Finished game!");
            alert("Game is already over");
            break;
    }

}

// Loads the previous game state of the given GID if the game already exists
function loadCurrentGameState(gid){
    // Reset variables so everything is back to zero before loading the game
    opponentSnake = []
    snake = [];
    head = -1;

    var board = tremola.game_board[gid];
    if(!(board == undefined)){
        var operations = linearTimeline(board.sortedOperations);
        for(var i in operations){
            //onsole.log(operations[i]);
            applyOperation(gid, operations[i]);
        }
    }
    // Create new game if game with given GID does not exist
    else {
        console.log("GID not found, creating new game...");
        createGame(gid);
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
