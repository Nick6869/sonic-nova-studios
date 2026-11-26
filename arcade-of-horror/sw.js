const CACHE_VERSION = "arcade-of-horror-v36";
const PRECACHE = `${CACHE_VERSION}-precache`;
const RUNTIME = `${CACHE_VERSION}-runtime`;

const BUNDLE_ASSETS = [
  "./app-assets/developer-mode.js",
  "./app-assets/icons/icon-128.png",
  "./app-assets/icons/icon-180.png",
  "./app-assets/icons/icon-192.png",
  "./app-assets/icons/icon-256.png",
  "./app-assets/icons/icon-384.png",
  "./app-assets/icons/icon-48.png",
  "./app-assets/icons/icon-512.png",
  "./app-assets/icons/icon-72.png",
  "./app-assets/icons/icon-96.png",
  "./app-assets/icons/icon-maskable-192.png",
  "./app-assets/icons/icon-maskable-512.png",
  "./app-assets/leaderboard-config.js",
  "./app-assets/leaderboard.css",
  "./app-assets/leaderboard.js",
  "./app-assets/daily-rewards.css",
  "./app-assets/daily-rewards.js",
  "./app-assets/mobile-runtime.js",
  "./app-assets/save-data.js",
  "./app-assets/arcade-ux.js",
  "./app-assets/arcade-ux.css",
  "./arcade.css",
  "./arcade.js",
  "./bone-breaker/Assets/ball.webp",
  "./bone-breaker/Assets/bone1.webp",
  "./bone-breaker/Assets/bone2.webp",
  "./bone-breaker/Assets/level1.webp",
  "./bone-breaker/Assets/level2.webp",
  "./bone-breaker/Assets/level3.webp",
  "./bone-breaker/Assets/level4.webp",
  "./bone-breaker/Assets/level5.webp",
  "./bone-breaker/Assets/level6.webp",
  "./bone-breaker/Assets/platform.webp",
  "./bone-breaker/Assets/titlecard.webp",
  "./bone-breaker/game.js",
  "./bone-breaker/index.html",
  "./bone-breaker/style.css",
  "./blood-tunnel/Assets/left blood wall.webp",
  "./blood-tunnel/Assets/background2.webp",
  "./blood-tunnel/Assets/background3.webp",
  "./blood-tunnel/Assets/background4.webp",
  "./blood-tunnel/Assets/background5.webp",
  "./blood-tunnel/Assets/background6.webp",
  "./blood-tunnel/Assets/background7.webp",
  "./blood-tunnel/Assets/background8.webp",
  "./blood-tunnel/Assets/coolant power up.webp",
  "./blood-tunnel/Assets/mainbackground.webp",
  "./blood-tunnel/Assets/mini boss 1.webp",
  "./blood-tunnel/Assets/obstacle1.webp",
  "./blood-tunnel/Assets/obstacle2.webp",
  "./blood-tunnel/Assets/obstacle3.webp",
  "./blood-tunnel/Assets/player character.webp",
  "./blood-tunnel/Assets/pulse surge power up.webp",
  "./blood-tunnel/Assets/right blood wall.webp",
  "./blood-tunnel/Assets/shield power up.webp",
  "./blood-tunnel/Assets/stalker boss.webp",
  "./blood-tunnel/game.js",
  "./blood-tunnel/index.html",
  "./blood-tunnel/style.css",
  "./flappy-bat/assets/audio/flappybatsong.mp3",
  "./flappy-bat/assets/background1.webp",
  "./flappy-bat/assets/background10.webp",
  "./flappy-bat/assets/background11.webp",
  "./flappy-bat/assets/background2.webp",
  "./flappy-bat/assets/background3.webp",
  "./flappy-bat/assets/background4.webp",
  "./flappy-bat/assets/background5.webp",
  "./flappy-bat/assets/background6.webp",
  "./flappy-bat/assets/background7.webp",
  "./flappy-bat/assets/background8.webp",
  "./flappy-bat/assets/background9.webp",
  "./flappy-bat/assets/charactera.webp",
  "./flappy-bat/assets/characterb.webp",
  "./flappy-bat/assets/goldcostumea.webp",
  "./flappy-bat/assets/goldcostumeb.webp",
  "./flappy-bat/assets/greencostumea.webp",
  "./flappy-bat/assets/greencostumeb.webp",
  "./flappy-bat/assets/mummycostumea.webp",
  "./flappy-bat/assets/mummycostumeb.webp",
  "./flappy-bat/assets/pillar.webp",
  "./flappy-bat/assets/skeletoncostumea.webp",
  "./flappy-bat/assets/skeletoncostumeb.webp",
  "./flappy-bat/assets/superherocostumea.webp",
  "./flappy-bat/assets/superherocostumeb.webp",
  "./flappy-bat/assets/titlescreen.webp",
  "./flappy-bat/game.js",
  "./flappy-bat/index.html",
  "./flappy-bat/style.css",
  "./graveyard-crossing/assets/maincharacter.webp",
  "./graveyard-crossing/assets/Untitled design (1).webp",
  "./graveyard-crossing/assets/Untitled design (2).webp",
  "./graveyard-crossing/assets/Untitled design (3).webp",
  "./graveyard-crossing/assets/Untitled design (4).webp",
  "./graveyard-crossing/assets/Untitled design (5).webp",
  "./graveyard-crossing/assets/Untitled design (6).webp",
  "./graveyard-crossing/assets/Untitled design (7).webp",
  "./graveyard-crossing/assets/Untitled design.webp",
  "./graveyard-crossing/assets/level1.webp",
  "./graveyard-crossing/assets/level2.webp",
  "./graveyard-crossing/assets/level3.webp",
  "./graveyard-crossing/assets/level4.webp",
  "./graveyard-crossing/assets/level5.webp",
  "./graveyard-crossing/assets/level6.webp",
  "./graveyard-crossing/assets/titlecard.webp",
  "./graveyard-crossing/game.js",
  "./graveyard-crossing/index.html",
  "./graveyard-crossing/style.css",
  "./hell-climb/assets/aliencostumea.webp",
  "./hell-climb/assets/aliencostumeb.webp",
  "./hell-climb/assets/background1.webp",
  "./hell-climb/assets/background10.webp",
  "./hell-climb/assets/background11.webp",
  "./hell-climb/assets/background12.webp",
  "./hell-climb/assets/background2.webp",
  "./hell-climb/assets/background3.webp",
  "./hell-climb/assets/background4.webp",
  "./hell-climb/assets/background5.webp",
  "./hell-climb/assets/background6.webp",
  "./hell-climb/assets/background7.webp",
  "./hell-climb/assets/background8.webp",
  "./hell-climb/assets/background9.webp",
  "./hell-climb/assets/character1.webp",
  "./hell-climb/assets/character2.webp",
  "./hell-climb/assets/christmasbonus1.webp",
  "./hell-climb/assets/christmasbonus2.webp",
  "./hell-climb/assets/christmasbonus3.webp",
  "./hell-climb/assets/clowncostumea.webp",
  "./hell-climb/assets/clowncostumeb.webp",
  "./hell-climb/assets/costume1a.webp",
  "./hell-climb/assets/costume1b.webp",
  "./hell-climb/assets/costume2a.webp",
  "./hell-climb/assets/costume2b.webp",
  "./hell-climb/assets/costume3a.webp",
  "./hell-climb/assets/costume3b.webp",
  "./hell-climb/assets/devilcostumea.webp",
  "./hell-climb/assets/devilcostumeb.webp",
  "./hell-climb/assets/enemy1.webp",
  "./hell-climb/assets/enemy2.webp",
  "./hell-climb/assets/enemy3.webp",
  "./hell-climb/assets/enemy4.webp",
  "./hell-climb/assets/enemy5.webp",
  "./hell-climb/assets/enemy6.webp",
  "./hell-climb/assets/gate.webp",
  "./hell-climb/assets/heaven1.webp",
  "./hell-climb/assets/heaven2.webp",
  "./hell-climb/assets/heaven3.webp",
  "./hell-climb/assets/shield.webp",
  "./hell-climb/assets/song1.mp3",
  "./hell-climb/assets/spacebonus1.webp",
  "./hell-climb/assets/spacebonus2.webp",
  "./hell-climb/assets/spacebonus3.webp",
  "./hell-climb/assets/spring.webp",
  "./hell-climb/assets/tile1.webp",
  "./hell-climb/assets/tile2.webp",
  "./hell-climb/assets/tile3.webp",
  "./hell-climb/assets/tile4.webp",
  "./hell-climb/assets/tile5.webp",
  "./hell-climb/assets/titlecard.webp",
  "./hell-climb/assets/wings.webp",
  "./hell-climb/assets/wolfcostumea.webp",
  "./hell-climb/assets/wolfcostumeb.webp",
  "./hell-climb/game.js",
  "./hell-climb/index.html",
  "./hell-climb/style.css",
  "./horror-snake/assets/background1.webp",
  "./horror-snake/assets/background2.webp",
  "./horror-snake/assets/background3.webp",
  "./horror-snake/assets/background4.webp",
  "./horror-snake/assets/titlecard.webp",
  "./horror-snake/assets/brain.webp",
  "./horror-snake/assets/snakebody.webp",
  "./horror-snake/assets/snakehead.webp",
  "./horror-snake/assets/snaketail.webp",
  "./horror-snake/assets/snaketurn1.webp",
  "./horror-snake/assets/snaketurn2.webp",
  "./horror-snake/game.js",
  "./horror-snake/index.html",
  "./horror-snake/style.css",
  "./hub-assets/background.webp",
  "./hub-assets/bloodtunnel.webp",
  "./hub-assets/bonebreaker.webp",
  "./hub-assets/channels4_profile.jpg",
  "./hub-assets/flappybat.webp",
  "./hub-assets/graveyardcrossing.webp",
  "./hub-assets/hellclimb.webp",
  "./hub-assets/serpentsin.webp",
  "./hub-assets/undeadarena.webp",
  "./hub-assets/voidinvaders.webp",
  "./index.html",
  "./manifest.webmanifest",
  "./offline.html",
  "./privacy.html",
  "./sw.js",
  "./undead-arena/assets/bosszombie1.webp",
  "./undead-arena/assets/health.webp",
  "./undead-arena/assets/level1.webp",
  "./undead-arena/assets/level2.webp",
  "./undead-arena/assets/level3.webp",
  "./undead-arena/assets/level4.webp",
  "./undead-arena/assets/level5.webp",
  "./undead-arena/assets/machinegun.webp",
  "./undead-arena/assets/maincharacter.webp",
  "./undead-arena/assets/shotgun.webp",
  "./undead-arena/assets/titlecard.webp",
  "./undead-arena/assets/zombie1.webp",
  "./undead-arena/assets/zombie2.webp",
  "./undead-arena/assets/zombie3.webp",
  "./undead-arena/game.js",
  "./undead-arena/index.html",
  "./undead-arena/style.css",
  "./void-invaders/assets/background.webp",
  "./void-invaders/assets/background2.webp",
  "./void-invaders/assets/background3.webp",
  "./void-invaders/assets/boss1.webp",
  "./void-invaders/assets/boss10.webp",
  "./void-invaders/assets/boss11.webp",
  "./void-invaders/assets/boss12.webp",
  "./void-invaders/assets/boss13.webp",
  "./void-invaders/assets/boss14.webp",
  "./void-invaders/assets/boss15.webp",
  "./void-invaders/assets/boss2.webp",
  "./void-invaders/assets/boss3.png",
  "./void-invaders/assets/boss4.png",
  "./void-invaders/assets/boss5.png",
  "./void-invaders/assets/boss6.png",
  "./void-invaders/assets/boss7.webp",
  "./void-invaders/assets/boss8.webp",
  "./void-invaders/assets/boss9.webp",
  "./void-invaders/assets/invaderstheme.mp3",
  "./void-invaders/assets/normalenemy1.webp",
  "./void-invaders/assets/normalenemy2.webp",
  "./void-invaders/assets/normalenemy3.webp",
  "./void-invaders/assets/normalenemy4.webp",
  "./void-invaders/assets/normalenemy5.webp",
  "./void-invaders/assets/normalenemy6.webp",
  "./void-invaders/assets/ship.webp",
  "./void-invaders/assets/titlecard.webp",
  "./void-invaders/game.js",
  "./void-invaders/index.html",
  "./void-invaders/style.css"
];


const SCOPE_URL = new URL(self.registration.scope);
const bundleUrls = new Set(BUNDLE_ASSETS.map(asset => new URL(asset, SCOPE_URL).href));
const CORE_ASSETS = BUNDLE_ASSETS.filter(asset =>
  /\.(html|js|css|webmanifest)$/.test(asset) ||
  asset.startsWith("./app-assets/icons/") ||
  asset === "./hub-assets/background.webp" ||
  asset === "./hub-assets/channels4_profile.jpg"
);
const offlineMarker = new URL("./.offline-package-ready", SCOPE_URL).href;
const offlinePage = new URL("./offline.html", SCOPE_URL).href;
const hubUrl = new URL("./index.html", SCOPE_URL).href;
let downloadJob;

self.addEventListener("install", event => {
  event.waitUntil(installShell().then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith("arcade-of-horror-") && key !== PRECACHE && key !== RUNTIME) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== SCOPE_URL.origin || !url.pathname.startsWith(SCOPE_URL.pathname)) return;
  url.search = "";
  if (url.pathname.endsWith("/")) url.pathname += "index.html";
  const asset = url.href;
  if (!bundleUrls.has(asset) && request.mode !== "navigate") return;
  const preferNetwork = request.mode === "navigate" || request.destination === "script" || request.destination === "style";
  event.respondWith(serveAsset(request, asset, preferNetwork));
});

self.addEventListener("message", event => {
  const port = event.ports[0];
  if (!port) return;
  if (event.data?.type === "offline-status") {
    event.waitUntil(offlineReady().then(ready => port.postMessage({ ready })));
  } else if (event.data?.type === "download-offline") {
    event.waitUntil(downloadOffline(port));
  }
});

function isFullResponse(response, asset) {
  if (response.status !== 200) return false;
  const type = response.headers.get("Content-Type") || "";
  return !type.includes("text/html") || asset.endsWith(".html");
}

async function fillCache(assets, cache, onProgress = () => {}) {
  let next = 0;
  let complete = 0;
  let failures = 0;
  async function worker() {
    while (next < assets.length) {
      const url = new URL(assets[next++], SCOPE_URL).href;
      try {
        if (!await cache.match(url)) {
          const response = await fetch(url, { cache: "reload" });
          if (!isFullResponse(response, url)) throw new Error("Invalid response");
          await cache.put(url, response);
        }
        onProgress(++complete, assets.length);
      } catch {
        failures++;
      }
    }
  }
  await Promise.all(Array.from({ length: 4 }, worker));
  if (failures) throw new Error(failures + " files could not be saved. Check your connection and try again.");
}

async function installShell() {
  await fillCache(CORE_ASSETS, await caches.open(PRECACHE));
}

async function offlineReady() {
  return Boolean(await (await caches.open(PRECACHE)).match(offlineMarker));
}

async function downloadOffline(port) {
  try {
    if (await offlineReady()) {
      port.postMessage({ ready: true });
      return;
    }
    if (!downloadJob) {
      const ports = new Set([port]);
      const promise = (async () => {
        const cache = await caches.open(PRECACHE);
        await fillCache(BUNDLE_ASSETS, cache, (complete, total) => {
          for (const listener of ports) listener.postMessage({ complete, total });
        });
        await cache.put(offlineMarker, new Response("ready"));
      })().finally(() => { downloadJob = null; });
      downloadJob = { ports, promise };
    } else {
      downloadJob.ports.add(port);
    }
    await downloadJob.promise;
    port.postMessage({ ready: true });
  } catch (error) {
    port.postMessage({ error: error.message });
  }
}

async function matchAsset(asset) {
  return await (await caches.open(RUNTIME)).match(asset) || await (await caches.open(PRECACHE)).match(asset);
}

async function rangeResponse(response, range) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  if (!match || (!match[1] && !match[2])) return new Response(null, { status: 416 });
  const content = await response.blob();
  const start = match[1] ? Number(match[1]) : Math.max(0, content.size - Number(match[2]));
  const end = match[1] && match[2] ? Math.min(Number(match[2]), content.size - 1) : content.size - 1;
  const headers = new Headers({
    "Accept-Ranges": "bytes",
    "Content-Type": response.headers.get("Content-Type") || "audio/mpeg"
  });
  if (start > end || start >= content.size) {
    headers.set("Content-Range", "bytes */" + content.size);
    return new Response(null, { status: 416, headers });
  }
  headers.set("Content-Range", "bytes " + start + "-" + end + "/" + content.size);
  headers.set("Content-Length", String(end - start + 1));
  return new Response(content.slice(start, end + 1), { status: 206, headers });
}

async function serveAsset(request, asset, preferNetwork) {
  const range = request.headers.get("Range");
  if (!preferNetwork) {
    const cached = await matchAsset(asset);
    if (cached) return range ? rangeResponse(cached, range) : cached;
  }
  try {
    const response = await fetch(request);
    if (!range && bundleUrls.has(asset) && !response.redirected && isFullResponse(response, asset)) {
      try { await (await caches.open(RUNTIME)).put(asset, response.clone()); } catch {}
    }
    return response;
  } catch {
    if (request.mode === "navigate" && asset !== hubUrl && /\/[^/]+\/index\.html$/.test(new URL(asset).pathname) && !await offlineReady()) {
      return await matchAsset(offlinePage) || new Response(null, { status: 503 });
    }
    const cached = await matchAsset(asset);
    if (cached) return range ? rangeResponse(cached, range) : cached;
    if (request.mode === "navigate") return await matchAsset(offlinePage) || new Response(null, { status: 503 });
    return new Response(null, { status: 503 });
  }
}
