// Flappy Bat - Menu + Achievements + Sound Toggle + Power-ups + Moving Pipes + Patterned Variety

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const hudEl = document.getElementById("hud");
const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const restartBtn = document.getElementById("restart");

const menuEl = document.getElementById("menu");
const menuBestEl = document.getElementById("menu-best");
const btnPlay = document.getElementById("btn-play");
const btnAchievements = document.getElementById("btn-achievements");
const btnSound = document.getElementById("btn-sound");

const achievementsEl = document.getElementById("achievements");
const achListEl = document.getElementById("ach-list");
const btnAchBack = document.getElementById("btn-ach-back");
const btnAchReset = document.getElementById("btn-ach-reset");

const overlay = document.getElementById("overlay");
const overTitle = document.getElementById("over-title");
const finalScoreEl = document.getElementById("final-score");
const playAgainBtn = document.getElementById("play-again");
const btnMenu = document.getElementById("btn-menu");

const toastEl = document.getElementById("toast");

// -------------------- Persistent keys --------------------
const HS_KEY = "flappybat_highscore";
const ACH_KEY = "flappybat_achievements_v1";
const SOUND_KEY = "flappybat_sound_enabled_v1";

// Achievements: 25, 50, 75... 500
const ACH_STEPS = [];
for (let s = 25; s <= 500; s += 25) ACH_STEPS.push(s);

let highScore = Number(localStorage.getItem(HS_KEY) || 0);
let unlocked = loadAchievements();

// Sound enabled
let soundEnabled = loadSoundSetting();

// -------------------- Game mode --------------------
let mode = "menu"; // menu | playing | gameover | achievements

// -------------------- State --------------------
let score = 0;
let isGameOver = false;
let animationId = null;

// -------------------- Audio --------------------
let audioCtx = null;
let masterGain = null;

function initAudio() {
  if (!soundEnabled) return;
  if (audioCtx) return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  audioCtx = new AudioContext();
  masterGain = audioCtx.createGain();
  masterGain.gain.value = 0.15;
  masterGain.connect(audioCtx.destination);
}

function tone(freq, duration = 0.08) {
  if (!soundEnabled) return;
  initAudio();
  if (!audioCtx) return;

  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.frequency.value = freq;
  o.type = "square";
  g.gain.value = 0.0001;

  o.connect(g);
  g.connect(masterGain);

  const t = audioCtx.currentTime;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.12, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration);

  o.start(t);
  o.stop(t + duration + 0.02);
}

function playSound(name) {
  if (!soundEnabled) return;
  if (name === "flap") tone(520, 0.06);
  if (name === "death") tone(120, 0.18);
  if (name === "power") tone(780, 0.07);
  if (name === "shieldpop") tone(260, 0.12);
  if (name === "ach") tone(900, 0.09);
}

// -------------------- Helpers --------------------
function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}
function rand(min, max) {
  return Math.random() * (max - min) + min;
}
function choice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function circleHit(ax, ay, ar, bx, by, br) {
  const dx = ax - bx;
  const dy = ay - by;
  const rr = ar + br;
  return dx * dx + dy * dy <= rr * rr;
}
function screenShake() {
  canvas.style.transform = `translate(${Math.random() * 10 - 5}px, ${Math.random() * 10 - 5}px)`;
  setTimeout(() => (canvas.style.transform = "none"), 180);
}

// -------------------- Achievements persistence --------------------
function loadAchievements() {
  try {
    const raw = localStorage.getItem(ACH_KEY);
    if (!raw) return {};
    const obj = JSON.parse(raw);
    return obj && typeof obj === "object" ? obj : {};
  } catch {
    return {};
  }
}

function saveAchievements() {
  localStorage.setItem(ACH_KEY, JSON.stringify(unlocked));
}

function isUnlocked(step) {
  return !!unlocked[String(step)];
}

function unlock(step) {
  unlocked[String(step)] = true;
  saveAchievements();
  renderAchievementsList();
  showToast(`Achievement Unlocked: ${step} points!`);
  playSound("ach");
}

// -------------------- Sound persistence --------------------
function loadSoundSetting() {
  const raw = localStorage.getItem(SOUND_KEY);
  if (raw === null) return true;
  return raw === "1";
}
function saveSoundSetting() {
  localStorage.setItem(SOUND_KEY, soundEnabled ? "1" : "0");
}
function updateSoundButton() {
  btnSound.textContent = `Sound: ${soundEnabled ? "On" : "Off"}`;
}

// -------------------- Toast --------------------
let toastTimer = null;
function showToast(text) {
  toastEl.textContent = text;
  toastEl.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.add("hidden"), 1600);
}

// -------------------- UI mode switching --------------------
function setMode(next) {
  mode = next;

  const showMenu = mode === "menu";
  const showAch = mode === "achievements";
  const showOver = mode === "gameover";

  menuEl.classList.toggle("hidden", !showMenu);
  achievementsEl.classList.toggle("hidden", !showAch);
  overlay.classList.toggle("hidden", !showOver);

  // HUD visible only while playing
  hudEl.classList.toggle("hidden", mode !== "playing");
}

function renderAchievementsList() {
  achListEl.innerHTML = "";
  for (const step of ACH_STEPS) {
    const row = document.createElement("div");
    row.className = "ach-item";

    const left = document.createElement("div");
    left.className = "badge";

    const dot = document.createElement("span");
    dot.className = "dot" + (isUnlocked(step) ? " on" : "");

    const label = document.createElement("span");
    label.textContent = `${step} points`;

    left.appendChild(dot);
    left.appendChild(label);

    const right = document.createElement("div");
    right.style.opacity = isUnlocked(step) ? "1" : "0.6";
    right.textContent = isUnlocked(step) ? "Unlocked" : "Locked";

    row.appendChild(left);
    row.appendChild(right);
    achListEl.appendChild(row);
  }
}

function updateUI() {
  scoreEl.textContent = `Score: ${score}`;
  bestEl.textContent = `Best: ${highScore}`;
  menuBestEl.textContent = String(highScore);
  updateSoundButton();
}

// -------------------- Game logic --------------------
let fb_bird = { x: 80, y: 300, velocity: 0, radius: 15, rotation: 0 };
let fb_pipes = [];
let fb_frame = 0;

const FB_GRAVITY = 0.25;
const FB_JUMP = -6;

let fb_speed = 3;
const FB_PIPE_W = 60;
const FB_GAP_BASE = 170;
const FB_SPAWN_RATE = 110;

const TOP_MARGIN = 50;
const BOTTOM_MARGIN = 50;
const MAX_GAP_JUMP = 110;

// Moving pipe settings
const MOVING_PIPE_CHANCE = 0.05;
const MOVING_PIPE_MIN_SCORE = 6;
const MOVING_AMP_MIN = 18;
const MOVING_AMP_MAX = 30;
const MOVING_SPEED_MIN = 0.035;
const MOVING_SPEED_MAX = 0.06;

let lastSpawnWasMoving = false;

// Power-ups
const POWER_MIN_SCORE = 5;
const POWER_SPAWN_CHANCE = 0.08;
const POWER_COOLDOWN_PIPES = 6;
const POWER_SIZE = 10;
const SLOW_TIME_FRAMES = 240;
const SLOW_MULT = 0.65;
const INVULN_FRAMES = 45;

let powerups = [];
let powerCooldownPipes = 0;
let shieldActive = false;
let slowTimeFrames = 0;
let invulnFrames = 0;

// Patterns
const PATTERNS = [
  { name: "standard",     lenRange: [5, 8],  steps: [0, 0, 0, 0, 0, 0, 0, 0], gapMul: 1.0 },
  { name: "stairUp",      lenRange: [6, 9],  steps: [0, -25, -50, -75, -90, -105, -120, -135, -150], gapMul: 1.0 },
  { name: "stairDown",    lenRange: [6, 9],  steps: [0, 25, 50, 75, 90, 105, 120, 135, 150], gapMul: 1.0 },
  { name: "zigzag",       lenRange: [6, 10], steps: [0, 55, -55, 55, -55, 55, -55, 55, -55, 55], gapMul: 1.0 },
  { name: "gentleWave",   lenRange: [7, 11], steps: [0, 25, 45, 60, 45, 25, 0, -25, -45, -60, -45, -25], gapMul: 1.0 },
  { name: "tightSection", lenRange: [5, 8],  steps: [0, 10, -10, 15, -15, 10, -10, 0], gapMul: 0.86 },
  { name: "breather",     lenRange: [4, 6],  steps: [0, 0, 0, 0, 0, 0], gapMul: 1.12 }
];

let pattern = null;
let patternIndex = 0;
let patternRemaining = 0;
let patternBaseGapY = 0;
let lastGapY = null;
let lastPatternName = null;

function pickPattern() {
  const pool = [];
  PATTERNS.forEach((p) => {
    let w = 1;
    if (p.name === "standard") w = 2;
    if (p.name === "tightSection") w = 2;
    for (let i = 0; i < w; i++) pool.push(p);
  });

  let picked = choice(pool);

  if (lastPatternName && picked.name === lastPatternName) {
    for (let tries = 0; tries < 6; tries++) {
      const alt = choice(pool);
      if (alt.name !== lastPatternName) {
        picked = alt;
        break;
      }
    }
  }

  lastPatternName = picked.name;
  pattern = picked;
  patternIndex = 0;
  patternRemaining = Math.floor(rand(pattern.lenRange[0], pattern.lenRange[1] + 1));

  const gapH = FB_GAP_BASE * pattern.gapMul;
  const minGapY = TOP_MARGIN;
  const maxGapY = canvas.height - BOTTOM_MARGIN - gapH;

  patternBaseGapY = rand(minGapY, maxGapY);
  lastGapY = null;
}

function computeSpawnEvery() {
  const raw = Math.floor(FB_SPAWN_RATE * (3 / fb_speed));
  return clamp(raw, 55, 140);
}

function maybeMakeMovingPipe(pipe) {
  if (score < MOVING_PIPE_MIN_SCORE) return;
  if (lastSpawnWasMoving) return;
  if (Math.random() > MOVING_PIPE_CHANCE) return;

  pipe.isMoving = true;
  pipe.oscBase = pipe.gapY;
  pipe.oscT = rand(0, Math.PI * 2);
  pipe.oscAmp = rand(MOVING_AMP_MIN, MOVING_AMP_MAX);
  pipe.oscSpeed = rand(MOVING_SPEED_MIN, MOVING_SPEED_MAX);

  const minGapY = TOP_MARGIN;
  const maxGapY = canvas.height - BOTTOM_MARGIN - pipe.gapH;
  pipe.oscBase = clamp(pipe.oscBase, minGapY + pipe.oscAmp, maxGapY - pipe.oscAmp);

  lastSpawnWasMoving = true;
}

function maybeSpawnPowerup(pipe) {
  if (score < POWER_MIN_SCORE) return;
  if (powerups.length > 0) return;
  if (powerCooldownPipes > 0) return;
  if (pipe.isMoving) return;
  if (Math.random() > POWER_SPAWN_CHANCE) return;

  const type = Math.random() < 0.6 ? "shield" : "slow";
  const x = pipe.x + FB_PIPE_W / 2;
  const y = pipe.gapY + pipe.gapH / 2;

  powerups.push({ x, y, r: POWER_SIZE, type });
  powerCooldownPipes = POWER_COOLDOWN_PIPES;
}

function spawnPipe() {
  if (!pattern || patternRemaining <= 0) pickPattern();

  const stepOffset = pattern.steps[patternIndex % pattern.steps.length] ?? 0;

  let gapH = FB_GAP_BASE * pattern.gapMul;
  const gapTighten = clamp(score * 0.35, 0, 22);
  gapH = clamp(gapH - gapTighten, 120, 220);

  const minGapY = TOP_MARGIN;
  const maxGapY = canvas.height - BOTTOM_MARGIN - gapH;

  let gapY = patternBaseGapY + stepOffset;
  gapY = clamp(gapY, minGapY, maxGapY);

  if (lastGapY != null) {
    gapY = clamp(gapY, lastGapY - MAX_GAP_JUMP, lastGapY + MAX_GAP_JUMP);
    gapY = clamp(gapY, minGapY, maxGapY);
  }

  const pipe = {
    x: canvas.width,
    gapY,
    gapH,
    passed: false,
    isMoving: false,
    oscBase: 0,
    oscT: 0,
    oscAmp: 0,
    oscSpeed: 0
  };

  lastSpawnWasMoving = false;
  maybeMakeMovingPipe(pipe);

  fb_pipes.push(pipe);
  lastGapY = gapY;

  maybeSpawnPowerup(pipe);
  if (powerCooldownPipes > 0) powerCooldownPipes--;

  patternIndex++;
  patternRemaining--;
}

function currentScrollSpeed() {
  const mult = slowTimeFrames > 0 ? SLOW_MULT : 1;
  return fb_speed * mult;
}

function initRun() {
  isGameOver = false;
  score = 0;

  fb_bird = { x: 80, y: 300, velocity: 0, radius: 15, rotation: 0 };
  fb_pipes = [];
  fb_frame = 0;
  fb_speed = 3;

  pattern = null;
  patternIndex = 0;
  patternRemaining = 0;
  patternBaseGapY = 0;
  lastGapY = null;
  lastPatternName = null;
  lastSpawnWasMoving = false;

  powerups = [];
  powerCooldownPipes = 0;
  shieldActive = false;
  slowTimeFrames = 0;
  invulnFrames = 0;

  updateUI();
}

function checkAchievements() {
  for (const step of ACH_STEPS) {
    if (score >= step && !isUnlocked(step)) unlock(step);
  }
}

function handleDeath() {
  isGameOver = true;
  playSound("death");
  screenShake();

  if (score > highScore) {
    highScore = score;
    localStorage.setItem(HS_KEY, String(highScore));
    overTitle.textContent = "NEW RECORD!";
  } else {
    overTitle.textContent = "Game Over";
  }

  finalScoreEl.textContent = String(score);
  updateUI();

  // IMPORTANT: keep rendering the frozen gameplay scene behind the overlay
  setMode("gameover");
}

function flap() {
  if (mode !== "playing") return;
  if (isGameOver) return;
  playSound("flap");
  fb_bird.velocity = FB_JUMP;
}

function updateGame() {
  fb_frame++;

  if (slowTimeFrames > 0) slowTimeFrames--;
  if (invulnFrames > 0) invulnFrames--;

  fb_bird.velocity += FB_GRAVITY;
  fb_bird.y += fb_bird.velocity;
  fb_bird.rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, fb_bird.velocity * 0.1));

  fb_speed = clamp(3 + score * 0.05, 3, 7.2);

  const spawnEvery = computeSpawnEvery();
  if (fb_frame % spawnEvery === 0) spawnPipe();

  const scroll = currentScrollSpeed();

  for (let i = powerups.length - 1; i >= 0; i--) {
    const pu = powerups[i];
    pu.x -= scroll;

    if (circleHit(fb_bird.x, fb_bird.y, 12, pu.x, pu.y, pu.r)) {
      playSound("power");
      if (pu.type === "shield") shieldActive = true;
      if (pu.type === "slow") slowTimeFrames = SLOW_TIME_FRAMES;
      powerups.splice(i, 1);
      continue;
    }

    if (pu.x < -50) powerups.splice(i, 1);
  }

  for (let i = 0; i < fb_pipes.length; i++) {
    const p = fb_pipes[i];
    p.x -= scroll;

    if (p.isMoving) {
      const oscMult = slowTimeFrames > 0 ? 0.7 : 1;
      p.oscT += p.oscSpeed * oscMult;

      const minGapY = TOP_MARGIN;
      const maxGapY = canvas.height - BOTTOM_MARGIN - p.gapH;

      const newGapY = p.oscBase + Math.sin(p.oscT) * p.oscAmp;
      p.gapY = clamp(newGapY, minGapY, maxGapY);
    }

    if (!p.passed && p.x + FB_PIPE_W < fb_bird.x) {
      score++;
      p.passed = true;
      updateUI();
      checkAchievements();
    }

    const birdPadX = 10;
    const birdPadY = 10;

    if (fb_bird.x + birdPadX > p.x && fb_bird.x - birdPadX < p.x + FB_PIPE_W) {
      const hit = (fb_bird.y - birdPadY < p.gapY) || (fb_bird.y + birdPadY > p.gapY + p.gapH);

      if (hit) {
        if (invulnFrames > 0) continue;

        if (shieldActive) {
          shieldActive = false;
          invulnFrames = INVULN_FRAMES;
          playSound("shieldpop");

          const safeY = p.gapY + p.gapH / 2;
          fb_bird.y = clamp(safeY, fb_bird.radius, canvas.height - fb_bird.radius);
          fb_bird.velocity = 0;

          screenShake();
          continue;
        }

        handleDeath();
        return;
      }
    }
  }

  if (fb_pipes.length > 0 && fb_pipes[0].x < -120) fb_pipes.shift();

  if (fb_bird.y + fb_bird.radius > canvas.height || fb_bird.y - fb_bird.radius < 0) {
    if (invulnFrames === 0 && shieldActive) {
      shieldActive = false;
      invulnFrames = INVULN_FRAMES;
      playSound("shieldpop");
      fb_bird.y = clamp(fb_bird.y, fb_bird.radius + 5, canvas.height - fb_bird.radius - 5);
      fb_bird.velocity = 0;
      screenShake();
    } else if (invulnFrames === 0) {
      handleDeath();
    }
  }
}

// -------------------- Drawing --------------------
function drawBackground() {
  const caveGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  caveGrad.addColorStop(0, "#1a0505");
  caveGrad.addColorStop(1, "#050000");
  ctx.fillStyle = caveGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const t = fb_frame;

  ctx.fillStyle = "#150505";
  for (let i = 0; i < 15; i++) {
    const h = 100 + Math.sin(i) * 50;
    const x = i * 50 - ((t * 0.5) % 50);
    ctx.beginPath();
    ctx.moveTo(x, canvas.height);
    ctx.lineTo(x + 25, canvas.height - h);
    ctx.lineTo(x + 50, canvas.height);
    ctx.fill();
  }

  ctx.fillStyle = "#2a0a0a";
  for (let i = 0; i < 12; i++) {
    const x = i * 60 - ((t * 1) % 60);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 30, 60 + (i % 3) * 20);
    ctx.lineTo(x + 60, 0);
    ctx.fill();
  }

  if (slowTimeFrames > 0) {
    ctx.fillStyle = "rgba(255, 209, 102, 0.05)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function drawPipes() {
  fb_pipes.forEach((p) => {
    const isMoving = p.isMoving;

    ctx.fillStyle = isMoving ? "#2b0033" : "#4a0000";
    ctx.strokeStyle = isMoving ? "#b100ff" : "#880000";
    ctx.lineWidth = 2;

    ctx.fillRect(p.x, 0, FB_PIPE_W, p.gapY);
    ctx.strokeRect(p.x, 0, FB_PIPE_W, p.gapY);

    ctx.fillStyle = isMoving ? "#41004f" : "#6a0000";
    ctx.fillRect(p.x - 5, p.gapY - 20, FB_PIPE_W + 10, 20);

    ctx.fillStyle = isMoving ? "#2b0033" : "#4a0000";
    const botY = p.gapY + p.gapH;
    const botH = canvas.height - botY;

    ctx.fillRect(p.x, botY, FB_PIPE_W, botH);
    ctx.strokeRect(p.x, botY, FB_PIPE_W, botH);

    ctx.fillStyle = isMoving ? "#41004f" : "#6a0000";
    ctx.fillRect(p.x - 5, botY, FB_PIPE_W + 10, 20);

    ctx.strokeStyle = "rgba(0,0,0,0.3)";
    ctx.beginPath();
    ctx.moveTo(p.x + 10, 0); ctx.lineTo(p.x + 10, p.gapY);
    ctx.moveTo(p.x + 30, 0); ctx.lineTo(p.x + 30, p.gapY);
    ctx.moveTo(p.x + 50, 0); ctx.lineTo(p.x + 50, p.gapY);

    ctx.moveTo(p.x + 10, botY); ctx.lineTo(p.x + 10, canvas.height);
    ctx.moveTo(p.x + 30, botY); ctx.lineTo(p.x + 30, canvas.height);
    ctx.moveTo(p.x + 50, botY); ctx.lineTo(p.x + 50, canvas.height);
    ctx.stroke();
  });
}

function drawPowerups() {
  powerups.forEach((pu) => {
    ctx.save();
    ctx.translate(pu.x, pu.y);

    if (pu.type === "shield") {
      ctx.strokeStyle = "#66ccff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, pu.r, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = "#bdf0ff";
      ctx.beginPath();
      ctx.moveTo(-4, 0);
      ctx.lineTo(4, 0);
      ctx.moveTo(0, -4);
      ctx.lineTo(0, 4);
      ctx.stroke();
    } else {
      ctx.strokeStyle = "#ffd166";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-6, -6);
      ctx.lineTo(6, -6);
      ctx.lineTo(-3, 0);
      ctx.lineTo(6, 6);
      ctx.lineTo(-6, 6);
      ctx.lineTo(3, 0);
      ctx.closePath();
      ctx.stroke();
    }

    ctx.restore();
  });
}

function drawBat() {
  ctx.save();
  ctx.translate(fb_bird.x, fb_bird.y);
  ctx.rotate(fb_bird.rotation);

  const flicker = invulnFrames > 0 && (Math.floor(invulnFrames / 4) % 2 === 0);
  ctx.globalAlpha = flicker ? 0.45 : 1;

  ctx.fillStyle = "#666666";
  ctx.beginPath();
  ctx.arc(0, 0, 15, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#444444";
  ctx.beginPath();

  if (fb_bird.velocity < 0) {
    ctx.moveTo(-10, 0); ctx.lineTo(-35, -15); ctx.lineTo(-10, 5);
    ctx.moveTo(10, 0);  ctx.lineTo(35, -15);  ctx.lineTo(10, 5);
  } else {
    ctx.moveTo(-10, 0); ctx.lineTo(-35, 10); ctx.lineTo(-10, -5);
    ctx.moveTo(10, 0);  ctx.lineTo(35, 10);  ctx.lineTo(10, -5);
  }

  ctx.fill();

  ctx.fillStyle = "red";
  ctx.fillRect(-5, -2, 2, 2);
  ctx.fillRect(3, -2, 2, 2);

  ctx.restore();
}

function drawStatusHUD() {
  if (mode !== "playing" && mode !== "gameover") return;

  ctx.save();
  ctx.font = "16px VT323";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  let x = 10;
  let y = 10;

  if (shieldActive) {
    ctx.fillStyle = "rgba(102, 204, 255, 0.9)";
    ctx.fillText("SHIELD", x, y);
    y += 18;
  }
  if (slowTimeFrames > 0) {
    ctx.fillStyle = "rgba(255, 209, 102, 0.9)";
    const sec = Math.ceil(slowTimeFrames / 60);
    ctx.fillText(`SLOW (${sec}s)`, x, y);
    y += 18;
  }
  if (invulnFrames > 0) {
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillText("INVULN", x, y);
  }

  ctx.restore();
}

function drawHintIfNeeded() {
  if (mode !== "playing") return;
  if (score >= 1 || isGameOver) return;

  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "20px VT323";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("TAP OR SPACE TO FLAP", canvas.width / 2, canvas.height / 2 + 50);
}

function draw() {
  drawBackground();

  // IMPORTANT FIX:
  // Render the frozen gameplay scene even on gameover (no updates, just draw).
  if (mode === "playing" || mode === "gameover") {
    drawPipes();
    drawPowerups();
    drawBat();
    drawStatusHUD();
    if (mode === "playing") drawHintIfNeeded();
    return;
  }

  // menu / achievements idle animation
  fb_frame++;
  const bob = Math.sin(fb_frame * 0.05) * 6;
  fb_bird.x = 120;
  fb_bird.y = 320 + bob;
  fb_bird.rotation = Math.sin(fb_frame * 0.03) * 0.2;
  fb_bird.velocity = 0;

  drawBat();
}

// -------------------- Loop --------------------
function gameLoop() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (mode === "playing" && !isGameOver) updateGame();
  draw();

  animationId = requestAnimationFrame(gameLoop);
}

// -------------------- Controls --------------------
function startGame() {
  initRun();
  setMode("playing");
}

function openMenu() {
  setMode("menu");
  updateUI();
}

function openAchievements() {
  renderAchievementsList();
  setMode("achievements");
}

function restartRun() {
  startGame();
}

window.addEventListener("keydown", (e) => {
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) e.preventDefault();

  if (e.key.toLowerCase() === "m") {
    openMenu();
    return;
  }

  if (mode === "menu" && (e.key === " " || e.key === "Enter")) {
    startGame();
    return;
  }

  if (mode === "playing" && (e.key === " " || e.key === "ArrowUp")) {
    flap();
    return;
  }

  if (mode === "gameover" && (e.key === " " || e.key === "Enter")) {
    restartRun();
  }
});

canvas.addEventListener("pointerdown", (e) => {
  e.preventDefault();

  if (mode === "menu") {
    startGame();
    return;
  }

  if (mode === "achievements") return;

  if (mode === "gameover") {
    restartRun();
    return;
  }

  if (mode === "playing") flap();
}, { passive: false });

// Buttons
btnPlay.addEventListener("click", startGame);
btnAchievements.addEventListener("click", openAchievements);

btnSound.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  saveSoundSetting();
  updateSoundButton();
  showToast(`Sound ${soundEnabled ? "On" : "Off"}`);
  // tiny confirmation beep only when turning on
  if (soundEnabled) playSound("power");
});

btnAchBack.addEventListener("click", openMenu);

btnAchReset.addEventListener("click", () => {
  unlocked = {};
  saveAchievements();
  renderAchievementsList();
  showToast("Achievements reset.");
});

restartBtn.addEventListener("click", () => {
  if (mode === "playing") startGame();
});

playAgainBtn.addEventListener("click", restartRun);
btnMenu.addEventListener("click", openMenu);

// -------------------- Boot --------------------
updateUI();
renderAchievementsList();
setMode("menu");
gameLoop();
