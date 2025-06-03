const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const gravity = 0.5;
let keys = {};

let coinCount = 0;
let highScore = Number(localStorage.getItem("highScore")) || 0;
const coinDisplay = document.getElementById("coin-count");

const player = {
  x: 100,
  y: 0,
  width: 30,
  height: 30,
  color: "red",
  dx: 0,
  dy: 0,
  onGround: false,
  onPlatform: null,
};

let platforms = [];
let coins = [];
let enemies = [];
let hazards = [];

let cameraOffsetX = 0;

function resetGame() {
  if (coinCount > highScore) {
    highScore = coinCount;
    localStorage.setItem("highScore", highScore);
  }

  player.x = 100;
  player.y = 0;
  player.dy = 0;
  player.onPlatform = null;
  coinCount = 0;
  coinDisplay.textContent = `Coins: 0 (Best: ${highScore})`;

  platforms = [{ x: 0, y: 370, width: 200, height: 30, dx: 0 }];
  coins = [];
  enemies = [];
  hazards = [];
}

function update() {
  player.dy += gravity;

  if (keys["ArrowRight"] || keys["d"]) player.dx = 3;
  else if (keys["ArrowLeft"] || keys["a"]) player.dx = -3;
  else player.dx = 0;

  if ((keys["ArrowUp"] || keys["w"] || keys[" "]) && player.onGround) {
    player.dy = -10;
    player.onGround = false;
    player.onPlatform = null;
  }

  if (player.onPlatform) {
    player.x += player.onPlatform.dx || 0;
  }

  player.x += player.dx;
  player.y += player.dy;

  for (let plat of platforms) {
    if (plat.dx) {
      plat.x += plat.dx;
      if (plat.x < plat.minX || plat.x + plat.width > plat.maxX) {
        plat.dx *= -1;
      }
    }
  }

  player.onGround = false;
  player.onPlatform = null;

  for (let plat of platforms) {
    if (
      player.x + player.width > plat.x &&
      player.x < plat.x + plat.width &&
      player.y + player.height > plat.y &&
      player.y + player.height < plat.y + plat.height &&
      player.dy >= 0
    ) {
      player.y = plat.y - player.height;
      player.dy = 0;
      player.onGround = true;
      player.onPlatform = plat;
    }
  }

  for (let i = coins.length - 1; i >= 0; i--) {
    const coin = coins[i];
    if (
      player.x + player.width > coin.x &&
      player.x < coin.x + coin.width &&
      player.y + player.height > coin.y &&
      player.y < coin.y + coin.height
    ) {
      coins.splice(i, 1);
      coinCount++;
      coinDisplay.textContent = `Coins: ${coinCount} (Best: ${highScore})`;
    }
  }

  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];
    enemy.x += enemy.dx;
    if (enemy.x < enemy.minX || enemy.x + enemy.width > enemy.maxX) {
      enemy.dx *= -1;
    }

    if (
      player.x + player.width > enemy.x &&
      player.x < enemy.x + enemy.width &&
      player.y + player.height > enemy.y &&
      player.y + player.height < enemy.y + 10 &&
      player.dy > 0
    ) {
      enemies.splice(i, 1);
      player.dy = -7;
    } else if (
      player.x + player.width > enemy.x &&
      player.x < enemy.x + enemy.width &&
      player.y < enemy.y + enemy.height &&
      player.y + player.height > enemy.y
    ) {
      resetGame();
    }
  }

  for (let spike of hazards) {
    if (
      player.x + player.width > spike.x &&
      player.x < spike.x + spike.width &&
      player.y + player.height > spike.y &&
      player.y < spike.y + spike.height
    ) {
      resetGame();
    }
  }

  if (player.y > canvas.height) {
    resetGame();
  }

  const farRight = Math.max(...platforms.map((p) => p.x + p.width));
  if (player.x + canvas.width > farRight - 200) {
    generateRandomChunk(farRight);
  }

  cameraOffsetX = player.x - 100;
}

function generateRandomChunk(startX) {
  const gap = 50 + Math.random() * 30;
  const width = 100 + Math.random() * 50;
  const height = 280 + Math.random() * 70;
  const platformX = startX + gap;

  const isMoving = Math.random() > 0.7;
  const platform = {
    x: platformX,
    y: height,
    width,
    height: 20,
    dx: isMoving ? 1 : 0,
    minX: isMoving ? platformX - 50 : platformX,
    maxX: isMoving ? platformX + 50 : platformX,
  };
  platforms.push(platform);

  if (Math.random() > 0.3) {
    coins.push({
      x: platform.x + 20,
      y: platform.y - 40,
      width: 16,
      height: 16,
    });
  }

  if (Math.random() > 0.5) {
    enemies.push({
      x: platform.x + 10,
      y: platform.y - 20,
      width: 24,
      height: 24,
      dx: 1,
      minX: platform.x,
      maxX: platform.x + platform.width - 24,
    });
  }

  if (Math.random() > 0.6) {
    hazards.push({
      x: platform.x + width / 2 - 8,
      y: platform.y - 15,
      width: 16,
      height: 16,
    });
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(-cameraOffsetX, 0);

  ctx.fillStyle = "#444";
  for (let plat of platforms) {
    ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
  }

  ctx.fillStyle = "gold";
  for (let coin of coins) {
    ctx.beginPath();
    ctx.arc(
      coin.x + coin.width / 2,
      coin.y + coin.height / 2,
      8,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  ctx.fillStyle = "black";
  for (let enemy of enemies) {
    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    ctx.fillStyle = "white";
    ctx.fillRect(enemy.x + 4, enemy.y + 6, 4, 4);
    ctx.fillRect(enemy.x + 16, enemy.y + 6, 4, 4);
    ctx.fillStyle = "black";
  }

  ctx.fillStyle = "purple";
  for (let spike of hazards) {
    ctx.beginPath();
    ctx.moveTo(spike.x, spike.y + spike.height);
    ctx.lineTo(spike.x + spike.width / 2, spike.y);
    ctx.lineTo(spike.x + spike.width, spike.y + spike.height);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.width, player.height);

  ctx.restore();
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
  }
  keys[e.key] = true;
});
document.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

resetGame();
gameLoop();
