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

const GAME_FLAG = {
    UNMATCHED: 'no_partner_yet',
    MATCHED: 'partner_matched_game_not_start',
    ONGOING : 'ongoing',
    FINISHED: 'finished',
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
            "flags": [],
        }
    }
    var gameBoard = tremola.board[bid];
    //TODO: to be continued
}

function inviteUserToGame(bid, userID) {//TODO
    var gameBoard = tremola.game_board[bid]
    var data = {
        'bid': bid,
        'cmd': [Operation.INVITE, userID],
        'prev': gameBoard.curr_prev
    }
    board_send_to_backend(data)
}

function inviteAccept(bid, prev) {//TODO
    var gameBoard = tremola.game_board[bid]
    var data = {
        'bid': bid,
        'cmd': [Operation.INVITE_ACCEPT],
        'prev': prev
    }
    board_send_to_backend(data)
}

function inviteDecline(bid, prev) {//TODO
    var gameBoard = tremola.game_board[bid]
    var data = {
        'bid': bid,
        'cmd': [Operation.INVITE_DECLINE],
        'prev': prev
    }
    board_send_to_backend(data)
}

function leave_game(bid) {

}

function unmatch_partner(bid) {

}

function restart_game() {

}

function getFinalValues() {
    //TODO : the real values should be changed later
    const winnerName = 'lisa';
    const partnerName = 'lisa';
    const partnerSnakeLength = 15+'';
    const mySnakeLength = 8+'';

    return {
        winner_name: winnerName,
        partner_name: partnerName,
        partner_snake_length : partnerSnakeLength,
        my_snake_length: mySnakeLength
    };
}