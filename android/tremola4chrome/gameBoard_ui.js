//gameBoard_ui.js


"use strict";

var cells = []
var clickedCell = -1
var cellColors = {}

function closeGameOverlay() {
    // Hide all game overlays and status information
    const overlays = ['levelOne_overlay', 'levelTwo_overlay', 'levelThree_overlay'];
    const statusInfos = ['statusInfoOne', 'statusInfoTwo', 'statusInfoThree'];

    overlays.forEach(id => document.getElementById(id).style.display = 'none');
    statusInfos.forEach(id => document.getElementById(id).style.display = 'none');
}

function create_gameBoard(level) {//level:levelOne,levelTwo,levelThree
    var gid = prompt("Please enter your game id","0");
    closeOverlay();
    closeGameOverlay();
    prev_scenario= "game_lobby";
    setScenario("game_board");

    document.getElementById('div:game_board').style.display="block";
    document.getElementById("tremolaTitle").style.display = 'none';
    var c = document.getElementById("conversationTitle");
    c.style.display = null;

    if (level === 'levelOne') {//9x9 Grid
        create_cells('levelOne_overlay', 9, gid);
        document.getElementById("statusInfoOne").style.display="block";
        c.innerHTML = "<font size=+1><strong>current: Level One</strong></font>";
    } else if (level === 'levelTwo') {//11x11
        create_cells('levelTwo_overlay', 11, gid);
        document.getElementById("statusInfoTwo").style.display="block";
        c.innerHTML = "<font size=+1><strong>current: Level Two</strong></font>";
    } else if (level === 'levelThree') {//14x14
        create_cells('levelThree_overlay', 14, gid);
        document.getElementById("statusInfoThree").style.display="block";
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
        gid = "1" + gid;
    } else if ( size == 11){
        containerNum='Two';
        gid = "2" + gid;
    } else {
        containerNum = 'Three';
        gid = "3" + gid
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
    const div =  document.getElementById('sendingButton'+containerNum)
    div.innerHTML = '';
    div.appendChild(button);
    button.onclick = () => {
        processTurn(clickedCell, size, gid);
    }
    document.getElementById(id).style.display = 'block';
    
    // Load current game state if GID exists, else create new game
    loadCurrentGameState(gid);
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