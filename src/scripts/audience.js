/* 分眾權限：身分完全由網址 ?k= 決定，這裡只做前端過濾（軟權限，非資安等級保護）。
   規則詳見 SPEC.md §5。這支腳本負責三件事：
   1. 解析 ?k=，算出目前解鎖了哪些身分
   2. 讓所有 [data-aud]／[data-nonempty-for] 區塊依身分顯示/隱藏，並把 ?k= 附加到站內連結，避免換頁時遺失身分
   3. （不顯示身分徽章：訪客不需要知道自己被辨識成哪個身分）
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

  applyAudienceFilter(unlocked);
  applyNavFilter(unlocked);
  preserveKeyOnInternalLinks(kParam, base);

  function applyAudienceFilter(unlocked) {
    document.querySelectorAll('[data-aud]').forEach((el) => {
      const required = (el.getAttribute('data-aud') || '').split(',').filter(Boolean);
      const visible = required.length === 0 || required.some((id) => unlocked.indexOf(id) !== -1);
      if (visible) el.removeAttribute('hidden');
    });
  }

  /* 側欄導覽項目：這一頁如果對目前身分來說一個項目都看不到（整頁會是空的），
     直接把導覽連結也藏起來，不要讓人點進去才發現裡面空空的。
     data-nonempty-for 是這頁「哪些身分至少看得到一項內容」的清單（build time 算好），
     public 代表「沒有解鎖任何身分的一般訪客」。 */
  function applyNavFilter(unlocked) {
    document.querySelectorAll('[data-nonempty-for]').forEach((el) => {
      const list = (el.getAttribute('data-nonempty-for') || '').split(',').filter(Boolean);
      const visible = unlocked.length === 0
        ? list.indexOf('public') !== -1
        : unlocked.some((id) => list.indexOf(id) !== -1);
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
