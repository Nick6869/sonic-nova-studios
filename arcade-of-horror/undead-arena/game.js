const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

ctx.imageSmoothingEnabled = false;

const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const comboEl = document.getElementById("combo");
const livesEl = document.getElementById("lives");
const armorEl = document.getElementById("armor");
const levelEl = document.getElementById("level");
const remainingEl = document.getElementById("remaining");
const waveModEl = document.getElementById("waveMod");
const dashStatusEl = document.getElementById("dashStatus");
const weaponEl = document.getElementById("weapon");
const ammoEl = document.getElementById("ammo");

const soundToggleBtn = document.getElementById("soundToggle");
const autoAimToggleBtn = document.getElementById("autoAimToggle");
const autoFireToggleBtn = document.getElementById("autoFireToggle");
const titleSoundToggleBtn = document.getElementById("titleSoundToggle");
const titleAutoAimToggleBtn = document.getElementById("titleAutoAimToggle");
const titleAutoFireToggleBtn = document.getElementById("titleAutoFireToggle");
const pauseBtn = document.getElementById("pause");
const restartBtn = document.getElementById("restart");
const pauseOverlay = document.getElementById("pauseOverlay");
const resumeBtn = document.getElementById("resume");
const overlay = document.getElementById("overlay");
const overTitle = document.getElementById("overTitle");
const titleScreen = document.getElementById("titleScreen");
const startRunBtn = document.getElementById("startRun");
const finalScoreEl = document.getElementById("finalScore");
const finalLevelEl = document.getElementById("finalLevel");
const finalBestEl = document.getElementById("finalBest");
const careerSummaryEl = document.getElementById("careerSummary");
const finalCareerEl = document.getElementById("finalCareer");
const playAgainBtn = document.getElementById("playAgain");
const dashBtn = document.getElementById("dash");
const touchPauseBtn = document.getElementById("touchPause");
const touchAimPad = document.getElementById("touchAim");
const touchAimKnob = document.getElementById("touchAimKnob");
const touchFireBtn = document.getElementById("touchFire");
const trophiesBtn = document.getElementById("trophiesBtn");
const trophyCountEl = document.getElementById("trophyCount");
const trophyOverlay = document.getElementById("trophyOverlay");
const trophyProgressEl = document.getElementById("trophyProgress");
const trophyListEl = document.getElementById("trophyList");
const upgradeOverlay = document.getElementById("upgradeOverlay");
const upgradePromptEl = document.getElementById("upgradePrompt");
const upgradeChoicesEl = document.getElementById("upgradeChoices");

const NATIONAL_GAME_ID = "undead-arena";
const NATIONAL_GAME_NAME = "Undead Arena";

function isDeveloperMode() {
  return Boolean(window.ArcadeDeveloperMode?.enabled);
}

window.NationalLeaderboard?.init({
  gameId: NATIONAL_GAME_ID,
  gameName: NATIONAL_GAME_NAME,
  getPersonalScores: () => [
    { label: "Best Score", score: Math.max(bestScore || 0, score || 0) },
    { label: "Best Level", score: Math.max(careerStats?.bestLevel || 1, z_level || 1) }
  ]
});

function submitNationalScore(finalScore) {
  window.NationalLeaderboard?.submitScore(NATIONAL_GAME_ID, finalScore, {
    gameName: NATIONAL_GAME_NAME,
    wave: z_level
  });
}
const closeTrophiesBtn = document.getElementById("closeTrophies");
const weaponButtons = Array.from(document.querySelectorAll("[data-weapon]"));

const world = { w: 1800, h: 1400 };
const camera = { x: 0, y: 0 };
const pointer = { x: canvas.width / 2, y: canvas.height / 2, worldX: 0, worldY: 0, active: false };
const touchAim = { x: 0, y: -1, active: false, ready: false };
let aimPointerId = null;
let firePointerId = null;

const spriteSources = {
  level1: "assets/level1.webp",
  level2: "assets/level2.webp",
  level3: "assets/level3.webp",
  level4: "assets/level4.webp",
  level5: "assets/level5.webp",
  player: "assets/maincharacter.webp",
  zombie1: "assets/zombie1.webp",
  zombie2: "assets/zombie2.webp",
  zombie3: "assets/zombie3.webp",
  boss: "assets/bosszombie1.webp",
  shotgun: "assets/shotgun.webp",
  carbine: "assets/machinegun.webp",
  health: "assets/health.webp",
};
const sprites = {};
for (const [name, source] of Object.entries(spriteSources)) {
  const sprite = new Image();
  sprite.src = source;
  sprites[name] = sprite;
}
const spriteFrames = {
  player: { x: 97, y: 70, w: 64, h: 106 },
  zombie1: { x: 95, y: 76, w: 64, h: 94 },
  zombie2: { x: 90, y: 82, w: 73, h: 91 },
  zombie3: { x: 88, y: 74, w: 80, h: 106 },
  boss: { x: 77, y: 78, w: 101, h: 96 },
  shotgun: { x: 76, y: 112, w: 103, h: 33 },
  carbine: { x: 66, y: 99, w: 130, h: 61 },
  health: { x: 89, y: 84, w: 78, h: 80 },
};

const weapons = [
  { id: "pistol", name: "Pistol", ammo: Infinity, clipText: "INF", cooldown: 15, speed: 13, life: 62, damage: 1, pellets: 1, spread: 0, maxBullets: 12, sound: 880 },
  { id: "shotgun", name: "Shotgun", ammo: 36, clipText: null, cooldown: 42, speed: 10, life: 34, damage: 1, pellets: 5, spread: 0.34, maxBullets: 28, sound: 520 },
  { id: "carbine", name: "Machine Gun", ammo: 90, clipText: null, cooldown: 7, speed: 16, life: 74, damage: 1, pellets: 1, spread: 0.045, maxBullets: 32, sound: 1120 },
  { id: "flamer", name: "Flamer", ammo: 70, clipText: null, cooldown: 5, speed: 8, life: 22, damage: 0.42, pellets: 3, spread: 0.42, maxBullets: 54, sound: 360 },
];
const baseWeaponStats = weapons.map((weapon) => ({ ...weapon }));
const upgradePool = [
  { id: "pistol_focus", title: "Pistol Focus", desc: "Pistol shots hit harder and cycle faster.", apply: () => upgradeWeapon("pistol", { damage: 0.35, cooldown: -2 }) },
  { id: "pistol_pierce", title: "Bone Piercer", desc: "Pistol bullets punch through one extra body.", apply: () => upgradeWeapon("pistol", { pierce: 1, speed: 1 }) },
  { id: "shotgun_choke", title: "Tighter Choke", desc: "Shotgun spread narrows and each shell gains bite.", apply: () => upgradeWeapon("shotgun", { spread: -0.07, damage: 0.18 }) },
  { id: "shotgun_sawnoff", title: "Sawed-Off", desc: "More pellets, shorter reach, louder crowd control.", apply: () => upgradeWeapon("shotgun", { pellets: 1, life: -4, maxBullets: 6 }) },
  { id: "carbine_drum", title: "Drum Mag", desc: "Machine gun fires longer before bullet pressure caps out.", apply: () => upgradeWeapon("carbine", { maxBullets: 12, cooldown: -1 }) },
  { id: "carbine_stabilizer", title: "Stabilizer", desc: "Machine gun gains accuracy and bullet speed.", apply: () => upgradeWeapon("carbine", { spread: -0.014, speed: 1.4 }) },
  { id: "flamer_fuel", title: "Thick Fuel", desc: "Flames linger longer and burn tougher targets.", apply: () => upgradeWeapon("flamer", { life: 6, damage: 0.12 }) },
  { id: "flamer_cone", title: "Wide Cone", desc: "Flamer throws extra tongues of fire.", apply: () => upgradeWeapon("flamer", { pellets: 1, maxBullets: 10 }) },
  { id: "scavenger", title: "Scavenger Map", desc: "Each wave reveals one extra cache and elite drops improve.", apply: () => { z_scavengerLevel++; } },
  { id: "field_medic", title: "Field Medic", desc: "Med pickups can overheal and armor caps higher.", apply: () => { z_medicLevel++; } },
  { id: "quickstep", title: "Quickstep", desc: "Move faster and dash recovers sooner.", apply: () => { z_player.speed += 0.18; z_dashCooldownBonus += 18; } },
  { id: "blast_training", title: "Blast Training", desc: "Explosions hurt you less and wreck enemies wider.", apply: () => { z_blastTraining++; } },
];

const zombieTypes = [
  { id: "walker", color: "#58894b", coat: "#2f4c2a", speed: 1.05, hp: 1, score: 10, size: 28, sprite: "zombie1", renderW: 40, renderH: 58 },
  { id: "runner", color: "#8c9b46", coat: "#534d22", speed: 1.65, hp: 1, score: 12, size: 24, sprite: "zombie2", renderW: 38, renderH: 48 },
  { id: "brute", color: "#6f5a7f", coat: "#3c304d", speed: 0.72, hp: 3, score: 25, size: 36, sprite: "zombie3", renderW: 52, renderH: 68 },
  { id: "spitter", color: "#7bb657", coat: "#263f1f", speed: 0.62, hp: 2, score: 32, size: 30, sprite: "zombie2", renderW: 42, renderH: 54, ranged: true },
  { id: "bloater", color: "#9d7146", coat: "#513421", speed: 0.52, hp: 4, score: 44, size: 42, sprite: "zombie3", renderW: 58, renderH: 74, explosive: true },
  { id: "boss", color: "#762c34", coat: "#36151c", speed: 0.58, hp: 8, score: 80, size: 56, sprite: "boss", renderW: 88, renderH: 84 },
];

const levelPlans = [
  { name: "Hospital", background: "level1", target: 12, spawnRate: 58, obstacleCount: 24, spawnBonus: 0, runnerChance: 0.22, bruteChance: 0, spitterChance: 0, bloaterChance: 0, bossHp: 7, bossSpeed: 0.58, bossShots: false, barrelChance: 0.14, tint: "rgba(7, 18, 20, 0.10)", fog: "rgba(184, 230, 255, 0.04)" },
  { name: "Outside Hospital", background: "level2", target: 16, spawnRate: 50, obstacleCount: 29, spawnBonus: 3, runnerChance: 0.34, bruteChance: 0.10, spitterChance: 0, bloaterChance: 0, bossHp: 10, bossSpeed: 0.66, bossShots: false, barrelChance: 0.18, tint: "rgba(12, 28, 16, 0.12)", fog: "rgba(93, 178, 94, 0.055)" },
  { name: "Carnival", background: "level3", target: 20, spawnRate: 42, obstacleCount: 34, spawnBonus: 6, runnerChance: 0.38, bruteChance: 0.18, spitterChance: 0.10, bloaterChance: 0.04, bossHp: 14, bossSpeed: 0.72, bossShots: true, barrelChance: 0.22, tint: "rgba(62, 10, 28, 0.16)", fog: "rgba(255, 92, 92, 0.065)" },
  { name: "Woods", background: "level4", target: 25, spawnRate: 34, obstacleCount: 40, spawnBonus: 9, runnerChance: 0.40, bruteChance: 0.24, spitterChance: 0.16, bloaterChance: 0.08, bossHp: 19, bossSpeed: 0.78, bossShots: true, barrelChance: 0.24, tint: "rgba(10, 26, 13, 0.18)", fog: "rgba(141, 190, 130, 0.055)" },
  { name: "Graveyard", background: "level5", target: 32, spawnRate: 27, obstacleCount: 46, spawnBonus: 12, runnerChance: 0.42, bruteChance: 0.28, spitterChance: 0.22, bloaterChance: 0.12, bossHp: 26, bossSpeed: 0.86, bossShots: true, barrelChance: 0.28, tint: "rgba(5, 7, 10, 0.20)", fog: "rgba(176, 202, 193, 0.06)" },
  { name: "Police Station", background: "level2", target: 38, spawnRate: 24, obstacleCount: 52, spawnBonus: 15, runnerChance: 0.44, bruteChance: 0.30, spitterChance: 0.24, bloaterChance: 0.15, bossHp: 34, bossSpeed: 0.92, bossShots: true, barrelChance: 0.34, tint: "rgba(21, 29, 47, 0.22)", fog: "rgba(130, 170, 255, 0.07)" },
  { name: "Burn Ward", background: "level1", target: 44, spawnRate: 21, obstacleCount: 58, spawnBonus: 18, runnerChance: 0.46, bruteChance: 0.32, spitterChance: 0.27, bloaterChance: 0.18, bossHp: 42, bossSpeed: 0.98, bossShots: true, barrelChance: 0.38, tint: "rgba(74, 18, 8, 0.24)", fog: "rgba(255, 118, 46, 0.075)" },
];

let keys = {};
let score = 0;
let z_killCombo = 0;
let z_comboTimer = 0;
let lives = 3;
let armor = 0;
let isGameOver = false;
let isPaused = false;
let isTitleScreen = true;

let z_player = { x: world.w / 2, y: world.h / 2, w: 26, h: 26, speed: 3.6, dir: { x: 0, y: -1 } };
let z_bullets = [];
let z_zombies = [];
let z_enemyShots = [];
let z_obstacles = [];
let z_pickups = [];
let z_floatTexts = [];
let z_level = 1;
let z_zombiesToKill = 10;
let z_spawnTimer = 0;
let z_spawnRate = 58;
let z_fireCooldown = 0;
let z_hurtCooldown = 0;
let z_weaponIndex = 0;
let z_dashCooldown = 0;
let z_dashRemaining = 0;
let z_dashDirection = { x: 0, y: -1 };
const touchDirections = new Map();
let z_overdriveTimer = 0;
let z_bossSpawned = false;
let z_waveBanner = "";
let z_waveBannerTimer = 0;
let z_muzzleFlashes = [];
let z_pendingUpgrade = false;
let z_scavengerLevel = 0;
let z_medicLevel = 0;
let z_dashCooldownBonus = 0;
let z_blastTraining = 0;
let z_eliteDropMeter = 0;
let z_cacheDropsLeft = 0;
const HS_KEY = "undead_arena_best";
const SOUND_KEY = "undead_arena_sound";
const AUTO_AIM_KEY = "undead_arena_auto_aim";
const AUTO_FIRE_KEY = "undead_arena_auto_fire";
const TROPHY_KEY = "undead_arena_trophies_v1";
const CAREER_KEY = "undead_arena_career_v1";
let autoAimEnabled = getStorageFlag(AUTO_AIM_KEY, true);
let autoFireEnabled = getStorageFlag(AUTO_FIRE_KEY, false);
const DASH_COOLDOWN = 150;
const DASH_DISTANCE = 108;
function getBest() {
  try {
    return parseInt(localStorage.getItem(HS_KEY), 10) || 0;
  } catch (error) {
    return 0;
  }
}
function setBest(v) {
  try {
    localStorage.setItem(HS_KEY, String(v));
  } catch (error) {
    // A run is still playable if persistence is unavailable.
  }
}
function haptic(pattern = 12) {
  try {
    window.ArcadeUX.vibrate(pattern);
  } catch (error) {
    // Optional mobile feedback.
  }
}
let bestScore = getBest();
let runStats = makeRunStats();
let careerStats = loadCareerStats();

function makeRunStats() {
  return { kills: 0, bosses: 0, pickups: 0, dashes: 0, shots: 0, maxCombo: 0, levelReached: 1, armorPeak: 0, livesLost: 0 };
}

function emptyCareerStats() {
  return { runs: 0, totalScore: 0, kills: 0, bosses: 0, bestLevel: 1, bestCombo: 0 };
}

function loadCareerStats() {
  try {
    const saved = JSON.parse(localStorage.getItem(CAREER_KEY) || "null");
    if (!saved || typeof saved !== "object") return emptyCareerStats();
    return {
      runs: Math.max(0, Number(saved.runs) || 0),
      totalScore: Math.max(0, Number(saved.totalScore) || 0),
      kills: Math.max(0, Number(saved.kills) || 0),
      bosses: Math.max(0, Number(saved.bosses) || 0),
      bestLevel: Math.max(1, Number(saved.bestLevel) || 1),
      bestCombo: Math.max(0, Number(saved.bestCombo) || 0)
    };
  } catch (error) {
    return emptyCareerStats();
  }
}

function saveCareerStats() {
  try {
    localStorage.setItem(CAREER_KEY, JSON.stringify(careerStats));
  } catch (error) {
    // Career stats are a replay bonus; the arena remains playable without storage.
  }
}

function formatCareerNumber(value) {
  return Number(value || 0).toLocaleString();
}

function renderCareerStats() {
  if (!careerSummaryEl) return;
  if (careerStats.runs <= 0) {
    careerSummaryEl.textContent = "No outbreaks logged yet.";
    return;
  }
  careerSummaryEl.textContent =
    `${formatCareerNumber(careerStats.runs)} runs | ${formatCareerNumber(careerStats.kills)} kills | wave ${formatCareerNumber(careerStats.bestLevel)} | combo ${formatCareerNumber(careerStats.bestCombo)}x`;
}

function commitCareerStats() {
  careerStats.runs += 1;
  careerStats.totalScore += score;
  careerStats.kills += runStats.kills;
  careerStats.bosses += runStats.bosses;
  careerStats.bestLevel = Math.max(careerStats.bestLevel, z_level, runStats.levelReached);
  careerStats.bestCombo = Math.max(careerStats.bestCombo, runStats.maxCombo);
  saveCareerStats();
  renderCareerStats();
}

const TROPHIES = [
  { id: "first_blood", progress: () => ({ metric: "kills", current: runStats.kills, target: 1 }),  name: "First Blood", desc: "Kill your first zombie.", test: () => runStats.kills >= 1 },
  { id: "ten_down", progress: () => ({ metric: "kills", current: runStats.kills, target: 10 }),  name: "Ten Down", desc: "Kill 10 zombies in one run.", test: () => runStats.kills >= 10 },
  { id: "fifty_down", progress: () => ({ metric: "kills", current: runStats.kills, target: 50 }),  name: "Fifty Down", desc: "Kill 50 zombies in one run.", test: () => runStats.kills >= 50 },
  { id: "hundred_down", progress: () => ({ metric: "kills", current: runStats.kills, target: 100 }),  name: "Hundred Down", desc: "Kill 100 zombies in one run.", test: () => runStats.kills >= 100 },
  { id: "combo_5", progress: () => ({ metric: "combo", current: runStats.maxCombo, target: 5 }),  name: "Combo Spark", desc: "Reach a 5x combo.", test: () => runStats.maxCombo >= 5 },
  { id: "combo_10", progress: () => ({ metric: "combo", current: runStats.maxCombo, target: 10 }),  name: "Combo Reaper", desc: "Reach a 10x combo.", test: () => runStats.maxCombo >= 10 },
  { id: "level_2", name: "Outside Hospital", desc: "Reach level 2.", test: () => runStats.levelReached >= 2 },
  { id: "level_4", name: "Woods", desc: "Reach level 4.", test: () => runStats.levelReached >= 4 },
  { id: "level_6", name: "Endless Outbreak", desc: "Reach level 6.", test: () => runStats.levelReached >= 6 },
  { id: "first_boss", name: "Boss Breaker", desc: "Kill a boss.", test: () => runStats.bosses >= 1 },
  { id: "three_bosses", name: "Boss Hunter", desc: "Kill 3 bosses in one run.", test: () => runStats.bosses >= 3 },
  { id: "dash_5", name: "Dash Habit", desc: "Dash 5 times in one run.", test: () => runStats.dashes >= 5 },
  { id: "pickup_5", name: "Scavenger", desc: "Collect 5 pickups in one run.", test: () => runStats.pickups >= 5 },
  { id: "armor_6", name: "Armored Up", desc: "Reach 6 armor.", test: () => runStats.armorPeak >= 6 },
  { id: "score_1000", progress: () => ({ metric: "score", current: Math.max(score, bestScore), target: 1000 }),  name: "Arena Purse", desc: "Score 1,000 points.", test: () => score >= 1000 },
  { id: "score_3000", progress: () => ({ metric: "score", current: Math.max(score, bestScore), target: 3000 }),  name: "Arena Legend", desc: "Score 3,000 points.", test: () => score >= 3000 },
  { id: "shotgun", name: "Boomstick", desc: "Use the shotgun.", test: () => z_weaponIndex === 1 },
  { id: "carbine", name: "Sprayer", desc: "Use the machine gun.", test: () => z_weaponIndex === 2 },
  { id: "new_record", name: "New Record", desc: "Beat your best score.", test: () => score > bestScore },
  { id: "survivor", name: "Still Breathing", desc: "Survive with one life remaining.", test: () => lives === 1 && !isGameOver },
  { id: "twentyfive_down", progress: () => ({ metric: "kills", current: runStats.kills, target: 25 }),  name: "Twenty-Five Down", desc: "Kill 25 zombies in one run.", test: () => runStats.kills >= 25 },
  { id: "seventyfive_down", progress: () => ({ metric: "kills", current: runStats.kills, target: 75 }),  name: "Seventy-Five Down", desc: "Kill 75 zombies in one run.", test: () => runStats.kills >= 75 },
  { id: "onefifty_down", progress: () => ({ metric: "kills", current: runStats.kills, target: 150 }),  name: "One-Fifty Down", desc: "Kill 150 zombies in one run.", test: () => runStats.kills >= 150 },
  { id: "combo_12", progress: () => ({ metric: "combo", current: runStats.maxCombo, target: 12 }),  name: "Max Combo", desc: "Reach a 12x combo.", test: () => runStats.maxCombo >= 12 },
  { id: "level_3", name: "Carnival", desc: "Reach level 3.", test: () => runStats.levelReached >= 3 },
  { id: "level_5", name: "Graveyard", desc: "Reach level 5.", test: () => runStats.levelReached >= 5 },
  { id: "level_8", name: "Rot Marathon", desc: "Reach level 8.", test: () => runStats.levelReached >= 8 },
  { id: "level_10", name: "Tenth Outbreak", desc: "Reach level 10.", test: () => runStats.levelReached >= 10 },
  { id: "five_bosses", name: "Boss Collector", desc: "Kill 5 bosses in one run.", test: () => runStats.bosses >= 5 },
  { id: "eight_bosses", name: "Boss Undertaker", desc: "Kill 8 bosses in one run.", test: () => runStats.bosses >= 8 },
  { id: "dash_10", name: "Dash Runner", desc: "Dash 10 times in one run.", test: () => runStats.dashes >= 10 },
  { id: "dash_20", name: "Dash Revenant", desc: "Dash 20 times in one run.", test: () => runStats.dashes >= 20 },
  { id: "pickup_10", name: "Loot Habit", desc: "Collect 10 pickups in one run.", test: () => runStats.pickups >= 10 },
  { id: "pickup_20", name: "Loot Vacuum", desc: "Collect 20 pickups in one run.", test: () => runStats.pickups >= 20 },
  { id: "shots_100", name: "Trigger Warmup", desc: "Fire 100 shots in one run.", test: () => runStats.shots >= 100 },
  { id: "shots_300", name: "Lead Storm", desc: "Fire 300 shots in one run.", test: () => runStats.shots >= 300 },
  { id: "armor_4", name: "Bone Plate", desc: "Reach 4 armor.", test: () => runStats.armorPeak >= 4 },
  { id: "score_500", name: "Grave Purse", desc: "Score 500 points.", test: () => score >= 500 },
  { id: "score_5000", name: "Arena Myth", desc: "Score 5,000 points.", test: () => score >= 5000 },
  { id: "score_8000", name: "Undead Legend", desc: "Score 8,000 points.", test: () => score >= 8000 },
  { id: "best_5000", name: "Record Keeper", desc: "Set a best score of 5,000.", test: () => Math.max(bestScore, score) >= 5000 },
  { id: "two_lives", name: "Close Call", desc: "Survive with two lives remaining.", test: () => lives === 2 && !isGameOver },
  { id: "full_lives", name: "Still Whole", desc: "Reach level 3 without losing a life.", test: () => runStats.levelReached >= 3 && runStats.livesLost === 0 },
  { id: "overdrive", name: "Overdrive", desc: "Activate overdrive.", test: () => z_overdriveTimer > 0 },
  { id: "shotgun_kill_run", name: "Shotgun Run", desc: "Use the shotgun after killing 10 zombies.", test: () => z_weaponIndex === 1 && runStats.kills >= 10 },
  { id: "carbine_kill_run", name: "Carbine Run", desc: "Use the machine gun after killing 10 zombies.", test: () => z_weaponIndex === 2 && runStats.kills >= 10 },
  { id: "boss_and_armor", name: "Armored Boss", desc: "Kill a boss with 4 armor reached.", test: () => runStats.bosses >= 1 && runStats.armorPeak >= 4 },
  { id: "scavenger_boss", name: "Scavenger Boss", desc: "Kill a boss and collect 5 pickups.", test: () => runStats.bosses >= 1 && runStats.pickups >= 5 },
  { id: "dash_boss", name: "Dash Boss", desc: "Kill a boss after dashing 5 times.", test: () => runStats.bosses >= 1 && runStats.dashes >= 5 },
  { id: "marathon", name: "Arena Marathon", desc: "Reach level 6 with at least 75 kills.", test: () => runStats.levelReached >= 6 && runStats.kills >= 75 },
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
  } catch (error) {}
}

function renderTrophies() {
  if (!trophyListEl) return;
  const earned = earnedTrophies.size;
  trophyCountEl.textContent = `${earned}/${TROPHIES.length}`;
  trophyProgressEl.textContent = `${earned}/${TROPHIES.length} earned`;
  trophyListEl.replaceChildren(...TROPHIES.map((trophy) => {
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

function checkTrophies() {
  window.ArcadeUX.trackMetrics({ kills: runStats.kills, combo: runStats.maxCombo, score });
  let unlockedAny = false;
  TROPHIES.forEach((trophy) => {
    if (!earnedTrophies.has(trophy.id) && trophy.test()) {
      earnedTrophies.add(trophy.id);
      const fx = z_player?.x ?? world.w / 2;
      const fy = z_player?.y ?? world.h / 2;
      addFloat(fx, fy - 28, `TROPHY: ${trophy.name}`, "#ffd166");
      haptic([18, 30, 18]);
      unlockedAny = true;
    }
  });
  if (unlockedAny) {
    saveTrophies();
    renderTrophies();
  }
}

let audioCtx = null;
let soundEnabled = getStorageSound();

function getStorageSound() {
  try {
    const raw = localStorage.getItem(SOUND_KEY);
    return raw === null ? true : raw === "1";
  } catch (error) {
    return true;
  }
}

function updateSoundButton() {
  [soundToggleBtn, titleSoundToggleBtn].forEach((button) => {
    if (!button) return;
    button.textContent = `Sound: ${soundEnabled ? "On" : "Off"}`;
    button.setAttribute("aria-pressed", String(soundEnabled));
  });
}

function setSoundEnabled(enabled) {
  soundEnabled = Boolean(enabled);
  try {
    localStorage.setItem(SOUND_KEY, soundEnabled ? "1" : "0");
  } catch (error) {
    // Sound still toggles for this session.
  }
  updateSoundButton();
}

function getStorageFlag(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : raw === "1";
  } catch (error) {
    return fallback;
  }
}

function setStorageFlag(key, enabled) {
  try {
    localStorage.setItem(key, enabled ? "1" : "0");
  } catch (error) {
    // Optional preference storage.
  }
}

function updateAssistButtons() {
  [autoAimToggleBtn, titleAutoAimToggleBtn].forEach((button) => {
    if (!button) return;
    button.textContent = `Aim Assist: ${autoAimEnabled ? "On" : "Off"}`;
    button.setAttribute("aria-pressed", String(autoAimEnabled));
  });
  [autoFireToggleBtn, titleAutoFireToggleBtn].forEach((button) => {
    if (!button) return;
    button.textContent = `Auto Fire: ${autoFireEnabled ? "On" : "Off"}`;
    button.setAttribute("aria-pressed", String(autoFireEnabled));
  });
}

function initAudio() {
  if (audioCtx) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  audioCtx = new AC();
}

function beep(freq = 440, dur = 0.06, type = "square", gain = 0.06) {
  if (!soundEnabled || !window.ArcadeUX.effectsAllowed()) return;
  initAudio();
  if (!audioCtx) return;
  if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});

  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.value = window.ArcadeUX.effectsVolume(gain);
  o.connect(g);
  g.connect(audioCtx.destination);
  o.start();
  o.stop(audioCtx.currentTime + dur);
}

function playSound(name, freq) {
  if (name === "shoot") beep(freq || 880, 0.035, "square", 0.045);
  else if (name === "hit") beep(210, 0.06, "sawtooth", 0.05);
  else if (name === "death") beep(92, 0.14, "triangle", 0.06);
  else if (name === "win") beep(660, 0.08, "square", 0.05);
  else if (name === "pickup") beep(1040, 0.08, "triangle", 0.04);
  else if (name === "empty") beep(130, 0.04, "square", 0.03);
  else if (name === "blast") beep(72, 0.12, "sawtooth", 0.07);
  else if (name === "spit") beep(310, 0.04, "triangle", 0.035);
}

let shakeFrames = 0;
let lastHitCause = "Overwhelmed by the dead.";
function screenShake(frames = 10) {
  if (window.ArcadeUX.motionReduced()) {
    shakeFrames = 0;
    return;
  }

  shakeFrames = Math.max(shakeFrames, frames);
}

function currentWeapon() {
  return weapons[z_weaponIndex];
}

function resetWeaponStats() {
  baseWeaponStats.forEach((base, index) => {
    Object.assign(weapons[index], { ...base });
  });
}

function upgradeWeapon(id, changes) {
  const weapon = weapons.find((item) => item.id === id);
  if (!weapon) return;
  for (const [key, value] of Object.entries(changes)) {
    if (key === "cooldown") weapon.cooldown = Math.max(3, weapon.cooldown + value);
    else if (key === "spread") weapon.spread = Math.max(0, weapon.spread + value);
    else if (key === "pellets") weapon.pellets = Math.max(1, weapon.pellets + value);
    else if (key === "life") weapon.life = Math.max(12, weapon.life + value);
    else if (key === "maxBullets") weapon.maxBullets = Math.max(8, weapon.maxBullets + value);
    else weapon[key] = (weapon[key] || 0) + value;
  }
}

function chooseUpgradeOptions() {
  const bag = upgradePool.slice();
  const choices = [];
  while (choices.length < 3 && bag.length) {
    const [upgrade] = bag.splice(Math.floor(Math.random() * bag.length), 1);
    choices.push(upgrade);
  }
  return choices;
}

function showUpgradeChoices() {
  z_pendingUpgrade = true;
  keys = {};
  releaseTouchAim();
  releaseTouchFire();
  z_waveBanner = "Wave Cleared";
  z_waveBannerTimer = 120;
  upgradePromptEl.textContent = `Level ${z_level - 1} cleared. Pick a build path before ${currentLevelPlan().name}: damage, mobility, armor, ammo, or scavenging.`;
  upgradeChoicesEl.replaceChildren(...chooseUpgradeOptions().map((upgrade) => {
    const button = document.createElement("button");
    const title = document.createElement("strong");
    const desc = document.createElement("span");
    button.type = "button";
    button.className = "upgrade-card";
    title.textContent = upgrade.title;
    desc.textContent = upgrade.desc;
    button.append(title, desc);
    button.addEventListener("click", () => selectUpgrade(upgrade));
    return button;
  }));
  upgradeOverlay.classList.remove("hidden");
  upgradeOverlay.setAttribute("aria-hidden", "false");
}

function selectUpgrade(upgrade) {
  upgrade.apply();
  addFloat(z_player.x, z_player.y - 36, upgrade.title, "#ffd166");
  z_pendingUpgrade = false;
  upgradeOverlay.classList.add("hidden");
  upgradeOverlay.setAttribute("aria-hidden", "true");
  resetZombieLevel();
  updateUI();
}

function applyDeveloperModeLoadout() {
  if (!isDeveloperMode()) return;

  upgradePool.forEach((upgrade) => upgrade.apply());
  lives = Math.max(lives, 9);
  armor = Math.max(armor, 99);
  z_overdriveTimer = Math.max(z_overdriveTimer, 999999);

  weapons.forEach((weapon) => {
    if (Number.isFinite(weapon.ammo)) {
      weapon.ammo = Math.max(weapon.ammo, 999);
    }
  });
}

function currentLevelPlan() {
  const base = levelPlans[Math.min(z_level - 1, levelPlans.length - 1)];
  if (z_level <= levelPlans.length) return base;

  const extra = z_level - levelPlans.length;
  return {
    ...base,
    name: `${base.name} +${extra}`,
    target: base.target + extra * 6,
    spawnRate: Math.max(18, base.spawnRate - extra * 2),
    obstacleCount: base.obstacleCount + extra * 3,
    spawnBonus: base.spawnBonus + extra * 2,
    runnerChance: Math.min(0.48, base.runnerChance + extra * 0.02),
    bruteChance: Math.min(0.36, base.bruteChance + extra * 0.025),
    spitterChance: Math.min(0.30, base.spitterChance + extra * 0.025),
    bloaterChance: Math.min(0.22, (base.bloaterChance || 0) + extra * 0.02),
    bossHp: base.bossHp + extra * 6,
    bossSpeed: base.bossSpeed + extra * 0.04,
  };
}

function updateActionButtons() {
  weaponButtons.forEach((button) => {
    const selected = Number(button.dataset.weapon) === z_weaponIndex;
    button.setAttribute("aria-pressed", String(selected));
  });

  if (dashBtn) {
    const dashDisabled = isPaused || isGameOver || z_dashCooldown > 0;
    dashBtn.disabled = dashDisabled;
    dashBtn.setAttribute("aria-disabled", String(dashDisabled));
  }
}

function updateUI() {
  const weapon = currentWeapon();
  runStats.levelReached = Math.max(runStats.levelReached, z_level);
  runStats.armorPeak = Math.max(runStats.armorPeak, armor);
  scoreEl.textContent = String(score);
  bestEl.textContent = String(Math.max(bestScore, score));
  comboEl.textContent = `${z_killCombo}x`;
  livesEl.textContent = "\u2665".repeat(Math.max(0, lives));
  armorEl.textContent = String(armor);
  levelEl.textContent = String(z_level);
  remainingEl.textContent = String(z_zombiesToKill);
  dashStatusEl.textContent = z_dashCooldown > 0 ? `${Math.ceil(z_dashCooldown / 60)}s` : "Ready";
  dashBtn.textContent = z_dashCooldown > 0 ? `Dash ${Math.ceil(z_dashCooldown / 60)}s` : "Dash ready";
  waveModEl.textContent = currentLevelPlan().name;
  weaponEl.textContent = weapon.name;
  document.getElementById("touchWeaponSelect").value = String(z_weaponIndex);
  ammoEl.textContent = z_overdriveTimer > 0 ? "RAGE" : weapon.clipText || String(weapon.ammo);
  updateActionButtons();
  updateAssistButtons();
  checkTrophies();
}

function initZombie() {
  isGameOver = false;
  setPaused(false);
  score = 0;
  z_killCombo = 0;
  z_comboTimer = 0;
  runStats = makeRunStats();
  lives = 3;
  armor = 0;
  z_level = 1;
  z_zombiesToKill = currentLevelPlan().target;
  z_overdriveTimer = 0;
  z_waveBanner = "";
  z_waveBannerTimer = 0;
  z_weaponIndex = 0;
  resetWeaponStats();
  z_player.speed = 3.6;
  z_pendingUpgrade = false;
  z_scavengerLevel = 0;
  z_medicLevel = 0;
  z_dashCooldownBonus = 0;
  z_blastTraining = 0;
  z_eliteDropMeter = 0;
  z_cacheDropsLeft = 0;
  z_muzzleFlashes = [];
  applyDeveloperModeLoadout();
  upgradeOverlay.classList.add("hidden");
  upgradeOverlay.setAttribute("aria-hidden", "true");
  overlay.classList.add("hidden");
  overlay.setAttribute("aria-hidden", "true");
  updateUI();
  resetZombieLevel();
}

function showTitleScreen() {
  isTitleScreen = true;
  titleScreen.hidden = false;
  titleScreen.setAttribute("aria-hidden", "false");
  updateActionButtons();
}

function startRun() {
  if (!isTitleScreen) return;
  isTitleScreen = false;
  titleScreen.hidden = true;
  titleScreen.setAttribute("aria-hidden", "true");
  keys = {};
  initAudio();
  applyDailyArenaBoost();
  updateActionButtons();
}

function applyDailyArenaBoost() {
  const dailyBoost = window.ArcadeDailyRewards?.consumeBoost("undead-arena");
  if (dailyBoost?.id === "armor") armor += dailyBoost.amount;
  if (dailyBoost?.id === "life") lives += dailyBoost.amount;
  if (dailyBoost?.id === "ammo") {
    weapons[1].ammo += dailyBoost.amount;
    weapons[3].ammo += Math.ceil(dailyBoost.amount * 0.8);
  }
  if (dailyBoost) {
    z_waveBanner = `Daily Offering: ${dailyBoost.label}`;
    z_waveBannerTimer = 180;
    updateUI();
  }
}

function resetZombieLevel() {
  z_player.x = world.w / 2;
  z_player.y = world.h / 2;
  z_bullets = [];
  z_zombies = [];
  z_enemyShots = [];
  z_obstacles = [];
  z_pickups = [];
  z_floatTexts = [];
  z_muzzleFlashes = [];
  z_spawnTimer = 0;
  z_hurtCooldown = 0;
  z_dashCooldown = 0;
  z_dashRemaining = 0;
  z_bossSpawned = false;
  z_cacheDropsLeft = 2 + Math.min(3, z_scavengerLevel);
  const levelPlan = currentLevelPlan();
  z_zombiesToKill = levelPlan.target;
  z_spawnRate = levelPlan.spawnRate;
  z_player.dir = { x: 0, y: -1 };
  z_waveBanner = `Level ${z_level}: ${levelPlan.name}`;
  z_waveBannerTimer = 150;

  const obsCount = levelPlan.obstacleCount;
  let attempts = 0;
  while (z_obstacles.length < obsCount && attempts < obsCount * 20) {
    attempts++;
    const size = 36 + Math.floor(Math.random() * 3) * 12;
    const ox = 80 + Math.random() * (world.w - 160 - size);
    const oy = 80 + Math.random() * (world.h - 160 - size);
    const farFromPlayer = Math.hypot(ox - z_player.x, oy - z_player.y) > 190;
    const overlaps = z_obstacles.some((o) => rectsOverlap(ox, oy, size, size, o.x - 12, o.y - 12, o.w + 24, o.h + 24));
    if (farFromPlayer && !overlaps) {
      const roll = Math.random();
      const kind = roll < levelPlan.barrelChance ? "barrel" : roll < 0.34 ? "barricade" : roll < 0.48 ? "door" : roll < 0.61 ? "trap" : roll < 0.74 ? "grave" : roll < 0.90 ? "tree" : "crate";
      const hp = kind === "barrel" ? 2 : kind === "barricade" ? 5 : kind === "door" ? 3 : kind === "trap" ? 1 : Infinity;
      z_obstacles.push({ x: ox, y: oy, w: size, h: size, kind, hp, armed: kind === "trap", open: false });
    }
  }

  addPickup("ammo", world.w / 2 + 150, world.h / 2 - 90, "CACHE");
  addPickup("med", world.w / 2 - 160, world.h / 2 + 110, "CACHE");
  if (z_level % 2 === 1 || z_scavengerLevel > 0) addPickup("armor", world.w / 2 + 40, world.h / 2 + 145, "CACHE");
  for (let i = 0; i < z_scavengerLevel; i++) addPickup(Math.random() > 0.55 ? "ammo" : "armor", undefined, undefined, "CACHE");

  updateCamera();
  updatePointerWorld();
  updateUI();
}

function addPickup(kind, x, y, label = "") {
  let px = x;
  let py = y;
  let tries = 0;
  do {
    if (x === undefined || y === undefined) {
      px = 90 + Math.random() * (world.w - 180);
      py = 90 + Math.random() * (world.h - 180);
    }
    tries++;
  } while ((checkZombieWall(px, py) || Math.hypot(px - z_player.x, py - z_player.y) < 120) && tries < 30);
  z_pickups.push({ x: px, y: py, w: 24, h: 24, kind, label, bob: Math.random() * Math.PI * 2 });
}

function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function checkZombieWall(x, y, radius = 10) {
  for (const obs of z_obstacles) {
    if (!obs) continue;
    if (obs.kind === "trap" || obs.open) continue;
    if (x + radius > obs.x && x - radius < obs.x + obs.w && y + radius > obs.y && y - radius < obs.y + obs.h) return true;
  }
  return false;
}

function findObstacleAt(x, y, radius = 10) {
  return z_obstacles.find((obs) => (
    obs &&
    x + radius > obs.x &&
    x - radius < obs.x + obs.w &&
    y + radius > obs.y &&
    y - radius < obs.y + obs.h
  ));
}

function damageBarrel(barrel, damage = 1) {
  if (!barrel || barrel.kind !== "barrel") return;
  barrel.hp -= damage;
  if (barrel.hp > 0) return;
  explodeBarrel(barrel);
}

function damageObstacle(obstacle, damage = 1) {
  if (!obstacle || obstacle.hp === Infinity) return;
  if (obstacle.kind === "barrel") {
    damageBarrel(obstacle, damage);
    return;
  }
  obstacle.hp -= damage;
  if (obstacle.hp > 0) return;
  if (obstacle.kind === "door") {
    obstacle.open = true;
    obstacle.hp = 0;
    addFloat(obstacle.x + obstacle.w / 2, obstacle.y, "OPEN", "#b8e6ff");
    playSound("hit");
  } else if (obstacle.kind === "trap") {
    springTrap(obstacle);
  } else {
    z_obstacles = z_obstacles.filter((o) => o !== obstacle);
    addFloat(obstacle.x + obstacle.w / 2, obstacle.y, "BROKEN", "#d8d8df");
    playSound("hit");
  }
}

function explodeBarrel(barrel) {
  const cx = barrel.x + barrel.w / 2;
  const cy = barrel.y + barrel.h / 2;
  const startingLevel = z_level;
  z_obstacles = z_obstacles.filter((o) => o !== barrel);

  for (let i = z_zombies.length - 1; i >= 0; i--) {
    const z = z_zombies[i];
    if (!z) continue;
    const distance = Math.hypot(z.x - cx, z.y - cy);
    if (distance < 150) {
      z.hp -= distance < 82 ? 5 : 2;
      z.hitFlash = 12;
      if (z.hp <= 0) {
        killZombie(i);
        if (z_level !== startingLevel) break;
      }
    }
  }

  if (Math.hypot(z_player.x - cx, z_player.y - cy) < 92 && z_blastTraining <= 0) hurtPlayer(1, 64, "Caught in a barrel explosion.");
  screenShake(18);
  playSound("blast");
}

function springTrap(trap) {
  if (!trap || !trap.armed) return;
  trap.armed = false;
  trap.hp = 0;
  addFloat(trap.x + trap.w / 2, trap.y, "SNAP", "#f49c48");
  screenShake(6);
  for (const z of z_zombies) {
    const distance = Math.hypot(z.x - (trap.x + trap.w / 2), z.y - (trap.y + trap.h / 2));
    if (distance < 104 + z_blastTraining * 18) {
      z.hp -= 2 + z_blastTraining;
      z.hitFlash = 10;
    }
  }
  if (Math.hypot(z_player.x - (trap.x + trap.w / 2), z_player.y - (trap.y + trap.h / 2)) < 66 && z_blastTraining <= 0) hurtPlayer(1, 48, "Caught in a sprung trap.");
  playSound("blast");
}

function hurtPlayer(amount = 1, cooldown = 58, cause = "Overwhelmed by the dead.") {
  if (z_hurtCooldown > 0 || isGameOver) return false;
  if (window.ArcadeDeveloperMode?.preventDeath?.(NATIONAL_GAME_ID, "player hurt")) {
    lives = Math.max(lives, 9);
    armor = Math.max(armor, 99);
    z_hurtCooldown = cooldown;
    addFloat(z_player.x, z_player.y - 34, "DEV SAVE", "#ffd166");
    haptic(18);
    playSound("power");
    screenShake(8);
    updateUI();
    return true;
  }
  let remaining = amount;
  if (armor > 0) {
    const blocked = Math.min(armor, remaining);
    armor -= blocked;
    remaining -= blocked;
  }
  if (remaining > 0) lastHitCause = cause;
  lives -= remaining;
  runStats.livesLost += remaining;
  z_hurtCooldown = cooldown;
  haptic(lives <= 0 ? [30, 40, 45] : 24);
  playSound("death");
  screenShake(14);
  updateUI();
  if (lives <= 0) showGameOver();
  return true;
}

function updateCamera() {
  camera.x = Math.max(0, Math.min(world.w - canvas.width, z_player.x - canvas.width / 2));
  camera.y = Math.max(0, Math.min(world.h - canvas.height, z_player.y - canvas.height / 2));
}

function updatePointerWorld() {
  pointer.worldX = pointer.x + camera.x;
  pointer.worldY = pointer.y + camera.y;
}

function chooseWeapon(index) {
  if (weapons[index]) {
    z_weaponIndex = index;
    updateUI();
  }
}

function aimVector(options = {}) {
  const allowAssist = options.allowAssist !== false && autoAimEnabled;
  if (touchAim.active || (options.useTouchAim && touchAim.ready)) {
    return { x: touchAim.x, y: touchAim.y };
  }
  if (pointer.active) {
    updatePointerWorld();
    const ax = pointer.worldX - z_player.x;
    const ay = pointer.worldY - z_player.y;
    const len = Math.hypot(ax, ay);
    if (len > 0.001) return { x: ax / len, y: ay / len };
  }
  if (allowAssist) {
    const assist = getAimAssistTarget();
    if (assist) {
      const ax = assist.x - z_player.x;
      const ay = assist.y - z_player.y;
      const len = Math.hypot(ax, ay);
      if (len > 0.001) return { x: ax / len, y: ay / len };
    }
  }
  const len = Math.hypot(z_player.dir.x, z_player.dir.y) || 1;
  return { x: z_player.dir.x / len, y: z_player.dir.y / len };
}

function getAimAssistTarget(range = 260) {
  let bestTarget = null;
  let bestDistance = range;
  for (const z of z_zombies) {
    const distance = Math.hypot(z.x - z_player.x, z.y - z_player.y);
    if (distance < bestDistance) {
      bestTarget = z;
      bestDistance = distance;
    }
  }
  return bestTarget;
}

function dashPlayer() {
  if (isTitleScreen || isPaused || isGameOver || z_pendingUpgrade || z_dashCooldown > 0) return;

  let { x: dx, y: dy } = movementInput();
  if (dx === 0 && dy === 0) {
    dx = z_player.dir.x;
    dy = z_player.dir.y;
  }

  const length = Math.hypot(dx, dy) || 1;
  dx /= length;
  dy /= length;
  z_dashDirection = { x: dx, y: dy };
  z_dashRemaining = DASH_DISTANCE;

  z_player.dir = { x: dx, y: dy };
  z_dashCooldown = Math.max(60, DASH_COOLDOWN - z_dashCooldownBonus);
  z_hurtCooldown = Math.max(z_hurtCooldown, 28);
  runStats.dashes++;
  beep(220, 0.055, "sawtooth", 0.045);
  updateUI();
}

function movementInput() {
  const held = key => keys[key] || [...touchDirections.values()].includes(key);
  return {
    x: Number(Boolean(held("ArrowRight") || keys.d || keys.D)) - Number(Boolean(held("ArrowLeft") || keys.a || keys.A)),
    y: Number(Boolean(held("ArrowDown") || keys.s || keys.S)) - Number(Boolean(held("ArrowUp") || keys.w || keys.W))
  };
}

function movePlayer(dx, dy, distance) {
  // Small collision-checked steps also prevent upgraded movement crossing thin walls.
  const steps = Math.max(1, Math.ceil(distance / 4));
  for (let i = 0; i < steps; i++) {
    const nextX = Math.max(20, Math.min(world.w - 20, z_player.x + dx * distance / steps));
    const nextY = Math.max(20, Math.min(world.h - 20, z_player.y + dy * distance / steps));
    if (!checkZombieWall(nextX, z_player.y, 13)) z_player.x = nextX;
    if (!checkZombieWall(z_player.x, nextY, 13)) z_player.y = nextY;
  }
}

function updateZombie() {
  if (z_fireCooldown > 0) z_fireCooldown--;
  if (z_hurtCooldown > 0) z_hurtCooldown--;
  if (z_overdriveTimer > 0) {
    z_overdriveTimer--;
    if (z_overdriveTimer % 60 === 0) updateUI();
  }
  if (z_comboTimer > 0) {
    z_comboTimer--;
    if (z_comboTimer === 0) {
      z_killCombo = 0;
      updateUI();
    }
  }
  if (z_waveBannerTimer > 0) z_waveBannerTimer--;
  if (z_dashCooldown > 0) {
    z_dashCooldown--;
    if (z_dashCooldown % 60 === 0) updateUI();
  }

  let { x: dx, y: dy } = movementInput();

  if (z_dashRemaining > 0) {
    const distance = Math.min(9, z_dashRemaining);
    movePlayer(z_dashDirection.x, z_dashDirection.y, distance);
    z_dashRemaining -= distance;
  } else if (dx !== 0 || dy !== 0) {
    const len = Math.hypot(dx, dy);
    dx /= len;
    dy /= len;
    if (!pointer.active && !touchAim.active) z_player.dir = { x: dx, y: dy };

    movePlayer(dx, dy, z_player.speed);
  }

  updateCamera();
  updatePointerWorld();
  if (pointer.active) z_player.dir = aimVector();
  if (touchAim.active) z_player.dir = aimVector({ useTouchAim: true, allowAssist: autoAimEnabled });
  const autoFire = autoFireEnabled && currentWeapon().ammo > 0 && getAimAssistTarget(360);
  if (keys[" "] || keys.Click) shootWeapon();
  else if (touchAim.active || firePointerId !== null || autoFire) {
    shootWeapon({ useTouchAim: touchAim.ready, allowAssist: autoAimEnabled });
  }
  updateBullets();
  updateEnemyShots();
  updatePickups();
  updateSpawns();
  updateZombies();
}

function shootWeapon(options = {}) {
  const weapon = currentWeapon();
  if (z_fireCooldown > 0 || z_bullets.length >= weapon.maxBullets) return;
  if (weapon.ammo !== Infinity && weapon.ammo <= 0) {
    playSound("empty");
    z_fireCooldown = 12;
    keys[" "] = false;
    keys.Click = false;
    return;
  }

  const aim = aimVector(options);
  z_player.dir = { x: aim.x, y: aim.y };
  const baseAngle = Math.atan2(aim.y, aim.x);
  const muzzleDistance = weapon.id === "pistol" ? 30 : weapon.id === "shotgun" ? 50 : weapon.id === "flamer" ? 44 : 53;
  const startX = z_player.x + Math.cos(baseAngle) * muzzleDistance;
  const startY = z_player.y + Math.sin(baseAngle) * muzzleDistance;

  for (let i = 0; i < weapon.pellets; i++) {
    const pelletSpread = weapon.pellets === 1 ? (Math.random() - 0.5) * weapon.spread : -weapon.spread / 2 + (weapon.spread * i) / (weapon.pellets - 1);
    const angle = baseAngle + pelletSpread + (weapon.id === "flamer" ? (Math.random() - 0.5) * 0.16 : 0);
    z_bullets.push({
      x: startX,
      y: startY,
      vx: Math.cos(angle) * weapon.speed,
      vy: Math.sin(angle) * weapon.speed,
      life: weapon.life + (weapon.id === "flamer" ? Math.floor(Math.random() * 8) : 0),
      maxLife: weapon.life,
      damage: weapon.damage,
      pierce: weapon.pierce || 0,
      kind: weapon.id,
      burn: weapon.id === "flamer"
    });
  }
  z_muzzleFlashes.push({ x: startX, y: startY, angle: baseAngle, life: weapon.id === "flamer" ? 8 : 5, kind: weapon.id });

  runStats.shots++;
  if (weapon.ammo !== Infinity && z_overdriveTimer <= 0) weapon.ammo--;
  z_fireCooldown = z_overdriveTimer > 0 ? Math.max(3, Math.floor(weapon.cooldown * 0.45)) : weapon.cooldown;
  playSound("shoot", weapon.sound);
  if (weapon.id === "shotgun") screenShake(3);
  if (weapon.id !== "carbine" && weapon.id !== "flamer") {
    keys[" "] = false;
    keys.Click = false;
  }
  updateUI();
}

function updateBullets() {
  for (let i = z_bullets.length - 1; i >= 0; i--) {
    const b = z_bullets[i];
    if (!b) continue;

    b.x += b.vx;
    b.y += b.vy;
    b.life--;
    const hitObstacle = findObstacleAt(b.x, b.y, 4);
    if (b.life <= 0 || b.x < 0 || b.x > world.w || b.y < 0 || b.y > world.h || hitObstacle) {
      if (hitObstacle) damageObstacle(hitObstacle, b.damage);
      z_bullets.splice(i, 1);
      continue;
    }

    for (let j = z_zombies.length - 1; j >= 0; j--) {
      const z = z_zombies[j];
      if (!z) continue;
      if (Math.hypot(b.x - z.x, b.y - z.y) < z.size / 2 + (b.burn ? 15 : 4)) {
        z.hp -= b.damage;
        if (b.burn) z.burnTimer = Math.max(z.burnTimer || 0, 105);
        z.hitFlash = 6;
        if (!b.burn && b.pierce > 0) b.pierce--;
        else if (!b.burn) z_bullets.splice(i, 1);
        else b.life = Math.min(b.life, 4);
        if (z.hp <= 0) killZombie(j);
        else playSound("hit");
        break;
      }
    }
  }
}

function updateEnemyShots() {
  for (let i = z_enemyShots.length - 1; i >= 0; i--) {
    const shot = z_enemyShots[i];
    shot.x += shot.vx;
    shot.y += shot.vy;
    shot.life--;

    if (shot.life <= 0 || shot.x < 0 || shot.x > world.w || shot.y < 0 || shot.y > world.h || checkZombieWall(shot.x, shot.y, 5)) {
      z_enemyShots.splice(i, 1);
      continue;
    }

    if (Math.hypot(shot.x - z_player.x, shot.y - z_player.y) < 19) {
      z_enemyShots.splice(i, 1);
      hurtPlayer(1, 46, "Hit by an enemy projectile.");
    }
  }
}

function killZombie(index) {
  const z = z_zombies[index];
  z_zombies.splice(index, 1);
  z_killCombo = Math.min(12, z_killCombo + 1);
  z_comboTimer = 150;
  runStats.kills++;
  runStats.maxCombo = Math.max(runStats.maxCombo, z_killCombo);
  const comboBonus = Math.max(0, z_killCombo - 1) * 3;
  score += z.score + comboBonus;
  if (z.type === "boss") {
    runStats.bosses++;
    haptic([16, 24, 16]);
    z_zombiesToKill--;
  } else {
    z_zombiesToKill = Math.max(1, z_zombiesToKill - 1);
  }
  playSound("hit");
  if (z.explosive) explodeBloater(z);

  maybeDropPickup(z);
  if (z_zombiesToKill <= 0) {
    z_level++;
    playSound("win");
    showUpgradeChoices();
  }
  updateUI();
}

function maybeDropPickup(z) {
  const isElite = z.type === "brute" || z.type === "spitter" || z.type === "bloater" || z.type === "boss";
  if (!isElite) {
    z_eliteDropMeter += 0.18 + z_scavengerLevel * 0.04;
    return;
  }
  z_eliteDropMeter += z.type === "boss" ? 2.2 : 0.9 + z_scavengerLevel * 0.18;
  if (z_eliteDropMeter < 1 && Math.random() > 0.12 + z_scavengerLevel * 0.04) return;
  z_eliteDropMeter = Math.max(0, z_eliteDropMeter - 1);
  const lowAmmo = weapons[1].ammo < 8 || weapons[2].ammo < 22 || weapons[3].ammo < 14;
  const wounded = lives <= 1;
  const roll = Math.random();
  const kind = lowAmmo ? "ammo" : wounded ? "med" : roll > 0.86 ? "overdrive" : roll > 0.58 ? "armor" : roll > 0.24 ? "ammo" : "med";
  addPickup(kind, z.x, z.y, isElite ? "ELITE" : "");
}

function explodeBloater(source) {
  screenShake(8);
  playSound("blast");
  z_floatTexts.push({ x: source.x, y: source.y - 18, text: "BURST", life: 42, color: "#f49c48" });
  for (let i = z_zombies.length - 1; i >= 0; i--) {
    const z = z_zombies[i];
    const distance = Math.hypot(z.x - source.x, z.y - source.y);
    if (distance < 138) {
      z.hp -= distance < 72 ? 2 : 1;
      z.hitFlash = 10;
      if (z.hp <= 0) killZombie(i);
    }
  }
  if (Math.hypot(z_player.x - source.x, z_player.y - source.y) < 96) hurtPlayer(1, 42, "Caught in a bloater burst.");
  for (let i = 0; i < 18; i++) {
    z_enemyShots.push({
      x: source.x,
      y: source.y,
      vx: Math.cos((Math.PI * 2 * i) / 18) * 2.2,
      vy: Math.sin((Math.PI * 2 * i) / 18) * 2.2,
      life: 38
    });
  }
}

function updatePickups() {
  for (let i = z_pickups.length - 1; i >= 0; i--) {
    const p = z_pickups[i];
    p.bob += 0.08;
    if (Math.hypot(p.x - z_player.x, p.y - z_player.y) < 28) {
      if (p.kind === "ammo") {
        weapons[1].ammo += 6 + z_scavengerLevel * 2;
        weapons[2].ammo += 16 + z_scavengerLevel * 4;
        weapons[3].ammo += 9 + z_scavengerLevel * 3;
      } else if (p.kind === "med") {
        lives = Math.min(5 + z_medicLevel, lives + 1);
      } else if (p.kind === "armor") {
        armor = Math.min(6 + z_medicLevel * 2, armor + 2);
        runStats.armorPeak = Math.max(runStats.armorPeak, armor);
      } else if (p.kind === "overdrive") {
        z_overdriveTimer = Math.max(z_overdriveTimer, 420);
        screenShake(5);
      }
      runStats.pickups++;
      z_pickups.splice(i, 1);
      haptic(8);
      playSound("pickup");
      updateUI();
    }
  }
}

function updateSpawns() {
  maybeRevealWaveCache();
  if (z_zombiesToKill <= 1 && !z_bossSpawned) {
    spawnBoss();
    z_spawnTimer = 0;
    return;
  }

  if (z_zombiesToKill <= 1 && z_bossSpawned) return;

  z_spawnTimer++;
  if (z_spawnTimer <= z_spawnRate) return;
  z_spawnTimer = 0;

  spawnZombie(chooseZombieType());
}

function maybeRevealWaveCache() {
  if (z_cacheDropsLeft <= 0 || z_bossSpawned) return;
  const plan = currentLevelPlan();
  const cleared = Math.max(0, plan.target - z_zombiesToKill);
  const threshold = Math.ceil((plan.target / (3 + z_scavengerLevel)) * (3 + z_scavengerLevel - z_cacheDropsLeft));
  if (cleared < threshold) return;
  z_cacheDropsLeft--;
  const lowAmmo = weapons[1].ammo < 8 || weapons[2].ammo < 22 || weapons[3].ammo < 14;
  const kind = lowAmmo ? "ammo" : lives <= 1 ? "med" : Math.random() > 0.62 ? "armor" : "ammo";
  addPickup(kind, undefined, undefined, "CACHE");
  addFloat(z_player.x, z_player.y - 42, "CACHE REVEALED", "#f2c36b");
}

function getSpawnEdgePosition() {
  const edge = Math.floor(Math.random() * 4);
  let zx = 0;
  let zy = 0;
  if (edge === 0) {
    zx = Math.random() * world.w;
    zy = 8;
  } else if (edge === 1) {
    zx = world.w - 8;
    zy = Math.random() * world.h;
  } else if (edge === 2) {
    zx = Math.random() * world.w;
    zy = world.h - 8;
  } else {
    zx = 8;
    zy = Math.random() * world.h;
  }
  return { x: zx, y: zy };
}

function chooseZombieType() {
  const plan = currentLevelPlan();
  const roll = Math.random();
  const bloaterChance = plan.bloaterChance || 0;
  if (roll < bloaterChance) return zombieTypes[4];
  if (roll < bloaterChance + plan.spitterChance) return zombieTypes[3];
  if (roll < bloaterChance + plan.spitterChance + plan.bruteChance) return zombieTypes[2];
  if (roll < bloaterChance + plan.spitterChance + plan.bruteChance + plan.runnerChance) return zombieTypes[1];
  return zombieTypes[0];
}

function spawnZombie(type, overrides = {}) {
  const pos = overrides.x === undefined || overrides.y === undefined ? getSpawnEdgePosition() : { x: overrides.x, y: overrides.y };
  const plan = currentLevelPlan();
  const hp = overrides.hp ?? type.hp;
  z_zombies.push({
    x: pos.x,
    y: pos.y,
    type: overrides.type || type.id,
    speed: overrides.speed ?? (type.speed + plan.spawnBonus * 0.01),
    hp,
    maxHp: hp,
    size: overrides.size ?? type.size,
    color: type.color,
    coat: type.coat,
    sprite: type.sprite,
    renderW: overrides.renderW ?? type.renderW,
    renderH: overrides.renderH ?? type.renderH,
    score: overrides.score ?? type.score,
    ranged: Boolean(overrides.ranged ?? type.ranged),
    explosive: Boolean(overrides.explosive ?? type.explosive),
    shotCooldown: overrides.shotCooldown ?? (55 + Math.random() * 60),
    telegraphTimer: 0,
    telegraphAngle: 0,
    sway: Math.random() * Math.PI * 2,
    hitFlash: 0
  });
}

function spawnBoss() {
  const bossType = zombieTypes[5];
  const plan = currentLevelPlan();
  const pos = getSpawnEdgePosition();
  z_bossSpawned = true;
  z_waveBanner = `Boss: ${plan.name}`;
  z_waveBannerTimer = 170;
  spawnZombie(bossType, {
    x: pos.x,
    y: pos.y,
    type: "boss",
    hp: plan.bossHp,
    speed: plan.bossSpeed,
    size: bossType.size + Math.min(24, (z_level - 1) * 5),
    renderW: bossType.renderW + Math.min(32, (z_level - 1) * 8),
    renderH: bossType.renderH + Math.min(30, (z_level - 1) * 7),
    score: bossType.score + z_level * 35,
    ranged: plan.bossShots,
    shotCooldown: 70
  });
  screenShake(12);
  playSound("win");
}

function updateZombies() {
  for (let i = z_zombies.length - 1; i >= 0; i--) {
    const z = z_zombies[i];
    if (!z) continue;
    z.sway += 0.08;
    if (z.hitFlash > 0) z.hitFlash--;

    const angle = Math.atan2(z_player.y - z.y, z_player.x - z.x);
    const wobble = Math.sin(z.sway) * 0.25;
    const distanceToPlayer = Math.hypot(z_player.x - z.x, z_player.y - z.y);
    const holdRange = z.ranged && distanceToPlayer < 320 && distanceToPlayer > 150;
    const retreat = z.ranged && distanceToPlayer < 130 ? -0.58 : 1;
    const mx = holdRange ? 0 : Math.cos(angle + wobble) * z.speed * retreat;
    const my = holdRange ? 0 : Math.sin(angle + wobble) * z.speed * retreat;
    if (!checkZombieWall(z.x + mx, z.y, z.size / 2)) z.x += mx;
    if (!checkZombieWall(z.x, z.y + my, z.size / 2)) z.y += my;

    if (z.ranged) {
      z.shotCooldown--;
      if (z.shotCooldown <= 24 && distanceToPlayer < 440 && z.telegraphTimer <= 0) {
        z.telegraphTimer = z.type === "boss" ? 34 : 24;
        z.telegraphAngle = angle;
      }
      if (z.telegraphTimer > 0) {
        z.telegraphTimer--;
        z.telegraphAngle = angle;
      }
      if (z.shotCooldown <= 0 && distanceToPlayer < 420) {
        const shotSpeed = (z.type === "boss" ? 3.7 : 4.2) + z_level * 0.08;
        z_enemyShots.push({
          x: z.x,
          y: z.y,
          vx: Math.cos(angle) * shotSpeed,
          vy: Math.sin(angle) * shotSpeed,
          life: z.type === "boss" ? 135 : 110
        });
        if (z.type === "boss") {
          for (const offset of [-0.18, 0.18]) {
            z_enemyShots.push({
              x: z.x,
              y: z.y,
              vx: Math.cos(angle + offset) * (shotSpeed * 0.9),
              vy: Math.sin(angle + offset) * (shotSpeed * 0.9),
              life: 118
            });
          }
        }
        z.telegraphTimer = 0;
        z.shotCooldown = z.type === "boss" ? Math.max(46, 96 - z_level * 5) : 115 - Math.min(35, z_level * 4);
        playSound("spit");
      }
    }

    if (z.burnTimer > 0) {
      z.burnTimer--;
      if (z.burnTimer % 24 === 0) {
        z.hp -= 0.34;
        z.hitFlash = 4;
        if (z.hp <= 0) {
          killZombie(i);
          continue;
        }
      }
    }

    if (z_hurtCooldown <= 0 && Math.hypot(z.x - z_player.x, z.y - z_player.y) < z.size / 2 + 13) {
      if (z.type !== "boss") z_zombies.splice(i, 1);
      else {
        z.x -= Math.cos(angle) * 34;
        z.y -= Math.sin(angle) * 34;
      }
      hurtPlayer(1, 58, z.type === "boss" ? "Caught by a boss." : "Caught by the horde.");
    }

    const trap = z_obstacles.find((o) => o && o.kind === "trap" && o.armed && rectsOverlap(z.x - z.size / 2, z.y - z.size / 2, z.size, z.size, o.x, o.y, o.w, o.h));
    if (trap) {
      springTrap(trap);
      if (z.hp <= 0) killZombie(i);
    }
  }
}

function drawZombie() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (shakeFrames > 0) {
    ctx.translate(Math.round((Math.random() - 0.5) * 8), Math.round((Math.random() - 0.5) * 8));
    shakeFrames--;
  }

  drawWorld();
  ctx.save();
  ctx.translate(-Math.floor(camera.x), -Math.floor(camera.y));
  drawPickups();
  drawObstacles();
  drawZombies();
  drawPlayer();
  drawBullets();
  drawEnemyShots();
  drawFloatingText();
  ctx.restore();
  drawLighting();
  drawMinimap();
  drawWaveBanner();
}

function addFloat(x, y, text, color = "#f2c36b") {
  z_floatTexts.push({ x, y, text, color, life: 96 });
}

function drawFloatingText() {
  ctx.save();
  ctx.font = "700 14px Courier New";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let i = z_floatTexts.length - 1; i >= 0; i--) {
    const item = z_floatTexts[i];
    const alpha = Math.min(1, item.life / 28);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.fillText(item.text, item.x + 1, item.y + 1);
    ctx.fillStyle = item.color;
    ctx.fillText(item.text, item.x, item.y);
    item.y -= 0.34;
    item.life--;
    if (item.life <= 0) z_floatTexts.splice(i, 1);
  }
  ctx.restore();
}

function drawWorld() {
  const plan = currentLevelPlan();
  const backgroundKey = plan.background || "level1";
  if (spriteReady(backgroundKey)) {
    const background = sprites[backgroundKey];
    const sx = (camera.x / world.w) * background.naturalWidth;
    const sy = (camera.y / world.h) * background.naturalHeight;
    const sw = (canvas.width / world.w) * background.naturalWidth;
    const sh = (canvas.height / world.h) * background.naturalHeight;
    ctx.drawImage(background, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    ctx.fillStyle = plan.tint;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawArenaFog();
    return;
  }

  const palette = z_level >= 3
    ? { base: "#211417", grid: "#392125", stain: "#4b1d24" }
    : z_level === 2
      ? { base: "#101711", grid: "#1f2f20", stain: "#263b21" }
      : { base: "#12191a", grid: "#223036", stain: "#303327" };

  ctx.fillStyle = palette.base;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const grid = 48;
  const startX = -Math.floor(camera.x % grid);
  const startY = -Math.floor(camera.y % grid);
  ctx.fillStyle = palette.grid;
  for (let x = startX; x < canvas.width; x += grid) ctx.fillRect(x, 0, 2, canvas.height);
  for (let y = startY; y < canvas.height; y += grid) ctx.fillRect(0, y, canvas.width, 2);

  ctx.fillStyle = palette.stain;
  for (let i = 0; i < 18; i++) {
    const sx = ((i * 281 + 173) % world.w) - camera.x;
    const sy = ((i * 197 + 311) % world.h) - camera.y;
    if (sx > -80 && sx < canvas.width + 80 && sy > -80 && sy < canvas.height + 80) pixelRect(sx, sy, 38 + (i % 3) * 14, 10 + (i % 4) * 5, palette.stain);
  }
  drawArenaFog();
}

function drawArenaFog() {
  const theme = currentLevelPlan();
  ctx.fillStyle = theme.fog;
  const drift = (performance.now() * 0.018) % 220;
  for (let i = 0; i < 7; i++) {
    const y = ((i * 97 + drift) % (canvas.height + 180)) - 90;
    ctx.fillRect(0, y, canvas.width, 28 + (i % 3) * 9);
  }
}

function drawObstacles() {
  for (const o of z_obstacles) {
    if (!o || !isOnScreen(o.x, o.y, o.w, o.h)) continue;
    if (o.kind === "grave") drawGrave(o);
    else if (o.kind === "tree") drawDeadTree(o);
    else if (o.kind === "barrel") drawBarrel(o);
    else if (o.kind === "barricade") drawBarricade(o);
    else if (o.kind === "door") drawDoor(o);
    else if (o.kind === "trap") drawTrap(o);
    else drawCrate(o);
  }
}

function drawGrave(o) {
  pixelRect(o.x + 6, o.y + 10, o.w - 12, o.h - 12, "#4a4f55");
  pixelRect(o.x + 10, o.y + 6, o.w - 20, 10, "#646a70");
  pixelRect(o.x + 14, o.y + 18, o.w - 28, 4, "#2b2f34");
  pixelRect(o.x + 14, o.y + 28, o.w - 28, 4, "#2b2f34");
}

function drawDeadTree(o) {
  pixelRect(o.x + o.w / 2 - 6, o.y + 10, 12, o.h - 10, "#3a2418");
  pixelRect(o.x + 8, o.y + 18, o.w - 14, 8, "#3a2418");
  pixelRect(o.x + 14, o.y + 8, 8, 24, "#4a2c1b");
  pixelRect(o.x + o.w - 20, o.y + 6, 8, 28, "#4a2c1b");
}

function drawCrate(o) {
  pixelRect(o.x + 3, o.y + 3, o.w - 6, o.h - 6, "#5b3d24");
  pixelRect(o.x + 8, o.y + 8, o.w - 16, o.h - 16, "#754c2a");
  pixelRect(o.x + 8, o.y + o.h / 2 - 3, o.w - 16, 6, "#2c1b12");
  pixelRect(o.x + o.w / 2 - 3, o.y + 8, 6, o.h - 16, "#2c1b12");
}

function drawBarrel(o) {
  pixelRect(o.x + 7, o.y + 4, o.w - 14, o.h - 8, "#4e1419");
  pixelRect(o.x + 11, o.y + 8, o.w - 22, o.h - 16, "#8e1e2a");
  pixelRect(o.x + 9, o.y + 12, o.w - 18, 5, "#f2c36b");
  pixelRect(o.x + 9, o.y + o.h - 17, o.w - 18, 5, "#2b0d11");
  if (o.hp <= 1) pixelRect(o.x + o.w / 2 - 3, o.y + 5, 6, o.h - 10, "#f49c48");
}

function drawBarricade(o) {
  pixelRect(o.x + 3, o.y + 8, o.w - 6, 10, "#6b3f22");
  pixelRect(o.x + 5, o.y + o.h - 18, o.w - 10, 10, "#4d2d1a");
  pixelRect(o.x + 10, o.y + 3, 9, o.h - 6, "#8a552c");
  pixelRect(o.x + o.w - 19, o.y + 4, 9, o.h - 8, "#8a552c");
  pixelRect(o.x + 7, o.y + o.h / 2 - 3, o.w - 14, 6, "#1e120c");
}

function drawDoor(o) {
  const color = o.open ? "#1b1110" : "#3d2519";
  pixelRect(o.x + 5, o.y + 2, o.w - 10, o.h - 4, color);
  if (!o.open) {
    pixelRect(o.x + 10, o.y + 7, o.w - 20, 5, "#7b572b");
    pixelRect(o.x + o.w - 15, o.y + o.h / 2, 5, 5, "#ffd166");
  }
}

function drawTrap(o) {
  pixelRect(o.x + 6, o.y + o.h / 2 - 5, o.w - 12, 10, o.armed ? "#4a4f55" : "#24272c");
  pixelRect(o.x + 11, o.y + o.h / 2 - 12, 5, 24, o.armed ? "#d8d8df" : "#303039");
  pixelRect(o.x + o.w - 16, o.y + o.h / 2 - 12, 5, 24, o.armed ? "#d8d8df" : "#303039");
  if (o.armed) pixelRect(o.x + o.w / 2 - 3, o.y + o.h / 2 - 16, 6, 32, "#f49c48");
}

function drawPickups() {
  for (const p of z_pickups) {
    if (!p || !isOnScreen(p.x - 16, p.y - 16, 32, 32)) continue;
    const y = p.y + Math.round(Math.sin(p.bob) * 2);
    window.ArcadeUX.drawMarker(ctx, p.x, y, 23, p.kind === "med" ? "#a7f1ad" : "#ffd789");
    if (p.kind === "ammo") {
      pixelRect(p.x - 10, y - 10, 20, 20, "#7b572b");
      pixelRect(p.x - 6, y - 6, 12, 12, "#d6b25e");
      pixelRect(p.x - 2, y - 10, 4, 20, "#35200f");
    } else if (p.kind === "armor") {
      pixelRect(p.x - 11, y - 9, 22, 18, "#1c4252");
      pixelRect(p.x - 7, y - 5, 14, 10, "#b8e6ff");
      pixelRect(p.x - 3, y - 10, 6, 20, "#27546b");
    } else if (p.kind === "overdrive") {
      pixelRect(p.x - 11, y - 11, 22, 22, "#391116");
      pixelRect(p.x - 5, y - 13, 10, 26, "#f49c48");
      pixelRect(p.x - 12, y - 4, 24, 8, "#ffd166");
    } else if (spriteReady("health")) {
      drawCenteredSprite("health", p.x, y, 38, 38);
    } else {
      pixelRect(p.x - 10, y - 10, 20, 20, "#d8d6c6");
      pixelRect(p.x - 3, y - 8, 6, 16, "#b31524");
      pixelRect(p.x - 8, y - 3, 16, 6, "#b31524");
    }
    if (p.label) {
      ctx.font = "700 9px Courier New";
      ctx.textAlign = "center";
      ctx.fillStyle = "#f2c36b";
      ctx.fillText(p.label, p.x, y + 21);
    }
  }
}

function drawZombies() {
  for (const z of z_zombies) {
    if (!z || !isOnScreen(z.x - z.size, z.y - z.size, z.size * 2, z.size * 2)) continue;
    const s = z.size;
    const flash = z.hitFlash > 0;
    window.ArcadeUX.drawMarker(ctx, z.x, z.y, s * 0.55, "#ed8c78");
    drawZombieTelegraph(z);
    drawZombieSilhouette(z);
    if (spriteReady(z.sprite)) {
      const angle = Math.atan2(z_player.y - z.y, z_player.x - z.x);
      drawCenteredSprite(z.sprite, z.x, z.y, z.renderW, z.renderH, angle - Math.PI / 2);
      if (flash) {
        ctx.save();
        ctx.globalAlpha = 0.48;
        ctx.globalCompositeOperation = "screen";
        drawCenteredSprite(z.sprite, z.x, z.y, z.renderW, z.renderH, angle - Math.PI / 2);
        ctx.restore();
      }
    } else {
      pixelRect(z.x - s / 2 + 4, z.y - s / 2 + 10, s - 8, s - 8, flash ? "#f3efe4" : z.coat);
      pixelRect(z.x - s / 2 + 8, z.y - s / 2, s - 16, 16, flash ? "#f3efe4" : z.color);
      pixelRect(z.x - s / 2 + 10, z.y - s / 2 + 5, 4, 4, "#101010");
      pixelRect(z.x + s / 2 - 14, z.y - s / 2 + 5, 4, 4, "#101010");
      pixelRect(z.x - s / 2, z.y - 2, 8, 6, flash ? "#f3efe4" : z.color);
      pixelRect(z.x + s / 2 - 8, z.y + 2, 8, 6, flash ? "#f3efe4" : z.color);
    }
    if (z.maxHp > 1) {
      pixelRect(z.x - 16, z.y - s / 2 - 8, 32, 4, "#250b0d");
      pixelRect(z.x - 16, z.y - s / 2 - 8, 32 * (z.hp / z.maxHp), 4, "#b31524");
    }
  }
}

function drawZombieTelegraph(z) {
  if (!z.telegraphTimer || z.telegraphTimer <= 0) return;
  const reach = z.type === "boss" ? 330 : 250;
  const width = z.type === "boss" ? 18 : 10;
  const pulse = 0.35 + Math.sin(z.telegraphTimer * 0.65) * 0.15;
  ctx.save();
  ctx.translate(z.x, z.y);
  ctx.rotate(z.telegraphAngle);
  ctx.globalAlpha = pulse;
  ctx.fillStyle = z.type === "boss" ? "#f49c48" : "#79ff69";
  ctx.fillRect(12, -width / 2, reach, width);
  ctx.restore();
}

function drawZombieSilhouette(z) {
  ctx.save();
  ctx.globalAlpha = z.type === "boss" ? 0.58 : z.ranged ? 0.42 : z.explosive ? 0.46 : 0.30;
  ctx.fillStyle = z.type === "boss" ? "#120305" : z.ranged ? "#12320e" : z.explosive ? "#3a1f08" : "#050506";
  ctx.beginPath();
  ctx.ellipse(z.x, z.y + z.size * 0.36, z.renderW * 0.42, z.renderH * 0.34, 0, 0, Math.PI * 2);
  ctx.fill();
  if (z.ranged || z.type === "boss") {
    ctx.strokeStyle = z.type === "boss" ? "#f49c48" : "#79ff69";
    ctx.lineWidth = z.type === "boss" ? 3 : 2;
    ctx.beginPath();
    ctx.arc(z.x, z.y, z.size * 0.72, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPlayer() {
  const angle = Math.atan2(z_player.dir.y, z_player.dir.x);
  window.ArcadeUX.drawMarker(ctx, z_player.x, z_player.y, 25, "#9ef6ff");
  if (z_hurtCooldown > 0) {
    ctx.save();
    ctx.globalAlpha = 0.38 + Math.sin(z_hurtCooldown * 0.42) * 0.14;
    ctx.strokeStyle = "#b8e6ff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(z_player.x, z_player.y, 24, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  if (spriteReady("player")) {
    drawCenteredSprite("player", z_player.x, z_player.y, 40, 66, angle - Math.PI / 2);
    drawHeldWeapon(angle);
    return;
  }

  ctx.save();
  ctx.translate(Math.round(z_player.x), Math.round(z_player.y));
  ctx.rotate(angle);
  pixelRect(-9, -12, 18, 24, "#163850");
  pixelRect(-7, -17, 14, 10, "#d6a078");
  pixelRect(-7, -19, 14, 5, "#0a1724");
  pixelRect(5, -8, 18, 6, "#24272c");
  pixelRect(18, -5, 10, 3, "#c3c6bd");
  pixelRect(-10, 8, 7, 12, "#0a1724");
  pixelRect(3, 8, 7, 12, "#0a1724");
  ctx.restore();
}

function drawHeldWeapon(angle) {
  const weapon = currentWeapon();
  ctx.save();
  ctx.translate(Math.round(z_player.x), Math.round(z_player.y));
  ctx.rotate(angle);
  if (spriteReady(weapon.id)) {
    const width = weapon.id === "shotgun" ? 52 : 54;
    const height = weapon.id === "shotgun" ? 16 : 25;
    drawCenteredSprite(weapon.id, 28, -1, width, height);
  } else {
    const body = weapon.id === "flamer" ? "#5b3022" : "#24272c";
    const barrel = weapon.id === "flamer" ? "#f49c48" : "#c3c6bd";
    pixelRect(6, -5, weapon.id === "flamer" ? 26 : 21, weapon.id === "flamer" ? 10 : 7, body);
    pixelRect(23, -3, weapon.id === "flamer" ? 15 : 9, 4, barrel);
    if (weapon.id === "flamer") pixelRect(0, 5, 12, 8, "#2b3c44");
  }
  ctx.restore();
}

function drawBullets() {
  for (const b of z_bullets) {
    if (!b || !isOnScreen(b.x - 8, b.y - 8, 16, 16)) continue;
    if (b.kind === "flamer") {
      const alpha = Math.max(0.18, b.life / Math.max(1, b.maxLife || b.life));
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = `rgba(255, ${Math.round(90 + alpha * 140)}, 35, ${alpha})`;
      ctx.beginPath();
      ctx.arc(b.x, b.y, 8 + alpha * 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else {
      const color = b.kind === "shotgun" ? "#f49c48" : b.kind === "carbine" ? "#fff0a3" : "#ffd166";
      pixelRect(b.x - 3, b.y - 3, 6, 6, color);
    }
  }

  for (let i = z_muzzleFlashes.length - 1; i >= 0; i--) {
    const flash = z_muzzleFlashes[i];
    flash.life--;
    if (flash.life <= 0) {
      z_muzzleFlashes.splice(i, 1);
      continue;
    }
    if (window.ArcadeUX.flashesReduced()) continue;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.translate(flash.x, flash.y);
    ctx.rotate(flash.angle);
    ctx.fillStyle = flash.kind === "flamer" ? "rgba(255,116,28,0.72)" : "rgba(255,235,146,0.58)";
    ctx.beginPath();
    ctx.ellipse(14, 0, flash.kind === "flamer" ? 38 : 18, flash.kind === "flamer" ? 13 : 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawEnemyShots() {
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (const shot of z_enemyShots) {
    if (!shot || !isOnScreen(shot.x - 10, shot.y - 10, 20, 20)) continue;
    ctx.fillStyle = "#79ff69";
    ctx.shadowColor = "rgba(121, 255, 105, 0.8)";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(shot.x, shot.y, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawLighting() {
  const px = z_player.x - camera.x;
  const py = z_player.y - camera.y;
  const grad = ctx.createRadialGradient(px, py, 95, px, py, 430);
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(0.58, "rgba(0,0,0,0.30)");
  grad.addColorStop(1, "rgba(0,0,0,0.78)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(255,255,255,0.035)";
  for (let y = 0; y < canvas.height; y += 4) ctx.fillRect(0, y, canvas.width, 1);

  if (z_overdriveTimer > 0) {
    ctx.fillStyle = `rgba(244, 156, 72, ${0.05 + Math.sin(z_overdriveTimer * 0.25) * 0.02})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function drawMinimap() {
  const mw = 136;
  const mh = 104;
  const mx = canvas.width - mw - 12;
  const my = 12;
  pixelRect(mx, my, mw, mh, "rgba(5, 6, 8, 0.74)");
  pixelRect(mx + (camera.x / world.w) * mw, my + (camera.y / world.h) * mh, (canvas.width / world.w) * mw, (canvas.height / world.h) * mh, "rgba(255,255,255,0.12)");
  pixelRect(mx + (z_player.x / world.w) * mw - 2, my + (z_player.y / world.h) * mh - 2, 4, 4, "#f3efe4");
  ctx.fillStyle = "#a7262d";
  for (const z of z_zombies) ctx.fillRect(mx + (z.x / world.w) * mw, my + (z.y / world.h) * mh, 2, 2);
  ctx.fillStyle = "#79ff69";
  for (const shot of z_enemyShots) ctx.fillRect(mx + (shot.x / world.w) * mw, my + (shot.y / world.h) * mh, 1, 1);
}

function drawWaveBanner() {
  if (z_waveBannerTimer <= 0 || !z_waveBanner) return;
  const alpha = Math.min(1, z_waveBannerTimer / 50);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "rgba(0, 0, 0, 0.56)";
  ctx.fillRect(canvas.width / 2 - 190, 34, 380, 46);
  ctx.strokeStyle = "rgba(242, 195, 107, 0.52)";
  ctx.strokeRect(canvas.width / 2 - 190, 34, 380, 46);
  ctx.fillStyle = "#f2c36b";
  ctx.font = "700 22px Courier New";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(z_waveBanner.toUpperCase(), canvas.width / 2, 57);
  ctx.restore();
}

function pixelRect(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function spriteReady(name) {
  const sprite = sprites[name];
  return Boolean(sprite && sprite.complete && sprite.naturalWidth > 0);
}

function drawCenteredSprite(name, x, y, w, h, rotation = 0) {
  if (!spriteReady(name)) return;
  const frame = spriteFrames[name];
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.rotate(rotation);
  if (frame) {
    ctx.drawImage(sprites[name], frame.x, frame.y, frame.w, frame.h, Math.round(-w / 2), Math.round(-h / 2), Math.round(w), Math.round(h));
  } else {
    ctx.drawImage(sprites[name], Math.round(-w / 2), Math.round(-h / 2), Math.round(w), Math.round(h));
  }
  ctx.restore();
}

function isOnScreen(x, y, w, h) {
  return x + w > camera.x - 40 && x < camera.x + canvas.width + 40 && y + h > camera.y - 40 && y < camera.y + canvas.height + 40;
}

function showGameOver() {
  if (isGameOver) return;
  isGameOver = true;
  setPaused(false);
  const newRecord = score > bestScore;
  if (newRecord) {
    bestScore = score;
    setBest(bestScore);
  }
  commitCareerStats();
  document.getElementById("lastHitCause").textContent = lastHitCause;
  finalScoreEl.textContent = String(score);
  finalLevelEl.textContent = String(z_level);
  finalBestEl.textContent = String(bestScore);
  if (finalCareerEl) {
    finalCareerEl.textContent =
      `${runStats.kills} kills | ${runStats.bosses} bosses | best combo ${runStats.maxCombo}x`;
  }
  overTitle.textContent = newRecord ? "NEW RECORD!" : "GAME OVER";
  submitNationalScore(score);
  haptic(newRecord ? [20, 35, 20] : [30, 40, 45]);
  overlay.classList.remove("hidden");
  overlay.setAttribute("aria-hidden", "false");
  updateUI();
}

const FIXED_FRAME_MS = 1000 / 60;
const MAX_FRAME_CATCHUP_MS = 80;
const MAX_FIXED_STEPS = 4;
let raf = null;
let loopLastTime = 0;
let loopAccumulator = 0;

function loop(timestamp = 0) {
  const now = timestamp || performance.now();
  if (!loopLastTime) loopLastTime = now;

  const frameMs = Math.min(MAX_FRAME_CATCHUP_MS, Math.max(0, now - loopLastTime));
  loopLastTime = now;
  loopAccumulator += frameMs;

  let steps = 0;
  while (loopAccumulator >= FIXED_FRAME_MS && steps < MAX_FIXED_STEPS) {
    if (!isTitleScreen && !isGameOver && !isPaused && !z_pendingUpgrade) updateZombie();
    loopAccumulator -= FIXED_FRAME_MS;
    steps++;
  }

  if (steps >= MAX_FIXED_STEPS) {
    loopAccumulator = 0;
  }

  drawZombie();
  raf = requestAnimationFrame(loop);
}

window.addEventListener("keydown", (e) => {
  const interactiveTarget = e.target instanceof Element
    ? e.target.closest("button, input, select, textarea, summary, a, [role='button'], [contenteditable='true']")
    : null;
  if (interactiveTarget && (e.key === "Enter" || e.key === " ")) return;

  if ([" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) e.preventDefault();
  if (isTitleScreen && (e.key === "Enter" || e.key === " ")) {
    e.preventDefault();
    startRun();
    return;
  }
  if (isTitleScreen) return;
  if ((e.key === "p" || e.key === "P" || e.key === "Escape") && !e.repeat) {
    setPaused(!isPaused);
    return;
  }
  if (isPaused) return;
  if ((e.key === "Shift" || e.key === "e" || e.key === "E") && !e.repeat) {
    e.preventDefault();
    dashPlayer();
    return;
  }
  if (e.key === "1") chooseWeapon(0);
  if (e.key === "2") chooseWeapon(1);
  if (e.key === "3") chooseWeapon(2);
  if (e.key === "4") chooseWeapon(3);
  keys[e.key] = true;
});

window.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

function setPointerFromEvent(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  pointer.x = (e.clientX - rect.left) * scaleX;
  pointer.y = (e.clientY - rect.top) * scaleY;
  pointer.active = true;
  updatePointerWorld();
}

function updateTouchAimFromEvent(event) {
  const rect = touchAimPad.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  let dx = event.clientX - centerX;
  let dy = event.clientY - centerY;
  const distance = Math.hypot(dx, dy);
  if (distance < 5) {
    dx = touchAim.x;
    dy = touchAim.y;
  } else {
    dx /= distance;
    dy /= distance;
  }

  touchAim.x = dx;
  touchAim.y = dy;
  touchAim.active = true;
  touchAim.ready = true;

  const knobRadius = Math.min(rect.width, rect.height) * 0.32;
  touchAimKnob.style.transform = `translate(calc(-50% + ${dx * knobRadius}px), calc(-50% + ${dy * knobRadius}px))`;
}

function releaseTouchAim(event) {
  if (event && event.pointerId !== aimPointerId) return;
  aimPointerId = null;
  touchAim.active = false;
  touchAim.ready = false;
  touchAimPad.classList.remove("held");
  touchAimKnob.style.transform = "translate(-50%, -50%)";
}

canvas.addEventListener("pointermove", (e) => {
  setPointerFromEvent(e);
});

canvas.addEventListener("pointerleave", () => {
  pointer.active = false;
  keys.Click = false;
});

canvas.addEventListener("pointerdown", (e) => {
  if (isTitleScreen || isPaused || isGameOver) return;
  e.preventDefault();
  setPointerFromEvent(e);
  keys.Click = true;
});

canvas.addEventListener("pointerup", () => {
  keys.Click = false;
});

canvas.addEventListener("pointercancel", () => {
  keys.Click = false;
});

function setPaused(paused) {
  if (isTitleScreen || (paused && isGameOver)) return;
  isPaused = paused;
  keys = {};
  touchDirections.clear();
  pointer.active = false;
  document.querySelectorAll(".touch-btn.held").forEach(button => button.classList.remove("held"));
  releaseTouchAim();
  releaseTouchFire();
  pauseBtn.textContent = isPaused ? "Resume" : "Pause";
  touchPauseBtn.textContent = isPaused ? "Resume" : "Pause";
  pauseBtn.setAttribute("aria-pressed", String(isPaused));
  touchPauseBtn.setAttribute("aria-pressed", String(isPaused));
  pauseOverlay.classList.toggle("hidden", !isPaused);
  pauseOverlay.setAttribute("aria-hidden", String(!isPaused));
  updateActionButtons();
}

function hardReset() {
  if (raf) cancelAnimationFrame(raf);
  raf = null;
  loopLastTime = 0;
  loopAccumulator = 0;
  keys = {};
  releaseTouchAim();
  releaseTouchFire();
  isTitleScreen = false;
  titleScreen.hidden = true;
  titleScreen.setAttribute("aria-hidden", "true");
  initZombie();
  applyDailyArenaBoost();
  loop();
}

startRunBtn.addEventListener("click", startRun);
restartBtn.addEventListener("click", hardReset);
document.getElementById("restartPaused").addEventListener("click", hardReset);
playAgainBtn.addEventListener("click", hardReset);
soundToggleBtn.addEventListener("click", () => setSoundEnabled(!soundEnabled));
titleSoundToggleBtn?.addEventListener("click", () => setSoundEnabled(!soundEnabled));
autoAimToggleBtn.addEventListener("click", () => {
  autoAimEnabled = !autoAimEnabled;
  setStorageFlag(AUTO_AIM_KEY, autoAimEnabled);
  updateAssistButtons();
});
titleAutoAimToggleBtn?.addEventListener("click", () => {
  autoAimEnabled = !autoAimEnabled;
  setStorageFlag(AUTO_AIM_KEY, autoAimEnabled);
  updateAssistButtons();
});
autoFireToggleBtn.addEventListener("click", () => {
  autoFireEnabled = !autoFireEnabled;
  setStorageFlag(AUTO_FIRE_KEY, autoFireEnabled);
  updateAssistButtons();
});
titleAutoFireToggleBtn?.addEventListener("click", () => {
  autoFireEnabled = !autoFireEnabled;
  setStorageFlag(AUTO_FIRE_KEY, autoFireEnabled);
  updateAssistButtons();
});
pauseBtn.addEventListener("click", () => setPaused(!isPaused));
touchPauseBtn.addEventListener("click", () => setPaused(!isPaused));
resumeBtn.addEventListener("click", () => setPaused(false));
trophiesBtn.addEventListener("click", () => {
  renderTrophies();
  trophyOverlay.classList.remove("hidden");
  trophyOverlay.setAttribute("aria-hidden", "false");
});
closeTrophiesBtn.addEventListener("click", () => {
  trophyOverlay.classList.add("hidden");
  trophyOverlay.setAttribute("aria-hidden", "true");
});
dashBtn.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  dashPlayer();
});

touchAimPad.addEventListener("pointerdown", (event) => {
  if (isTitleScreen || isPaused || isGameOver || z_pendingUpgrade || aimPointerId !== null) return;
  event.preventDefault();
  aimPointerId = event.pointerId;
  touchAimPad.setPointerCapture?.(event.pointerId);
  touchAimPad.classList.add("held");
  updateTouchAimFromEvent(event);
});

touchAimPad.addEventListener("pointermove", (event) => {
  if (event.pointerId !== aimPointerId) return;
  event.preventDefault();
  updateTouchAimFromEvent(event);
});

touchAimPad.addEventListener("pointerup", releaseTouchAim);
touchAimPad.addEventListener("pointercancel", releaseTouchAim);
touchAimPad.addEventListener("lostpointercapture", releaseTouchAim);

touchFireBtn.addEventListener("pointerdown", (event) => {
  if (isTitleScreen || isPaused || isGameOver || z_pendingUpgrade || firePointerId !== null) return;
  event.preventDefault();
  firePointerId = event.pointerId;
  touchFireBtn.classList.add("held");
  touchFireBtn.setPointerCapture?.(event.pointerId);
});

function releaseTouchFire(event) {
  if (event && event.pointerId !== firePointerId) return;
  firePointerId = null;
  touchFireBtn.classList.remove("held");
}
touchFireBtn.addEventListener("pointerup", releaseTouchFire);
touchFireBtn.addEventListener("pointercancel", releaseTouchFire);
touchFireBtn.addEventListener("lostpointercapture", releaseTouchFire);

document.querySelectorAll("[data-input]").forEach((button) => {
  const input = button.dataset.input;
  const release = event => {
    touchDirections.delete(event.pointerId);
    button.classList.toggle("held", [...touchDirections.values()].includes(input));
  };
  button.addEventListener("pointerdown", (event) => {
    if (isTitleScreen || isPaused || isGameOver) return;
    event.preventDefault();
    touchDirections.set(event.pointerId, input);
    button.classList.add("held");
    button.setPointerCapture?.(event.pointerId);
  });
  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("lostpointercapture", release);
});

document.getElementById("touchWeaponSelect").addEventListener("change", event => chooseWeapon(Number(event.target.value)));

weaponButtons.forEach((button) => {
  button.addEventListener("click", () => chooseWeapon(Number(button.dataset.weapon)));
});

window.addEventListener("blur", () => setPaused(true));
document.addEventListener("visibilitychange", () => {
  if (document.hidden) setPaused(true);
});

initZombie();
updateSoundButton();
updateAssistButtons();
renderTrophies();
renderCareerStats();
showTitleScreen();
loop();

window.ArcadeUX.registerGame({
  active: () => !isTitleScreen && !isGameOver && !z_pendingUpgrade,
  paused: () => isPaused,
  pause: setPaused,
  label: () => "Survival"
});
