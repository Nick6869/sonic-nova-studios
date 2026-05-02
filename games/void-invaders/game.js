// Void Invaders (standalone)

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const restartBtn = document.getElementById('restart');

const overlay = document.getElementById('overlay');
const overTitle = document.getElementById('over-title');
const finalScoreEl = document.getElementById('final-score');
const playAgainBtn = document.getElementById('play-again');

let keys = {};
let score = 0;
let lives = 3;
let isGameOver = false;

// Make canvas focusable (helps some browsers when clicking buttons)
canvas.tabIndex = 0;
canvas.style.outline = "none";

// -------------------- Audio --------------------
let audioCtx = null;
let masterGain = null;

function initAudio() {
  if (audioCtx) return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  audioCtx = new AudioContext();
  masterGain = audioCtx.createGain();
  masterGain.gain.value = 0.25;
  masterGain.connect(audioCtx.destination);
}

function playSound(type) {
  if (!audioCtx) return;

  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(masterGain);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

  if (type === 'shoot') {
    osc.type = 'square';
    osc.frequency.setValueAtTime(700, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.12);
    osc.start(now);
    osc.stop(now + 0.15);
    return;
  }

  if (type === 'explosion') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.14);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.35, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
    osc.start(now);
    osc.stop(now + 0.22);
    return;
  }

  if (type === 'death') {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.2);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.3, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
    osc.start(now);
    osc.stop(now + 0.26);
    return;
  }

  if (type === 'win') {
    osc.type = 'sine';
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

  osc.type = 'sine';
  osc.frequency.setValueAtTime(300, now);
  osc.start(now);
  osc.stop(now + 0.08);
}

// -------------------- UI --------------------
function updateUI() {
  scoreEl.textContent = `Score: ${score}`;
  livesEl.textContent = `Lives: ${'❤'.repeat(Math.max(0, lives))}`;
}

function screenShake() {
  canvas.style.transform =
    `translate(${(Math.random() * 10 - 5).toFixed(1)}px, ${(Math.random() * 10 - 5).toFixed(1)}px)`;
  setTimeout(() => (canvas.style.transform = 'none'), 160);
}

// IMPORTANT: force overlay display state (do not rely on [hidden] alone)
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
  overTitle.textContent = win ? 'YOU WIN' : 'GAME OVER';
  keys = {}; // clear held keys
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
let v_invuln = 0; // frames of invulnerability after being hit

function initInvaders() {
  isGameOver = false;
  keys = {};            // clear held keys on restart
  closeOverlay();       // actually hide overlay (forced)

  lives = 3;
  score = 0;
  updateUI();

  v_player.x = canvas.width / 2;
  v_bullets = [];
  v_enemyBullets = [];
  v_level = 1;
  v_invuln = 0;

  spawnInvaders();
  v_moveInterval = 40;

  // give focus back to the canvas so arrows feel reliable
  canvas.focus();
}

function spawnInvaders() {
  v_enemies = [];
  v_dir = 1;

  let rows = Math.min(7, 3 + (v_level - 1));
  let cols = 8;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let type = r % 3 === 0 ? '  🐙  ' : (r % 3 === 1 ? '  👁️  ' : '  👽  ');
      v_enemies.push({ x: 50 + c * 50, y: 50 + r * 50, type });
    }
  }
  v_moveInterval = Math.max(5, 40 - (v_level * 3));
}

function updateInvaders() {
  if (v_invuln > 0) v_invuln--;

  if (keys['ArrowLeft'] && v_player.x > 20) v_player.x -= 5;
  if (keys['ArrowRight'] && v_player.x < canvas.width - 20) v_player.x += 5;

  if (v_shootTimer > 0) v_shootTimer--;
  if (keys[' '] && v_shootTimer === 0) {
    v_bullets.push({ x: v_player.x, y: v_player.y - 20, vy: -7, type: 'player' });
    playSound('shoot');
    v_shootTimer = 20;
  }

  for (let i = v_bullets.length - 1; i >= 0; i--) {
    let b = v_bullets[i];
    b.y += b.vy;

    for (let j = v_enemies.length - 1; j >= 0; j--) {
      let e = v_enemies[j];
      if (Math.abs(b.x - e.x) < 20 && Math.abs(b.y - e.y) < 20) {
        v_enemies.splice(j, 1);
        v_bullets.splice(i, 1);

        score += 20;
        updateUI();
        playSound('explosion');

        let baseSpeed = Math.max(5, 40 - (v_level * 3));
        v_moveInterval = Math.max(2, baseSpeed - Math.floor((32 - v_enemies.length) / 2));
        break;
      }
    }

    if (b.y < 0 || b.y > canvas.height) v_bullets.splice(i, 1);
  }

  v_moveTimer++;
  if (v_moveTimer > v_moveInterval) {
    v_moveTimer = 0;
    let hitEdge = false;

    v_enemies.forEach(e => {
      if ((v_dir === 1 && e.x > canvas.width - 40) || (v_dir === -1 && e.x < 40)) hitEdge = true;
    });

    let erraticSwap = false;
    if (v_level >= 4 && !hitEdge && Math.random() < 0.1 + (v_level * 0.02)) erraticSwap = true;

    if (hitEdge) {
      v_dir *= -1;
      v_enemies.forEach(e => e.y += 20);
    } else if (erraticSwap) {
      v_dir *= -1;
      v_enemies.forEach(e => e.x += v_dir * 15);
    } else {
      v_enemies.forEach(e => e.x += v_dir * 15);
    }
  }

  let shootChance = Math.min(0.002 + (v_level * 0.002), 0.08);
  if (Math.random() < shootChance && v_enemies.length > 0) {
    let shooter = v_enemies[Math.floor(Math.random() * v_enemies.length)];
    let pSpeed = 4 + (v_level * 0.5);
    v_enemyBullets.push({ x: shooter.x, y: shooter.y, vy: pSpeed });
  }

  // Enemy bullets (fixed)
  for (let i = v_enemyBullets.length - 1; i >= 0; i--) {
    const b = v_enemyBullets[i];
    b.y += b.vy;

    if (b.y > canvas.height + 20) {
      v_enemyBullets.splice(i, 1);
      continue;
    }

    if (v_invuln === 0 && Math.abs(b.x - v_player.x) < 15 && Math.abs(b.y - v_player.y) < 15) {
      lives--;
      updateUI();
      playSound('death');
      screenShake();

      v_bullets.length = 0;
      v_enemyBullets.length = 0;

      v_invuln = 60;

      if (lives <= 0) showGameOver(false);
      break;
    }
  }

  v_enemies.forEach(e => {
    if (e.y > 550) {
      lives--;
      updateUI();
      playSound('death');
      screenShake();

      v_bullets.length = 0;
      v_enemyBullets.length = 0;

      v_invuln = 60;

      if (lives <= 0) showGameOver(false);
      else v_enemies.forEach(en => en.y -= 100);
    }
  });

  if (v_enemies.length === 0) {
    score += 1000;
    updateUI();
    playSound('win');
    v_level++;
    spawnInvaders();
  }
}

function drawInvaders() {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#fff";
  for (let i = 0; i < 30; i++) {
    let sx = (i * 137) % canvas.width;
    let sy = (i * 241) % canvas.height;
    ctx.fillRect(sx, sy, 2, 2);
  }

  ctx.font = "30px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.globalAlpha = (v_invuln > 0 && (v_invuln % 10) < 5) ? 0.35 : 1;
  ctx.fillStyle = "#fff";
  ctx.fillText("  🚀  ", v_player.x, v_player.y);
  ctx.globalAlpha = 1;

  v_enemies.forEach(e => ctx.fillText(e.type, e.x, e.y));

  ctx.fillStyle = "#0f0";
  v_bullets.forEach(b => ctx.fillRect(b.x - 2, b.y - 5, 4, 10));

  ctx.fillStyle = "#f0f";
  v_enemyBullets.forEach(b => ctx.fillRect(b.x - 2, b.y - 5, 4, 10));

  ctx.fillStyle = "#666";
  ctx.font = "20px VT323";
  ctx.fillText("WAVE: " + v_level, 550, 30);
}

// -------------------- Engine + Inputs --------------------
function tick() {
  if (!isGameOver) updateInvaders();
  drawInvaders();
  requestAnimationFrame(tick);
}

window.addEventListener('keydown', (e) => {
  initAudio();

  if (['ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
  keys[e.key] = true;

  if (e.key === 'r' || e.key === 'R') initInvaders();
});

window.addEventListener('keyup', (e) => {
  keys[e.key] = false;
});

restartBtn.addEventListener('click', () => {
  initAudio();
  initInvaders();
});

playAgainBtn.addEventListener('click', () => {
  initAudio();
  initInvaders();
});

// Also allow clicking the canvas to regain keyboard focus
canvas.addEventListener('mousedown', () => {
  canvas.focus();
});

initInvaders();
tick();
