(() => {
  "use strict";
  const prefixes = {
    "hell-climb": ["hellclimb_"],
    "flappy-bat": ["flappybat_"],
    "blood-tunnel": ["bloodTunnel"],
    "bone-breaker": ["boneBreaker"],
    "graveyard-crossing": ["graveyard-crossing-"],
    "horror-snake": ["horrorSnake"],
    "undead-arena": ["undead_arena_"],
    "void-invaders": ["sns:voidInvaders:", "voidInvadersHighScore"]
  };
  const rollbackKey = "aoh:save-rollback:v1";
  const trophyKeys = new Set(["bloodTunnelTrophiesV1", "boneBreakerTrophiesV1", "graveyard-crossing-trophies-v1", "hellclimb_trophies_v2", "horrorSnakeTrophiesV1", "undead_arena_trophies_v1", "sns:voidInvaders:trophies"]);
  function validateValue(key, value) {
    if (trophyKeys.has(key)) {
      let ids;
      try { ids = JSON.parse(value); } catch { throw new Error("Invalid trophy data: " + key); }
      if (!Array.isArray(ids) || ids.length > 1000 || ids.some(id => typeof id !== "string" || id.length > 120)) throw new Error("Invalid trophy data: " + key);
    }
    if (key === "hellclimb_sound" || key === "flappybat_achievements_v2" || key === "aoh:preferences:v1" || key.startsWith("aoh:trophy-progress:")) {
      let object;
      try { object = JSON.parse(value); } catch { throw new Error("Invalid saved settings or progress: " + key); }
      if (!object || typeof object !== "object" || Array.isArray(object)) throw new Error("Invalid saved settings or progress: " + key);
      if (key === "hellclimb_sound" && object.volume !== undefined &&
          (typeof object.volume !== "number" || !Number.isFinite(object.volume) || object.volume < 0 || object.volume > 1)) {
        throw new Error("Invalid Hell Climb volume in backup.");
      }
    }
    if (/^[\s]*[\[{]/.test(value)) {
      let object;
      try { object = JSON.parse(value); } catch { throw new Error("Invalid JSON save data: " + key); }
      function inspect(node, depth = 0) {
        if (depth > 20) throw new Error("Save data is nested too deeply: " + key);
        if (!node || typeof node !== "object") return;
        for (const [name, child] of Object.entries(node)) {
          if (["__proto__", "constructor", "prototype"].includes(name)) throw new Error("Unsupported save field: " + name);
          inspect(child, depth + 1);
        }
      }
      inspect(object);
    }
  }
  function owner(key) {
    if (typeof key !== "string") return null;
    for (const [game, values] of Object.entries(prefixes)) {
      if (values.some(prefix => key.startsWith(prefix)) || key.startsWith("arcadeDaily:" + game + ":") || key === "aoh:guide:" + game || key === "aoh:trophy-progress:" + game) return game;
    }
    return null;
  }
  function allowed(key) {
    return Boolean(owner(key)) || key === "aoh:preferences:v1" || key === "arcade-of-horror:last-played";
  }
  function snapshot(storage) {
    const data = Object.create(null);
    for (let index = 0; index < storage.length; index++) {
      const key = storage.key(index);
      if (allowed(key)) data[key] = storage.getItem(key);
    }
    return { format: "arcade-of-horror-save", version: 1, createdAt: new Date().toISOString(), data };
  }
  function validate(input) {
    if (!input || input.format !== "arcade-of-horror-save" || input.version !== 1 || !input.data || typeof input.data !== "object" || Array.isArray(input.data)) throw new Error("Choose an Arcade of Horror backup file (version 1).");
    const entries = Object.entries(input.data);
    if (entries.length > 10000) throw new Error("The backup has too many entries.");
    const data = Object.create(null);
    for (const [key, value] of entries) {
      if (!allowed(key) || typeof value !== "string" || value.length > 100000) throw new Error("The backup contains an unsupported save entry: " + key);
      validateValue(key, value);
      data[key] = value;
    }
    if (JSON.stringify(data).length > 1000000) throw new Error("The backup is too large.");
    return data;
  }
  function replace(storage, data) {
    const keys = [];
    for (let index = 0; index < storage.length; index++) {
      const key = storage.key(index);
      if (allowed(key)) keys.push(key);
    }
    keys.forEach(key => storage.removeItem(key));
    Object.entries(data).forEach(([key, value]) => storage.setItem(key, value));
  }
  function transaction(storage, change) {
    const before = snapshot(storage);
    // If this fails (for example, storage is full), no progress is changed.
    storage.setItem(rollbackKey, JSON.stringify(before));
    try { change(); } catch (error) {
      try { replace(storage, before.data); } catch { throw new Error("Storage is unavailable. Keep your exported backup before restarting the app."); }
      throw error;
    }
  }
  function restore(storage, input) {
    const data = validate(input);
    transaction(storage, () => replace(storage, data));
  }
  function resetGame(storage, game) {
    if (!Object.hasOwn(prefixes, game)) throw new Error("Choose a game to reset.");
    transaction(storage, () => {
      Object.keys(snapshot(storage).data).filter(key => owner(key) === game).forEach(key => storage.removeItem(key));
    });
  }
  function undo(storage) {
    const backup = storage.getItem(rollbackKey);
    if (!backup) throw new Error("There is no previous save to restore.");
    const parsed = JSON.parse(backup);
    const data = validate(parsed);
    const current = snapshot(storage);
    try { replace(storage, data); } catch (error) { replace(storage, current.data); throw error; }
    storage.removeItem(rollbackKey);
  }
  window.ArcadeSave = { owner, allowed, snapshot, validate, restore, resetGame, undo, rollbackKey };
})();
