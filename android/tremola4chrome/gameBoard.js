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

function menu_board_invitations() { //in game lobby
    closeOverlay()
    document.getElementById("gameLobby-invitations-overlay").style.display = 'initial';
    document.getElementById("overlay-bg").style.display = 'initial';
    document.getElementById("gameLobby_invitations_list").innerHTML = ""

    for (var bid in tremola.game_board) {
        menu_board_invitation_create_entry(bid)
    }
}

// creates new entry in invitation (to accept or reject invitations) or updates existing entry
function menu_board_invitation_create_entry(bid) {

    var board = tremola.game_board[bid]

    if (document.getElementById("gameLobby_invitation_" + bid)) {
        if (board.subscribed || !(myId in board.pendingInvitations))
            document.getElementById("gameLobby_invitation_" + bid).outerHTML = ""
        else
            document.getElementById("gameLobby_invitation_" + bid + "_level").innerHTML = board.level
        return
    }


    if (board.subscribed) // already subscribed
        return

    console.log("Create invitation for GAME BOARD: " + bid)
    console.log("PENDING LIST: " + Object.keys(board.pendingInvitations))

    if (!(myId in board.pendingInvitations)) // not invited
        return

    var invitationId = board.pendingInvitations[myId][0]
    var inviteUserId = board.operations[invitationId].fid
    var inviteUserName = tremola.contacts[inviteUserId].alias
    var board_level = board.level


    var invHTML = "<div id='gameLobby_invitation_" + bid + "' class='kanban_invitation_container'>"
    invHTML += "<div class='kanban_invitation_text_container'>"
    invHTML += "<div id='gameLobby_invitation_" + bid + "_level' style='grid-area: name; padding-top: 5px; padding-left: 10px;font-size:15px'>" + board_level + "</div>"
    invHTML += "<div style='grid-area: author; padding-top: 2px; padding-left: 10px;font-size:8px'>From: " + inviteUserName + "</div></div>"

    invHTML += "<div style='grid-area: btns;justify-self:end;display: flex;justify-content: center;align-items: center;'>"
    invHTML += "<div style='padding-right:8px;'>"
    invHTML += "<button class='flat passive buttontext' style=\"height: 40px; background-image: url('img/checked.svg'); width: 35px;margin-right:10px;background-color: var(--passive)\" onclick='btn_invite_accept(\"" + bid + "\")'>&nbsp;</button>"//</div>"
    invHTML += "<button class='flat passive buttontext' style=\"height: 40px; color: red; background-image: url('img/cancel.svg');width: 35px;background-color: var(--passive)\" onclick='btn_invite_decline(\"" + bid + "\")'>&nbsp;</button>"
    invHTML += "</div></div></div>"

    document.getElementById("gameLobby_invitations_list").innerHTML += invHTML
}
