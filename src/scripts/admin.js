/* 內容後台：純前端，不連任何後端或資料庫。
   讀取本頁內嵌的 content.json 基準值，編輯結果存在瀏覽器 localStorage 當草稿，
   按「下載」匯出成可以直接覆蓋 src/data/content.json 的檔案。
   給非工程師用：所有操作都是點選/打字/下載，沒有指令列。 */
(function () {
  const STORE_KEY = 'tarshar-admin-draft-v1';
  const FP_KEY = 'tarshar-admin-baseline-fp-v1';

  const baseline = JSON.parse(document.getElementById('content-baseline').textContent);

  function fingerprint(obj) {
    const s = JSON.stringify(obj || {});
    let h = 0;
    for (let i = 0; i < s.length; i++) { h = ((h << 5) - h + s.charCodeAt(i)) | 0; }
    return s.length + ':' + h;
  }

  const baselineFp = fingerprint(baseline);
  let state = JSON.parse(JSON.stringify(baseline));
  let draftStale = false;
  let activeTab = 'text';

  try {
    const saved = localStorage.getItem(STORE_KEY);
    const savedFp = localStorage.getItem(FP_KEY);
    if (saved) {
      if (savedFp === baselineFp) {
        state = JSON.parse(saved);
      } else {
        draftStale = true;
      }
    }
  } catch (e) { /* localStorage 不可用時，安靜地只用檔案內容 */ }

  const SECTIONS = [
    { key: 'text', label: '文案', type: 'fields' },
    { key: 'theme', label: '字型', type: 'theme' },
    { key: 'audiences', label: '觀眾群', type: 'audiences' },
    { key: 'series', label: '課程系列', type: 'list', itemLabel: '系列', fields: ['code', 'title', 'accent', 'count', 'url', 'desc'] },
    { key: 'posts', label: '文章', type: 'list', itemLabel: '文章', fields: ['date', 'title', 'tag', 'url', 'summary'] },
    { key: 'tools', label: '工具', type: 'list', itemLabel: '工具', fields: ['name', 'tag', 'url', 'desc'] },
    { key: 'pillars', label: '支柱', type: 'list', itemLabel: '重點', fields: ['title', 'desc'] },
    { key: 'timeline', label: '時間軸', type: 'list', itemLabel: '經歷', fields: ['year', 'title', 'desc'] },
    { key: 'contactInfo', label: '聯絡資訊', type: 'list', itemLabel: '項目', fields: ['label', 'value'] },
    { key: 'stats', label: '首頁數據', type: 'list', itemLabel: '數據', fields: ['value', 'label'] },
  ];

  const FIELD_LABELS = {
    code: '代碼', title: '標題', accent: '顏色（hex）', count: '數量標示', url: '連結網址', desc: '描述',
    date: '日期', tag: '標籤', summary: '摘要', name: '名稱', year: '年份', label: '標籤', value: '內容',
    badge: '徽章文字', heroTitle: '主標', heroTitleAccent: '主標強調字', heroLead: '主標下方說明',
    ctaPrimary: '主按鈕文字', ctaSecondary: '次按鈕文字', aboutP1: '關於我第一段', aboutP2: '關於我第二段',
    aboutLong: '關於頁完整介紹', coursesLead: '課程頁說明', toolsLead: '工具頁說明', contactLead: '聯絡頁說明',
    newsletterTitle: '電子報標題', newsletterDesc: '電子報說明', email: 'Email', location: '所在地',
  };

  const FONT_OPTIONS = [
    { id: 'a', label: '明體標題＋黑體內文（預設）' },
    { id: 'b', label: '全黑體' },
    { id: 'c', label: '手寫楷體標題' },
    { id: 'd', label: '全明體' },
    { id: 'e', label: '港系黑體' },
  ];

  const tabsEl = document.getElementById('admin-tabs');
  const panelEl = document.getElementById('admin-panel');
  const draftBanner = document.getElementById('draft-banner');
  const draftBannerText = document.getElementById('draft-banner-text');
  const saveHint = document.getElementById('save-hint');

  function persistDraft() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
      localStorage.setItem(FP_KEY, baselineFp);
    } catch (e) { /* 存不進去就算了，不擋使用者操作 */ }
    saveHint.textContent = '已自動存成本機草稿・' + new Date().toLocaleTimeString('zh-TW');
  }

  function markDirty() {
    persistDraft();
    renderPanel();
  }

  function renderTabs() {
    tabsEl.innerHTML = '';
    SECTIONS.forEach((s) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = s.label;
      btn.className = s.key === activeTab ? 'active' : '';
      btn.addEventListener('click', () => { activeTab = s.key; renderTabs(); renderPanel(); });
      tabsEl.appendChild(btn);
    });
  }

  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([k, v]) => {
      if (k === 'text') node.textContent = v;
      else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v);
    });
    (children || []).forEach((c) => node.appendChild(c));
    return node;
  }

  function fieldGroup(labelText, inputEl) {
    return el('div', { class: 'field-group' }, [
      el('label', { text: labelText }),
      inputEl,
    ]);
  }

  function renderFieldsSection() {
    const wrap = el('div', {});
    Object.keys(state.text).forEach((key) => {
      const long = key === 'aboutLong' || key === 'heroLead' || key === 'coursesLead' || key === 'toolsLead' || key === 'contactLead' || key === 'newsletterDesc';
      const input = el(long ? 'textarea' : 'input', {
        type: 'text',
        rows: long ? '3' : undefined,
        value: long ? undefined : state.text[key],
      });
      if (long) input.value = state.text[key];
      input.addEventListener('input', (e) => {
        state.text[key] = e.target.value;
        persistDraft();
      });
      wrap.appendChild(fieldGroup(FIELD_LABELS[key] || key, input));
    });
    panelEl.innerHTML = '';
    panelEl.appendChild(wrap);
  }

  function renderThemeSection() {
    const wrap = el('div', {});
    FONT_OPTIONS.forEach((opt) => {
      const btn = el('button', {
        type: 'button',
        class: 'aud-chip' + (state.theme.font === opt.id ? ' on' : ''),
        text: opt.label,
        style: 'display:block; width:100%; text-align:left; margin-bottom:8px; padding:12px 14px;',
      });
      btn.addEventListener('click', () => { state.theme.font = opt.id; markDirty(); });
      wrap.appendChild(btn);
    });
    panelEl.innerHTML = '';
    panelEl.appendChild(wrap);
  }

  function renderAudiencesSection() {
    const wrap = el('div', {});
    const base = window.__BASE_URL__ || '/';
    const origin = window.location.origin;
    state.audiences.forEach((a, idx) => {
      const card = el('div', { class: 'audience-card' });
      const nameInput = el('input', { type: 'text', value: a.name });
      nameInput.addEventListener('input', (e) => { state.audiences[idx].name = e.target.value; persistDraft(); renderShareUrl(); });
      const codeInput = el('input', { type: 'text', value: a.code });
      codeInput.addEventListener('input', (e) => { state.audiences[idx].code = e.target.value; persistDraft(); renderShareUrl(); });
      card.appendChild(fieldGroup('名稱', nameInput));
      card.appendChild(fieldGroup('通行碼', codeInput));

      const shareRow = el('div', { class: 'audience-share' });
      function renderShareUrl() {
        const url = origin + base + '?k=' + encodeURIComponent(state.audiences[idx].code || state.audiences[idx].id);
        shareRow.innerHTML = '';
        shareRow.appendChild(el('code', { text: url }));
        const copyBtn = el('button', { type: 'button', text: '複製網址' });
        copyBtn.addEventListener('click', () => {
          navigator.clipboard?.writeText(url);
          copyBtn.textContent = '已複製';
          setTimeout(() => { copyBtn.textContent = '複製網址'; }, 1500);
        });
        shareRow.appendChild(copyBtn);
      }
      renderShareUrl();
      card.appendChild(shareRow);
      wrap.appendChild(card);
    });

    const addBtn = el('button', { type: 'button', class: 'add-btn', text: '＋ 新增一個觀眾群' });
    addBtn.addEventListener('click', () => {
      state.audiences.push({ id: 'aud_' + Date.now(), name: '新觀眾群', code: '' });
      markDirty();
    });
    wrap.appendChild(addBtn);

    panelEl.innerHTML = '';
    panelEl.appendChild(wrap);
  }

  function renderListSection(section) {
    const items = state[section.key];
    const wrap = el('div', {});
    const hasAud = items.length > 0 && Object.prototype.hasOwnProperty.call(items[0], 'aud');

    if (hasAud) {
      const bulkRow = el('div', { class: 'bulk-row' });
      bulkRow.appendChild(el('span', { text: '一鍵套用到整區（點了會覆蓋下面每一筆的設定）：' }));
      state.audiences.forEach((a) => {
        const chip = el('button', { type: 'button', class: 'bulk-apply-all', text: '全部設成「' + a.name + '」' });
        chip.addEventListener('click', () => {
          items.forEach((it) => { it.aud = [a.id]; });
          markDirty();
        });
        bulkRow.appendChild(chip);
      });
      const publicBtn = el('button', { type: 'button', class: 'bulk-public', text: '整區設為公開' });
      publicBtn.addEventListener('click', () => {
        items.forEach((it) => { it.aud = []; });
        markDirty();
      });
      bulkRow.appendChild(publicBtn);
      wrap.appendChild(bulkRow);
    }

    items.forEach((item, idx) => {
      const card = el('div', { class: 'item-card' });
      const head = el('div', { class: 'item-card-head' }, [
        el('span', { class: 'idx', text: (section.itemLabel || '項目') + ' ' + (idx + 1) }),
      ]);
      const actions = el('div', { class: 'item-actions' });
      if (idx > 0) {
        const up = el('button', { type: 'button', text: '↑' });
        up.addEventListener('click', () => {
          [items[idx - 1], items[idx]] = [items[idx], items[idx - 1]];
          markDirty();
        });
        actions.appendChild(up);
      }
      if (idx < items.length - 1) {
        const down = el('button', { type: 'button', text: '↓' });
        down.addEventListener('click', () => {
          [items[idx + 1], items[idx]] = [items[idx], items[idx + 1]];
          markDirty();
        });
        actions.appendChild(down);
      }
      const del = el('button', { type: 'button', class: 'danger', text: '✕' });
      del.addEventListener('click', () => {
        items.splice(idx, 1);
        markDirty();
      });
      actions.appendChild(del);
      head.appendChild(actions);
      card.appendChild(head);

      section.fields.forEach((f) => {
        const long = f === 'desc' || f === 'summary';
        const input = el(long ? 'textarea' : 'input', { type: 'text', rows: long ? '2' : undefined });
        input.value = item[f] || '';
        input.addEventListener('input', (e) => { item[f] = e.target.value; persistDraft(); });
        card.appendChild(fieldGroup(FIELD_LABELS[f] || f, input));
      });

      if (hasAud) {
        const audRow = el('div', { class: 'aud-row' }, [el('span', { text: '誰看得到：', style: 'font-size:12px;color:var(--c-faintest);' })]);
        const publicChip = el('button', {
          type: 'button',
          class: 'aud-chip' + (item.aud.length === 0 ? ' on' : ''),
          text: '公開',
        });
        publicChip.addEventListener('click', () => { item.aud = []; markDirty(); });
        audRow.appendChild(publicChip);
        state.audiences.forEach((a) => {
          const on = item.aud.indexOf(a.id) !== -1;
          const chip = el('button', { type: 'button', class: 'aud-chip' + (on ? ' on' : ''), text: a.name });
          chip.addEventListener('click', () => {
            const i = item.aud.indexOf(a.id);
            if (i === -1) item.aud.push(a.id); else item.aud.splice(i, 1);
            markDirty();
          });
          audRow.appendChild(chip);
        });
        card.appendChild(audRow);
      }

      wrap.appendChild(card);
    });

    const addBtn = el('button', { type: 'button', class: 'add-btn', text: '＋ 新增一個' + (section.itemLabel || '項目') });
    addBtn.addEventListener('click', () => {
      const blank = {};
      section.fields.forEach((f) => { blank[f] = ''; });
      if (hasAud || items.length === 0) blank.aud = [];
      items.push(blank);
      markDirty();
    });
    wrap.appendChild(addBtn);

    panelEl.innerHTML = '';
    panelEl.appendChild(wrap);
  }

  function renderPanel() {
    const section = SECTIONS.find((s) => s.key === activeTab);
    if (!section) return;
    if (section.type === 'fields') renderFieldsSection();
    else if (section.type === 'theme') renderThemeSection();
    else if (section.type === 'audiences') renderAudiencesSection();
    else renderListSection(section);
  }

  function renderDraftBanner() {
    if (!draftStale) { draftBanner.hidden = true; return; }
    draftBanner.hidden = false;
    draftBannerText.textContent = 'content.json 內容已經更新過，你之前存的本機草稿是根據舊版做的。要繼續改草稿，還是丟掉草稿改用現在的檔案內容？';
  }

  document.getElementById('use-draft-btn').addEventListener('click', () => {
    draftStale = false;
    renderDraftBanner();
    persistDraft();
  });
  document.getElementById('discard-draft-btn').addEventListener('click', () => {
    state = JSON.parse(JSON.stringify(baseline));
    draftStale = false;
    try { localStorage.removeItem(STORE_KEY); localStorage.removeItem(FP_KEY); } catch (e) {}
    renderDraftBanner();
    renderPanel();
  });

  document.getElementById('reset-btn').addEventListener('click', () => {
    if (!confirm('確定要放棄目前的修改，還原成檔案裡原本的內容嗎？')) return;
    state = JSON.parse(JSON.stringify(baseline));
    try { localStorage.removeItem(STORE_KEY); localStorage.removeItem(FP_KEY); } catch (e) {}
    renderPanel();
    saveHint.textContent = '已還原成檔案內容';
  });

  document.getElementById('download-btn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'content.json';
    a.click();
    URL.revokeObjectURL(url);
  });

  renderDraftBanner();
  renderTabs();
  renderPanel();
})();
