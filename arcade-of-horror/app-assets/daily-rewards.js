(() => {
  "use strict";

  const pathParts = location.pathname.split("/").filter(Boolean);
  const lastPart = pathParts[pathParts.length - 1] || "";
  const gameId = lastPart.includes(".") ? pathParts[pathParts.length - 2] : lastPart;
  const rewardPools = {
    "hell-climb": [
      { id: "souls", label: "25 souls banked", kind: "currency", key: "hellclimb_total_souls_v1", amount: 25 },
      { id: "shield", label: "Infernal shield for 2 climbs", kind: "boost", runs: 2, amount: 1 },
      { id: "spring", label: "Spring charge for 2 climbs", kind: "boost", runs: 2, amount: 1 }
    ],
    "flappy-bat": [
      { id: "coins", label: "20 coins banked", kind: "currency", key: "flappybat_coins_v1", amount: 20 },
      { id: "shield", label: "Bone ward for 2 flights", kind: "boost", runs: 2, amount: 1 },
      { id: "slow", label: "Time rot for 2 flights", kind: "boost", runs: 2, amount: 1 }
    ],
    "void-invaders": [
      { id: "shield", label: "Void shield for 2 sorties", kind: "boost", runs: 2, amount: 1 },
      { id: "life", label: "Extra life for 2 sorties", kind: "boost", runs: 2, amount: 1 },
      { id: "surge", label: "Half-charged surge for 3 sorties", kind: "boost", runs: 3, amount: 60 }
    ],
    "blood-tunnel": [
      { id: "shield", label: "Shield clot for 2 descents", kind: "boost", runs: 2, amount: 1 },
      { id: "headstart", label: "150 bonus score for 3 descents", kind: "boost", runs: 3, amount: 150 },
      { id: "dash", label: "Faster dash recovery for 2 descents", kind: "boost", runs: 2, amount: 1 }
    ],
    "bone-breaker": [
      { id: "shield", label: "Shield charge for 2 hunts", kind: "boost", runs: 2, amount: 1 },
      { id: "life", label: "Extra life for 2 hunts", kind: "boost", runs: 2, amount: 1 },
      { id: "ritual", label: "50% Soulfire charge for 3 hunts", kind: "boost", runs: 3, amount: 50 }
    ],
    "graveyard-crossing": [
      { id: "ward", label: "Lantern ward for 2 crossings", kind: "boost", runs: 2, amount: 1 },
      { id: "life", label: "Extra life for 2 crossings", kind: "boost", runs: 2, amount: 1 },
      { id: "time", label: "20 bonus seconds for 3 crossings", kind: "boost", runs: 3, amount: 20 }
    ],
    "horror-snake": [
      { id: "armor", label: "Bone armor for 2 pacts", kind: "boost", runs: 2, amount: 1 },
      { id: "coil", label: "Coil charge for 2 pacts", kind: "boost", runs: 2, amount: 1 },
      { id: "dread", label: "10 starting dread for 3 Haunted or Nightmare runs", kind: "boost", runs: 3, amount: 10 }
    ],
    "undead-arena": [
      { id: "armor", label: "3 armor for 2 outbreaks", kind: "boost", runs: 2, amount: 3 },
      { id: "life", label: "Extra life for 2 outbreaks", kind: "boost", runs: 2, amount: 1 },
      { id: "ammo", label: "Bonus shotgun ammo for 3 outbreaks", kind: "boost", runs: 3, amount: 18 }
    ]
  };

  const pool = rewardPools[gameId];
  if (!pool) return;

  const claimKey = `arcadeDaily:${gameId}:claimed`;
  const boostKey = `arcadeDaily:${gameId}:boost`;
  let closePanel = () => {};

  function currentOffering() {
    const today = new Date();
    const calendarDay = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    const date = new Date(calendarDay).toISOString().slice(0, 10);
    const day = Math.floor(calendarDay / 86400000);
    return { date, reward: pool[day % pool.length] };
  }

  function readBoost() {
    try {
      const saved = JSON.parse(localStorage.getItem(boostKey));
      const reward = pool.find(item => item.kind === "boost" && item.id === saved?.id);
      if (!reward || !Number.isInteger(saved.runs) || saved.runs < 1) return null;
      return { ...reward, runs: Math.min(reward.runs, saved.runs), claimed: saved.claimed };
    } catch { return null; }
  }

  function claimOffering(date, reward) {
    const current = currentOffering();
    if (date !== current.date) throw new Error("A new offering is available. Review it before claiming.");
    if (localStorage.getItem(claimKey) === date) throw new Error("Today’s offering has already been claimed.");
    if (reward.kind === "boost" && readBoost()) throw new Error("Use the remaining runs from your current offering first.");
    const key = reward.kind === "currency" ? reward.key : boostKey;
    const previous = localStorage.getItem(key);
    const value = reward.kind === "currency"
      ? String((Number(previous) || 0) + reward.amount)
      : JSON.stringify({ ...reward, claimed: date });
    localStorage.setItem(key, value);
    try {
      localStorage.setItem(claimKey, date);
    } catch (error) {
      if (previous === null) localStorage.removeItem(key);
      else localStorage.setItem(key, previous);
      throw error;
    }
  }

  window.ArcadeDailyRewards = {
    consumeBoost(id = gameId, eligible = () => true) {
      if (id !== gameId) return null;
      const boost = readBoost();
      if (!boost || !eligible(boost)) return null;
      boost.runs -= 1;
      try {
        if (boost.runs > 0) localStorage.setItem(boostKey, JSON.stringify(boost));
        else localStorage.removeItem(boostKey);
      } catch { return null; }
      return boost;
    },
    peekBoost(id = gameId) { return id === gameId ? readBoost() : null; },
    closePanel() { closePanel(); }
  };

  document.addEventListener("DOMContentLoaded", () => {
    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "daily-reward-trigger";
    trigger.textContent = "Daily Offering";

    const panel = document.createElement("aside");
    panel.className = "daily-reward";
    panel.id = "daily-offering-" + gameId;
    panel.hidden = true;
    panel.setAttribute("aria-label", "Daily offering");
    panel.innerHTML = '<strong>Daily Offering</strong><p role="status"></p><div class="daily-reward-actions"></div>';
    const heading = panel.querySelector("strong");
    const message = panel.querySelector("p");
    const actions = panel.querySelector(".daily-reward-actions");
    trigger.setAttribute("aria-controls", panel.id);
    trigger.setAttribute("aria-expanded", "false");

    const claimButton = document.createElement("button");
    const closeButton = document.createElement("button");
    claimButton.type = closeButton.type = "button";
    claimButton.textContent = "Claim";
    closeButton.textContent = "Close";
    actions.append(claimButton, closeButton);
    document.body.append(trigger, panel);

    let selected = currentOffering();
    let claimed = false;
    function refresh() {
      const next = currentOffering();
      try { claimed = localStorage.getItem(claimKey) === next.date; } catch { claimed = false; }
      selected = next;
      trigger.textContent = claimed ? "Offering Claimed" : "Daily Offering";
      heading.textContent = trigger.textContent;
      claimButton.hidden = claimed;
      message.textContent = claimed ? "Your offering for today has been claimed." : next.reward.label;
    }

    closePanel = () => {
      if (panel.hidden) return;
      panel.hidden = true;
      trigger.setAttribute("aria-expanded", "false");
    };
    trigger.addEventListener("click", () => {
      if (!panel.hidden) { closePanel(); return; }
      refresh();
      panel.hidden = false;
      trigger.setAttribute("aria-expanded", "true");
      (claimed ? closeButton : claimButton).focus();
    });
    claimButton.addEventListener("click", async () => {
      claimButton.disabled = true;
      const { date, reward } = selected;
      try {
        const apply = () => claimOffering(date, reward);
        if (navigator.locks) await navigator.locks.request(claimKey, apply);
        else apply();
        refresh();
        message.textContent = reward.kind === "boost" ? reward.label + ". It will activate on an eligible run." : reward.label + ". Added to your balance.";
        window.dispatchEvent(new CustomEvent("arcade-daily-claimed", { detail: { gameId, reward } }));
        closeButton.focus();
      } catch (error) {
        refresh();
        message.textContent = error instanceof DOMException ? "The offering could not be saved. Please try again." : error.message;
      } finally { claimButton.disabled = false; }
    });
    closeButton.addEventListener("click", () => { closePanel(); trigger.focus(); });
    panel.addEventListener("keydown", event => {
      if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); closeButton.click(); }
    });
    window.addEventListener("storage", event => { if (event.key === claimKey && panel.hidden) refresh(); });
    refresh();
  });
})();
