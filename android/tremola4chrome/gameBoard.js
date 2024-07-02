//gameBoard.js

"use strict";

var snake = []

const snakeOperation = { 
    GAME_CREATE: 'game/create',
    GAME_FINISH: 'game/finish',
    SET_CELL: 'game/cell'
}


function processTurn(position, size, cellContent) {
    var x = returnX(position, size)
    var y = returnY(position, size)
    if(validPosition(position, size, snake)){
        snake.push(position)
        cellContent.style.backgroundColor = 'pink';
        console.log("Successfully added cell " + position + " = (" + x + "," + y + ")")
    }
    if(!checkIfValidTurnAvailable(snake, size)){
        console.log("You have no more moves left!");
    }
}

function validPosition(position, size, currentSnake){ // Needs to be extended with considering opponent snake
    if(currentSnake.length == 0){
        return true;
    }
    var currentX = returnX(position, size)
    var currentY = returnY(position, size)
    console.log("Pos: " + position + " = (" + currentX + "," + currentY + ")");
    var checkedX;
    var checkedY;
    for(const pos of currentSnake){
        checkedX = returnX(pos, size)
        checkedY = returnY(pos, size)
        console.log("Checking pos: " + pos + " = (" + checkedX + "," + checkedY + ")");
        if(checkedX === currentX && checkedY === currentY){
            console.log("Clicked cell already part of snake!");
            return false;
        }
    }
    var snakeHead = currentSnake[currentSnake.length - 1];
    console.log("Head: " + snakeHead);
    var headX = returnX(snakeHead, size)
    var headY = returnY(snakeHead, size)
    if(currentX == headX - 1  && currentY == headY || 
        currentX == headX + 1 && currentY == headY || 
        currentY == headY - 1 && currentX == headX || 
        currentY == headY + 1 && currentX == headX){
        return true;
    }
    console.log("Current position not adjacent to head!");
    return false;
}

function checkIfValidTurnAvailable(currentSnake, size){ // Needs to be extended with considering opponent snake
    var snakeHead = currentSnake[currentSnake.length - 1];
    if((currentSnake.includes(snakeHead - 1) || snakeHead % size == 0) &&                   // x - 1 and if cell at left corner
        (currentSnake.includes(snakeHead + 1) || snakeHead % size == size - 1) &&           // x + 1 and if cell at right corner
        (currentSnake.includes(snakeHead - size) || snakeHead - size < 0) &&                // y - 1 and if cell at top
        (currentSnake.includes(snakeHead + size) || snakeHead + size > size*size - 1)){     // y + 1 and if cell at bottom
        return false;
    }
    return true;
}





function returnX(position, size) {
    return Math.floor(position / size);
}

function returnY(position, size) {
    return position % size;;
}
