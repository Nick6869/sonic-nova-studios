(function () {
  "use strict";

  const ENDPOINT = String(window.AOH_LEADERBOARD_ENDPOINT || "").trim();
  const COUNTRY = String(window.AOH_LEADERBOARD_COUNTRY || "US").trim() || "US";
  const PLAYER_ID_KEY = "aoh:nationalLeaderboard:playerId";
  const DISPLAY_NAME_KEY = "aoh:nationalLeaderboard:displayName";
  const SUBMITTED_PREFIX = "aoh:nationalLeaderboard:submitted:";
  const boards = new Map();

  function storageGet(key, fallback = "") {
    try {
      return window.localStorage.getItem(key) || fallback;
    } catch (error) {
      return fallback;
    }
  }

  function storageSet(key, value) {
    try {
      window.localStorage.setItem(key, String(value));
    } catch (error) {
      // National leaderboard identity is optional.
    }
  }

  function playerId() {
    let id = storageGet(PLAYER_ID_KEY);
    if (!id) {
      const suffix = Math.random().toString(36).slice(2, 10);
      id = `aoh-${Date.now().toString(36)}-${suffix}`;
      storageSet(PLAYER_ID_KEY, id);
    }
    return id;
  }

  function displayName() {
    let name = storageGet(DISPLAY_NAME_KEY);
    if (!name) {
      name = `Player ${Math.floor(1000 + Math.random() * 9000)}`;
      storageSet(DISPLAY_NAME_KEY, name);
    }
    return name;
  }

  function setDisplayName(name) {
    const cleaned = String(name || "").trim().replace(/\s+/g, " ").slice(0, 24);
    const finalName = cleaned || displayName();
    storageSet(DISPLAY_NAME_KEY, finalName);
    return finalName;
  }

  function submittedKey(gameId) {
    return `${SUBMITTED_PREFIX}${gameId}`;
  }

  function getSubmittedScore(gameId) {
    return Number(storageGet(submittedKey(gameId), "0")) || 0;
  }

  function setSubmittedScore(gameId, score) {
    storageSet(submittedKey(gameId), Math.max(0, Math.floor(Number(score) || 0)));
  }

  function createBoard(config) {
    const overlay = document.createElement("dialog");
    overlay.className = "national-leaderboard-overlay hidden";
    overlay.setAttribute("aria-label", (ENDPOINT ? "Leaderboards" : "Local Records") + " for " + config.gameName);

    const panel = document.createElement("div");
    panel.className = "national-leaderboard-panel";

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "national-leaderboard-close";
    closeButton.textContent = "Close";
    closeButton.autofocus = true;

    const details = document.createElement("details");
    details.className = "national-leaderboard";
    details.dataset.gameId = config.gameId;
    details.open = true;

    const summary = document.createElement("summary");
    const title = document.createElement("span");
    title.className = "national-leaderboard-title";
    title.innerHTML = `<strong>${ENDPOINT ? "Leaderboards" : "Local Records"}</strong><span>${config.gameName}</span>`;
    summary.appendChild(title);
    summary.addEventListener("click", (event) => event.preventDefault());

    const body = document.createElement("div");
    body.className = "national-leaderboard-body";

    const status = document.createElement("div");
    status.className = "national-leaderboard-status";

    const controls = document.createElement("div");
    controls.className = "national-leaderboard-controls";

    const label = document.createElement("label");
    label.textContent = "Public name";

    const input = document.createElement("input");
    input.type = "text";
    input.maxLength = 24;
    input.value = ENDPOINT ? displayName() : "";
    input.autocomplete = "nickname";
    input.setAttribute("aria-label", "Public leaderboard display name");
    label.appendChild(input);

    const saveButton = document.createElement("button");
    saveButton.type = "button";
    saveButton.textContent = "Save Name";

    const refreshButton = document.createElement("button");
    refreshButton.type = "button";
    refreshButton.textContent = "Refresh";

    controls.append(label, saveButton, refreshButton);

    const personal = document.createElement("section");
    personal.className = "personal-leaderboard";

    const personalTitle = document.createElement("strong");
    personalTitle.textContent = "Personal";

    const personalList = document.createElement("div");
    personalList.className = "personal-leaderboard-list";

    personal.append(personalTitle, personalList);

    const nationalTitle = document.createElement("strong");
    nationalTitle.className = "national-leaderboard-section-title";
    nationalTitle.textContent = "National";


    const list = document.createElement("div");
    list.className = "national-leaderboard-list";

    const privacy = document.createElement("div");
    privacy.className = "national-leaderboard-privacy";
    privacy.textContent = "Personal bests stay on this device. If online boards are enabled, the public name, game, score, anonymous player ID, and region are submitted.";
    status.setAttribute("role", "status");
    body.append(personal, status);
    if (ENDPOINT) body.append(nationalTitle, controls, list, privacy);
    details.append(summary, body);
    panel.append(closeButton, details);
    overlay.append(panel);

    const board = { ...config, overlay, details, status, list, input, personalList };
    closeButton.addEventListener("click", () => closeBoard(board));
    overlay.addEventListener("close", () => { if (!overlay.open) overlay.classList.add("hidden"); });
    overlay.addEventListener("keydown", event => event.stopPropagation());
    overlay.addEventListener("keyup", event => event.stopPropagation());
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) closeBoard(board);
    });
    saveButton.addEventListener("click", () => {
      input.value = setDisplayName(input.value);
      setStatus(board, "Public name saved for future national submissions.");
    });
    refreshButton.addEventListener("click", () => refresh(config.gameId));
    input.addEventListener("change", () => {
      input.value = setDisplayName(input.value);
    });

    return board;
  }

  function findMenuMount() {
    const selectors = [
      "#menu .menu-panel > .menu-actions",
      "#mainMenu .menu-actions",
      "#titleScreen .title-menu-actions",
      "#title-screen .title-menu-actions",
      "#title-screen .menu-buttons",
      "#menuPanel .option-row",
      "#quickMenu .quick-menu-actions",
      ".title-panel .menu-buttons",
      ".title-panel .title-menu-actions",
      ".menu-panel .menu-actions"
    ];
    for (const selector of selectors) {
      const match = document.querySelector(selector);
      if (match) return match;
    }
    return null;
  }

  function placeBoard(board) {
    document.body.appendChild(board.overlay);
    const mount = findMenuMount();
    if (!mount) return;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "national-leaderboard-button";
    button.textContent = ENDPOINT ? "Leaderboards" : "Local Records";
    button.addEventListener("click", () => openBoard(board));
    mount.appendChild(button);
  }

  function setStatus(board, text) {
    if (board?.status) board.status.textContent = text;
  }

  function renderRows(board, rows) {
    board.list.replaceChildren();
    if (!rows.length) {
      const empty = document.createElement("div");
      empty.className = "national-leaderboard-status";
      empty.textContent = "No national scores yet.";
      board.list.appendChild(empty);
      return;
    }

    rows.slice(0, 10).forEach((entry, index) => {
      const row = document.createElement("div");
      row.className = "national-leaderboard-row";

      const rank = document.createElement("span");
      rank.className = "national-leaderboard-rank";
      rank.textContent = `#${Number(entry.rank) || index + 1}`;

      const name = document.createElement("span");
      name.className = "national-leaderboard-name";
      name.textContent = String(entry.displayName || entry.name || "Player").slice(0, 24);

      const score = document.createElement("span");
      score.className = "national-leaderboard-score";
      score.textContent = Math.max(0, Math.floor(Number(entry.score) || 0)).toLocaleString();

      row.append(rank, name, score);
      board.list.appendChild(row);
    });
  }

  function scoreFromStorage(key) {
    return Math.max(0, Math.floor(Number(storageGet(key, "0")) || 0));
  }

  function normalizePersonalScores(board) {
    if (typeof board.getPersonalScores === "function") {
      try {
        const rows = board.getPersonalScores();
        if (Array.isArray(rows)) {
          return rows
            .map((row) => ({
              label: String(row.label || "Personal Best"),
              score: Math.max(0, Math.floor(Number(row.score) || 0))
            }))
            .filter((row) => row.label);
        }
      } catch (error) {
        // Fall back to the last locally queued public score.
      }
    }
    if (board.personalBestKey) {
      return [{ label: "Personal Best", score: scoreFromStorage(board.personalBestKey) }];
    }
    return [{ label: "Personal Best", score: getSubmittedScore(board.gameId) }];
  }

  function renderPersonalRows(board) {
    board.personalList.replaceChildren();
    const rows = normalizePersonalScores(board);
    if (!rows.length) {
      const row = document.createElement("div");
      row.className = "personal-leaderboard-row";
      row.innerHTML = "<span>Personal Best</span><strong>0</strong>";
      board.personalList.appendChild(row);
      return;
    }

    rows.slice(0, 6).forEach((entry) => {
      const row = document.createElement("div");
      row.className = "personal-leaderboard-row";

      const label = document.createElement("span");
      label.textContent = entry.label;

      const score = document.createElement("strong");
      score.textContent = entry.score.toLocaleString();

      row.append(label, score);
      board.personalList.appendChild(row);
    });
  }

  function openBoard(board) {
    renderPersonalRows(board);
    board.overlay.classList.remove("hidden");
    if (!board.overlay.open) board.overlay.showModal();
    refresh(board.gameId);
  }

  function closeBoard(board) {
    board.overlay.close();
    board.overlay.classList.add("hidden");
  }

  async function refresh(gameId) {
    const board = boards.get(gameId);
    if (!board) return;

    if (!ENDPOINT) {
      renderRows(board, []);
      setStatus(board, "Online leaderboards are not enabled. Personal records stay on this device.");
      return;
    }

    try {
      setStatus(board, "Loading national scores...");
      const url = new URL(ENDPOINT, window.location.origin);
      url.searchParams.set("gameId", gameId);
      url.searchParams.set("country", COUNTRY);
      url.searchParams.set("limit", "10");
      const response = await fetch(url.toString(), { method: "GET", cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const rows = Array.isArray(data) ? data : Array.isArray(data.scores) ? data.scores : [];
      renderRows(board, rows);
      setStatus(board, `${COUNTRY} national scores loaded.`);
    } catch (error) {
      setStatus(board, "National leaderboard is temporarily unavailable.");
    }
  }

  async function submitScore(gameId, score, meta = {}) {
    const numericScore = Math.max(0, Math.floor(Number(score) || 0));
    if (!gameId || numericScore <= 0) return false;

    const board = boards.get(gameId);
    const previous = getSubmittedScore(gameId);
    if (numericScore <= previous) return false;

    if (!ENDPOINT) {
      setSubmittedScore(gameId, numericScore);
      if (board) renderPersonalRows(board);
      if (board) setStatus(board, `Personal record saved on this device: ${numericScore.toLocaleString()}.`);
      return false;
    }

    try {
      if (board) setStatus(board, "Submitting national score...");
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId,
          score: numericScore,
          playerId: playerId(),
          displayName: displayName(),
          country: COUNTRY,
          meta: {
            app: "Arcade of Horror",
            gameName: board?.gameName || meta.gameName || gameId,
            ...meta
          }
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setSubmittedScore(gameId, numericScore);
      if (board) {
        renderPersonalRows(board);
        setStatus(board, `National score submitted: ${numericScore.toLocaleString()}.`);
        refresh(gameId);
      }
      return true;
    } catch (error) {
      if (board) setStatus(board, "Could not submit national score. It will try again when you beat it.");
      return false;
    }
  }

  function init(config) {
    if (!config?.gameId) return null;
    if (boards.has(config.gameId)) return boards.get(config.gameId);

    const board = createBoard({
      gameId: config.gameId,
      gameName: config.gameName || config.gameId,
      personalBestKey: config.personalBestKey || "",
      getPersonalScores: config.getPersonalScores
    });
    boards.set(config.gameId, board);
    placeBoard(board);
    return board;
  }

  window.NationalLeaderboard = {
    init,
    refresh,
    submitScore,
    setDisplayName,
    getPlayerId: playerId,
    open: (gameId) => {
      const board = boards.get(gameId);
      if (board) openBoard(board);
    }
  };

  window.AOHLeaderboard = {
    init,
    submit(payload = {}) {
      const gameId = payload.game || payload.gameId;
      if (!gameId) return false;
      if (!boards.has(gameId)) {
        init({
          gameId,
          gameName: payload.gameName || String(gameId).replace(/-/g, " ")
        });
      }
      return submitScore(gameId, payload.score, payload.meta || {});
    }
  };
})();
