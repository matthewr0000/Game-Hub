class FlappyBird {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.startMessage = document.getElementById('startMessage');
        this.pauseButton = document.getElementById('pauseButton');
        this.pauseMenu = document.getElementById('pauseMenu');
        this.jumpSound = document.getElementById('jumpSound');
        
        // Sound state
        this.soundEnabled = false; // Sound off by default
        this.jumpSound.volume = 0.5; // Set volume to 50%
        this.hardMode = false; // Add hard mode state
        
        // Set canvas size
        this.canvas.width = 400;
        this.canvas.height = 600;
        
        // Game constants
        this.gravity = 0.25;
        this.jumpForce = -6;
        this.pipeWidth = 60;
        this.minPipeGap = 180; // Smaller minimum gap
        this.maxPipeGap = 280; // Larger maximum gap
        this.pipeSpeed = 2;
        
        // Game state
        this.score = 0;
        this.gameStarted = false;
        this.gameOver = false;
        this.isPaused = false;
        this.highScore = parseInt(localStorage.getItem('flappyBirdHighScore')) || 0;
        this.pipesPassed = 0; // Track number of pipes passed
        this.currentTheme = 0; // Track current background theme
        
        // Background themes
        this.backgroundThemes = [
            {
                sky: '#87CEEB', // Sky blue
                buildings: '#2C3E50', // Dark blue
                windows: '#F1C40F', // Yellow
                mountains: ['#2A2A2A', '#3A3A3A', '#4A4A4A'], // Grays
                grass: '#4CAF50', // Green
                grassBlades: '#66BB6A' // Light green
            },
            {
                sky: '#FF6B6B', // Sunset red
                buildings: '#34495E', // Darker blue
                windows: '#FFD700', // Gold
                mountains: ['#8B4513', '#A0522D', '#CD853F'], // Browns
                grass: '#228B22', // Forest green
                grassBlades: '#32CD32' // Lime green
            },
            {
                sky: '#483D8B', // Night blue
                buildings: '#1A1A1A', // Dark gray
                windows: '#FFA500', // Orange
                mountains: ['#2F4F4F', '#3D3D3D', '#4A4A4A'], // Dark grays
                grass: '#006400', // Dark green
                grassBlades: '#008000' // Green
            }
        ];
        
        // Bird properties
        this.bird = {
            x: 100,
            y: this.canvas.height / 2,
            width: 35,
            height: 25,
            velocity: 0,
            rotation: 0,
            color: '#FFD700', // Default yellow color
            rainbowHue: 0 // For rainbow effect
        };
        
        // Add flag for initial pipes
        this.initialPipesCreated = false;
        
        // Pipes array
        this.pipes = []; 
        
        // Event listeners
        document.addEventListener('keydown', this.handleKeyPress.bind(this));
        document.addEventListener('touchstart', this.handleTouch.bind(this));
        this.pauseButton.addEventListener('click', this.togglePause.bind(this));
        
        // Add window focus/blur event listeners
        window.addEventListener('blur', () => {
            if (this.gameStarted && !this.gameOver && !this.isPaused) {
                this.togglePause();
            }
        });

        // Add color tab event listeners
        this.setupColorTabs();

        // Add pause menu event listeners
        this.setupPauseMenu();
        
        // Setup side controls
        this.setupSideControls();
        
        // Add inspirational quotes array
        this.inspirationalQuotes = [
            "Success is not final, failure is not fatal: it is the courage to continue that counts.",
            "The only way to do great work is to love what you do.",
            "Believe you can and you're halfway there.",
            "It's not whether you get knocked down, it's whether you get up.",
            "The future belongs to those who believe in the beauty of their dreams.",
            "Don't watch the clock; do what it does. Keep going.",
            "The best way to predict the future is to create it.",
            "Your time is limited, don't waste it living someone else's life.",
            "The journey of a thousand miles begins with one step.",
            "Everything you can imagine is real.",
            "The only limit to our realization of tomorrow will be our doubts of today.",
            "What lies behind us and what lies before us are tiny matters compared to what lies within us.",
            "The harder you work, the luckier you get.",
            "Don't be afraid to give up the good to go for the great.",
            "Success is walking from failure to failure with no loss of enthusiasm."
        ];
        
        // Load unlocked skins from localStorage
        this.loadUnlockedSkins();
        
        // Add chase sequence state
        this.chaseStarted = false;
        this.chaseCompleted = false;
        this.bigBird = {
            x: 0,
            y: 0,
            width: 100,
            height: 70,
            speed: 3,
            direction: 1
        };
        
        // Add 1000-pipe event state
        this.pipe1000Event = {
            active: false,
            walls: [],
            currentWall: 0,
            totalWalls: 3
        };
        
        // Add boss battle state
        this.bossBattle = {
            active: false,
            hearts: [],
            lasers: [],
            laserWarningTime: 60, // Frames before laser fires
            heartSpawnTimer: 0,
            heartSpawnInterval: 120, // Frames between heart spawns
            bossHealth: 3,
            lastHeartSpawn: 0,
            lastLaserTime: 0, // Track last laser shot time
            lastHeartTime: 0 // Track last heart spawn time
        };
        
        // Add horizontal movement speed for boss fight
        this.horizontalSpeed = 3;
        
        // Add key state tracking
        this.keys = {
            left: false,
            right: false
        };
        
        // Initialize game immediately since we don't need to load images
        this.init();
    }
    
    setupColorTabs() {
        const tabs = document.querySelectorAll('.tab');
        const sideControls = document.querySelector('.side-controls');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Check if the skin is locked
                if (tab.classList.contains('locked') && !tab.classList.contains('unlocked')) {
                    // Check if it's a passcode-locked skin
                    if (tab.dataset.passcode) {
                        this.handlePasscodeUnlock(tab);
                    }
                    return; // Don't allow selection of locked skins
                }
                
                // Update active state
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Update bird color
                this.bird.color = tab.dataset.color;
                
                // Show/hide side controls based on alien bird skin
                if (this.bird.color === '#00FF00') {
                    sideControls.style.display = 'block';
                } else {
                    sideControls.style.display = 'none';
                }
            });
        });
    }
    
    setupSideControls() {
        const birdSpeed = document.getElementById('birdSpeed');
        const birdSpeedValue = document.getElementById('birdSpeedValue');
        const pipeCount = document.getElementById('pipeCount');
        
        // Set initial values
        birdSpeed.value = this.pipeSpeed;
        birdSpeedValue.textContent = this.pipeSpeed;
        pipeCount.value = this.pipes.length;
        
        // Bird speed control
        birdSpeed.addEventListener('input', () => {
            this.pipeSpeed = parseFloat(birdSpeed.value);
            birdSpeedValue.textContent = this.pipeSpeed;
        });
        
        // Pipe count control
        document.getElementById('pipeCount').addEventListener('change', (e) => {
            const newCount = Math.min(Math.max(1, parseInt(e.target.value) || 1), 1050);
            e.target.value = newCount;
            
            // Remove or add pipes to match the new count
            while (this.pipes.length > newCount) {
                this.pipes.pop();
            }
            while (this.pipes.length < newCount) {
                this.addPipe();
            }
            
            // Set score to match pipe count
            this.score = newCount;
            this.scoreElement.textContent = `Score: ${this.score}`;
            
            // Update high score if needed
            if (this.score > this.highScore) {
                this.highScore = this.score;
                localStorage.setItem('flappyBirdHighScore', this.highScore);
            }
        });
    }
    
    setupPauseMenu() {
        const resumeButton = this.pauseMenu.querySelector('.resume');
        const restartButton = this.pauseMenu.querySelector('.restart');
        const quitButton = this.pauseMenu.querySelector('.quit');
        const soundToggleButton = this.pauseMenu.querySelector('.sound-toggle');
        const hardModeToggleButton = this.pauseMenu.querySelector('.hard-mode-toggle');

        // Add Lose Everything button
        const loseEverythingButton = document.createElement('button');
        loseEverythingButton.className = 'lose-everything';
        loseEverythingButton.innerHTML = '💀 Lose Everything';
        this.pauseMenu.appendChild(loseEverythingButton);

        resumeButton.addEventListener('click', () => {
            this.togglePause();
        });

        restartButton.addEventListener('click', () => {
            // First unpause the game
            this.isPaused = false;
            this.pauseMenu.style.display = 'none';
            this.pauseButton.textContent = '⏸️ Pause';
            this.pauseButton.classList.remove('paused');
            
            // Then reset the game
            this.resetGame();
        });

        quitButton.addEventListener('click', () => {
            if (confirm('Are you sure you want to quit?')) {
                window.close();
            }
        });

        soundToggleButton.addEventListener('click', () => {
            this.soundEnabled = !this.soundEnabled;
            soundToggleButton.textContent = this.soundEnabled ? '🔊 Sound: On' : '🔈 Sound: Off';
            soundToggleButton.classList.toggle('muted', !this.soundEnabled);
        });

        hardModeToggleButton.addEventListener('click', () => {
            this.hardMode = !this.hardMode;
            hardModeToggleButton.textContent = this.hardMode ? '🎯 Hard Mode: On' : '🎯 Hard Mode: Off';
            hardModeToggleButton.classList.toggle('active', this.hardMode);
        });

        // Add Lose Everything button event listener
        loseEverythingButton.addEventListener('click', () => {
            if (confirm('WARNING: This will reset your high score and lock all skins! Are you sure you want to continue?')) {
                // Reset high score
                this.highScore = 0;
                localStorage.setItem('flappyBirdHighScore', 0);
                
                // Reset all skins to locked state
                const tabs = document.querySelectorAll('.tab');
                tabs.forEach(tab => {
                    if (tab.dataset.color !== '#FFD700') { // Don't lock the default yellow skin
                        tab.classList.remove('unlocked');
                        tab.classList.add('locked');
                    }
                });
                
                // Save the locked state
                this.saveUnlockedSkins();
                
                // Reset the current bird to default yellow
                this.bird.color = '#FFD700';
                
                // Show confirmation message
                const message = document.createElement('div');
                message.className = 'unlock-message';
                message.textContent = "Everything has been reset!";
                document.body.appendChild(message);
                setTimeout(() => message.remove(), 2000);
                
                // Close pause menu
                this.togglePause();
            }
        });
    }
    
    init() {
        // Create initial pipes with random positions
        for (let i = 0; i < 3; i++) {
            // Random gap size between min and max
            const gapSize = Math.random() * (this.maxPipeGap - this.minPipeGap) + this.minPipeGap;
            
            // More random positioning, but still keeping it playable
            const minGapY = 50; // 50px from top
            const maxGapY = this.canvas.height - gapSize - 50; // 50px from bottom
            const gapY = Math.random() * (maxGapY - minGapY) + minGapY;
            
            this.pipes.push({
                x: this.canvas.width + this.pipeWidth + (i * 200), // Space pipes evenly
                gapY: gapY,
                gapSize: gapSize,
                passed: false
            });
        }
        
        // Show start message
        this.startMessage.style.display = 'block';
        
        // Add key up event listener
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
    }
    
    handleKeyPress(event) {
        if (event.code === 'Space') {
            if (!this.gameStarted) {
                this.startGame();
            } else if (this.gameOver) {
                this.resetGame();
            } else {
                this.jump();
            }
            // Play sound for any space press if sound is enabled
            if (this.soundEnabled) {
                this.jumpSound.currentTime = 0;
                this.jumpSound.play().catch(error => {
                    console.log('Error playing jump sound:', error);
                });
            }
        } else if (event.code === 'Escape') {
            this.togglePause();
        }
        // Track left/right key presses during boss fight
        else if (this.bossBattle.active) {
            if (event.code === 'ArrowLeft') {
                this.keys.left = true;
            } else if (event.code === 'ArrowRight') {
                this.keys.right = true;
            }
        }
    }
    
    handleTouch(event) {
        event.preventDefault();
        if (!this.gameStarted) {
            this.startGame();
        } else if (this.gameOver) {
            this.resetGame();
        } else {
            this.jump();
        }
        // Play sound for touch events if sound is enabled
        if (this.soundEnabled) {
            this.jumpSound.currentTime = 0;
            this.jumpSound.play().catch(error => {
                console.log('Error playing jump sound:', error);
            });
        }
    }
    
    togglePause() {
        if (this.gameStarted && !this.gameOver) {
            this.isPaused = !this.isPaused;
            this.pauseButton.textContent = this.isPaused ? '▶️ Resume' : '⏸️ Pause';
            this.pauseButton.classList.toggle('paused', this.isPaused);
            this.pauseMenu.style.display = this.isPaused ? 'block' : 'none';
        }
    }
    
    startGame() {
        this.gameStarted = true;
        this.startMessage.style.display = 'none';
        this.pauseButton.style.display = 'block';
        this.pauseMenu.style.display = 'none';
        this.gameLoop();
    }
    
    resetGame() {
        // Reset game state
        this.score = 0;
        this.scoreElement.textContent = `Score: ${this.score}`;
        this.gameStarted = false;
        this.gameOver = false;
        this.isPaused = false;
        this.pipesPassed = 0; // Reset pipes passed counter
        this.currentTheme = 0; // Reset to first theme
        this.pipeSpeed = 2; // Reset pipe speed to initial value
        this.hardMode = false; // Reset hard mode
        document.querySelector('.hard-mode-toggle').textContent = '🎯 Hard Mode: Off';
        document.querySelector('.hard-mode-toggle').classList.remove('active');
        
        // Reset chase sequence state
        this.chaseStarted = false;
        this.chaseCompleted = false;
        
        // Reset bird position and velocity
        this.bird.y = this.canvas.height / 2;
        this.bird.velocity = 0;
        this.bird.rotation = 0;
        this.bird.color = '#FFD700'; // Reset to default yellow color
        
        // Clear pipes
        this.pipes = [];
        
        // Reset initial pipes flag
        this.initialPipesCreated = false;
        
        // Reset UI elements
        this.pauseButton.style.display = 'none';
        this.pauseButton.textContent = '⏸️ Pause';
        this.pauseButton.classList.remove('paused');
        this.pauseMenu.style.display = 'none';
        
        // Show start message
        this.startMessage.style.display = 'block';
        
        // Initialize the game with new pipes
        this.init();
        
        // Force a redraw to ensure everything is reset visually
        this.draw();
    }
    
    jump() {
        this.bird.velocity = this.jumpForce;
    }
    
    addPipe() {
        // Random gap size between min and max
        const gapSize = Math.random() * (this.maxPipeGap - this.minPipeGap) + this.minPipeGap;
        
        // More random positioning, but still keeping it playable
        const minGapY = 50; // 50px from top
        const maxGapY = this.canvas.height - gapSize - 50; // 50px from bottom
        const gapY = Math.random() * (maxGapY - minGapY) + minGapY;
        
        this.pipes.push({
            x: this.canvas.width + this.pipeWidth,
            gapY: gapY,
            gapSize: gapSize,
            passed: false
        });
    }
    
    loadUnlockedSkins() {
        const unlockedSkins = JSON.parse(localStorage.getItem('unlockedSkins')) || ['#FFD700'];
        const tabs = document.querySelectorAll('.tab');
        tabs.forEach(tab => {
            const color = tab.dataset.color;
            if (unlockedSkins.includes(color)) {
                tab.classList.remove('locked');
                tab.classList.add('unlocked');
            }
        });
    }

    saveUnlockedSkins() {
        const unlockedSkins = Array.from(document.querySelectorAll('.tab.unlocked'))
            .map(tab => tab.dataset.color);
        localStorage.setItem('unlockedSkins', JSON.stringify(unlockedSkins));
    }

    checkUnlockedSkins() {
        const tabs = document.querySelectorAll('.tab.locked');
        let newUnlocks = false;
        
        tabs.forEach(tab => {
            const requiredScore = parseInt(tab.dataset.requiredScore);
            const requiresHardMode = tab.dataset.hardMode === 'true';
            
            // Check if the skin requires hard mode
            if (requiresHardMode) {
                // Only unlock in hard mode
                if (this.hardMode && this.score >= requiredScore && !tab.classList.contains('unlocked')) {
                    tab.classList.remove('locked');
                    tab.classList.add('unlocked');
                    newUnlocks = true;
                    this.showUnlockMessage(tab.querySelector('span').textContent);
                }
            } else {
                // Normal skin unlocking logic
                if (this.score >= requiredScore && !tab.classList.contains('unlocked')) {
                    tab.classList.remove('locked');
                    tab.classList.add('unlocked');
                    newUnlocks = true;
                    this.showUnlockMessage(tab.querySelector('span').textContent);
                }
            }
        });
        
        if (newUnlocks) {
            this.saveUnlockedSkins();
        }
    }

    showUnlockMessage(skinName) {
        // Create and show unlock message
        const message = document.createElement('div');
        message.className = 'unlock-message';
        message.textContent = `Unlocked: ${skinName} Skin!`;
        document.body.appendChild(message);
        
        // Remove message after animation
        setTimeout(() => {
            message.remove();
        }, 2000);
    }

    handlePasscodeUnlock(tab) {
        const passcode = prompt('Enter passcode to unlock the Alien Bird skin:');
        if (passcode === tab.dataset.passcode) {
            tab.classList.remove('locked');
            tab.classList.add('unlocked');
            this.saveUnlockedSkins();
            this.showUnlockMessage(tab.querySelector('span').textContent);
        } else {
            alert('Incorrect passcode!');
        }
    }
    
    update() {
        // Update bird position
        this.bird.velocity += this.gravity;
        this.bird.y += this.bird.velocity;
        
        // Handle horizontal movement during boss fight
        if (this.bossBattle.active) {
            if (this.keys.left) {
                this.bird.x -= this.horizontalSpeed;
            }
            if (this.keys.right) {
                this.bird.x += this.horizontalSpeed;
            }
            
            // Keep bird within screen bounds
            if (this.bird.x < 0) {
                this.bird.x = 0;
            }
            if (this.bird.x + this.bird.width > this.canvas.width) {
                this.bird.x = this.canvas.width - this.bird.width;
            }

            // Make bird float at bottom of screen during boss fight
            if (this.bird.y + this.bird.height > this.canvas.height) {
                this.bird.y = this.canvas.height - this.bird.height;
                this.bird.velocity = 0;
            }
        }
        
        // Update bird rotation based on velocity
        this.bird.rotation = Math.min(Math.max(this.bird.velocity * 0.1, -Math.PI/4), Math.PI/4);
        
        // Check collisions with ground and ceiling (skip for alien bird and boss fight)
        if (this.bird.color !== '#00FF00' && !this.bossBattle.active && 
            (this.bird.y + this.bird.height > this.canvas.height || this.bird.y < 0)) {
            this.gameOver = true;
        }
        
        // Special abilities for alien bird
        if (this.bird.color === '#00FF00') {
            // Make bird float at bottom of screen if it hits it
            if (this.bird.y + this.bird.height > this.canvas.height) {
                this.bird.y = this.canvas.height - this.bird.height;
                this.bird.velocity = 0;
            }
        }
        
        // Only update pipes if not in boss battle
        if (!this.bossBattle.active) {
            // Update pipes
            for (let i = this.pipes.length - 1; i >= 0; i--) {
                const pipe = this.pipes[i];
                pipe.x -= this.pipeSpeed;
                
                // Check collision with pipes (skip for alien bird)
                if (this.bird.color !== '#00FF00' && 
                    this.bird.x + this.bird.width > pipe.x && 
                    this.bird.x < pipe.x + this.pipeWidth) {
                    if (this.bird.y < pipe.gapY || 
                        this.bird.y + this.bird.height > pipe.gapY + pipe.gapSize) {
                        this.gameOver = true;
                    }
                }
                
                // Score point when passing pipe
                if (!pipe.passed && pipe.x + this.pipeWidth < this.bird.x) {
                    pipe.passed = true;
                    this.score++;
                    this.pipesPassed++; // Increment pipes passed counter
                    this.scoreElement.textContent = `Score: ${this.score}`;
                    
                    // Start chase sequence at pipe 100
                    if (this.score === 100 && !this.chaseStarted) {
                        this.startChaseSequence();
                    }
                    
                    // End chase sequence at pipe 200
                    if (this.score === 200 && this.chaseStarted && !this.chaseCompleted) {
                        this.endChaseSequence();
                    }
                    
                    // Check for boss battle start
                    if (this.score === 500 && !this.bossBattle.active) {
                        this.startBossBattle();
                    }
                    
                    // Check for 1000-pipe event
                    if (this.score === 1000 && !this.pipe1000Event.active) {
                        this.startPipe1000Event();
                    }
                    
                    // Increase speed in hard mode
                    if (this.hardMode) {
                        this.pipeSpeed += 0.5;
                    }
                    
                    // Change background theme and increase speed every 50 pipes (only in normal mode)
                    if (!this.hardMode && this.pipesPassed % 50 === 0) {
                        this.currentTheme = (this.currentTheme + 1) % this.backgroundThemes.length;
                        this.pipeSpeed += 0.2; // Increase pipe speed by 0.2
                    }
                    
                    // Update high score if current score is higher
                    if (this.score > this.highScore) {
                        this.highScore = this.score;
                        localStorage.setItem('flappyBirdHighScore', this.highScore);
                    }
                    // Check for newly unlocked skins
                    this.checkUnlockedSkins();
                }
                
                // Remove off-screen pipes
                if (pipe.x + this.pipeWidth < 0) {
                    this.pipes.splice(i, 1);
                }
            }
            
            // Add new pipes
            if (this.pipes[this.pipes.length - 1].x < this.canvas.width - 200) {
                this.addPipe();
            }
        }
        
        // Update big bird during chase sequence
        if (this.chaseStarted && !this.chaseCompleted) {
            this.updateBigBird();
        }

        // Update boss battle if active
        if (this.bossBattle.active) {
            this.updateBossBattle();
        }

        // Update boss defeat animation
        if (this.bossDefeatAnimation?.active) {
            // Move big bird down
            this.bigBird.y += this.bossDefeatAnimation.velocity;
            this.bossDefeatAnimation.rotation += 0.1;
            
            // Move and break pipes
            this.bossDefeatAnimation.pipes.forEach((pipe, index) => {
                pipe.x -= 10; // Move pipes left
                pipe.gapY += this.bossDefeatAnimation.velocity; // Move pipes down
                
                // Break pipes when they hit the bottom
                if (pipe.gapY + pipe.gapSize > this.canvas.height) {
                    this.pipes = this.pipes.filter(p => p !== pipe);
                    this.bossDefeatAnimation.pipes.splice(index, 1);
                }
            });
            
            // End animation when big bird is off screen
            if (this.bigBird.y > this.canvas.height + 100) {
                this.bossDefeatAnimation.active = false;
            }
        }

        // Update 1000-pipe event
        if (this.pipe1000Event.active) {
            this.updatePipe1000Event();
        }
    }
    
    drawBird() {
        const ctx = this.ctx;
        const bird = this.bird;
        
        ctx.save();
        
        // Remove the scaling for big bird skin - it will now be normal size
        ctx.translate(bird.x + bird.width/2, bird.y + bird.height/2);
        ctx.rotate(bird.rotation);
        
        // Body
        if (bird.color === '#00FF00') {
            // Create gradient for alien bird
            const gradient = ctx.createLinearGradient(-bird.width/2, -bird.height/2, bird.width/2, bird.height/2);
            gradient.addColorStop(0, '#00FF00'); // Bright green
            gradient.addColorStop(1, '#006400'); // Dark green
            ctx.fillStyle = gradient;
        } else if (bird.color === '#8B0000') {
            // Demon bird is black
            ctx.fillStyle = '#000000';
        } else if (bird.color === '#FF4500') {
            // Big Bird skin - match the chased big bird's appearance
            ctx.fillStyle = '#FFD700'; // Yellow body
            
            // Scale up if enhanced
            if (localStorage.getItem('bigBirdEnhanced') === 'true') {
                ctx.scale(2, 2);
            }
            
            // Draw main body
            ctx.beginPath();
            ctx.arc(0, 0, bird.width/2, 0, Math.PI * 2);
            ctx.fill();
            
            // Add shadow gradient
            const gradient = ctx.createLinearGradient(
                -bird.width/2,
                -bird.height/2,
                -bird.width/2,
                bird.height/2
            );
            gradient.addColorStop(0, 'rgba(0,0,0,0)');
            gradient.addColorStop(1, 'rgba(0,0,0,0.1)');
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // Draw cap base
            ctx.fillStyle = '#333333';
            ctx.beginPath();
            ctx.moveTo(-bird.width * 0.3, -bird.height/2);
            ctx.lineTo(bird.width * 0.3, -bird.height/2);
            ctx.quadraticCurveTo(
                bird.width * 0.3,
                -bird.height * 0.7,
                0,
                -bird.height * 0.7
            );
            ctx.quadraticCurveTo(
                -bird.width * 0.3,
                -bird.height * 0.7,
                -bird.width * 0.3,
                -bird.height/2
            );
            ctx.fill();
            
            // Draw cap brim
            ctx.beginPath();
            ctx.moveTo(-bird.width * 0.4, -bird.height/2);
            ctx.lineTo(bird.width * 0.4, -bird.height/2);
            ctx.lineTo(bird.width * 0.2, -bird.height * 0.4);
            ctx.lineTo(-bird.width * 0.2, -bird.height * 0.4);
            ctx.closePath();
            ctx.fill();
            
            // Draw beak
            ctx.fillStyle = '#FFA500';
            ctx.beginPath();
            ctx.moveTo(bird.width * 0.3, 0);
            ctx.lineTo(bird.width * 0.6, -bird.height * 0.1);
            ctx.lineTo(bird.width * 0.6, bird.height * 0.1);
            ctx.closePath();
            ctx.fill();
            
            // Draw eye
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(bird.width * 0.2, -bird.height * 0.1, bird.width * 0.08, 0, Math.PI * 2);
            ctx.fill();
            
            // Eye highlight
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(bird.width * 0.22, -bird.height * 0.12, bird.width * 0.03, 0, Math.PI * 2);
            ctx.fill();
            
            // Exit early since we've drawn everything for this skin
            ctx.restore();
            return;
        } else {
            ctx.fillStyle = bird.color === '#FF1493' ? this.getRainbowColor() : bird.color;
        }
        
        ctx.beginPath();
        ctx.ellipse(0, 0, bird.width/2, bird.height/2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Wing
        if (bird.color === '#00FF00') {
            // Create gradient for alien wing
            const wingGradient = ctx.createLinearGradient(-bird.width/2, -bird.height/2, -bird.width/4, 0);
            wingGradient.addColorStop(0, '#00FF00'); // Bright green
            wingGradient.addColorStop(1, '#006400'); // Dark green
            ctx.fillStyle = wingGradient;
        } else if (bird.color === '#8B0000') {
            // Demon wing is black
            ctx.fillStyle = '#000000';
        } else {
            ctx.fillStyle = this.adjustColor(bird.color === '#FF1493' ? this.getRainbowColor() : bird.color, -20);
        }
        
        ctx.beginPath();
        ctx.moveTo(-bird.width/4, 0);
        ctx.quadraticCurveTo(-bird.width/2, -bird.height/2, -bird.width/4, -bird.height/3);
        ctx.quadraticCurveTo(0, -bird.height/4, -bird.width/4, 0);
        ctx.fill();
        
        // Beak
        if (bird.color === '#00FF00') {
            ctx.fillStyle = '#00FF00'; // Green beak for alien
        } else if (bird.color === '#8B0000') {
            ctx.fillStyle = '#FF0000'; // Red beak for demon
        } else {
            ctx.fillStyle = '#FF4500'; // Orange beak for all other birds
        }
        ctx.beginPath();
        ctx.moveTo(bird.width/4, 0);
        ctx.lineTo(bird.width/2, -bird.height/6);
        ctx.lineTo(bird.width/2, bird.height/6);
        ctx.closePath();
        ctx.fill();
        
        // Eye
        if (bird.color === '#00FF00') {
            // Alien eye (large black with green glow)
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(bird.width/6, -bird.height/6, 4, 0, Math.PI * 2);
            ctx.fill();
            
            // Green glow effect
            ctx.strokeStyle = '#00FF00';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(bird.width/6, -bird.height/6, 6, 0, Math.PI * 2);
            ctx.stroke();
            
            // Pulsing effect
            const pulseSize = 2 + Math.sin(Date.now() / 200) * 1;
            ctx.beginPath();
            ctx.arc(bird.width/6, -bird.height/6, 8 + pulseSize, 0, Math.PI * 2);
            ctx.stroke();
        } else if (bird.color === '#8B0000') {
            // Demon eye (red with evil glow)
            ctx.fillStyle = '#FF0000';
            ctx.beginPath();
            ctx.arc(bird.width/6, -bird.height/6, 3, 0, Math.PI * 2);
            ctx.fill();
            
            // Evil red glow effect
            ctx.strokeStyle = '#FF0000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(bird.width/6, -bird.height/6, 5, 0, Math.PI * 2);
            ctx.stroke();
            
            // Evil pulsing effect
            const pulseSize = 2 + Math.sin(Date.now() / 100) * 1.5;
            ctx.beginPath();
            ctx.arc(bird.width/6, -bird.height/6, 7 + pulseSize, 0, Math.PI * 2);
            ctx.stroke();
            
            // Add evil eyebrows
            ctx.strokeStyle = '#FF0000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(bird.width/6 - 5, -bird.height/6 - 5);
            ctx.lineTo(bird.width/6 - 10, -bird.height/6 - 8);
            ctx.moveTo(bird.width/6 + 5, -bird.height/6 - 5);
            ctx.lineTo(bird.width/6 + 10, -bird.height/6 - 8);
            ctx.stroke();
        } else {
            // Normal eye
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(bird.width/6, -bird.height/6, 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Eye highlight
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(bird.width/6 - 1, -bird.height/6 - 1, 1, 0, Math.PI * 2);
            ctx.fill();
        }

        // Antennae (only for alien bird)
        if (bird.color === '#00FF00') {
            // Left antenna
            ctx.beginPath();
            ctx.moveTo(-bird.width/2, -bird.height/2);
            ctx.lineTo(-bird.width/2 - 15, -bird.height/2 - 20);
            ctx.lineTo(-bird.width/2 - 5, -bird.height/2 - 25);
            ctx.strokeStyle = '#00FF00';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Right antenna
            ctx.beginPath();
            ctx.moveTo(bird.width/2, -bird.height/2);
            ctx.lineTo(bird.width/2 + 15, -bird.height/2 - 20);
            ctx.lineTo(bird.width/2 + 5, -bird.height/2 - 25);
            ctx.stroke();
            
            // Antenna bulbs
            ctx.fillStyle = '#00FF00';
            ctx.beginPath();
            ctx.arc(-bird.width/2 - 5, -bird.height/2 - 25, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(bird.width/2 + 5, -bird.height/2 - 25, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Hat
        if (bird.color === '#00FF00') {
            // Create gradient for alien hat
            const hatGradient = ctx.createLinearGradient(-bird.width/2, -bird.height/2, bird.width/2, -bird.height/2);
            hatGradient.addColorStop(0, '#00FF00'); // Bright green
            hatGradient.addColorStop(1, '#006400'); // Dark green
            ctx.fillStyle = hatGradient;
        } else if (bird.color === '#8B0000') {
            // Demon hat is black
            ctx.fillStyle = '#000000';
        } else {
            ctx.fillStyle = bird.color === '#FF1493' ? this.getRainbowColor() : bird.color;
        }
        
        // Hat brim
        ctx.fillRect(-bird.width/2, -bird.height/2, bird.width, 3);
        // Hat top
        ctx.fillRect(-bird.width/3, -bird.height/2 - 10, bird.width/1.5, 10);
        // Hat band
        if (bird.color === '#00FF00') {
            ctx.fillStyle = '#006400'; // Dark green band for alien hat
        } else if (bird.color === '#8B0000') {
            ctx.fillStyle = '#FF0000'; // Red band for demon hat
        } else {
            ctx.fillStyle = this.adjustColor(bird.color === '#FF1493' ? this.getRainbowColor() : bird.color, 20);
        }
        ctx.fillRect(-bird.width/3, -bird.height/2 - 3, bird.width/1.5, 2);
        
        // Add demon horns if it's the demon bird
        if (bird.color === '#8B0000') {
            // Left horn
            ctx.beginPath();
            ctx.moveTo(-bird.width/2, -bird.height/2);
            ctx.lineTo(-bird.width/2 - 15, -bird.height/2 - 25);
            ctx.lineTo(-bird.width/2 - 5, -bird.height/2 - 30);
            ctx.strokeStyle = '#FF0000'; // Red horns
            ctx.lineWidth = 3;
            ctx.stroke();
            
            // Right horn
            ctx.beginPath();
            ctx.moveTo(bird.width/2, -bird.height/2);
            ctx.lineTo(bird.width/2 + 15, -bird.height/2 - 25);
            ctx.lineTo(bird.width/2 + 5, -bird.height/2 - 30);
            ctx.stroke();
        }
        
        ctx.restore();
    }

    adjustColor(color, amount) {
        const hex = color.replace('#', '');
        const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
        const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
        const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw sky background
        this.ctx.fillStyle = this.backgroundThemes[this.currentTheme].sky;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw city skyline
        this.ctx.fillStyle = this.backgroundThemes[this.currentTheme].buildings;
        
        // Draw various buildings
        // First set of buildings (left side)
        this.ctx.fillRect(10, this.canvas.height - 100, 30, 100);
        this.ctx.fillRect(50, this.canvas.height - 120, 40, 120);
        this.ctx.fillRect(100, this.canvas.height - 140, 25, 140);
        
        // Tall skyscraper with antenna
        this.ctx.fillRect(140, this.canvas.height - 170, 35, 170);
        this.ctx.fillRect(152, this.canvas.height - 190, 10, 20);
        
        // Middle buildings
        this.ctx.fillRect(190, this.canvas.height - 110, 45, 110);
        this.ctx.fillRect(245, this.canvas.height - 130, 30, 130);
        
        // Right side buildings
        this.ctx.fillRect(285, this.canvas.height - 120, 50, 120);
        this.ctx.fillRect(345, this.canvas.height - 90, 40, 90);
        
        // Add windows to buildings (small yellow squares)
        this.ctx.fillStyle = this.backgroundThemes[this.currentTheme].windows;
        
        // Windows for left buildings
        for (let x = 15; x < 35; x += 10) {
            for (let y = this.canvas.height - 90; y < this.canvas.height - 10; y += 15) {
                this.ctx.fillRect(x, y, 5, 5);
            }
        }
        
        // Windows for middle buildings
        for (let x = 55; x < 85; x += 10) {
            for (let y = this.canvas.height - 110; y < this.canvas.height - 10; y += 15) {
                this.ctx.fillRect(x, y, 5, 5);
            }
        }
        
        // Windows for tall skyscraper
        for (let x = 145; x < 170; x += 10) {
            for (let y = this.canvas.height - 160; y < this.canvas.height - 10; y += 15) {
                this.ctx.fillRect(x, y, 5, 5);
            }
        }
        
        // Windows for right buildings
        for (let x = 290; x < 330; x += 10) {
            for (let y = this.canvas.height - 110; y < this.canvas.height - 10; y += 15) {
                this.ctx.fillRect(x, y, 5, 5);
            }
        }
        
        // Draw mountains
        // First layer - background mountains (darkest)
        this.ctx.fillStyle = this.backgroundThemes[this.currentTheme].mountains[0];
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.canvas.height);
        
        // Background mountain range
        this.ctx.bezierCurveTo(
            50, this.canvas.height - 130,
            100, this.canvas.height - 180,
            150, this.canvas.height - 120
        );
        this.ctx.bezierCurveTo(
            200, this.canvas.height - 160,
            250, this.canvas.height - 190,
            300, this.canvas.height - 140
        );
        this.ctx.bezierCurveTo(
            350, this.canvas.height - 170,
            380, this.canvas.height - 150,
            400, this.canvas.height
        );
        
        this.ctx.closePath();
        this.ctx.fill();
        
        // Second layer - mid-distance mountains
        this.ctx.fillStyle = this.backgroundThemes[this.currentTheme].mountains[1];
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.canvas.height);
        
        // Mid-distance mountain range
        this.ctx.bezierCurveTo(
            70, this.canvas.height - 90,
            120, this.canvas.height - 140,
            180, this.canvas.height - 100
        );
        this.ctx.bezierCurveTo(
            240, this.canvas.height - 130,
            280, this.canvas.height - 110,
            340, this.canvas.height - 120
        );
        this.ctx.bezierCurveTo(
            380, this.canvas.height - 90,
            390, this.canvas.height - 80,
            400, this.canvas.height
        );
        
        this.ctx.closePath();
        this.ctx.fill();
        
        // Third layer - foreground hills (lightest)
        this.ctx.fillStyle = this.backgroundThemes[this.currentTheme].mountains[2];
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.canvas.height);
        
        // First hill - smoother and more rounded
        this.ctx.bezierCurveTo(
            50, this.canvas.height - 70,  // control point 1
            80, this.canvas.height - 100, // control point 2
            150, this.canvas.height - 80  // end point
        );
        
        // Connect to second hill with a gentle valley
        this.ctx.bezierCurveTo(
            200, this.canvas.height - 60,  // control point 1
            220, this.canvas.height - 50,  // control point 2
            250, this.canvas.height - 70   // end point
        );
        
        // Second hill - smoother and more rounded
        this.ctx.bezierCurveTo(
            300, this.canvas.height - 110, // control point 1
            350, this.canvas.height - 90,  // control point 2
            400, this.canvas.height        // end point
        );
        
        this.ctx.closePath();
        this.ctx.fill();
        
        // Draw grass
        this.ctx.fillStyle = this.backgroundThemes[this.currentTheme].grass;
        this.ctx.fillRect(0, this.canvas.height - 30, this.canvas.width, 30);
        
        // Draw grass blades
        this.ctx.fillStyle = this.backgroundThemes[this.currentTheme].grassBlades;
        for (let i = 0; i < this.canvas.width; i += 5) {
            const height = 5 + Math.random() * 10;  // Random height between 5-15px
            this.ctx.fillRect(i, this.canvas.height - 30 - height, 2, height);
        }
        
        // Draw clouds
        this.ctx.fillStyle = 'white';
        this.drawCloud(50, 100);
        this.drawCloud(200, 150);
        this.drawCloud(350, 80);
        
        // Draw bird
        this.drawBird();
        
        // Only draw pipes if not in boss battle or 1000-pipe event
        if (!this.bossBattle.active && !this.pipe1000Event.active) {
            // Draw pipes
            this.pipes.forEach(pipe => {
                // Pipe body color
                this.ctx.fillStyle = '#2ECC71';
                
                // Upper pipe
                this.ctx.fillRect(pipe.x, 0, this.pipeWidth, pipe.gapY);
                // Upper pipe cap
                this.ctx.fillRect(pipe.x - 5, pipe.gapY - 20, this.pipeWidth + 10, 20);
                
                // Lower pipe
                this.ctx.fillRect(pipe.x, pipe.gapY + pipe.gapSize, 
                                this.pipeWidth, this.canvas.height - pipe.gapY - pipe.gapSize);
                // Lower pipe cap
                this.ctx.fillRect(pipe.x - 5, pipe.gapY + pipe.gapSize, this.pipeWidth + 10, 20);
            });
        }
        
        // Draw score and high score
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`High Score: ${this.highScore}`, this.canvas.width - 20, 40);
        
        // Draw big bird only during active chase sequence (between pipes 100-200)
        if (this.chaseStarted && !this.chaseCompleted && !this.gameOver && this.score >= 100 && this.score <= 200) {
            if (this.crashAnimation?.active) {
                this.updateCrashAnimation();
                this.drawCrashAnimation();
            } else {
                this.drawBigBird();
            }
        }
        
        // Draw boss battle elements
        if (this.bossBattle.active) {
            // Draw laser warnings
            this.bossBattle.lasers.forEach(laser => {
                if (laser.warning) {
                    // Flash red warning
                    const flash = Math.sin(Date.now() / 100) > 0;
                    this.ctx.fillStyle = flash ? 'rgba(255, 0, 0, 0.5)' : 'rgba(255, 0, 0, 0.2)';
                    this.ctx.fillRect(laser.x, laser.y, this.canvas.width, laser.height);
                }
            });

            // Draw active lasers
            this.bossBattle.lasers.forEach(laser => {
                if (laser.active) {
                    this.ctx.fillStyle = '#FF0000';
                    this.ctx.fillRect(laser.x, laser.y, laser.width, laser.height);
                }
            });

            // Draw hearts
            this.bossBattle.hearts.forEach(heart => {
                this.drawHeart(heart.x, heart.y, heart.width, heart.height);
            });

            // Draw boss health
            this.ctx.fillStyle = '#FFD700';
            this.ctx.font = 'bold 24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`Boss Health: ${this.bossBattle.bossHealth}`, this.canvas.width / 2, 40);

            // Draw crowned big bird
            this.drawCrownedBigBird();
        }

        // Draw 1000-pipe event
        if (this.pipe1000Event.active) {
            this.drawPipe1000Event();
        }
        
        // Draw game over message
        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Draw "Game Over!" text
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 36px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Game Over!', this.canvas.width / 2, this.canvas.height / 2 - 60);
            
            // Draw inspirational quote with word wrap
            this.ctx.font = '16px Arial';
            this.ctx.fillStyle = '#FFD700';
            const quote = this.inspirationalQuotes[Math.floor(Math.random() * this.inspirationalQuotes.length)];
            const maxWidth = this.canvas.width - 40; // Leave 20px margin on each side
            const words = quote.split(' ');
            let line = '';
            let lines = [];
            
            words.forEach(word => {
                const testLine = line + word + ' ';
                const metrics = this.ctx.measureText(testLine);
                if (metrics.width > maxWidth) {
                    lines.push(line);
                    line = word + ' ';
                } else {
                    line = testLine;
                }
            });
            lines.push(line);
            
            // Draw each line of the quote
            lines.forEach((line, index) => {
                this.ctx.fillText(line, this.canvas.width / 2, this.canvas.height / 2 - 20 + (index * 20));
            });
            
            // Draw restart instruction
            this.ctx.font = '20px Arial';
            this.ctx.fillStyle = 'white';
            this.ctx.fillText('Press Space to Restart', this.canvas.width / 2, this.canvas.height / 2 + 40);
            
            // Draw credits
            this.ctx.font = '16px Arial';
            this.ctx.fillText('by Matthew Rowe', this.canvas.width / 2, this.canvas.height / 2 + 70);
        }

        // Draw boss defeat animation
        if (this.bossDefeatAnimation?.active) {
            // Draw rotating big bird
            this.ctx.save();
            this.ctx.translate(this.bigBird.x + this.bigBird.width/2, this.bigBird.y + this.bigBird.height/2);
            this.ctx.rotate(this.bossDefeatAnimation.rotation);
            this.ctx.translate(-(this.bigBird.x + this.bigBird.width/2), -(this.bigBird.y + this.bigBird.height/2));
            this.drawCrownedBigBird();
            this.ctx.restore();
        }
    }
    
    // Helper method to draw clouds
    drawCloud(x, y) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, 20, 0, Math.PI * 2);
        this.ctx.arc(x + 20, y - 10, 15, 0, Math.PI * 2);
        this.ctx.arc(x + 20, y + 10, 15, 0, Math.PI * 2);
        this.ctx.arc(x + 40, y, 20, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    gameLoop() {
        if (!this.gameOver && !this.isPaused) {
            this.update();
            this.draw();
            requestAnimationFrame(this.gameLoop.bind(this));
        } else if (!this.gameOver && this.isPaused) {
            // Draw the current game state while paused
            this.draw();
            requestAnimationFrame(this.gameLoop.bind(this));
        }
    }

    // Add this new method for rainbow color
    getRainbowColor() {
        this.bird.rainbowHue = (this.bird.rainbowHue + 1) % 360;
        return `hsl(${this.bird.rainbowHue}, 100%, 50%)`;
    }
    
    startChaseSequence() {
        this.chaseStarted = true;
        // Position big bird at the right side of the screen, below the canvas
        this.bigBird.x = this.canvas.width - this.bigBird.width;
        this.bigBird.y = this.canvas.height + this.bigBird.height;
        this.bigBird.spawnAnimation = {
            active: true,
            velocity: -8, // Negative velocity to move upward
            timer: 0
        };
        // Show chase message
        this.showChaseMessage();
    }
    
    endChaseSequence() {
        // Don't set chaseCompleted immediately - wait for animation
        if (this.checkBigBirdCollision()) {
            this.showUnlockMessage("Big Bird");
            this.unlockBigBirdSkin();
            this.chaseCompleted = true;
        } else {
            // Start crash animation and unlock big bird skin as consolation prize
            this.startCrashAnimation();
            this.showUnlockMessage("Big Bird (Consolation Prize)");
            this.unlockBigBirdSkin();
        }
    }

    startCrashAnimation() {
        this.crashAnimation = {
            active: true,
            wall: {
                x: this.canvas.width - 50,
                y: 0,
                width: 50,
                height: this.canvas.height,
                broken: false,
                pieces: []
            },
            velocity: { x: 0, y: 0 },
            rotation: 0,
            timer: 0
        };

        // Create wall debris pieces
        for (let i = 0; i < 10; i++) {
            this.crashAnimation.wall.pieces.push({
                x: this.canvas.width - 50,
                y: Math.random() * this.canvas.height,
                size: 10 + Math.random() * 20,
                velocity: {
                    x: Math.random() * 5 + 3,
                    y: -Math.random() * 10 - 5
                },
                rotation: Math.random() * Math.PI * 2
            });
        }
    }

    updateCrashAnimation() {
        if (!this.crashAnimation?.active) return;

        this.crashAnimation.timer++;

        // Phase 1: Big bird flies into wall
        if (this.crashAnimation.timer < 30) {
            this.bigBird.x += 5;
        }
        // Phase 2: Wall breaks and big bird starts falling
        else if (this.crashAnimation.timer === 30) {
            this.crashAnimation.wall.broken = true;
            this.crashAnimation.velocity.y = -10; // Initial upward bounce
            this.crashAnimation.velocity.x = 3;   // Move right
        }
        // Phase 3: Big bird falls with physics
        else {
            this.crashAnimation.velocity.y += 0.5; // Gravity
            this.bigBird.x += this.crashAnimation.velocity.x;
            this.bigBird.y += this.crashAnimation.velocity.y;
            this.crashAnimation.rotation += 0.1;

            // Update wall pieces
            this.crashAnimation.wall.pieces.forEach(piece => {
                piece.x += piece.velocity.x;
                piece.y += piece.velocity.y;
                piece.velocity.y += 0.2; // Gravity on pieces
                piece.rotation += 0.1;
            });
        }

        // End animation when big bird is off screen
        if (this.bigBird.y > this.canvas.height + 100) {
            this.crashAnimation.active = false;
            this.chaseCompleted = true;
        }
    }

    drawCrashAnimation() {
        if (!this.crashAnimation?.active) return;

        const ctx = this.ctx;

        // Draw the wall if not broken
        if (!this.crashAnimation.wall.broken) {
            ctx.fillStyle = '#8B4513'; // Brown color for wall
            ctx.fillRect(
                this.crashAnimation.wall.x,
                this.crashAnimation.wall.y,
                this.crashAnimation.wall.width,
                this.crashAnimation.wall.height
            );

            // Add brick pattern
            ctx.strokeStyle = '#6B3211';
            for (let y = 0; y < this.canvas.height; y += 20) {
                for (let x = 0; x < 50; x += 25) {
                    ctx.strokeRect(
                        this.crashAnimation.wall.x + x,
                        y,
                        25,
                        20
                    );
                }
            }
        } else {
            // Draw wall pieces
            ctx.fillStyle = '#8B4513';
            this.crashAnimation.wall.pieces.forEach(piece => {
                ctx.save();
                ctx.translate(piece.x + piece.size/2, piece.y + piece.size/2);
                ctx.rotate(piece.rotation);
                ctx.fillRect(-piece.size/2, -piece.size/2, piece.size, piece.size);
                ctx.restore();
            });
        }

        // Draw rotating big bird
        ctx.save();
        ctx.translate(this.bigBird.x + this.bigBird.width/2, this.bigBird.y + this.bigBird.height/2);
        if (this.crashAnimation.timer >= 30) {
            ctx.rotate(this.crashAnimation.rotation);
        }
        ctx.translate(-(this.bigBird.x + this.bigBird.width/2), -(this.bigBird.y + this.bigBird.height/2));
        this.drawBigBird();
        ctx.restore();
    }
    
    updateBigBird() {
        // Handle spawn animation if active
        if (this.bigBird.spawnAnimation?.active) {
            this.bigBird.y += this.bigBird.spawnAnimation.velocity;
            this.bigBird.spawnAnimation.timer++;

            // When bird reaches normal height, end spawn animation
            if (this.bigBird.y <= this.canvas.height / 2) {
                this.bigBird.y = this.canvas.height / 2;
                this.bigBird.spawnAnimation.active = false;
                // Add a small bounce effect
                this.bigBird.velocity = 2;
            }
        } else {
            // Normal up and down movement
            this.bigBird.y += this.bigBird.speed * this.bigBird.direction;
            
            // Change direction when hitting screen bounds
            if (this.bigBird.y <= 0 || this.bigBird.y + this.bigBird.height >= this.canvas.height) {
                this.bigBird.direction *= -1;
            }
        }
        
        // Always stay in front of the player by maintaining a fixed distance
        this.bigBird.x = this.bird.x + 150; // Keep 150 pixels ahead of the player
    }
    
    checkBigBirdCollision() {
        return (
            this.bird.x < this.bigBird.x + this.bigBird.width &&
            this.bird.x + this.bird.width > this.bigBird.x &&
            this.bird.y < this.bigBird.y + this.bigBird.height &&
            this.bird.y + this.bird.height > this.bigBird.y
        );
    }
    
    showChaseMessage() {
        const message = document.createElement('div');
        message.className = 'unlock-message';
        message.textContent = "The Big Bird has appeared! Catch it before it gets away!";
        document.body.appendChild(message);
        setTimeout(() => message.remove(), 3000);
    }
    
    unlockBigBirdSkin() {
        const bigBirdTab = document.querySelector('.tab[data-color="#FF4500"]');
        if (bigBirdTab) {
            bigBirdTab.classList.remove('locked');
            bigBirdTab.classList.add('unlocked');
            this.saveUnlockedSkins();
        }
    }
    
    drawBigBird() {
        const ctx = this.ctx;
        ctx.save();
        
        // Add a shadow effect during spawn animation
        if (this.bigBird.spawnAnimation?.active) {
            const shadowOpacity = 1 - (this.bigBird.spawnAnimation.timer / 30);
            ctx.fillStyle = `rgba(0, 0, 0, ${shadowOpacity * 0.3})`;
            ctx.beginPath();
            ctx.ellipse(
                this.bigBird.x + this.bigBird.width/2,
                this.canvas.height + 10,
                this.bigBird.width/2,
                this.bigBird.height/4,
                0, 0, Math.PI
            );
            ctx.fill();
        }
        
        // Draw main body (round yellow bird)
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(
            this.bigBird.x + this.bigBird.width/2,
            this.bigBird.y + this.bigBird.height/2,
            this.bigBird.width/2,
            0, Math.PI * 2
        );
        ctx.fill();
        
        // Add slight shadow/shading at the bottom
        const gradient = ctx.createLinearGradient(
            this.bigBird.x,
            this.bigBird.y,
            this.bigBird.x,
            this.bigBird.y + this.bigBird.height
        );
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.1)');
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Orange beak
        ctx.fillStyle = '#FFA500';
        ctx.beginPath();
        ctx.moveTo(
            this.bigBird.x + this.bigBird.width * 0.8,
            this.bigBird.y + this.bigBird.height * 0.4
        );
        ctx.lineTo(
            this.bigBird.x + this.bigBird.width * 1.1,
            this.bigBird.y + this.bigBird.height * 0.5
        );
        ctx.lineTo(
            this.bigBird.x + this.bigBird.width * 0.8,
            this.bigBird.y + this.bigBird.height * 0.6
        );
        ctx.closePath();
        ctx.fill();
        
        // Black eye
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(
            this.bigBird.x + this.bigBird.width * 0.7,
            this.bigBird.y + this.bigBird.height * 0.4,
            this.bigBird.width * 0.08,
            0, Math.PI * 2
        );
        ctx.fill();
        
        // White eye highlight
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(
            this.bigBird.x + this.bigBird.width * 0.72,
            this.bigBird.y + this.bigBird.height * 0.38,
            this.bigBird.width * 0.03,
            0, Math.PI * 2
        );
        ctx.fill();
        
        // Baseball cap - now positioned at the very top of the circle
        // Cap base
        ctx.fillStyle = '#333333';
        ctx.beginPath();
        ctx.moveTo(
            this.bigBird.x + this.bigBird.width * 0.2,
            this.bigBird.y  // At the very top of the circle
        );
        ctx.lineTo(
            this.bigBird.x + this.bigBird.width * 0.8,
            this.bigBird.y  // At the very top of the circle
        );
        ctx.quadraticCurveTo(
            this.bigBird.x + this.bigBird.width * 0.8,
            this.bigBird.y - this.bigBird.height * 0.2,  // Curve up
            this.bigBird.x + this.bigBird.width * 0.5,
            this.bigBird.y - this.bigBird.height * 0.2   // Top of cap
        );
        ctx.quadraticCurveTo(
            this.bigBird.x + this.bigBird.width * 0.2,
            this.bigBird.y - this.bigBird.height * 0.2,  // Curve up
            this.bigBird.x + this.bigBird.width * 0.2,
            this.bigBird.y  // Back to the start
        );
        ctx.fill();
        
        // Cap brim
        ctx.fillStyle = '#333333';
        ctx.beginPath();
        ctx.moveTo(
            this.bigBird.x + this.bigBird.width * 0.1,
            this.bigBird.y  // At the very top of the circle
        );
        ctx.lineTo(
            this.bigBird.x + this.bigBird.width * 0.9,
            this.bigBird.y  // At the very top of the circle
        );
        ctx.lineTo(
            this.bigBird.x + this.bigBird.width * 0.7,
            this.bigBird.y + this.bigBird.height * 0.1  // Brim angles down
        );
        ctx.lineTo(
            this.bigBird.x + this.bigBird.width * 0.3,
            this.bigBird.y + this.bigBird.height * 0.1  // Brim angles down
        );
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }

    startBossBattle() {
        this.bossBattle.active = true;
        this.bossBattle.hearts = [];
        this.bossBattle.lasers = [];
        this.bossBattle.bossHealth = 3;
        this.bossBattle.lastHeartSpawn = 0;
        this.bossBattle.lastLaserTime = 0; // Track last laser shot time
        this.bossBattle.lastHeartTime = 0; // Track last heart spawn time
        
        // Position big bird in center
        this.bigBird.x = this.canvas.width / 2 - this.bigBird.width / 2;
        this.bigBird.y = this.canvas.height / 2 - this.bigBird.height / 2;
        
        // Show battle message
        const message = document.createElement('div');
        message.className = 'unlock-message';
        message.textContent = "BOSS BATTLE: The Crowned Big Bird!";
        document.body.appendChild(message);
        setTimeout(() => message.remove(), 3000);
    }

    updateBossBattle() {
        // Update heart spawn timer
        const currentTime = Date.now();
        if (currentTime - this.bossBattle.lastHeartTime >= 10000) { // 10000ms = 10 seconds
            this.spawnHeart();
            this.bossBattle.lastHeartTime = currentTime;
        }

        // Update lasers
        for (let i = this.bossBattle.lasers.length - 1; i >= 0; i--) {
            const laser = this.bossBattle.lasers[i];
            
            if (laser.warning) {
                laser.warningTime--;
                if (laser.warningTime <= 0) {
                    laser.warning = false;
                    laser.active = true;
                }
            } else if (laser.active) {
                // Move horizontally instead of vertically
                laser.x += laser.speed;
                
                // Check collision with player
                if (this.checkLaserCollision(laser)) {
                    this.gameOver = true;
                }
                
                // Remove off-screen lasers
                if (laser.x > this.canvas.width) {
                    this.bossBattle.lasers.splice(i, 1);
                }
            }
        }

        // Update hearts
        for (let i = this.bossBattle.hearts.length - 1; i >= 0; i--) {
            const heart = this.bossBattle.hearts[i];
            
            // Check collision with player
            if (this.checkHeartCollision(heart)) {
                this.bossBattle.hearts.splice(i, 1);
                this.bossBattle.bossHealth--;
                
                if (this.bossBattle.bossHealth <= 0) {
                    this.endBossBattle();
                }
            }
        }

        // Spawn new laser warning every 2 seconds
        if (currentTime - this.bossBattle.lastLaserTime >= 2000) { // 2000ms = 2 seconds
            this.spawnLaserWarning();
            this.bossBattle.lastLaserTime = currentTime;
        }
    }

    spawnLaserWarning() {
        // Random height for the laser
        const y = Math.random() * (this.canvas.height - 100) + 50; // Keep away from top and bottom edges
        this.bossBattle.lasers.push({
            x: -20, // Start off-screen to the left
            y: y,
            width: 40,
            height: 20, // Thicker for horizontal laser
            speed: 5,
            warning: true,
            warningTime: this.bossBattle.laserWarningTime,
            active: false
        });
    }

    spawnHeart() {
        // Random Y position between 50 and canvas height - 50
        const y = Math.random() * (this.canvas.height - 100) + 50;
        this.bossBattle.hearts.push({
            x: 50, // Fixed X position on the left side
            y: y,
            width: 30,
            height: 30
        });
    }

    checkLaserCollision(laser) {
        return (
            this.bird.x < laser.x + laser.width &&
            this.bird.x + this.bird.width > laser.x &&
            this.bird.y < laser.y + laser.height &&
            this.bird.y + this.bird.height > laser.y
        );
    }

    checkHeartCollision(heart) {
        return (
            this.bird.x < heart.x + heart.width &&
            this.bird.x + this.bird.width > heart.x &&
            this.bird.y < heart.y + heart.height &&
            this.bird.y + this.bird.height > heart.y
        );
    }

    endBossBattle() {
        this.bossBattle.active = false;
        this.showUnlockMessage("Crowned Big Bird");
        this.unlockCrownedBigBirdSkin();
        
        // Center the player on Y-axis
        this.bird.y = this.canvas.height / 2 - this.bird.height / 2;
        this.bird.velocity = 0;
        
        // Create 10 pipes for the boss to break
        for (let i = 0; i < 10; i++) {
            this.pipes.push({
                x: this.canvas.width + (i * 100),
                gapY: this.canvas.height / 2,
                gapSize: 200,
                passed: false
            });
        }
        
        // Start boss defeat animation
        this.bossDefeatAnimation = {
            active: true,
            pipes: this.pipes.slice(-10), // Get the last 10 pipes
            velocity: 5,
            rotation: 0
        };
        
        // Show victory message
        const message = document.createElement('div');
        message.className = 'unlock-message';
        message.textContent = "VICTORY! You've defeated the Crowned Big Bird!";
        document.body.appendChild(message);
        
        // Add countdown message
        const countdownMessage = document.createElement('div');
        countdownMessage.className = 'unlock-message';
        countdownMessage.style.top = '60%';
        countdownMessage.textContent = "10 seconds until the next challenge...";
        document.body.appendChild(countdownMessage);
        
        // Remove messages after 10 seconds
        setTimeout(() => {
            message.remove();
            countdownMessage.remove();
        }, 10000);
    }

    unlockCrownedBigBirdSkin() {
        const crownedBigBirdTab = document.querySelector('.tab[data-color="#FFD700"]');
        if (crownedBigBirdTab) {
            crownedBigBirdTab.classList.remove('locked');
            crownedBigBirdTab.classList.add('unlocked');
            this.saveUnlockedSkins();
        }
    }

    drawHeart(x, y, width, height) {
        this.ctx.save();
        this.ctx.translate(x + width/2, y + height/2);
        this.ctx.scale(width/30, height/30);
        
        this.ctx.fillStyle = '#FF0000';
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.bezierCurveTo(-10, -10, -10, -20, 0, -30);
        this.ctx.bezierCurveTo(10, -20, 10, -10, 0, 0);
        this.ctx.fill();
        
        this.ctx.restore();
    }

    drawCrownedBigBird() {
        const ctx = this.ctx;
        ctx.save();
        
        // Draw regular big bird first
        this.drawBigBird();
        
        // Add crown
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.moveTo(this.bigBird.x + this.bigBird.width * 0.2, this.bigBird.y - this.bigBird.height * 0.3);
        ctx.lineTo(this.bigBird.x + this.bigBird.width * 0.4, this.bigBird.y - this.bigBird.height * 0.4);
        ctx.lineTo(this.bigBird.x + this.bigBird.width * 0.6, this.bigBird.y - this.bigBird.height * 0.3);
        ctx.lineTo(this.bigBird.x + this.bigBird.width * 0.8, this.bigBird.y - this.bigBird.height * 0.4);
        ctx.lineTo(this.bigBird.x + this.bigBird.width * 0.8, this.bigBird.y - this.bigBird.height * 0.3);
        ctx.lineTo(this.bigBird.x + this.bigBird.width * 0.2, this.bigBird.y - this.bigBird.height * 0.3);
        ctx.fill();
        
        // Add jewels to crown
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc(this.bigBird.x + this.bigBird.width * 0.4, this.bigBird.y - this.bigBird.height * 0.4, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#00FF00';
        ctx.beginPath();
        ctx.arc(this.bigBird.x + this.bigBird.width * 0.6, this.bigBird.y - this.bigBird.height * 0.4, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }

    startPipe1000Event() {
        this.pipe1000Event.active = true;
        this.pipe1000Event.walls = [];
        this.pipe1000Event.currentWall = 0;
        
        // Create three walls
        for (let i = 0; i < this.pipe1000Event.totalWalls; i++) {
            this.pipe1000Event.walls.push({
                x: this.canvas.width + (i * 300),
                y: 0,
                width: 50,
                height: this.canvas.height,
                broken: false,
                pieces: []
            });
        }
        
        // Position big bird at the right side of the screen
        this.bigBird.x = this.canvas.width - this.bigBird.width;
        this.bigBird.y = this.canvas.height / 2;
        
        // Show event message
        const message = document.createElement('div');
        message.className = 'unlock-message';
        message.textContent = "Something strange is happening to Big Bird...";
        document.body.appendChild(message);
        setTimeout(() => message.remove(), 3000);
    }

    updatePipe1000Event() {
        if (!this.pipe1000Event.active) return;

        // Move big bird towards current wall
        const currentWall = this.pipe1000Event.walls[this.pipe1000Event.currentWall];
        if (currentWall) {
            // Move big bird towards wall
            this.bigBird.x += 5;
            
            // Check collision with wall
            if (this.bigBird.x + this.bigBird.width >= currentWall.x) {
                // Break wall
                currentWall.broken = true;
                
                // Create wall pieces
                for (let i = 0; i < 15; i++) {
                    currentWall.pieces.push({
                        x: currentWall.x + Math.random() * currentWall.width,
                        y: Math.random() * currentWall.height,
                        size: 10 + Math.random() * 20,
                        velocity: {
                            x: Math.random() * 5 + 3,
                            y: -Math.random() * 10 - 5
                        },
                        rotation: Math.random() * Math.PI * 2
                    });
                }
                
                // Move to next wall
                this.pipe1000Event.currentWall++;
                
                // If all walls are broken, end event
                if (this.pipe1000Event.currentWall >= this.pipe1000Event.totalWalls) {
                    this.endPipe1000Event();
                }
            }
        }
        
        // Update wall pieces
        this.pipe1000Event.walls.forEach(wall => {
            if (wall.broken) {
                wall.pieces.forEach(piece => {
                    piece.x += piece.velocity.x;
                    piece.y += piece.velocity.y;
                    piece.velocity.y += 0.2; // Gravity
                    piece.rotation += 0.1;
                });
            }
        });
    }

    drawPipe1000Event() {
        if (!this.pipe1000Event.active) return;

        const ctx = this.ctx;
        
        // Draw walls
        this.pipe1000Event.walls.forEach(wall => {
            if (!wall.broken) {
                // Draw wall
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
                
                // Add brick pattern
                ctx.strokeStyle = '#6B3211';
                for (let y = 0; y < this.canvas.height; y += 20) {
                    for (let x = 0; x < wall.width; x += 25) {
                        ctx.strokeRect(wall.x + x, y, 25, 20);
                    }
                }
            } else {
                // Draw wall pieces
                ctx.fillStyle = '#8B4513';
                wall.pieces.forEach(piece => {
                    ctx.save();
                    ctx.translate(piece.x + piece.size/2, piece.y + piece.size/2);
                    ctx.rotate(piece.rotation);
                    ctx.fillRect(-piece.size/2, -piece.size/2, piece.size, piece.size);
                    ctx.restore();
                });
            }
        });
        
        // Draw big bird
        this.drawBigBird();
    }

    endPipe1000Event() {
        this.pipe1000Event.active = false;
        
        // Show message about big bird skin
        const message = document.createElement('div');
        message.className = 'unlock-message';
        message.textContent = "Your Big Bird skin has grown twice as large!";
        document.body.appendChild(message);
        setTimeout(() => message.remove(), 3000);
        
        // Store the enhanced big bird state
        localStorage.setItem('bigBirdEnhanced', 'true');
    }

    handleKeyUp(event) {
        // Track key releases for left/right movement
        if (event.code === 'ArrowLeft') {
            this.keys.left = false;
        } else if (event.code === 'ArrowRight') {
            this.keys.right = false;
        }
    }
}

// Start the game when the page loads
window.onload = () => {
    new FlappyBird();
}; 