// Game variables
let gameRunning = false;
let score = 0;
let fishY = 0;
let fishVelocity = 0;
let gravity = 0.5;
let flapStrength = -10;
let obstacles = [];
let obstacleSpeed = 3;
let obstacleFrequency = 1800; // ms
let lastObstacleTime = 0;
let gameAreaHeight = 0;
let gameAreaWidth = 0;
let animationFrameId = null;
let isOnline = true;
let gameStarted = false;
let lastFlapTime = 0;
const flapCooldown = 150; // ms

// DOM elements
const fish = document.getElementById('fish');
const gameContainer = document.getElementById('game-container');
const scoreDisplay = document.getElementById('score-display');
const gameOverDisplay = document.getElementById('game-over');
const finalScoreDisplay = document.getElementById('final-score');
const playAgainBtn = document.getElementById('play-again');
const returnToMenuBtn = document.getElementById('return-to-menu');
const startScreen = document.getElementById('start-screen');
const startButton = document.getElementById('start-button');
const howToPlayBtn = document.getElementById('how-to-play-btn');
const installBtn = document.getElementById('install-btn');
const offlineMessage = document.getElementById('offline-message');
const flapSound = document.getElementById('flap-sound');
const hitSound = document.getElementById('hit-sound');
const scoreSound = document.getElementById('score-sound');
const bgMusic = document.getElementById('bg-music');

// Create network status element
const networkStatus = document.createElement('div');
networkStatus.id = 'network-status';
gameContainer.appendChild(networkStatus);

// Create controls help element
const controlsHelp = document.createElement('div');
controlsHelp.id = 'controls-help';
controlsHelp.innerHTML = 'SPACE/↑/CLICK to jump | ESC: Menu | R: Restart | M: Mute';
gameContainer.appendChild(controlsHelp);

// Initialize game
function initGame() {
    gameAreaHeight = gameContainer.clientHeight;
    gameAreaWidth = gameContainer.clientWidth;
    
    // Reset fish position
    fishY = gameAreaHeight / 2;
    fish.style.top = `${fishY}px`;
    fish.style.left = '100px';
    fish.style.transform = 'rotate(-20deg)';
    
    // Reset game state
    score = 0;
    obstacleSpeed = 3;
    obstacleFrequency = 1800;
    scoreDisplay.textContent = `Score: ${score}`;
    obstacles = [];
    gameRunning = true;
    gameStarted = true;
    
    // Clear existing obstacles
    document.querySelectorAll('.obstacle').forEach(obs => obs.remove());
    document.addEventListener('keydown', handleKeyDown);
    
    // Show score display and controls help
    scoreDisplay.style.display = 'block';
    controlsHelp.style.display = 'block';
    
    // Start game loop
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    gameLoop();
    
    // Start background music
    bgMusic.currentTime = 0;
    bgMusic.play().catch(e => console.log("Autoplay prevented:", e));
    
    // Update network status
    updateNetworkStatus();
}

// Game loop
function gameLoop() {
    if (!gameRunning) return;
    
    // Update fish position
    fishVelocity += gravity;
    fishY += fishVelocity;
    fish.style.top = `${fishY}px`;
    
    // Rotate fish based on velocity
    let rotation = Math.max(-30, Math.min(30, fishVelocity * 3));
    fish.style.transform = `rotate(${rotation}deg)`;
    
    // Check for collisions with top/bottom
    if (fishY < 0 || fishY > gameAreaHeight - 40) {
        endGame();
        return;
    }
    
    // Create new obstacles
    const currentTime = Date.now();
    if (currentTime - lastObstacleTime > obstacleFrequency) {
        createObstacle();
        lastObstacleTime = currentTime;
    }
    
    // Move and check obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obstacle = obstacles[i];
        obstacle.x -= obstacleSpeed;
        obstacle.element.style.left = `${obstacle.x}px`;
        
        // Check if fish passed the obstacle
        if (!obstacle.passed && obstacle.x + 60 < 100) {
            obstacle.passed = true;
            increaseScore();
        }
        
        // Check for collisions
        if (checkCollision(obstacle)) {
            endGame();
            return;
        }
        
        // Remove obstacles that are off screen
        if (obstacle.x < -60) {
            obstacle.element.remove();
            obstacles.splice(i, 1);
        }
    }
    
    // Create bubbles occasionally
    if (Math.random() < 0.02) {
        createBubble();
    }
    
    animationFrameId = requestAnimationFrame(gameLoop);
}

// Create a new obstacle with enhanced design
function createObstacle() {
    const gapHeight = 200; // Increased from 150 to make it easier
    const minTopHeight = 70;
    const maxTopHeight = gameAreaHeight - gapHeight - minTopHeight;
    const topHeight = minTopHeight + Math.random() * maxTopHeight;
    
    // Create top obstacle with decoration
    const topObstacle = document.createElement('div');
    topObstacle.className = 'obstacle top-obstacle';
    topObstacle.style.height = `${topHeight}px`;
    topObstacle.style.top = '0';
    topObstacle.style.left = `${gameAreaWidth}px`;
    
    // Add coral decoration to bottom of top pipe
    const topCoral = document.createElement('div');
    topCoral.className = 'coral-decoration';
    topObstacle.appendChild(topCoral);
    gameContainer.appendChild(topObstacle);
    
    // Create bottom obstacle with decoration
    const bottomObstacle = document.createElement('div');
    bottomObstacle.className = 'obstacle bottom-obstacle';
    bottomObstacle.style.height = `${gameAreaHeight - topHeight - gapHeight}px`;
    bottomObstacle.style.top = `${topHeight + gapHeight}px`;
    bottomObstacle.style.left = `${gameAreaWidth}px`;
    
    // Add coral decoration to top of bottom pipe
    const bottomCoral = document.createElement('div');
    bottomCoral.className = 'coral-decoration';
    bottomObstacle.appendChild(bottomCoral);
    gameContainer.appendChild(bottomObstacle);
    
    // Add bubble effect when pipe appears
    createPipeBubbleEffect(topHeight + gapHeight/2);
    
    obstacles.push({
        x: gameAreaWidth,
        topHeight: topHeight,
        gapHeight: gapHeight,
        element: topObstacle,
        passed: false
    });
    
    obstacles.push({
        x: gameAreaWidth,
        topHeight: topHeight,
        gapHeight: gapHeight,
        element: bottomObstacle,
        passed: false
    });
}

// Create bubble effect when new pipes appear
function createPipeBubbleEffect(yPosition) {
    for (let i = 0; i < 8; i++) {
        setTimeout(() => {
            const bubble = document.createElement('div');
            bubble.className = 'pipe-bubble';
            const size = 10 + Math.random() * 20;
            bubble.style.width = `${size}px`;
            bubble.style.height = `${size}px`;
            bubble.style.left = `${gameAreaWidth + 30}px`;
            bubble.style.top = `${yPosition - size/2}px`;
            gameContainer.appendChild(bubble);
            
            setTimeout(() => {
                bubble.remove();
            }, 2000);
        }, i * 100);
    }
}

// Create bubble animation
function createBubble() {
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    const size = 5 + Math.random() * 15;
    bubble.style.width = `${size}px`;
    bubble.style.height = `${size}px`;
    bubble.style.left = `${100 + Math.random() * (gameAreaWidth - 100)}px`;
    bubble.style.bottom = '0';
    gameContainer.appendChild(bubble);
    
    // Remove bubble after animation
    setTimeout(() => {
        bubble.remove();
    }, 4000);
}

// Create water splash effect when flapping
function createSplashEffect() {
    for (let i = 0; i < 5; i++) {
        const splash = document.createElement('div');
        splash.className = 'splash';
        splash.style.left = '80px';
        splash.style.top = `${fishY + 30}px`;
        splash.style.setProperty('--random-offset', Math.random() * 20 - 10);
        gameContainer.appendChild(splash);
        
        setTimeout(() => {
            splash.remove();
        }, 1000);
    }
}

// Check collision between fish and obstacle
function checkCollision(obstacle) {
    const fishRect = {
        x: 100,
        y: fishY,
        width: 60,
        height: 40
    };
    
    const obstacleRect = {
        x: obstacle.x,
        y: obstacle.element.style.top.includes('0') ? 0 : parseFloat(obstacle.element.style.top),
        width: 60,
        height: parseFloat(obstacle.element.style.height)
    };
    
    return fishRect.x < obstacleRect.x + obstacleRect.width &&
           fishRect.x + fishRect.width > obstacleRect.x &&
           fishRect.y < obstacleRect.y + obstacleRect.height &&
           fishRect.y + fishRect.height > obstacleRect.y;
}

// Increase score
function increaseScore() {
    score++;
    scoreDisplay.textContent = `Score: ${score}`;
    scoreSound.currentTime = 0;
    scoreSound.play();
    
    // Increase difficulty as score increases
    if (score % 5 === 0) {
        obstacleSpeed += 0.2;
        obstacleFrequency = Math.max(800, obstacleFrequency - 50);
        showNotification(`Level up! Difficulty increased`, 'good');
    }
}

// End game
function endGame() {
    gameRunning = false;
    gameStarted = false;
    cancelAnimationFrame(animationFrameId);
    finalScoreDisplay.textContent = `Your score: ${score}`;
    gameOverDisplay.style.display = 'block';
    controlsHelp.style.display = 'block';
    hitSound.currentTime = 0;
    hitSound.play();
    bgMusic.pause();
    
    // Shake effect on game over
    gameContainer.style.animation = 'shake 0.5s';
    setTimeout(() => {
        gameContainer.style.animation = '';
    }, 500);
    
    if (isOnline) {
        saveScore(score);
    }
}

// Save score (placeholder)
function saveScore(score) {
    console.log(`Score ${score} would be saved to server`);
}

// Show start screen
function showStartScreen() {
    gameRunning = false;
    gameStarted = false;
    startScreen.style.display = 'flex';
    gameOverDisplay.style.display = 'none';
    scoreDisplay.style.display = 'none';
    controlsHelp.style.display = 'none';
    bgMusic.pause();
    bgMusic.currentTime = 0;
    
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    document.removeEventListener('keydown', handleKeyDown);
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

// Update network status
function updateNetworkStatus() {
    isOnline = navigator.onLine;
    if (isOnline) {
        networkStatus.textContent = '🟢 Online';
        networkStatus.style.backgroundColor = 'rgba(50, 205, 50, 0.7)';
        if (gameStarted) {
            showNotification('Connection restored', 'good');
        }
    } else {
        networkStatus.textContent = '🔴 Offline';
        networkStatus.style.backgroundColor = 'rgba(220, 20, 60, 0.7)';
        if (gameStarted) {
            showNotification("You're offline! Scores won't be saved", 'warning');
        }
    }
}

// Flap (jump) function with cooldown
function flap() {
    const now = Date.now();
    if (!gameRunning || now - lastFlapTime < flapCooldown) return;
    
    lastFlapTime = now;
    fishVelocity = flapStrength;
    flapSound.currentTime = 0;
    flapSound.play();
    createSplashEffect();
    
    // Add flap animation
    fish.style.animation = 'fish-flap 0.3s';
    setTimeout(() => {
        fish.style.animation = '';
    }, 300);
}

// Handle keyboard input
function handleKeyDown(e) {
    // Space bar or ArrowUp to flap
    if (e.code === 'Space' || e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault();
        flap();
    }
    
    // R to restart when game over
    if (e.key.toLowerCase() === 'r' && !gameRunning && gameStarted) {
        gameOverDisplay.style.display = 'none';
        initGame();
    }
    
    // M to toggle mute
    if (e.key.toLowerCase() === 'm') {
        toggleMute();
    }
    
    // Escape to return to menu
    if (e.key === 'Escape' && gameStarted) {
        if (gameRunning) endGame();
        showStartScreen();
    }
}

// Toggle mute function
function toggleMute() {
    const isMuted = bgMusic.muted;
    bgMusic.muted = !isMuted;
    flapSound.muted = !isMuted;
    hitSound.muted = !isMuted;
    scoreSound.muted = !isMuted;
    
    showNotification(isMuted ? "Sound unmuted" : "Sound muted", 'info');
}

// Event listeners
startButton.addEventListener('click', () => {
    startScreen.style.display = 'none';
    initGame();
});

howToPlayBtn.addEventListener('click', () => {
    showNotification("Avoid the pipes! Jump with SPACE/↑/CLICK", 'info');
});

playAgainBtn.addEventListener('click', () => {
    gameOverDisplay.style.display = 'none';
    initGame();
});

returnToMenuBtn.addEventListener('click', showStartScreen);

gameContainer.addEventListener('click', flap);
gameContainer.addEventListener('touchstart', (e) => {
    e.preventDefault();
    flap();
});

// Network status events
window.addEventListener('online', updateNetworkStatus);
window.addEventListener('offline', updateNetworkStatus);

// PWA Installation
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.style.display = 'block';
});

installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    deferredPrompt = null;
    installBtn.style.display = 'none';
});

window.addEventListener('appinstalled', () => {
    installBtn.style.display = 'none';
    deferredPrompt = null;
    showNotification('Flappy Fish installed successfully!', 'good');
});

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').then(registration => {
            console.log('ServiceWorker registration successful');
        }).catch(err => {
            console.log('ServiceWorker registration failed: ', err);
            showNotification('Offline mode not available', 'warning');
        });
    });
}

// Initialize start screen on load
window.addEventListener('load', () => {
    showStartScreen();
    updateNetworkStatus();
    
    // Global keyboard controls
    document.addEventListener('keydown', (e) => {
        // Start game with Enter from start screen
        if (e.key === 'Enter' && startScreen.style.display !== 'none') {
            startScreen.style.display = 'none';
            initGame();
        }
        
        // Show how to play with H key
        if (e.key.toLowerCase() === 'h') {
            showNotification("Controls: SPACE/↑/CLICK to jump | ESC: Menu | R: Restart | M: Mute", 'info');
        }
    });
});