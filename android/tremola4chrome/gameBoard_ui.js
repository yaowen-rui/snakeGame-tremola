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
    document.getElementById('game_board').style.display="block";

    if (level === 'levelOne') {//9x9 Grid
        create_cells('levelOne_overlay', 9);
        document.getElementById("statusInfoOne").style.display="block";
    } else if (level === 'levelTwo') {//11x11
        create_cells('levelTwo_overlay', 11);
        document.getElementById("statusInfoTwo").style.display="block";
    } else if (level === 'levelThree') {//14x14
        create_cells('levelThree_overlay', 14);
        document.getElementById("statusInfoThree").style.display="block";
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