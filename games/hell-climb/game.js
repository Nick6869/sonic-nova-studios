// Hell Climb (standalone) - Difficulty Curve v2 + Daily Run + Guaranteed Variety
// Reachability patch: horizontal distance now depends on vertical gap.

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const heightEl = document.getElementById("height");
const bestEl = document.getElementById("best");
const restartBtn = document.getElementById("restart");

const modeBtn = document.getElementById("modeBtn");
const modeBadge = document.getElementById("modeBadge");
const dailyDateEl = document.getElementById("dailyDate");

const overlay = document.getElementById("overlay");
const finalEl = document.getElementById("final");
const playAgainBtn = document.getElementById("playAgain");

let keys = {};
let gameTime = 0;
let animationId = null;

let score = 0;
let isGameOver = false;

// -------------------- Tuning --------------------
const MOVE_SPEED = 5;
const JUMP_FORCE = 9;
const GRAVITY = 0.25;

const PLATFORM_W = 60;
const PLATFORM_H = 20;

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

// Jump height estimate (for safe gap caps)
function maxJumpHeightPx() {
  return (JUMP_FORCE * JUMP_FORCE) / (2 * GRAVITY);
}
const SAFE_GAP = Math.min(120, Math.floor(maxJumpHeightPx() * 0.62));

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
  // Conservative cap; keep some margin for human reaction + collision window.
  const t = timeToReachOnDescent(deltaUpPx);
  const raw = MOVE_SPEED * t * 0.85;
  return clamp(raw, 90, 260);
}

// -------------------- Modes / Bests --------------------
const MODE_KEY = "hellclimb_mode";
let mode = localStorage.getItem(MODE_KEY) || "classic"; // "classic" | "daily"

function pad2(n) { return String(n).padStart(2, "0"); }
function todayLocalStr() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function classicBestKey() { return "hellclimb_best_classic"; }
function dailyBestKey(dateStr) { return `hellclimb_best_daily_${dateStr}`; }

function getBestForMode() {
  if (mode === "daily") return Number(localStorage.getItem(dailyBestKey(todayLocalStr())) || 0);
  return Number(localStorage.getItem(classicBestKey()) || 0);
}
function setBestForMode(val) {
  if (mode === "daily") localStorage.setItem(dailyBestKey(todayLocalStr()), String(val));
  else localStorage.setItem(classicBestKey(), String(val));
}

let best = getBestForMode();
bestEl.textContent = String(best);

function updateModeUI() {
  if (mode === "daily") {
    modeBadge.textContent = "DAILY";
    dailyDateEl.hidden = false;
    dailyDateEl.textContent = todayLocalStr();
  } else {
    modeBadge.textContent = "CLASSIC";
    dailyDateEl.hidden = true;
  }
  best = getBestForMode();
  bestEl.textContent = String(best);
}
updateModeUI();

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

// -------------------- Difficulty Curve (v2) --------------------
function difficultyForHeight(h) {
  if (h < 200) {
    return { breakP: 0.00, moveP: 0.00, moveSpeed: 0.0, maxGap: 95, maxDX: 210 };
  }
  if (h < 600) {
    return { breakP: 0.06, moveP: 0.18, moveSpeed: 1.35, maxGap: 105, maxDX: 230 };
  }
  if (h < 1200) {
    return { breakP: 0.10, moveP: 0.30, moveSpeed: 1.55, maxGap: 112, maxDX: 240 };
  }
  if (h < 2000) {
    return { breakP: 0.14, moveP: 0.40, moveSpeed: 1.75, maxGap: Math.min(SAFE_GAP, 116), maxDX: 248 };
  }
  return { breakP: 0.18, moveP: 0.48, moveSpeed: 2.0, maxGap: Math.min(SAFE_GAP, 118), maxDX: 255 };
}

// -------------------- Audio --------------------
let audioCtx = null;
let masterGain = null;

function initAudio() {
  if (audioCtx) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  audioCtx = new AC();
  masterGain = audioCtx.createGain();
  masterGain.gain.value = 0.15;
  masterGain.connect(audioCtx.destination);
}

function beep(freq, dur = 0.08, type = "sine") {
  if (!audioCtx) return;
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
}

function screenShake() {
  canvas.style.transform = `translate(${Math.random() * 10 - 5}px, ${Math.random() * 10 - 5}px)`;
  setTimeout(() => (canvas.style.transform = "none"), 200);
}

function updateUI() {
  heightEl.textContent = String(score);
  bestEl.textContent = String(best);
}

function showGameOver() {
  isGameOver = true;
  finalEl.textContent = String(score);

  if (score > best) {
    best = score;
    setBestForMode(best);
    updateUI();
  }

  restartBtn.classList.add("show");
  overlay.hidden = false;
}

// ==========================================================
// GAME STATE
// ==========================================================

let t_player = { x: 300, y: 500, vx: 0, vy: 0, w: 40, h: 40 };
let t_platforms = [];
let t_maxHeight = 0;

function isUsablePlatform(p) {
  return !(p.type === "break" && p.broken);
}

function getHighestUsablePlatform() {
  let bestP = null;
  for (const p of t_platforms) {
    if (!isUsablePlatform(p)) continue;
    if (!bestP || p.y < bestP.y) bestP = p;
  }
  return bestP;
}

// ---- Guarantees ----
function chooseTypeWithGuarantees(virtualHeight, index, breakStreak, rngRoll, diff) {
  const forceMove = (virtualHeight >= 600 && index % 7 === 0);
  const forceBreak = (virtualHeight >= 900 && index % 10 === 0);

  if (forceBreak && breakStreak === 0) return "break";
  if (forceMove) return "moving";

  let breakP = diff.breakP;
  if (breakStreak >= 1) breakP *= 0.25;

  if (rngRoll < breakP) return "break";
  if (rngRoll < breakP + diff.moveP) return "moving";
  return "normal";
}

// ---- Daily generator (deterministic layout) ----
let dailyRng = null;
let dailyGen = null;

function resetDailyGenerator() {
  dailyRng = makeDailyRng();
  dailyGen = {
    lastY: 600,
    lastX: 270,
    breakStreak: 0,
    index: 0,
  };
}

function nextDailyPlatform() {
  const minGap = 55;

  const virtualHeight = Math.floor((600 - dailyGen.lastY) / 10);
  const diff = difficultyForHeight(virtualHeight);

  const maxGap = Math.max(minGap + 10, Math.min(diff.maxGap, SAFE_GAP));
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
    vx = dir * diff.moveSpeed;
  }

  if (type === "break") dailyGen.breakStreak++;
  else dailyGen.breakStreak = 0;

  dailyGen.lastY = y;
  dailyGen.lastX = x;

  return { x, y, w: PLATFORM_W, h: PLATFORM_H, type, vx, broken: false, id: nextIndex };
}

// ---- Classic generator (non-deterministic, but still guaranteed variety + horizontal reach) ----
let classicSpawnIndex = 0;
let classicBreakStreak = 0;

function generateClassicPlatform(y, prevX, gapUp) {
  const virtualHeight = Math.floor((600 - y) / 10);
  const diff = difficultyForHeight(virtualHeight);

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
    vx = dir * diff.moveSpeed;
  }

  if (type === "break") classicBreakStreak++;
  else classicBreakStreak = 0;

  return { x, y, w: PLATFORM_W, h: PLATFORM_H, type, vx, broken: false };
}

// Classic-only: patch gaps if breaks create weird holes.
// Now also inserts platforms close enough horizontally for the gap size.
function enforceReachableGapsClassic() {
  const usable = t_platforms
    .filter(isUsablePlatform)
    .filter((p) => p.y > -300 && p.y < canvas.height + 200)
    .sort((a, b) => a.y - b.y);

  if (usable.length < 2) return;

  for (let i = 0; i < usable.length - 1; i++) {
    const top = usable[i];
    const bottom = usable[i + 1];
    const gap = bottom.y - top.y;

    if (gap > SAFE_GAP) {
      const insertGapUp = SAFE_GAP * 0.78;
      const newY = top.y + insertGapUp;

      const dxCap = dxCapForGap(insertGapUp);
      const targetX = (Math.random() < 0.7) ? top.x : bottom.x;

      const x = clamp(targetX + (Math.random() * 2 - 1) * Math.min(140, dxCap), 0, canvas.width - PLATFORM_W);

      t_platforms.push({ x, y: newY, w: PLATFORM_W, h: PLATFORM_H, type: "normal", vx: 0, broken: false });
      return;
    }
  }
}

function initTower() {
  isGameOver = false;
  score = 0;
  t_maxHeight = 0;
  updateUI();

  t_player = { x: 300, y: 500, vx: 0, vy: -8, w: 40, h: 40 };
  t_platforms = [];

  restartBtn.classList.remove("show");
  overlay.hidden = true;

  const base = { x: 270, y: 600, w: PLATFORM_W, h: PLATFORM_H, type: "normal", vx: 0, broken: false };
  t_platforms.push(base);

  if (mode === "daily") {
    resetDailyGenerator();
    dailyGen.lastY = 600;
    dailyGen.lastX = 270;

    while (dailyGen.lastY > 0) {
      t_platforms.push(nextDailyPlatform());
    }
  } else {
    classicSpawnIndex = 0;
    classicBreakStreak = 0;

    let y = 600;
    let prevX = base.x;

    while (y > 0) {
      const virtualHeight = Math.floor((600 - y) / 10);
      const diff = difficultyForHeight(virtualHeight);

      const minGap = 55;
      const maxGap = Math.max(minGap + 10, Math.min(diff.maxGap, SAFE_GAP));
      const gap = minGap + Math.random() * (maxGap - minGap);

      y -= gap;

      const p = generateClassicPlatform(y, prevX, gap);
      prevX = p.x;
      t_platforms.push(p);
    }
  }
}

function updateTower() {
  if (keys["ArrowLeft"]) t_player.vx = -MOVE_SPEED;
  else if (keys["ArrowRight"]) t_player.vx = MOVE_SPEED;
  else t_player.vx *= 0.6;

  t_player.x += t_player.vx;

  if (t_player.x > canvas.width) t_player.x = -t_player.w;
  if (t_player.x < -t_player.w) t_player.x = canvas.width;

  t_player.vy += GRAVITY;
  t_player.y += t_player.vy;

  if (t_player.y < 300) {
    const diff = 300 - t_player.y;
    t_player.y = 300;

    if (t_player.vy < 0) {
      for (const p of t_platforms) p.y += diff;
      t_maxHeight += diff;
      score = Math.floor(t_maxHeight / 10);
      updateUI();
    }
  }

  for (const p of t_platforms) {
    if (p.type === "moving") {
      p.x += p.vx;
      if (p.x < 0 || p.x + p.w > canvas.width) p.vx *= -1;
    }
  }

  if (t_player.vy > 0) {
    for (let i = 0; i < t_platforms.length; i++) {
      const p = t_platforms[i];
      if (!isUsablePlatform(p)) continue;

      if (
        t_player.x + 30 > p.x &&
        t_player.x + 10 < p.x + p.w &&
        t_player.y + t_player.h > p.y &&
        t_player.y + t_player.h < p.y + p.h + 15
      ) {
        if (p.type === "break") {
          p.broken = true;
          playSound("dig");

          // Classic: remove broken + spawn replacement so RNG can't brick the run
          if (mode === "classic") {
            const deadX = p.x;
            t_platforms.splice(i, 1);
            i--;

            const highest = getHighestUsablePlatform();
            if (highest) {
              const virtualHeight = Math.floor((600 - highest.y) / 10);
              const d2 = difficultyForHeight(virtualHeight);

              const minGap = 55;
              const maxGap = Math.max(minGap + 10, Math.min(d2.maxGap, SAFE_GAP));
              const gap = minGap + Math.random() * (maxGap - minGap);
              const newY = highest.y - gap;

              t_platforms.push(generateClassicPlatform(newY, deadX, gap));
            }
          }
        } else {
          t_player.vy = -JUMP_FORCE;
          playSound("jump");
        }
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
          const virtualHeight = Math.floor((600 - highest.y) / 10);
          const d2 = difficultyForHeight(virtualHeight);

          const minGap = 55;
          const maxGap = Math.max(minGap + 10, Math.min(d2.maxGap, SAFE_GAP));
          const gap = minGap + Math.random() * (maxGap - minGap);
          const newY = highest.y - gap;

          t_platforms.push(generateClassicPlatform(newY, highest.x, gap));
        }
      }
    }
  }

  if (mode === "classic") enforceReachableGapsClassic();

  if (t_player.y > canvas.height) {
    playSound("death");
    screenShake();
    showGameOver();
  }
}

function drawTower() {
  const level = Math.floor(score / 200);
  const schemes = [
    ["#1a0000", "#330000"],
    ["#0f0500", "#2b1100"],
    ["#000f00", "#001f00"],
    ["#00001a", "#000033"],
    ["#1a001a", "#2b002b"],
    ["#000000", "#111111"],
  ];

  const currentScheme = schemes[Math.min(level, schemes.length - 1)];
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, currentScheme[0]);
  grad.addColorStop(1, currentScheme[1]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(255, 100, 0, 0.2)";
  for (let i = 0; i < 10; i++) {
    const px = (gameTime * (i + 1)) % canvas.width;
    const py = canvas.height - ((gameTime * (i + 1)) % canvas.height);
    ctx.fillRect(px, py, 2, 2);
  }

  for (const p of t_platforms) drawHellPlatform(p);
  drawHellGhost(t_player.x, t_player.y, t_player.w, t_player.h, t_player.vx);

  ctx.fillStyle = "white";
  ctx.font = "20px VT323";
  ctx.fillText("HEIGHT: " + score, 70, 30);
}

function drawHellPlatform(p) {
  const { x, y, w, h } = p;

  if (p.type === "normal") {
    ctx.fillStyle = "#5d4037";
    ctx.beginPath();
    ctx.moveTo(x + 10, y);
    ctx.lineTo(x + w - 10, y);
    ctx.lineTo(x + w, y + 10);
    ctx.lineTo(x + w - 5, y + h);
    ctx.lineTo(x + 5, y + h);
    ctx.lineTo(x, y + 10);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "#3e2723";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#000";
    ctx.fillRect(x + w / 2 - 2, y + 5, 4, 10);
    ctx.fillRect(x + w / 2 - 5, y + 7, 10, 4);
  } else if (p.type === "moving") {
    ctx.fillStyle = "rgba(150, 255, 255, 0.55)";
    ctx.beginPath();
    ctx.arc(x + 10, y + 10, 10, 0, Math.PI * 2);
    ctx.arc(x + 30, y + 5, 12, 0, Math.PI * 2);
    ctx.arc(x + 50, y + 10, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#000";
    ctx.fillRect(x + 25, y + 8, 2, 2);
    ctx.fillRect(x + 35, y + 8, 2, 2);
  } else if (p.type === "break") {
    if (p.broken) return;

    ctx.fillStyle = "#ddd";
    ctx.beginPath();
    ctx.moveTo(x, y + 5);
    ctx.lineTo(x + w, y + 5);
    ctx.lineWidth = 8;
    ctx.strokeStyle = "#ddd";
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x, y + 5, 6, 0, Math.PI * 2);
    ctx.arc(x + w, y + 5, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y);
    ctx.lineTo(x + w / 2 - 3, y + 10);
    ctx.stroke();
  }
}

function drawHellGhost(x, y, w, h, vx) {
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  if (vx < 0) ctx.scale(-1, 1);

  ctx.fillStyle = "#fff";
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

  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.arc(5, -5, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(12, -5, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(8, 2, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ---------- loop ----------
function gameLoop() {
  gameTime++;
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  if (!isGameOver) updateTower();
  drawTower();

  animationId = requestAnimationFrame(gameLoop);
}

function startGame() {
  keys = {};
  gameTime = 0;

  if (animationId) cancelAnimationFrame(animationId);

  best = getBestForMode();
  updateUI();

  initTower();
  gameLoop();
}

// ---------- input ----------
window.addEventListener("keydown", (e) => {
  initAudio();
  if (e.key === "ArrowLeft" || e.key === "ArrowRight") e.preventDefault();
  keys[e.key] = true;
});

window.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

// click/touch: left half = left, right half = right
let pointerDown = false;
canvas.addEventListener("pointerdown", (e) => {
  initAudio();
  pointerDown = true;
  canvas.setPointerCapture(e.pointerId);
  handlePointer(e);
});
canvas.addEventListener("pointermove", (e) => {
  if (!pointerDown) return;
  handlePointer(e);
});
canvas.addEventListener("pointerup", () => {
  pointerDown = false;
  keys["ArrowLeft"] = false;
  keys["ArrowRight"] = false;
});

function handlePointer(e) {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  if (x < rect.width / 2) {
    keys["ArrowLeft"] = true;
    keys["ArrowRight"] = false;
  } else {
    keys["ArrowLeft"] = false;
    keys["ArrowRight"] = true;
  }
}

// ---------- UI buttons ----------
restartBtn.addEventListener("click", () => {
  initAudio();
  startGame();
});

playAgainBtn.addEventListener("click", () => {
  initAudio();
  isGameOver = false;
  startGame();
});

modeBtn.addEventListener("click", () => {
  initAudio();
  mode = (mode === "classic") ? "daily" : "classic";
  localStorage.setItem(MODE_KEY, mode);
  updateModeUI();

  isGameOver = false;
  startGame();
});

// boot
startGame();
