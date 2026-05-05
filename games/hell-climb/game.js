// Hell Climb (standalone) - Difficulty Curve v2 + Daily Run + Guaranteed Variety
// Reachability patch: horizontal distance now depends on vertical gap.

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const heightEl = document.getElementById("height");
const bestEl = document.getElementById("best");
const restartBtn = document.getElementById("restart");

const modeBtn = document.getElementById("modeBtn");
const modeBadge = document.getElementById("modeBadge");
const dailyDateEl = document.getElementById("dailyDate");
const trophyBtn = document.getElementById("trophyBtn");
const trophyCountEl = document.getElementById("trophyCount");
const pauseBtn = document.getElementById("pauseBtn");
const muteBtn = document.getElementById("muteBtn");

const mainMenu = document.getElementById("mainMenu");
const playBtn = document.getElementById("playBtn");
const menuModeBtn = document.getElementById("menuModeBtn");
const menuTrophyBtn = document.getElementById("menuTrophyBtn");
const menuMuteBtn = document.getElementById("menuMuteBtn");
const volumeSlider = document.getElementById("volumeSlider");
const menuClassicBestEl = document.getElementById("menuClassicBest");
const menuDailyBestEl = document.getElementById("menuDailyBest");

const pauseOverlay = document.getElementById("pauseOverlay");
const resumeBtn = document.getElementById("resumeBtn");
const pauseMenuBtn = document.getElementById("pauseMenuBtn");

const overlay = document.getElementById("overlay");
const finalEl = document.getElementById("final");
const resultLineEl = document.getElementById("resultLine");
const playAgainBtn = document.getElementById("playAgain");

const trophyOverlay = document.getElementById("trophyOverlay");
const trophyListEl = document.getElementById("trophyList");
const trophyProgressEl = document.getElementById("trophyProgress");
const closeTrophiesBtn = document.getElementById("closeTrophies");
const trophyToastEl = document.getElementById("trophyToast");

let keys = {};
let gameTime = 0;
let animationId = null;

let score = 0;
let isGameOver = false;
let isMainMenu = true;
let isPaused = false;

// -------------------- Tuning --------------------
const MOVE_SPEED = 5;
const JUMP_FORCE = 9;
const GRAVITY = 0.25;

const PLATFORM_W = 60;
const PLATFORM_H = 20;

// Route safety: keep required jumps comfortably reachable.
// The canvas wraps, but the generator does NOT rely on edge-wrap jumps for fairness.
const MAX_ROUTE_DX = 185;
const MOVING_PLATFORM_RANGE = 52;
const MIN_BRIDGE_GAP = 34;

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

// Jump height estimate (for safe gap caps)
function maxJumpHeightPx() {
  return (JUMP_FORCE * JUMP_FORCE) / (2 * GRAVITY);
}
const SAFE_GAP = Math.min(120, Math.floor(maxJumpHeightPx() * 0.62));

// Horizontal reach depends on how close the gap is to max jump height.
// If the platform is near the apex, you have fewer frames to drift.
function timeToReachOnDescent(deltaUpPx) {
  // deltaUpPx is how far UP the next platform is from the last one (positive).
  // Solve: 0.5*g*t^2 - J*t + delta = 0
  // Descending solution: t = (J + sqrt(J^2 - 2*g*delta)) / g
  const disc = (JUMP_FORCE * JUMP_FORCE) - (2 * GRAVITY * deltaUpPx);
  if (disc <= 0) return JUMP_FORCE / GRAVITY; // at/near apex: ~36 frames
  return (JUMP_FORCE + Math.sqrt(disc)) / GRAVITY;
}

function dxCapForGap(deltaUpPx) {
  // Conservative cap; keep a real margin for human reaction, platform width,
  // and moving-platform drift. The old cap was too generous and could create
  // jumps that were technically possible only with perfect timing or edge-wrap.
  const t = timeToReachOnDescent(deltaUpPx);
  const raw = MOVE_SPEED * t * 0.62;
  return clamp(raw, 78, MAX_ROUTE_DX);
}

// -------------------- Modes / Bests --------------------
const MODE_KEY = "hellclimb_mode";
let mode = localStorage.getItem(MODE_KEY) || "classic"; // "classic" | "daily"

function pad2(n) { return String(n).padStart(2, "0"); }
function todayLocalStr() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function classicBestKey() { return "hellclimb_best_classic"; }
function dailyBestKey(dateStr) { return `hellclimb_best_daily_${dateStr}`; }
function getClassicBest() { return Number(localStorage.getItem(classicBestKey()) || 0); }
function getDailyBest() { return Number(localStorage.getItem(dailyBestKey(todayLocalStr())) || 0); }

function getBestForMode() {
  if (mode === "daily") return getDailyBest();
  return getClassicBest();
}
function setBestForMode(val) {
  if (mode === "daily") localStorage.setItem(dailyBestKey(todayLocalStr()), String(val));
  else localStorage.setItem(classicBestKey(), String(val));
}

let best = getBestForMode();
bestEl.textContent = String(best);

function updateModeUI() {
  if (mode === "daily") {
    modeBadge.textContent = "DAILY";
    dailyDateEl.hidden = false;
    dailyDateEl.textContent = todayLocalStr();
  } else {
    modeBadge.textContent = "CLASSIC";
    dailyDateEl.hidden = true;
  }
  best = getBestForMode();
  bestEl.textContent = String(best);
  menuModeBtn.textContent = `Mode: ${mode === "daily" ? "Daily" : "Classic"}`;
  updateMenuStats();
}
updateModeUI();

function updateMenuStats() {
  menuClassicBestEl.textContent = String(getClassicBest());
  menuDailyBestEl.textContent = String(getDailyBest());
}

// -------------------- Trophies --------------------
const TROPHY_KEY = "hellclimb_trophies_v2";
const TROPHIES = [
  { id: "ash_boots", name: "Ash Boots", desc: "Reach height 100." },
  { id: "pit_scout", name: "Pit Scout", desc: "Reach height 250." },
  { id: "furnace_bound", name: "Furnace Bound", desc: "Reach height 600." },
  { id: "void_touched", name: "Void Touched", desc: "Reach height 1200." },
  { id: "chain_rhythm", name: "Chain Rhythm", desc: "Land 25 bounces in one run." },
  { id: "relentless_spirit", name: "Relentless Spirit", desc: "Land 75 bounces in one run." },
  { id: "bone_harvester", name: "Bone Harvester", desc: "Break 5 crumbling platforms in one run." },
  { id: "mist_rider", name: "Mist Rider", desc: "Bounce on 10 moving platforms in one run." },
  { id: "winged_escape", name: "Winged Escape", desc: "Collect Bone Wings." },
  { id: "shielded_soul", name: "Shielded Soul", desc: "Collect an Infernal Shield." },
  { id: "lantern_bearer", name: "Lantern Bearer", desc: "Collect a Soul Lantern." },
  { id: "hazard_ghost", name: "Hazard Ghost", desc: "Dodge 3 hazards in one run." },
];

let earnedTrophies = loadEarnedTrophies();
let trophyToastTimer = null;
let trophyToastQueue = [];
let trophyReturnFocus = trophyBtn;
let runStats = makeRunStats();

function makeRunStats() {
  return {
    jumps: 0,
    breakBounces: 0,
    movingBounces: 0,
    hazardsDodged: 0,
    nearFallArmed: false,
  };
}

function loadEarnedTrophies() {
  try {
    const raw = JSON.parse(localStorage.getItem(TROPHY_KEY) || "[]");
    if (Array.isArray(raw)) {
      const validIds = new Set(TROPHIES.map((trophy) => trophy.id));
      return new Set(raw.filter((id) => validIds.has(id)));
    }
  } catch (err) {
    // Ignore bad local data and rebuild from fresh progress.
  }

  return new Set();
}

function saveEarnedTrophies() {
  localStorage.setItem(TROPHY_KEY, JSON.stringify([...earnedTrophies]));
}

function trophyById(id) {
  return TROPHIES.find((trophy) => trophy.id === id);
}

function unlockTrophy(id) {
  if (earnedTrophies.has(id)) return;

  const trophy = trophyById(id);
  if (!trophy) return;

  earnedTrophies.add(id);
  saveEarnedTrophies();
  updateTrophyUI();
  queueTrophyToast(trophy);
}

function checkHeightTrophies() {
  if (score >= 100) unlockTrophy("ash_boots");
  if (score >= 250) unlockTrophy("pit_scout");
  if (score >= 600) unlockTrophy("furnace_bound");
  if (score >= 1200) unlockTrophy("void_touched");
}

function recordPlatformBounce(platform) {
  runStats.jumps++;

  if (runStats.jumps >= 25) unlockTrophy("chain_rhythm");
  if (runStats.jumps >= 75) unlockTrophy("relentless_spirit");
  if (platform.type === "break") {
    runStats.breakBounces++;
    if (runStats.breakBounces >= 5) unlockTrophy("bone_harvester");
  }
  if (platform.type === "moving") {
    runStats.movingBounces++;
    if (runStats.movingBounces >= 10) unlockTrophy("mist_rider");
  }

  runStats.nearFallArmed = false;
}

function recordPowerupTrophy(type) {
  if (type === "wings") unlockTrophy("winged_escape");
  if (type === "shield") unlockTrophy("shielded_soul");
  if (type === "lantern") unlockTrophy("lantern_bearer");
}

function recordHazardDodged() {
  runStats.hazardsDodged++;
  if (runStats.hazardsDodged >= 3) unlockTrophy("hazard_ghost");
}

function queueTrophyToast(trophy) {
  trophyToastQueue.push(trophy);
  if (!trophyToastTimer) showNextTrophyToast();
}

function showNextTrophyToast() {
  const trophy = trophyToastQueue.shift();
  if (!trophy) {
    trophyToastTimer = null;
    trophyToastEl.hidden = true;
    return;
  }

  trophyToastEl.innerHTML = `
    <div class="trophy-toast-kicker">TROPHY EARNED</div>
    <div class="trophy-toast-name">${trophy.name}</div>
  `;
  trophyToastEl.hidden = false;

  trophyToastTimer = setTimeout(() => {
    trophyToastEl.hidden = true;
    trophyToastTimer = setTimeout(showNextTrophyToast, 180);
  }, 2200);
}

function updateTrophyUI() {
  const earned = earnedTrophies.size;
  const total = TROPHIES.length;
  trophyCountEl.textContent = `${earned}/${total}`;
  trophyProgressEl.textContent = `${earned}/${total} earned`;

  trophyListEl.innerHTML = TROPHIES
    .map((trophy) => {
      const unlocked = earnedTrophies.has(trophy.id);
      return `
        <div class="trophy-card ${unlocked ? "earned" : "locked"}">
          <div class="trophy-medal"><span class="trophy-cup"></span></div>
          <div>
            <div class="trophy-name">${trophy.name}</div>
            <div class="trophy-desc">${trophy.desc}</div>
          </div>
        </div>
      `;
    })
    .join("");
}

function openTrophies(returnFocusEl = trophyBtn) {
  trophyReturnFocus = returnFocusEl;
  updateTrophyUI();
  trophyOverlay.hidden = false;
  updateControlUI();
  setTimeout(() => closeTrophiesBtn.focus(), 0);
}

function closeTrophies() {
  trophyOverlay.hidden = true;
  keys = {};
  updateControlUI();
  trophyReturnFocus.focus();
}

updateTrophyUI();

// -------------------- Seeded RNG (Daily) --------------------
function xmur3(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function() {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

function mulberry32(seed) {
  return function() {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeDailyRng() {
  const dateStr = todayLocalStr();
  const seedFn = xmur3("HELLCLIMB:" + dateStr);
  const seed = seedFn();
  return mulberry32(seed);
}

function randRangeRng(rng, a, b) { return a + rng() * (b - a); }

// -------------------- Difficulty Curve (v2) --------------------
function difficultyForHeight(h) {
  if (h < 200) {
    return { breakP: 0.00, moveP: 0.00, moveSpeed: 0.0, maxGap: 95, maxDX: 210 };
  }
  if (h < 600) {
    return { breakP: 0.06, moveP: 0.18, moveSpeed: 1.35, maxGap: 105, maxDX: 230 };
  }
  if (h < 1200) {
    return { breakP: 0.10, moveP: 0.30, moveSpeed: 1.55, maxGap: 112, maxDX: 240 };
  }
  if (h < 2000) {
    return { breakP: 0.14, moveP: 0.40, moveSpeed: 1.75, maxGap: Math.min(SAFE_GAP, 116), maxDX: 248 };
  }
  return { breakP: 0.18, moveP: 0.48, moveSpeed: 2.0, maxGap: Math.min(SAFE_GAP, 118), maxDX: 255 };
}

// -------------------- Audio --------------------
const SOUND_KEY = "hellclimb_sound";
let audioCtx = null;
let masterGain = null;
let soundSettings = loadSoundSettings();

function loadSoundSettings() {
  try {
    const raw = JSON.parse(localStorage.getItem(SOUND_KEY) || "{}");
    return {
      muted: Boolean(raw.muted),
      volume: clamp(Number(raw.volume ?? 0.7), 0, 1),
    };
  } catch (err) {
    return { muted: false, volume: 0.7 };
  }
}

function saveSoundSettings() {
  localStorage.setItem(SOUND_KEY, JSON.stringify(soundSettings));
}

function applySoundSettings() {
  if (masterGain) masterGain.gain.value = soundSettings.muted ? 0 : 0.18 * soundSettings.volume;

  const label = soundSettings.muted ? "Unmute" : "Mute";
  muteBtn.textContent = label;
  menuMuteBtn.textContent = label;
  volumeSlider.value = String(Math.round(soundSettings.volume * 100));
}

function setMuted(muted) {
  soundSettings.muted = muted;
  saveSoundSettings();
  applySoundSettings();
}

function setVolumeFromSlider(value) {
  soundSettings.volume = clamp(Number(value) / 100, 0, 1);
  if (soundSettings.volume > 0) soundSettings.muted = false;
  saveSoundSettings();
  applySoundSettings();
}

function initAudio() {
  if (audioCtx) {
    if (audioCtx.state === "suspended") audioCtx.resume();
    return;
  }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  audioCtx = new AC();
  masterGain = audioCtx.createGain();
  masterGain.connect(audioCtx.destination);
  applySoundSettings();
}

function beep(freq, dur = 0.08, type = "sine") {
  if (!audioCtx || soundSettings.muted || soundSettings.volume <= 0) return;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.value = 0.0001;

  o.connect(g);
  g.connect(masterGain);

  const t = audioCtx.currentTime;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.35, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

  o.start(t);
  o.stop(t + dur + 0.02);
}

function playSound(name) {
  if (name === "jump") beep(620, 0.07, "triangle");
  else if (name === "dig") beep(220, 0.06, "square");
  else if (name === "death") beep(110, 0.18, "sawtooth");
  else if (name === "power") beep(840, 0.09, "triangle");
  else if (name === "shield") beep(380, 0.13, "sine");
  else if (name === "hurt") beep(80, 0.16, "sawtooth");
}

applySoundSettings();

function screenShake(power = 5, duration = 200) {
  canvas.style.transform = `translate(${Math.random() * power * 2 - power}px, ${Math.random() * power * 2 - power}px)`;
  setTimeout(() => (canvas.style.transform = "none"), duration);
}

function updateUI() {
  heightEl.textContent = String(score);
  bestEl.textContent = String(best);
}

function showGameOver() {
  isGameOver = true;
  isPaused = false;
  finalEl.textContent = String(score);

  const newBest = score > best;
  if (score > best) {
    best = score;
    setBestForMode(best);
    updateUI();
  }

  resultLineEl.textContent = newBest ? "NEW BEST" : `Best: ${best}`;

  restartBtn.classList.add("show");
  overlay.hidden = false;
  pauseOverlay.hidden = true;
  updateControlUI();
  updateMenuStats();
  setTimeout(() => playAgainBtn.focus(), 0);
}

function updateControlUI() {
  pauseBtn.textContent = isPaused ? "Resume" : "Pause";
  pauseBtn.disabled = isMainMenu || isGameOver || !trophyOverlay.hidden;
  modeBtn.disabled = !trophyOverlay.hidden;
}

function showMainMenu() {
  isMainMenu = true;
  isPaused = false;
  isGameOver = false;
  keys = {};

  mainMenu.hidden = false;
  pauseOverlay.hidden = true;
  overlay.hidden = true;
  restartBtn.classList.remove("show");

  updateModeUI();
  updateControlUI();
  setTimeout(() => playBtn.focus(), 0);
}

function resumeGame() {
  if (isMainMenu || isGameOver) return;
  isPaused = false;
  pauseOverlay.hidden = true;
  keys = {};
  updateControlUI();
}

function togglePause() {
  if (isMainMenu || isGameOver || !trophyOverlay.hidden) return;

  isPaused = !isPaused;
  pauseOverlay.hidden = !isPaused;
  keys = {};
  updateControlUI();

  if (isPaused) setTimeout(() => resumeBtn.focus(), 0);
}

function toggleMode(restartRun = false) {
  mode = (mode === "classic") ? "daily" : "classic";
  localStorage.setItem(MODE_KEY, mode);
  updateModeUI();

  if (restartRun && !isMainMenu) startGame();
}

// ==========================================================
// GAME STATE
// ==========================================================

let t_player = { x: 300, y: 500, vx: 0, vy: 0, w: 40, h: 40 };
let t_platforms = [];
let t_powerups = [];
let t_hazards = [];
let t_particles = [];
let t_maxHeight = 0;

const POWERUP_TYPES = ["wings", "shield", "lantern", "spring"];

function isUsablePlatform(p) {
  return !(p.type === "break" && p.broken);
}

function getHighestUsablePlatform() {
  let bestP = null;
  for (const p of t_platforms) {
    if (!isUsablePlatform(p)) continue;
    if (!bestP || p.y < bestP.y) bestP = p;
  }
  return bestP;
}

function spawnBurst(x, y, count, colors, speedMin = 1.2, speedMax = 4.2) {
  for (let i = 0; i < count; i++) {
    const angle = Math.PI + Math.random() * Math.PI;
    const speed = speedMin + Math.random() * (speedMax - speedMin);
    const life = 18 + Math.floor(Math.random() * 18);

    t_particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed + (Math.random() * 1.2 - 0.6),
      vy: Math.sin(angle) * speed - Math.random() * 1.3,
      gravity: 0.08 + Math.random() * 0.035,
      life,
      maxLife: life,
      size: 2 + Math.random() * 3,
      color: colors[Math.floor(Math.random() * colors.length)],
    });
  }
}

function spawnLandingBurst(platform) {
  const colorsByType = {
    normal: ["#ff8a18", "#bd0000", "#5d4037"],
    moving: ["#8de7ff", "#f8f1df", "#a6ffff"],
    break: ["#f8f1df", "#ddd", "#bd0000"],
  };

  const count = platform.type === "break" ? 16 : 9;
  const colors = colorsByType[platform.type] || colorsByType.normal;
  spawnBurst(t_player.x + t_player.w / 2, platform.y + 4, count, colors);
}

function spawnDeathBurst() {
  const x = t_player.x + t_player.w / 2;
  const y = Math.min(canvas.height - 28, t_player.y + t_player.h / 2);
  spawnBurst(x, y, 34, ["#ff1e4f", "#ff8a18", "#f8f1df"], 2.2, 6.4);
}

function updateParticles() {
  for (let i = t_particles.length - 1; i >= 0; i--) {
    const spark = t_particles[i];
    spark.x += spark.vx;
    spark.y += spark.vy;
    spark.vy += spark.gravity;
    spark.vx *= 0.985;
    spark.life--;

    if (spark.life <= 0) t_particles.splice(i, 1);
  }
}

function drawParticles() {
  ctx.save();
  for (const spark of t_particles) {
    const alpha = clamp(spark.life / spark.maxLife, 0, 1);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = spark.color;
    ctx.beginPath();
    ctx.arc(spark.x, spark.y, spark.size * alpha, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ---- Guarantees ----
function chooseTypeWithGuarantees(virtualHeight, index, breakStreak, rngRoll, diff) {
  const forceMove = (virtualHeight >= 600 && index % 7 === 0);
  const forceBreak = (virtualHeight >= 900 && index % 10 === 0);

  if (forceBreak && breakStreak === 0) return "break";
  if (forceMove) return "moving";

  let breakP = diff.breakP;
  if (breakStreak >= 1) breakP *= 0.25;

  if (rngRoll < breakP) return "break";
  if (rngRoll < breakP + diff.moveP) return "moving";
  return "normal";
}

function makePlatform({ x, y, type = "normal", vx = 0, id = null, moveRange = MOVING_PLATFORM_RANGE }) {
  const p = {
    x,
    y,
    w: PLATFORM_W,
    h: PLATFORM_H,
    type,
    vx,
    broken: false,
  };

  if (id !== null) p.id = id;

  if (type === "moving") {
    const range = clamp(moveRange, 24, MOVING_PLATFORM_RANGE);
    p.homeX = x;
    p.minX = clamp(x - range, 0, canvas.width - PLATFORM_W);
    p.maxX = clamp(x + range, 0, canvas.width - PLATFORM_W);

    if (p.minX === p.maxX) p.vx = 0;
  }

  return p;
}

function decoratePlatform(p, virtualHeight, rng = Math.random) {
  maybeCreatePowerupForPlatform(p, virtualHeight, rng);
  maybeCreateHazardForPlatform(p, virtualHeight, rng);
  return p;
}

function maybeCreatePowerupForPlatform(p, virtualHeight, rng) {
  if (virtualHeight < 120 || p.type === "break") return;

  const chance = clamp(0.08 + virtualHeight / 9000, 0.08, 0.16);
  if (rng() > chance) return;

  const type = POWERUP_TYPES[Math.floor(rng() * POWERUP_TYPES.length)];
  t_powerups.push({
    x: p.x + p.w / 2,
    y: p.y - 28,
    baseY: p.y - 28,
    r: 13,
    type,
    pulse: rng() * Math.PI * 2,
  });
}

function maybeCreateHazardForPlatform(p, virtualHeight, rng) {
  if (virtualHeight < 180) return;

  const chance = clamp(0.07 + virtualHeight / 8000, 0.07, 0.18);
  if (rng() > chance) return;

  let x = rng() * (canvas.width - 80) + 40;
  const platformCx = p.x + p.w / 2;
  if (Math.abs(x - platformCx) < 75) {
    x = clamp(platformCx + (x < platformCx ? -105 : 105), 28, canvas.width - 28);
  }

  const dir = rng() < 0.5 ? -1 : 1;
  t_hazards.push({
    x,
    y: p.y - 54 - rng() * 38,
    r: 15,
    vx: dir * (0.8 + rng() * 0.9),
    phase: rng() * Math.PI * 2,
    avoided: false,
  });
}

function playerCenter() {
  return {
    x: t_player.x + t_player.w / 2,
    y: t_player.y + t_player.h / 2,
  };
}

function circleHitsPlayer(obj, extra = 0) {
  const closestX = clamp(obj.x, t_player.x, t_player.x + t_player.w);
  const closestY = clamp(obj.y, t_player.y, t_player.y + t_player.h);
  const dx = obj.x - closestX;
  const dy = obj.y - closestY;
  const r = obj.r + extra;
  return dx * dx + dy * dy <= r * r;
}

function collectPowerup(powerup) {
  recordPowerupTrophy(powerup.type);
  playSound("power");
  spawnBurst(powerup.x, powerup.y, 18, ["#ff8a18", "#f8f1df", "#8de7ff"], 1.8, 5.2);

  if (powerup.type === "wings") {
    t_player.vy = -JUMP_FORCE * 1.75;
  } else if (powerup.type === "shield") {
    t_player.shield = true;
    playSound("shield");
  } else if (powerup.type === "lantern") {
    t_player.lanternTimer = 720;
  } else if (powerup.type === "spring") {
    t_player.springCharges = Math.min(2, t_player.springCharges + 1);
  }
}

function consumeSpringJump() {
  if (t_player.springCharges <= 0) return JUMP_FORCE;

  t_player.springCharges--;
  spawnBurst(t_player.x + t_player.w / 2, t_player.y + t_player.h, 14, ["#ff8a18", "#f8f1df"], 1.6, 4.4);
  return JUMP_FORCE * 1.45;
}

function updatePowerupsAndHazards() {
  if (t_player.lanternTimer > 0) t_player.lanternTimer--;

  for (let i = t_powerups.length - 1; i >= 0; i--) {
    const powerup = t_powerups[i];
    powerup.y = powerup.baseY + Math.sin(gameTime * 0.08 + powerup.pulse) * 4;

    if (circleHitsPlayer(powerup, 5)) {
      collectPowerup(powerup);
      t_powerups.splice(i, 1);
    } else if (powerup.y > canvas.height + 70) {
      t_powerups.splice(i, 1);
    }
  }

  for (let i = t_hazards.length - 1; i >= 0; i--) {
    const hazard = t_hazards[i];
    hazard.x += hazard.vx;
    hazard.y += Math.sin(gameTime * 0.045 + hazard.phase) * 0.35;

    if (hazard.x < hazard.r || hazard.x > canvas.width - hazard.r) {
      hazard.x = clamp(hazard.x, hazard.r, canvas.width - hazard.r);
      hazard.vx *= -1;
    }

    if (circleHitsPlayer(hazard, 0)) {
      if (t_player.shield) {
        t_player.shield = false;
        playSound("shield");
        screenShake(3, 100);
        spawnBurst(hazard.x, hazard.y, 26, ["#8de7ff", "#f8f1df", "#ff8a18"], 2, 5.5);
        t_hazards.splice(i, 1);
      } else {
        playSound("hurt");
        spawnDeathBurst();
        screenShake();
        showGameOver();
        return;
      }
    } else if (hazard.y > canvas.height + 70) {
      if (!hazard.avoided) {
        hazard.avoided = true;
        recordHazardDodged();
      }
      t_hazards.splice(i, 1);
    }
  }
}

// ---- Daily generator (deterministic layout) ----
let dailyRng = null;
let dailyGen = null;

function resetDailyGenerator() {
  dailyRng = makeDailyRng();
  dailyGen = {
    lastY: 600,
    lastX: 270,
    breakStreak: 0,
    index: 0,
  };
}

function nextDailyPlatform() {
  const minGap = 55;

  const virtualHeight = Math.floor((600 - dailyGen.lastY) / 10);
  const diff = difficultyForHeight(virtualHeight);

  const maxGap = Math.max(minGap + 10, Math.min(diff.maxGap, SAFE_GAP));
  const gap = randRangeRng(dailyRng, minGap, maxGap);
  const y = dailyGen.lastY - gap;

  // Horizontal cap now depends on this exact gap:
  const dxCap = Math.min(diff.maxDX, dxCapForGap(gap));

  let x = dailyGen.lastX + randRangeRng(dailyRng, -dxCap, dxCap);
  x = clamp(x, 0, canvas.width - PLATFORM_W);

  const nextIndex = ++dailyGen.index;
  const roll = dailyRng();

  const type = chooseTypeWithGuarantees(virtualHeight, nextIndex, dailyGen.breakStreak, roll, diff);

  let vx = 0;
  if (type === "moving") {
    const dir = dailyRng() < 0.5 ? -1 : 1;
    vx = dir * diff.moveSpeed;
  }

  if (type === "break") dailyGen.breakStreak++;
  else dailyGen.breakStreak = 0;

  dailyGen.lastY = y;
  dailyGen.lastX = x;

  const moveRange = Math.min(MOVING_PLATFORM_RANGE, Math.max(26, dxCap * 0.24));
  const p = makePlatform({ x, y, type, vx, id: nextIndex, moveRange });
  return decoratePlatform(p, virtualHeight, dailyRng);
}

// ---- Classic generator (non-deterministic, but still guaranteed variety + horizontal reach) ----
let classicSpawnIndex = 0;
let classicBreakStreak = 0;

function generateClassicPlatform(y, prevX, gapUp) {
  const virtualHeight = Math.floor((600 - y) / 10);
  const diff = difficultyForHeight(virtualHeight);

  classicSpawnIndex++;

  const dxCap = Math.min(diff.maxDX, dxCapForGap(gapUp));

  let x;
  if (Math.random() < 0.90 && typeof prevX === "number") {
    x = clamp(prevX + (Math.random() * 2 - 1) * dxCap, 0, canvas.width - PLATFORM_W);
  } else {
    x = Math.random() * (canvas.width - PLATFORM_W);
  }

  const roll = Math.random();
  const type = chooseTypeWithGuarantees(virtualHeight, classicSpawnIndex, classicBreakStreak, roll, diff);

  let vx = 0;
  if (type === "moving") {
    const dir = Math.random() < 0.5 ? -1 : 1;
    vx = dir * diff.moveSpeed;
  }

  if (type === "break") classicBreakStreak++;
  else classicBreakStreak = 0;

  const moveRange = Math.min(MOVING_PLATFORM_RANGE, Math.max(26, dxCap * 0.24));
  const p = makePlatform({ x, y, type, vx, moveRange });
  return decoratePlatform(p, virtualHeight, Math.random);
}

function platformCenterX(p) {
  return p.x + p.w / 2;
}

function directPlatformDx(a, b) {
  // Do not use wrap distance here. Wrapping is allowed as a bonus skill move,
  // but the required route should be readable and reachable straight across.
  return Math.abs(platformCenterX(a) - platformCenterX(b));
}

function pairIsUnsafe(bottom, top) {
  const gap = bottom.y - top.y;
  if (gap <= 0) return false;

  const allowedDx = Math.min(MAX_ROUTE_DX, dxCapForGap(gap));
  const dx = directPlatformDx(bottom, top);

  return gap > SAFE_GAP * 0.94 || dx > allowedDx;
}

function makeBridgePlatform(bottom, top) {
  const gap = bottom.y - top.y;
  const bottomCx = platformCenterX(bottom);
  const topCx = platformCenterX(top);
  const dx = topCx - bottomCx;
  const dir = dx === 0 ? 0 : Math.sign(dx);

  let stepUp = clamp(gap * 0.5, MIN_BRIDGE_GAP, SAFE_GAP * 0.72);
  if (gap < MIN_BRIDGE_GAP * 1.6) stepUp = gap * 0.5;

  let newY = bottom.y - stepUp;
  if (newY <= top.y + 18 || newY >= bottom.y - 18) {
    newY = (bottom.y + top.y) / 2;
  }

  const localGap = Math.max(MIN_BRIDGE_GAP, bottom.y - newY);
  const maxStep = Math.min(MAX_ROUTE_DX * 0.82, dxCapForGap(localGap) * 0.9);
  const newCx = bottomCx + dir * Math.min(Math.abs(dx) * 0.55, maxStep);
  const x = clamp(newCx - PLATFORM_W / 2, 0, canvas.width - PLATFORM_W);

  return makePlatform({ x, y: newY, type: "normal", vx: 0 });
}

function enforceReachablePath(maxInsertions = 1) {
  let insertedAny = false;

  for (let attempt = 0; attempt < maxInsertions; attempt++) {
    const usable = t_platforms
      .filter(isUsablePlatform)
      .filter((p) => p.y > -320 && p.y < canvas.height + 240)
      .sort((a, b) => a.y - b.y);

    if (usable.length < 2) return insertedAny;

    let insertedThisPass = false;

    for (let i = 0; i < usable.length - 1; i++) {
      const top = usable[i];
      const bottom = usable[i + 1];

      if (pairIsUnsafe(bottom, top)) {
        t_platforms.push(makeBridgePlatform(bottom, top));
        insertedAny = true;
        insertedThisPass = true;
        break;
      }
    }

    if (!insertedThisPass) return insertedAny;
  }

  return insertedAny;
}

function initTower() {
  isGameOver = false;
  score = 0;
  t_maxHeight = 0;
  t_powerups = [];
  t_hazards = [];
  t_particles = [];
  runStats = makeRunStats();
  updateUI();

  t_player = {
    x: 300,
    y: 500,
    vx: 0,
    vy: -8,
    w: 40,
    h: 40,
    shield: false,
    lanternTimer: 0,
    springCharges: 0,
  };
  t_platforms = [];

  restartBtn.classList.remove("show");
  overlay.hidden = true;

  const base = makePlatform({ x: 270, y: 600, type: "normal", vx: 0 });
  t_platforms.push(base);

  if (mode === "daily") {
    resetDailyGenerator();
    dailyGen.lastY = 600;
    dailyGen.lastX = 270;

    while (dailyGen.lastY > 0) {
      t_platforms.push(nextDailyPlatform());
    }
  } else {
    classicSpawnIndex = 0;
    classicBreakStreak = 0;

    let y = 600;
    let prevX = base.x;

    while (y > 0) {
      const virtualHeight = Math.floor((600 - y) / 10);
      const diff = difficultyForHeight(virtualHeight);

      const minGap = 55;
      const maxGap = Math.max(minGap + 10, Math.min(diff.maxGap, SAFE_GAP));
      const gap = minGap + Math.random() * (maxGap - minGap);

      y -= gap;

      const p = generateClassicPlatform(y, prevX, gap);
      prevX = p.x;
      t_platforms.push(p);
    }
  }

  // Final audit: if RNG, breakable platforms, or patrol ranges create a bad pair,
  // add plain stone bridge platforms until the visible route is safe.
  for (let i = 0; i < 50; i++) {
    if (!enforceReachablePath(1)) break;
  }

}

function updateTower() {
  if (keys["ArrowLeft"] || keys["a"]) t_player.vx = -MOVE_SPEED;
  else if (keys["ArrowRight"] || keys["d"]) t_player.vx = MOVE_SPEED;
  else t_player.vx *= 0.6;

  t_player.x += t_player.vx;

  if (t_player.x > canvas.width) t_player.x = -t_player.w;
  if (t_player.x < -t_player.w) t_player.x = canvas.width;

  t_player.vy += GRAVITY;
  t_player.y += t_player.vy;

  if (t_player.vy > 0 && t_player.y > canvas.height - 110) {
    runStats.nearFallArmed = true;
  }

  if (t_player.y < 300) {
    const diff = 300 - t_player.y;
    t_player.y = 300;

    if (t_player.vy < 0) {
      for (const p of t_platforms) p.y += diff;
      for (const powerup of t_powerups) {
        powerup.y += diff;
        powerup.baseY += diff;
      }
      for (const hazard of t_hazards) hazard.y += diff;
      for (const spark of t_particles) spark.y += diff;
      t_maxHeight += diff;
      score = Math.floor(t_maxHeight / 10);
      updateUI();
      checkHeightTrophies();
    }
  }

  for (const p of t_platforms) {
    if (p.type === "moving") {
      const minX = typeof p.minX === "number" ? p.minX : 0;
      const maxX = typeof p.maxX === "number" ? p.maxX : canvas.width - p.w;

      p.x += p.vx;

      if (p.x <= minX) {
        p.x = minX;
        p.vx = Math.abs(p.vx);
      } else if (p.x >= maxX) {
        p.x = maxX;
        p.vx = -Math.abs(p.vx);
      }
    }
  }

  if (t_player.vy > 0) {
    for (let i = 0; i < t_platforms.length; i++) {
      const p = t_platforms[i];
      if (!isUsablePlatform(p)) continue;

      if (
        t_player.x + 30 > p.x &&
        t_player.x + 10 < p.x + p.w &&
        t_player.y + t_player.h > p.y &&
        t_player.y + t_player.h < p.y + p.h + 15
      ) {
        spawnLandingBurst(p);
        recordPlatformBounce(p);
        const jumpForce = consumeSpringJump();

        if (p.type === "break") {
          p.broken = true;
          t_player.vy = -jumpForce;
          playSound("dig");
          screenShake(2.5, 90);

          // Crumbling platforms now give one last bounce before breaking.
          // Otherwise the generator could accidentally make a non-bouncing
          // break platform part of the only valid route.

          // Classic: remove broken + spawn replacement so RNG can't brick the run
          if (mode === "classic") {
            const deadX = p.x;
            t_platforms.splice(i, 1);
            i--;

            const highest = getHighestUsablePlatform();
            if (highest) {
              const virtualHeight = Math.floor((600 - highest.y) / 10);
              const d2 = difficultyForHeight(virtualHeight);

              const minGap = 55;
              const maxGap = Math.max(minGap + 10, Math.min(d2.maxGap, SAFE_GAP));
              const gap = minGap + Math.random() * (maxGap - minGap);
              const newY = highest.y - gap;

              t_platforms.push(generateClassicPlatform(newY, deadX, gap));
            }
          }
        } else {
          t_player.vy = -jumpForce;
          playSound("jump");
        }

        break;
      }
    }
  }

  for (let i = t_platforms.length - 1; i >= 0; i--) {
    if (t_platforms[i].y > canvas.height + 80) {
      t_platforms.splice(i, 1);

      if (mode === "daily") {
        t_platforms.push(nextDailyPlatform());
      } else {
        const highest = getHighestUsablePlatform();
        if (highest) {
          const virtualHeight = Math.floor((600 - highest.y) / 10);
          const d2 = difficultyForHeight(virtualHeight);

          const minGap = 55;
          const maxGap = Math.max(minGap + 10, Math.min(d2.maxGap, SAFE_GAP));
          const gap = minGap + Math.random() * (maxGap - minGap);
          const newY = highest.y - gap;

          t_platforms.push(generateClassicPlatform(newY, highest.x, gap));
        }
      }
    }
  }

  updatePowerupsAndHazards();
  if (isGameOver) return;

  updateParticles();
  enforceReachablePath(2);

  if (t_player.y > canvas.height) {
    playSound("death");
    spawnDeathBurst();
    screenShake();
    showGameOver();
  }
}

// ==========================================================
// BACKGROUND ART
// ==========================================================

const BACKGROUND_SCENES = [
  { src: "assets/background1.png", accent: "#ff3b12", glow: "#8f1300" },
  { src: "assets/background2.png", accent: "#e9d8b8", glow: "#7a5634" },
  { src: "assets/background3.png", accent: "#ff8a18", glow: "#d92b00" },
  { src: "assets/background4.png", accent: "#c25cff", glow: "#5b1c85" },
].map((scene) => {
  const img = new Image();
  img.src = scene.src;
  return { ...scene, img };
});

const BACKGROUND_HEIGHT = 500;

function pseudoRand(seed) {
  const x = Math.sin(seed * 12.9898) * 43758.5453123;
  return x - Math.floor(x);
}

function smoothstep(edge0, edge1, x) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

function mixRgb(a, b, t) {
  return {
    r: Math.round(a.r + (b.r - a.r) * t),
    g: Math.round(a.g + (b.g - a.g) * t),
    b: Math.round(a.b + (b.b - a.b) * t),
  };
}

function rgba(c, a) {
  return `rgba(${c.r}, ${c.g}, ${c.b}, ${a})`;
}

function getBackgroundState(h) {
  const rawIndex = Math.floor(h / BACKGROUND_HEIGHT);
  const lastIndex = BACKGROUND_SCENES.length - 1;
  const index = clamp(rawIndex, 0, lastIndex);
  const nextIndex = clamp(index + 1, 0, lastIndex);
  const local = rawIndex > lastIndex ? 1 : (h % BACKGROUND_HEIGHT) / BACKGROUND_HEIGHT;
  const blend = nextIndex === index ? 0 : smoothstep(0.72, 1, local);

  return {
    current: BACKGROUND_SCENES[index],
    next: BACKGROUND_SCENES[nextIndex],
    blend,
    index,
    local,
  };
}

function drawHellBackground(h, time) {
  const state = getBackgroundState(h);

  const accent = mixRgb(hexToRgb(state.current.accent), hexToRgb(state.next.accent), state.blend);
  const glow = mixRgb(hexToRgb(state.current.glow), hexToRgb(state.next.glow), state.blend);

  const climbPx = h * 10;

  if (!drawImageBackground(state, time)) {
    drawBackgroundFallback(accent, glow);
  }
  drawDistantGlow(glow, accent, time);
  drawFloatingAsh(accent, climbPx, time, h);
  drawForegroundSmoke(glow, time, h);
  drawVignette();
}

function drawImageBackground(state, time) {
  let drewImage = drawCoverBackgroundImage(state.current, state.local, time, 1);

  if (state.blend > 0) {
    const drewNext = drawCoverBackgroundImage(state.next, 0, time, state.blend);
    drewImage = drewImage || drewNext;
  }

  return drewImage;
}

function drawCoverBackgroundImage(scene, local, time, alpha) {
  const img = scene.img;
  if (!img.complete || img.naturalWidth <= 0 || img.naturalHeight <= 0) return false;

  const scale = Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
  const sw = canvas.width / scale;
  const sh = canvas.height / scale;
  const sx = Math.max(0, (img.naturalWidth - sw) * 0.5);
  const maxSy = Math.max(0, img.naturalHeight - sh);
  const pan = smoothstep(0, 1, local);
  const breathe = Math.sin(time * 0.006) * maxSy * 0.015;
  const sy = clamp(maxSy * pan + breathe, 0, maxSy);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  ctx.restore();

  return true;
}

function drawBackgroundFallback(accent, glow) {
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, "#040000");
  grad.addColorStop(0.58, rgba(glow, 0.75));
  grad.addColorStop(1, rgba(accent, 0.34));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawDistantGlow(glow, accent, time) {
  const pulse = 0.08 + Math.sin(time * 0.025) * 0.025;

  let g = ctx.createRadialGradient(
    canvas.width * 0.5,
    canvas.height * 0.82,
    20,
    canvas.width * 0.5,
    canvas.height * 0.82,
    canvas.width * 0.72
  );
  g.addColorStop(0, rgba(accent, pulse));
  g.addColorStop(0.35, rgba(glow, 0.07));
  g.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  g = ctx.createRadialGradient(
    canvas.width * 0.2,
    canvas.height * 0.15,
    10,
    canvas.width * 0.2,
    canvas.height * 0.15,
    canvas.width * 0.5
  );
  g.addColorStop(0, rgba(accent, 0.035));
  g.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawParallaxCavern(accent, climbPx, time) {
  drawJaggedWall("left", 0.11, 30, 42, "rgba(0, 0, 0, 0.28)", climbPx);
  drawJaggedWall("right", 0.11, 30, 42, "rgba(0, 0, 0, 0.28)", climbPx + 555);
  drawJaggedWall("left", 0.24, 16, 26, "rgba(0, 0, 0, 0.34)", climbPx + 222);
  drawJaggedWall("right", 0.24, 16, 26, "rgba(0, 0, 0, 0.34)", climbPx + 777);

  ctx.save();
  ctx.strokeStyle = rgba(accent, 0.08);
  ctx.lineWidth = 1;

  const drift = (climbPx * 0.035 + time * 0.15) % 120;
  for (let y = -120; y < canvas.height + 140; y += 120) {
    const yy = y + drift;
    ctx.beginPath();
    ctx.moveTo(60, yy);
    ctx.bezierCurveTo(170, yy + 30, 290, yy - 35, 540, yy + 20);
    ctx.stroke();
  }
  ctx.restore();
}

function drawJaggedWall(side, speed, baseWidth, variance, fillStyle, climbPx) {
  const segment = 72;
  const offset = (climbPx * speed) % segment;
  const leftSide = side === "left";

  ctx.fillStyle = fillStyle;
  ctx.beginPath();

  if (leftSide) {
    ctx.moveTo(0, -segment);
    for (let y = -segment; y <= canvas.height + segment; y += segment) {
      const n = Math.floor((y + climbPx * speed) / segment);
      const x = baseWidth + pseudoRand(n + 12.3) * variance;
      ctx.lineTo(x, y + offset);
    }
    ctx.lineTo(0, canvas.height + segment);
  } else {
    ctx.moveTo(canvas.width, -segment);
    for (let y = -segment; y <= canvas.height + segment; y += segment) {
      const n = Math.floor((y + climbPx * speed) / segment);
      const x = canvas.width - baseWidth - pseudoRand(n + 98.7) * variance;
      ctx.lineTo(x, y + offset);
    }
    ctx.lineTo(canvas.width, canvas.height + segment);
  }

  ctx.closePath();
  ctx.fill();
}

function drawBiomeMotifs(motif, accent, glow, climbPx, time, h) {
  if (motif === "pit") drawPitCracks(accent, climbPx, time);
  else if (motif === "bones") drawBoneShaft(accent, climbPx, time);
  else if (motif === "furnace") drawBloodFurnace(accent, glow, climbPx, time);
  else if (motif === "cathedral") drawCathedral(accent, climbPx, time);
  else if (motif === "void") drawVoidLayer(accent, climbPx, time);
  else if (motif === "abyss") drawFinalAbyss(accent, glow, climbPx, time, h);
}

function drawPitCracks(accent, climbPx, time) {
  ctx.save();
  ctx.strokeStyle = rgba(accent, 0.22 + Math.sin(time * 0.04) * 0.04);
  ctx.lineWidth = 2;
  ctx.shadowColor = rgba(accent, 0.5);
  ctx.shadowBlur = 8;

  const offset = (climbPx * 0.2) % 220;
  for (let i = 0; i < 7; i++) {
    const x = 95 + pseudoRand(i + 2) * 410;
    const y = ((i * 170 + offset) % (canvas.height + 260)) - 130;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 12, y + 28);
    ctx.lineTo(x - 7, y + 58);
    ctx.lineTo(x + 18, y + 98);
    ctx.stroke();
  }

  ctx.restore();
}

function drawBoneShaft(accent, climbPx, time) {
  ctx.save();
  ctx.strokeStyle = rgba(accent, 0.18);
  ctx.fillStyle = rgba(accent, 0.08);
  ctx.lineWidth = 4;

  const offset = (climbPx * 0.16) % 150;
  for (let y = -150; y < canvas.height + 170; y += 150) {
    const yy = y + offset;

    ctx.beginPath();
    ctx.arc(62, yy, 46, -Math.PI * 0.45, Math.PI * 0.45);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(canvas.width - 62, yy + 45, 46, Math.PI * 0.55, Math.PI * 1.45);
    ctx.stroke();
  }

  for (let i = 0; i < 4; i++) {
    const x = 130 + pseudoRand(i + 31) * 340;
    const y = ((i * 210 + climbPx * 0.1) % (canvas.height + 220)) - 100;
    drawTinySkull(x, y, accent, 0.09 + Math.sin(time * 0.02 + i) * 0.02);
  }
  ctx.restore();
}

function drawTinySkull(x, y, accent, alpha) {
  ctx.save();
  ctx.fillStyle = rgba(accent, alpha);
  ctx.strokeStyle = rgba(accent, alpha + 0.05);
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.ellipse(x, y, 16, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "rgba(0, 0, 0, 0.18)";
  ctx.beginPath();
  ctx.arc(x - 6, y - 3, 3, 0, Math.PI * 2);
  ctx.arc(x + 6, y - 3, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x - 5, y + 8, 10, 2);

  ctx.restore();
}

function drawBloodFurnace(accent, glow, climbPx, time) {
  ctx.save();

  const offset = (climbPx * 0.32 + time * 0.8) % canvas.height;
  for (let i = 0; i < 5; i++) {
    const x = 80 + i * 110 + Math.sin(time * 0.02 + i) * 12;
    const y = ((i * 120 + offset) % (canvas.height + 220)) - 160;
    const w = 16 + pseudoRand(i + 44) * 24;
    const h = 150 + pseudoRand(i + 51) * 150;

    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, rgba(accent, 0));
    g.addColorStop(0.25, rgba(accent, 0.13));
    g.addColorStop(1, rgba(glow, 0.04));
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
  }

  ctx.strokeStyle = rgba(accent, 0.12 + Math.sin(time * 0.035) * 0.03);
  ctx.lineWidth = 2;
  for (let y = 70; y < canvas.height; y += 95) {
    ctx.beginPath();
    ctx.moveTo(0, y + Math.sin(time * 0.03 + y) * 4);
    ctx.lineTo(canvas.width, y + Math.cos(time * 0.025 + y) * 4);
    ctx.stroke();
  }

  ctx.restore();
}

function drawCathedral(accent, climbPx, time) {
  ctx.save();

  const offset = (climbPx * 0.12) % 230;
  ctx.strokeStyle = "rgba(0, 0, 0, 0.42)";
  ctx.lineWidth = 12;

  for (let x = 35; x < canvas.width; x += 105) {
    const y = ((x + offset) % 230) - 110;
    drawGothicArch(x, y, 72, 190, "rgba(0, 0, 0, 0.38)", rgba(accent, 0.12));
  }

  ctx.strokeStyle = rgba(accent, 0.09 + Math.sin(time * 0.025) * 0.02);
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    const x = 85 + i * 105;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + Math.sin(time * 0.025 + i) * 7, canvas.height);
    ctx.stroke();
  }

  ctx.restore();
}

function drawGothicArch(x, y, w, h, fillStyle, strokeStyle) {
  ctx.fillStyle = fillStyle;
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, y + h * 0.45);
  ctx.quadraticCurveTo(x + w * 0.5, y - h * 0.1, x + w, y + h * 0.45);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x + w * 0.5, y + h * 0.1);
  ctx.lineTo(x + w * 0.5, y + h);
  ctx.stroke();
}

function drawVoidLayer(accent, climbPx, time) {
  ctx.save();

  for (let i = 0; i < 55; i++) {
    const x = pseudoRand(i + 201) * canvas.width;
    const y = (pseudoRand(i + 301) * canvas.height + climbPx * 0.05) % canvas.height;
    const size = 1 + pseudoRand(i + 401) * 2;
    const alpha = 0.12 + pseudoRand(i + 501) * 0.25 + Math.sin(time * 0.03 + i) * 0.04;

    ctx.fillStyle = rgba(accent, alpha);
    ctx.fillRect(x, y, size, size);
  }

  for (let i = 0; i < 5; i++) {
    const x = 80 + pseudoRand(i + 601) * 440;
    const y = ((pseudoRand(i + 701) * canvas.height + climbPx * 0.11 + time * 0.18) % (canvas.height + 120)) - 60;
    drawWatchingEye(x, y, 24 + pseudoRand(i + 801) * 18, accent, 0.12);
  }

  ctx.restore();
}

function drawFinalAbyss(accent, glow, climbPx, time, h) {
  ctx.save();

  const eyeX = canvas.width * 0.5 + Math.sin(time * 0.012) * 28;
  const eyeY = 105 + Math.cos(time * 0.01) * 14;
  const eyeSize = 92 + Math.sin(time * 0.025) * 4;

  const g = ctx.createRadialGradient(eyeX, eyeY, 10, eyeX, eyeY, eyeSize * 1.6);
  g.addColorStop(0, rgba(accent, 0.22));
  g.addColorStop(0.32, rgba(glow, 0.12));
  g.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawWatchingEye(eyeX, eyeY, eyeSize, accent, 0.34);

  ctx.strokeStyle = rgba(accent, 0.08);
  ctx.lineWidth = 1;
  const offset = (climbPx * 0.08 + time * 0.2) % 110;
  for (let y = -110; y < canvas.height + 120; y += 110) {
    ctx.beginPath();
    ctx.moveTo(0, y + offset);
    ctx.bezierCurveTo(160, y + 35 + offset, 290, y - 35 + offset, canvas.width, y + offset);
    ctx.stroke();
  }

  ctx.fillStyle = rgba(accent, 0.05 + Math.min(0.12, (h - 1250) / 6000));
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.restore();
}

function drawWatchingEye(x, y, size, accent, alpha) {
  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = rgba(accent, alpha);
  ctx.strokeStyle = rgba(accent, alpha + 0.08);
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.ellipse(0, 0, size, size * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(0.8, alpha + 0.35)})`;
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.17, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawHellChains(accent, climbPx, time) {
  ctx.save();
  ctx.strokeStyle = rgba(accent, 0.08);
  ctx.lineWidth = 3;

  for (let c = 0; c < 4; c++) {
    const x = 70 + c * 150 + Math.sin(time * 0.015 + c) * 5;
    const offset = (climbPx * (0.16 + c * 0.015) + c * 90) % 56;

    for (let y = -60; y < canvas.height + 70; y += 28) {
      const yy = y + offset;
      ctx.beginPath();
      ctx.ellipse(x, yy, 7, 13, c % 2 === 0 ? 0.15 : -0.15, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  ctx.restore();
}

function drawFloatingAsh(accent, climbPx, time, h) {
  const amount = h > 800 ? 55 : 38;

  ctx.save();
  for (let i = 0; i < amount; i++) {
    const baseX = pseudoRand(i + 1000) * canvas.width;
    const drift = Math.sin(time * 0.018 + i) * (8 + pseudoRand(i + 1100) * 18);
    const x = baseX + drift;
    const speed = 0.35 + pseudoRand(i + 1200) * 1.4;
    const y = canvas.height + 20 - ((time * speed + climbPx * 0.05 + pseudoRand(i + 1300) * canvas.height) % (canvas.height + 60));
    const size = 1 + pseudoRand(i + 1400) * 2.4;
    const alpha = 0.08 + pseudoRand(i + 1500) * 0.28;

    ctx.fillStyle = rgba(accent, alpha);
    if (i % 4 === 0) {
      ctx.beginPath();
      ctx.arc(x, y, size + 1, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(x, y, size, size);
    }
  }
  ctx.restore();
}

function drawForegroundSmoke(glow, time, h) {
  ctx.save();
  const strength = 0.035 + Math.min(0.08, h / 5000);

  for (let i = 0; i < 7; i++) {
    const x = ((pseudoRand(i + 2000) * canvas.width) + Math.sin(time * 0.01 + i) * 35) % canvas.width;
    const y = canvas.height - 45 - i * 82 + Math.cos(time * 0.012 + i) * 18;
    const r = 85 + pseudoRand(i + 2100) * 75;

    const g = ctx.createRadialGradient(x, y, 10, x, y, r);
    g.addColorStop(0, rgba(glow, strength));
    g.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.restore();
}

function drawVignette() {
  const g = ctx.createRadialGradient(
    canvas.width * 0.5,
    canvas.height * 0.46,
    canvas.width * 0.25,
    canvas.width * 0.5,
    canvas.height * 0.46,
    canvas.width * 0.78
  );
  g.addColorStop(0, "rgba(0, 0, 0, 0)");
  g.addColorStop(0.65, "rgba(0, 0, 0, 0.08)");
  g.addColorStop(1, "rgba(0, 0, 0, 0.58)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawHazards() {
  ctx.save();
  for (const hazard of t_hazards) {
    const flicker = 0.8 + Math.sin(gameTime * 0.14 + hazard.phase) * 0.2;

    ctx.shadowColor = "rgba(255, 30, 79, 0.65)";
    ctx.shadowBlur = 14;
    ctx.fillStyle = `rgba(120, 0, 20, ${0.82 * flicker})`;
    ctx.strokeStyle = "#f8f1df";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.arc(hazard.x, hazard.y, hazard.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(hazard.x - 5, hazard.y - 2, 3, 0, Math.PI * 2);
    ctx.arc(hazard.x + 5, hazard.y - 2, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(hazard.x - 6, hazard.y + 7);
    ctx.lineTo(hazard.x, hazard.y + 3);
    ctx.lineTo(hazard.x + 6, hazard.y + 7);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPowerups() {
  ctx.save();
  for (const powerup of t_powerups) {
    const pulse = 0.85 + Math.sin(gameTime * 0.12 + powerup.pulse) * 0.15;
    const x = powerup.x;
    const y = powerup.y;

    ctx.shadowColor = powerup.type === "shield" || powerup.type === "lantern" ? "rgba(141, 231, 255, 0.7)" : "rgba(255, 138, 24, 0.72)";
    ctx.shadowBlur = 16;
    ctx.lineWidth = 2;

    if (powerup.type === "wings") {
      ctx.fillStyle = `rgba(248, 241, 223, ${0.9 * pulse})`;
      ctx.beginPath();
      ctx.ellipse(x - 8, y, 8, 14, -0.55, 0, Math.PI * 2);
      ctx.ellipse(x + 8, y, 8, 14, 0.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ff8a18";
      ctx.fillRect(x - 2, y - 7, 4, 14);
    } else if (powerup.type === "shield") {
      ctx.strokeStyle = `rgba(141, 231, 255, ${pulse})`;
      ctx.beginPath();
      ctx.arc(x, y, 13, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y - 12);
      ctx.lineTo(x + 10, y - 4);
      ctx.lineTo(x + 5, y + 11);
      ctx.lineTo(x - 5, y + 11);
      ctx.lineTo(x - 10, y - 4);
      ctx.closePath();
      ctx.stroke();
    } else if (powerup.type === "lantern") {
      ctx.fillStyle = `rgba(255, 210, 80, ${0.86 * pulse})`;
      ctx.fillRect(x - 7, y - 9, 14, 18);
      ctx.strokeStyle = "#f8f1df";
      ctx.strokeRect(x - 7, y - 9, 14, 18);
      ctx.beginPath();
      ctx.arc(x, y - 10, 6, Math.PI, 0);
      ctx.stroke();
    } else if (powerup.type === "spring") {
      ctx.strokeStyle = `rgba(255, 138, 24, ${pulse})`;
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const yy = y - 10 + i * 5;
        ctx.moveTo(x - 9, yy);
        ctx.quadraticCurveTo(x, yy + 4, x + 9, yy);
      }
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawPowerStatus() {
  const badges = [];
  if (t_player.shield) badges.push("SHIELD");
  if (t_player.springCharges > 0) badges.push(`SPRING x${t_player.springCharges}`);
  if (t_player.lanternTimer > 0) badges.push("LANTERN");
  if (badges.length === 0) return;

  ctx.save();
  ctx.font = "18px VT323";
  ctx.textAlign = "right";
  ctx.fillStyle = "#ff8a18";
  ctx.fillText(badges.join("  "), canvas.width - 26, 30);
  ctx.restore();
}

function drawTower() {
  drawHellBackground(score, gameTime);

  drawHazards();
  for (const p of t_platforms) drawHellPlatform(p);
  drawPowerups();
  drawParticles();
  drawHellGhost(t_player.x, t_player.y, t_player.w, t_player.h, t_player.vx, gameTime);
  drawPowerStatus();

  ctx.fillStyle = "white";
  ctx.font = "20px VT323";
  ctx.textAlign = "left";
  ctx.fillText("HEIGHT: " + score, 70, 30);
}

function drawHellPlatform(p) {
  const { x, y, w, h } = p;

  if (t_player.lanternTimer > 0 && isUsablePlatform(p) && y < t_player.y + t_player.h) {
    ctx.save();
    ctx.shadowColor = "rgba(255, 210, 80, 0.65)";
    ctx.shadowBlur = 16;
    ctx.strokeStyle = "rgba(255, 210, 80, 0.65)";
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 4, y - 4, w + 8, h + 8);
    ctx.restore();
  }

  if (p.type === "normal") {
    ctx.fillStyle = "#5d4037";
    ctx.beginPath();
    ctx.moveTo(x + 10, y);
    ctx.lineTo(x + w - 10, y);
    ctx.lineTo(x + w, y + 10);
    ctx.lineTo(x + w - 5, y + h);
    ctx.lineTo(x + 5, y + h);
    ctx.lineTo(x, y + 10);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "#3e2723";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#000";
    ctx.fillRect(x + w / 2 - 2, y + 5, 4, 10);
    ctx.fillRect(x + w / 2 - 5, y + 7, 10, 4);
  } else if (p.type === "moving") {
    ctx.fillStyle = "rgba(150, 255, 255, 0.55)";
    ctx.beginPath();
    ctx.arc(x + 10, y + 10, 10, 0, Math.PI * 2);
    ctx.arc(x + 30, y + 5, 12, 0, Math.PI * 2);
    ctx.arc(x + 50, y + 10, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#000";
    ctx.fillRect(x + 25, y + 8, 2, 2);
    ctx.fillRect(x + 35, y + 8, 2, 2);
  } else if (p.type === "break") {
    if (p.broken) return;

    ctx.fillStyle = "#ddd";
    ctx.beginPath();
    ctx.moveTo(x, y + 5);
    ctx.lineTo(x + w, y + 5);
    ctx.lineWidth = 8;
    ctx.strokeStyle = "#ddd";
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x, y + 5, 6, 0, Math.PI * 2);
    ctx.arc(x + w, y + 5, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y);
    ctx.lineTo(x + w / 2 - 3, y + 10);
    ctx.stroke();
  }
}

function drawHellGhost(x, y, w, h, vx, time) {
  ctx.save();
  const bob = Math.sin(time * 0.18) * 1.4;
  ctx.translate(x + w / 2, y + h / 2 + bob);
  if (vx < 0) ctx.scale(-1, 1);

  if (t_player.shield) {
    ctx.save();
    ctx.strokeStyle = "rgba(141, 231, 255, 0.85)";
    ctx.shadowColor = "rgba(141, 231, 255, 0.75)";
    ctx.shadowBlur = 14;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 25 + Math.sin(time * 0.12) * 1.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  ctx.shadowColor = "rgba(255, 30, 79, 0.45)";
  ctx.shadowBlur = 16;
  ctx.fillStyle = "#f8f1df";
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.arc(0, -5, 15, Math.PI, 0);
  ctx.lineTo(15, 15);
  ctx.lineTo(10, 10);
  ctx.lineTo(5, 15);
  ctx.lineTo(0, 10);
  ctx.lineTo(-5, 15);
  ctx.lineTo(-10, 10);
  ctx.lineTo(-15, 15);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.arc(5, -5, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(12, -5, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(8, 2, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ---------- loop ----------
function gameLoop() {
  gameTime++;
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  if (!isMainMenu && !isPaused && !isGameOver && trophyOverlay.hidden) updateTower();
  else updateParticles();
  drawTower();

  animationId = requestAnimationFrame(gameLoop);
}

function startGame() {
  keys = {};
  gameTime = 0;
  isMainMenu = false;
  isPaused = false;
  isGameOver = false;
  mainMenu.hidden = true;
  pauseOverlay.hidden = true;
  trophyOverlay.hidden = true;
  overlay.hidden = true;

  if (animationId) cancelAnimationFrame(animationId);

  best = getBestForMode();
  updateUI();

  initTower();
  updateControlUI();
  gameLoop();
}

// ---------- input ----------
window.addEventListener("keydown", (e) => {
  initAudio();
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;

  if (!trophyOverlay.hidden && key === "Escape") {
    e.preventDefault();
    closeTrophies();
    return;
  }

  if (!trophyOverlay.hidden) return;

  if (!mainMenu.hidden) {
    if (key === "Enter") {
      e.preventDefault();
      startGame();
    }
    return;
  }

  if (key === "Escape" || key === "p") {
    e.preventDefault();
    togglePause();
    return;
  }

  if (key === "m") {
    e.preventDefault();
    setMuted(!soundSettings.muted);
    return;
  }

  if (isPaused) return;

  if (isGameOver && (key === "Enter" || key === " ")) {
    e.preventDefault();
    startGame();
    return;
  }

  if (key === "ArrowLeft" || key === "ArrowRight" || key === "a" || key === "d") {
    e.preventDefault();
  }

  keys[key] = true;
});

window.addEventListener("keyup", (e) => {
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  keys[key] = false;
});

// click/touch: left half = left, right half = right
let pointerDown = false;
canvas.addEventListener("pointerdown", (e) => {
  initAudio();
  e.preventDefault();
  if (isMainMenu || isPaused || isGameOver || !trophyOverlay.hidden) return;
  pointerDown = true;
  canvas.setPointerCapture(e.pointerId);
  handlePointer(e);
});
canvas.addEventListener("pointermove", (e) => {
  if (!pointerDown) return;
  handlePointer(e);
});
function releasePointer() {
  pointerDown = false;
  keys["ArrowLeft"] = false;
  keys["ArrowRight"] = false;
}

canvas.addEventListener("pointerup", releasePointer);
canvas.addEventListener("pointercancel", releasePointer);
canvas.addEventListener("pointerleave", releasePointer);

function handlePointer(e) {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  if (x < rect.width / 2) {
    keys["ArrowLeft"] = true;
    keys["ArrowRight"] = false;
  } else {
    keys["ArrowLeft"] = false;
    keys["ArrowRight"] = true;
  }
}

// ---------- UI buttons ----------
restartBtn.addEventListener("click", () => {
  initAudio();
  startGame();
});

playAgainBtn.addEventListener("click", () => {
  initAudio();
  isGameOver = false;
  startGame();
});

modeBtn.addEventListener("click", () => {
  initAudio();
  toggleMode(!isMainMenu && !isGameOver);
});

trophyBtn.addEventListener("click", () => {
  initAudio();
  openTrophies(trophyBtn);
});

closeTrophiesBtn.addEventListener("click", closeTrophies);

playBtn.addEventListener("click", () => {
  initAudio();
  startGame();
});

menuModeBtn.addEventListener("click", () => {
  initAudio();
  toggleMode(false);
});

menuTrophyBtn.addEventListener("click", () => {
  initAudio();
  openTrophies(menuTrophyBtn);
});

pauseBtn.addEventListener("click", () => {
  initAudio();
  togglePause();
});

resumeBtn.addEventListener("click", () => {
  initAudio();
  resumeGame();
});

pauseMenuBtn.addEventListener("click", () => {
  initAudio();
  showMainMenu();
});

muteBtn.addEventListener("click", () => {
  initAudio();
  setMuted(!soundSettings.muted);
});

menuMuteBtn.addEventListener("click", () => {
  initAudio();
  setMuted(!soundSettings.muted);
});

volumeSlider.addEventListener("input", () => {
  initAudio();
  setVolumeFromSlider(volumeSlider.value);
});

// boot
initTower();
showMainMenu();
gameLoop();
