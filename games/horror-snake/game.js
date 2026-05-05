const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const highScoreEl = document.getElementById("highScore");
const stageNameEl = document.getElementById("stageName");
const streakEl = document.getElementById("streak");
const omenNameEl = document.getElementById("omenName");

const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayText = document.getElementById("overlayText");
const startBtn = document.getElementById("startBtn");
const muteBtn = document.getElementById("muteBtn");

const GRID_SIZE = 20;
const TILE = canvas.width / GRID_SIZE;

const START_SPEED = 145;
const MIN_SPEED = 62;
const RELIC_MIN_SCORE = 4;
const RELIC_DURATION = 5200;

const STAGES = [
  {
    name: "Graveyard",
    threshold: 0,
    background: "assets/background1.png",
    skyTop: "#140713",
    skyBottom: "#050305",
    fog: "rgba(157, 87, 255, 0.12)",
    grid: "rgba(241, 216, 177, 0.055)",
    accent: "rgba(125, 255, 157, 0.5)"
  },
  {
    name: "Catacombs",
    threshold: 8,
    background: "assets/background2.png",
    skyTop: "#190808",
    skyBottom: "#050102",
    fog: "rgba(180, 22, 43, 0.15)",
    grid: "rgba(241, 216, 177, 0.05)",
    accent: "rgba(241, 216, 177, 0.42)"
  },
  {
    name: "Blood Moon",
    threshold: 18,
    background: "assets/background3.png",
    skyTop: "#29040b",
    skyBottom: "#080103",
    fog: "rgba(255, 47, 80, 0.13)",
    grid: "rgba(255, 47, 80, 0.055)",
    accent: "rgba(255, 47, 80, 0.58)"
  },
  {
    name: "Void Chapel",
    threshold: 32,
    background: "assets/background4.png",
    skyTop: "#07051b",
    skyBottom: "#010005",
    fog: "rgba(132, 74, 255, 0.14)",
    grid: "rgba(132, 74, 255, 0.055)",
    accent: "rgba(157, 87, 255, 0.6)"
  }
];

const RUN_OMENS = [
  {
    name: "Nightfall",
    speedOffset: 0,
    comboWindow: 4200,
    relicChance: 0.14,
    obstacleBonus: 0,
    darkness: 0
  },
  {
    name: "Blood Rush",
    speedOffset: -8,
    comboWindow: 3600,
    relicChance: 0.2,
    obstacleBonus: 0,
    darkness: 0
  },
  {
    name: "Heavy Fog",
    speedOffset: 8,
    comboWindow: 4800,
    relicChance: 0.16,
    obstacleBonus: 1,
    darkness: 0.1
  },
  {
    name: "Grave Shift",
    speedOffset: 0,
    comboWindow: 4200,
    relicChance: 0.24,
    obstacleBonus: 1,
    darkness: 0.04
  }
];

for (const stage of STAGES) {
  const image = new Image();
  image.src = stage.background;
  stage.image = image;
}

let snake;
let direction;
let pendingDirection;
let inputQueue;
let food;
let relic;
let obstacles;
let score;
let highScore;
let streak;
let comboExpiresAt;
let pendingGrowth;
let gameState;
let lastFrameTime;
let moveAccumulator;
let soundOn;
let audioContext;
let eatFlash;
let screenShake;
let runOmen;
let stageOffset;

function boot() {
  highScore = Number(localStorage.getItem("horrorSnakeHighScore")) || 0;
  soundOn = true;
  gameState = "ready";
  runOmen = RUN_OMENS[0];
  stageOffset = 0;

  prepareRunFlavor();
  resetGame();
  draw(performance.now());

  highScoreEl.textContent = highScore;
  muteBtn.textContent = "Sound: On";

  startBtn.addEventListener("click", handleStartButton);
  muteBtn.addEventListener("click", toggleSound);

  document.addEventListener("keydown", handleKeyDown);

  document.querySelectorAll(".dir-btn").forEach((button) => {
    button.addEventListener("click", () => {
      queueDirection(button.dataset.dir);
    });
  });

  requestAnimationFrame(gameLoop);
}

function prepareRunFlavor() {
  runOmen = RUN_OMENS[Math.floor(Math.random() * RUN_OMENS.length)];
  stageOffset = Math.floor(Math.random() * STAGES.length);
}

function resetGame() {
  const center = Math.floor(GRID_SIZE / 2);

  snake = [
    { x: center, y: center },
    { x: center - 1, y: center },
    { x: center - 2, y: center },
    { x: center - 3, y: center }
  ];

  direction = { x: 1, y: 0 };
  pendingDirection = { x: 1, y: 0 };
  inputQueue = [];
  obstacles = [];
  score = 0;
  streak = 0;
  comboExpiresAt = 0;
  pendingGrowth = 0;
  relic = null;
  screenShake = 0;
  food = createFood();
  eatFlash = 0;
  lastFrameTime = 0;
  moveAccumulator = 0;

  updateHud();
}

function startGame() {
  prepareRunFlavor();
  resetGame();
  createObstacles();
  gameState = "running";
  overlayTitle.textContent = "Serpent of the Grave";
  overlayText.textContent = "";
  startBtn.textContent = "Start Run";
  overlay.classList.add("hidden");
  playSound("start");
}

function pauseGame() {
  if (gameState !== "running") return;

  gameState = "paused";

  overlayTitle.textContent = "Paused";
  overlayText.textContent = "Space resumes";
  startBtn.textContent = "Resume";
  overlay.classList.remove("hidden");
}

function resumeGame() {
  if (gameState !== "paused") return;

  gameState = "running";
  overlay.classList.add("hidden");
}

function gameOver() {
  gameState = "dead";
  screenShake = 11;
  playSound("death");

  if (score > highScore) {
    highScore = score;
    localStorage.setItem("horrorSnakeHighScore", String(highScore));
  }

  updateHud();

  overlayTitle.textContent = "Run Ended";
  overlayText.textContent = `Score ${score} | Best ${highScore}`;
  startBtn.textContent = "Try Again";
  overlay.classList.remove("hidden");
}

function handleStartButton() {
  if (gameState === "paused") {
    resumeGame();
    return;
  }

  startGame();
}

function handleKeyDown(event) {
  const key = event.key.toLowerCase();

  if (
    ["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d", " "].includes(key)
  ) {
    event.preventDefault();
  }

  if (key === "enter" && (gameState === "ready" || gameState === "dead")) {
    startGame();
    return;
  }

  if (key === " ") {
    if (gameState === "running") {
      pauseGame();
    } else if (gameState === "paused") {
      resumeGame();
    }
    return;
  }

  if (key === "m") {
    toggleSound();
    return;
  }

  if (key === "arrowup" || key === "w") queueDirection("up");
  if (key === "arrowdown" || key === "s") queueDirection("down");
  if (key === "arrowleft" || key === "a") queueDirection("left");
  if (key === "arrowright" || key === "d") queueDirection("right");
}

function queueDirection(dir) {
  if (gameState !== "running") return;

  const newDirection = directionFromName(dir);
  const lastQueued = inputQueue.length > 0 ? inputQueue[inputQueue.length - 1] : pendingDirection;

  if (isReverse(newDirection, lastQueued)) return;

  inputQueue.push(newDirection);

  if (inputQueue.length > 2) {
    inputQueue.shift();
  }
}

function directionFromName(name) {
  if (name === "up") return { x: 0, y: -1 };
  if (name === "down") return { x: 0, y: 1 };
  if (name === "left") return { x: -1, y: 0 };
  return { x: 1, y: 0 };
}

function isReverse(a, b) {
  return a.x + b.x === 0 && a.y + b.y === 0;
}

function gameLoop(time) {
  if (!lastFrameTime) lastFrameTime = time;

  const delta = time - lastFrameTime;
  lastFrameTime = time;

  if (gameState === "running") {
    moveAccumulator += delta;

    const speed = getCurrentSpeed();

    while (moveAccumulator >= speed) {
      updateGame(time);
      moveAccumulator -= speed;
    }
  }

  draw(time);
  requestAnimationFrame(gameLoop);
}

function updateGame(time) {
  const now = time || performance.now();

  if (comboExpiresAt && now > comboExpiresAt && streak !== 0) {
    streak = 0;
    comboExpiresAt = 0;
    updateHud();
  }

  if (relic && now > relic.expiresAt) {
    relic = null;
  }

  if (inputQueue.length > 0) {
    const next = inputQueue.shift();

    if (!isReverse(next, direction)) {
      direction = next;
      pendingDirection = next;
    }
  }

  const head = snake[0];
  const nextHead = {
    x: head.x + direction.x,
    y: head.y + direction.y
  };

  const willEatFood = isSameCell(nextHead, food);
  const willEatRelic = relic && isSameCell(nextHead, relic);
  const ignoreTail = !willEatFood && !willEatRelic && pendingGrowth === 0;

  if (hitWall(nextHead) || hitSnake(nextHead, ignoreTail) || hitObstacle(nextHead)) {
    gameOver();
    return;
  }

  snake.unshift(nextHead);

  let growth = 0;

  if (willEatFood) {
    growth += handleFoodEaten(now);
    createObstacles();
  }

  if (willEatRelic) {
    growth += handleRelicEaten(now);
  }

  if (growth > 0) {
    pendingGrowth += growth - 1;
  } else if (pendingGrowth > 0) {
    pendingGrowth -= 1;
  } else {
    snake.pop();
  }
}

function hitWall(pos) {
  return pos.x < 0 || pos.x >= GRID_SIZE || pos.y < 0 || pos.y >= GRID_SIZE;
}

function hitSnake(pos, ignoreTail = false) {
  const body = ignoreTail ? snake.slice(0, -1) : snake;
  return body.some((part) => isSameCell(part, pos));
}

function hitObstacle(pos) {
  return obstacles.some((obstacle) => isSameCell(obstacle, pos));
}

function isSameCell(a, b) {
  return Boolean(a && b && a.x === b.x && a.y === b.y);
}

function createFood() {
  const cell = createOpenCell([relic]);

  return {
    ...cell,
    pulseOffset: Math.random() * Math.PI * 2
  };
}

function createRelic(now) {
  const cell = createOpenCell([food]);

  return {
    ...cell,
    pulseOffset: Math.random() * Math.PI * 2,
    expiresAt: now + RELIC_DURATION
  };
}

function createOpenCell(extraBlocked = []) {
  let attempts = 0;

  while (attempts < 1000) {
    const candidate = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };

    if (!isCellBlocked(candidate, extraBlocked)) {
      return candidate;
    }

    attempts += 1;
  }

  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const candidate = { x, y };

      if (!isCellBlocked(candidate, extraBlocked)) {
        return candidate;
      }
    }
  }

  return { x: 2, y: 2 };
}

function isCellBlocked(pos, extraBlocked = []) {
  return (
    snake.some((part) => isSameCell(part, pos)) ||
    obstacles.some((obstacle) => isSameCell(obstacle, pos)) ||
    extraBlocked.some((item) => isSameCell(item, pos))
  );
}

function handleFoodEaten(now) {
  updateStreak(now);

  const streakBonus = Math.min(3, Math.floor(streak / 3));
  score += 1 + streakBonus;
  eatFlash = 1;
  screenShake = Math.max(screenShake, 2.5 + streakBonus);
  food = createFood();

  maybeSpawnRelic(now);
  playSound(streakBonus > 0 ? "bonus" : "eat");
  updateHud();

  return 1;
}

function handleRelicEaten(now) {
  updateStreak(now);

  const relicBonus = 3 + Math.min(4, Math.floor(streak / 2));
  score += relicBonus;
  eatFlash = 1.4;
  screenShake = Math.max(screenShake, 7);
  relic = null;

  playSound("relic");
  updateHud();

  return 2;
}

function updateStreak(now) {
  streak = comboExpiresAt && now <= comboExpiresAt ? streak + 1 : 1;
  comboExpiresAt = now + getComboWindow();
}

function maybeSpawnRelic(now) {
  if (relic || score < RELIC_MIN_SCORE) return;

  const streakBoost = Math.min(0.08, streak * 0.008);
  const chance = runOmen.relicChance + streakBoost;

  if (Math.random() <= chance) {
    relic = createRelic(now);
  }
}

function getComboWindow() {
  return runOmen ? runOmen.comboWindow : 4200;
}

function getDesiredObstacleCount() {
  if (score < 6) return 0;

  const omenBonus = runOmen ? runOmen.obstacleBonus : 0;
  return Math.min(10, Math.floor(score / 6) + 1 + omenBonus);
}

function createObstacles() {
  const desiredCount = getDesiredObstacleCount();
  obstacles = obstacles.filter(
    (obstacle) =>
      !snake.some((part) => isSameCell(part, obstacle)) &&
      !isSameCell(obstacle, food) &&
      !isSameCell(obstacle, relic)
  );

  if (obstacles.length > desiredCount) {
    obstacles = obstacles.slice(0, desiredCount);
  }

  let attempts = 0;

  while (obstacles.length < desiredCount && attempts < 1000) {
    const obstacle = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE)
    };

    const head = snake[0];

    const overlapsSnake = snake.some((part) => isSameCell(part, obstacle));
    const overlapsFood = isSameCell(food, obstacle);
    const overlapsRelic = isSameCell(relic, obstacle);
    const overlapsObstacle = obstacles.some((existing) => isSameCell(existing, obstacle));

    const tooCloseToHead =
      Math.abs(obstacle.x - head.x) + Math.abs(obstacle.y - head.y) <= 3;

    const tooCloseToSpawn =
      Math.abs(obstacle.x - Math.floor(GRID_SIZE / 2)) +
        Math.abs(obstacle.y - Math.floor(GRID_SIZE / 2)) <=
      3;

    if (
      !overlapsSnake &&
      !overlapsFood &&
      !overlapsRelic &&
      !overlapsObstacle &&
      !tooCloseToHead &&
      !tooCloseToSpawn
    ) {
      obstacles.push(obstacle);
    }

    attempts += 1;
  }
}

function getCurrentSpeed() {
  const omenOffset = runOmen ? runOmen.speedOffset : 0;
  return Math.max(MIN_SPEED, START_SPEED - score * 3.2 + omenOffset);
}

function getCurrentStage() {
  let currentIndex = 0;

  STAGES.forEach((stage, index) => {
    if (score >= stage.threshold) {
      currentIndex = index;
    }
  });

  return STAGES[(currentIndex + stageOffset) % STAGES.length];
}

function updateHud() {
  scoreEl.textContent = score;
  highScoreEl.textContent = Math.max(highScore, score);
  stageNameEl.textContent = getCurrentStage().name;
  streakEl.textContent = `${streak}x`;
  omenNameEl.textContent = runOmen.name;
}

function draw(time) {
  const stage = getCurrentStage();

  ctx.save();
  applyScreenShake();
  drawBackground(stage, time);
  if (!hasLoadedStageBackground(stage)) {
    drawDecorations(stage, time);
  }
  drawObstacles(stage, time);
  drawRelic(time);
  drawFood(time);
  drawSnake(time);
  drawVignette();
  drawEatFlash();
  drawComboMeter(time);

  if (gameState === "ready") {
    drawStartHint(time);
  }

  ctx.restore();
}

function applyScreenShake() {
  if (screenShake <= 0) return;

  const shakeX = (Math.random() - 0.5) * screenShake;
  const shakeY = (Math.random() - 0.5) * screenShake;
  ctx.translate(shakeX, shakeY);

  screenShake *= 0.82;

  if (screenShake < 0.25) {
    screenShake = 0;
  }
}

function drawBackground(stage, time) {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, stage.skyTop);
  gradient.addColorStop(1, stage.skyBottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (hasLoadedStageBackground(stage)) {
    drawCoverImage(stage.image, time);

    const shade = ctx.createLinearGradient(0, 0, 0, canvas.height);
    shade.addColorStop(0, "rgba(0, 0, 0, 0.3)");
    shade.addColorStop(0.55, "rgba(0, 0, 0, 0.18)");
    shade.addColorStop(1, "rgba(0, 0, 0, 0.56)");
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.save();
  ctx.globalAlpha = hasLoadedStageBackground(stage) ? 0.55 : 0.85;

  for (let i = 0; i < 9; i++) {
    const x = ((time * 0.012 + i * 93) % (canvas.width + 140)) - 70;
    const y = 60 + i * 62 + Math.sin(time * 0.001 + i) * 18;

    const fogGradient = ctx.createRadialGradient(x, y, 10, x, y, 140);
    fogGradient.addColorStop(0, stage.fog);
    fogGradient.addColorStop(1, "rgba(0, 0, 0, 0)");

    ctx.fillStyle = fogGradient;
    ctx.beginPath();
    ctx.arc(x, y, 140, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();

  ctx.strokeStyle = stage.grid;
  ctx.lineWidth = 1;

  for (let i = 0; i <= GRID_SIZE; i++) {
    const line = i * TILE;

    ctx.beginPath();
    ctx.moveTo(line, 0);
    ctx.lineTo(line, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, line);
    ctx.lineTo(canvas.width, line);
    ctx.stroke();
  }
}

function hasLoadedStageBackground(stage) {
  return stage.image && stage.image.complete && stage.image.naturalWidth > 0;
}

function drawCoverImage(image, time) {
  const scale = Math.max(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight) * 1.04;
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;
  const drift = Math.sin(time * 0.00012 + stageOffset) * 7;
  const x = (canvas.width - width) / 2 + drift;
  const y = (canvas.height - height) / 2;

  ctx.drawImage(image, x, y, width, height);
}

function drawDecorations(stage, time) {
  drawMoon(stage, time);
  drawGravestones(stage);
  drawBones(stage);
}

function drawMoon(stage, time) {
  const pulse = Math.sin(time * 0.002) * 4;

  ctx.save();
  ctx.fillStyle = stage.accent;
  ctx.shadowColor = stage.accent;
  ctx.shadowBlur = 28;

  ctx.beginPath();
  ctx.arc(canvas.width - 92, 82, 34 + pulse, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.arc(canvas.width - 78, 72, 34, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawGravestones(stage) {
  const stones = [
    { x: 55, y: 520, w: 34, h: 54 },
    { x: 116, y: 474, w: 28, h: 44 },
    { x: 468, y: 510, w: 38, h: 58 },
    { x: 528, y: 452, w: 30, h: 46 }
  ];

  ctx.save();
  ctx.globalAlpha = 0.2;
  ctx.fillStyle = "#a99183";
  ctx.strokeStyle = stage.accent;
  ctx.lineWidth = 1;

  for (const stone of stones) {
    ctx.beginPath();
    ctx.roundRect(stone.x, stone.y, stone.w, stone.h, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    ctx.fillRect(stone.x + 9, stone.y + 18, stone.w - 18, 3);
    ctx.fillStyle = "#a99183";
  }

  ctx.restore();
}

function drawBones(stage) {
  const bones = [
    { x: 70, y: 78, r: -0.4 },
    { x: 505, y: 210, r: 0.6 },
    { x: 185, y: 560, r: 0.22 }
  ];

  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.strokeStyle = stage.accent;
  ctx.lineWidth = 4;
  ctx.lineCap = "round";

  for (const bone of bones) {
    ctx.translate(bone.x, bone.y);
    ctx.rotate(bone.r);

    ctx.beginPath();
    ctx.moveTo(-16, 0);
    ctx.lineTo(16, 0);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(-20, -4, 5, 0, Math.PI * 2);
    ctx.arc(-20, 5, 5, 0, Math.PI * 2);
    ctx.arc(20, -4, 5, 0, Math.PI * 2);
    ctx.arc(20, 5, 5, 0, Math.PI * 2);
    ctx.stroke();

    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  ctx.restore();
}

function drawObstacles(stage, time) {
  if (obstacles.length === 0) return;

  for (const obstacle of obstacles) {
    const x = obstacle.x * TILE;
    const y = obstacle.y * TILE;
    const pulse = 0.8 + Math.sin(time * 0.004 + obstacle.x + obstacle.y) * 0.2;

    ctx.save();

    ctx.shadowColor = stage.accent;
    ctx.shadowBlur = 8 + pulse * 5;

    ctx.fillStyle = "#75696a";
    ctx.strokeStyle = "rgba(255, 230, 200, 0.28)";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.roundRect(x + 5, y + 4, TILE - 10, TILE - 7, 8);
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;

    ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
    ctx.fillRect(x + TILE * 0.34, y + TILE * 0.38, TILE * 0.32, 3);

    ctx.fillStyle = "rgba(255, 230, 200, 0.18)";
    ctx.fillRect(x + TILE * 0.42, y + TILE * 0.25, TILE * 0.16, 3);
    ctx.fillRect(x + TILE * 0.48, y + TILE * 0.19, 3, TILE * 0.16);

    ctx.fillStyle = "rgba(20, 8, 10, 0.42)";
    ctx.fillRect(x + 6, y + TILE - 8, TILE - 12, 4);

    ctx.restore();
  }
}

function drawRelic(time) {
  if (!relic) return;

  const x = relic.x * TILE + TILE / 2;
  const y = relic.y * TILE + TILE / 2;
  const remaining = Math.max(0, relic.expiresAt - time);
  const life = Math.min(1, remaining / RELIC_DURATION);
  const pulse = 1 + Math.sin(time * 0.01 + relic.pulseOffset) * 0.14;
  const size = TILE * 0.92 * pulse;

  ctx.save();
  ctx.globalAlpha = Math.max(0.32, life);
  ctx.shadowColor = "rgba(255, 218, 116, 0.95)";
  ctx.shadowBlur = 24;
  ctx.fillStyle = "#ffd66f";

  ctx.beginPath();
  ctx.moveTo(x, y - size * 0.5);
  ctx.lineTo(x + size * 0.42, y);
  ctx.lineTo(x, y + size * 0.5);
  ctx.lineTo(x - size * 0.42, y);
  ctx.closePath();
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(90, 22, 8, 0.78)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "rgba(80, 16, 6, 0.7)";
  ctx.beginPath();
  ctx.arc(x, y, size * 0.14, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawFood(time) {
  const x = food.x * TILE + TILE / 2;
  const y = food.y * TILE + TILE / 2;
  const pulse = 1 + Math.sin(time * 0.008 + food.pulseOffset) * 0.12;
  const size = TILE * 1.05 * pulse;

  ctx.save();

  ctx.shadowColor = "rgba(255, 36, 74, 0.95)";
  ctx.shadowBlur = 22;
  ctx.fillStyle = "#ff244a";

  ctx.beginPath();
  ctx.moveTo(x, y + size * 0.35);
  ctx.bezierCurveTo(
    x - size * 0.72,
    y - size * 0.12,
    x - size * 0.42,
    y - size * 0.7,
    x,
    y - size * 0.34
  );
  ctx.bezierCurveTo(
    x + size * 0.42,
    y - size * 0.7,
    x + size * 0.72,
    y - size * 0.12,
    x,
    y + size * 0.35
  );
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(255, 226, 198, 0.72)";
  ctx.beginPath();
  ctx.arc(x - size * 0.16, y - size * 0.2, size * 0.11, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawSnake(time) {
  for (let i = snake.length - 1; i >= 0; i--) {
    const part = snake[i];
    const x = part.x * TILE;
    const y = part.y * TILE;
    const isHead = i === 0;
    const shade = Math.max(0.35, 1 - i * 0.018);

    if (isHead) {
      drawSnakeHead(x, y, time);
    } else {
      drawSnakeBody(x, y, shade, i);
    }
  }
}

function drawSnakeBody(x, y, shade, index) {
  const pad = 3;
  const segmentSize = TILE - pad * 2;

  ctx.save();

  const bodyGradient = ctx.createLinearGradient(x, y, x + TILE, y + TILE);
  bodyGradient.addColorStop(0, `rgba(92, 255, 128, ${0.95 * shade})`);
  bodyGradient.addColorStop(0.45, `rgba(33, 121, 55, ${0.95 * shade})`);
  bodyGradient.addColorStop(1, `rgba(18, 44, 28, ${0.98 * shade})`);

  ctx.fillStyle = bodyGradient;
  ctx.shadowColor = "rgba(125, 255, 157, 0.36)";
  ctx.shadowBlur = 10;

  ctx.beginPath();
  ctx.roundRect(x + pad, y + pad, segmentSize, segmentSize, 8);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(2, 18, 8, 0.8)";
  ctx.lineWidth = 2;
  ctx.stroke();

  if (index % 2 === 0) {
    ctx.fillStyle = "rgba(255, 244, 214, 0.3)";
    ctx.beginPath();
    ctx.arc(x + TILE * 0.5, y + TILE * 0.5, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawSnakeHead(x, y, time) {
  const pad = 2;
  const size = TILE - pad * 2;

  ctx.save();

  const headGradient = ctx.createRadialGradient(
    x + TILE * 0.35,
    y + TILE * 0.28,
    3,
    x + TILE * 0.5,
    y + TILE * 0.5,
    TILE
  );

  headGradient.addColorStop(0, "#a5ffb7");
  headGradient.addColorStop(0.45, "#38bd62");
  headGradient.addColorStop(1, "#0d2b18");

  ctx.fillStyle = headGradient;
  ctx.shadowColor = "rgba(125, 255, 157, 0.7)";
  ctx.shadowBlur = 16;

  ctx.beginPath();
  ctx.roundRect(x + pad, y + pad, size, size, 9);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(0, 0, 0, 0.85)";
  ctx.lineWidth = 2;
  ctx.stroke();

  drawSnakeEyes(x, y);
  drawSnakeTongue(x, y, time);

  ctx.restore();
}

function drawSnakeEyes(x, y) {
  let eyeOne;
  let eyeTwo;

  if (direction.x === 1) {
    eyeOne = { x: x + TILE * 0.66, y: y + TILE * 0.32 };
    eyeTwo = { x: x + TILE * 0.66, y: y + TILE * 0.68 };
  } else if (direction.x === -1) {
    eyeOne = { x: x + TILE * 0.34, y: y + TILE * 0.32 };
    eyeTwo = { x: x + TILE * 0.34, y: y + TILE * 0.68 };
  } else if (direction.y === -1) {
    eyeOne = { x: x + TILE * 0.32, y: y + TILE * 0.34 };
    eyeTwo = { x: x + TILE * 0.68, y: y + TILE * 0.34 };
  } else {
    eyeOne = { x: x + TILE * 0.32, y: y + TILE * 0.66 };
    eyeTwo = { x: x + TILE * 0.68, y: y + TILE * 0.66 };
  }

  ctx.fillStyle = "#fff4d7";
  ctx.beginPath();
  ctx.arc(eyeOne.x, eyeOne.y, 4, 0, Math.PI * 2);
  ctx.arc(eyeTwo.x, eyeTwo.y, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#b4162b";
  ctx.beginPath();
  ctx.arc(eyeOne.x, eyeOne.y, 1.7, 0, Math.PI * 2);
  ctx.arc(eyeTwo.x, eyeTwo.y, 1.7, 0, Math.PI * 2);
  ctx.fill();
}

function drawSnakeTongue(x, y, time) {
  const flicker = Math.sin(time * 0.02) > -0.2;
  if (!flicker) return;

  let startX = x + TILE / 2;
  let startY = y + TILE / 2;
  let endX = startX;
  let endY = startY;

  if (direction.x === 1) {
    startX = x + TILE - 3;
    endX = x + TILE + 10;
  } else if (direction.x === -1) {
    startX = x + 3;
    endX = x - 10;
  } else if (direction.y === -1) {
    startY = y + 3;
    endY = y - 10;
  } else {
    startY = y + TILE - 3;
    endY = y + TILE + 10;
  }

  ctx.strokeStyle = "#ff244a";
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";

  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  const fork = 6;

  ctx.beginPath();

  if (direction.x !== 0) {
    ctx.moveTo(endX, endY);
    ctx.lineTo(endX - direction.x * fork, endY - fork);
    ctx.moveTo(endX, endY);
    ctx.lineTo(endX - direction.x * fork, endY + fork);
  } else {
    ctx.moveTo(endX, endY);
    ctx.lineTo(endX - fork, endY - direction.y * fork);
    ctx.moveTo(endX, endY);
    ctx.lineTo(endX + fork, endY - direction.y * fork);
  }

  ctx.stroke();
}

function drawVignette() {
  const edgeDarkness = 0.55 + (runOmen ? runOmen.darkness : 0);
  const gradient = ctx.createRadialGradient(
    canvas.width / 2,
    canvas.height / 2,
    150,
    canvas.width / 2,
    canvas.height / 2,
    430
  );

  gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
  gradient.addColorStop(1, `rgba(0, 0, 0, ${edgeDarkness})`);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawEatFlash() {
  if (eatFlash <= 0) return;

  ctx.save();
  ctx.fillStyle = `rgba(255, 0, 35, ${eatFlash * 0.14})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  eatFlash -= 0.045;

  if (eatFlash < 0) {
    eatFlash = 0;
  }
}

function drawComboMeter(time) {
  if (streak < 2 || !comboExpiresAt) return;

  const remaining = Math.max(0, comboExpiresAt - time);
  const ratio = Math.min(1, remaining / getComboWindow());

  if (ratio <= 0) return;

  const width = 148;
  const height = 8;
  const x = (canvas.width - width) / 2;
  const y = 16;

  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.46)";
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 4);
  ctx.fill();

  ctx.fillStyle = "rgba(255, 214, 111, 0.88)";
  ctx.beginPath();
  ctx.roundRect(x, y, width * ratio, height, 4);
  ctx.fill();

  ctx.font = "700 14px Courier New";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = "#f3d8aa";
  ctx.shadowColor = "rgba(0, 0, 0, 0.75)";
  ctx.shadowBlur = 6;
  ctx.fillText(`${streak}x`, canvas.width / 2, y + 12);
  ctx.restore();
}

function drawStartHint(time) {
  const alpha = 0.55 + Math.sin(time * 0.004) * 0.2;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "#f1d8b1";
  ctx.font = "700 22px Courier New";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(180, 22, 43, 0.8)";
  ctx.shadowBlur = 12;
  ctx.fillText("START", canvas.width / 2, canvas.height - 54);
  ctx.restore();
}

function toggleSound() {
  soundOn = !soundOn;
  muteBtn.textContent = soundOn ? "Sound: On" : "Sound: Off";

  if (soundOn) {
    playSound("start");
  }
}

function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  return audioContext;
}

function playSound(type) {
  if (!soundOn) return;

  const audio = getAudioContext();

  if (audio.state === "suspended") {
    audio.resume();
  }

  const now = audio.currentTime;

  if (type === "eat") {
    playTone(audio, 190, 0.04, 0.035, "square", now);
    playTone(audio, 320, 0.06, 0.03, "triangle", now + 0.04);
  }

  if (type === "bonus") {
    playTone(audio, 220, 0.04, 0.035, "square", now);
    playTone(audio, 390, 0.07, 0.032, "triangle", now + 0.04);
    playTone(audio, 520, 0.08, 0.026, "triangle", now + 0.1);
  }

  if (type === "relic") {
    playTone(audio, 260, 0.08, 0.04, "triangle", now);
    playTone(audio, 420, 0.1, 0.035, "triangle", now + 0.07);
    playTone(audio, 680, 0.1, 0.025, "sine", now + 0.14);
  }

  if (type === "death") {
    playTone(audio, 130, 0.16, 0.08, "sawtooth", now);
    playTone(audio, 82, 0.24, 0.08, "sawtooth", now + 0.12);
  }

  if (type === "start") {
    playTone(audio, 220, 0.06, 0.035, "triangle", now);
    playTone(audio, 330, 0.08, 0.03, "triangle", now + 0.07);
  }
}

function playTone(audio, frequency, duration, volume, wave, startTime) {
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();

  oscillator.type = wave;
  oscillator.frequency.setValueAtTime(frequency, startTime);

  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  oscillator.connect(gain);
  gain.connect(audio.destination);

  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.03);
}

if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function roundRect(x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);

    this.beginPath();
    this.moveTo(x + radius, y);
    this.arcTo(x + w, y, x + w, y + h, radius);
    this.arcTo(x + w, y + h, x, y + h, radius);
    this.arcTo(x, y + h, x, y, radius);
    this.arcTo(x, y, x + w, y, radius);
    this.closePath();

    return this;
  };
}

boot();
