// Flappy Bat - Bone Pillars + Custom Achievements + Sound Toggle + Music Toggle + Power-ups + Moving Pipes + Patterned Variety

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
const btnMusic = document.getElementById("btn-music");

const achievementsEl = document.getElementById("achievements");
const achSubEl = document.getElementById("ach-sub");
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
const ACH_KEY = "flappybat_achievements_v2";
const SOUND_KEY = "flappybat_sound_enabled_v1";
const MUSIC_KEY = "flappybat_music_enabled_v1";

// -------------------- Achievements --------------------
const ACHIEVEMENTS = [
  {
    id: "fresh_meat",
    name: "Fresh Meat",
    desc: "Crash for the first time."
  },
  {
    id: "night_flight",
    name: "Night Flight",
    desc: "Reach 10 points in one run."
  },
  {
    id: "crypt_runner",
    name: "Crypt Runner",
    desc: "Reach 20 points in one run."
  },
  {
    id: "bone_ward",
    name: "Bone Ward",
    desc: "Collect a shield relic."
  },
  {
    id: "time_rot",
    name: "Time Rot",
    desc: "Collect a slow-time relic."
  },
  {
    id: "grave_dodger",
    name: "Grave Dodger",
    desc: "Pass 3 moving bone pillars in one run."
  },
  {
    id: "second_chance",
    name: "Second Chance",
    desc: "Let a shield save you from a crash."
  },
  {
    id: "hexproof",
    name: "Hexproof",
    desc: "Collect both relic types in one run."
  },
  {
    id: "pure_skill",
    name: "Pure Skill",
    desc: "Reach 12 points without collecting relics."
  }
];

const ACH_BY_ID = {};
for (const ach of ACHIEVEMENTS) {
  ACH_BY_ID[ach.id] = ach;
}

let highScore = Number(localStorage.getItem(HS_KEY) || 0);
let unlocked = loadAchievements();

// Sound / music enabled
let soundEnabled = loadSoundSetting();
let musicEnabled = loadMusicSetting();

// -------------------- Game mode --------------------
let mode = "menu"; // menu | playing | gameover | achievements

// -------------------- State --------------------
let score = 0;
let isGameOver = false;
let animationId = null;
let flapFrames = 0;

// -------------------- Haunted milestone events --------------------
let hauntedEvent = null;
let hauntedEventFrames = 0;
let hauntedEventTitle = "";
let hauntedTriggered = {};
let hauntedBats = [];

// Fixed-step simulation so gameplay stays consistent across refresh rates
const SIM_FPS = 60;
const FIXED_STEP_MS = 1000 / SIM_FPS;
const MAX_FRAME_MS = 100;
let lastTime = 0;
let accumulator = 0;

// -------------------- Run stats for achievements --------------------
let runMovingPassed = 0;
let runShieldCollected = false;
let runSlowCollected = false;
let runShieldSaved = false;
let runCollectedPowerup = false;

// -------------------- Audio --------------------
let audioCtx = null;
let masterGain = null;

const bgMusic = new Audio("assets/audio/flappybatsong.mp3");
bgMusic.loop = true;
bgMusic.volume = 0.35;
bgMusic.preload = "auto";

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

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.frequency.value = freq;
  osc.type = "square";
  gain.gain.value = 0.0001;

  osc.connect(gain);
  gain.connect(masterGain);

  const t = audioCtx.currentTime;
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.12, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

  osc.start(t);
  osc.stop(t + duration + 0.02);
}

function playSound(name) {
  if (!soundEnabled) return;

  if (name === "flap") tone(520, 0.06);
  if (name === "death") tone(120, 0.18);
  if (name === "power") tone(780, 0.07);
  if (name === "shieldpop") tone(260, 0.12);
  if (name === "ach") tone(900, 0.09);
}

function loadMusicSetting() {
  const raw = localStorage.getItem(MUSIC_KEY);
  if (raw === null) return true;
  return raw === "1";
}

function saveMusicSetting() {
  localStorage.setItem(MUSIC_KEY, musicEnabled ? "1" : "0");
}

function playMusic() {
  if (!musicEnabled) return;

  const playPromise = bgMusic.play();
  if (playPromise && typeof playPromise.catch === "function") {
    playPromise.catch(() => {});
  }
}

function stopMusic() {
  bgMusic.pause();
}

function updateMusicButton() {
  if (!btnMusic) return;
  btnMusic.textContent = `Music: ${musicEnabled ? "On" : "Off"}`;
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

function makeHauntedBats(count = 18) {
  hauntedBats = [];

  for (let i = 0; i < count; i++) {
    hauntedBats.push({
      x: canvas.width + rand(0, canvas.width * 0.9),
      y: rand(60, canvas.height - 80),
      speed: rand(2.2, 5.2),
      size: rand(0.55, 1.25),
      flapOffset: rand(0, Math.PI * 2)
    });
  }
}

function triggerHauntedEvent(type, title, durationFrames = 300) {
  hauntedEvent = type;
  hauntedEventTitle = title;
  hauntedEventFrames = durationFrames;

  if (type === "swarm" || type === "hunger") {
    makeHauntedBats(type === "hunger" ? 32 : 20);
  }

  if (soundEnabled) {
    playSound("ach");
  }
}

function triggerHauntedEventForScore(currentScore) {
  const milestones = {
    10: { type: "eyes", title: "THE CAVE WAKES", frames: 300 },
    25: { type: "swarm", title: "THE SWARM STIRS", frames: 360 },
    50: { type: "rattle", title: "THE BONES RATTLE", frames: 360 },
    100: { type: "blackout", title: "THE LIGHT DIES", frames: 300 },
    150: { type: "whispers", title: "THE FOG WHISPERS", frames: 360 },
    200: { type: "hunger", title: "THE CAVE HUNGERS", frames: 480 }
  };

  let event = milestones[currentScore];

  if (!event && currentScore > 200 && currentScore % 50 === 0) {
    const loopEvents = [
      { type: "eyes", title: "THE CAVE WATCHES", frames: 300 },
      { type: "swarm", title: "WINGS IN THE DARK", frames: 360 },
      { type: "rattle", title: "BONE SONG", frames: 360 },
      { type: "blackout", title: "NO LIGHT LEFT", frames: 300 },
      { type: "whispers", title: "DO NOT LOOK BACK", frames: 360 },
      { type: "hunger", title: "THE CAVE HUNGERS", frames: 480 }
    ];

    event = loopEvents[Math.floor((currentScore / 50) % loopEvents.length)];
  }

  if (!event) return;
  if (hauntedTriggered[String(currentScore)]) return;

  hauntedTriggered[String(currentScore)] = true;
  triggerHauntedEvent(event.type, event.title, event.frames);
}

function circleHit(ax, ay, ar, bx, by, br) {
  const dx = ax - bx;
  const dy = ay - by;
  const rr = ar + br;
  return dx * dx + dy * dy <= rr * rr;
}

function circleRectHit(cx, cy, cr, rx, ry, rw, rh) {
  const closestX = clamp(cx, rx, rx + rw);
  const closestY = clamp(cy, ry, ry + rh);
  const dx = cx - closestX;
  const dy = cy - closestY;
  return dx * dx + dy * dy <= cr * cr;
}

function pipeHitsBird(pipe) {
  const lipInset = 6;
  const hitRadius = fb_bird.radius - 2;

  const topRectX = pipe.x;
  const topRectY = 0;
  const topRectW = FB_PIPE_W;
  const topRectH = Math.max(0, pipe.gapY - lipInset);

  const bottomRectX = pipe.x;
  const bottomRectY = pipe.gapY + pipe.gapH + lipInset;
  const bottomRectW = FB_PIPE_W;
  const bottomRectH = Math.max(0, canvas.height - bottomRectY);

  return (
    circleRectHit(fb_bird.x, fb_bird.y, hitRadius, topRectX, topRectY, topRectW, topRectH) ||
    circleRectHit(fb_bird.x, fb_bird.y, hitRadius, bottomRectX, bottomRectY, bottomRectW, bottomRectH)
  );
}

function screenShake() {
  canvas.style.transform = `translate(${Math.random() * 10 - 5}px, ${Math.random() * 10 - 5}px)`;
  setTimeout(() => {
    canvas.style.transform = "none";
  }, 180);
}

function resetLoopTiming() {
  accumulator = 0;
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

function isUnlocked(id) {
  return !!unlocked[String(id)];
}

function unlockAchievement(id) {
  if (isUnlocked(id)) return;

  const ach = ACH_BY_ID[id];
  if (!ach) return;

  unlocked[String(id)] = true;
  saveAchievements();
  renderAchievementsList();
  showToast(`Achievement Unlocked: ${ach.name}`);
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
  toastTimer = setTimeout(() => {
    toastEl.classList.add("hidden");
  }, 1600);
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

  hudEl.classList.toggle("hidden", mode !== "playing");

  if (mode !== "playing") resetLoopTiming();
}

function renderAchievementsList() {
  achListEl.innerHTML = "";

  for (const ach of ACHIEVEMENTS) {
    const row = document.createElement("div");
    row.className = "ach-item";

    const left = document.createElement("div");
    left.className = "badge";
    left.style.alignItems = "flex-start";

    const dot = document.createElement("span");
    dot.className = "dot" + (isUnlocked(ach.id) ? " on" : "");

    const textWrap = document.createElement("div");

    const label = document.createElement("div");
    label.textContent = ach.name;

    const desc = document.createElement("div");
    desc.textContent = ach.desc;
    desc.style.fontSize = "0.72em";
    desc.style.opacity = "0.72";
    desc.style.lineHeight = "1.1";
    desc.style.marginTop = "2px";

    textWrap.appendChild(label);
    textWrap.appendChild(desc);

    left.appendChild(dot);
    left.appendChild(textWrap);

    const right = document.createElement("div");
    right.style.opacity = isUnlocked(ach.id) ? "1" : "0.6";
    right.textContent = isUnlocked(ach.id) ? "Unlocked" : "Locked";

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
  updateMusicButton();

  if (achSubEl) {
    achSubEl.textContent = "Score goals, survival feats, and cursed tricks.";
  }
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
  { name: "standard", lenRange: [5, 8], steps: [0, 0, 0, 0, 0, 0, 0, 0], gapMul: 1.0 },
  { name: "stairUp", lenRange: [6, 9], steps: [0, -25, -50, -75, -90, -105, -120, -135, -150], gapMul: 1.0 },
  { name: "stairDown", lenRange: [6, 9], steps: [0, 25, 50, 75, 90, 105, 120, 135, 150], gapMul: 1.0 },
  { name: "zigzag", lenRange: [6, 10], steps: [0, 55, -55, 55, -55, 55, -55, 55, -55, 55], gapMul: 1.0 },
  { name: "gentleWave", lenRange: [7, 11], steps: [0, 25, 45, 60, 45, 25, 0, -25, -45, -60, -45, -25], gapMul: 1.0 },
  { name: "tightSection", lenRange: [5, 8], steps: [0, 10, -10, 15, -15, 10, -10, 0], gapMul: 0.86 },
  { name: "breather", lenRange: [4, 6], steps: [0, 0, 0, 0, 0, 0], gapMul: 1.12 }
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
    for (let i = 0; i < w; i++) {
      pool.push(p);
    }
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
  flapFrames = 0;
  hauntedEvent = null;
  hauntedEventFrames = 0;
  hauntedEventTitle = "";
  hauntedTriggered = {};
  hauntedBats = [];

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

  runMovingPassed = 0;
  runShieldCollected = false;
  runSlowCollected = false;
  runShieldSaved = false;
  runCollectedPowerup = false;

  resetLoopTiming();
  updateUI();
}

function checkAchievements() {
  if (score >= 10) unlockAchievement("night_flight");
  if (score >= 20) unlockAchievement("crypt_runner");
  if (runShieldCollected) unlockAchievement("bone_ward");
  if (runSlowCollected) unlockAchievement("time_rot");
  if (runMovingPassed >= 3) unlockAchievement("grave_dodger");
  if (runShieldSaved) unlockAchievement("second_chance");
  if (runShieldCollected && runSlowCollected) unlockAchievement("hexproof");
  if (score >= 12 && !runCollectedPowerup) unlockAchievement("pure_skill");
}

function handleDeath() {
  isGameOver = true;
  playSound("death");
  screenShake();
  unlockAchievement("fresh_meat");

  if (score > highScore) {
    highScore = score;
    localStorage.setItem(HS_KEY, String(highScore));
    overTitle.textContent = "NEW RECORD!";
  } else {
    overTitle.textContent = "Game Over";
  }

  finalScoreEl.textContent = String(score);
  updateUI();
  setMode("gameover");
}

function flap() {
  if (mode !== "playing") return;
  if (isGameOver) return;

  playSound("flap");
  fb_bird.velocity = FB_JUMP;
  flapFrames = 10;
}

function updateGame() {
  fb_frame++;

  if (slowTimeFrames > 0) slowTimeFrames--;
  if (invulnFrames > 0) invulnFrames--;
  if (flapFrames > 0) flapFrames--;

  if (hauntedEventFrames > 0) {
    hauntedEventFrames--;
    if (hauntedEventFrames <= 0) {
      hauntedEvent = null;
      hauntedEventTitle = "";
      hauntedBats = [];
    }
  }

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

    if (circleHit(fb_bird.x, fb_bird.y, fb_bird.radius - 3, pu.x, pu.y, pu.r)) {
      playSound("power");
      runCollectedPowerup = true;

      if (pu.type === "shield") {
        shieldActive = true;
        runShieldCollected = true;
      }

      if (pu.type === "slow") {
        slowTimeFrames = SLOW_TIME_FRAMES;
        runSlowCollected = true;
      }

      powerups.splice(i, 1);
      checkAchievements();
      continue;
    }

    if (pu.x < -50) {
      powerups.splice(i, 1);
    }
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

      if (p.isMoving) {
        runMovingPassed++;
      }

      updateUI();
      checkAchievements();
      triggerHauntedEventForScore(score);
    }

    if (pipeHitsBird(p)) {
      if (invulnFrames > 0) continue;

      if (shieldActive) {
        shieldActive = false;
        runShieldSaved = true;
        invulnFrames = INVULN_FRAMES;
        playSound("shieldpop");

        const safeY = p.gapY + p.gapH / 2;
        fb_bird.y = clamp(safeY, fb_bird.radius, canvas.height - fb_bird.radius);
        fb_bird.velocity = 0;

        checkAchievements();
        screenShake();
        continue;
      }

      handleDeath();
      return;
    }
  }

  if (fb_pipes.length > 0 && fb_pipes[0].x < -120) {
    fb_pipes.shift();
  }

  if (fb_bird.y + fb_bird.radius > canvas.height || fb_bird.y - fb_bird.radius < 0) {
    if (invulnFrames === 0 && shieldActive) {
      shieldActive = false;
      runShieldSaved = true;
      invulnFrames = INVULN_FRAMES;
      playSound("shieldpop");

      fb_bird.y = clamp(
        fb_bird.y,
        fb_bird.radius + 5,
        canvas.height - fb_bird.radius - 5
      );
      fb_bird.velocity = 0;

      checkAchievements();
      screenShake();
    } else if (invulnFrames === 0) {
      handleDeath();
    }
  }
}

// -------------------- Drawing --------------------
function drawFarCaveLayer(t) {
  ctx.fillStyle = "#0d0204";

  for (let i = 0; i < 12; i++) {
    const x = i * 75 - ((t * 0.22) % 75);
    const peak = 110 + Math.sin(i * 1.35 + t * 0.005) * 22;

    ctx.beginPath();
    ctx.moveTo(x, canvas.height);
    ctx.lineTo(x + 20, canvas.height - peak * 0.35);
    ctx.lineTo(x + 42, canvas.height - peak);
    ctx.lineTo(x + 75, canvas.height);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = "#120305";

  for (let i = 0; i < 10; i++) {
    const x = i * 90 - ((t * 0.16) % 90);
    const drop = 80 + Math.cos(i * 1.1 + t * 0.004) * 18;

    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 24, drop);
    ctx.lineTo(x + 52, 0);
    ctx.closePath();
    ctx.fill();
  }
}

function drawFogLayer(t) {
  ctx.save();

  const fogBands = [
    { y: 150, h: 70, speed: 0.18, alpha: 0.06, size: 180, offset: 0 },
    { y: 285, h: 95, speed: 0.12, alpha: 0.05, size: 220, offset: 130 },
    { y: 470, h: 80, speed: 0.2, alpha: 0.055, size: 200, offset: 260 }
  ];

  for (const band of fogBands) {
    for (let i = -1; i < 5; i++) {
      const cx = i * band.size + ((t * band.speed + band.offset) % band.size) - band.size * 0.5;
      const cy = band.y + Math.sin((t * 0.0025) + i * 0.9 + band.offset * 0.01) * 12;

      const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, band.size * 0.75);
      grad.addColorStop(0, `rgba(210, 215, 225, ${band.alpha})`);
      grad.addColorStop(0.55, `rgba(170, 175, 190, ${band.alpha * 0.55})`);
      grad.addColorStop(1, "rgba(120, 120, 140, 0)");

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(cx, cy, band.size * 0.8, band.h, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

function drawVignette() {
  const radial = ctx.createRadialGradient(
    canvas.width / 2,
    canvas.height / 2,
    canvas.width * 0.14,
    canvas.width / 2,
    canvas.height / 2,
    canvas.width * 0.68
  );
  radial.addColorStop(0, "rgba(0, 0, 0, 0)");
  radial.addColorStop(0.6, "rgba(0, 0, 0, 0.12)");
  radial.addColorStop(0.82, "rgba(0, 0, 0, 0.28)");
  radial.addColorStop(1, "rgba(0, 0, 0, 0.5)");

  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const topFade = ctx.createLinearGradient(0, 0, 0, 110);
  topFade.addColorStop(0, "rgba(0, 0, 0, 0.28)");
  topFade.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = topFade;
  ctx.fillRect(0, 0, canvas.width, 110);

  const bottomFade = ctx.createLinearGradient(0, canvas.height - 130, 0, canvas.height);
  bottomFade.addColorStop(0, "rgba(0, 0, 0, 0)");
  bottomFade.addColorStop(1, "rgba(0, 0, 0, 0.34)");
  ctx.fillStyle = bottomFade;
  ctx.fillRect(0, canvas.height - 130, canvas.width, 130);
}

function drawBackground() {
  const caveGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  caveGrad.addColorStop(0, "#190507");
  caveGrad.addColorStop(0.55, "#0c0305");
  caveGrad.addColorStop(1, "#030001");
  ctx.fillStyle = caveGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const t = fb_frame;

  drawFarCaveLayer(t);
  drawFogLayer(t * 0.9);

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

  drawVignette();

  if (slowTimeFrames > 0) {
    ctx.fillStyle = "rgba(255, 209, 102, 0.05)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function getBonePalette(isMoving) {
  if (isMoving) {
    return {
      fill: "#d9cbf3",
      shade: "#af97dd",
      line: "#624492",
      accent: "rgba(182, 129, 255, 0.16)",
      eye: "#6d2bba"
    };
  }

  return {
    fill: "#d7cfbb",
    shade: "#b8ad94",
    line: "#6c6253",
    accent: "rgba(255,255,255,0.08)",
    eye: "#4b4133"
  };
}

function drawBoneKnob(cx, cy, r, colors) {
  ctx.fillStyle = colors.fill;
  ctx.strokeStyle = colors.line;
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = colors.shade;
  ctx.beginPath();
  ctx.arc(cx - r * 0.2, cy + r * 0.15, r * 0.42, 0, Math.PI * 2);
  ctx.fill();
}

function drawSkull(cx, cy, size, colors, upsideDown) {
  ctx.save();
  ctx.translate(cx, cy);

  if (upsideDown) {
    ctx.rotate(Math.PI);
  }

  ctx.fillStyle = colors.fill;
  ctx.strokeStyle = colors.line;
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.ellipse(0, -1, size * 0.52, size * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillRect(-size * 0.26, size * 0.12, size * 0.52, size * 0.24);
  ctx.strokeRect(-size * 0.26, size * 0.12, size * 0.52, size * 0.24);

  ctx.fillStyle = colors.eye;
  ctx.beginPath();
  ctx.arc(-size * 0.18, -size * 0.02, size * 0.1, 0, Math.PI * 2);
  ctx.arc(size * 0.18, -size * 0.02, size * 0.1, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(0, size * 0.02);
  ctx.lineTo(-size * 0.06, size * 0.14);
  ctx.lineTo(size * 0.06, size * 0.14);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = colors.line;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(i * size * 0.11, size * 0.12);
    ctx.lineTo(i * size * 0.11, size * 0.34);
    ctx.stroke();
  }

  ctx.restore();
}

function drawBonePillar(x, y, w, h, isMoving, isTop) {
  if (h <= 0) return;

  const colors = getBonePalette(isMoving);
  const shaftInset = 12;
  const shaftX = x + shaftInset;
  const shaftW = w - shaftInset * 2;
  const centerX = x + w / 2;

  ctx.save();

  if (isMoving) {
    ctx.shadowColor = "rgba(177, 0, 255, 0.18)";
    ctx.shadowBlur = 8;
  }

  ctx.fillStyle = colors.fill;
  ctx.strokeStyle = colors.line;
  ctx.lineWidth = 2;
  ctx.fillRect(shaftX, y, shaftW, h);
  ctx.strokeRect(shaftX, y, shaftW, h);

  ctx.fillStyle = colors.accent;
  ctx.fillRect(shaftX + 2, y + 2, Math.max(2, shaftW * 0.28), h - 4);

  ctx.strokeStyle = "rgba(0,0,0,0.12)";
  ctx.beginPath();
  ctx.moveTo(centerX, y + 4);
  ctx.lineTo(centerX, y + h - 4);
  ctx.stroke();

  for (let segY = y + 18; segY <= y + h - 18; segY += 30) {
    ctx.fillStyle = colors.fill;
    ctx.strokeStyle = colors.line;

    ctx.beginPath();
    ctx.ellipse(centerX, segY, shaftW * 0.9, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = colors.shade;
    ctx.beginPath();
    ctx.ellipse(centerX, segY + 2, shaftW * 0.42, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const jointR = Math.max(8, w * 0.18);

  if (isTop) {
    drawBoneKnob(x + 11, y + h - 12, jointR, colors);
    drawBoneKnob(x + w - 11, y + h - 12, jointR, colors);

    if (h > 48) {
      drawSkull(centerX, y + h - 18, 24, colors, false);
    }
  } else {
    drawBoneKnob(x + 11, y + 12, jointR, colors);
    drawBoneKnob(x + w - 11, y + 12, jointR, colors);

    if (h > 48) {
      drawSkull(centerX, y + 18, 24, colors, true);
    }
  }

  ctx.restore();
}

function drawPipes() {
  const rattleActive = hauntedEvent === "rattle" || hauntedEvent === "hunger";

  fb_pipes.forEach((p, index) => {
    const bottomY = p.gapY + p.gapH;
    const bottomH = canvas.height - bottomY;
    const shake = rattleActive ? Math.sin(fb_frame * 0.7 + index * 1.9) * 2.5 : 0;

    // Visual shake only. Collision still uses the real pipe position, so it stays fair.
    drawBonePillar(p.x + shake, 0, FB_PIPE_W, p.gapY, p.isMoving, true);
    drawBonePillar(p.x - shake, bottomY, FB_PIPE_W, bottomH, p.isMoving, false);
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

function drawBatWingSide(openAmount, colors, isBackWing = false) {
  ctx.save();

  ctx.fillStyle = isBackWing ? colors.backWing : colors.wing;
  ctx.strokeStyle = colors.outline;
  ctx.lineWidth = isBackWing ? 1.5 : 2;
  ctx.globalAlpha = isBackWing ? 0.55 : 1;

  const topY = -8 - openAmount;
  const midY = 2;
  const lowY = 15 + openAmount * 0.45;

  ctx.beginPath();
  ctx.moveTo(-4, -2);
  ctx.quadraticCurveTo(-20, topY, -34, topY - 4);
  ctx.quadraticCurveTo(-28, midY, -39, lowY);
  ctx.quadraticCurveTo(-20, 12, -2, 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = colors.wingBone;
  ctx.lineWidth = 1.25;

  ctx.beginPath();
  ctx.moveTo(-3, -1);
  ctx.lineTo(-33, topY - 3);

  ctx.moveTo(-2, 1);
  ctx.lineTo(-28, midY + 2);

  ctx.moveTo(-1, 4);
  ctx.lineTo(-36, lowY - 1);
  ctx.stroke();

  ctx.restore();
}

function drawBat() {
  ctx.save();
  ctx.translate(fb_bird.x, fb_bird.y);
  ctx.rotate(fb_bird.rotation);

  const flicker = invulnFrames > 0 && Math.floor(invulnFrames / 4) % 2 === 0;
  ctx.globalAlpha = flicker ? 0.45 : 1;

  const colors = {
    body: "#2a2a30",
    belly: "#4b4b55",
    wing: "#202027",
    backWing: "#2f2f38",
    wingBone: "#666674",
    outline: "#0e0e12",
    earInner: "#7d4450",
    eye: "#ff3344",
    fang: "#f2efe8"
  };

  const jumpFlap = flapFrames > 0 ? flapFrames / 10 : 0;
  const velocityFlap = clamp(-fb_bird.velocity * 1.4, -2, 6);
  const idleFlap = Math.sin(fb_frame * 0.25) * 1.5;
  const wingOpen = clamp(8 + jumpFlap * 14 + velocityFlap + idleFlap, 3, 22);

  if (shieldActive || invulnFrames > 0) {
    ctx.shadowColor = shieldActive
      ? "rgba(102, 204, 255, 0.45)"
      : "rgba(255,255,255,0.25)";
    ctx.shadowBlur = 12;
  } else {
    ctx.shadowColor = "rgba(255, 0, 50, 0.14)";
    ctx.shadowBlur = 5;
  }

  // Shadow under the bat
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.beginPath();
  ctx.ellipse(-2, 20, 18, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Back wing
  ctx.save();
  ctx.translate(4, -2);
  ctx.scale(0.9, 0.9);
  drawBatWingSide(wingOpen * 0.7, colors, true);
  ctx.restore();

  // Body
  ctx.fillStyle = colors.body;
  ctx.strokeStyle = colors.outline;
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.ellipse(2, 4, 16, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Belly
  ctx.fillStyle = colors.belly;
  ctx.beginPath();
  ctx.ellipse(0, 7, 8, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head, side view
  ctx.fillStyle = colors.body;
  ctx.beginPath();
  ctx.ellipse(13, -7, 11, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Snout
  ctx.beginPath();
  ctx.ellipse(20, -5, 6, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Ears
  ctx.beginPath();
  ctx.moveTo(9, -14);
  ctx.lineTo(7, -27);
  ctx.lineTo(15, -17);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(17, -14);
  ctx.lineTo(18, -28);
  ctx.lineTo(22, -16);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Inner ears
  ctx.fillStyle = colors.earInner;

  ctx.beginPath();
  ctx.moveTo(10, -16);
  ctx.lineTo(9, -23);
  ctx.lineTo(13, -17);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(17, -16);
  ctx.lineTo(18, -23);
  ctx.lineTo(20, -17);
  ctx.closePath();
  ctx.fill();

  // Eye
  ctx.save();
  ctx.shadowColor = "rgba(255, 51, 68, 0.95)";
  ctx.shadowBlur = 10;
  ctx.fillStyle = colors.eye;
  ctx.beginPath();
  ctx.arc(16, -9, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Mouth
  ctx.strokeStyle = colors.outline;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(18, -2);
  ctx.quadraticCurveTo(21, 0, 24, -2);
  ctx.stroke();

  // Fangs
  ctx.fillStyle = colors.fang;

  ctx.beginPath();
  ctx.moveTo(20, -1.5);
  ctx.lineTo(19, 2.2);
  ctx.lineTo(18.2, -1.2);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(23, -1.2);
  ctx.lineTo(22.1, 2.0);
  ctx.lineTo(21.5, -1.0);
  ctx.closePath();
  ctx.fill();

  // Front wing
  drawBatWingSide(wingOpen, colors, false);

  // Feet
  ctx.strokeStyle = colors.outline;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(-3, 15);
  ctx.lineTo(-5, 20);
  ctx.moveTo(2, 15);
  ctx.lineTo(1, 20);
  ctx.stroke();

  ctx.restore();
}

function drawHauntedEyes() {
  if (hauntedEvent !== "eyes" && hauntedEvent !== "hunger") return;

  ctx.save();
  const pulse = 0.45 + Math.sin(fb_frame * 0.08) * 0.25;
  const eyeSets = [
    { x: 85, y: 118, s: 1.0 },
    { x: 230, y: 78, s: 0.75 },
    { x: 410, y: 142, s: 1.15 },
    { x: 530, y: 245, s: 0.8 },
    { x: 140, y: 420, s: 0.9 },
    { x: 365, y: 510, s: 1.05 }
  ];

  for (const e of eyeSets) {
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.scale(e.s, e.s);
    ctx.shadowColor = `rgba(255, 35, 55, ${0.65 * pulse})`;
    ctx.shadowBlur = 12;
    ctx.fillStyle = `rgba(255, 35, 55, ${0.35 + pulse * 0.35})`;

    ctx.beginPath();
    ctx.ellipse(-7, 0, 4.5, 2.6, 0, 0, Math.PI * 2);
    ctx.ellipse(7, 0, 4.5, 2.6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(0,0,0,${0.65})`;
    ctx.beginPath();
    ctx.arc(-7, 0, 1.1, 0, Math.PI * 2);
    ctx.arc(7, 0, 1.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

function drawHauntedSwarm() {
  if (hauntedEvent !== "swarm" && hauntedEvent !== "hunger") return;

  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.65)";
  ctx.strokeStyle = "rgba(80,80,90,0.55)";
  ctx.lineWidth = 1;

  for (const b of hauntedBats) {
    b.x -= b.speed;
    b.y += Math.sin(fb_frame * 0.05 + b.flapOffset) * 0.35;

    if (b.x < -60) {
      b.x = canvas.width + rand(20, 220);
      b.y = rand(60, canvas.height - 80);
    }

    const wing = Math.sin(fb_frame * 0.25 + b.flapOffset) * 5;

    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.scale(b.size, b.size);

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-12, -5 - wing);
    ctx.lineTo(-20, 2);
    ctx.lineTo(-8, 4);
    ctx.lineTo(0, 0);
    ctx.lineTo(12, -5 - wing);
    ctx.lineTo(20, 2);
    ctx.lineTo(8, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  ctx.restore();
}

function drawWhispers() {
  if (hauntedEvent !== "whispers" && hauntedEvent !== "hunger") return;

  ctx.save();
  const phrases = [
    "do not look back",
    "the bones remember",
    "wake the cave",
    "little wings, little grave",
    "still hungry"
  ];

  ctx.font = "18px VT323";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (let i = 0; i < phrases.length; i++) {
    const x = 90 + i * 115 + Math.sin(fb_frame * 0.01 + i) * 18;
    const y = 115 + ((i * 83) % 390) + Math.cos(fb_frame * 0.018 + i) * 12;
    const alpha = 0.12 + Math.sin(fb_frame * 0.045 + i * 1.7) * 0.08;

    ctx.fillStyle = `rgba(230, 230, 235, ${Math.max(0.04, alpha)})`;
    ctx.fillText(phrases[i], x, y);
  }

  ctx.restore();
}

function drawBlackout() {
  if (hauntedEvent !== "blackout" && hauntedEvent !== "hunger") return;

  ctx.save();

  const radius = hauntedEvent === "hunger" ? 120 : 145;
  const glow = ctx.createRadialGradient(
    fb_bird.x,
    fb_bird.y,
    28,
    fb_bird.x,
    fb_bird.y,
    radius
  );

  glow.addColorStop(0, "rgba(0,0,0,0)");
  glow.addColorStop(0.46, "rgba(0,0,0,0.05)");
  glow.addColorStop(0.78, "rgba(0,0,0,0.72)");
  glow.addColorStop(1, "rgba(0,0,0,0.88)");

  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.restore();
}

function drawHauntedTitle() {
  if (!hauntedEvent || hauntedEventFrames <= 0 || !hauntedEventTitle) return;

  const fadeIn = clamp((hauntedEventFrames < 45 ? hauntedEventFrames : 45) / 45, 0, 1);
  const alpha = hauntedEventFrames > 90 ? fadeIn : clamp(hauntedEventFrames / 90, 0, 1);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "34px VT323";
  ctx.shadowColor = "rgba(255, 0, 45, 0.7)";
  ctx.shadowBlur = 14;
  ctx.fillStyle = "rgba(255, 230, 230, 0.92)";
  ctx.fillText(hauntedEventTitle, canvas.width / 2, 92);

  ctx.font = "18px VT323";
  ctx.shadowBlur = 8;
  ctx.fillStyle = "rgba(255, 80, 90, 0.75)";
  ctx.fillText("the cave changes", canvas.width / 2, 122);
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

  drawHauntedEyes();
  drawWhispers();
  drawHauntedSwarm();

  if (mode === "playing" || mode === "gameover") {
    drawPipes();
    drawPowerups();
    drawBat();
    drawBlackout();
    drawHauntedTitle();
    drawStatusHUD();

    if (mode === "playing") {
      drawHintIfNeeded();
    }

    return;
  }

  fb_frame++;
  const bob = Math.sin(fb_frame * 0.05) * 6;
  fb_bird.x = 120;
  fb_bird.y = 320 + bob;
  fb_bird.rotation = Math.sin(fb_frame * 0.03) * 0.2;
  fb_bird.velocity = 0;

  drawBat();
}

// -------------------- Loop --------------------
function gameLoop(timestamp = 0) {
  if (!lastTime) lastTime = timestamp;

  const frameMs = Math.min(timestamp - lastTime, MAX_FRAME_MS);
  lastTime = timestamp;

  if (mode === "playing" && !isGameOver) {
    accumulator += frameMs;

    while (accumulator >= FIXED_STEP_MS) {
      updateGame();
      accumulator -= FIXED_STEP_MS;

      if (isGameOver || mode !== "playing") {
        accumulator = 0;
        break;
      }
    }
  } else {
    accumulator = 0;
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  draw();

  animationId = requestAnimationFrame(gameLoop);
}

// -------------------- Controls --------------------
function startGame() {
  initRun();
  setMode("playing");
  playMusic();
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
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
    e.preventDefault();
  }

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

canvas.addEventListener(
  "pointerdown",
  (e) => {
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

    if (mode === "playing") {
      flap();
    }
  },
  { passive: false }
);

// Buttons
btnPlay.addEventListener("click", startGame);
btnAchievements.addEventListener("click", openAchievements);

btnSound.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  saveSoundSetting();
  updateSoundButton();
  showToast(`Sound ${soundEnabled ? "On" : "Off"}`);

  if (soundEnabled) {
    playSound("power");
  }
});

if (btnMusic) {
  btnMusic.addEventListener("click", () => {
    musicEnabled = !musicEnabled;
    saveMusicSetting();
    updateMusicButton();

    if (musicEnabled) {
      playMusic();
      showToast("Music On");
    } else {
      stopMusic();
      showToast("Music Off");
    }
  });
}

btnAchBack.addEventListener("click", openMenu);

btnAchReset.addEventListener("click", () => {
  unlocked = {};
  saveAchievements();
  renderAchievementsList();
  showToast("Achievements reset.");
});

restartBtn.addEventListener("click", () => {
  if (mode === "playing") {
    startGame();
  }
});

playAgainBtn.addEventListener("click", restartRun);
btnMenu.addEventListener("click", openMenu);

// -------------------- Boot --------------------
updateUI();
renderAchievementsList();
setMode("menu");
gameLoop();
