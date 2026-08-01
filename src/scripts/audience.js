/* 分眾權限：身分完全由網址 ?k= 決定，這裡只做前端過濾（軟權限，非資安等級保護）。
   規則詳見 SPEC.md §5。這支腳本負責三件事：
   1. 解析 ?k=，算出目前解鎖了哪些身分
   2. 顯示側欄的身分徽章
   3. 讓所有 [data-aud] 區塊依身分顯示/隱藏，並把 ?k= 附加到站內連結，避免換頁時遺失身分
   audiences 清單由 Layout.astro 內嵌成 window.__AUDIENCES__，不額外發請求。 */
(function () {
  const audiences = window.__AUDIENCES__ || [];
  const base = window.__BASE_URL__ || '/';

  const params = new URLSearchParams(window.location.search);
  const kParam = params.get('k') || '';
  const keys = kParam.split(',').map((s) => s.trim()).filter(Boolean);

  const unlocked = audiences
    .filter((a) => keys.indexOf(String(a.code || a.id)) !== -1)
    .map((a) => a.id);

  applyIdentityBadge(audiences, unlocked);
  applyAudienceFilter(unlocked);
  preserveKeyOnInternalLinks(kParam, base);

  function applyIdentityBadge(audiences, unlocked) {
    const badge = document.getElementById('identity-badge');
    const nameEl = document.getElementById('identity-name');
    if (!badge || !nameEl) return;
    if (unlocked.length === 0) return; // 一般訪客：不顯示徽章
    const names = unlocked
      .map((id) => (audiences.find((a) => a.id === id) || {}).name || id)
      .join('・');
    nameEl.textContent = names;
    badge.hidden = false;
  }

  function applyAudienceFilter(unlocked) {
    document.querySelectorAll('[data-aud]').forEach((el) => {
      const required = (el.getAttribute('data-aud') || '').split(',').filter(Boolean);
      const visible = required.length === 0 || required.some((id) => unlocked.indexOf(id) !== -1);
      if (visible) el.removeAttribute('hidden');
    });
  }

  function preserveKeyOnInternalLinks(kParam, base) {
    if (!kParam) return;
    document.querySelectorAll('a[href]').forEach((a) => {
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('http')) return;
      try {
        const url = new URL(href, window.location.origin);
        if (!url.pathname.startsWith(base)) return; // 只處理站內連結，外部內容站（kt-sweet-journey 等）不用帶
        if (!url.searchParams.has('k')) {
          url.searchParams.set('k', kParam);
          a.setAttribute('href', url.pathname + url.search + url.hash);
        }
      } catch (e) {
        /* 忽略無法解析的連結 */
      }
    });
  }
})();
