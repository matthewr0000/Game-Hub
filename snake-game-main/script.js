const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('startButton');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');

// Set canvas size
canvas.width = 800;
canvas.height = 600;

// Game constants
const gridSize = 40; // Size of each grid cell
const cubeSize = 30;
const moveSpeed = 5;
const gridCols = Math.floor(canvas.width / gridSize);
const gridRows = Math.floor(canvas.height / gridSize);
const moveDelay = 100; // Reduced from 200 to 100 milliseconds between moves

// Game variables
let player = {
    x: 0,
    y: 0,
    direction: 0, // 0: right, 1: down, 2: left, 3: up
    followers: []
};

let apple = {
    x: 0,
    y: 0
};

let particles = []; // Array to store particle effects

let score = 0;
let highScore = localStorage.getItem('znakeHighScore') || 0;
let gameStarted = false;
let gameOver = false;
let keys = {};
let lastMoveTime = 0;

// Particle class for effects
class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 8; // Bigger particles
        this.speedX = (Math.random() - 0.5) * 2; // Slower speed
        this.speedY = (Math.random() - 0.5) * 2; // Slower speed
        this.life = 1.0; // Life from 1 to 0
        this.decay = 0.03 + Math.random() * 0.02; // Faster decay
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= this.decay;
        this.size *= 0.98; // Slower shrink
    }

    draw() {
        ctx.save();
        ctx.translate(this.x * gridSize + gridSize/2, this.y * gridSize + gridSize/2);
        ctx.fillStyle = `rgba(255, 255, 255, ${this.life})`;
        ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
        ctx.restore();
    }
}

// Create particle effect
function createParticleEffect(x, y) {
    for (let i = 0; i < 8; i++) { // Fewer particles
        particles.push(new Particle(x, y));
    }
}

// Update particles
function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        if (particles[i].life <= 0) {
            particles.splice(i, 1);
        }
    }
}

// Initialize game
function initGame() {
    player = {
        x: Math.floor(gridCols / 2),
        y: Math.floor(gridRows / 2),
        direction: 0,
        followers: []
    };
    // Add initial followers to make a 3-cube znake
    addFollower();
    addFollower();
    score = 0;
    gameOver = false;
    scoreElement.textContent = score;
    highScoreElement.textContent = highScore;
    spawnApple();
}

// Add a new follower cube
function addFollower() {
    // If there are no followers, add at player position
    if (player.followers.length === 0) {
        player.followers.push({
            x: player.x,
            y: player.y,
            direction: player.direction
        });
    } else {
        // Add at the last follower's position
        const lastFollower = player.followers[player.followers.length - 1];
        player.followers.push({
            x: lastFollower.x,
            y: lastFollower.y,
            direction: lastFollower.direction
        });
    }
}

// Spawn apple at random position
function spawnApple() {
    apple.x = Math.floor(Math.random() * gridCols);
    apple.y = Math.floor(Math.random() * gridRows);

    // Make sure apple doesn't spawn on znake
    for (let segment of player.followers) {
        if (segment.x === apple.x && segment.y === apple.y) {
            spawnApple();
            return;
        }
    }
    if (player.x === apple.x && player.y === apple.y) {
        spawnApple();
        return;
    }
}

// Draw a cube
function drawCube(x, y, direction, isPlayer = false) {
    ctx.save();
    ctx.translate(x * gridSize + gridSize/2, y * gridSize + gridSize/2);
    ctx.rotate(direction * Math.PI/2);

    // Draw cube
    ctx.fillStyle = isPlayer ? '#FFFFFF' : '#CCCCCC'; // White for player, light gray for followers
    ctx.fillRect(-cubeSize/2, -cubeSize/2, cubeSize, cubeSize);

    // Draw border
    ctx.strokeStyle = '#000000'; // Black border for contrast
    ctx.lineWidth = 2;
    ctx.strokeRect(-cubeSize/2, -cubeSize/2, cubeSize, cubeSize);

    ctx.restore();
}

// Draw a trail segment
function drawTrailSegment(x, y, alpha) {
    ctx.save();
    ctx.translate(x * gridSize + gridSize/2, y * gridSize + gridSize/2);

    // Draw trail segment solid white
    ctx.fillStyle = '#FFFFFF'; // Solid white trail
    ctx.fillRect(-cubeSize/2, -cubeSize/2, cubeSize, cubeSize);

    // Draw border
    ctx.strokeStyle = '#000000'; // Solid black border
    ctx.lineWidth = 2;
    ctx.strokeRect(-cubeSize/2, -cubeSize/2, cubeSize, cubeSize);

    ctx.restore();
}

// Draw apple
function drawApple() {
    ctx.save();
    ctx.translate(apple.x * gridSize + gridSize/2, apple.y * gridSize + gridSize/2);

    // Draw simple white square
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(-cubeSize/2, -cubeSize/2, cubeSize, cubeSize);

    ctx.restore();
}

// Draw game
function draw() {
    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;
    for (let x = 0; x <= canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }

    // Draw followers (znake body)
    for (const follower of player.followers) {
        drawCube(follower.x, follower.y, follower.direction);
    }

    // Draw player (znake head)
    drawCube(player.x, player.y, player.direction, true);

    // Draw apple
    drawApple();

    // Draw particles
    for (const particle of particles) {
        particle.draw();
    }

    // Draw game over message
    if (gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2);

        ctx.font = '24px Arial';
        ctx.fillText(`Score: ${score}`, canvas.width/2, canvas.height/2 + 40);
        ctx.fillText(`High Score: ${highScore}`, canvas.width/2, canvas.height/2 + 70);
        ctx.fillText('Click Restart to play again', canvas.width/2, canvas.height/2 + 100);
    }
}

// Update follower positions
function updateFollowers() {
    // Move followers from tail to head
    for (let i = player.followers.length - 1; i > 0; i--) {
        player.followers[i].x = player.followers[i-1].x;
        player.followers[i].y = player.followers[i-1].y;
        player.followers[i].direction = player.followers[i-1].direction;
    }

    // Move first follower to player's previous position
    if (player.followers.length > 0) {
        player.followers[0].x = player.x;
        player.followers[0].y = player.y;
        player.followers[0].direction = player.direction;
    }
}

// Update game state
function update() {
    if (gameOver) return;

    const currentTime = Date.now();

    // Only move if enough time has passed
    if (currentTime - lastMoveTime < moveDelay) {
        return;
    }

    // Store previous position for collision detection
    const prevX = player.x;
    const prevY = player.y;

    // Always move in current direction
    switch (player.direction) {
        case 0: // Right
            player.x = Math.min(gridCols - 1, player.x + 1);
            break;
        case 1: // Down
            player.y = Math.min(gridRows - 1, player.y + 1);
            break;
        case 2: // Left
            player.x = Math.max(0, player.x - 1);
            break;
        case 3: // Up
            player.y = Math.max(0, player.y - 1);
            break;
    }

    // Check for wall collision
    if (player.x === prevX && player.y === prevY) {
        gameOver = true;
        return;
    }

    // Check if player ate apple
    if (player.x === apple.x && player.y === apple.y) {
        createParticleEffect(apple.x, apple.y);
        addFollower();
        score += 100;
        scoreElement.textContent = score;
        if (score > highScore) {
            highScore = score;
            highScoreElement.textContent = highScore;
            localStorage.setItem('znakeHighScore', highScore);
        }
        spawnApple();
    }

    lastMoveTime = currentTime;

    // Update followers
    updateFollowers();

    // Update particles
    updateParticles();
}

// Game loop
function gameLoop() {
    if (!gameStarted) return;
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Handle keyboard input
document.addEventListener('keydown', (event) => {
    keys[event.key] = true;

    // Handle instant direction changes
    if (event.key === 'ArrowUp' && player.direction !== 1) {
        player.direction = 3;
    } else if (event.key === 'ArrowDown' && player.direction !== 3) {
        player.direction = 1;
    } else if (event.key === 'ArrowLeft' && player.direction !== 0) {
        player.direction = 2;
    } else if (event.key === 'ArrowRight' && player.direction !== 2) {
        player.direction = 0;
    }
});

document.addEventListener('keyup', (event) => {
    keys[event.key] = false;
});

// Start game
function startGame() {
    if (gameStarted) {
        gameStarted = false;
    }
    gameStarted = true;
    initGame();
    gameLoop();
    startButton.textContent = 'Restart Game';
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    startButton.addEventListener('click', startGame);
    draw();
});