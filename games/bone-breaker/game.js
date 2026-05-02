// Bone Breaker - Horror Breakout with brick types, levels, powerups, and cursed drops

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const livesEl = document.getElementById("lives");
const powerEl = document.getElementById("power");
const restartBtn = document.getElementById("restart");

const overlay = document.getElementById("overlay");
const overTitle = document.getElementById("over-title");
const finalScoreEl = document.getElementById("final-score");
const playAgainBtn = document.getElementById("play-again");

// -------------------- Core State --------------------
let keys = {};
let score = 0;
let lives = 3;
let isGameOver = false;

// Mouse/touch paddle control
let mouseX = -1;

// Small visual polish
let particles = [];
let scorePops = [];
let shakeTimer = 0;

// -------------------- Audio (simple synth) --------------------
let audioCtx = null;
let masterGain = null;

function initAudio() {
  if (audioCtx) return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  audioCtx = new AudioContext();
  masterGain = audioCtx.createGain();
  masterGain.gain.value = 0.18;
  masterGain.connect(audioCtx.destination);
}

function playSound(kind = "hit") {
  if (!audioCtx) return;

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
    win:    { f: 660, dur: 0.14, type: "triangle" },
  };
  const s = map[kind] || map.hit;

  o.type = s.type;
  o.frequency.setValueAtTime(s.f, now);

  if (kind === "curse") {
    o.frequency.exponentialRampToValueAtTime(45, now + s.dur);
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

let wideTimer = 0;
let tinyTimer = 0;

const BRICK_TYPES = {
  bone: {
    name: "Bone",
    hp: 1,
    score: 10,
    fill: "#7a2d2d",
    fill2: "#4a1717",
    stroke: "#210909",
    icon: "🦴",
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
    icon: "☠",
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
    icon: "💀",
    text: "#190a0a",
    powerChance: 0.24
  },
  cursed: {
    name: "Cursed",
    hp: 1,
    score: 20,
    fill: "#4e176d",
    fill2: "#1b0826",
    stroke: "#c271ff",
    icon: "✦",
    text: "#ead1ff",
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
    icon: "⚰",
    text: "#f1c27d",
    powerChance: 0.18
  }
};

const POWERUP_INFO = {
  multi: {
    name: "Multi Ball",
    icon: "💀💀",
    color: "#f2edf8",
    good: true
  },
  wide: {
    name: "Wide Paddle",
    icon: "⚰",
    color: "#f0c36a",
    good: true
  },
  tiny: {
    name: "Cursed Paddle",
    icon: "✦",
    color: "#d284ff",
    good: false
  }
};

function updateUI() {
  scoreEl.textContent = `Score: ${score}`;
  livesEl.textContent = `Lives: ${lives}`;

  if (powerEl) {
    const active = [];

    if (wideTimer > 0) {
      active.push(`Wide ${Math.ceil(wideTimer / 1000)}s`);
    }

    if (tinyTimer > 0) {
      active.push(`Cursed ${Math.ceil(tinyTimer / 1000)}s`);
    }

    powerEl.textContent = active.length ? `Power: ${active.join(" | ")}` : "Power: None";
  }
}

function showOverlay(title) {
  overTitle.textContent = title;
  finalScoreEl.textContent = String(score);
  overlay.classList.remove("hidden");
  overlay.setAttribute("aria-hidden", "false");
  isGameOver = true;
}

function hideOverlay() {
  overlay.classList.add("hidden");
  overlay.setAttribute("aria-hidden", "true");
}

function getDesiredPaddleWidth() {
  if (tinyTimer > 0) return 72;
  if (wideTimer > 0) return 160;
  return 100;
}

function resizePaddle(targetW) {
  const center = bb_paddle.x + bb_paddle.w / 2;
  bb_paddle.w = targetW;
  bb_paddle.x = Math.max(0, Math.min(canvas.width - bb_paddle.w, center - bb_paddle.w / 2));
}

function makeBall(speed, active = false) {
  return {
    x: canvas.width / 2,
    y: bb_paddle.y - 20,
    r: 8,
    vx: speed,
    vy: -speed,
    active,
    speed
  };
}

function getBrickType(row, col, level) {
  if (level >= 5 && row === 0 && (col === 0 || col === 7)) return "coffin";
  if (level >= 5 && row === 1 && (col === 2 || col === 5)) return "coffin";
  if (level >= 4 && (row + col + level) % 7 === 0) return "cursed";
  if (level >= 3 && (row * 3 + col + level) % 6 === 0) return "skull";
  if (level >= 2 && (row + col + level) % 4 === 0) return "cracked";
  return "bone";
}

function createBrick(row, col, typeKey) {
  const type = BRICK_TYPES[typeKey];

  return {
    x: BB_OFFSET_X + col * (BB_BRICK_W + BB_PADDING),
    y: BB_OFFSET_Y + row * (BB_BRICK_H + BB_PADDING),
    type: typeKey,
    hp: type.hp,
    maxHp: type.hp,
    status: 1,
    pulse: Math.random() * Math.PI * 2
  };
}

function initBreaker(nextLevel = false) {
  if (!nextLevel) {
    score = 0;
    lives = 3;
    bb_level = 1;
    wideTimer = 0;
    tinyTimer = 0;
    particles = [];
    scorePops = [];
    shakeTimer = 0;
    isGameOver = false;
    hideOverlay();
  } else {
    bb_level++;
  }

  const baseW = getDesiredPaddleWidth();
  bb_paddle = { x: canvas.width / 2 - baseW / 2, y: 600, w: baseW, h: 15 };
  bb_powerups = [];

  let speed = 3.5 + bb_level * 0.5;
  speed = Math.min(speed, 9);

  bb_balls = [makeBall(speed, false)];

  bb_bricks = [];
  const rows = Math.min(8, 1 + bb_level);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < BB_COLS; c++) {
      const typeKey = getBrickType(r, c, bb_level);
      bb_bricks.push(createBrick(r, c, typeKey));
    }
  }

  updateUI();
}

function spawnPowerup(x, y, brick) {
  const typeData = BRICK_TYPES[brick.type];
  const chance = typeData.powerChance || 0.12;

  if (Math.random() > chance) return;

  let type = Math.random() > 0.5 ? "multi" : "wide";

  if (typeData.cursed) {
    type = Math.random() < 0.7 ? "tiny" : type;
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
  let launched = false;

  bb_balls.forEach(b => {
    if (!b.active) {
      b.active = true;
      launched = true;
    }
  });

  if (launched) playSound("bounce");
}

function addMultiBall() {
  if (bb_balls.length === 0) return;

  const ref = bb_balls.find(b => b.active) || bb_balls[0];
  const speed = ref.speed;

  const makeExtraBall = (angle) => ({
    x: ref.x,
    y: ref.y,
    r: 8,
    vx: Math.cos(angle) * speed,
    vy: -Math.abs(Math.sin(angle) * speed),
    active: true,
    speed
  });

  bb_balls.push(makeExtraBall(Math.PI * (0.28 + Math.random() * 0.06)));
  bb_balls.push(makeExtraBall(Math.PI * (0.72 - Math.random() * 0.06)));

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

function ballBrickCollision(ball, brick) {
  const closestX = Math.max(brick.x, Math.min(ball.x, brick.x + BB_BRICK_W));
  const closestY = Math.max(brick.y, Math.min(ball.y, brick.y + BB_BRICK_H));
  const dx = ball.x - closestX;
  const dy = ball.y - closestY;
  return (dx * dx + dy * dy) <= ball.r * ball.r;
}

function bounceBallOffBrick(ball, brick) {
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
}

function damageBrick(brick) {
  const typeData = BRICK_TYPES[brick.type];

  brick.hp -= 1;

  if (brick.hp <= 0) {
    brick.status = 0;
    score += typeData.score;
    addScorePop(brick.x + BB_BRICK_W / 2, brick.y + BB_BRICK_H / 2, `+${typeData.score}`, typeData.text);
    addParticles(brick.x + BB_BRICK_W / 2, brick.y + BB_BRICK_H / 2, typeData.text, brick.type === "coffin" ? 18 : 12);
    spawnPowerup(brick.x, brick.y, brick);
    shakeTimer = Math.max(shakeTimer, brick.type === "coffin" ? 160 : 90);
    playSound(brick.type === "cursed" ? "curse" : "hit");
  } else {
    score += 3;
    addScorePop(brick.x + BB_BRICK_W / 2, brick.y + BB_BRICK_H / 2, "+3", "#f0c36a");
    addParticles(brick.x + BB_BRICK_W / 2, brick.y + BB_BRICK_H / 2, "#f0c36a", 8);
    shakeTimer = Math.max(shakeTimer, 70);
    playSound("crack");
  }

  updateUI();
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
  if (shakeTimer > 0) {
    shakeTimer = Math.max(0, shakeTimer - dt);
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.05;
    p.life -= dt;

    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }

  for (let i = scorePops.length - 1; i >= 0; i--) {
    const s = scorePops[i];
    s.y -= 0.45;
    s.life -= dt;

    if (s.life <= 0) {
      scorePops.splice(i, 1);
    }
  }
}

function updateBreaker(dt) {
  updateEffects(dt);

  if (keys["ArrowLeft"] && bb_paddle.x > 0) bb_paddle.x -= 8;
  if (keys["ArrowRight"] && bb_paddle.x < canvas.width - bb_paddle.w) bb_paddle.x += 8;

  if (mouseX >= 0) {
    bb_paddle.x = Math.max(0, Math.min(canvas.width - bb_paddle.w, mouseX - bb_paddle.w / 2));
  }

  if (wideTimer > 0) {
    wideTimer = Math.max(0, wideTimer - dt);
  }

  if (tinyTimer > 0) {
    tinyTimer = Math.max(0, tinyTimer - dt);
  }

  const desiredWidth = getDesiredPaddleWidth();
  if (bb_paddle.w !== desiredWidth) {
    resizePaddle(desiredWidth);
  }

  updateUI();

  for (let i = bb_powerups.length - 1; i >= 0; i--) {
    const p = bb_powerups[i];
    p.y += p.vy;
    p.spin += 0.04;

    const caught =
      p.y >= bb_paddle.y &&
      p.y <= bb_paddle.y + bb_paddle.h + 10 &&
      p.x >= bb_paddle.x &&
      p.x <= bb_paddle.x + bb_paddle.w;

    if (caught) {
      if (p.type === "multi") addMultiBall();
      if (p.type === "wide") setWidePaddle();
      if (p.type === "tiny") setTinyPaddle();

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
      continue;
    }

    b.x += b.vx;
    b.y += b.vy;

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

    const inPaddleY = b.y + b.r >= bb_paddle.y && b.y - b.r <= bb_paddle.y + bb_paddle.h;
    const inPaddleX = b.x >= bb_paddle.x && b.x <= bb_paddle.x + bb_paddle.w;

    if (inPaddleY && inPaddleX && b.vy > 0) {
      const relativeHit = (b.x - (bb_paddle.x + bb_paddle.w / 2)) / (bb_paddle.w / 2);
      const maxAngle = Math.PI / 3;
      const angle = relativeHit * maxAngle;

      b.vx = Math.sin(angle) * b.speed;
      b.vy = -Math.cos(angle) * b.speed;

      b.y = bb_paddle.y - b.r - 1;
      playSound("bounce");
    }

    for (let j = 0; j < bb_bricks.length; j++) {
      const brick = bb_bricks[j];
      if (brick.status !== 1) continue;

      if (ballBrickCollision(b, brick)) {
        damageBrick(brick);
        bounceBallOffBrick(b, brick);
        break;
      }
    }

    if (b.y - b.r > canvas.height) {
      bb_balls.splice(i, 1);
    }
  }

  if (bb_balls.length === 0) {
    lives -= 1;
    updateUI();
    playSound("lose");
    shakeTimer = 350;

    if (lives <= 0) {
      showOverlay("GAME OVER");
      return;
    }

    let speed = 3.5 + bb_level * 0.5;
    speed = Math.min(speed, 9);
    bb_balls = [makeBall(speed, false)];
  }

  const remaining = bb_bricks.some(b => b.status === 1);

  if (!remaining) {
    playSound("win");
    addScorePop(canvas.width / 2, canvas.height / 2, "CRYPT CLEARED", "#f0c36a");
    initBreaker(true);
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

function drawBackground(now) {
  const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
  g.addColorStop(0, "#100914");
  g.addColorStop(0.45, "#07060a");
  g.addColorStop(1, "#020203");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.globalAlpha = 0.72;
  ctx.fillStyle = "#d8d0b8";
  ctx.beginPath();
  ctx.arc(500, 82, 38, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 0.18;
  ctx.fillStyle = "#9d1027";
  ctx.beginPath();
  ctx.arc(485, 76, 9, 0, Math.PI * 2);
  ctx.arc(515, 92, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.17;
  for (let i = 0; i < 6; i++) {
    const y = 190 + i * 58 + Math.sin(now * 0.001 + i) * 6;
    ctx.fillStyle = i % 2 ? "#b36bff" : "#d9233f";
    ctx.fillRect(0, y, canvas.width, 2);
  }
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.22;
  for (let i = 0; i < 45; i++) {
    const x = (i * 97 + now * 0.018) % canvas.width;
    const y = (i * 43 + now * 0.024) % canvas.height;
    ctx.fillStyle = i % 2 ? "#f2edf8" : "#7df2a4";
    ctx.fillRect(x, y, 2, 2);
  }
  ctx.restore();

  drawGraveyardSilhouette(now);
}

function drawGraveyardSilhouette(now) {
  ctx.save();

  ctx.globalAlpha = 0.8;
  ctx.fillStyle = "#050304";
  ctx.fillRect(0, 575, canvas.width, 75);

  for (let i = 0; i < 11; i++) {
    const x = i * 64 + 10;
    const y = 565 + Math.sin(now * 0.001 + i) * 2;
    const h = 24 + (i % 3) * 8;

    ctx.fillStyle = "#070506";
    roundedRect(x, y, 28, h, 10);
    ctx.fill();

    if (i % 2 === 0) {
      ctx.fillRect(x + 12, y - 18, 5, 18);
      ctx.fillRect(x + 6, y - 11, 17, 4);
    }
  }

  ctx.restore();
}

function drawBrick(brick, now) {
  const typeData = BRICK_TYPES[brick.type];
  const pulse = Math.sin(now * 0.006 + brick.pulse) * 0.5 + 0.5;

  ctx.save();

  if (brick.type === "cursed") {
    ctx.shadowColor = "#b36bff";
    ctx.shadowBlur = 8 + pulse * 10;
  }

  if (brick.type === "skull") {
    ctx.shadowColor = "#f2edf8";
    ctx.shadowBlur = 6;
  }

  const grad = ctx.createLinearGradient(brick.x, brick.y, brick.x, brick.y + BB_BRICK_H);
  grad.addColorStop(0, typeData.fill);
  grad.addColorStop(1, typeData.fill2);

  ctx.fillStyle = grad;
  roundedRect(brick.x, brick.y, BB_BRICK_W, BB_BRICK_H, 6);
  ctx.fill();

  ctx.strokeStyle = typeData.stroke;
  ctx.lineWidth = 2;
  ctx.stroke();

  if (brick.hp < brick.maxHp) {
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

  ctx.fillStyle = typeData.text;
  ctx.font = brick.type === "cursed" ? "18px VT323" : "17px VT323";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(typeData.icon, brick.x + BB_BRICK_W / 2, brick.y + BB_BRICK_H / 2 + 1);

  if (brick.maxHp > 1) {
    ctx.fillStyle = "#fff4d8";
    ctx.font = "14px VT323";
    ctx.textAlign = "right";
    ctx.fillText(String(brick.hp), brick.x + BB_BRICK_W - 6, brick.y + BB_BRICK_H - 5);
  }

  ctx.restore();
}

function drawPowerups(now) {
  ctx.save();
  ctx.font = "21px VT323";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  bb_powerups.forEach(p => {
    const info = POWERUP_INFO[p.type];
    const bob = Math.sin(now * 0.008 + p.spin) * 2;

    ctx.shadowColor = info.good ? "#f0c36a" : "#b36bff";
    ctx.shadowBlur = 12;
    ctx.fillStyle = info.color;

    ctx.beginPath();
    ctx.arc(p.x, p.y + bob, 16, 0, Math.PI * 2);
    ctx.fillStyle = p.type === "tiny" ? "#2b0d3d" : "#231019";
    ctx.fill();

    ctx.strokeStyle = info.color;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = info.color;
    ctx.fillText(info.icon, p.x, p.y + bob + 1);
  });

  ctx.restore();
}

function drawPaddle() {
  ctx.save();

  const grad = ctx.createLinearGradient(bb_paddle.x, bb_paddle.y, bb_paddle.x, bb_paddle.y + bb_paddle.h);
  grad.addColorStop(0, tinyTimer > 0 ? "#4e176d" : "#6b3d2a");
  grad.addColorStop(1, tinyTimer > 0 ? "#180821" : "#2a140e");

  ctx.shadowColor = tinyTimer > 0 ? "#b36bff" : "#d9233f";
  ctx.shadowBlur = tinyTimer > 0 ? 14 : 7;

  ctx.fillStyle = grad;
  roundedRect(bb_paddle.x, bb_paddle.y, bb_paddle.w, bb_paddle.h, 6);
  ctx.fill();

  ctx.strokeStyle = tinyTimer > 0 ? "#c271ff" : "#f0c36a";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "#f6c177";
  ctx.font = "18px VT323";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(tinyTimer > 0 ? "✦" : "⚰️", bb_paddle.x + bb_paddle.w / 2, bb_paddle.y + 13);

  ctx.restore();
}

function drawBalls() {
  bb_balls.forEach(b => {
    ctx.save();

    ctx.shadowColor = "#f2edf8";
    ctx.shadowBlur = 10;

    ctx.fillStyle = "#f2edf8";
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.arc(b.x - 2.2, b.y - 1.2, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(b.x + 2.2, b.y - 1.2, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#d9233f";
    ctx.fillRect(b.x - 1, b.y + 3, 2, 2);

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

function drawBreaker() {
  const now = performance.now();

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();

  if (shakeTimer > 0) {
    const amount = Math.min(6, shakeTimer / 45);
    ctx.translate((Math.random() - 0.5) * amount, (Math.random() - 0.5) * amount);
  }

  drawBackground(now);

  bb_bricks.forEach(brick => {
    if (brick.status === 1) {
      drawBrick(brick, now);
    }
  });

  drawPowerups(now);
  drawPaddle();
  drawBalls();
  drawParticles();
  drawScorePops();

  ctx.fillStyle = "#f0c36a";
  ctx.font = "23px VT323";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.shadowColor = "#000";
  ctx.shadowBlur = 6;
  ctx.fillText(`WAVE: ${bb_level}`, 18, 30);

  ctx.fillStyle = "#c7bdd8";
  ctx.font = "18px VT323";
  ctx.fillText("THE WALL OF BONES WAKES", 18, 52);

  if (anyBallUnlaunched() && !isGameOver) {
    ctx.fillStyle = "#ffffff";
    ctx.font = "27px VT323";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.shadowColor = "#d9233f";
    ctx.shadowBlur = 14;
    ctx.fillText("PRESS SPACE OR CLICK/TAP TO BREAK THE CRYPT", canvas.width / 2, 405);
  }

  ctx.restore();
}

// -------------------- Loop --------------------
let last = performance.now();

function loop(now) {
  const dt = Math.min(32, now - last);
  last = now;

  if (!isGameOver) updateBreaker(dt);
  drawBreaker();

  requestAnimationFrame(loop);
}

// -------------------- Input --------------------
window.addEventListener("keydown", (e) => {
  keys[e.key] = true;

  if (e.key === " " || e.code === "Space") {
    initAudio();
    launchBalls();
    e.preventDefault();
  }
});

window.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

canvas.addEventListener("mousemove", (e) => {
  const r = canvas.getBoundingClientRect();
  mouseX = (e.clientX - r.left) * (canvas.width / r.width);
});

canvas.addEventListener("mouseleave", () => {
  mouseX = -1;
});

canvas.addEventListener("touchstart", (e) => {
  initAudio();

  const r = canvas.getBoundingClientRect();
  const t = e.touches[0];
  mouseX = (t.clientX - r.left) * (canvas.width / r.width);

  launchBalls();
  e.preventDefault();
}, { passive: false });

canvas.addEventListener("touchmove", (e) => {
  const r = canvas.getBoundingClientRect();
  const t = e.touches[0];
  mouseX = (t.clientX - r.left) * (canvas.width / r.width);

  e.preventDefault();
}, { passive: false });

canvas.addEventListener("mousedown", () => {
  initAudio();
  launchBalls();
});

restartBtn.addEventListener("click", () => {
  initAudio();
  initBreaker(false);
});

playAgainBtn.addEventListener("click", () => {
  initAudio();
  initBreaker(false);
});

// -------------------- Start --------------------
updateUI();
initBreaker(false);
requestAnimationFrame(loop);