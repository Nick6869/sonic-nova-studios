(() => {
  "use strict";
  const key = "aoh:preferences:v1";
  const defaults = { effects: true, music: true, vibration: true, reduceMotion: false, reduceFlashes: false, volume: 1 };
  const systemMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  function readPreferences() {
    try {
      const saved = JSON.parse(localStorage.getItem(key) || "null");
      const result = { ...defaults };
      for (const name of Object.keys(defaults)) if (typeof saved?.[name] === typeof defaults[name]) result[name] = saved[name];
      result.volume = Number.isFinite(result.volume) ? Math.max(0, Math.min(1, result.volume)) : 1;
      return result;
    } catch { return { ...defaults }; }
  }
  let preferences = readPreferences();
  const listeners = new Set();
  const gains = new Map();
  const media = new Map();
  const motionReduced = () => preferences.reduceMotion || Boolean(systemMotion?.matches);
  const effectsVolume = base => preferences.effects ? base * preferences.volume : 0;
  const musicVolume = base => preferences.music ? base * preferences.volume : 0;
  function applyPreferences() {
    document.documentElement.classList.toggle("aoh-reduced-motion", motionReduced());
    for (const [gain, base] of gains) gain.gain.value = effectsVolume(base());
    for (const [track, options] of media) {
      track.volume = musicVolume(options.volume());
      track.muted = options.muted() || !preferences.music;
    }
    document.querySelectorAll("[data-aoh-preference]").forEach(input => {
      const name = input.dataset.aohPreference;
      if (name === "volume") input.value = String(Math.round(preferences.volume * 100));
      else input.checked = preferences[name];
    });
    document.querySelectorAll("[data-aoh-volume]").forEach(output => { output.textContent = Math.round(preferences.volume * 100) + "%"; });
    listeners.forEach(listener => listener(preferences));
  }
  function updatePreferences(next) {
    const previous = preferences;
    preferences = { ...preferences, ...next };
    try { localStorage.setItem(key, JSON.stringify(preferences)); }
    catch { preferences = previous; throw new Error("Settings could not be saved. Your previous preferences are still active."); }
    applyPreferences();
  }
  let cabinetControls = null;
  window.ArcadeUX = {
    registerGame(controls) { cabinetControls = controls; },
    drawMarker(context, x, y, radius, color) {
      context.save();
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.strokeStyle = "#07080c";
      context.lineWidth = 5;
      context.stroke();
      context.strokeStyle = color;
      context.lineWidth = 2;
      context.stroke();
      context.restore();
    },
    motionReduced,
    flashesReduced: () => preferences.reduceFlashes || motionReduced(),
    effectsAllowed: () => preferences.effects && preferences.volume > 0,
    effectsVolume, musicVolume,
    musicAllowed: () => preferences.music && preferences.volume > 0,
    trackMetrics,
    vibrate(pattern) { if (preferences.vibration) { try { navigator.vibrate?.(pattern); } catch {} } },
    onPreferences(listener) { listeners.add(listener); listener(preferences); },
    effectsGain(gain, base) { gains.set(gain, typeof base === "function" ? base : () => base); gain.gain.value = effectsVolume(gains.get(gain)()); },
    musicTrack(track, options) { media.set(track, options); track.volume = musicVolume(options.volume()); track.muted = options.muted() || !preferences.music; },
    trophy(row, earned, progress) {
      row.dataset.aohEarned = String(Boolean(earned));
      if (!progress || !Number.isFinite(progress.current) || !(progress.target > 0)) return;
      trackMetrics({ [progress.metric]: progress.current });
      const target = progress.target;
      const current = earned ? target : Math.max(0, Math.min(target, Math.floor(peaks[progress.metric] || 0)));
      row.dataset.aohRatio = String(current / target);
      const description = document.createElement("span");
      description.className = "aoh-trophy-progress";
      description.textContent = (progress.scope || "Best attempt") + ": " + current.toLocaleString() + " / " + target.toLocaleString();
      const bar = document.createElement("progress");
      bar.max = target; bar.value = current;
      bar.setAttribute("aria-label", description.textContent);
      description.append(bar); row.append(description);
    }
  };
  systemMotion?.addEventListener?.("change", applyPreferences);
  window.addEventListener("storage", event => { if (event.key === key || event.key === null) { preferences = readPreferences(); applyPreferences(); } });
  applyPreferences();

  const games = {
    "blood-tunnel": { name: "Blood Tunnel", mount: "#title-screen .title-panel", start: "#start-game", list: "#trophy-list", steps: [
      ["Stay in the open lane", "Move with Left/Right, A/D, drag, or the side buttons. Watch the tunnel edges before they close."],
      ["Fire in short bursts", "Hold Fire or J to shoot. Release it to cool down before the heat meter fills. Space or Dash crosses dangerous gaps."],
      ["Choose your risk", "Complete the displayed rite and collect ichor. Start with Clean Blood before trying higher-risk pacts."] ] },
    "bone-breaker": { name: "Bone Breaker", mount: "#title-screen .title-panel", start: "#title-start", list: "#trophy-list", steps: [
      ["Aim before launching", "Move the paddle with touch, mouse, arrows, or A/D. Use the launch preview, then tap or click to release the ball."],
      ["Charge Soulfire", "Breaking bricks fills the ritual meter. Press E when it is full for a piercing volley. Ward pickups protect a missed ball."],
      ["Clear the graveyard", "Clear six levels, complete bounties, and choose relics between waves. Gravekeeper is the balanced first vow."] ] },
    "flappy-bat": { name: "Flappy Bat", mount: "#menu .menu-panel", start: "#btn-play", list: "#ach-list", steps: [
      ["Find a steady rhythm", "Tap, click, Space, or Up to flap. Small, regular corrections help you line up with the next opening."],
      ["Correct your flight", "Hold Down/S or Dive to descend faster. Shields can save a crash; slow-time relics give you room to react."],
      ["Build your next best", "Pass pillars and collect coins. Close calls add rewards, but a safe flight is the best way to learn each expedition."] ] },
    "graveyard-crossing": { name: "Graveyard Crossing", mount: "#quickMenu .quick-menu-panel", start: "#quickMenu [data-action=start]", list: "#trophyList", steps: [
      ["Cross one lane at a time", "Use arrows, WASD, swipes, or the D-pad. Pause on safe ground and look at the next lane before moving."],
      ["Seal the graves", "Reach the graves at the top when the route is safe. Watch moving traffic and use floating platforms to cross water."],
      ["Read each new night", "A new curse and rite appear each night. Read their rules before crossing. Use Pause whenever you need to review the screen."] ] },
    "hell-climb": { name: "Hell Climb", mount: "#mainMenu .menu-panel-content", start: "#playBtn, #hellPlayBtn", list: "#trophyList", steps: [
      ["Steer your next landing", "Use arrows, A/D, touch arrows, or optional tilt. Land on platforms to bounce upward. Begin with Classic."],
      ["Read the platform colors", "Stone is safe. Blue platforms drift, bone crumbles, purple vanishes, and orange launches you. Plan the next landing early."],
      ["Break through danger", "Space, Shoot, or tap-fire attacks void maws. Collect souls and finish rites to grow your build between climbs."] ] },
    "horror-snake": { name: "Serpent Sin", mount: "#menuPanel", start: "#startBtn", list: "#trophyList", steps: [
      ["Start with Classic", "Steer with arrows, WASD, Q/E turns, swipes, or the D-pad. Eat brains to grow; keep an escape lane beside your body."],
      ["Leave room to turn", "Avoid walls and your own coils. Make wider routes as the serpent grows instead of chasing a pickup into a tight corner."],
      ["Explore the other pacts", "Haunted and Nightmare add omens, rituals, relics, and mutations. Try them after learning the Classic rhythm."] ] },
    "undead-arena": { name: "Undead Arena", mount: "#titleScreen .title-panel", start: "#startRun", list: "#trophyList", steps: [
      ["Keep moving", "Move with WASD, arrows, or the D-pad. Circle around groups and leave a gap to escape through."],
      ["Choose how to aim", "Aim with the mouse or touch aim pad, or keep Aim Assist on. Hold Fire; Auto Fire is available in Options. Use Shift, E, or Dash to escape."],
      ["Prepare for the next wave", "Swap weapons as ammo runs low and collect pickups. Choose an upgrade between outbreaks to support your play style."] ] },
    "void-invaders": { name: "Void Invaders", mount: "#title-screen .title-panel", start: "#start-game, #start-endless", list: "#trophies-list", steps: [
      ["Defend your lane", "Move with Left/Right, A/D, drag, or side buttons. Shoot with Space, J, Fire, or Autofire. Start with Campaign."],
      ["Know your pickups", "D: double shot. R: rapid fire. S: shield. T: time snare. B: void bomb. +: extra life. Hold Shift for precise movement."],
      ["Build at the docks", "Survive to sector 3 to spend salvage. Leave space to dodge volleys and take safe pickups before chasing graze bonuses."] ] }
  };
  const gameId = location.pathname.split("/").filter(Boolean).find(part => Object.hasOwn(games, part));
  const game = games[gameId];
  const trophyControls = {
    "blood-tunnel": ["#trophies-toggle", "#trophies-toggle"], "bone-breaker": ["#close-trophies", "#title-trophies, #trophies"],
    "flappy-bat": ["#btn-ach-back", "#btn-achievements"], "graveyard-crossing": ["#closeTrophies", "#quickTrophiesBtn"],
    "hell-climb": ["#closeTrophies", "#menuTrophyBtn"], "horror-snake": ["#trophiesBtn", "#trophiesBtn"],
    "undead-arena": ["#closeTrophies", "#trophiesBtn"], "void-invaders": ["#trophies-toggle", "#trophies-toggle"]
  };
  const peaksKey = "aoh:trophy-progress:" + gameId;
  let peaks = Object.create(null);
  try {
    const saved = JSON.parse(localStorage.getItem(peaksKey) || "{}");
    for (const [metric, value] of Object.entries(saved || {})) if (/^[a-zA-Z][a-zA-Z0-9]*$/.test(metric) && Number.isFinite(value) && value >= 0 && value <= 1e12) peaks[metric] = value;
  } catch {}
  let peaksTimer = 0;
  function savePeaks() {
    clearTimeout(peaksTimer); peaksTimer = 0;
    if (!game) return;
    try { localStorage.setItem(peaksKey, JSON.stringify(peaks)); } catch {}
  }
  function trackMetrics(values) {
    let changed = false;
    for (const [metric, value] of Object.entries(values)) {
      if (/^[a-zA-Z][a-zA-Z0-9]*$/.test(metric) && Number.isFinite(value) && value > (peaks[metric] || 0) && value <= 1e12) {
        peaks[metric] = value; changed = true;
      }
    }
    if (changed && !peaksTimer) peaksTimer = setTimeout(savePeaks, 1000);
  }
  window.addEventListener("pagehide", () => { if (peaksTimer) savePeaks(); });
  document.addEventListener("visibilitychange", () => { if (document.hidden && peaksTimer) savePeaks(); });
  const seenThisSession = new Set();
  let dialog, content, bypassGuide = false;
  function element(tag, text, className) {
    const result = document.createElement(tag);
    if (text !== undefined) result.textContent = text;
    if (className) result.className = className;
    return result;
  }
  function button(text, action, className) {
    const result = element("button", text, className);
    result.type = "button"; result.addEventListener("click", action); return result;
  }
  function openDialog(title, trigger) {
    if (dialog.open) dialog.close();
    content.replaceChildren(element("h2", title));
    content.firstChild.id = "aoh-dialog-title";
    dialog.showModal();
    dialog.scrollTop = 0;
  }
  function guide(trigger, startButton = null) {
    openDialog(game.name + " — Quick start", trigger);
    let step = 0;
    const body = element("div"); content.append(body);
    function draw() {
      body.replaceChildren(element("p", "Step " + (step + 1) + " of " + game.steps.length), element("h3", game.steps[step][0]), element("p", game.steps[step][1]));
      const actions = element("div", undefined, "aoh-actions");
      actions.append(button("Close guide", () => dialog.close()));
      if (step > 0) actions.append(button("Back", () => { step--; draw(); }));
      actions.append(button(step < game.steps.length - 1 ? "Next" : startButton ? "Start run" : "Done", () => {
        if (step < game.steps.length - 1) { step++; draw(); return; }
        seenThisSession.add(gameId);
        try { localStorage.setItem("aoh:guide:" + gameId, "1"); } catch {}
        const start = startButton;
        dialog.close();
        if (start?.isConnected && !start.disabled) { bypassGuide = true; try { start.click(); } finally { bypassGuide = false; } }
      }, "aoh-primary"));
      body.append(actions);
      body.querySelector("h3").tabIndex = -1;
      body.querySelector("h3").focus();
    }
    draw();
  }
  function settings(trigger) {
    openDialog("Arcade settings", trigger);
    content.append(element("p", "These preferences apply to all eight cabinets. Each game's own sound and control options still apply."));
    const status = element("p", "", "aoh-status"); status.setAttribute("role", "status");
    const fields = [["effects", "Sound effects"], ["music", "Music"], ["vibration", "Vibration"], ["reduceMotion", "Reduced motion"], ["reduceFlashes", "Reduced flashes"]];
    for (const [name, title] of fields) {
      const label = element("label", title), input = element("input");
      input.type = "checkbox"; input.checked = preferences[name]; input.dataset.aohPreference = name;
      input.addEventListener("change", () => { try { updatePreferences({ [name]: input.checked }); status.textContent = "Preferences saved."; } catch (error) { input.checked = preferences[name]; status.textContent = error.message; } });
      label.append(input); content.append(label);
    }
    const label = element("label", "Master volume"), volume = element("input"), value = element("output", Math.round(preferences.volume * 100) + "%");
    volume.type = "range"; volume.min = "0"; volume.max = "100"; volume.value = String(Math.round(preferences.volume * 100));
    volume.dataset.aohPreference = "volume"; value.dataset.aohVolume = "true";
    volume.setAttribute("aria-label", "Master volume");
    volume.addEventListener("input", () => { try { updatePreferences({ volume: Number(volume.value) / 100 }); value.textContent = volume.value + "%"; } catch (error) { volume.value = String(Math.round(preferences.volume * 100)); status.textContent = error.message; } });
    label.append(volume, value); content.append(label);
    content.append(element("p", "Your device's reduced-motion preference is also respected. Reduced flashes suppresses full-screen flashes; gameplay warning markers remain visible."));
    content.append(status);
    if (game) {
      const cabinetOptions = {
        "blood-tunnel": ["#sound-toggle"],
        "bone-breaker": ["#title-sound-toggle", "#auto-launch"],
        "flappy-bat": ["#btn-sound", "#btn-music", "#btn-effects", "#btn-tap-flash"],
        "graveyard-crossing": ["#soundToggle"],
        "hell-climb": ["#menuMuteBtn", "#menuMusicBtn", "#menuTiltBtn"],
        "horror-snake": ["#menuSoundBtn", "#motionBtn"],
        "undead-arena": ["#titleSoundToggle", "#titleAutoAimToggle", "#titleAutoFireToggle"],
        "void-invaders": ["#sound-toggle", "#music-toggle", "#autofire-toggle"]
      };
      const options = element("div", undefined, "aoh-actions");
      const optionControls = [];
      for (const selector of cabinetOptions[gameId]) {
        const original = document.querySelector(selector);
        if (!original) continue;
        const control = button(original.textContent, () => {
          original.click();
          sync();
        });
        function sync() {
          control.textContent = original.textContent;
          control.disabled = original.disabled;
          control.title = original.title;
          if (original.hasAttribute("aria-pressed")) control.setAttribute("aria-pressed", original.getAttribute("aria-pressed"));
        }
        sync();
        optionControls.push(sync);
        options.append(control);
      }
      const syncOptions = () => optionControls.forEach(sync => sync());
      listeners.add(syncOptions);
      dialog.addEventListener("close", () => listeners.delete(syncOptions), { once: true });
      content.append(element("h3", "Cabinet controls"), options);
    }
    if (game && document.body.classList.contains("aoh-playing")) {
      const details = ["#runGoal", "#runPact", "#run-goal", "#run-pact", "#ritualName", "#ritualGoal", "#modifierLabel", "#modifierText", "#riteLabel", "#riteText", "#bounty"];
      const lines = details.map(selector => document.querySelector(selector)?.textContent.trim()).filter(Boolean);
      if (lines.length) content.append(element("h3", "Current run"), element("p", lines.join("\n"), "aoh-run-details"));
    }
    if (!game) saveTools(content, status);
    else content.append(element("p", "Save export, import, and game reset are available from Settings in the arcade hub."));
    const actions = element("div", undefined, "aoh-actions");
    actions.append(button("Done", () => dialog.close(), "aoh-primary")); content.append(actions);
    content.querySelector("input")?.focus();
  }
  function saveTools(parent, status) {
    const section = element("details"), heading = element("summary", "Save backups and reset"); section.append(heading);
    section.append(element("p", "Export a backup before changing devices or uninstalling. Import replaces local progress and preferences. A previous save is retained on this device so you can undo the last import or reset."));
    const actions = element("div", undefined, "aoh-actions");
    const undo = button("Undo last import/reset", () => run(() => window.ArcadeSave.undo(localStorage), "Previous save restored."));
    try { undo.disabled = !localStorage.getItem(window.ArcadeSave.rollbackKey); } catch { undo.disabled = true; }
    function run(action, message) {
      try {
        action();
        preferences = readPreferences();
        applyPreferences();
        window.dispatchEvent(new Event("arcade-save-changed"));
        status.textContent = message;
        undo.disabled = !localStorage.getItem(window.ArcadeSave.rollbackKey);
      }
      catch (error) { status.textContent = "No change completed: " + error.message; }
    }
      const exportButton = button("Export backup", async () => {
        exportButton.disabled = true;
      try {
        const data = window.ArcadeSave.snapshot(localStorage);
          const json = JSON.stringify(data, null, 2);
          const filename = "ArcadeOfHorror-save-" + new Date().toISOString().slice(0, 10) + ".json";
          if (window.Capacitor?.isNativePlatform()) {
            if (!window.Capacitor.isPluginAvailable("ArcadeSave")) throw new Error("Native export is unavailable in this app version.");
            const plugin = window.Capacitor.Plugins.ArcadeSave || window.Capacitor.registerPlugin("ArcadeSave");
            const result = await plugin.exportSave({ json, filename });
            status.textContent = result.saved ? "Backup saved. Keep the JSON file somewhere safe." : "Export canceled. Your progress is unchanged.";
            return;
          }
          const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
          const link = element("a"); link.href = url; link.download = filename;
        document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
        status.textContent = "Backup prepared. Keep the downloaded JSON file somewhere safe.";
        } catch (error) { status.textContent = "Backup failed: " + error.message; }
        finally { exportButton.disabled = false; }
      });
      actions.append(exportButton, undo);
    section.append(actions);
    const fileLabel = element("label", "Choose backup to import"), file = element("input");
    file.type = "file"; file.accept = ".json,application/json"; fileLabel.append(file); section.append(fileLabel);
    let pending = null, importRequest = 0;
    const importButton = button("Replace progress from backup", () => {
      if (!pending) return;
      run(() => window.ArcadeSave.restore(localStorage, pending), "Backup imported. Undo is available until the next import or reset.");
      pending = null; importButton.disabled = true; file.value = "";
    });
    importButton.disabled = true;
    file.addEventListener("change", async () => {
      const request = ++importRequest;
      pending = null; importButton.disabled = true;
      const selected = file.files?.[0]; if (!selected) return;
      try {
        if (selected.size > 1000000) throw new Error("Choose a backup smaller than 1 MB.");
        const parsed = JSON.parse(await selected.text());
        if (request !== importRequest) return;
        const data = window.ArcadeSave.validate(parsed);
        pending = parsed; importButton.disabled = false;
        status.textContent = "Backup checked: " + Object.keys(data).length + " save entries. Select Replace progress from backup to confirm replacement of your local saves and preferences.";
      } catch (error) { if (request === importRequest) status.textContent = "Import rejected: " + error.message; }
    });
    section.append(importButton, element("h3", "Reset one cabinet"));
    const select = element("select"); select.setAttribute("aria-label", "Cabinet to reset");
    select.append(element("option", "Choose a cabinet")); select.firstChild.value = "";
    for (const [id, config] of Object.entries(games)) { const option = element("option", config.name); option.value = id; select.append(option); }
    section.append(select);
    let reviewing = "";
    const reset = button("Review cabinet reset", () => {
      const id = select.value; if (!Object.hasOwn(games, id)) { status.textContent = "Choose a cabinet first."; return; }
      if (reviewing !== id) {
        reviewing = id; reset.textContent = "Confirm reset: " + games[id].name;
        status.textContent = "This clears only " + games[id].name + " scores, trophies, upgrades, cabinet preferences, and daily rewards. Other cabinets and shared settings stay saved. Select Confirm reset to continue.";
        return;
      }
      run(() => window.ArcadeSave.resetGame(localStorage, id), games[id].name + " reset. Undo is available.");
      reviewing = ""; reset.textContent = "Review cabinet reset";
    });
    select.addEventListener("change", () => { reviewing = ""; reset.textContent = "Review cabinet reset"; });
    section.append(reset); parent.append(section);
  }
  function enhanceTrophies(list) {
    if (!list) return;
    const tools = element("div", undefined, "aoh-trophy-tools");
    tools.setAttribute("role", "group"); tools.setAttribute("aria-label", "Trophy filters and close");
    const output = element("output"); output.setAttribute("aria-live", "polite");
    let filter = "all";
    const filters = [["all", "All"], ["unearned", "Unearned"], ["earned", "Earned"], ["closest", "Near completion"]];
    function apply() {
      const rows = Array.from(list.children).filter(row => row.hasAttribute("data-aoh-earned"));
      rows.forEach((row, index) => { if (!row.hasAttribute("data-aoh-order")) row.dataset.aohOrder = String(index); });
      let shown = 0;
      for (const row of rows) {
        const earned = row.dataset.aohEarned === "true";
        const ratio = Number(row.dataset.aohRatio || 0);
        const visible = filter === "all" || (filter === "earned" ? earned : filter === "unearned" ? !earned : !earned && ratio > 0);
        row.hidden = !visible; if (visible) shown++;
      }
      const sorted = [...rows].sort((a, b) => filter === "closest" ? Number(b.dataset.aohRatio || 0) - Number(a.dataset.aohRatio || 0) || Number(a.dataset.aohOrder) - Number(b.dataset.aohOrder) : Number(a.dataset.aohOrder) - Number(b.dataset.aohOrder));
      if (sorted.some((row, index) => row !== rows[index])) list.replaceChildren(...sorted);
      output.textContent = shown ? shown + " of " + rows.length + " trophies shown" : filter === "closest" ? "No tracked progress yet. Start a run or choose All to browse the goals." : "No trophies in this filter yet.";
      tools.querySelectorAll("button[data-filter]").forEach(control => control.setAttribute("aria-pressed", String(control.dataset.filter === filter)));
    }
    for (const [id, title] of filters) { const control = button(title, () => { filter = id; apply(); }); control.dataset.filter = id; tools.append(control); }
    function closeTrophies() {
      const controls = trophyControls[gameId];
      document.querySelector(controls[0])?.click();
      Array.from(document.querySelectorAll(controls[1])).find(control => control.getClientRects().length)?.focus({ preventScroll: true });
    }
    tools.append(button("Close trophies", closeTrophies, "aoh-trophy-close"));
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && !document.querySelector("dialog[open]") && list.getClientRects().length && getComputedStyle(list).visibility !== "hidden") {
        event.preventDefault(); event.stopImmediatePropagation(); closeTrophies();
      }
    }, true);
    tools.append(output); list.before(tools);
    new MutationObserver(apply).observe(list, { childList: true }); apply();
  }
  function fitGameplay() {
    const layouts = {
      "blood-tunnel": { title: "#title-screen", hud: ".hud", controls: ".mobile-controls" },
      "bone-breaker": { title: "#title-screen", hud: ".hud" },
      "flappy-bat": { title: "#menu", hud: ".hud" },
      "graveyard-crossing": { title: "#quickMenu", hud: ".utility-actions", controls: ".touch-controls", side: true },
      "hell-climb": { title: "#mainMenu", hud: ".hud", controls: ".mobile-controls" },
      "horror-snake": { title: "#overlay.title-screen", hud: ".hud", controls: ".mobile-controls", side: true },
      "undead-arena": { title: "#titleScreen", hud: ".hud", controls: ".touch-controls", arena: true },
      "void-invaders": { title: "#title-screen", hud: ".hud", controls: ".mobile-controls" }
    };
    const layout = layouts[gameId];
    const canvas = document.querySelector(gameId === "horror-snake" || gameId === "graveyard-crossing" ? "#gameCanvas" : "#game");
    const hud = document.querySelector(layout.hud);
    const controls = layout.controls && document.querySelector(layout.controls);
    if (!canvas || !hud) return;
    document.body.dataset.aohGame = gameId;
    canvas.classList.add("aoh-fit-canvas");
    hud.classList.add("aoh-fit-hud");
    controls?.classList.add("aoh-fit-controls");
    for (let parent = canvas.parentElement; parent && parent !== document.body; parent = parent.parentElement) parent.classList.add("aoh-fit-parent");
    const runSettings = button("Settings", () => {
      const resume = cabinetControls && !cabinetControls.paused() && cabinetControls.active();
      if (resume) cabinetControls.pause(true);
      settings(runSettings);
      dialog.addEventListener("close", () => {
        if (resume && cabinetControls.active()) cabinetControls.pause(false);
      }, { once: true });
    }, "aoh-run-settings");
    document.body.append(runSettings);
    let scheduled = false;
    const setClass = (name, enabled) => {
      if (document.body.classList.contains(name) !== enabled) document.body.classList.toggle(name, enabled);
    };
    const setSize = (name, value) => {
      const next = Math.round(value) + "px";
      if (document.body.style.getPropertyValue(name) !== next) document.body.style.setProperty(name, next);
    };
    function fit() {
      scheduled = false;
      const title = document.querySelector(layout.title);
      const playing = !title || !title.getClientRects().length || getComputedStyle(title).visibility === "hidden";
      setClass("aoh-playing", playing);
      const touch = matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0;
      const width = document.documentElement.clientWidth;
      const height = Math.round(window.visualViewport?.height || innerHeight);
      const landscape = width > height;
      setClass("aoh-touch", touch);
      setClass("aoh-landscape", landscape);
      const showSettings = playing && Boolean(cabinetControls?.active());
      if (runSettings.hidden === showSettings) runSettings.hidden = !showSettings;
      if (!playing) return;
      window.ArcadeDailyRewards?.closePanel();
      const top = Math.max(50, hud.getBoundingClientRect().bottom + 8);
      let left = 8, right = 8, bottom = 8;
      if (touch && controls) {
        if (landscape && layout.arena) { left = 160; right = 160; }
        else if (landscape && layout.side) left = 174;
        else bottom = controls.getBoundingClientRect().height + 16;
      }
      const availableWidth = Math.max(1, width - left - right);
      const availableHeight = Math.max(1, height - top - bottom);
      const ratio = canvas.width / canvas.height;
      const canvasHeight = Math.min(availableHeight, availableWidth / ratio);
      const canvasWidth = canvasHeight * ratio;
      setSize("--aoh-canvas-width", canvasWidth);
      setSize("--aoh-canvas-height", canvasHeight);
      setSize("--aoh-canvas-left", left + (availableWidth - canvasWidth) / 2);
      setSize("--aoh-canvas-top", top + (availableHeight - canvasHeight) / 2);
      setSize("--aoh-hud-bottom", top);
    }
    function schedule() {
      if (!scheduled) { scheduled = true; requestAnimationFrame(fit); }
    }
    new MutationObserver(schedule).observe(document.body, { subtree: true, attributes: true, attributeFilter: ["hidden", "class", "aria-hidden"] });
    const resize = new ResizeObserver(schedule);
    resize.observe(hud);
    if (controls) resize.observe(controls);
    window.addEventListener("resize", schedule);
    window.visualViewport?.addEventListener("resize", schedule);
    document.addEventListener("click", schedule);
    document.addEventListener("keyup", schedule);
    fit();
  }

  function simplifyMenu() {
    const mount = document.querySelector(gameId === "horror-snake" ? "#overlay .overlay-card" : game.mount);
    const start = document.querySelector(game.start);
    if (!mount || !start) return;
    if (gameId === "void-invaders") {
      for (const selector of [".title-stats", "#controls-card", "#trophies-card"]) mount.append(document.querySelector("#title-screen " + selector));
    }
    const artwork = { "blood-tunnel": "Assets/mainbackground.webp", "bone-breaker": "Assets/titlecard.webp", "flappy-bat": "assets/titlescreen.webp" }[gameId] || "assets/titlecard.webp";
    const art = element("img", undefined, "aoh-menu-art");
    art.src = artwork; art.alt = "";
    const home = element("div", undefined, "aoh-menu-home");
    home.append(element("p", "ARCADE OF HORROR", "aoh-menu-kicker"), element("h1", game.name));
    const play = button("Play", () => start.click(), "aoh-primary");
    function updatePlayLabel() {
      const label = cabinetControls?.label?.() || "";
      const text = label ? "Play · " + label : "Play";
      if (play.textContent !== text) play.textContent = text;
    }
    document.addEventListener("click", () => queueMicrotask(updatePlayLabel));
    updatePlayLabel();
    const more = button("Game menu", () => {
      mount.classList.add("aoh-menu-expanded"); mount.scrollTop = 0; back.focus({ preventScroll: true });
    });
    const help = button("How to play", () => guide(help));
    const preferences = button("Settings", () => settings(preferences));
    home.append(play, more, help, preferences);
    const back = button("Back to Play", () => {
      window.ArcadeDailyRewards?.closePanel();
      mount.classList.remove("aoh-menu-expanded"); mount.scrollTop = 0; more.focus({ preventScroll: true });
    }, "aoh-menu-back");
    mount.prepend(back); mount.append(art, home);
    // Serpent Sin reuses its overlay for pause, mutations, and results.
    // Apply the title layout only while its actual title state is active.
    const sync = () => mount.classList.toggle("aoh-menu-surface", gameId !== "horror-snake" || document.querySelector("#overlay").classList.contains("title-screen"));
    sync();
    if (gameId === "horror-snake") new MutationObserver(sync).observe(document.querySelector("#overlay"), { attributes: true, attributeFilter: ["class"] });
  }
  document.addEventListener("DOMContentLoaded", () => {
    dialog = element("dialog", undefined, "aoh-dialog"); dialog.id = "aoh-dialog"; dialog.setAttribute("aria-labelledby", "aoh-dialog-title");
    content = element("div"); dialog.append(content); document.body.append(dialog);
    dialog.addEventListener("keydown", event => event.stopPropagation());
    dialog.addEventListener("keyup", event => event.stopPropagation());
    // Let the native dialog restore focus. Guide state belongs to its own
    // invocation, so a queued close event cannot affect a newly opened guide.
    const mount = document.querySelector(game?.mount || ".arcade-footer");
    if (mount) {
      const tools = element("div", undefined, "aoh-tools");
      const settingsButton = button("Arcade settings", () => settings(settingsButton)); tools.append(settingsButton);
      if (game) { const guideButton = button("Quick guide", () => guide(guideButton)); tools.append(guideButton); }
      const daily = game && document.querySelector(".daily-reward-trigger");
      if (daily) tools.append(daily);
      mount.append(tools);
    }
    if (game) {
      simplifyMenu();
      fitGameplay();
      enhanceTrophies(document.querySelector(game.list));
      function hasSeenGuide() {
        if (seenThisSession.has(gameId)) return true;
        try { return localStorage.getItem("aoh:guide:" + gameId) === "1"; } catch { return false; }
      }
      document.addEventListener("click", event => {
        if (bypassGuide || !(event.target instanceof Element)) return;
        const start = event.target.closest(game.start); if (!start || start.disabled) return;
        if (!hasSeenGuide()) { event.preventDefault(); event.stopImmediatePropagation(); guide(start, start); }
      }, true);
      document.addEventListener("keydown", event => {
        if (dialog.open || hasSeenGuide() || event.repeat || !["Enter", " "].includes(event.key)) return;
        if (event.target instanceof Element && event.target.closest("dialog[open], button, summary, input, select, textarea, a, [role=button], [contenteditable=true]")) return;
        const menu = document.querySelector(game.mount);
        if (!menu?.getClientRects().length) return;
        const start = Array.from(document.querySelectorAll(game.start)).find(button => !button.disabled && (button.getClientRects().length || document.querySelector(".aoh-menu-home")?.getClientRects().length));
        if (start) { event.preventDefault(); event.stopImmediatePropagation(); guide(document.activeElement, start); }
      }, true);
    }
  });
})();
