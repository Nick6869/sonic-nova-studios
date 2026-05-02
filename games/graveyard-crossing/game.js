const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

const HUD_HEIGHT = 96;
const TILE = 48;
const COLS = 15;
const ROWS = 14;

const START_ROW = 13;
const START_COL = 7;

const RIVER_ROWS = [1, 2, 3, 4];
const ROAD_ROWS = [6, 7, 8, 9, 10, 11];
const SAFE_ROWS = [3, 5, 12, 13];

const GOAL_COLS = [1, 4, 7, 10, 13];

let gameState = "title";
let score = 0;
let highScore = Number(localStorage.getItem("graveyardCrossingHighScore") || 0);
let lives = 3;
let level = 1;
let timeLeft = 60;
let goals = GOAL_COLS.map(() => false);
let hazards = [];
let platforms = [];
let particles = [];
let lastTime = 0;
let audioReady = false;
let audioContext = null;

const player = {
  x: START_COL * TILE + TILE / 2,
  y: HUD_HEIGHT + START_ROW * TILE + TILE / 2,
  size: 30,
  highestRow: START_ROW,
  deadFlash: 0
};

const laneConfigs = [
  { row: 1, type: "platform", skin: "coffin", speed: 105, count: 3, width: 145 },
  { row: 2, type: "platform", skin: "bones", speed: -130, count: 3, width: 128 },
  { row: 3, type: "platform", skin: "coffin", speed: 82, count: 2, width: 175 },
  { row: 4, type: "platform", skin: "plank", speed: -150, count: 4, width: 108 },

  { row: 6, type: "hazard", skin: "hearse", speed: 142, count: 3, width: 96 },
  { row: 7, type: "hazard", skin: "ghoul", speed: -124, count: 4, width: 62 },
  { row: 8, type: "hazard", skin: "ambulance", speed: 188, count: 2, width: 126 },
  { row: 9, type: "hazard", skin: "ratpack", speed: -165, count: 4, width: 70 },
  { row: 10, type: "hazard", skin: "pumpkin", speed: 132, count: 3, width: 78 },
  { row: 11, type: "hazard", skin: "hearse", speed: -116, count: 4, width: 90 }
];

function rowY(row) {
  return HUD_HEIGHT + row * TILE;
}

function resetPlayer() {
  player.x = START_COL * TILE + TILE / 2;
  player.y = HUD_HEIGHT + START_ROW * TILE + TILE / 2;
  player.highestRow = START_ROW;
  player.deadFlash = 0;
  timeLeft = Math.max(32, 60 - (level - 1) * 3);
}

function resetGame() {
  score = 0;
  lives = 3;
  level = 1;
  goals = GOAL_COLS.map(() => false);
  particles = [];
  buildLanes();
  resetPlayer();
  gameState = "playing";
}

function startGame() {
  score = 0;
  lives = 3;
  level = 1;
  goals = GOAL_COLS.map(() => false);
  particles = [];
  buildLanes();
  resetPlayer();
  gameState = "playing";
}

function nextLevel() {
  score += 200 + Math.floor(timeLeft) * 5;
  level += 1;
  goals = GOAL_COLS.map(() => false);
  buildLanes();
  resetPlayer();
  burst(WIDTH / 2, HUD_HEIGHT + TILE * 2, "#ff4f9a", 48);
  playSound("level");
}

function buildLanes() {
  hazards = [];
  platforms = [];

  const speedMultiplier = 1 + (level - 1) * 0.14;

  for (const lane of laneConfigs) {
    const list = lane.type === "hazard" ? hazards : platforms;
    const spacing = WIDTH / lane.count;

    for (let i = 0; i < lane.count; i++) {
      const stagger = lane.speed > 0 ? -lane.width * 0.5 : lane.width * 0.5;
      const jitter = Math.random() * 55 - 27;

      list.push({
        row: lane.row,
        skin: lane.skin,
        x: i * spacing + stagger + jitter,
        y: rowY(lane.row) + 7,
        width: lane.width,
        height: TILE - 14,
        speed: lane.speed * speedMultiplier
      });
    }
  }
}

function getPlayerRow() {
  return Math.floor((player.y - HUD_HEIGHT) / TILE);
}

function getPlayerCol() {
  return Math.floor(player.x / TILE);
}

function playerRect() {
  return {
    x: player.x - player.size / 2,
    y: player.y - player.size / 2,
    width: player.size,
    height: player.size
  };
}

function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function movePlayer(dx, dy) {
  if (gameState !== "playing") return;

  const newX = player.x + dx * TILE;
  const newY = player.y + dy * TILE;

  if (newX < TILE / 2 || newX > WIDTH - TILE / 2) return;
  if (newY < HUD_HEIGHT + TILE / 2 || newY > HEIGHT - TILE / 2) return;

  player.x = newX;
  player.y = newY;

  const row = getPlayerRow();

  if (row < player.highestRow) {
    player.highestRow = row;
    score += 10;
  }

  burst(player.x, player.y, "#c7f7ff", 6);
  playSound("move");
}

function loseLife(reason = "death") {
  if (gameState !== "playing") return;

  lives -= 1;
  player.deadFlash = 18;
  burst(player.x, player.y, "#ff174f", 32);
  playSound(reason === "water" ? "splash" : "death");

  if (lives <= 0) {
    gameState = "gameover";
    updateHighScore();
  } else {
    resetPlayer();
  }
}

function updateHighScore() {
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("graveyardCrossingHighScore", String(highScore));
  }
}

function handleGoal() {
  const row = getPlayerRow();
  if (row !== 0) return;

  let foundGoal = -1;

  for (let i = 0; i < GOAL_COLS.length; i++) {
    const center = GOAL_COLS[i] * TILE + TILE / 2;
    if (Math.abs(player.x - center) < TILE * 0.75) {
      foundGoal = i;
      break;
    }
  }

  if (foundGoal === -1 || goals[foundGoal]) {
    loseLife("death");
    return;
  }

  goals[foundGoal] = true;
  score += 80 + Math.floor(timeLeft);
  burst(player.x, player.y, "#89ff9d", 36);
  playSound("goal");

  if (goals.every(Boolean)) {
    nextLevel();
  } else {
    resetPlayer();
  }
}

function updateMovingObjects(list, dt) {
  for (const item of list) {
    item.x += item.speed * dt;

    if (item.speed > 0 && item.x > WIDTH + 80) {
      item.x = -item.width - 80 - Math.random() * 120;
    }

    if (item.speed < 0 && item.x + item.width < -80) {
      item.x = WIDTH + 80 + Math.random() * 120;
    }
  }
}

function updateParticles(dt) {
  for (const p of particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    p.size *= 0.985;
  }

  particles = particles.filter((p) => p.life > 0 && p.size > 0.5);
}

function burst(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 40 + Math.random() * 140;

    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 2 + Math.random() * 4,
      color,
      life: 0.25 + Math.random() * 0.45
    });
  }
}

function update(dt) {
  if (gameState !== "playing") {
    updateParticles(dt);
    return;
  }

  timeLeft -= dt;

  if (timeLeft <= 0) {
    loseLife("death");
    return;
  }

  updateMovingObjects(hazards, dt);
  updateMovingObjects(platforms, dt);
  updateParticles(dt);

  const row = getPlayerRow();

  if (row === 0) {
    handleGoal();
    return;
  }

  const pRect = playerRect();

  if (ROAD_ROWS.includes(row)) {
    for (const h of hazards) {
      if (h.row === row && rectsOverlap(pRect, h)) {
        loseLife("death");
        return;
      }
    }
  }

  if (RIVER_ROWS.includes(row)) {
    let riding = null;

    for (const platform of platforms) {
      if (platform.row === row && rectsOverlap(pRect, platform)) {
        riding = platform;
        break;
      }
    }

    if (riding) {
      player.x += riding.speed * dt;

      if (player.x < TILE / 3 || player.x > WIDTH - TILE / 3) {
        loseLife("water");
        return;
      }
    } else {
      loseLife("water");
      return;
    }
  }

  if (player.deadFlash > 0) {
    player.deadFlash -= 1;
  }
}

function draw() {
  drawBackground();
  drawHud();
  drawBoard();
  drawPlatforms();
  drawHazards();
  drawGoals();
  drawPlayer();
  drawParticles();

  if (gameState === "title") {
    drawOverlay(
      "GRAVEYARD CROSSING",
      "Cross the cursed road, ride the coffins, and claim all five graves.",
      "Press Enter or Space to begin"
    );
  }

  if (gameState === "paused") {
    drawOverlay("PAUSED", "The dead are still moving.", "Press P to continue");
  }

  if (gameState === "gameover") {
    drawOverlay(
      "GAME OVER",
      `Final Score: ${score}`,
      "Press R or Enter to restart"
    );
  }
}

function drawBackground() {
  ctx.fillStyle = "#070307";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const gradient = ctx.createRadialGradient(WIDTH / 2, 100, 20, WIDTH / 2, 320, 520);
  gradient.addColorStop(0, "rgba(106, 0, 50, 0.35)");
  gradient.addColorStop(0.4, "rgba(30, 8, 42, 0.55)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

function drawHud() {
  ctx.fillStyle = "#130613";
  ctx.fillRect(0, 0, WIDTH, HUD_HEIGHT);

  ctx.fillStyle = "#2a0c20";
  ctx.fillRect(0, HUD_HEIGHT - 8, WIDTH, 8);

  ctx.fillStyle = "#ffe8f4";
  ctx.font = "bold 24px Georgia";
  ctx.textAlign = "left";
  ctx.fillText("GRAVEYARD CROSSING", 22, 35);

  ctx.font = "16px Georgia";
  ctx.fillStyle = "#ff9bc8";
  ctx.fillText(`Score: ${score}`, 22, 66);

  ctx.fillStyle = "#cdb8d4";
  ctx.fillText(`High: ${highScore}`, 148, 66);
  ctx.fillText(`Level: ${level}`, 286, 66);

  ctx.fillStyle = "#ffd6e9";
  ctx.textAlign = "right";
  ctx.fillText(`Lives: ${"♥".repeat(Math.max(0, lives))}`, WIDTH - 24, 35);

  const barWidth = 210;
  const barHeight = 12;
  const x = WIDTH - barWidth - 24;
  const y = 56;
  const maxTime = Math.max(32, 60 - (level - 1) * 3);
  const pct = Math.max(0, Math.min(1, timeLeft / maxTime));

  ctx.fillStyle = "#2b1027";
  ctx.fillRect(x, y, barWidth, barHeight);

  ctx.fillStyle = pct < 0.25 ? "#ff224f" : "#b8ff76";
  ctx.fillRect(x, y, barWidth * pct, barHeight);

  ctx.strokeStyle = "#694060";
  ctx.strokeRect(x, y, barWidth, barHeight);

  ctx.textAlign = "right";
  ctx.fillStyle = "#cdb8d4";
  ctx.fillText("Time", x - 8, y + 12);
}

function drawBoard() {
  for (let row = 0; row < ROWS; row++) {
    const y = rowY(row);

    if (row === 0) {
      ctx.fillStyle = "#0b140d";
    } else if (RIVER_ROWS.includes(row)) {
      ctx.fillStyle = row % 2 === 0 ? "#250016" : "#33001f";
    } else if (ROAD_ROWS.includes(row)) {
      ctx.fillStyle = row % 2 === 0 ? "#151116" : "#201621";
    } else {
      ctx.fillStyle = row === START_ROW ? "#10200f" : "#182312";
    }

    ctx.fillRect(0, y, WIDTH, TILE);

    if (RIVER_ROWS.includes(row)) {
      drawBloodWater(y);
    }

    if (ROAD_ROWS.includes(row)) {
      drawRoadLines(y);
    }

    if (row === 5 || row === 12 || row === 13) {
      drawGrassDetails(y);
    }
  }

  drawFog();
}

function drawBloodWater(y) {
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = "#ff2f6f";
  ctx.lineWidth = 2;

  for (let i = 0; i < 12; i++) {
    const startX = i * 72 + ((Date.now() / 35) % 72);
    ctx.beginPath();
    ctx.moveTo(startX - 80, y + 16 + (i % 3) * 9);
    ctx.quadraticCurveTo(startX - 45, y + 4, startX - 10, y + 18);
    ctx.quadraticCurveTo(startX + 25, y + 33, startX + 64, y + 18);
    ctx.stroke();
  }

  ctx.restore();
}

function drawRoadLines(y) {
  ctx.strokeStyle = "rgba(240, 224, 255, 0.18)";
  ctx.lineWidth = 3;
  ctx.setLineDash([20, 18]);
  ctx.beginPath();
  ctx.moveTo(0, y + TILE / 2);
  ctx.lineTo(WIDTH, y + TILE / 2);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawGrassDetails(y) {
  ctx.save();
  ctx.globalAlpha = 0.5;

  for (let x = 0; x < WIDTH; x += 36) {
    ctx.fillStyle = "#263d20";
    ctx.beginPath();
    ctx.moveTo(x + 8, y + TILE - 8);
    ctx.lineTo(x + 13, y + TILE - 22);
    ctx.lineTo(x + 18, y + TILE - 8);
    ctx.fill();

    ctx.fillStyle = "#4a4a4a";
    ctx.fillRect(x + 23, y + 19, 8, 16);
    ctx.beginPath();
    ctx.arc(x + 27, y + 18, 4, Math.PI, 0);
    ctx.fill();
  }

  ctx.restore();
}

function drawFog() {
  ctx.save();
  ctx.globalAlpha = 0.13;
  ctx.fillStyle = "#eacfff";

  for (let i = 0; i < 7; i++) {
    const x = ((Date.now() / 45) + i * 145) % (WIDTH + 180) - 120;
    const y = HUD_HEIGHT + 90 + i * 70;
    ctx.beginPath();
    ctx.ellipse(x, y, 92, 15, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawGoals() {
  for (let i = 0; i < GOAL_COLS.length; i++) {
    const col = GOAL_COLS[i];
    const x = col * TILE;
    const y = rowY(0);

    ctx.fillStyle = "#050905";
    ctx.fillRect(x - 6, y + 4, TILE + 12, TILE - 8);

    ctx.fillStyle = "#37393d";
    ctx.fillRect(x + 10, y + 16, TILE - 20, TILE - 12);
    ctx.beginPath();
    ctx.arc(x + TILE / 2, y + 16, 14, Math.PI, 0);
    ctx.fill();

    ctx.fillStyle = "#1a1b1d";
    ctx.font = "bold 13px Georgia";
    ctx.textAlign = "center";
    ctx.fillText("RIP", x + TILE / 2, y + 35);

    if (goals[i]) {
      ctx.fillStyle = "#95ff9d";
      ctx.beginPath();
      ctx.arc(x + TILE / 2, y + 19, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillRect(x + TILE / 2 - 7, y + 18, 14, 18);

      ctx.fillStyle = "#08220b";
      ctx.beginPath();
      ctx.arc(x + TILE / 2 - 4, y + 18, 2, 0, Math.PI * 2);
      ctx.arc(x + TILE / 2 + 4, y + 18, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawPlatforms() {
  for (const item of platforms) {
    if (item.skin === "coffin") drawCoffin(item);
    if (item.skin === "bones") drawBones(item);
    if (item.skin === "plank") drawPlank(item);
  }
}

function drawCoffin(item) {
  const x = item.x;
  const y = item.y;
  const w = item.width;
  const h = item.height;

  ctx.fillStyle = "#5a2b1c";
  ctx.beginPath();
  ctx.moveTo(x + 18, y);
  ctx.lineTo(x + w - 18, y);
  ctx.lineTo(x + w, y + h / 2);
  ctx.lineTo(x + w - 18, y + h);
  ctx.lineTo(x + 18, y + h);
  ctx.lineTo(x, y + h / 2);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#1b0805";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.strokeStyle = "#d8a25c";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y + 8);
  ctx.lineTo(x + w / 2, y + h - 8);
  ctx.moveTo(x + w / 2 - 12, y + h / 2);
  ctx.lineTo(x + w / 2 + 12, y + h / 2);
  ctx.stroke();
}

function drawBones(item) {
  const x = item.x;
  const y = item.y;
  const w = item.width;
  const h = item.height;

  ctx.strokeStyle = "#e8dec4";
  ctx.lineWidth = 8;
  ctx.lineCap = "round";

  ctx.beginPath();
  ctx.moveTo(x + 18, y + h / 2);
  ctx.lineTo(x + w - 18, y + h / 2);
  ctx.stroke();

  ctx.fillStyle = "#e8dec4";
  for (let i = 0; i < 4; i++) {
    const bx = i < 2 ? x + 16 : x + w - 16;
    const by = y + h / 2 + (i % 2 === 0 ? -7 : 7);
    ctx.beginPath();
    ctx.arc(bx, by, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#c7bea8";
  ctx.fillRect(x + 36, y + 12, w - 72, h - 24);
}

function drawPlank(item) {
  ctx.fillStyle = "#3b2518";
  ctx.fillRect(item.x, item.y + 5, item.width, item.height - 10);

  ctx.strokeStyle = "#120905";
  ctx.lineWidth = 2;
  ctx.strokeRect(item.x, item.y + 5, item.width, item.height - 10);

  ctx.strokeStyle = "#6b432c";
  for (let x = item.x + 14; x < item.x + item.width; x += 22) {
    ctx.beginPath();
    ctx.moveTo(x, item.y + 9);
    ctx.lineTo(x - 5, item.y + item.height - 10);
    ctx.stroke();
  }
}

function drawHazards() {
  for (const item of hazards) {
    if (item.skin === "hearse") drawHearse(item);
    if (item.skin === "ghoul") drawGhoul(item);
    if (item.skin === "ambulance") drawAmbulance(item);
    if (item.skin === "ratpack") drawRatPack(item);
    if (item.skin === "pumpkin") drawPumpkinCart(item);
  }
}

function drawHearse(item) {
  const x = item.x;
  const y = item.y;
  const w = item.width;
  const h = item.height;

  ctx.fillStyle = "#09090d";
  ctx.fillRect(x + 8, y + 8, w - 16, h - 14);

  ctx.fillStyle = "#1b1a28";
  ctx.fillRect(x + 24, y + 2, w - 50, h / 2);

  ctx.fillStyle = "#a04eff";
  ctx.fillRect(x + 34, y + 8, 20, 11);
  ctx.fillRect(x + 60, y + 8, 20, 11);

  ctx.fillStyle = "#ffdf7c";
  ctx.fillRect(item.speed > 0 ? x + w - 8 : x, y + 21, 8, 8);

  ctx.fillStyle = "#050505";
  ctx.beginPath();
  ctx.arc(x + 24, y + h - 6, 8, 0, Math.PI * 2);
  ctx.arc(x + w - 24, y + h - 6, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ddd";
  ctx.font = "bold 11px Georgia";
  ctx.textAlign = "center";
  ctx.fillText("RIP", x + w / 2, y + 31);
}

function drawAmbulance(item) {
  const x = item.x;
  const y = item.y;
  const w = item.width;
  const h = item.height;

  ctx.fillStyle = "#d8d8cf";
  ctx.fillRect(x + 6, y + 8, w - 12, h - 13);

  ctx.fillStyle = "#5f0020";
  ctx.fillRect(x + 18, y + 18, w - 36, 8);

  ctx.fillStyle = "#151515";
  ctx.fillRect(x + 24, y + 11, 24, 11);
  ctx.fillRect(x + w - 50, y + 11, 24, 11);

  ctx.fillStyle = "#ff174f";
  ctx.fillRect(x + w / 2 - 4, y + 12, 8, 22);
  ctx.fillRect(x + w / 2 - 13, y + 20, 26, 7);

  ctx.fillStyle = "#050505";
  ctx.beginPath();
  ctx.arc(x + 25, y + h - 6, 7, 0, Math.PI * 2);
  ctx.arc(x + w - 25, y + h - 6, 7, 0, Math.PI * 2);
  ctx.fill();
}

function drawGhoul(item) {
  const x = item.x;
  const y = item.y;
  const w = item.width;
  const h = item.height;
  const bob = Math.sin(Date.now() / 120 + x) * 3;

  ctx.fillStyle = "#4fa85d";
  ctx.beginPath();
  ctx.arc(x + w / 2, y + 13 + bob, 13, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#2f7138";
  ctx.fillRect(x + 15, y + 24 + bob, w - 30, h - 26);

  ctx.strokeStyle = "#91e08e";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x + 18, y + 31 + bob);
  ctx.lineTo(x + 2, y + 19 + bob);
  ctx.moveTo(x + w - 18, y + 31 + bob);
  ctx.lineTo(x + w + 2, y + 20 + bob);
  ctx.stroke();

  ctx.fillStyle = "#0a160b";
  ctx.beginPath();
  ctx.arc(x + w / 2 - 5, y + 11 + bob, 2, 0, Math.PI * 2);
  ctx.arc(x + w / 2 + 5, y + 11 + bob, 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawRatPack(item) {
  const count = 4;
  const gap = item.width / count;

  for (let i = 0; i < count; i++) {
    const x = item.x + i * gap + 4;
    const y = item.y + 16 + Math.sin(Date.now() / 90 + i) * 2;

    ctx.fillStyle = "#333";
    ctx.beginPath();
    ctx.ellipse(x + 9, y + 8, 12, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#111";
    ctx.beginPath();
    ctx.arc(x + 18, y + 5, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#7f6b6b";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 3, y + 8);
    ctx.quadraticCurveTo(x - 14, y + 2, x - 20, y + 12);
    ctx.stroke();

    ctx.fillStyle = "#ff507f";
    ctx.beginPath();
    ctx.arc(x + 20, y + 4, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPumpkinCart(item) {
  const x = item.x;
  const y = item.y;
  const w = item.width;
  const h = item.height;

  ctx.fillStyle = "#281313";
  ctx.fillRect(x + 4, y + h - 12, w - 8, 8);

  ctx.fillStyle = "#e8751a";
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h / 2, w / 2 - 8, h / 2 - 5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#963e0c";
  ctx.lineWidth = 2;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(x + w / 2 + i * 9, y + 9);
    ctx.quadraticCurveTo(x + w / 2 + i * 4, y + h / 2, x + w / 2 + i * 9, y + h - 12);
    ctx.stroke();
  }

  ctx.fillStyle = "#ffd452";
  ctx.beginPath();
  ctx.moveTo(x + w / 2 - 14, y + 19);
  ctx.lineTo(x + w / 2 - 5, y + 26);
  ctx.lineTo(x + w / 2 - 18, y + 28);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x + w / 2 + 14, y + 19);
  ctx.lineTo(x + w / 2 + 5, y + 26);
  ctx.lineTo(x + w / 2 + 18, y + 28);
  ctx.closePath();
  ctx.fill();
}

function drawPlayer() {
  const x = player.x;
  const y = player.y;
  const flash = player.deadFlash > 0;

  ctx.save();

  if (flash) {
    ctx.globalAlpha = 0.45 + Math.random() * 0.45;
  }

  ctx.fillStyle = "#1b2030";
  ctx.fillRect(x - 10, y + 4, 20, 16);

  ctx.fillStyle = "#e8d2b2";
  ctx.beginPath();
  ctx.arc(x, y - 8, 11, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#141018";
  ctx.beginPath();
  ctx.arc(x - 4, y - 10, 2, 0, Math.PI * 2);
  ctx.arc(x + 4, y - 10, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#141018";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 4, y - 2);
  ctx.lineTo(x + 4, y - 2);
  ctx.stroke();

  ctx.strokeStyle = "#e8d2b2";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x - 9, y + 9);
  ctx.lineTo(x - 18, y + 19);
  ctx.moveTo(x + 9, y + 9);
  ctx.lineTo(x + 18, y + 17);
  ctx.stroke();

  ctx.fillStyle = "#ffd45c";
  ctx.beginPath();
  ctx.moveTo(x + 18, y + 17);
  ctx.lineTo(x + 34, y + 11);
  ctx.lineTo(x + 34, y + 23);
  ctx.closePath();
  ctx.globalAlpha = flash ? 0.6 : 0.75;
  ctx.fill();

  ctx.globalAlpha = 1;
  ctx.fillStyle = "#cc233b";
  ctx.fillRect(x - 8, y + 20, 6, 10);
  ctx.fillRect(x + 2, y + 20, 6, 10);

  ctx.restore();
}

function drawParticles() {
  for (const p of particles) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.life * 2);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawOverlay(title, subtitle, prompt) {
  ctx.save();

  ctx.fillStyle = "rgba(3, 0, 5, 0.78)";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.strokeStyle = "rgba(255, 79, 154, 0.65)";
  ctx.lineWidth = 3;
  ctx.strokeRect(90, 220, WIDTH - 180, 270);

  ctx.fillStyle = "rgba(24, 4, 22, 0.95)";
  ctx.fillRect(96, 226, WIDTH - 192, 258);

  ctx.textAlign = "center";

  ctx.fillStyle = "#ffe8f4";
  ctx.font = "bold 44px Georgia";
  ctx.fillText(title, WIDTH / 2, 295);

  ctx.fillStyle = "#d9bfd8";
  ctx.font = "20px Georgia";
  wrapText(subtitle, WIDTH / 2, 342, 470, 28);

  ctx.fillStyle = "#ff9bc8";
  ctx.font = "bold 21px Georgia";
  ctx.fillText(prompt, WIDTH / 2, 430);

  ctx.fillStyle = "#a887a8";
  ctx.font = "16px Georgia";
  ctx.fillText("Arrow Keys / WASD to move     P to pause     R to restart", WIDTH / 2, 462);

  ctx.restore();
}

function wrapText(text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = words[n] + " ";
      y += lineHeight;
    } else {
      line = testLine;
    }
  }

  ctx.fillText(line, x, y);
}

function initAudio() {
  if (audioReady) return;

  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  audioReady = true;
}

function playSound(type) {
  if (!audioReady || !audioContext) return;

  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();

  osc.connect(gain);
  gain.connect(audioContext.destination);

  let frequency = 240;
  let duration = 0.08;

  if (type === "move") {
    frequency = 360;
    duration = 0.045;
  }

  if (type === "goal") {
    frequency = 680;
    duration = 0.14;
  }

  if (type === "level") {
    frequency = 880;
    duration = 0.22;
  }

  if (type === "death") {
    frequency = 90;
    duration = 0.2;
  }

  if (type === "splash") {
    frequency = 130;
    duration = 0.16;
  }

  osc.type = type === "death" || type === "splash" ? "sawtooth" : "triangle";
  osc.frequency.setValueAtTime(frequency, audioContext.currentTime);

  gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.12, audioContext.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);

  osc.start();
  osc.stop(audioContext.currentTime + duration + 0.03);
}

function gameLoop(timestamp) {
  const dt = Math.min(0.033, (timestamp - lastTime) / 1000 || 0);
  lastTime = timestamp;

  update(dt);
  draw();

  requestAnimationFrame(gameLoop);
}

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();

  if (
    ["arrowup", "arrowdown", "arrowleft", "arrowright", " ", "w", "a", "s", "d"].includes(key)
  ) {
    event.preventDefault();
  }

  if (!audioReady) {
    initAudio();
  }

  if (gameState === "title") {
    if (key === "enter" || key === " ") {
      startGame();
    }
    return;
  }

  if (gameState === "gameover") {
    if (key === "r" || key === "enter" || key === " ") {
      resetGame();
    }
    return;
  }

  if (key === "p") {
    gameState = gameState === "paused" ? "playing" : "paused";
    return;
  }

  if (key === "r") {
    resetGame();
    return;
  }

  if (gameState !== "playing") return;

  if (key === "arrowup" || key === "w") movePlayer(0, -1);
  if (key === "arrowdown" || key === "s") movePlayer(0, 1);
  if (key === "arrowleft" || key === "a") movePlayer(-1, 0);
  if (key === "arrowright" || key === "d") movePlayer(1, 0);
});

buildLanes();
draw();
requestAnimationFrame(gameLoop);