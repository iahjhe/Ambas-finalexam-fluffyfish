// Game variables
const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
const startScreen = document.getElementById("start-screen");
const gameOverScreen = document.getElementById("game-over-screen");
const startBtn = document.getElementById("start-btn");
const restartBtn = document.getElementById("restart-btn");
const scoreDisplay = document.getElementById("score-display");
const finalScoreDisplay = document.getElementById("final-score");
const highScoreDisplay = document.getElementById("high-score");
const gameHighScoreDisplay = document.getElementById("high-score-display");
const soundToggle = document.getElementById("sound-toggle");
const tapHint = document.getElementById("tap-hint");
const status = document.getElementById("status");

// Audio elements
const backgroundMusic = document.getElementById("background-music");
const hitSound = document.getElementById("hit-sound");
const flapSound = document.getElementById("flap-sound");
const scoreSound = document.getElementById("score-sound");

// Set initial volumes
backgroundMusic.volume = 0.3;
hitSound.volume = 0.5;
flapSound.volume = 0.8;
scoreSound.volume = 1.0;

// Game state
let gameRunning = false;
let score = 0;
let highScore = localStorage.getItem("flappyFishHighScore") || 0;
let soundOn = true;
let assetsLoaded = false;
let assetsToLoad = 0;
let assetsLoadedCount = 0;

// Images
const images = {
  fish: new Image(),
  background: new Image()
};

// Set canvas size
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// Load assets
function loadAssets() {
  assetsToLoad = Object.keys(images).length;

  images.fish.src = "assets/images/fish.png";
  images.background.src = "assets/images/background.png";

  Object.values(images).forEach((img) => {
    img.onload = () => {
      assetsLoadedCount++;
      if (assetsLoadedCount === assetsToLoad) {
        assetsLoaded = true;
        updateHighScoreDisplay();
        tapHint.style.display = "block";
      }
    };
    img.onerror = () => {
      console.error("Failed to load image:", img.src);
      assetsLoadedCount++;
      if (assetsLoadedCount === assetsToLoad) {
        assetsLoaded = true;
        updateHighScoreDisplay();
        tapHint.style.display = "block";
      }
    };
  });
}

loadAssets();

// Game objects
const fish = {
  x: 100,
  y: canvas.height / 2,
  width: 60,
  height: 40,
  velocity: 0,
  gravity: 0.5,
  jumpForce: -10,
  rotation: 0,

  update: function() {
    this.velocity += this.gravity;
    this.y += this.velocity;

    // Rotate fish based on velocity
    this.rotation = Math.min(Math.max(this.velocity * 5, -30), 30);

    // Check if fish hits the ground or ceiling
    if (this.y + this.height > canvas.height) {
      this.y = canvas.height - this.height;
      gameOver();
    }

    if (this.y < 0) {
      this.y = 0;
      this.velocity = 0;
    }
  },

  jump: function() {
    this.velocity = this.jumpForce;
    if (soundOn) {
      flapSound.currentTime = 0;
      flapSound.play().catch(e => console.log("Flap sound error:", e));
    }
  },

  draw: function() {
    if (!assetsLoaded) return;

    ctx.save();
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
    ctx.rotate(this.rotation * Math.PI / 180);
    ctx.drawImage(
      images.fish,
      -this.width / 2,
      -this.height / 2,
      this.width,
      this.height
    );
    ctx.restore();
  },

  reset: function() {
    this.y = canvas.height / 2;
    this.velocity = 0;
    this.rotation = 0;
  }
};

const pipes = {
  width: 80,
  gap: 200,
  speed: 3,
  list: [],

  update: function() {
    // Move pipes
    for (let i = 0; i < this.list.length; i++) {
      this.list[i].x -= this.speed;

      // Check if fish passed a pipe
      if (!this.list[i].passed && this.list[i].x + this.width < fish.x) {
        this.list[i].passed = true;
        score++;
        scoreDisplay.textContent = score;
        
        // Visual feedback
        scoreDisplay.classList.add("score-pop");
        setTimeout(() => {
          scoreDisplay.classList.remove("score-pop");
        }, 300);
        
        // Play score sound
        if (soundOn) {
          scoreSound.currentTime = 0;
          scoreSound.play().catch(e => console.log("Score sound error:", e));
        }
      }
    }

    // Remove pipes that are off screen
    if (this.list.length > 0 && this.list[0].x + this.width < 0) {
      this.list.shift();
    }

    // Add new pipes
    if (this.list.length === 0 || this.list[this.list.length - 1].x < canvas.width - 300) {
      this.addPipe();
    }
  },

  addPipe: function() {
    const minHeight = 50;
    const maxHeight = canvas.height - this.gap - minHeight;
    const height = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;

    this.list.push({
      x: canvas.width,
      height: height,
      passed: false
    });
  },

  draw: function() {
    ctx.fillStyle = "#2ecc71"; // Green color for pipes

    for (let i = 0; i < this.list.length; i++) {
      const pipe = this.list[i];

      // Draw top pipe
      ctx.fillRect(pipe.x, 0, this.width, pipe.height);

      // Draw bottom pipe
      ctx.fillRect(
        pipe.x,
        pipe.height + this.gap,
        this.width,
        canvas.height - pipe.height - this.gap
      );

      // Add pipe details
      ctx.fillStyle = "#27ae60";
      ctx.fillRect(pipe.x, pipe.height - 10, this.width, 10);
      ctx.fillRect(pipe.x, pipe.height + this.gap, this.width, 10);
      ctx.fillStyle = "#2ecc71";
    }
  },

  reset: function() {
    this.list = [];
  },

  checkCollision: function() {
    const collisionWidth = fish.width * 0.6;
    const collisionHeight = fish.height * 0.6;

    for (let i = 0; i < this.list.length; i++) {
      const pipe = this.list[i];

      // Check collision with top pipe
      if (fish.x + collisionWidth/2 > pipe.x && 
          fish.x - collisionWidth/2 < pipe.x + this.width && 
          fish.y - collisionHeight/2 < pipe.height) {
        return true;
      }
      
      // Check collision with bottom pipe
      if (fish.x + collisionWidth/2 > pipe.x && 
          fish.x - collisionWidth/2 < pipe.x + this.width && 
          fish.y + collisionHeight/2 > pipe.height + this.gap) {
        return true;
      }
    }

    return false;
  }
};

const background = {
  x: 0,
  speed: 1,

  update: function() {
    this.x = (this.x - this.speed) % canvas.width;
  },

  draw: function() {
    if (!assetsLoaded) return;

    ctx.drawImage(images.background, this.x, 0, canvas.width, canvas.height);
    ctx.drawImage(
      images.background,
      this.x + canvas.width,
      0,
      canvas.width,
      canvas.height
    );

    // Water overlay
    ctx.fillStyle = "rgba(64, 164, 223, 0.2)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
};

// Game functions
function startGame() {
  if (!assetsLoaded) return;

  gameRunning = true;
  score = 0;
  scoreDisplay.textContent = score;
  scoreDisplay.style.display = "block";
  startScreen.style.display = "none";
  gameOverScreen.style.display = "none";
  tapHint.style.display = "none";
  fish.reset();
  pipes.reset();

  if (soundOn) {
    backgroundMusic.currentTime = 0;
    backgroundMusic.play().catch(e => console.log("Music error:", e));
  }

  requestAnimationFrame(gameLoop);
}

function gameOver() {
  gameRunning = false;
  scoreDisplay.style.display = "none";
  finalScoreDisplay.textContent = `Score: ${score}`;

  // Update high score
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("flappyFishHighScore", highScore);
    gameHighScoreDisplay.textContent = `New High Score: ${highScore}!`;
  } else {
    gameHighScoreDisplay.textContent = `High Score: ${highScore}`;
  }

  gameOverScreen.style.display = "flex";

  if (soundOn) {
    hitSound.currentTime = 0;
    hitSound.play().catch(e => console.log("Hit sound error:", e));
    backgroundMusic.pause();
  }
}

function gameLoop() {
  if (!gameRunning) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  background.update();
  background.draw();

  pipes.update();
  pipes.draw();

  fish.update();
  fish.draw();

  if (pipes.checkCollision()) {
    gameOver();
    return;
  }

  requestAnimationFrame(gameLoop);
}

function updateHighScoreDisplay() {
  highScoreDisplay.textContent = `High Score: ${highScore}`;
}

// Event listeners
startBtn.addEventListener("click", () => {
  // Unlock audio context on first interaction
  if (soundOn) {
    const playPromise = backgroundMusic.play();
    if (playPromise !== undefined) {
      playPromise.then(() => backgroundMusic.pause())
                .catch(e => console.log("Audio unlock error:", e));
    }
  }
  startGame();
});

restartBtn.addEventListener("click", startGame);

// Input controls
canvas.addEventListener("click", () => {
  if (gameRunning) {
    fish.jump();
  } else if (assetsLoaded && startScreen.style.display === "flex") {
    startGame();
  }
});

document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    if (gameRunning) {
      fish.jump();
      e.preventDefault();
    } else if (assetsLoaded && gameOverScreen.style.display === "flex") {
      startGame();
      e.preventDefault();
    }
  }
});

soundToggle.addEventListener("click", () => {
  soundOn = !soundOn;
  soundToggle.textContent = soundOn ? "🔊" : "🔇";

  if (soundOn && gameRunning) {
    backgroundMusic.play().catch(e => console.log("Music error:", e));
  } else {
    backgroundMusic.pause();
  }
});

canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();
  if (gameRunning) {
    fish.jump();
  } else if (assetsLoaded && startScreen.style.display === "flex") {
    startGame();
  }
});

// Network status
function updateOnlineStatus() {
  const offlineNotification = document.getElementById("offline-notification");
  const onlineNotification = document.getElementById("online-notification");

  if (!navigator.onLine) {
    offlineNotification.style.display = "block";
    setTimeout(() => {
      offlineNotification.style.display = "none";
    }, 3000);
  } else {
    onlineNotification.style.display = "block";
    setTimeout(() => {
      onlineNotification.style.display = "none";
    }, 3000);
  }
}

function updateNetworkStatus() {
  if (navigator.onLine) {
    status.textContent = "🟢 Online";
    status.style.background = "limegreen";
  } else {
    status.textContent = "🔴 Offline";
    status.style.background = "crimson";
  }
}

window.addEventListener("online", () => {
  updateOnlineStatus();
  updateNetworkStatus();
});
window.addEventListener("offline", () => {
  updateOnlineStatus();
  updateNetworkStatus();
});

// Initial setup
updateOnlineStatus();
updateNetworkStatus();

setTimeout(() => {
  if (startScreen.style.display === "flex" && assetsLoaded) {
    tapHint.style.display = "block";
  }
}, 2000);