// Void Invaders
// Title screen + custom ship + rarer power-ups + tougher enemies + end-wave boss
// Personal high scores save locally per player device/browser

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('high-score');
const livesEl = document.getElementById('lives');
const restartBtn = document.getElementById('restart');
const menuBtn = document.getElementById('menu-button');

const overlay = document.getElementById('overlay');
const overTitle = document.getElementById('over-title');
const finalScoreEl = document.getElementById('final-score');
const finalBestScoreEl = document.getElementById('final-best-score');
const playAgainBtn = document.getElementById('play-again');
const backTitleBtn = document.getElementById('back-title');

const titleScreen = document.getElementById('title-screen');
const startGameBtn = document.getElementById('start-game');
const soundToggleBtn = document.getElementById('sound-toggle');
const controlsToggleBtn = document.getElementById('controls-toggle');
const trophiesToggleBtn = document.getElementById('trophies-toggle');
const controlsCard = document.getElementById('controls-card');
const trophiesCard = document.getElementById('trophies-card');
const trophiesListEl = document.getElementById('trophies-list');
const trophyProgressEl = document.getElementById('trophy-progress');
const titleBestScoreEl = document.getElementById('title-best-score');

const hintEl = document.querySelector('.hint');
const gameShellEls = document.querySelectorAll('.game-shell');

const GAME_WIDTH = 600;
const GAME_HEIGHT = 650;

const STORAGE_KEY = "sns:voidInvaders:personalHighScore";
const LEGACY_STORAGE_KEY = "voidInvadersHighScore";
const TROPHY_STORAGE_KEY = "sns:voidInvaders:trophies";

let keys = {};
let score = 0;
let highScore = loadHighScore();
let lives = 3;
let isGameOver = false;
let gameFrame = 0;
let gameState = "title";
let soundEnabled = true;

canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

canvas.tabIndex = 0;
canvas.style.outline = "none";
canvas.style.touchAction = "none";
canvas.style.maxWidth = "100%";

document.documentElement.style.overscrollBehavior = "none";

// -------------------- Utility --------------------

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getStorage() {
  try {
    const testKey = "__void_invaders_storage_test__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return window.localStorage;
  } catch (err) {
    return null;
  }
}

function normalizeStoredScore(value) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return Math.floor(parsed);
}

function loadHighScore() {
  const storage = getStorage();

  if (!storage) {
    return 0;
  }

  const saved = normalizeStoredScore(storage.getItem(STORAGE_KEY));

  if (saved > 0) {
    return saved;
  }

  const legacySaved = normalizeStoredScore(storage.getItem(LEGACY_STORAGE_KEY));

  if (legacySaved > 0) {
    storage.setItem(STORAGE_KEY, String(legacySaved));
    return legacySaved;
  }

  return 0;
}

function saveHighScore() {
  if (score <= highScore) return;

  highScore = score;

  const storage = getStorage();

  if (storage) {
    try {
      storage.setItem(STORAGE_KEY, String(highScore));
    } catch (err) {
      // Local storage is optional. Game still works without it.
    }
  }

  updateHighScoreUI();
}

function updateHighScoreUI() {
  if (highScoreEl) highScoreEl.textContent = `Best: ${highScore}`;
  if (titleBestScoreEl) titleBestScoreEl.textContent = String(highScore);
  if (finalBestScoreEl) finalBestScoreEl.textContent = String(highScore);
}

// -------------------- Trophies --------------------

const TROPHIES = [
  {
    id: "chain-eight",
    name: "Hot Streak",
    desc: "Build an 8-hit score chain.",
    test: stats => stats.maxCombo >= 8
  },
  {
    id: "graze-25",
    name: "Needle Threader",
    desc: "Graze 25 enemy shots in one run.",
    test: stats => stats.grazes >= 25
  },
  {
    id: "score-10000",
    name: "Signal Flare",
    desc: "Score 10,000 points in one run.",
    test: () => score >= 10000
  },
  {
    id: "three-bosses",
    name: "Core Breaker",
    desc: "Defeat 3 bosses in one run.",
    test: stats => stats.bossesDefeated >= 3
  },
  {
    id: "arsenal",
    name: "Loaded Orbit",
    desc: "Collect 12 power-ups in one run.",
    test: stats => stats.powerUpsCollected >= 12
  },
  {
    id: "wave-six",
    name: "Deep Sector",
    desc: "Clear wave 5 and enter wave 6.",
    test: stats => stats.highestWave >= 6
  },
  {
    id: "bomb-master",
    name: "Void Detonator",
    desc: "Destroy 25 enemies with void bombs in one run.",
    test: stats => stats.bombKills >= 25
  },
  {
    id: "boss-gallery",
    name: "Hunter's Ledger",
    desc: "Defeat every boss type in one run.",
    test: stats => stats.bossTypesDefeated.size >= BOSS_TYPES.length
  }
];

let unlockedTrophies = loadTrophies();
let runStats = makeRunStats();

function makeRunStats() {
  return {
    maxCombo: 0,
    grazes: 0,
    bossesDefeated: 0,
    powerUpsCollected: 0,
    highestWave: 1,
    bombKills: 0,
    bossTypesDefeated: new Set()
  };
}

function loadTrophies() {
  const storage = getStorage();

  if (!storage) return new Set();

  try {
    const parsed = JSON.parse(storage.getItem(TROPHY_STORAGE_KEY) || "[]");
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch (err) {
    return new Set();
  }
}

function saveTrophies() {
  const storage = getStorage();

  if (!storage) return;

  try {
    storage.setItem(TROPHY_STORAGE_KEY, JSON.stringify([...unlockedTrophies]));
  } catch (err) {
    // Trophies are optional persistence. The run still works without storage.
  }
}

function renderTrophies() {
  if (!trophiesListEl || !trophyProgressEl) return;

  trophyProgressEl.textContent = `${unlockedTrophies.size}/${TROPHIES.length}`;
  trophiesListEl.innerHTML = "";

  TROPHIES.forEach(trophy => {
    const unlocked = unlockedTrophies.has(trophy.id);
    const row = document.createElement("div");
    row.className = `trophy-row${unlocked ? "" : " locked"}`;

    const icon = document.createElement("div");
    icon.className = "trophy-icon";
    icon.textContent = unlocked ? "*" : "?";

    const body = document.createElement("div");
    const name = document.createElement("div");
    name.className = "trophy-name";
    name.textContent = trophy.name;

    const desc = document.createElement("div");
    desc.className = "trophy-desc";
    desc.textContent = trophy.desc;

    body.appendChild(name);
    body.appendChild(desc);
    row.appendChild(icon);
    row.appendChild(body);
    trophiesListEl.appendChild(row);
  });
}

function unlockTrophy(trophy) {
  if (unlockedTrophies.has(trophy.id)) return;

  unlockedTrophies.add(trophy.id);
  saveTrophies();
  renderTrophies();

  v_scorePopups.push({
    x: GAME_WIDTH / 2,
    y: 118,
    text: `TROPHY: ${trophy.name}`,
    color: "#ffe66d",
    life: 150,
    maxLife: 150,
    vy: -0.22
  });

  playSound("win");
}

function checkTrophies() {
  TROPHIES.forEach(trophy => {
    if (!unlockedTrophies.has(trophy.id) && trophy.test(runStats)) {
      unlockTrophy(trophy);
    }
  });
}

// -------------------- Background --------------------

let bgStarsFar = [];
let bgStarsMid = [];
let bgStarsNear = [];
let bgNebula = [];
const backgroundImage = new Image();
let backgroundImageReady = false;

backgroundImage.onload = () => {
  backgroundImageReady = true;
};

backgroundImage.src = "assets/background.png";

function initBackground() {
  bgStarsFar = [];
  bgStarsMid = [];
  bgStarsNear = [];
  bgNebula = [];

  for (let i = 0; i < 75; i++) {
    bgStarsFar.push({
      x: rand(0, GAME_WIDTH),
      y: rand(0, GAME_HEIGHT),
      size: rand(0.8, 1.6),
      alpha: rand(0.2, 0.6),
      twinkleSpeed: rand(0.01, 0.03),
      twinkleOffset: rand(0, Math.PI * 2)
    });
  }

  for (let i = 0; i < 45; i++) {
    bgStarsMid.push({
      x: rand(0, GAME_WIDTH),
      y: rand(0, GAME_HEIGHT),
      size: rand(1.2, 2.2),
      alpha: rand(0.35, 0.8),
      twinkleSpeed: rand(0.015, 0.04),
      twinkleOffset: rand(0, Math.PI * 2)
    });
  }

  for (let i = 0; i < 20; i++) {
    bgStarsNear.push({
      x: rand(0, GAME_WIDTH),
      y: rand(0, GAME_HEIGHT),
      size: rand(1.8, 3.2),
      alpha: rand(0.4, 0.95),
      twinkleSpeed: rand(0.02, 0.05),
      twinkleOffset: rand(0, Math.PI * 2),
      glow: rand(4, 10)
    });
  }

  bgNebula.push(
    { x: 120, y: 120, r: 170, color: "120, 40, 180", alpha: 0.12 },
    { x: 470, y: 180, r: 150, color: "190, 25, 80", alpha: 0.10 },
    { x: 300, y: 420, r: 210, color: "70, 30, 140", alpha: 0.10 },
    { x: 520, y: 540, r: 120, color: "160, 0, 60", alpha: 0.08 }
  );
}

// -------------------- Mobile Controls --------------------

let mobileInput = {
  left: false,
  right: false,
  fire: false
};

let isPointerDragging = false;

function isMobileLike() {
  return window.matchMedia("(pointer: coarse)").matches || window.innerWidth <= 760;
}

function makeMobileControls() {
  let controls = document.getElementById("mobile-controls");

  if (!controls) {
    controls = document.createElement("div");
    controls.id = "mobile-controls";
    controls.className = "mobile-controls";

    const leftBtn = document.createElement("button");
    leftBtn.id = "touch-left";
    leftBtn.className = "touch-btn";
    leftBtn.type = "button";
    leftBtn.textContent = "<";
    leftBtn.setAttribute("aria-label", "Move left");

    const fireBtn = document.createElement("button");
    fireBtn.id = "touch-fire";
    fireBtn.className = "touch-btn fire-btn";
    fireBtn.type = "button";
    fireBtn.textContent = "FIRE";
    fireBtn.setAttribute("aria-label", "Fire");

    const rightBtn = document.createElement("button");
    rightBtn.id = "touch-right";
    rightBtn.className = "touch-btn";
    rightBtn.type = "button";
    rightBtn.textContent = ">";
    rightBtn.setAttribute("aria-label", "Move right");

    controls.appendChild(leftBtn);
    controls.appendChild(fireBtn);
    controls.appendChild(rightBtn);

    const wrap = document.querySelector(".wrap") || document.body;
    wrap.appendChild(controls);
  }

  return controls;
}

const mobileControls = makeMobileControls();

const touchLeftBtn = document.getElementById("touch-left");
const touchRightBtn = document.getElementById("touch-right");
const touchFireBtn = document.getElementById("touch-fire");

if (touchLeftBtn) touchLeftBtn.textContent = "<";
if (touchRightBtn) touchRightBtn.textContent = ">";

function updateMobileControlVisibility() {
  const mobile = isMobileLike();

  if (mobileControls) {
    mobileControls.style.display = mobile && gameState === "playing" && !v_isPaused ? "grid" : "none";
  }

  if (hintEl) {
    hintEl.textContent = mobile
      ? "Drag ship or use buttons. Hold FIRE to shoot."
      : "Move: Left/Right   Shoot: Space   Pause: P   Restart: R";
  }

  resizeCanvasForScreen();
}

function setMobileInput(name, value) {
  mobileInput[name] = value;
}

function attachHoldButton(button, inputName) {
  if (!button) return;

  const start = (e) => {
    e.preventDefault();
    initAudio();
    setMobileInput(inputName, true);
    canvas.focus();
  };

  const stop = (e) => {
    if (e) e.preventDefault();
    setMobileInput(inputName, false);
  };

  button.addEventListener("pointerdown", start);
  button.addEventListener("pointerup", stop);
  button.addEventListener("pointercancel", stop);
  button.addEventListener("pointerleave", stop);
  button.addEventListener("contextmenu", (e) => e.preventDefault());
}

attachHoldButton(touchLeftBtn, "left");
attachHoldButton(touchRightBtn, "right");
attachHoldButton(touchFireBtn, "fire");

function movePlayerToPointer(e) {
  const rect = canvas.getBoundingClientRect();
  const scaledX = ((e.clientX - rect.left) / rect.width) * canvas.width;
  v_player.x = clamp(scaledX, 22, canvas.width - 22);
}

canvas.addEventListener("pointerdown", (e) => {
  initAudio();
  canvas.focus();

  if (isMobileLike() && gameState === "playing" && !v_isPaused) {
    e.preventDefault();
    isPointerDragging = true;
    movePlayerToPointer(e);
  }
});

canvas.addEventListener("pointermove", (e) => {
  if (!isPointerDragging) return;
  e.preventDefault();
  movePlayerToPointer(e);
});

canvas.addEventListener("pointerup", (e) => {
  if (isPointerDragging) e.preventDefault();
  isPointerDragging = false;
});

canvas.addEventListener("pointercancel", () => {
  isPointerDragging = false;
});

document.addEventListener(
  "touchmove",
  (e) => {
    if (mobileControls && (e.target === canvas || mobileControls.contains(e.target))) {
      e.preventDefault();
    }
  },
  { passive: false }
);

function resizeCanvasForScreen() {
  const hud = document.querySelector(".hud");
  const controlsVisible = isMobileLike() && gameState === "playing";

  const horizontalPadding = 16;
  const maxWidth = Math.max(280, window.innerWidth - horizontalPadding);

  let reservedHeight = 28;

  if (hud && !hud.hidden) reservedHeight += hud.offsetHeight;
  if (hintEl && !hintEl.hidden) reservedHeight += hintEl.offsetHeight;

  if (controlsVisible && mobileControls) {
    reservedHeight += mobileControls.offsetHeight + 10;
  }

  let maxHeight = window.innerHeight - reservedHeight;

  if (!Number.isFinite(maxHeight) || maxHeight < 300) {
    maxHeight = 420;
  }

  let scale = Math.min(
    maxWidth / GAME_WIDTH,
    maxHeight / GAME_HEIGHT,
    1
  );

  if (!isMobileLike()) {
    scale = Math.min(maxWidth / GAME_WIDTH, 1);
  }

  const cssWidth = Math.floor(GAME_WIDTH * scale);
  const cssHeight = Math.floor(GAME_HEIGHT * scale);

  canvas.style.width = `${cssWidth}px`;
  canvas.style.height = `${cssHeight}px`;
}

// -------------------- Audio --------------------

let audioCtx = null;
let masterGain = null;

function initAudio() {
  if (!soundEnabled) return;

  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    audioCtx = new AudioContext();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.25;
    masterGain.connect(audioCtx.destination);
  }

  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
}

function playSound(type) {
  if (!soundEnabled || !audioCtx || !masterGain) return;

  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }

  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.connect(gain);
  gain.connect(masterGain);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

  if (type === "shoot") {
    osc.type = "square";
    osc.frequency.setValueAtTime(760, now);
    osc.frequency.exponentialRampToValueAtTime(130, now + 0.12);
    osc.start(now);
    osc.stop(now + 0.15);
    return;
  }

  if (type === "explosion") {
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(190, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.14);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.35, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
    osc.start(now);
    osc.stop(now + 0.22);
    return;
  }

  if (type === "death") {
    osc.type = "triangle";
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.2);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.3, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
    osc.start(now);
    osc.stop(now + 0.26);
    return;
  }

  if (type === "power") {
    osc.type = "sine";
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.setValueAtTime(760, now + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
    osc.start(now);
    osc.stop(now + 0.22);
    return;
  }

  if (type === "boss") {
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.exponentialRampToValueAtTime(36, now + 0.42);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.32, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.48);
    osc.start(now);
    osc.stop(now + 0.5);
    return;
  }

  if (type === "win") {
    osc.type = "sine";
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.setValueAtTime(660, now + 0.08);
    osc.frequency.setValueAtTime(880, now + 0.16);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.25, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
    osc.start(now);
    osc.stop(now + 0.36);
    return;
  }

  osc.type = "sine";
  osc.frequency.setValueAtTime(300, now);
  osc.start(now);
  osc.stop(now + 0.08);
}

// -------------------- UI --------------------

function updateUI() {
  saveHighScore();

  scoreEl.textContent = `Score: ${score}`;
  livesEl.textContent = `Lives: ${Math.max(0, lives)}`;
  updateHighScoreUI();
}

function screenShake() {
  canvas.style.transform =
    `translate(${(Math.random() * 10 - 5).toFixed(1)}px, ${(Math.random() * 10 - 5).toFixed(1)}px)`;

  setTimeout(() => {
    canvas.style.transform = "none";
  }, 160);
}

function closeOverlay() {
  overlay.hidden = true;
  overlay.style.display = "none";
  overlay.style.pointerEvents = "none";
}

function openOverlay() {
  overlay.hidden = false;
  overlay.style.display = "grid";
  overlay.style.pointerEvents = "auto";
}

function showGameOver(win = false) {
  isGameOver = true;
  gameState = "gameover";

  saveHighScore();

  finalScoreEl.textContent = String(score);
  finalBestScoreEl.textContent = String(highScore);
  overTitle.textContent = win ? "YOU WIN" : "GAME OVER";

  keys = {};
  mobileInput.left = false;
  mobileInput.right = false;
  mobileInput.fire = false;
  v_isPaused = false;

  openOverlay();
  updateMobileControlVisibility();
}

function showTitleScreen() {
  gameState = "title";
  isGameOver = true;

  titleScreen.hidden = false;
  closeOverlay();

  gameShellEls.forEach(el => {
    el.hidden = true;
  });

  keys = {};
  mobileInput.left = false;
  mobileInput.right = false;
  mobileInput.fire = false;
  v_isPaused = false;

  updateHighScoreUI();
  renderTrophies();
  updateMobileControlVisibility();
}

function showGameShell() {
  titleScreen.hidden = true;

  gameShellEls.forEach(el => {
    el.hidden = false;
  });

  updateMobileControlVisibility();
}

// -------------------- Game State --------------------

let v_player = { x: 300, y: 580, w: 32, h: 34 };
let v_bullets = [];
let v_enemies = [];
let v_enemyBullets = [];
let v_powerUps = [];
let v_particles = [];
let v_scorePopups = [];
let v_playerTrails = [];

let v_boss = null;
let v_bossDefeatedThisWave = false;
let v_bossWarningTimer = 0;

let v_dir = 1;
let v_moveTimer = 0;
let v_moveInterval = 40;
let v_shootTimer = 0;
let v_level = 1;
let v_invuln = 0;
let v_isPaused = false;
let v_waveBannerTimer = 0;
let v_waveBannerText = "";
let v_combo = 0;
let v_comboTimer = 0;

let v_powerUpDropCooldown = 0;

let activePowerUps = {
  doubleShot: 0,
  rapidFire: 0,
  shield: 0
};

const POWER_UP_TYPES = {
  double: {
    label: "D",
    name: "Double Shot",
    color: "#77ff77"
  },
  rapid: {
    label: "R",
    name: "Rapid Fire",
    color: "#ffe66d"
  },
  shield: {
    label: "S",
    name: "Shield",
    color: "#7df9ff"
  },
  bomb: {
    label: "B",
    name: "Void Bomb",
    color: "#ff4d7a"
  },
  life: {
    label: "+",
    name: "Extra Life",
    color: "#ffffff"
  }
};

const BOSS_TYPES = [
  {
    id: "maw",
    name: "VOID MAW",
    color: "#ff4d7a",
    rageColor: "#ff2e63",
    body: "#16071f",
    w: 118,
    h: 74,
    hpBonus: 0,
    speedBonus: 0,
    patternCount: 3
  },
  {
    id: "needle",
    name: "NEEDLE WRAITH",
    color: "#7df9ff",
    rageColor: "#ffffff",
    body: "#071f22",
    w: 94,
    h: 86,
    hpBonus: -4,
    speedBonus: 0.75,
    patternCount: 3
  },
  {
    id: "forge",
    name: "STAR FORGE",
    color: "#ffe66d",
    rageColor: "#ff9f1c",
    body: "#241907",
    w: 132,
    h: 68,
    hpBonus: 8,
    speedBonus: -0.25,
    patternCount: 3
  },
  {
    id: "mirror",
    name: "MIRROR HEX",
    color: "#c48cff",
    rageColor: "#ff87c5",
    body: "#1a0d2b",
    w: 112,
    h: 112,
    hpBonus: 4,
    speedBonus: 0.35,
    patternCount: 4
  }
];

function initInvaders() {
  showGameShell();

  isGameOver = false;
  gameState = "playing";

  keys = {};
  mobileInput.left = false;
  mobileInput.right = false;
  mobileInput.fire = false;

  closeOverlay();

  lives = 3;
  score = 0;
  gameFrame = 0;
  updateUI();

  v_player.x = canvas.width / 2;
  v_player.y = 580;

  v_bullets = [];
  v_enemyBullets = [];
  v_powerUps = [];
  v_particles = [];
  v_scorePopups = [];
  v_playerTrails = [];
  v_boss = null;
  v_bossDefeatedThisWave = false;
  v_bossWarningTimer = 0;

  activePowerUps.doubleShot = 0;
  activePowerUps.rapidFire = 0;
  activePowerUps.shield = 0;

  v_level = 1;
  v_invuln = 0;
  v_isPaused = false;
  v_combo = 0;
  v_comboTimer = 0;
  runStats = makeRunStats();
  v_powerUpDropCooldown = 0;
  v_waveBannerTimer = 110;
  v_waveBannerText = "WAVE 1";

  initBackground();
  spawnInvaders();
  v_moveInterval = 40;

  canvas.focus();
  resizeCanvasForScreen();
}

function spawnInvaders() {
  v_enemies = [];
  v_dir = 1;
  v_boss = null;

  const rows = Math.min(7, 3 + Math.floor((v_level - 1) / 1.5));
  const cols = 8;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const type = r % 3 === 0 ? "orb" : r % 3 === 1 ? "squid" : "crawler";
      const stats = getEnemyStats(type);

      v_enemies.push({
        x: 50 + c * 50,
        y: 50 + r * 50,
        type,
        hp: stats.hp,
        maxHp: stats.hp,
        points: stats.points,
        armored: stats.armored,
        animOffset: Math.random() * Math.PI * 2,
        wobble: rand(0.75, 1.35)
      });
    }
  }

  v_moveInterval = Math.max(5, 42 - (v_level * 2.6));
}

function getEnemyStats(type) {
  let hp = 1;
  let points = 20;
  let armored = false;

  if (type === "orb") {
    hp = 1;
    points = 20;

    if (v_level >= 6) {
      hp += 1;
      points += 15;
      armored = true;
    }
  }

  if (type === "squid") {
    hp = 1;
    points = 30;

    if (v_level >= 5) {
      hp += 1;
      points += 18;
      armored = true;
    }
  }

  if (type === "crawler") {
    hp = 2 + Math.floor(v_level / 4);
    points = 45 + Math.floor(v_level / 2) * 10;
    armored = true;
  }

  if (v_level >= 4 && Math.random() < Math.min(0.08 + v_level * 0.012, 0.2)) {
    hp += 1;
    points += 20;
    armored = true;
  }

  return { hp, points, armored };
}

function spawnBoss() {
  const bossType = BOSS_TYPES[(v_level - 1) % BOSS_TYPES.length];
  const bossHp = Math.max(16, 18 + v_level * 8 + Math.floor(v_level / 3) * 8 + bossType.hpBonus);

  v_boss = {
    x: GAME_WIDTH / 2,
    y: 92,
    w: bossType.w,
    h: bossType.h,
    hp: bossHp,
    maxHp: bossHp,
    vx: 1.15 + Math.min(v_level * 0.12, 1.8) + bossType.speedBonus,
    shootTimer: 80,
    pattern: 0,
    rage: false,
    variant: bossType,
    hitFlash: 0,
    animOffset: Math.random() * Math.PI * 2
  };

  v_bossDefeatedThisWave = false;
  v_bossWarningTimer = 90;
  v_enemyBullets.length = 0;

  v_waveBannerTimer = 120;
  v_waveBannerText = bossType.name;

  playSound("boss");
}

function isLeftPressed() {
  return keys["ArrowLeft"] || mobileInput.left;
}

function isRightPressed() {
  return keys["ArrowRight"] || mobileInput.right;
}

function isFirePressed() {
  return keys[" "] || keys["Spacebar"] || mobileInput.fire;
}

function firePlayerBullet() {
  const bulletSpeed = -7.5;

  if (activePowerUps.doubleShot > 0) {
    v_bullets.push({
      x: v_player.x - 9,
      y: v_player.y - 24,
      vx: -0.25,
      vy: bulletSpeed,
      type: "player"
    });

    v_bullets.push({
      x: v_player.x + 9,
      y: v_player.y - 24,
      vx: 0.25,
      vy: bulletSpeed,
      type: "player"
    });
  } else {
    v_bullets.push({
      x: v_player.x,
      y: v_player.y - 24,
      vx: 0,
      vy: bulletSpeed,
      type: "player"
    });
  }

  playSound("shoot");
  v_shootTimer = activePowerUps.rapidFire > 0 ? 8 : 20;
}

function addScore(points, x, y, label = "") {
  score += points;
  updateUI();
  checkTrophies();

  v_scorePopups.push({
    x,
    y,
    text: label || `+${points}`,
    color: points >= 250 ? "#ffe66d" : "#ffffff",
    life: 56,
    maxLife: 56,
    vy: -0.55
  });
}

function addComboScore(basePoints, x, y) {
  if (v_comboTimer > 0) {
    v_combo++;
  } else {
    v_combo = 1;
  }

  v_comboTimer = 140;

  const comboBonus = v_combo > 1 ? Math.min(360, (v_combo - 1) * 12) : 0;
  runStats.maxCombo = Math.max(runStats.maxCombo, v_combo);
  checkTrophies();
  addScore(basePoints + comboBonus, x, y, comboBonus > 0 ? `+${basePoints + comboBonus} x${v_combo}` : `+${basePoints}`);
}

function damageEnemy(enemy, enemyIndex, bulletX, bulletY) {
  enemy.hp--;
  enemy.hitFlash = 10;

  spawnParticles(
    bulletX,
    bulletY,
    enemy.type === "orb" ? "#ff4d7a" : enemy.type === "squid" ? "#c48cff" : "#77ff77",
    enemy.hp > 0 ? 7 : 14
  );

  if (enemy.hp > 0) {
    playSound("explosion");
    return false;
  }

  const defeated = v_enemies.splice(enemyIndex, 1)[0];

  addComboScore(defeated.points, defeated.x, defeated.y);
  playSound("explosion");

  spawnParticles(
    defeated.x,
    defeated.y,
    defeated.type === "orb" ? "#ff4d7a" : defeated.type === "squid" ? "#c48cff" : "#77ff77",
    18
  );

  maybeDropPowerUp(defeated.x, defeated.y);

  const baseSpeed = Math.max(5, 42 - (v_level * 2.6));
  const enemyCountPressure = Math.floor((56 - v_enemies.length) / 3);
  v_moveInterval = Math.max(2, baseSpeed - enemyCountPressure);

  return true;
}

function damageBoss(bulletX, bulletY) {
  if (!v_boss) return;

  v_boss.hp--;
  v_boss.hitFlash = 8;

  spawnParticles(bulletX, bulletY, "#ff4d7a", 8);

  if (v_boss.hp <= Math.floor(v_boss.maxHp * 0.45)) {
    v_boss.rage = true;
  }

  if (v_boss.hp > 0) {
    if (v_boss.hp % 6 === 0) {
      playSound("explosion");
    }

    return;
  }

  const defeatedX = v_boss.x;
  const defeatedY = v_boss.y;
  const defeatedVariant = v_boss.variant;

  addScore(1500 + v_level * 380, defeatedX, defeatedY, "CORE BROKEN");
  runStats.bossesDefeated++;
  runStats.bossTypesDefeated.add(defeatedVariant.id);
  checkTrophies();

  spawnParticles(defeatedX, defeatedY, defeatedVariant.rageColor, 42);
  spawnParticles(defeatedX, defeatedY, defeatedVariant.color, 32);
  spawnParticles(defeatedX, defeatedY, "#ffffff", 24);

  v_enemyBullets.length = 0;
  v_boss = null;
  v_bossDefeatedThisWave = true;

  screenShake();
  playSound("win");

  maybeDropBossReward(defeatedX, defeatedY);
}

function maybeDropPowerUp(x, y) {
  if (v_powerUpDropCooldown > 0) return;

  const chance = Math.min(0.035 + (v_level * 0.004), 0.095);

  if (Math.random() > chance) return;

  dropPowerUp(x, y);
  v_powerUpDropCooldown = 360;
}

function maybeDropBossReward(x, y) {
  if (Math.random() > 0.55) return;

  dropPowerUp(x, y);
  v_powerUpDropCooldown = 420;
}

function dropPowerUp(x, y) {
  const roll = Math.random();
  let type = "double";

  if (roll < 0.27) type = "double";
  else if (roll < 0.49) type = "rapid";
  else if (roll < 0.72) type = "shield";
  else if (roll < 0.91) type = "bomb";
  else type = "life";

  v_powerUps.push({
    x,
    y,
    vy: 1.45,
    type,
    pulse: Math.random() * Math.PI * 2
  });
}

function collectPowerUp(powerUp) {
  const data = POWER_UP_TYPES[powerUp.type];

  runStats.powerUpsCollected++;
  checkTrophies();

  playSound("power");
  spawnParticles(powerUp.x, powerUp.y, data.color, 22);
  v_scorePopups.push({
    x: powerUp.x,
    y: powerUp.y - 8,
    text: data.name.toUpperCase(),
    color: data.color,
    life: 64,
    maxLife: 64,
    vy: -0.45
  });

  if (powerUp.type === "double") {
    activePowerUps.doubleShot = 520;
  }

  if (powerUp.type === "rapid") {
    activePowerUps.rapidFire = 440;
  }

  if (powerUp.type === "shield") {
    activePowerUps.shield = 560;
  }

  if (powerUp.type === "life") {
    lives = Math.min(5, lives + 1);
    updateUI();
  }

  if (powerUp.type === "bomb") {
    triggerVoidBomb();
  }
}

function triggerVoidBomb() {
  const destroyed = Math.min(10, v_enemies.length);
  runStats.bombKills += destroyed;
  checkTrophies();

  for (let i = 0; i < destroyed; i++) {
    const enemy = v_enemies.shift();

    if (!enemy) break;

    addScore(enemy.points, enemy.x, enemy.y, "BOMB");
    spawnParticles(
      enemy.x,
      enemy.y,
      enemy.type === "orb" ? "#ff4d7a" : enemy.type === "squid" ? "#c48cff" : "#77ff77",
      16
    );
  }

  if (v_boss) {
    const bossDamage = 8 + Math.floor(v_level / 2);
    v_boss.hp -= bossDamage;
    spawnParticles(v_boss.x, v_boss.y, "#ff4d7a", 36);

    if (v_boss.hp <= 0) {
      damageBoss(v_boss.x, v_boss.y);
    }
  }

  v_enemyBullets.length = 0;
  screenShake();
}

function updatePowerUpTimers() {
  activePowerUps.doubleShot = Math.max(0, activePowerUps.doubleShot - 1);
  activePowerUps.rapidFire = Math.max(0, activePowerUps.rapidFire - 1);
  activePowerUps.shield = Math.max(0, activePowerUps.shield - 1);
}

function updatePlayer() {
  const startX = v_player.x;

  if (isLeftPressed() && v_player.x > 22) {
    v_player.x -= 5.6;
  }

  if (isRightPressed() && v_player.x < canvas.width - 22) {
    v_player.x += 5.6;
  }

  if (v_shootTimer > 0) v_shootTimer--;

  if (isFirePressed() && v_shootTimer === 0) {
    firePlayerBullet();
  }

  if ((Math.abs(v_player.x - startX) > 0.2 || isFirePressed()) && gameFrame % 3 === 0) {
    v_playerTrails.push({
      x: v_player.x,
      y: v_player.y + 15,
      life: 18,
      maxLife: 18,
      size: rand(4, 9)
    });
  }
}

function updatePlayerBullets() {
  for (let i = v_bullets.length - 1; i >= 0; i--) {
    const b = v_bullets[i];

    b.x += b.vx || 0;
    b.y += b.vy;

    let bulletHit = false;

    for (let j = v_enemies.length - 1; j >= 0; j--) {
      const e = v_enemies[j];

      if (Math.abs(b.x - e.x) < 20 && Math.abs(b.y - e.y) < 20) {
        damageEnemy(e, j, b.x, b.y);
        v_bullets.splice(i, 1);
        bulletHit = true;
        break;
      }
    }

    if (
      !bulletHit &&
      v_boss &&
      Math.abs(b.x - v_boss.x) < v_boss.w / 2 &&
      Math.abs(b.y - v_boss.y) < v_boss.h / 2
    ) {
      damageBoss(b.x, b.y);
      v_bullets.splice(i, 1);
      bulletHit = true;
    }

    if (!bulletHit && (b.y < -20 || b.y > canvas.height + 20 || b.x < -20 || b.x > canvas.width + 20)) {
      v_bullets.splice(i, 1);
    }
  }
}

function updateEnemyMovement() {
  v_moveTimer++;

  if (v_moveTimer <= v_moveInterval) return;

  v_moveTimer = 0;

  let hitEdge = false;

  v_enemies.forEach(e => {
    if ((v_dir === 1 && e.x > canvas.width - 40) || (v_dir === -1 && e.x < 40)) {
      hitEdge = true;
    }
  });

  const erraticSwap = v_level >= 4 && !hitEdge && Math.random() < 0.08 + (v_level * 0.018);

  if (hitEdge) {
    v_dir *= -1;

    v_enemies.forEach(e => {
      const dropAmount = e.type === "crawler" ? 24 : 20;
      e.y += dropAmount;
    });
  } else if (erraticSwap) {
    v_dir *= -1;

    v_enemies.forEach(e => {
      e.x += v_dir * 15;
    });
  } else {
    v_enemies.forEach(e => {
      const step = e.type === "squid" ? 17 : 15;
      e.x += v_dir * step;

      if (e.type === "orb") {
        e.y += Math.sin(gameFrame * 0.03 + e.animOffset) * 0.35;
      }
    });
  }
}

function updateBoss() {
  if (!v_boss) return;

  const speedBoost = v_boss.rage ? 1.45 : 1;
  v_boss.x += v_boss.vx * speedBoost;

  if (v_boss.x > GAME_WIDTH - v_boss.w / 2 - 18) {
    v_boss.x = GAME_WIDTH - v_boss.w / 2 - 18;
    v_boss.vx *= -1;
    v_boss.y += 10;
  }

  if (v_boss.x < v_boss.w / 2 + 18) {
    v_boss.x = v_boss.w / 2 + 18;
    v_boss.vx *= -1;
    v_boss.y += 10;
  }

  v_boss.y += Math.sin(gameFrame * 0.025 + v_boss.animOffset) * 0.2;

  v_boss.shootTimer--;

  if (v_boss.shootTimer <= 0) {
    fireBossPattern();
    v_boss.pattern = (v_boss.pattern + 1) % v_boss.variant.patternCount;
    v_boss.shootTimer = v_boss.rage
      ? Math.max(34, 68 - v_level * 2)
      : Math.max(46, 86 - v_level * 2);
  }

  if (v_boss.y > 450) {
    v_boss.y = 450;
  }
}

function fireBossPattern() {
  if (!v_boss) return;

  const baseSpeed = 3.8 + v_level * 0.35;
  const aimed = clamp((v_player.x - v_boss.x) / 130, -2.8, 2.8);
  const variant = v_boss.variant.id;

  if (variant === "needle") {
    if (v_boss.pattern === 0) {
      [-1.7, -0.85, 0, 0.85, 1.7].forEach(vx => {
        v_enemyBullets.push({
          x: v_boss.x,
          y: v_boss.y + 36,
          vx: vx + aimed * 0.25,
          vy: baseSpeed + 0.55,
          type: "aimed"
        });
      });
    }

    if (v_boss.pattern === 1) {
      [-42, 0, 42].forEach((offset, i) => {
        v_enemyBullets.push({
          x: v_boss.x + offset,
          y: v_boss.y + 22 + i * 5,
          vx: aimed * 0.55 + offset * 0.012,
          vy: baseSpeed + 1.05,
          type: i === 1 ? "heavy" : "aimed"
        });
      });
    }

    if (v_boss.pattern === 2) {
      const side = Math.random() < 0.5 ? -1 : 1;
      for (let i = 0; i < 5; i++) {
        v_enemyBullets.push({
          x: v_boss.x + side * (18 + i * 13),
          y: v_boss.y + 18,
          vx: side * (0.2 + i * 0.22),
          vy: baseSpeed + i * 0.22,
          type: "spread"
        });
      }
    }

    return;
  }

  if (variant === "forge") {
    if (v_boss.pattern === 0) {
      [-48, -18, 18, 48].forEach(offset => {
        v_enemyBullets.push({
          x: v_boss.x + offset,
          y: v_boss.y + 30,
          vx: offset * 0.018,
          vy: baseSpeed + 0.9,
          type: "heavy"
        });
      });
    }

    if (v_boss.pattern === 1) {
      const spread = v_boss.rage ? [-2.6, -1.6, -0.6, 0.6, 1.6, 2.6] : [-2, -0.9, 0.9, 2];
      spread.forEach(vx => {
        v_enemyBullets.push({
          x: v_boss.x,
          y: v_boss.y + 35,
          vx,
          vy: baseSpeed * 0.9,
          type: "spread"
        });
      });
    }

    if (v_boss.pattern === 2) {
      v_enemyBullets.push({
        x: v_boss.x,
        y: v_boss.y + 38,
        vx: aimed * 0.8,
        vy: baseSpeed + 1.7,
        type: "heavy"
      });
    }

    return;
  }

  if (variant === "mirror") {
    if (v_boss.pattern === 0) {
      [-2.1, -0.7, 0.7, 2.1].forEach(vx => {
        v_enemyBullets.push({
          x: v_boss.x,
          y: v_boss.y + 34,
          vx,
          vy: baseSpeed,
          type: "spread"
        });
      });
    }

    if (v_boss.pattern === 1) {
      [-34, 34].forEach(offset => {
        v_enemyBullets.push({
          x: v_boss.x + offset,
          y: v_boss.y + 18,
          vx: aimed * 0.75 - offset * 0.018,
          vy: baseSpeed + 0.65,
          type: "aimed"
        });
      });
    }

    if (v_boss.pattern === 2) {
      [-2.4, -1.2, 0, 1.2, 2.4].forEach(vx => {
        v_enemyBullets.push({
          x: v_boss.x + vx * 10,
          y: v_boss.y + 38,
          vx: -vx,
          vy: baseSpeed * 0.86,
          type: "spread"
        });
      });
    }

    if (v_boss.pattern === 3) {
      v_enemyBullets.push({
        x: v_boss.x,
        y: v_boss.y + 42,
        vx: aimed,
        vy: baseSpeed + 1.1,
        type: "heavy"
      });
    }

    return;
  }

  if (v_boss.pattern === 0) {
    v_enemyBullets.push({
      x: v_boss.x,
      y: v_boss.y + 35,
      vx: aimed,
      vy: baseSpeed + 0.8,
      type: "heavy"
    });

    v_enemyBullets.push({
      x: v_boss.x - 34,
      y: v_boss.y + 28,
      vx: aimed * 0.45 - 0.9,
      vy: baseSpeed,
      type: "aimed"
    });

    v_enemyBullets.push({
      x: v_boss.x + 34,
      y: v_boss.y + 28,
      vx: aimed * 0.45 + 0.9,
      vy: baseSpeed,
      type: "aimed"
    });
  }

  if (v_boss.pattern === 1) {
    const spread = v_boss.rage ? [-2.4, -1.2, 0, 1.2, 2.4] : [-1.7, -0.55, 0.55, 1.7];

    spread.forEach(vx => {
      v_enemyBullets.push({
        x: v_boss.x,
        y: v_boss.y + 34,
        vx,
        vy: baseSpeed * 0.95,
        type: "spread"
      });
    });
  }

  if (v_boss.pattern === 2) {
    const side = Math.random() < 0.5 ? -1 : 1;

    for (let i = 0; i < 3; i++) {
      v_enemyBullets.push({
        x: v_boss.x + side * (24 + i * 12),
        y: v_boss.y + 22,
        vx: side * (0.3 + i * 0.25),
        vy: baseSpeed + i * 0.35,
        type: i === 2 ? "heavy" : "aimed"
      });
    }
  }
}

function updateEnemyShooting() {
  const shootChance = Math.min(0.002 + (v_level * 0.0022), 0.075);

  if (Math.random() >= shootChance || v_enemies.length === 0) return;

  const shooter = v_enemies[Math.floor(Math.random() * v_enemies.length)];
  const speed = 3.6 + (v_level * 0.45);

  if (shooter.type === "orb") {
    const aim = clamp((v_player.x - shooter.x) / 120, -2.2, 2.2);

    v_enemyBullets.push({
      x: shooter.x,
      y: shooter.y + 12,
      vx: aim,
      vy: speed,
      type: "aimed"
    });
  }

  if (shooter.type === "squid") {
    const spread = v_level >= 3 ? [-1.4, 0, 1.4] : [-0.9, 0.9];

    spread.forEach(vx => {
      v_enemyBullets.push({
        x: shooter.x,
        y: shooter.y + 12,
        vx,
        vy: speed * 0.92,
        type: "spread"
      });
    });
  }

  if (shooter.type === "crawler") {
    v_enemyBullets.push({
      x: shooter.x,
      y: shooter.y + 14,
      vx: 0,
      vy: speed + 1.2,
      type: "heavy"
    });
  }
}

function handlePlayerHit() {
  if (activePowerUps.shield > 0) {
    activePowerUps.shield = Math.max(0, activePowerUps.shield - 180);
    spawnParticles(v_player.x, v_player.y, "#7df9ff", 24);
    playSound("power");
    screenShake();
    return;
  }

  lives--;
  updateUI();
  playSound("death");
  screenShake();

  v_bullets.length = 0;
  v_enemyBullets.length = 0;

  activePowerUps.doubleShot = 0;
  activePowerUps.rapidFire = 0;

  v_invuln = 70;

  if (lives <= 0) {
    showGameOver(false);
  }
}

function updateEnemyBullets() {
  for (let i = v_enemyBullets.length - 1; i >= 0; i--) {
    const b = v_enemyBullets[i];

    b.x += b.vx || 0;
    b.y += b.vy;

    if (b.y > canvas.height + 24 || b.x < -24 || b.x > canvas.width + 24) {
      v_enemyBullets.splice(i, 1);
      continue;
    }

    const hitBox = b.type === "heavy" ? 18 : 15;
    const nearBox = b.type === "heavy" ? 34 : 29;

    if (
      v_invuln === 0 &&
      Math.abs(b.x - v_player.x) < hitBox &&
      Math.abs(b.y - v_player.y) < hitBox
    ) {
      v_enemyBullets.splice(i, 1);
      handlePlayerHit();
      break;
    }

    if (
      v_invuln === 0 &&
      !b.grazed &&
      Math.abs(b.x - v_player.x) < nearBox &&
      Math.abs(b.y - v_player.y) < nearBox
    ) {
      b.grazed = true;
      runStats.grazes++;
      checkTrophies();
      addScore(8, v_player.x, v_player.y - 28, "GRAZE");
      spawnParticles(v_player.x, v_player.y - 18, "#7df9ff", 5);
    }
  }
}

function updatePowerUps() {
  for (let i = v_powerUps.length - 1; i >= 0; i--) {
    const p = v_powerUps[i];

    p.y += p.vy;
    p.pulse += 0.08;

    const dx = v_player.x - p.x;
    const dy = v_player.y - p.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 96) {
      const pull = 1 - dist / 96;
      p.x += (dx / Math.max(dist, 1)) * pull * 4.2;
      p.y += (dy / Math.max(dist, 1)) * pull * 3.4;
    }

    if (p.y > canvas.height + 24) {
      v_powerUps.splice(i, 1);
      continue;
    }

    if (Math.abs(p.x - v_player.x) < 26 && Math.abs(p.y - v_player.y) < 28) {
      collectPowerUp(p);
      v_powerUps.splice(i, 1);
    }
  }
}

function updateParticles() {
  for (let i = v_particles.length - 1; i >= 0; i--) {
    const p = v_particles[i];

    p.x += p.vx;
    p.y += p.vy;
    p.vy += p.gravity;
    p.life--;

    if (p.life <= 0) {
      v_particles.splice(i, 1);
    }
  }
}

function updateScorePopups() {
  for (let i = v_scorePopups.length - 1; i >= 0; i--) {
    const p = v_scorePopups[i];

    p.y += p.vy;
    p.life--;

    if (p.life <= 0) {
      v_scorePopups.splice(i, 1);
    }
  }
}

function updatePlayerTrails() {
  for (let i = v_playerTrails.length - 1; i >= 0; i--) {
    const trail = v_playerTrails[i];

    trail.y += 0.45;
    trail.life--;

    if (trail.life <= 0) {
      v_playerTrails.splice(i, 1);
    }
  }
}

function spawnParticles(x, y, color, count = 12) {
  for (let i = 0; i < count; i++) {
    v_particles.push({
      x,
      y,
      vx: rand(-2.7, 2.7),
      vy: rand(-2.9, 2.2),
      size: rand(2, 5),
      color,
      life: Math.floor(rand(18, 40)),
      maxLife: 40,
      gravity: rand(0.01, 0.045)
    });
  }
}

function checkEnemyAdvance() {
  for (let i = 0; i < v_enemies.length; i++) {
    const e = v_enemies[i];

    if (e.y > 550) {
      lives--;
      updateUI();
      playSound("death");
      screenShake();

      v_bullets.length = 0;
      v_enemyBullets.length = 0;

      v_invuln = 70;

      if (lives <= 0) {
        showGameOver(false);
      } else {
        v_enemies.forEach(en => {
          en.y -= 100;
        });
      }

      break;
    }
  }
}

function checkWaveClear() {
  if (v_enemies.length !== 0) return;

  if (!v_boss && !v_bossDefeatedThisWave) {
    spawnBoss();
    return;
  }

  if (!v_boss && v_bossDefeatedThisWave) {
    addScore(1000 + (v_level * 160), GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60, "WAVE CLEAR");
    playSound("win");

    v_level++;
    runStats.highestWave = Math.max(runStats.highestWave, v_level);
    checkTrophies();
    v_bossDefeatedThisWave = false;
    v_waveBannerTimer = 105;
    v_waveBannerText = `WAVE ${v_level}`;

    spawnInvaders();
  }
}

function updateInvaders() {
  if (gameState !== "playing" || isGameOver) return;
  if (v_isPaused) {
    updateParticles();
    updateScorePopups();
    return;
  }

  if (v_invuln > 0) v_invuln--;
  if (v_waveBannerTimer > 0) v_waveBannerTimer--;
  if (v_bossWarningTimer > 0) v_bossWarningTimer--;
  if (v_powerUpDropCooldown > 0) v_powerUpDropCooldown--;
  if (v_comboTimer > 0) {
    v_comboTimer--;
  } else {
    v_combo = 0;
  }

  gameFrame++;

  updatePowerUpTimers();
  v_enemies.forEach(enemy => {
    if (enemy.hitFlash > 0) enemy.hitFlash--;
  });
  if (v_boss && v_boss.hitFlash > 0) v_boss.hitFlash--;
  updatePlayer();
  updatePlayerBullets();
  updateEnemyMovement();
  updateBoss();
  updateEnemyShooting();
  updateEnemyBullets();
  updatePowerUps();
  updateParticles();
  updateScorePopups();
  updatePlayerTrails();
  checkEnemyAdvance();
  checkWaveClear();
}

// -------------------- Drawing Helpers --------------------

function drawRoundedRect(x, y, w, h, r) {
  const radius = Math.min(r, w * 0.5, h * 0.5);

  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawBackgroundGradient() {
  const grad = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
  grad.addColorStop(0, "#05030b");
  grad.addColorStop(0.45, "#090713");
  grad.addColorStop(1, "#020204");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
}

function drawBackgroundImage() {
  if (!backgroundImageReady) return false;

  const imageRatio = backgroundImage.width / backgroundImage.height;
  const canvasRatio = GAME_WIDTH / GAME_HEIGHT;
  let drawWidth = GAME_WIDTH;
  let drawHeight = GAME_HEIGHT;
  let drawX = 0;
  let drawY = 0;

  if (imageRatio > canvasRatio) {
    drawHeight = GAME_HEIGHT;
    drawWidth = drawHeight * imageRatio;
    drawX = (GAME_WIDTH - drawWidth) / 2;
  } else {
    drawWidth = GAME_WIDTH;
    drawHeight = drawWidth / imageRatio;
    drawY = (GAME_HEIGHT - drawHeight) / 2;
  }

  ctx.drawImage(backgroundImage, drawX, drawY, drawWidth, drawHeight);

  const fade = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
  fade.addColorStop(0, "rgba(0, 0, 0, .18)");
  fade.addColorStop(0.48, "rgba(0, 0, 0, .08)");
  fade.addColorStop(1, "rgba(0, 0, 0, .42)");
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  return true;
}

function drawScreenTreatment() {
  const vignette = ctx.createRadialGradient(
    GAME_WIDTH / 2,
    GAME_HEIGHT / 2,
    120,
    GAME_WIDTH / 2,
    GAME_HEIGHT / 2,
    420
  );
  vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
  vignette.addColorStop(1, "rgba(0, 0, 0, .52)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  ctx.globalAlpha = 0.08;
  ctx.fillStyle = "#ffffff";
  for (let y = 0; y < GAME_HEIGHT; y += 4) {
    ctx.fillRect(0, y, GAME_WIDTH, 1);
  }
  ctx.globalAlpha = 1;
}

function drawNebula() {
  bgNebula.forEach((n, i) => {
    const driftX = Math.sin((gameFrame * 0.002) + i) * 12;
    const driftY = Math.cos((gameFrame * 0.0016) + i) * 10;

    const g = ctx.createRadialGradient(
      n.x + driftX,
      n.y + driftY,
      0,
      n.x + driftX,
      n.y + driftY,
      n.r
    );

    g.addColorStop(0, `rgba(${n.color}, ${n.alpha})`);
    g.addColorStop(0.45, `rgba(${n.color}, ${n.alpha * 0.45})`);
    g.addColorStop(1, `rgba(${n.color}, 0)`);

    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(n.x + driftX, n.y + driftY, n.r, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawStarLayer(stars, driftMultiplier) {
  stars.forEach((s, i) => {
    const twinkle = 0.65 + Math.sin(gameFrame * s.twinkleSpeed + s.twinkleOffset) * 0.35;
    const driftY = ((gameFrame * driftMultiplier) + (i * 7)) % (GAME_HEIGHT + 20);
    let y = s.y + driftY * 0.02;

    if (y > GAME_HEIGHT + 10) y -= GAME_HEIGHT + 20;

    ctx.globalAlpha = s.alpha * twinkle;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(s.x, y, s.size, s.size);
  });

  ctx.globalAlpha = 1;
}

function drawGlowStars() {
  bgStarsNear.forEach(s => {
    const twinkle = 0.7 + Math.sin(gameFrame * s.twinkleSpeed + s.twinkleOffset) * 0.3;

    ctx.globalAlpha = s.alpha * 0.18 * twinkle;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.glow, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = s.alpha * twinkle;
    ctx.fillRect(s.x - s.size / 2, s.y - s.size / 2, s.size, s.size);

    ctx.globalAlpha = s.alpha * 0.35 * twinkle;
    ctx.fillRect(s.x - 0.5, s.y - 4, 1, 8);
    ctx.fillRect(s.x - 4, s.y - 0.5, 8, 1);
  });

  ctx.globalAlpha = 1;
}

function drawStars() {
  if (!drawBackgroundImage()) {
    drawBackgroundGradient();
    drawNebula();
  }

  drawStarLayer(bgStarsFar, 0.05);
  drawStarLayer(bgStarsMid, 0.12);
  drawGlowStars();
  drawScreenTreatment();
}

function drawPlayer() {
  const flicker = v_invuln > 0 && (v_invuln % 10) < 5;

  if (flicker) {
    ctx.globalAlpha = 0.35;
  }

  ctx.save();
  ctx.translate(v_player.x, v_player.y);

  const moving = isLeftPressed() || isRightPressed();
  const firing = isFirePressed();

  if (activePowerUps.shield > 0) {
    const shieldPulse = 0.65 + Math.sin(gameFrame * 0.14) * 0.25;

    ctx.globalAlpha = 0.32 * shieldPulse;
    ctx.strokeStyle = "#7df9ff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, -1, 29, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = flicker ? 0.35 : 1;
  }

  const flameHeight = firing || moving ? 20 + Math.sin(gameFrame * 0.5) * 4 : 12;

  ctx.fillStyle = "#ff9f1c";
  ctx.beginPath();
  ctx.moveTo(-7, 15);
  ctx.lineTo(0, 15 + flameHeight);
  ctx.lineTo(7, 15);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#ff2e63";
  ctx.beginPath();
  ctx.moveTo(-4, 15);
  ctx.lineTo(0, 15 + flameHeight * 0.62);
  ctx.lineTo(4, 15);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#d7e7ff";
  ctx.beginPath();
  ctx.moveTo(0, -26);
  ctx.lineTo(17, 16);
  ctx.lineTo(7, 10);
  ctx.lineTo(-7, 10);
  ctx.lineTo(-17, 16);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#5a6bff";
  ctx.beginPath();
  ctx.moveTo(0, -21);
  ctx.lineTo(8, 7);
  ctx.lineTo(0, 13);
  ctx.lineTo(-8, 7);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#101018";
  ctx.beginPath();
  ctx.ellipse(0, -8, 6, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#7df9ff";
  ctx.beginPath();
  ctx.ellipse(0, -10, 3.5, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ff4d7a";
  ctx.fillRect(-18, 6, 6, 13);
  ctx.fillRect(12, 6, 6, 13);

  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawPlayerTrails() {
  v_playerTrails.forEach(trail => {
    const alpha = clamp(trail.life / trail.maxLife, 0, 1);

    ctx.globalAlpha = alpha * 0.38;
    ctx.fillStyle = "#7df9ff";
    ctx.beginPath();
    ctx.ellipse(trail.x, trail.y, trail.size * 0.55, trail.size, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.globalAlpha = 1;
}

function drawEnemy(enemy) {
  const bob = Math.sin((gameFrame * 0.08) + enemy.animOffset) * 2.2;
  const x = enemy.x;
  const y = enemy.y + bob;

  ctx.save();
  ctx.translate(x, y);

  if (enemy.hp < enemy.maxHp) {
    ctx.globalAlpha = 0.75 + Math.sin(gameFrame * 0.4) * 0.18;
  }

  if (enemy.hitFlash > 0) {
    ctx.shadowColor = "#ffffff";
    ctx.shadowBlur = 16;
  }

  if (enemy.type === "orb") {
    drawOrbEnemy();
  } else if (enemy.type === "squid") {
    drawSquidEnemy();
  } else {
    drawCrawlerEnemy();
  }

  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;

  if (enemy.maxHp > 1) {
    drawEnemyHealthBar(enemy);
  }

  if (enemy.armored) {
    ctx.strokeStyle = "rgba(255, 255, 255, .45)";
    ctx.lineWidth = 1;
    ctx.strokeRect(-18, -20, 36, 40);
  }

  ctx.restore();
}

function drawEnemyHealthBar(enemy) {
  const pct = clamp(enemy.hp / enemy.maxHp, 0, 1);

  ctx.fillStyle = "rgba(0, 0, 0, .65)";
  ctx.fillRect(-15, 21, 30, 4);

  ctx.fillStyle = enemy.type === "crawler" ? "#77ff77" : "#ff4d7a";
  ctx.fillRect(-15, 21, 30 * pct, 4);
}

function drawOrbEnemy() {
  ctx.fillStyle = "#5a0010";
  ctx.beginPath();
  ctx.arc(0, 0, 15, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#ff4d7a";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 13, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#f4d8df";
  ctx.beginPath();
  ctx.ellipse(0, 0, 10, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ff2e63";
  ctx.beginPath();
  ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#120008";
  ctx.beginPath();
  ctx.arc(0, 0, 2.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#c21f49";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-16, -4);
  ctx.lineTo(-21, -8);
  ctx.moveTo(-16, 4);
  ctx.lineTo(-21, 8);
  ctx.moveTo(16, -4);
  ctx.lineTo(21, -8);
  ctx.moveTo(16, 4);
  ctx.lineTo(21, 8);
  ctx.stroke();
}

function drawSquidEnemy() {
  ctx.fillStyle = "#32104d";
  ctx.beginPath();
  ctx.moveTo(-13, -2);
  ctx.quadraticCurveTo(-10, -16, 0, -16);
  ctx.quadraticCurveTo(10, -16, 13, -2);
  ctx.lineTo(13, 7);
  ctx.quadraticCurveTo(0, 14, -13, 7);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#c48cff";
  ctx.fillRect(-8, -7, 4, 4);
  ctx.fillRect(4, -7, 4, 4);

  ctx.fillStyle = "#ff87c5";
  ctx.fillRect(-4, 1, 8, 2);

  ctx.strokeStyle = "#a45df0";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-8, 8);
  ctx.lineTo(-10, 16);
  ctx.moveTo(-3, 8);
  ctx.lineTo(-4, 18);
  ctx.moveTo(3, 8);
  ctx.lineTo(4, 18);
  ctx.moveTo(8, 8);
  ctx.lineTo(10, 16);
  ctx.stroke();
}

function drawCrawlerEnemy() {
  ctx.fillStyle = "#113d1b";
  drawRoundedRect(-14, -12, 28, 22, 6);
  ctx.fill();

  ctx.fillStyle = "#0a0a0a";
  ctx.beginPath();
  ctx.arc(-6, -3, 4, 0, Math.PI * 2);
  ctx.arc(6, -3, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#77ff77";
  ctx.beginPath();
  ctx.arc(-6, -3, 2, 0, Math.PI * 2);
  ctx.arc(6, -3, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#9fffa6";
  ctx.fillRect(-7, 5, 14, 3);
  ctx.fillStyle = "#113d1b";
  ctx.fillRect(-4, 5, 2, 3);
  ctx.fillRect(-1, 5, 2, 3);
  ctx.fillRect(2, 5, 2, 3);

  ctx.fillStyle = "#4ed46a";
  ctx.beginPath();
  ctx.moveTo(-9, -12);
  ctx.lineTo(-6, -18);
  ctx.lineTo(-3, -12);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(3, -12);
  ctx.lineTo(6, -18);
  ctx.lineTo(9, -12);
  ctx.closePath();
  ctx.fill();
}

function drawMawBoss(pulse, rageColor) {
  ctx.fillStyle = "#16071f";
  ctx.beginPath();
  ctx.ellipse(0, 0, 58, 34 + pulse * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = rageColor;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(0, 0, 58, 34 + pulse * 0.3, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#050505";
  ctx.beginPath();
  ctx.arc(-22, -6, 13, 0, Math.PI * 2);
  ctx.arc(22, -6, 13, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = rageColor;
  ctx.beginPath();
  ctx.arc(-22, -6, 6, 0, Math.PI * 2);
  ctx.arc(22, -6, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffdddd";
  ctx.beginPath();
  ctx.moveTo(-25, 13);
  ctx.lineTo(-15, 24);
  ctx.lineTo(-5, 13);
  ctx.lineTo(5, 24);
  ctx.lineTo(15, 13);
  ctx.lineTo(25, 24);
  ctx.lineTo(31, 13);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#7df9ff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-48, 0);
  ctx.lineTo(-76, -18);
  ctx.moveTo(-46, 12);
  ctx.lineTo(-78, 20);
  ctx.moveTo(48, 0);
  ctx.lineTo(76, -18);
  ctx.moveTo(46, 12);
  ctx.lineTo(78, 20);
  ctx.stroke();
}

function drawNeedleBoss(pulse, rageColor) {
  ctx.fillStyle = "#071f22";
  ctx.beginPath();
  ctx.moveTo(0, -46 - pulse);
  ctx.lineTo(34, -10);
  ctx.lineTo(18, 36 + pulse);
  ctx.lineTo(0, 22);
  ctx.lineTo(-18, 36 + pulse);
  ctx.lineTo(-34, -10);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = rageColor;
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = "#050505";
  ctx.fillRect(-19, -13, 14, 12);
  ctx.fillRect(5, -13, 14, 12);

  ctx.fillStyle = rageColor;
  ctx.fillRect(-14, -9, 5, 5);
  ctx.fillRect(9, -9, 5, 5);

  ctx.strokeStyle = rageColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-32, 2);
  ctx.lineTo(-62, 28);
  ctx.moveTo(32, 2);
  ctx.lineTo(62, 28);
  ctx.moveTo(0, 24);
  ctx.lineTo(0, 58);
  ctx.stroke();
}

function drawForgeBoss(pulse, rageColor) {
  ctx.fillStyle = "#241907";
  drawRoundedRect(-64, -28, 128, 56 + pulse * 0.4, 8);
  ctx.fill();

  ctx.strokeStyle = rageColor;
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = "rgba(255, 230, 109, .28)";
  ctx.fillRect(-48, -12, 96, 24);

  ctx.fillStyle = "#050505";
  ctx.fillRect(-42, -18, 19, 17);
  ctx.fillRect(23, -18, 19, 17);

  ctx.fillStyle = rageColor;
  ctx.fillRect(-36, -12, 7, 7);
  ctx.fillRect(29, -12, 7, 7);

  ctx.fillStyle = "#ffdddd";
  for (let x = -42; x <= 42; x += 21) {
    ctx.beginPath();
    ctx.moveTo(x - 7, 16);
    ctx.lineTo(x, 28 + pulse * 0.4);
    ctx.lineTo(x + 7, 16);
    ctx.closePath();
    ctx.fill();
  }
}

function drawMirrorBoss(pulse, rageColor) {
  ctx.fillStyle = "#1a0d2b";
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = Math.PI / 6 + i * Math.PI / 3;
    const radius = 48 + pulse * 0.4;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = rageColor;
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = "rgba(196, 140, 255, .24)";
  ctx.beginPath();
  ctx.arc(0, 0, 26 + pulse * 0.25, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#050505";
  ctx.beginPath();
  ctx.arc(0, 0, 17, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = rageColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-46, 0);
  ctx.lineTo(46, 0);
  ctx.moveTo(0, -46);
  ctx.lineTo(0, 46);
  ctx.moveTo(-31, -31);
  ctx.lineTo(31, 31);
  ctx.moveTo(31, -31);
  ctx.lineTo(-31, 31);
  ctx.stroke();
}

function drawBoss() {
  if (!v_boss) return;

  const pulse = Math.sin(gameFrame * 0.08 + v_boss.animOffset) * 3;
  const hurtPulse = v_boss.hp < v_boss.maxHp ? Math.sin(gameFrame * 0.35) * 0.12 : 0;
  const rageColor = v_boss.rage ? v_boss.variant.rageColor : v_boss.variant.color;

  ctx.save();
  ctx.translate(v_boss.x, v_boss.y);

  if (v_boss.hitFlash > 0) {
    ctx.shadowColor = "#ffffff";
    ctx.shadowBlur = 22;
  }

  ctx.globalAlpha = 0.2 + hurtPulse;
  ctx.fillStyle = rageColor;
  ctx.beginPath();
  ctx.arc(0, 0, 76 + pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  if (v_boss.variant.id === "needle") {
    drawNeedleBoss(pulse, rageColor);
  } else if (v_boss.variant.id === "forge") {
    drawForgeBoss(pulse, rageColor);
  } else if (v_boss.variant.id === "mirror") {
    drawMirrorBoss(pulse, rageColor);
  } else {
    drawMawBoss(pulse, rageColor);
  }

  drawBossHealthBar();

  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawBossHealthBar() {
  const pct = clamp(v_boss.hp / v_boss.maxHp, 0, 1);

  ctx.fillStyle = "rgba(0, 0, 0, .72)";
  ctx.fillRect(-62, -55, 124, 9);

  ctx.fillStyle = v_boss.rage ? v_boss.variant.rageColor : v_boss.variant.color;
  ctx.fillRect(-62, -55, 124 * pct, 9);

  ctx.strokeStyle = "rgba(255, 255, 255, .45)";
  ctx.lineWidth = 1;
  ctx.strokeRect(-62, -55, 124, 9);

  ctx.fillStyle = "#ffffff";
  ctx.font = "16px VT323";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(v_boss.variant.name, 0, -67);
}

function drawBullets() {
  v_bullets.forEach(b => {
    ctx.fillStyle = activePowerUps.doubleShot > 0 ? "#77ff77" : "#0f0";
    ctx.fillRect(b.x - 2, b.y - 7, 4, 13);

    ctx.globalAlpha = 0.35;
    ctx.fillRect(b.x - 4, b.y - 10, 8, 18);
    ctx.globalAlpha = 1;
  });

  v_enemyBullets.forEach(b => {
    if (b.type === "aimed") ctx.fillStyle = "#ff4d7a";
    else if (b.type === "spread") ctx.fillStyle = "#c48cff";
    else ctx.fillStyle = "#ffe66d";

    const size = b.type === "heavy" ? 6 : 4;
    ctx.fillRect(b.x - size / 2, b.y - 6, size, 12);
  });
}

function drawPowerUps() {
  v_powerUps.forEach(p => {
    const data = POWER_UP_TYPES[p.type];
    const pulse = 1 + Math.sin(p.pulse) * 0.12;

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(pulse, pulse);

    ctx.globalAlpha = 0.22;
    ctx.fillStyle = data.color;
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.strokeStyle = data.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "#050505";
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = data.color;
    ctx.font = "20px VT323";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(data.label, 0, 1);

    ctx.restore();
  });
}

function drawParticles() {
  v_particles.forEach(p => {
    const alpha = clamp(p.life / p.maxLife, 0, 1);

    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  });

  ctx.globalAlpha = 1;
}

function drawScorePopups() {
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  v_scorePopups.forEach(p => {
    const alpha = clamp(p.life / p.maxLife, 0, 1);

    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.font = p.text.length > 10 ? "18px VT323" : "22px VT323";
    ctx.fillText(p.text, p.x, p.y);
  });

  ctx.globalAlpha = 1;
}

function drawWaveLabel() {
  ctx.fillStyle = "#666";
  ctx.font = "20px VT323";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillText("WAVE: " + v_level, GAME_WIDTH - 24, 30);
}

function drawPowerUpStatus() {
  const items = [];

  if (activePowerUps.doubleShot > 0) {
    items.push(`DOUBLE ${Math.ceil(activePowerUps.doubleShot / 60)}`);
  }

  if (activePowerUps.rapidFire > 0) {
    items.push(`RAPID ${Math.ceil(activePowerUps.rapidFire / 60)}`);
  }

  if (activePowerUps.shield > 0) {
    items.push(`SHIELD ${Math.ceil(activePowerUps.shield / 60)}`);
  }

  if (!items.length) return;

  ctx.font = "18px VT323";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#77ff77";
  ctx.fillText(items.join("   "), 18, GAME_HEIGHT - 20);
}

function drawComboStatus() {
  if (v_combo <= 1 || v_comboTimer <= 0) return;

  const pct = clamp(v_comboTimer / 140, 0, 1);
  const text = `CHAIN x${v_combo}`;

  ctx.font = "22px VT323";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffe66d";
  ctx.fillText(text, GAME_WIDTH - 18, GAME_HEIGHT - 22);

  ctx.fillStyle = "rgba(255, 230, 109, .25)";
  ctx.fillRect(GAME_WIDTH - 112, GAME_HEIGHT - 10, 94, 4);
  ctx.fillStyle = "#ffe66d";
  ctx.fillRect(GAME_WIDTH - 112, GAME_HEIGHT - 10, 94 * pct, 4);
}

function drawWaveBanner() {
  if (v_waveBannerTimer <= 0) return;

  const alpha = clamp(v_waveBannerTimer / 35, 0, 1);

  ctx.globalAlpha = alpha;
  ctx.fillStyle = "rgba(0, 0, 0, .45)";
  ctx.fillRect(0, GAME_HEIGHT / 2 - 48, GAME_WIDTH, 96);

  ctx.fillStyle = "#ffffff";
  ctx.font = "54px VT323";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(v_waveBannerText, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 6);

  ctx.fillStyle = "#ff4d7a";
  ctx.font = "23px VT323";

  let sub = "VOID SWARM APPROACHING";

  if (v_boss) sub = `BREAK ${v_boss.variant.name}`;
  else if (v_level >= 8) sub = "THE VOID IS SPEEDING UP";
  else if (v_level >= 5) sub = "ORBS AIM, CRAWLERS HIT HARD";
  else if (v_level >= 3) sub = "SQUIDS FIRE SPREAD SHOTS";

  ctx.fillText(sub, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 32);
  ctx.globalAlpha = 1;
}

function drawBossWarning() {
  if (v_bossWarningTimer <= 0 || !v_boss) return;

  const alpha = 0.45 + Math.sin(gameFrame * 0.28) * 0.25;

  ctx.globalAlpha = alpha;
  ctx.fillStyle = "#ff4d7a";
  ctx.fillRect(0, 0, GAME_WIDTH, 5);
  ctx.fillRect(0, GAME_HEIGHT - 5, GAME_WIDTH, 5);

  ctx.font = "24px VT323";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`WARNING: ${v_boss.variant.name} DETECTED`, GAME_WIDTH / 2, 78);
  ctx.globalAlpha = 1;
}

function drawPauseOverlay() {
  if (!v_isPaused || gameState !== "playing") return;

  ctx.fillStyle = "rgba(0, 0, 0, .58)";
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  ctx.fillStyle = "#ffffff";
  ctx.font = "58px VT323";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("PAUSED", GAME_WIDTH / 2, GAME_HEIGHT / 2 - 10);

  ctx.fillStyle = "#7df9ff";
  ctx.font = "22px VT323";
  ctx.fillText("PRESS P TO RETURN", GAME_WIDTH / 2, GAME_HEIGHT / 2 + 34);
}

function drawInvaders() {
  drawStars();

  if (gameState === "playing" || gameState === "gameover") {
    drawPlayerTrails();
    drawPlayer();
    v_enemies.forEach(drawEnemy);
    drawBoss();
    drawBullets();
    drawPowerUps();
    drawParticles();
    drawScorePopups();
    drawWaveLabel();
    drawPowerUpStatus();
    drawComboStatus();
    drawBossWarning();
    drawWaveBanner();
    drawPauseOverlay();
  }
}

// -------------------- Engine + Inputs --------------------

function tick() {
  if (!isGameOver) {
    updateInvaders();
  } else {
    gameFrame++;
    updateParticles();
    updateScorePopups();
    updatePlayerTrails();
  }

  drawInvaders();
  requestAnimationFrame(tick);
}

window.addEventListener("keydown", (e) => {
  if (["ArrowLeft", "ArrowRight", " "].includes(e.key)) {
    e.preventDefault();
  }

  if (gameState === "title" && (e.key === "Enter" || e.key === " ")) {
    initAudio();
    initInvaders();
    return;
  }

  if (gameState === "playing" && e.key === "Escape") {
    showTitleScreen();
    return;
  }

  initAudio();
  keys[e.key] = true;

  if ((e.key === "p" || e.key === "P") && gameState === "playing") {
    v_isPaused = !v_isPaused;
    mobileInput.left = false;
    mobileInput.right = false;
    mobileInput.fire = false;
    updateMobileControlVisibility();
    return;
  }

  if ((e.key === "r" || e.key === "R") && gameState !== "title") {
    initInvaders();
  }
});

window.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

restartBtn.addEventListener("click", () => {
  initAudio();
  initInvaders();
});

menuBtn.addEventListener("click", () => {
  showTitleScreen();
});

playAgainBtn.addEventListener("click", () => {
  initAudio();
  initInvaders();
});

backTitleBtn.addEventListener("click", () => {
  showTitleScreen();
});

startGameBtn.addEventListener("click", () => {
  initAudio();
  initInvaders();
});

soundToggleBtn.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  soundToggleBtn.textContent = soundEnabled ? "Sound: On" : "Sound: Off";

  if (soundEnabled) {
    initAudio();
    playSound("power");
  }
});

controlsToggleBtn.addEventListener("click", () => {
  controlsCard.hidden = !controlsCard.hidden;
  if (!controlsCard.hidden && trophiesCard) trophiesCard.hidden = true;
});

trophiesToggleBtn.addEventListener("click", () => {
  trophiesCard.hidden = !trophiesCard.hidden;
  if (!trophiesCard.hidden) {
    controlsCard.hidden = true;
    renderTrophies();
  }
});

window.addEventListener("resize", updateMobileControlVisibility);

window.addEventListener("orientationchange", () => {
  setTimeout(updateMobileControlVisibility, 250);
});

updateHighScoreUI();
initBackground();
closeOverlay();
showTitleScreen();
tick();
