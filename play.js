const studioGames = new Map([
  ['flappy-bat', 'Flappy Bat'],
  ['hell-climb', 'Hell Climb'],
  ['void-invaders', 'Void Invaders'],
  ['blood-tunnel', 'Blood Tunnel'],
  ['bone-breaker', 'Bone Breaker'],
  ['undead-arena', 'Undead Arena'],
  ['horror-snake', 'Serpent Sin'],
  ['graveyard-crossing', 'Graveyard Crossing'],
]);

const gameId = new URLSearchParams(window.location.search).get('game');
const gameTitle = studioGames.get(gameId);

if (gameTitle) {
  const frame = document.getElementById('studio-game-frame');
  document.title = gameTitle + ' | Sonic Nova Studios';
  document.getElementById('studio-game-title').textContent = gameTitle;
  frame.title = gameTitle;
  frame.src = './arcade-of-horror/' + gameId + '/index.html';
  frame.hidden = false;
  document.getElementById('studio-game-fallback').hidden = true;
}
