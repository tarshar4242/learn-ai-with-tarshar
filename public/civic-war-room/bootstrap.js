/* The random setup key is delivered only in a personal URL fragment, never in this repo.
   Decrypted entries are merged by the app into this browser's existing settings. */
window.addEventListener('hashchange', () => {
  if (new URLSearchParams(location.hash.slice(1)).has('setup')) location.reload();
});
(async function () {
  const notice = document.querySelector('#setupNotice');
  const params = new URLSearchParams(location.hash.slice(1));
  const key = params.get('setup');
  if (key !== null) history.replaceState(null, '', location.pathname + location.search);
  const announce = message => { notice.hidden = false; notice.textContent = message; };
  try {
    if (key !== null) {
      announce('正在載入你的私人入口…');
      if (!/^[A-Za-z0-9_-]{43}$/.test(key)) throw Error('Invalid setup');
      const bytes = value => Uint8Array.from(atob(value), c => c.charCodeAt(0));
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      let pack;
      try {
        const response = await fetch('entry-pack.json', { cache: 'no-cache', signal: controller.signal });
        if (!response.ok) throw Error('Pack unavailable');
        pack = await response.json();
      } finally { clearTimeout(timeout); }
      if (pack.version !== 1) throw Error('Unknown pack');
      const aes = await crypto.subtle.importKey('raw', bytes(key.replace(/-/g, '+').replace(/_/g, '/') + '='), 'AES-GCM', false, ['decrypt']);
      const clear = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes(pack.iv) }, aes, bytes(pack.data));
      const incoming = JSON.parse(new TextDecoder().decode(clear));
      if (!Array.isArray(incoming) || incoming.length > 100) throw Error('Invalid pack');
      const cleanText = (value, limit) => typeof value === 'string' ? value.trim().slice(0, limit) : '';
      const links = incoming.map(entry => {
        if (!entry) throw Error('Invalid entry');
        const id = cleanText(entry.id, 100), name = cleanText(entry.name, 100), url = new URL(entry.url);
        if (!id || !name || url.protocol !== 'https:' || url.username || url.password) throw Error('Invalid entry');
        return {id, name, url:url.href, category:cleanText(entry.category,40)||'其他', description:cleanText(entry.description,500), verification:cleanText(entry.verification,120), access:cleanText(entry.access,120), favorite:entry.favorite===true};
      });
      const ids = new Set(window.CIVIC_SEED.links.map(x => x.id)), urls = new Set(window.CIVIC_SEED.links.map(x => new URL(x.url).href));
      for (const entry of links) {
        if (ids.has(entry.id) || urls.has(entry.url)) continue;
        ids.add(entry.id); urls.add(entry.url); window.CIVIC_SEED.links.push(entry);
      }
      window.CIVIC_IMPORTED = true;
    } else {
      try {
        const saved = JSON.parse(localStorage.getItem('civic-room-v1') || 'null');
        if (!saved?.links?.some(x => !window.CIVIC_SEED.links.some(y => x.id === y.id))) announce('首次使用：請開啟知臨提供的個人啟用連結，載入熟成局等私人入口。也可以在「使用與接續」匯入舊備份。');
      } catch {
        announce('瀏覽器的已存資料暫時無法讀取，請查看頁面上方的保存提示。');
      }
    }
  } catch {
    announce('私人入口尚未載入。請重新開啟完整的個人啟用連結，或在「使用與接續」匯入備份。原有資料仍保留。');
  }
  const script = document.createElement('script');
  script.src = 'app.js';
  script.onerror = () => announce('頁面程式暫時未載入，請重新整理。');
  document.body.append(script);
})();
