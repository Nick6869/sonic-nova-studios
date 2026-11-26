(() => {
  "use strict";

  let REDUCED_MOTION = window.ArcadeUX.motionReduced();
window.ArcadeUX.onPreferences(() => { REDUCED_MOTION = window.ArcadeUX.motionReduced(); });
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  function isDeveloperMode() {
    return Boolean(window.ArcadeDeveloperMode?.enabled);
  }

  function focusCanvas() {
    if (document.activeElement === canvas || typeof canvas.focus !== "function") {
      return;
    }
    try {
      canvas.focus({ preventScroll: true });
    } catch (error) {
      canvas.focus();
    }
  }

  const W = canvas.width;
  const H = canvas.height;
  const HUD = 48;
  const CELL = 48;
  const COLS = 15;
  const ROWS = 15;
  const TAU = Math.PI * 2;
  const GRAVE_COLS = [1, 4, 7, 10, 13];
  const SAFE_ROWS = [1, 5, 9, 13, 14];
  const ASSET_PATHS = {
    player: "assets/maincharacter.webp",
    ambulance: "assets/Untitled%20design.webp",
    truck: "assets/Untitled%20design%20(1).webp",
    hearse: "assets/Untitled%20design%20(2).webp",
    crocodile: "assets/Untitled%20design%20(3).webp",
    boat: "assets/Untitled%20design%20(4).webp",
    log: "assets/Untitled%20design%20(5).webp",
    bus: "assets/Untitled%20design%20(6).webp",
    coffin: "assets/Untitled%20design%20(7).webp",
    titlecard: "assets/titlecard.webp",
    level1: "assets/level1.webp",
    level2: "assets/level2.webp",
    level3: "assets/level3.webp",
    level4: "assets/level4.webp",
    level5: "assets/level5.webp",
    level6: "assets/level6.webp",
  };
  const LEVEL_BACKGROUNDS = ["level1", "level2", "level3", "level4", "level5", "level6"];
  const SPRITE_BOUNDS = {
    player: { sx: 387, sy: 57, sw: 482, sh: 1114 },
    ambulance: { sx: 70, sy: 406, sw: 1116, sh: 489 },
    truck: { sx: 30, sy: 369, sw: 1198, sh: 497 },
    hearse: { sx: 23, sy: 388, sw: 1209, sh: 464 },
    crocodile: { sx: 24, sy: 495, sw: 1198, sh: 268 },
    boat: { sx: 65, sy: 428, sw: 1133, sh: 420 },
    log: { sx: 43, sy: 463, sw: 1168, sh: 293 },
    bus: { sx: 34, sy: 395, sw: 1186, sh: 450 },
    coffin: { sx: 152, sy: 430, sw: 940, sh: 365 },
    titlecard: { sx: 0, sy: 0, sw: 1024, sh: 1536 },
    level1: { sx: 0, sy: 0, sw: 1672, sh: 941 },
    level2: { sx: 0, sy: 0, sw: 1672, sh: 941 },
    level3: { sx: 0, sy: 0, sw: 1672, sh: 941 },
    level4: { sx: 0, sy: 0, sw: 1672, sh: 941 },
    level5: { sx: 0, sy: 0, sw: 1672, sh: 941 },
    level6: { sx: 0, sy: 0, sw: 1672, sh: 941 },
  };

  const STORAGE = {
    highScore: "graveyard-crossing-high-score",
    bestLevel: "graveyard-crossing-best-level",
    trophies: "graveyard-crossing-trophies-v1",
    sound: "graveyard-crossing-sound-v1",
    career: "graveyard-crossing-career-v1",
  };
  const statusPanel = {
    modifierLabel: document.getElementById("modifierLabel"),
    modifierText: document.getElementById("modifierText"),
    riteLabel: document.getElementById("riteLabel"),
    riteText: document.getElementById("riteText"),
    recordLabel: document.getElementById("recordLabel"),
    recordText: document.getElementById("recordText"),
  };
  const actionButtons = Array.from(document.querySelectorAll("[data-action]"));
  const startActionButtons = Array.from(document.querySelectorAll('[data-action="start"]'));
  const pauseActionButtons = Array.from(document.querySelectorAll('[data-action="pause"]'));
  const quickMenu = document.getElementById("quickMenu");
  const beginNightBtn = document.getElementById("beginNight");
  const quickSoundToggle = document.getElementById("quickSoundToggle");
  const quickTrophiesBtn = document.getElementById("quickTrophiesBtn");
  const trophiesBtn = document.getElementById("trophiesBtn");
  const soundToggleBtn = document.getElementById("soundToggle");
  const trophyCountEl = document.getElementById("trophyCount");
  const trophyOverlay = document.getElementById("trophyOverlay");
  const trophyProgressEl = document.getElementById("trophyProgress");
  const NATIONAL_GAME_ID = "graveyard-crossing";
  const NATIONAL_GAME_NAME = "Graveyard Crossing";

  window.NationalLeaderboard?.init({
    gameId: NATIONAL_GAME_ID,
    gameName: NATIONAL_GAME_NAME,
    getPersonalScores: () => [
      { label: "Best Score", score: Math.max(game?.highScore || 0, game?.score || 0) },
      { label: "Best Night", score: game?.bestLevel || 1 }
    ]
  });

  function submitNationalScore(finalScore) {
    window.NationalLeaderboard?.submitScore(NATIONAL_GAME_ID, finalScore, {
      gameName: NATIONAL_GAME_NAME,
      night: game.level
    });
  }
  const trophyListEl = document.getElementById("trophyList");
  const closeTrophiesBtn = document.getElementById("closeTrophies");

  const TROPHIES = [
    { id: "first_step", name: "First Crossing", desc: "Start a run.", test: () => game.level >= 1 && game.mode !== "menu" },
    { id: "score_1000", progress: () => ({ metric: "score", current: game.score, target: 1000 }),  name: "Lantern Purse", desc: "Score 1,000 points.", test: () => game.score >= 1000 },
    { id: "score_3000", progress: () => ({ metric: "score", current: game.score, target: 3000 }),  name: "Moonlit Hoard", desc: "Score 3,000 points.", test: () => game.score >= 3000 },
    { id: "night_2", progress: () => ({ metric: "night", current: game.level, target: 2 }),  name: "Second Night", desc: "Reach night 2.", test: () => game.level >= 2 },
    { id: "night_4", progress: () => ({ metric: "night", current: game.level, target: 4 }),  name: "Deep Graves", desc: "Reach night 4.", test: () => game.level >= 4 },
    { id: "night_7", progress: () => ({ metric: "night", current: game.level, target: 7 }),  name: "Dawn Defier", desc: "Reach night 7.", test: () => game.level >= 7 },
    { id: "seal_all", name: "Five Seals", desc: "Seal all graves in a night.", test: () => game.mode === "levelClear" || game.graves.size >= 5 },
    { id: "untouched", name: "Untouched Rite", desc: "Clear a night without damage.", test: () => game.mode === "levelClear" && game.nightDeaths === 0 },
    { id: "charms", name: "Charm Sweep", desc: "Collect every charm in a night.", test: () => game.pickups.length > 0 && game.nightPickups >= game.pickups.length },
    { id: "rite_one", name: "Rite Keeper", desc: "Fulfill a bonus rite.", test: () => game.ritesCompleted >= 1 },
    { id: "rite_three", name: "Rite Chain", desc: "Fulfill 3 bonus rites in one run.", test: () => game.ritesCompleted >= 3 },
    { id: "ward_lit", name: "Lantern Lit", desc: "Collect a ward.", test: () => game.nightWards > 0 },
    { id: "streak_5", name: "Bold Feet", desc: "Reach a rush streak of 5.", test: () => game.rush >= 5 },
    { id: "time_left", name: "Early Dawn", desc: "Clear a night with 30 seconds left.", test: () => game.mode === "levelClear" && game.time >= 30 },
    { id: "best_5", name: "Grave Regular", desc: "Record best night 5.", test: () => game.bestLevel >= 5 },
    { id: "best_10", name: "Grave Master", desc: "Record best night 10.", test: () => game.bestLevel >= 10 },
    { id: "ward_save", name: "Ward Save", desc: "Have a ward absorb danger.", test: () => trophyFlags.wardSaved },
    { id: "relic_found", name: "Relic Found", desc: "Recover a relic pickup.", test: () => trophyFlags.relicFound },
    { id: "rush_10", name: "No Looking Back", desc: "Reach a rush streak of 10.", test: () => game.rush >= 10 },
    { id: "high_score", name: "Crossing Legend", desc: "Set a score above 6,000.", test: () => game.highScore >= 6000 || game.score >= 6000 },
    { id: "score_5000", name: "Candle Hoard", desc: "Score 5,000 points.", test: () => game.score >= 5000 },
    { id: "score_9000", name: "Grave Fortune", desc: "Score 9,000 points.", test: () => game.score >= 9000 },
    { id: "night_10", name: "Tenth Night", desc: "Reach night 10.", test: () => game.level >= 10 },
    { id: "night_12", name: "Moon Trial", desc: "Reach night 12.", test: () => game.level >= 12 },
    { id: "night_15", name: "Lantern Legend", desc: "Reach night 15.", test: () => game.level >= 15 },
    { id: "seal_three", name: "Triple Seal", desc: "Seal 3 graves in a night.", test: () => game.graves.size >= 3 },
    { id: "seal_streak", name: "Seal Chain", desc: "Build a seal streak of 8.", test: () => game.streak >= 8 },
    { id: "rush_15", name: "Gravel Sprint", desc: "Reach a rush streak of 15.", test: () => game.rush >= 15 },
    { id: "rush_20", name: "No Brakes", desc: "Reach a rush streak of 20.", test: () => game.rush >= 20 },
    { id: "time_45", name: "Moonlight Saver", desc: "Clear a night with 45 seconds left.", test: () => game.mode === "levelClear" && game.time >= 45 },
    { id: "time_60", name: "Dawn In Hand", desc: "Clear a night with 60 seconds left.", test: () => game.mode === "levelClear" && game.time >= 60 },
    { id: "rite_five", name: "Rite Adept", desc: "Fulfill 5 bonus rites in one run.", test: () => game.ritesCompleted >= 5 },
    { id: "rite_eight", name: "Rite Archivist", desc: "Fulfill 8 bonus rites in one run.", test: () => game.ritesCompleted >= 8 },
    { id: "lives_four", name: "Still Warm", desc: "Hold 4 lives.", test: () => game.lives >= 4 },
    { id: "lives_five", name: "Lantern Stockpile", desc: "Hold 5 lives.", test: () => game.lives >= 5 },
    { id: "ward_and_relic", name: "Warded Relic", desc: "Use a ward and find a relic in the same run.", test: () => trophyFlags.wardSaved && trophyFlags.relicFound },
    { id: "pickup_one", name: "First Charm", desc: "Collect a charm.", test: () => game.nightPickups >= 1 },
    { id: "pickup_two", name: "Charm Pair", desc: "Collect 2 charms in one night.", test: () => game.nightPickups >= 2 },
    { id: "pickup_three", name: "Charm Sweep Plus", desc: "Collect 3 charms in one night.", test: () => game.nightPickups >= 3 },
    { id: "best_12", name: "Old Path Master", desc: "Record best night 12.", test: () => game.bestLevel >= 12 },
    { id: "best_15", name: "Graveyard Saint", desc: "Record best night 15.", test: () => game.bestLevel >= 15 },
    { id: "best_20", name: "Dawnless", desc: "Record best night 20.", test: () => game.bestLevel >= 20 },
    { id: "best_score_10000", name: "Ten Thousand Lanterns", desc: "Record a best score of 10,000.", test: () => game.highScore >= 10000 || game.score >= 10000 },
    { id: "first_outer", name: "Edge First", desc: "Seal an outer grave first.", test: () => game.firstGrave === GRAVE_COLS[0] || game.firstGrave === GRAVE_COLS[GRAVE_COLS.length - 1] },
    { id: "inner_start", name: "Heart Of The Yard", desc: "Seal an inner grave first.", test: () => game.firstGrave !== null && game.firstGrave !== GRAVE_COLS[0] && game.firstGrave !== GRAVE_COLS[GRAVE_COLS.length - 1] },
    { id: "single_life", name: "Last Heart", desc: "Survive while down to one life.", test: () => game.mode === "playing" && game.lives === 1 },
    { id: "fog_runner", name: "Fog Runner", desc: "Reach a high-fog night.", test: () => game.modifier && game.modifier.fog >= 0.75 && game.mode !== "menu" },
    { id: "starless", name: "Starless Crossing", desc: "Survive into Starless Night.", test: () => game.modifier && game.modifier.name === "Starless Night" && game.mode !== "menu" },
    { id: "perfect_pair", name: "Perfect Pair", desc: "Clear a night untouched after fulfilling at least 2 rites.", test: () => game.mode === "levelClear" && game.nightDeaths === 0 && game.ritesCompleted >= 2 },
    { id: "deep_clean", name: "Deep Clean", desc: "Clear night 8 or later without damage.", test: () => game.mode === "levelClear" && game.level >= 8 && game.nightDeaths === 0 },
  ];
  let earnedTrophies = loadTrophies();
  let trophyFlags = { wardSaved: false, relicFound: false };

  function loadTrophies() {
    try {
      const ids = JSON.parse(localStorage.getItem(STORAGE.trophies) || "[]");
      return new Set(Array.isArray(ids) ? ids : []);
    } catch (error) {
      return new Set();
    }
  }

  function saveTrophies() {
    try {
      localStorage.setItem(STORAGE.trophies, JSON.stringify([...earnedTrophies]));
    } catch (error) {}
  }

  function haptic(pattern = 12) {
    try {
      window.ArcadeUX.vibrate(pattern);
    } catch (error) {
      // Optional mobile feedback.
    }
  }

  let audioContext = null;
  let soundEnabled = loadSoundEnabled();

  function loadSoundEnabled() {
    try {
      return localStorage.getItem(STORAGE.sound) !== "0";
    } catch (error) {
      return true;
    }
  }

  function updateSoundButton() {
    [soundToggleBtn, quickSoundToggle].forEach((button) => {
      if (!button) return;
      button.textContent = `Sound: ${soundEnabled ? "On" : "Off"}`;
      button.setAttribute("aria-pressed", String(soundEnabled));
    });
  }

  function ensureAudio() {
    if (!soundEnabled || !window.ArcadeUX.effectsAllowed()) return null;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioContext) audioContext = new AudioContextClass();
    if (audioContext.state === "suspended") audioContext.resume().catch(() => {});
    return audioContext;
  }

  function playSound(kind) {
    const audio = ensureAudio();
    if (!audio) return;
    const sounds = {
      start: [125, 250, 0.2, "sawtooth", 0.04],
      hop: [190, 290, 0.07, "triangle", 0.018],
      pickup: [640, 1080, 0.12, "sine", 0.035],
      seal: [260, 720, 0.3, "triangle", 0.055],
      clear: [360, 1040, 0.42, "sine", 0.06],
      ward: [560, 120, 0.28, "square", 0.04],
      hit: [100, 38, 0.34, "sawtooth", 0.065],
      trophy: [500, 1000, 0.34, "triangle", 0.055],
      gameover: [120, 32, 0.72, "sawtooth", 0.065]
    };
    const [start, end, duration, type, volume] = sounds[kind] || sounds.hop;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    const now = audio.currentTime;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(start, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, end), now + duration);
    gain.gain.setValueAtTime(window.ArcadeUX.effectsVolume(volume), now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  function toggleSound() {
    soundEnabled = !soundEnabled;
    try {
      localStorage.setItem(STORAGE.sound, soundEnabled ? "1" : "0");
    } catch (error) {
      // Sound preference remains active for this session.
    }
    updateSoundButton();
    if (soundEnabled) playSound("start");
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
  window.ArcadeUX.trackMetrics({ score: game.score, night: game.level });
    let unlockedAny = false;
    TROPHIES.forEach((trophy) => {
      if (!earnedTrophies.has(trophy.id) && trophy.test()) {
        earnedTrophies.add(trophy.id);
        showMessage(`Trophy earned: ${trophy.name}`, 1.8);
        haptic([18, 30, 18]);
        unlockedAny = true;
      }
    });
    if (unlockedAny) {
      saveTrophies();
      renderTrophies();
      playSound("trophy");
    }
  }
  const dreadTiers = [
    {
      minLevel: 1,
      name: "Uneasy",
      description: "The old routes are still readable.",
      extraRoadRows: [],
      extraWaterRows: [],
      pickupBonus: 0,
    },
    {
      minLevel: 3,
      name: "Haunted",
      description: "Crowds gather on the central roads.",
      extraRoadRows: [7],
      extraWaterRows: [],
      pickupBonus: 0,
    },
    {
      minLevel: 5,
      name: "Forsaken",
      description: "Traffic thickens and one swamp teems.",
      extraRoadRows: [7, 10],
      extraWaterRows: [4],
      pickupBonus: 1,
    },
    {
      minLevel: 8,
      name: "Endless",
      description: "Every crossing is hunted.",
      extraRoadRows: [6, 7, 10],
      extraWaterRows: [3, 4],
      pickupBonus: 1,
    },
  ];

  const modifiers = [
    {
      name: "Open Graves",
      description: "Gentle currents and longer moonlight.",
      fog: 0.35,
      scoreMult: 1,
      speedMult: 0.92,
      extraHazards: 0,
      timeShift: 8,
    },
    {
      name: "Blood Moon",
      description: "Faster traffic rewards bold crossings.",
      fog: 0.55,
      scoreMult: 1.12,
      speedMult: 1.08,
      extraHazards: 0,
      timeShift: 0,
    },
    {
      name: "Thick Fog",
      description: "Visibility fades and the clock tightens.",
      fog: 1,
      scoreMult: 1.2,
      speedMult: 0.98,
      extraHazards: 0,
      timeShift: -3,
    },
    {
      name: "Restless Dead",
      description: "Extra threats prowl the busiest lanes.",
      fog: 0.72,
      scoreMult: 1.25,
      speedMult: 1.12,
      extraHazards: 1,
      timeShift: -5,
    },
    {
      name: "Witching Wind",
      description: "All traffic surges through the graveyard.",
      fog: 0.62,
      scoreMult: 1.15,
      speedMult: 1.18,
      extraHazards: 0,
      timeShift: 0,
    },
    {
      name: "Starless Night",
      description: "Dense fog, extra hunters, richest bounty.",
      fog: 0.85,
      scoreMult: 1.3,
      speedMult: 1.22,
      extraHazards: 1,
      timeShift: -7,
    },
  ];

  const keys = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
    w: "up",
    W: "up",
    s: "down",
    S: "down",
    a: "left",
    A: "left",
    d: "right",
    D: "right",
  };

  const game = {
    mode: "menu",
    level: 1,
    score: 0,
    lives: 3,
    highScore: loadNumber(STORAGE.highScore),
    bestLevel: Math.max(1, loadNumber(STORAGE.bestLevel)),
    runSeed: Date.now() >>> 0,
    levelTime: 78,
    time: 78,
    lanes: [],
    pickups: [],
    graves: new Set(),
    modifier: modifiers[0],
    previousModifier: null,
    rng: mulberry32(Date.now() >>> 0),
    message: "Press start",
    messageTimer: 0,
    transitionTimer: 0,
    moveCooldown: 0,
    pendingMove: null,
    shake: 0,
    streak: 0,
    rush: 0,
    rushTimer: 0,
    attemptBestRow: ROWS - 1,
    rite: null,
    ritesCompleted: 0,
    nightDeaths: 0,
    nightPickups: 0,
    nightWards: 0,
    firstGrave: null,
    nightStartScore: 0,
    levelSummary: "",
    hopBursts: [],
    deathEchoes: [],
    scorePopups: [],
    fogParticles: makeFog(),
    runGraves: 0,
    runCommitted: false,
  };
  let careerStats = loadCareerStats();
  applyDeveloperModeUnlocks();

  function loadCareerStats() {
    const empty = { runs: 0, graves: 0, rites: 0, bestStreak: 0 };
    try {
      return { ...empty, ...JSON.parse(localStorage.getItem(STORAGE.career) || "{}") };
    } catch (error) {
      return empty;
    }
  }

  function commitCareerStats() {
    if (game.runCommitted) return;
    game.runCommitted = true;
    careerStats.runs += 1;
    careerStats.graves += game.runGraves;
    careerStats.rites += game.ritesCompleted;
    careerStats.bestStreak = Math.max(careerStats.bestStreak, game.streak);
    try {
      localStorage.setItem(STORAGE.career, JSON.stringify(careerStats));
    } catch (error) {}
  }

  function careerText() {
    return careerStats.runs
      ? `${careerStats.runs} crossings | ${careerStats.graves} graves sealed | ${careerStats.rites} rites`
      : "No crossings logged";
  }

  function applyDeveloperModeUnlocks() {
    if (!isDeveloperMode()) return;

    game.bestLevel = Math.max(game.bestLevel, 15);
    game.highScore = Math.max(game.highScore, 9000);
    careerStats.runs = Math.max(careerStats.runs || 0, 1);
    careerStats.graves = Math.max(careerStats.graves || 0, 5);
    careerStats.rites = Math.max(careerStats.rites || 0, 3);
    saveNumber(STORAGE.bestLevel, game.bestLevel);
    saveNumber(STORAGE.highScore, game.highScore);
    try {
      localStorage.setItem(STORAGE.career, JSON.stringify(careerStats));
    } catch (error) {}
  }

  const player = {
    x: centerOfCol(7),
    row: ROWS - 1,
    ward: false,
    pulse: 0,
    invulnerable: 0,
  };

  let lastTime = performance.now();
  let elapsed = 0;
  let touchStart = null;
  const sprites = loadSprites();

  prepareMenuScene();
  requestAnimationFrame(frame);

  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("visibilitychange", pauseForBackground);
  window.addEventListener("blur", pauseForBackground);
  canvas.addEventListener("click", onCanvasClick);
  canvas.addEventListener("touchstart", onTouchStart, { passive: false });
  canvas.addEventListener("touchend", onTouchEnd, { passive: false });
  canvas.addEventListener("touchcancel", onTouchCancel, { passive: false });

  document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => handleAction(button.dataset.action));
  });
  beginNightBtn.addEventListener("click", () => handleAction("start"));
  let resumeAfterTrophies = false;
  let trophyTrigger;
  function openTrophies(event) {
    if (!trophyOverlay.hidden) return;
    trophyTrigger = event.currentTarget;
    resumeAfterTrophies = game.mode === "playing";
    if (resumeAfterTrophies) handleAction("pause");
    renderTrophies();
    trophyOverlay.hidden = false;
    trophyOverlay.setAttribute("aria-hidden", "false");
    closeTrophiesBtn.focus();
  }
  trophiesBtn.addEventListener("click", openTrophies);
  quickTrophiesBtn?.addEventListener("click", openTrophies);
  closeTrophiesBtn.addEventListener("click", () => {
    trophyOverlay.hidden = true;
    trophyOverlay.setAttribute("aria-hidden", "true");
    if (resumeAfterTrophies && game.mode === "paused") handleAction("start");
    resumeAfterTrophies = false;
    trophyTrigger?.focus({ preventScroll: true });
  });
  soundToggleBtn?.addEventListener("click", toggleSound);
  quickSoundToggle?.addEventListener("click", toggleSound);
  renderTrophies();
  updateSoundButton();

  let lastDraw = 0;
  let lastDrawMode;
  function frame(now) {
    const dt = Math.min(0.035, (now - lastTime) / 1000 || 0);
    lastTime = now;
    elapsed += dt;

    update(dt);
    const animated = game.mode !== "paused" && now - lastDraw >= 66;
    if (game.mode === "playing" || lastDrawMode !== game.mode || animated) {
      draw();
      lastDraw = now;
      lastDrawMode = game.mode;
    }

    requestAnimationFrame(frame);
  }

  function update(dt) {
    if (game.mode === "paused") return;
    updateFog(dt);

    if (game.messageTimer > 0) {
      game.messageTimer -= dt;
    }

    if (game.rushTimer > 0) {
      game.rushTimer -= dt;
      if (game.rushTimer <= 0) {
        game.rush = 0;
      }
    }

    if (game.moveCooldown > 0) {
      game.moveCooldown -= dt;
      if (game.moveCooldown <= 0 && game.pendingMove && game.mode === "playing") {
        const pending = game.pendingMove;
        game.pendingMove = null;
        movePlayer(pending);
      }
    }

    if (game.shake > 0) {
      game.shake = Math.max(0, game.shake - dt * 18);
    }

    if (player.invulnerable > 0) {
      player.invulnerable -= dt;
    }

    updateFeedback(dt);

    if (game.mode === "menu" || game.mode === "gameOver") {
      updateLanes(dt * 0.55);
      return;
    }

    if (game.mode === "levelClear") {
      updateLanes(dt * 0.35);
      game.transitionTimer -= dt;
      if (game.transitionTimer <= 0) {
        game.level += 1;
        startLevel();
      }
      return;
    }

    if (game.mode !== "playing") {
      return;
    }

    game.time -= dt;
    if (game.time <= 0) {
      if (window.ArcadeDeveloperMode?.preventDeath?.("graveyard-crossing", "timer expired")) {
        game.time = Math.max(30, Math.round(game.levelTime * 0.45));
        player.invulnerable = 1.4;
        showMessage("Developer mode: dawn timer restored", 1.5);
        updateStatusPanel();
        return;
      }

      game.time = 0;
      game.lives = 0;
      game.mode = "gameOver";
      commitCareerStats();
      playSound("gameover");
      showMessage("Dawn broke before the ritual was complete", 2);
      updateStatusPanel();
      updateRecords();
      submitNationalScore(game.score);
      return;
    }

    updateLanes(dt);
    carryPlayer(dt);
    collectPickups();
    checkCurrentTile();
  }

  function startRun() {
    trophyFlags = { wardSaved: false, relicFound: false };
    game.level = 1;
    game.score = 0;
    game.lives = 3;
    game.streak = 0;
    game.rush = 0;
    game.rushTimer = 0;
    game.pendingMove = null;
    game.ritesCompleted = 0;
    game.runGraves = 0;
    game.runCommitted = false;
    game.previousModifier = null;
    game.runSeed = (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
    player.ward = false;
    startLevel();
    const dailyBoost = window.ArcadeDailyRewards?.consumeBoost("graveyard-crossing");
    if (dailyBoost?.id === "ward") player.ward = true;
    if (dailyBoost?.id === "life") game.lives += dailyBoost.amount;
    if (dailyBoost?.id === "time") {
      game.levelTime += dailyBoost.amount;
      game.time += dailyBoost.amount;
    }
    if (isDeveloperMode()) {
      game.lives = Math.max(game.lives, 99);
      player.ward = true;
      game.time = Math.max(game.time, game.levelTime);
    }
    if (dailyBoost) showMessage(`Daily offering: ${dailyBoost.label}`, 2);
    playSound("start");
  }

  function startLevel() {
    game.rng = mulberry32((game.runSeed + game.level * 2654435761) >>> 0);
    game.graves = new Set();
    game.modifier = pickModifier();
    game.previousModifier = game.modifier;
    game.levelTime = Math.max(70, 118 - game.level * 3 + game.modifier.timeShift);
    game.time = game.levelTime;
    game.lanes = buildLanes();
    game.pickups = buildPickups();
    game.rite = pickRite();
    game.nightDeaths = 0;
    game.nightPickups = 0;
    game.nightWards = 0;
    game.firstGrave = null;
    game.nightStartScore = game.score;
    game.levelSummary = "";
    game.hopBursts = [];
    game.deathEchoes = [];
    game.scorePopups = [];
    resetPlayer();
    showMessage(`Night ${game.level}: ${game.modifier.name}`, 2.4);
    game.mode = "briefing";
    updateStatusPanel();
    updateRecords();
  }

  function prepareMenuScene() {
    game.rng = mulberry32((Date.now() ^ 0x9e3779b9) >>> 0);
    game.level = Math.max(1, game.bestLevel);
    game.modifier = modifiers[0];
    game.lanes = buildLanes();
    game.pickups = [];
    game.graves = new Set();
    game.rite = null;
    resetPlayer();
    game.mode = "menu";
    updateStatusPanel();
  }

  function pickModifier() {
    if (game.level === 1) {
      return modifiers[0];
    }
    let index = 1 + Math.floor(game.rng() * (modifiers.length - 1));
    if (modifiers[index] === game.previousModifier) {
      index = 1 + (index % (modifiers.length - 1));
    }
    return modifiers[index];
  }

  function currentDreadTier() {
    let tier = dreadTiers[0];
    for (const candidate of dreadTiers) {
      if (game.level >= candidate.minLevel) {
        tier = candidate;
      }
    }
    return tier;
  }

  function pickRite() {
    const pickupGoal = game.pickups.length;
    const finalTimeGoal = Math.max(24, Math.round(game.levelTime * 0.3));
    const reward = 420 + game.level * 70;
    const rites = [
      {
        name: "Untouched",
        detail: "Seal every grave without taking damage.",
        reward: reward + 180,
        complete: () => game.nightDeaths === 0,
      },
      {
        name: "Soul Cache",
        detail: `Collect all ${pickupGoal} charm${pickupGoal === 1 ? "" : "s"} this night.`,
        reward: reward + 80,
        complete: () => game.nightPickups >= pickupGoal,
      },
      {
        name: "Edge First",
        detail: "Seal an outer grave before the inner graves.",
        reward,
        complete: () => game.firstGrave === GRAVE_COLS[0] || game.firstGrave === GRAVE_COLS[GRAVE_COLS.length - 1],
      },
      {
        name: "Last Light",
        detail: `Finish with at least ${finalTimeGoal} seconds left.`,
        reward: reward + 100,
        complete: () => game.time >= finalTimeGoal,
      },
    ];

    return rites[Math.floor(game.rng() * rites.length)];
  }

  function buildLanes() {
    const levelSpeed = Math.min(1.95, 0.9 + game.level * 0.065) * game.modifier.speedMult;
    const extra = game.modifier.extraHazards;
    const tier = currentDreadTier();
    const templates = [
      { row: 2, kind: "swamp", speed: 64, width: 118, height: 38, count: 3, look: "coffin", role: "carrier" },
      {
        row: 3,
        kind: "swamp",
        speed: -82,
        width: 130,
        height: 35,
        count: 3,
        look: "log",
        role: "carrier",
        waterThreat: { width: 96, height: 30, count: 1 + extra, look: "crocodile", role: "threat" },
      },
      {
        row: 4,
        kind: "swamp",
        speed: 96,
        width: 136,
        height: 36,
        count: 2 + extra,
        look: "boat",
        role: "carrier",
        waterThreat: { width: 102, height: 31, count: 2, look: "crocodile", role: "threat" },
      },
      { row: 6, kind: "road", speed: -110, width: 108, height: 40, count: 3 + extra, look: "ambulance" },
      { row: 7, kind: "road", speed: 138, width: 94, height: 38, count: 4, look: "truck" },
      { row: 8, kind: "road", speed: -156, width: 138, height: 42, count: 2 + extra, look: "bus" },
      { row: 10, kind: "road", speed: 118, width: 106, height: 38, count: 3 + extra, look: "hearse" },
      { row: 11, kind: "road", speed: -142, width: 110, height: 40, count: 3, look: "ambulance" },
      { row: 12, kind: "road", speed: 176, width: 92, height: 38, count: 4 + extra, look: "truck" },
    ];

    for (const lane of templates) {
      if (lane.kind === "road" && tier.extraRoadRows.includes(lane.row)) {
        lane.count += 1;
      }
      if (lane.waterThreat && tier.extraWaterRows.includes(lane.row)) {
        lane.waterThreat.count += 1;
      }
    }

    return templates.map((lane) => {
      const laneCopy = {
        ...lane,
        speed: lane.speed * levelSpeed,
        entities: [],
      };

      addLaneEntities(laneCopy, lane, lane.count, 0);
      if (lane.waterThreat) {
        addLaneEntities(laneCopy, lane.waterThreat, lane.waterThreat.count, 0.48);
      }

      return laneCopy;
    });
  }

  function addLaneEntities(lane, spec, count, phase) {
    const spacing = W / count;
    const offset = (game.rng() * spacing + spacing * phase) % spacing;
    for (let i = 0; i < count; i += 1) {
      const variedWidth = spec.width + (game.rng() - 0.5) * 12;
      let x = i * spacing + offset + (game.rng() - 0.5) * Math.min(20, spacing * 0.12);
      if (lane.speed < 0) {
        x = W - x;
      }
      lane.entities.push({
        x,
        width: Math.max(62, variedWidth),
        height: spec.height,
        wobble: game.rng() * TAU,
        tint: game.rng(),
        look: spec.look,
        role: spec.role || (lane.kind === "swamp" ? "carrier" : "threat"),
      });
    }
  }

  function buildPickups() {
    const pickups = [];
    const count = Math.min(3, (game.level === 1 ? 1 : 2) + currentDreadTier().pickupBonus);
    const used = new Set();
    const types = ["ward", "time", "relic"];

    for (let i = 0; i < count; i += 1) {
      let row = SAFE_ROWS[1 + Math.floor(game.rng() * 3)];
      let col = 1 + Math.floor(game.rng() * (COLS - 2));
      let key = `${row}:${col}`;
      let guard = 0;
      while (used.has(key) && guard < 20) {
        row = SAFE_ROWS[1 + Math.floor(game.rng() * 3)];
        col = 1 + Math.floor(game.rng() * (COLS - 2));
        key = `${row}:${col}`;
        guard += 1;
      }
      used.add(key);
      pickups.push({
        row,
        col,
        type: types[(i + game.level + Math.floor(game.rng() * 3)) % types.length],
        collected: false,
        pulse: game.rng() * TAU,
      });
    }

    return pickups;
  }

  function updateLanes(dt) {
    for (const lane of game.lanes) {
      for (const entity of lane.entities) {
        entity.x += lane.speed * dt;
        entity.wobble += dt * 2;
        if (lane.speed > 0 && entity.x > W + 120) {
          entity.x = -entity.width - game.rng() * 170;
        } else if (lane.speed < 0 && entity.x < -entity.width - 120) {
          entity.x = W + game.rng() * 170;
        }
      }
    }
  }

  function carryPlayer(dt) {
    const lane = laneAt(player.row);
    if (!lane || lane.kind !== "swamp") {
      return;
    }

    if (hitWaterThreat(lane)) {
      loseLife("A crocodile snapped from the water");
      return;
    }

    const carrier = carrierUnderPlayer(lane);
    if (!carrier) {
      loseLife("Dark water pulled you under");
      return;
    }

    player.x += lane.speed * dt;
    if (player.x < -4 || player.x > W + 4) {
      loseLife("The coffin drifted into the fog");
    }
  }

  function checkCurrentTile() {
    if (player.invulnerable > 0 || game.mode !== "playing") {
      return;
    }

    if (player.row === 0) {
      claimGrave();
      return;
    }

    const lane = laneAt(player.row);
    if (!lane) {
      return;
    }

    const roadThreat = lane.kind === "road" ? roadThreatUnderPlayer(lane) : null;
    if (roadThreat) {
      loseLife(`${capitalize(roadThreat.look)} struck you`);
    } else if (lane.kind === "swamp") {
      if (hitWaterThreat(lane)) {
        loseLife("A crocodile snapped from the water");
      } else if (!carrierUnderPlayer(lane)) {
        loseLife("Dark water pulled you under");
      }
    }
  }

  function movePlayer(direction) {
    if (game.mode !== "playing") {
      return;
    }

    if (game.moveCooldown > 0) {
      game.pendingMove = direction;
      return;
    }

    game.pendingMove = null;
    const oldX = player.x;
    const oldRow = player.row;
    if (direction === "left") {
      player.x -= CELL;
    } else if (direction === "right") {
      player.x += CELL;
    } else if (direction === "up") {
      player.row -= 1;
    } else if (direction === "down") {
      player.row += 1;
    }

    player.x = clamp(player.x, CELL / 2, W - CELL / 2);
    player.row = clamp(player.row, 0, ROWS - 1);
    if (oldX !== player.x || oldRow !== player.row) {
      pushHopBurst(oldX, rowY(oldRow) + CELL / 2, player.x, rowY(player.row) + CELL / 2);
      playSound("hop");
    }
    player.pulse = 1;
    game.moveCooldown = 0.075;

    if (player.row < game.attemptBestRow) {
      game.attemptBestRow = player.row;
      addScore(10 + Math.max(0, ROWS - 1 - player.row) * 2);
    }

    if (oldRow !== player.row && player.row === ROWS - 1) {
      player.x = centerOfCol(Math.round((player.x - CELL / 2) / CELL));
    }

    collectPickups();
    checkCurrentTile();

    const completedForwardHop = direction === "up" &&
      player.row < oldRow &&
      game.mode === "playing" &&
      player.invulnerable <= 0;
    if (completedForwardHop) {
      game.rush += 1;
      game.rushTimer = 0.78;
      if (game.rush >= 3) {
        const rushBonus = Math.min(14, 2 + game.rush);
        addScore(rushBonus);
        showMessage(`Bold rush x${game.rush} +${rushBonus}`, 0.62);
      }
    } else if (direction === "down") {
      game.rush = 0;
      game.rushTimer = 0;
    }
  }

  function claimGrave() {
    const graveCol = GRAVE_COLS.find((col) => Math.abs(player.x - centerOfCol(col)) < CELL * 0.35);
    if (graveCol === undefined) {
      loseLife("You missed the open grave");
      return;
    }

    if (game.graves.has(graveCol)) {
      loseLife("That grave is already sealed");
      return;
    }

    game.graves.add(graveCol);
    game.runGraves += 1;
    if (game.firstGrave === null) {
      game.firstGrave = graveCol;
    }
    game.streak += 1;
    addScore(240 + Math.floor(game.time * 5) + game.streak * 60);
    game.time = Math.min(game.levelTime, game.time + 5);
    pushSealBurst(centerOfCol(graveCol), rowY(0) + CELL / 2);
    haptic(10);
    playSound("seal");
    updateStatusPanel();
    showMessage(`Grave sealed ${game.graves.size}/5 - moonlight +5`, 1.5);

    if (game.graves.size >= GRAVE_COLS.length) {
      finishLevel();
      return;
    }

    resetPlayer();
  }

  function finishLevel() {
    const levelBonus = 600 + game.level * 120 + Math.floor(game.time * 10);
    addScore(levelBonus);
    let riteResult = "Rite missed";
    if (game.rite && game.rite.complete()) {
      const beforeBonus = game.score;
      addScore(game.rite.reward);
      riteResult = `Rite fulfilled +${game.score - beforeBonus}`;
      game.ritesCompleted += 1;
      if (game.ritesCompleted % 2 === 0 && game.lives < 5) {
        game.lives += 1;
        riteResult += " / life restored";
      }
    }
    game.levelSummary = `Night score +${game.score - game.nightStartScore}  |  ${riteResult}`;
    game.mode = "levelClear";
    game.transitionTimer = 2.2;
    game.streak += 1;
    haptic([16, 24, 16]);
    playSound("clear");
    showMessage(`Night ${game.level} survived - ${riteResult}`, 2.2);
    updateStatusPanel();
    updateRecords();
  }

  function loseLife(reason) {
    if (player.invulnerable > 0 || game.mode !== "playing") {
      return;
    }

    if (window.ArcadeDeveloperMode?.preventDeath?.("graveyard-crossing", reason)) {
      resetPlayer();
      player.invulnerable = 1.4;
      player.ward = true;
      game.time = Math.max(game.time, Math.min(game.levelTime, 20));
      game.shake = 3;
      showMessage(`Developer mode: ${reason} ignored`, 1.4);
      updateStatusPanel();
      return;
    }

    game.nightDeaths += 1;
    game.time = Math.max(1, game.time - 7);
    pushDeathEcho(reason);
    updateStatusPanel();

    if (player.ward) {
      player.ward = false;
      trophyFlags.wardSaved = true;
      resetPlayer();
      player.invulnerable = 1.2;
      game.shake = 3;
      game.streak = 0;
      haptic(18);
      playSound("ward");
      showMessage(`Ward shattered: ${reason} -7 seconds`, 1.7);
      return;
    }

    game.lives -= 1;
    game.streak = 0;
    game.shake = 5;
    haptic(game.lives <= 0 ? [30, 40, 45] : 24);
    playSound(game.lives <= 0 ? "gameover" : "hit");

    if (game.lives <= 0) {
      game.mode = "gameOver";
      commitCareerStats();
      showMessage("Game over", 2);
      updateStatusPanel();
      updateRecords();
      submitNationalScore(game.score);
      return;
    }

    resetPlayer();
    player.invulnerable = 1.4;
    showMessage(`${reason} -7 seconds`, 1.7);
  }

  function resetPlayer() {
    player.x = centerOfCol(7);
    player.row = ROWS - 1;
    player.pulse = 1;
    game.attemptBestRow = ROWS - 1;
    game.rush = 0;
    game.rushTimer = 0;
    game.pendingMove = null;
  }

  function collectPickups() {
    if (game.mode !== "playing") {
      return;
    }

    for (const pickup of game.pickups) {
      if (pickup.collected || pickup.row !== player.row) {
        continue;
      }
      const x = centerOfCol(pickup.col);
      if (Math.abs(player.x - x) > 20) {
        continue;
      }
      const y = rowY(pickup.row) + CELL / 2;

      pickup.collected = true;
      game.nightPickups += 1;
      pushScorePopup(x, y - 15, pickup.type === "relic" ? "+180" : pickup.type === "ward" ? "+80" : "+65");
      haptic(8);
      playSound("pickup");
      updateStatusPanel();
      if (pickup.type === "ward") {
        game.nightWards += 1;
        player.ward = true;
        addScore(80);
        showMessage("Lantern ward lit", 1.35);
      } else if (pickup.type === "time") {
        game.time = Math.min(game.levelTime, game.time + 12);
        addScore(65);
        showMessage("Time reclaimed", 1.35);
      } else {
        trophyFlags.relicFound = true;
        addScore(180);
        showMessage("Relic recovered", 1.35);
      }
    }
  }

  function updateFeedback(dt) {
    updateFeedbackList(game.hopBursts, dt);
    updateFeedbackList(game.deathEchoes, dt);
    updateFeedbackList(game.scorePopups, dt);
  }

  function updateFeedbackList(list, dt) {
    for (let i = list.length - 1; i >= 0; i -= 1) {
      list[i].age += dt;
      if (list[i].age >= list[i].life) {
        list.splice(i, 1);
      }
    }
  }

  function pushHopBurst(fromX, fromY, toX, toY) {
    game.hopBursts.push({
      fromX,
      fromY,
      toX,
      toY,
      age: 0,
      life: 0.28,
    });
  }

  function pushDeathEcho(reason) {
    game.deathEchoes.push({
      x: player.x,
      y: rowY(player.row) + CELL / 2,
      reason,
      age: 0,
      life: 0.85,
    });
    if (game.deathEchoes.length > 5) {
      game.deathEchoes.shift();
    }
  }

  function pushSealBurst(x, y) {
    game.scorePopups.push({
      x,
      y,
      text: "+MOON",
      color: "#9ad7a1",
      age: 0,
      life: 0.9,
      ring: true,
    });
  }

  function pushScorePopup(x, y, text) {
    game.scorePopups.push({
      x,
      y,
      text,
      color: "#f2cf8a",
      age: 0,
      life: 0.75,
      ring: false,
    });
  }

  function handleAction(action) {
    if (action === "start") {
      if (game.mode === "menu" || game.mode === "gameOver") {
        startRun();
      } else if (game.mode === "briefing") {
        game.mode = "playing";
        showMessage(`Bonus rite: ${game.rite.name}`, 1.5);
        updateControlButtons();
        focusCanvas();
      } else if (game.mode === "paused") {
        game.mode = "playing";
        showMessage("Back into the dark", 1);
        updateControlButtons();
        focusCanvas();
      }
      return;
    }

    if (action === "pause") {
      if (game.mode === "playing") {
        game.mode = "paused";
        updateControlButtons();
      } else if (game.mode === "paused") {
        game.mode = "playing";
        showMessage("Back into the dark", 1);
        updateControlButtons();
        focusCanvas();
      }
      return;
    }

    if (action === "restart") {
      startRun();
      return;
    }

    movePlayer(action);
  }

  function pauseForBackground() {
    if (document.hidden || !document.hasFocus()) {
      if (game.mode === "playing") {
        game.mode = "paused";
        showMessage("The crossing waits", 1);
        updateControlButtons();
      }
    }
  }

  function onKeyDown(event) {
    if (!trophyOverlay.hidden) return;
    const interactiveTarget = event.target instanceof Element
      ? event.target.closest("button, input, select, textarea, summary, a, [role='button'], [contenteditable='true']")
      : null;
    if (interactiveTarget && (event.key === "Enter" || event.key === " ")) return;

    const action = keys[event.key];
    if (action) {
      event.preventDefault();
      handleAction(action);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleAction("start");
    } else if (event.key === "p" || event.key === "P" || event.key === "Escape") {
      event.preventDefault();
      handleAction("pause");
    } else if (event.key === "r" || event.key === "R") {
      event.preventDefault();
      handleAction("restart");
    }
  }

  function onCanvasClick() {
    if (game.mode === "menu" || game.mode === "briefing" || game.mode === "gameOver" || game.mode === "paused") {
      handleAction("start");
    }
  }

  function onTouchStart(event) {
    if (!event.changedTouches.length) {
      return;
    }
    event.preventDefault();
    const touch = event.changedTouches[0];
    touchStart = {
      x: touch.clientX,
      y: touch.clientY,
      time: performance.now(),
    };
  }

  function onTouchEnd(event) {
    if (!touchStart || !event.changedTouches.length) {
      return;
    }
    event.preventDefault();
    const touch = event.changedTouches[0];
    const dx = touch.clientX - touchStart.x;
    const dy = touch.clientY - touchStart.y;
    touchStart = null;

    if (Math.max(Math.abs(dx), Math.abs(dy)) < 22) {
      if (game.mode !== "playing") {
        handleAction("start");
      }
      return;
    }

    if (Math.abs(dx) > Math.abs(dy)) {
      handleAction(dx > 0 ? "right" : "left");
    } else {
      handleAction(dy > 0 ? "down" : "up");
    }
  }

  function onTouchCancel() {
    touchStart = null;
  }

  function draw() {
    ctx.save();
    if (game.shake > 0 && !REDUCED_MOTION) {
      const amount = game.shake;
      ctx.translate((Math.random() - 0.5) * amount, (Math.random() - 0.5) * amount);
    }

    if (game.mode === "menu") {
      drawMenu();
      ctx.restore();
      return;
    }

    drawBackground();
    drawBoard();
    drawPickups();
    drawEntities();
    drawEdgeWarnings();
    drawFeedback();
    drawPlayer();
    drawFog();
    drawHud();
    drawVignette();

    if (game.mode === "briefing") {
      drawBriefing();
    } else if (game.mode === "paused") {
      drawCurtain("Paused", "Press start to return");
    } else if (game.mode === "levelClear") {
      drawLevelClear();
    } else if (game.mode === "gameOver") {
      drawGameOver();
    }

    ctx.restore();
  }

  function drawBackground() {
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#070408");
    bg.addColorStop(0.42, "#14100d");
    bg.addColorStop(0.72, "#08130e");
    bg.addColorStop(1, "#030303");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    if (drawLevelBackground()) {
      ctx.save();
      ctx.fillStyle = "rgba(3, 3, 4, 0.24)";
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

    ctx.save();
    ctx.globalAlpha = 0.12;
    for (let i = 0; i < 18; i += 1) {
      const x = (i * 97 + 33) % W;
      const h = 34 + ((i * 19) % 90);
      ctx.fillStyle = i % 3 === 0 ? "#241126" : "#102015";
      ctx.fillRect(x, H - HUD - h, 8 + (i % 5) * 5, h);
    }
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const moon = ctx.createRadialGradient(W - 92, 82, 4, W - 92, 82, 74);
    moon.addColorStop(0, "rgba(237, 233, 205, 0.28)");
    moon.addColorStop(0.38, "rgba(180, 206, 185, 0.1)");
    moon.addColorStop(1, "rgba(180, 206, 185, 0)");
    ctx.fillStyle = moon;
    ctx.beginPath();
    ctx.arc(W - 92, 82, 74, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function currentLevelBackgroundName() {
    return LEVEL_BACKGROUNDS[(Math.max(1, game.level) - 1) % LEVEL_BACKGROUNDS.length];
  }

  function drawLevelBackground() {
    const sprite = sprites[currentLevelBackgroundName()];
    if (!sprite?.ready) {
      return false;
    }

    const imageRatio = sprite.image.naturalWidth / sprite.image.naturalHeight;
    const canvasRatio = W / H;
    const drawWidth = imageRatio > canvasRatio ? H * imageRatio : W;
    const drawHeight = imageRatio > canvasRatio ? H : W / imageRatio;
    const x = (W - drawWidth) / 2;
    const y = (H - drawHeight) / 2;

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(sprite.image, x, y, drawWidth, drawHeight);
    ctx.restore();
    return true;
  }

  function drawBoard() {
    for (let row = 0; row < ROWS; row += 1) {
      const y = rowY(row);
      const lane = laneAt(row);
      const type = row === 0 ? "target" : lane ? lane.kind : "safe";

      if (type === "target") {
        drawTargetRow(y);
      } else if (type === "swamp") {
        drawSwampRow(y, row);
      } else if (type === "road") {
        drawRoadRow(y, row);
      } else {
        drawSafeRow(y, row);
      }
    }

    ctx.strokeStyle = "rgba(255,255,255,0.035)";
    ctx.lineWidth = 1;
    for (let row = 1; row < ROWS; row += 1) {
      const y = rowY(row);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    drawBoardEdges();
  }

  function drawTargetRow(y) {
    const grad = ctx.createLinearGradient(0, y, 0, y + CELL);
    grad.addColorStop(0, "rgba(16, 30, 20, 0.56)");
    grad.addColorStop(1, "rgba(7, 16, 8, 0.5)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, y, W, CELL);

    ctx.fillStyle = "rgba(116, 103, 88, 0.13)";
    for (let col = 0; col < COLS; col += 1) {
      const x = col * CELL;
      if (col % 2 === 0) {
        ctx.fillRect(x + 2, y + 4, CELL - 4, 7);
      } else {
        ctx.fillRect(x + 9, y + 13, CELL - 18, 5);
      }
    }

    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    for (let col = 0; col < COLS; col += 1) {
      const x = col * CELL + 8;
      ctx.beginPath();
      ctx.ellipse(x + 14, y + 39, 19, 5, 0, 0, TAU);
      ctx.fill();
    }

    ctx.fillStyle = "rgba(0,0,0,0.22)";
    for (let col = 0; col < COLS; col += 1) {
      if (!GRAVE_COLS.includes(col)) {
        const x = col * CELL;
        ctx.fillRect(x + 7, y + 30, 34, 8);
        ctx.fillRect(x + 17, y + 18, 4, 20);
        ctx.fillRect(x + 27, y + 20, 4, 18);
      }
    }

    for (const col of GRAVE_COLS) {
      const x = col * CELL + CELL / 2;
      const sealed = game.graves.has(col);
      ctx.save();
      ctx.globalAlpha = sealed ? 0.32 : 0.64;
      ctx.strokeStyle = sealed ? "rgba(154, 215, 161, 0.55)" : "rgba(242, 207, 138, 0.72)";
      ctx.lineWidth = 2;
      roundedRect(x - 21, y + 4, 42, 41, 8);
      ctx.stroke();
      ctx.fillStyle = sealed ? "rgba(154, 215, 161, 0.09)" : "rgba(242, 207, 138, 0.08)";
      roundedRect(x - 21, y + 4, 42, 41, 8);
      ctx.fill();
      ctx.restore();
      if (!sealed && game.mode === "playing") {
        const glow = ctx.createRadialGradient(x, y + 25, 2, x, y + 25, 32);
        glow.addColorStop(0, "rgba(241, 197, 102, 0.27)");
        glow.addColorStop(1, "rgba(241, 197, 102, 0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y + 25, 32, 0, TAU);
        ctx.fill();
        ctx.fillStyle = `rgba(255, 217, 122, ${0.58 + Math.sin(elapsed * 5 + col) * 0.2})`;
        ctx.beginPath();
        ctx.moveTo(x, y + 42);
        ctx.lineTo(x - 6, y + 34);
        ctx.lineTo(x + 6, y + 34);
        ctx.closePath();
        ctx.fill();
      }
      drawGrave(x, y + 25, sealed);
    }
  }

  function drawSwampRow(y, row) {
    const grad = ctx.createLinearGradient(0, y, 0, y + CELL);
    grad.addColorStop(0, row % 2 ? "rgba(16, 32, 25, 0.54)" : "rgba(11, 27, 21, 0.54)");
    grad.addColorStop(1, "rgba(3, 17, 13, 0.48)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, y, W, CELL);

    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = row % 2 ? "#0f3528" : "#12301f";
    for (let i = 0; i < 7; i += 1) {
      const x = (i * 113 + row * 29) % W;
      ctx.beginPath();
      ctx.ellipse(x, y + 28 + (i % 3) * 5, 34, 9, 0, 0, TAU);
      ctx.fill();
    }
    ctx.restore();

    ctx.strokeStyle = "rgba(113, 184, 136, 0.18)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 9; i += 1) {
      const x = (i * 91 + row * 19 + elapsed * 18) % (W + 80) - 40;
      const yy = y + 13 + ((i * 17 + row * 7) % 24);
      ctx.beginPath();
      ctx.ellipse(x, yy, 25, 5, 0, 0, TAU);
      ctx.stroke();
    }

    ctx.strokeStyle = "rgba(169, 189, 127, 0.2)";
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 6; i += 1) {
      const x = (i * 137 + row * 41) % W;
      ctx.beginPath();
      ctx.moveTo(x, y + CELL - 5);
      ctx.quadraticCurveTo(x + 3, y + 25, x + 8, y + 16);
      ctx.moveTo(x + 5, y + CELL - 4);
      ctx.quadraticCurveTo(x + 8, y + 30, x + 16, y + 20);
      ctx.stroke();
    }
    drawLaneDirection(y, row, "rgba(155, 215, 177, 0.32)");
  }

  function drawRoadRow(y, row) {
    const grad = ctx.createLinearGradient(0, y, 0, y + CELL);
    grad.addColorStop(0, row % 2 ? "rgba(23, 17, 22, 0.58)" : "rgba(26, 18, 16, 0.58)");
    grad.addColorStop(1, "rgba(9, 7, 8, 0.5)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, y, W, CELL);

    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = "#654340";
    ctx.lineWidth = 1;
    for (let col = 0; col < COLS; col += 1) {
      const x = col * CELL + ((row + col) % 2) * 16;
      ctx.beginPath();
      ctx.moveTo(x + 6, y + 11);
      ctx.lineTo(x + 31, y + 8);
      ctx.lineTo(x + 40, y + 18);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + 2, y + 36);
      ctx.lineTo(x + 23, y + 32);
      ctx.lineTo(x + 36, y + 42);
      ctx.stroke();
    }
    ctx.restore();

    ctx.strokeStyle = "rgba(236, 203, 118, 0.2)";
    ctx.setLineDash([24, 30]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo((row * 41 + elapsed * 18) % 54 - 54, y + CELL / 2);
    ctx.lineTo(W + 54, y + CELL / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.globalAlpha = 0.18;
    ctx.fillStyle = "#000";
    for (let i = 0; i < 5; i += 1) {
      const x = (i * 151 + row * 37) % W;
      ctx.fillRect(x, y + 3, 28 + (i % 3) * 12, 3);
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = "rgba(255, 215, 128, 0.09)";
    ctx.fillRect(0, y, W, 2);
    ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
    ctx.fillRect(0, y + CELL - 2, W, 2);
    drawLaneDirection(y, row, "rgba(239, 205, 125, 0.3)");
  }

  function drawSafeRow(y, row) {
    const grad = ctx.createLinearGradient(0, y, 0, y + CELL);
    grad.addColorStop(0, row === 14 ? "rgba(26, 32, 21, 0.55)" : "rgba(21, 27, 17, 0.5)");
    grad.addColorStop(1, row === 14 ? "rgba(10, 17, 10, 0.52)" : "rgba(7, 12, 7, 0.46)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, y, W, CELL);

    ctx.fillStyle = "rgba(171, 167, 139, 0.14)";
    for (let col = 0; col < COLS; col += 1) {
      const h = hash(row, col);
      if (h % 3 === 0) {
        const x = col * CELL + 9 + (h % 17);
        ctx.fillRect(x, y + 32 + (h % 8), 12 + (h % 8), 3);
      } else if (h % 5 === 0) {
        ctx.beginPath();
        ctx.ellipse(col * CELL + 20 + (h % 11), y + 35, 8, 4, 0, 0, TAU);
        ctx.fill();
      } else if (h % 7 === 0 && row !== 14) {
        drawSmallStone(col * CELL + 22 + (h % 9), y + 29, h);
      }
    }

    if (row === 14) {
      ctx.fillStyle = "rgba(255, 213, 129, 0.08)";
      ctx.fillRect(0, y, W, 4);
    }

    if (row === 1 || row === 5 || row === 9 || row === 13) {
      drawRestStrip(y, row);
    }
  }

  function drawRestStrip(y, row) {
    ctx.save();
    ctx.globalAlpha = row === 1 ? 0.82 : 0.58;
    for (const col of GRAVE_COLS) {
      const x = col * CELL + CELL / 2;
      const path = ctx.createRadialGradient(x, y + CELL / 2, 4, x, y + CELL / 2, 34);
      path.addColorStop(0, "rgba(242, 207, 138, 0.18)");
      path.addColorStop(1, "rgba(242, 207, 138, 0)");
      ctx.fillStyle = path;
      ctx.beginPath();
      ctx.ellipse(x, y + CELL / 2 + 5, 28, 13, 0, 0, TAU);
      ctx.fill();

      ctx.strokeStyle = row === 1 ? "rgba(242, 207, 138, 0.42)" : "rgba(205, 197, 174, 0.22)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x - 18, y + 37);
      ctx.quadraticCurveTo(x, y + 25, x + 18, y + 37);
      ctx.stroke();
    }

    ctx.globalAlpha = 0.34;
    ctx.strokeStyle = "#9ad7a1";
    ctx.setLineDash([5, 14]);
    ctx.beginPath();
    ctx.moveTo(0, y + CELL - 2);
    ctx.lineTo(W, y + CELL - 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  function drawLaneDirection(y, row, color) {
    const lane = laneAt(row);
    if (!lane) {
      return;
    }

    ctx.save();
    ctx.font = "700 18px Georgia, serif";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillStyle = color;
    const marker = lane.speed > 0 ? ">" : "<";
    ctx.fillText(marker, 13, y + CELL / 2);
    ctx.fillText(marker, W - 13, y + CELL / 2);
    ctx.restore();
  }

  function drawBoardEdges() {
    ctx.save();
    const left = ctx.createLinearGradient(0, HUD, 42, HUD);
    left.addColorStop(0, "rgba(0, 0, 0, 0.45)");
    left.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = left;
    ctx.fillRect(0, HUD, 42, H - HUD);

    const right = ctx.createLinearGradient(W - 42, HUD, W, HUD);
    right.addColorStop(0, "rgba(0, 0, 0, 0)");
    right.addColorStop(1, "rgba(0, 0, 0, 0.45)");
    ctx.fillStyle = right;
    ctx.fillRect(W - 42, HUD, 42, H - HUD);

    ctx.strokeStyle = "rgba(255, 226, 161, 0.12)";
    ctx.lineWidth = 2;
    ctx.strokeRect(1, HUD + 1, W - 2, H - HUD - 2);
    ctx.restore();
  }

  function drawSmallStone(x, y, h) {
    ctx.save();
    ctx.fillStyle = "rgba(105, 108, 99, 0.42)";
    ctx.strokeStyle = "rgba(205, 197, 174, 0.18)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - 7, y + 9);
    ctx.lineTo(x - 7, y - 1);
    ctx.quadraticCurveTo(x - 7, y - 11, x, y - 11);
    ctx.quadraticCurveTo(x + 7, y - 11, x + 7, y - 1);
    ctx.lineTo(x + 7, y + 9);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    if (h % 2 === 0) {
      ctx.strokeStyle = "rgba(15, 14, 13, 0.28)";
      ctx.beginPath();
      ctx.moveTo(x, y - 7);
      ctx.lineTo(x, y + 3);
      ctx.moveTo(x - 4, y - 3);
      ctx.lineTo(x + 4, y - 3);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawEntities() {
    for (const lane of game.lanes) {
      for (const entity of lane.entities) {
        if (lane.kind === "swamp" && entity.role === "threat") {
          drawCrocodile(entity, lane);
        } else if (lane.kind === "swamp") {
          drawWaterCarrier(entity, lane);
        } else {
          drawRoadThreat(entity, lane);
        }
      }
    }
  }

  function drawEdgeWarnings() {
    if (game.mode !== "playing" && game.mode !== "briefing") {
      return;
    }

    ctx.save();
    for (const lane of game.lanes) {
      const incomingFromLeft = lane.speed > 0;
      const y = rowY(lane.row) + CELL / 2;
      const edgeX = incomingFromLeft ? 9 : W - 9;
      const nearEdge = lane.entities.some((entity) => {
        if (lane.kind === "swamp" && entity.role === "carrier") {
          return false;
        }
        return incomingFromLeft
          ? entity.x > -entity.width - 38 && entity.x < 18
          : entity.x < W + 38 && entity.x + entity.width > W - 18;
      });

      if (!nearEdge) {
        continue;
      }

      const pulse = 0.45 + Math.sin(elapsed * 10 + lane.row) * 0.2;
      ctx.globalCompositeOperation = "screen";
      ctx.fillStyle = lane.kind === "road"
        ? `rgba(255, 211, 118, ${pulse})`
        : `rgba(130, 236, 172, ${pulse * 0.8})`;
      ctx.beginPath();
      ctx.moveTo(edgeX, y - 12);
      ctx.lineTo(incomingFromLeft ? edgeX + 12 : edgeX - 12, y);
      ctx.lineTo(edgeX, y + 12);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function drawFeedback() {
    drawHopBursts();
    drawDeathEchoes();
    drawScorePopups();
  }

  function drawHopBursts() {
    ctx.save();
    for (const burst of game.hopBursts) {
      const t = burst.age / burst.life;
      const alpha = 1 - t;
      ctx.globalAlpha = alpha * 0.5;
      ctx.strokeStyle = "#f2cf8a";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(burst.fromX, burst.fromY);
      ctx.quadraticCurveTo(
        (burst.fromX + burst.toX) / 2,
        (burst.fromY + burst.toY) / 2 - 16,
        burst.toX,
        burst.toY
      );
      ctx.stroke();

      ctx.globalAlpha = alpha * 0.28;
      ctx.fillStyle = "#fff1c8";
      ctx.beginPath();
      ctx.ellipse(burst.fromX, burst.fromY + 16, 15 * (1 + t), 5, 0, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawDeathEchoes() {
    ctx.save();
    for (const echo of game.deathEchoes) {
      const t = echo.age / echo.life;
      const radius = 12 + t * 38;
      ctx.globalAlpha = (1 - t) * 0.78;
      ctx.strokeStyle = "#d64646";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(echo.x, echo.y, radius, 0, TAU);
      ctx.stroke();
      ctx.globalAlpha = (1 - t) * 0.28;
      ctx.fillStyle = "#d64646";
      ctx.beginPath();
      ctx.arc(echo.x, echo.y, radius * 0.45, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawScorePopups() {
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "700 14px Georgia, serif";
    for (const popup of game.scorePopups) {
      const t = popup.age / popup.life;
      const y = popup.y - t * 26;
      ctx.globalAlpha = 1 - t;
      if (popup.ring) {
        ctx.strokeStyle = "rgba(154, 215, 161, 0.72)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(popup.x, popup.y, 18 + t * 24, 0, TAU);
        ctx.stroke();
      }
      ctx.fillStyle = popup.color;
      ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
      ctx.shadowBlur = 6;
      ctx.fillText(popup.text, popup.x, y);
      ctx.shadowBlur = 0;
    }
    ctx.restore();
  }

  function drawWaterCarrier(entity, lane) {
    const y = rowY(lane.row) + CELL / 2 + Math.sin(entity.wobble) * 2;
    const spriteName = entity.look || "coffin";

    if (canDrawSprite(spriteName)) {
      drawEntityShadow(entity.x + 10, rowY(lane.row) + 36, entity.width - 20, 8, 0.28);
      drawSprite(spriteName, entity.x + entity.width / 2, y + 1, entity.width, entity.height || 36, {
        flipX: lane.speed < 0,
      });
      return;
    }

    drawCoffin(entity, lane);
  }

  function drawCrocodile(entity, lane) {
    const y = rowY(lane.row) + CELL / 2 + Math.sin(entity.wobble) * 1.5;

    if (canDrawSprite("crocodile")) {
      drawEntityShadow(entity.x + 8, rowY(lane.row) + 36, entity.width - 16, 7, 0.2);
      drawSprite("crocodile", entity.x + entity.width / 2, y + 2, entity.width, entity.height || 31, {
        flipX: lane.speed < 0,
      });
      return;
    }

    drawShade(entity, lane);
  }

  function drawRoadThreat(entity, lane) {
    const y = rowY(lane.row) + CELL / 2 + 3;
    ctx.save();
    ctx.strokeStyle = "rgba(255, 187, 142, 0.75)";
    ctx.lineWidth = 2;
    ctx.strokeRect(entity.x, y - 18, entity.width, 36);
    ctx.restore();
    const spriteName = entity.look || "truck";

    if (canDrawSprite(spriteName)) {
      drawEntityShadow(entity.x + 7, rowY(lane.row) + 38, entity.width - 14, 8, 0.38);
      drawSprite(spriteName, entity.x + entity.width / 2, y, entity.width, entity.height || 40, {
        flipX: lane.speed < 0,
      });
      return;
    }

    if (spriteName === "hearse" || spriteName === "ambulance") {
      drawHearse(entity, lane);
    } else if (spriteName === "bus" || spriteName === "truck") {
      drawCarriage(entity, lane);
    } else {
      drawReaper(entity, lane);
    }
  }

  function drawCoffin(entity, lane) {
    const y = rowY(lane.row);
    const x = entity.x;
    const h = 30;
    const yy = y + 9 + Math.sin(entity.wobble) * 2;

    ctx.save();
    ctx.translate(x, yy);
    drawEntityShadow(12, 24, entity.width - 12, 8, 0.28);
    const wood = ctx.createLinearGradient(0, 0, 0, h);
    wood.addColorStop(0, "#4a2815");
    wood.addColorStop(0.48, "#2c170d");
    wood.addColorStop(1, "#160c08");
    ctx.fillStyle = wood;
    ctx.strokeStyle = "#815734";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(12, h / 2);
    ctx.lineTo(30, 0);
    ctx.lineTo(entity.width - 26, 0);
    ctx.lineTo(entity.width - 8, h / 2);
    ctx.lineTo(entity.width - 26, h);
    ctx.lineTo(30, h);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = "rgba(255, 206, 128, 0.14)";
    ctx.lineWidth = 1;
    for (let i = 34; i < entity.width - 32; i += 18) {
      ctx.beginPath();
      ctx.moveTo(i, 4);
      ctx.lineTo(i + 8, h - 4);
      ctx.stroke();
    }

    ctx.strokeStyle = "rgba(231, 195, 113, 0.35)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(entity.width / 2, 7);
    ctx.lineTo(entity.width / 2, h - 7);
    ctx.moveTo(entity.width / 2 - 9, h / 2);
    ctx.lineTo(entity.width / 2 + 9, h / 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawHearse(entity, lane) {
    const y = rowY(lane.row) + 9;
    const x = entity.x;
    const dir = Math.sign(lane.speed) || 1;

    ctx.save();
    ctx.translate(x, y);
    drawEntityShadow(4, 30, entity.width - 8, 8, 0.38);
    const body = ctx.createLinearGradient(0, 4, 0, 35);
    body.addColorStop(0, "#171019");
    body.addColorStop(0.58, "#070607");
    body.addColorStop(1, "#030303");
    ctx.fillStyle = body;
    roundedRect(0, 7, entity.width, 25, 5);
    ctx.fill();
    ctx.fillStyle = "#251827";
    roundedRect(dir > 0 ? entity.width * 0.48 : 8, 0, entity.width * 0.42, 19, 4);
    ctx.fill();
    ctx.fillStyle = "rgba(117, 182, 161, 0.34)";
    roundedRect(dir > 0 ? entity.width * 0.54 : 14, 5, entity.width * 0.22, 10, 2);
    ctx.fill();

    const lampX = dir > 0 ? entity.width - 14 : 6;
    ctx.fillStyle = "rgba(177, 238, 190, 0.82)";
    ctx.fillRect(lampX, 12, 6, 8);
    ctx.globalCompositeOperation = "screen";
    const glow = ctx.createRadialGradient(lampX + 3, 16, 1, lampX + 3, 16, 36);
    glow.addColorStop(0, "rgba(164, 239, 191, 0.28)");
    glow.addColorStop(1, "rgba(164, 239, 191, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(lampX + 3, 16, 36, 0, TAU);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";

    ctx.fillStyle = "#171717";
    ctx.beginPath();
    ctx.arc(18, 33, 7, 0, TAU);
    ctx.arc(entity.width - 18, 33, 7, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "rgba(168, 151, 137, 0.35)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(18, 33, 4, 0, TAU);
    ctx.arc(entity.width - 18, 33, 4, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = "#302a30";
    ctx.fillRect(0, 28, entity.width, 5);
    ctx.restore();
  }

  function drawShade(entity, lane) {
    const y = rowY(lane.row) + 8 + Math.sin(entity.wobble) * 4;
    const x = entity.x;
    const h = 32;

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const aura = ctx.createRadialGradient(x + entity.width / 2, y + 18, 4, x + entity.width / 2, y + 18, entity.width * 0.62);
    aura.addColorStop(0, "rgba(184, 255, 218, 0.16)");
    aura.addColorStop(1, "rgba(184, 255, 218, 0)");
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.ellipse(x + entity.width / 2, y + 18, entity.width * 0.64, 26, 0, 0, TAU);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 0.84;
    const grad = ctx.createLinearGradient(x, y, x + entity.width, y + h);
    grad.addColorStop(0, "rgba(192, 255, 219, 0.1)");
    grad.addColorStop(0.5, "rgba(218, 242, 236, 0.76)");
    grad.addColorStop(1, "rgba(121, 219, 175, 0.12)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(x + 10, y + h);
    ctx.quadraticCurveTo(x + entity.width * 0.2, y - 4, x + entity.width * 0.5, y + 6);
    ctx.quadraticCurveTo(x + entity.width * 0.82, y - 3, x + entity.width - 8, y + h);
    ctx.quadraticCurveTo(x + entity.width * 0.72, y + h - 8, x + entity.width * 0.5, y + h);
    ctx.quadraticCurveTo(x + entity.width * 0.26, y + h - 8, x + 10, y + h);
    ctx.fill();
    ctx.fillStyle = "rgba(22, 24, 22, 0.7)";
    ctx.fillRect(x + entity.width * 0.43, y + 15, 5, 6);
    ctx.fillRect(x + entity.width * 0.56, y + 15, 5, 6);
    ctx.fillStyle = "rgba(207, 255, 218, 0.9)";
    ctx.fillRect(x + entity.width * 0.45, y + 16, 2, 2);
    ctx.fillRect(x + entity.width * 0.58, y + 16, 2, 2);
    ctx.restore();
  }

  function drawCarriage(entity, lane) {
    const y = rowY(lane.row) + 10;
    const x = entity.x;

    ctx.save();
    ctx.translate(x, y);
    drawEntityShadow(6, 30, entity.width - 12, 8, 0.36);
    const paint = ctx.createLinearGradient(0, 0, 0, 34);
    paint.addColorStop(0, "#3a1b27");
    paint.addColorStop(0.55, "#1d0f17");
    paint.addColorStop(1, "#080607");
    ctx.fillStyle = paint;
    roundedRect(4, 3, entity.width - 8, 28, 4);
    ctx.fill();
    ctx.fillStyle = "#0c0909";
    ctx.fillRect(14, 10, entity.width - 28, 12);
    ctx.strokeStyle = "#754b4c";
    ctx.lineWidth = 2;
    for (let i = 12; i < entity.width - 10; i += 20) {
      ctx.beginPath();
      ctx.moveTo(i, 3);
      ctx.lineTo(i + 9, -4);
      ctx.lineTo(i + 18, 3);
      ctx.stroke();
    }
    ctx.fillStyle = "#161313";
    ctx.beginPath();
    ctx.arc(23, 33, 7, 0, TAU);
    ctx.arc(entity.width - 23, 33, 7, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "rgba(207, 174, 142, 0.32)";
    ctx.lineWidth = 1.5;
    for (const wheelX of [23, entity.width - 23]) {
      ctx.beginPath();
      ctx.arc(wheelX, 33, 5, 0, TAU);
      ctx.moveTo(wheelX - 5, 33);
      ctx.lineTo(wheelX + 5, 33);
      ctx.moveTo(wheelX, 28);
      ctx.lineTo(wheelX, 38);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawReaper(entity, lane) {
    const y = rowY(lane.row) + 5 + Math.sin(entity.wobble) * 2;
    const x = entity.x;

    ctx.save();
    ctx.translate(x, y);
    drawEntityShadow(9, 34, entity.width - 18, 8, 0.42);
    const cloak = ctx.createLinearGradient(0, 0, 0, 42);
    cloak.addColorStop(0, "#151414");
    cloak.addColorStop(0.45, "#050505");
    cloak.addColorStop(1, "#010101");
    ctx.fillStyle = cloak;
    ctx.beginPath();
    ctx.moveTo(entity.width * 0.5, 0);
    ctx.quadraticCurveTo(entity.width * 0.82, 12, entity.width - 6, 38);
    ctx.lineTo(8, 38);
    ctx.quadraticCurveTo(entity.width * 0.18, 12, entity.width * 0.5, 0);
    ctx.fill();
    ctx.fillStyle = "rgba(184, 233, 174, 0.8)";
    ctx.fillRect(entity.width * 0.45, 15, 5, 5);
    ctx.fillRect(entity.width * 0.55, 15, 5, 5);
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = "rgba(152, 255, 168, 0.12)";
    ctx.beginPath();
    ctx.arc(entity.width * 0.5, 18, 24, 0, TAU);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = "rgba(219, 214, 190, 0.72)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(entity.width - 10, 3);
    ctx.lineTo(entity.width - 22, 38);
    ctx.quadraticCurveTo(entity.width - 38, 2, entity.width - 6, 3);
    ctx.stroke();
    ctx.restore();
  }

  function drawEntityShadow(x, y, width, height, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.ellipse(x + width / 2, y + height / 2, width / 2, height / 2, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawPickups() {
    for (const pickup of game.pickups) {
      if (pickup.collected) {
        continue;
      }
      const x = centerOfCol(pickup.col);
      const y = rowY(pickup.row) + CELL / 2;
      const pulse = 1 + Math.sin(elapsed * 4 + pickup.pulse) * 0.12;

      ctx.save();
      ctx.translate(x, y);
      ctx.scale(pulse, pulse);
      ctx.globalCompositeOperation = "screen";
      const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 27);
      glow.addColorStop(0, pickup.type === "time" ? "rgba(174, 232, 255, 0.32)" : "rgba(255, 222, 129, 0.28)");
      glow.addColorStop(1, "rgba(255, 222, 129, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, 27, 0, TAU);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
      if (pickup.type === "ward") {
        ctx.strokeStyle = "rgba(255, 219, 129, 0.9)";
        ctx.fillStyle = "rgba(255, 179, 77, 0.22)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 13, 0, TAU);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, -9);
        ctx.lineTo(0, 9);
        ctx.moveTo(-7, -1);
        ctx.lineTo(7, -1);
        ctx.stroke();
      } else if (pickup.type === "time") {
        ctx.fillStyle = "rgba(184, 233, 255, 0.8)";
        roundedRect(-9, -13, 18, 26, 6);
        ctx.fill();
        ctx.fillStyle = "#143044";
        ctx.fillRect(-5, -7, 10, 3);
        ctx.fillRect(-4, 5, 8, 3);
      } else {
        ctx.fillStyle = "rgba(230, 226, 191, 0.88)";
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, TAU);
        ctx.fill();
        ctx.fillStyle = "#3a2020";
        ctx.fillRect(-5, -2, 4, 4);
        ctx.fillRect(3, -2, 4, 4);
      }
      ctx.restore();
    }
  }

  function drawPlayer() {
    if (game.mode === "menu" || game.mode === "gameOver") {
      return;
    }

    const x = player.x;
    const y = rowY(player.row) + CELL / 2;
    window.ArcadeUX.drawMarker(ctx, x, y, 24, "#9ef6ff");
    const flicker = 0.85 + Math.sin(elapsed * 9) * 0.08 + Math.sin(elapsed * 17) * 0.05;
    player.pulse = Math.max(0, player.pulse - 0.08);

    if (player.invulnerable > 0 && Math.floor(elapsed * 18) % 2 === 0) {
      return;
    }

    ctx.save();
    drawEntityShadow(x - 14, y + 17, 32, 8, 0.35);
    const glow = ctx.createRadialGradient(x + 13, y + 2, 2, x + 13, y + 2, 58 * flicker);
    glow.addColorStop(0, "rgba(255, 218, 116, 0.58)");
    glow.addColorStop(0.32, "rgba(255, 120, 68, 0.18)");
    glow.addColorStop(1, "rgba(255, 120, 68, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x + 13, y + 2, 58 * flicker, 0, TAU);
    ctx.fill();

    if (player.ward) {
      ctx.strokeStyle = "rgba(255, 223, 132, 0.7)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, 22 + Math.sin(elapsed * 5) * 2, 0, TAU);
      ctx.stroke();
    }

    const scale = 1 + player.pulse * 0.12;
    if (canDrawSprite("player")) {
      drawSprite("player", x, y + 1, 31 * scale, 44 * scale);
      ctx.restore();
      return;
    }

    ctx.translate(x, y);
    ctx.scale(scale, scale);
    const cloak = ctx.createLinearGradient(0, -18, 0, 20);
    cloak.addColorStop(0, "#50304c");
    cloak.addColorStop(0.6, "#251624");
    cloak.addColorStop(1, "#100b13");
    ctx.fillStyle = cloak;
    ctx.beginPath();
    ctx.moveTo(0, -17);
    ctx.quadraticCurveTo(17, -6, 13, 18);
    ctx.lineTo(-13, 18);
    ctx.quadraticCurveTo(-17, -6, 0, -17);
    ctx.fill();

    ctx.fillStyle = "#d9c9aa";
    ctx.beginPath();
    ctx.arc(0, -14, 8, 0, TAU);
    ctx.fill();

    ctx.fillStyle = "#130d12";
    ctx.fillRect(-7, -16, 14, 6);

    const flame = ctx.createRadialGradient(15, 5, 1, 15, 5, 15);
    flame.addColorStop(0, "rgba(255, 248, 184, 0.98)");
    flame.addColorStop(0.38, "rgba(255, 190, 76, 0.85)");
    flame.addColorStop(1, "rgba(255, 120, 61, 0.18)");
    ctx.fillStyle = flame;
    roundedRect(10, -1, 9, 13, 3);
    ctx.fill();
    ctx.strokeStyle = "#4b2e1d";
    ctx.lineWidth = 2;
    ctx.strokeRect(11, 1, 7, 9);
    ctx.restore();
  }

  function drawHud() {
    const hud = ctx.createLinearGradient(0, 0, 0, HUD);
    hud.addColorStop(0, "rgba(18, 13, 15, 0.98)");
    hud.addColorStop(1, "rgba(4, 4, 5, 0.96)");
    ctx.fillStyle = hud;
    ctx.fillRect(0, 0, W, HUD);
    ctx.fillStyle = "rgba(255, 229, 176, 0.04)";
    for (let x = 0; x < W; x += 24) {
      ctx.fillRect(x, 0, 1, HUD);
    }
    ctx.strokeStyle = "rgba(255, 170, 100, 0.22)";
    ctx.beginPath();
    ctx.moveTo(0, HUD - 0.5);
    ctx.lineTo(W, HUD - 0.5);
    ctx.stroke();

    ctx.fillStyle = "#f5e9d3";
    ctx.font = "700 17px Georgia, serif";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(255, 200, 132, 0.14)";
    ctx.shadowBlur = 8;
    ctx.fillText(`SCORE ${game.score}`, 16, 23);
    ctx.fillText(`NIGHT ${game.level}`, 154, 23);
    ctx.fillText(`LIVES ${game.lives}`, 263, 23);
    ctx.shadowBlur = 0;

    const wardX = 342;
    ctx.fillStyle = player.ward ? "#ffda7b" : "rgba(245, 233, 211, 0.35)";
    ctx.fillText(player.ward ? "WARD ON" : "WARD --", wardX, 23);
    if (game.streak > 0) {
      ctx.font = "700 11px Georgia, serif";
      ctx.fillStyle = "#f2cf8a";
      ctx.fillText(`CHAIN x${game.streak}`, wardX, 39);
    }

    ctx.font = "700 15px Georgia, serif";
    ctx.fillStyle = "#cce6cc";
    ctx.fillText(`BEST ${game.highScore}`, 565, 14);

    drawTimerBar(504, 28, 172, 10);
    drawGraveProgress(435, 23);

    if (game.messageTimer > 0) {
      const alpha = Math.min(1, game.messageTimer);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.textAlign = "center";
      ctx.font = "700 17px Georgia, serif";
      ctx.fillStyle = "#ffd98a";
      ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
      ctx.shadowBlur = 8;
      ctx.fillText(game.message, W / 2, HUD + 19);
      ctx.restore();
    }
  }

  function drawTimerBar(x, y, width, height) {
    const pct = clamp(game.time / game.levelTime, 0, 1);
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    roundedRect(x, y, width, height, 4);
    ctx.fill();
    const grad = ctx.createLinearGradient(x, y, x + width, y);
    grad.addColorStop(0, pct < 0.28 ? "#e24d4d" : "#e0c56c");
    grad.addColorStop(1, "#85c989");
    ctx.fillStyle = grad;
    roundedRect(x, y, width * pct, height, 4);
    ctx.fill();
  }

  function drawGraveProgress(x, y) {
    for (let i = 0; i < GRAVE_COLS.length; i += 1) {
      const sealed = game.graves.has(GRAVE_COLS[i]);
      ctx.fillStyle = sealed ? "#9ad7a1" : "rgba(245, 233, 211, 0.3)";
      roundedRect(x + i * 12, y - 7, 8, 14, 3);
      ctx.fill();
    }
  }

  function drawFog() {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const density = game.mode === "menu" ? 0.85 : game.modifier.fog;

    for (const p of game.fogParticles) {
      ctx.globalAlpha = p.alpha * density;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, p.rx, p.ry, p.tilt, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawVignette() {
    const gradient = ctx.createRadialGradient(W / 2, H / 2, 120, W / 2, H / 2, 470);
    gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
    gradient.addColorStop(0.68, "rgba(0, 0, 0, 0.18)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0.72)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);
  }

  function drawMenu() {
    drawTitleCardBackground();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.font = "20px Georgia, serif";
    ctx.fillStyle = "#d9c6b4";
    ctx.fillText("Seal all five graves before dawn breaks your nerve.", W / 2, 468);

    drawMenuButton(W / 2 - 98, 500, 196, 48, "START NIGHT");

    ctx.font = "17px Georgia, serif";
    ctx.fillStyle = "#cfe1c9";
    ctx.fillText(`High Score ${game.highScore}`, W / 2, 586);
    ctx.fillText(`Best Night ${game.bestLevel}`, W / 2, 616);

    ctx.font = "15px Georgia, serif";
    ctx.fillStyle = "rgba(255, 232, 219, 0.72)";
    ctx.fillText("Arrow keys, WASD, swipe, or the D-pad", W / 2, 670);
    ctx.fillText("Collect wards and relics. Coffins float. Everything else bites.", W / 2, 696);
    ctx.fillText("Fulfill two bonus rites in a run to restore a life.", W / 2, 722);
    ctx.textAlign = "start";
  }

  function drawTitleCardBackground() {
    ctx.fillStyle = "#050505";
    ctx.fillRect(0, 0, W, H);

    const sprite = sprites.titlecard;
    if (sprite?.ready) {
      const imageRatio = sprite.image.naturalWidth / sprite.image.naturalHeight;
      const canvasRatio = W / H;
      const drawWidth = imageRatio > canvasRatio ? H * imageRatio : W;
      const drawHeight = imageRatio > canvasRatio ? H : W / imageRatio;
      const x = (W - drawWidth) / 2;
      const y = (H - drawHeight) / 2;
      ctx.drawImage(sprite.image, x, y, drawWidth, drawHeight);
    } else {
      drawBackground();
    }

    const lower = ctx.createLinearGradient(0, 250, 0, H);
    lower.addColorStop(0, "rgba(5, 4, 5, 0)");
    lower.addColorStop(0.5, "rgba(5, 4, 5, 0.46)");
    lower.addColorStop(1, "rgba(5, 4, 5, 0.94)");
    ctx.fillStyle = lower;
    ctx.fillRect(0, 0, W, H);

    const edge = ctx.createRadialGradient(W / 2, H / 2, 160, W / 2, H / 2, 520);
    edge.addColorStop(0, "rgba(0, 0, 0, 0)");
    edge.addColorStop(1, "rgba(0, 0, 0, 0.62)");
    ctx.fillStyle = edge;
    ctx.fillRect(0, 0, W, H);
  }

  function drawGameOver() {
    drawCurtainBase(0.8);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffe8db";
    ctx.font = "700 46px Georgia, serif";
    ctx.shadowColor = "rgba(178, 28, 31, 0.5)";
    ctx.shadowBlur = 16;
    ctx.fillText("THE NIGHT WON", W / 2, 245);
    ctx.shadowBlur = 0;
    ctx.font = "22px Georgia, serif";
    ctx.fillStyle = "#e7d6c2";
    ctx.fillText(`Score ${game.score}`, W / 2, 306);
    ctx.fillText(`High Score ${game.highScore}`, W / 2, 340);
    ctx.fillText(`Best Night ${game.bestLevel}`, W / 2, 374);
    ctx.font = "18px Georgia, serif";
    ctx.fillStyle = "#f2cf8a";
    ctx.fillText(`Bonus rites fulfilled ${game.ritesCompleted}`, W / 2, 404);
    drawMenuButton(W / 2 - 104, 444, 208, 48, "TRY AGAIN");
    ctx.textAlign = "start";
  }

  function drawBriefing() {
    const tier = currentDreadTier();
    drawCurtainBase(0.8);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#f2cf8a";
    ctx.font = "700 17px Georgia, serif";
    ctx.fillText(`NIGHT ${game.level}`, W / 2, 208);
    ctx.fillStyle = "#ffe8db";
    ctx.font = "700 40px Georgia, serif";
    ctx.fillText(game.modifier.name.toUpperCase(), W / 2, 254);
    ctx.fillStyle = "#ddd0c1";
    ctx.font = "17px Georgia, serif";
    ctx.fillText(game.modifier.description, W / 2, 292);
    ctx.fillStyle = "#cfe1c9";
    ctx.font = "14px Georgia, serif";
    ctx.fillText(`DREAD ${tier.name.toUpperCase()} - ${tier.description}`, W / 2, 322);

    ctx.fillStyle = "#9ad7a1";
    ctx.font = "700 14px Georgia, serif";
    ctx.fillText("OPTIONAL BONUS RITE", W / 2, 358);
    ctx.fillStyle = "#ffe8db";
    ctx.font = "700 24px Georgia, serif";
    ctx.fillText(`${game.rite.name.toUpperCase()}  +${game.rite.reward}`, W / 2, 390);
    ctx.fillStyle = "#ddd0c1";
    ctx.font = "16px Georgia, serif";
    ctx.fillText(game.rite.detail, W / 2, 422);
    ctx.fillStyle = "#cfe1c9";
    ctx.font = "15px Georgia, serif";
    ctx.fillText(`${Math.ceil(game.levelTime)} seconds of moonlight. Graves restore 5; damage costs 7.`, W / 2, 460);
    ctx.fillText("Every two fulfilled rites restore one life.", W / 2, 486);
    ctx.textAlign = "start";
  }

  function drawLevelClear() {
    drawCurtainBase(0.72);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffe8db";
    ctx.font = "700 43px Georgia, serif";
    ctx.shadowColor = "rgba(255, 184, 112, 0.36)";
    ctx.shadowBlur = 12;
    ctx.fillText("NIGHT SURVIVED", W / 2, 282);
    ctx.shadowBlur = 0;
    ctx.font = "19px Georgia, serif";
    ctx.fillStyle = "#ddcfc2";
    ctx.fillText("The graves are quiet for now.", W / 2, 326);
    ctx.font = "700 18px Georgia, serif";
    ctx.fillStyle = game.rite && game.rite.complete() ? "#9ad7a1" : "#d5baa5";
    ctx.fillText(game.levelSummary, W / 2, 372);
    ctx.font = "15px Georgia, serif";
    ctx.fillStyle = "#cfe1c9";
    ctx.fillText("The next curse gathers...", W / 2, 419);
    ctx.textAlign = "start";
  }

  function drawCurtain(title, subtitle) {
    drawCurtainBase(0.68);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffe8db";
    ctx.font = "700 44px Georgia, serif";
    ctx.shadowColor = "rgba(255, 184, 112, 0.36)";
    ctx.shadowBlur = 12;
    ctx.fillText(title.toUpperCase(), W / 2, 302);
    ctx.shadowBlur = 0;
    ctx.font = "20px Georgia, serif";
    ctx.fillStyle = "#ddcfc2";
    ctx.fillText(subtitle, W / 2, 350);
    ctx.textAlign = "start";
  }

  function drawCurtainBase(alpha) {
    ctx.save();
    ctx.fillStyle = `rgba(5, 4, 5, ${alpha})`;
    ctx.fillRect(0, 0, W, H);
    const inner = ctx.createLinearGradient(130, 150, W - 130, 620);
    inner.addColorStop(0, "rgba(255, 218, 154, 0.05)");
    inner.addColorStop(0.5, "rgba(46, 20, 25, 0.18)");
    inner.addColorStop(1, "rgba(134, 188, 139, 0.05)");
    ctx.fillStyle = inner;
    roundedRect(130, 150, W - 260, 470, 8);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 202, 130, 0.24)";
    ctx.lineWidth = 2;
    roundedRect(130, 150, W - 260, 470, 8);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255, 202, 130, 0.08)";
    roundedRect(144, 164, W - 288, 442, 6);
    ctx.stroke();
    ctx.restore();
  }

  function drawMenuButton(x, y, width, height, label) {
    const pulse = 0.6 + Math.sin(elapsed * 4) * 0.18;
    ctx.save();
    ctx.shadowColor = `rgba(255, 196, 112, ${pulse})`;
    ctx.shadowBlur = 18;
    const grad = ctx.createLinearGradient(x, y, x, y + height);
    grad.addColorStop(0, "#6a4134");
    grad.addColorStop(0.5, "#3b211d");
    grad.addColorStop(1, "#160c0b");
    ctx.fillStyle = grad;
    roundedRect(x, y, width, height, 8);
    ctx.fill();
    ctx.fillStyle = "rgba(255, 245, 209, 0.11)";
    roundedRect(x + 9, y + 7, width - 18, 6, 3);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255, 222, 161, 0.48)";
    ctx.stroke();
    ctx.fillStyle = "#ffe8db";
    ctx.font = "700 18px Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, x + width / 2, y + height / 2 + 1);
    ctx.restore();
  }

  function drawGrave(x, y, sealed) {
    ctx.save();
    if (sealed) {
      const glow = ctx.createRadialGradient(x, y + 1, 2, x, y + 1, 34);
      glow.addColorStop(0, "rgba(123, 230, 146, 0.45)");
      glow.addColorStop(1, "rgba(123, 230, 146, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, 34, 0, TAU);
      ctx.fill();
    }

    ctx.fillStyle = sealed ? "#667266" : "#2c2c2d";
    ctx.strokeStyle = sealed ? "#b6d3af" : "#7a7471";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 16, y + 18);
    ctx.lineTo(x - 16, y - 4);
    ctx.quadraticCurveTo(x - 16, y - 22, x, y - 22);
    ctx.quadraticCurveTo(x + 16, y - 22, x + 16, y - 4);
    ctx.lineTo(x + 16, y + 18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    const chipColor = sealed ? "rgba(233, 246, 226, 0.18)" : "rgba(255, 255, 255, 0.1)";
    ctx.fillStyle = chipColor;
    ctx.fillRect(x - 9, y - 12, 5, 2);
    ctx.fillRect(x + 4, y + 8, 7, 2);

    ctx.strokeStyle = sealed ? "rgba(232, 246, 223, 0.7)" : "rgba(210, 207, 198, 0.45)";
    ctx.beginPath();
    ctx.moveTo(x, y - 13);
    ctx.lineTo(x, y + 5);
    ctx.moveTo(x - 7, y - 4);
    ctx.lineTo(x + 7, y - 4);
    ctx.stroke();
    ctx.restore();
  }

  function makeFog() {
    const particles = [];
    for (let i = 0; i < 58; i += 1) {
      particles.push({
        x: Math.random() * W,
        y: HUD + Math.random() * (H - HUD),
        rx: 32 + Math.random() * 62,
        ry: 5 + Math.random() * 13,
        speed: 8 + Math.random() * 22,
        alpha: 0.035 + Math.random() * 0.08,
        tilt: (Math.random() - 0.5) * 0.3,
        color: Math.random() > 0.35 ? "#d8e6d6" : "#e8d4bd",
      });
    }
    return particles;
  }

  function updateFog(dt) {
    for (const p of game.fogParticles) {
      p.x += p.speed * dt;
      p.y += Math.sin(elapsed * 0.7 + p.rx) * dt * 3;
      if (p.x - p.rx > W) {
        p.x = -p.rx;
        p.y = HUD + Math.random() * (H - HUD);
      }
    }
  }

  function laneAt(row) {
    return game.lanes.find((lane) => lane.row === row);
  }

  function carrierUnderPlayer(lane) {
    return lane.entities.find((entity) => {
      if (entity.role !== "carrier") {
        return false;
      }
      return player.x >= entity.x + 8 && player.x <= entity.x + entity.width - 8;
    });
  }

  function hitWaterThreat(lane) {
    const playerY = rowY(player.row) + CELL / 2;
    const size = 28;
    return lane.entities.some((entity) => {
      if (entity.role !== "threat") {
        return false;
      }
      const threatHeight = entity.height || 30;
      const threatY = rowY(lane.row) + CELL / 2 - threatHeight / 2 + 2;
      return rectsOverlap(
        player.x - size / 2,
        playerY - size / 2,
        size,
        size,
        entity.x + 10,
        threatY,
        entity.width - 20,
        threatHeight
      );
    });
  }

  function roadThreatUnderPlayer(lane) {
    const playerY = rowY(player.row) + CELL / 2;
    const size = 28;
    return lane.entities.find((entity) => {
      const threatHeight = entity.height || 36;
      const threatY = rowY(lane.row) + CELL / 2 - threatHeight / 2 + 2;
      return rectsOverlap(
        player.x - size / 2,
        playerY - size / 2,
        size,
        size,
        entity.x + 6,
        threatY,
        entity.width - 12,
        threatHeight
      );
    });
  }

  function addScore(points) {
    game.score += Math.max(0, Math.round(points * game.modifier.scoreMult));
    updateRecords();
  }

  function updateRecords() {
    if (game.score > game.highScore) {
      game.highScore = game.score;
      saveNumber(STORAGE.highScore, game.highScore);
    }

    if (game.level > game.bestLevel) {
      game.bestLevel = game.level;
      saveNumber(STORAGE.bestLevel, game.bestLevel);
    }

    if (statusPanel.recordLabel && statusPanel.recordText) {
      statusPanel.recordLabel.textContent = `Score ${game.score}`;
      statusPanel.recordText.textContent = `Best score ${Math.max(game.highScore, game.score)} | Best night ${game.bestLevel} | ${careerText()}`;
    }
    checkTrophies();
  }

  function updateStatusPanel() {
    if (!statusPanel.modifierLabel || !statusPanel.riteLabel) {
      return;
    }

    if (statusPanel.recordLabel && statusPanel.recordText) {
      statusPanel.recordLabel.textContent = `Score ${game.score}`;
      statusPanel.recordText.textContent = `Best score ${Math.max(game.highScore, game.score)} | Best night ${game.bestLevel} | ${careerText()}`;
    }

    if (game.mode === "menu") {
      statusPanel.modifierLabel.textContent = "Awaiting Nightfall";
      statusPanel.modifierText.textContent = "Begin a run to reveal its curse and escalating dread.";
      statusPanel.riteLabel.textContent = "Awaiting Burial";
      statusPanel.riteText.textContent = "Every two fulfilled rites restore one life.";
      updateControlButtons();
      return;
    }

    const tier = currentDreadTier();
    statusPanel.modifierLabel.textContent = `${game.modifier.name} / ${tier.name}`;
    statusPanel.modifierText.textContent = `${game.modifier.description} ${tier.description}`;

    if (!game.rite) {
      statusPanel.riteLabel.textContent = "Awaiting Burial";
      statusPanel.riteText.textContent = "Complete optional rites for extra score.";
      updateControlButtons();
      return;
    }

    statusPanel.riteLabel.textContent = `${game.rite.name} +${game.rite.reward}`;
    if (game.mode === "levelClear") {
      statusPanel.riteText.textContent = game.rite.complete() ? "Fulfilled. Your bonus has been awarded." : "Missed. A new rite awaits next night.";
    } else if (game.mode === "gameOver") {
      statusPanel.riteText.textContent = "The unfinished rite fades with the dawn.";
    } else if (game.rite.name === "Untouched") {
      statusPanel.riteText.textContent = game.nightDeaths === 0 ? "Unbroken: avoid all damage." : "Broken: survive and chase the next rite.";
    } else if (game.rite.name === "Soul Cache") {
      statusPanel.riteText.textContent = `${game.nightPickups}/${game.pickups.length} charms recovered.`;
    } else if (game.rite.name === "Edge First") {
      statusPanel.riteText.textContent = game.firstGrave === null ? "The first seal must be an outer grave." : game.rite.complete() ? "Outer seal secured. Finish the night." : "Inner grave claimed first; rite missed.";
    } else {
      statusPanel.riteText.textContent = game.rite.detail;
    }

    updateControlButtons();
  }

  function updateControlButtons() {
    document.body.dataset.gameMode = game.mode;
    const briefing = game.mode === "briefing";
    if (beginNightBtn.hidden === briefing) {
      beginNightBtn.hidden = !briefing;
      if (briefing) beginNightBtn.focus({ preventScroll: true });
    }
    const startLabel = game.mode === "paused"
      ? "Resume"
      : game.mode === "briefing"
        ? "Begin"
        : game.mode === "gameOver"
          ? "Retry"
          : "Start";
    const pauseLabel = game.mode === "paused" ? "Resume" : "Pause";

    startActionButtons.forEach((button) => {
      button.textContent = startLabel;
      button.setAttribute("aria-label", `${startLabel} game`);
    });

    pauseActionButtons.forEach((button) => {
      button.textContent = pauseLabel;
      button.setAttribute("aria-pressed", String(game.mode === "paused"));
    });

    actionButtons.forEach((button) => {
      button.disabled = game.mode === "levelClear" && button.dataset.action !== "restart";
    });

    if (quickMenu) {
      const showQuickMenu = game.mode === "menu" || game.mode === "gameOver";
      quickMenu.hidden = !showQuickMenu;
      quickMenu.setAttribute("aria-hidden", String(!showQuickMenu));
    }
  }

  function showMessage(text, seconds) {
    game.message = text;
    game.messageTimer = seconds;
  }

  function rowY(row) {
    return HUD + row * CELL;
  }

  function centerOfCol(col) {
    return col * CELL + CELL / 2;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function capitalize(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  function hash(row, col) {
    return ((row + 11) * 73856093) ^ ((col + 7) * 19349663);
  }

  function roundedRect(x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function loadSprites() {
    return Object.fromEntries(
      Object.entries(ASSET_PATHS).map(([name, src]) => {
        const image = new Image();
        const sprite = {
          image,
          bounds: null,
          ready: false,
        };
        image.onload = () => {
          sprite.bounds = SPRITE_BOUNDS[name] || measureSprite(image);
          sprite.ready = true;
        };
        image.src = src;
        return [name, sprite];
      })
    );
  }

  function canDrawSprite(name) {
    const sprite = sprites[name];
    return Boolean(sprite && sprite.ready && sprite.bounds);
  }

  function drawSprite(name, x, y, width, height, options = {}) {
    const sprite = sprites[name];
    if (!sprite || !sprite.ready || !sprite.bounds) {
      return false;
    }

    const { sx, sy, sw, sh } = sprite.bounds;
    ctx.save();
    ctx.translate(x, y);
    if (options.flipX) {
      ctx.scale(-1, 1);
    }
    if (options.alpha !== undefined) {
      ctx.globalAlpha *= options.alpha;
    }
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sprite.image, sx, sy, sw, sh, -width / 2, -height / 2, width, height);
    ctx.restore();
    return true;
  }

  function measureSprite(image) {
    const scratch = document.createElement("canvas");
    const scratchCtx = scratch.getContext("2d", { willReadFrequently: true });
    scratch.width = image.naturalWidth || image.width;
    scratch.height = image.naturalHeight || image.height;
    scratchCtx.drawImage(image, 0, 0);

    const { width, height } = scratch;
    const pixels = scratchCtx.getImageData(0, 0, width, height).data;
    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const alpha = pixels[(y * width + x) * 4 + 3];
        if (alpha <= 8) {
          continue;
        }
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }

    if (minX > maxX || minY > maxY) {
      return { sx: 0, sy: 0, sw: width, sh: height };
    }

    return {
      sx: Math.max(0, minX - 2),
      sy: Math.max(0, minY - 2),
      sw: Math.min(width, maxX + 3) - Math.max(0, minX - 2),
      sh: Math.min(height, maxY + 3) - Math.max(0, minY - 2),
    };
  }

  function loadNumber(key) {
    try {
      const value = Number(localStorage.getItem(key));
      return Number.isFinite(value) ? value : 0;
    } catch (error) {
      return 0;
    }
  }

  function saveNumber(key, value) {
    try {
      localStorage.setItem(key, String(value));
    } catch (error) {
      // Private browsing or file restrictions can block storage; the game can continue without it.
    }
  }

  function mulberry32(seed) {
    return function random() {
      let t = (seed += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

window.ArcadeUX.registerGame({
  active: () => ["playing","paused","briefing"].includes(game.mode),
  paused: () => game.mode !== "playing",
  pause: value => { if ((game.mode === "paused") !== value) handleAction("pause"); },
  label: () => "Night " + game.level
});
})();
