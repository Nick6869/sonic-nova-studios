(() => {
  "use strict";

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  const W = canvas.width;
  const H = canvas.height;
  const HUD = 48;
  const CELL = 48;
  const COLS = 15;
  const ROWS = 15;
  const TAU = Math.PI * 2;
  const GRAVE_COLS = [1, 4, 7, 10, 13];
  const SAFE_ROWS = [1, 5, 9, 13, 14];

  const STORAGE = {
    highScore: "graveyard-crossing-high-score",
    bestLevel: "graveyard-crossing-best-level",
  };

  const modifiers = [
    {
      name: "Open Graves",
      fog: 0.35,
      scoreMult: 1,
      speedMult: 0.92,
      extraHazards: 0,
      timeShift: 8,
    },
    {
      name: "Blood Moon",
      fog: 0.55,
      scoreMult: 1.12,
      speedMult: 1.08,
      extraHazards: 0,
      timeShift: 0,
    },
    {
      name: "Thick Fog",
      fog: 1,
      scoreMult: 1.2,
      speedMult: 0.98,
      extraHazards: 0,
      timeShift: -3,
    },
    {
      name: "Restless Dead",
      fog: 0.72,
      scoreMult: 1.25,
      speedMult: 1.12,
      extraHazards: 1,
      timeShift: -5,
    },
    {
      name: "Witching Wind",
      fog: 0.62,
      scoreMult: 1.15,
      speedMult: 1.18,
      extraHazards: 0,
      timeShift: 0,
    },
    {
      name: "Starless Night",
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
    rng: mulberry32(Date.now() >>> 0),
    message: "Press start",
    messageTimer: 0,
    transitionTimer: 0,
    moveCooldown: 0,
    shake: 0,
    streak: 0,
    attemptBestRow: ROWS - 1,
    fogParticles: makeFog(),
  };

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

  prepareMenuScene();
  requestAnimationFrame(frame);

  document.addEventListener("keydown", onKeyDown);
  canvas.addEventListener("click", onCanvasClick);
  canvas.addEventListener("touchstart", onTouchStart, { passive: false });
  canvas.addEventListener("touchend", onTouchEnd, { passive: false });

  document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => handleAction(button.dataset.action));
  });

  function frame(now) {
    const dt = Math.min(0.035, (now - lastTime) / 1000 || 0);
    lastTime = now;
    elapsed += dt;

    update(dt);
    draw();

    requestAnimationFrame(frame);
  }

  function update(dt) {
    updateFog(dt);

    if (game.messageTimer > 0) {
      game.messageTimer -= dt;
    }

    if (game.moveCooldown > 0) {
      game.moveCooldown -= dt;
    }

    if (game.shake > 0) {
      game.shake = Math.max(0, game.shake - dt * 18);
    }

    if (player.invulnerable > 0) {
      player.invulnerable -= dt;
    }

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
      loseLife("The midnight bell claimed you");
      return;
    }

    updateLanes(dt);
    carryPlayer(dt);
    collectPickups();
    checkCurrentTile();
  }

  function startRun() {
    game.mode = "playing";
    game.level = 1;
    game.score = 0;
    game.lives = 3;
    game.streak = 0;
    game.runSeed = (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
    player.ward = false;
    startLevel();
  }

  function startLevel() {
    game.rng = mulberry32((game.runSeed + game.level * 2654435761) >>> 0);
    game.graves = new Set();
    game.modifier = pickModifier();
    game.levelTime = Math.max(38, 78 - game.level * 2 + game.modifier.timeShift);
    game.time = game.levelTime;
    game.lanes = buildLanes();
    game.pickups = buildPickups();
    game.attemptBestRow = ROWS - 1;
    resetPlayer(false);
    showMessage(`Night ${game.level}: ${game.modifier.name}`, 2.4);
    game.mode = "playing";
    updateRecords();
  }

  function prepareMenuScene() {
    game.rng = mulberry32((Date.now() ^ 0x9e3779b9) >>> 0);
    game.level = Math.max(1, game.bestLevel);
    game.modifier = modifiers[0];
    game.lanes = buildLanes();
    game.pickups = [];
    game.graves = new Set();
    resetPlayer(false);
    game.mode = "menu";
  }

  function pickModifier() {
    if (game.level === 1) {
      return modifiers[0];
    }
    const index = 1 + Math.floor(game.rng() * (modifiers.length - 1));
    return modifiers[index];
  }

  function buildLanes() {
    const levelSpeed = Math.min(1.95, 0.9 + game.level * 0.065) * game.modifier.speedMult;
    const extra = game.modifier.extraHazards;
    const templates = [
      { row: 2, kind: "swamp", speed: 64, width: 132, count: 3, look: "coffin" },
      { row: 3, kind: "swamp", speed: -82, width: 112, count: 4, look: "coffin" },
      { row: 4, kind: "swamp", speed: 96, width: 154, count: 2 + extra, look: "coffin" },
      { row: 6, kind: "road", speed: -110, width: 94, count: 3 + extra, look: "hearse" },
      { row: 7, kind: "road", speed: 138, width: 76, count: 4, look: "shade" },
      { row: 8, kind: "road", speed: -156, width: 118, count: 2 + extra, look: "carriage" },
      { row: 10, kind: "road", speed: 118, width: 82, count: 3 + extra, look: "reaper" },
      { row: 11, kind: "road", speed: -142, width: 102, count: 3, look: "hearse" },
      { row: 12, kind: "road", speed: 176, width: 74, count: 4 + extra, look: "shade" },
    ];

    return templates.map((lane) => {
      const laneCopy = {
        ...lane,
        speed: lane.speed * levelSpeed,
        entities: [],
      };
      const spacing = W / lane.count;
      const offset = game.rng() * spacing;
      for (let i = 0; i < lane.count; i += 1) {
        const variedWidth = lane.width + (game.rng() - 0.5) * 18;
        let x = i * spacing + offset + (game.rng() - 0.5) * 34;
        if (lane.speed < 0) {
          x = W - x;
        }
        laneCopy.entities.push({
          x,
          width: Math.max(62, variedWidth),
          wobble: game.rng() * TAU,
          tint: game.rng(),
        });
      }
      return laneCopy;
    });
  }

  function buildPickups() {
    const pickups = [];
    const count = game.level === 1 ? 1 : 2;
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

    if (lane.kind === "road" && hitRoadThreat(lane)) {
      loseLife("Something crossed your path");
    } else if (lane.kind === "swamp" && !carrierUnderPlayer(lane)) {
      loseLife("Dark water pulled you under");
    }
  }

  function movePlayer(direction) {
    if (game.mode !== "playing" || game.moveCooldown > 0) {
      return;
    }

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
    game.streak += 1;
    addScore(240 + Math.floor(game.time * 5) + game.streak * 60);
    showMessage(`Grave sealed ${game.graves.size}/5`, 1.5);

    if (game.graves.size >= GRAVE_COLS.length) {
      finishLevel();
      return;
    }

    resetPlayer(true);
  }

  function finishLevel() {
    const levelBonus = 600 + game.level * 120 + Math.floor(game.time * 10);
    addScore(levelBonus);
    game.mode = "levelClear";
    game.transitionTimer = 2.2;
    game.streak += 1;
    showMessage(`Night ${game.level} survived`, 2.2);
    updateRecords();
  }

  function loseLife(reason) {
    if (player.invulnerable > 0 || game.mode !== "playing") {
      return;
    }

    if (player.ward) {
      player.ward = false;
      resetPlayer(true);
      player.invulnerable = 1.2;
      game.shake = 3;
      game.streak = 0;
      showMessage(`Ward shattered: ${reason}`, 1.7);
      return;
    }

    game.lives -= 1;
    game.streak = 0;
    game.shake = 5;

    if (game.lives <= 0) {
      game.mode = "gameOver";
      showMessage("Game over", 2);
      updateRecords();
      return;
    }

    resetPlayer(true);
    player.invulnerable = 1.4;
    showMessage(reason, 1.7);
  }

  function resetPlayer(resetTimer) {
    player.x = centerOfCol(7);
    player.row = ROWS - 1;
    player.pulse = 1;
    if (resetTimer) {
      game.time = game.levelTime;
      game.attemptBestRow = ROWS - 1;
    }
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

      pickup.collected = true;
      if (pickup.type === "ward") {
        player.ward = true;
        addScore(80);
        showMessage("Lantern ward lit", 1.35);
      } else if (pickup.type === "time") {
        game.time = Math.min(game.levelTime, game.time + 12);
        addScore(65);
        showMessage("Time reclaimed", 1.35);
      } else {
        addScore(180);
        showMessage("Relic recovered", 1.35);
      }
    }
  }

  function handleAction(action) {
    if (action === "start") {
      if (game.mode === "menu" || game.mode === "gameOver") {
        startRun();
      } else if (game.mode === "paused") {
        game.mode = "playing";
        showMessage("Back into the dark", 1);
      }
      return;
    }

    if (action === "pause") {
      if (game.mode === "playing") {
        game.mode = "paused";
      } else if (game.mode === "paused") {
        game.mode = "playing";
        showMessage("Back into the dark", 1);
      }
      return;
    }

    if (action === "restart") {
      startRun();
      return;
    }

    movePlayer(action);
  }

  function onKeyDown(event) {
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
    if (game.mode === "menu" || game.mode === "gameOver" || game.mode === "paused") {
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

  function draw() {
    ctx.save();
    if (game.shake > 0) {
      const amount = game.shake;
      ctx.translate((Math.random() - 0.5) * amount, (Math.random() - 0.5) * amount);
    }

    drawBackground();
    drawBoard();
    drawPickups();
    drawEntities();
    drawPlayer();
    drawFog();
    drawHud();
    drawVignette();

    if (game.mode === "menu") {
      drawMenu();
    } else if (game.mode === "paused") {
      drawCurtain("Paused", "Press start to return");
    } else if (game.mode === "levelClear") {
      drawCurtain("Night survived", "The graves are quiet for now");
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

    ctx.save();
    ctx.globalAlpha = 0.24;
    for (let i = 0; i < 18; i += 1) {
      const x = (i * 97 + 33) % W;
      const h = 34 + ((i * 19) % 90);
      ctx.fillStyle = i % 3 === 0 ? "#241126" : "#102015";
      ctx.fillRect(x, H - HUD - h, 8 + (i % 5) * 5, h);
    }
    ctx.restore();
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
  }

  function drawTargetRow(y) {
    const grad = ctx.createLinearGradient(0, y, 0, y + CELL);
    grad.addColorStop(0, "#101e14");
    grad.addColorStop(1, "#071008");
    ctx.fillStyle = grad;
    ctx.fillRect(0, y, W, CELL);

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
      drawGrave(x, y + 25, sealed);
    }
  }

  function drawSwampRow(y, row) {
    const grad = ctx.createLinearGradient(0, y, 0, y + CELL);
    grad.addColorStop(0, row % 2 ? "#102019" : "#0b1b15");
    grad.addColorStop(1, "#03110d");
    ctx.fillStyle = grad;
    ctx.fillRect(0, y, W, CELL);

    ctx.strokeStyle = "rgba(113, 184, 136, 0.18)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 9; i += 1) {
      const x = (i * 91 + row * 19 + elapsed * 18) % (W + 80) - 40;
      const yy = y + 13 + ((i * 17 + row * 7) % 24);
      ctx.beginPath();
      ctx.ellipse(x, yy, 25, 5, 0, 0, TAU);
      ctx.stroke();
    }
  }

  function drawRoadRow(y, row) {
    const grad = ctx.createLinearGradient(0, y, 0, y + CELL);
    grad.addColorStop(0, row % 2 ? "#171116" : "#1a1210");
    grad.addColorStop(1, "#090708");
    ctx.fillStyle = grad;
    ctx.fillRect(0, y, W, CELL);

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
  }

  function drawSafeRow(y, row) {
    const grad = ctx.createLinearGradient(0, y, 0, y + CELL);
    grad.addColorStop(0, row === 14 ? "#1a2015" : "#151b11");
    grad.addColorStop(1, row === 14 ? "#0a110a" : "#070c07");
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
      }
    }

    if (row === 14) {
      ctx.fillStyle = "rgba(255, 213, 129, 0.08)";
      ctx.fillRect(0, y, W, 4);
    }
  }

  function drawEntities() {
    for (const lane of game.lanes) {
      for (const entity of lane.entities) {
        if (lane.kind === "swamp") {
          drawCoffin(entity, lane);
        } else if (lane.look === "hearse") {
          drawHearse(entity, lane);
        } else if (lane.look === "shade") {
          drawShade(entity, lane);
        } else if (lane.look === "carriage") {
          drawCarriage(entity, lane);
        } else {
          drawReaper(entity, lane);
        }
      }
    }
  }

  function drawCoffin(entity, lane) {
    const y = rowY(lane.row);
    const x = entity.x;
    const h = 30;
    const yy = y + 9 + Math.sin(entity.wobble) * 2;

    ctx.save();
    ctx.translate(x, yy);
    ctx.fillStyle = "#27150d";
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
    ctx.fillStyle = "#080608";
    roundedRect(0, 7, entity.width, 25, 5);
    ctx.fill();
    ctx.fillStyle = "#1f1421";
    roundedRect(dir > 0 ? entity.width * 0.48 : 8, 0, entity.width * 0.42, 19, 4);
    ctx.fill();
    ctx.fillStyle = "rgba(151, 222, 181, 0.75)";
    ctx.fillRect(dir > 0 ? entity.width - 14 : 6, 12, 6, 8);
    ctx.fillStyle = "#171717";
    ctx.beginPath();
    ctx.arc(18, 33, 7, 0, TAU);
    ctx.arc(entity.width - 18, 33, 7, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#302a30";
    ctx.fillRect(0, 28, entity.width, 5);
    ctx.restore();
  }

  function drawShade(entity, lane) {
    const y = rowY(lane.row) + 8 + Math.sin(entity.wobble) * 4;
    const x = entity.x;
    const h = 32;

    ctx.save();
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
    ctx.restore();
  }

  function drawCarriage(entity, lane) {
    const y = rowY(lane.row) + 10;
    const x = entity.x;

    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "#211119";
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
    ctx.restore();
  }

  function drawReaper(entity, lane) {
    const y = rowY(lane.row) + 5 + Math.sin(entity.wobble) * 2;
    const x = entity.x;

    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "#060606";
    ctx.beginPath();
    ctx.moveTo(entity.width * 0.5, 0);
    ctx.quadraticCurveTo(entity.width * 0.82, 12, entity.width - 6, 38);
    ctx.lineTo(8, 38);
    ctx.quadraticCurveTo(entity.width * 0.18, 12, entity.width * 0.5, 0);
    ctx.fill();
    ctx.fillStyle = "rgba(184, 233, 174, 0.8)";
    ctx.fillRect(entity.width * 0.45, 15, 5, 5);
    ctx.fillRect(entity.width * 0.55, 15, 5, 5);
    ctx.strokeStyle = "rgba(219, 214, 190, 0.72)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(entity.width - 10, 3);
    ctx.lineTo(entity.width - 22, 38);
    ctx.quadraticCurveTo(entity.width - 38, 2, entity.width - 6, 3);
    ctx.stroke();
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
    const flicker = 0.85 + Math.sin(elapsed * 9) * 0.08 + Math.sin(elapsed * 17) * 0.05;
    player.pulse = Math.max(0, player.pulse - 0.08);

    if (player.invulnerable > 0 && Math.floor(elapsed * 18) % 2 === 0) {
      return;
    }

    ctx.save();
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

    ctx.translate(x, y);
    const scale = 1 + player.pulse * 0.12;
    ctx.scale(scale, scale);
    ctx.fillStyle = "#2b1726";
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
    ctx.fillStyle = "#ffd982";
    roundedRect(10, -1, 9, 13, 3);
    ctx.fill();
    ctx.strokeStyle = "#4b2e1d";
    ctx.lineWidth = 2;
    ctx.strokeRect(11, 1, 7, 9);
    ctx.restore();
  }

  function drawHud() {
    ctx.fillStyle = "rgba(5, 4, 5, 0.95)";
    ctx.fillRect(0, 0, W, HUD);
    ctx.strokeStyle = "rgba(255, 170, 100, 0.22)";
    ctx.beginPath();
    ctx.moveTo(0, HUD - 0.5);
    ctx.lineTo(W, HUD - 0.5);
    ctx.stroke();

    ctx.fillStyle = "#f5e9d3";
    ctx.font = "700 17px Georgia, serif";
    ctx.textBaseline = "middle";
    ctx.fillText(`SCORE ${game.score}`, 16, 23);
    ctx.fillText(`NIGHT ${game.level}`, 154, 23);
    ctx.fillText(`LIVES ${game.lives}`, 263, 23);

    const wardX = 342;
    ctx.fillStyle = player.ward ? "#ffda7b" : "rgba(245, 233, 211, 0.35)";
    ctx.fillText(player.ward ? "WARD ON" : "WARD --", wardX, 23);

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
    drawCurtainBase(0.76);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillStyle = "#ffe8db";
    ctx.font = "700 48px Georgia, serif";
    ctx.fillText("GRAVEYARD", W / 2, 210);
    ctx.fillText("CROSSING", W / 2, 262);

    ctx.font = "20px Georgia, serif";
    ctx.fillStyle = "#d9c6b4";
    ctx.fillText("Seal all five graves before dawn breaks your nerve.", W / 2, 314);

    drawMenuButton(W / 2 - 98, 360, 196, 48, "START NIGHT");

    ctx.font = "17px Georgia, serif";
    ctx.fillStyle = "#cfe1c9";
    ctx.fillText(`High Score ${game.highScore}`, W / 2, 445);
    ctx.fillText(`Best Night ${game.bestLevel}`, W / 2, 475);

    ctx.font = "15px Georgia, serif";
    ctx.fillStyle = "rgba(255, 232, 219, 0.72)";
    ctx.fillText("Arrow keys, WASD, swipe, or the D-pad", W / 2, 535);
    ctx.fillText("Collect wards and relics. Coffins float. Everything else bites.", W / 2, 562);
    ctx.textAlign = "start";
  }

  function drawGameOver() {
    drawCurtainBase(0.8);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffe8db";
    ctx.font = "700 46px Georgia, serif";
    ctx.fillText("THE NIGHT WON", W / 2, 245);
    ctx.font = "22px Georgia, serif";
    ctx.fillStyle = "#e7d6c2";
    ctx.fillText(`Score ${game.score}`, W / 2, 306);
    ctx.fillText(`High Score ${game.highScore}`, W / 2, 340);
    ctx.fillText(`Best Night ${game.bestLevel}`, W / 2, 374);
    drawMenuButton(W / 2 - 104, 430, 208, 48, "TRY AGAIN");
    ctx.textAlign = "start";
  }

  function drawCurtain(title, subtitle) {
    drawCurtainBase(0.68);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffe8db";
    ctx.font = "700 44px Georgia, serif";
    ctx.fillText(title.toUpperCase(), W / 2, 302);
    ctx.font = "20px Georgia, serif";
    ctx.fillStyle = "#ddcfc2";
    ctx.fillText(subtitle, W / 2, 350);
    ctx.textAlign = "start";
  }

  function drawCurtainBase(alpha) {
    ctx.save();
    ctx.fillStyle = `rgba(5, 4, 5, ${alpha})`;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(255, 202, 130, 0.24)";
    ctx.lineWidth = 2;
    roundedRect(130, 150, W - 260, 470, 8);
    ctx.stroke();
    ctx.restore();
  }

  function drawMenuButton(x, y, width, height, label) {
    const pulse = 0.6 + Math.sin(elapsed * 4) * 0.18;
    ctx.save();
    ctx.shadowColor = `rgba(255, 196, 112, ${pulse})`;
    ctx.shadowBlur = 18;
    const grad = ctx.createLinearGradient(x, y, x, y + height);
    grad.addColorStop(0, "#59362d");
    grad.addColorStop(1, "#20100f");
    ctx.fillStyle = grad;
    roundedRect(x, y, width, height, 8);
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
      return player.x >= entity.x + 8 && player.x <= entity.x + entity.width - 8;
    });
  }

  function hitRoadThreat(lane) {
    const playerY = rowY(player.row) + CELL / 2;
    const size = 28;
    return lane.entities.some((entity) => {
      const threatY = rowY(lane.row) + 8;
      return rectsOverlap(
        player.x - size / 2,
        playerY - size / 2,
        size,
        size,
        entity.x + 4,
        threatY,
        entity.width - 8,
        34
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
})();
