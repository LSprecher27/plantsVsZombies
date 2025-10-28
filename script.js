const canvas = document.getElementById('canvas1');
const ctx = canvas.getContext('2d');
canvas.width = 900;
canvas.height = 600;

// Global Variables
const cellSize = 100;
const cellGap = 3;
const gameGrid = [];
const defenders = [];
let defenderCost = 100;
let numberOfResources = 300;

// mouse
const mouse = {
    x:10,
    y:10,
    width:0.1,
    height:0.1,
}
let canvasPosition = canvas.getBoundingClientRect();
canvas.addEventListener('mousemove', function(e){
    mouse.x = e.x - canvasPosition.left;
    mouse.y = e.y - canvasPosition.top;
});
canvas.addEventListener('mouseleave', function(){
    mouse.y = undefined;
    mouse.x = undefined;
})

// Game Board
const controlsBar = {
    width: canvas.width,
    height: cellSize,
}
class Cell {
    constructor(x, y){
        this.x = x;
        this.y = y;
        this.width = cellSize;
        this.height = cellSize;
    }
    draw(){
        if (mouse.x && mouse.y && collision(this, mouse)){
            ctx.strokeStyle = 'black';
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }
        
    }
}
function createGrid() {
    for (let y = cellSize; y < canvas.height; y += cellSize){
        for (let x = 0; x < canvas.width; x += cellSize){
            gameGrid.push(new Cell(x, y));
        }
    }
}
createGrid(); // Continue Video at 32:37
function handleGameGrid(){
    for (let i = 0; i < gameGrid.length; i++){
        gameGrid[i].draw();
    }
}

// projectiles
//defenders
class Defender {
    constructor(x, y){
        this.x = x;
        this.y = y;
        this.width = cellSize;
        this.height = cellSize;
        this.shooting = false;
        this.health = 100;
        this.projectiles = [];
        this.timer = 0;
        
    }
    draw(){
        ctx.fillStyle = 'blue';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = 'gold';
        ctx.font = '20px Arial';
        ctx.fillText(Math.floor(this.health),this.x, this.y);
    }

}
canvas.addEventListener('click', function(){
    const gridPositionX = mouse.x - (mouse.x % cellSize);
    const gridPositionY = mouse.y - (mouse.y % cellSize);
    if (gridPositionY < cellSize) return;
    let defenderCost = 100;
    if (numberOfResources > defenderCost){
        defenders.push(new Defender(gridPositionX, gridPositionY));
        numberOfResources -= defenderCost;
    }

});
//enemies
// resources
// utilites
function animate(){
    ctx.clearRect(0,0,canvas.width, canvas.height);
    ctx.fillStyle = 'blue';
    ctx.fillRect(0,0,controlsBar.width, controlsBar.height);
    handleGameGrid();
    requestAnimationFrame(animate);
}
animate();

function collision(first, second){
    if (!(   first.x > second.x + second.width ||
             first.x + first.width < second.x ||
             first.y > second.y + second.height ||
             first.y + first.height < second.y)){
                return true;
             
}
};