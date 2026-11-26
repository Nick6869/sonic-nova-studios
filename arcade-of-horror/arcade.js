(() => {
  "use strict";

  const games = [
    {
      id: "hell-climb",
      title: "Hell Climb",
      genre: "Vertical Platformer",
      description: "Leap upward through the inferno before it claims you.",
      art: "hub-assets/hellclimb.webp",
      accent: "#f04bff",
      orientation: "portrait-primary"
    },
    {
      id: "flappy-bat",
      title: "Flappy Bat",
      genre: "Flight Survival",
      description: "Thread your flight through a haunted midnight skyline.",
      art: "hub-assets/flappybat.webp",
      accent: "#53dfff",
      orientation: "portrait-primary"
    },
    {
      id: "void-invaders",
      title: "Void Invaders",
      genre: "Space Shooter",
      description: "Drive an alien nightmare back into the dark between stars.",
      art: "hub-assets/voidinvaders.webp",
      accent: "#8e52ff",
      orientation: "portrait-primary"
    },
    {
      id: "blood-tunnel",
      title: "Blood Tunnel",
      genre: "Endless Runner",
      description: "Dash through a living artery while walls, debris, and stalkers close in.",
      art: "hub-assets/bloodtunnel.webp",
      accent: "#ff4b4b",
      orientation: "portrait-primary"
    },
    {
      id: "bone-breaker",
      title: "Bone Breaker",
      genre: "Brick Breaker",
      description: "Shatter the cursed bone wall and survive the ricochet.",
      art: "hub-assets/bonebreaker.webp",
      accent: "#53dfff",
      orientation: "portrait-primary"
    },
    {
      id: "undead-arena",
      title: "Undead Arena",
      genre: "Top-Down Shooter",
      description: "Hold the line while the dead close in from every side.",
      art: "hub-assets/undeadarena.webp",
      accent: "#f04bff",
      orientation: "landscape-primary"
    },
    {
      id: "horror-snake",
      title: "Serpent Sin",
      genre: "Arcade Survival",
      description: "Feed the curse and grow through the graveyard.",
      art: "hub-assets/serpentsin.webp",
      accent: "#53dfff",
      orientation: "portrait-primary"
    },
    {
      id: "graveyard-crossing",
      title: "Graveyard Crossing",
      genre: "Lane Crossing",
      description: "Cross the cursed road and seal every restless grave.",
      art: "hub-assets/graveyardcrossing.webp",
      accent: "#8e52ff",
      orientation: "portrait-primary"
    }
  ];

  const assetVersion = "v24";
  const storageKey = "arcade-of-horror:last-played";
  const trophyTotals = {
    "hell-climb": 50,
    "flappy-bat": 50,
    "void-invaders": 50,
    "blood-tunnel": 64,
    "bone-breaker": 50,
    "graveyard-crossing": 50,
    "horror-snake": 50,
    "undead-arena": 50
  };
  const trophyStorage = {
    "hell-climb": { key: "hellclimb_trophies_v2", type: "array" },
    "flappy-bat": { key: "flappybat_achievements_v2", type: "object" },
    "void-invaders": { key: "sns:voidInvaders:trophies", type: "array" },
    "blood-tunnel": { key: "bloodTunnelTrophiesV1", type: "array" },
    "bone-breaker": { key: "boneBreakerTrophiesV1", type: "array" },
    "graveyard-crossing": { key: "graveyard-crossing-trophies-v1", type: "array" },
    "horror-snake": { key: "horrorSnakeTrophiesV1", type: "array" },
    "undead-arena": { key: "undead_arena_trophies_v1", type: "array" }
  };
  const gameById = new Map(games.map((game) => [game.id, game]));
  const standaloneMedia = window.matchMedia?.("(display-mode: standalone)");
  const arcadeScreen = document.querySelector("#arcadeScreen");
  const playerScreen = document.querySelector("#playerScreen");
  const grid = document.querySelector("#gameGrid");
  const gameFrame = document.querySelector("#gameFrame");
  const frameShell = document.querySelector("#frameShell");
  const playingTitle = document.querySelector("#playingTitle");
  const loadingTitle = document.querySelector("#loadingTitle");
  const loadingDetail = document.querySelector("#loadingDetail");
  const continueButton = document.querySelector("#continueButton");
  const continueTitle = document.querySelector("#continueTitle");
  const installButton = document.querySelector("#installButton");
  const fullscreenButton = document.querySelector("#fullscreenButton");
  const collectionMastery = document.querySelector("#collectionMastery");
  const collectionRecords = document.querySelector("#collectionRecords");
  const dailyFeatured = document.querySelector("#dailyFeatured");
  const launchScreen = document.querySelector("#launchScreen");
  const launchStatus = document.querySelector("#launchStatus");
  const orientationNotice = document.querySelector("#orientationNotice");
  const orientationDismiss = document.querySelector("#orientationDismiss");
  const orientationTitle = document.querySelector("#orientationTitle");
  const orientationMessage = document.querySelector("#orientationMessage");
  let currentGame = null;
  let deferredInstallPrompt = null;
  let frameLoadTimer = 0;
  let wakeLock = null;
  let orientationNoticeDismissed = readOrientationNoticeDismissal();

  function makeElement(name, className, text) {
    const element = document.createElement(name);
    if (className) {
      element.className = className;
    }
    if (text) {
      element.textContent = text;
    }
    return element;
  }

  function todayKey() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function formatNumber(value) {
    return Number(value || 0).toLocaleString();
  }

  function plural(value, singular, pluralWord = `${singular}s`) {
    return `${formatNumber(value)} ${Number(value) === 1 ? singular : pluralWord}`;
  }

  function getStoredValue(key) {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function readOrientationNoticeDismissal() {
    try {
      return sessionStorage.getItem("arcadeOrientationNoticeDismissed") === "true";
    } catch (error) {
      return false;
    }
  }

  function hasStoredValue(key) {
    return getStoredValue(key) !== null;
  }

  function getStoredNumber(key, fallback = 0) {
    const value = Number(getStoredValue(key));
    return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : fallback;
  }

  function getStoredJson(key, fallback) {
    try {
      const raw = getStoredValue(key);
      if (!raw) {
        return fallback;
      }
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function countStoredArray(key) {
    const value = getStoredJson(key, []);
    return Array.isArray(value) ? value.length : 0;
  }

  function countStoredTruthyObject(key) {
    const value = getStoredJson(key, {});
    return value && !Array.isArray(value) ? Object.values(value).filter(Boolean).length : 0;
  }

  function readTrophyCount(gameId) {
    const config = trophyStorage[gameId];
    if (!config) {
      return 0;
    }
    return config.type === "object" ? countStoredTruthyObject(config.key) : countStoredArray(config.key);
  }

  function trophyProgressText(gameId) {
    return `${readTrophyCount(gameId)}/${trophyTotals[gameId] || 0} trophies`;
  }

  function localCalendarDay() {
    const [year, month, day] = todayKey().split("-").map(Number);
    return Date.UTC(year, month - 1, day);
  }

  function dailyFeaturedGame() {
    const days = Math.floor(localCalendarDay() / 86400000);
    return games[days % games.length];
  }

  function makeProgress(primary, secondary, hasProgress = false, hasRecord = false) {
    return { primary, secondary, hasProgress, hasRecord };
  }

  function readHellClimbProgress() {
    const classicBest = getStoredNumber("hellclimb_best_classic");
    let dailyBest = 0;
    for (let index = 0; index < localStorage.length; index++) {
      const key = localStorage.key(index);
      if (key?.startsWith("hellclimb_best_daily_")) dailyBest = Math.max(dailyBest, getStoredNumber(key));
    }
    const hellBest = getStoredNumber("hellclimb_best_hell");
    const best = Math.max(classicBest, dailyBest, hellBest);
    const souls = getStoredNumber("hellclimb_total_souls_v1");
    const rites = getStoredNumber("hellclimb_total_rites_v1");
    const trophies = countStoredArray("hellclimb_trophies_v2");
    const mode = getStoredValue("hellclimb_mode") || "classic";

    let secondary = `Mode ${mode.charAt(0).toUpperCase()}${mode.slice(1)}`;
    if (souls > 0) {
      secondary = `${plural(souls, "soul")} banked`;
    } else if (rites > 0) {
      secondary = plural(rites, "rite");
    } else if (trophies > 0) {
      secondary = trophyProgressText("hell-climb");
    }

    return makeProgress(`Best height ${formatNumber(best)}`, secondary, best > 0 || souls > 0 || rites > 0, best > 0);
  }

  function readFlappyBatProgress() {
    const best = getStoredNumber("flappybat_highscore");
    const coins = getStoredNumber("flappybat_coins_v1");
    const profile = getStoredJson("flappybat_profile_v1", {});
    const flights = Number(profile.flights) || 0;
    const pillars = Number(profile.pillars) || 0;
    const achievements = getStoredJson("flappybat_achievements_v2", {});
    const unlocked = Object.values(achievements).filter(Boolean).length;
    const selectedExpedition = getStoredValue("flappybat_expedition_v1") || "moonlit";

    let secondary = `Expedition ${selectedExpedition.charAt(0).toUpperCase()}${selectedExpedition.slice(1)}`;
    if (flights > 0) {
      secondary = `${plural(flights, "flight")} | ${plural(pillars, "pillar")} cleared`;
    } else if (coins > 0) {
      secondary = `${plural(coins, "coin")} banked`;
    } else if (unlocked > 0) {
      secondary = trophyProgressText("flappy-bat");
    }

    return makeProgress(`Best score ${formatNumber(best)}`, secondary, best > 0 || flights > 0 || coins > 0, best > 0);
  }

  function readVoidInvadersProgress() {
    const best = Math.max(
      getStoredNumber("sns:voidInvaders:personalHighScore"),
      getStoredNumber("voidInvadersHighScore")
    );
    const trophies = countStoredArray("sns:voidInvaders:trophies");
    const career = getStoredJson("sns:voidInvaders:careerV1", {});
    const runs = Number(career.runs) || 0;
    const secondary = runs > 0
      ? `${plural(runs, "sortie")} | ${formatNumber(career.bosses)} bosses | sector ${formatNumber(career.bestCampaignSector || 1)} | rift ${formatNumber(career.bestRiftEncounter || 0)}`
      : trophies > 0
        ? trophyProgressText("void-invaders")
        : hasStoredValue("sns:voidInvaders:personalHighScore") || hasStoredValue("voidInvadersHighScore")
          ? "Local record saved"
          : "No trophies yet";

    return makeProgress(`Best score ${formatNumber(best)}`, secondary, best > 0 || trophies > 0 || runs > 0, best > 0);
  }

  function readBloodTunnelProgress() {
    const progress = getStoredJson("bloodTunnelProgressV1", {});
    const best = Math.max(getStoredNumber("bloodTunnelBestScore"), Number(progress.bestScore) || 0);
    const runs = Number(progress.runs) || 0;
    const deepest = Number(progress.bestDepth) || 0;
    const shields = Number(progress.shields) || 0;

    let secondary = `Deepest ${formatNumber(deepest)}m`;
    if (runs > 0) {
      secondary = `${plural(runs, "descent")} | ${trophyProgressText("blood-tunnel")}`;
    } else if (shields > 0) {
      secondary = plural(shields, "shield");
    } else if (readTrophyCount("blood-tunnel") > 0) {
      secondary = trophyProgressText("blood-tunnel");
    }

    return makeProgress(`Best score ${formatNumber(best)}`, secondary, best > 0 || runs > 0 || deepest > 0, best > 0);
  }

  function readBoneBreakerProgress() {
    const record = getStoredJson("boneBreakerRecordsV2", {});
    const best = Number(record.bestScore) || 0;
    const wave = Number(record.bestWave) || 0;
    const clears = Number(record.clears) || 0;
    const runs = Number(record.runs) || 0;
    const trophies = readTrophyCount("bone-breaker");
    const secondary = runs > 0
      ? `${plural(runs, "hunt")} | ${formatNumber(record.bricks)} bones | chain x${formatNumber(record.bestCombo)}`
      : clears > 0
        ? `${plural(clears, "clear")} | ${trophyProgressText("bone-breaker")}`
      : trophies > 0
        ? trophyProgressText("bone-breaker")
        : `Best wave ${formatNumber(wave)}`;

    return makeProgress(`Best score ${formatNumber(best)}`, secondary, best > 0 || wave > 0 || clears > 0 || trophies > 0 || runs > 0, best > 0);
  }

  function readGraveyardCrossingProgress() {
    const best = getStoredNumber("graveyard-crossing-high-score");
    const bestLevel = getStoredNumber("graveyard-crossing-best-level", 1);
    const career = getStoredJson("graveyard-crossing-career-v1", {});
    const runs = Number(career.runs) || 0;
    const trophies = readTrophyCount("graveyard-crossing");
    const secondary = runs > 0
      ? `${plural(runs, "crossing")} | ${formatNumber(career.graves)} graves | ${formatNumber(career.rites)} rites`
      : trophies > 0
        ? `Night ${formatNumber(Math.max(1, bestLevel))} | ${trophyProgressText("graveyard-crossing")}`
      : `Best night ${formatNumber(Math.max(1, bestLevel))}`;
    return makeProgress(`High score ${formatNumber(best)}`, secondary, best > 0 || bestLevel > 1 || trophies > 0 || runs > 0, best > 0);
  }

  function readHorrorSnakeProgress() {
    const best = Math.max(
      getStoredNumber("horrorSnakeHighScore"),
      getStoredNumber("horrorSnakeHighScore:classic"),
      getStoredNumber("horrorSnakeHighScore:haunted"),
      getStoredNumber("horrorSnakeHighScore:nightmare")
    );
    const difficulty = getStoredValue("horrorSnakeDifficulty") || "classic";
    const label = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
    const career = getStoredJson("horrorSnakeCareerV1", {});
    const runs = Number(career.runs) || 0;
    const trophies = readTrophyCount("horror-snake");
    const secondary = runs > 0
      ? `${plural(runs, "pact")} | ${formatNumber(career.escapes)} escapes | ${formatNumber(career.brains)} brains`
      : trophies > 0 ? `${trophyProgressText("horror-snake")} | pact ${label}` : `Pact ${label}`;
    return makeProgress(`High score ${formatNumber(best)}`, secondary, best > 0 || hasStoredValue("horrorSnakeDifficulty") || trophies > 0 || runs > 0, best > 0);
  }

  function readUndeadArenaProgress() {
    const best = getStoredNumber("undead_arena_best");
    const career = getStoredJson("undead_arena_career_v1", {});
    const runs = Number(career.runs) || 0;
    const kills = Number(career.kills) || 0;
    const bestLevel = Number(career.bestLevel) || 1;
    const trophies = readTrophyCount("undead-arena");
    const secondary = runs > 0
      ? `${plural(runs, "run")} | wave ${formatNumber(bestLevel)} | ${formatNumber(kills)} kills`
      : trophies > 0
        ? trophyProgressText("undead-arena")
        : hasStoredValue("undead_arena_best") ? "Local record saved" : "No arena record yet";
    return makeProgress(`Best score ${formatNumber(best)}`, secondary, best > 0 || trophies > 0 || runs > 0, best > 0);
  }

  const progressReaders = {
    "hell-climb": readHellClimbProgress,
    "flappy-bat": readFlappyBatProgress,
    "void-invaders": readVoidInvadersProgress,
    "blood-tunnel": readBloodTunnelProgress,
    "bone-breaker": readBoneBreakerProgress,
    "graveyard-crossing": readGraveyardCrossingProgress,
    "horror-snake": readHorrorSnakeProgress,
    "undead-arena": readUndeadArenaProgress
  };

  function readGameProgress(gameId) {
    const reader = progressReaders[gameId];
    if (!reader) {
      return makeProgress("Progress unavailable", "Unknown cabinet", false);
    }
    try {
      return reader();
    } catch (error) {
      return makeProgress("Progress unavailable", "Storage blocked", false);
    }
  }

  function refreshGameProgress() {
    const featured = dailyFeaturedGame();
    const progressById = new Map(games.map(game => [game.id, readGameProgress(game.id)]));
    document.querySelectorAll(".game-card").forEach((card) => {
      const progress = progressById.get(card.dataset.game);
      const primary = card.querySelector("[data-progress-primary]");
      const secondary = card.querySelector("[data-progress-secondary]");
      if (primary) {
        primary.textContent = progress.primary;
      }
      if (secondary) {
        secondary.textContent = progress.secondary;
      }
      card.classList.toggle("has-progress", progress.hasProgress);
      card.classList.toggle("is-daily", card.dataset.game === featured.id);
    });
    refreshCollectionMeta(featured, progressById);
    showLastPlayed(gameById.get(readLastPlayed()));
  }

  function refreshCollectionMeta(featured, progressById) {
    const earnedTrophies = games.reduce((total, game) => total + readTrophyCount(game.id), 0);
    const totalTrophies = games.reduce((total, game) => total + (trophyTotals[game.id] || 0), 0);
    const recordsSet = games.reduce((total, game) => total + (progressById.get(game.id).hasRecord ? 1 : 0), 0);

    if (collectionMastery) {
      collectionMastery.textContent = `${formatNumber(earnedTrophies)}/${formatNumber(totalTrophies)}`;
    }
    if (collectionRecords) {
      collectionRecords.textContent = `${recordsSet}/${games.length}`;
    }
    if (dailyFeatured) {
      dailyFeatured.textContent = `Daily: ${featured.title}`;
    }
  }

  function renderGames() {
    games.forEach((game, index) => {
      const card = makeElement("button", "game-card");
      card.type = "button";
      card.dataset.game = game.id;
      card.dataset.orientation = orientationKind(game);
      card.style.setProperty("--accent", game.accent);
      card.setAttribute("aria-label", `Play ${game.title}`);

      const number = makeElement("span", "card-number", String(index + 1).padStart(2, "0"));
      const recent = makeElement("span", "recent-badge", "Recent");
      const daily = makeElement("span", "daily-badge", "Daily");
      const copy = makeElement("span", "card-copy");
      const genre = makeElement("span", "card-genre", game.genre);
      const title = makeElement("h3", "", game.title);
      const description = makeElement("p", "", game.description);
      const progress = makeElement("span", "card-progress");
      const progressPrimary = makeElement("span", "progress-primary");
      const progressSecondary = makeElement("span", "progress-secondary");
      const play = makeElement("span", "play-label", "Play");

      const image = makeElement("img", "card-art");
      image.src = `${game.art}?${assetVersion}`;
      image.alt = "";
      image.decoding = "async";
      image.loading = index < 2 ? "eager" : "lazy";
      card.append(image);

      progressPrimary.dataset.progressPrimary = "";
      progressSecondary.dataset.progressSecondary = "";
      progress.append(progressPrimary, progressSecondary);
      copy.append(genre, title, description, progress, play);
      card.append(number, recent, daily, copy);
      card.addEventListener("click", () => navigateToGame(game.id, { immersive: true }));
      grid.append(card);
    });

    document.querySelector("#gameCount").textContent = String(games.length).padStart(2, "0");
  }

  function readLastPlayed() {
    try {
      return localStorage.getItem(storageKey);
    } catch (error) {
      return null;
    }
  }

  function rememberGame(game) {
    try {
      localStorage.setItem(storageKey, game.id);
    } catch (error) {
      // Storage is optional when the arcade is opened directly from local files.
    }
    showLastPlayed(game);
  }

  function showLastPlayed(game) {
    continueTitle.textContent = game?.title || "";
    continueButton.hidden = !game;
    if (game) continueButton.dataset.game = game.id;
    else delete continueButton.dataset.game;
    document.querySelectorAll(".game-card").forEach((card) => {
      card.classList.toggle("was-played", card.dataset.game === game?.id);
    });
  }

  function navigateToGame(gameId, options = {}) {
    const game = gameById.get(gameId);
    if (!game) {
      return;
    }

    if (options.immersive) {
      void prepareImmersiveMode(game);
    }

    const targetHash = `#game/${gameId}`;
    if (window.Capacitor?.isNativePlatform?.()) {
      window.history.replaceState(null, "", targetHash);
      openGame(game);
      return;
    }
    if (window.location.hash === targetHash) {
      openGame(game);
      return;
    }

    if (options.replace) {
      window.location.replace(`${window.location.href.split("#")[0]}${targetHash}`);
      return;
    }

    window.location.hash = targetHash;
  }

  function openGame(game) {
    if (!game) {
      showArcade();
      return;
    }

    currentGame = game;
    arcadeScreen.hidden = true;
    playerScreen.hidden = false;
    document.body.classList.add("playing");
    playingTitle.textContent = game.title;
    startFrameLoading(game);

    const gameSrc = `${game.id}/index.html`;
    if (gameFrame.getAttribute("src") !== gameSrc) {
      gameFrame.src = gameSrc;
    } else {
      finishFrameLoading();
    }

    rememberGame(game);
    updateOrientationNotice();
    void requestWakeLock();
    void lockGameOrientation(game);
  }

  function showArcade() {
    arcadeScreen.hidden = false;
    playerScreen.hidden = true;
    document.body.classList.remove("playing");
    refreshGameProgress();
    currentGame = null;
    gameFrame.removeAttribute("src");
    frameShell.classList.add("is-loading");
    hideOrientationNotice();
    clearTimeout(frameLoadTimer);
    void releaseWakeLock();
    unlockGameOrientation();

    if (!isStandaloneDisplay()) {
      void exitFullscreen();
    }
  }

  function route() {
    if (window.location.hash === "#continue") {
      const lastPlayed = readLastPlayed();
      if (lastPlayed && gameById.has(lastPlayed)) {
        navigateToGame(lastPlayed, { replace: true, immersive: isStandaloneDisplay() });
        return;
      }
      window.location.hash = "";
      return;
    }

    const match = window.location.hash.match(/^#game\/([a-z0-9-]+)$/);
    if (match && gameById.has(match[1])) {
      openGame(gameById.get(match[1]));
      return;
    }
    showArcade();
  }

  function startFrameLoading(game) {
    clearTimeout(frameLoadTimer);
    frameShell.classList.add("is-loading");
    loadingTitle.textContent = game.title;
    loadingDetail.textContent = `Preparing ${orientationKind(game)} game view`;
    frameLoadTimer = window.setTimeout(() => {
      loadingDetail.textContent = "Still loading assets from the app bundle";
    }, 5200);
  }

  function finishFrameLoading() {
    clearTimeout(frameLoadTimer);
    frameShell.classList.remove("is-loading");
    if (currentGame) {
      gameFrame.title = `${currentGame.title} game`;
    }
  }

  function orientationKind(game) {
    if (!game?.orientation || game.orientation === "any") {
      return "any";
    }
    return game.orientation.startsWith("landscape") ? "landscape" : "portrait";
  }

  function currentOrientationKind() {
    return window.innerWidth > window.innerHeight ? "landscape" : "portrait";
  }

  function isTouchSizedViewport() {
    return (
      window.matchMedia?.("(pointer: coarse)").matches ||
      Math.min(window.innerWidth, window.innerHeight) < 760
    );
  }

  function updateOrientationNotice() {
    if (!currentGame || !orientationNotice) {
      hideOrientationNotice();
      return;
    }

    if (orientationNoticeDismissed) {
      hideOrientationNotice();
      return;
    }

    const expected = orientationKind(currentGame);
    const mismatch =
      expected !== "any" && expected !== currentOrientationKind() && isTouchSizedViewport();

    if (!mismatch) {
      hideOrientationNotice();
      return;
    }

    orientationTitle.textContent = expected === "landscape" ? "Landscape recommended" : "Portrait recommended";
    orientationMessage.textContent =
      expected === "landscape"
        ? "This cabinet is tuned for sideways play. Rotate for the cleanest controls."
        : "This cabinet is tuned for upright play. Rotate for the cleanest controls.";
    orientationNotice.hidden = false;
  }

  function hideOrientationNotice() {
    if (orientationNotice) {
      orientationNotice.hidden = true;
    }
  }

  function dismissOrientationNotice() {
    orientationNoticeDismissed = true;
    try {
      sessionStorage.setItem("arcadeOrientationNoticeDismissed", "true");
    } catch (error) {
      // Ignore storage failures; the in-memory dismissal still works.
    }
    hideOrientationNotice();
  }

  function isStandaloneDisplay() {
    return Boolean(standaloneMedia?.matches || window.navigator.standalone);
  }

  function shouldAutoFullscreen() {
    if (window.Capacitor?.isNativePlatform?.()) return false;
    return isStandaloneDisplay() || window.matchMedia?.("(pointer: coarse) and (max-width: 920px)").matches;
  }

  async function prepareImmersiveMode(game) {
    if (shouldAutoFullscreen()) {
      await enterFullscreen();
    }
    await lockGameOrientation(game);
    await requestWakeLock();
  }

  async function enterFullscreen() {
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      return true;
    }

    const root = document.documentElement;
    try {
      if (root.requestFullscreen) {
        await root.requestFullscreen({ navigationUI: "hide" });
        return true;
      }
      if (root.webkitRequestFullscreen) {
        root.webkitRequestFullscreen();
        return true;
      }
    } catch (error) {
      return false;
    }

    return false;
  }

  async function exitFullscreen() {
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
        return;
      }
      if (document.webkitFullscreenElement && document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    } catch (error) {
      // Browser chrome can reject exit calls during navigation changes.
    }
  }

  function syncFullscreenState() {
    const isFullscreen = Boolean(document.fullscreenElement || document.webkitFullscreenElement);
    document.body.classList.toggle("is-fullscreen", isFullscreen);
    document.body.classList.toggle("is-standalone", isStandaloneDisplay());
    fullscreenButton.setAttribute("aria-pressed", String(isFullscreen));
    fullscreenButton.textContent = isFullscreen ? "Exit" : "Fullscreen";
  }

  async function lockGameOrientation(game) {
    if (window.Capacitor?.isNativePlatform?.() || !game || game.orientation === "any" || !screen.orientation?.lock) {
      return;
    }

    try {
      await screen.orientation.lock(game.orientation);
    } catch (error) {
      updateOrientationNotice();
    }
  }

  function unlockGameOrientation() {
    try {
      screen.orientation?.unlock?.();
    } catch (error) {
      // Orientation unlock is best-effort and unavailable in several browsers.
    }
  }

  async function requestWakeLock() {
    if (!currentGame || !navigator.wakeLock || wakeLock) {
      return;
    }

    try {
      wakeLock = await navigator.wakeLock.request("screen");
      wakeLock.addEventListener("release", () => {
        wakeLock = null;
      });
    } catch (error) {
      wakeLock = null;
    }
  }

  async function releaseWakeLock() {
    if (!wakeLock) {
      return;
    }

    try {
      await wakeLock.release();
    } catch (error) {
      // The lock may already be gone after a visibility change.
    } finally {
      wakeLock = null;
    }
  }

  function updateLaunchStatus(message) {
    if (launchStatus) {
      launchStatus.textContent = message;
    }
  }

  function finishLaunch() {
    if (!launchScreen) {
      return;
    }

    window.setTimeout(() => {
      launchScreen.setAttribute("aria-busy", "false");
      launchScreen.classList.add("is-hidden");
      document.body.classList.remove("app-booting");

      window.setTimeout(() => {
        launchScreen.hidden = true;
      }, 320);
    }, 520);
  }

  function connectOfflineTools(worker) {
    const tools = document.querySelector("#offlineTools");
    const button = document.querySelector("#offlineButton");
    const status = document.querySelector("#offlineStatus");
    let downloading = false;
    let ready = false;

    function refreshButton() {
      button.disabled = ready || downloading || !navigator.onLine;
      if (ready) button.textContent = "Available offline";
    }

    function request(type, onMessage) {
      const channel = new MessageChannel();
      channel.port1.onmessage = ({ data }) => {
        onMessage(data);
        if (data.complete === undefined) channel.port1.close();
      };
      worker.postMessage({ type }, [channel.port2]);
    }

    tools.hidden = false;
    refreshButton();
    window.addEventListener("online", refreshButton);
    window.addEventListener("offline", refreshButton);
    request("offline-status", state => { ready = state.ready; refreshButton(); });
    button.addEventListener("click", () => {
      downloading = true;
      refreshButton();
      status.textContent = "Downloading all eight cabinets…";
      request("download-offline", state => {
        if (state.complete !== undefined) {
          status.textContent = "Downloaded " + state.complete + " of " + state.total + " files";
          return;
        }
        downloading = false;
        ready = Boolean(state.ready);
        status.textContent = state.error || "All eight cabinets are ready to play offline.";
        refreshButton();
      });
    });
  }

  async function registerServiceWorker() {
    if (window.Capacitor?.isNativePlatform?.()) {
      try {
        if ("serviceWorker" in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map((registration) => registration.unregister()));
        }
        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(keys.filter((key) => key.startsWith("arcade-of-horror-")).map((key) => caches.delete(key)));
        }
      } catch (error) {}
      updateLaunchStatus("Game bundle ready");
      return;
    }

    if (!("serviceWorker" in navigator) || window.location.protocol === "file:") {
      updateLaunchStatus("Ready for local app testing");
      return;
    }

    try {
      await navigator.serviceWorker.register("sw.js?v=36", { scope: "./" });
      const registration = await navigator.serviceWorker.ready;
      updateLaunchStatus("Arcade ready");
      if (registration.active) connectOfflineTools(registration.active);
    } catch (error) {
      updateLaunchStatus("Game bundle ready");
    }
  }

  async function promptInstall() {
    if (!deferredInstallPrompt) {
      installButton.hidden = true;
      return;
    }

    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice.catch(() => null);
    deferredInstallPrompt = null;
    installButton.hidden = true;
  }

  function returnToArcade() {
    const url = new URL(window.location.href);
    url.hash = "";
    window.history.replaceState(null, "", url);
    showArcade();
  }

  window.arcadeHandleAndroidBack = () => {
    const currentDocument = currentGame ? gameFrame.contentDocument : document;
    const openDialogs = currentDocument?.querySelectorAll("dialog[open]");
    if (openDialogs?.length) {
      openDialogs[openDialogs.length - 1].close();
      return true;
    }
    if (!currentGame) return false;
    const menuBack = currentDocument?.querySelector(".aoh-menu-expanded .aoh-menu-back");
    if (menuBack?.getClientRects().length) menuBack.click();
    else returnToArcade();
    return true;
  };

  document.querySelector("#backButton").addEventListener("click", returnToArcade);

  fullscreenButton.addEventListener("click", async () => {
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      await exitFullscreen();
      return;
    }
    await enterFullscreen();
    if (currentGame) {
      await lockGameOrientation(currentGame);
    }
  });

  continueButton.addEventListener("click", () => {
    navigateToGame(continueButton.dataset.game, { immersive: true });
  });

  installButton.addEventListener("click", () => {
    void promptInstall();
  });

  orientationDismiss?.addEventListener("click", dismissOrientationNotice);
  gameFrame.addEventListener("load", finishFrameLoading);

  window.addEventListener("hashchange", route);
  window.addEventListener("focus", refreshGameProgress);
  window.addEventListener("storage", refreshGameProgress);
  window.addEventListener("arcade-save-changed", refreshGameProgress);
  window.addEventListener("resize", updateOrientationNotice);
  window.addEventListener("orientationchange", updateOrientationNotice);
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    installButton.hidden = false;
  });
  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    installButton.hidden = true;
    document.body.classList.add("is-standalone");
  });
  document.addEventListener("fullscreenchange", syncFullscreenState);
  document.addEventListener("webkitfullscreenchange", syncFullscreenState);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && currentGame) {
      void requestWakeLock();
    }
  });
  screen.orientation?.addEventListener?.("change", updateOrientationNotice);
  standaloneMedia?.addEventListener?.("change", syncFullscreenState);

  syncFullscreenState();
  renderGames();
  refreshGameProgress();
  route();
  void registerServiceWorker();
  finishLaunch();
})();
