// Void Invaders
// Title screen + custom ship + rarer power-ups + tougher enemies + end-wave boss
// Personal high scores save locally per player device/browser

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('high-score');
const livesEl = document.getElementById('lives');
const salvageEl = document.getElementById('salvage');
const restartBtn = document.getElementById('restart');
const menuBtn = document.getElementById('menu-button');
const pauseBtn = document.getElementById('pause-button');

const overlay = document.getElementById('overlay');
const overTitle = document.getElementById('over-title');
const finalScoreEl = document.getElementById('final-score');
const finalBestScoreEl = document.getElementById('final-best-score');
const finalRunSummaryEl = document.getElementById('final-run-summary');
const playAgainBtn = document.getElementById('play-again');
const continueEndlessBtn = document.getElementById('continue-endless');
const backTitleBtn = document.getElementById('back-title');

const titleScreen = document.getElementById('title-screen');
const startGameBtn = document.getElementById('start-game');
const startEndlessBtn = document.getElementById('start-endless');
const soundToggleBtn = document.getElementById('sound-toggle');
const musicToggleBtn = document.getElementById('music-toggle');
const autofireToggleBtn = document.getElementById('autofire-toggle');
const controlsToggleBtn = document.getElementById('controls-toggle');
const trophiesToggleBtn = document.getElementById('trophies-toggle');
const controlsCard = document.getElementById('controls-card');
const trophiesCard = document.getElementById('trophies-card');
const trophiesListEl = document.getElementById('trophies-list');
const trophyProgressEl = document.getElementById('trophy-progress');
const titleBestScoreEl = document.getElementById('title-best-score');
const careerSummaryEl = document.getElementById('career-summary');
const NATIONAL_GAME_ID = "void-invaders";
const NATIONAL_GAME_NAME = "Void Invaders";

function isDeveloperMode() {
  return Boolean(window.ArcadeDeveloperMode?.enabled);
}

const pauseMenuEl = document.getElementById('pause-menu');
const resumeGameBtn = document.getElementById('resume-game');
const pauseSoundToggleBtn = document.getElementById('pause-sound-toggle');
const pauseMusicToggleBtn = document.getElementById('pause-music-toggle');
const pauseAutofireToggleBtn = document.getElementById('pause-autofire-toggle');
const pauseRestartBtn = document.getElementById('pause-restart');
const pauseMainMenuBtn = document.getElementById('pause-main-menu');
const upgradeDockEl = document.getElementById('upgrade-dock');

window.NationalLeaderboard?.init({
  gameId: NATIONAL_GAME_ID,
  gameName: NATIONAL_GAME_NAME,
  getPersonalScores: () => [
    { label: "Best Score", score: highScore || 0 },
    { label: "Best Campaign Sector", score: Math.max(careerStats.bestCampaignSector, runStats.highestCampaignLevel) },
    { label: "Best Rift Encounter", score: Math.max(careerStats.bestRiftEncounter, runStats.riftEncounters) },
    ...(careerStats.legacyBestDepth > 1 ? [{ label: "Legacy Best Depth", score: careerStats.legacyBestDepth }] : [])
  ]
});

function submitNationalScore(finalScore) {
  window.NationalLeaderboard?.submitScore(NATIONAL_GAME_ID, finalScore, {
    gameName: NATIONAL_GAME_NAME,
    mode: v_endlessMode ? "Endless" : "Campaign",
    level: Math.max(1, runStats.highestCampaignLevel)
  });
}
const dockSummaryEl = document.getElementById('dock-summary');
const upgradeOffersEl = document.getElementById('upgrade-offers');
const startBonusRaidBtn = document.getElementById('start-bonus-raid');
const leaveDockBtn = document.getElementById('leave-dock');
const dockRepairBtn = document.getElementById('dock-repair');
const dockRerollBtn = document.getElementById('dock-reroll');

const hintEl = document.querySelector('.hint');
const gameShellEls = document.querySelectorAll('.game-shell');

const GAME_WIDTH = 600;
const GAME_HEIGHT = 650;

const STORAGE_KEY = "sns:voidInvaders:personalHighScore";
const LEGACY_STORAGE_KEY = "voidInvadersHighScore";
const TROPHY_STORAGE_KEY = "sns:voidInvaders:trophies";
const AUDIO_STORAGE_KEY = "sns:voidInvaders:audioSettings";
const AUTOFIRE_STORAGE_KEY = "sns:voidInvaders:autofire";
const CAREER_STORAGE_KEY = "sns:voidInvaders:careerV1";

const MAX_PLAYER_BULLETS = 90;
const MAX_ENEMY_BULLETS = 120;
const MAX_POWER_UPS = 8;
const MAX_PARTICLES = 280;
const MAX_SCORE_POPUPS = 36;
const MAX_PLAYER_TRAILS = 48;
const MAX_SHOCKWAVES = 12;

const PLAYER_MIN_X = 36;
const PLAYER_SPEED = 5.6;
const PLAYER_FOCUS_SPEED_FACTOR = 0.48;
const PLAYER_HIT_RADIUS = 7;
const PLAYER_MUZZLE_OFFSET = 38;
const WAVE_GRACE_FRAMES = 76;
const BOSS_GRACE_FRAMES = 92;
const PLAYER_HIT_GRACE_FRAMES = 86;
const POWER_UP_PITY_KILLS = 16;
const SURGE_CHARGE_MAX = 120;
const SURGE_DURATION_FRAMES = 300;
const SURGE_SHOT_COOLDOWN = 7;
const SURGE_RAPID_FIRE_GRANT = 90;
const SURGE_INVULN_FRAMES = 20;
const SURGE_BULLET_SPEED = -8.7;
const SURGE_BULLET_DAMAGE = 1;
const SURGE_BULLET_PIERCE = 1;
const STASIS_DURATION_FRAMES = 300;
const STASIS_MOVE_INTERVAL_MULTIPLIER = 2;
const FINAL_LEVEL = 15;
const CAMPAIGN_DOCK_LEVELS = [3, 5, 8, 10, 12, 15];
const ENDLESS_DOCK_INTERVAL = 3;
const BONUS_RAID_DURATION_FRAMES = 720;
const MAX_SALVAGE_CACHES = 14;
const BOSS_CYCLE_STRENGTH_INCREASE = 0.4;
const RIFT_WEEKLY_BOSS_INTERVAL = 7;
const DOCK_REPAIR_COST = 44;
const DOCK_REROLL_BASE_COST = 28;
const DOCK_REROLL_COST_STEP = 18;
const MUSIC_VOLUME = 0.3;

let keys = {};
let score = 0;
let highScore = loadHighScore();
let lives = 3;
let isGameOver = false;
let gameFrame = 0;
let gameState = "title";
let soundEnabled = true;
let musicEnabled = true;
let autofireEnabled = false;

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

function limitArray(array, maxLength) {
  const overflow = array.length - maxLength;

  if (overflow > 0) {
    array.splice(0, overflow);
  }
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

function loadAudioSettings() {
  const storage = getStorage();
  if (!storage) return { soundEnabled: true, musicEnabled: true };

  try {
    const stored = JSON.parse(storage.getItem(AUDIO_STORAGE_KEY) || "{}");
    return {
      soundEnabled: stored.soundEnabled !== false,
      musicEnabled: stored.musicEnabled !== false
    };
  } catch (err) {
    return { soundEnabled: true, musicEnabled: true };
  }
}

function saveAudioSettings() {
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.setItem(AUDIO_STORAGE_KEY, JSON.stringify({ soundEnabled, musicEnabled }));
  } catch (err) {
    // Audio preferences are optional persistence.
  }
}

({ soundEnabled, musicEnabled } = loadAudioSettings());

function loadAutofireSetting() {
  const storage = getStorage();
  if (!storage) return false;

  try {
    return storage.getItem(AUTOFIRE_STORAGE_KEY) === "1";
  } catch (err) {
    return false;
  }
}

function saveAutofireSetting() {
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.setItem(AUTOFIRE_STORAGE_KEY, autofireEnabled ? "1" : "0");
  } catch (err) {
    // Autofire remains active for this session if persistence is unavailable.
  }
}

autofireEnabled = loadAutofireSetting();

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
    id: "chain-eight", progress: () => ({ metric: "combo", current: runStats.maxCombo, target: 8 }), 
    name: "Hot Streak",
    desc: "Build an 8-hit score chain.",
    test: stats => stats.maxCombo >= 8
  },
  {
    id: "graze-25", progress: () => ({ metric: "grazes", current: runStats.grazes, target: 25 }), 
    name: "Needle Threader",
    desc: "Graze 25 enemy shots in one run.",
    test: stats => stats.grazes >= 25
  },
  {
    id: "score-10000", progress: () => ({ metric: "score", current: score, target: 10000 }), 
    name: "Signal Flare",
    desc: "Score 10,000 points in one run.",
    test: () => score >= 10000
  },
  {
    id: "three-bosses", progress: () => ({ metric: "bosses", current: runStats.bossesDefeated, target: 3 }), 
    name: "Core Breaker",
    desc: "Defeat 3 bosses in one run.",
    test: stats => stats.bossesDefeated >= 3
  },
  {
    id: "arsenal", progress: () => ({ metric: "pickups", current: runStats.powerUpsCollected, target: 12 }), 
    name: "Loaded Orbit",
    desc: "Collect 12 power-ups in one run.",
    test: stats => stats.powerUpsCollected >= 12
  },
  {
    id: "wave-six", progress: () => ({ metric: "sector", current: runStats.highestCampaignLevel, target: 6 }), 
    name: "Deep Sector",
    desc: "Clear level 5 and enter level 6.",
    test: stats => stats.highestCampaignLevel >= 6
  },
  {
    id: "perfect-three",
    name: "Clean Signal",
    desc: "Clear 3 flawless levels in one run.",
    test: stats => stats.perfectWaves >= 3
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
  },
  {
    id: "contractor",
    name: "Licensed Scavenger",
    desc: "Complete 3 salvage contracts in one run.",
    test: stats => stats.contractsCompleted >= 3
  },
  {
    id: "contract-streak",
    name: "Perfect Ledger",
    desc: "Complete 3 salvage contracts in a row.",
    test: stats => stats.maxContractStreak >= 3
  },
  {
    id: "hot-rod",
    name: "Hot-Rodded",
    desc: "Purchase 4 upgrades in one run.",
    test: stats => stats.upgradesBought >= 4
  },
  {
    id: "endless-rift",
    name: "Beyond the Map",
    desc: "Enter the Endless Rift.",
    test: stats => stats.enteredEndless
  },
  {
    id: "bounty-hunter",
    name: "Ace Breaker",
    desc: "Destroy 12 ace invaders in one run.",
    test: stats => stats.elitesDestroyed >= 12
  },
  {
    id: "raid-haul",
    name: "Cargo Cult",
    desc: "Recover 80 salvage in one bonus raid.",
    test: stats => stats.bestRaidSalvage >= 80
  },
  {
    id: "first-power",
    name: "First Spark",
    desc: "Collect a power-up.",
    test: stats => stats.powerUpsCollected >= 1
  },
  {
    id: "salvage-250",
    name: "Scrap Baron",
    desc: "Collect 250 salvage in one run.",
    test: stats => stats.salvageCollected >= 250
  },
  {
    id: "rift-five",
    name: "Rift Regular",
    desc: "Survive 5 Endless Rift encounters.",
    test: stats => stats.riftEncounters >= 5
  },
  {
    id: "score-25000",
    name: "Signal Storm",
    desc: "Score 25,000 points in one run.",
    test: () => score >= 25000
  },
  {
    id: "raid-veteran",
    name: "Raid Veteran",
    desc: "Complete 3 bonus raids in one run.",
    test: stats => stats.bonusRaidsCompleted >= 3
  },
  {
    id: "chain-twelve",
    name: "Blazing Chain",
    desc: "Build a 12-hit score chain.",
    test: stats => stats.maxCombo >= 12
  },
  {
    id: "chain-twenty",
    name: "Orbit Choir",
    desc: "Build a 20-hit score chain.",
    test: stats => stats.maxCombo >= 20
  },
  {
    id: "graze-50",
    name: "Skin Of The Hull",
    desc: "Graze 50 enemy shots in one run.",
    test: stats => stats.grazes >= 50
  },
  {
    id: "graze-100",
    name: "Threaded Void",
    desc: "Graze 100 enemy shots in one run.",
    test: stats => stats.grazes >= 100
  },
  {
    id: "score-50000",
    name: "Signal Inferno",
    desc: "Score 50,000 points in one run.",
    test: () => score >= 50000
  },
  {
    id: "score-100000",
    name: "Void Anthem",
    desc: "Score 100,000 points in one run.",
    test: () => score >= 100000
  },
  {
    id: "five-bosses",
    name: "Core Collector",
    desc: "Defeat 5 bosses in one run.",
    test: stats => stats.bossesDefeated >= 5
  },
  {
    id: "ten-bosses",
    name: "Boss Cartographer",
    desc: "Defeat 10 bosses in one run.",
    test: stats => stats.bossesDefeated >= 10
  },
  {
    id: "power-20",
    name: "Arsenal Bloom",
    desc: "Collect 20 power-ups in one run.",
    test: stats => stats.powerUpsCollected >= 20
  },
  {
    id: "power-35",
    name: "Loaded Singularity",
    desc: "Collect 35 power-ups in one run.",
    test: stats => stats.powerUpsCollected >= 35
  },
  {
    id: "wave-ten",
    name: "Sector Ten",
    desc: "Reach campaign level 10.",
    test: stats => stats.highestCampaignLevel >= 10
  },
  {
    id: "wave-fifteen",
    name: "Deep Map",
    desc: "Reach campaign level 15.",
    test: stats => stats.highestCampaignLevel >= 15
  },
  {
    id: "perfect-five",
    name: "Clean Five",
    desc: "Clear 5 flawless levels in one run.",
    test: stats => stats.perfectWaves >= 5
  },
  {
    id: "perfect-ten",
    name: "Untouched Orbit",
    desc: "Clear 10 flawless levels in one run.",
    test: stats => stats.perfectWaves >= 10
  },
  {
    id: "bomb-50",
    name: "Bomb Choir",
    desc: "Destroy 50 enemies with void bombs in one run.",
    test: stats => stats.bombKills >= 50
  },
  {
    id: "bomb-100",
    name: "Void Fireworks",
    desc: "Destroy 100 enemies with void bombs in one run.",
    test: stats => stats.bombKills >= 100
  },
  {
    id: "contract-five",
    name: "Contract Clerk",
    desc: "Complete 5 salvage contracts in one run.",
    test: stats => stats.contractsCompleted >= 5
  },
  {
    id: "contract-seven",
    name: "Perfect Books",
    desc: "Complete 7 salvage contracts in one run.",
    test: stats => stats.contractsCompleted >= 7
  },
  {
    id: "upgrade-six",
    name: "Refit Complete",
    desc: "Purchase 6 upgrades in one run.",
    test: stats => stats.upgradesBought >= 6
  },
  {
    id: "upgrade-eight",
    name: "Ship Of Theseus",
    desc: "Purchase 8 upgrades in one run.",
    test: stats => stats.upgradesBought >= 8
  },
  {
    id: "ace-25",
    name: "Ace Undertaker",
    desc: "Destroy 25 ace invaders in one run.",
    test: stats => stats.elitesDestroyed >= 25
  },
  {
    id: "ace-50",
    name: "Ace Extinction",
    desc: "Destroy 50 ace invaders in one run.",
    test: stats => stats.elitesDestroyed >= 50
  },
  {
    id: "raid-haul-120",
    name: "Heavy Cargo",
    desc: "Recover 120 salvage in one bonus raid.",
    test: stats => stats.bestRaidSalvage >= 120
  },
  {
    id: "salvage-500",
    name: "Scrap Dynasty",
    desc: "Collect 500 salvage in one run.",
    test: stats => stats.salvageCollected >= 500
  },
  {
    id: "salvage-1000",
    name: "Salvage Crown",
    desc: "Collect 1,000 salvage in one run.",
    test: stats => stats.salvageCollected >= 1000
  },
  {
    id: "rift-ten",
    name: "Rift Walker",
    desc: "Survive 10 Endless Rift encounters.",
    test: stats => stats.riftEncounters >= 10
  },
  {
    id: "rift-twenty",
    name: "Rift Native",
    desc: "Survive 20 Endless Rift encounters.",
    test: stats => stats.riftEncounters >= 20
  },
  {
    id: "raid-five",
    name: "Raid Captain",
    desc: "Complete 5 bonus raids in one run.",
    test: stats => stats.bonusRaidsCompleted >= 5
  },
  {
    id: "raid-eight",
    name: "Raid Legend",
    desc: "Complete 8 bonus raids in one run.",
    test: stats => stats.bonusRaidsCompleted >= 8
  },
  {
    id: "all-rounder",
    name: "All-Rounder",
    desc: "Defeat a boss, complete a contract, and clear a bonus raid in one run.",
    test: stats => stats.bossesDefeated >= 1 && stats.contractsCompleted >= 1 && stats.bonusRaidsCompleted >= 1
  }
];

let unlockedTrophies = loadTrophies();
let runStats = makeRunStats();
let careerStats = loadCareerStats();
let careerCheckpoint = null;

function loadCareerStats() {
  const storage = getStorage();
  const empty = { runs: 0, bosses: 0, salvage: 0, bestCampaignSector: 1, bestRiftEncounter: 0, bestCombo: 0 };
  if (!storage) return empty;
  try {
    const saved = JSON.parse(storage.getItem(CAREER_STORAGE_KEY) || "{}") || {};
    const { bestSector, ...current } = saved;
    return { ...empty, ...current, legacyBestDepth: current.legacyBestDepth || bestSector || 0 };
  } catch (error) {
    return empty;
  }
}

function renderCareerStats() {
  if (!careerSummaryEl) return;
  careerSummaryEl.textContent = careerStats.runs
    ? `${careerStats.runs} sorties | ${careerStats.bosses} bosses | ${careerStats.salvage} salvage | sector ${careerStats.bestCampaignSector} | rift ${careerStats.bestRiftEncounter}`
    : "No sorties logged yet.";
}

function commitCareerStats() {
  if (!careerCheckpoint) careerStats.runs += 1;
  careerStats.bosses += runStats.bossesDefeated - (careerCheckpoint?.bosses || 0);
  careerStats.salvage += runStats.salvageCollected - (careerCheckpoint?.salvage || 0);
  careerCheckpoint = { bosses: runStats.bossesDefeated, salvage: runStats.salvageCollected };
  careerStats.bestCampaignSector = Math.max(careerStats.bestCampaignSector, runStats.highestCampaignLevel);
  careerStats.bestRiftEncounter = Math.max(careerStats.bestRiftEncounter, runStats.riftEncounters);
  careerStats.bestCombo = Math.max(careerStats.bestCombo, runStats.maxCombo);
  const storage = getStorage();
  try {
    storage?.setItem(CAREER_STORAGE_KEY, JSON.stringify(careerStats));
  } catch (error) {}
  renderCareerStats();
}

function makeRunStats() {
  return {
    maxCombo: 0,
    grazes: 0,
    bossesDefeated: 0,
    powerUpsCollected: 0,
    highestCampaignLevel: 1,
    riftEncounters: 0,
    enteredEndless: false,
    perfectWaves: 0,
    bombKills: 0,
    contractsCompleted: 0,
    maxContractStreak: 0,
    upgradesBought: 0,
    salvageCollected: 0,
    elitesDestroyed: 0,
    bonusRaidsCompleted: 0,
    bestRaidSalvage: 0,
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

function haptic(pattern = 12) {
  try {
    window.ArcadeUX.vibrate(pattern);
  } catch (error) {
    // Optional mobile feedback.
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
    window.ArcadeUX.trophy(row, unlocked, trophy.progress?.());
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

  haptic([18, 30, 18]);
  playSound("win");
}

function checkTrophies() {
  window.ArcadeUX.trackMetrics({ combo: runStats.maxCombo, grazes: runStats.grazes, score, bosses: runStats.bossesDefeated, pickups: runStats.powerUpsCollected, sector: runStats.highestCampaignLevel });
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
const BACKGROUND_IMAGE_CONFIGS = [
  "assets/background.webp",
  "assets/background2.webp",
  "assets/background3.webp"
].map(src => ({ src, ready: false, image: new Image() }));

BACKGROUND_IMAGE_CONFIGS.forEach(config => {
  config.image.onload = () => {
    config.ready = true;
  };
  config.image.src = config.src;
});

function getBackgroundImageConfig(level) {
  const imageSlot = v_endlessMode
    ? v_riftBackgroundSlot
    : Math.min(Math.floor((level - 1) / 5), BACKGROUND_IMAGE_CONFIGS.length - 1);

  return BACKGROUND_IMAGE_CONFIGS[imageSlot];
}

const ENEMY_IMAGE_CONFIGS = [
  "assets/normalenemy1.webp",
  "assets/normalenemy2.webp",
  "assets/normalenemy3.webp",
  "assets/normalenemy4.webp",
  "assets/normalenemy5.webp",
  "assets/normalenemy6.webp"
].map(src => ({ src, ready: false, renderImage: null }));

ENEMY_IMAGE_CONFIGS.forEach(config => {
  config.image = new Image();
  config.image.onload = () => {
    config.renderImage = makeTrimmedRenderImage(config.image, 44, 42);
    config.ready = Boolean(config.renderImage);
  };
  config.image.src = config.src;
});

function makeTrimmedRenderImage(image, maxWidth, maxHeight) {
  const source = document.createElement("canvas");
  source.width = image.naturalWidth;
  source.height = image.naturalHeight;

  const sourceCtx = source.getContext("2d");
  sourceCtx.drawImage(image, 0, 0);

  let data;

  try {
    data = sourceCtx.getImageData(0, 0, source.width, source.height).data;
  } catch (err) {
    return null;
  }

  let minX = source.width;
  let minY = source.height;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < source.height; y++) {
    for (let x = 0; x < source.width; x++) {
      if (data[((y * source.width) + x) * 4 + 3] <= 8) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  const cropWidth = maxX >= minX ? maxX - minX + 1 : source.width;
  const cropHeight = maxY >= minY ? maxY - minY + 1 : source.height;
  const scale = Math.min(maxWidth / cropWidth, maxHeight / cropHeight);
  const processed = document.createElement("canvas");
  processed.width = Math.round(cropWidth * scale);
  processed.height = Math.round(cropHeight * scale);

  const processedCtx = processed.getContext("2d");
  processedCtx.imageSmoothingEnabled = true;
  processedCtx.drawImage(
    image,
    minX,
    minY,
    cropWidth,
    cropHeight,
    0,
    0,
    processed.width,
    processed.height
  );

  return processed;
}

const PLAYER_IMAGE_CONFIG = {
  src: "assets/ship.webp",
  ready: false,
  renderImage: null,
  image: new Image()
};

PLAYER_IMAGE_CONFIG.image.onload = () => {
  PLAYER_IMAGE_CONFIG.renderImage = makeTrimmedRenderImage(PLAYER_IMAGE_CONFIG.image, 66, 72);
  PLAYER_IMAGE_CONFIG.ready = Boolean(PLAYER_IMAGE_CONFIG.renderImage);
};
PLAYER_IMAGE_CONFIG.image.src = PLAYER_IMAGE_CONFIG.src;

function getEnemyImageConfig(imageSlot) {
  return ENEMY_IMAGE_CONFIGS[imageSlot % ENEMY_IMAGE_CONFIGS.length];
}

const BOSS_IMAGE_CONFIGS = {
  1: {
    src: "assets/boss1.webp",
    drawWidth: 158,
    drawHeight: 158,
    yOffset: 6,
    hitbox: { w: 154, h: 138 }
  },
  2: {
    src: "assets/boss2.webp",
    drawWidth: 184,
    drawHeight: 153,
    yOffset: 9,
    hitbox: { w: 176, h: 132 },
    removeWhiteBackground: true
  },
  3: {
    src: "assets/boss3.png",
    drawWidth: 184,
    drawHeight: 153,
    yOffset: 9,
    hitbox: { w: 176, h: 132 },
    removeWhiteBackground: true
  },
  4: {
    src: "assets/boss4.png",
    drawWidth: 190,
    drawHeight: 158,
    yOffset: 9,
    hitbox: { w: 180, h: 136 }
  },
  5: {
    src: "assets/boss5.png",
    drawWidth: 214,
    drawHeight: 178,
    yOffset: 11,
    hitbox: { w: 198, h: 144 }
  },
  6: {
    src: "assets/boss6.png",
    drawWidth: 210,
    drawHeight: 175,
    yOffset: 10,
    hitbox: { w: 190, h: 142 }
  },
  7: {
    src: "assets/boss7.webp",
    drawWidth: 188,
    drawHeight: 162,
    yOffset: 8,
    hitbox: { w: 174, h: 136 }
  },
  8: {
    src: "assets/boss8.webp",
    drawWidth: 194,
    drawHeight: 166,
    yOffset: 9,
    hitbox: { w: 180, h: 140 }
  },
  9: {
    src: "assets/boss9.webp",
    drawWidth: 192,
    drawHeight: 168,
    yOffset: 8,
    hitbox: { w: 178, h: 142 }
  },
  10: {
    src: "assets/boss10.webp",
    drawWidth: 204,
    drawHeight: 172,
    yOffset: 10,
    hitbox: { w: 188, h: 144 }
  },
  11: {
    src: "assets/boss11.webp",
    drawWidth: 198,
    drawHeight: 170,
    yOffset: 9,
    hitbox: { w: 182, h: 142 }
  },
  12: {
    src: "assets/boss12.webp",
    drawWidth: 210,
    drawHeight: 180,
    yOffset: 10,
    hitbox: { w: 192, h: 148 }
  },
  13: {
    src: "assets/boss13.webp",
    drawWidth: 208,
    drawHeight: 180,
    yOffset: 10,
    hitbox: { w: 190, h: 148 }
  },
  14: {
    src: "assets/boss14.webp",
    drawWidth: 216,
    drawHeight: 182,
    yOffset: 11,
    hitbox: { w: 198, h: 150 }
  },
  15: {
    src: "assets/boss15.webp",
    drawWidth: 222,
    drawHeight: 188,
    yOffset: 11,
    hitbox: { w: 202, h: 154 }
  }
};

Object.values(BOSS_IMAGE_CONFIGS).forEach(config => {
  config.image = new Image();
  config.ready = false;
  config.image.onload = () => {
    config.renderImage = makeBossRenderImage(config);
    config.ready = Boolean(config.renderImage);
  };
  config.image.src = config.src;
});

function makeBossRenderImage(config) {
  const processed = document.createElement("canvas");
  processed.width = config.drawWidth;
  processed.height = config.drawHeight;

  const processedCtx = processed.getContext("2d");
  processedCtx.imageSmoothingEnabled = false;
  processedCtx.drawImage(config.image, 0, 0, processed.width, processed.height);

  if (!config.removeWhiteBackground) {
    return processed;
  }

  let imageData;

  try {
    imageData = processedCtx.getImageData(0, 0, processed.width, processed.height);
  } catch (err) {
    return null;
  }

  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    if (r > 242 && g > 242 && b > 242) {
      data[i + 3] = 0;
    } else if (r > 226 && g > 226 && b > 226) {
      data[i + 3] = Math.min(data[i + 3], 90);
    }
  }

  processedCtx.putImageData(imageData, 0, 0);

  return processed;
}

function getBossImageConfig(bossType) {
  return BOSS_IMAGE_CONFIGS[bossType.imageSlot] || null;
}

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
let mobileDragFiring = false;
let activeControlPointers = new Map();

function isMobileLike() {
  return window.matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0 || window.innerWidth <= 760;
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
      ? "Drag ship to move and shoot, or use the buttons."
      : "Move: Left/Right or A/D   Focus: Hold Shift   Shoot: Space/J   Pause: P";
  }

  resizeCanvasForScreen();
}

function setMobileInput(name, value) {
  mobileInput[name] = value;
}

function setHeldButton(button, held) {
  if (!button) return;
  button.classList.toggle("is-held", held);
}

function releaseControlPointer(pointerId) {
  const active = activeControlPointers.get(pointerId);

  if (!active) return;

  setMobileInput(active.inputName, false);
  setHeldButton(active.button, false);
  activeControlPointers.delete(pointerId);
}

function resetMobileInput() {
  mobileInput.left = false;
  mobileInput.right = false;
  mobileInput.fire = false;
  mobileDragFiring = false;
  activeControlPointers.forEach(active => setHeldButton(active.button, false));
  activeControlPointers.clear();
}

function attachHoldButton(button, inputName) {
  if (!button) return;

  const start = (e) => {
    e.preventDefault();
    initAudio();
    if (gameState !== "playing" || v_isPaused) return;

    if (typeof e.pointerId === "number") {
      activeControlPointers.set(e.pointerId, { button, inputName });
      if (button.setPointerCapture) {
        try {
          button.setPointerCapture(e.pointerId);
        } catch (err) {
          // Capture is a convenience; holding still works without it.
        }
      }
    }

    setMobileInput(inputName, true);
    setHeldButton(button, true);
    canvas.focus();
  };

  const stop = (e) => {
    if (e) e.preventDefault();

    if (e && typeof e.pointerId === "number") {
      releaseControlPointer(e.pointerId);
      return;
    }

    setMobileInput(inputName, false);
    setHeldButton(button, false);
  };

  button.addEventListener("pointerdown", start);
  button.addEventListener("pointerup", stop);
  button.addEventListener("pointercancel", stop);
  button.addEventListener("pointerleave", (e) => {
    if (e.pointerType === "mouse") stop(e);
  });
  button.addEventListener("lostpointercapture", stop);

  button.addEventListener(
    "touchstart",
    (e) => {
      if (window.PointerEvent) return;
      start(e);
    },
    { passive: false }
  );
  button.addEventListener(
    "touchend",
    (e) => {
      if (window.PointerEvent) return;
      stop(e);
    },
    { passive: false }
  );
  button.addEventListener(
    "touchcancel",
    (e) => {
      if (window.PointerEvent) return;
      stop(e);
    },
    { passive: false }
  );
  button.addEventListener("contextmenu", (e) => e.preventDefault());
}

attachHoldButton(touchLeftBtn, "left");
attachHoldButton(touchRightBtn, "right");
attachHoldButton(touchFireBtn, "fire");

function movePlayerToPointer(e) {
  const rect = canvas.getBoundingClientRect();
  const scaledX = ((e.clientX - rect.left) / rect.width) * canvas.width;
  v_player.x = clamp(scaledX, PLAYER_MIN_X, canvas.width - PLAYER_MIN_X);
}

canvas.addEventListener("pointerdown", (e) => {
  initAudio();
  canvas.focus();

  if (isMobileLike() && gameState === "playing" && !v_isPaused) {
    e.preventDefault();
    isPointerDragging = true;
    mobileDragFiring = true;
    if (canvas.setPointerCapture && typeof e.pointerId === "number") {
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch (err) {
        // Dragging still works if capture is not available.
      }
    }
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
  mobileDragFiring = false;
});

canvas.addEventListener("pointercancel", () => {
  isPointerDragging = false;
  mobileDragFiring = false;
});

canvas.addEventListener("lostpointercapture", () => {
  isPointerDragging = false;
  mobileDragFiring = false;
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

function handleAppHidden() {
  keys = {};
  isPointerDragging = false;
  mobileDragFiring = false;
  resetMobileInput();

  if (gameState === "playing" && !v_isPaused) {
    setPaused(true);
  }
}

function resizeCanvasForScreen() {
  const hud = document.querySelector(".hud");
  const viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
  const controlsVisible = isMobileLike() && gameState === "playing" && !v_isPaused;

  const horizontalPadding = 16;
  const maxWidth = Math.max(280, window.innerWidth - horizontalPadding);

  let reservedHeight = 28;

  if (hud && !hud.hidden) reservedHeight += hud.offsetHeight;
  if (hintEl && !hintEl.hidden) reservedHeight += hintEl.offsetHeight;

  if (controlsVisible && mobileControls) {
    reservedHeight += mobileControls.offsetHeight + 10;
  }

  let maxHeight = viewportHeight - reservedHeight;

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
const backgroundMusic = new Audio("assets/invaderstheme.mp3");

backgroundMusic.loop = true;
backgroundMusic.preload = "metadata";
window.ArcadeUX.musicTrack(backgroundMusic, { volume: () => MUSIC_VOLUME, muted: () => false });

function updateAudioButtons() {
  const soundText = `Sound: ${soundEnabled ? "On" : "Off"}`;
  const musicText = `Music: ${musicEnabled ? "On" : "Off"}`;
  const autofireText = `Autofire: ${autofireEnabled ? "On" : "Off"}`;

  if (soundToggleBtn) soundToggleBtn.textContent = soundText;
  if (pauseSoundToggleBtn) pauseSoundToggleBtn.textContent = soundText;
  if (musicToggleBtn) musicToggleBtn.textContent = musicText;
  if (pauseMusicToggleBtn) pauseMusicToggleBtn.textContent = musicText;
  if (autofireToggleBtn) autofireToggleBtn.textContent = autofireText;
  if (pauseAutofireToggleBtn) pauseAutofireToggleBtn.textContent = autofireText;
  if (soundToggleBtn) soundToggleBtn.setAttribute("aria-pressed", String(soundEnabled));
  if (pauseSoundToggleBtn) pauseSoundToggleBtn.setAttribute("aria-pressed", String(soundEnabled));
  if (musicToggleBtn) musicToggleBtn.setAttribute("aria-pressed", String(musicEnabled));
  if (pauseMusicToggleBtn) pauseMusicToggleBtn.setAttribute("aria-pressed", String(musicEnabled));
  if (autofireToggleBtn) autofireToggleBtn.setAttribute("aria-pressed", String(autofireEnabled));
  if (pauseAutofireToggleBtn) pauseAutofireToggleBtn.setAttribute("aria-pressed", String(autofireEnabled));
}

function updateTitleToggleButtons() {
  if (controlsToggleBtn && controlsCard) {
    controlsToggleBtn.setAttribute("aria-expanded", String(!controlsCard.hidden));
  }

  if (trophiesToggleBtn && trophiesCard) {
    trophiesToggleBtn.setAttribute("aria-expanded", String(!trophiesCard.hidden));
  }
}

function startMusic(restart = false) {
  if (!musicEnabled || !window.ArcadeUX.musicAllowed() || gameState !== "playing" || v_isPaused) return;

  if (restart) {
    backgroundMusic.currentTime = 0;
  }

  backgroundMusic.play().catch(() => {
    // Browser autoplay policy may wait for the next player interaction.
  });
}

function stopMusic(reset = false) {
  backgroundMusic.pause();

  if (reset) {
    backgroundMusic.currentTime = 0;
  }
}

function toggleSoundEnabled() {
  soundEnabled = !soundEnabled;
  saveAudioSettings();
  updateAudioButtons();

  if (soundEnabled) {
    initAudio();
    playSound("power");
  }
}

function toggleMusicEnabled() {
  musicEnabled = !musicEnabled;
  saveAudioSettings();
  updateAudioButtons();

  if (musicEnabled) {
    startMusic();
  } else {
    stopMusic();
  }
}

function toggleAutofireEnabled() {
  autofireEnabled = !autofireEnabled;
  saveAutofireSetting();
  updateAudioButtons();
  if (autofireEnabled) playSound("power");
}

function initAudio() {
  if (!soundEnabled || !window.ArcadeUX.effectsAllowed()) return;

  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    audioCtx = new AudioContext();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.25;
    window.ArcadeUX.effectsGain(masterGain, () => soundEnabled ? 0.25 : 0);
  masterGain.connect(audioCtx.destination);
  }

  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
}

function playSound(type) {
  if (!soundEnabled || !audioCtx || !masterGain || !window.ArcadeUX.effectsAllowed()) return;

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

let screenShakeTimeout = null;

function updateUI() {
  saveHighScore();

  scoreEl.textContent = `Score: ${score}`;
  livesEl.textContent = `Lives: ${Math.max(0, lives)}`;
  salvageEl.textContent = `Salvage: ${v_salvage}`;
  updateHighScoreUI();
}

function screenShake(strength = 10, duration = 160) {
  if (window.ArcadeUX.motionReduced()) {
    if (screenShakeTimeout) clearTimeout(screenShakeTimeout);
    canvas.style.transform = "none";
    screenShakeTimeout = null;
    return;
  }

  if (screenShakeTimeout) {
    clearTimeout(screenShakeTimeout);
  }

  canvas.style.transform =
    `translate(${(Math.random() * strength - strength / 2).toFixed(1)}px, ${(Math.random() * strength - strength / 2).toFixed(1)}px)`;

  screenShakeTimeout = setTimeout(() => {
    canvas.style.transform = "none";
    screenShakeTimeout = null;
  }, duration);
}

function updatePauseButton() {
  if (!pauseBtn) return;

  pauseBtn.textContent = v_isPaused ? "Resume" : "Pause";
  pauseBtn.setAttribute("aria-pressed", String(v_isPaused));
}

function showPauseMenu(show) {
  if (!pauseMenuEl) return;

  pauseMenuEl.hidden = !show;
  pauseMenuEl.setAttribute("aria-hidden", String(!show));
}

function setPaused(paused) {
  if (gameState !== "playing") return;

  v_isPaused = paused;
  resetMobileInput();
  updatePauseButton();
  showPauseMenu(paused);

  if (paused) {
    stopMusic();
  } else {
    startMusic();
  }

  updateMobileControlVisibility();
}

function togglePause() {
  setPaused(!v_isPaused);
}

function closeOverlay() {
  overlay.hidden = true;
  overlay.setAttribute("aria-hidden", "true");
  overlay.style.display = "none";
  overlay.style.pointerEvents = "none";
}

function closeUpgradeDock() {
  if (!upgradeDockEl) return;

  upgradeDockEl.hidden = true;
  upgradeDockEl.setAttribute("aria-hidden", "true");
}

function openOverlay() {
  overlay.hidden = false;
  overlay.setAttribute("aria-hidden", "false");
  overlay.style.display = "grid";
  overlay.style.pointerEvents = "auto";
}

function showGameOver(win = false) {
  if (gameState === "gameover") return;
  isGameOver = true;
  gameState = "gameover";

  saveHighScore();
  commitCareerStats();
  submitNationalScore(score);

  finalScoreEl.textContent = String(score);
  finalBestScoreEl.textContent = String(highScore);
  const sector = v_endlessMode
    ? `Rift encounter ${Math.max(1, runStats.riftEncounters)}`
    : `Level ${Math.max(1, runStats.highestCampaignLevel)}`;
  finalRunSummaryEl.textContent =
    `${sector} | Bosses ${runStats.bossesDefeated} | Aces ${runStats.elitesDestroyed} | Salvage earned ${runStats.salvageCollected}`;
  overTitle.textContent = win ? "YOU WIN" : "GAME OVER";
  continueEndlessBtn.hidden = !win;
  haptic(win ? [20, 35, 20] : [30, 40, 45]);

  keys = {};
  resetMobileInput();
  v_isPaused = false;
  updatePauseButton();
  showPauseMenu(false);
  stopMusic(true);

  closeUpgradeDock();
  openOverlay();
  updateMobileControlVisibility();
}

function showTitleScreen() {
  gameState = "title";
  isGameOver = true;

  titleScreen.hidden = false;
  titleScreen.setAttribute("aria-hidden", "false");
  closeOverlay();
  closeUpgradeDock();

  gameShellEls.forEach(el => {
    el.hidden = true;
    el.setAttribute("aria-hidden", "true");
  });

  keys = {};
  resetMobileInput();
  v_isPaused = false;
  updatePauseButton();
  showPauseMenu(false);
  stopMusic(true);

  updateHighScoreUI();
  renderTrophies();
  renderCareerStats();
  updateMobileControlVisibility();
}

function showGameShell() {
  titleScreen.hidden = true;
  titleScreen.setAttribute("aria-hidden", "true");

  gameShellEls.forEach(el => {
    el.hidden = false;
    el.setAttribute("aria-hidden", "false");
  });

  closeUpgradeDock();
  showPauseMenu(false);
  updatePauseButton();
  updateMobileControlVisibility();
}

// -------------------- Game State --------------------

let v_player = { x: 300, y: 580, w: 32, h: 34 };
let v_bullets = [];
let v_enemies = [];
let v_enemyBullets = [];
let v_powerUps = [];
let v_salvageCaches = [];
let v_particles = [];
let v_scorePopups = [];
let v_playerTrails = [];
let v_shockwaves = [];

let v_boss = null;
let v_bossDefeatedThisWave = false;
let v_bossWarningTimer = 0;

let v_dir = 1;
let v_moveTimer = 0;
let v_moveInterval = 40;
let v_waveBaseMoveInterval = 40;
let v_waveEnemyCount = 0;
let v_shootTimer = 0;
let v_level = 1;
let v_formationWave = 1;
let v_levelWaveCount = 1;
let v_invuln = 0;
let v_isPaused = false;
let v_waveBannerTimer = 0;
let v_waveBannerText = "";
let v_combo = 0;
let v_comboTimer = 0;
let v_surge = 0;
let v_playerTilt = 0;

let v_powerUpDropCooldown = 0;
let v_waveHitsTaken = 0;
let v_dangerGraceTimer = 0;
let v_powerUpDrought = 0;
let v_salvage = 0;
let v_maxLives = 5;
let v_contract = null;
let v_contractStreak = 0;
let v_dockOffers = [];
let v_dockRerolls = 0;
let v_pendingNextLevel = 0;
let v_endlessMode = false;
let v_campaignClearAfterDock = false;
let v_lastBossTypeId = null;
let v_runStartMode = "campaign";
let v_riftThreatLevel = 1;
let v_riftBackgroundSlot = 0;
let v_anomaly = null;
let v_bonusRaid = null;
let v_waveAceCount = 0;
let v_upgrades = makeUpgradeState();

let activePowerUps = {
  doubleShot: 0,
  rapidFire: 0,
  shield: 0,
  stasis: 0,
  surge: 0
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
  stasis: {
    label: "T",
    name: "Time Snare",
    color: "#c48cff"
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
    imageSlot: 1,
    attackStyle: "maw",
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
    imageSlot: 2,
    attackStyle: "needle",
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
    imageSlot: 3,
    attackStyle: "forge",
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
    imageSlot: 4,
    attackStyle: "mirror",
    color: "#c48cff",
    rageColor: "#ff87c5",
    body: "#1a0d2b",
    w: 112,
    h: 112,
    hpBonus: 4,
    speedBonus: 0.35,
    patternCount: 4
  },
  {
    id: "citadel",
    name: "DREAD CITADEL",
    imageSlot: 5,
    attackStyle: "citadel",
    color: "#ff8f3d",
    rageColor: "#ff3d00",
    body: "#22130a",
    w: 138,
    h: 96,
    hpBonus: 14,
    speedBonus: -0.1,
    patternCount: 4
  },
  {
    id: "crown",
    name: "ABYSSAL CROWN",
    imageSlot: 6,
    attackStyle: "crown",
    color: "#ff5c8a",
    rageColor: "#ffd166",
    body: "#220815",
    w: 128,
    h: 106,
    hpBonus: 18,
    speedBonus: 0.2,
    patternCount: 4
  },
  {
    id: "stalker",
    name: "RIFT STALKER",
    imageSlot: 7,
    attackStyle: "needle",
    color: "#5af2d6",
    rageColor: "#f4ffff",
    body: "#071b20",
    w: 120,
    h: 92,
    hpBonus: 8,
    speedBonus: 0.72,
    patternCount: 3
  },
  {
    id: "tyrant",
    name: "SOLAR TYRANT",
    imageSlot: 8,
    attackStyle: "forge",
    color: "#ffcf52",
    rageColor: "#ff6338",
    body: "#271407",
    w: 136,
    h: 86,
    hpBonus: 12,
    speedBonus: -0.16,
    patternCount: 3
  },
  {
    id: "prism",
    name: "PHANTOM PRISM",
    imageSlot: 9,
    attackStyle: "mirror",
    color: "#9e8cff",
    rageColor: "#ff8dd8",
    body: "#130d28",
    w: 126,
    h: 116,
    hpBonus: 13,
    speedBonus: 0.42,
    patternCount: 4
  },
  {
    id: "bastion",
    name: "RUIN BASTION",
    imageSlot: 10,
    attackStyle: "citadel",
    color: "#ff9b52",
    rageColor: "#ff412b",
    body: "#24130a",
    w: 142,
    h: 100,
    hpBonus: 18,
    speedBonus: -0.12,
    patternCount: 4
  },
  {
    id: "comet",
    name: "BLOOD COMET",
    imageSlot: 11,
    attackStyle: "maw",
    color: "#ff477c",
    rageColor: "#ff164f",
    body: "#200612",
    w: 132,
    h: 102,
    hpBonus: 18,
    speedBonus: 0.52,
    patternCount: 3
  },
  {
    id: "empress",
    name: "NULL EMPRESS",
    imageSlot: 12,
    attackStyle: "crown",
    color: "#e47bff",
    rageColor: "#ffd166",
    body: "#1d0922",
    w: 144,
    h: 112,
    hpBonus: 21,
    speedBonus: 0.26,
    patternCount: 4
  },
  {
    id: "horizon",
    name: "EVENT HORIZON",
    imageSlot: 13,
    attackStyle: "mirror",
    color: "#66d9ff",
    rageColor: "#ffe2ff",
    body: "#081724",
    w: 146,
    h: 118,
    hpBonus: 23,
    speedBonus: 0.38,
    patternCount: 4
  },
  {
    id: "engine",
    name: "OBLIVION ENGINE",
    imageSlot: 14,
    attackStyle: "citadel",
    color: "#ff704d",
    rageColor: "#ffd166",
    body: "#240c08",
    w: 150,
    h: 112,
    hpBonus: 27,
    speedBonus: -0.08,
    patternCount: 4
  },
  {
    id: "sovereign",
    name: "VOID SOVEREIGN",
    imageSlot: 15,
    attackStyle: "crown",
    color: "#ff4d9d",
    rageColor: "#ffffff",
    body: "#20091c",
    w: 154,
    h: 120,
    hpBonus: 32,
    speedBonus: 0.28,
    patternCount: 4
  }
];

const SECTOR_ANOMALIES = [
  {
    id: "bounty",
    name: "BOUNTY SIGNAL",
    desc: "Marked invaders carry salvage"
  },
  {
    id: "storm",
    name: "VOLATILE STORM",
    desc: "Faster shots; grazes yield salvage"
  },
  {
    id: "fortified",
    name: "ARMORED CONVOY",
    desc: "Tougher foes; richer boss core"
  },
  {
    id: "gravity",
    name: "GRAVITY WELL",
    desc: "Heavy drift; drone shots pierce"
  },
  {
    id: "relic",
    name: "RELIC FIELD",
    desc: "More caches; salvage bonuses"
  }
];

const CAMPAIGN_SECTORS = [
  { name: "Outer Wrecks", start: 1, end: 3 },
  { name: "Glass Orbit", start: 4, end: 6 },
  { name: "Grave Nebula", start: 7, end: 9 },
  { name: "Black Forge", start: 10, end: 12 },
  { name: "Sovereign Gate", start: 13, end: 15 }
];

const RIFT_MILESTONES = [
  { depth: 5, reward: "+60 salvage cache" },
  { depth: 10, reward: "Aegis overcharge" },
  { depth: 15, reward: "+1 max hull" },
  { depth: 25, reward: "Legend marker" }
];

const RIFT_WEEKLY_BOSSES = [
  "WEEKLY: SINGULAR MAW",
  "WEEKLY: MIRROR COMET",
  "WEEKLY: RELIC CITADEL",
  "WEEKLY: NEEDLE EMPRESS"
];

const ACE_TRAITS = [
  {
    id: "sniper",
    name: "SNIPER ACE",
    color: "#7df9ff",
    hpBonus: 1,
    pointBonus: 80,
    salvageBonus: 4
  },
  {
    id: "burster",
    name: "BURSTER ACE",
    color: "#ff87c5",
    hpBonus: 1,
    pointBonus: 95,
    salvageBonus: 5
  },
  {
    id: "juggernaut",
    name: "JUGGERNAUT ACE",
    color: "#ffe66d",
    hpBonus: 2,
    pointBonus: 120,
    salvageBonus: 8
  }
];

const UPGRADE_DEFS = [
  {
    id: "cannon",
    name: "Pulse Amplifier",
    desc: "+1 damage for every cannon shot.",
    maxRank: 2,
    baseCost: 90,
    costStep: 65
  },
  {
    id: "cycle",
    name: "Cycle Loader",
    desc: "Cannons reload 2 frames faster.",
    maxRank: 3,
    baseCost: 75,
    costStep: 48
  },
  {
    id: "reactor",
    name: "Surge Reactor",
    desc: "Gain 25% more Void Surge charge.",
    maxRank: 3,
    baseCost: 72,
    costStep: 46
  },
  {
    id: "magnet",
    name: "Tractor Array",
    desc: "Pull in power-ups from farther away.",
    maxRank: 2,
    baseCost: 62,
    costStep: 42
  },
  {
    id: "shield",
    name: "Aegis Launch",
    desc: "Start each new level with shield charge.",
    maxRank: 3,
    baseCost: 82,
    costStep: 54
  },
  {
    id: "hull",
    name: "Hull Bay",
    desc: "Raise max lives and repair 1 life now.",
    maxRank: 2,
    baseCost: 108,
    costStep: 78
  },
  {
    id: "thrusters",
    name: "Vector Thrusters",
    desc: "Increase movement speed by 12%.",
    maxRank: 3,
    baseCost: 68,
    costStep: 44
  },
  {
    id: "laser",
    name: "Lance Laser",
    desc: "Focused shots pierce and hit harder.",
    maxRank: 3,
    baseCost: 94,
    costStep: 62
  },
  {
    id: "spread",
    name: "Scatter Wings",
    desc: "Add angled side shots for crowd control.",
    maxRank: 2,
    baseCost: 86,
    costStep: 58
  },
  {
    id: "drone",
    name: "Drone Nest",
    desc: "Escort drones fire extra support bolts.",
    maxRank: 3,
    baseCost: 98,
    costStep: 70
  },
  {
    id: "bulwark",
    name: "Bulwark Core",
    desc: "Shields last longer and absorb harder hits.",
    maxRank: 3,
    baseCost: 88,
    costStep: 56
  },
  {
    id: "salvage",
    name: "Scrap Harvester",
    desc: "Earn more salvage from cores, aces, and caches.",
    maxRank: 3,
    baseCost: 76,
    costStep: 52
  }
];

function makeUpgradeState() {
  return {
    cannon: 0,
    cycle: 0,
    reactor: 0,
    magnet: 0,
    shield: 0,
    hull: 0,
    thrusters: 0,
    laser: 0,
    spread: 0,
    drone: 0,
    bulwark: 0,
    salvage: 0
  };
}

function applyDeveloperModeLoadout() {
  if (!isDeveloperMode()) return;

  UPGRADE_DEFS.forEach((upgrade) => {
    v_upgrades[upgrade.id] = upgrade.maxRank;
  });
  v_maxLives = Math.max(v_maxLives, 9);
  lives = Math.max(lives, v_maxLives);
  v_salvage = Math.max(v_salvage, 999999);
  v_surge = SURGE_CHARGE_MAX;
  v_invuln = Math.max(v_invuln, PLAYER_HIT_GRACE_FRAMES);
  v_dangerGraceTimer = Math.max(v_dangerGraceTimer, PLAYER_HIT_GRACE_FRAMES);

  activePowerUps.doubleShot = Math.max(activePowerUps.doubleShot, 999999);
  activePowerUps.rapidFire = Math.max(activePowerUps.rapidFire, 999999);
  activePowerUps.shield = Math.max(activePowerUps.shield, 999999);
  activePowerUps.stasis = Math.max(activePowerUps.stasis, 999999);
  activePowerUps.surge = Math.max(activePowerUps.surge, 999999);

  v_waveBannerText = "DEVELOPER MODE READY";
  v_waveBannerTimer = Math.max(v_waveBannerTimer, 120);
}

function getUpgradeCost(upgrade) {
  return upgrade.baseCost + v_upgrades[upgrade.id] * upgrade.costStep;
}

function getDockRerollCost() {
  return DOCK_REROLL_BASE_COST + v_dockRerolls * DOCK_REROLL_COST_STEP;
}

function getSalvageMultiplier() {
  return 1 + v_upgrades.salvage * 0.18;
}

function getShieldRank() {
  return v_upgrades.shield + v_upgrades.bulwark;
}

function getProjectedStats(upgrade, rank = v_upgrades[upgrade.id]) {
  const nextRank = Math.min(upgrade.maxRank, rank + 1);
  const stats = {
    damage: 1 + v_upgrades.cannon + v_upgrades.laser,
    fireRate: Math.max(4, 20 - v_upgrades.cycle * 2),
    spread: v_upgrades.spread,
    drones: v_upgrades.drone,
    shield: getShieldRank() * 150,
    speed: Math.round((1 + v_upgrades.thrusters * 0.12) * 100),
    salvage: Math.round(getSalvageMultiplier() * 100),
    surge: Math.round((1 + v_upgrades.reactor * 0.25) * 100),
    hull: v_maxLives
  };
  const projected = { ...stats };

  if (upgrade.id === "cannon") projected.damage += 1;
  if (upgrade.id === "laser") projected.damage += 1;
  if (upgrade.id === "cycle") projected.fireRate = Math.max(4, 20 - nextRank * 2);
  if (upgrade.id === "spread") projected.spread = nextRank;
  if (upgrade.id === "drone") projected.drones = nextRank;
  if (upgrade.id === "shield") projected.shield = (nextRank + v_upgrades.bulwark) * 150;
  if (upgrade.id === "bulwark") projected.shield = (v_upgrades.shield + nextRank) * 150;
  if (upgrade.id === "thrusters") projected.speed = Math.round((1 + nextRank * 0.12) * 100);
  if (upgrade.id === "salvage") projected.salvage = Math.round((1 + nextRank * 0.18) * 100);
  if (upgrade.id === "reactor") projected.surge = Math.round((1 + nextRank * 0.25) * 100);
  if (upgrade.id === "hull") projected.hull = v_maxLives + 1;

  return { current: stats, projected };
}

function formatStatDelta(label, current, projected, suffix = "") {
  const changed = current !== projected;
  return `${label}: ${current}${suffix} > ${projected}${suffix}${changed ? "" : " (same)"}`;
}

function getUpgradeComparisonLines(upgrade) {
  const { current, projected } = getProjectedStats(upgrade);

  if (upgrade.id === "cycle") return [formatStatDelta("Reload", current.fireRate, projected.fireRate, "f")];
  if (upgrade.id === "spread") return [formatStatDelta("Side shots", current.spread, projected.spread)];
  if (upgrade.id === "drone") return [formatStatDelta("Drones", current.drones, projected.drones)];
  if (upgrade.id === "shield" || upgrade.id === "bulwark") return [formatStatDelta("Start shield", current.shield, projected.shield, "f")];
  if (upgrade.id === "thrusters") return [formatStatDelta("Speed", current.speed, projected.speed, "%")];
  if (upgrade.id === "salvage") return [formatStatDelta("Salvage", current.salvage, projected.salvage, "%")];
  if (upgrade.id === "reactor") return [formatStatDelta("Surge gain", current.surge, projected.surge, "%")];
  if (upgrade.id === "hull") return [formatStatDelta("Max hull", current.hull, projected.hull)];
  return [formatStatDelta("Shot damage", current.damage, projected.damage)];
}

function getSectorAnomaly(level) {
  if (level < 2) return null;

  if (v_endlessMode) {
    const rotation = Math.floor((level - 1) / 2) % SECTOR_ANOMALIES.length;
    const extra = Math.random() < 0.32 ? 1 : 0;
    return SECTOR_ANOMALIES[(rotation + extra) % SECTOR_ANOMALIES.length];
  }

  return SECTOR_ANOMALIES[(level - 2) % SECTOR_ANOMALIES.length];
}

function createLevelContract(level) {
  const contractLevel = v_endlessMode ? getDifficultyLevel() : level;
  const reward = 28 + contractLevel * 4;
  const type = v_endlessMode ? Math.floor(Math.random() * 3) : (level - 1) % 3;

  if (type === 0) {
    return {
      id: "flawless",
      name: "CLEAN SWEEP",
      desc: "Take no hits",
      target: 1,
      progress: 1,
      failed: false,
      reward
    };
  }

  if (type === 1) {
    const target = Math.min(12, 5 + Math.floor(contractLevel / 3));
    return {
      id: "chain",
      name: "CHAIN ORDER",
      desc: `Reach chain x${target}`,
      target,
      progress: 0,
      failed: false,
      reward
    };
  }

  const target = Math.min(9, 2 + Math.floor(contractLevel / 3));
  return {
    id: "graze",
    name: "CLOSE CALL",
    desc: `Graze ${target} shots`,
    target,
    progress: 0,
    failed: false,
    reward: reward + 8
  };
}

function isContractComplete(contract) {
  return contract && !contract.failed && contract.progress >= contract.target;
}

function getContractProgress(contract) {
  if (contract.id === "flawless") {
    return contract.failed ? "FAILED" : "INTACT";
  }

  return `${Math.min(contract.progress, contract.target)}/${contract.target}`;
}

function getContractStreakBonus(streak) {
  return Math.min(48, Math.max(0, streak - 1) * 8);
}

function resolveLevelContract() {
  if (!v_contract) return;

  if (isContractComplete(v_contract)) {
    v_contractStreak++;
    runStats.maxContractStreak = Math.max(runStats.maxContractStreak, v_contractStreak);
    const streakBonus = getContractStreakBonus(v_contractStreak);
    const payout = v_contract.reward + streakBonus;

    addSalvage(
      payout,
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 - 10,
      streakBonus > 0 ? `STREAK x${v_contractStreak} +${payout}` : `CONTRACT +${payout}`
    );
    runStats.contractsCompleted++;

    if (v_contractStreak > 0 && v_contractStreak % 3 === 0) {
      activePowerUps.shield = Math.max(activePowerUps.shield, 270);
      addSurge(14, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 18);
      v_scorePopups.push({
        x: GAME_WIDTH / 2,
        y: GAME_HEIGHT / 2 + 40,
        text: "STREAK SHIELD",
        color: "#7df9ff",
        life: 82,
        maxLife: 82,
        vy: -0.38
      });
    }

    checkTrophies();
  } else {
    v_contractStreak = 0;
    v_scorePopups.push({
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT / 2 - 10,
      text: "CONTRACT MISSED",
      color: "#8f8f8f",
      life: 70,
      maxLife: 70,
      vy: -0.4
    });
  }

  v_contract = null;
}

function getDifficultyLevel(level = v_level) {
  return v_endlessMode ? v_riftThreatLevel : level;
}

function getRewardLevel() {
  if (!v_endlessMode) return v_level;

  return Math.max(3, Math.round((v_riftThreatLevel + v_level) / 2));
}

function chooseFormationWaveCount(level) {
  if (!v_endlessMode) {
    return Math.min(3, Math.ceil(level / 5));
  }

  const maxWaves = level >= 6 ? 4 : 3;
  return 1 + Math.floor(Math.random() * maxWaves);
}

function getFormationWaveCount() {
  return v_levelWaveCount;
}

function shouldOpenUpgradeDock(level) {
  if (!v_endlessMode) {
    return CAMPAIGN_DOCK_LEVELS.includes(level);
  }

  return level % ENDLESS_DOCK_INTERVAL === 0;
}

function getFormationBannerText() {
  const waveCount = getFormationWaveCount();

  if (v_endlessMode) {
    return waveCount === 1
      ? `RIFT ENCOUNTER ${v_level}`
      : `RIFT ENCOUNTER ${v_level} - WAVE ${v_formationWave}/${waveCount}`;
  }

  if (waveCount === 1) {
    return `LEVEL ${v_level}`;
  }

  return `LEVEL ${v_level} - WAVE ${v_formationWave}/${waveCount}`;
}

function getBossStrengthMultiplier(level) {
  if (!v_endlessMode) return 1;

  const riftDepth = Math.max(1, level);
  return 1 + Math.floor((riftDepth - 1) / 3) * BOSS_CYCLE_STRENGTH_INCREASE * 0.25;
}

function getBossMaxHp(level, bossType) {
  const bossTier = bossType.imageSlot;
  const campaignHp = Math.max(
    18,
    20 + bossTier * 6 + Math.floor((bossTier - 1) / 5) * 8 + bossType.hpBonus
  );
  const endlessHp = 38 + getDifficultyLevel(level) * 7 + Math.round(bossType.hpBonus * 0.45);
  const baseBossHp = v_endlessMode ? endlessHp : campaignHp;

  const convoyArmor = v_anomaly && v_anomaly.id === "fortified" ? 1.18 : 1;

  return Math.round(baseBossHp * getBossStrengthMultiplier(level) * convoyArmor);
}

function getRiftMilestoneStatus(depth = v_level) {
  return RIFT_MILESTONES.find(milestone => depth < milestone.depth) || RIFT_MILESTONES[RIFT_MILESTONES.length - 1];
}

function getWeeklyBossName(depth = v_level) {
  return RIFT_WEEKLY_BOSSES[Math.floor(Math.max(0, depth - 1) / RIFT_WEEKLY_BOSS_INTERVAL) % RIFT_WEEKLY_BOSSES.length];
}

function awardRiftMilestone(level) {
  const milestone = RIFT_MILESTONES.find(item => item.depth === level);
  if (!milestone) return;

  if (level === 5) {
    addSalvage(60, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, "MILESTONE +60");
  } else if (level === 10) {
    activePowerUps.shield = Math.max(activePowerUps.shield, 720);
  } else if (level === 15) {
    v_maxLives++;
    lives = Math.min(v_maxLives, lives + 1);
    updateUI();
  }

  v_scorePopups.push({
    x: GAME_WIDTH / 2,
    y: GAME_HEIGHT / 2 + 18,
    text: `RIFT MILESTONE ${level}`,
    color: "#ffe66d",
    life: 96,
    maxLife: 96,
    vy: -0.35
  });
}

function deployLevel(level) {
  v_level = level;

  if (v_endlessMode) {
    runStats.enteredEndless = true;
    runStats.riftEncounters = Math.max(runStats.riftEncounters, v_level);
    v_riftThreatLevel = Math.max(3, 5 + Math.floor((v_level - 1) * 0.55) + Math.floor(rand(-2, 4)));
    v_riftBackgroundSlot = Math.floor(Math.random() * BACKGROUND_IMAGE_CONFIGS.length);
    awardRiftMilestone(level);
  } else {
    runStats.highestCampaignLevel = Math.max(runStats.highestCampaignLevel, v_level);
  }

  v_bossDefeatedThisWave = false;
  v_formationWave = 1;
  v_levelWaveCount = chooseFormationWaveCount(v_level);
  v_anomaly = getSectorAnomaly(v_level);
  v_bonusRaid = null;
  v_salvageCaches = [];
  v_contract = createLevelContract(v_level);
  v_waveBannerTimer = 105;
  v_waveBannerText = getFormationBannerText();
  v_bullets.length = 0;
  v_enemyBullets.length = 0;

  if (getShieldRank() > 0) {
    activePowerUps.shield = Math.max(activePowerUps.shield, getShieldRank() * 150);
  }

  checkTrophies();
  spawnInvaders();
}

function chooseDockOffers(previousOffers = []) {
  const candidates = UPGRADE_DEFS.filter(upgrade => v_upgrades[upgrade.id] < upgrade.maxRank);
  const previousIds = new Set(previousOffers.map(offer => offer.id));

  for (let i = candidates.length - 1; i > 0; i--) {
    const pick = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[pick]] = [candidates[pick], candidates[i]];
  }

  const selected = candidates.slice(0, 3);
  const freshOffer = candidates.find(upgrade => !previousIds.has(upgrade.id));

  if (freshOffer && selected.every(upgrade => previousIds.has(upgrade.id))) {
    selected[selected.length - 1] = freshOffer;
  }

  return selected;
}

function renderUpgradeDock() {
  if (!dockSummaryEl || !upgradeOffersEl) return;

  const streak = v_contractStreak > 0 ? `  |  Contract streak x${v_contractStreak}` : "";
  const destination = v_campaignClearAfterDock
    ? "Endless Rift unlock pending"
    : v_endlessMode
      ? `Next: Rift Encounter ${v_pendingNextLevel}`
      : `Next: Level ${v_pendingNextLevel}`;
  dockSummaryEl.textContent = `Salvage: ${v_salvage}  |  ${destination}${streak}  |  Bonus raid ready`;
  upgradeOffersEl.innerHTML = "";

  if (dockRepairBtn) {
    dockRepairBtn.textContent = lives >= v_maxLives
      ? "Hull Fully Repaired"
      : `Repair Hull +1 - ${DOCK_REPAIR_COST}`;
    dockRepairBtn.disabled = lives >= v_maxLives || v_salvage < DOCK_REPAIR_COST;
    dockRepairBtn.setAttribute("aria-disabled", String(dockRepairBtn.disabled));
  }

  if (dockRerollBtn) {
    const rerollCost = getDockRerollCost();
    dockRerollBtn.textContent = `Refresh Offers - ${rerollCost}`;
    dockRerollBtn.disabled =
      !UPGRADE_DEFS.some(upgrade => v_upgrades[upgrade.id] < upgrade.maxRank) ||
      v_salvage < rerollCost;
    dockRerollBtn.setAttribute("aria-disabled", String(dockRerollBtn.disabled));
  }

  if (!v_dockOffers.length) {
    const completed = document.createElement("p");
    completed.className = "dock-summary";
    completed.textContent = "All upgrade systems are fully tuned.";
    upgradeOffersEl.appendChild(completed);
    return;
  }

  v_dockOffers.forEach(upgrade => {
    const rank = v_upgrades[upgrade.id];
    const maxed = rank >= upgrade.maxRank;
    const cost = getUpgradeCost(upgrade);
    const card = document.createElement("div");
    card.className = "upgrade-offer";

    const name = document.createElement("div");
    name.className = "upgrade-name";
    name.textContent = upgrade.name;

    const rankEl = document.createElement("div");
    rankEl.className = "upgrade-rank";
    rankEl.textContent = `Rank ${rank}/${upgrade.maxRank}`;

    const desc = document.createElement("div");
    desc.className = "upgrade-desc";
    desc.textContent = upgrade.desc;

    const comparison = document.createElement("div");
    comparison.className = "upgrade-comparison";
    getUpgradeComparisonLines(upgrade).forEach(line => {
      const row = document.createElement("span");
      row.textContent = line;
      comparison.appendChild(row);
    });

    const buy = document.createElement("button");
    buy.type = "button";
    buy.textContent = maxed ? "MAXED" : `Buy - ${cost}`;
    buy.disabled = maxed || v_salvage < cost;
    buy.setAttribute("aria-disabled", String(buy.disabled));
    buy.addEventListener("click", () => purchaseUpgrade(upgrade.id));

    card.appendChild(name);
    card.appendChild(rankEl);
    card.appendChild(desc);
    card.appendChild(comparison);
    card.appendChild(buy);
    upgradeOffersEl.appendChild(card);
  });
}

function openUpgradeDock(nextLevel) {
  gameState = "dock";
  v_pendingNextLevel = nextLevel;
  v_dockRerolls = 0;
  v_dockOffers = chooseDockOffers();
  keys = {};
  resetMobileInput();
  updateMobileControlVisibility();
  renderUpgradeDock();
  upgradeDockEl.hidden = false;
  upgradeDockEl.setAttribute("aria-hidden", "false");
}

function purchaseUpgrade(upgradeId) {
  if (gameState !== "dock") return;

  const upgrade = v_dockOffers.find(offer => offer.id === upgradeId);
  if (!upgrade || v_upgrades[upgrade.id] >= upgrade.maxRank) return;

  const cost = getUpgradeCost(upgrade);
  if (v_salvage < cost) return;

  v_salvage -= cost;
  v_upgrades[upgrade.id]++;
  runStats.upgradesBought++;

  if (upgrade.id === "hull") {
    v_maxLives++;
    lives = Math.min(v_maxLives, lives + 1);
  }

  updateUI();
  checkTrophies();
  playSound("power");
  renderUpgradeDock();
}

function purchaseDockRepair() {
  if (gameState !== "dock" || lives >= v_maxLives || v_salvage < DOCK_REPAIR_COST) return;

  v_salvage -= DOCK_REPAIR_COST;
  lives++;
  updateUI();
  playSound("power");
  renderUpgradeDock();
}

function rerollDockOffers() {
  if (gameState !== "dock") return;

  const cost = getDockRerollCost();
  if (v_salvage < cost || !v_dockOffers.length) return;

  v_salvage -= cost;
  v_dockRerolls++;
  v_dockOffers = chooseDockOffers(v_dockOffers);
  updateUI();
  playSound("power");
  renderUpgradeDock();
}

function startBonusRaid() {
  if (gameState !== "dock") return;

  const nextLevel = v_pendingNextLevel;

  closeUpgradeDock();
  gameState = "playing";
  v_pendingNextLevel = 0;
  v_anomaly = null;
  v_contract = null;
  v_boss = null;
  v_bossDefeatedThisWave = false;
  v_enemies = [];
  v_bullets = [];
  v_enemyBullets = [];
  v_powerUps = [];
  v_salvageCaches = [];
  v_particles = [];
  v_scorePopups = [];
  v_shockwaves = [];
  v_combo = 0;
  v_comboTimer = 0;
  v_invuln = Math.max(v_invuln, WAVE_GRACE_FRAMES);
  v_bonusRaid = {
    nextLevel,
    timer: BONUS_RAID_DURATION_FRAMES,
    cacheTimer: 8,
    debrisTimer: 70,
    cachesBroken: 0,
    salvageEarned: 0,
    multiplier: 1
  };
  v_waveBannerTimer = 118;
  v_waveBannerText = "SALVAGE RAID";

  startMusic();
  playSound("power");
  updateMobileControlVisibility();
  canvas.focus();
}

function finishBonusRaid() {
  if (!v_bonusRaid) return;

  const raid = v_bonusRaid;

  if (raid.cachesBroken >= 8) {
    const completionBonus = 12 + raid.cachesBroken * 2;
    addSalvage(completionBonus, GAME_WIDTH / 2, GAME_HEIGHT / 2, `RAID BONUS +${completionBonus}`);
  }

  runStats.bonusRaidsCompleted++;
  runStats.bestRaidSalvage = Math.max(runStats.bestRaidSalvage, raid.salvageEarned);
  checkTrophies();

  v_bonusRaid = null;
  v_salvageCaches = [];
  v_enemyBullets = [];
  v_bullets = [];

  if (v_campaignClearAfterDock) {
    v_campaignClearAfterDock = false;
    showGameOver(true);
    return;
  }

  deployLevel(raid.nextLevel);
}

function launchNextSector() {
  if (gameState !== "dock") return;

  const nextLevel = v_pendingNextLevel;

  closeUpgradeDock();
  v_pendingNextLevel = 0;

  if (v_campaignClearAfterDock) {
    v_campaignClearAfterDock = false;
    showGameOver(true);
    return;
  }

  gameState = "playing";
  deployLevel(nextLevel);
  startMusic();
  updateMobileControlVisibility();
  canvas.focus();
}

function enterEndlessRift() {
  if (gameState !== "gameover") return;

  v_endlessMode = true;
  v_runStartMode = "endless";
  v_campaignClearAfterDock = false;
  v_lastBossTypeId = null;
  isGameOver = false;
  gameState = "playing";
  closeOverlay();
  deployLevel(1);
  v_scorePopups.push({
    x: GAME_WIDTH / 2,
    y: GAME_HEIGHT / 2 + 58,
    text: "ENDLESS RIFT OPEN",
    color: "#ff87c5",
    life: 110,
    maxLife: 110,
    vy: -0.36
  });
  startMusic();
  updateMobileControlVisibility();
  canvas.focus();
}

function initInvaders(startMode = v_runStartMode) {
  v_runStartMode = startMode === "endless" ? "endless" : "campaign";

  isGameOver = false;
  gameState = "playing";
  v_isPaused = false;
  updatePauseButton();

  showGameShell();

  keys = {};
  resetMobileInput();

  closeOverlay();

  lives = 3;
  v_maxLives = 5;
  v_salvage = 0;
  v_upgrades = makeUpgradeState();
  v_contractStreak = 0;
  v_dockRerolls = 0;
  v_pendingNextLevel = 0;
  v_endlessMode = v_runStartMode === "endless";
  v_campaignClearAfterDock = false;
  v_lastBossTypeId = null;
  v_riftThreatLevel = 1;
  v_riftBackgroundSlot = 0;
  v_anomaly = null;
  v_bonusRaid = null;
  score = 0;
  gameFrame = 0;
  updateUI();

  v_player.x = canvas.width / 2;
  v_player.y = 580;

  v_bullets = [];
  v_enemyBullets = [];
  v_powerUps = [];
  v_salvageCaches = [];
  v_particles = [];
  v_scorePopups = [];
  v_playerTrails = [];
  v_shockwaves = [];
  v_boss = null;
  v_bossDefeatedThisWave = false;
  v_bossWarningTimer = 0;

  activePowerUps.doubleShot = 0;
  activePowerUps.rapidFire = 0;
  activePowerUps.shield = 0;
  activePowerUps.stasis = 0;
  activePowerUps.surge = 0;

  v_level = 1;
  if (v_endlessMode) {
    v_riftThreatLevel = Math.max(3, 5 + Math.floor(rand(-2, 4)));
    v_riftBackgroundSlot = Math.floor(Math.random() * BACKGROUND_IMAGE_CONFIGS.length);
  }
  v_formationWave = 1;
  v_levelWaveCount = chooseFormationWaveCount(v_level);
  v_anomaly = getSectorAnomaly(v_level);
  v_contract = createLevelContract(v_level);
  v_invuln = 0;
  v_combo = 0;
  v_comboTimer = 0;
  v_surge = 0;
  v_playerTilt = 0;
  v_waveHitsTaken = 0;
  v_dangerGraceTimer = WAVE_GRACE_FRAMES;
  runStats = makeRunStats();
  careerCheckpoint = null;
  const dailyBoost = window.ArcadeDailyRewards?.consumeBoost("void-invaders");
  if (dailyBoost?.id === "shield") activePowerUps.shield = Math.max(activePowerUps.shield, 560);
  if (dailyBoost?.id === "life") lives += dailyBoost.amount;
  if (dailyBoost?.id === "surge") v_surge = Math.min(SURGE_CHARGE_MAX, dailyBoost.amount);
  applyDeveloperModeLoadout();
  updateUI();
  if (v_endlessMode) {
    runStats.enteredEndless = true;
    runStats.riftEncounters = 1;
  }
  v_powerUpDropCooldown = 0;
  v_powerUpDrought = 0;
  v_waveBannerTimer = 110;
  v_waveBannerText = getFormationBannerText();

  initBackground();
  spawnInvaders();

  if (v_endlessMode) {
    v_scorePopups.push({
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT / 2 + 58,
      text: "ENDLESS RIFT OPEN",
      color: "#ff87c5",
      life: 110,
      maxLife: 110,
      vy: -0.36
    });
    checkTrophies();
  }

  startMusic(true);

  canvas.focus();
  updateMobileControlVisibility();
}

function spawnInvaders(resetLevelDamage = true) {
  v_enemies = [];
  v_dir = 1;
  v_moveTimer = 0;
  v_boss = null;
  if (resetLevelDamage) {
    v_waveHitsTaken = 0;
  }
  v_dangerGraceTimer = Math.max(v_dangerGraceTimer, WAVE_GRACE_FRAMES);

  const difficultyLevel = getDifficultyLevel();
  const riftDepth = Math.max(1, v_level);
  const rows = v_endlessMode
    ? Math.min(7, 5 + Math.floor(riftDepth / 6) + (Math.random() < 0.48 ? 1 : 0))
    : Math.min(6, 3 + Math.floor((difficultyLevel - 1) / 3));
  const cols = v_endlessMode && Math.random() < 0.42 ? 7 : 8;
  const endlessTypes = ["orb", "squid", "crawler", "squid", "crawler"];
  const aceEligible =
    v_endlessMode ||
    difficultyLevel >= 5 ||
    Boolean(v_anomaly && v_anomaly.id === "bounty");
  const aceChance = v_anomaly && v_anomaly.id === "bounty"
    ? v_endlessMode ? 0.18 : 0.13
    : v_endlessMode
      ? Math.min(0.055 + riftDepth * 0.005, 0.16)
      : difficultyLevel >= 8 ? 0.035 + difficultyLevel * 0.003 : 0;
  const guaranteedAceIndex = aceEligible && (v_endlessMode || difficultyLevel >= 5)
    ? Math.floor(Math.random() * rows * cols)
    : -1;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const formationIndex = r * cols + c;
      const type = v_endlessMode
        ? endlessTypes[Math.floor(Math.random() * endlessTypes.length)]
        : r % 3 === 0 ? "orb" : r % 3 === 1 ? "squid" : "crawler";
      const stats = getEnemyStats(type, difficultyLevel);
      const elite = aceEligible &&
        (formationIndex === guaranteedAceIndex || Math.random() < aceChance);
      const aceTrait = elite
        ? ACE_TRAITS[v_endlessMode
          ? Math.floor(Math.random() * ACE_TRAITS.length)
          : (formationIndex + v_level + v_formationWave) % ACE_TRAITS.length]
        : null;
      const convoyArmor = v_anomaly && v_anomaly.id === "fortified" ? 1 : 0;
      const addedHp = convoyArmor + (aceTrait ? aceTrait.hpBonus : 0);

      v_enemies.push({
        x: 50 + c * 50,
        y: 50 + r * 50,
        type,
        hp: stats.hp + addedHp,
        maxHp: stats.hp + addedHp,
        points: stats.points + convoyArmor * 18 + (aceTrait ? aceTrait.pointBonus : 0),
        armored: stats.armored || addedHp > 0,
        elite,
        aceTrait,
        imageSlot: v_endlessMode
          ? Math.floor(Math.random() * ENEMY_IMAGE_CONFIGS.length)
          : (v_level + v_formationWave + r - 2) % ENEMY_IMAGE_CONFIGS.length,
        animOffset: Math.random() * Math.PI * 2,
        wobble: rand(0.75, 1.35)
      });
    }
  }

  v_waveAceCount = v_enemies.filter(enemy => enemy.elite).length;
  const riftTempo = v_endlessMode ? rand(0, 2.5) : 0;
  v_waveBaseMoveInterval = Math.round(
    Math.max(10, 43 - difficultyLevel * 1.65 - (v_formationWave - 1) * 1.3 - riftTempo)
  );
  v_waveEnemyCount = v_enemies.length;
  v_moveInterval = v_waveBaseMoveInterval;
}

function getEnemyStats(type, difficultyLevel = getDifficultyLevel()) {
  let hp = 1;
  let points = 20;
  let armored = false;

  if (type === "orb") {
    hp = 1;
    points = 20;

    if (difficultyLevel >= 6) {
      hp += 1;
      points += 15;
      armored = true;
    }

    if (difficultyLevel >= 14) {
      hp += 1;
      points += 16;
    }
  }

  if (type === "squid") {
    hp = 1;
    points = 30;

    if (difficultyLevel >= 5) {
      hp += 1;
      points += 18;
      armored = true;
    }

    if (difficultyLevel >= 12) {
      hp += 1;
      points += 18;
    }
  }

  if (type === "crawler") {
    hp = 2 + Math.floor((difficultyLevel - 1) / 6);
    points = 45 + Math.floor(difficultyLevel / 2) * 10;
    armored = true;
  }

  const armorChance = Math.min(
    0.06 + difficultyLevel * 0.009 + (v_endlessMode ? 0.03 : 0),
    0.25
  );

  if (difficultyLevel >= 4 && Math.random() < armorChance) {
    hp += 1;
    points += 20;
    armored = true;
  }

  return { hp, points, armored };
}

function chooseBossType(level) {
  if (!v_endlessMode && level <= FINAL_LEVEL) {
    return BOSS_TYPES[level - 1];
  }

  if (v_endlessMode && level % RIFT_WEEKLY_BOSS_INTERVAL === 0) {
    return BOSS_TYPES[(Math.floor(level / RIFT_WEEKLY_BOSS_INTERVAL) * 4 + 2) % BOSS_TYPES.length];
  }

  const choices = BOSS_TYPES.filter(type => type.id !== v_lastBossTypeId);
  return choices[Math.floor(Math.random() * choices.length)];
}

function spawnBoss() {
  const bossType = chooseBossType(v_level);
  const bossStrengthMultiplier = getBossStrengthMultiplier(v_level);
  const bossHp = getBossMaxHp(v_level, bossType);
  const bossImageConfig = getBossImageConfig(bossType);
  const difficultyLevel = getDifficultyLevel();

  v_lastBossTypeId = bossType.id;

  v_boss = {
    x: GAME_WIDTH / 2,
    y: 92,
    w: bossImageConfig ? bossImageConfig.hitbox.w : bossType.w,
    h: bossImageConfig ? bossImageConfig.hitbox.h : bossType.h,
    hp: bossHp,
    maxHp: bossHp,
    vx: 1.15 + Math.min(difficultyLevel * 0.075, 1.65) + bossType.speedBonus,
    shootTimer: 80,
    pattern: 0,
    rage: false,
    variant: bossType,
    strengthMultiplier: bossStrengthMultiplier,
    hitFlash: 0,
    animOffset: Math.random() * Math.PI * 2
  };

  v_bossDefeatedThisWave = false;
  v_bossWarningTimer = 90;
  v_enemyBullets.length = 0;
  v_dangerGraceTimer = Math.max(v_dangerGraceTimer, BOSS_GRACE_FRAMES);

  v_waveBannerTimer = 120;
  v_waveBannerText = bossType.name;

  playSound("boss");
}

function isLeftPressed() {
  return keys["ArrowLeft"] || keys["a"] || keys["A"] || mobileInput.left;
}

function isRightPressed() {
  return keys["ArrowRight"] || keys["d"] || keys["D"] || mobileInput.right;
}

function isFirePressed() {
  return autofireEnabled ||
    keys[" "] ||
    keys["Spacebar"] ||
    keys["j"] ||
    keys["J"] ||
    keys["ArrowUp"] ||
    mobileInput.fire ||
    mobileDragFiring;
}

function isFocusPressed() {
  return keys["Shift"] || isPointerDragging;
}

function getPlayerSpeed() {
  const thrusterBoost = 1 + v_upgrades.thrusters * 0.12;
  const focusMultiplier = isFocusPressed() ? PLAYER_FOCUS_SPEED_FACTOR : 1;

  return PLAYER_SPEED * thrusterBoost * focusMultiplier;
}

function firePlayerBullet() {
  const surging = activePowerUps.surge > 0;
  const bulletSpeed = surging ? SURGE_BULLET_SPEED : -7.5;
  const bulletDamage = (surging ? SURGE_BULLET_DAMAGE : 1) + v_upgrades.cannon + v_upgrades.laser;
  const pierce = surging ? SURGE_BULLET_PIERCE + v_upgrades.laser : v_upgrades.laser > 0 ? 1 : 0;
  const bulletType = v_upgrades.laser > 0 ? "laser" : "player";
  const pushShot = (x, y, vx, vy, type = bulletType, damage = bulletDamage, shotPierce = pierce) => {
    v_bullets.push({ x, y, vx, vy, type, damage, pierce: shotPierce });
  };

  if (surging) {
    pushShot(v_player.x, v_player.y - PLAYER_MUZZLE_OFFSET, 0, bulletSpeed, "surge");
  } else if (activePowerUps.doubleShot > 0) {
    pushShot(v_player.x - 9, v_player.y - PLAYER_MUZZLE_OFFSET, -0.25, bulletSpeed);
    pushShot(v_player.x + 9, v_player.y - PLAYER_MUZZLE_OFFSET, 0.25, bulletSpeed);
  } else {
    pushShot(v_player.x, v_player.y - PLAYER_MUZZLE_OFFSET, 0, bulletSpeed);
  }

  if (!surging && v_upgrades.spread > 0) {
    const offsets = v_upgrades.spread >= 2 ? [-21, 21] : [-16, 16];
    const sideSpeed = v_upgrades.spread >= 2 ? 1.35 : 0.9;
    offsets.forEach(offset => {
      pushShot(
        v_player.x + offset,
        v_player.y - PLAYER_MUZZLE_OFFSET + 4,
        Math.sign(offset) * sideSpeed,
        bulletSpeed + 0.35,
        "spread",
        Math.max(1, bulletDamage - 1),
        0
      );
    });
  }

  if (!surging && v_upgrades.drone > 0 && gameFrame % 2 === 0) {
    for (let i = 0; i < v_upgrades.drone; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const lane = Math.ceil((i + 1) / 2);
      pushShot(
        v_player.x + side * (30 + lane * 12),
        v_player.y - 26 - lane * 5,
        side * 0.18,
        bulletSpeed + 1.25,
        "drone",
        1,
        v_anomaly && v_anomaly.id === "gravity" ? 1 : 0
      );
    }
  }

  limitArray(v_bullets, MAX_PLAYER_BULLETS);
  playSound("shoot");
  const baseCooldown = surging ? SURGE_SHOT_COOLDOWN : activePowerUps.rapidFire > 0 ? 8 : 20;
  v_shootTimer = Math.max(4, baseCooldown - v_upgrades.cycle * 2);
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

function addSalvage(amount, x, y, label = "") {
  const boostedAmount = Math.max(1, Math.round(amount * getSalvageMultiplier()));
  v_salvage += boostedAmount;
  runStats.salvageCollected += boostedAmount;
  if (v_bonusRaid) {
    v_bonusRaid.salvageEarned += boostedAmount;
  }
  updateUI();

  v_scorePopups.push({
    x,
    y,
    text: label ? label.replace(`+${amount}`, `+${boostedAmount}`) : `SALVAGE +${boostedAmount}`,
    color: "#ffe66d",
    life: 68,
    maxLife: 68,
    vy: -0.45
  });
}

function addSurge(amount, x = v_player.x, y = v_player.y) {
  if (activePowerUps.surge > 0 || isGameOver || gameState !== "playing") return;

  amount *= 1 + v_upgrades.reactor * 0.25;
  v_surge = clamp(v_surge + amount, 0, SURGE_CHARGE_MAX);

  if (v_surge >= SURGE_CHARGE_MAX) {
    triggerVoidSurge(x, y);
  }
}

function triggerVoidSurge(x = v_player.x, y = v_player.y) {
  v_surge = 0;
  activePowerUps.surge = SURGE_DURATION_FRAMES;
  activePowerUps.rapidFire = Math.max(activePowerUps.rapidFire, SURGE_RAPID_FIRE_GRANT);
  v_invuln = Math.max(v_invuln, SURGE_INVULN_FRAMES);
  v_shootTimer = 0;

  spawnShockwave(x, y, "#7df9ff", 165, 34);
  spawnParticles(x, y, "#7df9ff", 34);
  spawnParticles(x, y, "#ff87c5", 22);

  v_scorePopups.push({
    x: GAME_WIDTH / 2,
    y: GAME_HEIGHT - 104,
    text: "VOID SURGE",
    color: "#7df9ff",
    life: 86,
    maxLife: 86,
    vy: -0.32
  });

  playSound("power");
  screenShake(7, 190);
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
  if (v_contract && v_contract.id === "chain") {
    v_contract.progress = Math.max(v_contract.progress, v_combo);
  }
  checkTrophies();
  addSurge(3 + Math.min(v_combo, 10) * 0.4, x, y);
  addScore(basePoints + comboBonus, x, y, comboBonus > 0 ? `+${basePoints + comboBonus} x${v_combo}` : `+${basePoints}`);
}

function awardAceSalvage(enemy) {
  if (!enemy.elite || !enemy.aceTrait) return;

  const bountyBoost = v_anomaly && v_anomaly.id === "bounty" ? 5 : 0;
  const payout = 8 + Math.floor(getRewardLevel() / 2) + enemy.aceTrait.salvageBonus + bountyBoost;

  addSalvage(payout, enemy.x, enemy.y + 17, `${enemy.aceTrait.name} +${payout}`);
  v_waveAceCount = Math.max(0, v_waveAceCount - 1);
  runStats.elitesDestroyed++;
  checkTrophies();
}

function damageEnemy(enemy, enemyIndex, bulletX, bulletY, damage = 1) {
  enemy.hp -= damage;
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
  awardAceSalvage(defeated);
  playSound("explosion");

  spawnParticles(
    defeated.x,
    defeated.y,
    defeated.type === "orb" ? "#ff4d7a" : defeated.type === "squid" ? "#c48cff" : "#77ff77",
    18
  );
  if (v_combo >= 6 || activePowerUps.surge > 0) {
    spawnShockwave(
      defeated.x,
      defeated.y,
      defeated.type === "orb" ? "#ff4d7a" : defeated.type === "squid" ? "#c48cff" : "#77ff77",
      activePowerUps.surge > 0 ? 58 : 38,
      18
    );
  }

  v_powerUpDrought++;
  maybeDropPowerUp(defeated.x, defeated.y);

  const enemyCountPressure = Math.floor((v_waveEnemyCount - v_enemies.length) / 4);
  v_moveInterval = Math.max(7, v_waveBaseMoveInterval - enemyCountPressure);

  return true;
}

function damageBoss(bulletX, bulletY, damage = 1) {
  if (!v_boss) return;

  v_boss.hp -= damage;
  v_boss.hitFlash = 8;

  spawnParticles(bulletX, bulletY, "#ff4d7a", 8);
  addSurge(damage * 0.45, bulletX, bulletY);

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
  const coreMultiplier = v_anomaly && v_anomaly.id === "fortified" ? 1.45 : 1;
  const rewardLevel = getRewardLevel();
  const coreSalvage = Math.round((24 + rewardLevel * 5) * coreMultiplier);

  addScore(1500 + rewardLevel * 380, defeatedX, defeatedY, "CORE BROKEN");
  addSalvage(coreSalvage, defeatedX, defeatedY + 25, `CORE +${coreSalvage}`);
  addSurge(14, defeatedX, defeatedY);
  runStats.bossesDefeated++;
  runStats.bossTypesDefeated.add(defeatedVariant.id);
  checkTrophies();

  spawnParticles(defeatedX, defeatedY, defeatedVariant.rageColor, 42);
  spawnParticles(defeatedX, defeatedY, defeatedVariant.color, 32);
  spawnParticles(defeatedX, defeatedY, "#ffffff", 24);
  spawnShockwave(defeatedX, defeatedY, defeatedVariant.rageColor, 190, 42);

  v_enemyBullets.length = 0;
  v_boss = null;
  v_bossDefeatedThisWave = true;

  screenShake();
  playSound("win");

  maybeDropBossReward(defeatedX, defeatedY);
}

function maybeDropPowerUp(x, y) {
  if (v_powerUpDropCooldown > 0) return;

  const pityDrop = v_powerUpDrought >= POWER_UP_PITY_KILLS;
  const droughtBonus = Math.min(v_powerUpDrought * 0.006, 0.115);
  const chance = pityDrop
    ? 1
    : Math.min(0.035 + (getRewardLevel() * 0.004) + droughtBonus, 0.19);

  if (!pityDrop && Math.random() > chance) return;

  dropPowerUp(x, y);
  v_powerUpDrought = 0;
  v_powerUpDropCooldown = 320;
}

function maybeDropBossReward(x, y) {
  const droughtRelief = v_powerUpDrought >= Math.floor(POWER_UP_PITY_KILLS * 0.7);

  if (!droughtRelief && Math.random() > 0.65) return;

  dropPowerUp(x, y);
  v_powerUpDrought = 0;
  v_powerUpDropCooldown = 360;
}

function dropPowerUp(x, y) {
  const roll = Math.random();
  let type = "double";

  if (roll < 0.25) type = "double";
  else if (roll < 0.46) type = "rapid";
  else if (roll < 0.67) type = "shield";
  else if (roll < 0.83) type = "bomb";
  else if (roll < 0.91) type = "stasis";
  else type = "life";

  v_powerUps.push({
    x: clamp(x, 30, GAME_WIDTH - 30),
    y: clamp(y, 26, GAME_HEIGHT - 90),
    vy: 1.45,
    type,
    pulse: Math.random() * Math.PI * 2
  });
}

function extendPowerUpTimer(current, amount, max) {
  return Math.min(max, current + amount);
}

function collectPowerUp(powerUp) {
  const data = POWER_UP_TYPES[powerUp.type];
  const repairConverted = powerUp.type === "life" && lives >= v_maxLives;

  runStats.powerUpsCollected++;
  checkTrophies();
  addSurge(powerUp.type === "bomb" ? 6 : 4, powerUp.x, powerUp.y);

  haptic(powerUp.type === "bomb" ? [12, 18, 12] : 8);
  playSound("power");
  spawnParticles(powerUp.x, powerUp.y, data.color, 22);
  v_scorePopups.push({
    x: powerUp.x,
    y: powerUp.y - 8,
    text: repairConverted ? "REPAIR SCRAP" : data.name.toUpperCase(),
    color: data.color,
    life: 64,
    maxLife: 64,
    vy: -0.45
  });

  if (powerUp.type === "double") {
    activePowerUps.doubleShot = extendPowerUpTimer(activePowerUps.doubleShot, 520, 820);
  }

  if (powerUp.type === "rapid") {
    activePowerUps.rapidFire = extendPowerUpTimer(activePowerUps.rapidFire, 440, 760);
  }

  if (powerUp.type === "shield") {
    activePowerUps.shield = extendPowerUpTimer(activePowerUps.shield, 560, 900);
  }

  if (powerUp.type === "stasis") {
    activePowerUps.stasis = extendPowerUpTimer(
      activePowerUps.stasis,
      STASIS_DURATION_FRAMES,
      STASIS_DURATION_FRAMES + 180
    );
    spawnShockwave(powerUp.x, powerUp.y, data.color, 150, 38);
  }

  if (powerUp.type === "life") {
    if (repairConverted) {
      addSalvage(20, powerUp.x, powerUp.y + 22, "SALVAGE +20");
    } else {
      lives = Math.min(v_maxLives, lives + 1);
      updateUI();
    }
  }

  if (powerUp.type === "bomb") {
    triggerVoidBomb();
  }
}

function triggerVoidBomb() {
  const destroyed = Math.min(10, v_enemies.length);
  runStats.bombKills += destroyed;
  checkTrophies();

  const targets = v_enemies
    .map((enemy, index) => ({
      enemy,
      index,
      threat:
        enemy.y * 2 +
        (GAME_HEIGHT - Math.abs(enemy.x - v_player.x)) * 0.22 +
        enemy.hp * 14
    }))
    .sort((a, b) => b.threat - a.threat)
    .slice(0, destroyed)
    .sort((a, b) => b.index - a.index);

  targets.forEach(({ enemy, index }) => {
    v_enemies.splice(index, 1);
    addScore(enemy.points, enemy.x, enemy.y, "BOMB");
    awardAceSalvage(enemy);
    spawnParticles(
      enemy.x,
      enemy.y,
      enemy.type === "orb" ? "#ff4d7a" : enemy.type === "squid" ? "#c48cff" : "#77ff77",
      16
    );
  });

  if (targets.length > 0) {
    const enemyCountPressure = Math.floor((v_waveEnemyCount - v_enemies.length) / 4);
    v_moveInterval = Math.max(7, v_waveBaseMoveInterval - enemyCountPressure);
  }

  if (v_boss) {
    const bossDamage = 8 + Math.floor(getRewardLevel() / 2);
    const bossX = v_boss.x;
    const bossY = v_boss.y;
    damageBoss(bossX, bossY, bossDamage);
    spawnParticles(bossX, bossY, "#ff4d7a", 28);
  }

  v_enemyBullets.length = 0;
  spawnShockwave(v_player.x, v_player.y, "#ff4d7a", 210, 36);
  screenShake();
}

function updatePowerUpTimers() {
  activePowerUps.doubleShot = Math.max(0, activePowerUps.doubleShot - 1);
  activePowerUps.rapidFire = Math.max(0, activePowerUps.rapidFire - 1);
  activePowerUps.shield = Math.max(0, activePowerUps.shield - 1);
  activePowerUps.stasis = Math.max(0, activePowerUps.stasis - 1);
  activePowerUps.surge = Math.max(0, activePowerUps.surge - 1);
}

function updatePlayer() {
  const startX = v_player.x;
  const speed = getPlayerSpeed();
  let targetTilt = 0;

  if (isLeftPressed() && v_player.x > PLAYER_MIN_X) {
    v_player.x -= speed;
    targetTilt -= 0.18;
  }

  if (isRightPressed() && v_player.x < canvas.width - PLAYER_MIN_X) {
    v_player.x += speed;
    targetTilt += 0.18;
  }

  v_player.x = clamp(v_player.x, PLAYER_MIN_X, canvas.width - PLAYER_MIN_X);

  v_playerTilt += (targetTilt - v_playerTilt) * 0.22;

  if (v_shootTimer > 0) v_shootTimer--;

  if (isFirePressed() && v_shootTimer === 0) {
    firePlayerBullet();
  }

  if ((Math.abs(v_player.x - startX) > 0.2 || isFirePressed()) && gameFrame % 3 === 0) {
    if (v_playerTrails.length >= MAX_PLAYER_TRAILS) {
      v_playerTrails.shift();
    }

    v_playerTrails.push({
      x: v_player.x,
      y: v_player.y + 15,
      life: 18,
      maxLife: 18,
      size: rand(4, 9)
    });
  }
}

function spawnSalvageCache() {
  if (!v_bonusRaid || v_salvageCaches.length >= MAX_SALVAGE_CACHES) return;

  const reinforced = Math.random() < 0.22;

  v_salvageCaches.push({
    x: rand(38, GAME_WIDTH - 38),
    y: -24,
    vx: rand(-0.7, 0.7),
    vy: rand(1.65, 2.55),
    hp: reinforced ? 2 : 1,
    maxHp: reinforced ? 2 : 1,
    value: reinforced ? 10 : 5,
    pulse: rand(0, Math.PI * 2)
  });
}

function damageSalvageCache(cache, index, x, y, damage = 1) {
  if (!v_bonusRaid) return;

  cache.hp -= damage;
  spawnParticles(x, y, "#ffe66d", cache.hp > 0 ? 8 : 16);

  if (cache.hp > 0) {
    playSound("explosion");
    return;
  }

  v_salvageCaches.splice(index, 1);

  const multiplier = Math.floor(v_bonusRaid.multiplier * 100) / 100;
  const payout = Math.round(cache.value * multiplier);

  v_bonusRaid.cachesBroken++;
  v_bonusRaid.multiplier = Math.min(2, v_bonusRaid.multiplier + 0.15);

  addScore(payout * 14, cache.x, cache.y - 15, `CACHE +${payout * 14}`);
  addSalvage(payout, cache.x, cache.y + 10, `SALVAGE +${payout}`);
  addSurge(8, cache.x, cache.y);
  spawnShockwave(cache.x, cache.y, "#ffe66d", 48, 18);
  playSound("power");
}

function updatePlayerBullets() {
  for (let i = v_bullets.length - 1; i >= 0; i--) {
    const b = v_bullets[i];

    b.x += b.vx || 0;
    b.y += b.vy;

    let bulletHit = false;

    if (v_bonusRaid) {
      for (let j = v_salvageCaches.length - 1; j >= 0; j--) {
        const cache = v_salvageCaches[j];

        if (Math.abs(b.x - cache.x) < 22 && Math.abs(b.y - cache.y) < 20) {
          damageSalvageCache(cache, j, b.x, b.y, b.damage || 1);

          if (b.pierce > 0) {
            b.pierce--;
          } else {
            v_bullets.splice(i, 1);
            bulletHit = true;
          }

          break;
        }
      }
    }

    if (bulletHit) continue;

    for (let j = v_enemies.length - 1; j >= 0; j--) {
      const e = v_enemies[j];

      if (Math.abs(b.x - e.x) < 20 && Math.abs(b.y - e.y) < 20) {
        damageEnemy(e, j, b.x, b.y, b.damage || 1);

        if (b.pierce > 0) {
          b.pierce--;
          spawnParticles(b.x, b.y, "#7df9ff", 3);
        } else {
          v_bullets.splice(i, 1);
          bulletHit = true;
        }

        break;
      }
    }

    if (
      !bulletHit &&
      v_boss &&
      Math.abs(b.x - v_boss.x) < v_boss.w / 2 &&
      Math.abs(b.y - v_boss.y) < v_boss.h / 2
    ) {
      damageBoss(b.x, b.y, b.damage || 1);
      v_bullets.splice(i, 1);
      bulletHit = true;
    }

    if (!bulletHit && (b.y < -20 || b.y > canvas.height + 20 || b.x < -20 || b.x > canvas.width + 20)) {
      v_bullets.splice(i, 1);
    }
  }
}

function updateEnemyMovement() {
  if (v_dangerGraceTimer > 0) return;

  v_moveTimer++;
  const movementInterval = activePowerUps.stasis > 0
    ? Math.ceil(v_moveInterval * STASIS_MOVE_INTERVAL_MULTIPLIER)
    : v_moveInterval;

  if (v_moveTimer <= movementInterval) return;

  v_moveTimer = 0;

  let hitEdge = false;

  v_enemies.forEach(e => {
    if ((v_dir === 1 && e.x > canvas.width - 40) || (v_dir === -1 && e.x < 40)) {
      hitEdge = true;
    }
  });

  const difficultyLevel = getDifficultyLevel();
  const erraticSwap = difficultyLevel >= 4 &&
    !hitEdge &&
    Math.random() < Math.min(0.08 + difficultyLevel * 0.012, 0.33);

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

  const difficultyLevel = getDifficultyLevel();
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

  if (v_dangerGraceTimer <= 0) {
    v_boss.shootTimer--;
  }

  if (v_dangerGraceTimer <= 0 && v_boss.shootTimer <= 0) {
    fireBossPattern();
    v_boss.pattern = (v_boss.pattern + 1) % v_boss.variant.patternCount;
    v_boss.shootTimer = v_boss.rage
      ? Math.max(38, 72 - difficultyLevel * 1.6)
      : Math.max(48, 92 - difficultyLevel * 1.5);
  }

  if (v_boss.y > 450) {
    v_boss.y = 450;
  }
}

function fireBossPattern() {
  if (!v_boss) return;

  const difficultyLevel = getDifficultyLevel();
  const stormMultiplier = v_anomaly && v_anomaly.id === "storm" ? 1.22 : 1;
  const baseSpeed = (3.55 + difficultyLevel * 0.23) * stormMultiplier;
  const aimed = clamp((v_player.x - v_boss.x) / 130, -2.8, 2.8);
  const variant = v_boss.variant.attackStyle;

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

  if (variant === "citadel") {
    if (v_boss.pattern === 0) {
      [-62, -31, 0, 31, 62].forEach((offset, i) => {
        v_enemyBullets.push({
          x: v_boss.x + offset,
          y: v_boss.y + 24 + Math.abs(i - 2) * 4,
          vx: offset * 0.015,
          vy: baseSpeed + 0.75,
          type: i === 2 ? "heavy" : "aimed"
        });
      });
    }

    if (v_boss.pattern === 1) {
      [-46, 46].forEach(offset => {
        v_enemyBullets.push({
          x: v_boss.x + offset,
          y: v_boss.y + 26,
          vx: aimed * 0.9 - offset * 0.012,
          vy: baseSpeed + 1.1,
          type: "heavy"
        });
      });
    }

    if (v_boss.pattern === 2) {
      const spread = v_boss.rage ? [-3, -2, -1, 0, 1, 2, 3] : [-2.4, -1.2, 0, 1.2, 2.4];

      spread.forEach((vx, i) => {
        v_enemyBullets.push({
          x: v_boss.x + (i - Math.floor(spread.length / 2)) * 9,
          y: v_boss.y + 38,
          vx,
          vy: baseSpeed * 0.82,
          type: "spread"
        });
      });
    }

    if (v_boss.pattern === 3) {
      [-74, -37, 37, 74].forEach(offset => {
        v_enemyBullets.push({
          x: v_boss.x + offset,
          y: v_boss.y + 18,
          vx: aimed * 0.35 + offset * 0.008,
          vy: baseSpeed + 0.55,
          type: "aimed"
        });
      });
    }

    return;
  }

  if (variant === "crown") {
    if (v_boss.pattern === 0) {
      [-2.8, -1.4, 0, 1.4, 2.8].forEach(vx => {
        v_enemyBullets.push({
          x: v_boss.x,
          y: v_boss.y + 34,
          vx: vx + aimed * 0.2,
          vy: baseSpeed + 0.35,
          type: vx === 0 ? "heavy" : "spread"
        });
      });
    }

    if (v_boss.pattern === 1) {
      [-52, -18, 18, 52].forEach(offset => {
        v_enemyBullets.push({
          x: v_boss.x + offset,
          y: v_boss.y + 24,
          vx: aimed * 0.65 - Math.sign(offset) * 0.5,
          vy: baseSpeed + 0.9,
          type: "aimed"
        });
      });
    }

    if (v_boss.pattern === 2) {
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i) / 8 + gameFrame * 0.015;

        v_enemyBullets.push({
          x: v_boss.x + Math.cos(angle) * 22,
          y: v_boss.y + 24 + Math.sin(angle) * 8,
          vx: Math.cos(angle) * 1.55,
          vy: baseSpeed * 0.72 + Math.sin(angle) * 0.75,
          type: "spread"
        });
      }
    }

    if (v_boss.pattern === 3) {
      v_enemyBullets.push({
        x: v_boss.x,
        y: v_boss.y + 42,
        vx: aimed * 1.05,
        vy: baseSpeed + 1.85,
        type: "heavy"
      });

      [-38, 38].forEach(offset => {
        v_enemyBullets.push({
          x: v_boss.x + offset,
          y: v_boss.y + 30,
          vx: aimed * 0.45 + offset * 0.018,
          vy: baseSpeed + 0.65,
          type: "aimed"
        });
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
  if (v_dangerGraceTimer > 0) return;

  const difficultyLevel = getDifficultyLevel();
  const shootChance = Math.min(
    0.002 + difficultyLevel * 0.00135 + (v_formationWave - 1) * 0.001,
    0.045
  );

  if (
    Math.random() >= shootChance ||
    v_enemies.length === 0 ||
    v_enemyBullets.length >= MAX_ENEMY_BULLETS
  ) {
    return;
  }

  const aces = v_enemies.filter(enemy => enemy.elite);
  const shooter = aces.length && Math.random() < 0.38
    ? aces[Math.floor(Math.random() * aces.length)]
    : v_enemies[Math.floor(Math.random() * v_enemies.length)];
  const stormMultiplier = v_anomaly && v_anomaly.id === "storm" ? 1.22 : 1;
  const speed = (3.4 + difficultyLevel * 0.26) * stormMultiplier;

  if (shooter.aceTrait) {
    fireAceVolley(shooter, speed);
    return;
  }

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
    const spread = getDifficultyLevel() >= 3 ? [-1.4, 0, 1.4] : [-0.9, 0.9];

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

function fireAceVolley(shooter, speed) {
  const aim = clamp((v_player.x - shooter.x) / 115, -2.5, 2.5);

  if (shooter.aceTrait.id === "sniper") {
    [-0.28, 0.28].forEach(offset => {
      v_enemyBullets.push({
        x: shooter.x + offset * 18,
        y: shooter.y + 14,
        vx: aim + offset,
        vy: speed + 1.15,
        type: "aimed"
      });
    });
    return;
  }

  if (shooter.aceTrait.id === "burster") {
    [-2.1, -1.05, 0, 1.05, 2.1].forEach(vx => {
      v_enemyBullets.push({
        x: shooter.x,
        y: shooter.y + 13,
        vx,
        vy: speed * 0.9,
        type: "spread"
      });
    });
    return;
  }

  v_enemyBullets.push({
    x: shooter.x,
    y: shooter.y + 15,
    vx: aim * 0.42,
    vy: speed + 1.65,
    type: "heavy"
  });
  [-1.35, 1.35].forEach(vx => {
    v_enemyBullets.push({
      x: shooter.x,
      y: shooter.y + 12,
      vx,
      vy: speed * 0.82,
      type: "spread"
    });
  });
}

function registerPlayerHit() {
  v_waveHitsTaken++;
  if (v_bonusRaid) {
    v_bonusRaid.multiplier = 1;
  }
  if (v_contract && v_contract.id === "flawless") {
    v_contract.failed = true;
    v_contract.progress = 0;
  }
  v_combo = 0;
  v_comboTimer = 0;
  v_surge = Math.max(0, v_surge - 18);
}

function handlePlayerHit() {
  registerPlayerHit();

  if (window.ArcadeDeveloperMode?.preventDeath?.(NATIONAL_GAME_ID, "player hit")) {
    lives = Math.max(lives, v_maxLives);
    activePowerUps.shield = Math.max(activePowerUps.shield, 999999);
    v_invuln = Math.max(v_invuln, PLAYER_HIT_GRACE_FRAMES);
    v_dangerGraceTimer = Math.max(v_dangerGraceTimer, PLAYER_HIT_GRACE_FRAMES);
    v_enemyBullets.length = 0;
    v_bullets.length = 0;
    v_scorePopups.push({
      x: v_player.x,
      y: v_player.y - 42,
      text: "DEV SAVE",
      color: "#ffd166",
      life: 80,
      maxLife: 80,
      vy: -0.32
    });
    spawnParticles(v_player.x, v_player.y, "#ffd166", 22);
    spawnShockwave(v_player.x, v_player.y, "#ffd166", 72, 18);
    playSound("power");
    screenShake(6, 120);
    updateUI();
    return;
  }

  if (activePowerUps.shield > 0) {
    activePowerUps.shield = Math.max(0, activePowerUps.shield - Math.max(80, 180 - v_upgrades.bulwark * 34));
    v_invuln = Math.max(v_invuln, 26);
    v_dangerGraceTimer = Math.max(v_dangerGraceTimer, 42);
    spawnParticles(v_player.x, v_player.y, "#7df9ff", 24);
    spawnShockwave(v_player.x, v_player.y, "#7df9ff", 76, 22);
    playSound("power");
    screenShake();
    return;
  }

  lives--;
  updateUI();
  haptic(lives <= 0 ? [30, 40, 45] : 24);
  playSound("death");
  screenShake();

  v_bullets.length = 0;
  v_enemyBullets.length = 0;

  activePowerUps.doubleShot = 0;
  activePowerUps.rapidFire = 0;

  v_invuln = 70;
  v_dangerGraceTimer = Math.max(v_dangerGraceTimer, PLAYER_HIT_GRACE_FRAMES);

  if (lives <= 0) {
    showGameOver(false);
  }
}

function updateEnemyBullets() {
  limitArray(v_enemyBullets, MAX_ENEMY_BULLETS);

  for (let i = v_enemyBullets.length - 1; i >= 0; i--) {
    const b = v_enemyBullets[i];

    b.x += b.vx || 0;
    b.y += b.vy;

    if (b.y > canvas.height + 24 || b.x < -24 || b.x > canvas.width + 24) {
      v_enemyBullets.splice(i, 1);
      continue;
    }

    const hitBox = PLAYER_HIT_RADIUS + (b.type === "heavy" ? 7 : 5);
    const nearBox = hitBox + 18;

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
      const focusedGraze = isFocusPressed();
      b.grazed = true;
      runStats.grazes++;
      if (v_contract && v_contract.id === "graze") {
        v_contract.progress++;
      }
      if (v_anomaly && v_anomaly.id === "storm") {
        addSalvage(2, v_player.x, v_player.y - 45, "STORM +2");
      }
      if (focusedGraze && runStats.grazes % 4 === 0) {
        addSalvage(1, v_player.x, v_player.y - 45, "FOCUS SALVAGE +1");
      }
      checkTrophies();
      addSurge(focusedGraze ? 8 : 5, v_player.x, v_player.y - 24);
      addScore(focusedGraze ? 18 : 8, v_player.x, v_player.y - 28, focusedGraze ? "FOCUS GRAZE +18" : "GRAZE");
      spawnParticles(v_player.x, v_player.y - 18, focusedGraze ? "#ffe66d" : "#7df9ff", focusedGraze ? 9 : 5);
    }
  }
}

function updatePowerUps() {
  limitArray(v_powerUps, MAX_POWER_UPS);

  for (let i = v_powerUps.length - 1; i >= 0; i--) {
    const p = v_powerUps[i];

    p.y += p.vy;
    p.pulse += 0.08;

    const dx = v_player.x - p.x;
    const dy = v_player.y - p.y;
    const dist = Math.hypot(dx, dy);
    const tractorRange = 96 + v_upgrades.magnet * 34;

    if (dist < tractorRange) {
      const pull = 1 - dist / tractorRange;
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
  limitArray(v_particles, MAX_PARTICLES);

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
  limitArray(v_scorePopups, MAX_SCORE_POPUPS);

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
  limitArray(v_playerTrails, MAX_PLAYER_TRAILS);

  for (let i = v_playerTrails.length - 1; i >= 0; i--) {
    const trail = v_playerTrails[i];

    trail.y += 0.45;
    trail.life--;

    if (trail.life <= 0) {
      v_playerTrails.splice(i, 1);
    }
  }
}

function updateShockwaves() {
  limitArray(v_shockwaves, MAX_SHOCKWAVES);

  for (let i = v_shockwaves.length - 1; i >= 0; i--) {
    const wave = v_shockwaves[i];

    wave.life--;

    if (wave.life <= 0) {
      v_shockwaves.splice(i, 1);
    }
  }
}

function spawnRaidDebris() {
  if (!v_bonusRaid) return;

  const x = rand(28, GAME_WIDTH - 28);
  const aimed = clamp((v_player.x - x) / 145, -1.8, 1.8);

  v_enemyBullets.push({
    x,
    y: -18,
    vx: aimed * 0.48,
    vy: rand(4.2, 5.1),
    type: "heavy"
  });

  if (v_bonusRaid.timer < BONUS_RAID_DURATION_FRAMES * 0.45 && Math.random() < 0.35) {
    v_enemyBullets.push({
      x: clamp(x + rand(-80, 80), 28, GAME_WIDTH - 28),
      y: -18,
      vx: rand(-0.65, 0.65),
      vy: rand(3.8, 4.8),
      type: "aimed"
    });
  }
}

function updateSalvageCaches() {
  for (let i = v_salvageCaches.length - 1; i >= 0; i--) {
    const cache = v_salvageCaches[i];

    cache.x += cache.vx;
    cache.y += cache.vy;
    cache.pulse += 0.09;

    if (cache.x < 28 || cache.x > GAME_WIDTH - 28) {
      cache.vx *= -1;
      cache.x = clamp(cache.x, 28, GAME_WIDTH - 28);
    }

    if (cache.y > GAME_HEIGHT + 28) {
      v_salvageCaches.splice(i, 1);
      if (v_bonusRaid) {
        v_bonusRaid.multiplier = Math.max(1, v_bonusRaid.multiplier - 0.25);
      }
    }
  }
}

function updateBonusRaid() {
  if (!v_bonusRaid) return;

  v_bonusRaid.timer--;
  v_bonusRaid.cacheTimer--;
  v_bonusRaid.debrisTimer--;

  if (v_bonusRaid.cacheTimer <= 0) {
    spawnSalvageCache();
    v_bonusRaid.cacheTimer = Math.max(22, 44 - Math.floor(getRewardLevel() / 3)) + Math.floor(rand(0, 18));
  }

  if (v_bonusRaid.debrisTimer <= 0 && v_dangerGraceTimer <= 0) {
    spawnRaidDebris();
    v_bonusRaid.debrisTimer = Math.max(25, 56 - Math.floor(getRewardLevel() / 3)) + Math.floor(rand(0, 24));
  }

  updatePlayer();
  updateSalvageCaches();
  updatePlayerBullets();
  updateEnemyBullets();
  updatePowerUps();
  updateParticles();
  updateScorePopups();
  updatePlayerTrails();
  updateShockwaves();

  if (v_bonusRaid.timer <= 0 && !isGameOver) {
    finishBonusRaid();
  }
}

function getEffectsScale() {
  const load = v_particles.length + v_enemyBullets.length * 1.45 + v_enemies.length * 0.65;

  if (load > 285) return 0.4;
  if (load > 195) return 0.65;
  return 1;
}

function spawnParticles(x, y, color, count = 12) {
  const requested = Math.max(1, Math.round(count * getEffectsScale()));
  const available = Math.max(0, MAX_PARTICLES - v_particles.length);
  const amount = Math.min(requested, available);

  for (let i = 0; i < amount; i++) {
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

function spawnShockwave(x, y, color, radius = 82, life = 26) {
  if (v_shockwaves.length >= MAX_SHOCKWAVES) {
    v_shockwaves.shift();
  }

  v_shockwaves.push({
    x,
    y,
    color,
    radius,
    life,
    maxLife: life
  });
}

function checkEnemyAdvance() {
  if (v_invuln > 0) return;

  for (let i = 0; i < v_enemies.length; i++) {
    const e = v_enemies[i];

    if (e.y > 550) {
      handlePlayerHit();

      if (!isGameOver) {
        v_enemies.forEach(en => {
          en.y -= 140;
        });
        v_dir *= -1;
        v_moveTimer = 0;
        v_dangerGraceTimer = Math.max(v_dangerGraceTimer, PLAYER_HIT_GRACE_FRAMES);
      }

      break;
    }
  }
}

function checkWaveClear() {
  if (v_enemies.length !== 0) return;

  if (!v_boss && !v_bossDefeatedThisWave) {
    if (v_formationWave < getFormationWaveCount()) {
      v_formationWave++;
      v_waveBannerTimer = 105;
      v_waveBannerText = getFormationBannerText();
      spawnInvaders(false);
      return;
    }

    spawnBoss();
    return;
  }

  if (!v_boss && v_bossDefeatedThisWave) {
    resolveLevelContract();

    if (v_waveHitsTaken === 0) {
      const perfectBonus = 750 + getRewardLevel() * 120;
      runStats.perfectWaves++;
      addSurge(12, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 18);
      addScore(perfectBonus, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 28, `PERFECT +${perfectBonus}`);
      checkTrophies();
    }

    const clearLabel = v_endlessMode ? "RIFT CLEARED" : "LEVEL CLEAR";
    addScore(1000 + (getRewardLevel() * 160), GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60, clearLabel);
    playSound("win");

    const campaignComplete = v_level >= FINAL_LEVEL && !v_endlessMode;

    if (shouldOpenUpgradeDock(v_level)) {
      v_campaignClearAfterDock = campaignComplete;
      openUpgradeDock(v_level + 1);
      return;
    }

    if (campaignComplete) {
      showGameOver(true);
      return;
    }

    deployLevel(v_level + 1);
  }
}

function updateInvaders() {
  if (gameState !== "playing" || isGameOver) return;
  if (v_isPaused) {
    updateParticles();
    updateScorePopups();
    updateShockwaves();
    return;
  }

  if (v_invuln > 0) v_invuln--;
  if (v_waveBannerTimer > 0) v_waveBannerTimer--;
  if (v_bossWarningTimer > 0) v_bossWarningTimer--;
  if (v_powerUpDropCooldown > 0) v_powerUpDropCooldown--;
  if (v_dangerGraceTimer > 0) v_dangerGraceTimer--;
  if (v_comboTimer > 0) {
    v_comboTimer--;
  } else {
    v_combo = 0;
  }

  gameFrame++;

  updatePowerUpTimers();
  if (v_bonusRaid) {
    updateBonusRaid();
    return;
  }

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
  updateShockwaves();
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
  const backgroundConfig = getBackgroundImageConfig(v_level);

  if (!backgroundConfig.ready) return false;

  const imageRatio = backgroundConfig.image.width / backgroundConfig.image.height;
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

  ctx.drawImage(backgroundConfig.image, drawX, drawY, drawWidth, drawHeight);

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

function drawWarpStreaks() {
  const intensity = activePowerUps.surge > 0
    ? 1
    : v_boss && v_boss.rage
      ? 0.62
      : v_combo >= 8
        ? 0.38
        : 0;

  if (intensity <= 0) return;

  ctx.save();
  ctx.lineWidth = 1.2;

  for (let i = 0; i < 28; i++) {
    const x = (i * 47 + Math.sin(i * 9.71) * 70 + GAME_WIDTH) % GAME_WIDTH;
    const y = (i * 83 + gameFrame * (5 + intensity * 8)) % (GAME_HEIGHT + 90) - 70;
    const length = 24 + intensity * 54 + (i % 5) * 5;

    ctx.globalAlpha = (0.08 + (i % 4) * 0.025) * intensity;
    ctx.strokeStyle = i % 3 === 0 ? "#7df9ff" : i % 3 === 1 ? "#ff87c5" : "#ffffff";
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - intensity * 9, y + length);
    ctx.stroke();
  }

  ctx.restore();
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
  drawWarpStreaks();
  drawScreenTreatment();
}

function drawPlayerFallback(moving, firing) {
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
}

function drawPlayerSprite(moving, firing) {
  if (!PLAYER_IMAGE_CONFIG.ready || !PLAYER_IMAGE_CONFIG.renderImage) {
    drawPlayerFallback(moving, firing);
    return;
  }

  const image = PLAYER_IMAGE_CONFIG.renderImage;
  const boosted = firing || moving || activePowerUps.surge > 0;
  const glowPulse = boosted ? 1 + Math.sin(gameFrame * 0.44) * 0.18 : 0.62;

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = boosted ? 0.46 : 0.22;
  ctx.fillStyle = activePowerUps.surge > 0 ? "#ff87c5" : "#7df9ff";
  [-16, 0, 16].forEach(offset => {
    ctx.beginPath();
    ctx.ellipse(offset, 29, 4.8 * glowPulse, 11 * glowPulse, 0, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();

  ctx.drawImage(image, -image.width / 2, -image.height / 2 - 2);
}

function drawPlayerHitbox() {
  const focused = isFocusPressed();
  const pulse = focused ? 0.78 + Math.sin(gameFrame * 0.18) * 0.18 : 0.34 + Math.sin(gameFrame * 0.12) * 0.08;

  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(0, 0, focused ? 3.8 : 2.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = focused ? "#ffe66d" : "rgba(125, 249, 255, .72)";
  ctx.lineWidth = focused ? 2.2 : 1.1;
  ctx.beginPath();
  ctx.arc(0, 0, focused ? PLAYER_HIT_RADIUS + 1.5 : PLAYER_HIT_RADIUS, 0, Math.PI * 2);
  ctx.stroke();

  if (focused) {
    ctx.strokeStyle = "rgba(255, 230, 109, .38)";
    ctx.beginPath();
    ctx.moveTo(-15, 0);
    ctx.lineTo(-8, 0);
    ctx.moveTo(8, 0);
    ctx.lineTo(15, 0);
    ctx.moveTo(0, -15);
    ctx.lineTo(0, -8);
    ctx.moveTo(0, 8);
    ctx.lineTo(0, 15);
    ctx.stroke();
  }
  ctx.restore();
}

function drawEscortDrones() {
  if (v_upgrades.drone <= 0) return;

  ctx.save();
  for (let i = 0; i < v_upgrades.drone; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const lane = Math.ceil((i + 1) / 2);
    const x = side * (30 + lane * 12);
    const y = 8 - lane * 5 + Math.sin(gameFrame * 0.09 + i) * 2;

    ctx.globalAlpha = 0.82;
    ctx.fillStyle = "#111827";
    ctx.strokeStyle = "#7df9ff";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#ffe66d";
    ctx.fillRect(x - 2, y - 2, 4, 4);
  }
  ctx.restore();
}

function drawPlayer() {
  const flicker = v_invuln > 0 && (v_invuln % 10) < 5;
  const moving = isLeftPressed() || isRightPressed();
  const firing = isFirePressed();
  const spriteRadius = PLAYER_IMAGE_CONFIG.ready ? 39 : 29;

  if (flicker) {
    ctx.globalAlpha = 0.35;
  }

  ctx.save();
  ctx.translate(v_player.x, v_player.y);
  ctx.rotate(v_playerTilt);

  if (activePowerUps.surge > 0) {
    const surgePulse = 0.72 + Math.sin(gameFrame * 0.22) * 0.18;
    ctx.globalAlpha = 0.25 * surgePulse;
    ctx.fillStyle = "#7df9ff";
    ctx.beginPath();
    ctx.arc(0, -2, spriteRadius + 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = flicker ? 0.35 : 1;
  }

  if (activePowerUps.shield > 0) {
    const shieldPulse = 0.65 + Math.sin(gameFrame * 0.14) * 0.25;

    ctx.globalAlpha = 0.32 * shieldPulse;
    ctx.strokeStyle = "#7df9ff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, -1, spriteRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = flicker ? 0.35 : 1;
  }

  drawPlayerSprite(moving, firing);
  drawEscortDrones();
  drawPlayerHitbox();

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

  if (enemy.elite) {
    const aceColor = enemy.aceTrait ? enemy.aceTrait.color : "#ffe66d";
    const elitePulse = 0.55 + Math.sin(gameFrame * 0.16 + enemy.animOffset) * 0.2;
    ctx.globalAlpha = elitePulse;
    ctx.strokeStyle = aceColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 27, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.shadowColor = aceColor;
    ctx.shadowBlur = 12;
  }

  const imageConfig = getEnemyImageConfig(enemy.imageSlot);

  if (imageConfig.ready) {
    ctx.drawImage(
      imageConfig.renderImage,
      -imageConfig.renderImage.width / 2,
      -imageConfig.renderImage.height / 2
    );
  } else {
    if (enemy.type === "orb") {
      drawOrbEnemy();
    } else if (enemy.type === "squid") {
      drawSquidEnemy();
    } else {
      drawCrawlerEnemy();
    }
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

function drawBossVariantFallback(pulse, rageColor) {
  if (v_boss.variant.attackStyle === "needle") {
    drawNeedleBoss(pulse, rageColor);
  } else if (v_boss.variant.attackStyle === "forge") {
    drawForgeBoss(pulse, rageColor);
  } else if (v_boss.variant.attackStyle === "mirror") {
    drawMirrorBoss(pulse, rageColor);
  } else if (v_boss.variant.attackStyle === "citadel") {
    drawCitadelBoss(pulse, rageColor);
  } else if (v_boss.variant.attackStyle === "crown") {
    drawCrownBoss(pulse, rageColor);
  } else {
    drawMawBoss(pulse, rageColor);
  }
}

function drawBossImage(config, pulse, rageColor) {
  if (!config || !config.ready) {
    drawBossVariantFallback(pulse, rageColor);
    return;
  }

  const drawWidth = config.drawWidth + pulse * 0.7;
  const drawHeight = config.drawHeight + pulse * 0.58;

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.shadowColor = rageColor;
  ctx.shadowBlur = v_boss.rage ? 22 : 14;
  ctx.drawImage(
    config.renderImage,
    -drawWidth / 2,
    -drawHeight / 2 + config.yOffset,
    drawWidth,
    drawHeight
  );

  if (v_boss.rage) {
    ctx.globalAlpha = 0.28;
    ctx.filter = "saturate(1.55) brightness(1.15)";
    ctx.drawImage(config.renderImage, -drawWidth / 2, -drawHeight / 2 + config.yOffset, drawWidth, drawHeight);
  }

  if (v_boss.hitFlash > 0) {
    ctx.globalAlpha = 0.46;
    ctx.filter = "brightness(2.35)";
    ctx.drawImage(config.renderImage, -drawWidth / 2, -drawHeight / 2 + config.yOffset, drawWidth, drawHeight);
  }

  ctx.restore();
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

function drawCitadelBoss(pulse, rageColor) {
  ctx.fillStyle = "#22130a";
  drawRoundedRect(-68, -36, 136, 72 + pulse * 0.35, 7);
  ctx.fill();

  ctx.strokeStyle = rageColor;
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = "rgba(255, 143, 61, .28)";
  ctx.fillRect(-47, -21, 94, 42);

  ctx.fillStyle = "#070303";
  ctx.beginPath();
  ctx.arc(0, 0, 18 + pulse * 0.15, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = rageColor;
  ctx.beginPath();
  ctx.arc(0, 0, 9, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = rageColor;
  ctx.lineWidth = 2;
  [-52, -26, 26, 52].forEach(x => {
    ctx.beginPath();
    ctx.moveTo(x, -36);
    ctx.lineTo(x * 1.2, -58 - pulse);
    ctx.moveTo(x, 36);
    ctx.lineTo(x * 1.15, 58 + pulse);
    ctx.stroke();
  });
}

function drawCrownBoss(pulse, rageColor) {
  ctx.fillStyle = "#220815";
  ctx.beginPath();
  ctx.moveTo(0, -58 - pulse);
  ctx.lineTo(50, -24);
  ctx.lineTo(62, 24 + pulse);
  ctx.lineTo(28, 54);
  ctx.lineTo(0, 38);
  ctx.lineTo(-28, 54);
  ctx.lineTo(-62, 24 + pulse);
  ctx.lineTo(-50, -24);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = rageColor;
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = "#050505";
  ctx.beginPath();
  ctx.arc(-19, 3, 12, 0, Math.PI * 2);
  ctx.arc(19, 3, 12, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = rageColor;
  ctx.beginPath();
  ctx.arc(-19, 3, 5, 0, Math.PI * 2);
  ctx.arc(19, 3, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffdddd";
  for (let x = -20; x <= 20; x += 10) {
    ctx.beginPath();
    ctx.moveTo(x - 5, 24);
    ctx.lineTo(x, 39 + pulse * 0.25);
    ctx.lineTo(x + 5, 24);
    ctx.closePath();
    ctx.fill();
  }
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

  drawBossImage(getBossImageConfig(v_boss.variant), pulse, rageColor);

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

function drawPlayerBullet(b) {
  const color = b.type === "surge"
    ? "#ff87c5"
    : b.type === "laser"
      ? "#ffe66d"
      : b.type === "spread"
        ? "#77ff77"
        : b.type === "drone"
          ? "#c48cff"
          : activePowerUps.doubleShot > 0
            ? "#77ff77"
            : "#7df9ff";
  const width = b.type === "surge" ? 5.6 : b.type === "laser" ? 4.8 : b.type === "drone" ? 3 : 4;
  const height = b.type === "laser" ? 24 : b.type === "drone" ? 12 : 17;

  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = b.type === "surge" || b.type === "laser" ? 20 : 12;
  ctx.fillStyle = color;
  ctx.fillRect(b.x - width / 2, b.y - height / 2, width, height);

  ctx.globalAlpha = b.type === "surge" || b.type === "laser" ? 0.42 : 0.28;
  ctx.fillRect(b.x - width * 1.7, b.y - height, width * 3.4, height * 1.65);
  ctx.restore();
}

function drawEnemyBullet(b) {
  const isHeavy = b.type === "heavy";
  const color = b.type === "aimed" ? "#ff4d7a" : b.type === "spread" ? "#c48cff" : "#ffe66d";
  const glowSize = isHeavy ? 12 : 9;

  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.shadowColor = color;
  ctx.shadowBlur = isHeavy ? 18 : 13;

  ctx.globalAlpha = 0.3;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 1;
  ctx.fillStyle = color;

  if (isHeavy) {
    ctx.beginPath();
    ctx.arc(0, 0, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#fff0a8";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  } else if (b.type === "aimed") {
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(6, 0);
    ctx.lineTo(0, 8);
    ctx.lineTo(-6, 0);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, 4.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.6;
    ctx.fillRect(-1, -10, 2, 20);
  }

  ctx.restore();
}

function drawBullets() {
  v_bullets.forEach(drawPlayerBullet);
  v_enemyBullets.forEach(drawEnemyBullet);
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

function drawSalvageCaches() {
  v_salvageCaches.forEach(cache => {
    const pulse = 1 + Math.sin(cache.pulse) * 0.1;
    const hpPct = cache.hp / cache.maxHp;

    ctx.save();
    ctx.translate(cache.x, cache.y);
    ctx.scale(pulse, pulse);
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = "#ffe66d";
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.strokeStyle = "#ffe66d";
    ctx.lineWidth = 2;
    ctx.strokeRect(-14, -11, 28, 22);
    ctx.fillStyle = "#17120a";
    ctx.fillRect(-11, -8, 22, 16);
    ctx.fillStyle = "#ffe66d";
    ctx.font = "18px VT323";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("$", 0, 1);

    if (cache.maxHp > 1) {
      ctx.fillStyle = "rgba(0, 0, 0, .7)";
      ctx.fillRect(-14, 15, 28, 3);
      ctx.fillStyle = "#7df9ff";
      ctx.fillRect(-14, 15, 28 * hpPct, 3);
    }

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

function drawShockwaves() {
  v_shockwaves.forEach(wave => {
    const pct = 1 - clamp(wave.life / wave.maxLife, 0, 1);
    const radius = wave.radius * pct;
    const alpha = (1 - pct) * 0.72;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = wave.color;
    ctx.lineWidth = 2 + (1 - pct) * 4;
    ctx.beginPath();
    ctx.arc(wave.x, wave.y, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalAlpha = alpha * 0.18;
    ctx.fillStyle = wave.color;
    ctx.beginPath();
    ctx.arc(wave.x, wave.y, radius * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
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

  const waveCount = getFormationWaveCount();
  const phase = v_boss ? "BOSS" : `WAVE ${v_formationWave}/${waveCount}`;
  const label = v_bonusRaid
    ? "BONUS: SALVAGE RAID"
    : v_endlessMode
      ? `RIFT ENCOUNTER ${v_level}  ${phase}`
      : waveCount > 1
        ? `LEVEL ${v_level}  ${phase}`
        : `LEVEL: ${v_level}`;

  ctx.fillText(label, GAME_WIDTH - 24, 30);
}

function drawContractStatus() {
  if (!v_contract) return;

  const completed = isContractComplete(v_contract);
  const failed = v_contract.failed;
  const color = failed ? "#777777" : completed ? "#77ff77" : "#ffe66d";
  const reward = v_contract.reward + getContractStreakBonus(v_contractStreak + 1);

  ctx.save();
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.font = "20px VT323";
  ctx.fillStyle = color;
  const streakLabel = v_contractStreak > 0 ? `  STREAK x${v_contractStreak}` : "";
  ctx.fillText(`CONTRACT: ${v_contract.name}${streakLabel}`, 18, 29);
  ctx.font = "18px VT323";
  ctx.fillStyle = failed ? "#777777" : "#cfcfcf";
  ctx.fillText(
    `${v_contract.desc}  ${getContractProgress(v_contract)}  +${reward} SALVAGE`,
    18,
    51
  );
  ctx.restore();
}

function drawAnomalyStatus() {
  if (v_bonusRaid) return;

  ctx.save();
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.font = "18px VT323";

  if (v_anomaly) {
    ctx.fillStyle = v_anomaly.id === "bounty"
      ? "#ffe66d"
      : v_anomaly.id === "storm"
        ? "#7df9ff"
        : "#ff8f3d";
    ctx.fillText(v_anomaly.name, GAME_WIDTH - 24, 53);
  } else if (!v_boss && v_waveAceCount > 0) {
    ctx.fillStyle = "#ffe66d";
    ctx.fillText(`ACE CONTACTS: ${v_waveAceCount}`, GAME_WIDTH - 24, 53);
  }

  ctx.restore();
}

function drawCampaignLadder() {
  if (v_endlessMode || v_bonusRaid) return;

  const x = GAME_WIDTH - 156;
  const y = 76;
  const nodeGap = 18;
  const activeSector = CAMPAIGN_SECTORS.find(sector => v_level >= sector.start && v_level <= sector.end);

  ctx.save();
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.font = "16px VT323";
  ctx.fillStyle = "#9af8ff";
  ctx.fillText(activeSector ? activeSector.name.toUpperCase() : "VOID CAMPAIGN", GAME_WIDTH - 24, y - 18);

  for (let i = 1; i <= FINAL_LEVEL; i++) {
    const px = x + ((i - 1) % 5) * 24;
    const py = y + Math.floor((i - 1) / 5) * nodeGap;
    const cleared = i < v_level;
    const current = i === v_level;
    const dock = CAMPAIGN_DOCK_LEVELS.includes(i);

    ctx.globalAlpha = cleared ? 0.85 : current ? 1 : 0.38;
    ctx.fillStyle = current ? "#ffe66d" : cleared ? "#77ff77" : "#25283a";
    ctx.beginPath();
    ctx.arc(px, py, current ? 5.5 : 4, 0, Math.PI * 2);
    ctx.fill();

    if (dock) {
      ctx.strokeStyle = "#7df9ff";
      ctx.lineWidth = 1;
      ctx.strokeRect(px - 6, py - 6, 12, 12);
    }
  }

  ctx.globalAlpha = 0.9;
  ctx.fillStyle = "#cfcfcf";
  ctx.fillText(`BOSS ${v_level}/15`, GAME_WIDTH - 24, y + 58);
  ctx.restore();
}

function drawRiftGoals() {
  if (!v_endlessMode || v_bonusRaid) return;

  const nextMilestone = getRiftMilestoneStatus(v_level);
  const weeklyIn = RIFT_WEEKLY_BOSS_INTERVAL - ((v_level - 1) % RIFT_WEEKLY_BOSS_INTERVAL);

  ctx.save();
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.font = "17px VT323";
  ctx.fillStyle = "#ff87c5";
  ctx.fillText(getWeeklyBossName(v_level), GAME_WIDTH - 24, 78);
  ctx.fillStyle = "#ffe66d";
  ctx.fillText(`BOSS IN ${weeklyIn}  |  MILESTONE ${nextMilestone.depth}`, GAME_WIDTH - 24, 98);
  ctx.fillStyle = "#cfcfcf";
  ctx.fillText(nextMilestone.reward.toUpperCase(), GAME_WIDTH - 24, 118);
  ctx.restore();
}

function drawBonusRaidStatus() {
  if (!v_bonusRaid) return;

  const seconds = Math.max(0, Math.ceil(v_bonusRaid.timer / 60));
  const multiplier = v_bonusRaid.multiplier.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");

  ctx.save();
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffe66d";
  ctx.font = "22px VT323";
  ctx.fillText(`HAUL ${v_bonusRaid.salvageEarned}  MULTI x${multiplier}`, 18, 30);
  ctx.fillStyle = "#7df9ff";
  ctx.font = "20px VT323";
  ctx.fillText(`TIME ${seconds}  CACHES ${v_bonusRaid.cachesBroken}`, 18, 53);
  ctx.restore();
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

  if (activePowerUps.stasis > 0) {
    items.push(`TIME SNARE ${Math.ceil(activePowerUps.stasis / 60)}`);
  }

  if (activePowerUps.surge > 0) {
    items.push(`SURGE ${Math.ceil(activePowerUps.surge / 60)}`);
  }

  if (!items.length) return;

  ctx.font = "18px VT323";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#77ff77";
  ctx.fillText(items.join("   "), 18, GAME_HEIGHT - 20);
}

function drawSurgeMeter() {
  const active = activePowerUps.surge > 0;
  const pct = active
    ? clamp(activePowerUps.surge / SURGE_DURATION_FRAMES, 0, 1)
    : clamp(v_surge / SURGE_CHARGE_MAX, 0, 1);
  const x = 18;
  const y = GAME_HEIGHT - 45;
  const w = 150;
  const h = 8;

  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, .62)";
  ctx.fillRect(x, y, w, h);

  const grad = ctx.createLinearGradient(x, y, x + w, y);
  grad.addColorStop(0, active ? "#ff87c5" : "#5a6bff");
  grad.addColorStop(1, active ? "#7df9ff" : "#7df9ff");
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w * pct, h);

  ctx.strokeStyle = active ? "rgba(255, 135, 197, .8)" : "rgba(125, 249, 255, .55)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);

  ctx.font = "16px VT323";
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  ctx.fillStyle = active ? "#ff87c5" : "#7df9ff";
  ctx.fillText(active ? "VOID SURGE" : "SURGE", x, y - 4);
  ctx.restore();
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

  if (v_bonusRaid) sub = "SHOOT CACHES - DODGE DEBRIS";
  else if (v_boss) sub = `BREAK ${v_boss.variant.name}`;
  else if (v_anomaly) sub = v_anomaly.desc.toUpperCase();
  else if (v_waveAceCount > 0) sub = "ACE SQUAD INBOUND - BONUS SALVAGE";
  else if (v_endlessMode) sub = "THE RIFT SHIFTS AGAIN";
  else if (v_level >= 8) sub = "THE VOID IS SPEEDING UP";
  else if (v_level >= 5) sub = "ORBS AIM, CRAWLERS HIT HARD";
  else if (v_level >= 3) sub = "SQUIDS FIRE SPREAD SHOTS";

  ctx.fillText(sub, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 32);
  ctx.globalAlpha = 1;
}

function drawBossWarning() {
  if (v_bossWarningTimer <= 0 || !v_boss) return;

  const alpha = window.ArcadeUX.flashesReduced() ? 0.55 : 0.45 + Math.sin(gameFrame * 0.28) * 0.25;

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
}

function drawInvaders() {
  drawStars();

  if (gameState === "playing" || gameState === "gameover" || gameState === "dock") {
    drawPlayerTrails();
    drawPlayer();
    v_enemies.forEach(drawEnemy);
    drawBoss();
    drawBullets();
    drawPowerUps();
    drawSalvageCaches();
    drawShockwaves();
    drawParticles();
    drawScorePopups();
    if (v_waveBannerTimer <= 0 && v_bossWarningTimer <= 0) {
      drawWaveLabel();
      drawContractStatus();
      drawAnomalyStatus();
      drawCampaignLadder();
      drawRiftGoals();
      drawBonusRaidStatus();
    }
    drawSurgeMeter();
    drawPowerUpStatus();
    drawComboStatus();
    drawBossWarning();
    if (v_bossWarningTimer <= 0) drawWaveBanner();
    drawPauseOverlay();
  }
}

// -------------------- Engine + Inputs --------------------

const FIXED_FRAME_MS = 1000 / 60;
const MAX_FRAME_CATCHUP_MS = 80;
const MAX_FIXED_STEPS = 4;
let tickLastTime = 0;
let tickAccumulator = 0;
let lastDraw = 0;
let lastDrawState;

function advanceFixedFrame() {
  if (!isGameOver) {
    updateInvaders();
    return;
  }

  gameFrame++;
  updateParticles();
  updateScorePopups();
  updatePlayerTrails();
  updateShockwaves();
}

function tick(timestamp = 0) {
  const now = timestamp || performance.now();
  if (!tickLastTime) tickLastTime = now;

  const frameMs = Math.min(MAX_FRAME_CATCHUP_MS, Math.max(0, now - tickLastTime));
  tickLastTime = now;
  tickAccumulator += frameMs;

  let steps = 0;
  while (tickAccumulator >= FIXED_FRAME_MS && steps < MAX_FIXED_STEPS) {
    advanceFixedFrame();
    tickAccumulator -= FIXED_FRAME_MS;
    steps++;
  }

  if (steps >= MAX_FIXED_STEPS) {
    tickAccumulator = 0;
  }

  const drawState = v_isPaused ? "paused" : gameState;
  if (drawState !== "title" && (drawState === "playing" || now - lastDraw >= 66 || drawState !== lastDrawState)) {
    drawInvaders();
    lastDraw = now;
  }
  lastDrawState = drawState;
  requestAnimationFrame(tick);
}

window.addEventListener("keydown", (e) => {
  const gameplayKeys = ["ArrowLeft", "ArrowRight", "ArrowUp", " ", "a", "A", "d", "D", "j", "J"];
  const oneShotKeys = ["p", "P", "r", "R", "Escape", "Enter"];

  if (gameState === "title" && e.key === "Escape" && (!controlsCard.hidden || !trophiesCard.hidden)) {
    e.preventDefault();
    controlsCard.hidden = true;
    trophiesCard.hidden = true;
    updateTitleToggleButtons();
    return;
  }

  const interactiveTarget = e.target instanceof Element
    ? e.target.closest("button, input, select, textarea, summary, a, [role='button'], [contenteditable='true']")
    : null;
  if (interactiveTarget && (e.key === "Enter" || e.key === " ")) return;

  if (gameplayKeys.includes(e.key) || (gameState !== "title" && oneShotKeys.includes(e.key))) {
    e.preventDefault();
  }

  if (gameState === "title" && (e.key === "Enter" || e.key === " ")) {
    if (e.repeat) return;
    initAudio();
    initInvaders("campaign");
    return;
  }

  if (gameState === "dock" && e.key === "Enter") {
    if (e.repeat) return;
    launchNextSector();
    return;
  }

  if (e.repeat && oneShotKeys.includes(e.key)) return;

  if (gameState === "playing" && e.key === "Escape") {
    togglePause();
    return;
  }

  initAudio();
  keys[e.key] = true;

  if ((e.key === "p" || e.key === "P") && gameState === "playing") {
    togglePause();
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
  resetMobileInput();
  showTitleScreen();
});

pauseBtn.addEventListener("click", () => {
  initAudio();
  togglePause();
  canvas.focus();
});

resumeGameBtn.addEventListener("click", () => {
  setPaused(false);
  canvas.focus();
});

pauseSoundToggleBtn.addEventListener("click", () => {
  toggleSoundEnabled();
});

pauseMusicToggleBtn.addEventListener("click", () => {
  toggleMusicEnabled();
});

pauseAutofireToggleBtn.addEventListener("click", () => {
  toggleAutofireEnabled();
});

pauseRestartBtn.addEventListener("click", () => {
  initAudio();
  initInvaders();
});

pauseMainMenuBtn.addEventListener("click", () => {
  showTitleScreen();
});

playAgainBtn.addEventListener("click", () => {
  initAudio();
  initInvaders();
});

continueEndlessBtn.addEventListener("click", () => {
  initAudio();
  enterEndlessRift();
});

backTitleBtn.addEventListener("click", () => {
  showTitleScreen();
});

startBonusRaidBtn.addEventListener("click", () => {
  initAudio();
  startBonusRaid();
});

leaveDockBtn.addEventListener("click", () => {
  initAudio();
  launchNextSector();
});

dockRepairBtn.addEventListener("click", () => {
  initAudio();
  purchaseDockRepair();
});

dockRerollBtn.addEventListener("click", () => {
  initAudio();
  rerollDockOffers();
});

startGameBtn.addEventListener("click", () => {
  initAudio();
  initInvaders("campaign");
});

startEndlessBtn.addEventListener("click", () => {
  initAudio();
  initInvaders("endless");
});

soundToggleBtn.addEventListener("click", () => {
  toggleSoundEnabled();
});

musicToggleBtn.addEventListener("click", () => {
  toggleMusicEnabled();
});

autofireToggleBtn.addEventListener("click", () => {
  toggleAutofireEnabled();
});

controlsToggleBtn.addEventListener("click", () => {
  controlsCard.hidden = !controlsCard.hidden;
  if (!controlsCard.hidden && trophiesCard) trophiesCard.hidden = true;
  updateTitleToggleButtons();
});

trophiesToggleBtn.addEventListener("click", () => {
  trophiesCard.hidden = !trophiesCard.hidden;
  if (!trophiesCard.hidden) {
    controlsCard.hidden = true;
    renderTrophies();
  }
  updateTitleToggleButtons();
});

window.addEventListener("resize", updateMobileControlVisibility);
window.addEventListener("blur", handleAppHidden);

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    handleAppHidden();
  }
});

if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", updateMobileControlVisibility);
}

window.addEventListener("orientationchange", () => {
  setTimeout(updateMobileControlVisibility, 250);
});

updateHighScoreUI();
updateAudioButtons();
updateTitleToggleButtons();
initBackground();
closeOverlay();
showPauseMenu(false);
showTitleScreen();
tick();

window.ArcadeUX.onPreferences(() => {
  if (window.ArcadeUX.musicAllowed()) startMusic();
  else stopMusic();
});

window.ArcadeUX.registerGame({
  active: () => gameState === "playing",
  paused: () => v_isPaused,
  pause: setPaused,
  label: () => "Campaign"
});
