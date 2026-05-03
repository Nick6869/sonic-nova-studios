// Void Invaders (standalone)
// Mobile-ready version
// Visual upgrade pass 2: improved background + drawn enemies

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const restartBtn = document.getElementById('restart');

const overlay = document.getElementById('overlay');
const overTitle = document.getElementById('over-title');
const finalScoreEl = document.getElementById('final-score');
const playAgainBtn = document.getElementById('play-again');

const hintEl = document.querySelector('.hint');

const GAME_WIDTH = 600;
const GAME_HEIGHT = 650;

let keys = {};
let score = 0;
let lives = 3;
let isGameOver = false;
let gameFrame = 0;

canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

canvas.tabIndex = 0;
canvas.style.outline = "none";
canvas.style.touchAction = "none";
canvas.style.maxWidth = "100%";

document.documentElement.style.overscrollBehavior = "none";

// -------------------- Background --------------------
let bgStarsFar = [];
let bgStarsMid = [];
let bgStarsNear = [];
let bgNebula = [];

function rand(min, max) {
  return Math.random() * (max - min) + min;
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

function isMobileLike() {
  return window.matchMedia("(pointer: coarse)").matches || window.innerWidth <= 760;
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
    leftBtn.textContent = "◀";
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
    rightBtn.textContent = "▶";
    rightBtn.setAttribute("aria-label", "Move right");

    controls.appendChild(leftBtn);
    controls.appendChild(fireBtn);
    controls.appendChild(rightBtn);

    const wrap = document.querySelector(".wrap") || document.body;
    wrap.appendChild(controls);
  }

  controls.style.width = "min(600px, 96vw)";
  controls.style.gridTemplateColumns = "1fr 1.2fr 1fr";
  controls.style.gap = "10px";
  controls.style.margin = "8px auto 18px";
  controls.style.userSelect = "none";
  controls.style.webkitUserSelect = "none";
  controls.style.touchAction = "none";

  const buttons = controls.querySelectorAll("button");
  buttons.forEach(btn => {
    btn.style.minHeight = "58px";
    btn.style.borderRadius = "14px";
    btn.style.border = "1px solid #333";
    btn.style.background = "#111";
    btn.style.color = "#eee";
    btn.style.fontFamily = "inherit";
    btn.style.fontSize = btn.id === "touch-fire" ? "26px" : "32px";
    btn.style.letterSpacing = btn.id === "touch-fire" ? "2px" : "0";
    btn.style.touchAction = "none";
    btn.style.cursor = "pointer";
  });

  return controls;
}

const mobileControls = makeMobileControls();

const touchLeftBtn = document.getElementById("touch-left");
const touchRightBtn = document.getElementById("touch-right");
const touchFireBtn = document.getElementById("touch-fire");

function updateMobileControlVisibility() {
  const mobile = isMobileLike();

  if (mobileControls) {
    mobileControls.style.display = mobile ? "grid" : "none";
  }

  if (hintEl) {
    hintEl.textContent = mobile
      ? "Drag ship or use buttons. Hold FIRE to shoot."
      : "Move: ← →   Shoot: Space   Restart: R";
  }

  resizeCanvasForScreen();
}

function setMobileInput(name, value) {
  mobileInput[name] = value;
}

function attachHoldButton(button, inputName) {
  if (!button) return;

  const start = (e) => {
    e.preventDefault();
    initAudio();
    setMobileInput(inputName, true);
    canvas.focus();
  };

  const stop = (e) => {
    if (e) e.preventDefault();
    setMobileInput(inputName, false);
  };

  button.addEventListener("pointerdown", start);
  button.addEventListener("pointerup", stop);
  button.addEventListener("pointercancel", stop);
  button.addEventListener("pointerleave", stop);
  button.addEventListener("contextmenu", (e) => e.preventDefault());
}

attachHoldButton(touchLeftBtn, "left");
attachHoldButton(touchRightBtn, "right");
attachHoldButton(touchFireBtn, "fire");

function movePlayerToPointer(e) {
  const rect = canvas.getBoundingClientRect();
  const scaledX = ((e.clientX - rect.left) / rect.width) * canvas.width;
  v_player.x = Math.max(20, Math.min(canvas.width - 20, scaledX));
}

canvas.addEventListener("pointerdown", (e) => {
  initAudio();
  canvas.focus();

  if (isMobileLike()) {
    e.preventDefault();
    isPointerDragging = true;
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
});

canvas.addEventListener("pointercancel", () => {
  isPointerDragging = false;
});

document.addEventListener(
  "touchmove",
  (e) => {
    if (e.target === canvas || mobileControls.contains(e.target)) {
      e.preventDefault();
    }
  },
  { passive: false }
);

function resizeCanvasForScreen() {
  const hud = document.querySelector(".hud");
  const controlsVisible = isMobileLike();

  const horizontalPadding = 16;
  const maxWidth = Math.max(280, window.innerWidth - horizontalPadding);

  let reservedHeight = 28;

  if (hud) reservedHeight += hud.offsetHeight;
  if (hintEl) reservedHeight += hintEl.offsetHeight;

  if (controlsVisible && mobileControls) {
    reservedHeight += mobileControls.offsetHeight + 10;
  }

  let maxHeight = window.innerHeight - reservedHeight;

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

function initAudio() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    audioCtx = new AudioContext();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.25;
    masterGain.connect(audioCtx.destination);
  }

  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
}

function playSound(type) {
  if (!audioCtx || !masterGain) return;

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
    osc.frequency.setValueAtTime(700, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.12);
    osc.start(now);
    osc.stop(now + 0.15);
    return;
  }

  if (type === "explosion") {
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(180, now);
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
function updateUI() {
  scoreEl.textContent = `Score: ${score}`;
  livesEl.textContent = `Lives: ${"❤".repeat(Math.max(0, lives))}`;
}

function screenShake() {
  canvas.style.transform =
    `translate(${(Math.random() * 10 - 5).toFixed(1)}px, ${(Math.random() * 10 - 5).toFixed(1)}px)`;

  setTimeout(() => {
    canvas.style.transform = "none";
  }, 160);
}

function closeOverlay() {
  overlay.hidden = true;
  overlay.style.display = "none";
  overlay.style.pointerEvents = "none";
}

function openOverlay() {
  overlay.hidden = false;
  overlay.style.display = "grid";
  overlay.style.pointerEvents = "auto";
}

function showGameOver(win = false) {
  isGameOver = true;
  finalScoreEl.textContent = String(score);
  overTitle.textContent = win ? "YOU WIN" : "GAME OVER";

  keys = {};
  mobileInput.left = false;
  mobileInput.right = false;
  mobileInput.fire = false;

  openOverlay();
}

// -------------------- VOID INVADERS --------------------
let v_player = { x: 300, y: 580, w: 30, h: 30 };
let v_bullets = [];
let v_enemies = [];
let v_enemyBullets = [];
let v_dir = 1;
let v_moveTimer = 0;
let v_moveInterval = 40;
let v_shootTimer = 0;
let v_level = 1;
let v_invuln = 0;

function initInvaders() {
  isGameOver = false;

  keys = {};
  mobileInput.left = false;
  mobileInput.right = false;
  mobileInput.fire = false;

  closeOverlay();

  lives = 3;
  score = 0;
  gameFrame = 0;
  updateUI();

  v_player.x = canvas.width / 2;
  v_player.y = 580;

  v_bullets = [];
  v_enemyBullets = [];
  v_level = 1;
  v_invuln = 0;

  initBackground();
  spawnInvaders();
  v_moveInterval = 40;

  canvas.focus();
  resizeCanvasForScreen();
}

function spawnInvaders() {
  v_enemies = [];
  v_dir = 1;

  const rows = Math.min(7, 3 + (v_level - 1));
  const cols = 8;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const type = r % 3 === 0 ? "orb" : r % 3 === 1 ? "squid" : "crawler";

      v_enemies.push({
        x: 50 + c * 50,
        y: 50 + r * 50,
        type,
        animOffset: Math.random() * Math.PI * 2
      });
    }
  }

  v_moveInterval = Math.max(5, 40 - (v_level * 3));
}

function isLeftPressed() {
  return keys["ArrowLeft"] || mobileInput.left;
}

function isRightPressed() {
  return keys["ArrowRight"] || mobileInput.right;
}

function isFirePressed() {
  return keys[" "] || keys["Spacebar"] || mobileInput.fire;
}

function firePlayerBullet() {
  v_bullets.push({
    x: v_player.x,
    y: v_player.y - 20,
    vy: -7,
    type: "player"
  });

  playSound("shoot");
  v_shootTimer = 20;
}

function updateInvaders() {
  if (v_invuln > 0) v_invuln--;
  gameFrame++;

  if (isLeftPressed() && v_player.x > 20) {
    v_player.x -= 5.5;
  }

  if (isRightPressed() && v_player.x < canvas.width - 20) {
    v_player.x += 5.5;
  }

  if (v_shootTimer > 0) v_shootTimer--;

  if (isFirePressed() && v_shootTimer === 0) {
    firePlayerBullet();
  }

  for (let i = v_bullets.length - 1; i >= 0; i--) {
    const b = v_bullets[i];
    b.y += b.vy;

    let bulletHit = false;

    for (let j = v_enemies.length - 1; j >= 0; j--) {
      const e = v_enemies[j];

      if (Math.abs(b.x - e.x) < 20 && Math.abs(b.y - e.y) < 20) {
        v_enemies.splice(j, 1);
        v_bullets.splice(i, 1);
        bulletHit = true;

        score += 20;
        updateUI();
        playSound("explosion");

        const baseSpeed = Math.max(5, 40 - (v_level * 3));
        v_moveInterval = Math.max(2, baseSpeed - Math.floor((32 - v_enemies.length) / 2));
        break;
      }
    }

    if (!bulletHit && (b.y < 0 || b.y > canvas.height)) {
      v_bullets.splice(i, 1);
    }
  }

  v_moveTimer++;

  if (v_moveTimer > v_moveInterval) {
    v_moveTimer = 0;

    let hitEdge = false;

    v_enemies.forEach(e => {
      if ((v_dir === 1 && e.x > canvas.width - 40) || (v_dir === -1 && e.x < 40)) {
        hitEdge = true;
      }
    });

    let erraticSwap = false;

    if (v_level >= 4 && !hitEdge && Math.random() < 0.1 + (v_level * 0.02)) {
      erraticSwap = true;
    }

    if (hitEdge) {
      v_dir *= -1;
      v_enemies.forEach(e => {
        e.y += 20;
      });
    } else if (erraticSwap) {
      v_dir *= -1;
      v_enemies.forEach(e => {
        e.x += v_dir * 15;
      });
    } else {
      v_enemies.forEach(e => {
        e.x += v_dir * 15;
      });
    }
  }

  const shootChance = Math.min(0.002 + (v_level * 0.002), 0.08);

  if (Math.random() < shootChance && v_enemies.length > 0) {
    const shooter = v_enemies[Math.floor(Math.random() * v_enemies.length)];
    const pSpeed = 4 + (v_level * 0.5);

    v_enemyBullets.push({
      x: shooter.x,
      y: shooter.y,
      vy: pSpeed
    });
  }

  for (let i = v_enemyBullets.length - 1; i >= 0; i--) {
    const b = v_enemyBullets[i];
    b.y += b.vy;

    if (b.y > canvas.height + 20) {
      v_enemyBullets.splice(i, 1);
      continue;
    }

    if (
      v_invuln === 0 &&
      Math.abs(b.x - v_player.x) < 15 &&
      Math.abs(b.y - v_player.y) < 15
    ) {
      lives--;
      updateUI();
      playSound("death");
      screenShake();

      v_bullets.length = 0;
      v_enemyBullets.length = 0;

      v_invuln = 60;

      if (lives <= 0) {
        showGameOver(false);
      }

      break;
    }
  }

  for (let i = 0; i < v_enemies.length; i++) {
    const e = v_enemies[i];

    if (e.y > 550) {
      lives--;
      updateUI();
      playSound("death");
      screenShake();

      v_bullets.length = 0;
      v_enemyBullets.length = 0;

      v_invuln = 60;

      if (lives <= 0) {
        showGameOver(false);
      } else {
        v_enemies.forEach(en => {
          en.y -= 100;
        });
      }

      break;
    }
  }

  if (v_enemies.length === 0) {
    score += 1000;
    updateUI();
    playSound("win");

    v_level++;
    spawnInvaders();
  }
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

function drawStars() {
  drawBackgroundGradient();
  drawNebula();
  drawStarLayer(bgStarsFar, 0.05);
  drawStarLayer(bgStarsMid, 0.12);
  drawGlowStars();
}

function drawPlayer() {
  ctx.font = "30px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.globalAlpha = (v_invuln > 0 && (v_invuln % 10) < 5) ? 0.35 : 1;
  ctx.fillStyle = "#fff";
  ctx.fillText("🚀", v_player.x, v_player.y);
  ctx.globalAlpha = 1;
}

function drawEnemy(enemy) {
  const bob = Math.sin((gameFrame * 0.08) + enemy.animOffset) * 2.2;
  const x = enemy.x;
  const y = enemy.y + bob;

  ctx.save();
  ctx.translate(x, y);

  if (enemy.type === "orb") {
    drawOrbEnemy();
  } else if (enemy.type === "squid") {
    drawSquidEnemy();
  } else {
    drawCrawlerEnemy();
  }

  ctx.restore();
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

function drawBullets() {
  ctx.fillStyle = "#0f0";
  v_bullets.forEach(b => {
    ctx.fillRect(b.x - 2, b.y - 5, 4, 10);
  });

  ctx.fillStyle = "#f0f";
  v_enemyBullets.forEach(b => {
    ctx.fillRect(b.x - 2, b.y - 5, 4, 10);
  });
}

function drawWaveLabel() {
  ctx.fillStyle = "#666";
  ctx.font = "20px VT323";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("WAVE: " + v_level, 550, 30);
}

function drawInvaders() {
  drawStars();
  drawPlayer();

  v_enemies.forEach(drawEnemy);

  drawBullets();
  drawWaveLabel();
}

// -------------------- Engine + Inputs --------------------
function tick() {
  if (!isGameOver) {
    updateInvaders();
  }

  drawInvaders();
  requestAnimationFrame(tick);
}

window.addEventListener("keydown", (e) => {
  initAudio();

  if (["ArrowLeft", "ArrowRight", " "].includes(e.key)) {
    e.preventDefault();
  }

  keys[e.key] = true;

  if (e.key === "r" || e.key === "R") {
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

playAgainBtn.addEventListener("click", () => {
  initAudio();
  initInvaders();
});

window.addEventListener("resize", updateMobileControlVisibility);
window.addEventListener("orientationchange", () => {
  setTimeout(updateMobileControlVisibility, 250);
});

updateMobileControlVisibility();
initInvaders();
tick();