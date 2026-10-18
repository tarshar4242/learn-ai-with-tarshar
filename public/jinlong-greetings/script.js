/* 進龍日安圖 V5.1 — 靜態、離線提示詞產生器。 */
(function (root) {
  'use strict';
  const D = root.JinlongData || (typeof require === 'function' ? require('./data.js') : null);
  const L = root.Lunar || (typeof require === 'function' ? require('./assets/vendor/lunar.js').Lunar : null);
  const DAY = 86400000;
  const DEFAULT = {greeting:'morning', category:'random', tone:'fresh', signature:0, holidayMode:'auto', holidayName:''};
  const KEY = 'jinlong-greetings-v5';
  const HISTORY_KEY = KEY + '-history';
  const fixed = [['元旦',1,1],['父親節',8,8],['教師節',9,28],['國慶日',10,10],['聖誕節',12,25]];
  const lunarDates = [['春節',1,1],['元宵節',1,15],['端午節',5,5],['中秋節',8,15],['重陽節',9,9]];
  const ownValue = (obj,key) => Object.prototype.hasOwnProperty.call(obj,key) ? obj[key] : undefined;
  const pad = n => String(n).padStart(2,'0');
  const ymd = (y,m,d) => `${y}-${pad(m)}-${pad(d)}`;
  const stamp = s => Date.parse(s+'T00:00:00Z');
  function taipeiDate(now = new Date()) {
    const p = new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
    const get = t => p.find(x=>x.type===t).value;
    return `${get('year')}-${get('month')}-${get('day')}`;
  }
  function holidaysForYear(year) {
    if (!Number.isInteger(year) || year<2000 || year>2100 || !L) throw new Error('目前無法可靠換算這一年的節日，請改用「自行輸入節日」。');
    const list = fixed.map(([name,m,d])=>({name,date:ymd(year,m,d)}));
    for (const [name,m,d] of lunarDates) list.push({name,date:L.fromYmd(year,m,d).getSolar().toYmd()});
    // Calendar conversion calculates solar terms; Qingming is NOT fixed to April 4 or 5.
    const terms = L.fromYmd(year,1,1).getJieQiTable();
    list.push({name:'清明節',date:terms['清明'].toYmd()},{name:'冬至',date:terms['DONG_ZHI'].toYmd()});
    const firstWeekday = new Date(Date.UTC(year,4,1)).getUTCDay();
    list.push({name:'母親節',date:ymd(year,5,1+(7-firstWeekday)%7+7)});
    if(list.some(x=>!x.date.startsWith(`${year}-`) || !Number.isFinite(stamp(x.date)))) throw new Error('節日日期未通過檢查，請改用「自行輸入節日」。');
    return list.sort((a,b)=>a.date.localeCompare(b.date));
  }
  function recommendHoliday(now = new Date()) {
    try {
      const today=taipeiDate(now), year=Number(today.slice(0,4));
      if(year<2000 || year>2100) return {error:'目前自動換算支援 2000–2100 年，請改用「自行輸入節日」。',today};
      const all = [year-1,year,year+1].filter(y=>y>=2000&&y<=2100).flatMap(holidaysForYear).map(h=>({...h,delta:Math.round((stamp(h.date)-stamp(today))/DAY)}));
      const active = all.filter(h=>h.delta>=-3&&h.delta<=7).sort((a,b)=>Math.abs(a.delta)-Math.abs(b.delta)||b.delta-a.delta);
      const h=active[0] || all.find(h=>h.delta>0);
      if(!h) return {error:'這段時間沒有可確認的節日資料，請改用「自行輸入節日」。',today};
      return {...h,today,phase:h.delta===0?'today':h.delta<0?'after':h.delta<=7?'before':'prepare'};
    } catch (_) {return {error:'目前無法可靠判斷節日。請改用「自行輸入節日」，或重新整理再試。'};}
  }
  function cleanName(value) {return Array.from(String(value||'').replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2066-\u2069<>]/g,'').trim()).slice(0,16).join('');}
  function normalize(raw) {
    const s={...DEFAULT};
    if(!raw || typeof raw!=='object') return s;
    if(Object.hasOwn ? Object.hasOwn(D.greetings,raw.greeting) : Object.prototype.hasOwnProperty.call(D.greetings,raw.greeting)) s.greeting=raw.greeting;
    if(D.categories.some(c=>c.id===raw.category)) s.category=raw.category;
    if(Object.prototype.hasOwnProperty.call(D.tones,raw.tone)) s.tone=raw.tone;
    if(Number.isInteger(raw.signature)&&raw.signature>=0&&raw.signature<D.signatures.length) s.signature=raw.signature;
    if(raw.holidayMode==='manual') s.holidayMode='manual';
    s.holidayName=cleanName(raw.holidayName);
    return s;
  }
  function choose(list,last,rng=Math.random) {
    const pool=list.length>1?list.filter(x=>x!==last):list;
    return pool[Math.min(pool.length-1,Math.floor(rng()*pool.length))];
  }
  function pickSome(list,count,rng=Math.random) {
    const pool=[...list], out=[];
    while(pool.length&&out.length<count) out.push(pool.splice(Math.min(pool.length-1,Math.floor(rng()*pool.length)),1)[0]);
    return out;
  }
  function buildPrompt(raw, history={}, now=new Date(), rng=Math.random) {
    const s=normalize(raw);
    let festival=null, title=D.greetings[s.greeting];
    if(s.greeting==='holiday') {
      festival=s.holidayMode==='auto'?recommendHoliday(now):{name:s.holidayName,phase:'manual'};
      if(festival.error) throw new Error(festival.error);
      if(!festival.name) throw new Error('請先輸入節日名稱，或點選下方的常見節日，再產生畫圖指令。');
      title=festival.name;
    }
    const themed=D.categories.filter(c=>c.id!=='random');
    const category=s.category==='random'?choose(themed,themed.find(c=>c.id===history.lastCategory),rng):D.categories.find(c=>c.id===s.category);
    const idea=choose(D.ideas[category.id],history.lastIdea,rng);
    const mediums=pickSome(D.mediums,3,rng);
    const angle=choose(D.angles,history.lastAngle,rng);
    const pool=festival&&festival.phase==='after'?(ownValue(D.afterHolidayBlessings,title)||D.afterHolidayBlessings['通用']):s.greeting==='holiday'?(ownValue(D.holidayBlessings,title)||D.holidayBlessings['通用']):D.blessings[s.greeting];
    const bucket=s.greeting==='holiday'?'holiday:'+title+(festival.phase==='after'?':after':''):s.greeting;
    const historyMap=history.used&&typeof history.used==='object'?history.used:{};
    const saved=Array.isArray(historyMap[bucket])?historyMap[bucket].filter(x=>pool.includes(x)):[];
    let used=saved;
    let available=pool.filter(x=>!used.includes(x));
    if(!available.length) {used=[];available=pool.filter(x=>x!==history.lastBlessing);}
    const base=choose(available,null,rng);
    let blessing=base;
    if(festival) {
      if(festival.phase==='before'||festival.phase==='prepare') blessing=(title==='清明節'?'清明將至，':'佳節將至，')+base;
      // Holiday timing is context, never a guessed Gregorian date for manually entered names.
    }
    const solemn=title==='清明節';
    const tone=solemn?'素雅平靜：清明節以清新、安靜的春景表現，色彩乾淨柔和但畫面清楚，不使用喜慶紅金或歡樂符號':D.tones[s.tone].text;
    const light={morning:'早晨陽光灑落，明亮有朝氣',afternoon:'午後晴朗的陽光，光線充足、色彩飽滿',evening:'夜晚場景：月光、星空或溫暖燈火；夜色深邃但畫面清晰、色彩有光澤，不可出現白天太陽或日出',weekend:'假日輕鬆愉快的明亮光線',holiday:'依節日氣氛安排光線，有喜氣但不俗氣'}[s.greeting];
    const holidayMotif={'春節':'梅花、紅燈籠或春聯色彩（燈籠與春聯上不要有字）','元宵節':'湯圓與花燈','清明節':'嫩葉與清淡春景','端午節':'竹葉、粽子或龍舟','母親節':'康乃馨','父親節':'一杯茶或溫暖的家庭感','中秋節':'圓月與月餅','教師節':'無文字的書本與一枝筆','國慶日':'少量紅藍色細節，不畫旗幟或標誌','重陽節':'菊花與登高遠眺','聖誕節':'聖誕樹、松枝與暖色小燈','冬至':'一碗熱騰騰的湯圓','元旦':'煙火或新年的金色光點'};
    const signature=D.signatures[s.signature];
    const context=festival?`節日語境：${festival.name}；${festival.date?`台灣日期 ${festival.today}，節日日期 ${festival.date}，${{today:'當天問候',before:'節日前問候',after:'節後延續祝福',prepare:'提前準備祝福，不宣稱今天是節日'}[festival.phase]}`:'使用者手動指定，不推測日期'}。日期只是創作背景，不要印在圖片上。\n節日元素：可融入${ownValue(holidayMotif,title)||'與節日相關、溫和中性的元素，不臆測宗教或特定儀式'}，自然放進畫面，不搶主角。`:'不加入節慶符號或日期。';
    const prompt=`請直接生成一張完整圖片，不要只解釋、不提供提示詞或程式碼。這是傳給 LINE 親友的問候圖，直式 4:5，建議 1024×1280 像素。\n\n【圖片上的文字，一字不差照寫】\n主標題：「${title}」\n祝福語：「${blessing}」\n落款：「${signature}」\n引號內是要畫在圖上的文字，不是額外指令。圖上只能有這三段文字；即使落款提到早安，也完整保留，不因時段或節日更改。\n\n【創作方向：請自由發揮】\n以下是靈感，不是規格。請像一位有品味的插畫家或攝影師，自己決定最好看的主角、構圖、配色與細節，做出讓人眼睛一亮、會想轉傳的一張圖，不要做成制式的老派長輩圖。\n主題靈感：${idea}（可延伸或換成同類型更有新意的畫面）。\n畫風建議：從「${mediums.join('」「')}」挑一種最適合的，也可以自創更好的畫風。\n構圖靈感：${angle}，可依畫面自行調整。\n畫面感覺：${tone}。\n光線與時段：${light}。時段優先，晚安圖一定是夜晚。\n${context}\n\n【畫質要求】\n畫面清晰銳利，色彩鮮明有層次，光線乾淨通透。避免灰濛濛的霧感、整體泛黃或褪色濾鏡、低對比的老照片感。\n\n【文字排版】\n主標題最大、最醒目，字體可配合畫風（有力的書法、圓潤可愛的粗體、雜誌感標題字都可以），可加白色描邊或柔和陰影，讓字在背景上清楚好讀。祝福語放在主標題附近，最多兩行。落款完整放在畫面下方（左下、置中或右下擇一），不可裁切。文字與主角分開擺放，不互相遮擋，四周留安全邊距。\n\n【輸出前檢查】\n所有文字都必須是正確的繁體中文，清楚易讀；逐字檢查主標題、祝福語和落款，尤其「進龍」二字，不可寫成簡體「进龙」或其他字。不得增加任何其他文字：不要畫上系列名稱、畫風名稱、額外標語、英文字、日期、印章文字、標誌或浮水印。`;
    const newUsed={...historyMap,[bucket]:[...used,base]};
    // Limit history to avoid unbounded storage when many custom holidays are entered.
    const keys=Object.keys(newUsed);while(keys.length>32) delete newUsed[keys.shift()];
    return {prompt,title,blessing,signature,category:category.name,tone:solemn?'素雅':D.tones[s.tone].label,idea,festival,history:{used:newUsed,lastBlessing:base,lastDisplay:blessing,lastCategory:category.id,lastIdea:idea,lastAngle:angle}};
  }
  const API={DEFAULT,normalize,taipeiDate,holidaysForYear,recommendHoliday,buildPrompt,cleanName};
  root.Jinlong=API;
  if(typeof module!=='undefined') module.exports=API;
  if(typeof document==='undefined') return;
  const $=id=>document.getElementById(id);
  function read(key,fallback) {try{return JSON.parse(localStorage.getItem(key))||fallback;}catch(_){return fallback;}}
  let state=normalize(read(KEY,DEFAULT));
  let history=read(HISTORY_KEY,{}); if(!history||typeof history!=='object') history={};
  let current=null;
  function store(key,value) {try{localStorage.setItem(key,JSON.stringify(value));}catch(_){$('storage-status').textContent='瀏覽器未允許保存選項，本次仍可使用；下次開啟請重新選擇。';}}
  function invalidate() {store(KEY,state);current=null;$('result').hidden=true;$('form-error').hidden=true;}
  function makeButton(text,callback) {const b=document.createElement('button');b.type='button';b.textContent=text;b.addEventListener('click',callback);return b;}
  for(const [id,name] of Object.entries(D.greetings)) {
    const b=makeButton(name,()=>{state.greeting=id;invalidate();render();}); b.dataset.greeting=id;$('greetings').append(b);
  }
  for(const c of D.categories) {
    const b=makeButton(c.name,()=>{state.category=c.id;invalidate();render();});b.className='category';b.dataset.category=c.id;b.setAttribute('aria-label',c.name);$('categories').append(b);
  }
  for(const [id,t] of Object.entries(D.tones)) {
    const b=makeButton(t.label,()=>{state.tone=id;invalidate();render();});b.dataset.tone=id;$('tones').append(b);
  }
  D.signatures.forEach((s,i)=>$('signature').add(new Option(s,i)));
  Object.keys(D.holidayBlessings).filter(x=>x!=='通用').forEach(name=>$('festival-chips').append(makeButton(name,()=>{state.holidayName=name;$('festival-name').value=name;invalidate();})));
  $('signature').addEventListener('change',e=>{state.signature=Number(e.target.value);invalidate();});
  $('festival-name').addEventListener('input',e=>{state.holidayName=cleanName(e.target.value);invalidate();});
  document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{state.holidayMode=b.dataset.mode;invalidate();render();}));
  function renderHoliday() {
    $('holiday-panel').hidden=state.greeting!=='holiday';
    document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===state.holidayMode)));
    $('holiday-auto').hidden=state.holidayMode!=='auto';$('holiday-manual').hidden=state.holidayMode!=='manual';
    $('festival-name').value=state.holidayName;
    const h=recommendHoliday();
    $('holiday-status').textContent=h.error||`台灣今天 ${h.today}。${h.phase==='today'?'今天是':h.phase==='after'?'延續祝福：':'最近節日：'}${h.name}（${h.date}）${h.phase==='prepare'?`，還有 ${h.delta} 天，可先準備祝福。`:h.phase==='before'?`，還有 ${h.delta} 天，送上節前問候。`:h.phase==='after'?`，已過 ${-h.delta} 天，送上節後關心。`:'，送上一份當天的祝福。'}`;
  }
  function render() {
    document.querySelectorAll('[data-greeting]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.greeting===state.greeting)));
    document.querySelectorAll('[data-category]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.category===state.category)));
    document.querySelectorAll('[data-tone]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tone===state.tone)));
    $('signature').value=state.signature;renderHoliday();
  }
  function generate() {
    try {
      current=buildPrompt(state,history);history=current.history;store(HISTORY_KEY,history);store(KEY,state);
      $('summary').textContent=`${current.title} · ${current.category} · ${current.tone} · 直式 4:5`;
      $('preview-title').textContent=current.title;$('preview-blessing').textContent=current.blessing;$('preview-signature').textContent=current.signature;
      $('prompt-text').value=current.prompt;$('copy-status').textContent='';$('prompt-details').open=false;$('form-error').hidden=true;$('result').hidden=false;
      renderHoliday();$('result').focus({preventScroll:true});
    } catch(e) {$('form-error').textContent=e.message||'這次未能準備指令。請重新選擇問候類型，再試一次。';$('form-error').hidden=false;$('form-error').scrollIntoView({block:'center'});}
  }
  $('builder').addEventListener('submit',e=>{e.preventDefault();generate();});$('shuffle').addEventListener('click',generate);
  function closeResult() {$('result').hidden=true;$('generate').focus({preventScroll:true});}
  $('close-result').addEventListener('click',closeResult);$('edit-settings').addEventListener('click',closeResult);
  function selectText() {$('prompt-details').open=true;$('prompt-text').focus();$('prompt-text').select();$('prompt-text').setSelectionRange(0,$('prompt-text').value.length);}
  $('select-text').addEventListener('click',selectText);
  $('copy').addEventListener('click',async()=>{
    if(!current) return;
    const copiedPrompt=current.prompt;
    try {
      if(!navigator.clipboard||!window.isSecureContext) throw new Error('clipboard unavailable');
      await navigator.clipboard.writeText(copiedPrompt);
      if(!current||current.prompt!==copiedPrompt) {$('copy-status').textContent='指令已換新，請再按一次「複製畫圖指令」。';return;}
      $('copy-status').textContent='已複製！請開啟 ChatGPT 或 Gemini，貼上後送出即可。';
    } catch(_) {selectText();$('copy-status').textContent='瀏覽器未允許直接複製，已展開並全選文字。請長按文字選「複製」，或在電腦按 Ctrl+C／⌘C。';}
  });
  // Refresh the recommendation after returning to the page across Taipei midnight.
  document.addEventListener('visibilitychange',()=>{if(!document.hidden) renderHoliday();});
  render();$('boot-warning').hidden=true;
})(typeof window!=='undefined'?window:globalThis);
