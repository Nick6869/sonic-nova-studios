(() => {
  "use strict";

  let REDUCED_MOTION = window.ArcadeUX.motionReduced();
window.ArcadeUX.onPreferences(() => { REDUCED_MOTION = window.ArcadeUX.motionReduced(); });

  function isDeveloperMode() {
    return Boolean(window.ArcadeDeveloperMode?.enabled);
  }

  const canvas = document.querySelector("#game");
  const ctx = canvas.getContext("2d");
  const ui = {
    title: document.querySelector("#title-screen"),
    shells: document.querySelectorAll(".game-shell"),
    start: document.querySelector("#start-game"),
    modeToggle: document.querySelector("#mode-toggle"),
    shopToggle: document.querySelector("#shop-toggle"),
    sound: document.querySelector("#sound-toggle"),
    pauseSound: document.querySelector("#pause-sound-toggle"),
    controlsToggle: document.querySelector("#controls-toggle"),
    controlsCard: document.querySelector("#controls-card"),
    trophiesToggle: document.querySelector("#trophies-toggle"),
    trophiesCard: document.querySelector("#trophies-card"),
    trophyProgress: document.querySelector("#trophy-progress"),
    trophyList: document.querySelector("#trophy-list"),
    titleBest: document.querySelector("#title-best"),
    titleRite: document.querySelector("#title-rite"),
    titleBank: document.querySelector("#title-bank"),
    careerSummary: document.querySelector("#career-summary"),
    pactList: document.querySelector("#pact-list"),
    shopCard: document.querySelector("#shop-card"),
    shopList: document.querySelector("#shop-list"),
    bankStatus: document.querySelector("#bank-status"),
    score: document.querySelector("#scoreVal"),
    best: document.querySelector("#bestVal"),
    depth: document.querySelector("#depthVal"),
    shield: document.querySelector("#shieldVal"),
    heat: document.querySelector("#heatVal"),
    runGoal: document.querySelector("#run-goal"),
    runPact: document.querySelector("#run-pact"),
    runZone: document.querySelector("#run-zone"),
    menu: document.querySelector("#menu-button"),
    pause: document.querySelector("#pause-button"),
    restart: document.querySelector("#restart"),
    overlay: document.querySelector("#overlay"),
    overTitle: document.querySelector("#over-title"),
    finalScore: document.querySelector("#final-score"),
    finalSummary: document.querySelector("#final-summary"),
    finalRecap: document.querySelector("#final-recap"),
    playAgain: document.querySelector("#play-again"),
    backTitle: document.querySelector("#back-title"),
    pauseMenu: document.querySelector("#pause-menu"),
    resume: document.querySelector("#resume-game"),
    pauseRestart: document.querySelector("#pause-restart"),
    pauseMainMenu: document.querySelector("#pause-main-menu"),
    touchLeft: document.querySelector("#touch-left"),
    touchRight: document.querySelector("#touch-right"),
    touchFire: document.querySelector("#touch-fire"),
    touchDash: document.querySelector("#touch-dash"),
    toast: document.querySelector("#toast")
  };

  const ASSETS = {
    background: "Assets/mainbackground.webp",
    background2: "Assets/background2.webp",
    background3: "Assets/background3.webp",
    background4: "Assets/background4.webp",
    background5: "Assets/background5.webp",
    background6: "Assets/background6.webp",
    background7: "Assets/background7.webp",
    background8: "Assets/background8.webp",
    player: "Assets/player character.webp",
    leftWall: "Assets/left blood wall.webp",
    rightWall: "Assets/right blood wall.webp",
    shield: "Assets/shield power up.webp",
    coolant: "Assets/coolant power up.webp",
    surge: "Assets/pulse surge power up.webp",
    miniBoss: "Assets/mini boss 1.webp",
    stalker: "Assets/stalker boss.webp",
    obstacle1: "Assets/obstacle1.webp",
    obstacle2: "Assets/obstacle2.webp",
    obstacle3: "Assets/obstacle3.webp"
  };

  const images = {};
  for (const [key, src] of Object.entries(ASSETS)) {
    const image = new Image();
    image.src = src;
    images[key] = image;
  }

  const BEST_KEY = "bloodTunnelBestScore";
  const PROGRESS_KEY = "bloodTunnelProgressV1";
  const TROPHY_KEY = "bloodTunnelTrophiesV1";
  const SOUND_KEY = "bloodTunnelSoundV1";
  const PACT_KEY = "bloodTunnelPactV2";
  const MODE_KEY = "bloodTunnelModeV1";
  const BANK_KEY = "bloodTunnelBankV1";
  const DAILY_BEST_KEY = "bloodTunnelDailyBestV1";

  const blankBank = {
    ichor: 0,
    upgrades: {
      clotArmor: 0,
      coolVeins: 0,
      dashRelay: 0,
      nearSense: 0,
      eventSense: 0
    }
  };

  const UPGRADES = [
    { id: "clotArmor", name: "Clot Armor", desc: "Start runs with shield plating.", max: 3, costs: [80, 180, 360] },
    { id: "coolVeins", name: "Cool Veins", desc: "Reduce heat gained from firing.", max: 4, costs: [90, 210, 420, 760] },
    { id: "dashRelay", name: "Dash Relay", desc: "Shorten dash cooldown and extend dash immunity.", max: 3, costs: [110, 260, 520] },
    { id: "nearSense", name: "Near Sense", desc: "Earn more from close calls.", max: 4, costs: [70, 170, 340, 680] },
    { id: "eventSense", name: "Event Sense", desc: "Longer event warnings and extra survival payout.", max: 3, costs: [100, 240, 500] }
  ];

  const PACTS = [
    {
      id: "steady",
      name: "Clean Blood",
      short: "Clean",
      desc: "Classic pacing and normal score.",
      score: 1,
      heatDrain: 1,
      spawn: 0,
      boss: 1,
      maxShield: 3
    },
    {
      id: "fever",
      name: "Fever Pact",
      short: "Fever",
      desc: "+25% score. Heat drains slower and surges arrive earlier.",
      score: 1.25,
      heatDrain: 0.62,
      spawn: 6,
      boss: 0.88,
      maxShield: 3,
      startHeat: 18
    },
    {
      id: "bare",
      name: "Bare Nerve",
      short: "Bare",
      desc: "+40% score. Shields cap at one.",
      score: 1.4,
      heatDrain: 1,
      spawn: 3,
      boss: 0.94,
      maxShield: 1
    },
    {
      id: "butcher",
      name: "Butcher Flow",
      short: "Butcher",
      desc: "+55% score. More bosses, bolts, and dense hazard waves.",
      score: 1.55,
      heatDrain: 0.82,
      spawn: 12,
      boss: 0.72,
      maxShield: 2,
      startHeat: 10
    }
  ];

  const RUN_RITES = [
    { id: "threader", name: "Thread 12 hazards", desc: "Pass 12 hazards.", test: (r) => r.obstacles >= 12 },
    { id: "deep", name: "Reach 450m", desc: "Dive to 450m.", test: (r) => r.depth >= 450 },
    { id: "cool", name: "Stay under 70 heat", desc: "Score 300 before overheating.", test: (r) => r.score >= 300 && r.overheats === 0 },
    { id: "near", name: "Earn 8 near misses", desc: "Slip past 8 hazards.", test: (r) => r.nearMisses >= 8 },
    { id: "hunter", name: "Break a boss", desc: "Destroy one boss.", test: (r) => r.bossKills >= 1 },
    { id: "sharpshot", name: "Shoot 10 hazards", desc: "Destroy 10 hazards with fire.", test: (r) => r.enemiesShot >= 10 }
  ];

  const TUNNEL_ZONES = [
    { depth: 0, name: "Fresh Artery", short: "Fresh", bg: "background", tint: "rgba(0,0,0,0.34)", mechanic: "baseline", spawn: 0, leech: 0, wall: 1, heatGain: 1, heatDrain: 1, pickup: 1, boss: 1, event: 0, visibility: 0, score: 1 },
    { depth: 360, name: "Serrated Vein", short: "Serrated", bg: "background2", tint: "rgba(32,0,8,0.30)", mechanic: "serrated", spawn: 3, leech: 0.01, wall: 1.08, heatGain: 1, heatDrain: 1, pickup: 1, boss: 0.98, event: 0.0002, visibility: 0, score: 1.04 },
    { depth: 720, name: "Clot Fields", short: "Clot", bg: "background3", tint: "rgba(44,6,10,0.32)", mechanic: "clot", spawn: 7, leech: 0.08, wall: 1, heatGain: 1.02, heatDrain: 0.96, pickup: 1.05, boss: 0.95, event: 0.00045, visibility: 0, score: 1.08 },
    { depth: 1080, name: "Valve Chamber", short: "Valve", bg: "background4", tint: "rgba(18,0,20,0.33)", mechanic: "valve", spawn: 4, leech: 0.02, wall: 1.65, heatGain: 1, heatDrain: 1, pickup: 0.95, boss: 0.93, event: 0.00035, visibility: 0, score: 1.12 },
    { depth: 1440, name: "Fever Vein", short: "Fever", bg: "background5", tint: "rgba(62,20,0,0.28)", mechanic: "fever", spawn: 8, leech: 0.03, wall: 1.04, heatGain: 1.28, heatDrain: 0.7, pickup: 1.28, boss: 0.9, event: 0.00075, visibility: 0, score: 1.16 },
    { depth: 1800, name: "Stalker Nest", short: "Nest", bg: "background6", tint: "rgba(10,0,0,0.38)", mechanic: "nest", spawn: 7, leech: 0.05, wall: 1.12, heatGain: 1.08, heatDrain: 0.9, pickup: 1, boss: 0.58, event: 0.00055, visibility: 0.05, score: 1.22 },
    { depth: 2220, name: "Black Vessel", short: "Black", bg: "background7", tint: "rgba(0,0,18,0.43)", mechanic: "black", spawn: 9, leech: 0.08, wall: 1.16, heatGain: 1.1, heatDrain: 0.86, pickup: 0.9, boss: 0.72, event: 0.0007, visibility: 0.34, score: 1.32 },
    { depth: 2700, name: "Heartgate", short: "Gate", bg: "background8", tint: "rgba(42,0,28,0.36)", mechanic: "heart", spawn: 13, leech: 0.1, wall: 1.24, heatGain: 1.15, heatDrain: 0.82, pickup: 1.08, boss: 0.56, event: 0.001, visibility: 0.16, score: 1.45 }
  ];

  let selectedPact = PACTS.find((pact) => pact.id === localStorage.getItem(PACT_KEY)) || PACTS[0];
  let selectedMode = localStorage.getItem(MODE_KEY) === "daily" ? "daily" : "classic";
  let bank = readBank();
  let dailyBest = readJson(DAILY_BEST_KEY, {});
  applyDeveloperModeUnlocks();

  const TROPHIES = [
    ["first_descent", "First Descent", "Start your first run.", (s, r) => s.runs >= 1 || r.started],
    ["score_100", "Warm Pulse", "Score 100.", (s, r) => Math.max(s.bestScore, r.score) >= 100],
    ["score_250", "Red Runner", "Score 250.", (s, r) => Math.max(s.bestScore, r.score) >= 250],
    ["score_500", "Artery Ace", "Score 500.", (s, r) => Math.max(s.bestScore, r.score) >= 500],
    ["score_750", "Deep Cut", "Score 750.", (s, r) => Math.max(s.bestScore, r.score) >= 750],
    ["score_1000", "Tunnel Legend", "Score 1,000.", (s, r) => Math.max(s.bestScore, r.score) >= 1000],
    ["depth_250", "250 Meters", "Reach 250m.", (s, r) => Math.max(s.bestDepth, r.depth) >= 250],
    ["depth_500", "500 Meters", "Reach 500m.", (s, r) => Math.max(s.bestDepth, r.depth) >= 500],
    ["depth_750", "750 Meters", "Reach 750m.", (s, r) => Math.max(s.bestDepth, r.depth) >= 750],
    ["depth_1000", "Kilometer Vein", "Reach 1,000m.", (s, r) => Math.max(s.bestDepth, r.depth) >= 1000],
    ["dash_10", "Dash Practice", "Dash 10 times total.", (s, r) => s.dashes + r.dashes >= 10],
    ["dash_50", "Dash Fiend", "Dash 50 times total.", (s, r) => s.dashes + r.dashes >= 50],
    ["dash_hit", "Shoulder Check", "Dash into a boss.", (s, r) => s.bossHits + r.bossHits >= 1],
    ["boss_hits_10", "Boss Bruiser", "Land 10 boss dash hits.", (s, r) => s.bossHits + r.bossHits >= 10],
    ["boss_hits_30", "Stalker Breaker", "Land 30 boss dash hits.", (s, r) => s.bossHits + r.bossHits >= 30],
    ["shield_1", "Clot Armor", "Collect a shield.", (s, r) => s.shields + r.shields >= 1],
    ["shield_10", "Armored Descent", "Collect 10 shields total.", (s, r) => s.shields + r.shields >= 10],
    ["shield_save", "Not Today", "Let a shield save you.", (s, r) => s.saves + r.saves >= 1],
    ["saves_5", "Hard To Kill", "Trigger 5 shield saves.", (s, r) => s.saves + r.saves >= 5],
    ["near_25", "Needle Threader", "Earn 25 near misses.", (s, r) => s.nearMisses + r.nearMisses >= 25],
    ["near_100", "Close Call Artist", "Earn 100 near misses.", (s, r) => s.nearMisses + r.nearMisses >= 100],
    ["obstacles_25", "Debris Dancer", "Pass 25 hazards.", (s, r) => s.obstacles + r.obstacles >= 25],
    ["obstacles_100", "Debris Veteran", "Pass 100 hazards.", (s, r) => s.obstacles + r.obstacles >= 100],
    ["obstacles_250", "Debris Master", "Pass 250 hazards.", (s, r) => s.obstacles + r.obstacles >= 250],
    ["runs_3", "Three Descents", "Play 3 runs.", (s) => s.runs >= 3],
    ["runs_10", "Ten Descents", "Play 10 runs.", (s) => s.runs >= 10],
    ["runs_25", "Regular Offering", "Play 25 runs.", (s) => s.runs >= 25],
    ["combo_3", "Triple Pulse", "Reach a 3x combo.", (s, r) => Math.max(s.bestCombo, r.bestCombo) >= 3],
    ["combo_5", "Fivefold Pulse", "Reach a 5x combo.", (s, r) => Math.max(s.bestCombo, r.bestCombo) >= 5],
    ["combo_8", "Eightfold Pulse", "Reach an 8x combo.", (s, r) => Math.max(s.bestCombo, r.bestCombo) >= 8],
    ["mini_boss", "Mini Boss Sighted", "Survive a mini boss encounter.", (s, r) => s.miniBosses + r.miniBosses >= 1],
    ["mini_boss_5", "Mini Boss Hunter", "Survive 5 mini boss encounters.", (s, r) => s.miniBosses + r.miniBosses >= 5],
    ["stalker", "Stalker Seen", "Meet the stalker.", (s, r) => s.stalkers + r.stalkers >= 1],
    ["stalker_3", "Stalker Regular", "Meet the stalker 3 times.", (s, r) => s.stalkers + r.stalkers >= 3],
    ["fast", "Fast Blood", "Reach speed 6.", (s, r) => Math.max(s.bestSpeed, r.bestSpeed) >= 6],
    ["faster", "Racing Pulse", "Reach speed 8.", (s, r) => Math.max(s.bestSpeed, r.bestSpeed) >= 8],
    ["wall_escape", "Wall Escape", "Escape 10 wall squeezes.", (s, r) => s.wallEscapes + r.wallEscapes >= 10],
    ["wall_escape_50", "Pressure Expert", "Escape 50 wall squeezes.", (s, r) => s.wallEscapes + r.wallEscapes >= 50],
    ["daily_boost", "Daily Bloodletting", "Use a daily offering.", (s, r) => s.dailyBoosts + r.dailyBoosts >= 1],
    ["no_shield_300", "Bare Nerves", "Score 300 without collecting a shield.", (s, r) => s.noShieldBest >= 300 || (r.score >= 300 && r.shields === 0)],
    ["dashless_250", "Steady Hands", "Score 250 without dashing.", (s, r) => s.dashlessBest >= 250 || (r.score >= 250 && r.dashes === 0)],
    ["one_run_5_shields", "Shield Magnet", "Collect 5 shields in one run.", (s, r) => Math.max(s.bestRunShields, r.shields) >= 5],
    ["one_run_20_near", "Edge Walker", "Earn 20 near misses in one run.", (s, r) => Math.max(s.bestRunNearMisses, r.nearMisses) >= 20],
    ["one_run_30_obs", "Hazard Sweep", "Pass 30 hazards in one run.", (s, r) => Math.max(s.bestRunObstacles, r.obstacles) >= 30],
    ["score_1500", "Blood Tunnel Royalty", "Score 1,500.", (s, r) => Math.max(s.bestScore, r.score) >= 1500],
    ["depth_1500", "Below The Map", "Reach 1,500m.", (s, r) => Math.max(s.bestDepth, r.depth) >= 1500],
    ["overheat_3", "Hot Hands", "Overheat 3 times total.", (s, r) => s.overheats + r.overheats >= 3],
    ["shots_100", "Hot Barrel", "Fire 100 shots total.", (s, r) => s.shotsFired + r.shotsFired >= 100],
    ["kills_50", "Debris Surgeon", "Shoot down 50 hazards total.", (s, r) => s.enemiesShot + r.enemiesShot >= 50],
    ["tide_survivor", "Tide Survivor", "Survive 5 blood tide events.", (s, r) => s.tidesSurvived + r.tidesSurvived >= 5],
    ["zone_clot", "Clot Cartographer", "Reach the Clot Fields.", (s, r) => Math.max(s.bestZoneIndex, r.zoneIndex) >= 2],
    ["zone_valve", "Valve Witness", "Reach the Valve Chamber.", (s, r) => Math.max(s.bestZoneIndex, r.zoneIndex) >= 3],
    ["zone_fever", "Fever Witness", "Reach the Fever Vein.", (s, r) => Math.max(s.bestZoneIndex, r.zoneIndex) >= 4],
    ["zone_nest", "Nest Trespasser", "Reach the Stalker Nest.", (s, r) => Math.max(s.bestZoneIndex, r.zoneIndex) >= 5],
    ["zone_black", "Black Vessel", "Reach the Black Vessel.", (s, r) => Math.max(s.bestZoneIndex, r.zoneIndex) >= 6],
    ["zone_heartgate", "Heartgate", "Reach the Heartgate.", (s, r) => Math.max(s.bestZoneIndex, r.zoneIndex) >= 7],
    ["zone_rite", "Rite Keeper", "Complete a rite past the Valve Chamber.", (s, r) => s.zoneRites + (r.riteComplete && r.zoneIndex >= 3 ? 1 : 0) >= 1],
    ["nest_stalker", "Nest Breaker", "Break a stalker in the Stalker Nest or deeper.", (s, r) => s.nestStalkerKills + r.nestStalkerKills >= 1],
    ["black_no_shield", "Blind Nerves", "Reach Black Vessel without collecting a shield.", (s, r) => s.blackNoShieldRuns + (r.zoneIndex >= 6 && r.shields === 0 ? 1 : 0) >= 1],
    ["daily_run", "Daily Descent", "Play a Daily Challenge.", (s, r) => s.dailyRuns + (r.dailyMode ? 1 : 0) >= 1],
    ["daily_rite", "Daily Offering", "Complete a Daily Challenge rite.", (s, r) => s.dailyRites + (r.dailyMode && r.riteComplete ? 1 : 0) >= 1],
    ["bank_first", "Blood Bank", "Buy your first upgrade.", (s) => s.upgradesBought >= 1],
    ["bank_five", "Vein Investor", "Buy 5 total upgrades.", (s) => s.upgradesBought >= 5],
    ["bank_max", "Fully Primed", "Max out an upgrade.", (s) => s.maxedUpgrades >= 1]
  ].map(([id, name, desc, test]) => ({ id, name, desc, test }));

  const blankStats = {
    runs: 0,
    bestScore: 0,
    bestDepth: 0,
    bestCombo: 0,
    bestSpeed: 0,
    dashes: 0,
    shields: 0,
    saves: 0,
    nearMisses: 0,
    obstacles: 0,
    bossHits: 0,
    bossKills: 0,
    bestZoneIndex: 0,
    zoneRites: 0,
    nestStalkerKills: 0,
    blackNoShieldRuns: 0,
    dailyRuns: 0,
    dailyRites: 0,
    dailyBestScore: 0,
    ichorEarned: 0,
    upgradesBought: 0,
    maxedUpgrades: 0,
    miniBosses: 0,
    stalkers: 0,
    wallEscapes: 0,
    dailyBoosts: 0,
    shotsFired: 0,
    enemiesShot: 0,
    overheats: 0,
    tidesSurvived: 0,
    noShieldBest: 0,
    dashlessBest: 0,
    bestRunShields: 0,
    bestRunNearMisses: 0,
    bestRunObstacles: 0
  };

  let progress = readProgress();
  window.NationalLeaderboard?.init({
    gameId: "blood-tunnel",
    gameName: "Blood Tunnel",
    getPersonalScores: () => [
      { label: "Best Score", score: progress?.bestScore || 0 },
      { label: "Daily Best", score: progress?.dailyBestScore || 0 },
      { label: "Ichor", score: bank?.ichor || 0 }
    ]
  });
  let trophies = readTrophies();
  let soundOn = localStorage.getItem(SOUND_KEY) !== "off";
  let audioCtx = null;
  let masterGain = null;
  let frameId = 0;
  let mode = "title";
  let activeTitleInfoTrigger = null;
  let keys = {};
  let courseRandom = Math.random;
  let shotRandom = Math.random;
  let touchMove = 0;
  let touchFire = false;
  let toastTimer = 0;

  const player = { x: 300, y: 640, w: 54, h: 70, vx: 0, dash: 0, dashCooldown: 0, fireCooldown: 0, shield: 0, invuln: 0 };
  const run = {};
  const state = {
    hazards: [],
    pickups: [],
    bosses: [],
    shots: [],
    enemyShots: [],
    particles: [],
    floatTexts: [],
    motes: [],
    bg: 0,
    heat: 0,
    overheated: 0,
    heatWarnLevel: 0,
    heatPulse: 0,
    heatAlarmCooldown: 0,
    event: null,
    eventTimer: 0,
    eventWarn: 0,
    tideDir: 0,
    wallLeft: 0,
    wallRight: 0,
    wallState: "idle",
    wallSide: -1,
    wallTarget: 0,
    wallTimer: 0,
    wallWarn: 0,
    zonePulseTimer: 0,
    zonePulseSide: 0,
    zonePulseWarn: 0,
    spawnTimer: 0,
    pickupTimer: 360,
    bossTimer: 620,
    shake: 0
  };

  function readJson(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key) || "null") || fallback;
    } catch {
      return fallback;
    }
  }

  function saveJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }

  function readBank() {
    const saved = readJson(BANK_KEY, {});
    const upgrades = { ...blankBank.upgrades, ...(saved.upgrades || {}) };
    return { ichor: Math.max(0, Number(saved.ichor) || 0), upgrades };
  }

  function saveBank() {
    saveJson(BANK_KEY, bank);
  }

  function applyDeveloperModeUnlocks() {
    if (!isDeveloperMode()) return;

    bank.ichor = Math.max(bank.ichor, 999999);
    for (const upgrade of UPGRADES) {
      bank.upgrades[upgrade.id] = upgrade.max;
    }
    saveBank();
  }

  function upgradeLevel(id) {
    return Math.max(0, Number(bank.upgrades[id]) || 0);
  }

  function upgradeSpent() {
    return Object.values(bank.upgrades).reduce((sum, value) => sum + (Number(value) || 0), 0);
  }

  function maxedUpgradeCount() {
    return UPGRADES.filter((upgrade) => upgradeLevel(upgrade.id) >= upgrade.max).length;
  }

  function todayKey() {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function dailySeed(date) {
    return date.split("").reduce((seed, char) => ((seed * 31) + char.charCodeAt(0)) >>> 0, 2166136261);
  }

  function seededChoice(list, daySeed, salt) {
    const seed = (daySeed + salt * 2654435761) >>> 0;
    return list[seed % list.length];
  }

  function seededRandom(seed) {
    return () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
  }

  function dailyChallenge() {
    const date = todayKey();
    const daySeed = dailySeed(date);
    const pactPool = PACTS.filter((pact) => pact.id !== "steady");
    const zoneIndex = 2 + (daySeed % (TUNNEL_ZONES.length - 2));
    const zone = TUNNEL_ZONES[zoneIndex];
    return {
      key: date,
      seed: daySeed,
      pact: seededChoice(pactPool, daySeed, 1),
      rite: seededChoice(RUN_RITES, daySeed, 2),
      featuredZone: zone,
      featuredZoneIndex: zoneIndex,
      scoreBoost: 1.12 + (daySeed % 4) * 0.03
    };
  }

  function readProgress() {
    return { ...blankStats, ...readJson(PROGRESS_KEY, {}) };
  }

  function saveProgress() {
    saveJson(PROGRESS_KEY, progress);
    try {
      localStorage.setItem(BEST_KEY, String(progress.bestScore));
    } catch {}
  }

  function readTrophies() {
    const value = readJson(TROPHY_KEY, []);
    return Array.isArray(value) ? value : [];
  }

  function saveTrophies() {
    saveJson(TROPHY_KEY, trophies);
  }

  function fmt(value) {
    return Math.floor(value || 0).toLocaleString();
  }

  function currentPact() {
    return run.pact || selectedPact || PACTS[0];
  }

  function currentZone() {
    return zoneForDepth(run.depth || 0);
  }

  function currentModeLabel() {
    return selectedMode === "daily" ? "Daily" : "Classic";
  }

  function chooseRite() {
    const seed = (progress.runs * 3 + new Date().getDate()) % RUN_RITES.length;
    return RUN_RITES[seed];
  }

  function zoneForDepth(depth) {
    let index = 0;
    for (let i = 1; i < TUNNEL_ZONES.length; i++) {
      if (depth >= TUNNEL_ZONES[i].depth) index = i;
      else break;
    }
    return { ...TUNNEL_ZONES[index], index };
  }

  function updateZone() {
    const zone = zoneForDepth(run.depth);
    if (zone.index !== run.zoneIndex) {
      run.zoneIndex = zone.index;
      run.zoneName = zone.name;
      run.zoneBanner = 150;
      run.combo = Math.min(9, run.combo + 0.35);
      addScore(35 + zone.index * 8);
      showToast(`Entering ${zone.name}.`);
    }
  }

  function buyUpgrade(id) {
    const upgrade = UPGRADES.find((item) => item.id === id);
    if (!upgrade) return;
    const level = upgradeLevel(id);
    if (level >= upgrade.max) return;
    const cost = upgrade.costs[level];
    if (bank.ichor < cost) {
      showToast("Not enough Ichor.");
      return;
    }
    bank.ichor -= cost;
    bank.upgrades[id] = level + 1;
    saveBank();
    progress.upgradesBought = upgradeSpent();
    progress.maxedUpgrades = maxedUpgradeCount();
    saveProgress();
    renderShop();
    refreshTitle();
    checkTrophies();
    sound("pickup");
  }

  function renderShop() {
    if (!ui.shopList) return;
    ui.bankStatus.textContent = `${fmt(bank.ichor)} Ichor`;
    ui.shopList.innerHTML = "";
    for (const upgrade of UPGRADES) {
      const level = upgradeLevel(upgrade.id);
      const maxed = level >= upgrade.max;
      const cost = maxed ? 0 : upgrade.costs[level];
      const button = document.createElement("button");
      button.type = "button";
      button.className = `shop-item${maxed ? " maxed" : ""}`;
      button.disabled = maxed || bank.ichor < cost;
      button.innerHTML = `<strong>${upgrade.name} <span>${level}/${upgrade.max}</span></strong><small>${upgrade.desc}</small><em>${maxed ? "Maxed" : `${fmt(cost)} Ichor`}</em>`;
      button.addEventListener("click", () => buyUpgrade(upgrade.id));
      ui.shopList.append(button);
    }
  }

  function toggleMode() {
    selectedMode = selectedMode === "daily" ? "classic" : "daily";
    try {
      localStorage.setItem(MODE_KEY, selectedMode);
    } catch {}
    refreshTitle();
  }

  function setSelectedPact(id) {
    selectedPact = PACTS.find((pact) => pact.id === id) || PACTS[0];
    try {
      localStorage.setItem(PACT_KEY, selectedPact.id);
    } catch {}
    renderPacts();
    refreshTitle();
  }

  function renderPacts() {
    if (!ui.pactList) return;
    ui.pactList.innerHTML = "";
    for (const pact of PACTS) {
      const button = document.createElement("button");
      button.type = "button";
      const daily = selectedMode === "daily" ? dailyChallenge() : null;
      const selected = daily ? pact.id === daily.pact.id : pact.id === selectedPact.id;
      button.className = `pact-option${selected ? " selected" : ""}`;
      button.dataset.pact = pact.id;
      button.disabled = Boolean(daily);
      button.innerHTML = `<strong>${pact.name}</strong><span>${daily ? "Daily Challenge fixes the pact." : pact.desc}</span>`;
      button.addEventListener("click", () => setSelectedPact(pact.id));
      ui.pactList.append(button);
    }
  }

  function addFloat(x, y, text, color = "#ffd0d0") {
    state.floatTexts.push({ x, y, text, color, life: 72 });
  }

  function checkRite() {
    if (!run.rite || run.riteComplete || !run.rite.test(run)) return;
    run.riteComplete = true;
    const bonus = Math.floor(125 * currentPact().score);
    run.score += bonus;
    run.combo = Math.min(9, run.combo + 0.75);
    addFloat(player.x, player.y - 62, `RITE +${bonus}`, "#ffd166");
    showToast(`Rite complete: ${run.rite.name}`);
    sound("trophy");
  }

  function recapStat(label, value) {
    return `<div><span>${label}</span><strong>${value}</strong></div>`;
  }

  function initAudio() {
    if (audioCtx || !soundOn) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    audioCtx = new AudioContext();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.18;
    window.ArcadeUX.effectsGain(masterGain, () => soundOn ? 0.18 : 0);
  masterGain.connect(audioCtx.destination);
  }

  function beep(freq, dur = 0.07, type = "triangle", gainLevel = 0.1) {
    if (!soundOn || !window.ArcadeUX.effectsAllowed()) return;
    initAudio();
    if (!audioCtx || !masterGain) return;
    if (audioCtx.state === "suspended") void audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(gainLevel, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start();
    osc.stop(audioCtx.currentTime + dur + 0.03);
  }

  function sound(name) {
    if (name === "dash") beep(260, 0.08, "sawtooth", 0.08);
    if (name === "pickup") { beep(420, 0.05, "sine", 0.08); setTimeout(() => beep(610, 0.05, "sine", 0.06), 45); }
    if (name === "hit") beep(95, 0.14, "square", 0.12);
    if (name === "shoot") beep(560, 0.035, "triangle", 0.045);
    if (name === "score") beep(220, 0.035, "triangle", 0.035);
    if (name === "boss") { beep(120, 0.08, "sawtooth", 0.09); setTimeout(() => beep(82, 0.11, "sawtooth", 0.09), 70); }
    if (name === "trophy") { beep(520, 0.05, "sine", 0.08); setTimeout(() => beep(760, 0.08, "sine", 0.08), 70); }
    if (name === "heatWarn") beep(740, 0.045, "triangle", 0.045);
    if (name === "heatCritical") { beep(980, 0.055, "square", 0.055); setTimeout(() => beep(620, 0.065, "square", 0.05), 65); }
  }

  function setSound(value) {
    soundOn = value;
    localStorage.setItem(SOUND_KEY, value ? "on" : "off");
    ui.sound.textContent = `Sound: ${value ? "On" : "Off"}`;
    ui.pauseSound.textContent = ui.sound.textContent;
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    ui.toast.textContent = message;
    ui.toast.hidden = false;
    toastTimer = setTimeout(() => {
      ui.toast.hidden = true;
    }, 2600);
  }

  function defaultRun() {
    return {
      started: false,
      score: 0,
      depth: 0,
      combo: 1,
      comboTimer: 0,
      bestCombo: 1,
      dashes: 0,
      shields: 0,
      saves: 0,
      nearMisses: 0,
      obstacles: 0,
      bossHits: 0,
      bossKills: 0,
      miniBosses: 0,
      stalkers: 0,
      wallEscapes: 0,
      dailyBoosts: 0,
      shotsFired: 0,
      enemiesShot: 0,
      overheats: 0,
      tidesSurvived: 0,
      surgesSurvived: 0,
      clotStormsSurvived: 0,
      nestStalkerKills: 0,
      rite: null,
      riteComplete: false,
      pact: selectedPact,
      dailyMode: false,
      dailyKey: "",
      zoneIndex: 0,
      zoneName: TUNNEL_ZONES[0].name,
      zoneBanner: 0,
      speed: 3,
      bestSpeed: 3,
      time: 0
    };
  }

  function resetRun() {
    Object.assign(run, defaultRun(), { started: true });
    const daily = dailyChallenge();
    run.dailyMode = selectedMode === "daily";
    run.dailyKey = run.dailyMode ? daily.key : "";
    courseRandom = run.dailyMode ? seededRandom(daily.seed) : Math.random;
    shotRandom = run.dailyMode ? seededRandom(daily.seed ^ 0x9e3779b9) : Math.random;
    run.dashBlessing = false;
    run.rite = run.dailyMode ? daily.rite : chooseRite();
    run.pact = run.dailyMode ? daily.pact : selectedPact;
    run.zoneIndex = 0;
    run.zoneName = TUNNEL_ZONES[0].name;
    run.zoneBanner = 90;
    Object.assign(player, { x: 300, y: 642, w: 54, h: 70, vx: 0, dash: 0, dashCooldown: 0, fireCooldown: 0, shield: upgradeLevel("clotArmor"), invuln: 80 });
    Object.assign(state, {
      hazards: [],
      pickups: [],
      bosses: [],
      shots: [],
      enemyShots: [],
      particles: [],
      floatTexts: [],
      motes: [],
      bg: 0,
      heat: run.pact.startHeat || 0,
      overheated: 0,
      heatWarnLevel: 0,
      heatPulse: 0,
      heatAlarmCooldown: 0,
      event: null,
      eventTimer: 0,
      eventWarn: 0,
      eventSpawn: 0,
      tideDir: 0,
      wallLeft: 0,
      wallRight: 0,
      wallState: "idle",
      wallSide: -1,
      wallTarget: 0,
      wallTimer: 0,
      wallWarn: 0,
      zonePulseTimer: 0,
      zonePulseSide: 0,
      zonePulseWarn: 0,
      spawnTimer: 60,
      pickupTimer: 260,
      bossTimer: 620,
      shake: 0
    });

    const boost = mode === "playing" ? window.ArcadeDailyRewards?.consumeBoost?.("blood-tunnel") : null;
    if (boost) {
      run.dailyBoosts = 1;
      if (boost.id === "shield") player.shield += Number(boost.amount) || 1;
      if (boost.id === "headstart") run.score += Number(boost.amount) || 150;
      if (boost.id === "dash") run.dashBlessing = true;
      showToast(`Daily Offering active: ${boost.label}`);
    }
    player.shield = Math.min(currentPact().maxShield, player.shield);
    if (run.dailyMode) showToast(`Daily Challenge: ${daily.pact.name} | ${daily.rite.name}`);

    ui.overlay.hidden = true;
    ui.pauseMenu.hidden = true;
    updateHud();
    checkTrophies();
  }

  function startGame() {
    clearHeldInput();
    mode = "playing";
    ui.title.hidden = true;
    ui.shells.forEach((shell) => { shell.hidden = false; });
    resetRun();
    sound("pickup");
  }

  function showTitle() {
    mode = "title";
    ui.title.hidden = false;
    ui.shells.forEach((shell) => { shell.hidden = true; });
    ui.overlay.hidden = true;
    ui.pauseMenu.hidden = true;
    refreshTitle();
  }

  function clearHeldInput() {
    keys = {};
    touchMove = 0;
    touchFire = false;
  }

  function pauseGame() {
    if (mode !== "playing") return;
    clearHeldInput();
    mode = "paused";
    ui.pauseMenu.hidden = false;
  }

  function resumeGame() {
    if (mode !== "paused") return;
    mode = "playing";
    ui.pauseMenu.hidden = true;
  }

  function gameOver(reason = "The tunnel took you.") {
    if (mode === "gameover") return;
    mode = "gameover";
    state.shake = 18;
    sound("hit");
    const hadRecord = Math.floor(run.score) > progress.bestScore;
    commitRun();
    ui.overTitle.textContent = hadRecord ? "NEW RECORD" : run.riteComplete ? "RITE COMPLETE" : "GAME OVER";
    ui.finalScore.textContent = fmt(run.score);
    ui.finalSummary.textContent = `${reason} ${run.rite?.name || "Rite"}: ${run.riteComplete ? "complete" : "missed"} | ${currentPact().name}`;
    ui.finalRecap.innerHTML = [
      recapStat("Depth", `${fmt(run.depth)}m`),
      recapStat("Zone", run.zoneName),
      recapStat("Hazards", fmt(run.obstacles)),
      recapStat("Near Miss", fmt(run.nearMisses)),
      recapStat("Bosses", fmt(run.bossKills)),
      recapStat("Shots", fmt(run.shotsFired)),
      recapStat("Best Combo", `${run.bestCombo.toFixed(1)}x`)
    ].join("");
    ui.overlay.hidden = false;
    updateHud();
  }

  function commitRun() {
    const ichor = Math.max(8, Math.floor(run.score / 85) + Math.floor(run.depth / 120) + (run.riteComplete ? 18 : 0) + (run.dailyMode ? 12 : 0));
    bank.ichor += ichor;
    saveBank();
    progress.runs += 1;
    progress.bestScore = Math.max(progress.bestScore, Math.floor(run.score));
    progress.bestDepth = Math.max(progress.bestDepth, Math.floor(run.depth));
    progress.bestCombo = Math.max(progress.bestCombo, run.bestCombo);
    progress.bestSpeed = Math.max(progress.bestSpeed, run.bestSpeed);
    progress.dashes += run.dashes;
    progress.shields += run.shields;
    progress.saves += run.saves;
    progress.nearMisses += run.nearMisses;
    progress.obstacles += run.obstacles;
    progress.bossHits += run.bossHits;
    progress.bossKills += run.bossKills;
    progress.bestZoneIndex = Math.max(progress.bestZoneIndex, run.zoneIndex);
    if (run.riteComplete && run.zoneIndex >= 3) progress.zoneRites += 1;
    progress.nestStalkerKills += run.nestStalkerKills;
    if (run.zoneIndex >= 6 && run.shields === 0) progress.blackNoShieldRuns += 1;
    if (run.dailyMode) {
      progress.dailyRuns += 1;
      if (run.riteComplete) progress.dailyRites += 1;
      dailyBest[run.dailyKey] = Math.max(dailyBest[run.dailyKey] || 0, Math.floor(run.score));
      progress.dailyBestScore = Math.max(progress.dailyBestScore, dailyBest[run.dailyKey]);
      saveJson(DAILY_BEST_KEY, dailyBest);
    }
    progress.ichorEarned += ichor;
    progress.upgradesBought = upgradeSpent();
    progress.maxedUpgrades = maxedUpgradeCount();
    progress.miniBosses += run.miniBosses;
    progress.stalkers += run.stalkers;
    progress.wallEscapes += run.wallEscapes;
    progress.dailyBoosts += run.dailyBoosts;
    progress.shotsFired += run.shotsFired;
    progress.enemiesShot += run.enemiesShot;
    progress.overheats += run.overheats;
    progress.tidesSurvived += run.tidesSurvived;
    if (run.shields === 0) progress.noShieldBest = Math.max(progress.noShieldBest, Math.floor(run.score));
    if (run.dashes === 0) progress.dashlessBest = Math.max(progress.dashlessBest, Math.floor(run.score));
    progress.bestRunShields = Math.max(progress.bestRunShields, run.shields);
    progress.bestRunNearMisses = Math.max(progress.bestRunNearMisses, run.nearMisses);
    progress.bestRunObstacles = Math.max(progress.bestRunObstacles, run.obstacles);
    saveProgress();
    checkTrophies();
    window.AOHLeaderboard?.submit?.({ game: "blood-tunnel", score: Math.floor(run.score), meta: { depth: Math.floor(run.depth), mode: run.dailyMode ? "daily" : "classic" } });
  }

  function updateHud() {
    ui.score.textContent = fmt(run.score);
    ui.best.textContent = fmt(Math.max(progress.bestScore, run.score));
    ui.depth.textContent = `${fmt(run.depth)}m`;
    ui.shield.textContent = String(player.shield);
    ui.heat.textContent = state.overheated > 0 ? "HOT" : `${Math.round(state.heat)}%`;
    ui.heat.classList.toggle("is-hot", state.heat > 72 || state.overheated > 0);
    ui.runGoal.textContent = run.rite ? `${run.riteComplete ? "Done" : run.rite.name}` : "--";
    ui.runPact.textContent = run.dailyMode ? `Daily ${currentPact().short}` : currentPact().short;
    ui.runZone.textContent = currentZone().short;
  }

  function refreshTitle() {
    progress = readProgress();
    trophies = readTrophies();
    bank = readBank();
    dailyBest = readJson(DAILY_BEST_KEY, {});
    const daily = dailyChallenge();
    const activeBest = selectedMode === "daily" ? (dailyBest[daily.key] || 0) : progress.bestScore;
    ui.modeToggle.textContent = `Mode: ${currentModeLabel()}`;
    ui.titleBest.textContent = fmt(activeBest);
    ui.careerSummary.textContent = progress.runs
      ? `${fmt(progress.runs)} descents | best depth ${fmt(progress.bestDepth)}m | ${trophies.length}/${TROPHIES.length} trophies`
      : "No descents logged yet.";
    const nextRite = selectedMode === "daily" ? daily.rite : chooseRite();
    const nextPact = selectedMode === "daily" ? daily.pact : selectedPact;
    const dailyText = selectedMode === "daily" ? ` | Featured: ${daily.featuredZone.name}` : "";
    ui.titleRite.textContent = `Next rite: ${nextRite.name} | Pact: ${nextPact.name}${dailyText}`;
    ui.titleBank.textContent = `Ichor: ${fmt(bank.ichor)} | Upgrades: ${upgradeSpent()}`;
    renderPacts();
    renderShop();
    renderTrophies();
    updateHud();
  }

  function renderTrophies() {
    const metrics = { score: Math.max(progress.bestScore, run?.score || 0), depth: Math.max(progress.bestDepth, run?.depth || 0), runs: progress.runs };
    ui.trophyProgress.textContent = `${trophies.length}/${TROPHIES.length}`;
    ui.trophyList.innerHTML = "";
    for (const trophy of TROPHIES) {
      const unlocked = trophies.includes(trophy.id);
      const item = document.createElement("div");
      item.className = `trophy-item${unlocked ? " unlocked" : ""}`;
      item.innerHTML = `<strong>${trophy.name}</strong><small>${trophy.desc}</small>`;
      const match = /^(score|depth|runs)_(\d+)$/.exec(trophy.id);
      window.ArcadeUX.trophy(item, unlocked, match ? { metric: match[1], current: metrics[match[1]], target: Number(match[2]), scope: match[1] === "runs" ? "Total runs" : "Best attempt" } : null);
      ui.trophyList.append(item);
    }
  }

  function checkTrophies() {
  window.ArcadeUX.trackMetrics({ score: Math.max(progress.bestScore, run?.score || 0), depth: Math.max(progress.bestDepth, run?.depth || 0), runs: progress.runs });
    let changed = false;
    for (const trophy of TROPHIES) {
      if (!trophies.includes(trophy.id) && trophy.test(progress, run)) {
        trophies.push(trophy.id);
        changed = true;
        showToast(`Trophy unlocked: ${trophy.name}`);
        sound("trophy");
      }
    }
    if (changed) {
      saveTrophies();
      renderTrophies();
    }
  }

  function safeBounds() {
    return {
      left: 58 + state.wallLeft,
      right: canvas.width - 58 - state.wallRight,
      top: 40,
      bottom: canvas.height - 40
    };
  }

  function spawnHazard() {
    const bounds = safeBounds();
    const depthTier = Math.min(5, Math.floor(run.depth / 420));
    const size = 36 + courseRandom() * (18 + depthTier * 2);
    const x = bounds.left + size + courseRandom() * Math.max(20, bounds.right - bounds.left - size * 2);
    const kind = ["obstacle1", "obstacle2", "obstacle3"][Math.floor(courseRandom() * 3)];
    const armored = run.depth > 450 && courseRandom() < 0.16 + depthTier * 0.035;
    const charger = run.depth > 300 && courseRandom() < 0.12 + depthTier * 0.025;
    const slicer = run.depth > 850 && courseRandom() < 0.10 + depthTier * 0.018;
    const daily = run.dailyMode && currentZone().index >= dailyChallenge().featuredZoneIndex ? 0.035 : 0;
    const leech = run.depth > 650 && courseRandom() < 0.08 + depthTier * 0.018 + currentZone().leech + daily + (currentPact().id === "butcher" ? 0.05 : 0);
    state.hazards.push({
      x,
      y: -70,
      r: size * 0.48,
      w: size,
      h: size,
      kind,
      rot: courseRandom() * Math.PI,
      hp: armored || leech ? 2 : 1,
      armored,
      charger,
      slicer,
      leech,
      phase: courseRandom() * Math.PI * 2,
      scored: false,
      near: false,
      drift: (courseRandom() - 0.5) * (leech ? 0.35 : charger ? 1.7 : 0.75),
      baseX: x
    });
  }

  function spawnHazardPattern() {
    const bounds = safeBounds();
    const pattern = courseRandom();
    const depthTier = Math.min(5, Math.floor(run.depth / 500));
    if ((currentZone().mechanic === "clot" || currentZone().mechanic === "heart") && pattern > 0.82) {
      const count = currentZone().mechanic === "heart" ? 4 : 3;
      for (let i = 0; i < count; i++) {
        const size = 32 + courseRandom() * 10;
        state.hazards.push({
          x: bounds.left + 42 + courseRandom() * Math.max(20, bounds.right - bounds.left - 84),
          y: -70 - i * 52,
          r: size * 0.48,
          w: size,
          h: size,
          kind: "obstacle2",
          rot: courseRandom() * Math.PI,
          hp: 2,
          armored: false,
          charger: false,
          slicer: false,
          leech: true,
          phase: courseRandom() * Math.PI * 2,
          near: false,
          drift: (courseRandom() - 0.5) * 0.25,
          baseX: bounds.left + 42 + courseRandom() * Math.max(20, bounds.right - bounds.left - 84)
        });
      }
      return;
    }

    if (pattern < 0.46) {
      spawnHazard();
      return;
    }

    const count = pattern < 0.75 ? 2 : pattern < 0.94 || run.depth < 1000 ? 3 : currentZone().index >= 7 ? 5 : 4;
    const gapIndex = Math.floor(courseRandom() * (count + 1));
    const laneWidth = (bounds.right - bounds.left) / (count + 1);
    for (let i = 0; i <= count; i++) {
      if (i === gapIndex) continue;
      const size = 34 + courseRandom() * 12 + depthTier * 2;
      const x = bounds.left + laneWidth * (i + 0.5) + (courseRandom() - 0.5) * 26;
      const kind = ["obstacle1", "obstacle2", "obstacle3"][Math.floor(courseRandom() * 3)];
      state.hazards.push({
        x,
        y: -70 - courseRandom() * 46,
        r: size * 0.48,
        w: size,
        h: size,
        kind,
        rot: courseRandom() * Math.PI,
        hp: run.depth > 650 && courseRandom() < 0.24 ? 2 : 1,
        armored: run.depth > 650 && courseRandom() < 0.24,
        charger: false,
        slicer: run.depth > 900 && courseRandom() < 0.12,
        leech: false,
        phase: courseRandom() * Math.PI * 2,
        near: false,
        drift: (courseRandom() - 0.5) * 0.5,
        baseX: x
      });
    }
  }

  function spawnPickup() {
    const bounds = safeBounds();
    const roll = courseRandom();
    const coolantLine = Math.max(0.64, 0.82 - (currentZone().pickup - 1) * 0.24);
    const surgeLine = Math.max(0.48, 0.64 - (currentZone().pickup - 1) * 0.18);
    const kind = roll > coolantLine && run.depth > 450 ? "coolant" : roll > surgeLine && run.depth > 700 ? "surge" : "shield";
    state.pickups.push({
      x: bounds.left + 44 + courseRandom() * Math.max(20, bounds.right - bounds.left - 88),
      y: -60,
      r: 24,
      kind,
      pulse: courseRandom() * Math.PI * 2
    });
  }

  function spawnBoss() {
    const stalker = run.depth > 700 && courseRandom() > (currentZone().index >= 5 ? 0.35 : 0.55);
    const maxHp = stalker ? 5 : 3;
    const boss = {
      x: 300,
      y: -120,
      w: stalker ? 118 : 92,
      h: stalker ? 126 : 96,
      hp: maxHp,
      maxHp,
      kind: stalker ? "stalker" : "miniBoss",
      vx: stalker ? 2.4 : 1.55,
      timer: 0,
      attackWarn: 96,
      attackKind: "aimed",
      attackX: 300,
      attackY: 130,
      counted: false
    };
    state.bosses.push(boss);
    if (stalker) run.stalkers += 1;
    else run.miniBosses += 1;
    sound("boss");
    showToast(stalker ? "The stalker has entered the tunnel." : "Mini boss ahead.");
  }

  function addScore(amount) {
    const daily = run.dailyMode ? dailyChallenge().scoreBoost : 1;
    run.score += Math.floor(amount * run.combo * currentPact().score * currentZone().score * daily);
    run.comboTimer = 150;
    run.bestCombo = Math.max(run.bestCombo, run.combo);
    if (amount >= 10) sound("score");
  }

  function dash() {
    if (player.dashCooldown > 0 || mode !== "playing") return;
    const relay = upgradeLevel("dashRelay");
    player.dash = 15 + relay * 2;
    const recovery = Math.max(42, 78 - relay * 10);
    player.dashCooldown = run.dashBlessing ? Math.round(recovery * 0.75) : recovery;
    player.invuln = Math.max(player.invuln, 12 + relay * 4);
    run.dashes += 1;
    addScore(2);
    sound("dash");
  }

  function shoot() {
    if (mode !== "playing" || player.fireCooldown > 0 || state.overheated > 0) return;
    state.heat += 12 * currentZone().heatGain * Math.max(0.72, 1 - upgradeLevel("coolVeins") * 0.075);
    run.shotsFired += 1;
    if (state.heat >= 100) {
      state.heat = 100;
      state.overheated = 130;
      run.overheats += 1;
      run.combo = Math.max(1, run.combo - 0.85);
      showToast("Weapon overheated.");
      sound("hit");
      return;
    }
    player.fireCooldown = state.heat > 70 ? 20 : 15;
    state.shots.push({
      x: player.x,
      y: player.y - player.h * 0.48,
      vx: (shotRandom() - 0.5) * (state.heat > 65 ? 1.9 : 0.9),
      vy: -10.4,
      r: 6,
      life: 58,
      damage: 1
    });
    sound("shoot");
  }

  function hitPlayer(reason) {
    if (player.invuln > 0 || player.dash > 0) return;
    if (player.shield > 0) {
      player.shield -= 1;
      player.invuln = 95;
      run.saves += 1;
      state.shake = 10;
      sound("hit");
      showToast("Shield broke.");
      updateHud();
      return;
    }
    if (window.ArcadeDeveloperMode?.preventDeath?.("blood-tunnel", reason)) {
      player.invuln = 120;
      player.shield = Math.max(player.shield, currentPact().maxShield);
      state.shake = 8;
      run.saves += 1;
      addFloat(player.x, player.y - 54, "DEV SAVE", "#8de7ff");
      showToast("Developer mode: fatal hit ignored.");
      updateHud();
      return;
    }
    gameOver(reason);
  }

  function updatePlayer() {
    const left = keys.ArrowLeft || keys.KeyA || touchMove < 0;
    const right = keys.ArrowRight || keys.KeyD || touchMove > 0;
    const up = keys.ArrowUp || keys.KeyW;
    const down = keys.ArrowDown || keys.KeyS;
    const accel = player.dash > 0 ? 1.45 : 0.72;
    if (left) player.vx -= accel;
    if (right) player.vx += accel;
    if (state.event === "tide") player.vx += state.tideDir * 0.22;
    player.vx *= 0.82;
    player.vx = Math.max(-9, Math.min(9, player.vx));
    player.x += player.vx;
    if (up) player.y -= 3.2;
    if (down) player.y += 3.2;

    const bounds = safeBounds();
    player.x = Math.max(bounds.left + player.w / 2, Math.min(bounds.right - player.w / 2, player.x));
    player.y = Math.max(bounds.top + player.h / 2, Math.min(bounds.bottom - player.h / 2, player.y));
    if (player.dash > 0) player.dash -= 1;
    if (player.dashCooldown > 0) player.dashCooldown -= 1;
    if (player.fireCooldown > 0) player.fireCooldown -= 1;
    if (keys.KeyJ || keys.KeyK || touchFire) shoot();
    if (player.invuln > 0) player.invuln -= 1;
  }

  function updateWalls() {
    if (state.wallWarn > 0) state.wallWarn -= 1;
    if (state.wallState === "idle" && courseRandom() < (0.004 + run.depth * 0.000002) * currentZone().wall) {
      state.wallState = "closing";
      state.wallSide = courseRandom() > 0.5 ? 1 : -1;
      state.wallTarget = 95 + courseRandom() * 105 + Math.max(0, currentZone().wall - 1) * 22;
      state.wallWarn = 80 + upgradeLevel("eventSense") * 18;
    }
    if (state.wallState === "closing") {
      const amount = (1.25 + run.speed * 0.08) * Math.min(1.38, currentZone().wall);
      if (state.wallSide < 0) state.wallLeft = Math.min(state.wallTarget, state.wallLeft + amount);
      else state.wallRight = Math.min(state.wallTarget, state.wallRight + amount);
      if (state.wallLeft >= state.wallTarget || state.wallRight >= state.wallTarget) {
        state.wallState = "holding";
        state.wallTimer = 95;
      }
    } else if (state.wallState === "holding") {
      state.wallTimer -= 1;
      if (state.wallTimer <= 0) state.wallState = "opening";
    } else if (state.wallState === "opening") {
      if (state.wallSide < 0) state.wallLeft = Math.max(0, state.wallLeft - 2.8);
      else state.wallRight = Math.max(0, state.wallRight - 2.8);
      if (state.wallLeft <= 0 && state.wallRight <= 0) {
        state.wallState = "idle";
        run.wallEscapes += 1;
        addScore(18 + currentZone().index * 3);
      }
    }
  }

  function updateHazards() {
    state.spawnTimer -= 1;
    if (state.spawnTimer <= 0) {
      spawnHazardPattern();
      const eventPressure = state.event === "tide" ? 8 : state.event === "surge" ? 14 : state.event === "clot" ? 10 : 0;
      state.spawnTimer = Math.max(14, 88 - run.speed * 6 - eventPressure - currentPact().spawn - currentZone().spawn + courseRandom() * 34);
    }

    const px = player.x;
    const py = player.y;
    for (let i = state.hazards.length - 1; i >= 0; i--) {
      const hazard = state.hazards[i];
      hazard.y += run.speed + 1.2 + (hazard.charger ? 1.3 : 0) + (state.event === "surge" ? 0.8 : 0);
      hazard.phase += 0.04;
      hazard.x += hazard.drift + (hazard.charger ? Math.sin(hazard.phase) * 1.1 : 0);
      if (currentZone().mechanic === "serrated" || currentZone().mechanic === "heart") hazard.x += Math.sin(hazard.phase * 1.8) * (hazard.slicer ? 1.6 : 0.72);
      if (hazard.leech) hazard.x += Math.sign(player.x - hazard.x) * Math.min(1.45, 0.42 + run.depth / 1800);
      if (hazard.slicer) hazard.x = hazard.baseX + Math.sin(hazard.phase * 1.35) * (34 + Math.min(38, run.depth / 50));
      const bounds = safeBounds();
      hazard.x = Math.max(bounds.left + hazard.r, Math.min(bounds.right - hazard.r, hazard.x));
      hazard.rot += 0.035;
      const dist = Math.hypot(hazard.x - px, hazard.y - py);
      if (!hazard.near && dist < hazard.r + 48 && dist > hazard.r + 26) {
        hazard.near = true;
        run.nearMisses += 1;
        run.combo = Math.min(9, run.combo + 0.25);
        addScore(5 + upgradeLevel("nearSense") * 2);
      }
      if (dist < hazard.r + 21) {
        if (hazard.leech && player.shield > 0 && player.invuln <= 0) {
          player.shield = Math.max(0, player.shield - 1);
          player.invuln = 70;
          run.saves += 1;
          state.heat = Math.min(100, state.heat + 18);
          state.hazards.splice(i, 1);
          burstAt(hazard.x, hazard.y, "#ff8a8a", 12);
          showToast("Leech tore away a shield.");
          updateHud();
          continue;
        }
        hitPlayer("Hit by tunnel debris.");
        if (mode === "gameover") return;
      }
      if (hazard.y > canvas.height + 80) {
        state.hazards.splice(i, 1);
        run.obstacles += 1;
        addScore(10);
      }
    }
  }

  function updatePickups() {
    state.pickupTimer -= 1;
    if (state.pickupTimer <= 0) {
      spawnPickup();
      state.pickupTimer = (420 + courseRandom() * 260) / Math.max(0.72, currentZone().pickup);
    }
    for (let i = state.pickups.length - 1; i >= 0; i--) {
      const pickup = state.pickups[i];
      pickup.y += run.speed;
      pickup.pulse += 0.08;
      if (Math.hypot(pickup.x - player.x, pickup.y - player.y) < 42) {
        state.pickups.splice(i, 1);
        if (pickup.kind === "coolant") {
          state.heat = Math.max(0, state.heat - 48);
          state.overheated = 0;
          addScore(35);
          showToast("Coolant sac drained.");
        } else if (pickup.kind === "surge") {
          run.combo = Math.min(9, run.combo + 1);
          player.invuln = Math.max(player.invuln, 80);
          addScore(55);
          showToast("Pulse surge: combo and brief immunity.");
        } else {
          player.shield = Math.min(currentPact().maxShield, player.shield + 1);
          run.shields += 1;
          addScore(25);
        }
        sound("pickup");
        updateHud();
      } else if (pickup.y > canvas.height + 60) {
        state.pickups.splice(i, 1);
      }
    }
  }

  function startTunnelEvent() {
    const roll = courseRandom();
    state.event = run.depth > 1150 && roll > 0.64 ? "clot" : run.depth > 900 && roll > 0.34 ? "surge" : "tide";
    state.eventTimer = state.event === "clot" ? 260 + Math.floor(courseRandom() * 90) : state.event === "surge" ? 300 + Math.floor(courseRandom() * 100) : 360 + Math.floor(courseRandom() * 150);
    state.eventWarn = 95 + upgradeLevel("eventSense") * 24;
    state.eventSpawn = 36;
    state.tideDir = courseRandom() > 0.5 ? 1 : -1;
    showToast(state.event === "clot" ? "Clot storm: blood bolts forming." : state.event === "surge" ? "Pulse surge accelerating the tunnel." : state.tideDir > 0 ? "Blood tide pulling right." : "Blood tide pulling left.");
  }

  function updateTunnelEvent() {
    if (state.event) {
      state.eventTimer -= 1;
      if (state.eventWarn > 0) state.eventWarn -= 1;
      if (state.event === "clot") {
        state.eventSpawn -= 1;
        if (state.eventSpawn <= 0) {
          const bounds = safeBounds();
          const side = courseRandom() > 0.5 ? 1 : -1;
          const x = side > 0 ? bounds.right - 18 : bounds.left + 18;
          const y = 110 + courseRandom() * 360;
          const angle = Math.atan2(player.y - y, player.x - x);
          spawnEnemyShot(x, y, Math.cos(angle) * 4.8, Math.sin(angle) * 4.8);
          state.eventSpawn = 34 + courseRandom() * 22;
        }
      }
      if (state.eventTimer <= 0) {
        if (state.event === "tide") {
          run.tidesSurvived += 1;
          addScore(28 + upgradeLevel("eventSense") * 8);
        } else if (state.event === "surge") {
          run.surgesSurvived += 1;
          addScore(44 + upgradeLevel("eventSense") * 10);
        } else if (state.event === "clot") {
          run.clotStormsSurvived += 1;
          addScore(58 + upgradeLevel("eventSense") * 12);
        }
        state.event = null;
        state.tideDir = 0;
      }
      return;
    }

    if (run.depth > 520 && courseRandom() < 0.0017 + run.depth * 0.00000035 + currentZone().event + (currentPact().id === "fever" ? 0.0009 : 0)) {
      startTunnelEvent();
    }
  }

  function updateZoneMechanics() {
    const zone = currentZone();
    if (state.zonePulseWarn > 0) state.zonePulseWarn -= 1;
    if (zone.mechanic === "valve" || zone.mechanic === "heart") {
      if (state.zonePulseTimer <= 0) {
        state.zonePulseTimer = zone.mechanic === "heart" ? 210 : 260;
        state.zonePulseSide = courseRandom() > 0.5 ? 1 : -1;
        state.zonePulseWarn = 72 + upgradeLevel("eventSense") * 16;
        addFloat(canvas.width / 2, 104, state.zonePulseSide > 0 ? "RIGHT VALVE" : "LEFT VALVE", "#ffd0d0");
      } else {
        state.zonePulseTimer -= 1;
      }
      if (state.zonePulseWarn === 1) {
        state.wallState = "closing";
        state.wallSide = state.zonePulseSide;
        state.wallTarget = Math.max(state.wallTarget, zone.mechanic === "heart" ? 190 : 165);
        state.wallWarn = 52 + upgradeLevel("eventSense") * 12;
      }
    } else if (state.zonePulseTimer > 0) {
      state.zonePulseTimer -= 1;
    }

    if ((zone.mechanic === "fever" || zone.mechanic === "heart") && run.time % (zone.mechanic === "heart" ? 95 : 130) === 0) {
      state.heat = Math.min(100, state.heat + (zone.mechanic === "heart" ? 8 : 6));
      addFloat(player.x, player.y - 54, "FEVER", "#ffb45d");
    }

    if (zone.mechanic === "black" && run.time % 160 === 0) {
      const bounds = safeBounds();
      spawnEnemyShot(bounds.left + courseRandom() * (bounds.right - bounds.left), 80, 0, 5.4);
    }
  }

  function burstAt(x, y, color = "#ff7070", count = 8) {
    for (let p = 0; p < count; p++) {
      state.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5,
        life: 20,
        color
      });
    }
  }

  function updateHeatWarnings() {
    const level = state.overheated > 0 ? 4 : state.heat >= 92 ? 3 : state.heat >= 78 ? 2 : state.heat >= 62 ? 1 : 0;
    if (level > state.heatWarnLevel) {
      const messages = ["", "Heat rising.", "Heat critical.", "OVERHEAT IMMINENT.", "Weapon overheated."];
      showToast(messages[level]);
      state.heatPulse = 28 + level * 10;
      sound(level >= 3 ? "heatCritical" : "heatWarn");
    }
    state.heatWarnLevel = level;
    if (state.heatPulse > 0) state.heatPulse -= 1;
    if (state.heatAlarmCooldown > 0) state.heatAlarmCooldown -= 1;
    if (level >= 2 && state.heatAlarmCooldown <= 0) {
      sound(level >= 3 ? "heatCritical" : "heatWarn");
      state.heatAlarmCooldown = level >= 3 ? 34 : 70;
    }
  }

  function updateShots() {
    for (let i = state.shots.length - 1; i >= 0; i--) {
      const shot = state.shots[i];
      shot.x += shot.vx;
      shot.y += shot.vy;
      shot.life -= 1;

      let consumed = false;
      for (let h = state.hazards.length - 1; h >= 0; h--) {
        const hazard = state.hazards[h];
        if (Math.hypot(hazard.x - shot.x, hazard.y - shot.y) < hazard.r + shot.r) {
          state.shots.splice(i, 1);
          hazard.hp -= shot.damage;
          if (hazard.hp <= 0) {
            state.hazards.splice(h, 1);
            run.obstacles += 1;
            run.enemiesShot += 1;
            run.combo = Math.min(9, run.combo + 0.15);
            addScore(hazard.armored ? 20 : 12);
            addFloat(hazard.x, hazard.y, hazard.leech ? "LEECH" : hazard.armored ? "CRACK" : "+", hazard.leech ? "#ff9a9a" : "#ffd0d0");
            burstAt(hazard.x, hazard.y, hazard.armored ? "#ffd0d0" : "#ff5a5a", hazard.armored ? 10 : 7);
          } else {
            hazard.drift += (Math.random() - 0.5) * 1.4;
            addScore(4);
            burstAt(shot.x, shot.y, "#ffd0d0", 4);
          }
          consumed = true;
          break;
        }
      }
      if (consumed) continue;

      for (let b = state.bosses.length - 1; b >= 0; b--) {
        const boss = state.bosses[b];
        if (
          Math.abs(boss.x - shot.x) < boss.w * 0.45 &&
          Math.abs(boss.y - shot.y) < boss.h * 0.45
        ) {
          boss.hp -= 0.32;
          state.shots.splice(i, 1);
          run.bossHits += 0.32;
          addScore(18);
          burstAt(shot.x, shot.y, "#ffd0d0", 5);
          consumed = true;
          break;
        }
      }
      if (consumed) continue;

      if (shot.y < -30 || shot.life <= 0) {
        state.shots.splice(i, 1);
      }
    }
  }

  function spawnEnemyShot(x, y, vx = 0, vy = 5.8) {
    state.enemyShots.push({
      x,
      y,
      vx,
      vy,
      r: 9,
      life: 145,
      pulse: Math.random() * Math.PI * 2
    });
  }

  function updateEnemyShots() {
    for (let i = state.enemyShots.length - 1; i >= 0; i--) {
      const shot = state.enemyShots[i];
      shot.x += shot.vx;
      shot.y += shot.vy + run.speed * 0.25;
      shot.pulse += 0.11;
      shot.life -= 1;
      if (Math.hypot(shot.x - player.x, shot.y - player.y) < shot.r + 23) {
        state.enemyShots.splice(i, 1);
        hitPlayer("Hit by a blood bolt.");
        if (mode === "gameover") return;
      } else if (shot.y > canvas.height + 40 || shot.x < -40 || shot.x > canvas.width + 40 || shot.life <= 0) {
        state.enemyShots.splice(i, 1);
      }
    }
  }

  function updateBosses() {
    state.bossTimer -= 1;
    if (state.bossTimer <= 0) {
      spawnBoss();
      state.bossTimer = (720 + courseRandom() * 380) * currentPact().boss * currentZone().boss;
    }
    for (let i = state.bosses.length - 1; i >= 0; i--) {
      const boss = state.bosses[i];
      boss.timer += 1;
      boss.y += boss.y < 130 ? 1.9 : run.speed * 0.52;
      boss.x += Math.sin(boss.timer * 0.035) * boss.vx;
      boss.x = Math.max(95, Math.min(canvas.width - 95, boss.x));
      if (boss.attackWarn > 0) boss.attackWarn -= 1;
      if (boss.timer % 72 === 0) {
        state.hazards.push({
          x: boss.x + (courseRandom() - 0.5) * 90,
          y: boss.y + boss.h / 2,
          r: 23,
          w: 48,
          h: 48,
          kind: "obstacle3",
          rot: 0,
          hp: 1,
          armored: false,
          charger: false,
          slicer: false,
          leech: false,
          phase: courseRandom() * Math.PI * 2,
          drift: (courseRandom() - 0.5) * 1.6,
          near: false
        });
      }
      const attackRate = boss.kind === "stalker" ? 68 : 92;
      if (boss.y >= 90 && boss.attackWarn <= 0 && boss.timer % attackRate === 0) {
        boss.attackWarn = boss.kind === "stalker" || currentZone().mechanic === "nest" ? 42 : 54;
        boss.attackKind = currentZone().mechanic === "heart" && courseRandom() > 0.45 ? "spread" : "aimed";
        boss.attackX = player.x;
        boss.attackY = player.y;
        sound("heatWarn");
      }
      if (boss.attackWarn === 1) {
        const angle = Math.atan2((boss.attackY || player.y) - boss.y, (boss.attackX || player.x) - boss.x);
        const speed = boss.kind === "stalker" ? 5.3 : 4.4;
        if (boss.attackKind === "spread") {
          for (const offset of [-0.24, 0, 0.24]) spawnEnemyShot(boss.x, boss.y + boss.h * 0.25, Math.cos(angle + offset) * speed, Math.sin(angle + offset) * speed);
        } else {
          spawnEnemyShot(boss.x, boss.y + boss.h * 0.25, Math.cos(angle) * speed, Math.sin(angle) * speed);
        }
      }
      const collides = Math.abs(boss.x - player.x) < (boss.w + player.w) * 0.34 && Math.abs(boss.y - player.y) < (boss.h + player.h) * 0.34;
      if (collides && player.dash > 0) {
        boss.hp -= 1;
        run.bossHits += 1;
        state.shake = 7;
        addScore(42);
        sound("hit");
        player.dash = 0;
        player.invuln = 16;
        for (let p = 0; p < 10; p++) state.particles.push({ x: boss.x, y: boss.y, vx: (Math.random() - 0.5) * 5, vy: (Math.random() - 0.5) * 5, life: 24 });
      } else if (collides) {
        hitPlayer(boss.kind === "stalker" ? "Caught by the stalker." : "Crushed by a mini boss.");
        if (mode === "gameover") return;
      }
      if (boss.hp <= 0) {
        state.bosses.splice(i, 1);
        run.bossKills += 1;
        if (boss.kind === "stalker" && run.zoneIndex >= 5) run.nestStalkerKills += 1;
        addScore(boss.kind === "stalker" ? 140 : 90);
        addFloat(boss.x, boss.y - 42, boss.kind === "stalker" ? "STALKER BROKEN" : "BOSS BROKEN", "#ffd166");
        showToast(boss.kind === "stalker" ? "Stalker staggered." : "Mini boss shattered.");
      } else if (boss.y > canvas.height + 120) {
        state.bosses.splice(i, 1);
        addScore(35);
      }
    }
  }

  function updateParticles() {
    for (let i = state.particles.length - 1; i >= 0; i--) {
      const p = state.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.08;
      p.life -= 1;
      if (p.life <= 0) state.particles.splice(i, 1);
    }
    for (let i = state.floatTexts.length - 1; i >= 0; i--) {
      const item = state.floatTexts[i];
      item.y -= 0.42;
      item.life -= 1;
      if (item.life <= 0) state.floatTexts.splice(i, 1);
    }
    if (state.shake > 0) state.shake -= 1;
  }

  function tick() {
    if (mode !== "playing") return;
    run.time += 1;
    const eventSpeedBonus = state.event === "surge" ? 1.1 : 0;
    run.depth += (run.speed + eventSpeedBonus) * 0.36;
    run.speed = Math.min(9.2, 3 + run.depth / 520);
    run.bestSpeed = Math.max(run.bestSpeed, run.speed);
    state.bg = (state.bg + run.speed) % canvas.height;
    updateZone();
    if (run.zoneBanner > 0) run.zoneBanner -= 1;
    if (state.overheated > 0) {
      state.overheated -= 1;
      state.heat = Math.max(0, state.heat - 0.85);
    } else {
      const drain = (touchFire || keys.KeyJ || keys.KeyK ? 0.18 : 0.72) * currentPact().heatDrain * currentZone().heatDrain;
      state.heat = Math.max(0, state.heat - drain);
    }
    updateHeatWarnings();
    if (run.comboTimer > 0) run.comboTimer -= 1;
    else run.combo = Math.max(1, run.combo - 0.02);
    updatePlayer();
    updateTunnelEvent();
    updateZoneMechanics();
    updateWalls();
    updateHazards();
    if (mode !== "playing") return;
    updateShots();
    updateEnemyShots();
    updatePickups();
    updateBosses();
    updateParticles();
    checkRite();
    if (run.time % 6 === 0) updateHud();
    if (run.time % 90 === 0) checkTrophies();
  }

  function drawImage(key, x, y, w, h, rotation = 0, alpha = 1) {
    const image = images[key];
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.rotate(rotation);
    if (image?.complete && image.naturalWidth) ctx.drawImage(image, -w / 2, -h / 2, w, h);
    else {
      ctx.fillStyle = "#8e1717";
      ctx.fillRect(-w / 2, -h / 2, w, h);
    }
    ctx.restore();
  }

  function drawBackground() {
    const zone = zoneForDepth(run.depth);
    const image = images[zone.bg] || images.background;
    const previousZone = TUNNEL_ZONES[Math.max(0, zone.index - 1)];
    const previousImage = images[previousZone.bg] || images.background;
    if (image.complete && image.naturalWidth) {
      const h = canvas.height;
      const transition = zone.index > 0 ? Math.max(0, 1 - (run.depth - zone.depth) / 150) : 0;
      if (transition > 0 && previousImage.complete && previousImage.naturalWidth) {
        ctx.globalAlpha = transition;
        ctx.drawImage(previousImage, 0, state.bg - h, canvas.width, h);
        ctx.drawImage(previousImage, 0, state.bg, canvas.width, h);
        ctx.globalAlpha = 1 - transition;
      }
      ctx.drawImage(image, 0, state.bg - h, canvas.width, h);
      ctx.drawImage(image, 0, state.bg, canvas.width, h);
      ctx.globalAlpha = 1;
    } else {
      const g = ctx.createLinearGradient(0, 0, canvas.width, 0);
      g.addColorStop(0, "#230202");
      g.addColorStop(0.5, "#7d0909");
      g.addColorStop(1, "#210202");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.fillStyle = zone.tint;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (state.event === "tide") {
      const alpha = state.eventWarn > 0 ? 0.24 + Math.sin(run.time * 0.25) * 0.08 : 0.13;
      ctx.fillStyle = `rgba(255,40,40,${alpha})`;
      for (let y = -40; y < canvas.height + 40; y += 64) {
        const offset = state.tideDir * ((state.bg * 2 + y) % 95);
        ctx.beginPath();
        ctx.ellipse(canvas.width / 2 + offset, y, 210, 8, state.tideDir * 0.08, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (state.event === "surge") {
      const alpha = state.eventWarn > 0 ? 0.20 + Math.sin(run.time * 0.36) * 0.08 : 0.12;
      ctx.fillStyle = `rgba(255,145,58,${alpha})`;
      for (let y = -80; y < canvas.height + 80; y += 90) {
        ctx.beginPath();
        ctx.ellipse(canvas.width / 2, y + ((state.bg * 3) % 90), 250, 14, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (state.event === "clot") {
      const alpha = state.eventWarn > 0 ? 0.22 + Math.sin(run.time * 0.34) * 0.09 : 0.11;
      ctx.fillStyle = `rgba(118,12,18,${alpha})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "rgba(255,210,210,0.16)";
      ctx.lineWidth = 2;
      for (let y = -60; y < canvas.height + 80; y += 76) {
        ctx.beginPath();
        ctx.moveTo(72, y + ((state.bg * 1.7) % 76));
        ctx.bezierCurveTo(190, y + 28, 390, y - 32, 528, y + 24);
        ctx.stroke();
      }
    }
  }

  function drawWalls() {
    const leftWidth = 64 + state.wallLeft;
    const rightWidth = 64 + state.wallRight;
    drawImage("leftWall", leftWidth / 2 - 10, canvas.height / 2, leftWidth + 42, canvas.height + 40);
    drawImage("rightWall", canvas.width - rightWidth / 2 + 10, canvas.height / 2, rightWidth + 42, canvas.height + 40);
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.fillRect(0, 0, Math.max(0, state.wallLeft - 8), canvas.height);
    ctx.fillRect(canvas.width - Math.max(0, state.wallRight - 8), 0, Math.max(0, state.wallRight - 8), canvas.height);
  }

  function draw() {
    ctx.save();
    if (state.shake > 0 && !REDUCED_MOTION) {
      ctx.translate((Math.random() - 0.5) * state.shake, (Math.random() - 0.5) * state.shake);
    }
    ctx.clearRect(-20, -20, canvas.width + 40, canvas.height + 40);
    drawBackground();
    drawWalls();

    for (const pickup of state.pickups) {
      const size = 48 + Math.sin(pickup.pulse) * 4;
      window.ArcadeUX.drawMarker(ctx, pickup.x, pickup.y, size * 0.55, "#9ef2ad");
      const assetKey = pickup.kind === "coolant" ? "coolant" : pickup.kind === "surge" ? "surge" : "shield";
      if (images[assetKey]?.complete && images[assetKey].naturalWidth) {
        drawImage(assetKey, pickup.x, pickup.y, size, size);
      } else {
        ctx.save();
        ctx.translate(pickup.x, pickup.y);
        ctx.rotate(Math.sin(pickup.pulse) * 0.2);
        const color = pickup.kind === "coolant" ? "#79e9ff" : "#ffb44d";
        ctx.fillStyle = pickup.kind === "coolant" ? "rgba(121,233,255,0.22)" : "rgba(255,180,77,0.24)";
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.58, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.32, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = color;
        ctx.fillRect(-size * 0.18, -3, size * 0.36, 6);
        if (pickup.kind === "surge") ctx.fillRect(-3, -size * 0.18, 6, size * 0.36);
        ctx.restore();
      }
    }

    for (const hazard of state.hazards) {
      drawImage(hazard.kind, hazard.x, hazard.y, hazard.w, hazard.h, hazard.rot);
      if (hazard.armored || hazard.charger || hazard.slicer || hazard.leech) {
        ctx.strokeStyle = hazard.leech ? "rgba(255,130,180,0.68)" : hazard.armored ? "rgba(255,225,225,0.55)" : hazard.slicer ? "rgba(255,180,70,0.55)" : "rgba(255,80,80,0.45)";
        ctx.lineWidth = hazard.armored ? 3 : 2;
        ctx.beginPath();
        ctx.arc(hazard.x, hazard.y, hazard.r + 4 + Math.sin(hazard.phase) * 2, 0, Math.PI * 2);
        ctx.stroke();
        if (hazard.leech) {
          ctx.fillStyle = "rgba(255,185,210,0.72)";
          ctx.beginPath();
          ctx.arc(hazard.x + Math.sin(hazard.phase * 2) * 5, hazard.y - 2, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    for (const boss of state.bosses) {
      if (boss.attackWarn > 0 && boss.y > -20) {
        const alpha = Math.min(0.78, 0.18 + (1 - boss.attackWarn / 54) * 0.62);
        const angle = Math.atan2((boss.attackY || player.y) - boss.y, (boss.attackX || player.x) - boss.x);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = boss.attackKind === "spread" ? "rgba(255,190,95,0.82)" : "rgba(255,90,90,0.82)";
        ctx.lineWidth = boss.attackKind === "spread" ? 4 : 3;
        ctx.setLineDash([12, 8]);
        for (const offset of boss.attackKind === "spread" ? [-0.24, 0, 0.24] : [0]) {
          ctx.beginPath();
          ctx.moveTo(boss.x, boss.y + boss.h * 0.25);
          ctx.lineTo(boss.x + Math.cos(angle + offset) * 760, boss.y + boss.h * 0.25 + Math.sin(angle + offset) * 760);
          ctx.stroke();
        }
        ctx.restore();
      }
      drawImage(boss.kind, boss.x, boss.y, boss.w, boss.h, Math.sin(boss.timer * 0.04) * 0.08);
      ctx.fillStyle = "rgba(0,0,0,0.62)";
      ctx.fillRect(boss.x - boss.w / 2, boss.y - boss.h / 2 - 17, boss.w, 9);
      ctx.fillStyle = "#ff4b4b";
      ctx.fillRect(boss.x - boss.w / 2, boss.y - boss.h / 2 - 17, boss.w * Math.max(0, boss.hp / boss.maxHp), 9);
      ctx.strokeStyle = "rgba(255,255,255,0.32)";
      ctx.strokeRect(boss.x - boss.w / 2, boss.y - boss.h / 2 - 17, boss.w, 9);
      ctx.fillStyle = "rgba(255,235,235,0.88)";
      ctx.font = "800 11px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(boss.kind === "stalker" ? "STALKER" : "MINI BOSS", boss.x, boss.y - boss.h / 2 - 23);
    }

    for (const shot of state.shots) {
      window.ArcadeUX.drawMarker(ctx, shot.x, shot.y, shot.r + 1, "#9ef6ff");
      const g = ctx.createRadialGradient(shot.x, shot.y, 1, shot.x, shot.y, 16);
      g.addColorStop(0, "rgba(255,255,255,0.95)");
      g.addColorStop(0.35, "rgba(255,86,86,0.8)");
      g.addColorStop(1, "rgba(255,86,86,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(shot.x, shot.y, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff3f3";
      ctx.beginPath();
      ctx.arc(shot.x, shot.y, shot.r, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const shot of state.enemyShots) {
      const r = shot.r + Math.sin(shot.pulse) * 2;
      const g = ctx.createRadialGradient(shot.x, shot.y, 1, shot.x, shot.y, r * 2.2);
      g.addColorStop(0, "rgba(255,230,230,0.95)");
      g.addColorStop(0.45, "rgba(255,34,34,0.82)");
      g.addColorStop(1, "rgba(90,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(shot.x, shot.y, r * 2.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffdf63";
      ctx.beginPath();
      ctx.arc(shot.x, shot.y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const p of state.particles) {
      ctx.globalAlpha = Math.max(0, p.life / 24);
      ctx.fillStyle = p.color || "#ff5a5a";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    ctx.save();
    ctx.font = "800 14px system-ui, sans-serif";
    ctx.textAlign = "center";
    for (const item of state.floatTexts) {
      ctx.globalAlpha = Math.min(1, item.life / 24);
      ctx.fillStyle = "rgba(0,0,0,0.65)";
      ctx.fillText(item.text, item.x + 1, item.y + 1);
      ctx.fillStyle = item.color;
      ctx.fillText(item.text, item.x, item.y);
    }
    ctx.restore();

    const alpha = player.invuln > 0 && Math.floor(player.invuln / 7) % 2 === 0 ? 0.55 : 1;
    window.ArcadeUX.drawMarker(ctx, player.x, player.y, player.w * 0.6, "#9ef6ff");
    drawImage("player", player.x, player.y, player.w + (player.dash > 0 ? 14 : 0), player.h, player.vx * 0.025, alpha);
    if (player.shield > 0) {
      ctx.strokeStyle = "rgba(99, 226, 255, 0.72)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(player.x, player.y, 46 + Math.sin(run.time * 0.12) * 3, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (currentZone().visibility > 0) {
      const visibility = Math.max(0, currentZone().visibility - upgradeLevel("eventSense") * 0.035);
      const g = ctx.createRadialGradient(player.x, player.y, 120, player.x, player.y, 410);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(0.56, `rgba(0,0,0,${visibility * 0.72})`);
      g.addColorStop(1, `rgba(0,0,0,${0.46 + visibility})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    if (state.heatWarnLevel > 0 || state.heatPulse > 0 || state.overheated > 0) {
      const heatAlpha = window.ArcadeUX.flashesReduced() ? 0 : Math.min(0.42, (state.heat / 100) * 0.28 + (state.heatPulse / 80) * 0.18 + (state.overheated > 0 ? 0.16 : 0));
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.fillStyle = `rgba(255,42,24,${heatAlpha})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();

      ctx.save();
      ctx.strokeStyle = `rgba(255,${state.heatWarnLevel >= 3 ? 230 : 120},80,${window.ArcadeUX.flashesReduced() ? 0.6 : 0.42 + Math.sin(run.time * 0.4) * 0.18})`;
      ctx.lineWidth = state.heatWarnLevel >= 3 ? 9 : 5;
      ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);
      ctx.restore();
    }

    ctx.fillStyle = "rgba(255,255,255,0.86)";
    ctx.font = "700 15px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`x${run.combo.toFixed(1)}`, 16, 28);
    ctx.fillStyle = "rgba(0,0,0,0.52)";
    ctx.fillRect(14, 102, 104, 8);
    ctx.fillStyle = state.heat >= 92 ? "#fff0a0" : state.heat >= 78 ? "#ff7b47" : "#ff4d4d";
    ctx.fillRect(14, 102, Math.min(104, state.heat * 1.04), 8);
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.strokeRect(14, 102, 104, 8);
    if (state.heatWarnLevel >= 2) {
      ctx.fillStyle = state.heatWarnLevel >= 3 ? "#fff0a0" : "#ffb38b";
      ctx.font = "900 14px system-ui, sans-serif";
      ctx.fillText(state.heatWarnLevel >= 3 ? "HEAT CRITICAL" : "HEAT WARNING", 16, 126);
    }
    ctx.fillStyle = run.dailyMode ? "rgba(255,209,102,0.88)" : "rgba(255,255,255,0.62)";
    ctx.fillText(run.dailyMode ? "Daily Challenge" : currentZone().name, 16, 50);
    if (run.rite) {
      ctx.fillStyle = run.riteComplete ? "rgba(255,209,102,0.92)" : "rgba(255,255,255,0.64)";
      ctx.fillText(run.riteComplete ? "Rite complete" : run.rite.desc, 16, 72);
    }
    if (player.dashCooldown > 0) {
      ctx.fillStyle = "rgba(255,255,255,0.45)";
      ctx.fillText(`Dash ${Math.ceil(player.dashCooldown / 60)}s`, 16, run.rite ? 94 : 50);
    }
    if (state.event === "tide") {
      ctx.textAlign = "left";
      ctx.fillStyle = "rgba(255,230,230,0.78)";
      ctx.fillText(state.tideDir > 0 ? "Tide >>" : "<< Tide", canvas.width - 86, 28);
    } else if (state.event === "surge") {
      ctx.fillStyle = "rgba(255,220,170,0.82)";
      ctx.fillText("Pulse Surge", canvas.width - 112, 28);
    } else if (state.event === "clot") {
      ctx.fillStyle = "rgba(255,210,220,0.86)";
      ctx.fillText("Clot Storm", canvas.width - 112, 28);
    }
    if (state.zonePulseWarn > 0) {
      ctx.fillStyle = "rgba(255,210,210,0.82)";
      ctx.font = "900 13px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(state.zonePulseSide > 0 ? "RIGHT WALL PULSE" : "LEFT WALL PULSE", canvas.width / 2, 92);
    }
    if (run.zoneBanner > 0) {
      const alpha = Math.min(1, run.zoneBanner / 35);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "rgba(0,0,0,0.52)";
      ctx.fillRect(canvas.width / 2 - 174, 104, 348, 48);
      ctx.strokeStyle = "rgba(255,210,210,0.36)";
      ctx.strokeRect(canvas.width / 2 - 174, 104, 348, 48);
      ctx.fillStyle = "#ffd0d0";
      ctx.font = "900 20px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(run.zoneName.toUpperCase(), canvas.width / 2, 134);
      ctx.restore();
    }
    ctx.restore();
  }

  const FIXED_FRAME_MS = 1000 / 60;
  const MAX_FRAME_CATCHUP_MS = 80;
  const MAX_FIXED_STEPS = 4;
  let loopLastTime = 0;
  let loopAccumulator = 0;
  let lastDrawMode;

  function loop(timestamp = 0) {
    const now = timestamp || performance.now();
    if (!loopLastTime) loopLastTime = now;

    const frameMs = Math.min(MAX_FRAME_CATCHUP_MS, Math.max(0, now - loopLastTime));
    loopLastTime = now;
    loopAccumulator += frameMs;

    let steps = 0;
    while (loopAccumulator >= FIXED_FRAME_MS && steps < MAX_FIXED_STEPS) {
      tick();
      loopAccumulator -= FIXED_FRAME_MS;
      steps++;
    }

    if (steps >= MAX_FIXED_STEPS) {
      loopAccumulator = 0;
    }

    if (mode !== "title" && (mode === "playing" || lastDrawMode !== mode)) draw();
    lastDrawMode = mode;
    frameId = requestAnimationFrame(loop);
  }

  function bindHold(button, value) {
    const down = (event) => {
      event.preventDefault();
      touchMove = value;
    };
    const up = () => {
      if (touchMove === value) touchMove = 0;
    };
    button.addEventListener("pointerdown", down);
    button.addEventListener("pointerup", up);
    button.addEventListener("pointercancel", up);
    button.addEventListener("pointerleave", up);
  }

  window.addEventListener("keydown", (event) => {
    if (event.code === "Escape" && mode === "title" && closeTitleInfoCard()) {
      event.preventDefault();
      return;
    }

    const interactiveTarget = event.target instanceof Element
      ? event.target.closest("button, input, select, textarea, summary, a, [role='button'], [contenteditable='true']")
      : null;
    if (interactiveTarget && (event.key === "Enter" || event.key === " ")) return;

    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space"].includes(event.code)) event.preventDefault();
    keys[event.code] = true;
    if (event.code === "Space") dash();
    if (event.code === "KeyJ" || event.code === "KeyK") shoot();
    if ((event.code === "KeyP" || event.code === "Escape") && !event.repeat) (mode === "paused" ? resumeGame() : pauseGame());
    if (event.code === "KeyR" && mode !== "title") startGame();
    if (event.code === "Enter" && mode === "title") startGame();
  });

  window.addEventListener("keyup", (event) => {
    keys[event.code] = false;
  });

  function movePlayerFromPointer(event) {
    if (mode !== "playing" || !event.isPrimary) return;
    event.preventDefault();
    const rect = canvas.getBoundingClientRect();
    player.x = ((event.clientX - rect.left) / rect.width) * canvas.width;
    player.y = ((event.clientY - rect.top) / rect.height) * canvas.height;
  }

  canvas.addEventListener("pointerdown", (event) => {
    if (mode !== "playing" || !event.isPrimary) return;
    canvas.setPointerCapture?.(event.pointerId);
    movePlayerFromPointer(event);
  });

  canvas.addEventListener("pointermove", (event) => {
    movePlayerFromPointer(event);
  });

  canvas.addEventListener("pointerup", (event) => {
    canvas.releasePointerCapture?.(event.pointerId);
  });

  canvas.addEventListener("pointercancel", (event) => {
    canvas.releasePointerCapture?.(event.pointerId);
  });

  ui.start.addEventListener("click", startGame);
  ui.menu.addEventListener("click", showTitle);
  ui.pause.addEventListener("click", pauseGame);
  ui.restart.addEventListener("click", startGame);
  ui.playAgain.addEventListener("click", startGame);
  ui.backTitle.addEventListener("click", showTitle);
  ui.resume.addEventListener("click", resumeGame);
  ui.pauseRestart.addEventListener("click", startGame);
  ui.pauseMainMenu.addEventListener("click", showTitle);
  ui.modeToggle.addEventListener("click", toggleMode);
  ui.sound.addEventListener("click", () => setSound(!soundOn));
  ui.pauseSound.addEventListener("click", () => setSound(!soundOn));
  ui.controlsToggle.addEventListener("click", () => toggleTitleInfoCard(ui.controlsCard, ui.controlsToggle));
  ui.trophiesToggle.addEventListener("click", () => toggleTitleInfoCard(ui.trophiesCard, ui.trophiesToggle, renderTrophies));
  ui.shopToggle.addEventListener("click", () => toggleTitleInfoCard(ui.shopCard, ui.shopToggle, renderShop));
  ui.touchDash.addEventListener("click", dash);
  ui.touchFire.addEventListener("click", shoot);
  bindHold(ui.touchLeft, -1);
  bindHold(ui.touchRight, 1);
  bindFireHold(ui.touchFire);

  function toggleTitleInfoCard(card, trigger, render) {
    const open = card.hidden;
    closeTitleInfoCard(false);
    if (open) {
      card.hidden = false;
      trigger.setAttribute("aria-expanded", "true");
      activeTitleInfoTrigger = trigger;
      render?.();
    }
  }

  function closeTitleInfoCard(returnFocus = true) {
    const wasOpen = [ui.controlsCard, ui.trophiesCard, ui.shopCard].some((card) => !card.hidden);
    [ui.controlsCard, ui.trophiesCard, ui.shopCard].forEach((card) => { card.hidden = true; });
    [ui.controlsToggle, ui.trophiesToggle, ui.shopToggle].forEach((button) => button.setAttribute("aria-expanded", "false"));
    const trigger = activeTitleInfoTrigger;
    activeTitleInfoTrigger = null;
    if (returnFocus && wasOpen && trigger?.isConnected) trigger.focus();
    return wasOpen;
  }

  window.addEventListener("blur", () => {
    clearHeldInput();
    pauseGame();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pauseGame();
  });

  setSound(soundOn);
  refreshTitle();
  resetRun();
  showTitle();
  cancelAnimationFrame(frameId);
  loop();

  function bindFireHold(button) {
    const down = (event) => {
      event.preventDefault();
      touchFire = true;
      shoot();
    };
    const up = () => {
      touchFire = false;
    };
    button.addEventListener("pointerdown", down);
    button.addEventListener("pointerup", up);
    button.addEventListener("pointercancel", up);
    button.addEventListener("pointerleave", up);
  }

window.ArcadeUX.registerGame({
  active: () => ["playing","paused"].includes(mode),
  paused: () => mode === "paused",
  pause: value => value ? pauseGame() : resumeGame(),
  label: currentModeLabel
});
})();
