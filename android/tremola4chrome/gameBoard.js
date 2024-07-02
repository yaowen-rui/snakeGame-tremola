//gameBoard.js

"use strict";
//TODO: to be continued, just rewrite something from board.js
var curr_gameBoard;

const Operation = {
    GAME_BOARD_CREATE:'gameBoard/create',
    INVITE: 'invite',
    INVITE_ACCEPT: 'invite/accept',
    INVITE_DECLINE: 'invite/decline',
    LEAVE: 'leave'
}
function lobby_new_event(e) {
    // parse data
    var op = e.public[3]
    var bid = op == Operation.GAME_BOARD_CREATE ? e.header.ref : e.public[1]
    var prev = e.public[2] != "null" ? e.public[2] : []
    var args = e.public.length > 4 ? e.public.slice(4) : []

    // add new entry if it is a new game
    if (!(bid in tremola.game_board)) {
        tremola.game_board[bid] = {//not determined, which is needed  which should be added
            "operations": {}, // all received operations for this board
            "sortedOperations": new Timeline(), // "linear timeline", sorted list of operationIds
            "members": [e.header.fid], // members of the game board
            "level": "",
            "gridCellPosition": {},
            "snakeColor":"",
            "snakeMoved": false,
            "history": [],
            "lastUpdate": Date.now(),
            "pendingInvitations": {}, // User: [inviteIds]
        }
    }
    var gameBoard = tremola.board[bid];

}

function inviteUser(bid, userID) {
    var gameBoard = tremola.game_board[bid]
    var data = {
        'bid': bid,
        'cmd': [Operation.INVITE, userID],
        'prev': gameBoard.curr_prev
    }
    board_send_to_backend(data)
}

function inviteAccept(bid, prev) {
    var gameBoard = tremola.game_board[bid]
    var data = {
        'bid': bid,
        'cmd': [Operation.INVITE_ACCEPT],
        'prev': prev
    }
    board_send_to_backend(data)
}

function inviteDecline(bid, prev) {
    var gameBoard = tremola.game_board[bid]
    var data = {
        'bid': bid,
        'cmd': [Operation.INVITE_DECLINE],
        'prev': prev
    }
    board_send_to_backend(data)
}


