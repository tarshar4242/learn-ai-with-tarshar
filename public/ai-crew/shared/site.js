/* 共用工具：成員證存取（只留手機）、設定檔載入、序號、日期、頁首、提示訊息 */
(function () {
  const CARD_KEY = "aicrew.card.v1";
  const read = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
  const write = (f) => { try { f(); } catch {} };
  let held = null;

  const Card = {
    get() {
      const c = held || read(CARD_KEY);
      return c && c.name && c.serial && c.group ? c : null;
    },
    set(card) { held = card; write(() => localStorage.setItem(CARD_KEY, JSON.stringify(card))); },
    clear() { held = null; write(() => localStorage.removeItem(CARD_KEY)); }
  };

  let cfgPromise = null;
  function loadConfig() {
    if (!cfgPromise) {
      cfgPromise = fetch("data/config.json", { cache: "no-store" })
        .then((r) => { if (!r.ok) throw new Error("config " + r.status); return r.json(); });
    }
    return cfgPromise;
  }
  const groupOf = (cfg, id) => (cfg.groups || []).find((g) => g.id === id) || null;

  /* 序號：名冊有這個人就用名冊上的固定序號；沒有就用名字算出一組穩定的號碼（同名同組永遠相同）。 */
  function hash(str) {
    let h = 2166136261;
    for (const ch of str) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619) >>> 0; }
    return h;
  }
  function assignSerial(cfg, name, groupId) {
    const prefix = cfg.serialPrefix ? cfg.serialPrefix + "-" : "";
    const hit = (cfg.roster || []).find((r) => r.group === groupId && r.name.trim() === name.trim());
    if (hit && hit.serial) return { serial: prefix + hit.serial, listed: true };
    const n = 100 + (hash(groupId + "|" + name.trim()) % 900);
    return { serial: prefix + groupId + "-" + n, listed: false };
  }

  function todayTW() {
    const d = new Date(Date.now() + 8 * 3600e3);
    const p = (n) => String(n).padStart(2, "0");
    return d.getUTCFullYear() + "." + p(d.getUTCMonth() + 1) + "." + p(d.getUTCDate());
  }

  const CLOVER = '<svg class="clover" viewBox="0 0 24 24" aria-hidden="true"><g fill="#2F8F62"><circle cx="8.5" cy="8.5" r="4.6"/><circle cx="15.5" cy="8.5" r="4.6"/><circle cx="8.5" cy="15.5" r="4.6"/><circle cx="15.5" cy="15.5" r="4.6"/></g><path d="M12 13v8" stroke="#236E4B" stroke-width="2" stroke-linecap="round" fill="none"/></svg>';
  function siteHeader(container, { home = false, title = "AI 陪跑工作坊" } = {}) {
    const brand = `<a class="brand" href="./">${CLOVER}<span>${title}</span></a>`;
    const back = '<a class="back" href="./"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>首頁</a>';
    container.innerHTML = home ? brand : back + brand;
  }

  let toastTimer = null;
  function toast(text) {
    let n = document.getElementById("siteToast");
    if (!n) {
      n = document.createElement("div");
      n.id = "siteToast";
      n.className = "toast";
      n.setAttribute("role", "status");
      document.body.appendChild(n);
    }
    n.textContent = text;
    n.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => n.classList.remove("show"), 2500);
  }

  function requireCard() {
    const card = Card.get();
    if (!card) {
      const next = location.pathname.split("/").pop() + location.search;
      location.replace("id.html?next=" + encodeURIComponent(next));
      return null;
    }
    return card;
  }

  window.AICrew = { Card, loadConfig, groupOf, assignSerial, todayTW, siteHeader, toast, requireCard };
})();
