const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

function isDeveloperMode() {
  return Boolean(window.ArcadeDeveloperMode?.enabled);
}

const scoreEl = document.getElementById("score");
const highScoreEl = document.getElementById("highScore");
const stageNameEl = document.getElementById("stageName");
const streakEl = document.getElementById("streak");
const omenNameEl = document.getElementById("omenName");
const dreadEl = document.getElementById("dread");
const ritualNameEl = document.getElementById("ritualName");
const ritualGoalEl = document.getElementById("ritualGoal");
const omenRuleEl = document.getElementById("omenRule");
const sealTrackEl = document.getElementById("sealTrack");
const pactTrackEl = document.getElementById("pactTrack");
const vowTrackEl = document.getElementById("vowTrack");

const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayText = document.getElementById("overlayText");
const startBtn = document.getElementById("startBtn");
const muteBtn = document.getElementById("muteBtn");
const menuPanel = document.getElementById("menuPanel");
const menuSoundBtn = document.getElementById("menuSoundBtn");
const motionBtn = document.getElementById("motionBtn");
const resetBestBtn = document.getElementById("resetBestBtn");
const trophiesBtn = document.getElementById("trophiesBtn");
const trophyCountEl = document.getElementById("trophyCount");
const trophyPanel = document.getElementById("trophyPanel");
const trophyProgressEl = document.getElementById("trophyProgress");
const trophyListEl = document.getElementById("trophyList");
const difficultyDescriptionEl = document.getElementById("difficultyDescription");
const careerSummaryEl = document.getElementById("careerSummary");
const mobilePauseBtn = document.getElementById("mobilePauseBtn");
const pactPanel = document.getElementById("pactPanel");
const pactChoicesEl = document.getElementById("pactChoices");
const difficultyButtons = Array.from(document.querySelectorAll("[data-difficulty]"));
const hudLabels = {
  score: document.querySelector(".hud-card:nth-child(1) span"),
  highScore: document.querySelector(".hud-card:nth-child(2) span"),
  stage: document.querySelector(".hud-card:nth-child(3) span"),
  streak: document.querySelector(".hud-card:nth-child(4) span"),
  dread: document.querySelector(".hud-card:nth-child(5) span")
};
const NATIONAL_GAME_ID = "horror-snake";
const NATIONAL_GAME_NAME = "Serpent Sin";

window.NationalLeaderboard?.init({
  gameId: NATIONAL_GAME_ID,
  gameName: NATIONAL_GAME_NAME,
  getPersonalScores: () => [
    { label: "Current Mode Best", score: Math.max(highScore || 0, score || 0) },
    { label: "Classic Best", score: Number(getStorageItem("horrorSnakeHighScore:classic")) || 0 },
    { label: "Haunted Best", score: Number(getStorageItem("horrorSnakeHighScore:haunted")) || 0 },
    { label: "Nightmare Best", score: Number(getStorageItem("horrorSnakeHighScore:nightmare")) || 0 }
  ]
});

function submitNationalScore(finalScore) {
  window.NationalLeaderboard?.submitScore(NATIONAL_GAME_ID, finalScore, {
    gameName: NATIONAL_GAME_NAME,
    difficulty: getDifficulty()?.name || "Normal"
  });
}

function setOverlayHidden(isHidden) {
  overlay.classList.toggle("hidden", isHidden);
  overlay.setAttribute("aria-hidden", String(isHidden));
}

function setTitleScreenActive(isActive) {
  overlay.classList.toggle("title-screen", isActive);
}

const GRID_SIZE = 20;
const TILE = canvas.width / GRID_SIZE;
const SOUND_SETTING_KEY = "horrorSnakeSoundOn";
const TROPHY_KEY = "horrorSnakeTrophiesV1";
const CAREER_KEY = "horrorSnakeCareerV1";

const GAME_TITLE = "Serpent Sin";
const READY_COPY =
  "Complete four blood rituals and escape the hunting dark. Each descent now carries optional Blood Vows for extra rewards, and feeding enough mutates your body into a new weapon or liability.";
const CLASSIC_READY_COPY =
  "Classic Snake rules: eat brains, grow one segment, avoid walls and your own body, and chase the high score.";
const START_SPEED = 145;
const MIN_SPEED = 62;
const CLASSIC_START_SPEED = 150;
const CLASSIC_MIN_SPEED = 72;
const CLASSIC_SPEED_STEP = 5;
const CLASSIC_SPEED_DROP = 7;
const RELIC_MIN_SCORE = 4;
const RELIC_DURATION = 5200;
const PHASE_DURATION = 4300;
const STAGE_MESSAGE_DURATION = 1500;
const MAX_PARTICLES = 90;
const MAX_FLOATERS = 16;
const DREAD_BONUS_TARGET = 4;
const DREAD_MEMORY_LIMIT = 72;
const DREAD_SURGE_DURATION = 2800;
const DREAD_SURGE_SPEED_RELIEF = 18;
const EVENT_WARNING_DURATION = 950;
const SIGIL_PHASE_DURATION = 2800;
const SIGIL_SCORE = 5;
const ESCAPE_SCORE = 15;
const WARD_PHASE_DURATION = 1800;
const MUTATION_PICKUP_INTERVAL = 6;
const SHED_PHASE_DURATION = 2200;
const VENOM_TRAIL_DURATION = 3300;
const RIFT_WARNING_DURATION = 1250;

const TROPHIES = [
  { id: "first_feed", progress: () => ({ metric: "brains", current: runStats.brains, target: 1 }),  name: "First Feed", desc: "Eat your first brain.", test: () => runStats.brains >= 1 },
  { id: "brain_10", progress: () => ({ metric: "brains", current: runStats.brains, target: 10 }),  name: "Brain Cache", desc: "Eat 10 brains in one run.", test: () => runStats.brains >= 10 },
  { id: "brain_25", progress: () => ({ metric: "brains", current: runStats.brains, target: 25 }),  name: "Feast Coil", desc: "Eat 25 brains in one run.", test: () => runStats.brains >= 25 },
  { id: "first_seal", name: "Sigil Claimed", desc: "Claim your first seal.", test: () => seals >= 1 },
  { id: "three_seals", name: "Ritualist", desc: "Claim 3 seals.", test: () => seals >= 3 },
  { id: "escape", name: "Ritual Broken", desc: "Escape the hunting dark.", test: () => gameState === "escaped" },
  { id: "relic_one", progress: () => ({ metric: "relics", current: runStats.relics, target: 1 }),  name: "Cursed Relic", desc: "Claim a relic.", test: () => runStats.relics >= 1 },
  { id: "relic_three", progress: () => ({ metric: "relics", current: runStats.relics, target: 3 }),  name: "Relic Hunger", desc: "Claim 3 relics in one run.", test: () => runStats.relics >= 3 },
  { id: "streak_5", progress: () => ({ metric: "streak", current: runStats.maxStreak, target: 5 }),  name: "Clean Coil", desc: "Reach a 5x streak.", test: () => runStats.maxStreak >= 5 },
  { id: "streak_10", progress: () => ({ metric: "streak", current: runStats.maxStreak, target: 10 }),  name: "Perfect Coil", desc: "Reach a 10x streak.", test: () => runStats.maxStreak >= 10 },
  { id: "dread_10", progress: () => ({ metric: "dread", current: runStats.dreadEarned, target: 10 }),  name: "Dread Drinker", desc: "Earn 10 dread in one run.", test: () => runStats.dreadEarned >= 10 },
  { id: "phase_5", name: "Ghost Feed", desc: "Collect 5 pickups while phasing.", test: () => runStats.phasePickups >= 5 },
  { id: "mutation_one", name: "Body Warps", desc: "Grow a mutation.", test: () => mutations.length >= 1 },
  { id: "mutation_three", name: "Abomination", desc: "Grow 3 mutations.", test: () => mutations.length >= 3 },
  { id: "mutation_spent", name: "Pact Spent", desc: "Use a mutation charge.", test: () => runStats.mutationsUsed >= 1 },
  { id: "shade_melt", name: "Shade Melted", desc: "Destroy a shade.", test: () => runStats.shadesKilled >= 1 },
  { id: "shade_hunter", name: "Shade Hunter", desc: "Destroy 3 shades in one run.", test: () => runStats.shadesKilled >= 3 },
  { id: "vow_one", name: "Blood Vow", desc: "Fulfill a blood vow.", test: () => runStats.vowsCompleted >= 1 },
  { id: "vow_three", name: "Vow Keeper", desc: "Fulfill 3 blood vows in one run.", test: () => runStats.vowsCompleted >= 3 },
  { id: "score_80", name: "Horror Legend", desc: "Score 80 in one run.", test: () => score >= 80 || highScore >= 80 },
  { id: "brain_40", name: "Forty Brains", desc: "Eat 40 brains in one run.", test: () => runStats.brains >= 40 },
  { id: "brain_60", name: "Brain Cathedral", desc: "Eat 60 brains in one run.", test: () => runStats.brains >= 60 },
  { id: "all_seals", name: "Seal Breaker", desc: "Claim all ritual seals.", test: () => seals >= RITUALS.length },
  { id: "relic_five", name: "Relic Coil", desc: "Claim 5 relics in one run.", test: () => runStats.relics >= 5 },
  { id: "relic_eight", name: "Relic Glutton", desc: "Claim 8 relics in one run.", test: () => runStats.relics >= 8 },
  { id: "streak_15", name: "Frenzy Coil", desc: "Reach a 15x streak.", test: () => runStats.maxStreak >= 15 },
  { id: "streak_20", name: "Perfect Hunger", desc: "Reach a 20x streak.", test: () => runStats.maxStreak >= 20 },
  { id: "dread_20", name: "Dread Vessel", desc: "Earn 20 dread in one run.", test: () => runStats.dreadEarned >= 20 },
  { id: "dread_35", name: "Dread Monarch", desc: "Earn 35 dread in one run.", test: () => runStats.dreadEarned >= 35 },
  { id: "phase_10", name: "Phantom Feast", desc: "Collect 10 pickups while phasing.", test: () => runStats.phasePickups >= 10 },
  { id: "phase_15", name: "Vanishing Appetite", desc: "Collect 15 pickups while phasing.", test: () => runStats.phasePickups >= 15 },
  { id: "mutation_five", name: "Twisted Spine", desc: "Grow 5 mutations.", test: () => mutations.length >= 5 },
  { id: "mutation_all", name: "Full Abomination", desc: "Grow every mutation.", test: () => mutations.length >= BODY_MUTATIONS.length },
  { id: "mutation_spender_three", name: "Ward Spender", desc: "Use 3 mutation charges in one run.", test: () => runStats.mutationsUsed >= 3 },
  { id: "mutation_spender_five", name: "Pact Burner", desc: "Use 5 mutation charges in one run.", test: () => runStats.mutationsUsed >= 5 },
  { id: "shade_five", name: "Shade Breaker", desc: "Destroy 5 shades in one run.", test: () => runStats.shadesKilled >= 5 },
  { id: "shade_ten", name: "Shade Reaper", desc: "Destroy 10 shades in one run.", test: () => runStats.shadesKilled >= 10 },
  { id: "vow_five", name: "Vow Saint", desc: "Fulfill 5 blood vows in one run.", test: () => runStats.vowsCompleted >= 5 },
  { id: "vow_all", name: "All Oaths Paid", desc: "Escape after fulfilling every active blood vow.", test: () => gameState === "escaped" && runStats.vowsCompleted >= BLOOD_VOW_COUNT },
  { id: "score_120", name: "Nightmare Coil", desc: "Score 120 in one run.", test: () => score >= 120 || highScore >= 120 },
  { id: "score_180", name: "Horror Sovereign", desc: "Score 180 in one run.", test: () => score >= 180 || highScore >= 180 },
  { id: "score_250", name: "Unending Hunger", desc: "Score 250 in one run.", test: () => score >= 250 || highScore >= 250 },
  { id: "pickup_30", name: "Floor Cleaner", desc: "Collect 30 pickups in one run.", test: () => runStats.pickups >= 30 },
  { id: "pickup_50", name: "Nothing Left", desc: "Collect 50 pickups in one run.", test: () => runStats.pickups >= 50 },
  { id: "clean_20", name: "Clean Bite", desc: "Eat 20 brains before collecting a relic.", test: () => runStats.brains >= 20 && runStats.relics === 0 },
  { id: "relic_first", name: "Relic First", desc: "Claim a relic before eating 5 brains.", test: () => runStats.relics >= 1 && runStats.brains < 5 },
  { id: "escaped_rich", name: "Rich Escape", desc: "Escape with 3 relics.", test: () => gameState === "escaped" && runStats.relics >= 3 },
  { id: "escaped_dread", name: "Dread Escape", desc: "Escape with 20 dread earned.", test: () => gameState === "escaped" && runStats.dreadEarned >= 20 },
  { id: "escaped_mutant", name: "Mutant Escape", desc: "Escape with 3 mutations.", test: () => gameState === "escaped" && mutations.length >= 3 },
  { id: "high_score_200", name: "Old Horror Record", desc: "Set a high score of 200.", test: () => highScore >= 200 || score >= 200 },
];

const RITUALS = [
  {
    name: "First Offering",
    type: "brains",
    target: 4,
    action: "Devour brains"
  },
  {
    name: "Walk the Edge",
    type: "dread",
    target: 3,
    action: "Skim lethal danger for Dread"
  },
  {
    name: "Feeding Frenzy",
    type: "streak",
    target: 4,
    action: "Chain a feeding streak"
  },
  {
    name: "Relic Tithe",
    type: "relics",
    target: 2,
    action: "Claim cursed relics"
  }
];

const BLOOD_VOW_COUNT = 3;
const BLOOD_VOWS = [
  {
    id: "fresh-hunger",
    name: "Fresh Hunger",
    description: "Eat 10 brains",
    rewardLabel: "+5 score",
    target: 10,
    points: 5,
    progress: () => runStats.brains
  },
  {
    id: "edge-feast",
    name: "Edge Feast",
    description: "Earn 7 Dread",
    rewardLabel: "+4 score, surge",
    target: 7,
    points: 4,
    dreadSurge: true,
    progress: () => runStats.dreadEarned
  },
  {
    id: "gold-tithe",
    name: "Gold Tithe",
    description: "Claim 3 relics",
    rewardLabel: "+8 score, phase",
    target: 3,
    points: 8,
    phaseDuration: 2400,
    progress: () => runStats.relics
  },
  {
    id: "frenzy-oath",
    name: "Frenzy Oath",
    description: "Reach a 6x streak",
    rewardLabel: "+6 score, relic",
    target: 6,
    points: 6,
    spawnRelic: true,
    progress: () => runStats.maxStreak
  },
  {
    id: "seal-breaker",
    name: "Seal Breaker",
    description: "Claim 2 seals",
    rewardLabel: "+7 score, phase",
    target: 2,
    points: 7,
    phaseDuration: 2800,
    progress: () => seals
  },
  {
    id: "shade-hunter",
    name: "Shade Hunter",
    description: "Melt 1 Shade",
    rewardLabel: "+8 score, coil",
    target: 1,
    points: 8,
    coilCharges: 1,
    requiresEvents: true,
    progress: () => runStats.shadesKilled
  },
  {
    id: "warped-body",
    name: "Warped Body",
    description: "Grow 3 mutations",
    rewardLabel: "+7 score, armor",
    target: 3,
    points: 7,
    armorCharges: 1,
    progress: () => mutations.length
  },
  {
    id: "phase-thief",
    name: "Phase Thief",
    description: "Collect 3 while phasing",
    rewardLabel: "+6 score, surge",
    target: 3,
    points: 6,
    dreadSurge: true,
    progress: () => runStats.phasePickups
  },
  {
    id: "ward-spender",
    name: "Ward Spender",
    description: "Spend 2 mutation wards",
    rewardLabel: "+5 score, shed",
    target: 2,
    points: 5,
    shedCharges: 1,
    progress: () => runStats.mutationsUsed
  }
];

const BODY_MUTATIONS = [
  {
    id: "split-tongue",
    name: "Split Tongue",
    description: "Collect brains, relics, and sigils from one tile away.",
    pickupRange: 1
  },
  {
    id: "rotten-coil",
    name: "Rotten Coil",
    description: "Pass through your own body once.",
    coilCharges: 1
  },
  {
    id: "bone-armor",
    name: "Bone Armor",
    description: "Survive one wall hit and tear through the boundary.",
    armorCharges: 1
  },
  {
    id: "venom-trail",
    name: "Venom Trail",
    description: "Your shed poison kills pursuing Shades behind you.",
    venomTrail: true
  },
  {
    id: "second-head",
    name: "Second Head",
    description: "Move faster and collect up to two tiles away, but your tail-head is curse-vulnerable.",
    pickupRange: 2,
    secondHead: true
  },
  {
    id: "shed-skin",
    name: "Shed Skin",
    description: "Escape one death by shedding half of your length.",
    shedCharges: 1
  },
  {
    id: "moon-fang",
    name: "Moon Fang",
    description: "Relics are worth more and their phase lasts longer.",
    relicScoreBonus: 2,
    phaseBonus: 1300
  }
];

const STAGES = [
  {
    name: "Graveyard",
    threshold: 0,
    background: "assets/background1.webp",
    skyTop: "#140713",
    skyBottom: "#050305",
    fog: "rgba(157, 87, 255, 0.12)",
    grid: "rgba(241, 216, 177, 0.055)",
    accent: "rgba(125, 255, 157, 0.5)"
  },
  {
    name: "Catacombs",
    threshold: 8,
    background: "assets/background2.webp",
    skyTop: "#190808",
    skyBottom: "#050102",
    fog: "rgba(180, 22, 43, 0.15)",
    grid: "rgba(241, 216, 177, 0.05)",
    accent: "rgba(241, 216, 177, 0.42)"
  },
  {
    name: "Blood Moon",
    threshold: 18,
    background: "assets/background3.webp",
    skyTop: "#29040b",
    skyBottom: "#080103",
    fog: "rgba(255, 47, 80, 0.13)",
    grid: "rgba(255, 47, 80, 0.055)",
    accent: "rgba(255, 47, 80, 0.58)"
  },
  {
    name: "Void Chapel",
    threshold: 32,
    background: "assets/background4.webp",
    skyTop: "#07051b",
    skyBottom: "#010005",
    fog: "rgba(132, 74, 255, 0.14)",
    grid: "rgba(132, 74, 255, 0.055)",
    accent: "rgba(157, 87, 255, 0.6)"
  },
  {
    name: "Black Garden",
    threshold: 50,
    background: "",
    skyTop: "#02120d",
    skyBottom: "#010403",
    fog: "rgba(125, 255, 157, 0.11)",
    grid: "rgba(125, 255, 157, 0.052)",
    accent: "rgba(255, 214, 111, 0.55)"
  }
];

const RUN_OMENS = [
  {
    name: "Nightfall",
    description: "No omen modifiers",
    speedOffset: 0,
    comboWindow: 4200,
    relicChance: 0.14,
    obstacleBonus: 0,
    darkness: 0
  },
  {
    name: "Blood Rush",
    description: "Faster hunt / relics surface more often",
    speedOffset: -8,
    comboWindow: 3600,
    relicChance: 0.2,
    obstacleBonus: 0,
    darkness: 0
  },
  {
    name: "Heavy Fog",
    description: "Slower pace / deeper dark / harsher terrain",
    speedOffset: 8,
    comboWindow: 4800,
    relicChance: 0.16,
    obstacleBonus: 1,
    darkness: 0.1
  },
  {
    name: "Grave Shift",
    description: "Relics surface often / harsher terrain",
    speedOffset: 0,
    comboWindow: 4200,
    relicChance: 0.24,
    obstacleBonus: 1,
    darkness: 0.04
  }
];

const DIFFICULTIES = {
  classic: {
    label: "Classic",
    description: "OG Snake: no rituals, hazards, relics, or bonus scoring. Pure grid survival.",
    speedOffset: 0,
    obstacleScale: 0,
    obstacleBonus: 0,
    maxObstacles: 0,
    comboScale: 1,
    relicBonus: 0,
    darkness: -0.05,
    events: false,
    eventMin: 0,
    eventMax: 0
  },
  haunted: {
    label: "Haunted",
    description: "The intended descent: hazards emerge and a shade may begin hunting.",
    speedOffset: 0,
    obstacleScale: 1,
    obstacleBonus: 0,
    maxObstacles: 10,
    comboScale: 1,
    relicBonus: 0,
    darkness: 0,
    events: true,
    eventMin: 9000,
    eventMax: 14000
  },
  nightmare: {
    label: "Nightmare",
    description: "Faster, darker, and crowded with threats. Mutations matter immediately.",
    speedOffset: -16,
    obstacleScale: 1.35,
    obstacleBonus: 2,
    maxObstacles: 14,
    comboScale: 0.86,
    relicBonus: 0.04,
    darkness: 0.16,
    events: true,
    eventMin: 5600,
    eventMax: 9200
  }
};

for (const stage of STAGES) {
  const image = new Image();
  if (stage.background) image.src = stage.background;
  stage.image = image;
}

const FOOD_SPRITE = {
  image: new Image(),
  bounds: { x: 209, y: 294, width: 802, height: 658 },
  ready: false
};

FOOD_SPRITE.image.addEventListener("load", () => {
  FOOD_SPRITE.ready = true;
});
FOOD_SPRITE.image.src = "assets/brain.webp";

const SNAKE_SPRITE_SOURCES = {
  head: "assets/snakehead.webp",
  body: "assets/snakebody.webp",
  tail: "assets/snaketail.webp",
  turnDown: "assets/snaketurn1.webp",
  turnUp: "assets/snaketurn2.webp"
};

const SNAKE_SPRITE_BOUNDS = {
  head: { x: 64, y: 415, width: 1147, height: 382 },
  body: { x: 445, y: 145, width: 357, height: 955 },
  tail: { x: 70, y: 451, width: 1107, height: 336 },
  turnDown: { x: 150, y: 261, width: 870, height: 802 },
  turnUp: { x: 258, y: 173, width: 719, height: 843 }
};

const SNAKE_SPRITES = Object.fromEntries(
  Object.entries(SNAKE_SPRITE_SOURCES).map(([key, src]) => {
    const image = new Image();
    const sprite = {
      image,
      bounds: SNAKE_SPRITE_BOUNDS[key],
      ready: false
    };

    image.addEventListener("load", () => {
      sprite.ready = true;
    });

    image.src = src;

    return [key, sprite];
  })
);

let snake;
let direction;
let pendingDirection;
let inputQueue;
let food;
let relic;
let sigil;
let exitGate;
let obstacles;
let score;
let highScore;
let streak;
let dread;
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
let phaseUntil;
let phaseMeterDuration;
let dreadSurgeUntil;
let particles;
let floaters;
let stageMessage;
let stageMessageUntil;
let lastStageName;
let lastHeartbeatAt;
let difficultyKey;
let reducedMotion;
let activeEvent;
let nextEventAt;
let touchStart;
let nearMissCells;
let seals;
let ritualIndex;
let ritualProgress;
let runStartedAt;
let suspendedAt;
let runPausedDuration;
let mutations;
let coilCharges;
let armorCharges;
let shedCharges;
let pendingMutationChoices;
let nextMutationPickup;
let venomTrail;
let runStats;
let runEndedAt;
let activeVows;
let earnedTrophies;

const storageFallback = new Map();

function getStorageItem(key) {
  try {
    const value = window.localStorage.getItem(key);
    return value === null ? storageFallback.get(key) ?? null : value;
  } catch (error) {
    return storageFallback.get(key) ?? null;
  }
}

function setStorageItem(key, value) {
  const stringValue = String(value);
  storageFallback.set(key, stringValue);
  try {
    window.localStorage.setItem(key, stringValue);
  } catch (error) {
    // Keep in-memory progress when browser storage is unavailable.
  }
}

function loadCareerStats() {
  const empty = { runs: 0, escapes: 0, brains: 0, relics: 0, shades: 0, bestStreak: 0 };
  try {
    return { ...empty, ...JSON.parse(getStorageItem(CAREER_KEY) || "{}") };
  } catch (error) {
    return empty;
  }
}

let careerStats = loadCareerStats();
applyDeveloperModeUnlocks();

function renderCareerStats() {
  if (!careerSummaryEl) return;
  careerSummaryEl.textContent = careerStats.runs
    ? `${careerStats.runs} pacts | ${careerStats.escapes} escapes | ${careerStats.brains} brains | ${careerStats.shades} shades`
    : "Quick start: start with Classic, eat brains, and avoid your body. Try Haunted after your first run.";
}

function applyDeveloperModeUnlocks() {
  if (!isDeveloperMode()) return;

  careerStats.runs = Math.max(careerStats.runs || 0, 1);
  careerStats.escapes = Math.max(careerStats.escapes || 0, 1);
  careerStats.brains = Math.max(careerStats.brains || 0, 25);
  careerStats.relics = Math.max(careerStats.relics || 0, 3);
  setStorageItem(CAREER_KEY, JSON.stringify(careerStats));
}

function commitCareerStats(escaped = false) {
  careerStats.runs += 1;
  if (escaped) careerStats.escapes += 1;
  careerStats.brains += runStats.brains;
  careerStats.relics += runStats.relics;
  careerStats.shades += runStats.shadesKilled;
  careerStats.bestStreak = Math.max(careerStats.bestStreak, runStats.maxStreak);
  setStorageItem(CAREER_KEY, JSON.stringify(careerStats));
  renderCareerStats();
}

function getHighScoreKey() {
  return `horrorSnakeHighScore:${difficultyKey || "classic"}`;
}

function loadHighScore() {
  return Number(getStorageItem(getHighScoreKey())) || 0;
}

function haptic(pattern = 12) {
  try {
    window.ArcadeUX.vibrate(pattern);
  } catch (error) {
    // Optional mobile feedback.
  }
}

function loadTrophies() {
  try {
    const ids = JSON.parse(getStorageItem(TROPHY_KEY) || "[]");
    return new Set(Array.isArray(ids) ? ids : []);
  } catch (error) {
    return new Set();
  }
}

function saveTrophies() {
  setStorageItem(TROPHY_KEY, JSON.stringify([...earnedTrophies]));
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
  if (!runStats || !earnedTrophies) return;
  window.ArcadeUX.trackMetrics({ brains: runStats.brains, relics: runStats.relics, streak: runStats.maxStreak, dread: runStats.dreadEarned });
  let unlockedAny = false;
  TROPHIES.forEach((trophy) => {
    if (!earnedTrophies.has(trophy.id) && trophy.test()) {
      earnedTrophies.add(trophy.id);
      showEventMessage(`Trophy: ${trophy.name}`, performance.now());
      haptic([18, 30, 18]);
      unlockedAny = true;
    }
  });
  if (unlockedAny) {
    saveTrophies();
    renderTrophies();
  }
}

function boot() {
  earnedTrophies = loadTrophies();
  soundOn = getStorageItem(SOUND_SETTING_KEY) !== "false";
  difficultyKey = getSavedDifficultyKey();
  highScore = loadHighScore();
  const savedReducedMotion = getStorageItem("horrorSnakeReducedMotion");
  reducedMotion = savedReducedMotion === "true" ||
    (savedReducedMotion !== "false" && Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches));
  touchStart = null;
  gameState = "ready";
  runOmen = RUN_OMENS[0];
  stageOffset = 0;

  prepareRunFlavor();
  resetGame();
  setReadyOverlay();
  draw(performance.now());

  highScoreEl.textContent = highScore;
  renderTrophies();
  syncMenu();

  startBtn.addEventListener("click", handleStartButton);
  document.getElementById("restartPaused").addEventListener("click", () => {
    if (gameState === "paused") startGame();
  });
  muteBtn.addEventListener("click", toggleSound);
  menuSoundBtn.addEventListener("click", toggleSound);
  motionBtn.addEventListener("click", toggleMotion);
  resetBestBtn.addEventListener("click", resetBestScore);
  mobilePauseBtn.addEventListener("click", togglePauseFromControl);
  trophiesBtn.addEventListener("click", () => {
    trophyPanel.hidden = !trophyPanel.hidden;
    trophiesBtn.setAttribute("aria-expanded", String(!trophyPanel.hidden));
    renderTrophies();
  });
  pactChoicesEl.addEventListener("click", handlePactChoice);

  difficultyButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setDifficulty(button.dataset.difficulty);
    });
  });

  document.addEventListener("keydown", handleKeyDown);
  document.addEventListener("visibilitychange", pauseForBackground);
  window.addEventListener("blur", pauseForBackground);
  canvas.addEventListener("pointerdown", handlePointerDown, { passive: false });
  canvas.addEventListener("pointerup", handlePointerUp, { passive: false });
  canvas.addEventListener("pointercancel", clearPointerStart);

  document.querySelectorAll(".dir-btn[data-dir]").forEach((button) => {
    button.addEventListener("click", () => {
      if (gameState === "ready" || gameState === "dead" || gameState === "escaped") {
        startGame(button.dataset.dir);
        return;
      }

      queueDirection(button.dataset.dir);
    });
  });

  requestAnimationFrame(gameLoop);
}

function prepareRunFlavor() {
  if (isClassicMode()) {
    runOmen = RUN_OMENS[0];
    stageOffset = 0;
    return;
  }

  runOmen = RUN_OMENS[Math.floor(Math.random() * RUN_OMENS.length)];
  stageOffset = Math.floor(Math.random() * STAGES.length);
}

function getSavedDifficultyKey() {
  const saved = getStorageItem("horrorSnakeDifficulty");
  return DIFFICULTIES[saved] ? saved : "classic";
}

function getDifficulty() {
  return DIFFICULTIES[difficultyKey] || DIFFICULTIES.classic;
}

function isClassicMode() {
  return difficultyKey === "classic";
}

function setDifficulty(nextDifficultyKey) {
  if (!DIFFICULTIES[nextDifficultyKey]) return;

  difficultyKey = nextDifficultyKey;
  setStorageItem("horrorSnakeDifficulty", difficultyKey);
  highScore = loadHighScore();
  syncMenu();

  if (gameState === "ready" || gameState === "dead" || gameState === "escaped") {
    gameState = "ready";
    resetGame();
    setReadyOverlay();
  }
}

function setMenuVisible(isVisible) {
  menuPanel.hidden = !isVisible;
}

function syncMenu() {
  const soundText = soundOn ? "Sound: On" : "Sound: Off";

  document.body.classList.toggle("classic-mode", isClassicMode());
  hudLabels.score.textContent = isClassicMode() ? "Brains" : "Souls Eaten";
  hudLabels.highScore.textContent = isClassicMode() ? "Best" : "Best Curse";
  hudLabels.stage.textContent = isClassicMode() ? "Mode" : "Horror Zone";
  hudLabels.streak.textContent = isClassicMode() ? "Length" : "Streak";
  hudLabels.dread.textContent = isClassicMode() ? "Rules" : "Dread";
  muteBtn.textContent = soundText;
  muteBtn.setAttribute("aria-pressed", String(soundOn));
  menuSoundBtn.textContent = soundText;
  menuSoundBtn.classList.toggle("is-active", soundOn);
  menuSoundBtn.setAttribute("aria-pressed", String(soundOn));
  motionBtn.textContent = (reducedMotion || window.ArcadeUX.motionReduced()) ? "Motion: Low" : "Motion: Full";
  motionBtn.classList.toggle("is-active", reducedMotion || window.ArcadeUX.motionReduced());
  motionBtn.setAttribute("aria-pressed", String(reducedMotion || window.ArcadeUX.motionReduced()));
  motionBtn.disabled = window.ArcadeUX.motionReduced();
  resetBestBtn.textContent = "Reset " + getDifficulty().label + " best";
  motionBtn.title = window.ArcadeUX.motionReduced() ? "Reduced motion is enabled in Arcade settings or on your device." : "Toggle this cabinet's motion effects.";
  mobilePauseBtn.textContent = gameState === "paused" ? "Resume" : "Pause";
  mobilePauseBtn.setAttribute("aria-pressed", String(gameState === "paused"));
  mobilePauseBtn.disabled = !(gameState === "running" || gameState === "paused");
  document.getElementById("restartPaused").hidden = gameState !== "paused";
  difficultyDescriptionEl.textContent = getDifficulty().description;

  difficultyButtons.forEach((button) => {
    const isActive = button.dataset.difficulty === difficultyKey;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function resetGame(startDirectionName = "right") {
  const center = Math.floor(GRID_SIZE / 2);
  const startDirection = directionFromName(startDirectionName);

  snake = [
    { x: center, y: center },
    { x: center - startDirection.x, y: center - startDirection.y },
    { x: center - startDirection.x * 2, y: center - startDirection.y * 2 },
    { x: center - startDirection.x * 3, y: center - startDirection.y * 3 }
  ];

  direction = startDirection;
  pendingDirection = startDirection;
  inputQueue = [];
  obstacles = [];
  score = 0;
  streak = 0;
  dread = 0;
  seals = 0;
  ritualIndex = 0;
  ritualProgress = 0;
  mutations = [];
  coilCharges = 0;
  armorCharges = 0;
  shedCharges = 0;
  pendingMutationChoices = [];
  nextMutationPickup = MUTATION_PICKUP_INTERVAL;
  venomTrail = [];
  runStats = {
    pickups: 0,
    brains: 0,
    relics: 0,
    phasePickups: 0,
    dreadEarned: 0,
    maxStreak: 0,
    mutationsUsed: 0,
    shadesKilled: 0,
    vowsCompleted: 0
  };
  activeVows = isClassicMode() ? [] : chooseBloodVows();
  comboExpiresAt = 0;
  pendingGrowth = 0;
  relic = null;
  sigil = null;
  exitGate = null;
  screenShake = 0;
  phaseUntil = 0;
  phaseMeterDuration = PHASE_DURATION;
  dreadSurgeUntil = 0;
  particles = [];
  floaters = [];
  stageMessage = "";
  stageMessageUntil = 0;
  lastHeartbeatAt = 0;
  activeEvent = null;
  nextEventAt = 0;
  nearMissCells = new Set();
  food = createFood();
  eatFlash = 0;
  lastFrameTime = 0;
  moveAccumulator = 0;
  runStartedAt = 0;
  runEndedAt = 0;
  suspendedAt = 0;
  runPausedDuration = 0;
  lastStageName = getCurrentStage().name;

  updateHud();
}

function startGame(startDirectionName = "right") {
  prepareRunFlavor();
  resetGame(startDirectionName);
  const dailyBoost = window.ArcadeDailyRewards?.consumeBoost("horror-snake", boost => boost.id !== "dread" || !isClassicMode());
  if (dailyBoost?.id === "armor") armorCharges += dailyBoost.amount;
  if (dailyBoost?.id === "coil") coilCharges += dailyBoost.amount;
  if (dailyBoost?.id === "dread") dread += dailyBoost.amount;
  applyDeveloperModeLoadout(performance.now());
  runStartedAt = performance.now();
  createObstacles();
  gameState = "running";
  scheduleNextEvent(performance.now());
  overlayTitle.textContent = GAME_TITLE;
  overlayText.textContent = "";
  startBtn.textContent = "Start Run";
  startBtn.hidden = false;
  pactPanel.hidden = true;
  setMenuVisible(false);
  setTitleScreenActive(false);
  setOverlayHidden(true);
  syncMenu();
  playSound("start");
  if (dailyBoost) showEventMessage(`Daily Offering: ${dailyBoost.label}`, performance.now());
}

function applyDeveloperModeLoadout(now) {
  if (!isDeveloperMode() || isClassicMode()) return;

  mutations = BODY_MUTATIONS.map((mutation) => mutation.id);
  coilCharges = Math.max(coilCharges, 99);
  armorCharges = Math.max(armorCharges, 99);
  shedCharges = Math.max(shedCharges, 99);
  nextMutationPickup = Number.POSITIVE_INFINITY;
  phaseUntil = now + PHASE_DURATION + 2200;
  phaseMeterDuration = PHASE_DURATION + 2200;
}

function setReadyOverlay() {
  overlayTitle.textContent = GAME_TITLE;
  overlayText.textContent = isClassicMode() ? CLASSIC_READY_COPY : READY_COPY;
  startBtn.textContent = "Start Run";
  startBtn.hidden = false;
  pactPanel.hidden = true;
  setMenuVisible(true);
  setTitleScreenActive(true);
  setOverlayHidden(false);
  syncMenu();
}

function pauseGame() {
  if (gameState !== "running") return;

  gameState = "paused";
  suspendedAt = performance.now();

  overlayTitle.textContent = "Paused";
  overlayText.textContent = "Space, P, or Escape resumes";
  startBtn.textContent = "Resume";
  startBtn.hidden = false;
  pactPanel.hidden = true;
  setMenuVisible(false);
  setTitleScreenActive(false);
  setOverlayHidden(false);
  syncMenu();
}

function resumeGame() {
  if (gameState !== "paused") return;

  resumeSuspendedRun(performance.now());
  gameState = "running";
  setTitleScreenActive(false);
  setOverlayHidden(true);
  syncMenu();
}

function togglePauseFromControl() {
  if (gameState === "running") {
    pauseGame();
  } else if (gameState === "paused") {
    resumeGame();
  }
}

function pauseForBackground() {
  if ((document.hidden || !document.hasFocus()) && gameState === "running") {
    pauseGame();
  }
}

function resumeSuspendedRun(now) {
  if (!suspendedAt) return;

  const duration = Math.max(0, now - suspendedAt);
  comboExpiresAt = shiftDeadline(comboExpiresAt, duration);
  phaseUntil = shiftDeadline(phaseUntil, duration);
  dreadSurgeUntil = shiftDeadline(dreadSurgeUntil, duration);
  stageMessageUntil = shiftDeadline(stageMessageUntil, duration);
  nextEventAt = shiftDeadline(nextEventAt, duration);

  if (relic) {
    relic.expiresAt = shiftDeadline(relic.expiresAt, duration);
  }

  if (activeEvent) {
    activeEvent.startedAt = shiftDeadline(activeEvent.startedAt, duration);
    activeEvent.armedAt = shiftDeadline(activeEvent.armedAt, duration);
    activeEvent.endsAt = shiftDeadline(activeEvent.endsAt, duration);
    activeEvent.nextTickAt = shiftDeadline(activeEvent.nextTickAt, duration);
  }

  venomTrail.forEach((cell) => {
    cell.expiresAt = shiftDeadline(cell.expiresAt, duration);
  });

  runPausedDuration += duration;
  moveAccumulator = 0;
  lastFrameTime = now;
  suspendedAt = 0;
}

function shiftDeadline(deadline, duration) {
  return deadline ? deadline + duration : deadline;
}

function handlePactChoice(event) {
  const button = event.target.closest("[data-pact]");
  if (!button || gameState !== "choosing") return;

  growMutation(button.dataset.pact);
}

function offerMutation(now) {
  const unbound = BODY_MUTATIONS.filter((mutation) => !mutations.includes(mutation.id));
  if (unbound.length === 0) return;

  pendingMutationChoices = shuffleList(unbound).slice(0, Math.min(3, unbound.length));
  suspendedAt = now;
  gameState = "choosing";
  overlayTitle.textContent = "Flesh Warps";
  overlayText.textContent = "The feeding reshapes you. Choose what your body becomes.";
  startBtn.hidden = true;
  setMenuVisible(false);
  pactPanel.hidden = false;
  renderPactChoices();
  setTitleScreenActive(false);
  setOverlayHidden(false);
  updateHud();
}

function shuffleList(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function chooseBloodVows() {
  const difficulty = getDifficulty();
  const pool = BLOOD_VOWS.filter((vow) => !vow.requiresEvents || difficulty.events);

  return shuffleList(pool)
    .slice(0, BLOOD_VOW_COUNT)
    .map((vow) => ({
      ...vow,
      completed: false,
      claimedAt: 0
    }));
}

function renderPactChoices() {
  const choices = pendingMutationChoices.map((mutation) => {
    const button = document.createElement("button");
    const title = document.createElement("strong");
    const description = document.createElement("span");

    button.className = "pact-choice";
    button.type = "button";
    button.dataset.pact = mutation.id;
    title.textContent = mutation.name;
    description.textContent = mutation.description;
    button.append(title, description);
    return button;
  });

  pactChoicesEl.replaceChildren(...choices);
}

function growMutation(mutationId) {
  const mutation = BODY_MUTATIONS.find((item) => item.id === mutationId);
  if (!mutation || !pendingMutationChoices.some((item) => item.id === mutationId)) return;

  const now = performance.now();
  mutations.push(mutation.id);
  coilCharges += mutation.coilCharges || 0;
  armorCharges += mutation.armorCharges || 0;
  shedCharges += mutation.shedCharges || 0;
  pendingMutationChoices = [];
  resumeSuspendedRun(now);
  activatePhase(now, SIGIL_PHASE_DURATION);
  showEventMessage(`${mutation.name} Grown`, now);
  spawnBurst(snake[0], "#ff244a", 24, now);
  screenShake = Math.max(screenShake, 4);
  playSound("mutation");

  gameState = "running";
  pactPanel.hidden = true;
  startBtn.hidden = false;
  setTitleScreenActive(false);
  setOverlayHidden(true);
  checkBloodVows(now);
  updateHud();
}

function getMutationBonus(property) {
  return mutations.reduce((total, mutationId) => {
    const mutation = BODY_MUTATIONS.find((item) => item.id === mutationId);
    return total + (mutation && mutation[property] ? mutation[property] : 0);
  }, 0);
}

function hasMutation(mutationId) {
  return mutations.includes(mutationId);
}

function getPickupRange() {
  return getMutationBonus("pickupRange");
}

function getDreadTarget() {
  return DREAD_BONUS_TARGET;
}

function getRunSummary(now) {
  const activeSeconds = Math.max(1, Math.round((now - runStartedAt - runPausedDuration) / 1000));

  if (isClassicMode()) {
    return `Score ${score} | Length ${snake.length} | Brains ${runStats.brains} | ${activeSeconds}s | Best ${Math.max(highScore, score)}.`;
  }

  const vowCount = activeVows ? activeVows.filter((vow) => vow.completed).length : 0;
  const mutationNames = mutations.length
    ? mutations
        .map((mutationId) => BODY_MUTATIONS.find((item) => item.id === mutationId).name)
        .join(", ")
    : "none";

  return `Score ${score} | Seals ${seals}/${RITUALS.length} | Vows ${vowCount}/${BLOOD_VOW_COUNT} | ${activeSeconds}s | Pickups ${runStats.pickups} | Brains ${runStats.brains} | Relics ${runStats.relics} | Shades melted ${runStats.shadesKilled} | Best streak ${runStats.maxStreak}x | Dread ${runStats.dreadEarned} | Mutations: ${mutationNames}.`;
}

function gameOver(cause = "The dark closed in.", now = performance.now()) {
  if (preventDeveloperDeath(cause, now)) return;

  gameState = "dead";
  runEndedAt = now;
  screenShake = 11;
  phaseUntil = 0;
  dreadSurgeUntil = 0;
  spawnBurst(snake[0], "#ff244a", 34, now);
  haptic([30, 40, 45]);
  playSound("death");
  commitCareerStats(false);

  if (score > highScore) {
    highScore = score;
    setStorageItem(getHighScoreKey(), highScore);
  }

  updateHud();
  submitNationalScore(score);

  overlayTitle.textContent = isClassicMode() ? "Game Over" : "Run Ended";
  overlayText.textContent = `${cause} ${getRunSummary(now)}`;
  startBtn.textContent = "Try Again";
  startBtn.hidden = false;
  pactPanel.hidden = true;
  setMenuVisible(true);
  setTitleScreenActive(false);
  setOverlayHidden(false);
  syncMenu();
}

function preventDeveloperDeath(cause, now) {
  if (!window.ArcadeDeveloperMode?.preventDeath?.(NATIONAL_GAME_ID, cause)) return false;

  const center = Math.floor(GRID_SIZE / 2);
  const startDirection = directionFromName("right");
  const length = Math.max(4, Math.min(snake.length, 12));
  snake = Array.from({ length }, (_, index) => ({
    x: center - startDirection.x * index,
    y: center
  }));
  direction = startDirection;
  pendingDirection = startDirection;
  inputQueue = [];
  phaseUntil = now + PHASE_DURATION + 2600;
  phaseMeterDuration = PHASE_DURATION + 2600;
  dreadSurgeUntil = now + DREAD_SURGE_DURATION;
  activeEvent = null;
  screenShake = Math.max(screenShake, 7);
  coilCharges = Math.max(coilCharges, isClassicMode() ? 0 : 99);
  armorCharges = Math.max(armorCharges, isClassicMode() ? 0 : 99);
  shedCharges = Math.max(shedCharges, isClassicMode() ? 0 : 99);
  spawnBurst(snake[0], "#83ff9d", 28, now);
  spawnFloater(snake[0], "DEV SAVE", "#c4fff6", now);
  haptic([12, 20, 12]);
  playSound("relic");
  updateHud();
  return true;
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
  if (key === "escape" && !trophyPanel.hidden) {
    event.preventDefault();
    trophyPanel.hidden = true;
    trophiesBtn.setAttribute("aria-expanded", "false");
    trophiesBtn.focus();
    return;
  }

  const interactiveTarget = event.target instanceof Element
    ? event.target.closest("button, input, select, textarea, summary, a, [role='button'], [contenteditable='true']")
    : null;
  if (interactiveTarget && (event.key === "Enter" || event.key === " ")) return;

  const directionName = directionNameFromKey(key);

  if (
    ["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d", "q", "e", " "].includes(key)
  ) {
    event.preventDefault();
  }

  if (key === "r" && gameState !== "choosing") {
    event.preventDefault();
    startGame();
    return;
  }

  if (key === "enter" && (gameState === "ready" || gameState === "dead" || gameState === "escaped")) {
    startGame();
    return;
  }

  if (directionName && (gameState === "ready" || gameState === "dead" || gameState === "escaped")) {
    startGame(directionName);
    return;
  }

  if (key === "p" || key === "escape") {
    event.preventDefault();
    if (gameState === "running") {
      pauseGame();
    } else if (gameState === "paused") {
      resumeGame();
    }
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

  if ((key === "q" || key === "e") && gameState === "running") {
    queueDirectionFromTurn(key === "q" ? -1 : 1);
    return;
  }

  if (key === "m") {
    toggleSound();
    return;
  }

  if (directionName) queueDirection(directionName);
}

function directionNameFromKey(key) {
  if (key === "arrowup" || key === "w") return "up";
  if (key === "arrowdown" || key === "s") return "down";
  if (key === "arrowleft" || key === "a") return "left";
  if (key === "arrowright" || key === "d") return "right";
  return "";
}

function handlePointerDown(event) {
  if (gameState !== "running") return;

  event.preventDefault();
  touchStart = {
    x: event.clientX,
    y: event.clientY
  };
}

function handlePointerUp(event) {
  if (gameState !== "running" || !touchStart) {
    clearPointerStart();
    return;
  }

  event.preventDefault();

  const deltaX = event.clientX - touchStart.x;
  const deltaY = event.clientY - touchStart.y;
  const distance = Math.hypot(deltaX, deltaY);

  if (distance >= 24) {
    queueDirectionFromDelta(deltaX, deltaY);
  } else {
    queueDirectionFromTap(event.clientX, event.clientY);
  }

  clearPointerStart();
}

function clearPointerStart() {
  touchStart = null;
}

function queueDirectionFromDelta(deltaX, deltaY) {
  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    queueDirection(deltaX > 0 ? "right" : "left");
  } else {
    queueDirection(deltaY > 0 ? "down" : "up");
  }
}

function queueDirectionFromTap(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = clientX - rect.left - rect.width / 2;
  const y = clientY - rect.top - rect.height / 2;

  queueDirectionFromDelta(x, y);
}

function queueDirectionFromTurn(turn) {
  const base = inputQueue.length > 0 ? inputQueue[inputQueue.length - 1] : pendingDirection;
  const turned = turn < 0
    ? { x: base.y, y: -base.x }
    : { x: -base.y, y: base.x };
  queueDirection(directionNameFromVector(turned));
}

function queueDirection(dir) {
  if (gameState !== "running") return;

  const newDirection = directionFromName(dir);
  const lastQueued = inputQueue.length > 0 ? inputQueue[inputQueue.length - 1] : pendingDirection;

  if (isReverse(newDirection, lastQueued)) return;
  if (newDirection.x === lastQueued.x && newDirection.y === lastQueued.y) return;
  if (inputQueue.length >= 2) return;
  inputQueue.push(newDirection);
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

  updateHorrorEvent(now);
  maybePlayHeartbeat(now);

  venomTrail = venomTrail.filter((cell) => now < cell.expiresAt);
  resolveVenomEnemyHit(now);

  if (!isPhaseActive(now) && hitEventHazard(snake[0], now)) {
    if (!consumeShedSkin("curse", now)) {
      gameOver("A waking curse consumed you.", now);
      return;
    }
  }

  if (!isPhaseActive(now) && hasMutation("second-head") && hitEventHazard(snake[snake.length - 1], now)) {
    if (!consumeShedSkin("second head", now)) {
      gameOver("Your second head was swallowed by a curse.", now);
      return;
    }
  }

  if (gameState !== "running") {
    return;
  }

  if (inputQueue.length > 0) {
    const next = inputQueue.shift();

    if (!isReverse(next, direction)) {
      direction = next;
      pendingDirection = next;
    }
  }

  const head = snake[0];
  let nextHead = {
    x: head.x + direction.x,
    y: head.y + direction.y
  };

  if (isPhaseActive(now)) {
    nextHead = wrapPosition(nextHead);
  }

  const willEatFood = isPickupWithinReach(nextHead, food);
  const willEatRelic = relic && isPickupWithinReach(nextHead, relic);
  const willEatSigil = sigil && isPickupWithinReach(nextHead, sigil);
  const willEscape = exitGate && isSameCell(nextHead, exitGate);
  const ignoreTail = !willEatFood && !willEatRelic && !willEatSigil && !willEscape && pendingGrowth === 0;
  const hitsWall = !isPhaseActive(now) && hitWall(nextHead);
  const hitsObstacle = !isPhaseActive(now) && hitObstacle(nextHead);
  const hitsEvent = !isPhaseActive(now) && hitEventHazard(nextHead, now);
  const hitsSelf = hitSnake(nextHead, ignoreTail);

  if (hitsSelf) {
    if (!consumeRottenCoil(now) && !consumeShedSkin("self", now)) {
      gameOver("You fed upon your own tail.", now);
      return;
    }
  }

  if (hitsWall || hitsObstacle || hitsEvent) {
    if (hitsWall && consumeBoneArmor(now)) {
      if (hitsWall) {
        nextHead = wrapPosition(nextHead);

        if (hitSnake(nextHead, ignoreTail)) {
          gameOver("Your shattered armor cast you into your own coils.", now);
          return;
        }
      }
    } else if (consumeShedSkin(hitsWall ? "wall" : hitsObstacle ? "grave marker" : "curse", now)) {
      if (hitsWall) {
        nextHead = wrapPosition(nextHead);
      }
    } else {
      const cause = hitsWall
        ? isClassicMode()
          ? "You hit the wall."
          : "You struck the edge of the ritual."
        : hitsObstacle
          ? "A grave marker ended the hunt."
          : "A waking curse consumed you.";
      gameOver(cause, now);
      return;
    }
  }

  if (gameState !== "running") {
    return;
  }

  snake.unshift(nextHead);
  evaluateNearMiss(nextHead, now);

  let growth = 0;

  if (willEatFood) {
    growth += handleFoodEaten(now);
    if (gameState !== "running") {
      return;
    }
    createObstacles();
  }

  if (willEatRelic) {
    growth += handleRelicEaten(now);
  }

  if (willEatSigil) {
    growth += handleSigilEaten(now);
  }

  if (willEscape) {
    completeEscape(now);
    return;
  }

  maybeOfferMutation(now);

  if (growth > 0) {
    pendingGrowth += growth - 1;
  } else if (pendingGrowth > 0) {
    pendingGrowth -= 1;
  } else {
    const shedCell = snake.pop();
    layVenomTrail(shedCell, now);
  }

  resolveVenomEnemyHit(now);
}

function directionNameFromVector(vector) {
  if (vector.y < 0) return "up";
  if (vector.y > 0) return "down";
  if (vector.x < 0) return "left";
  return "right";
}

function isPickupWithinReach(head, pickup) {
  if (!pickup) return false;

  return Math.abs(head.x - pickup.x) + Math.abs(head.y - pickup.y) <= getPickupRange();
}

function consumeRottenCoil(now) {
  if (coilCharges <= 0) return false;

  coilCharges -= 1;
  runStats.mutationsUsed += 1;
  activatePhase(now, WARD_PHASE_DURATION);
  showEventMessage("Rotten Coil Bursts", now);
  spawnBurst(snake[0], "#83ff9d", 24, now);
  spawnFloater(snake[0], "COIL RUPTURED", "#83ff9d", now);
  playSound("mutation-use");
  checkBloodVows(now);
  updateHud();
  return true;
}

function consumeBoneArmor(now) {
  if (armorCharges <= 0) return false;

  armorCharges -= 1;
  runStats.mutationsUsed += 1;
  activatePhase(now, WARD_PHASE_DURATION);
  screenShake = Math.max(screenShake, 8);
  spawnBurst(snake[0], "#83ff9d", 30, now);
  spawnFloater(snake[0], "ARMOR BROKEN", "#c4fff6", now);
  showEventMessage("Bone Armor Shattered", now);
  playSound("mutation-use");
  checkBloodVows(now);
  updateHud();
  return true;
}

function consumeShedSkin(cause, now) {
  if (shedCharges <= 0) return false;

  shedCharges -= 1;
  runStats.mutationsUsed += 1;
  const retainedLength = Math.max(2, Math.ceil(snake.length / 2));
  snake = snake.slice(0, retainedLength);
  pendingGrowth = 0;
  activeEvent = null;
  activatePhase(now, SHED_PHASE_DURATION);
  screenShake = Math.max(screenShake, 9);
  spawnBurst(snake[0], "#ff7a90", 36, now);
  spawnFloater(snake[0], "SKIN SHED", "#ffd2ca", now);
  showEventMessage(`Shed Skin: ${cause}`, now);
  playSound("mutation-use");
  checkBloodVows(now);
  updateHud();
  return true;
}

function layVenomTrail(cell, now) {
  if (!cell || !hasMutation("venom-trail")) return;

  venomTrail.push({ ...cell, expiresAt: now + VENOM_TRAIL_DURATION });
  if (venomTrail.length > 18) {
    venomTrail.shift();
  }
}

function resolveVenomEnemyHit(now) {
  if (!activeEvent || activeEvent.type !== "shade" || !hasMutation("venom-trail")) return;
  if (!venomTrail.some((cell) => isSameCell(cell, activeEvent.cell))) return;

  const killedCell = activeEvent.cell;
  activeEvent = null;
  score += 2;
  runStats.shadesKilled += 1;
  scheduleNextEvent(now);
  spawnBurst(killedCell, "#83ff9d", 26, now);
  spawnFloater(killedCell, "+2 MELTED", "#83ff9d", now);
  showEventMessage("Shade Dissolved", now);
  playSound("venom");
  checkBloodVows(now);
  updateHud();
}

function hitWall(pos) {
  return pos.x < 0 || pos.x >= GRID_SIZE || pos.y < 0 || pos.y >= GRID_SIZE;
}

function wrapPosition(pos) {
  return {
    x: (pos.x + GRID_SIZE) % GRID_SIZE,
    y: (pos.y + GRID_SIZE) % GRID_SIZE
  };
}

function isPhaseActive(time) {
  return phaseUntil && time < phaseUntil;
}

function activatePhase(now, duration) {
  const newDeadline = now + duration;

  if (!phaseUntil || newDeadline >= phaseUntil) {
    phaseUntil = newDeadline;
    phaseMeterDuration = duration;
  }
}

function hitSnake(pos, ignoreTail = false) {
  const body = ignoreTail ? snake.slice(0, -1) : snake;
  return body.some((part) => isSameCell(part, pos));
}

function hitObstacle(pos) {
  return obstacles.some((obstacle) => isSameCell(obstacle, pos));
}

function hitEventHazard(pos, time = performance.now(), includeWarnings = false) {
  if (!activeEvent) return false;
  if (!includeWarnings && !isEventArmed(activeEvent, time)) return false;

  return getEventCells(activeEvent).some((cell) => isSameCell(cell, pos));
}

function getEventCells(event = activeEvent) {
  if (!event) return [];
  if (event.type === "shade") return [event.cell];
  if (event.type === "curse" || event.type === "rift") return event.cells;
  return [];
}

function isEventArmed(event = activeEvent, time = performance.now()) {
  return Boolean(event && (!event.armedAt || time >= event.armedAt));
}

function getEventWarningRatio(event, time) {
  if (!event || !event.armedAt || !event.startedAt || time >= event.armedAt) return 1;

  const duration = Math.max(1, event.armedAt - event.startedAt);
  return Math.max(0, Math.min(1, (time - event.startedAt) / duration));
}

function isSameCell(a, b) {
  return Boolean(a && b && a.x === b.x && a.y === b.y);
}

function createFood() {
  const cell = createOpenCell([relic, sigil, exitGate]);
  if (!cell) return null;

  return {
    ...cell,
    pulseOffset: Math.random() * Math.PI * 2
  };
}

function createRelic(now) {
  const cell = createOpenCell([food, sigil, exitGate]);
  if (!cell) return null;

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

  return null;
}

function isCellBlocked(pos, extraBlocked = []) {
  return (
    snake.some((part) => isSameCell(part, pos)) ||
    obstacles.some((obstacle) => isSameCell(obstacle, pos)) ||
    isSameCell(pos, sigil) ||
    isSameCell(pos, exitGate) ||
    hitEventHazard(pos, performance.now(), true) ||
    extraBlocked.some((item) => isSameCell(item, pos))
  );
}

function handleFoodEaten(now) {
  const eatenFood = food;
  const wasPhasing = isPhaseActive(now);
  let streakBonus = 0;

  if (isClassicMode()) {
    streak = score + 1;
    comboExpiresAt = 0;
  } else {
    updateStreak(now);
    streakBonus = Math.min(3, Math.floor(streak / 3));
  }

  const points = isClassicMode() ? 1 : 1 + streakBonus;
  score += points;
  runStats.pickups += 1;
  runStats.brains += 1;
  if (wasPhasing) runStats.phasePickups += 1;
  runStats.maxStreak = Math.max(runStats.maxStreak, streak);
  eatFlash = 1;
  screenShake = Math.max(screenShake, 2.5 + streakBonus);
  spawnBurst(eatenFood, streakBonus > 0 ? "#ffd66f" : "#ff244a", 12 + streakBonus * 4, now);
  spawnFloater(eatenFood, `+${points}`, streakBonus > 0 ? "#ffd66f" : "#ff7a90", now);
  haptic(streakBonus > 0 ? [8, 14, 8] : 8);
  food = createFood();

  if (isClassicMode() && !food) {
    completeClassicBoard(now);
    return 1;
  }

  if (!isClassicMode()) {
    advanceRitualProgress("brains", 1, now);
    advanceRitualProgress("streak", streak, now);
    maybeSpawnRelic(now);
  }

  playSound(streakBonus > 0 ? "bonus" : "eat");
  checkBloodVows(now);
  updateHud();

  return 1;
}

function completeClassicBoard(now) {
  gameState = "escaped";
  runEndedAt = now;
  screenShake = 8;
  spawnBurst(snake[0], "#83ff9d", 46, now);
  spawnFloater(snake[0], "BOARD CLEARED", "#83ff9d", now);
  commitCareerStats(false);

  if (score > highScore) {
    highScore = score;
    setStorageItem(getHighScoreKey(), highScore);
  }

  updateHud();
  submitNationalScore(score);

  overlayTitle.textContent = "Board Cleared";
  overlayText.textContent = getRunSummary(now);
  startBtn.textContent = "Play Again";
  startBtn.hidden = false;
  pactPanel.hidden = true;
  setMenuVisible(true);
  setTitleScreenActive(false);
  setOverlayHidden(false);
  syncMenu();
  playSound("sigil");
}

function handleRelicEaten(now) {
  const eatenRelic = relic;
  const wasPhasing = isPhaseActive(now);
  updateStreak(now);

  const relicBonus = 3 + Math.min(4, Math.floor(streak / 2)) + getMutationBonus("relicScoreBonus");
  score += relicBonus;
  runStats.pickups += 1;
  runStats.relics += 1;
  if (wasPhasing) runStats.phasePickups += 1;
  runStats.maxStreak = Math.max(runStats.maxStreak, streak);
  eatFlash = 1.4;
  screenShake = Math.max(screenShake, 7);
  activatePhase(now, PHASE_DURATION + getMutationBonus("phaseBonus"));
  spawnBurst(eatenRelic, "#ffd66f", 28, now);
  spawnFloater(eatenRelic, `+${relicBonus} PHASE`, "#ffd66f", now);
  haptic([12, 20, 12]);
  relic = null;

  advanceRitualProgress("relics", 1, now);
  playSound("relic");
  checkBloodVows(now);
  updateHud();

  return 2;
}

function handleSigilEaten(now) {
  const eatenSigil = sigil;
  const wasPhasing = isPhaseActive(now);
  const points = SIGIL_SCORE + seals * 2;

  seals += 1;
  score += points;
  runStats.pickups += 1;
  if (wasPhasing) runStats.phasePickups += 1;
  sigil = null;
  ritualIndex += 1;
  ritualProgress = 0;
  eatFlash = 1.5;
  screenShake = Math.max(screenShake, 8);
  spawnBurst(eatenSigil, "#c996ff", 34, now);
  spawnFloater(eatenSigil, `+${points} SIGIL`, "#ddc8ff", now);
  haptic([16, 24, 16]);
  playSound("sigil");

  if (ritualIndex >= RITUALS.length) {
    exitGate = createOpenCell([food, relic]);
    showEventMessage("The Exit Opens", now);
  } else {
    showEventMessage("Seal Claimed", now);
  }

  checkBloodVows(now);
  updateHud();
  return 2;
}

function checkBloodVows(now) {
  if (!activeVows || gameState === "ready" || gameState === "dead" || gameState === "escaped") return;

  for (const vow of activeVows) {
    if (!vow.completed && getBloodVowProgress(vow) >= vow.target) {
      completeBloodVow(vow, now);
    }
  }
}

function getBloodVowProgress(vow) {
  return Math.max(0, Math.min(vow.target, vow.progress ? vow.progress() : 0));
}

function completeBloodVow(vow, now) {
  vow.completed = true;
  vow.claimedAt = now;
  score += vow.points;
  runStats.vowsCompleted += 1;
  coilCharges += vow.coilCharges || 0;
  armorCharges += vow.armorCharges || 0;
  shedCharges += vow.shedCharges || 0;

  if (vow.phaseDuration) {
    activatePhase(now, vow.phaseDuration);
  }

  if (vow.dreadSurge) {
    dreadSurgeUntil = Math.max(dreadSurgeUntil || 0, now + DREAD_SURGE_DURATION);
  }

  if (vow.spawnRelic && !relic) {
    relic = createRelic(now);
  }

  screenShake = Math.max(screenShake, 5.5);
  spawnBurst(snake[0], "#ffd66f", 24, now);
  spawnFloater(snake[0], `VOW +${vow.points}`, "#ffd66f", now);
  haptic([14, 22, 14]);
  showEventMessage(`${vow.name} Fulfilled`, now);
  playSound("vow");
}

function maybeOfferMutation(now) {
  if (isClassicMode()) return;
  if (runStats.pickups < nextMutationPickup || mutations.length >= BODY_MUTATIONS.length) return;

  nextMutationPickup += MUTATION_PICKUP_INTERVAL;
  offerMutation(now);
}

function completeEscape(now) {
  score += ESCAPE_SCORE;
  gameState = "escaped";
  runEndedAt = now;
  activeEvent = null;
  phaseUntil = 0;
  dreadSurgeUntil = 0;
  screenShake = 10;
  spawnBurst(exitGate, "#c4fff6", 46, now);
  spawnFloater(exitGate, `+${ESCAPE_SCORE} ESCAPED`, "#c4fff6", now);
  haptic([20, 35, 20]);
  playSound("escape");
  commitCareerStats(true);

  if (score > highScore) {
    highScore = score;
    setStorageItem(getHighScoreKey(), highScore);
  }

  updateHud();
  submitNationalScore(score);
  overlayTitle.textContent = "Ritual Broken";
  overlayText.textContent = `You escaped the hunting dark. ${getRunSummary(now)} Best ${highScore}.`;
  startBtn.textContent = "Descend Again";
  startBtn.hidden = false;
  pactPanel.hidden = true;
  setMenuVisible(true);
  setTitleScreenActive(false);
  setOverlayHidden(false);
  syncMenu();
}

function evaluateNearMiss(cell, now) {
  if (isClassicMode()) return;
  const phasing = isPhaseActive(now);
  if (willCollectReward(cell) || !isNearDanger(cell, now)) return;

  const key = `${cell.x},${cell.y}`;
  if (nearMissCells.has(key)) return;

  nearMissCells.add(key);
  trimNearMissMemory();

  dread += 1;
  runStats.dreadEarned += 1;
  screenShake = Math.max(screenShake, phasing ? 0.8 : 1.4);
  if (phasing) {
    phaseUntil = Math.min(phaseUntil + 110, now + PHASE_DURATION + 900);
  }
  const dreadColor = phasing ? "#ffd66f" : "#83ff9d";
  spawnBurst(cell, dreadColor, phasing ? 9 : 5, now);
  spawnFloater(cell, phasing ? "PHASE +Dread" : "+Dread", dreadColor, now);
  advanceRitualProgress("dread", 1, now);

  if (dread >= getDreadTarget()) {
    dread = 0;
    dreadSurgeUntil = now + DREAD_SURGE_DURATION;
    score += 1;
    stageMessage = "Dread Surge";
    stageMessageUntil = now + 1100;
    screenShake = Math.max(screenShake, 4.5);
    spawnBurst(cell, "#83ff9d", 22, now);
    spawnFloater(cell, "SURGE", "#c4fff6", now);
    playSound("bonus");
  }

  checkBloodVows(now);
  updateHud();
}

function willCollectReward(cell) {
  return (
    isPickupWithinReach(cell, food) ||
    isPickupWithinReach(cell, relic) ||
    isPickupWithinReach(cell, sigil) ||
    isSameCell(cell, exitGate)
  );
}

function advanceRitualProgress(type, amount, now) {
  const ritual = RITUALS[ritualIndex];
  if (!ritual || sigil || exitGate || ritual.type !== type) return;

  if (type === "streak") {
    ritualProgress = Math.max(ritualProgress, amount);
  } else {
    ritualProgress += amount;
  }

  if (ritualProgress >= ritual.target) {
    ritualProgress = ritual.target;
    sigil = createOpenCell([food, relic]);
    showEventMessage("Sigil Manifested", now);
    screenShake = Math.max(screenShake, 5);
    spawnBurst(sigil, "#c996ff", 24, now);
    playSound("event");
  }

  updateHud();
}

function trimNearMissMemory() {
  while (nearMissCells.size > DREAD_MEMORY_LIMIT) {
    const oldest = nearMissCells.values().next().value;
    nearMissCells.delete(oldest);
  }
}

function isNearDanger(cell, now) {
  const neighbors = getAdjacentCells(cell);

  return neighbors.some((neighbor) => {
    if (!isPhaseActive(now) && hitWall(neighbor)) return true;
    if (hitObstacle(neighbor)) return true;
    if (hitEventHazard(neighbor, now)) return true;
    return snake.slice(2).some((part) => isSameCell(part, neighbor));
  });
}

function getAdjacentCells(cell) {
  return [
    { x: cell.x + 1, y: cell.y },
    { x: cell.x - 1, y: cell.y },
    { x: cell.x, y: cell.y + 1 },
    { x: cell.x, y: cell.y - 1 }
  ];
}

function updateStreak(now) {
  streak = comboExpiresAt && now <= comboExpiresAt ? streak + 1 : 1;
  comboExpiresAt = now + getComboWindow();
}

function maybeSpawnRelic(now) {
  if (isClassicMode()) return;
  if (relic || score < RELIC_MIN_SCORE) return;

  const streakBoost = Math.min(0.08, streak * 0.008);
  const chance = runOmen.relicChance + streakBoost + getDifficulty().relicBonus;

  if (Math.random() <= chance) {
    relic = createRelic(now);
  }
}

function getComboWindow() {
  const baseWindow = runOmen ? runOmen.comboWindow : 4200;
  return Math.round(baseWindow * getDifficulty().comboScale);
}

function spawnBurst(cell, color, count, now) {
  if (!cell) return;

  const originX = cell.x * TILE + TILE / 2;
  const originY = cell.y * TILE + TILE / 2;
  const particleCount = (reducedMotion || window.ArcadeUX.motionReduced()) ? Math.ceil(count * 0.45) : count;

  for (let i = 0; i < particleCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.04 + Math.random() * 0.12;

    particles.push({
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 2 + Math.random() * 3,
      bornAt: now,
      duration: 360 + Math.random() * 360,
      color
    });
  }

  if (particles.length > MAX_PARTICLES) {
    particles.splice(0, particles.length - MAX_PARTICLES);
  }
}

function spawnFloater(cell, text, color, now) {
  if (!cell) return;

  floaters.push({
    x: cell.x * TILE + TILE / 2,
    y: cell.y * TILE + TILE / 2,
    text,
    color,
    bornAt: now,
    duration: 820
  });

  if (floaters.length > MAX_FLOATERS) {
    floaters.splice(0, floaters.length - MAX_FLOATERS);
  }
}

function getDesiredObstacleCount() {
  const difficulty = getDifficulty();
  if (score < 6 || difficulty.obstacleScale <= 0) return 0;

  const omenBonus = runOmen ? runOmen.obstacleBonus : 0;
  const baseCount = Math.floor(score / 6) + 1 + omenBonus + difficulty.obstacleBonus;
  return Math.min(difficulty.maxObstacles, Math.ceil(baseCount * difficulty.obstacleScale));
}

function createObstacles() {
  const desiredCount = getDesiredObstacleCount();
  obstacles = obstacles.filter(
    (obstacle) =>
      !snake.some((part) => isSameCell(part, obstacle)) &&
      !isSameCell(obstacle, food) &&
      !isSameCell(obstacle, relic) &&
      !isSameCell(obstacle, sigil) &&
      !isSameCell(obstacle, exitGate) &&
      !hitEventHazard(obstacle, performance.now(), true)
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
    const overlapsSigil = isSameCell(sigil, obstacle);
    const overlapsExit = isSameCell(exitGate, obstacle);
    const overlapsObstacle = obstacles.some((existing) => isSameCell(existing, obstacle));
    const overlapsEvent = hitEventHazard(obstacle, performance.now(), true);

    const tooCloseToHead =
      Math.abs(obstacle.x - head.x) + Math.abs(obstacle.y - head.y) <= 3;

    const tooCloseToSpawn =
      Math.abs(obstacle.x - Math.floor(GRID_SIZE / 2)) +
        Math.abs(obstacle.y - Math.floor(GRID_SIZE / 2)) <=
      3;
    const blocksForwardLane = isInForwardLane(obstacle, 4);

    if (
      !overlapsSnake &&
      !overlapsFood &&
      !overlapsRelic &&
      !overlapsSigil &&
      !overlapsExit &&
      !overlapsObstacle &&
      !overlapsEvent &&
      !tooCloseToHead &&
      !tooCloseToSpawn &&
      !blocksForwardLane
    ) {
      obstacles.push(obstacle);
    }

    attempts += 1;
  }
}

function isInForwardLane(cell, distance) {
  const head = snake[0];

  for (let step = 1; step <= distance; step++) {
    const projected = {
      x: head.x + direction.x * step,
      y: head.y + direction.y * step
    };

    if (isSameCell(cell, projected)) {
      return true;
    }
  }

  return false;
}

function scheduleNextEvent(now) {
  const difficulty = getDifficulty();

  if (!difficulty.events) {
    nextEventAt = 0;
    activeEvent = null;
    return;
  }

  nextEventAt = now + randomRange(difficulty.eventMin, difficulty.eventMax);
}

function updateHorrorEvent(now) {
  const difficulty = getDifficulty();

  if (!difficulty.events) {
    activeEvent = null;
    nextEventAt = 0;
    return;
  }

  if (activeEvent && now > activeEvent.endsAt) {
    activeEvent = null;
    scheduleNextEvent(now);
    return;
  }

  if (activeEvent) {
    if (activeEvent.type === "shade") {
      updateShadeEvent(now);
    }
    return;
  }

  if (score < 5) {
    if (!nextEventAt) scheduleNextEvent(now);
    return;
  }

  if (!nextEventAt) {
    scheduleNextEvent(now);
  }

  if (now >= nextEventAt) {
    startHorrorEvent(now);
  }
}

function startHorrorEvent(now) {
  const shadeChance = difficultyKey === "nightmare" ? 0.58 : 0.44;
  const riftChance = score >= 18 ? (difficultyKey === "nightmare" ? 0.24 : 0.16) : 0;
  const roll = Math.random();
  const type = roll < riftChance ? "rift" : roll < riftChance + shadeChance ? "shade" : "curse";

  if (type === "shade") {
    startShadeEvent(now);
  } else if (type === "rift") {
    startRiftEvent(now);
  } else {
    startCurseEvent(now);
  }
}

function startShadeEvent(now) {
  const cell = createEventCell(6);

  if (!cell) {
    scheduleNextEvent(now);
    return;
  }

  activeEvent = {
    type: "shade",
    cell,
    startedAt: now,
    armedAt: now + EVENT_WARNING_DURATION,
    endsAt: now + (difficultyKey === "nightmare" ? 7800 : 6200),
    nextTickAt: now + EVENT_WARNING_DURATION + 360,
    moveInterval: difficultyKey === "nightmare" ? 520 : 680,
    pulseOffset: Math.random() * Math.PI * 2
  };

  showEventMessage("Shade Stirring", now);
  playSound("event");
}

function startCurseEvent(now) {
  const center = createEventCell(5);

  if (!center) {
    scheduleNextEvent(now);
    return;
  }

  const offsets = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
    { x: 1, y: 1 },
    { x: -1, y: -1 }
  ];

  const cells = offsets
    .map((offset) => ({ x: center.x + offset.x, y: center.y + offset.y }))
    .filter((cell) => !hitWall(cell) && !isCellBlocked(cell));

  if (cells.length === 0) {
    scheduleNextEvent(now);
    return;
  }

  activeEvent = {
    type: "curse",
    cells,
    startedAt: now,
    armedAt: now + EVENT_WARNING_DURATION,
    endsAt: now + (difficultyKey === "nightmare" ? 4400 : 5600),
    pulseOffset: Math.random() * Math.PI * 2
  };

  showEventMessage("Curse Forming", now);
  screenShake = Math.max(screenShake, 3);
  playSound("event");
}

function startRiftEvent(now) {
  const head = snake[0];
  const vertical = Math.random() < 0.5;
  const lane = vertical
    ? clamp(head.x + (Math.random() < 0.5 ? -2 : 2), 1, GRID_SIZE - 2)
    : clamp(head.y + (Math.random() < 0.5 ? -2 : 2), 1, GRID_SIZE - 2);
  const cells = [];

  for (let i = 1; i < GRID_SIZE - 1; i++) {
    const cell = vertical ? { x: lane, y: i } : { x: i, y: lane };
    if (!isCellOccupiedByReward(cell) && !snake.some((part, index) => index < 2 && isSameCell(part, cell))) {
      cells.push(cell);
    }
  }

  if (cells.length === 0) {
    scheduleNextEvent(now);
    return;
  }

  activeEvent = {
    type: "rift",
    cells,
    vertical,
    startedAt: now,
    armedAt: now + RIFT_WARNING_DURATION,
    endsAt: now + (difficultyKey === "nightmare" ? 3600 : 4300),
    pulseOffset: Math.random() * Math.PI * 2
  };

  showEventMessage("Rift Opening", now);
  screenShake = Math.max(screenShake, 4);
  playSound("event");
}

function updateShadeEvent(now) {
  if (!activeEvent || now < activeEvent.nextTickAt) return;
  if (!isEventArmed(activeEvent, now)) return;

  const head = snake[0];
  const candidates = [
    { x: activeEvent.cell.x + 1, y: activeEvent.cell.y },
    { x: activeEvent.cell.x - 1, y: activeEvent.cell.y },
    { x: activeEvent.cell.x, y: activeEvent.cell.y + 1 },
    { x: activeEvent.cell.x, y: activeEvent.cell.y - 1 }
  ]
    .filter((cell) => isValidShadeCell(cell))
    .sort((a, b) => {
      const distanceA = Math.abs(a.x - head.x) + Math.abs(a.y - head.y);
      const distanceB = Math.abs(b.x - head.x) + Math.abs(b.y - head.y);
      return distanceA - distanceB + (Math.random() - 0.5) * 0.7;
    });

  if (candidates.length > 0) {
    activeEvent.cell = candidates[0];
  }

  activeEvent.nextTickAt = now + activeEvent.moveInterval;
}

function isValidShadeCell(cell) {
  const vulnerableTail = hasMutation("second-head") && isSameCell(cell, snake[snake.length - 1]);

  return (
    !hitWall(cell) &&
    !hitObstacle(cell) &&
    !isSameCell(cell, food) &&
    !isSameCell(cell, relic) &&
    !isSameCell(cell, sigil) &&
    !isSameCell(cell, exitGate) &&
    (vulnerableTail || !snake.some((part) => isSameCell(part, cell)))
  );
}

function createEventCell(minHeadDistance) {
  const head = snake[0];
  let attempts = 0;

  while (attempts < 800) {
    const candidate = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE)
    };

    const distanceFromHead = Math.abs(candidate.x - head.x) + Math.abs(candidate.y - head.y);

    if (distanceFromHead >= minHeadDistance && !isCellBlocked(candidate)) {
      return candidate;
    }

    attempts += 1;
  }

  return null;
}

function showEventMessage(message, now) {
  stageMessage = message;
  stageMessageUntil = now + STAGE_MESSAGE_DURATION;
}

function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getCurrentSpeed() {
  if (isClassicMode()) {
    const speedTier = Math.floor(score / CLASSIC_SPEED_STEP);
    return Math.max(CLASSIC_MIN_SPEED, CLASSIC_START_SPEED - speedTier * CLASSIC_SPEED_DROP);
  }

  const now = performance.now();
  const omenOffset = runOmen ? runOmen.speedOffset : 0;
  const difficultyOffset = getDifficulty().speedOffset;
  const phaseOffset = isPhaseActive(now) ? 12 : 0;
  const dreadOffset = isDreadSurgeActive(now) ? DREAD_SURGE_SPEED_RELIEF : 0;
  const secondHeadOffset = hasMutation("second-head") ? -9 : 0;
  return Math.max(
    MIN_SPEED,
    START_SPEED - score * 3.2 + omenOffset + difficultyOffset + phaseOffset + dreadOffset + secondHeadOffset
  );
}

function isDreadSurgeActive(time) {
  return dreadSurgeUntil && time < dreadSurgeUntil;
}

function getDangerLevel() {
  if (!snake || snake.length === 0) return 0;

  const now = performance.now();
  const head = snake[0];
  const directions = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 }
  ];

  const phasing = isPhaseActive(now);
  const adjacentThreats = directions.reduce((count, dir) => {
    let next = {
      x: head.x + dir.x,
      y: head.y + dir.y
    };

    if (phasing) {
      next = wrapPosition(next);
    }

    const blocked =
      (!phasing && hitWall(next)) ||
      (!phasing && hitObstacle(next)) ||
      (!phasing && hitEventHazard(next, now)) ||
      hitSnake(next, true);

    return count + (blocked ? 1 : 0);
  }, 0);

  const wallDistance = Math.min(head.x, head.y, GRID_SIZE - 1 - head.x, GRID_SIZE - 1 - head.y);
  const wallDanger = phasing ? 0 : Math.max(0, (3 - wallDistance) / 3) * 0.24;
  const trapDanger = (adjacentThreats / directions.length) * 0.58;
  const speedDanger = Math.max(0, (START_SPEED - getCurrentSpeed()) / (START_SPEED - MIN_SPEED)) * 0.28;
  const lengthDanger = Math.min(0.16, snake.length / 92);
  const phaseRelief = phasing ? 0.2 : 0;

  return Math.max(0, Math.min(1, wallDanger + trapDanger + speedDanger + lengthDanger - phaseRelief));
}

function maybePlayHeartbeat(now) {
  const danger = getDangerLevel();

  if (danger < 0.48) return;

  const interval = 780 - danger * 360;

  if (!lastHeartbeatAt || now - lastHeartbeatAt > interval) {
    lastHeartbeatAt = now;
    playSound("heartbeat");
  }
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
  checkTrophies();
  const stageName = getCurrentStage().name;
  const ritual = RITUALS[ritualIndex];

  scoreEl.textContent = score;
  highScoreEl.textContent = Math.max(highScore, score);
  stageNameEl.textContent = isClassicMode() ? "Classic" : gameState === "ready" ? "Unrevealed" : stageName;
  streakEl.textContent = isClassicMode() ? `${snake ? snake.length : 0}` : `${streak}x`;
  dreadEl.textContent = isClassicMode() ? "OG" : `${dread}/${getDreadTarget()}`;
  const omenHidden = gameState === "ready";
  omenNameEl.textContent = isClassicMode()
    ? "OG Rules / Classic"
    : `${omenHidden ? "Unknown Omen" : runOmen.name} / ${getDifficulty().label}`;
  omenRuleEl.textContent = isClassicMode()
    ? "Eat, grow, survive. No relics, rituals, mutations, hazards, or bonus scoring."
    : omenHidden
    ? "A new omen manifests when the descent begins"
    : runOmen.description;

  if (isClassicMode()) {
    ritualNameEl.textContent = "Classic Snake";
    ritualGoalEl.textContent = gameState === "dead"
      ? "Run ended. Press R or Enter to retry."
      : "Eat brains to grow. Walls and your own body are lethal.";
  } else if (gameState === "choosing") {
    ritualNameEl.textContent = "Flesh Warps";
    ritualGoalEl.textContent = "Choose a mutation before the descent continues.";
  } else if (gameState === "escaped") {
    ritualNameEl.textContent = "Ritual Broken";
    ritualGoalEl.textContent = "You reached the gate and survived the descent.";
  } else if (exitGate) {
    ritualNameEl.textContent = "The Open Gate";
    ritualGoalEl.textContent = "Reach the spectral exit. The darkness is still hunting.";
  } else if (sigil && ritual) {
    ritualNameEl.textContent = ritual.name;
    ritualGoalEl.textContent = "Sigil manifested. Claim it to break this seal.";
  } else if (ritual) {
    ritualNameEl.textContent = ritual.name;
    ritualGoalEl.textContent = `${ritual.action} (${Math.min(ritualProgress, ritual.target)}/${ritual.target})`;
  }

  const sealNodes = isClassicMode() ? [] : RITUALS.map((_, index) => {
    const seal = document.createElement("span");
    const claimed = index < seals;
    seal.className = `seal${claimed ? " claimed" : ""}`;
    seal.textContent = claimed ? "X" : "O";
    seal.setAttribute("aria-hidden", "true");
    return seal;
  });

  sealTrackEl.replaceChildren(...sealNodes);
  sealTrackEl.setAttribute(
    "aria-label",
    isClassicMode() ? "Classic mode has no seals" : `${seals} of ${RITUALS.length} seals claimed`
  );

  const pactNodes = mutations.map((mutationId) => {
    const mutation = BODY_MUTATIONS.find((item) => item.id === mutationId);
    const chip = document.createElement("span");
    const charge = getMutationCharges(mutation.id);
    const isConsumable = charge !== null;
    const chargeText = isConsumable ? ` (${charge} left)` : "";

    chip.className = `pact-chip${isConsumable ? " ward" : ""}${isConsumable && charge === 0 ? " spent" : ""}`;
    chip.textContent = `${mutation.name}${chargeText}`;
    chip.title = mutation.description;
    return chip;
  });

  if (pactNodes.length === 0) {
    const empty = document.createElement("span");
    empty.className = "pact-empty";
    empty.textContent = isClassicMode() ? "Classic growth only" : "No mutations grown";
    pactNodes.push(empty);
  }

  pactTrackEl.replaceChildren(...pactNodes);
  pactTrackEl.setAttribute(
    "aria-label",
    mutations.length ? `Mutations grown: ${mutations.length}` : "No mutations grown"
  );

  renderBloodVows();

  if (!isClassicMode() && gameState === "running" && lastStageName && stageName !== lastStageName) {
    stageMessage = stageName;
    stageMessageUntil = performance.now() + STAGE_MESSAGE_DURATION;
    screenShake = Math.max(screenShake, 4);
    playSound("stage");
  }

  lastStageName = stageName;
}

function getMutationCharges(mutationId) {
  if (mutationId === "rotten-coil") return coilCharges;
  if (mutationId === "bone-armor") return armorCharges;
  if (mutationId === "shed-skin") return shedCharges;
  return null;
}

function renderBloodVows() {
  const vows = activeVows || [];

  const vowNodes = vows.map((vow) => {
    const chip = document.createElement("span");
    const title = document.createElement("strong");
    const detail = document.createElement("span");
    const progress = getBloodVowProgress(vow);

    chip.className = `vow-chip${vow.completed ? " completed" : ""}`;
    title.textContent = vow.name;
    detail.textContent = vow.completed
      ? `Fulfilled: ${vow.rewardLabel}`
      : `${vow.description} (${progress}/${vow.target})`;
    chip.title = vow.completed
      ? `${vow.name}: fulfilled for ${vow.rewardLabel}`
      : `${vow.name}: ${vow.description}. Reward: ${vow.rewardLabel}`;
    chip.append(title, detail);
    return chip;
  });

  vowTrackEl.replaceChildren(...vowNodes);
  vowTrackEl.setAttribute(
    "aria-label",
    `${vows.filter((vow) => vow.completed).length} of ${vows.length} Blood Vows fulfilled`
  );
}

function draw(time) {
  if ((gameState === "paused" || gameState === "choosing") && suspendedAt) {
    time = suspendedAt;
  }

  const stage = getCurrentStage();

  ctx.save();
  applyScreenShake();
  drawBackground(stage, time);
  if (!hasLoadedStageBackground(stage)) {
    drawDecorations(stage, time);
  }
  drawFoodScent(stage, time);
  drawDangerAuras(stage, time);
  drawNextMoveWarning(time);
  drawObstacles(stage, time);
  drawHorrorEvent(time);
  drawRelic(time);
  drawSigil(time);
  drawExitGate(time);
  drawFood(time);
  drawBloodTrail(time);
  drawVenomTrail(time);
  drawMutationReach(time);
  drawSnake(time);
  drawParticles(time);
  drawFloaters(time);
  drawVignette();
  drawDread(time);
  drawEatFlash();
  drawComboMeter(time);
  drawDreadSurgeMeter(time);
  drawPhaseMeter(time);
  drawStageBanner(time);

  if (gameState === "ready") {
    drawStartHint(time);
  }

  ctx.restore();
}

function applyScreenShake() {
  if (screenShake <= 0) return;

  if (reducedMotion || window.ArcadeUX.motionReduced()) {
    screenShake = 0;
    return;
  }

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

function drawFoodScent(stage, time) {
  if (!food || !snake || snake.length === 0) return;

  drawScentLine(snake[0], food, "rgba(255, 36, 74, 0.34)", time);

  if (relic) {
    drawScentLine(snake[0], relic, "rgba(255, 214, 111, 0.42)", time + 360);
    drawRelicCountdown(relic, time);
  }

  if (sigil) {
    drawScentLine(snake[0], sigil, "rgba(201, 150, 255, 0.56)", time + 620);
  }

  if (exitGate) {
    drawScentLine(snake[0], exitGate, "rgba(196, 255, 246, 0.68)", time + 900);
  }

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.strokeStyle = stage.accent;
  ctx.globalAlpha = 0.2 + Math.sin(time * 0.004) * 0.06;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(food.x * TILE + 3, food.y * TILE + 3, TILE - 6, TILE - 6, 7);
  ctx.stroke();
  ctx.restore();
}

function drawScentLine(from, to, color, time) {
  const fromX = from.x * TILE + TILE / 2;
  const fromY = from.y * TILE + TILE / 2;
  const toX = to.x * TILE + TILE / 2;
  const toY = to.y * TILE + TILE / 2;
  const dashOffset = (reducedMotion || window.ArcadeUX.motionReduced()) ? 0 : -time * 0.018;

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = 0.22;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 12]);
  ctx.lineDashOffset = dashOffset;
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();
  ctx.restore();
}

function drawRelicCountdown(activeRelic, time) {
  const remaining = Math.max(0, activeRelic.expiresAt - time);
  const ratio = Math.min(1, remaining / RELIC_DURATION);
  const x = activeRelic.x * TILE + TILE / 2;
  const y = activeRelic.y * TILE + TILE / 2;

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.strokeStyle = "rgba(255, 214, 111, 0.72)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, TILE * 0.62, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ratio);
  ctx.stroke();
  ctx.restore();
}

function drawDangerAuras(stage, time) {
  const cells = getDangerAuraCells(time);
  if (cells.length === 0) return;

  const pulse = (reducedMotion || window.ArcadeUX.motionReduced()) ? 0.78 : 0.72 + Math.sin(time * 0.008) * 0.16;

  ctx.save();
  ctx.globalCompositeOperation = "screen";

  for (const cell of cells) {
    const x = cell.x * TILE;
    const y = cell.y * TILE;
    const isWarning = cell.kind === "event-warning";
    const isEvent = cell.kind === "event" || isWarning;

    ctx.globalAlpha = isWarning ? 0.13 * pulse : isEvent ? 0.3 * pulse : 0.16 * pulse;
    ctx.fillStyle = isWarning
      ? "rgba(255, 214, 111, 0.62)"
      : isEvent
        ? "rgba(255, 36, 74, 0.74)"
        : stage.accent;
    ctx.beginPath();
    ctx.roundRect(x + 3, y + 3, TILE - 6, TILE - 6, 7);
    ctx.fill();
  }

  ctx.restore();
}

function getDangerAuraCells(time) {
  const cells = [];
  const seen = new Set();
  const addCell = (cell, kind) => {
    if (!cell || hitWall(cell)) return;

    const key = `${cell.x},${cell.y},${kind}`;
    if (seen.has(key)) return;

    seen.add(key);
    cells.push({ ...cell, kind });
  };

  for (const obstacle of obstacles) {
    for (const cell of getAdjacentCells(obstacle)) {
      if (!isCellOccupiedByReward(cell)) addCell(cell, "obstacle");
    }
  }

  if (activeEvent) {
    const eventKind = isEventArmed(activeEvent, time) ? "event" : "event-warning";
    const eventCells = getEventCells(activeEvent);
    for (const eventCell of eventCells) {
      addCell(eventCell, eventKind);
      for (const cell of getAdjacentCells(eventCell)) {
        if (!isCellOccupiedByReward(cell)) addCell(cell, eventKind);
      }
    }
  }

  return cells;
}

function isCellOccupiedByReward(cell) {
  return isSameCell(cell, food) || isSameCell(cell, relic) || isSameCell(cell, sigil) || isSameCell(cell, exitGate);
}

function drawNextMoveWarning(time) {
  if (gameState !== "running" || !snake || snake.length === 0) return;

  const head = snake[0];
  const rawNext = {
    x: head.x + direction.x,
    y: head.y + direction.y
  };
  const phasing = isPhaseActive(time);
  const wrapped = phasing && hitWall(rawNext);
  const next = phasing ? wrapPosition(rawNext) : rawNext;
  const hitsBoundary = !phasing && hitWall(rawNext);
  const deadly =
    hitsBoundary ||
    (!phasing && hitObstacle(next)) ||
    hitSnake(next, true) ||
    (!phasing && hitEventHazard(next, time));
  const reward = !deadly && willCollectReward(next);

  if (!deadly && !reward && !wrapped) return;

  const drawCell = {
    x: Math.max(0, Math.min(GRID_SIZE - 1, next.x)),
    y: Math.max(0, Math.min(GRID_SIZE - 1, next.y))
  };
  const x = drawCell.x * TILE;
  const y = drawCell.y * TILE;
  const pulse = (reducedMotion || window.ArcadeUX.motionReduced()) ? 0.78 : 0.66 + Math.sin(time * 0.012) * 0.18;
  const color = deadly
    ? "255, 36, 74"
    : reward
      ? "255, 214, 111"
      : "196, 255, 246";

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = deadly ? pulse : pulse * 0.78;
  ctx.strokeStyle = `rgba(${color}, 0.92)`;
  ctx.fillStyle = `rgba(${color}, ${deadly ? 0.16 : 0.1})`;
  ctx.lineWidth = deadly ? 3 : 2;
  ctx.shadowColor = `rgba(${color}, 0.75)`;
  ctx.shadowBlur = deadly ? 20 : 12;

  ctx.beginPath();
  ctx.roundRect(x + 4, y + 4, TILE - 8, TILE - 8, 7);
  ctx.fill();
  ctx.stroke();

  const headX = head.x * TILE + TILE / 2;
  const headY = head.y * TILE + TILE / 2;
  const targetX = x + TILE / 2;
  const targetY = y + TILE / 2;

  ctx.globalAlpha *= 0.55;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(headX, headY);
  ctx.lineTo(targetX, targetY);
  ctx.stroke();

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

function drawHorrorEvent(time) {
  if (!activeEvent) return;

  if (activeEvent.type === "shade") {
    drawShade(activeEvent, time);
  }

  if (activeEvent.type === "curse") {
    drawCursePatch(activeEvent, time);
  }

  if (activeEvent.type === "rift") {
    drawRift(activeEvent, time);
  }
}

function drawShade(event, time) {
  const x = event.cell.x * TILE + TILE / 2;
  const y = event.cell.y * TILE + TILE / 2;
  const armed = isEventArmed(event, time);
  const warningRatio = getEventWarningRatio(event, time);
  const pulse = 0.86 + Math.sin(time * 0.009 + event.pulseOffset) * 0.16;
  const life = Math.min(1, Math.max(0.25, (event.endsAt - time) / 1200));

  ctx.save();

  if (!armed) {
    const radius = TILE * (0.48 + warningRatio * 0.36);

    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = 0.28 + warningRatio * 0.3;
    ctx.strokeStyle = "rgba(255, 214, 111, 0.88)";
    ctx.fillStyle = "rgba(157, 87, 255, 0.14)";
    ctx.lineWidth = 2;
    ctx.shadowColor = "rgba(255, 214, 111, 0.7)";
    ctx.shadowBlur = 14;

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x - radius * 0.55, y);
    ctx.lineTo(x + radius * 0.55, y);
    ctx.moveTo(x, y - radius * 0.55);
    ctx.lineTo(x, y + radius * 0.55);
    ctx.stroke();

    ctx.restore();
    return;
  }

  ctx.globalAlpha = life;
  ctx.shadowColor = "rgba(157, 87, 255, 0.85)";
  ctx.shadowBlur = 22;
  ctx.fillStyle = "rgba(29, 8, 44, 0.92)";

  ctx.beginPath();
  ctx.ellipse(x, y + 2, TILE * 0.42 * pulse, TILE * 0.52 * pulse, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255, 36, 74, 0.92)";
  ctx.shadowColor = "rgba(255, 36, 74, 0.9)";
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.ellipse(x - 5, y - 4, 3.5, 2, 0, 0, Math.PI * 2);
  ctx.ellipse(x + 5, y - 4, 3.5, 2, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawCursePatch(event, time) {
  const armed = isEventArmed(event, time);
  const warningRatio = getEventWarningRatio(event, time);
  const pulse = 0.68 + Math.sin(time * 0.011 + event.pulseOffset) * 0.24;
  const life = Math.min(1, Math.max(0.28, (event.endsAt - time) / 1000));

  ctx.save();

  for (const cell of event.cells) {
    const x = cell.x * TILE;
    const y = cell.y * TILE;

    ctx.globalAlpha = armed ? life : 0.24 + warningRatio * 0.26;
    ctx.shadowColor = armed ? "rgba(255, 36, 74, 0.85)" : "rgba(255, 214, 111, 0.7)";
    ctx.shadowBlur = armed ? 16 * pulse : 10 + warningRatio * 8;
    ctx.fillStyle = armed
      ? `rgba(157, 7, 27, ${0.36 + pulse * 0.22})`
      : `rgba(255, 214, 111, ${0.06 + warningRatio * 0.13})`;
    ctx.beginPath();
    ctx.roundRect(x + 4, y + 4, TILE - 8, TILE - 8, 6);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = armed ? "rgba(255, 214, 111, 0.32)" : "rgba(255, 214, 111, 0.74)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + TILE * 0.28, y + TILE * 0.5);
    ctx.lineTo(x + TILE * 0.72, y + TILE * 0.5);
    ctx.moveTo(x + TILE * 0.5, y + TILE * 0.28);
    ctx.lineTo(x + TILE * 0.5, y + TILE * 0.72);
    ctx.stroke();
  }

  ctx.restore();
}

function drawRift(event, time) {
  const armed = isEventArmed(event, time);
  const warningRatio = getEventWarningRatio(event, time);
  const pulse = (reducedMotion || window.ArcadeUX.motionReduced()) ? 1 : 0.82 + Math.sin(time * 0.014 + event.pulseOffset) * 0.18;
  const life = Math.min(1, Math.max(0.32, (event.endsAt - time) / 900));

  ctx.save();
  ctx.globalCompositeOperation = "screen";

  for (const cell of event.cells) {
    const x = cell.x * TILE;
    const y = cell.y * TILE;
    const inset = armed ? 4 : 8 - warningRatio * 3;
    ctx.globalAlpha = armed ? life * 0.82 : 0.18 + warningRatio * 0.36;
    ctx.shadowColor = armed ? "rgba(196, 255, 246, 0.9)" : "rgba(255, 214, 111, 0.72)";
    ctx.shadowBlur = armed ? 22 : 12;
    ctx.fillStyle = armed
      ? `rgba(196, 255, 246, ${0.22 + pulse * 0.22})`
      : `rgba(255, 214, 111, ${0.05 + warningRatio * 0.14})`;
    ctx.beginPath();
    ctx.roundRect(x + inset, y + inset, TILE - inset * 2, TILE - inset * 2, 6);
    ctx.fill();

    ctx.strokeStyle = armed ? "rgba(255, 36, 74, 0.62)" : "rgba(255, 214, 111, 0.58)";
    ctx.lineWidth = armed ? 2 : 1;
    ctx.beginPath();
    if (event.vertical) {
      ctx.moveTo(x + TILE / 2, y + 2);
      ctx.lineTo(x + TILE / 2, y + TILE - 2);
    } else {
      ctx.moveTo(x + 2, y + TILE / 2);
      ctx.lineTo(x + TILE - 2, y + TILE / 2);
    }
    ctx.stroke();
  }

  ctx.restore();
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

function drawSigil(time) {
  if (!sigil) return;

  const x = sigil.x * TILE + TILE / 2;
  const y = sigil.y * TILE + TILE / 2;
  const pulse = (reducedMotion || window.ArcadeUX.motionReduced()) ? 1 : 1 + Math.sin(time * 0.01) * 0.09;
  const radius = TILE * 0.43 * pulse;

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.shadowColor = "rgba(201, 150, 255, 0.96)";
  ctx.shadowBlur = 26;
  ctx.strokeStyle = "#ddc8ff";
  ctx.fillStyle = "rgba(90, 34, 126, 0.58)";
  ctx.lineWidth = 2.5;

  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x, y - radius * 0.68);
  ctx.lineTo(x + radius * 0.62, y + radius * 0.56);
  ctx.lineTo(x - radius * 0.62, y + radius * 0.56);
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y - radius * 0.34);
  ctx.lineTo(x, y + radius * 0.7);
  ctx.stroke();
  ctx.restore();
}

function drawExitGate(time) {
  if (!exitGate) return;

  const x = exitGate.x * TILE + TILE / 2;
  const y = exitGate.y * TILE + TILE / 2;
  const pulse = (reducedMotion || window.ArcadeUX.motionReduced()) ? 1 : 1 + Math.sin(time * 0.009) * 0.13;
  const radius = TILE * 0.58 * pulse;
  const rotation = (reducedMotion || window.ArcadeUX.motionReduced()) ? 0 : time * 0.0022;

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.shadowColor = "rgba(196, 255, 246, 0.9)";
  ctx.shadowBlur = 30;
  const glow = ctx.createRadialGradient(x, y, 2, x, y, radius);
  glow.addColorStop(0, "rgba(196, 255, 246, 0.86)");
  glow.addColorStop(0.46, "rgba(84, 202, 201, 0.34)");
  glow.addColorStop(1, "rgba(157, 87, 255, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.strokeStyle = "rgba(196, 255, 246, 0.94)";
  ctx.lineWidth = 2.5;
  ctx.setLineDash([8, 5]);
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.72, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.rotate(-rotation * 1.8);
  ctx.strokeStyle = "rgba(201, 150, 255, 0.84)";
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.48, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawFood(time) {
  if (!food) return;

  const x = food.x * TILE + TILE / 2;
  const y = food.y * TILE + TILE / 2;
  const pulse = 1 + Math.sin(time * 0.008 + food.pulseOffset) * 0.12;
  const size = TILE * 1.05 * pulse;
  window.ArcadeUX.drawMarker(ctx, x, y, TILE * 0.56, "#ffd789");

  if (FOOD_SPRITE.ready) {
    drawFoodSprite(x, y, size);
    return;
  }

  drawFallbackFood(x, y, size);
}

function drawFoodSprite(x, y, size) {
  const bounds = FOOD_SPRITE.bounds;

  ctx.save();
  ctx.shadowColor = "rgba(255, 36, 74, 0.86)";
  ctx.shadowBlur = 18;
  ctx.drawImage(
    FOOD_SPRITE.image,
    bounds.x,
    bounds.y,
    bounds.width,
    bounds.height,
    x - size / 2,
    y - size / 2,
    size,
    size
  );
  ctx.restore();
}

function drawFallbackFood(x, y, size) {
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
  const phasing = isPhaseActive(time);
  const canDrawSprites = areSnakeSpritesReady();

  for (let i = snake.length - 1; i >= 0; i--) {
    const part = snake[i];
    const x = part.x * TILE;
    const y = part.y * TILE;
    const isHead = i === 0;
    const isSecondHead = hasMutation("second-head") && i === snake.length - 1;
    const shade = Math.max(0.35, 1 - i * 0.018);

    if (isHead) {
      window.ArcadeUX.drawMarker(ctx, x + TILE / 2, y + TILE / 2, TILE * 0.5, "#9ef6ff");
      if (canDrawSprites) {
        drawSnakeHeadSprite(x, y, phasing);
      } else {
        drawSnakeHead(x, y, time, phasing);
      }
    } else if (isSecondHead) {
      drawSecondHead(x, y, time, phasing, canDrawSprites);
    } else if (canDrawSprites) {
      drawSnakeSpriteSegment(i, x, y, phasing);
    } else {
      drawSnakeBody(x, y, shade, i, phasing);
    }
  }
}

function areSnakeSpritesReady() {
  return Object.values(SNAKE_SPRITES).every((sprite) => sprite.ready);
}

function drawSnakeHeadSprite(x, y, phasing) {
  const neck = snake[1];
  const headDirection = neck ? getGridDirection(neck, snake[0]) : direction;

  drawSnakeSprite("head", x, y, angleForDirection(headDirection), phasing, 1.18);
}

function drawSecondHead(x, y, time, phasing, canDrawSprites) {
  const tailIndex = snake.length - 1;
  const tailDirection = getGridDirection(snake[tailIndex - 1], snake[tailIndex]);

  if (canDrawSprites) {
    drawSnakeSprite("head", x, y, angleForDirection(tailDirection), phasing, 1.08);
    return;
  }

  drawSnakeHead(x, y, time + 420, phasing);
}

function drawSnakeSpriteSegment(index, x, y, phasing) {
  const segment = snake[index];
  const towardHead = getGridDirection(segment, snake[index - 1]);
  const towardTail = snake[index + 1] ? getGridDirection(segment, snake[index + 1]) : null;

  if (index === snake.length - 1) {
    const tailDirection = getGridDirection(snake[index - 1], segment);
    drawSnakeSprite("tail", x, y, angleForDirection(tailDirection), phasing, 1.12);
    return;
  }

  if (!towardTail || areOppositeDirections(towardHead, towardTail)) {
    const angle = towardHead.y !== 0 ? 0 : Math.PI / 2;
    drawSnakeSprite("body", x, y, angle, phasing, 1.08);
    return;
  }

  const turn = getTurnSprite(towardHead, towardTail);
  drawSnakeSprite(turn.key, x, y, turn.angle, phasing, 1.16);
}

function drawSnakeSprite(key, x, y, angle, phasing, scale = 1) {
  const sprite = SNAKE_SPRITES[key];

  if (!sprite || !sprite.ready) return false;

  const bounds = sprite.bounds || {
    x: 0,
    y: 0,
    width: sprite.image.naturalWidth,
    height: sprite.image.naturalHeight
  };

  const size = TILE * scale;

  ctx.save();
  ctx.translate(x + TILE / 2, y + TILE / 2);
  ctx.rotate(angle);
  ctx.globalAlpha = phasing ? 0.88 : 1;
  ctx.shadowColor = phasing ? "rgba(196, 255, 246, 0.75)" : "rgba(0, 0, 0, 0.42)";
  ctx.shadowBlur = phasing ? 18 : 8;
  ctx.filter = phasing ? "brightness(1.28) saturate(0.72) hue-rotate(95deg)" : "none";
  ctx.drawImage(
    sprite.image,
    bounds.x,
    bounds.y,
    bounds.width,
    bounds.height,
    -size / 2,
    -size / 2,
    size,
    size
  );
  ctx.restore();

  return true;
}

function getTurnSprite(firstDirection, secondDirection) {
  if (hasDirections(firstDirection, secondDirection, { x: -1, y: 0 }, { x: 0, y: 1 })) {
    return { key: "turnDown", angle: 0 };
  }

  if (hasDirections(firstDirection, secondDirection, { x: -1, y: 0 }, { x: 0, y: -1 })) {
    return { key: "turnUp", angle: 0 };
  }

  if (hasDirections(firstDirection, secondDirection, { x: 1, y: 0 }, { x: 0, y: 1 })) {
    return { key: "turnUp", angle: Math.PI };
  }

  return { key: "turnDown", angle: Math.PI };
}

function getGridDirection(from, to) {
  if (!from || !to) return { x: 1, y: 0 };

  let x = to.x - from.x;
  let y = to.y - from.y;

  if (Math.abs(x) > 1) x = x > 0 ? -1 : 1;
  if (Math.abs(y) > 1) y = y > 0 ? -1 : 1;

  return {
    x: Math.sign(x),
    y: Math.sign(y)
  };
}

function angleForDirection(vector) {
  if (vector.x === 1) return 0;
  if (vector.y === 1) return Math.PI / 2;
  if (vector.x === -1) return Math.PI;
  return -Math.PI / 2;
}

function areOppositeDirections(a, b) {
  return a.x + b.x === 0 && a.y + b.y === 0;
}

function hasDirections(a, b, expectedA, expectedB) {
  return (
    (isSameDirection(a, expectedA) && isSameDirection(b, expectedB)) ||
    (isSameDirection(a, expectedB) && isSameDirection(b, expectedA))
  );
}

function isSameDirection(a, b) {
  return a.x === b.x && a.y === b.y;
}

function drawParticles(time) {
  if (particles.length === 0) return;

  particles = particles.filter((particle) => time - particle.bornAt < particle.duration);

  ctx.save();

  for (const particle of particles) {
    const age = time - particle.bornAt;
    const life = 1 - age / particle.duration;

    ctx.globalAlpha = Math.max(0, life);
    ctx.fillStyle = particle.color;
    ctx.shadowColor = particle.color;
    ctx.shadowBlur = 8 * life;
    ctx.beginPath();
    ctx.arc(
      particle.x + particle.vx * age,
      particle.y + particle.vy * age,
      particle.size * life,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  ctx.restore();
}

function drawFloaters(time) {
  if (floaters.length === 0) return;

  floaters = floaters.filter((floater) => time - floater.bornAt < floater.duration);

  ctx.save();
  ctx.font = "700 16px Courier New";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (const floater of floaters) {
    const age = time - floater.bornAt;
    const ratio = age / floater.duration;
    const lift = ratio * 28;

    ctx.globalAlpha = Math.max(0, 1 - ratio);
    ctx.fillStyle = floater.color;
    ctx.shadowColor = "rgba(0, 0, 0, 0.86)";
    ctx.shadowBlur = 8;
    ctx.fillText(floater.text, floater.x, floater.y - lift);
  }

  ctx.restore();
}

function drawBloodTrail(time) {
  if (!snake || snake.length < 7) return;

  ctx.save();
  ctx.globalCompositeOperation = "screen";

  for (let i = 5; i < snake.length; i += 4) {
    const part = snake[i];
    const x = part.x * TILE + TILE / 2;
    const y = part.y * TILE + TILE / 2;
    const age = i / snake.length;
    const pulse = 0.75 + Math.sin(time * 0.004 + i) * 0.18;

    ctx.globalAlpha = Math.max(0.03, (1 - age) * 0.12);
    ctx.fillStyle = "#9d071b";
    ctx.beginPath();
    ctx.ellipse(x, y, TILE * 0.34 * pulse, TILE * 0.18, (i % 3) * 0.7, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawVenomTrail(time) {
  if (!hasMutation("venom-trail") || venomTrail.length === 0) return;

  ctx.save();
  ctx.globalCompositeOperation = "screen";

  for (const cell of venomTrail) {
    const remaining = Math.max(0, cell.expiresAt - time);
    if (remaining <= 0) continue;

    const ratio = remaining / VENOM_TRAIL_DURATION;
    const x = cell.x * TILE + TILE / 2;
    const y = cell.y * TILE + TILE / 2;
    const pulse = (reducedMotion || window.ArcadeUX.motionReduced()) ? 1 : 0.92 + Math.sin(time * 0.012 + cell.x) * 0.14;
    ctx.globalAlpha = ratio * 0.8;
    ctx.shadowColor = "rgba(125, 255, 157, 0.9)";
    ctx.shadowBlur = 18;
    ctx.fillStyle = "#54e873";
    ctx.beginPath();
    ctx.arc(x, y, TILE * 0.27 * pulse, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawMutationReach(time) {
  const range = getPickupRange();
  if (!range || !snake || snake.length === 0) return;

  const head = snake[0];
  const x = head.x * TILE + TILE / 2;
  const y = head.y * TILE + TILE / 2;
  const radius = TILE * (range + 0.48);
  const pulse = (reducedMotion || window.ArcadeUX.motionReduced()) ? 0.23 : 0.18 + Math.sin(time * 0.008) * 0.06;

  ctx.save();
  ctx.strokeStyle = `rgba(255, 74, 104, ${pulse})`;
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 6]);
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawSnakeBody(x, y, shade, index, phasing) {
  const pad = 3;
  const segmentSize = TILE - pad * 2;

  ctx.save();

  const bodyGradient = ctx.createLinearGradient(x, y, x + TILE, y + TILE);
  bodyGradient.addColorStop(0, phasing ? `rgba(202, 255, 246, ${0.9 * shade})` : `rgba(92, 255, 128, ${0.95 * shade})`);
  bodyGradient.addColorStop(0.45, phasing ? `rgba(78, 210, 197, ${0.82 * shade})` : `rgba(33, 121, 55, ${0.95 * shade})`);
  bodyGradient.addColorStop(1, phasing ? `rgba(17, 63, 70, ${0.86 * shade})` : `rgba(18, 44, 28, ${0.98 * shade})`);

  ctx.fillStyle = bodyGradient;
  ctx.shadowColor = phasing ? "rgba(196, 255, 246, 0.68)" : "rgba(125, 255, 157, 0.36)";
  ctx.shadowBlur = phasing ? 16 : 10;
  ctx.globalAlpha = phasing ? 0.88 : 1;

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

function drawSnakeHead(x, y, time, phasing) {
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

  headGradient.addColorStop(0, phasing ? "#edfff9" : "#a5ffb7");
  headGradient.addColorStop(0.45, phasing ? "#6de7d5" : "#38bd62");
  headGradient.addColorStop(1, phasing ? "#123f4a" : "#0d2b18");

  ctx.fillStyle = headGradient;
  ctx.shadowColor = phasing ? "rgba(196, 255, 246, 0.9)" : "rgba(125, 255, 157, 0.7)";
  ctx.shadowBlur = phasing ? 24 : 16;
  ctx.globalAlpha = phasing ? 0.9 : 1;

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
  const edgeDarkness = Math.max(0.42, 0.55 + (runOmen ? runOmen.darkness : 0) + getDifficulty().darkness);
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

function drawDread(time) {
  const danger = gameState === "running" ? getDangerLevel() : 0.22;
  const pulse = (reducedMotion || window.ArcadeUX.motionReduced()) ? 0.62 : 0.64 + Math.sin(time * 0.006) * 0.18;
  const alpha = danger * pulse;
  const surgeActive = isDreadSurgeActive(time);

  ctx.save();

  if (alpha > 0.02) {
    const edge = ctx.createRadialGradient(
      canvas.width / 2,
      canvas.height / 2,
      120,
      canvas.width / 2,
      canvas.height / 2,
      440
    );

    edge.addColorStop(0, "rgba(0, 0, 0, 0)");
    edge.addColorStop(0.72, `rgba(70, 0, 10, ${alpha * 0.12})`);
    edge.addColorStop(1, `rgba(255, 0, 36, ${alpha * 0.22})`);

    ctx.fillStyle = edge;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  if (surgeActive) {
    const surge = ctx.createRadialGradient(
      canvas.width / 2,
      canvas.height / 2,
      110,
      canvas.width / 2,
      canvas.height / 2,
      420
    );

    surge.addColorStop(0, "rgba(0, 0, 0, 0)");
    surge.addColorStop(0.78, "rgba(125, 255, 157, 0.05)");
    surge.addColorStop(1, "rgba(125, 255, 157, 0.18)");

    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = surge;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  drawWatcherEyes(time, danger);
  ctx.restore();
}

function drawWatcherEyes(time, danger) {
  if (danger < 0.3 && gameState === "running") return;

  const pairs = [
    { x: 70, y: 134, gap: 15, phase: 0.2 },
    { x: 510, y: 116, gap: 18, phase: 1.6 },
    { x: 472, y: 456, gap: 13, phase: 2.8 }
  ];

  ctx.save();
  ctx.globalAlpha = Math.min(0.5, 0.13 + danger * 0.38);
  ctx.fillStyle = "#ff244a";
  ctx.shadowColor = "rgba(255, 36, 74, 0.75)";
  ctx.shadowBlur = 12;

  for (const pair of pairs) {
    const blink = Math.sin(time * 0.003 + pair.phase) > 0.88;
    if (blink) continue;

    const drift = Math.sin(time * 0.0008 + pair.phase) * 4;
    const y = pair.y + drift;

    ctx.beginPath();
    ctx.ellipse(pair.x - pair.gap / 2, y, 4.5, 2.3, 0, 0, Math.PI * 2);
    ctx.ellipse(pair.x + pair.gap / 2, y, 4.5, 2.3, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawEatFlash() {
  if (window.ArcadeUX.flashesReduced()) { eatFlash = 0; return; }
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

function drawDreadSurgeMeter(time) {
  if (!isDreadSurgeActive(time)) return;

  const remaining = Math.max(0, dreadSurgeUntil - time);
  const ratio = Math.min(1, remaining / DREAD_SURGE_DURATION);
  const width = 156;
  const height = 8;
  const x = (canvas.width - width) / 2;
  const y = 36;

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = "rgba(1, 24, 12, 0.68)";
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 4);
  ctx.fill();

  const gradient = ctx.createLinearGradient(x, y, x + width, y);
  gradient.addColorStop(0, "rgba(131, 255, 157, 0.95)");
  gradient.addColorStop(1, "rgba(196, 255, 246, 0.9)");

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.roundRect(x, y, width * ratio, height, 4);
  ctx.fill();

  ctx.font = "700 13px Courier New";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = "#c4fff6";
  ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
  ctx.shadowBlur = 7;
  ctx.fillText("DREAD SURGE", canvas.width / 2, y + 11);
  ctx.restore();
}

function drawPhaseMeter(time) {
  if (!isPhaseActive(time)) return;

  const remaining = Math.max(0, phaseUntil - time);
  const ratio = Math.min(1, remaining / phaseMeterDuration);
  const width = 178;
  const height = 9;
  const x = (canvas.width - width) / 2;
  const y = canvas.height - 28;

  ctx.save();
  ctx.fillStyle = "rgba(0, 14, 18, 0.62)";
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 5);
  ctx.fill();

  const gradient = ctx.createLinearGradient(x, y, x + width, y);
  gradient.addColorStop(0, "rgba(196, 255, 246, 0.92)");
  gradient.addColorStop(1, "rgba(255, 214, 111, 0.9)");

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.roundRect(x, y, width * ratio, height, 5);
  ctx.fill();

  ctx.font = "700 14px Courier New";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillStyle = "#c4fff6";
  ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
  ctx.shadowBlur = 8;
  ctx.fillText("PHASE", canvas.width / 2, y - 5);
  ctx.restore();
}

function drawStageBanner(time) {
  if (!stageMessage || time > stageMessageUntil) return;

  const remaining = stageMessageUntil - time;
  const fade = Math.min(1, remaining / 360);

  ctx.save();
  ctx.globalAlpha = fade;
  ctx.fillStyle = "rgba(0, 0, 0, 0.44)";
  ctx.beginPath();
  ctx.roundRect(canvas.width / 2 - 132, 50, 264, 42, 8);
  ctx.fill();

  ctx.strokeStyle = "rgba(243, 216, 170, 0.34)";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.font = "700 18px Courier New";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#f3d8aa";
  ctx.shadowColor = "rgba(201, 27, 53, 0.9)";
  ctx.shadowBlur = 14;
  ctx.fillText(stageMessage.toUpperCase(), canvas.width / 2, 71);
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
  ctx.fillText("ENTER / DIRECTION", canvas.width / 2, canvas.height - 54);
  ctx.restore();
}

function toggleSound() {
  soundOn = !soundOn;
  setStorageItem(SOUND_SETTING_KEY, soundOn);
  syncMenu();

  if (soundOn) {
    playSound("start");
  }
}

function toggleMotion() {
  reducedMotion = !reducedMotion;
  setStorageItem("horrorSnakeReducedMotion", reducedMotion);
  syncMenu();

  if (reducedMotion || window.ArcadeUX.motionReduced()) {
    screenShake = 0;
  }
}

function resetBestScore() {
  if (!window.confirm("Clear the best score for " + getDifficulty().label + "?")) return;
  highScore = 0;
  setStorageItem(getHighScoreKey(), 0);
  updateHud();
  if (gameState === "dead") {
    overlayText.textContent = `The run is over. ${getRunSummary(runEndedAt)} Best ${Math.max(highScore, score)}.`;
  } else if (gameState === "escaped") {
    overlayText.textContent = `You escaped the hunting dark. ${getRunSummary(runEndedAt)} Best ${Math.max(highScore, score)}.`;
  } else {
    overlayText.textContent = READY_COPY;
  }
  playSound("stage");
}

function getAudioContext() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;

  if (!audioContext) {
    audioContext = new AudioContext();
  }

  return audioContext;
}

function playSound(type) {
  if (!soundOn || !window.ArcadeUX.effectsAllowed()) return;

  const audio = getAudioContext();
  if (!audio) return;

  if (audio.state === "suspended") {
    audio.resume().catch(() => {});
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

  if (type === "sigil") {
    playTone(audio, 196, 0.08, 0.045, "triangle", now);
    playTone(audio, 294, 0.1, 0.04, "triangle", now + 0.06);
    playTone(audio, 494, 0.14, 0.04, "sine", now + 0.14);
  }

  if (type === "vow") {
    playTone(audio, 262, 0.07, 0.035, "triangle", now);
    playTone(audio, 392, 0.09, 0.032, "triangle", now + 0.06);
    playTone(audio, 740, 0.12, 0.026, "sine", now + 0.14);
  }

  if (type === "mutation") {
    playTone(audio, 122, 0.1, 0.04, "sawtooth", now);
    playTone(audio, 247, 0.13, 0.035, "triangle", now + 0.08);
    playTone(audio, 370, 0.18, 0.04, "sine", now + 0.17);
  }

  if (type === "mutation-use") {
    playTone(audio, 620, 0.08, 0.05, "square", now);
    playTone(audio, 310, 0.12, 0.04, "triangle", now + 0.05);
    playTone(audio, 155, 0.18, 0.035, "sawtooth", now + 0.11);
  }

  if (type === "venom") {
    playTone(audio, 184, 0.07, 0.04, "square", now);
    playTone(audio, 112, 0.15, 0.045, "sawtooth", now + 0.05);
  }

  if (type === "escape") {
    playTone(audio, 164, 0.12, 0.05, "sine", now);
    playTone(audio, 246, 0.14, 0.045, "triangle", now + 0.08);
    playTone(audio, 392, 0.18, 0.04, "triangle", now + 0.18);
    playTone(audio, 659, 0.22, 0.035, "sine", now + 0.3);
  }

  if (type === "stage") {
    playTone(audio, 170, 0.08, 0.03, "triangle", now);
    playTone(audio, 255, 0.12, 0.026, "triangle", now + 0.08);
  }

  if (type === "event") {
    playTone(audio, 96, 0.12, 0.045, "sawtooth", now);
    playTone(audio, 144, 0.18, 0.026, "triangle", now + 0.08);
  }

  if (type === "death") {
    playTone(audio, 130, 0.16, 0.08, "sawtooth", now);
    playTone(audio, 82, 0.24, 0.08, "sawtooth", now + 0.12);
  }

  if (type === "heartbeat") {
    playTone(audio, 68, 0.07, 0.045, "sine", now);
    playTone(audio, 52, 0.09, 0.038, "sine", now + 0.1);
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
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, window.ArcadeUX.effectsVolume(volume)), startTime + 0.01);
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

renderCareerStats();
boot();
window.ArcadeUX.onPreferences(() => syncMenu());

window.ArcadeUX.registerGame({
  active: () => gameState === "running" || gameState === "paused",
  paused: () => gameState === "paused",
  pause: value => value ? pauseGame() : resumeGame(),
  label: () => getDifficulty().label
});
