// Bone Breaker - Horror Breakout with brick types, levels, powerups, and cursed drops

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
let REDUCED_MOTION = window.ArcadeUX.motionReduced();
window.ArcadeUX.onPreferences(() => { REDUCED_MOTION = window.ArcadeUX.motionReduced(); });

function isDeveloperMode() {
  return Boolean(window.ArcadeDeveloperMode?.enabled);
}

const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const waveEl = document.getElementById("wave");
const livesEl = document.getElementById("lives");
const bountyEl = document.getElementById("bounty");
const bountyChipEl = document.querySelector(".bounty-chip");
const powerEl = document.getElementById("power");
const ritualEl = document.getElementById("ritual");
const ritualFillEl = document.getElementById("ritual-fill");
const ritualChipEl = document.querySelector(".ritual-chip");
const autoLaunchBtn = document.getElementById("auto-launch");
const trophiesBtn = document.getElementById("trophies");
const trophyCountEl = document.getElementById("trophy-count");
const pauseBtn = document.getElementById("pause");
const restartBtn = document.getElementById("restart");
const titleScreen = document.getElementById("title-screen");
const titleStartBtn = document.getElementById("title-start");
const careerSummaryEl = document.getElementById("career-summary");
const NATIONAL_GAME_ID = "bone-breaker";
const NATIONAL_GAME_NAME = "Bone Breaker";

const overlay = document.getElementById("overlay");
const overTitle = document.getElementById("over-title");
const scoreSummaryEl = document.getElementById("score-summary");
const finalScoreEl = document.getElementById("final-score");
const overlayCopyEl = document.getElementById("overlay-copy");
const runStatsEl = document.getElementById("run-stats");
const upgradeSelectEl = document.getElementById("upgrade-select");
const playAgainBtn = document.getElementById("play-again");
const quickRetryBtn = document.getElementById("quick-retry");
const continueEndlessBtn = document.getElementById("continue-endless");
const vowDescriptionEl = document.getElementById("vow-description");
const vowButtons = document.querySelectorAll(".vow-option");
const trophyOverlay = document.getElementById("trophy-overlay");
const trophyProgressEl = document.getElementById("trophy-progress");

window.NationalLeaderboard?.init({
  gameId: NATIONAL_GAME_ID,
  gameName: NATIONAL_GAME_NAME,
  getPersonalScores: () => [
    { label: "Best Score", score: Math.max(record?.bestScore || 0, score || 0) },
    { label: "Best Wave", score: record?.bestWave || 0 }
  ]
});

function submitNationalScore(finalScore) {
  window.NationalLeaderboard?.submitScore(NATIONAL_GAME_ID, finalScore, {
    gameName: NATIONAL_GAME_NAME,
    wave: bb_level || 1
  });
}
const trophyListEl = document.getElementById("trophy-list");
const closeTrophiesBtn = document.getElementById("close-trophies");

function loadArtwork(src) {
  const asset = { image: new Image(), ready: false };
  asset.image.onload = () => {
    asset.ready = true;
  };
  asset.image.src = src;
  return asset;
}

const artwork = {
  levelBackgrounds: [
    loadArtwork("Assets/level1.webp"),
    loadArtwork("Assets/level2.webp"),
    loadArtwork("Assets/level3.webp"),
    loadArtwork("Assets/level4.webp"),
    loadArtwork("Assets/level5.webp"),
    loadArtwork("Assets/level6.webp")
  ],
  ball: loadArtwork("Assets/ball.webp"),
  platform: loadArtwork("Assets/platform.webp"),
  bone: loadArtwork("Assets/bone1.webp"),
  cracked: loadArtwork("Assets/bone2.webp")
};

const SPRITE_SOURCE = {
  ball: { x: 109, y: 76, w: 37, h: 89 },
  platform: { x: 31, y: 109, w: 195, h: 37 },
  bone: { x: 24, y: 92, w: 208, h: 65 },
  cracked: { x: 11, y: 89, w: 234, h: 76 }
};

// -------------------- Core State --------------------
const FRAME_MS = 1000 / 60;
const MAX_BALLS = 7;
const PADDLE_Y = 600;
const PADDLE_H = 16;
const SAVE_KEY = "boneBreakerRecordsV2";
const AUTO_LAUNCH_KEY = "boneBreakerAutoLaunch";
const TROPHY_KEY = "boneBreakerTrophiesV1";

let keys = {};
let score = 0;
let lives = 3;
let isGameOver = false;
let gamePhase = "playing";
let isPaused = false;
let isTitleScreen = true;
let isEndless = false;
let ritualCharge = 0;
let ritualTimer = 0;
let waveBannerTimer = 0;
let waveLivesLost = 0;
let pausedBeforeTrophies = false;
let waveBounty = null;
let bossPressureTimer = 0;
let currentVow = "keeper";
let record = loadRecord();
let runStats = {};
let careerCheckpoint = null;
let autoLaunchEnabled = loadAutoLaunchSetting();
let autoLaunchTimer = 0;
let launchPreviewUnlocked = false;

// Pointer paddle control
let pointerX = -1;
let paddleVX = 0;
let combo = 0;
let comboTimer = 0;
let comboRewardTier = 0;
let shieldCharges = 0;

// Small visual polish
let particles = [];
let scorePops = [];
let cleaveEffects = [];
let shakeTimer = 0;

function haptic(pattern = 12) {
  try {
    window.ArcadeUX.vibrate(pattern);
  } catch (error) {
    // Haptics are optional polish.
  }
}

function loadRecord() {
  try {
    return { bestScore: 0, bestWave: 0, clears: 0, runs: 0, bricks: 0, rituals: 0, bestCombo: 0, ...JSON.parse(localStorage.getItem(SAVE_KEY) || "{}") };
  } catch (error) {
    return { bestScore: 0, bestWave: 0, clears: 0, runs: 0, bricks: 0, rituals: 0, bestCombo: 0 };
  }
}

function saveRecord(didClear = false) {
  record.bestScore = Math.max(record.bestScore || 0, score);
  record.bestWave = Math.max(record.bestWave || 0, bb_level || 1);
  if (didClear) record.clears = (record.clears || 0) + 1;

  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(record));
  } catch (error) {
    // Local storage may be unavailable in private browsing; the run still works.
  }
}

function persistRecord() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(record));
  } catch (error) {
    // Developer unlock persistence is best-effort.
  }
}

function renderCareerSummary() {
  if (!careerSummaryEl) return;
  careerSummaryEl.textContent = record.runs
    ? `${record.runs} hunts | ${record.bricks} bones broken | ${record.rituals} rituals | best chain x${record.bestCombo}`
    : "No hunts logged yet.";
}

function commitCareerStats() {
  if (!careerCheckpoint) record.runs = (record.runs || 0) + 1;
  record.bricks = (record.bricks || 0) + runStats.bricks - (careerCheckpoint?.bricks || 0);
  record.rituals = (record.rituals || 0) + runStats.rituals - (careerCheckpoint?.rituals || 0);
  careerCheckpoint = { bricks: runStats.bricks, rituals: runStats.rituals };
  record.bestCombo = Math.max(record.bestCombo || 0, runStats.maxCombo);
  renderCareerSummary();
}

function loadAutoLaunchSetting() {
  try {
    return localStorage.getItem(AUTO_LAUNCH_KEY) === "1";
  } catch (error) {
    return false;
  }
}

function updateAutoLaunchButton() {
  if (!autoLaunchBtn) return;
  autoLaunchBtn.textContent = `Auto Launch: ${autoLaunchEnabled ? "On" : "Off"}`;
  autoLaunchBtn.setAttribute("aria-pressed", String(autoLaunchEnabled));
}

function setAutoLaunch(enabled) {
  autoLaunchEnabled = Boolean(enabled);
  autoLaunchTimer = 0;
  try {
    localStorage.setItem(AUTO_LAUNCH_KEY, autoLaunchEnabled ? "1" : "0");
  } catch (error) {
    // Storage can be blocked in local/private contexts; the toggle still works for this session.
  }
  updateAutoLaunchButton();
}

function resetRunStats() {
  runStats = {
    bricks: 0,
    maxCombo: 0,
    powerups: 0,
    bounties: 0,
    perfectWaves: 0,
    rituals: 0,
    upgrades: []
  };
}

// -------------------- Trophies --------------------
const TROPHIES = [
  { id: "first_shatter", progress: () => ({ metric: "bricks", current: runStats.bricks, target: 1 }),  name: "First Shatter", desc: "Break your first brick.", test: () => runStats.bricks >= 1 },
  { id: "bone_pile", progress: () => ({ metric: "bricks", current: runStats.bricks, target: 25 }),  name: "Bone Pile", desc: "Break 25 bricks in one run.", test: () => runStats.bricks >= 25 },
  { id: "crypt_grinder", progress: () => ({ metric: "bricks", current: runStats.bricks, target: 75 }),  name: "Crypt Grinder", desc: "Break 75 bricks in one run.", test: () => runStats.bricks >= 75 },
  { id: "chain_five", progress: () => ({ metric: "combo", current: runStats.maxCombo, target: 5 }),  name: "Chain Five", desc: "Reach a x5 chain.", test: () => runStats.maxCombo >= 5 },
  { id: "chain_ten", progress: () => ({ metric: "combo", current: runStats.maxCombo, target: 10 }),  name: "Chain Ten", desc: "Reach a x10 chain.", test: () => runStats.maxCombo >= 10 },
  { id: "ritual_spark", name: "Ritual Spark", desc: "Fire Soulfire once.", test: () => runStats.rituals >= 1 },
  { id: "ritual_engine", name: "Ritual Engine", desc: "Fire Soulfire 3 times in one run.", test: () => runStats.rituals >= 3 },
  { id: "bounty_claimed", name: "Bounty Claimed", desc: "Complete a hunt bounty.", test: () => runStats.bounties >= 1 },
  { id: "bounty_board", name: "Bounty Board", desc: "Complete 3 bounties in one run.", test: () => runStats.bounties >= 3 },
  { id: "relic_bearer", name: "Relic Bearer", desc: "Claim your first relic.", test: () => runStats.upgrades.length >= 1 },
  { id: "relic_hoard", name: "Relic Hoard", desc: "Carry 3 relics in one run.", test: () => runStats.upgrades.length >= 3 },
  { id: "power_catcher", name: "Power Catcher", desc: "Catch 3 powerups in one run.", test: () => runStats.powerups >= 3 },
  { id: "perfect_wave", name: "Untouched", desc: "Clear a wave without losing a life.", test: () => runStats.perfectWaves >= 1 },
  { id: "perfect_triad", name: "Clean Hunt", desc: "Clear 3 waves untouched in one run.", test: () => runStats.perfectWaves >= 3 },
  { id: "third_gate", name: "Third Gate", desc: "Reach level 3.", test: () => bb_level >= 3 && !isTitleScreen },
  { id: "throne_breaker", name: "Throne Breaker", desc: "Conquer the campaign.", test: () => (record.clears || 0) >= 1 },
  { id: "endless_night", name: "Endless Night", desc: "Enter Endless Night.", test: () => isEndless },
  { id: "gravekeeper_oath", name: "Gravekeeper Oath", desc: "Score 500 as Gravekeeper.", test: () => currentVow === "keeper" && score >= 500 },
  { id: "blood_oath", name: "Blood Oath", desc: "Score 500 under Blood Moon.", test: () => currentVow === "blood" && score >= 500 },
  { id: "soul_oath", name: "Soul Oath", desc: "Score 500 while Soulbound.", test: () => currentVow === "soulbound" && score >= 500 },
  { id: "bone_quarry", progress: () => ({ metric: "bricks", current: runStats.bricks, target: 125 }),  name: "Bone Quarry", desc: "Break 125 bricks in one run.", test: () => runStats.bricks >= 125 },
  { id: "ossuary", progress: () => ({ metric: "bricks", current: runStats.bricks, target: 175 }),  name: "Ossuary", desc: "Break 175 bricks in one run.", test: () => runStats.bricks >= 175 },
  { id: "chain_fifteen", progress: () => ({ metric: "combo", current: runStats.maxCombo, target: 15 }),  name: "Chain Fifteen", desc: "Reach a x15 chain.", test: () => runStats.maxCombo >= 15 },
  { id: "chain_twentyfive", progress: () => ({ metric: "combo", current: runStats.maxCombo, target: 25 }),  name: "Chain Twenty-Five", desc: "Reach a x25 chain.", test: () => runStats.maxCombo >= 25 },
  { id: "ritual_furnace", name: "Ritual Furnace", desc: "Fire Soulfire 5 times in one run.", test: () => runStats.rituals >= 5 },
  { id: "bounty_ledger", name: "Bounty Ledger", desc: "Complete 5 bounties in one run.", test: () => runStats.bounties >= 5 },
  { id: "relic_chapel", name: "Relic Chapel", desc: "Carry 5 relics in one run.", test: () => runStats.upgrades.length >= 5 },
  { id: "power_collector", name: "Power Collector", desc: "Catch 6 powerups in one run.", test: () => runStats.powerups >= 6 },
  { id: "perfect_five", name: "Perfect Five", desc: "Clear 5 waves untouched in one run.", test: () => runStats.perfectWaves >= 5 },
  { id: "fifth_gate", name: "Fifth Gate", desc: "Reach level 5.", test: () => bb_level >= 5 && !isTitleScreen },
  { id: "throne_steps", name: "Throne Steps", desc: "Reach the final campaign level.", test: () => bb_level >= 6 && !isTitleScreen },
  { id: "endless_eight", name: "Endless Eight", desc: "Reach Endless level 8.", test: () => isEndless && bb_level >= 8 },
  { id: "endless_ten", name: "Endless Ten", desc: "Reach Endless level 10.", test: () => isEndless && bb_level >= 10 },
  { id: "score_1000", progress: () => ({ metric: "score", current: Math.max(score, record.bestScore || 0), target: 1000 }),  name: "Crypt Purse", desc: "Score 1,000 points.", test: () => score >= 1000 },
  { id: "score_2000", progress: () => ({ metric: "score", current: Math.max(score, record.bestScore || 0), target: 2000 }),  name: "Bone Banker", desc: "Score 2,000 points.", test: () => score >= 2000 },
  { id: "score_4000", progress: () => ({ metric: "score", current: Math.max(score, record.bestScore || 0), target: 4000 }),  name: "Catacomb King", desc: "Score 4,000 points.", test: () => score >= 4000 },
  { id: "six_lives", name: "Death Insurance", desc: "Hold 6 lives at once.", test: () => lives >= 6 },
  { id: "multiball_four", name: "Bone Storm", desc: "Keep 4 balls alive at once.", test: () => bb_balls.filter(ball => ball.active).length >= 4 },
  { id: "warded", name: "Warded Paddle", desc: "Hold 2 ward charges.", test: () => shieldCharges >= 2 },
  { id: "charged_altar", name: "Charged Altar", desc: "Fill the Soulfire meter.", test: () => ritualCharge >= 100 },
  { id: "keeper_champion", name: "Keeper Champion", desc: "Score 1,000 as Gravekeeper.", test: () => currentVow === "keeper" && score >= 1000 },
  { id: "blood_champion", name: "Blood Champion", desc: "Score 1,000 under Blood Moon.", test: () => currentVow === "blood" && score >= 1000 },
  { id: "soul_champion", name: "Soul Champion", desc: "Score 1,000 while Soulbound.", test: () => currentVow === "soulbound" && score >= 1000 },
  { id: "triple_clear", name: "Triple Clear", desc: "Conquer the campaign 3 times.", test: () => (record.clears || 0) >= 3 },
  { id: "best_wave_8", name: "Wave Eight Record", desc: "Record best wave 8.", test: () => (record.bestWave || 0) >= 8 },
  { id: "best_wave_12", name: "Wave Twelve Record", desc: "Record best wave 12.", test: () => (record.bestWave || 0) >= 12 },
  { id: "best_score_5000", progress: () => ({ metric: "score", current: Math.max(score, record.bestScore || 0), target: 5000 }),  name: "Five Thousand Bones", desc: "Record a best score of 5,000.", test: () => (record.bestScore || 0) >= 5000 || score >= 5000 },
  { id: "altar_breaker", name: "Altar Breaker", desc: "Break into a boss-pattern wave.", test: () => getWaveTheme().pattern === "boss" && !isTitleScreen },
  { id: "late_hunt", name: "Late Hunt", desc: "Reach level 15 in Endless.", test: () => isEndless && bb_level >= 15 },
  { id: "legend_hunt", name: "Legend Hunt", desc: "Reach level 20 in Endless.", test: () => isEndless && bb_level >= 20 }
];

let earnedTrophies = loadTrophies();

function loadTrophies() {
  try {
    const ids = JSON.parse(localStorage.getItem(TROPHY_KEY) || "[]");
    return new Set(Array.isArray(ids) ? ids : []);
  } catch (error) {
    return new Set();
  }
}

function saveTrophies() {
  try {
    localStorage.setItem(TROPHY_KEY, JSON.stringify([...earnedTrophies]));
  } catch (error) {
    // Trophy persistence is optional.
  }
}

function unlockTrophy(trophy) {
  if (!trophy || earnedTrophies.has(trophy.id)) return;
  earnedTrophies.add(trophy.id);
  saveTrophies();
  haptic([18, 30, 18]);
  addScorePop(canvas.width / 2, 110, `TROPHY: ${trophy.name}`, "#ffd27e");
  renderTrophies();
}

function checkTrophies() {
  window.ArcadeUX.trackMetrics({ bricks: runStats.bricks, combo: runStats.maxCombo, score });
  TROPHIES.forEach(trophy => {
    if (!earnedTrophies.has(trophy.id) && trophy.test()) unlockTrophy(trophy);
  });
}

function renderTrophies() {
  if (!trophyListEl) return;
  const earned = earnedTrophies.size;
  if (trophyCountEl) trophyCountEl.textContent = `${earned}/${TROPHIES.length}`;
  if (trophyProgressEl) trophyProgressEl.textContent = `${earned}/${TROPHIES.length} earned`;
  trophyListEl.replaceChildren(...TROPHIES.map(trophy => {
    const unlocked = earnedTrophies.has(trophy.id);
    const row = document.createElement("div");
    const name = document.createElement("strong");
    const desc = document.createElement("span");
    row.className = `trophy-row${unlocked ? "" : " locked"}`;
    name.textContent = trophy.name;
    desc.textContent = trophy.desc;
    row.append(name, desc);
    window.ArcadeUX.trophy(row, unlocked, trophy.progress?.());
    return row;
  }));
}

// -------------------- Audio (simple synth) --------------------
let audioCtx = null;
let masterGain = null;
const SOUND_SETTING_KEY = "boneBreakerSoundV1";
let soundEnabled = true;

try {
  soundEnabled = localStorage.getItem(SOUND_SETTING_KEY) !== "off";
} catch (error) {}

function updateSoundToggle() {
  const button = document.getElementById("title-sound-toggle");
  if (!button) return;
  button.textContent = `Sound: ${soundEnabled ? "On" : "Off"}`;
  button.setAttribute("aria-pressed", String(soundEnabled));
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  try {
    localStorage.setItem(SOUND_SETTING_KEY, soundEnabled ? "on" : "off");
  } catch (error) {}
  if (masterGain && audioCtx) {
    masterGain.gain.setTargetAtTime(window.ArcadeUX.effectsVolume(soundEnabled ? 0.18 : 0), audioCtx.currentTime, 0.025);
  }
  updateSoundToggle();
}

function initAudio() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;

  if (audioCtx) {
    if (audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }
    return;
  }

  audioCtx = new AudioContext();
  masterGain = audioCtx.createGain();
  masterGain.gain.value = soundEnabled ? 0.18 : 0;
  window.ArcadeUX.effectsGain(masterGain, () => soundEnabled ? 0.18 : 0);
  masterGain.connect(audioCtx.destination);
}

function playSound(kind = "hit") {
  if (!audioCtx || !soundEnabled || !window.ArcadeUX.effectsAllowed()) return;
  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }

  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();

  const now = audioCtx.currentTime;
  const map = {
    hit:    { f: 220, dur: 0.06, type: "square" },
    crack:  { f: 165, dur: 0.08, type: "sawtooth" },
    bounce: { f: 330, dur: 0.07, type: "square" },
    power:  { f: 520, dur: 0.10, type: "triangle" },
    curse:  { f: 95,  dur: 0.22, type: "sawtooth" },
    lose:   { f: 110, dur: 0.18, type: "sawtooth" },
    shield: { f: 740, dur: 0.18, type: "triangle" },
    chill:  { f: 280, dur: 0.20, type: "sine" },
    win:    { f: 660, dur: 0.14, type: "triangle" },
    ritual: { f: 880, dur: 0.35, type: "sawtooth" },
    blast:  { f: 72,  dur: 0.25, type: "square" },
    boss:   { f: 125, dur: 0.16, type: "sawtooth" },
  };
  const s = map[kind] || map.hit;

  o.type = s.type;
  o.frequency.setValueAtTime(s.f, now);

  if (kind === "curse") {
    o.frequency.exponentialRampToValueAtTime(45, now + s.dur);
  }

  if (kind === "ritual") {
    o.frequency.exponentialRampToValueAtTime(1320, now + s.dur);
  }

  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(0.25, now + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, now + s.dur);

  o.connect(g);
  g.connect(masterGain);

  o.start(now);
  o.stop(now + s.dur + 0.02);
}

// -------------------- Bone Breaker State --------------------
let bb_paddle = { x: 250, y: 600, w: 100, h: 15 };
let bb_balls = [];
let bb_bricks = [];
let bb_powerups = [];
let bb_level = 1;

const BB_COLS = 8;
const BB_BRICK_W = 60;
const BB_BRICK_H = 22;
const BB_PADDING = 10;
const BB_OFFSET_X = 25;
const BB_OFFSET_Y = 62;
const COMBO_TIMEOUT = 1900;

let wideTimer = 0;
let tinyTimer = 0;
let slowTimer = 0;
let basePaddleBonus = 0;
let powerChanceBonus = 0;
let magnetRadius = 0;
let ritualGainBonus = 0;
let ritualDurationBonus = 0;
let chillOnWaveStart = false;

const LEVEL_THEMES = [
  { name: "Graveyard Gate", flavor: "THE WALL OF BONES WAKES", tint: "#9d1027", pattern: "solid", rows: 3, speedBoost: 0 },
  { name: "Ossuary Steps", flavor: "RELIQUARIES HUM BELOW", tint: "#d18a4d", pattern: "steps", rows: 4, speedBoost: 0.14 },
  { name: "Rot Chapel", flavor: "CURSES BREATHE IN THE STONE", tint: "#7b38ae", pattern: "windows", rows: 5, speedBoost: 0.3 },
  { name: "Blood Belfry", flavor: "THE BELLS WANT A SACRIFICE", tint: "#d9233f", pattern: "bossBell", rows: 6, speedBoost: 0.48 },
  { name: "Catacomb Mouth", flavor: "VOLATILE BONES SHIFT", tint: "#e84b41", pattern: "bossJaw", rows: 7, speedBoost: 0.68 },
  { name: "The Bone Throne", flavor: "SHATTER THE MASTER ALTAR", tint: "#ff455c", pattern: "boss", rows: 8, speedBoost: 0.9 }
];
const CAMPAIGN_LEVELS = LEVEL_THEMES.length;

applyDeveloperModeUnlocks();

const HUNT_VOWS = {
  keeper: {
    name: "Gravekeeper",
    description: "Quick start: three lives and balanced rewards. Clear bounties, then pick relics that change the next wave.",
    lives: 3,
    speedScale: 1,
    startingCharge: 0,
    ritualBonus: 0,
    dropBonus: 0,
    bountyScale: 1,
    curseRisk: 0.68
  },
  blood: {
    name: "Blood Moon",
    description: "Starts a new hunt. Two lives, faster bones, rich bounties, and crueler curses.",
    lives: 2,
    speedScale: 1.14,
    startingCharge: 0,
    ritualBonus: 0,
    dropBonus: 0.02,
    bountyScale: 1.6,
    curseRisk: 0.82
  },
  soulbound: {
    name: "Soulbound",
    description: "Starts a new hunt half charged. Soulfire builds quickly, but bounties pay less.",
    lives: 3,
    speedScale: 1.04,
    startingCharge: 50,
    ritualBonus: 4,
    dropBonus: 0.03,
    bountyScale: 0.85,
    curseRisk: 0.68
  }
};

function getCurrentVow() {
  return HUNT_VOWS[currentVow];
}

function updateVowPicker() {
  const vow = getCurrentVow();
  vowDescriptionEl.textContent = vow.description;
  vowButtons.forEach(button => {
    const selected = button.dataset.vow === currentVow;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
}

function applyDeveloperModeUnlocks() {
  if (!isDeveloperMode()) return;

  record.clears = Math.max(record.clears || 0, 1);
  record.bestWave = Math.max(record.bestWave || 0, CAMPAIGN_LEVELS);
  record.bestScore = Math.max(record.bestScore || 0, 5000);
  persistRecord();
  autoLaunchEnabled = true;
  setAutoLaunch(true);
}

function getWaveTheme(level = bb_level) {
  if (level <= CAMPAIGN_LEVELS) return LEVEL_THEMES[level - 1];

  const theme = LEVEL_THEMES[(level - 1) % LEVEL_THEMES.length];
  return {
    ...theme,
    name: `Endless ${level}: ${theme.name}`,
    flavor: "THE ENDLESS NIGHT DEEPENS",
    pattern: level % 7 === 0 ? "bossBell" : level % 5 === 0 ? "bossJaw" : level % 4 === 0 ? "boss" : theme.pattern
  };
}

function getLevelBackground(level = bb_level) {
  return artwork.levelBackgrounds[(level - 1) % artwork.levelBackgrounds.length];
}

const BRICK_TYPES = {
  bone: {
    name: "Bone",
    hp: 1,
    score: 10,
    fill: "#7a2d2d",
    fill2: "#4a1717",
    stroke: "#210909",
    icon: "BONE",
    text: "#f4e6cf",
    powerChance: 0.10
  },
  cracked: {
    name: "Cracked Bone",
    hp: 2,
    score: 25,
    fill: "#8c7250",
    fill2: "#4d3925",
    stroke: "#24160b",
    icon: "X2",
    text: "#fff0cc",
    powerChance: 0.14
  },
  skull: {
    name: "Skull",
    hp: 1,
    score: 35,
    fill: "#e6dfc9",
    fill2: "#9c9278",
    stroke: "#2b2118",
    icon: "SK",
    text: "#190a0a",
    powerChance: 0.24
  },
  cursed: {
    name: "Cursed",
    hp: 1,
    score: 20,
    fill: "#4e176d",
    fill2: "#1b0826",
    stroke: "#e2a7ff",
    icon: "!",
    text: "#ffffff",
    badge: "#c271ff",
    powerChance: 0.36,
    cursed: true
  },
  coffin: {
    name: "Coffin",
    hp: 3,
    score: 55,
    fill: "#3a1910",
    fill2: "#160806",
    stroke: "#d18a4d",
    icon: "3",
    text: "#f1c27d",
    badge: "#d18a4d",
    powerChance: 0.18
  },
  reliquary: {
    name: "Reliquary",
    hp: 2,
    score: 65,
    fill: "#7f5d17",
    fill2: "#251607",
    stroke: "#ffd27e",
    icon: "$",
    text: "#ffe09a",
    badge: "#ffd27e",
    powerChance: 0.58,
    charge: 24
  },
  volatile: {
    name: "Volatile Bone",
    hp: 1,
    score: 38,
    fill: "#8a1a2c",
    fill2: "#290810",
    stroke: "#ff7686",
    icon: "X",
    text: "#ffffff",
    badge: "#ff455c",
    powerChance: 0.18,
    explosive: true
  },
  altar: {
    name: "Bone Altar",
    hp: 6,
    score: 180,
    fill: "#321449",
    fill2: "#0d0617",
    stroke: "#efb8ff",
    icon: "VI",
    text: "#f6ddff",
    badge: "#efb8ff",
    powerChance: 0.7,
    charge: 32,
    boss: true
  }
};

const POWERUP_INFO = {
  multi: {
    name: "Multi Ball",
    icon: "x3",
    marker: "M",
    color: "#f2edf8",
    bg: "#1e1930",
    good: true
  },
  wide: {
    name: "Wide Paddle",
    icon: "W",
    marker: "W",
    color: "#f0c36a",
    bg: "#3b2409",
    good: true
  },
  slow: {
    name: "Grave Chill",
    icon: "S",
    marker: "S",
    color: "#7df2a4",
    bg: "#0e3526",
    good: true
  },
  shield: {
    name: "Warding Rib",
    icon: "O",
    marker: "O",
    color: "#8ad7ff",
    bg: "#0d2c3c",
    good: true
  },
  soul: {
    name: "Soul Fragment",
    icon: "E",
    marker: "E",
    color: "#ff7686",
    bg: "#3b111c",
    good: true
  },
  cleave: {
    name: "Grave Cleave",
    icon: "|",
    marker: "|",
    color: "#ffd27e",
    bg: "#3d2510",
    good: true
  },
  life: {
    name: "Borrowed Life",
    icon: "+",
    marker: "+",
    color: "#ffb5bf",
    bg: "#421522",
    good: true
  },
  tiny: {
    name: "Cursed Paddle",
    icon: "!",
    marker: "!",
    color: "#d284ff",
    bg: "#2b0d3d",
    good: false
  }
};

const RELIC_POOL = [
  {
    id: "ribs",
    name: "Reinforced Ribs",
    desc: "Paddle permanently grows by 14 pixels.",
    apply() {
      basePaddleBonus += 14;
      resizePaddle(getDesiredPaddleWidth());
    }
  },
  {
    id: "ward",
    name: "Blue Grave Ward",
    desc: "Gain two ward charges against missed balls.",
    apply() {
      shieldCharges = Math.min(4, shieldCharges + 2);
    }
  },
  {
    id: "marrow",
    name: "Living Marrow",
    desc: "Restore one life and gain 150 score.",
    apply() {
      lives = Math.min(6, lives + 1);
      score += 150;
    }
  },
  {
    id: "lantern",
    name: "Ossuary Lantern",
    desc: "Drops appear more often for the rest of the run.",
    apply() {
      powerChanceBonus += 0.06;
    }
  },
  {
    id: "magnet",
    name: "Grave Magnet",
    desc: "Catch falling relics from a wider distance.",
    apply() {
      magnetRadius += 20;
    }
  },
  {
    id: "sigil",
    name: "Soulfire Sigil",
    desc: "Rituals charge faster and burn two seconds longer.",
    apply() {
      ritualGainBonus += 3;
      ritualDurationBonus += 2000;
    }
  },
  {
    id: "frost",
    name: "Winter Tooth",
    desc: "Start each future level with Grave Chill active.",
    apply() {
      chillOnWaveStart = true;
    }
  }
];

function makeWaveBounty() {
  const reward = Math.round((70 + bb_level * 24) * getCurrentVow().bountyScale);
  const options = [
    {
      type: "bricks",
      name: "Bone Tithe",
      label: "Break",
      target: Math.min(bb_bricks.length, 7 + bb_level * 2),
      reward
    },
    {
      type: "chain",
      name: "Chain Rite",
      label: "Chain",
      target: Math.min(10, 4 + Math.floor(bb_level / 2)),
      reward: reward + 35
    },
    {
      type: "untouched",
      name: "No Blood Spilled",
      label: "Clear untouched",
      target: 1,
      reward: reward + 70,
      onClear: true
    }
  ];

  if (bb_level >= 2) {
    options.push({
      type: "powerups",
      name: "Relic Harvest",
      label: "Catch",
      target: bb_level >= 6 ? 3 : 2,
      reward: reward + 30
    });
  }

  if (bb_level >= 3) {
    options.push({
      type: "rituals",
      name: "Soulfire Vow",
      label: "Unleash ritual",
      target: 1,
      reward: reward + 45
    });
  }

  return {
    ...options[Math.floor(Math.random() * options.length)],
    progress: 0,
    complete: false
  };
}

function bountyProgressText() {
  if (!waveBounty) return "Awaiting hunt";
  if (waveBounty.complete) return `CLAIMED +${waveBounty.reward}`;
  if (waveBounty.onClear) return waveBounty.label;
  return `${waveBounty.label} ${waveBounty.progress}/${waveBounty.target}`;
}

function completeBounty() {
  if (!waveBounty || waveBounty.complete) return;
  waveBounty.complete = true;
  runStats.bounties += 1;
  score += waveBounty.reward;
  ritualCharge = clamp(ritualCharge + 14, 0, 100);
  addParticles(canvas.width / 2, 272, "#ffd27e", 36);
  addScorePop(canvas.width / 2, 270, `BOUNTY CLAIMED +${waveBounty.reward}`, "#ffd27e");
  haptic([12, 18, 12]);
  playSound("power");
  updateUI();
}

function advanceBounty(type, amount = 1, absolute = false) {
  if (!waveBounty || waveBounty.complete || waveBounty.type !== type) return;
  waveBounty.progress = absolute ? Math.max(waveBounty.progress, amount) : waveBounty.progress + amount;
  if (waveBounty.progress >= waveBounty.target) completeBounty();
  updateUI();
}

function resolveClearBounty() {
  if (waveBounty && waveBounty.type === "untouched" && waveLivesLost === 0) {
    completeBounty();
  }
}

function updateUI() {
  checkTrophies();
  const displayedBest = Math.max(record.bestScore || 0, score);
  scoreEl.textContent = combo > 1 ? `${score} x${combo}` : String(score);
  bestEl.textContent = String(displayedBest);
  waveEl.textContent = isEndless ? `${bb_level} ENDLESS` : `${bb_level} / ${CAMPAIGN_LEVELS}`;
  livesEl.textContent = String(lives);
  bountyEl.textContent = bountyProgressText();
  bountyChipEl.classList.toggle("bounty-complete", Boolean(waveBounty && waveBounty.complete));
  ritualEl.textContent = ritualCharge >= 100 ? "READY" : `${Math.floor(ritualCharge)}%`;
  const ritualButton = document.getElementById("soulfire");
  ritualButton.textContent = ritualCharge >= 100 ? "Fire Soulfire" : `Soulfire ${Math.floor(ritualCharge)}%`;
  ritualButton.disabled = ritualCharge < 100 || isPaused || isTitleScreen || isGameOver;
  ritualFillEl.style.width = `${ritualCharge}%`;
  if (ritualFillEl.parentElement) {
    const ritualPercent = Math.floor(ritualCharge);
    ritualFillEl.parentElement.setAttribute("aria-valuenow", String(ritualPercent));
    ritualFillEl.parentElement.setAttribute(
      "aria-valuetext",
      ritualCharge >= 100 ? "Ritual ready" : `${ritualPercent} percent charged`
    );
  }
  ritualChipEl.classList.toggle("ritual-ready", ritualCharge >= 100);

  if (powerEl) {
    const active = [];

    if (wideTimer > 0) {
      active.push(`Wide ${Math.ceil(wideTimer / 1000)}s`);
    }

    if (tinyTimer > 0) {
      active.push(`Cursed ${Math.ceil(tinyTimer / 1000)}s`);
    }

    if (slowTimer > 0) {
      active.push(`Chill ${Math.ceil(slowTimer / 1000)}s`);
    }

    if (shieldCharges > 0) {
      active.push(`Ward x${shieldCharges}`);
    }

    if (ritualTimer > 0) {
      active.push(`Soulfire ${Math.ceil(ritualTimer / 1000)}s`);
    }

    if (combo > 1) {
      active.push(`Chain x${combo}`);
    }

    powerEl.textContent = active.length ? `Power: ${active.join(" | ")}` : "Power: None";
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getBallSpeed(level = bb_level) {
  const theme = getWaveTheme(level);
  return Math.min((4.2 + level * 0.34 + (theme.speedBoost || 0)) * getCurrentVow().speedScale, 9.4);
}

function getBallMovementScale() {
  return slowTimer > 0 ? 0.74 : 1;
}

function weightedPick(options) {
  const total = options.reduce((sum, option) => sum + option.weight, 0);
  let roll = Math.random() * total;

  for (const option of options) {
    roll -= option.weight;
    if (roll <= 0) return option.type;
  }

  return options[options.length - 1].type;
}

function setBallAngle(ball, angle) {
  const maxAngle = Math.PI * 0.37;
  const safeAngle = clamp(angle, -maxAngle, maxAngle);
  ball.vx = Math.sin(safeAngle) * ball.speed;
  ball.vy = -Math.cos(safeAngle) * ball.speed;
}

function normalizeBallVelocity(ball) {
  const directionY = ball.vy < 0 ? -1 : 1;
  const currentSpeed = Math.hypot(ball.vx, ball.vy) || ball.speed;
  ball.vx = (ball.vx / currentSpeed) * ball.speed;
  ball.vy = (ball.vy / currentSpeed) * ball.speed;

  const minVx = ball.speed * 0.18;
  if (Math.abs(ball.vx) < minVx) {
    const directionX = ball.vx < 0 ? -1 : 1;
    ball.vx = minVx * directionX;
    ball.vy = directionY * Math.sqrt(Math.max(ball.speed * ball.speed - ball.vx * ball.vx, 0));
  }
}

function resetCombo() {
  combo = 0;
  comboTimer = 0;
  comboRewardTier = 0;
  updateUI();
}

function rewardComboMilestone() {
  const tier = Math.floor(combo / 5);
  if (tier <= comboRewardTier) return;

  comboRewardTier = tier;
  const scoreReward = Math.min(30, 6 + tier * 4);
  const ritualReward = Math.min(18, 5 + tier * 2);
  score += scoreReward;
  chargeRitual(ritualReward);
  addScorePop(canvas.width / 2, 246, `CHAIN x${combo} +${scoreReward}`, "#ffd27e");
  addParticles(canvas.width / 2, 256, "#ffd27e", 10 + tier * 2);
  playSound("power");
}

function chargeRitual(amount) {
  ritualCharge = clamp(ritualCharge + amount + ritualGainBonus, 0, 100);
  updateUI();
}

function unleashRitual() {
  if (ritualCharge < 100 || gamePhase !== "playing" || isPaused || isTitleScreen || isGameOver) return;

  ritualCharge = 0;
  ritualTimer = 7000 + ritualDurationBonus;
  runStats.rituals += 1;
  advanceBounty("rituals");
  addParticles(canvas.width / 2, canvas.height / 2, "#ff7686", 70);
  addScorePop(canvas.width / 2, canvas.height / 2, "SOULFIRE RITUAL", "#ffd27e");
  shakeTimer = 380;
  playSound("ritual");
  updateUI();
}

function renderRunStats() {
  const cards = [
    ["Vow", getCurrentVow().name],
    ["Level", bb_level],
    ["Bricks", runStats.bricks],
    ["Best Chain", `x${runStats.maxCombo}`],
    ["Rituals", runStats.rituals],
    ["Bounties", runStats.bounties],
    ["Perfect Clears", runStats.perfectWaves],
    ["Record", Math.max(score, record.bestScore || 0)]
  ].map(([label, value]) => {
    const card = document.createElement("div");
    const strong = document.createElement("strong");

    card.className = "stat-card";
    card.append(document.createTextNode(label));
    strong.textContent = String(value);
    card.append(strong);

    return card;
  });

  runStatsEl.replaceChildren(...cards);
}

function getBuildSnapshot() {
  return {
    paddle: Math.round(getDesiredPaddleWidth()),
    wards: shieldCharges,
    lives,
    drop: Math.round(powerChanceBonus * 100),
    magnet: magnetRadius,
    ritual: ritualGainBonus,
    burn: Math.round(ritualDurationBonus / 1000),
    chill: chillOnWaveStart
  };
}

function describeRelicImpact(relic) {
  const before = getBuildSnapshot();
  const parts = [];

  if (relic.id === "ribs") parts.push(`Paddle ${before.paddle} -> ${before.paddle + 14}px`);
  if (relic.id === "ward") parts.push(`Wards ${before.wards} -> ${Math.min(4, before.wards + 2)}`);
  if (relic.id === "marrow") parts.push(`Lives ${before.lives} -> ${Math.min(6, before.lives + 1)}`, "Score +150");
  if (relic.id === "lantern") parts.push(`Drop bonus +${before.drop}% -> +${before.drop + 6}%`);
  if (relic.id === "magnet") parts.push(`Catch radius +${before.magnet}px -> +${before.magnet + 20}px`);
  if (relic.id === "sigil") parts.push(`Ritual gain +${before.ritual} -> +${before.ritual + 3}`, `Burn +${before.burn}s -> +${before.burn + 2}s`);
  if (relic.id === "frost") parts.push(before.chill ? "Future waves already start chilled" : "Future waves start with Grave Chill");

  return parts.join(" | ");
}

function showOverlay(title, copy = "The crypt seals shut... unless you break it open again.") {
  commitCareerStats();
  overTitle.textContent = title;
  finalScoreEl.textContent = String(score);
  scoreSummaryEl.classList.remove("hidden");
  overlayCopyEl.textContent = copy;
  runStatsEl.classList.remove("hidden");
  upgradeSelectEl.classList.add("hidden");
  continueEndlessBtn.classList.add("hidden");
  quickRetryBtn.classList.remove("hidden");
  playAgainBtn.classList.remove("hidden");
  playAgainBtn.textContent = "Play Again";
  renderRunStats();
  overlay.classList.remove("hidden");
  overlay.setAttribute("aria-hidden", "false");
  isGameOver = true;
  gamePhase = "over";
  saveRecord(title === "CRYPT CONQUERED");
  submitNationalScore(score);
  updateUI();
}

function hideOverlay() {
  overlay.classList.add("hidden");
  overlay.setAttribute("aria-hidden", "true");
  quickRetryBtn.classList.add("hidden");
}

function setPaused(paused) {
  if (paused && (isGameOver || gamePhase !== "playing")) return;
  isPaused = paused;
  keys = {};
  pauseBtn.textContent = isPaused ? "Resume" : "Pause";
  pauseBtn.setAttribute("aria-pressed", String(isPaused));
  last = performance.now();
  document.getElementById("soulfire").disabled = ritualCharge < 100 || isPaused || isTitleScreen || isGameOver;
}

function getDesiredPaddleWidth() {
  if (tinyTimer > 0) return 72 + basePaddleBonus * 0.45;
  if (wideTimer > 0) return 160 + basePaddleBonus;
  return 100 + basePaddleBonus;
}

function resizePaddle(targetW) {
  const center = bb_paddle.x + bb_paddle.w / 2;
  bb_paddle.w = targetW;
  bb_paddle.x = Math.max(0, Math.min(canvas.width - bb_paddle.w, center - bb_paddle.w / 2));
}

function makeBall(speed, active = false, angle = 0.18) {
  const direction = Math.random() > 0.5 ? 1 : -1;
  const ball = {
    x: canvas.width / 2,
    y: bb_paddle.y - 20,
    r: 8,
    vx: 0,
    vy: 0,
    prevX: canvas.width / 2,
    prevY: bb_paddle.y - 20,
    active,
    speed,
    trail: []
  };

  setBallAngle(ball, angle * direction);
  return ball;
}

function getBrickType(row, col, level) {
  const theme = getWaveTheme(level);
  const bossCols = level >= CAMPAIGN_LEVELS ? [1, 3, 4, 6] : [2, 5];

  if (theme.pattern === "bossBell" && row <= 1 && (col === 1 || col === 6)) return "altar";
  if (theme.pattern === "bossBell" && row === 2 && (col === 3 || col === 4)) return "volatile";
  if (theme.pattern === "bossJaw" && row <= 2 && (col === row || col === BB_COLS - 1 - row)) return "altar";
  if (theme.pattern === "bossJaw" && row >= 3 && (col + row) % 3 === 0) return "coffin";
  if (theme.pattern === "boss" && row === 0 && bossCols.includes(col)) return "altar";
  if (level >= 6 && (row * 2 + col + level) % 11 === 0) return "volatile";
  if (level >= 2 && (row * 4 + col + level) % 13 === 0) return "reliquary";
  if (level >= 5 && (row === 0 || row === 1) && (col + level) % 4 === 0) return "coffin";
  if (level >= 4 && (row + col + level) % 7 === 0) return "cursed";
  if (level >= 3 && (row * 3 + col + level) % 6 === 0) return "skull";
  if (level >= 2 && (row + col + level) % 4 === 0) return "cracked";
  return "bone";
}

function shouldPlaceBrick(row, col, rows, pattern) {
  if (pattern === "steps") return !(row === rows - 1 && (col < 2 || col > 5));
  if (pattern === "windows") return !(row > 0 && row < rows - 1 && (col === 2 || col === 5));
  if (pattern === "diamond") return row < 2 || (col >= row - 1 && col <= BB_COLS - row);
  if (pattern === "bossBell") return row < 2 || col === 0 || col === 7 || (row + col) % 2 === 0;
  if (pattern === "bossJaw") return row < 3 || col <= row - 2 || col >= BB_COLS - row + 1 || row === rows - 1;
  if (pattern === "boss") return row < 2 || col === 1 || col === 6 || (row > 4 && col > 1 && col < 6) || (row + col) % 3 !== 1;
  return true;
}

function createBrick(row, col, typeKey) {
  const type = BRICK_TYPES[typeKey];
  const bonusHp = typeKey === "altar" ? Math.floor(Math.max(0, bb_level - 5) / 5) * 2 : 0;

  return {
    x: BB_OFFSET_X + col * (BB_BRICK_W + BB_PADDING),
    y: BB_OFFSET_Y + row * (BB_BRICK_H + BB_PADDING),
    type: typeKey,
    hp: type.hp + bonusHp,
    maxHp: type.hp + bonusHp,
    status: 1,
    pulse: Math.random() * Math.PI * 2,
    hitFlash: 0
  };
}

function initBreaker(nextLevel = false) {
  setPaused(false);
  if (!nextLevel) {
    const vow = getCurrentVow();
    score = 0;
    lives = vow.lives;
    bb_level = 1;
    isEndless = false;
    ritualCharge = vow.startingCharge;
    ritualTimer = 0;
    wideTimer = 0;
    tinyTimer = 0;
    slowTimer = 0;
    shieldCharges = 0;
    basePaddleBonus = 0;
    powerChanceBonus = vow.dropBonus;
    magnetRadius = 0;
    ritualGainBonus = vow.ritualBonus;
    ritualDurationBonus = 0;
    chillOnWaveStart = false;
    resetRunStats();
    careerCheckpoint = null;
    launchPreviewUnlocked = false;
    const dailyBoost = !isTitleScreen ? window.ArcadeDailyRewards?.consumeBoost("bone-breaker") : null;
    if (dailyBoost?.id === "shield") shieldCharges += dailyBoost.amount;
    if (dailyBoost?.id === "life") lives += dailyBoost.amount;
    if (dailyBoost?.id === "ritual") ritualCharge = Math.min(100, ritualCharge + dailyBoost.amount);
    if (isDeveloperMode()) {
      lives = Math.max(lives, 99);
      shieldCharges = Math.max(shieldCharges, 99);
      ritualCharge = 100;
      launchPreviewUnlocked = true;
    }
    resetCombo();
    particles = [];
    scorePops = [];
    cleaveEffects = [];
    shakeTimer = 0;
    bossPressureTimer = 0;
    isGameOver = false;
    gamePhase = "playing";
    hideOverlay();
    updateVowPicker();
  } else {
    bb_level++;
    isGameOver = false;
    gamePhase = "playing";
    hideOverlay();
    if (isDeveloperMode()) {
      lives = Math.max(lives, 99);
      shieldCharges = Math.max(shieldCharges, 99);
      ritualCharge = 100;
      launchPreviewUnlocked = true;
    }
  }

  resetCombo();
  waveLivesLost = 0;
  waveBannerTimer = 2000;
  bossPressureTimer = 2200;
  const baseW = getDesiredPaddleWidth();
  bb_paddle = { x: canvas.width / 2 - baseW / 2, y: PADDLE_Y, w: baseW, h: PADDLE_H };
  bb_powerups = [];

  bb_balls = [makeBall(getBallSpeed(), false)];
  if (chillOnWaveStart && bb_level > 1) slowTimer = Math.max(slowTimer, 5000);

  bb_bricks = [];
  const theme = getWaveTheme();
  const rows = theme.rows || Math.min(8, 2 + bb_level);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < BB_COLS; c++) {
      if (!shouldPlaceBrick(r, c, rows, theme.pattern)) continue;
      const typeKey = getBrickType(r, c, bb_level);
      bb_bricks.push(createBrick(r, c, typeKey));
    }
  }

  waveBounty = makeWaveBounty();
  updateUI();
}

function spawnPowerup(x, y, brick) {
  const typeData = BRICK_TYPES[brick.type];
  const chance = Math.min(0.92, (typeData.powerChance || 0.12) + powerChanceBonus);

  if (Math.random() > chance) return;

  let type = weightedPick([
    { type: "multi", weight: 27 },
    { type: "wide", weight: 24 },
    { type: "slow", weight: 18 },
    { type: "shield", weight: 15 },
    { type: "soul", weight: 12 },
    ...(bb_level >= 3 ? [{ type: "cleave", weight: 9 }] : []),
    { type: "life", weight: lives < 3 ? 4 : 1 }
  ]);

  if (typeData.cursed) {
    type = Math.random() < getCurrentVow().curseRisk ? "tiny" : type;
  }

  bb_powerups.push({
    x: x + BB_BRICK_W / 2,
    y: y + BB_BRICK_H / 2,
    type,
    vy: type === "tiny" ? 2.4 : 3,
    spin: Math.random() * Math.PI * 2
  });
}

function anyBallUnlaunched() {
  return bb_balls.some(b => !b.active);
}

function launchBalls() {
  if (gamePhase !== "playing") return;
  autoLaunchTimer = 0;

  let launched = false;
  const paddleCenter = bb_paddle.x + bb_paddle.w / 2;
  const aimSource = pointerX >= 0 ? pointerX : paddleCenter + paddleVX * 5;
  const aim = clamp((aimSource - paddleCenter) / (bb_paddle.w / 2), -0.95, 0.95);
  const motionInfluence = clamp(paddleVX / 18, -0.25, 0.25);
  const launchAngle = aim * Math.PI * 0.26 + motionInfluence;

  bb_balls.forEach(b => {
    if (!b.active) {
      setBallAngle(b, launchAngle);
      b.active = true;
      launched = true;
    }
  });

  if (launched) {
    launchPreviewUnlocked = false;
    playSound("bounce");
  }
}

function addMultiBall() {
  if (bb_balls.length === 0) return;

  const ref = bb_balls.find(b => b.active) || bb_balls[0];
  const speed = ref.speed;
  const room = Math.max(0, MAX_BALLS - bb_balls.length);

  if (room <= 0) {
    score += 25;
    addScorePop(ref.x, ref.y, "+25 FULL", "#f2edf8");
    updateUI();
    playSound("power");
    return;
  }

  const makeExtraBall = (angle) => {
    const ball = {
      x: ref.x,
      y: ref.y,
      r: 8,
      vx: 0,
      vy: 0,
      prevX: ref.x,
      prevY: ref.y,
      active: true,
      speed,
      trail: []
    };
    setBallAngle(ball, angle);
    return ball;
  };

  const angles = [-Math.PI * 0.27, Math.PI * 0.27].slice(0, Math.min(2, room));
  angles.forEach(angle => bb_balls.push(makeExtraBall(angle)));

  addParticles(ref.x, ref.y, "#f2edf8", 20);
  playSound("power");
}

function setWidePaddle() {
  wideTimer = 12000;
  tinyTimer = 0;
  resizePaddle(getDesiredPaddleWidth());
  addParticles(bb_paddle.x + bb_paddle.w / 2, bb_paddle.y, "#f0c36a", 18);
  playSound("power");
  updateUI();
}

function setTinyPaddle() {
  tinyTimer = 8000;
  wideTimer = 0;
  resizePaddle(getDesiredPaddleWidth());
  shakeTimer = 280;
  addParticles(bb_paddle.x + bb_paddle.w / 2, bb_paddle.y, "#b36bff", 26);
  playSound("curse");
  updateUI();
}

function setGraveChill() {
  slowTimer = 9000;
  addParticles(canvas.width / 2, canvas.height / 2, "#7df2a4", 34);
  addScorePop(canvas.width / 2, canvas.height / 2 + 26, "GRAVE CHILL", "#7df2a4");
  playSound("chill");
  updateUI();
}

function addShieldCharge() {
  shieldCharges = Math.min(4, shieldCharges + 1);
  addParticles(bb_paddle.x + bb_paddle.w / 2, bb_paddle.y - 6, "#8ad7ff", 28);
  addScorePop(bb_paddle.x + bb_paddle.w / 2, bb_paddle.y - 28, "WARD READY", "#8ad7ff");
  playSound("shield");
  updateUI();
}

function catchSoulFragment() {
  chargeRitual(32);
  addParticles(bb_paddle.x + bb_paddle.w / 2, bb_paddle.y - 8, "#ff7686", 24);
  addScorePop(bb_paddle.x + bb_paddle.w / 2, bb_paddle.y - 28, "SOUL +32", "#ff7686");
  playSound("power");
}

function addBorrowedLife() {
  if (lives >= 6) {
    score += 100;
    addScorePop(bb_paddle.x + bb_paddle.w / 2, bb_paddle.y - 30, "+100 FULL LIFE", "#ffb5bf");
  } else {
    lives += 1;
    addScorePop(bb_paddle.x + bb_paddle.w / 2, bb_paddle.y - 30, "LIFE RESTORED", "#ffb5bf");
  }
  addParticles(bb_paddle.x + bb_paddle.w / 2, bb_paddle.y, "#ffb5bf", 30);
  playSound("shield");
  updateUI();
}

function unleashGraveCleave(targetX) {
  const column = clamp(Math.round((targetX - BB_OFFSET_X - BB_BRICK_W / 2) / (BB_BRICK_W + BB_PADDING)), 0, BB_COLS - 1);
  const strikeX = BB_OFFSET_X + column * (BB_BRICK_W + BB_PADDING) + BB_BRICK_W / 2;
  const targets = bb_bricks.filter(brick => brick.status === 1 && Math.abs(brick.x + BB_BRICK_W / 2 - strikeX) < 2);

  cleaveEffects.push({ x: strikeX, life: 620, maxLife: 620 });
  shakeTimer = Math.max(shakeTimer, 300);
  addParticles(strikeX, 250, "#ffd27e", 42);
  addScorePop(strikeX, 250, "GRAVE CLEAVE", "#ffd27e");

  if (targets.length === 0) {
    chargeRitual(24);
    addScorePop(strikeX, 278, "SOUL +24", "#ff7686");
    playSound("power");
    return;
  }

  targets.forEach(brick => {
    const typeData = BRICK_TYPES[brick.type];
    combo += 1;
    comboTimer = COMBO_TIMEOUT;
    rewardComboMilestone();
    runStats.maxCombo = Math.max(runStats.maxCombo, combo);
    advanceBounty("chain", combo, true);

    if (typeData.boss && brick.hp > 2) {
      brick.hp -= 2;
      brick.hitFlash = 180;
      score += 12;
      chargeRitual(8);
      addScorePop(brick.x + BB_BRICK_W / 2, brick.y + BB_BRICK_H / 2, "CLEAVE +12", "#efb8ff");
    } else {
      brick.hp = 0;
      awardDestroyedBrick(brick, true);
    }
  });

  playSound("blast");
  updateUI();
}

function chooseRelics() {
  const choices = [];
  let available = RELIC_POOL.filter(relic => !runStats.upgrades.includes(relic.id) || relic.id === "ward" || relic.id === "marrow");

  if (available.length < 3) {
    available = [...RELIC_POOL];
  }

  while (choices.length < 3 && available.length > 0) {
    const index = Math.floor(Math.random() * available.length);
    choices.push(available.splice(index, 1)[0]);
  }

  return choices;
}

function showRelicChoice() {
  gamePhase = "upgrade";
  isGameOver = true;
  const perfect = waveLivesLost === 0;
  const clearBonus = 100 + bb_level * 40 + (perfect ? 150 : 0);
  score += clearBonus;
  if (perfect) runStats.perfectWaves += 1;
  saveRecord();

  overTitle.textContent = "CRYPT CLEARED";
  scoreSummaryEl.classList.add("hidden");
  overlayCopyEl.textContent = `${getWaveTheme().name} broken. Clear bonus +${clearBonus}${perfect ? " (untouched)" : ""}. Choose a relic.`;
  runStatsEl.classList.add("hidden");
  playAgainBtn.classList.add("hidden");
  quickRetryBtn.classList.add("hidden");
  continueEndlessBtn.classList.add("hidden");
  upgradeSelectEl.replaceChildren();
  upgradeSelectEl.classList.remove("hidden");

  chooseRelics().forEach(relic => {
    const button = document.createElement("button");
    const name = document.createElement("strong");
    const description = document.createElement("span");
    const comparison = document.createElement("em");

    button.className = "upgrade-card";
    button.type = "button";
    name.textContent = relic.name;
    description.textContent = relic.desc;
    comparison.textContent = describeRelicImpact(relic);
    button.append(name, description, comparison);
    button.addEventListener("click", () => {
      initAudio();
      relic.apply();
      runStats.upgrades.push(relic.id);
      playSound("power");
      initBreaker(true);
    }, { once: true });
    upgradeSelectEl.appendChild(button);
  });

  overlay.classList.remove("hidden");
  overlay.setAttribute("aria-hidden", "false");
  updateUI();
}

function completeCampaign() {
  const perfect = waveLivesLost === 0;
  const finalBonus = 1000 + (perfect ? 300 : 0);
  score += finalBonus;
  if (perfect) runStats.perfectWaves += 1;
  playSound("win");
  showOverlay("CRYPT CONQUERED", `The Bone Throne falls. Victory bonus +${finalBonus}. Endless Night is open for this run.`);
  playAgainBtn.textContent = "New Hunt";
  continueEndlessBtn.classList.remove("hidden");
}

function startEndlessNight() {
  isEndless = true;
  initBreaker(true);
}

function ballBrickCollision(ball, brick) {
  const closestX = Math.max(brick.x, Math.min(ball.x, brick.x + BB_BRICK_W));
  const closestY = Math.max(brick.y, Math.min(ball.y, brick.y + BB_BRICK_H));
  const dx = ball.x - closestX;
  const dy = ball.y - closestY;
  return (dx * dx + dy * dy) <= ball.r * ball.r;
}

function bounceBallOffBrick(ball, brick) {
  const wasAbove = ball.prevY + ball.r <= brick.y;
  const wasBelow = ball.prevY - ball.r >= brick.y + BB_BRICK_H;
  const wasLeft = ball.prevX + ball.r <= brick.x;
  const wasRight = ball.prevX - ball.r >= brick.x + BB_BRICK_W;

  if (wasAbove) {
    ball.y = brick.y - ball.r - 0.5;
    ball.vy = -Math.abs(ball.vy);
    normalizeBallVelocity(ball);
    return;
  }

  if (wasBelow) {
    ball.y = brick.y + BB_BRICK_H + ball.r + 0.5;
    ball.vy = Math.abs(ball.vy);
    normalizeBallVelocity(ball);
    return;
  }

  if (wasLeft) {
    ball.x = brick.x - ball.r - 0.5;
    ball.vx = -Math.abs(ball.vx);
    normalizeBallVelocity(ball);
    return;
  }

  if (wasRight) {
    ball.x = brick.x + BB_BRICK_W + ball.r + 0.5;
    ball.vx = Math.abs(ball.vx);
    normalizeBallVelocity(ball);
    return;
  }

  const overlapLeft = ball.x + ball.r - brick.x;
  const overlapRight = brick.x + BB_BRICK_W - (ball.x - ball.r);
  const overlapTop = ball.y + ball.r - brick.y;
  const overlapBottom = brick.y + BB_BRICK_H - (ball.y - ball.r);
  const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

  if (minOverlap === overlapLeft || minOverlap === overlapRight) {
    ball.vx = -ball.vx;
  } else {
    ball.vy = -ball.vy;
  }

  normalizeBallVelocity(ball);
}

function awardDestroyedBrick(brick, blasted = false) {
  const typeData = BRICK_TYPES[brick.type];
  brick.status = 0;
  runStats.bricks += 1;
  advanceBounty("bricks");
  runStats.maxCombo = Math.max(runStats.maxCombo, combo);
  const comboBonus = Math.min(42, Math.floor(combo / 3) * 3);
  const gained = typeData.score + comboBonus;
  score += gained;
  chargeRitual(typeData.charge || (typeData.boss ? 30 : 8));
  const pop = blasted ? `BLAST +${gained}` : combo > 2 ? `+${gained} x${combo}` : `+${gained}`;
  addScorePop(brick.x + BB_BRICK_W / 2, brick.y + BB_BRICK_H / 2, pop, typeData.text);
  addParticles(brick.x + BB_BRICK_W / 2, brick.y + BB_BRICK_H / 2, typeData.text, typeData.boss ? 32 : typeData.explosive ? 26 : 12);
  spawnPowerup(brick.x, brick.y, brick);
  shakeTimer = Math.max(shakeTimer, typeData.boss ? 230 : typeData.explosive ? 210 : brick.type === "coffin" ? 160 : 90);

  if (typeData.explosive && !blasted) detonateBrick(brick);
  playSound(typeData.explosive ? "blast" : typeData.boss ? "boss" : brick.type === "cursed" ? "curse" : "hit");
}

function detonateBrick(source) {
  bb_bricks.forEach(brick => {
    if (brick.status !== 1 || brick === source) return;
    const closeX = Math.abs(brick.x - source.x) <= BB_BRICK_W + BB_PADDING;
    const closeY = Math.abs(brick.y - source.y) <= BB_BRICK_H + BB_PADDING;
    if (!closeX || !closeY) return;

    combo += 1;
    comboTimer = COMBO_TIMEOUT;
    rewardComboMilestone();
    if (BRICK_TYPES[brick.type].boss && brick.hp > 2) {
      brick.hp -= 2;
      brick.hitFlash = 150;
      score += 12;
      chargeRitual(8);
      addScorePop(brick.x + BB_BRICK_W / 2, brick.y + BB_BRICK_H / 2, "BLAST +12", "#efb8ff");
    } else {
      brick.hp = 0;
      awardDestroyedBrick(brick, true);
    }
  });
  addParticles(source.x + BB_BRICK_W / 2, source.y + BB_BRICK_H / 2, "#ff455c", 38);
}

function damageBrick(brick) {
  const typeData = BRICK_TYPES[brick.type];
  const ritualHit = ritualTimer > 0;
  const damage = ritualHit ? (typeData.boss ? 2 : brick.hp) : 1;

  brick.hp -= damage;
  brick.hitFlash = 150;
  combo += 1;
  comboTimer = COMBO_TIMEOUT;
  rewardComboMilestone();
  runStats.maxCombo = Math.max(runStats.maxCombo, combo);
  advanceBounty("chain", combo, true);

  if (brick.hp <= 0) {
    awardDestroyedBrick(brick);
  } else {
    const chipScore = ritualHit ? 8 : 3;
    score += chipScore;
    chargeRitual(typeData.boss ? 10 : 4);
    addScorePop(brick.x + BB_BRICK_W / 2, brick.y + BB_BRICK_H / 2, `+${chipScore}`, ritualHit ? "#ff7686" : "#f0c36a");
    addParticles(brick.x + BB_BRICK_W / 2, brick.y + BB_BRICK_H / 2, "#f0c36a", 8);
    shakeTimer = Math.max(shakeTimer, typeData.boss ? 150 : 70);
    playSound(typeData.boss ? "boss" : "crack");
  }

  updateUI();
  return ritualHit;
}

function addParticles(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.8) * 4,
      size: 2 + Math.random() * 3,
      life: 350 + Math.random() * 300,
      maxLife: 650,
      color
    });
  }
}

function addScorePop(x, y, text, color) {
  scorePops.push({
    x,
    y,
    text,
    color,
    life: 700,
    maxLife: 700
  });
}

function updateEffects(dt) {
  const step = dt / FRAME_MS;

  waveBannerTimer = Math.max(0, waveBannerTimer - dt);

  if (shakeTimer > 0) {
    shakeTimer = Math.max(0, shakeTimer - dt);
  }

  if (comboTimer > 0) {
    comboTimer = Math.max(0, comboTimer - dt);
    if (comboTimer === 0) resetCombo();
  }

  if (ritualTimer > 0) {
    ritualTimer = Math.max(0, ritualTimer - dt);
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * step;
    p.y += p.vy * step;
    p.vy += 0.05 * step;
    p.life -= dt;

    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }

  for (let i = scorePops.length - 1; i >= 0; i--) {
    const s = scorePops[i];
    s.y -= 0.45 * step;
    s.life -= dt;

    if (s.life <= 0) {
      scorePops.splice(i, 1);
    }
  }

  for (let i = cleaveEffects.length - 1; i >= 0; i--) {
    cleaveEffects[i].life -= dt;
    if (cleaveEffects[i].life <= 0) cleaveEffects.splice(i, 1);
  }
}

function updateBossPressure(dt) {
  const theme = getWaveTheme();
  if (theme.pattern.startsWith("boss") && !anyBallUnlaunched()) {
    bossPressureTimer -= dt;
    if (bossPressureTimer <= 0) {
      const altars = bb_bricks.filter(brick => brick.status === 1 && BRICK_TYPES[brick.type].boss);
      const source = altars[Math.floor(Math.random() * altars.length)] || bb_bricks.find(brick => brick.status === 1);
      if (source) {
        const cursedPulse = Math.random() < 0.68;
        spawnForcedDrop(source.x + BB_BRICK_W / 2, source.y + BB_BRICK_H + 8, cursedPulse ? "tiny" : "soul");
        addScorePop(source.x + BB_BRICK_W / 2, source.y + BB_BRICK_H + 28, cursedPulse ? "ALTAR CURSE" : "ALTAR SOUL", cursedPulse ? "#d284ff" : "#ff7686");
        playSound(cursedPulse ? "curse" : "power");
      }
      bossPressureTimer = clamp(5600 - bb_level * 180, 3100, 5600);
    }
  }
}

function updateBreaker(dt) {
  const step = dt / FRAME_MS;
  updateEffects(dt);
  updateBossPressure(dt);

  const previousCenter = bb_paddle.x + bb_paddle.w / 2;
  const leftPressed = keys["ArrowLeft"] || keys["a"] || keys["A"];
  const rightPressed = keys["ArrowRight"] || keys["d"] || keys["D"];
  const inputAxis = (rightPressed ? 1 : 0) - (leftPressed ? 1 : 0);

  if (pointerX >= 0) {
    const targetX = clamp(pointerX - bb_paddle.w / 2, 0, canvas.width - bb_paddle.w);
    const maxPointerMove = 18 * step;
    bb_paddle.x += clamp(targetX - bb_paddle.x, -maxPointerMove, maxPointerMove);
  } else if (inputAxis !== 0) {
    bb_paddle.x += inputAxis * 9.2 * step;
  }

  bb_paddle.x = clamp(bb_paddle.x, 0, canvas.width - bb_paddle.w);
  paddleVX = ((bb_paddle.x + bb_paddle.w / 2) - previousCenter) / Math.max(step, 0.001);

  if (wideTimer > 0) {
    wideTimer = Math.max(0, wideTimer - dt);
  }

  if (tinyTimer > 0) {
    tinyTimer = Math.max(0, tinyTimer - dt);
  }

  if (slowTimer > 0) {
    slowTimer = Math.max(0, slowTimer - dt);
  }

  const desiredWidth = getDesiredPaddleWidth();
  if (bb_paddle.w !== desiredWidth) {
    resizePaddle(desiredWidth);
  }

  updateUI();

  if (autoLaunchEnabled && anyBallUnlaunched()) {
    autoLaunchTimer += dt;
    if (autoLaunchTimer >= 700) {
      launchBalls();
    }
  } else {
    autoLaunchTimer = 0;
  }

  bb_bricks.forEach(brick => {
    if (brick.hitFlash > 0) {
      brick.hitFlash = Math.max(0, brick.hitFlash - dt);
    }
  });

  for (let i = bb_powerups.length - 1; i >= 0; i--) {
    const p = bb_powerups[i];
    p.y += p.vy * step;
    p.spin += 0.04 * step;

    const caught =
      p.y >= bb_paddle.y &&
      p.y <= bb_paddle.y + bb_paddle.h + 10 &&
      p.x >= bb_paddle.x - magnetRadius &&
      p.x <= bb_paddle.x + bb_paddle.w + magnetRadius;

    if (caught) {
      if (p.type === "multi") addMultiBall();
      if (p.type === "wide") setWidePaddle();
      if (p.type === "slow") setGraveChill();
      if (p.type === "shield") addShieldCharge();
      if (p.type === "soul") catchSoulFragment();
      if (p.type === "cleave") unleashGraveCleave(p.x);
      if (p.type === "life") addBorrowedLife();
      if (p.type === "tiny") setTinyPaddle();

      runStats.powerups += 1;
      advanceBounty("powerups");
      bb_powerups.splice(i, 1);
      continue;
    }

    if (p.y > canvas.height + 40) {
      bb_powerups.splice(i, 1);
    }
  }

  for (let i = bb_balls.length - 1; i >= 0; i--) {
    const b = bb_balls[i];

    if (!b.active) {
      b.x = bb_paddle.x + bb_paddle.w / 2;
      b.y = bb_paddle.y - 18;
      b.prevX = b.x;
      b.prevY = b.y;
      continue;
    }

    b.prevX = b.x;
    b.prevY = b.y;
    const movementScale = getBallMovementScale();
    b.x += b.vx * step * movementScale;
    b.y += b.vy * step * movementScale;

    b.trail.push({ x: b.x, y: b.y, life: 180 });
    if (b.trail.length > 8) b.trail.shift();
    b.trail.forEach(t => { t.life -= dt; });
    b.trail = b.trail.filter(t => t.life > 0);

    if (b.x + b.r > canvas.width) {
      b.x = canvas.width - b.r;
      b.vx = -Math.abs(b.vx);
      playSound("hit");
    }

    if (b.x - b.r < 0) {
      b.x = b.r;
      b.vx = Math.abs(b.vx);
      playSound("hit");
    }

    if (b.y - b.r < 0) {
      b.y = b.r;
      b.vy = Math.abs(b.vy);
      playSound("hit");
    }

    const crossedPaddle = b.prevY + b.r <= bb_paddle.y && b.y + b.r >= bb_paddle.y;
    const inPaddleY = b.y + b.r >= bb_paddle.y && b.y - b.r <= bb_paddle.y + bb_paddle.h;
    const inPaddleX = b.x + b.r >= bb_paddle.x && b.x - b.r <= bb_paddle.x + bb_paddle.w;

    if ((crossedPaddle || inPaddleY) && inPaddleX && b.vy > 0) {
      const relativeHit = clamp((b.x - (bb_paddle.x + bb_paddle.w / 2)) / (bb_paddle.w / 2), -1, 1);
      const angle = relativeHit * Math.PI * 0.34 + clamp(paddleVX / 36, -0.18, 0.18);

      setBallAngle(b, angle);

      b.y = bb_paddle.y - b.r - 1;
      comboTimer = Math.max(comboTimer, 450);
      addParticles(b.x, b.y, "#f0c36a", 4);
      playSound("bounce");
    }

    for (let j = 0; j < bb_bricks.length; j++) {
      const brick = bb_bricks[j];
      if (brick.status !== 1) continue;

      if (ballBrickCollision(b, brick)) {
        const pierced = damageBrick(brick);
        if (!pierced) bounceBallOffBrick(b, brick);
        break;
      }
    }

    if (b.y - b.r > canvas.height) {
      bb_balls.splice(i, 1);
    }
  }

  if (bb_balls.length === 0) {
    if (window.ArcadeDeveloperMode?.preventDeath?.("bone-breaker", "all balls lost")) {
      lives = Math.max(lives, 99);
      shieldCharges = Math.max(shieldCharges, 99);
      resetCombo();
      bb_balls = [makeBall(getBallSpeed(), false)];
      launchPreviewUnlocked = true;
      shakeTimer = 180;
      addParticles(canvas.width / 2, bb_paddle.y - 18, "#8ad7ff", 32);
      addScorePop(canvas.width / 2, bb_paddle.y - 38, "DEV SAVE", "#8ad7ff");
      haptic(18);
      playSound("shield");
      updateUI();
      return;
    }

    if (shieldCharges > 0) {
      shieldCharges -= 1;
      resetCombo();
      bb_balls = [makeBall(getBallSpeed(), false)];
      shakeTimer = 220;
      addParticles(canvas.width / 2, bb_paddle.y - 18, "#8ad7ff", 36);
      addScorePop(canvas.width / 2, bb_paddle.y - 38, "WARD SAVED YOU", "#8ad7ff");
      haptic(18);
      playSound("shield");
      updateUI();
      return;
    }

    lives -= 1;
    waveLivesLost += 1;
    resetCombo();
    updateUI();
    haptic(lives <= 0 ? [28, 40, 42] : 24);
    playSound("lose");
    shakeTimer = 350;

    if (lives <= 0) {
      showOverlay("GAME OVER", `${getWaveTheme().name} claimed your last bone. The hunt remembers your record.`);
      return;
    }

    launchPreviewUnlocked = true;
    bb_balls = [makeBall(getBallSpeed(), false)];
  }

  const remaining = bb_bricks.some(b => b.status === 1);

  if (!remaining) {
    resolveClearBounty();
    haptic([16, 26, 16]);
    playSound("win");
    if (!isEndless && bb_level >= CAMPAIGN_LEVELS) {
      completeCampaign();
    } else {
      showRelicChoice();
    }
  }
}

// -------------------- Drawing --------------------
function roundedRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawSprite(asset, source, x, y, w, h) {
  if (!asset.ready) return false;
  ctx.drawImage(asset.image, source.x, source.y, source.w, source.h, x, y, w, h);
  return true;
}

function drawImageCover(image, x, y, w, h) {
  const scale = Math.max(w / image.width, h / image.height);
  const sourceW = w / scale;
  const sourceH = h / scale;
  const sourceX = (image.width - sourceW) / 2;
  const sourceY = (image.height - sourceH) / 2;
  ctx.drawImage(image, sourceX, sourceY, sourceW, sourceH, x, y, w, h);
}

function drawBackground(now) {
  const theme = getWaveTheme();
  const background = getLevelBackground();
  if (background.ready) {
    drawImageCover(background.image, 0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#03020466";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
    g.addColorStop(0, "#100914");
    g.addColorStop(0.45, "#07060a");
    g.addColorStop(1, "#020203");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.save();
  ctx.globalAlpha = 0.06 + Math.sin(now * 0.0012) * 0.018;
  ctx.fillStyle = theme.tint;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  if (slowTimer > 0) {
    ctx.save();
    ctx.globalAlpha = 0.10 + Math.sin(now * 0.008) * 0.025;
    ctx.fillStyle = "#7df2a4";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  if (ritualTimer > 0) {
    ctx.save();
    ctx.globalAlpha = 0.12 + Math.sin(now * 0.015) * 0.04;
    ctx.fillStyle = "#ff455c";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

}

function drawBrick(brick, now) {
  const typeData = BRICK_TYPES[brick.type];
  const pulse = Math.sin(now * 0.006 + brick.pulse) * 0.5 + 0.5;
  const spriteType = brick.type === "bone" || brick.type === "cracked" ? brick.type : null;

  ctx.save();

  if (brick.type === "cursed") {
    ctx.shadowColor = "#b36bff";
    ctx.shadowBlur = 8 + pulse * 10;
  }

  if (brick.type === "skull") {
    ctx.shadowColor = "#f2edf8";
    ctx.shadowBlur = 6;
  }

  if (spriteType && artwork[spriteType].ready) {
    ctx.shadowColor = brick.type === "cracked" ? "#ff455c" : "#f4e5cf";
    ctx.shadowBlur = brick.hitFlash > 0 ? 12 : 3;
    drawSprite(artwork[spriteType], SPRITE_SOURCE[spriteType], brick.x, brick.y, BB_BRICK_W, BB_BRICK_H);
  } else {
    const grad = ctx.createLinearGradient(brick.x, brick.y, brick.x, brick.y + BB_BRICK_H);
    grad.addColorStop(0, typeData.fill);
    grad.addColorStop(1, typeData.fill2);

    ctx.fillStyle = grad;
    roundedRect(brick.x, brick.y, BB_BRICK_W, BB_BRICK_H, 6);
    ctx.fill();
  }

  if (brick.type === "reliquary" || brick.type === "altar" || brick.type === "volatile") {
    ctx.shadowColor = typeData.stroke;
    ctx.shadowBlur = 6 + pulse * (brick.type === "altar" ? 18 : 10);
  }

  if (brick.hitFlash > 0) {
    ctx.globalAlpha = Math.min(0.75, brick.hitFlash / 150);
    ctx.fillStyle = "#fff4d8";
    roundedRect(brick.x + 2, brick.y + 2, BB_BRICK_W - 4, BB_BRICK_H - 4, 5);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  if (!spriteType || !artwork[spriteType].ready) {
    ctx.strokeStyle = typeData.stroke;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  if (brick.hp < brick.maxHp && !spriteType) {
    ctx.strokeStyle = "#f5d38a";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(brick.x + 10, brick.y + 5);
    ctx.lineTo(brick.x + 24, brick.y + 14);
    ctx.lineTo(brick.x + 18, brick.y + 20);
    ctx.moveTo(brick.x + 38, brick.y + 4);
    ctx.lineTo(brick.x + 48, brick.y + 12);
    ctx.lineTo(brick.x + 41, brick.y + 21);
    ctx.stroke();
  }

  if (!spriteType || !artwork[spriteType].ready) {
    ctx.fillStyle = typeData.text;
    ctx.font = typeData.boss ? "19px VT323" : "18px VT323";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "#000";
    ctx.shadowBlur = 5;
    if (typeData.badge) {
      ctx.fillStyle = typeData.badge;
      roundedRect(brick.x + 19, brick.y + 3, 22, 16, 4);
      ctx.fill();
      ctx.strokeStyle = "#ffffffcc";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = brick.type === "reliquary" || brick.type === "coffin" ? "#140705" : "#ffffff";
    }
    ctx.fillText(typeData.icon, brick.x + BB_BRICK_W / 2, brick.y + BB_BRICK_H / 2 + 1);
  }

  if (brick.maxHp > 1 && !spriteType) {
    ctx.fillStyle = "#fff4d8";
    ctx.font = "14px VT323";
    ctx.textAlign = "right";
    ctx.fillText(String(brick.hp), brick.x + BB_BRICK_W - 6, brick.y + BB_BRICK_H - 5);
  }

  ctx.restore();
}

function drawCleaveEffects() {
  cleaveEffects.forEach(effect => {
    const fade = Math.max(0, effect.life / effect.maxLife);
    ctx.save();
    ctx.globalAlpha = fade * 0.75;
    ctx.shadowColor = "#ffd27e";
    ctx.shadowBlur = 22;
    ctx.strokeStyle = "#ffd27e";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(effect.x, 55);
    ctx.lineTo(effect.x, PADDLE_Y - 18);
    ctx.stroke();
    ctx.globalAlpha = fade * 0.38;
    ctx.lineWidth = 15;
    ctx.strokeStyle = "#ff455c";
    ctx.stroke();
    ctx.restore();
  });
}

function spawnForcedDrop(x, y, type) {
  bb_powerups.push({
    x,
    y,
    type,
    vy: type === "tiny" ? 2.65 : 3.15,
    spin: Math.random() * Math.PI * 2
  });
}

function drawPowerups(now) {
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  bb_powerups.forEach(p => {
    const info = POWERUP_INFO[p.type];
    const bob = Math.sin(now * 0.008 + p.spin) * 2;
    const y = p.y + bob;

    ctx.save();
    ctx.translate(p.x, y);
    ctx.rotate(Math.sin(p.spin) * 0.12);

    ctx.shadowColor = info.good ? info.color : "#d284ff";
    ctx.shadowBlur = info.good ? 16 : 22;
    ctx.fillStyle = info.good ? "#f0c36a33" : "#d284ff44";
    ctx.beginPath();
    ctx.arc(0, 0, info.good ? 20 : 22, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = info.bg;
    if (info.good) {
      roundedRect(-15, -15, 30, 30, 7);
    } else {
      ctx.beginPath();
      ctx.moveTo(0, -22);
      ctx.lineTo(20, 0);
      ctx.lineTo(0, 22);
      ctx.lineTo(-20, 0);
      ctx.closePath();
    }
    ctx.fill();

    ctx.strokeStyle = info.color;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = info.icon.length > 1 ? "18px VT323" : "24px VT323";
    ctx.shadowColor = "#000";
    ctx.shadowBlur = 5;
    ctx.fillText(info.icon, 0, 1);

    ctx.font = "13px VT323";
    ctx.fillStyle = info.good ? "#7df2a4" : "#ff8dff";
    ctx.fillText(info.good ? "POWER" : "CURSE", 0, 33);
    ctx.restore();
  });

  ctx.restore();
}

function drawPaddle() {
  ctx.save();

  if (magnetRadius > 0) {
    ctx.save();
    ctx.globalAlpha = 0.14 + Math.sin(performance.now() * 0.007) * 0.04;
    ctx.strokeStyle = "#ffd27e";
    ctx.setLineDash([4, 7]);
    ctx.beginPath();
    ctx.arc(bb_paddle.x + bb_paddle.w / 2, bb_paddle.y, bb_paddle.w / 2 + magnetRadius, Math.PI, 0);
    ctx.stroke();
    ctx.restore();
  }

  if (shieldCharges > 0) {
    ctx.save();
    ctx.globalAlpha = 0.32 + Math.sin(performance.now() * 0.009) * 0.08;
    ctx.strokeStyle = "#8ad7ff";
    ctx.lineWidth = 2;
    roundedRect(bb_paddle.x - 12, bb_paddle.y - 11, bb_paddle.w + 24, bb_paddle.h + 26, 12);
    ctx.stroke();
    ctx.restore();
  }

  ctx.shadowColor = tinyTimer > 0 ? "#b36bff" : "#d9233f";
  ctx.shadowBlur = tinyTimer > 0 ? 14 : 7;

  if (artwork.platform.ready) {
    drawSprite(artwork.platform, SPRITE_SOURCE.platform, bb_paddle.x, bb_paddle.y - 3, bb_paddle.w, bb_paddle.h + 6);
    if (tinyTimer > 0) {
      ctx.globalAlpha = 0.34;
      ctx.fillStyle = "#b36bff";
      roundedRect(bb_paddle.x, bb_paddle.y - 3, bb_paddle.w, bb_paddle.h + 6, 6);
      ctx.fill();
    }
  } else {
    const grad = ctx.createLinearGradient(bb_paddle.x, bb_paddle.y, bb_paddle.x, bb_paddle.y + bb_paddle.h);
    grad.addColorStop(0, tinyTimer > 0 ? "#4e176d" : "#6b3d2a");
    grad.addColorStop(1, tinyTimer > 0 ? "#180821" : "#2a140e");
    ctx.fillStyle = grad;
    roundedRect(bb_paddle.x, bb_paddle.y, bb_paddle.w, bb_paddle.h, 6);
    ctx.fill();
    ctx.strokeStyle = tinyTimer > 0 ? "#c271ff" : "#f0c36a";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  ctx.restore();
}

function drawBalls() {
  bb_balls.forEach(b => {
    ctx.save();

    const trail = b.trail || [];
    const ballColor = ritualTimer > 0 ? "#ff7686" : slowTimer > 0 ? "#b8ffd3" : "#f2edf8";
    trail.forEach((t, index) => {
      ctx.globalAlpha = (t.life / 180) * (index + 1) / trail.length * 0.36;
      ctx.fillStyle = ballColor;
      ctx.beginPath();
      ctx.arc(t.x, t.y, b.r * 0.8, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.globalAlpha = 1;
    ctx.shadowColor = ballColor;
    ctx.shadowBlur = ritualTimer > 0 ? 22 : 10;

    if (artwork.ball.ready) {
      drawSprite(artwork.ball, SPRITE_SOURCE.ball, b.x - 7, b.y - 16, 14, 34);
    } else {
      ctx.fillStyle = ballColor;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
    }

    if (ritualTimer > 0) {
      ctx.strokeStyle = "#ffd27e";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r + 3, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  });
}

function drawParticles() {
  particles.forEach(p => {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size);
    ctx.restore();
  });
}

function drawScorePops() {
  scorePops.forEach(s => {
    ctx.save();
    ctx.globalAlpha = Math.max(0, s.life / s.maxLife);
    ctx.fillStyle = s.color;
    ctx.font = "22px VT323";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "#000";
    ctx.shadowBlur = 5;
    ctx.fillText(s.text, s.x, s.y);
    ctx.restore();
  });
}

function getLaunchVector() {
  const paddleCenter = bb_paddle.x + bb_paddle.w / 2;
  const aimSource = pointerX >= 0 ? pointerX : paddleCenter + paddleVX * 5;
  const aim = clamp((aimSource - paddleCenter) / (bb_paddle.w / 2), -0.95, 0.95);
  const motionInfluence = clamp(paddleVX / 18, -0.25, 0.25);
  const launchAngle = aim * Math.PI * 0.26 + motionInfluence;

  return {
    x: paddleCenter,
    y: bb_paddle.y - 25,
    vx: Math.sin(launchAngle),
    vy: -Math.cos(launchAngle)
  };
}

function drawAimGuide() {
  const start = getLaunchVector();
  const guideLength = launchPreviewUnlocked ? 370 : 132;
  const points = [{ x: start.x, y: start.y }];
  let x = start.x;
  let y = start.y;
  let vx = start.vx;
  let vy = start.vy;

  for (let i = 0; i < 28; i++) {
    x += vx * (guideLength / 28);
    y += vy * (guideLength / 28);
    if (x < 12 || x > canvas.width - 12) {
      vx *= -1;
      x = clamp(x, 12, canvas.width - 12);
    }
    if (y < 12) {
      vy *= -1;
      y = 12;
    }
    if (y > bb_paddle.y - 22) break;
    points.push({ x, y });
  }

  ctx.save();
  ctx.setLineDash(launchPreviewUnlocked ? [5, 7] : [7, 8]);
  ctx.lineWidth = launchPreviewUnlocked ? 3 : 2;
  ctx.strokeStyle = launchPreviewUnlocked ? "#ffe09a" : "#f0c36a";
  ctx.shadowColor = launchPreviewUnlocked ? "#ffd27e" : "#d9233f";
  ctx.shadowBlur = launchPreviewUnlocked ? 14 : 8;
  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.stroke();
  ctx.setLineDash([]);

  points.forEach((point, index) => {
    if (index === 0 || index % 4 !== 0) return;
    ctx.globalAlpha = 0.35 + index / points.length * 0.45;
    ctx.fillStyle = launchPreviewUnlocked ? "#fff4d8" : "#f0c36a";
    ctx.beginPath();
    ctx.arc(point.x, point.y, launchPreviewUnlocked ? 4 : 3, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawBreaker() {
  const now = performance.now();
  const theme = getWaveTheme();

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();

  if (shakeTimer > 0 && !REDUCED_MOTION) {
    const amount = Math.min(6, shakeTimer / 45);
    ctx.translate((Math.random() - 0.5) * amount, (Math.random() - 0.5) * amount);
  }

  drawBackground(now);
  drawCleaveEffects();

  bb_bricks.forEach(brick => {
    if (brick.status === 1) {
      drawBrick(brick, now);
    }
  });

  drawPowerups(now);
  drawPaddle();
  drawBalls();
  if (anyBallUnlaunched() && !isGameOver) {
    drawAimGuide();
  }
  drawParticles();
  drawScorePops();

  ctx.fillStyle = "#f0c36a";
  ctx.font = "23px VT323";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.shadowColor = "#000";
  ctx.shadowBlur = 6;
  ctx.fillText(isEndless ? `ENDLESS LEVEL: ${bb_level}` : `LEVEL: ${bb_level} / ${CAMPAIGN_LEVELS}`, 18, 30);

  ctx.fillStyle = "#c7bdd8";
  ctx.font = "18px VT323";
  ctx.fillText(theme.flavor, 18, 52);

  ctx.textAlign = "right";
  ctx.fillStyle = ritualCharge >= 100 ? "#ffd27e" : "#c7bdd8";
    ctx.fillText(ritualCharge >= 100 ? "SOULFIRE READY" : `SOULFIRE ${Math.floor(ritualCharge)}%`, canvas.width - 18, 30);
  ctx.fillStyle = "#190c12";
  ctx.fillRect(canvas.width - 142, 39, 124, 8);
  ctx.fillStyle = ritualCharge >= 100 ? "#ffd27e" : "#d9233f";
  ctx.fillRect(canvas.width - 142, 39, 124 * ritualCharge / 100, 8);

  if (anyBallUnlaunched() && !isGameOver && waveBannerTimer <= 0) {
    const launchPrompt = launchPreviewUnlocked
      ? ["TRAJECTORY PREVIEW READY", "AIM, THEN LAUNCH"]
      : ["AIM WITH THE PADDLE", "SPACE / CLICK / TAP TO LAUNCH"];
    ctx.fillStyle = "#ffffff";
    ctx.font = "25px VT323";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.shadowColor = "#d9233f";
    ctx.shadowBlur = 14;
    ctx.fillText(launchPrompt[0], canvas.width / 2, 394);
    ctx.fillText(launchPrompt[1], canvas.width / 2, 420);
  }

  if (waveBannerTimer > 0 && !isGameOver) {
    const alpha = Math.min(1, waveBannerTimer / 350, (2000 - waveBannerTimer) / 300);
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.fillStyle = "#070407cc";
    roundedRect(72, 276, canvas.width - 144, 116, 10);
    ctx.fill();
    ctx.strokeStyle = theme.tint;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#f4e5cf";
    ctx.font = "37px VT323";
    ctx.textAlign = "center";
    ctx.fillText(theme.name.toUpperCase(), canvas.width / 2, 313);
    ctx.fillStyle = "#f0c36a";
    ctx.font = "21px VT323";
    ctx.fillText(theme.pattern.startsWith("boss") ? "BOSS WAVE - SHATTER THE ALTARS" : "PRESS SPACE / TAP TO LAUNCH", canvas.width / 2, 339);
    ctx.fillStyle = "#ffd27e";
    ctx.font = "20px VT323";
    const bountyGoal = waveBounty.onClear ? waveBounty.label : `${waveBounty.label} ${waveBounty.target}`;
    ctx.fillText(`BOUNTY: ${waveBounty.name.toUpperCase()} - ${bountyGoal.toUpperCase()} (+${waveBounty.reward})`, canvas.width / 2, 368);
    ctx.globalAlpha = 1;
  }

  if (isPaused && !isGameOver) {
    ctx.fillStyle = "#030304b8";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#f4e5cf";
    ctx.font = "48px VT323";
    ctx.textAlign = "center";
    ctx.fillText("PAUSED", canvas.width / 2, canvas.height / 2 - 10);
    ctx.fillStyle = "#f0c36a";
    ctx.font = "24px VT323";
    ctx.fillText("PRESS P / ESC OR TAP RESUME", canvas.width / 2, canvas.height / 2 + 30);
  }

  ctx.restore();
}

// -------------------- Loop --------------------
let last = performance.now();
let lastDraw = 0;

function loop(now) {
  const dt = Math.min(32, now - last);
  last = now;

  if (!isTitleScreen && !isGameOver && !isPaused) updateBreaker(dt);
  if (!isTitleScreen && (!isPaused || now - lastDraw >= 150)) {
    drawBreaker();
    lastDraw = now;
  }
  requestAnimationFrame(loop);
}

// -------------------- Input --------------------
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !trophyOverlay.classList.contains("hidden")) {
    e.preventDefault();
    closeTrophiesBtn.click();
    return;
  }

  const interactiveTarget = e.target instanceof Element
    ? e.target.closest("button, input, select, textarea, summary, [contenteditable='true']")
    : null;
  if (interactiveTarget && (e.key === "Enter" || e.key === " ")) return;

  if (isTitleScreen && !interactiveTarget && (e.key === "Enter" || e.key === " ")) {
    e.preventDefault();
    startFromTitle();
    return;
  }

  if ((e.key === "p" || e.key === "P" || e.key === "Escape") && !e.repeat) {
    e.preventDefault();
    setPaused(!isPaused);
    return;
  }

  if (isPaused) return;
  keys[e.key] = true;

  if (e.key === " " || e.code === "Space") {
    initAudio();
    launchBalls();
    e.preventDefault();
  }

  if ((e.key === "r" || e.key === "R") && !e.repeat) {
    initAudio();
    initBreaker(false);
  }

  if ((e.key === "e" || e.key === "E") && !e.repeat) {
    initAudio();
    unleashRitual();
  }
});

window.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

function updatePointerFromEvent(e) {
  const r = canvas.getBoundingClientRect();
  pointerX = clamp((e.clientX - r.left) * (canvas.width / r.width), 0, canvas.width);
}

canvas.addEventListener("pointerdown", (e) => {
  if (isTitleScreen) return;
  if (isPaused) return;
  initAudio();
  canvas.setPointerCapture?.(e.pointerId);
  updatePointerFromEvent(e);
  launchBalls();
  e.preventDefault();
});

canvas.addEventListener("pointermove", (e) => {
  updatePointerFromEvent(e);
  e.preventDefault();
});

canvas.addEventListener("pointerup", (e) => {
  canvas.releasePointerCapture?.(e.pointerId);
  if (e.pointerType !== "touch") pointerX = -1;
});

canvas.addEventListener("pointercancel", () => {
  pointerX = -1;
});

canvas.addEventListener("pointerleave", (e) => {
  if (e.pointerType !== "touch") pointerX = -1;
});

restartBtn.addEventListener("click", () => {
  initAudio();
  isTitleScreen = false;
  titleScreen.hidden = true;
  titleScreen.setAttribute("aria-hidden", "true");
  initBreaker(false);
});

playAgainBtn.addEventListener("click", () => {
  initAudio();
  isTitleScreen = false;
  titleScreen.hidden = true;
  titleScreen.setAttribute("aria-hidden", "true");
  initBreaker(false);
});

quickRetryBtn.addEventListener("click", () => {
  initAudio();
  isTitleScreen = false;
  titleScreen.hidden = true;
  titleScreen.setAttribute("aria-hidden", "true");
  initBreaker(false);
});

pauseBtn.addEventListener("click", () => {
  if (isTitleScreen) return;
  setPaused(!isPaused);
});

if (autoLaunchBtn) {
  autoLaunchBtn.addEventListener("click", () => {
    setAutoLaunch(!autoLaunchEnabled);
  });
}

continueEndlessBtn.addEventListener("click", () => {
  initAudio();
  startEndlessNight();
});

document.getElementById("soulfire").addEventListener("click", () => {
  initAudio();
  unleashRitual();
});

let lastTrophyTrigger;
function openTrophies(trigger) {
  pausedBeforeTrophies = isPaused;
  if (!isTitleScreen && !isGameOver) setPaused(true);
  renderTrophies();
  trophyOverlay.classList.remove("hidden");
  trophyOverlay.setAttribute("aria-hidden", "false");
  lastTrophyTrigger = trigger;
  trigger.setAttribute("aria-expanded", "true");
  closeTrophiesBtn.focus();
}

for (const trigger of [trophiesBtn, document.getElementById("title-trophies")]) {
  trigger?.addEventListener("click", () => openTrophies(trigger));
}

closeTrophiesBtn.addEventListener("click", () => {
  trophyOverlay.classList.add("hidden");
  trophyOverlay.setAttribute("aria-hidden", "true");
  lastTrophyTrigger?.setAttribute("aria-expanded", "false");
  if (!isTitleScreen && !isGameOver) setPaused(pausedBeforeTrophies);
  lastTrophyTrigger?.focus();
});

vowButtons.forEach(button => {
  button.addEventListener("click", () => {
    if (!HUNT_VOWS[button.dataset.vow]) return;
    currentVow = button.dataset.vow;
    initAudio();
    initBreaker(false);
  });
});

function startFromTitle() {
  initAudio();
  isTitleScreen = false;
  titleScreen.hidden = true;
  titleScreen.setAttribute("aria-hidden", "true");
  initBreaker(false);
}

titleStartBtn.addEventListener("click", startFromTitle);

window.addEventListener("blur", () => setPaused(true));
document.addEventListener("visibilitychange", () => {
  if (document.hidden) setPaused(true);
});

// -------------------- Start --------------------
updateAutoLaunchButton();
updateSoundToggle();
document.getElementById("title-sound-toggle")?.addEventListener("click", toggleSound);
renderTrophies();
renderCareerSummary();
initBreaker(false);
requestAnimationFrame(loop);

window.ArcadeUX.registerGame({
  active: () => !isTitleScreen && !isGameOver && gamePhase === "playing",
  paused: () => isPaused,
  pause: setPaused,
  label: () => getCurrentVow().name
});
