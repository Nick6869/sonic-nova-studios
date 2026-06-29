// Hell Climb (standalone) - Difficulty Curve v2 + Daily Run + Guaranteed Variety
// Reachability patch: horizontal distance now depends on vertical gap.

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const heightEl = document.getElementById("height");
const bestEl = document.getElementById("best");
const soulTotalEl = document.getElementById("souls");
const restartBtn = document.getElementById("restart");

const modeBtn = document.getElementById("modeBtn");
const modeBadge = document.getElementById("modeBadge");
const dailyDateEl = document.getElementById("dailyDate");
const runGoalEl = document.getElementById("runGoal");
const trophyBtn = document.getElementById("trophyBtn");
const trophyCountEl = document.getElementById("trophyCount");
const pauseBtn = document.getElementById("pauseBtn");
const mainMenuBtn = document.getElementById("mainMenuBtn");
const muteBtn = document.getElementById("muteBtn");
const shootBtn = document.getElementById("shootBtn");

const mainMenu = document.getElementById("mainMenu");
const playBtn = document.getElementById("playBtn");
const hellPlayBtn = document.getElementById("hellPlayBtn");
const menuModeBtn = document.getElementById("menuModeBtn");
const menuShopBtn = document.getElementById("menuShopBtn");
const menuTrophyBtn = document.getElementById("menuTrophyBtn");
const menuMuteBtn = document.getElementById("menuMuteBtn");
const menuMusicBtn = document.getElementById("menuMusicBtn");
const volumeSlider = document.getElementById("volumeSlider");
const menuClassicBestEl = document.getElementById("menuClassicBest");
const menuDailyBestEl = document.getElementById("menuDailyBest");
const menuHellBestEl = document.getElementById("menuHellBest");
const menuSoulsEl = document.getElementById("menuSouls");
const menuRitesEl = document.getElementById("menuRites");
const menuGoalEl = document.getElementById("menuGoal");

const pauseOverlay = document.getElementById("pauseOverlay");
const resumeBtn = document.getElementById("resumeBtn");
const pauseMenuBtn = document.getElementById("pauseMenuBtn");
const pauseMusicBtn = document.getElementById("pauseMusicBtn");

const overlay = document.getElementById("overlay");
const finalEl = document.getElementById("final");
const resultLineEl = document.getElementById("resultLine");
const runRecapEl = document.getElementById("runRecap");
const playAgainBtn = document.getElementById("playAgain");
const gameOverMenuBtn = document.getElementById("gameOverMenuBtn");

const shopOverlay = document.getElementById("shopOverlay");
const shopListEl = document.getElementById("shopList");
const shopStatusEl = document.getElementById("shopStatus");
const closeShopBtn = document.getElementById("closeShop");

const trophyOverlay = document.getElementById("trophyOverlay");
const trophyListEl = document.getElementById("trophyList");
const trophyProgressEl = document.getElementById("trophyProgress");
const closeTrophiesBtn = document.getElementById("closeTrophies");
const trophyToastEl = document.getElementById("trophyToast");

let keys = {};
let gameTime = 0;
let animationId = null;
let loopLastTime = 0;
let loopAccumulator = 0;

const SIM_STEP_MS = 1000 / 60;
const MAX_FRAME_MS = 90;
const MAX_SIM_STEPS = 5;

let score = 0;
let isGameOver = false;
let isMainMenu = true;
let isPaused = false;

// -------------------- Tuning --------------------
const MOVE_SPEED = 5;
const CONTROL_ACCEL = 0.72;
const CONTROL_TURN_ACCEL = 1.08;
const CONTROL_FRICTION = 0.86;
const JUMP_FORCE = 9;
const GRAVITY = 0.25;
const MAX_FALL_SPEED = 12;
const LANDING_EDGE_GRACE = 8;
const LANDING_VERTICAL_GRACE = 22;
const WATCHER_TELEGRAPH_FRAMES = 34;
const DAMAGE_GRACE_FRAMES = 48;
const REVIVE_GRACE_FRAMES = 96;
const NEAR_MISS_RADIUS = 34;
const PERFECT_LANDING_RADIUS = 16;
const PERFECT_STREAK_REWARD = 4;
const DREAD_GATE_MIN_HEIGHT = 180;
const DREAD_GATE_MIN_VERTICAL_SPACING = 205;
const DREAD_GATE_PULL_RADIUS = 44;
const TOUCH_STEER_DEAD_ZONE = 18;
const TOUCH_STEER_FULL_RANGE = 150;
const MOVING_PLATFORM_CARRY = 0.72;
const BASE_SHARD_PULL_RADIUS = 38;
const MAGNET_SHARD_PULL_RADIUS = 112;
const WRAP_GATE_BAND = 82;
const DEATH_IMPACT_FRAMES = 42;

const PLATFORM_W = 72;
const PLATFORM_H = 24;
const ROUTE_BASE_Y = 600;
const MIN_MOVING_PLATFORM_SPEED = 1.2;
const MIN_MOVING_PLATFORM_RANGE = 34;

const PLATFORM_TILES = {
  normal: makePlatformTile("assets/tile1.png", 166, 582, 921, 109),
  break: makePlatformTile("assets/tile2.png", 222, 590, 823, 125),
  moving: makePlatformTile("assets/tile3.png", 196, 562, 863, 147),
  boost: makeSprite("assets/tile4.png", 148, 474, 959, 309),
  vanish: makePlatformTile("assets/tile5.png", 96, 551, 1085, 173),
};

const ENEMY_SPRITES = {
  wraith: [
    makeEnemySprite("assets/enemy1.png", 1464, 540, 2316, 3492, 44, 68),
    makeEnemySprite("assets/enemy3.png", 1500, 888, 2532, 2736, 56, 61),
    makeEnemySprite("assets/enemy5.png", 1116, 1188, 3192, 2148, 68, 46),
  ],
  watcher: [
    makeEnemySprite("assets/enemy2.png", 1620, 852, 2208, 2820, 48, 62),
    makeEnemySprite("assets/enemy4.png", 1008, 1248, 3420, 1884, 70, 39),
    makeEnemySprite("assets/enemy6.png", 1584, 804, 2196, 2856, 48, 63),
  ],
};
const HAZARD_SPRITE = ENEMY_SPRITES.watcher[0];
const DREAD_GATE_SPRITE = makeSprite("assets/gate.png", 1038, 498, 3307, 3577);
const POWERUP_SPRITES = {
  wings: makeSprite("assets/wings.png", 1140, 1224, 3115, 1891),
  shield: makeSprite("assets/shield.png", 1692, 1056, 2040, 2328),
  spring: makeSprite("assets/spring.png", 1644, 888, 2083, 2767),
};
const PLAYER_SPRITES = {
  right: makeImage("assets/character1.png"),
  left: makeImage("assets/character2.png"),
};

const COSTUMES = [
  {
    id: "cannon_stitch",
    name: "Cannon Stitch",
    cost: 25,
    desc: "Purple battle cloth for the climb.",
    sprites: {
      right: makeImage("assets/costume1a.png"),
      left: makeImage("assets/costume1b.png"),
    },
  },
  {
    id: "ashen_cannon",
    name: "Ashen Cannon",
    cost: 25,
    desc: "Yellow patched cloth for stubborn climbs.",
    sprites: {
      right: makeImage("assets/costume2a.png"),
      left: makeImage("assets/costume2b.png"),
    },
  },
  {
    id: "blue_cannon",
    name: "Blue Cannon",
    cost: 25,
    desc: "Blue stitched cloth with a colder glare.",
    sprites: {
      right: makeImage("assets/costume3a.png"),
      left: makeImage("assets/costume3b.png"),
    },
  },
  {
    id: "werewolf",
    name: "Werewolf",
    cost: 50,
    desc: "A moon-cursed costume for savage climbs.",
    sprites: {
      right: makeImage("assets/wolfcostumea.png"),
      left: makeImage("assets/wolfcostumeb.png"),
    },
  },
  {
    id: "alien",
    name: "Alien",
    cost: 50,
    desc: "A strange visitor from a colder pit.",
    sprites: {
      right: makeImage("assets/aliencostumea.png"),
      left: makeImage("assets/aliencostumeb.png"),
    },
  },
  {
    id: "devil",
    name: "Devil",
    cost: 50,
    desc: "A horned disguise fit for Hell Mode.",
    sprites: {
      right: makeImage("assets/devilcostumea.png"),
      left: makeImage("assets/devilcostumeb.png"),
    },
  },
  {
    id: "clown",
    name: "Clown",
    cost: 50,
    desc: "A carnival nightmare costume.",
    sprites: {
      right: makeImage("assets/clowncostumea.png"),
      left: makeImage("assets/clowncostumeb.png"),
    },
  },
];

const BONUS_LEVELS = [
  {
    id: "christmas_bonus",
    name: "Christmas Bonus",
    cost: 100,
    desc: "Swap the climb into the Christmas bonus background set.",
    scenes: [
      { src: "assets/christmasbonus1.png", name: "Frostfall Gate", motif: "christmas", accent: "#e9f7ff", glow: "#1a6e86" },
      { src: "assets/christmasbonus2.png", name: "Holly Furnace", motif: "christmas", accent: "#ef4444", glow: "#0f6b48" },
      { src: "assets/christmasbonus3.png", name: "Yuletide Abyss", motif: "christmas", accent: "#f6d365", glow: "#194f70" },
    ],
  },
  {
    id: "space_bonus",
    name: "Space Bonus",
    cost: 100,
    desc: "Swap the climb into the space bonus background set.",
    scenes: [
      { src: "assets/spacebonus1.png", name: "Starfall Rift", motif: "space", accent: "#8de7ff", glow: "#172554" },
      { src: "assets/spacebonus2.png", name: "Nebula Furnace", motif: "space", accent: "#c25cff", glow: "#3b0764" },
      { src: "assets/spacebonus3.png", name: "Cosmic Abyss", motif: "space", accent: "#f6d365", glow: "#0f172a" },
    ],
  },
];

// Route safety: keep required jumps comfortably reachable.
// The canvas wraps, but the generator does NOT rely on edge-wrap jumps for fairness.
const MAX_ROUTE_DX = 185;
const MOVING_PLATFORM_RANGE = 52;
const MIN_BRIDGE_GAP = 34;

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

function approach(value, target, amount) {
  if (value < target) return Math.min(value + amount, target);
  if (value > target) return Math.max(value - amount, target);
  return target;
}

function makeImage(src) {
  const img = new Image();
  img.src = src;
  return img;
}

function makePlatformTile(src, sx, sy, sw, sh) {
  return makeSprite(src, sx, sy, sw, sh);
}

function makeSprite(src, sx, sy, sw, sh) {
  return { img: makeImage(src), sx, sy, sw, sh };
}

function makeEnemySprite(src, sx, sy, sw, sh, drawW, drawH) {
  return { ...makeSprite(src, sx, sy, sw, sh), drawW, drawH };
}

let trimCanvas = null;
let trimCtx = null;

function fullImageSourceRect(img) {
  return { sx: 0, sy: 0, sw: img.naturalWidth, sh: img.naturalHeight };
}

function trimTransparentSourceRect(img) {
  if (img.__trimmedSourceRect) return img.__trimmedSourceRect;

  const fallback = fullImageSourceRect(img);
  try {
    trimCanvas ||= document.createElement("canvas");
    trimCtx ||= trimCanvas.getContext("2d", { willReadFrequently: true });
    if (!trimCtx) return fallback;

    trimCanvas.width = img.naturalWidth;
    trimCanvas.height = img.naturalHeight;
    trimCtx.clearRect(0, 0, trimCanvas.width, trimCanvas.height);
    trimCtx.drawImage(img, 0, 0);

    const { data } = trimCtx.getImageData(0, 0, trimCanvas.width, trimCanvas.height);
    let minX = trimCanvas.width;
    let minY = trimCanvas.height;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < trimCanvas.height; y++) {
      for (let x = 0; x < trimCanvas.width; x++) {
        const alpha = data[(y * trimCanvas.width + x) * 4 + 3];
        if (alpha <= 8) continue;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }

    img.__trimmedSourceRect = maxX >= minX && maxY >= minY
      ? { sx: minX, sy: minY, sw: maxX - minX + 1, sh: maxY - minY + 1 }
      : fallback;
    return img.__trimmedSourceRect;
  } catch (err) {
    return fallback;
  }
}

function spriteSourceRect(sprite) {
  const img = sprite?.img;
  if (!img || !img.complete || img.naturalWidth <= 0 || img.naturalHeight <= 0) return null;

  const sx = Number(sprite.sx || 0);
  const sy = Number(sprite.sy || 0);
  const sw = Number(sprite.sw || img.naturalWidth);
  const sh = Number(sprite.sh || img.naturalHeight);

  if (
    sx >= 0 &&
    sy >= 0 &&
    sw > 0 &&
    sh > 0 &&
    sx + sw <= img.naturalWidth &&
    sy + sh <= img.naturalHeight
  ) {
    return { sx, sy, sw, sh };
  }

  return trimTransparentSourceRect(img);
}

function movingPlatformVelocity(dir, diff) {
  return dir * Math.max(MIN_MOVING_PLATFORM_SPEED, diff.moveSpeed || 0);
}

// Jump height estimate (for safe gap caps)
function maxJumpHeightPx() {
  return (JUMP_FORCE * JUMP_FORCE) / (2 * GRAVITY);
}
const SAFE_GAP = Math.min(120, Math.floor(maxJumpHeightPx() * 0.62));
const HELL_SAFE_GAP = Math.min(114, Math.floor(maxJumpHeightPx() * 0.70));

function activeSafeGap() {
  return isHellMode() ? HELL_SAFE_GAP : SAFE_GAP;
}

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
const MODES = ["classic", "daily", "hell"];
let mode = localStorage.getItem(MODE_KEY) || "classic"; // "classic" | "daily" | "hell"
if (!MODES.includes(mode)) mode = "classic";

function isHellMode() { return mode === "hell"; }
function allowsHorizontalWrap() { return !isHellMode(); }
function modeLabel() {
  if (mode === "daily") return "Daily";
  if (mode === "hell") return "Hell";
  return "Classic";
}

function pad2(n) { return String(n).padStart(2, "0"); }
function todayLocalStr() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function classicBestKey() { return "hellclimb_best_classic"; }
function dailyBestKey(dateStr) { return `hellclimb_best_daily_${dateStr}`; }
function hellBestKey() { return "hellclimb_best_hell"; }
function getClassicBest() { return Number(localStorage.getItem(classicBestKey()) || 0); }
function getDailyBest() { return Number(localStorage.getItem(dailyBestKey(todayLocalStr())) || 0); }
function getHellBest() { return Number(localStorage.getItem(hellBestKey()) || 0); }

const SOUL_KEY = "hellclimb_total_souls_v1";
function getTotalSouls() { return Number(localStorage.getItem(SOUL_KEY) || 0); }
function setTotalSouls(val) { localStorage.setItem(SOUL_KEY, String(val)); }
let totalSouls = getTotalSouls();

const RITE_KEY = "hellclimb_total_rites_v1";
function getTotalRites() { return Number(localStorage.getItem(RITE_KEY) || 0); }
function setTotalRites(val) { localStorage.setItem(RITE_KEY, String(val)); }
let totalRites = getTotalRites();

const POWERUP_TOTALS_KEY = "hellclimb_powerup_totals_v1";
function loadPowerupTotals() {
  try {
    const raw = JSON.parse(localStorage.getItem(POWERUP_TOTALS_KEY) || "{}");
    return {
      wings: Number(raw.wings || 0),
      shield: Number(raw.shield || 0),
      spring: Number(raw.spring || 0),
    };
  } catch (err) {
    return { wings: 0, shield: 0, spring: 0 };
  }
}
function savePowerupTotals() {
  localStorage.setItem(POWERUP_TOTALS_KEY, JSON.stringify(powerupTotals));
}
let powerupTotals = loadPowerupTotals();

const ENEMY_TOTAL_KEY = "hellclimb_total_banished_v1";
function getTotalEnemiesBanished() { return Number(localStorage.getItem(ENEMY_TOTAL_KEY) || 0); }
function setTotalEnemiesBanished(val) { localStorage.setItem(ENEMY_TOTAL_KEY, String(val)); }
let totalEnemiesBanished = getTotalEnemiesBanished();

const SHARD_TOTAL_KEY = "hellclimb_total_shards_v1";
function getTotalShards() { return Number(localStorage.getItem(SHARD_TOTAL_KEY) || 0); }
function setTotalShards(val) { localStorage.setItem(SHARD_TOTAL_KEY, String(val)); }
let totalShards = getTotalShards();

const SHOP_SPEND_KEY = "hellclimb_shop_spend_v1";
function getTotalShopSpend() { return Number(localStorage.getItem(SHOP_SPEND_KEY) || 0); }
function setTotalShopSpend(val) { localStorage.setItem(SHOP_SPEND_KEY, String(val)); }
let totalShopSpend = getTotalShopSpend();

const SHOP_KEY = "hellclimb_shop_v1";
const SHOP_ITEMS = [
  { id: "starter_shield", name: "Grave Warding", cost: 60, desc: "Begin each run with one shield." },
  { id: "soul_magnet", name: "Soul Magnet", cost: 85, desc: "Pull soul shards from farther away." },
  { id: "blast_focus", name: "Blast Focus", cost: 110, desc: "Soul-blast recharges faster and hits wider." },
  { id: "blood_tithe", name: "Blood Tithe", cost: 140, desc: "Bank 25% more souls at game over." },
  { id: "ember_trail", name: "Ember Trail", cost: 45, desc: "Leave a burning spirit trail while climbing." },
  { id: "bone_spring", name: "Bone Spring", cost: 90, desc: "Begin each run with one spring charge." },
  { id: "last_rites", name: "Last Rites", cost: 180, desc: "Survive one fatal mistake per run." },
  { id: "hex_rounds", name: "Hex Rounds", cost: 160, desc: "Soul-blasts pierce one extra target." },
  { id: "rite_tithe", name: "Rite Tithe", cost: 130, desc: "Completed rites pay 5 extra souls." },
  { id: "ash_halo", name: "Ash Halo", cost: 75, desc: "Wear a pale halo over your ghost." },
];

function loadShopState() {
  try {
    const raw = JSON.parse(localStorage.getItem(SHOP_KEY) || "{}");
    return {
      owned: Array.isArray(raw.owned) ? raw.owned : [],
      ownedCostumes: Array.isArray(raw.ownedCostumes) ? raw.ownedCostumes : [],
      ownedLevels: Array.isArray(raw.ownedLevels) ? raw.ownedLevels : [],
      equippedCostume: typeof raw.equippedCostume === "string" ? raw.equippedCostume : null,
      activeLevel: typeof raw.activeLevel === "string" ? raw.activeLevel : null,
    };
  } catch (err) {
    return { owned: [], ownedCostumes: [], ownedLevels: [], equippedCostume: null, activeLevel: null };
  }
}

function saveShopState() {
  localStorage.setItem(SHOP_KEY, JSON.stringify(shopState));
}

let shopState = loadShopState();

function normalizeOwnedShopEntries() {
  const validItems = new Set(SHOP_ITEMS.map((item) => item.id));
  const validCostumes = new Set(COSTUMES.map((costume) => costume.id));
  const validLevels = new Set(BONUS_LEVELS.map((level) => level.id));
  const original = JSON.stringify(shopState);

  shopState.owned = shopState.owned.filter((id) => validItems.has(id));
  shopState.ownedCostumes = shopState.ownedCostumes.filter((id) => validCostumes.has(id));
  shopState.ownedLevels = shopState.ownedLevels.filter((id) => validLevels.has(id));

  if (JSON.stringify(shopState) !== original) saveShopState();
}

function hasShopItem(id) {
  return shopState.owned.includes(id);
}

function getCostume(id) {
  return COSTUMES.find((costume) => costume.id === id) || null;
}

function getBonusLevel(id) {
  return BONUS_LEVELS.find((level) => level.id === id) || null;
}

function ownsCostume(id) {
  return shopState.ownedCostumes.includes(id);
}

function ownsBonusLevel(id) {
  return shopState.ownedLevels.includes(id);
}

function getOwnedShopEntryCount() {
  return shopState.owned.length + shopState.ownedCostumes.length + shopState.ownedLevels.length;
}

function getTotalShopEntryCount() {
  return SHOP_ITEMS.length + COSTUMES.length + BONUS_LEVELS.length;
}

function normalizeEquippedCostume() {
  if (shopState.equippedCostume && !ownsCostume(shopState.equippedCostume)) {
    shopState.equippedCostume = null;
    saveShopState();
  }
}

function normalizeActiveLevel() {
  if (shopState.activeLevel && !ownsBonusLevel(shopState.activeLevel)) {
    shopState.activeLevel = null;
    saveShopState();
  }
}

normalizeOwnedShopEntries();
normalizeEquippedCostume();
normalizeActiveLevel();

function getBestForMode() {
  if (mode === "daily") return getDailyBest();
  if (mode === "hell") return getHellBest();
  return getClassicBest();
}
function setBestForMode(val) {
  if (mode === "daily") localStorage.setItem(dailyBestKey(todayLocalStr()), String(val));
  else if (mode === "hell") localStorage.setItem(hellBestKey(), String(val));
  else localStorage.setItem(classicBestKey(), String(val));
}

let best = getBestForMode();
bestEl.textContent = String(best);

function updateModeUI() {
  modeBadge.classList.toggle("hell-mode", mode === "hell");
  if (mode === "daily") {
    modeBadge.textContent = "DAILY";
    dailyDateEl.hidden = false;
    dailyDateEl.textContent = todayLocalStr();
  } else if (mode === "hell") {
    modeBadge.textContent = "HELL";
    dailyDateEl.hidden = true;
  } else {
    modeBadge.textContent = "CLASSIC";
    dailyDateEl.hidden = true;
  }
  best = getBestForMode();
  bestEl.textContent = String(best);
  menuModeBtn.textContent = `Mode: ${modeLabel()}`;
  updateMenuStats();
}
updateModeUI();

function updateMenuStats() {
  menuClassicBestEl.textContent = String(getClassicBest());
  menuDailyBestEl.textContent = String(getDailyBest());
  menuHellBestEl.textContent = String(getHellBest());
  menuSoulsEl.textContent = String(totalSouls);
  menuRitesEl.textContent = String(totalRites);
  if (!shopOverlay.hidden) renderShop();
}

function renderShop(message = "") {
  shopStatusEl.textContent = message || `Souls: ${totalSouls}`;
  shopListEl.innerHTML = `
    <div class="shop-section">
      <div class="shop-section-title">Upgrades</div>
      <div class="shop-grid">${renderUpgradeCards()}</div>
    </div>
    <div class="shop-section">
      <div class="shop-section-title">Costumes</div>
      <div class="shop-grid">${renderCostumeCards()}</div>
    </div>
    <div class="shop-section">
      <div class="shop-section-title">Bonus Levels</div>
      <div class="shop-grid">${renderBonusLevelCards()}</div>
    </div>
    ${renderCostumeCloset()}
    ${renderBonusLevelCloset()}
  `;
}

function renderUpgradeCards() {
  return SHOP_ITEMS
    .map((item) => {
      const owned = hasShopItem(item.id);
      const affordable = totalSouls >= item.cost;
      const label = owned ? "Owned" : affordable ? `Buy - ${item.cost}` : `Need ${item.cost}`;
      return `
        <div class="shop-card ${owned ? "owned" : ""}">
          <div class="shop-name">${item.name}</div>
          <div class="shop-desc">${item.desc}</div>
          <button class="shop-buy" type="button" data-shop-id="${item.id}" ${owned || !affordable ? "disabled" : ""}>${label}</button>
        </div>
      `;
    })
    .join("");
}

function renderCostumeCards() {
  return COSTUMES
    .map((costume) => {
      const owned = ownsCostume(costume.id);
      const affordable = totalSouls >= costume.cost;
      const equipped = shopState.equippedCostume === costume.id;
      const label = owned ? (equipped ? "Equipped" : "Owned") : affordable ? `Buy - ${costume.cost}` : `Need ${costume.cost}`;
      return `
        <div class="shop-card costume-card ${owned ? "owned" : ""}">
          <div class="shop-name">${costume.name}</div>
          <div class="costume-preview" aria-label="${costume.name} preview">
            <img src="${costume.sprites.left.src}" alt="${costume.name} facing left">
            <img src="${costume.sprites.right.src}" alt="${costume.name} facing right">
          </div>
          <div class="shop-desc">${costume.desc}</div>
          <button class="shop-buy" type="button" data-costume-id="${costume.id}" ${owned || !affordable ? "disabled" : ""}>${label}</button>
        </div>
      `;
    })
    .join("");
}

function renderBonusLevelCards() {
  return BONUS_LEVELS
    .map((level) => {
      const owned = ownsBonusLevel(level.id);
      const affordable = totalSouls >= level.cost;
      const active = shopState.activeLevel === level.id;
      const label = owned ? (active ? "Active" : "Owned") : affordable ? `Buy - ${level.cost}` : `Need ${level.cost}`;
      return `
        <div class="shop-card level-card ${owned ? "owned" : ""}">
          <div class="shop-name">${level.name}</div>
          <div class="level-preview" aria-label="${level.name} preview">
            ${level.scenes.map((scene) => `<img src="${scene.src}" alt="${scene.name}">`).join("")}
          </div>
          <div class="shop-desc">${level.desc}</div>
          <button class="shop-buy" type="button" data-level-id="${level.id}" ${owned || !affordable ? "disabled" : ""}>${label}</button>
        </div>
      `;
    })
    .join("");
}

function renderCostumeCloset() {
  const ownedCostumes = COSTUMES.filter((costume) => ownsCostume(costume.id));
  if (ownedCostumes.length === 0) return "";

  const equipped = getCostume(shopState.equippedCostume);
  const equippedName = equipped ? equipped.name : "Classic";

  return `
    <div class="shop-section costume-closet">
      <div class="shop-section-title">Costume Closet</div>
      <div class="closet-status">Current: ${equippedName}</div>
      <div class="shop-grid">
        <div class="shop-card closet-card ${shopState.equippedCostume ? "" : "owned"}">
          <div class="shop-name">Classic</div>
          <div class="shop-desc">Use the original climber look.</div>
          <button class="shop-buy" type="button" data-equip-costume-id="" ${shopState.equippedCostume ? "" : "disabled"}>Turn Off</button>
        </div>
        ${ownedCostumes.map((costume) => `
          <div class="shop-card closet-card ${shopState.equippedCostume === costume.id ? "owned" : ""}">
            <div class="shop-name">${costume.name}</div>
            <div class="shop-desc">${shopState.equippedCostume === costume.id ? "Costume is on." : "Costume is off."}</div>
            <button class="shop-buy" type="button" data-equip-costume-id="${costume.id}">${shopState.equippedCostume === costume.id ? "Turn Off" : "Turn On"}</button>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function renderBonusLevelCloset() {
  const ownedLevels = BONUS_LEVELS.filter((level) => ownsBonusLevel(level.id));
  if (ownedLevels.length === 0) return "";

  const active = getBonusLevel(shopState.activeLevel);
  const activeName = active ? active.name : "Original Climb";

  return `
    <div class="shop-section level-closet">
      <div class="shop-section-title">Level Toggle</div>
      <div class="closet-status">Current: ${activeName}</div>
      <div class="shop-grid">
        <div class="shop-card closet-card ${shopState.activeLevel ? "" : "owned"}">
          <div class="shop-name">Original Climb</div>
          <div class="shop-desc">Use the standard Hell Climb backgrounds.</div>
          <button class="shop-buy" type="button" data-toggle-level-id="" ${shopState.activeLevel ? "" : "disabled"}>Turn Off</button>
        </div>
        ${ownedLevels.map((level) => `
          <div class="shop-card closet-card ${shopState.activeLevel === level.id ? "owned" : ""}">
            <div class="shop-name">${level.name}</div>
            <div class="shop-desc">${shopState.activeLevel === level.id ? "Bonus level is on." : "Bonus level is off."}</div>
            <button class="shop-buy" type="button" data-toggle-level-id="${level.id}">${shopState.activeLevel === level.id ? "Turn Off" : "Turn On"}</button>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function openShop() {
  trophyOverlay.hidden = true;
  renderShop();
  shopOverlay.hidden = false;
  updateControlUI();
  setTimeout(() => closeShopBtn.focus(), 0);
}

function closeShop() {
  shopOverlay.hidden = true;
  keys = {};
  updateControlUI();
  menuShopBtn.focus();
}

function buyShopItem(id) {
  const item = SHOP_ITEMS.find((candidate) => candidate.id === id);
  if (!item || hasShopItem(id)) return;

  if (totalSouls < item.cost) {
    renderShop(`Need ${item.cost - totalSouls} more souls`);
    return;
  }

  totalSouls -= item.cost;
  setTotalSouls(totalSouls);
  shopState.owned.push(id);
  saveShopState();
  totalShopSpend += item.cost;
  setTotalShopSpend(totalShopSpend);
  checkShopTrophies();
  updateUI();
  updateMenuStats();
  renderShop(`${item.name} purchased`);
  playSound("power");
}

function buyCostume(id) {
  const costume = getCostume(id);
  if (!costume || ownsCostume(id)) return;

  if (totalSouls < costume.cost) {
    renderShop(`Need ${costume.cost - totalSouls} more souls`);
    return;
  }

  totalSouls -= costume.cost;
  setTotalSouls(totalSouls);
  shopState.ownedCostumes.push(id);
  shopState.equippedCostume = id;
  saveShopState();
  totalShopSpend += costume.cost;
  setTotalShopSpend(totalShopSpend);
  checkShopTrophies();
  updateUI();
  updateMenuStats();
  renderShop(`${costume.name} purchased and equipped`);
  playSound("power");
}

function buyBonusLevel(id) {
  const level = getBonusLevel(id);
  if (!level || ownsBonusLevel(id)) return;

  if (totalSouls < level.cost) {
    renderShop(`Need ${level.cost - totalSouls} more souls`);
    return;
  }

  totalSouls -= level.cost;
  setTotalSouls(totalSouls);
  shopState.ownedLevels.push(id);
  shopState.activeLevel = id;
  saveShopState();
  totalShopSpend += level.cost;
  setTotalShopSpend(totalShopSpend);
  checkShopTrophies();
  updateUI();
  updateMenuStats();
  renderShop(`${level.name} purchased and turned on`);
  playSound("power");
}

function equipCostume(id) {
  if (!id) {
    shopState.equippedCostume = null;
    saveShopState();
    renderShop("Classic costume equipped");
    return;
  }

  const costume = getCostume(id);
  if (!costume || !ownsCostume(id)) return;
  shopState.equippedCostume = shopState.equippedCostume === id ? null : id;
  saveShopState();
  renderShop(shopState.equippedCostume === id ? `${costume.name} equipped` : "Classic costume equipped");
}

function toggleBonusLevel(id) {
  if (!id) {
    shopState.activeLevel = null;
    saveShopState();
    renderShop("Original climb enabled");
    return;
  }

  const level = getBonusLevel(id);
  if (!level || !ownsBonusLevel(id)) return;
  shopState.activeLevel = shopState.activeLevel === id ? null : id;
  saveShopState();
  renderShop(shopState.activeLevel === id ? `${level.name} enabled` : "Original climb enabled");
}

function getPlayerSpriteSet() {
  const equippedCostume = getCostume(shopState.equippedCostume);
  if (equippedCostume && ownsCostume(equippedCostume.id)) return equippedCostume.sprites;

  return PLAYER_SPRITES;
}

function getActiveBonusLevel() {
  const level = getBonusLevel(shopState.activeLevel);
  if (level && ownsBonusLevel(level.id)) return level;
  return null;
}

function checkShopTrophies() {
  if (getOwnedShopEntryCount() >= 1) unlockTrophy("first_offering");
  if (getOwnedShopEntryCount() >= 3) unlockTrophy("curio_cabinet");
  if (getOwnedShopEntryCount() >= getTotalShopEntryCount()) unlockTrophy("infernal_arsenal");
  if (totalShopSpend >= 500) unlockTrophy("soul_spender");
}

// -------------------- Trophies --------------------
const TROPHY_KEY = "hellclimb_trophies_v2";
const TROPHIES = [
  { id: "ash_boots", name: "Ash Boots", desc: "Reach height 150." },
  { id: "pit_scout", name: "Pit Scout", desc: "Reach height 400." },
  { id: "furnace_bound", name: "Furnace Bound", desc: "Reach height 900." },
  { id: "void_touched", name: "Void Touched", desc: "Reach height 1800." },
  { id: "abyss_witness", name: "Abyss Witness", desc: "Reach height 3000." },
  { id: "chain_rhythm", name: "Chain Rhythm", desc: "Land 35 bounces in one run." },
  { id: "relentless_spirit", name: "Relentless Spirit", desc: "Land 110 bounces in one run." },
  { id: "endless_knell", name: "Endless Knell", desc: "Land 180 bounces in one run." },
  { id: "dead_center", name: "Dead Center", desc: "Land 18 perfect bounces in one run." },
  { id: "needle_threader", name: "Needle Threader", desc: "Chain 6 perfect bounces in one run." },
  { id: "bone_harvester", name: "Bone Harvester", desc: "Break 8 crumbling platforms in one run." },
  { id: "bone_tax", name: "Bone Tax", desc: "Break 16 crumbling platforms in one run." },
  { id: "mist_rider", name: "Mist Rider", desc: "Bounce on 16 moving platforms in one run." },
  { id: "mist_marathon", name: "Mist Marathon", desc: "Bounce on 30 moving platforms in one run." },
  { id: "winged_escape", name: "Winged Escape", desc: "Collect Bone Wings 3 times across runs." },
  { id: "shielded_soul", name: "Shielded Soul", desc: "Collect Infernal Shields 3 times across runs." },
  { id: "spring_loaded", name: "Spring Loaded", desc: "Collect Springs 5 times across runs." },
  { id: "full_reliquary", name: "Full Reliquary", desc: "Collect all 3 powerup types in one run." },
  { id: "hazard_ghost", name: "Hazard Ghost", desc: "Dodge 7 hazards in one run." },
  { id: "bulwark", name: "Bulwark", desc: "Block 3 hazards with shields in one run." },
  { id: "last_gasp", name: "Last Gasp", desc: "Recover from 3 near falls in one run." },
  { id: "no_bargain", name: "No Bargain", desc: "Reach height 500 without collecting a powerup." },
  { id: "shard_cutter", name: "Shard Cutter", desc: "Collect 18 soul shards in one run." },
  { id: "gemini_vein", name: "Gemini Vein", desc: "Collect 35 soul shards in one run." },
  { id: "gate_runner", name: "Gate Runner", desc: "Thread 8 dread gates in one run." },
  { id: "rite_keeper", name: "Rite Keeper", desc: "Complete a run rite." },
  { id: "daily_oath", name: "Daily Oath", desc: "Complete a Daily rite." },
  { id: "rite_devotee", name: "Rite Devotee", desc: "Complete 5 rites across runs." },
  { id: "rite_ascendant", name: "Rite Ascendant", desc: "Complete 20 rites across runs." },
  { id: "soul_banker", name: "Soul Banker", desc: "Bank 150 souls." },
  { id: "soul_hoard", name: "Soul Hoard", desc: "Bank 500 souls." },
  { id: "abyss_accountant", name: "Abyss Accountant", desc: "Bank 40 souls from one run." },
  { id: "grave_whisperer", name: "Grave Whisperer", desc: "Banish 8 enemies in one run." },
  { id: "exorcist", name: "Exorcist", desc: "Banish 50 enemies across runs." },
  { id: "first_offering", name: "First Offering", desc: "Buy an item from the Soul Shop." },
  { id: "curio_cabinet", name: "Curio Cabinet", desc: "Own 3 Soul Shop items." },
  { id: "infernal_arsenal", name: "Infernal Arsenal", desc: "Own every Soul Shop item." },
  { id: "soul_spender", name: "Soul Spender", desc: "Spend 500 souls in the shop." },
  { id: "cheated_pit", name: "Cheated The Pit", desc: "Use Last Rites to survive death." },
  { id: "soul_marksman", name: "Soul Marksman", desc: "Banish 5 enemies with blasts in one run." },
  { id: "grave_stomper", name: "Grave Stomper", desc: "Stomp 3 enemies in one run." },
  { id: "shard_ledger", name: "Shard Ledger", desc: "Collect 150 soul shards across runs." },
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
    shieldBlocks: 0,
    enemiesBanished: 0,
    blastBanishes: 0,
    stompBanishes: 0,
    revivals: 0,
    nearMisses: 0,
    nearFallRecoveries: 0,
    shards: 0,
    powerups: 0,
    powerupTypes: new Set(),
    lastPowerupType: null,
    soulReward: 0,
    soulsBanked: false,
    contractCompleted: false,
    nearFallArmed: false,
    bounceStreak: 0,
    bestBounceStreak: 0,
    streakSouls: 0,
    perfectLandings: 0,
    perfectStreak: 0,
    bestPerfectStreak: 0,
    perfectSouls: 0,
    dreadGates: 0,
    gateSouls: 0,
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
  if (score >= 150) unlockTrophy("ash_boots");
  if (score >= 400) unlockTrophy("pit_scout");
  if (score >= 900) unlockTrophy("furnace_bound");
  if (score >= 1800) unlockTrophy("void_touched");
  if (score >= 3000) unlockTrophy("abyss_witness");
  if (score >= 500 && runStats.powerups === 0) unlockTrophy("no_bargain");
}

function recordPlatformBounce(platform) {
  runStats.jumps++;
  runStats.bounceStreak++;
  runStats.bestBounceStreak = Math.max(runStats.bestBounceStreak, runStats.bounceStreak);

  const playerCx = t_player.x + t_player.w / 2;
  const centerDelta = activeHorizontalDistance(playerCx, platformCenterX(platform));
  const perfect = centerDelta <= PERFECT_LANDING_RADIUS;

  if (perfect) {
    runStats.perfectLandings++;
    runStats.perfectStreak++;
    runStats.bestPerfectStreak = Math.max(runStats.bestPerfectStreak, runStats.perfectStreak);
    t_player.perfectFlash = Math.max(t_player.perfectFlash || 0, 18);

    const perfectBonus = runStats.perfectStreak % PERFECT_STREAK_REWARD === 0 ? (isHellMode() ? 2 : 1) : 0;
    if (perfectBonus > 0) {
      runStats.soulReward += perfectBonus;
      runStats.perfectSouls += perfectBonus;
    }

    spawnFloatText(
      playerCx,
      platform.y - 10,
      perfectBonus > 0 ? `PERFECT +${perfectBonus}` : "PERFECT",
      perfectBonus > 0 ? "#8de7ff" : "#f8f1df"
    );
    spawnBurst(playerCx, platform.y + 3, 12, ["#f8f1df", "#ff8a18", "#8de7ff"], 1.4, 4.6);
    playSound("perfect");

    if (runStats.perfectLandings >= 18) unlockTrophy("dead_center");
    if (runStats.perfectStreak >= 6) unlockTrophy("needle_threader");
  } else {
    runStats.perfectStreak = 0;
  }

  if (runStats.bounceStreak > 0 && runStats.bounceStreak % 12 === 0) {
    const bonus = isHellMode() ? 2 : 1;
    runStats.soulReward += bonus;
    runStats.streakSouls += bonus;
    spawnFloatText(t_player.x + t_player.w / 2, t_player.y - 12, `STREAK +${bonus}`, "#8de7ff");
    playSound("shard");
  }

  if (runStats.nearFallArmed) {
    runStats.nearFallRecoveries++;
    runStats.bounceStreak = 1;
    if (runStats.nearFallRecoveries >= 3) unlockTrophy("last_gasp");
  }

  if (runStats.jumps >= 35) unlockTrophy("chain_rhythm");
  if (runStats.jumps >= 110) unlockTrophy("relentless_spirit");
  if (runStats.jumps >= 180) unlockTrophy("endless_knell");
  if (platform.type === "break") {
    runStats.breakBounces++;
    if (runStats.breakBounces >= 8) unlockTrophy("bone_harvester");
    if (runStats.breakBounces >= 16) unlockTrophy("bone_tax");
  }
  if (platform.type === "moving") {
    runStats.movingBounces++;
    if (runStats.movingBounces >= 16) unlockTrophy("mist_rider");
    if (runStats.movingBounces >= 30) unlockTrophy("mist_marathon");
  }

  runStats.nearFallArmed = false;
  checkRunContract();

  return { perfect, centerDelta };
}

function recordPowerupTrophy(type) {
  if (!Object.prototype.hasOwnProperty.call(powerupTotals, type)) return;

  runStats.powerups++;
  runStats.powerupTypes.add(type);
  powerupTotals[type]++;
  savePowerupTotals();

  if (type === "wings" && powerupTotals.wings >= 3) unlockTrophy("winged_escape");
  if (type === "shield" && powerupTotals.shield >= 3) unlockTrophy("shielded_soul");
  if (type === "spring" && powerupTotals.spring >= 5) unlockTrophy("spring_loaded");
  if (runStats.powerupTypes.size >= POWERUP_TYPES.length) unlockTrophy("full_reliquary");
}

function recordHazardDodged() {
  runStats.hazardsDodged++;
  if (runStats.hazardsDodged >= 7) unlockTrophy("hazard_ghost");
  checkRunContract();
}

function recordEnemyBanished(method = "banish") {
  runStats.enemiesBanished++;
  totalEnemiesBanished++;
  setTotalEnemiesBanished(totalEnemiesBanished);

  if (method === "blast") {
    runStats.blastBanishes++;
    if (runStats.blastBanishes >= 5) unlockTrophy("soul_marksman");
  }
  if (method === "stomp") {
    runStats.stompBanishes++;
    if (runStats.stompBanishes >= 3) unlockTrophy("grave_stomper");
  }

  if (runStats.enemiesBanished >= 8) unlockTrophy("grave_whisperer");
  if (totalEnemiesBanished >= 50) unlockTrophy("exorcist");
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
  shopOverlay.hidden = true;
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
checkShopTrophies();

// -------------------- Replay Hooks --------------------
const RUN_OMENS = [
  {
    id: "rich_veins",
    name: "Rich Veins",
    desc: "More soul shards, slightly meaner hazards.",
    shardBonus: 0.11,
    powerBonus: 0.00,
    hazardBonus: 0.02,
    moveBonus: 0.00,
    breakBonus: 0.00,
  },
  {
    id: "restless_mist",
    name: "Restless Mist",
    desc: "More moving platforms and spring chances.",
    shardBonus: 0.03,
    powerBonus: 0.03,
    hazardBonus: 0.00,
    moveBonus: 0.12,
    breakBonus: 0.00,
  },
  {
    id: "brittle_bones",
    name: "Brittle Bones",
    desc: "More crumbling platforms with extra shards.",
    shardBonus: 0.06,
    powerBonus: 0.00,
    hazardBonus: 0.00,
    moveBonus: 0.00,
    breakBonus: 0.08,
  },
  {
    id: "mercy_flames",
    name: "Mercy Flames",
    desc: "More powerups, but more hazards too.",
    shardBonus: 0.02,
    powerBonus: 0.07,
    hazardBonus: 0.05,
    moveBonus: 0.00,
    breakBonus: 0.00,
  },
  {
    id: "quiet_ash",
    name: "Quiet Ash",
    desc: "Fewer hazards, fewer free shards.",
    shardBonus: -0.02,
    powerBonus: 0.01,
    hazardBonus: -0.04,
    moveBonus: 0.02,
    breakBonus: 0.02,
  },
];

const RUN_CONTRACTS = [
  {
    id: "shard_hunt",
    name: "Shard Hunt",
    desc: "Collect 8 soul shards.",
    target: 8,
    reward: 12,
    progress: () => runStats.shards,
  },
  {
    id: "mist_dance",
    name: "Mist Dance",
    desc: "Bounce on 8 moving platforms.",
    target: 8,
    reward: 14,
    progress: () => runStats.movingBounces,
  },
  {
    id: "bone_rite",
    name: "Bone Rite",
    desc: "Break 4 crumbling platforms.",
    target: 4,
    reward: 14,
    progress: () => runStats.breakBounces,
  },
  {
    id: "ember_thread",
    name: "Ember Thread",
    desc: "Dodge 3 hazards.",
    target: 3,
    reward: 16,
    progress: () => runStats.hazardsDodged,
  },
  {
    id: "gate_thread",
    name: "Gate Thread",
    desc: "Thread 4 dread gates.",
    target: 4,
    reward: 16,
    progress: () => runStats.dreadGates,
  },
  {
    id: "dead_center",
    name: "Dead Center",
    desc: "Land 6 perfect bounces.",
    target: 6,
    reward: 15,
    progress: () => runStats.perfectLandings,
  },
  {
    id: "high_rite",
    name: "High Rite",
    desc: "Reach height 420.",
    target: 420,
    reward: 18,
    progress: () => score,
  },
];

let runOmen = RUN_OMENS[0];
let runContract = RUN_CONTRACTS[0];
let runSetupReady = false;

function seededPick(list, salt) {
  const seedFn = xmur3(`HELLCLIMB:${todayLocalStr()}:${salt}`);
  const rng = mulberry32(seedFn());
  return list[Math.floor(rng() * list.length)];
}

function prepareRunSetup(force = false) {
  if (runSetupReady && !force) {
    updateRunGoalUI();
    return;
  }

  if (mode === "daily") {
    runOmen = seededPick(RUN_OMENS, "omen");
    runContract = seededPick(RUN_CONTRACTS, "contract");
  } else {
    runOmen = RUN_OMENS[Math.floor(Math.random() * RUN_OMENS.length)];
    runContract = RUN_CONTRACTS[Math.floor(Math.random() * RUN_CONTRACTS.length)];
  }
  runSetupReady = true;
  updateRunGoalUI();
}

function runGoalText() {
  if (!runOmen || !runContract) return "RITE: --";
  const progress = clamp(runContract.progress(), 0, runContract.target);
  const done = runStats.contractCompleted ? "DONE" : `${progress}/${runContract.target}`;
  return `RITE: ${runContract.name} ${done} - ${runOmen.name}`;
}

function updateRunGoalUI() {
  const text = runGoalText();
  runGoalEl.textContent = text;
  menuGoalEl.textContent = runOmen && runContract
    ? `${isHellMode() ? "HELL RITE" : "NEXT RITE"}: ${runContract.name} - ${runOmen.name}`
    : "NEXT RITE: --";
}

function adjustedDifficulty(diff) {
  const omenDiff = runOmen ? {
    ...diff,
    breakP: clamp(diff.breakP + runOmen.breakBonus, 0, 0.34),
    moveP: clamp(diff.moveP + runOmen.moveBonus, 0, 0.62),
    vanishP: diff.vanishP,
    boostP: diff.boostP,
    enemyP: diff.enemyP,
  } : diff;

  if (!isHellMode()) return omenDiff;

  return {
    ...omenDiff,
    breakP: clamp(omenDiff.breakP + 0.08, 0.08, 0.42),
    moveP: clamp(omenDiff.moveP + 0.18, 0.22, 0.72),
    vanishP: clamp((omenDiff.vanishP || 0) + 0.08, 0.04, 0.22),
    boostP: clamp((omenDiff.boostP || 0) - 0.015, 0.005, 0.025),
    enemyP: clamp((omenDiff.enemyP || 0) + 0.22, 0.22, 0.42),
    moveSpeed: (omenDiff.moveSpeed || 1.25) * 1.65,
    maxGap: Math.min(activeSafeGap(), (omenDiff.maxGap || SAFE_GAP) + 18),
    maxDX: Math.max(150, (omenDiff.maxDX || MAX_ROUTE_DX) - 26),
  };
}

function checkRunContract() {
  if (!runContract || runStats.contractCompleted) return;
  if (runContract.progress() < runContract.target) {
    updateRunGoalUI();
    return;
  }

  runStats.contractCompleted = true;
  runStats.soulReward += runContract.reward + (hasShopItem("rite_tithe") ? 5 : 0);
  totalRites++;
  setTotalRites(totalRites);
  unlockTrophy("rite_keeper");
  if (mode === "daily") unlockTrophy("daily_oath");
  if (totalRites >= 5) unlockTrophy("rite_devotee");
  if (totalRites >= 20) unlockTrophy("rite_ascendant");
  playSound("power");
  spawnBurst(t_player.x + t_player.w / 2, t_player.y + 4, 28, ["#ff8a18", "#f8f1df", "#8de7ff"], 2.0, 5.8);
  showRunNotice("RITE COMPLETE", `+${runContract.reward + (hasShopItem("rite_tithe") ? 5 : 0)} souls`, "#8de7ff");
  updateRunGoalUI();
}

function bankRunSouls() {
  if (runStats.soulsBanked) return 0;
  runStats.soulsBanked = true;

  const baseEarned = runStats.shards + runStats.soulReward;
  const earned = baseEarned + (hasShopItem("blood_tithe") ? Math.floor(baseEarned * 0.25) : 0);
  if (earned <= 0) return 0;

  totalSouls += earned;
  setTotalSouls(totalSouls);
  if (earned >= 40) unlockTrophy("abyss_accountant");
  if (totalSouls >= 150) unlockTrophy("soul_banker");
  if (totalSouls >= 500) unlockTrophy("soul_hoard");
  return earned;
}

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

function virtualHeightForScreenY(y) {
  return Math.max(0, Math.floor((t_maxHeight + (ROUTE_BASE_Y - y)) / 10));
}

// -------------------- Difficulty Curve (v2) --------------------
function difficultyForHeight(h) {
  if (h < 200) {
    return { breakP: 0.00, moveP: 0.00, vanishP: 0.00, boostP: 0.03, enemyP: 0.00, moveSpeed: 0.0, maxGap: 95, maxDX: 210 };
  }
  if (h < 600) {
    return { breakP: 0.05, moveP: 0.16, vanishP: 0.00, boostP: 0.04, enemyP: 0.04, moveSpeed: 1.35, maxGap: 105, maxDX: 230 };
  }
  if (h < 1200) {
    return { breakP: 0.09, moveP: 0.28, vanishP: 0.05, boostP: 0.04, enemyP: 0.07, moveSpeed: 1.55, maxGap: 112, maxDX: 240 };
  }
  if (h < 2000) {
    return { breakP: 0.13, moveP: 0.38, vanishP: 0.08, boostP: 0.035, enemyP: 0.10, moveSpeed: 1.75, maxGap: Math.min(SAFE_GAP, 116), maxDX: 248 };
  }
  return { breakP: 0.16, moveP: 0.45, vanishP: 0.11, boostP: 0.03, enemyP: 0.13, moveSpeed: 2.0, maxGap: Math.min(SAFE_GAP, 118), maxDX: 255 };
}

// -------------------- Audio --------------------
const SOUND_KEY = "hellclimb_sound";
const MUSIC_SRC = "assets/song1.mp3";
let audioCtx = null;
let masterGain = null;
let musicTrack = null;
let soundSettings = loadSoundSettings();

function loadSoundSettings() {
  try {
    const raw = JSON.parse(localStorage.getItem(SOUND_KEY) || "{}");
    return {
      muted: Boolean(raw.muted),
      volume: clamp(Number(raw.volume ?? 0.7), 0, 1),
      musicEnabled: raw.musicEnabled !== false,
    };
  } catch (err) {
    return { muted: false, volume: 0.7, musicEnabled: true };
  }
}

function saveSoundSettings() {
  localStorage.setItem(SOUND_KEY, JSON.stringify(soundSettings));
}

function applySoundSettings() {
  if (masterGain) masterGain.gain.value = soundSettings.muted ? 0 : 0.18 * soundSettings.volume;
  if (musicTrack) {
    musicTrack.volume = soundSettings.muted ? 0 : 0.5 * soundSettings.volume;
    musicTrack.muted = soundSettings.muted;
  }

  const label = soundSettings.muted ? "Unmute" : "Mute";
  muteBtn.textContent = label;
  menuMuteBtn.textContent = label;
  const musicLabel = soundSettings.musicEnabled ? "Music: On" : "Music: Off";
  menuMusicBtn.textContent = musicLabel;
  pauseMusicBtn.textContent = musicLabel;
  volumeSlider.value = String(Math.round(soundSettings.volume * 100));
  syncMusicPlayback();
}

function setMuted(muted) {
  soundSettings.muted = muted;
  saveSoundSettings();
  applySoundSettings();
}

function setMusicEnabled(enabled) {
  soundSettings.musicEnabled = enabled;
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
  initMusicTrack();
  if (audioCtx) {
    if (audioCtx.state === "suspended") audioCtx.resume();
    syncMusicPlayback();
    return;
  }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) {
    applySoundSettings();
    return;
  }
  audioCtx = new AC();
  masterGain = audioCtx.createGain();
  masterGain.connect(audioCtx.destination);
  applySoundSettings();
}

function initMusicTrack() {
  if (musicTrack) return;
  musicTrack = new Audio(MUSIC_SRC);
  musicTrack.loop = true;
  musicTrack.preload = "auto";
}

function syncMusicPlayback() {
  if (!musicTrack) return;
  const shouldPlay = soundSettings.musicEnabled && !soundSettings.muted && soundSettings.volume > 0;
  if (!shouldPlay) {
    musicTrack.pause();
    return;
  }
  if (musicTrack.paused) {
    const playPromise = musicTrack.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {});
    }
  }
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
  else if (name === "shard") beep(1120, 0.06, "sine");
  else if (name === "blast") beep(980, 0.05, "square");
  else if (name === "enemy") beep(180, 0.08, "sawtooth");
  else if (name === "shield") beep(380, 0.13, "sine");
  else if (name === "hurt") beep(80, 0.16, "sawtooth");
  else if (name === "perfect") beep(1320, 0.045, "triangle");
  else if (name === "gate") beep(520, 0.11, "sine");
}

function playDeathImpactSound(sound) {
  playSound(sound);
  beep(58, 0.32, "sawtooth");
  setTimeout(() => beep(92, 0.16, "square"), 70);
}

applySoundSettings();

function screenShake(power = 5, duration = 200) {
  const frames = Math.max(1, Math.round(duration / SIM_STEP_MS));
  t_screenShake = {
    power: Math.max(t_screenShake.power, power),
    frames: Math.max(t_screenShake.frames, frames),
    maxFrames: Math.max(t_screenShake.maxFrames, frames),
  };
}

function updateScreenShake() {
  if (t_screenShake.frames <= 0) return;
  t_screenShake.frames--;
  if (t_screenShake.frames <= 0) {
    t_screenShake = { power: 0, frames: 0, maxFrames: 0 };
  }
}

function getScreenShakeOffset() {
  if (t_screenShake.frames <= 0 || t_screenShake.maxFrames <= 0) return { x: 0, y: 0 };

  const falloff = t_screenShake.frames / t_screenShake.maxFrames;
  const power = t_screenShake.power * falloff;
  return {
    x: (Math.random() * 2 - 1) * power,
    y: (Math.random() * 2 - 1) * power,
  };
}

function triggerSecondChance() {
  if (!t_player.reviveReady) return false;

  t_player.reviveReady = false;
  t_player.shield = true;
  t_player.y = Math.min(t_player.y, canvas.height - 185);
  t_player.vy = -JUMP_FORCE * 1.45;
  t_player.boostFlame = Math.max(t_player.boostFlame || 0, 30);
  t_enemyShots = [];
  runStats.revivals++;
  unlockTrophy("cheated_pit");
  playSound("power");
  screenShake(3, 120);
  setDamageGrace(REVIVE_GRACE_FRAMES);
  spawnBurst(t_player.x + t_player.w / 2, t_player.y + t_player.h / 2, 34, ["#ff8a18", "#f8f1df", "#8de7ff"], 2, 6);
  showRunNotice("LAST RITES", "one mistake burned away", "#8de7ff");
  return true;
}

function killPlayer(sound = "hurt", cause = "THE PIT TOOK YOU") {
  if (isGameOver) return;
  if (triggerSecondChance()) return;

  t_deathCause = cause;
  const x = t_player.x + t_player.w / 2;
  const y = Math.min(canvas.height - 28, t_player.y + t_player.h / 2);
  t_deathImpact = { x, y, life: DEATH_IMPACT_FRAMES, maxLife: DEATH_IMPACT_FRAMES };
  t_gameOverRevealed = false;
  t_damageFlash = Math.max(t_damageFlash, 32);
  isGameOver = true;
  runSetupReady = false;
  isPaused = false;
  keys = {};
  releasePointer();
  playDeathImpactSound(sound);
  spawnDeathBurst();
  screenShake(10, 420);
  updateControlUI();
}

function updateUI() {
  heightEl.textContent = String(score);
  bestEl.textContent = String(best);
  soulTotalEl.textContent = String(totalSouls);
}

function showRunNotice(title, subtitle = "", color = "#ff8a18") {
  t_runNotice = {
    title,
    subtitle,
    color,
    life: 150,
    maxLife: 150,
  };
}

function updateRunNotice() {
  if (!t_runNotice) return;
  t_runNotice.life--;
  if (t_runNotice.life <= 0) t_runNotice = null;
}

function drawRunNotice() {
  if (!t_runNotice) return;

  const lifeRatio = clamp(t_runNotice.life / t_runNotice.maxLife, 0, 1);
  const fadeIn = clamp((t_runNotice.maxLife - t_runNotice.life) / 18, 0, 1);
  const alpha = Math.min(fadeIn, lifeRatio);
  const y = 104 - (1 - alpha) * 10;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textAlign = "center";
  ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
  ctx.shadowBlur = 12;
  ctx.fillStyle = "rgba(0, 0, 0, 0.36)";
  ctx.fillRect(92, y - 30, canvas.width - 184, t_runNotice.subtitle ? 68 : 46);
  ctx.strokeStyle = t_runNotice.color;
  ctx.globalAlpha = alpha * 0.72;
  ctx.strokeRect(92.5, y - 30.5, canvas.width - 185, t_runNotice.subtitle ? 68 : 46);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = t_runNotice.color;
  ctx.font = "32px VT323";
  ctx.fillText(t_runNotice.title, canvas.width / 2, y);
  if (t_runNotice.subtitle) {
    ctx.fillStyle = "#f8f1df";
    ctx.font = "20px VT323";
    ctx.fillText(t_runNotice.subtitle, canvas.width / 2, y + 25);
  }
  ctx.restore();
}

function renderRunRecap(earnedSouls, newBest) {
  const riteText = runStats.contractCompleted
    ? `${runContract.name} complete`
    : `${runContract.name} ${clamp(runContract.progress(), 0, runContract.target)}/${runContract.target}`;
  const bestText = newBest ? "New best" : `${Math.max(0, best - score)} short`;

  const items = [
    ["Cause", t_deathCause],
    ["Souls", `+${earnedSouls}`],
    ["Rite", riteText],
    ["Best", bestText],
    ["Shards", String(runStats.shards)],
    ["Gates", String(runStats.dreadGates)],
    ["Best Streak", String(runStats.bestBounceStreak)],
    ["Perfects", `${runStats.perfectLandings} (${runStats.bestPerfectStreak}x)`],
    ["Near Misses", String(runStats.nearMisses)],
    ["Banished", String(runStats.enemiesBanished)],
    ["Blasts", String(runStats.blastBanishes)],
    ["Saves", String(runStats.revivals)],
  ];

  runRecapEl.innerHTML = items
    .map(([label, value]) => `
      <div class="recap-item">
        <div class="recap-label">${label}</div>
        <div class="recap-value">${value}</div>
      </div>
    `)
    .join("");
}

function showGameOver() {
  if (t_gameOverRevealed) return;
  isGameOver = true;
  t_gameOverRevealed = true;
  t_deathImpact = null;
  runSetupReady = false;
  isPaused = false;
  finalEl.textContent = String(score);
  const earnedSouls = bankRunSouls();
  updateUI();

  const newBest = score > best;
  if (score > best) {
    best = score;
    setBestForMode(best);
    updateUI();
  }

  const soulLine = earnedSouls > 0 ? ` - +${earnedSouls} SOULS` : "";
  const banishLine = runStats.enemiesBanished > 0 ? ` - Banished: ${runStats.enemiesBanished}` : "";
  const outcomeLine = newBest ? `NEW BEST${soulLine}${banishLine}` : `Best: ${best}${soulLine}${banishLine}`;
  resultLineEl.textContent = `${t_deathCause} - ${outcomeLine}`;
  renderRunRecap(earnedSouls, newBest);

  restartBtn.classList.add("show");
  overlay.hidden = false;
  pauseOverlay.hidden = true;
  updateControlUI();
  updateMenuStats();
  setTimeout(() => playAgainBtn.focus(), 0);
}

function updateControlUI() {
  pauseBtn.textContent = isPaused ? "Resume" : "Pause";
  pauseBtn.disabled = isMainMenu || isGameOver || !trophyOverlay.hidden || !shopOverlay.hidden;
  mainMenuBtn.disabled = isMainMenu || !trophyOverlay.hidden || !shopOverlay.hidden;
  modeBtn.disabled = !trophyOverlay.hidden || !shopOverlay.hidden;
  shootBtn.disabled = isMainMenu || isPaused || isGameOver || !trophyOverlay.hidden || !shopOverlay.hidden;
}

function showMainMenu() {
  isMainMenu = true;
  isPaused = false;
  isGameOver = false;
  t_deathImpact = null;
  t_gameOverRevealed = false;
  keys = {};
  releasePointer();
  prepareRunSetup(true);

  mainMenu.hidden = false;
  pauseOverlay.hidden = true;
  overlay.hidden = true;
  shopOverlay.hidden = true;
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
  releasePointer();
  updateControlUI();
}

function togglePause() {
  if (isMainMenu || isGameOver || !trophyOverlay.hidden) return;

  isPaused = !isPaused;
  pauseOverlay.hidden = !isPaused;
  keys = {};
  releasePointer();
  updateControlUI();

  if (isPaused) setTimeout(() => resumeBtn.focus(), 0);
}

function toggleMode(restartRun = false) {
  const nextIndex = (MODES.indexOf(mode) + 1) % MODES.length;
  mode = MODES[nextIndex];
  localStorage.setItem(MODE_KEY, mode);
  updateModeUI();
  prepareRunSetup(true);

  if (restartRun && !isMainMenu) startGame();
}

function setMode(nextMode, restartRun = false) {
  if (!MODES.includes(nextMode)) return;
  mode = nextMode;
  localStorage.setItem(MODE_KEY, mode);
  updateModeUI();
  prepareRunSetup(true);

  if (restartRun && !isMainMenu) startGame();
}

// ==========================================================
// GAME STATE
// ==========================================================

let t_player = { x: 300, y: 500, vx: 0, vy: 0, w: 40, h: 40 };
let t_platforms = [];
let t_powerups = [];
let t_hazards = [];
let t_enemies = [];
let t_projectiles = [];
let t_enemyShots = [];
let t_shards = [];
let t_dreadGates = [];
let t_particles = [];
let t_ghostTrail = [];
let t_breakChunks = [];
let t_floatTexts = [];
let t_maxHeight = 0;
let t_runNotice = null;
let t_screenShake = { power: 0, frames: 0, maxFrames: 0 };
let t_lastBiomeIndex = 0;
let t_bestFlash = 0;
let t_newBestAnnounced = false;
let t_damageFlash = 0;
let t_deathCause = "THE PIT TOOK YOU";
let t_deathImpact = null;
let t_gameOverRevealed = false;

const POWERUP_TYPES = ["wings", "shield", "spring"];
const POWERUP_LABELS = {
  wings: "WINGS",
  shield: "SHIELD",
  spring: "SPRING",
};
const POWERUP_MIN_HEIGHT = 55;
const POWERUP_MIN_VERTICAL_SPACING = 230;
const MAX_ACTIVE_POWERUPS = 1;
const MAX_ACTIVE_ENEMIES = 2;
const ENEMY_MIN_VERTICAL_SPACING = 260;
const BLAST_COOLDOWN = 22;
const WATCHER_MIN_HEIGHT = 700;

function activeMinPlatformGap() {
  return isHellMode() ? 72 : 55;
}

function activePowerupLimit() {
  return isHellMode() ? 1 : MAX_ACTIVE_POWERUPS;
}

function activeEnemyLimit() {
  return isHellMode() ? 5 : MAX_ACTIVE_ENEMIES;
}

function activeEnemyMinSpacing() {
  return isHellMode() ? 118 : ENEMY_MIN_VERTICAL_SPACING;
}

function activeEnemyMinHeight() {
  return isHellMode() ? 90 : 260;
}

function activeWatcherMinHeight() {
  return isHellMode() ? 320 : WATCHER_MIN_HEIGHT;
}

function getBlastCooldown() {
  return hasShopItem("blast_focus") ? 14 : BLAST_COOLDOWN;
}

function getBlastRadius() {
  return hasShopItem("blast_focus") ? 7 : 5;
}

function getBlastPierce() {
  return hasShopItem("hex_rounds") ? 1 : 0;
}

function getShardMagnetBonus() {
  return hasShopItem("soul_magnet") ? 30 : 0;
}

function isUsablePlatform(p) {
  return !(p.type === "break" && p.broken) && !(p.type === "vanish" && p.used);
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
    vanish: ["#c25cff", "#8de7ff", "#f8f1df"],
    boost: ["#ff8a18", "#ffd166", "#f8f1df"],
  };

  const count = platform.type === "break" ? 16 : 9;
  const colors = colorsByType[platform.type] || colorsByType.normal;
  spawnBurst(t_player.x + t_player.w / 2, platform.y + 4, count, colors);
}

function spawnFloatText(x, y, text, color = "#ff8a18") {
  t_floatTexts.push({
    x,
    y,
    text,
    color,
    life: 54,
    maxLife: 54,
  });
}

function spawnBreakChunks(platform) {
  const colors = ["#e9d8b8", "#9fbda8", "#52685e", "#1f2f2c"];
  const count = 7;
  for (let i = 0; i < count; i++) {
    t_breakChunks.push({
      x: platform.x + 8 + (platform.w - 16) * (i / Math.max(1, count - 1)) + (Math.random() * 8 - 4),
      y: platform.y + 8 + Math.random() * 8,
      w: 8 + Math.random() * 10,
      h: 5 + Math.random() * 6,
      vx: (Math.random() - 0.5) * 3.2,
      vy: -1.8 - Math.random() * 2.6,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.22,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 62 + Math.floor(Math.random() * 18),
      maxLife: 80,
    });
  }
}

function updateBreakChunks() {
  for (let i = t_breakChunks.length - 1; i >= 0; i--) {
    const chunk = t_breakChunks[i];
    chunk.x += chunk.vx;
    chunk.y += chunk.vy;
    chunk.vy += 0.18;
    chunk.vx *= 0.985;
    chunk.rot += chunk.vr;
    chunk.life--;
    if (chunk.life <= 0 || chunk.y > canvas.height + 80) t_breakChunks.splice(i, 1);
  }
}

function updateFloatTexts() {
  for (let i = t_floatTexts.length - 1; i >= 0; i--) {
    const item = t_floatTexts[i];
    item.y -= 0.55;
    item.life--;
    if (item.life <= 0) t_floatTexts.splice(i, 1);
  }
}

function drawBreakChunks() {
  if (t_breakChunks.length === 0) return;

  ctx.save();
  for (const chunk of t_breakChunks) {
    const alpha = clamp(chunk.life / chunk.maxLife, 0, 1);
    ctx.globalAlpha = alpha;
    ctx.translate(chunk.x, chunk.y);
    ctx.rotate(chunk.rot);
    ctx.fillStyle = chunk.color;
    ctx.fillRect(-chunk.w / 2, -chunk.h / 2, chunk.w, chunk.h);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
  ctx.restore();
}

function drawFloatTexts() {
  if (t_floatTexts.length === 0) return;

  ctx.save();
  ctx.textAlign = "center";
  ctx.font = "19px VT323";
  ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
  ctx.shadowBlur = 8;
  for (const item of t_floatTexts) {
    const alpha = clamp(item.life / item.maxLife, 0, 1);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = item.color;
    ctx.fillText(item.text, item.x, item.y);
  }
  ctx.restore();
}

function juiceLanding(platform) {
  const squash = platform.type === "boost" ? 1 : platform.type === "break" ? 0.86 : 0.62;
  t_player.landSquash = Math.max(t_player.landSquash || 0, squash);
  t_player.lastLandedType = platform.type;
}

function spawnDeathBurst() {
  const x = t_player.x + t_player.w / 2;
  const y = Math.min(canvas.height - 28, t_player.y + t_player.h / 2);
  spawnBurst(x, y, 58, ["#ff1e4f", "#ff8a18", "#f8f1df", "#8de7ff"], 2.8, 8.4);
  spawnFloatText(x, y - 34, t_deathCause, "#ff1e4f");
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

function updateGhostTrail() {
  if (!hasShopItem("ember_trail")) {
    t_ghostTrail = [];
    return;
  }

  if (gameTime % 3 === 0) {
    t_ghostTrail.push({
      x: t_player.x + t_player.w / 2,
      y: t_player.y + t_player.h / 2,
      vx: t_player.vx * -0.08,
      life: 24,
      maxLife: 24,
    });
  }

  for (let i = t_ghostTrail.length - 1; i >= 0; i--) {
    const ghost = t_ghostTrail[i];
    ghost.x += ghost.vx;
    ghost.life--;
    if (ghost.life <= 0 || ghost.y > canvas.height + 70) t_ghostTrail.splice(i, 1);
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

function drawGhostTrail() {
  if (t_ghostTrail.length === 0) return;

  ctx.save();
  for (const ghost of t_ghostTrail) {
    const alpha = clamp(ghost.life / ghost.maxLife, 0, 1);
    ctx.globalAlpha = alpha * 0.42;
    ctx.shadowColor = "rgba(255, 138, 24, 0.75)";
    ctx.shadowBlur = 12;
    ctx.fillStyle = "#ff8a18";
    ctx.beginPath();
    ctx.arc(ghost.x, ghost.y, 12 * alpha, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ---- Guarantees ----
function chooseTypeWithGuarantees(virtualHeight, index, breakStreak, rngRoll, diff) {
  const forceMove = (virtualHeight >= 600 && index % 7 === 0);
  const forceBreak = (virtualHeight >= 900 && index % 10 === 0);
  const forceBoost = (virtualHeight >= 300 && index % 18 === 0);

  if (forceBoost) return "boost";
  if (forceBreak && breakStreak === 0) return "break";
  if (forceMove) return "moving";

  let breakP = diff.breakP;
  if (breakStreak >= 1) breakP *= 0.25;

  let cursor = breakP;
  if (rngRoll < cursor) return "break";
  cursor += diff.moveP;
  if (rngRoll < cursor) return "moving";
  cursor += diff.vanishP || 0;
  if (rngRoll < cursor) return "vanish";
  cursor += diff.boostP || 0;
  if (rngRoll < cursor) return "boost";
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
    used: false,
    fade: 1,
  };

  if (id !== null) p.id = id;

  if (type === "moving") {
    const range = clamp(moveRange, MIN_MOVING_PLATFORM_RANGE, MOVING_PLATFORM_RANGE);
    p.homeX = x;
    p.minX = clamp(x - range, 0, canvas.width - PLATFORM_W);
    p.maxX = clamp(x + range, 0, canvas.width - PLATFORM_W);

    if (Math.abs(p.vx) < MIN_MOVING_PLATFORM_SPEED) {
      const fallbackDir = ((Math.floor(x + y + (id || 0)) % 2) === 0) ? 1 : -1;
      p.vx = fallbackDir * MIN_MOVING_PLATFORM_SPEED;
    }

    if (p.minX === p.maxX) p.maxX = Math.min(canvas.width - PLATFORM_W, p.minX + MIN_MOVING_PLATFORM_RANGE);
  }

  return p;
}

function decoratePlatform(p, virtualHeight, rng = Math.random) {
  maybeCreateSoulShardForPlatform(p, virtualHeight, rng);
  const hasPowerup = maybeCreatePowerupForPlatform(p, virtualHeight, rng);
  maybeCreateDreadGateForPlatform(p, virtualHeight, rng, hasPowerup);
  maybeCreateHazardForPlatform(p, virtualHeight, rng, hasPowerup);
  maybeCreateEnemyForPlatform(p, virtualHeight, rng, hasPowerup);
  return p;
}

function hasNearbyPowerup(y) {
  return t_powerups.some((powerup) => Math.abs(powerup.baseY - y) < POWERUP_MIN_VERTICAL_SPACING);
}

function choosePowerupType(rng) {
  let options = POWERUP_TYPES.filter((type) => type !== runStats.lastPowerupType);

  if (isHellMode()) options = options.filter((type) => type !== "shield");
  if (t_player.shield) options = options.filter((type) => type !== "shield");
  if (t_player.springCharges >= 2) options = options.filter((type) => type !== "spring");
  if (options.length === 0) options = POWERUP_TYPES;

  return options[Math.floor(rng() * options.length)];
}

function maybeCreateSoulShardForPlatform(p, virtualHeight, rng) {
  if (virtualHeight < 80 || p.y < -80) return;

  const omenBonus = runOmen ? runOmen.shardBonus : 0;
  const chance = clamp(0.07 + virtualHeight / 10000 + omenBonus, 0.03, 0.26);
  if (rng() > chance) return;

  const side = rng() < 0.5 ? -1 : 1;
  const reach = 28 + rng() * 72;
  const x = clamp(p.x + p.w / 2 + side * reach, 22, canvas.width - 22);
  const y = p.y - 34 - rng() * 26;

  t_shards.push({
    x,
    y,
    baseY: y,
    r: 9,
    pulse: rng() * Math.PI * 2,
    value: 1,
  });
}

function activeDreadGateLimit() {
  return isHellMode() ? 3 : 2;
}

function hasNearbyDreadGate(y) {
  return t_dreadGates.some((gate) => Math.abs(gate.baseY - y) < DREAD_GATE_MIN_VERTICAL_SPACING);
}

function maybeCreateDreadGateForPlatform(p, virtualHeight, rng, hasPowerup = false) {
  if (virtualHeight < DREAD_GATE_MIN_HEIGHT || p.y < -120 || hasPowerup) return false;
  if (t_dreadGates.length >= activeDreadGateLimit() || hasNearbyDreadGate(p.y)) return false;
  if (p.type === "break" && rng() < 0.65) return false;

  const omenBonus = runOmen ? Math.max(0, runOmen.shardBonus * 0.18 + runOmen.moveBonus * 0.06) : 0;
  const chance = clamp(0.045 + virtualHeight / 14500 + omenBonus, 0.035, isHellMode() ? 0.17 : 0.125);
  if (rng() > chance) return false;

  const side = rng() < 0.5 ? -1 : 1;
  const reach = 44 + rng() * 88;
  const x = clamp(p.x + p.w / 2 + side * reach, 34, canvas.width - 34);
  const y = p.y - 74 - rng() * 52;

  t_dreadGates.push({
    x,
    y,
    baseY: y,
    r: 22,
    phase: rng() * Math.PI * 2,
    value: isHellMode() ? 2 : 1,
    lift: isHellMode() ? 1.18 : 1.1,
    spun: rng() < 0.5 ? -1 : 1,
  });
  return true;
}

function maybeCreatePowerupForPlatform(p, virtualHeight, rng) {
  if (virtualHeight < POWERUP_MIN_HEIGHT || p.type === "break") return false;
  if (t_powerups.length >= activePowerupLimit() || hasNearbyPowerup(p.y)) return false;

  const omenBonus = runOmen ? runOmen.powerBonus : 0;
  const hellPenalty = isHellMode() ? 0.055 : 0;
  const chance = clamp(0.12 + virtualHeight / 12000 + omenBonus - hellPenalty, isHellMode() ? 0.035 : 0.10, isHellMode() ? 0.10 : 0.20);
  if (rng() > chance) return false;

  const type = choosePowerupType(rng);
  runStats.lastPowerupType = type;
  t_powerups.push({
    x: p.x + p.w / 2,
    y: p.y - 28,
    baseY: p.y - 28,
    r: 13,
    type,
    pulse: rng() * Math.PI * 2,
  });
  return true;
}

function maybeCreateHazardForPlatform(p, virtualHeight, rng, hasPowerup = false) {
  if (virtualHeight < (isHellMode() ? 70 : 180)) return;

  const omenBonus = runOmen ? runOmen.hazardBonus : 0;
  const powerupRelief = hasPowerup && !isHellMode() ? 0.05 : 0;
  const hellBonus = isHellMode() ? 0.12 : 0;
  const chance = clamp(0.07 + virtualHeight / 8000 + omenBonus + hellBonus - powerupRelief, 0.02, isHellMode() ? 0.42 : 0.24);
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
    vx: dir * (0.8 + rng() * 0.9) * (isHellMode() ? 1.45 : 1),
    phase: rng() * Math.PI * 2,
    avoided: false,
  });
}

function hasNearbyEnemy(y) {
  return t_enemies.some((enemy) => Math.abs(enemy.baseY - y) < activeEnemyMinSpacing());
}

function maybeCreateEnemyForPlatform(p, virtualHeight, rng, hasPowerup = false) {
  if (virtualHeight < activeEnemyMinHeight() || (!isHellMode() && hasPowerup) || p.type === "break") return;
  if (t_enemies.length >= activeEnemyLimit() || hasNearbyEnemy(p.y)) return;

  const diff = adjustedDifficulty(difficultyForHeight(virtualHeight));
  const chance = clamp(diff.enemyP || 0, 0, isHellMode() ? 0.42 : 0.16);
  if (rng() > chance) return;

  const side = rng() < 0.5 ? -1 : 1;
  const x = clamp(p.x + p.w / 2 + side * (58 + rng() * 76), 34, canvas.width - 34);
  const y = p.y - 78 - rng() * 28;
  const type = virtualHeight >= activeWatcherMinHeight() && rng() < (isHellMode() ? 0.52 : 0.34) ? "watcher" : "wraith";
  const spriteSet = ENEMY_SPRITES[type] || [];
  t_enemies.push({
    x,
    y,
    baseY: y,
    r: type === "watcher" ? 19 : 17,
    vx: (rng() < 0.5 ? -1 : 1) * (type === "watcher" ? 0.24 + rng() * 0.32 : 0.45 + rng() * 0.55) * (isHellMode() ? 1.45 : 1),
    type,
    spriteIndex: spriteSet.length ? Math.floor(rng() * spriteSet.length) : 0,
    shootCooldown: (isHellMode() ? 54 : 92) + Math.floor(rng() * (isHellMode() ? 48 : 78)),
    phase: rng() * Math.PI * 2,
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

function distancePointToSegment(px, py, ax, ay, bx, by) {
  const abx = bx - ax;
  const aby = by - ay;
  const lenSq = abx * abx + aby * aby;
  if (lenSq <= 0.0001) return Math.hypot(px - ax, py - ay);

  const t = clamp(((px - ax) * abx + (py - ay) * aby) / lenSq, 0, 1);
  const x = ax + abx * t;
  const y = ay + aby * t;
  return Math.hypot(px - x, py - y);
}

function getEnemyBlastHitRadius(enemy) {
  const watcher = enemy.type === "watcher";
  const sprite = getEnemySprite(enemy, watcher);
  if (!sprite) return enemy.r;

  const spriteRadius = Math.max(sprite.drawW || 0, sprite.drawH || 0) * 0.44;
  return Math.max(enemy.r, spriteRadius);
}

function blastHitsEnemy(shot, enemy) {
  const beamTop = shot.y - 6;
  const beamBottom = shot.y + 24;
  const prevBeamTop = (shot.prevY ?? shot.y) - 6;
  const prevBeamBottom = (shot.prevY ?? shot.y) + 24;
  const ax = shot.prevX ?? shot.x;
  const bx = shot.x;
  const hitRadius = shot.r + getEnemyBlastHitRadius(enemy);

  return (
    distancePointToSegment(enemy.x, enemy.y, ax, prevBeamTop, bx, beamTop) <= hitRadius ||
    distancePointToSegment(enemy.x, enemy.y, ax, prevBeamBottom, bx, beamBottom) <= hitRadius
  );
}

function setDamageGrace(frames = DAMAGE_GRACE_FRAMES) {
  t_player.damageGrace = Math.max(t_player.damageGrace || 0, frames);
  t_damageFlash = Math.max(t_damageFlash, 10);
}

function hasDamageGrace() {
  return (t_player.damageGrace || 0) > 0;
}

function absorbGraceHit(obj, colors = ["#8de7ff", "#f8f1df", "#ff8a18"]) {
  if (!hasDamageGrace()) return false;
  if (!obj.graceSparked || gameTime % 10 === 0) {
    obj.graceSparked = true;
    spawnBurst(obj.x, obj.y, 10, colors, 1.5, 4.2);
  }
  return true;
}

function absorbShieldHit(x, y, colors = ["#8de7ff", "#f8f1df", "#ff8a18"]) {
  t_player.shield = false;
  runStats.bounceStreak = 0;
  runStats.perfectStreak = 0;
  runStats.shieldBlocks++;
  if (runStats.shieldBlocks >= 3) unlockTrophy("bulwark");
  playSound("shield");
  screenShake(3, 100);
  setDamageGrace(DAMAGE_GRACE_FRAMES);
  spawnBurst(x, y, 26, colors, 2, 5.5);
}

function maybeRecordNearMiss(obj, text = "NARROW") {
  if (obj.nearMissed || hasDamageGrace()) return;

  const pc = playerCenter();
  const dx = pc.x - obj.x;
  const dy = pc.y - obj.y;
  const closeRadius = obj.r + NEAR_MISS_RADIUS;

  if (dx * dx + dy * dy > closeRadius * closeRadius) return;

  obj.nearMissed = true;
  runStats.nearMisses++;

  const bonus = runStats.nearMisses % 3 === 0 ? (isHellMode() ? 2 : 1) : 0;
  if (bonus > 0) {
    runStats.soulReward += bonus;
    spawnFloatText(obj.x, obj.y - 12, `${text} +${bonus}`, "#8de7ff");
    playSound("shard");
    updateRunGoalUI();
  } else {
    spawnFloatText(obj.x, obj.y - 12, text, "#8de7ff");
  }

  spawnBurst(obj.x, obj.y, 8, ["#8de7ff", "#f8f1df"], 1.2, 3.2);
}

function collectSoulShard(shard) {
  runStats.shards += shard.value || 1;
  totalShards += shard.value || 1;
  setTotalShards(totalShards);
  if (runStats.shards >= 18) unlockTrophy("shard_cutter");
  if (runStats.shards >= 35) unlockTrophy("gemini_vein");
  if (totalShards >= 150) unlockTrophy("shard_ledger");
  playSound("shard");
  spawnBurst(shard.x, shard.y, 16, ["#8de7ff", "#f8f1df", "#ff8a18"], 1.8, 4.8);
  updateRunGoalUI();
  checkRunContract();
}

function collectPowerup(powerup) {
  recordPowerupTrophy(powerup.type);
  playSound("power");
  spawnBurst(powerup.x, powerup.y, 18, ["#ff8a18", "#f8f1df", "#8de7ff"], 1.8, 5.2);
  spawnFloatText(powerup.x, powerup.y - 20, POWERUP_LABELS[powerup.type] || "POWER", powerup.type === "shield" ? "#8de7ff" : "#ff8a18");

  if (powerup.type === "wings") {
    t_player.vy = -JUMP_FORCE * 1.75;
    t_player.boostFlame = Math.max(t_player.boostFlame || 0, 28);
    t_player.wingBurst = Math.max(t_player.wingBurst || 0, 42);
    screenShake(1.4, 70);
  } else if (powerup.type === "shield") {
    if (isHellMode()) return;
    t_player.shield = true;
    playSound("shield");
  } else if (powerup.type === "spring") {
    t_player.springCharges = Math.min(2, t_player.springCharges + 1);
  }
}

function consumeSpringJump() {
  if (t_player.springCharges <= 0) return JUMP_FORCE;

  t_player.springCharges--;
  t_player.boostFlame = Math.max(t_player.boostFlame || 0, 18);
  spawnBurst(t_player.x + t_player.w / 2, t_player.y + t_player.h, 14, ["#ff8a18", "#f8f1df"], 1.6, 4.4);
  spawnFloatText(t_player.x + t_player.w / 2, t_player.y + t_player.h + 4, "SPRING", "#ff8a18");
  screenShake(1.1, 55);
  return JUMP_FORCE * 1.45;
}

function updateSoulShards() {
  for (let i = t_shards.length - 1; i >= 0; i--) {
    const shard = t_shards[i];
    shard.y = shard.baseY + Math.sin(gameTime * 0.1 + shard.pulse) * 5;

    const hasMagnet = hasShopItem("soul_magnet");
    const pc = playerCenter();
    const dx = pc.x - shard.x;
    const dy = pc.y - shard.y;
    const d = Math.max(1, Math.hypot(dx, dy));
    const pullRadius = hasMagnet ? MAGNET_SHARD_PULL_RADIUS : BASE_SHARD_PULL_RADIUS;
    if (d < pullRadius) {
      const pull = 1 - d / pullRadius;
      const pullSpeed = hasMagnet ? 3.6 : 1.35;
      shard.x += (dx / d) * pullSpeed * (0.45 + pull);
      shard.baseY += (dy / d) * pullSpeed * (hasMagnet ? 0.55 : 0.28) * (0.45 + pull);
    }

    if (circleHitsPlayer(shard, 6 + getShardMagnetBonus())) {
      collectSoulShard(shard);
      t_shards.splice(i, 1);
    } else if (shard.y > canvas.height + 70) {
      t_shards.splice(i, 1);
    }
  }
}

function collectDreadGate(gate) {
  runStats.dreadGates++;
  runStats.soulReward += gate.value;
  runStats.gateSouls += gate.value;
  t_player.vy = Math.min(t_player.vy, -JUMP_FORCE * gate.lift);
  t_player.boostFlame = Math.max(t_player.boostFlame || 0, 24);
  t_player.perfectFlash = Math.max(t_player.perfectFlash || 0, 12);

  if (runStats.dreadGates >= 8) unlockTrophy("gate_runner");

  playSound("gate");
  screenShake(1.5, 70);
  spawnFloatText(gate.x, gate.y - 22, `GATE +${gate.value}`, "#8de7ff");
  spawnBurst(gate.x, gate.y, 24, ["#8de7ff", "#c25cff", "#f8f1df"], 2.0, 5.6);
  checkRunContract();
  updateRunGoalUI();
}

function updateDreadGates() {
  for (let i = t_dreadGates.length - 1; i >= 0; i--) {
    const gate = t_dreadGates[i];
    gate.y = gate.baseY + Math.sin(gameTime * 0.075 + gate.phase) * 6;

    const pc = playerCenter();
    const d = Math.hypot(pc.x - gate.x, pc.y - gate.y);
    gate.focus = d < DREAD_GATE_PULL_RADIUS ? 1 - d / DREAD_GATE_PULL_RADIUS : 0;

    if (circleHitsPlayer(gate, 5)) {
      collectDreadGate(gate);
      t_dreadGates.splice(i, 1);
    } else if (gate.y > canvas.height + 80) {
      t_dreadGates.splice(i, 1);
    }
  }
}

function updatePowerupsAndHazards() {
  if (t_player.blastCooldown > 0) t_player.blastCooldown--;

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
      if (absorbGraceHit(hazard)) {
        t_hazards.splice(i, 1);
      } else if (t_player.shield) {
        absorbShieldHit(hazard.x, hazard.y);
        t_hazards.splice(i, 1);
      } else {
        killPlayer("hurt", "SEARED BY A WATCHER");
        return;
      }
    } else if (hazard.y > canvas.height + 70) {
      if (!hazard.avoided) {
        hazard.avoided = true;
        recordHazardDodged();
      }
      t_hazards.splice(i, 1);
    } else {
      maybeRecordNearMiss(hazard);
    }
  }
}

function banishEnemy(enemy, colors = ["#c25cff", "#ff8a18", "#f8f1df"], method = "banish") {
  recordEnemyBanished(method);
  playSound("enemy");
  spawnBurst(enemy.x, enemy.y, 24, colors, 2, 5.4);
}

function fireSoulBlast() {
  if (isMainMenu || isPaused || isGameOver || !trophyOverlay.hidden) return;
  if (t_player.blastCooldown > 0) return;

  t_player.blastCooldown = getBlastCooldown();
  playSound("blast");
  spawnBurst(t_player.x + t_player.w / 2, t_player.y + 8, 8, ["#8de7ff", "#f8f1df"], 2.2, 4.8);
  t_projectiles.push({
    x: t_player.x + t_player.w / 2,
    y: t_player.y + 4,
    vy: -9.5,
    r: getBlastRadius(),
    life: hasShopItem("blast_focus") ? 66 : 54,
    pierce: getBlastPierce(),
  });
}

function updateProjectilesAndEnemies() {
  for (let i = t_projectiles.length - 1; i >= 0; i--) {
    const shot = t_projectiles[i];
    shot.prevX = shot.x;
    shot.prevY = shot.y;
    shot.y += shot.vy;
    shot.life--;

    for (let j = t_enemyShots.length - 1; j >= 0; j--) {
      const enemyShot = t_enemyShots[j];
      const dx = shot.x - enemyShot.x;
      const dy = shot.y - enemyShot.y;
      const hitRadius = shot.r + enemyShot.r;
      if (dx * dx + dy * dy <= hitRadius * hitRadius) {
        spawnBurst(enemyShot.x, enemyShot.y, 10, ["#8de7ff", "#f8f1df"], 1.4, 3.6);
        t_enemyShots.splice(j, 1);
        if (shot.pierce > 0) shot.pierce--;
        else shot.life = 0;
        break;
      }
    }

    if (shot.y < -30 || shot.life <= 0) {
      t_projectiles.splice(i, 1);
    }
  }

  for (let i = t_enemyShots.length - 1; i >= 0; i--) {
    const shot = t_enemyShots[i];
    shot.x += shot.vx;
    shot.y += shot.vy;
    shot.life--;

    if (circleHitsPlayer(shot, 0)) {
      if (absorbGraceHit(shot, ["#8de7ff", "#f8f1df", "#c25cff"])) {
        t_enemyShots.splice(i, 1);
      } else if (t_player.shield) {
        absorbShieldHit(shot.x, shot.y, ["#8de7ff", "#f8f1df", "#c25cff"]);
        t_enemyShots.splice(i, 1);
      } else {
        killPlayer("hurt", "STRUCK BY A WATCHER");
        return;
      }
    } else if (shot.life <= 0 || shot.y > canvas.height + 40 || shot.y < -80 || shot.x < -40 || shot.x > canvas.width + 40) {
      t_enemyShots.splice(i, 1);
    } else {
      maybeRecordNearMiss(shot, "GRAZE");
    }
  }

  for (let i = t_enemies.length - 1; i >= 0; i--) {
    const enemy = t_enemies[i];
    enemy.x += enemy.vx;
    enemy.y = enemy.baseY + Math.sin(gameTime * (enemy.type === "watcher" ? 0.038 : 0.055) + enemy.phase) * (enemy.type === "watcher" ? 7 : 10);

    if (enemy.x < enemy.r || enemy.x > canvas.width - enemy.r) {
      enemy.x = clamp(enemy.x, enemy.r, canvas.width - enemy.r);
      enemy.vx *= -1;
    }

    if (enemy.type === "watcher" && enemy.y > -40 && enemy.y < canvas.height - 80) {
      enemy.shootCooldown--;
      if (enemy.shootCooldown <= 0) {
        const pc = playerCenter();
        const dx = pc.x - enemy.x;
        const dy = pc.y - enemy.y;
        const len = Math.max(1, Math.hypot(dx, dy));
        t_enemyShots.push({
          x: enemy.x,
          y: enemy.y + enemy.r * 0.4,
          vx: (dx / len) * (isHellMode() ? 2.85 : 2.1),
          vy: (dy / len) * (isHellMode() ? 2.85 : 2.1),
          r: 6,
          life: 150,
          phase: enemy.phase,
        });
        enemy.shootCooldown = (isHellMode() ? 68 : 124) + Math.floor(Math.abs(Math.sin(gameTime + enemy.phase)) * (isHellMode() ? 54 : 86));
      }
    }

    let destroyed = false;
    for (let j = t_projectiles.length - 1; j >= 0; j--) {
      const shot = t_projectiles[j];
      if (blastHitsEnemy(shot, enemy)) {
        if (shot.pierce > 0) shot.pierce--;
        else t_projectiles.splice(j, 1);
        t_enemies.splice(i, 1);
        destroyed = true;
        banishEnemy(enemy, ["#c25cff", "#ff8a18", "#f8f1df"], "blast");
        break;
      }
    }
    if (destroyed) continue;

    if (circleHitsPlayer(enemy, 2)) {
      const playerBottom = t_player.y + t_player.h;
      const stomped = t_player.vy > 0 && playerBottom < enemy.y + enemy.r * 0.25;

      if (stomped) {
        t_player.vy = -JUMP_FORCE * 1.18;
        banishEnemy(enemy, ["#c25cff", "#ff8a18", "#f8f1df"], "stomp");
        t_enemies.splice(i, 1);
      } else if (absorbGraceHit(enemy, ["#8de7ff", "#f8f1df", "#c25cff"])) {
        spawnBurst(enemy.x, enemy.y, 18, ["#8de7ff", "#f8f1df", "#c25cff"], 1.8, 4.8);
        t_enemies.splice(i, 1);
      } else if (t_player.shield) {
        absorbShieldHit(enemy.x, enemy.y, ["#8de7ff", "#f8f1df", "#c25cff"]);
        banishEnemy(enemy, ["#8de7ff", "#f8f1df", "#c25cff"], "shield");
        t_enemies.splice(i, 1);
      } else {
        killPlayer("hurt", enemy.type === "watcher" ? "CAUGHT BY A WATCHER" : "TAKEN BY A WRAITH");
        return;
      }
    } else if (enemy.y > canvas.height + 80) {
      t_enemies.splice(i, 1);
    } else {
      maybeRecordNearMiss(enemy, enemy.type === "watcher" ? "WATCHED" : "GRAZE");
    }
  }
}

// ---- Daily generator (deterministic layout) ----
let dailyRng = null;
let dailyGen = null;

function resetDailyGenerator() {
  dailyRng = makeDailyRng();
  dailyGen = {
    lastY: ROUTE_BASE_Y,
    lastX: 270,
    breakStreak: 0,
    index: 0,
  };
}

function nextDailyPlatform() {
  const minGap = activeMinPlatformGap();

  const virtualHeight = Math.floor((ROUTE_BASE_Y - dailyGen.lastY) / 10);
  const diff = adjustedDifficulty(difficultyForHeight(virtualHeight));

  const maxGap = Math.max(minGap + 10, Math.min(diff.maxGap, activeSafeGap()));
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
    vx = movingPlatformVelocity(dir, diff);
  }

  if (type === "break") dailyGen.breakStreak++;
  else dailyGen.breakStreak = 0;

  dailyGen.lastY = y;
  dailyGen.lastX = x;

  const moveRange = Math.min(MOVING_PLATFORM_RANGE, Math.max(MIN_MOVING_PLATFORM_RANGE, dxCap * 0.24));
  const p = makePlatform({ x, y, type, vx, id: nextIndex, moveRange });
  return decoratePlatform(p, virtualHeight, dailyRng);
}

// ---- Classic generator (non-deterministic, but still guaranteed variety + horizontal reach) ----
let classicSpawnIndex = 0;
let classicBreakStreak = 0;

function generateClassicPlatform(y, prevX, gapUp) {
  const virtualHeight = virtualHeightForScreenY(y);
  const diff = adjustedDifficulty(difficultyForHeight(virtualHeight));

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
    vx = movingPlatformVelocity(dir, diff);
  }

  if (type === "break") classicBreakStreak++;
  else classicBreakStreak = 0;

  const moveRange = Math.min(MOVING_PLATFORM_RANGE, Math.max(MIN_MOVING_PLATFORM_RANGE, dxCap * 0.24));
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

  return gap > activeSafeGap() * 0.96 || dx > allowedDx;
}

function makeBridgePlatform(bottom, top) {
  const gap = bottom.y - top.y;
  const bottomCx = platformCenterX(bottom);
  const topCx = platformCenterX(top);
  const dx = topCx - bottomCx;
  const dir = dx === 0 ? 0 : Math.sign(dx);

  let stepUp = clamp(gap * 0.5, MIN_BRIDGE_GAP, activeSafeGap() * 0.72);
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
  prepareRunSetup();
  isGameOver = false;
  score = 0;
  t_maxHeight = 0;
  t_powerups = [];
  t_hazards = [];
  t_enemies = [];
  t_projectiles = [];
  t_enemyShots = [];
  t_shards = [];
  t_dreadGates = [];
  t_particles = [];
  t_ghostTrail = [];
  t_breakChunks = [];
  t_floatTexts = [];
  t_runNotice = null;
  t_screenShake = { power: 0, frames: 0, maxFrames: 0 };
  t_lastBiomeIndex = 0;
  t_bestFlash = 0;
  t_newBestAnnounced = false;
  t_damageFlash = 0;
  t_deathCause = "THE PIT TOOK YOU";
  t_deathImpact = null;
  t_gameOverRevealed = false;
  runStats = makeRunStats();
  updateRunGoalUI();
  updateUI();

  t_player = {
    x: 300,
    y: 500,
    vx: 0,
    vy: -8,
    w: 40,
    h: 40,
    facing: "right",
    shield: !isHellMode() && hasShopItem("starter_shield"),
    springCharges: isHellMode() ? 0 : (hasShopItem("bone_spring") ? 1 : 0),
    blastCooldown: 0,
    damageGrace: 26,
    reviveReady: !isHellMode() && hasShopItem("last_rites"),
    landSquash: 0,
    perfectFlash: 0,
    boostFlame: 0,
    wingBurst: 0,
    lastLandedType: "normal",
  };
  t_platforms = [];

  restartBtn.classList.remove("show");
  overlay.hidden = true;

  const base = makePlatform({ x: 270, y: ROUTE_BASE_Y, type: "normal", vx: 0 });
  t_platforms.push(base);

  if (mode === "daily") {
    resetDailyGenerator();
    dailyGen.lastY = ROUTE_BASE_Y;
    dailyGen.lastX = 270;

    while (dailyGen.lastY > 0) {
      t_platforms.push(nextDailyPlatform());
    }
  } else {
    classicSpawnIndex = 0;
    classicBreakStreak = 0;

    let y = ROUTE_BASE_Y;
    let prevX = base.x;

    while (y > 0) {
      const virtualHeight = virtualHeightForScreenY(y);
      const diff = adjustedDifficulty(difficultyForHeight(virtualHeight));

      const minGap = activeMinPlatformGap();
      const maxGap = Math.max(minGap + 10, Math.min(diff.maxGap, activeSafeGap()));
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
  const keyboardAxis = (keys["ArrowRight"] || keys["d"] ? 1 : 0) - (keys["ArrowLeft"] || keys["a"] ? 1 : 0);
  const axis = keyboardAxis || touchAxis;
  const inputDir = Math.sign(axis);
  if (inputDir < 0) t_player.facing = "left";
  else if (inputDir > 0) t_player.facing = "right";
  if (axis !== 0) {
    const target = axis * MOVE_SPEED;
    const turning = Math.sign(t_player.vx) !== inputDir && Math.abs(t_player.vx) > 0.15;
    t_player.vx = approach(t_player.vx, target, turning ? CONTROL_TURN_ACCEL : CONTROL_ACCEL);
  } else {
    t_player.vx *= CONTROL_FRICTION;
    if (Math.abs(t_player.vx) < 0.04) t_player.vx = 0;
  }

  t_player.prevY = t_player.y;
  t_player.x += t_player.vx;

  if (allowsHorizontalWrap()) {
    if (t_player.x > canvas.width) t_player.x = -t_player.w;
    if (t_player.x < -t_player.w) t_player.x = canvas.width;
  } else {
    const clampedX = clamp(t_player.x, 0, canvas.width - t_player.w);
    if (clampedX !== t_player.x) {
      t_player.x = clampedX;
      t_player.vx = 0;
    }
  }

  t_player.vy = Math.min(t_player.vy + GRAVITY, MAX_FALL_SPEED);
  t_player.y += t_player.vy;
  t_player.landSquash = Math.max(0, (t_player.landSquash || 0) * 0.82 - 0.006);
  t_player.perfectFlash = Math.max(0, (t_player.perfectFlash || 0) - 1);
  t_player.boostFlame = Math.max(0, (t_player.boostFlame || 0) - 1);
  t_player.wingBurst = Math.max(0, (t_player.wingBurst || 0) - 1);
  if (t_player.damageGrace > 0) t_player.damageGrace--;

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
      for (const enemy of t_enemies) {
        enemy.y += diff;
        enemy.baseY += diff;
      }
      for (const shot of t_projectiles) shot.y += diff;
      for (const shot of t_enemyShots) shot.y += diff;
      for (const shard of t_shards) {
        shard.y += diff;
        shard.baseY += diff;
      }
      for (const gate of t_dreadGates) {
        gate.y += diff;
        gate.baseY += diff;
      }
      for (const spark of t_particles) spark.y += diff;
      for (const ghost of t_ghostTrail) ghost.y += diff;
      for (const chunk of t_breakChunks) chunk.y += diff;
      for (const item of t_floatTexts) item.y += diff;
      t_maxHeight += diff;
      score = Math.floor(t_maxHeight / 10);
      if (best > 0 && score > best && !t_newBestAnnounced) {
        t_newBestAnnounced = true;
        t_bestFlash = 120;
        showRunNotice("NEW HEIGHT RECORD", `${score} and climbing`, "#ff8a18");
        playSound("power");
      }
      checkBiomeTransition();
      updateUI();
      checkHeightTrophies();
      checkRunContract();
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
    } else if (p.type === "vanish" && p.used) {
      p.fade = Math.max(0, p.fade - 0.08);
    }
  }

  if (t_player.vy > 0) {
    for (let i = 0; i < t_platforms.length; i++) {
      const p = t_platforms[i];
      if (!isUsablePlatform(p)) continue;
      const prevBottom = (t_player.prevY ?? t_player.y) + t_player.h;
      const playerBottom = t_player.y + t_player.h;

      if (
        t_player.x + t_player.w - LANDING_EDGE_GRACE > p.x &&
        t_player.x + LANDING_EDGE_GRACE < p.x + p.w &&
        prevBottom <= p.y + p.h &&
        playerBottom >= p.y &&
        playerBottom < p.y + p.h + LANDING_VERTICAL_GRACE
      ) {
        juiceLanding(p);
        spawnLandingBurst(p);
        const landing = recordPlatformBounce(p);
        let jumpForce = consumeSpringJump();
        if (landing.perfect) {
          jumpForce *= p.type === "boost" ? 1.02 : 1.07;
          t_player.boostFlame = Math.max(t_player.boostFlame || 0, 12);
        }
        if (p.type === "moving") {
          t_player.vx = clamp(t_player.vx + p.vx * MOVING_PLATFORM_CARRY, -MOVE_SPEED * 1.26, MOVE_SPEED * 1.26);
        }

        if (p.type === "break") {
          p.broken = true;
          t_player.vy = -jumpForce;
          playSound("dig");
          screenShake(2.5, 90);
          spawnBreakChunks(p);
        } else {
          if (p.type === "boost") {
            jumpForce = Math.max(jumpForce, JUMP_FORCE * 1.62);
            t_player.boostFlame = Math.max(t_player.boostFlame || 0, 26);
            playSound("power");
            screenShake(1.8, 70);
          }
          if (p.type === "vanish") {
            p.used = true;
            p.fade = 1;
            playSound("dig");
          }
          t_player.vy = -jumpForce;
          if (p.type !== "boost" && p.type !== "vanish") playSound("jump");
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
          const virtualHeight = virtualHeightForScreenY(highest.y);
          const d2 = adjustedDifficulty(difficultyForHeight(virtualHeight));

          const minGap = activeMinPlatformGap();
          const maxGap = Math.max(minGap + 10, Math.min(d2.maxGap, activeSafeGap()));
          const gap = minGap + Math.random() * (maxGap - minGap);
          const newY = highest.y - gap;

          t_platforms.push(generateClassicPlatform(newY, highest.x, gap));
        }
      }
    }
  }

  updateSoulShards();
  updateDreadGates();
  updatePowerupsAndHazards();
  if (isGameOver) return;
  updateProjectilesAndEnemies();
  if (isGameOver) return;

  updateParticles();
  updateGhostTrail();
  updateBreakChunks();
  updateFloatTexts();
  updateRunNotice();
  if (t_bestFlash > 0) t_bestFlash--;

  if (t_player.y > canvas.height) {
    killPlayer("death", "SWALLOWED BY THE PIT");
  }
}

// ==========================================================
// BACKGROUND ART
// ==========================================================

function makeBackgroundScenes(scenes) {
  return scenes.map((scene) => {
    const img = new Image();
    img.src = scene.src;
    return { ...scene, img };
  });
}

const BACKGROUND_SCENES = makeBackgroundScenes([
  { src: "assets/background1.png", name: "Cinder Pit", motif: "pit", accent: "#ff3b12", glow: "#8f1300" },
  { src: "assets/background2.png", name: "Bone Shaft", motif: "bones", accent: "#e9d8b8", glow: "#7a5634" },
  { src: "assets/background3.png", name: "Blood Furnace", motif: "furnace", accent: "#ff8a18", glow: "#d92b00" },
  { src: "assets/background4.png", name: "Chapel Of Echoes", motif: "cathedral", accent: "#c25cff", glow: "#5b1c85" },
  { src: "assets/background5.png", name: "Violet Hollow", motif: "void", accent: "#8f5dff", glow: "#32164e" },
  { src: "assets/background6.png", name: "Drowned Crypt", motif: "void", accent: "#29d0d6", glow: "#043949" },
  { src: "assets/background7.png", name: "Cold Reliquary", motif: "cathedral", accent: "#8ca8ff", glow: "#263d86" },
  { src: "assets/background8.png", name: "Ashen Ossuary", motif: "bones", accent: "#d28a45", glow: "#54301c" },
  { src: "assets/background9.png", name: "Final Abyss", motif: "abyss", accent: "#be54ff", glow: "#2c123f" },
  { src: "assets/background10.png", name: "Sinner's Gate", motif: "cathedral", accent: "#ff4f24", glow: "#4f130c" },
  { src: "assets/background11.png", name: "Mourning Spire", motif: "void", accent: "#6ee7ff", glow: "#0a3048" },
  { src: "assets/background12.png", name: "Abyssal Throne", motif: "abyss", accent: "#f2c069", glow: "#40200d" },
]);

const BONUS_BACKGROUND_SCENES = Object.fromEntries(
  BONUS_LEVELS.map((level) => [level.id, makeBackgroundScenes(level.scenes)])
);

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

function getActiveBackgroundScenes() {
  const activeLevel = getActiveBonusLevel();
  if (!activeLevel) return BACKGROUND_SCENES;
  return BONUS_BACKGROUND_SCENES[activeLevel.id] || BACKGROUND_SCENES;
}

function getBackgroundState(h) {
  const scenes = getActiveBackgroundScenes();
  const rawIndex = Math.floor(h / BACKGROUND_HEIGHT);
  const lastIndex = scenes.length - 1;
  const index = clamp(rawIndex, 0, lastIndex);
  const nextIndex = clamp(index + 1, 0, lastIndex);
  const local = rawIndex > lastIndex ? 1 : (h % BACKGROUND_HEIGHT) / BACKGROUND_HEIGHT;
  const blend = nextIndex === index ? 0 : smoothstep(0.72, 1, local);

  return {
    current: scenes[index],
    next: scenes[nextIndex],
    blend,
    index,
    local,
  };
}

function checkBiomeTransition() {
  const state = getBackgroundState(score);
  if (state.index !== t_lastBiomeIndex) {
    t_lastBiomeIndex = state.index;
    showRunNotice(state.current.name.toUpperCase(), "the climb changes shape", state.current.accent);
    screenShake(2, 100);
  }
}

function drawHellBackground(h, time) {
  const state = getBackgroundState(h);

  const accent = mixRgb(hexToRgb(state.current.accent), hexToRgb(state.next.accent), state.blend);
  const glow = mixRgb(hexToRgb(state.current.glow), hexToRgb(state.next.glow), state.blend);
  const motif = state.blend > 0.54 ? state.next.motif : state.current.motif;

  const climbPx = h * 10;

  if (!drawImageBackground(state, time)) {
    drawBackgroundFallback(accent, glow);
  }
  drawDistantGlow(glow, accent, time);
  drawParallaxCavern(accent, climbPx, time);
  drawBiomeMotifs(motif, accent, glow, climbPx, time, h);
  drawHellChains(accent, climbPx, time);
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
  else if (motif === "christmas") drawChristmasBonusLayer(accent, glow, climbPx, time);
  else if (motif === "space") drawSpaceBonusLayer(accent, glow, climbPx, time);
}

function drawChristmasBonusLayer(accent, glow, climbPx, time) {
  ctx.save();

  drawChristmasSnowLayer(62, 0.06, 0.18, 0.2, 1.2, climbPx, time, 900);
  drawChristmasSnowLayer(34, 0.11, 0.28, 0.55, 1.8, climbPx, time, 1800);

  ctx.lineWidth = 2;
  const lightOffset = (climbPx * 0.12) % 92;
  for (let y = -92; y < canvas.height + 120; y += 92) {
    const yy = y + lightOffset;
    ctx.strokeStyle = rgba(glow, 0.22);
    ctx.beginPath();
    ctx.moveTo(22, yy);
    ctx.bezierCurveTo(170, yy + 22, 300, yy - 28, canvas.width - 22, yy + 18);
    ctx.stroke();

    for (let i = 0; i < 7; i++) {
      const x = 54 + i * 82 + Math.sin(time * 0.025 + i) * 4;
      const bulbY = yy + Math.sin(i * 1.2) * 14;
      const colors = ["#ef4444", "#f6d365", "#38bdf8", "#22c55e"];
      ctx.fillStyle = colors[(i + Math.floor(y / 92)) % colors.length];
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.ellipse(x, bulbY, 4, 7, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const frost = ctx.createLinearGradient(0, 0, 0, canvas.height);
  frost.addColorStop(0, rgba(accent, 0.12));
  frost.addColorStop(0.55, "rgba(255, 255, 255, 0)");
  frost.addColorStop(1, rgba(glow, 0.1));
  ctx.shadowBlur = 0;
  ctx.fillStyle = frost;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.restore();
}

function drawChristmasSnowLayer(count, climbRate, fallRate, alphaMin, radiusMax, climbPx, time, seed) {
  const drift = (climbPx * climbRate + time * fallRate) % (canvas.height + 60);

  for (let i = 0; i < count; i++) {
    const baseX = pseudoRand(seed + i * 3) * canvas.width;
    const sway = Math.sin(time * (0.012 + pseudoRand(seed + i * 5) * 0.014) + i) * (10 + pseudoRand(seed + i * 7) * 18);
    const x = (baseX + sway + canvas.width) % canvas.width;
    const y = (pseudoRand(seed + i * 11) * canvas.height + drift + i * 13) % (canvas.height + 60) - 30;
    const radius = 0.45 + pseudoRand(seed + i * 13) * radiusMax;
    const alpha = alphaMin + pseudoRand(seed + i * 17) * 0.18;

    ctx.fillStyle = `rgba(240, 252, 255, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawSpaceBonusLayer(accent, glow, climbPx, time) {
  ctx.save();

  drawSpaceStarLayer(82, 0.025, 0.09, 0.18, 1.3, climbPx, time, 2600);
  drawSpaceStarLayer(46, 0.055, 0.16, 0.36, 1.9, climbPx, time, 5200);

  ctx.lineWidth = 2;
  ctx.shadowBlur = 10;
  const streakOffset = (climbPx * 0.18 + time * 0.65) % 190;
  for (let i = 0; i < 6; i++) {
    const seed = 7400 + i * 19;
    const x = 38 + pseudoRand(seed) * (canvas.width - 76);
    const y = ((i * 118 + streakOffset) % (canvas.height + 190)) - 95;
    const len = 26 + pseudoRand(seed + 5) * 42;
    const alpha = 0.16 + pseudoRand(seed + 9) * 0.22;

    ctx.strokeStyle = rgba(accent, alpha);
    ctx.shadowColor = rgba(accent, alpha + 0.14);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - len * 0.72, y + len);
    ctx.stroke();
  }

  const nebula = ctx.createRadialGradient(
    canvas.width * 0.5,
    canvas.height * 0.44,
    18,
    canvas.width * 0.5,
    canvas.height * 0.44,
    canvas.width * 0.72
  );
  nebula.addColorStop(0, rgba(accent, 0.1));
  nebula.addColorStop(0.42, rgba(glow, 0.08));
  nebula.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.shadowBlur = 0;
  ctx.fillStyle = nebula;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.restore();
}

function drawSpaceStarLayer(count, climbRate, driftRate, alphaMin, radiusMax, climbPx, time, seed) {
  const drift = (climbPx * climbRate + time * driftRate) % (canvas.height + 80);

  for (let i = 0; i < count; i++) {
    const baseX = pseudoRand(seed + i * 3) * canvas.width;
    const twinkle = 0.52 + Math.sin(time * (0.018 + pseudoRand(seed + i * 5) * 0.03) + i) * 0.32;
    const x = (baseX + Math.sin(time * 0.006 + i) * 7 + canvas.width) % canvas.width;
    const y = (pseudoRand(seed + i * 11) * canvas.height + drift + i * 17) % (canvas.height + 80) - 40;
    const radius = 0.55 + pseudoRand(seed + i * 13) * radiusMax;
    const alpha = (alphaMin + pseudoRand(seed + i * 17) * 0.28) * twinkle;

    ctx.fillStyle = `rgba(238, 248, 255, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
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

    if (drawHazardSprite(hazard, flicker)) continue;

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

function drawHazardSprite(hazard, flicker) {
  const sprite = HAZARD_SPRITE;
  const img = sprite?.img;
  if (!img || !img.complete || img.naturalWidth <= 0) return false;
  const source = spriteSourceRect(sprite);
  if (!source) return false;

  const width = hazard.r * 2.7 * flicker;
  const height = hazard.r * 3.2 * flicker;
  const wobble = Math.sin(gameTime * 0.08 + hazard.phase) * 0.08;

  ctx.save();
  ctx.translate(hazard.x, hazard.y);
  ctx.rotate(wobble);
  ctx.shadowColor = "rgba(255, 30, 79, 0.62)";
  ctx.shadowBlur = 14;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    img,
    source.sx,
    source.sy,
    source.sw,
    source.sh,
    -width / 2,
    -height / 2,
    width,
    height
  );
  ctx.restore();
  return true;
}

function drawEnemies() {
  ctx.save();
  for (const enemy of t_enemies) {
    const pulse = 0.92 + Math.sin(gameTime * 0.12 + enemy.phase) * 0.08;
    const watcher = enemy.type === "watcher";

    if (watcher) drawWatcherTelegraph(enemy);

    if (drawEnemySprite(enemy, watcher, pulse)) continue;

    ctx.shadowColor = watcher ? "rgba(255, 138, 24, 0.7)" : "rgba(194, 92, 255, 0.65)";
    ctx.shadowBlur = 15;
    ctx.fillStyle = watcher ? `rgba(90, 26, 0, ${0.88 * pulse})` : `rgba(50, 10, 70, ${0.88 * pulse})`;
    ctx.strokeStyle = watcher ? "#ff8a18" : "#f8f1df";
    ctx.lineWidth = 2;

    ctx.beginPath();
    if (watcher) ctx.ellipse(enemy.x, enemy.y, enemy.r * 1.08, enemy.r * 0.86, 0, 0, Math.PI * 2);
    else ctx.arc(enemy.x, enemy.y, enemy.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillStyle = watcher ? "#ffd166" : "#f8f1df";
    ctx.beginPath();
    if (watcher) {
      ctx.arc(enemy.x, enemy.y - 2, 7, 0, Math.PI * 2);
    } else {
      ctx.arc(enemy.x - 6, enemy.y - 3, 4, 0, Math.PI * 2);
      ctx.arc(enemy.x + 6, enemy.y - 3, 4, 0, Math.PI * 2);
    }
    ctx.fill();

    ctx.fillStyle = "#000";
    ctx.beginPath();
    if (watcher) {
      ctx.arc(enemy.x + Math.sin(gameTime * 0.05 + enemy.phase) * 2, enemy.y - 2, 3, 0, Math.PI * 2);
    } else {
      ctx.arc(enemy.x - 5, enemy.y - 3, 2, 0, Math.PI * 2);
      ctx.arc(enemy.x + 7, enemy.y - 3, 2, 0, Math.PI * 2);
    }
    ctx.fill();

    ctx.strokeStyle = "#ff8a18";
    ctx.beginPath();
    ctx.moveTo(enemy.x - 8, enemy.y + 8);
    ctx.lineTo(enemy.x - 2, enemy.y + 5);
    ctx.lineTo(enemy.x + 4, enemy.y + 9);
    ctx.lineTo(enemy.x + 10, enemy.y + 5);
    ctx.stroke();
  }
  ctx.restore();
}

function drawWatcherTelegraph(enemy) {
  if (enemy.shootCooldown > WATCHER_TELEGRAPH_FRAMES || isMainMenu || isGameOver) return;

  const charge = 1 - clamp(enemy.shootCooldown / WATCHER_TELEGRAPH_FRAMES, 0, 1);
  const pc = playerCenter();
  const flicker = 0.74 + Math.sin(gameTime * 0.64 + enemy.phase) * 0.26;
  const alpha = clamp(0.14 + charge * 0.46, 0, 0.72) * flicker;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = "#ff1e4f";
  ctx.lineWidth = 1.4 + charge * 1.4;
  ctx.setLineDash([7, 6]);
  ctx.beginPath();
  ctx.moveTo(enemy.x, enemy.y);
  ctx.lineTo(pc.x, pc.y);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.shadowColor = "rgba(255, 30, 79, 0.9)";
  ctx.shadowBlur = 16;
  ctx.strokeStyle = "#ff8a18";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(enemy.x, enemy.y, enemy.r + 5 + charge * 6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawEnemySprite(enemy, watcher, pulse) {
  const sprite = getEnemySprite(enemy, watcher);
  const img = sprite?.img;
  if (!img || !img.complete || img.naturalWidth <= 0) return false;
  const source = spriteSourceRect(sprite);
  if (!source) return false;

  const width = (sprite.drawW || (watcher ? 48 : 66)) * pulse;
  const height = (sprite.drawH || (watcher ? 58 : 38)) * pulse;
  const bob = Math.sin(gameTime * 0.08 + enemy.phase) * (watcher ? 1.2 : 1.6);

  ctx.save();
  ctx.translate(enemy.x, enemy.y + bob);
  if (!watcher && enemy.vx < 0) ctx.scale(-1, 1);
  ctx.shadowColor = watcher ? "rgba(141, 231, 255, 0.62)" : "rgba(255, 30, 79, 0.6)";
  ctx.shadowBlur = watcher ? 12 : 14;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    img,
    source.sx,
    source.sy,
    source.sw,
    source.sh,
    -width / 2,
    -height / 2,
    width,
    height
  );
  ctx.restore();
  return true;
}

function getEnemySprite(enemy, watcher) {
  const sprites = ENEMY_SPRITES[watcher ? "watcher" : "wraith"];
  if (!Array.isArray(sprites)) return sprites;
  return sprites[enemy.spriteIndex % sprites.length] || sprites[0];
}

function drawProjectiles() {
  ctx.save();
  for (const shot of t_enemyShots) {
    const pulse = 0.82 + Math.sin(gameTime * 0.18 + shot.phase) * 0.18;
    const len = Math.max(1, Math.hypot(shot.vx, shot.vy));
    const tailX = shot.x - (shot.vx / len) * 22;
    const tailY = shot.y - (shot.vy / len) * 22;
    ctx.shadowColor = "rgba(255, 30, 79, 0.8)";
    ctx.shadowBlur = 13;
    ctx.strokeStyle = `rgba(255, 138, 24, ${0.38 * pulse})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(shot.x, shot.y);
    ctx.stroke();
    ctx.fillStyle = `rgba(255, 30, 79, ${0.8 * pulse})`;
    ctx.strokeStyle = "#ff8a18";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(shot.x, shot.y, shot.r * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  for (const shot of t_projectiles) {
    const pulse = 0.84 + Math.sin(gameTime * 0.22 + shot.y) * 0.16;
    ctx.shadowColor = "rgba(141, 231, 255, 0.85)";
    ctx.shadowBlur = 14;
    ctx.strokeStyle = `rgba(141, 231, 255, ${0.44 * pulse})`;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(shot.x, shot.y + 22);
    ctx.lineTo(shot.x, shot.y - 4);
    ctx.stroke();
    ctx.fillStyle = "#8de7ff";
    ctx.strokeStyle = "#f8f1df";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(shot.x, shot.y, shot.r * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function drawThreatIndicators() {
  if (isMainMenu || isGameOver) return;

  const threats = [];
  for (const enemy of t_enemies) {
    if (enemy.y < -6 && enemy.y > -170) threats.push({ x: enemy.x, danger: enemy.type === "watcher" ? 1 : 0.75 });
  }
  for (const hazard of t_hazards) {
    if (hazard.y < -6 && hazard.y > -140) threats.push({ x: hazard.x, danger: 0.85 });
  }
  for (const shot of t_enemyShots) {
    if (shot.y < -6 && shot.y > -100 && shot.vy > 0) threats.push({ x: shot.x, danger: 1 });
  }
  if (threats.length === 0) return;

  ctx.save();
  for (const threat of threats.slice(0, 5)) {
    const x = clamp(threat.x, 22, canvas.width - 22);
    const pulse = 0.75 + Math.sin(gameTime * 0.22 + x) * 0.25;
    const alpha = clamp(0.42 + threat.danger * 0.38, 0, 0.9) * pulse;

    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#ff1e4f";
    ctx.strokeStyle = "#f8f1df";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, 96);
    ctx.lineTo(x - 10, 78);
    ctx.lineTo(x + 10, 78);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.globalAlpha = alpha * 0.42;
    ctx.fillStyle = "rgba(255, 30, 79, 0.65)";
    ctx.beginPath();
    ctx.arc(x, 74, 16, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawPowerups() {
  ctx.save();
  for (const powerup of t_powerups) {
    const pulse = 0.85 + Math.sin(gameTime * 0.12 + powerup.pulse) * 0.15;
    const x = powerup.x;
    const y = powerup.y;

    ctx.shadowColor = powerup.type === "shield" ? "rgba(141, 231, 255, 0.7)" : "rgba(255, 138, 24, 0.72)";
    ctx.shadowBlur = 16;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.36 + pulse * 0.2;
    ctx.strokeStyle = powerup.type === "shield" ? "rgba(141, 231, 255, 0.72)" : "rgba(255, 138, 24, 0.72)";
    ctx.beginPath();
    ctx.arc(x, y, 20 + pulse * 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;

    if (powerup.type === "wings") {
      if (!drawPowerupSprite("wings", x, y, pulse, 46, 28)) {
        ctx.fillStyle = `rgba(248, 241, 223, ${0.9 * pulse})`;
        ctx.beginPath();
        ctx.ellipse(x - 8, y, 8, 14, -0.55, 0, Math.PI * 2);
        ctx.ellipse(x + 8, y, 8, 14, 0.55, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ff8a18";
        ctx.fillRect(x - 2, y - 7, 4, 14);
      }
    } else if (powerup.type === "shield") {
      if (!drawPowerupSprite("shield", x, y, pulse, 32, 37)) {
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
      }
    } else if (powerup.type === "spring") {
      if (!drawPowerupSprite("spring", x, y, pulse, 31, 42)) {
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
  }
  ctx.restore();
}

function drawPowerupSprite(type, x, y, pulse, baseWidth, baseHeight) {
  const sprite = POWERUP_SPRITES[type];
  const img = sprite?.img;
  if (!img || !img.complete || img.naturalWidth <= 0) return false;
  const source = spriteSourceRect(sprite);
  if (!source) return false;

  const width = baseWidth * pulse;
  const height = baseHeight * pulse;

  ctx.save();
  ctx.shadowColor = type === "shield" ? "rgba(141, 231, 255, 0.58)" : "rgba(255, 138, 24, 0.58)";
  ctx.shadowBlur = 12;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    img,
    source.sx,
    source.sy,
    source.sw,
    source.sh,
    x - width / 2,
    y - height / 2,
    width,
    height
  );
  ctx.restore();
  return true;
}

function drawSoulShards() {
  ctx.save();
  for (const shard of t_shards) {
    const pulse = 0.82 + Math.sin(gameTime * 0.14 + shard.pulse) * 0.18;
    const r = shard.r * pulse;

    ctx.shadowColor = "rgba(141, 231, 255, 0.76)";
    ctx.shadowBlur = 16;
    ctx.globalAlpha = 0.42 * pulse;
    ctx.strokeStyle = "rgba(141, 231, 255, 0.72)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(shard.x, shard.y, r + 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = `rgba(141, 231, 255, ${0.82 * pulse})`;
    ctx.strokeStyle = "#f8f1df";
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(shard.x, shard.y - r);
    ctx.lineTo(shard.x + r * 0.72, shard.y);
    ctx.lineTo(shard.x, shard.y + r);
    ctx.lineTo(shard.x - r * 0.72, shard.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.fillRect(shard.x - 1, shard.y - r * 0.5, 2, r);
  }
  ctx.restore();
}

function drawDreadGates() {
  if (t_dreadGates.length === 0) return;

  ctx.save();
  ctx.lineCap = "round";
  for (const gate of t_dreadGates) {
    const pulse = 0.82 + Math.sin(gameTime * 0.12 + gate.phase) * 0.18;
    const focus = gate.focus || 0;
    const spin = gameTime * 0.035 * gate.spun + gate.phase;
    const r = gate.r + pulse * 4 + focus * 5;

    if (drawDreadGateSprite(gate, pulse, focus, r)) continue;

    ctx.save();
    ctx.translate(gate.x, gate.y);
    ctx.rotate(spin);

    ctx.shadowColor = "rgba(141, 231, 255, 0.82)";
    ctx.shadowBlur = 18 + focus * 10;
    ctx.strokeStyle = `rgba(141, 231, 255, ${0.56 + focus * 0.24})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = `rgba(194, 92, 255, ${0.44 + focus * 0.25})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([9, 8]);
    ctx.beginPath();
    ctx.arc(0, 0, r + 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = `rgba(248, 241, 223, ${0.26 + focus * 0.18})`;
    for (let i = 0; i < 4; i++) {
      ctx.rotate(Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(0, -r - 13);
      ctx.lineTo(5, -r - 4);
      ctx.lineTo(0, -r);
      ctx.lineTo(-5, -r - 4);
      ctx.closePath();
      ctx.fill();
    }

    ctx.rotate(-spin * 1.8);
    ctx.fillStyle = `rgba(141, 231, 255, ${0.16 + focus * 0.18})`;
    ctx.beginPath();
    ctx.arc(0, 0, r - 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
  ctx.restore();
}

function drawDreadGateSprite(gate, pulse, focus, r) {
  const sprite = DREAD_GATE_SPRITE;
  const img = sprite?.img;
  if (!img || !img.complete || img.naturalWidth <= 0) return false;
  const source = spriteSourceRect(sprite);
  if (!source) return false;

  const visualPulse = 1 + Math.sin(gameTime * 0.12 + gate.phase) * 0.035 + focus * 0.09;
  const width = 62 * visualPulse;
  const height = width * (source.sh / source.sw);

  ctx.save();
  ctx.translate(gate.x, gate.y);

  ctx.shadowColor = "rgba(255, 58, 18, 0.72)";
  ctx.shadowBlur = 18 + focus * 10;
  ctx.globalAlpha = 0.26 + focus * 0.16;
  ctx.strokeStyle = "rgba(255, 138, 24, 0.72)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, r + 4, 0, Math.PI * 2);
  ctx.stroke();

  ctx.globalAlpha = 0.18 + pulse * 0.1 + focus * 0.18;
  ctx.fillStyle = "rgba(255, 58, 18, 0.68)";
  ctx.beginPath();
  ctx.arc(0, 0, r - 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 1;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    img,
    source.sx,
    source.sy,
    source.sw,
    source.sh,
    -width / 2,
    -height / 2,
    width,
    height
  );

  ctx.restore();
  return true;
}

function wrappedHorizontalDistance(ax, bx) {
  const dx = Math.abs(ax - bx);
  return Math.min(dx, canvas.width - dx);
}

function activeHorizontalDistance(ax, bx) {
  return allowsHorizontalWrap() ? wrappedHorizontalDistance(ax, bx) : Math.abs(ax - bx);
}

function getLandingCandidate() {
  if (isMainMenu || isGameOver || t_player.vy <= 0) return null;

  const playerBottom = t_player.y + t_player.h;
  const playerCx = t_player.x + t_player.w / 2;
  let bestPlatform = null;
  let bestScore = Infinity;

  for (const p of t_platforms) {
    if (!isUsablePlatform(p)) continue;

    const dy = p.y - playerBottom;
    if (dy < -LANDING_VERTICAL_GRACE || dy > 230) continue;

    const dx = activeHorizontalDistance(playerCx, platformCenterX(p));
    const typePenalty = p.type === "break" || p.type === "vanish" ? 18 : 0;
    const candidateScore = dy * 1.55 + dx * 0.45 + typePenalty;
    if (candidateScore < bestScore) {
      bestScore = candidateScore;
      bestPlatform = p;
    }
  }

  return bestPlatform;
}

function drawLandingGuide() {
  const p = getLandingCandidate();
  if (!p) return;

  const fallUrgency = clamp((t_player.vy - 2) / 7, 0, 1);
  const pulse = 0.76 + Math.sin(gameTime * 0.22) * 0.24;
  const alpha = (0.12 + fallUrgency * 0.24) * pulse;
  const color = p.type === "boost" ? "#ff8a18" : p.type === "moving" ? "#8de7ff" : p.type === "vanish" ? "#c25cff" : "#f8f1df";

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.shadowColor = color;
  ctx.shadowBlur = 18;
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.strokeRect(p.x - 7.5, p.y - 7.5, p.w + 15, p.h + 15);
  ctx.globalAlpha = alpha * 0.46;
  ctx.fillStyle = color;
  ctx.fillRect(p.x + 6, p.y - 9, p.w - 12, 3);
  ctx.globalAlpha = alpha * 0.75;
  ctx.fillStyle = "#8de7ff";
  ctx.fillRect(platformCenterX(p) - PERFECT_LANDING_RADIUS, p.y - 4, PERFECT_LANDING_RADIUS * 2, 3);
  ctx.restore();
}

function drawPowerStatus() {
  const x = 16;
  const y = 14;
  const w = canvas.width - 32;
  const h = 76;
  const bestPulse = t_bestFlash > 0 ? 0.5 + Math.sin(gameTime * 0.35) * 0.2 : 0;
  const riteProgress = runContract ? clamp(runContract.progress() / runContract.target, 0, 1) : 0;
  const blastProgress = clamp(1 - (t_player.blastCooldown / getBlastCooldown()), 0, 1);
  const soulRunTotal = runStats.shards + runStats.soulReward;

  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.48)";
  ctx.strokeStyle = "rgba(248, 241, 223, 0.18)";
  ctx.lineWidth = 1;
  ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

  ctx.font = "22px VT323";
  ctx.textAlign = "left";
  ctx.fillStyle = "#f8f1df";
  ctx.fillText(`HEIGHT ${score}`, x + 13, y + 26);

  ctx.textAlign = "right";
  ctx.fillStyle = bestPulse > 0 ? `rgba(255, 138, 24, ${clamp(0.82 + bestPulse, 0, 1)})` : "#ff8a18";
  ctx.fillText(`BEST ${Math.max(best, score)}`, x + w - 13, y + 26);

  ctx.textAlign = "left";
  ctx.font = "17px VT323";
  ctx.fillStyle = "#bfc7c9";
  const riteLabel = runContract
    ? `${runContract.name.toUpperCase()} ${runStats.contractCompleted ? "DONE" : `${Math.floor(riteProgress * runContract.target)}/${runContract.target}`}`
    : "RITE --";
  ctx.fillText(riteLabel, x + 13, y + 49);

  ctx.fillStyle = "rgba(248, 241, 223, 0.14)";
  ctx.fillRect(x + 13, y + 57, w * 0.44, 6);
  ctx.fillStyle = runStats.contractCompleted ? "#8de7ff" : "#ff8a18";
  ctx.fillRect(x + 13, y + 57, w * 0.44 * riteProgress, 6);

  ctx.textAlign = "right";
  ctx.fillStyle = "#bfc7c9";
  ctx.fillText(`SHOT ${blastProgress >= 1 ? "READY" : ""}`, x + w - 13, y + 49);
  ctx.fillStyle = "rgba(248, 241, 223, 0.14)";
  ctx.fillRect(x + w - 152, y + 57, 139, 6);
  ctx.fillStyle = blastProgress >= 1 ? "#8de7ff" : "#ff8a18";
  ctx.fillRect(x + w - 152, y + 57, 139 * blastProgress, 6);

  const badges = [];
  if (hasDamageGrace() && t_player.damageGrace > 12) badges.push("GRACE");
  if (t_player.shield) badges.push("SHIELD");
  if (t_player.reviveReady) badges.push("LAST RITES");
  if (t_player.springCharges > 0) badges.push(`SPRING x${t_player.springCharges}`);
  if (runStats.bounceStreak >= 6) badges.push(`STREAK x${runStats.bounceStreak}`);
  if (runStats.perfectStreak >= 2) badges.push(`PERFECT x${runStats.perfectStreak}`);
  if (runStats.dreadGates > 0) badges.push(`GATES ${runStats.dreadGates}`);
  if (soulRunTotal > 0) badges.push(`SOULS +${soulRunTotal}`);
  if (badges.length > 0) {
    const badgeText = badges.join("  ");
    ctx.textAlign = "center";
    ctx.fillStyle = "#f8f1df";
    ctx.font = `${badgeText.length > 42 ? 14 : 16}px VT323`;
    ctx.fillText(badgeText, canvas.width / 2, y + h - 11);
  }

  ctx.restore();
}

function drawFallWarning() {
  if (isMainMenu || isGameOver || t_player.vy <= 0) return;

  const danger = clamp((t_player.y - (canvas.height - 160)) / 118, 0, 1) * clamp(t_player.vy / 9, 0, 1);
  if (danger <= 0.01) return;

  ctx.save();
  ctx.globalAlpha = danger;

  let g = ctx.createLinearGradient(0, canvas.height - 170, 0, canvas.height);
  g.addColorStop(0, "rgba(189, 0, 0, 0)");
  g.addColorStop(1, "rgba(189, 0, 0, 0.36)");
  ctx.fillStyle = g;
  ctx.fillRect(0, canvas.height - 170, canvas.width, 170);

  ctx.strokeStyle = "rgba(255, 138, 24, 0.7)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, canvas.height - 7);
  ctx.lineTo(canvas.width, canvas.height - 7);
  ctx.stroke();

  ctx.fillStyle = "rgba(0, 0, 0, 0.48)";
  ctx.beginPath();
  ctx.ellipse(canvas.width / 2, canvas.height + 14, 138 + danger * 38, 35 + danger * 18, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = `rgba(248, 241, 223, ${0.18 + danger * 0.42})`;
  ctx.lineWidth = 3;
  for (let i = 0; i < 9; i++) {
    const x = canvas.width / 2 - 96 + i * 24;
    const tooth = 12 + (i % 2) * 9 + Math.sin(gameTime * 0.18 + i) * 4;
    ctx.beginPath();
    ctx.moveTo(x, canvas.height - 2);
    ctx.lineTo(x + 8, canvas.height - tooth);
    ctx.lineTo(x + 16, canvas.height - 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawDamageFlash() {
  if (t_damageFlash <= 0) return;

  const alpha = clamp(t_damageFlash / 32, 0, 1) * (t_deathImpact ? 0.42 : 0.22);
  ctx.save();
  ctx.fillStyle = `rgba(255, 30, 79, ${alpha})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
}

function drawDeathImpact() {
  if (!t_deathImpact) return;

  const progress = 1 - clamp(t_deathImpact.life / t_deathImpact.maxLife, 0, 1);
  const flash = 1 - smoothstep(0, 0.36, progress);
  const hold = smoothstep(0.12, 1, progress);
  const x = clamp(t_deathImpact.x, 0, canvas.width);
  const y = clamp(t_deathImpact.y, 0, canvas.height);

  ctx.save();

  ctx.globalAlpha = 0.34 * (1 - progress);
  ctx.fillStyle = "#f8f1df";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const ringRadius = 22 + progress * 230;
  ctx.globalAlpha = 0.86 * (1 - progress);
  ctx.strokeStyle = "#ff1e4f";
  ctx.shadowColor = "rgba(255, 30, 79, 0.9)";
  ctx.shadowBlur = 24;
  ctx.lineWidth = 8 - progress * 5;
  ctx.beginPath();
  ctx.arc(x, y, ringRadius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.globalAlpha = 0.58 * (1 - progress);
  ctx.strokeStyle = "#ff8a18";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, ringRadius * 0.58, 0, Math.PI * 2);
  ctx.stroke();

  const vignette = ctx.createRadialGradient(x, y, 40, x, y, canvas.width * 0.86);
  vignette.addColorStop(0, `rgba(255, 30, 79, ${0.16 * flash})`);
  vignette.addColorStop(0.45, `rgba(42, 0, 0, ${0.18 + hold * 0.12})`);
  vignette.addColorStop(1, `rgba(0, 0, 0, ${0.46 + hold * 0.22})`);
  ctx.globalAlpha = 1;
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.textAlign = "center";
  ctx.shadowColor = "rgba(0, 0, 0, 0.95)";
  ctx.shadowBlur = 14;
  ctx.globalAlpha = clamp((progress - 0.15) / 0.42, 0, 1) * clamp((1 - progress) / 0.22, 0, 1);
  ctx.fillStyle = "#ff1e4f";
  ctx.font = "38px VT323";
  ctx.fillText("YOU DIED", canvas.width / 2, canvas.height * 0.42);
  ctx.fillStyle = "#f8f1df";
  ctx.font = "20px VT323";
  ctx.fillText(t_deathCause, canvas.width / 2, canvas.height * 0.42 + 30);

  ctx.restore();
}

function hasCoarsePointer() {
  return window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
}

function drawTouchAffordances() {
  if (isMainMenu || isPaused || isGameOver || !trophyOverlay.hidden) return;
  if (!pointerDown && !hasCoarsePointer()) return;

  const alpha = pointerDown ? 0.24 : 0.1;
  const blastReady = t_player.blastCooldown <= 0;

  ctx.save();
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  drawTouchSteerAffordance(alpha);

  ctx.globalAlpha = blastReady ? alpha : alpha * 0.42;
  ctx.strokeStyle = blastReady ? "rgba(141, 231, 255, 0.72)" : "rgba(248, 241, 223, 0.35)";
  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height - 62, 24, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, canvas.height - 81);
  ctx.lineTo(canvas.width / 2, canvas.height - 43);
  ctx.moveTo(canvas.width / 2 - 15, canvas.height - 66);
  ctx.lineTo(canvas.width / 2, canvas.height - 81);
  ctx.lineTo(canvas.width / 2 + 15, canvas.height - 66);
  ctx.stroke();
  ctx.restore();
}

function drawTouchSteerAffordance(alpha) {
  const y = canvas.height - 36;
  const centerX = canvas.width / 2;
  const knobX = pointerDown && touchPoint
    ? clamp(touchPoint.x, 44, canvas.width - 44)
    : centerX + touchAxis * 68;
  const active = Math.abs(touchAxis) > 0.05;

  ctx.globalAlpha = alpha * (active ? 1.15 : 0.72);
  ctx.strokeStyle = active ? "rgba(255, 138, 24, 0.76)" : "rgba(248, 241, 223, 0.36)";
  ctx.fillStyle = active ? "rgba(255, 138, 24, 0.2)" : "rgba(248, 241, 223, 0.09)";
  ctx.beginPath();
  ctx.moveTo(centerX - 86, y);
  ctx.lineTo(centerX + 86, y);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(knobX, y, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(centerX - 104, y);
  ctx.lineTo(centerX - 119, y - 10);
  ctx.lineTo(centerX - 119, y + 10);
  ctx.closePath();
  ctx.moveTo(centerX + 104, y);
  ctx.lineTo(centerX + 119, y - 10);
  ctx.lineTo(centerX + 119, y + 10);
  ctx.closePath();
  ctx.fill();

  if (pointerDown && touchPoint) {
    const pc = playerCenter();
    ctx.globalAlpha = alpha * 0.72;
    ctx.strokeStyle = "rgba(141, 231, 255, 0.55)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pc.x, pc.y);
    ctx.lineTo(knobX, clamp(touchPoint.y, 72, canvas.height - 48));
    ctx.stroke();
    ctx.lineWidth = 4;
  }
}

function drawWrappedPlayer() {
  drawHellGhost(t_player.x, t_player.y, t_player.w, t_player.h, t_player.vx, gameTime);
  if (!allowsHorizontalWrap()) return;

  const previewBand = 56;
  if (t_player.x < previewBand) {
    drawHellGhost(t_player.x + canvas.width, t_player.y, t_player.w, t_player.h, t_player.vx, gameTime, 0.36);
  }
  if (t_player.x + t_player.w > canvas.width - previewBand) {
    drawHellGhost(t_player.x - canvas.width, t_player.y, t_player.w, t_player.h, t_player.vx, gameTime, 0.36);
  }
}

function drawWrapGates() {
  if (isMainMenu || isGameOver || !allowsHorizontalWrap()) return;

  const playerLeft = clamp(t_player.x, 0, canvas.width);
  const playerRight = clamp(canvas.width - (t_player.x + t_player.w), 0, canvas.width);
  const proximity = Math.max(
    1 - playerLeft / WRAP_GATE_BAND,
    1 - playerRight / WRAP_GATE_BAND,
    Math.abs(t_player.vx) > MOVE_SPEED * 0.72 ? 0.28 : 0
  );
  const pulse = 0.72 + Math.sin(gameTime * 0.18) * 0.22;
  const alpha = (0.08 + clamp(proximity, 0, 1) * 0.36) * pulse;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = "#8de7ff";
  ctx.fillStyle = "#8de7ff";
  ctx.shadowColor = "rgba(141, 231, 255, 0.8)";
  ctx.shadowBlur = 12;
  ctx.lineWidth = 2;

  for (const side of [0, canvas.width]) {
    const dir = side === 0 ? 1 : -1;
    ctx.beginPath();
    ctx.moveTo(side + dir * 4, 96);
    ctx.lineTo(side + dir * 4, canvas.height - 88);
    ctx.stroke();

    for (let y = 132; y < canvas.height - 100; y += 82) {
      ctx.beginPath();
      ctx.moveTo(side + dir * 14, y);
      ctx.lineTo(side + dir * 30, y - 10);
      ctx.lineTo(side + dir * 30, y + 10);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawTower() {
  drawHellBackground(score, gameTime);
  drawWrapGates();

  const shake = getScreenShakeOffset();
  ctx.save();
  ctx.translate(shake.x, shake.y);
  drawHazards();
  drawEnemies();
  drawLandingGuide();
  for (const p of t_platforms) drawHellPlatform(p);
  drawBreakChunks();
  drawSoulShards();
  drawDreadGates();
  drawPowerups();
  drawProjectiles();
  drawParticles();
  drawGhostTrail();
  drawWrappedPlayer();
  drawFloatTexts();
  ctx.restore();

  drawThreatIndicators();
  drawFallWarning();
  drawDamageFlash();
  drawDeathImpact();
  drawTouchAffordances();
  drawPowerStatus();
  drawRunNotice();
}

function drawPlatformTile(type, x, y, w, h, alpha = 1) {
  const tile = PLATFORM_TILES[type];
  const img = tile?.img;
  const source = spriteSourceRect(tile);

  ctx.save();
  ctx.globalAlpha = alpha;

  if (img && img.complete && img.naturalWidth > 0 && source) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, source.sx, source.sy, source.sw, source.sh, x, y, w, h);
  } else {
    const fallback = type === "moving" ? "rgba(150, 255, 255, 0.55)" : type === "break" ? "#ddd" : type === "vanish" ? "rgba(194, 92, 255, 0.55)" : "#5d4037";
    ctx.fillStyle = fallback;
    ctx.fillRect(x, y, w, h);
  }

  ctx.restore();
}

function drawPlatformShadow(x, y, w, h, alpha = 0.24) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h + 7, w * 0.55, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawMovingPlatformRail(p) {
  if (typeof p.minX !== "number" || typeof p.maxX !== "number") return;

  const y = p.y + p.h + 7;
  const startX = p.minX + p.w / 2;
  const endX = p.maxX + p.w / 2;

  ctx.save();
  ctx.strokeStyle = "rgba(141, 231, 255, 0.28)";
  ctx.lineWidth = 2;
  ctx.setLineDash([7, 7]);
  ctx.beginPath();
  ctx.moveTo(startX, y);
  ctx.lineTo(endX, y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "rgba(141, 231, 255, 0.45)";
  ctx.beginPath();
  ctx.arc(startX, y, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(endX, y, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPlatformRim(p, alpha = 1) {
  if (!isUsablePlatform(p) && !(p.type === "vanish" && p.used && p.fade > 0)) return;

  const colorByType = {
    normal: "#f8f1df",
    moving: "#8de7ff",
    break: "#f8f1df",
    vanish: "#c25cff",
    boost: "#ff8a18",
  };
  const color = colorByType[p.type] || colorByType.normal;
  const glow = p.type === "normal" ? 0 : 10;
  const pulse = p.type === "boost" || p.type === "vanish"
    ? 0.72 + Math.sin(gameTime * 0.16 + p.y) * 0.18
    : 0.78;

  ctx.save();
  ctx.globalAlpha = alpha * pulse;
  ctx.shadowColor = color;
  ctx.shadowBlur = glow;
  ctx.strokeStyle = color;
  ctx.lineWidth = p.type === "normal" ? 1 : 2;
  ctx.strokeRect(p.x + 1.5, p.y + 1.5, p.w - 3, p.h - 3);

  ctx.globalAlpha = alpha * (p.type === "normal" ? 0.28 : 0.56);
  ctx.fillStyle = color;
  ctx.fillRect(p.x + 8, p.y + 3, p.w - 16, 2);

  if (p.type === "break" && !p.broken) {
    ctx.globalAlpha = alpha * 0.5;
    ctx.strokeStyle = "rgba(20, 16, 14, 0.85)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(p.x + 22, p.y + 5);
    ctx.lineTo(p.x + 31, p.y + 14);
    ctx.lineTo(p.x + 28, p.y + 21);
    ctx.moveTo(p.x + 45, p.y + 4);
    ctx.lineTo(p.x + 39, p.y + 12);
    ctx.lineTo(p.x + 48, p.y + 19);
    ctx.stroke();
  } else if (p.type === "boost") {
    ctx.globalAlpha = alpha * (0.46 + Math.sin(gameTime * 0.28 + p.x) * 0.12);
    ctx.fillStyle = "#ff8a18";
    ctx.beginPath();
    ctx.moveTo(p.x + p.w / 2, p.y - 13);
    ctx.lineTo(p.x + p.w / 2 + 10, p.y + 3);
    ctx.lineTo(p.x + p.w / 2 - 10, p.y + 3);
    ctx.closePath();
    ctx.fill();
  } else if (p.type === "moving") {
    ctx.globalAlpha = alpha * 0.5;
    ctx.fillStyle = "#8de7ff";
    ctx.beginPath();
    ctx.arc(p.x + 13, p.y + p.h / 2, 3, 0, Math.PI * 2);
    ctx.arc(p.x + p.w - 13, p.y + p.h / 2, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawHellPlatform(p) {
  const { x, y, w, h } = p;
  if (p.type === "vanish" && p.used && p.fade <= 0) return;

  if (p.type === "moving") drawMovingPlatformRail(p);
  drawPlatformShadow(x, y, w, h, p.type === "vanish" && p.used ? p.fade * 0.16 : 0.24);

  if (p.type === "vanish") {
    drawPlatformTile("vanish", x, y, w, h, p.used ? p.fade : 0.96);
  } else if (p.type === "boost") {
    drawPlatformTile("boost", x, y, w, h);
  } else if (p.type === "normal") {
    drawPlatformTile("normal", x, y, w, h);
  } else if (p.type === "moving") {
    drawPlatformTile("moving", x, y, w, h);
  } else if (p.type === "break") {
    if (p.broken) return;
    drawPlatformTile("break", x, y, w, h);
  }

  drawPlatformRim(p, p.type === "vanish" && p.used ? p.fade : 1);
}

function drawHellGhost(x, y, w, h, vx, time, alpha = 1) {
  ctx.save();
  const bob = Math.sin(time * 0.18) * 1.4;
  ctx.translate(x + w / 2, y + h / 2 + bob);
  const graceFlicker = hasDamageGrace() && Math.floor((t_player.damageGrace || 0) / 5) % 2 === 0 ? 0.48 : 1;
  ctx.globalAlpha = alpha * graceFlicker;

  const squash = clamp(t_player.landSquash || 0, 0, 1);
  ctx.scale(1 + squash * 0.16, 1 - squash * 0.11);

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

  if (hasShopItem("ash_halo")) {
    ctx.save();
    ctx.strokeStyle = "rgba(248, 241, 223, 0.8)";
    ctx.shadowColor = "rgba(255, 138, 24, 0.7)";
    ctx.shadowBlur = 12;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, -23, 16 + Math.sin(time * 0.08) * 1.2, 5, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  if ((t_player.perfectFlash || 0) > 0) {
    const perfectAlpha = clamp((t_player.perfectFlash || 0) / 18, 0, 1);
    ctx.save();
    ctx.globalAlpha = perfectAlpha * 0.9;
    ctx.strokeStyle = "rgba(248, 241, 223, 0.85)";
    ctx.shadowColor = "rgba(141, 231, 255, 0.72)";
    ctx.shadowBlur = 16;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 21, 18 + (1 - perfectAlpha) * 14, 5 + (1 - perfectAlpha) * 4, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  const boostFlame = Math.max(
    clamp((t_player.boostFlame || 0) / 28, 0, 1),
    clamp((-t_player.vy - 6) / 8, 0, 0.55)
  );
  if (boostFlame > 0.03) {
    drawGhostBoostFlame(boostFlame, time, alpha * graceFlicker);
  }

  drawPlayerWingBurst(time, alpha * graceFlicker);

  const playerSprites = getPlayerSpriteSet();
  const sprite = t_player.facing === "left" ? playerSprites.left : playerSprites.right;
  if (sprite && sprite.complete && sprite.naturalWidth > 0) {
    const drawW = w * 1.55;
    const drawH = h * 1.55;
    ctx.shadowColor = "rgba(255, 30, 79, 0.45)";
    ctx.shadowBlur = 16;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(sprite, -drawW / 2, -drawH / 2, drawW, drawH);
  } else {
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
  }

  ctx.restore();
}

function drawPlayerWingBurst(time, baseAlpha) {
  const frames = t_player.wingBurst || 0;
  if (frames <= 0) return;

  const sprite = POWERUP_SPRITES.wings;
  const img = sprite?.img;
  if (!img || !img.complete || img.naturalWidth <= 0) return;
  const source = spriteSourceRect(sprite);
  if (!source) return;

  const progress = clamp(frames / 42, 0, 1);
  const open = 1 - Math.pow(1 - progress, 2);
  const flap = Math.sin(time * 0.36) * 0.06;
  const width = 82 * (0.72 + open * 0.38);
  const height = 50 * (0.74 + open * 0.26 + flap);
  const alpha = baseAlpha * clamp(progress * 1.25, 0, 0.88);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.shadowColor = "rgba(255, 138, 24, 0.72)";
  ctx.shadowBlur = 18;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    img,
    source.sx,
    source.sy,
    source.sw,
    source.sh,
    -width / 2,
    -height / 2 - 2,
    width,
    height
  );
  ctx.restore();
}

function drawGhostBoostFlame(power, time, baseAlpha) {
  ctx.save();
  ctx.globalAlpha = baseAlpha * power;
  ctx.shadowColor = "rgba(255, 138, 24, 0.86)";
  ctx.shadowBlur = 18;

  for (let i = 0; i < 3; i++) {
    const wiggle = Math.sin(time * 0.22 + i * 1.7) * 3;
    const h = 18 + power * 22 - i * 4;
    const w = 8 + power * 12 - i * 2;
    ctx.fillStyle = i === 0 ? "#ff8a18" : i === 1 ? "#ffd166" : "#8de7ff";
    ctx.beginPath();
    ctx.moveTo(wiggle, 18 + i * 2);
    ctx.lineTo(wiggle + w, 10 + i * 4);
    ctx.lineTo(wiggle + Math.sin(time * 0.34 + i) * 6, 18 + h);
    ctx.lineTo(wiggle - w, 10 + i * 4);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

// ---------- loop ----------
function advanceSimulation() {
  gameTime++;

  if (!isMainMenu && !isPaused && !isGameOver && trophyOverlay.hidden) {
    updateTower();
  } else {
    updateParticles();
    updateBreakChunks();
    updateFloatTexts();
  }
  if (t_deathImpact && !t_gameOverRevealed) {
    t_deathImpact.life--;
    if (t_deathImpact.life <= 0) showGameOver();
  }
  updateScreenShake();
  if (t_damageFlash > 0) t_damageFlash--;
}

function gameLoop(timestamp = 0) {
  if (!loopLastTime) loopLastTime = timestamp;

  const frameMs = clamp(timestamp - loopLastTime, 0, MAX_FRAME_MS);
  loopLastTime = timestamp;
  loopAccumulator += frameMs;

  let steps = 0;
  while (loopAccumulator >= SIM_STEP_MS && steps < MAX_SIM_STEPS) {
    advanceSimulation();
    loopAccumulator -= SIM_STEP_MS;
    steps++;
  }

  if (steps >= MAX_SIM_STEPS) {
    loopAccumulator = 0;
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  drawTower();

  animationId = requestAnimationFrame(gameLoop);
}

function startGame() {
  keys = {};
  releasePointer();
  gameTime = 0;
  loopLastTime = 0;
  loopAccumulator = 0;
  isMainMenu = false;
  isPaused = false;
  isGameOver = false;
  mainMenu.hidden = true;
  pauseOverlay.hidden = true;
  trophyOverlay.hidden = true;
  shopOverlay.hidden = true;
  overlay.hidden = true;

  if (animationId) cancelAnimationFrame(animationId);

  best = getBestForMode();
  updateUI();

  initTower();
  if (runOmen && runContract) {
    const activeLevel = getActiveBonusLevel();
    if (activeLevel) {
      showRunNotice(activeLevel.name.toUpperCase(), "Bonus background enabled", activeLevel.scenes[0].accent);
    } else {
      showRunNotice(isHellMode() ? "HELL MODE" : runOmen.name.toUpperCase(), isHellMode() ? "No shields. No wrap. More enemies." : runContract.desc, isHellMode() ? "#ff1e4f" : "#ff8a18");
    }
  }
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

  if (!shopOverlay.hidden && key === "Escape") {
    e.preventDefault();
    closeShop();
    return;
  }

  if (!trophyOverlay.hidden || !shopOverlay.hidden) return;

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

  if (isGameOver && t_gameOverRevealed && (key === "Enter" || key === " ")) {
    e.preventDefault();
    startGame();
    return;
  }

  if (key === " ") {
    e.preventDefault();
    if (e.repeat) return;
    fireSoulBlast();
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

// click/touch: tap to fire, hold/drag to steer.
let pointerDown = false;
let touchAxis = 0;
let touchPoint = null;

function canvasPointFromPointerEvent(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / Math.max(1, rect.width);
  const scaleY = canvas.height / Math.max(1, rect.height);
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  };
}

function signedWrappedDelta(fromX, toX) {
  let dx = toX - fromX;
  if (dx > canvas.width / 2) dx -= canvas.width;
  if (dx < -canvas.width / 2) dx += canvas.width;
  return dx;
}

function activeSignedHorizontalDelta(fromX, toX) {
  return allowsHorizontalWrap() ? signedWrappedDelta(fromX, toX) : toX - fromX;
}

function updateTouchSteering(e) {
  touchPoint = canvasPointFromPointerEvent(e);
  const playerX = t_player.x + t_player.w / 2;
  const dx = activeSignedHorizontalDelta(playerX, touchPoint.x);
  if (Math.abs(dx) < TOUCH_STEER_DEAD_ZONE) {
    touchAxis = 0;
    return;
  }
  touchAxis = clamp(dx / TOUCH_STEER_FULL_RANGE, -1, 1);
}

function releasePointer() {
  pointerDown = false;
  touchAxis = 0;
  touchPoint = null;
}

canvas.addEventListener("pointerdown", (e) => {
  initAudio();
  e.preventDefault();
  if (isMainMenu || isPaused || isGameOver || !trophyOverlay.hidden) return;
  pointerDown = true;
  updateTouchSteering(e);
  canvas.setPointerCapture(e.pointerId);
  fireSoulBlast();
});
canvas.addEventListener("pointermove", (e) => {
  if (!pointerDown) return;
  e.preventDefault();
  updateTouchSteering(e);
});

canvas.addEventListener("pointerup", releasePointer);
canvas.addEventListener("pointercancel", releasePointer);
canvas.addEventListener("pointerleave", releasePointer);

// ---------- UI buttons ----------
restartBtn.addEventListener("click", () => {
  initAudio();
  startGame();
});

shootBtn.addEventListener("click", () => {
  initAudio();
  fireSoulBlast();
});

playAgainBtn.addEventListener("click", () => {
  initAudio();
  isGameOver = false;
  startGame();
});

gameOverMenuBtn.addEventListener("click", () => {
  initAudio();
  showMainMenu();
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

hellPlayBtn.addEventListener("click", () => {
  initAudio();
  setMode("hell", false);
  startGame();
});

menuModeBtn.addEventListener("click", () => {
  initAudio();
  toggleMode(false);
});

menuShopBtn.addEventListener("click", () => {
  initAudio();
  openShop();
});

menuTrophyBtn.addEventListener("click", () => {
  initAudio();
  openTrophies(menuTrophyBtn);
});

closeShopBtn.addEventListener("click", closeShop);

shopListEl.addEventListener("click", (e) => {
  const button = e.target.closest("[data-shop-id]");
  const costumeButton = e.target.closest("[data-costume-id]");
  const equipButton = e.target.closest("[data-equip-costume-id]");
  const levelButton = e.target.closest("[data-level-id]");
  const toggleLevelButton = e.target.closest("[data-toggle-level-id]");
  if (!button && !costumeButton && !equipButton && !levelButton && !toggleLevelButton) return;
  initAudio();
  if (button) buyShopItem(button.dataset.shopId);
  else if (costumeButton) buyCostume(costumeButton.dataset.costumeId);
  else if (equipButton) equipCostume(equipButton.dataset.equipCostumeId);
  else if (levelButton) buyBonusLevel(levelButton.dataset.levelId);
  else if (toggleLevelButton) toggleBonusLevel(toggleLevelButton.dataset.toggleLevelId);
});

pauseBtn.addEventListener("click", () => {
  initAudio();
  togglePause();
});

mainMenuBtn.addEventListener("click", () => {
  initAudio();
  showMainMenu();
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

menuMusicBtn.addEventListener("click", () => {
  setMusicEnabled(!soundSettings.musicEnabled);
  initAudio();
});

pauseMusicBtn.addEventListener("click", () => {
  setMusicEnabled(!soundSettings.musicEnabled);
  initAudio();
});

volumeSlider.addEventListener("input", () => {
  initAudio();
  setVolumeFromSlider(volumeSlider.value);
});

// boot
applySoundSettings();
initTower();
showMainMenu();
gameLoop();
