/* web-story-deck ｜ 網頁感劇本簡報引擎 v0.2（形象 C 深藍版）
   讀頁面裡 <script id="deck" type="application/json"> 的劇本，渲染成場景並負責播放。
   操作：→ / 空白鍵 / 點右側 = 下一拍；← / 點左側 = 上一場；N = 講者備忘；F = 全螢幕
   網址參數：?v=portrait（直式）、?auto=1（自動播放）、?loop=1、?beat=1400（每拍毫秒）、#3（跳到第 3 場） */
(function () {
  'use strict';

  const q = new URLSearchParams(location.search);
  const deck = JSON.parse(document.getElementById('deck').textContent);
  const opt = Object.assign({
    orient: q.get('v') === 'portrait' ? 'portrait' : q.get('v') === 'landscape' ? 'landscape' : (innerHeight > innerWidth ? 'portrait' : 'landscape'),
    orientLocked: !!q.get('v'),
    auto: q.get('auto') === '1',
    loop: q.get('loop') === '1',
    beatMs: +q.get('beat') || deck.beatMs || 1400,
    sceneMs: +q.get('scene') || deck.sceneMs || 2200,
    chrome: q.get('chrome') !== '0',
    assetBase: deck.assetBase || 'assets/web-story-deck/',
    theme: q.get('theme') || deck.theme || 'dark',
    accent: q.get('accent') || deck.accent || 'orange'
  }, {});

  document.body.dataset.orient = opt.orient;
  document.body.dataset.auto = opt.auto ? '1' : '0';
  document.body.dataset.chrome = opt.chrome ? '1' : '0';
  document.body.dataset.theme = opt.theme;
  document.body.dataset.accent = opt.accent;
  document.title = deck.title || 'web-story-deck';

  const asset = n => (deck.assets && deck.assets[n]) || (opt.assetBase + n);
  const MOOD_BY_TYPE = { cover: 'default', agenda: 'default', hook: 'think', compare: 'think', steps: 'point', flow: 'point', bars: 'think', stack: 'default', checklist: 'alert', quote: 'point', golden: 'cheer' };
  const POSE_BY_TYPE = { cover: 'chibi', hook: 'think', compare: 'think', steps: 'point', flow: 'point', bars: 'think', checklist: 'stop', quote: 'point', golden: 'cheer', agenda: 'chibi', stack: 'chibi' };
  const robotFor = s => { const m = s.mood || MOOD_BY_TYPE[s.type] || 'default'; return asset(m === 'default' ? 'robot.svg' : `robot-${m}.svg`); };
  const hostFor = s => { if (deck.host === false || s.host === false) return null; const p = s.pose || (deck.poses && deck.poses[POSE_BY_TYPE[s.type] || 'chibi']) || 'chibi'; return asset(`xiaod-${p}.png`); };
  opt.motif = asset((deck.theme && deck.theme !== 'dark') ? 'clover-nodes-light.svg' : 'clover-nodes.svg');
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // 允許劇本用 [[…]] 標黃、**…** 變藍字強調
  const rich = s => esc(s).replace(/\[\[(.+?)\]\]/g, '<mark>$1</mark>').replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  const ACC = ['', 'a2', 'a3', 'a4']; // 強調色輪替：青綠、天空藍、暖橘、幸運草綠（只用在細條與號碼）
  const ENTER = ['drop', 'rise', 'slide-l', 'pop', 'tilt']; // 進場動作輪替
  const BG = ['plain', 'glow', 'band', 'rail'];              // 背景變化輪替
  const MOTIF = ['right', 'left', 'right', 'none'];           // 幸運草節點位置輪替
  let acc = ACC, enter = 'drop';                              // 每場渲染前重設
  const variantFor = (s, i) => ({
    enter: s.enter || ENTER[i % ENTER.length],
    bg: s.bg || BG[i % BG.length],
    motif: s.motif || MOTIF[i % MOTIF.length],
    shift: (s.accentShift ?? i) % 4
  });
  const pad2 = n => String(n).padStart(2, '0');

  // ---------- 各版型渲染 ----------
  const R = {};
  let cur_s = null; // 目前渲染中的場（給 mascot／duo 取表情與姿勢）
  const mascot = (cls = '', beat = 0) => `<div class="mascot pop ${cls}" data-beat="${beat}"><img src="${robotFor(cur_s)}" alt="AI 夥伴"></div>`;
  // 小D 本人＋小機器人同框（封面、金句場，或單場 host:true）；機器人不得比人大（DESIGN.md 第 6 節）
  const duo = (beat = 0, small = false) => hostFor(cur_s)
    ? `<div class="duo pop ${small ? 'small' : ''}" data-beat="${beat}"><img class="robot" src="${robotFor(cur_s)}" alt="AI 夥伴"><img class="host" src="${hostFor(cur_s)}" alt="小D"></div>`
    : mascot('', beat);

  R.cover = (s, i) => `
    <div class="head">
      <div class="kicker" data-beat="0">${esc(s.kicker || deck.series || '')}</div>
      <h1 class="title" data-beat="0">${rich(s.title)}</h1>
      ${s.sub ? `<p class="sub" data-beat="0">${rich(s.sub)}</p>` : ''}
      ${s.chips?.length ? `<div class="chips">${s.chips.map(c => `<span class="pill" data-beat="0">${esc(c)}</span>`).join('')}</div>` : ''}
    </div>
    ${duo()}`;

  R.hook = (s) => {
    let b = 1;
    const chat = (s.chat || []).map(m => `<div class="bubble ${esc(m.who || 'ai')}" data-beat="${b++}">${rich(m.text)}</div>`).join('');
    return `
    ${head(s)}
    <div class="body">
      <div class="phone" data-beat="0">
        <div class="topbar"><span class="dot">AI</span>${esc(s.app || 'AI 助理')}</div>
        <div class="chat">${chat}${s.question ? `<div class="ask pop" data-beat="${b++}">${rich(s.question)}</div>` : ''}</div>
        <div class="inputbar"><span>${esc(s.placeholder || '輸入訊息…')}</span><i></i></div>
      </div>
    </div>
    ${note(s, b)}`;
  };

  R.compare = (s) => {
    const card = (c, k, cls) => `
      <div class="card ${enter === 'slide-l' ? cls : enter} ${c.tone === 'bad' ? 'bad' : c.tone === 'good' ? 'good' : ''}" data-beat="${1 + k}">
        ${c.label ? `<div class="label">${esc(c.label)}</div>` : ''}
        <h3>${rich(c.title)}</h3>
        ${c.body ? `<p>${rich(c.body)}</p>` : '<p></p>'}
        ${c.badge ? `<span class="badge">${esc(c.badge)}</span>` : ''}
      </div>`;
    return `
    ${head(s)}
    <div class="body"><div class="pair">${card(s.left, 0, 'slide-l')}${card(s.right, 1, 'slide-r')}</div></div>
    ${note(s, 3)}`;
  };

  const stepCard = (it, k) => `
    <div class="card ${acc[(k) % 4]} ${enter}" data-beat="${1 + k}">
      <span class="num">${esc(it.n || pad2(k + 1))}</span>
      <h3>${rich(it.title)}</h3>
      ${it.desc ? `<p>${rich(it.desc)}</p>` : '<p></p>'}
      <div class="bar"></div>
    </div>`;

  R.steps = (s) => {
    const items = s.items || [];
    return `
    ${head(s)}
    <div class="body">
      <div class="row">${items.map(stepCard).join('')}</div>
      ${s.cta ? `<div class="cta"><span class="pill solid pop" data-beat="${1 + items.length}">${esc(s.cta)}</span></div>` : ''}
    </div>
    ${note(s, 2 + items.length)}`;
  };

  R.flow = (s) => {
    const src = s.sources || [];
    const cells = s.panel?.items || [];
    let b = 1 + src.length;
    return `
    ${head(s)}
    <div class="body"><div class="pipe">
      <div class="sources">${src.map((t, k) => `<span class="chip ${acc[(k) % 4]} ${enter}" data-beat="${1 + k}"><span class="ico">≡</span>${esc(t)}</span>`).join('')}</div>
      <div class="arrow down" data-beat="${b}"></div>
      <div class="panel pop" data-beat="${b}">
        <h4>${esc(s.panel?.title || '')}</h4>
        <div class="cells">${cells.map((c, k) => `<div class="cell"><b>${esc(c.n || pad2(k + 1))}</b><span>${esc(c.title || c)}</span></div>`).join('')}</div>
      </div>
      <div class="wire" data-beat="${b + 1}"><span class="seg"></span><span class="knot"></span><span class="seg"></span>${s.link ? `<span class="lab">${esc(s.link)}</span>` : ''}</div>
      <div class="target pop" data-beat="${b + 1}">${esc(s.target || 'AI')}</div>
    </div></div>
    ${note(s, b + 2)}`;
  };

  R.bars = (s) => {
    const bars = s.bars || [];
    const max = Math.max(...bars.map(x => +x.value || 0), 1);
    return `
    ${head(s)}
    <div class="body">
      <div class="chart" data-beat="0">
        ${bars.map((x, k) => `
          <div class="bar-wrap ${esc(x.color || acc[(k) % 4])}" data-beat="${1 + k}" style="--h:${Math.round((+x.value / max) * 100)}">
            <span class="val">${esc(x.display || x.value)}${esc(x.unit || '')}</span>
            <div class="col"></div>
            <span class="lab">${esc(x.label)}</span>
          </div>`).join('')}
      </div>
      ${s.question ? `<div class="cta"><span class="pill accent pop" data-beat="${1 + bars.length}">${rich(s.question)}</span></div>` : ''}
    </div>
    ${note(s, 2 + bars.length)}`;
  };

  R.stack = (s) => {
    const items = s.items || [];
    const n = items.length;
    return `
    ${head(s)}
    <div class="body" data-stack data-total="${n}" data-progress="${esc(s.progress || '已放好 {n}／{total} 項')}">
      <div class="stack-top">
        ${s.badge ? `<span class="pill" data-beat="0">${esc(s.badge)}</span>` : '<span></span>'}
        <span class="pill solid" data-role="progress" data-beat="0"></span>
      </div>
      <div class="crane"><span class="rope"></span><div class="mascot"><img src="${robotFor(s)}" alt="AI 夥伴"></div></div>
      <div class="slots">${items.map(stepCard).join('')}</div>
    </div>
    ${note(s, n + 1)}`;
  };

  R.checklist = (s) => {
    let b = 1;
    const col = (c) => `
      <div class="col ${c.tone === 'stop' ? 'stop' : 'ok'}">
        <div><span class="pill ${c.tone === 'stop' ? 'accent' : 'solid'}" data-beat="${b++}">${esc(c.label)}</span></div>
        ${(c.items || []).map(t => `<div class="item ${enter === 'slide-l' ? 'slide-' + (c.tone === 'stop' ? 'r' : 'l') : enter}" data-beat="${b++}"><span class="mark">${c.tone === 'stop' ? '×' : '✓'}</span><span>${rich(t)}</span></div>`).join('')}
      </div>`;
    return `${head(s)}<div class="body"><div class="cols">${(s.cols || []).map(col).join('')}</div></div>${note(s, b)}`;
  };

  R.quote = (s) => `
    ${head(s)}
    <div class="body">
      <div class="quote pop" data-beat="1">
        ${s.tag ? `<span class="pill accent tag">${esc(s.tag)}</span>` : ''}
        <div>${rich(s.text)}</div>
      </div>
    </div>
    ${note(s, 2)}
    ${mascot('', 1)}`;

  R.golden = (s) => `
    <div class="head">
      ${s.kicker ? `<div class="kicker" data-beat="0">${esc(s.kicker)}</div>` : ''}
      <p class="big" data-beat="0">${rich(s.text)}</p>
      ${s.after ? `<p class="after" data-beat="1">${rich(s.after)}</p>` : ''}
      ${s.chips?.length ? `<div class="takeaways">${s.chips.slice(0, 4).map((c, k) => `<span class="pill" data-beat="${2 + k}">${esc(c)}</span>`).join('')}</div>` : ''}
    </div>
    ${s.mascot !== false ? duo(0) : ''}`;

  R.agenda = (s) => `
    ${head(s)}
    <div class="body"><div class="track">
      ${(s.stops || []).map((st, k) => `
        <div class="stop ${st.break ? 'break' : ''} ${enter}" data-beat="${1 + k}">
          <b>${esc(st.n || (st.break ? '☕' : pad2(k + 1)))}</b>
          <h3>${rich(st.title)}</h3>
          ${st.time ? `<p>${esc(st.time)}</p>` : ''}
        </div>`).join('')}
    </div></div>
    ${note(s, 1 + (s.stops || []).length)}`;

  function head(s) {
    return `<div class="head">
      ${s.kicker ? `<div class="kicker" data-beat="0">${esc(s.kicker)}</div>` : ''}
      <h2 class="title" data-beat="0">${rich(s.title || '')}</h2>
      ${s.sub ? `<p class="sub" data-beat="0">${rich(s.sub)}</p>` : ''}
    </div>`;
  }
  // 註解列一定輸出（沒有內容也佔位），換場時內容區高度才不會跳
  function note(s, beat) {
    return `<p class="note" ${s.note ? `data-beat="${beat ?? 1}"` : ''}>${s.note ? rich(s.note) : ''}</p>`;
  }
  // 頁尾品牌帶：署名依 logo.svg 定版（同大小同粗細，只有 Tarshar 用品牌綠）
  function foot(s, i) {
    const brand = (deck.brand || '🍀 Learn AI with Tarshar | 2026')
      .replace(/\s*\|\s*/, '<span class="bar">|</span>')
      .replace('Tarshar', '<span class="t">Tarshar</span>');
    return `<div class="foot"><span class="series">${esc(s.footer || footL)}</span><span class="brand">${brand}</span><span class="pageno">${pad2(i + 1)}</span></div>`;
  }

  let els = null;
  // ---------- 建立 DOM ----------
  const viewport = document.querySelector('.viewport');
  let stage = document.querySelector('.stage');
  let box = document.querySelector('.stage-box');
  if (!box) { // 舊模板相容：自動包一層 .stage-box
    box = document.createElement('div'); box.className = 'stage-box';
    stage.replaceWith(box); box.appendChild(stage);
  }
  const scenes = deck.scenes || [];
  const footL = deck.footer || deck.series || '';

  scenes.forEach((s, i) => {
    const el = document.createElement('section');
    el.className = `scene t-${s.type}`;
    el.dataset.index = i;
    const render = R[s.type] || ((x) => `${head(x)}<div class="body"><p class="sub">（未知版型 ${esc(x.type)}）</p></div>`);
    cur_s = s;
    const v = variantFor(s, i);
    acc = ACC.slice(v.shift).concat(ACC.slice(0, v.shift)); // 每場的卡片色序不同
    enter = v.enter;
    if (s.type !== 'cover' && s.type !== 'golden') el.classList.add(`bg-${v.bg}`, `m-${v.motif === 'right' ? 'right' : v.motif}`);
    const extraHost = (s.host === true && s.type !== 'cover' && s.type !== 'golden') ? duo(0, true) : '';
    el.innerHTML = `<img class="motif" src="${opt.motif}" alt="">` + render(s, i) + extraHost + foot(s, i);
    stage.appendChild(el);
  });
  const progress = document.createElement('div'); progress.className = 'progress'; stage.appendChild(progress);
  const zl = document.createElement('div'); zl.className = 'tap-zone left'; stage.appendChild(zl);
  const zr = document.createElement('div'); zr.className = 'tap-zone right'; stage.appendChild(zr);

  const notesPanel = document.createElement('div'); notesPanel.className = 'notes-panel'; viewport.appendChild(notesPanel);
  const ctrl = document.createElement('div'); ctrl.className = 'ctrl';
  ctrl.innerHTML = `<button class="big" data-act="prev" aria-label="上一場">‹</button><span class="pos"></span><button class="big" data-act="next" aria-label="下一拍">›</button><button data-act="auto">▶ 自動播放</button><button data-act="notes">備忘</button><button data-act="fs">全螢幕</button>`;
  viewport.appendChild(ctrl);
  const posEl = ctrl.querySelector('.pos');

  // ---------- 縮放：只看 .stage-box 的實際寬度，不看視窗高度 ----------
  const stageW = () => document.body.dataset.orient === 'portrait' ? 1080 : 1600;
  function fit() {
    const w = box.clientWidth;
    if (!w) return; // 容器還沒有尺寸（iframe 剛載入），等 ResizeObserver 再來
    stage.style.setProperty('--k', String(w / stageW()));
  }
  function pickOrient() {
    if (opt.orientLocked) return;
    const de = document.documentElement;
    const want = (innerHeight || de.clientHeight) > (innerWidth || de.clientWidth) ? 'portrait' : 'landscape';
    if (want !== document.body.dataset.orient) { document.body.dataset.orient = want; fit(); if (els) show(cur, beat); }
  }
  if ('ResizeObserver' in window) new ResizeObserver(() => { pickOrient(); fit(); }).observe(box);
  addEventListener('resize', () => { pickOrient(); fit(); });
  addEventListener('orientationchange', () => setTimeout(() => { pickOrient(); fit(); }, 200));
  addEventListener('pageshow', fit);
  fit();
  // 前 3 秒多補幾次，保險起見（某些內嵌容器不觸發 resize）
  let tries = 0; const iv = setInterval(() => { fit(); if (++tries > 12) clearInterval(iv); }, 250);

  // ---------- 播放狀態 ----------
  let cur = 0, beat = 0;
  els = [...stage.querySelectorAll('.scene')];
  const maxBeat = el => Math.max(0, ...[...el.querySelectorAll('[data-beat]')].map(x => +x.dataset.beat));

  function applyBeats(el) {
    el.querySelectorAll('[data-beat]').forEach(x => x.classList.toggle('on', +x.dataset.beat <= beat));
    const st = el.querySelector('[data-stack]');
    if (st) {
      const total = +st.dataset.total;
      const n = Math.min(beat, total);
      st.querySelector('[data-role=progress]').textContent = st.dataset.progress.replace('{n}', n).replace('{total}', total);
      const crane = st.querySelector('.crane');
      const slots = [...st.querySelectorAll('.slots .card')];
      const idx = Math.min(Math.max(beat, 1), total) - 1;
      const target = slots[idx];
      if (target) {
        const slotsEl = st.querySelector('.slots');
        const x = slotsEl.offsetLeft + target.offsetLeft + target.offsetWidth / 2;
        const slotsTop = slotsEl.offsetTop;
        const mascotH = crane.querySelector('.mascot').offsetHeight || 140;
        crane.style.setProperty('--rope', `${Math.max(60, slotsTop + 40 - mascotH - 4)}px`);
        crane.style.setProperty('--x', `${x}px`);
        crane.classList.toggle('lift', beat > total);
      }
    }
  }

  function show(i, b) {
    cur = Math.max(0, Math.min(i, els.length - 1));
    beat = b == null ? 0 : b;
    els.forEach((el, k) => {
      el.classList.toggle('is-active', k === cur);
      el.classList.toggle('is-past', k < cur);
    });
    applyBeats(els[cur]);
    progress.style.width = `${((cur + 1) / els.length) * 100}%`;
    try { history.replaceState(null, '', `#${cur + 1}`); } catch { /* 沙盒內不允許就略過 */ }
    const n = scenes[cur].notes;
    notesPanel.innerHTML = n ? `<b>第 ${cur + 1} 場備忘：</b>${esc(n)}` : `<b>第 ${cur + 1} 場</b>（沒有備忘）`;
    document.body.dataset.curScene = cur;
    document.body.dataset.curBeat = beat;
    if (posEl) posEl.textContent = `${cur + 1} / ${els.length}`;
  }

  function next() {
    if (beat < maxBeat(els[cur])) { beat++; applyBeats(els[cur]); document.body.dataset.curBeat = beat; return true; }
    if (cur < els.length - 1) { show(cur + 1, 0); return true; }
    return false;
  }
  function prev() {
    if (cur > 0) show(cur - 1, maxBeat(els[cur - 1]));
    else show(0, 0);
  }
  function revealAll() { show(cur, maxBeat(els[cur])); }

  addEventListener('keydown', e => {
    if (['ArrowRight', ' ', 'PageDown', 'Enter'].includes(e.key)) { e.preventDefault(); stopAuto(); next(); }
    else if (['ArrowLeft', 'PageUp', 'Backspace'].includes(e.key)) { e.preventDefault(); stopAuto(); prev(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); revealAll(); }
    else if (e.key.toLowerCase() === 'n') notesPanel.classList.toggle('open');
    else if (e.key.toLowerCase() === 'f') { try { (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()).catch(() => {}); } catch { /* 不支援全螢幕 */ } }
    else if (e.key === 'Home') show(0, 0);
    else if (e.key === 'End') show(els.length - 1, maxBeat(els[els.length - 1]));
  });
  zr.addEventListener('click', () => { stopAuto(); next(); });
  zl.addEventListener('click', () => { stopAuto(); prev(); });
  let tx = null;
  addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
  addEventListener('touchend', e => {
    if (tx == null) return;
    const dx = e.changedTouches[0].clientX - tx; tx = null;
    if (dx < -40) { stopAuto(); next(); } else if (dx > 40) { stopAuto(); prev(); }
  });

  // 起始場
  const h = parseInt(location.hash.slice(1), 10);
  show(Number.isFinite(h) && h > 0 ? h - 1 : 0, 0);

  // ---------- 自動播放（錄影用 ?auto=1，或按控制列的「自動播放」） ----------
  let autoTimer = null;
  function tick() {
    const wasLast = cur === els.length - 1 && beat >= maxBeat(els[cur]);
    if (wasLast) {
      if (opt.loop) { show(0, 0); autoTimer = setTimeout(tick, opt.sceneMs); return; }
      if (opt.auto) document.body.dataset.done = '1';
      stopAuto(); return;
    }
    const beforeScene = cur;
    next();
    autoTimer = setTimeout(tick, cur !== beforeScene ? opt.sceneMs : opt.beatMs);
  }
  function startAuto() { stopAuto(); ctrl.querySelector('[data-act=auto]').classList.add('on'); autoTimer = setTimeout(tick, opt.sceneMs); }
  function stopAuto() { if (autoTimer) clearTimeout(autoTimer); autoTimer = null; ctrl.querySelector('[data-act=auto]').classList.remove('on'); }
  if (opt.auto) startAuto();

  ctrl.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const act = b.dataset.act;
    if (act === 'next') { stopAuto(); next(); }
    else if (act === 'prev') { stopAuto(); prev(); }
    else if (act === 'auto') { autoTimer ? stopAuto() : startAuto(); }
    else if (act === 'notes') notesPanel.classList.toggle('open');
    else if (act === 'fs') { try { (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()).catch(() => {}); } catch { /* 不支援 */ } }
  });

  // 對外：讓截圖腳本可以控制
  window.__deck = { next, prev, show, revealAll, count: els.length, maxBeat: i => maxBeat(els[i]), get cur() { return cur; }, get beat() { return beat; } };
})();
