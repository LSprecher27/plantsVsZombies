const canvas = document.getElementById('canvas1');
const ctx = canvas.getContext('2d');
canvas.width = 900;
canvas.height = 600;

// Game State
let gameStarted = false;
let gameOver = false;

// DOM Buttons
const playButton = document.getElementById('playButton');
const retryButton = document.getElementById('retryButton');

playButton.addEventListener('click', () => {
    gameStarted = true;
    playButton.style.display = 'none';
    animate();
});

retryButton.addEventListener('click', () => {
    resetGame();
    retryButton.style.display = 'none';
    animate();
});

// Global Variables
const cellSize = 100;
const cellGap = 3;
const gameGrid = [];
const defenders = [];
const enemies = [];
const enemyPositions = [];
const projectiles = [];
const resourceBlocks = [];
let defenderCost = 100;
let numberOfResources = 300;
let enemiesInterval = 600;
let frame = 0;
let score = 0;
let nextResourceSpawn = 1000 + Math.floor(Math.random() * 1000);

// Mouse
const mouse = {
    x: 10,
    y: 10,
    width: 0.1,
    height: 0.1,
};
let canvasPosition = canvas.getBoundingClientRect();
canvas.addEventListener('mousemove', function (e) {
    mouse.x = e.x - canvasPosition.left;
    mouse.y = e.y - canvasPosition.top;
});
canvas.addEventListener('mouseleave', function () {
    mouse.x = undefined;
    mouse.y = undefined;
});

// Controls Bar
const controlsBar = {
    width: canvas.width,
    height: cellSize,
};

// Classes
class Cell {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = cellSize;
        this.height = cellSize;
    }
    draw() {
        if (mouse.x && mouse.y && collision(this, mouse)) {
            ctx.strokeStyle = 'black';
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }
    }
} // I wouldn't even be able to tell you what this is. On second thought, it might be the individual squares of the grid. I'll get back to you on that.

class Defender {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = cellSize;
        this.height = cellSize;
        this.health = 100;
        this.timer = 0;
    }
    draw() {
        ctx.fillStyle = 'blue';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = 'gold';
        ctx.font = '30px Arial';
        ctx.fillText(Math.floor(this.health), this.x + 15, this.y + 30);
    }
    update() {
        this.timer++;
        const enemyInRow = enemies.some(enemy => enemy.y === this.y);
        if (enemyInRow && this.timer % 100 === 0) {
            projectiles.push(new Projectile(this.x + 70, this.y + 70));
        }
    }
} // The defenders that the player places to stop enemies

class Enemy {
    constructor(verticalPosition) {
        this.x = canvas.width;
        this.y = verticalPosition;
        this.width = cellSize;
        this.height = cellSize;
        this.speed = Math.random() * 0.2 + 0.4;
        this.movement = this.speed;
        this.health = 100;
        this.maxHealth = this.health;
        this.isColliding = false;
    }
    update() {
        this.movement = this.isColliding ? 0 : this.speed;
        this.x -= this.movement;
    }
    draw() {
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = 'gold';
        ctx.font = '30px Arial';
        ctx.fillText(Math.floor(this.health), this.x + 15, this.y + 30);
    }
} // The enemies that will try to reach the left side of the screen

class Projectile {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 10;
        this.height = 10;
        this.speed = 5;
        this.power = 20;
    }
    update() {
        this.x += this.speed;
    }
    draw() {
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.width, 0, Math.PI * 2);
        ctx.fill();
    }
} // The bullets fired by defenders

class ResourceBlock {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = cellSize;
        this.height = cellSize;
        this.value = Math.floor(Math.random() * 6 + 4) * 10; // 40–90
        this.collected = false;
    }
    draw() {
        ctx.fillStyle = 'yellow';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = 'black';
        ctx.font = '20px Arial';
        ctx.fillText(this.value, this.x + 30, this.y + 60);
    }
    update() {
        if (mouse.x && mouse.y && collision(this, mouse) && !this.collected) {
            numberOfResources += this.value;
            this.collected = true;
        }
        for (let i = 0; i < enemies.length; i++) {
            if (collision(this, enemies[i])) {
                this.collected = true;
            }
        }
    }
} //Little random block that will spawn and give resources when hovered over. 

// Game Functions
function createGrid() {
    for (let y = cellSize; y < canvas.height; y += cellSize) {
        for (let x = 0; x < canvas.width; x += cellSize) {
            gameGrid.push(new Cell(x, y));
        }
    }
} // Makes the grid for placing defenders and spawing enemies. 
createGrid();

function handleGameGrid() {
    for (let i = 0; i < gameGrid.length; i++) {
        gameGrid[i].draw();
    }
}

function handleDefenders() {
    for (let i = 0; i < defenders.length; i++) {
        const defender = defenders[i];
        defender.draw();
        defender.update();

        for (let j = 0; j < enemies.length; j++) {
            const enemy = enemies[j];
            if (collision(defender, enemy)) {
                enemy.isColliding = true;
                defender.health -= 0.2;
            } else {
                enemy.isColliding = false;
            }

            if (defender.health <= 0) {
                defenders.splice(i, 1);
                i--;
                enemy.isColliding = false;
                break;
            }
        }
    }
}

function handleEnemies() {
    let baseInterval = 600;
    let difficultyFactor = Math.floor(score / 100);
    enemiesInterval = baseInterval - difficultyFactor * 60;
    if (enemiesInterval < 150) enemiesInterval = 150;

    for (let i = 0; i < enemies.length; i++) {
        if (score >= 100) {
            enemies[i].speed += 0.002 * difficultyFactor;
        }
        enemies[i].update();
        enemies[i].draw();

        if (enemies[i].x < 0) {
            gameOver = true;
        }
        //I'm losing my mind please help me

        if (enemies[i].health <= 0) {
            const gainedResources = Math.floor(enemies[i].maxHealth / 10);
            numberOfResources += gainedResources;
            score += gainedResources;
            enemies.splice(i, 1);
            i--;
        }
    }
    // All work and no play makes Luke a dull boy

    if (frame % enemiesInterval === 0) {
        let enemiesToSpawn = score >= 100 ? 2 : 1; // spawn 2 enemies if score >= 100
        for (let n = 0; n < enemiesToSpawn; n++) {
            let verticalPosition = Math.floor(Math.random() * 5 + 1) * cellSize;
            let newEnemy = new Enemy(verticalPosition);
    
            if (score >= 100) {
                let difficultyFactor = Math.floor(score / 100);
                newEnemy.health += 10 * difficultyFactor;
                newEnemy.maxHealth = newEnemy.health;
            }
    
            enemies.push(newEnemy);
            enemyPositions.push(verticalPosition);
        }
    }
}   

function handleProjectiles() {
    for (let i = 0; i < projectiles.length; i++) {
        projectiles[i].update();
        projectiles[i].draw();

        for (let j = 0; j < enemies.length; j++) {
            if (collision(projectiles[i], enemies[j])) {
                enemies[j].health -= projectiles[i].power;
                projectiles.splice(i, 1);
                i--;
                break;
            }
        }

        if (projectiles[i] && projectiles[i].x > canvas.width - cellSize) {
            projectiles.splice(i, 1);
            i--;
        }
    }
}

function spawnResourceBlock() {
    let attempts = 0;
    while (attempts < 10) {
        const x = Math.floor(Math.random() * (canvas.width / cellSize)) * cellSize;
        const y = (Math.floor(Math.random() * ((canvas.height - cellSize) / cellSize)) + 1) * cellSize;

        const overlapsDefender = defenders.some(d => d.x === x && d.y === y);
        const overlapsEnemy = enemies.some(e => Math.abs(e.x - x) < cellSize && Math.abs(e.y - y) < cellSize);

        if (!overlapsDefender && !overlapsEnemy) {
            resourceBlocks.push(new ResourceBlock(x, y));
            nextResourceSpawn = frame + 1000 + Math.floor(Math.random() * 1000);
            break;
        }
        attempts++;
    }
}

function handleResourceBlocks() {
    for (let i = 0; i < resourceBlocks.length; i++) {
        resourceBlocks[i].update();
        if (!resourceBlocks[i].collected) {
            resourceBlocks[i].draw();
        } else {
            resourceBlocks.splice(i, 1);
            i--;
        }
    }
}

function handleGameStatus() {
    if (!gameOver) {
        ctx.fillStyle = 'gold';
        ctx.font = '30px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('Resources: ' + Math.floor(numberOfResources), 20, 20);
        ctx.fillText('Score: ' + Math.floor(score), 20, 50);
    }
}
// Loved working on the game loop, would've felt better if I started beating my head against the wall.
function resetGame() {
    gameOver = false;
    gameStarted = true;
    numberOfResources = 300;
    score = 0;
    frame = 0;
    enemiesInterval = 600;
    defenders.length = 0;
    enemies.length = 0;
    projectiles.length = 0;
    gameGrid.length = 0;
    enemyPositions.length = 0;
    resourceBlocks.length = 0;
    nextResourceSpawn = 1000 + Math.floor(Math.random() * 1000);
    createGrid();
}

function animate() {
    if (!gameStarted) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'black';
        ctx.font = '60px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Click Play to Start', canvas.width / 2, canvas.height / 2);
        return;
    }

    if (gameOver) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        defenders.length = 0;
        enemies.length = 0;
        projectiles.length = 0;
        gameGrid.length = 0;
        enemyPositions.length = 0;
        resourceBlocks.length = 0;

        ctx.fillStyle = 'black';
        ctx.font = '90px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);

        retryButton.style.display = 'inline';
        return;
    } // Revised this NINE TIMES. Why? Because the engine thought it was funny to just not work for no reason
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'blue';
    ctx.fillRect(0, 0, controlsBar.width, controlsBar.height);
    handleGameGrid();
    handleDefenders();
    handleEnemies();
    handleProjectiles();
    handleResourceBlocks();
    handleGameStatus();

    if (frame === nextResourceSpawn) {
        spawnResourceBlock();
    }

    frame++;
    requestAnimationFrame(animate);
}

function collision(first, second) {
    if (!first || !second) return false;
    return !(
        first.x > second.x + second.width ||
        first.x + first.width < second.x ||
        first.y > second.y + second.height ||
        first.y + first.height < second.y
    );
} // Revised this twice, still is iffy, but screw it

canvas.addEventListener('click', function () {
    const gridPositionX = mouse.x - (mouse.x % cellSize);
    const gridPositionY = mouse.y - (mouse.y % cellSize);
    if (gridPositionY < cellSize) return;
    for (let i = 0; i < defenders.length; i++) {
        if (defenders[i].x === gridPositionX && defenders[i].y === gridPositionY) return;
    }
    if (numberOfResources >= defenderCost) {
        defenders.push(new Defender(gridPositionX, gridPositionY));
        numberOfResources -= defenderCost;
    }
});
