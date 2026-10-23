const $ = id => document.getElementById(id);
let DATA, scene, mode = 'map', selected = null, selectedItem = null, failed3D = false, expanded = false;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const saved = key => { try { return localStorage.getItem(key); } catch { return null; } };
const save = (key,value) => { try { localStorage.setItem(key,value); } catch {} };
const el = (tag,text,cls) => { const node=document.createElement(tag); if(text!==undefined)node.textContent=text; if(cls)node.className=cls; return node; };
function safeUrl(value) { try { const url = new URL(value, location.href); return ['http:','https:'].includes(url.protocol) ? url.href : null; } catch { return null; } }
function link(label,url,cls) { const a=el('a',label,cls); const href=safeUrl(url); if(href) {a.href=href;a.target='_blank';a.rel='noopener noreferrer';} else {a.textContent+=' · 來源待補';} return a; }
function itemCard(item) {
 const node=el('div',undefined,'item-card'); node.append(el('span',item.status,'status-chip'),el('p',item.description),el('p','下一步｜'+item.nextAction,'next'),link(item.sourceLabel+' ↗',item.sourceUrl));
 const evidence=el('details',undefined,'source-details');evidence.append(el('summary','來源與核對狀態'),el('p',`更新：${item.updatedAt} · 來源版本 ${item.sourceRevision.slice(0,12)}`,'source-meta'),el('p',item.verifiedBy,'source-meta'));node.append(evidence);return node;
}
function renderList(query='') {
 $('list-content').replaceChildren();let found=0;const q=query.trim().toLocaleLowerCase();
 DATA.islands.forEach((island,index)=>{
  const matches=island.items.filter(item=>[island.title,item.title,item.description,item.status].join(' ').toLocaleLowerCase().includes(q));if(!matches.length)return;
  const section=el('article',undefined,'list-island');section.append(el('p',`ZONE ${String(index+1).padStart(2,'0')}`,'eyebrow'),el('h2',island.icon+' '+island.title),el('p',island.summary));
  matches.forEach(item=>{const d=el('details');d.open=Boolean(q);d.append(el('summary',item.title),itemCard(item));const visit=el('button','到這個攤位看看 →','visit-booth');visit.addEventListener('click',()=>{if(!failed3D)setMode('map');selectItem(item.id);});d.append(visit);section.append(d);found++;});$('list-content').append(section);
 });if(!found)$('list-content').append(el('p','沒有符合的資料。試試「第三章」「文獻」或「評分」。'));
}
function setMode(value) {
 mode=value;const map=value==='map';if(!map&&expanded)expandView(false);document.querySelector('.view-tools').hidden=!map||failed3D;$('map-tab').setAttribute('aria-pressed',String(map));$('list-tab').setAttribute('aria-pressed',String(!map));
 $('list-view').hidden=map;$('scene').hidden=!map;$('scene-controls').hidden=!map||failed3D;$('map-hint').hidden=!map||failed3D;$('reset').hidden=!map||failed3D;$('follow-walker').hidden=!map||failed3D;
 $('zoom-in').hidden=!map||failed3D;$('zoom-out').hidden=!map||failed3D;
 $('flow-legend').hidden=!map||$('flows').getAttribute('aria-pressed')!=='true';scene?.setVisible(map);save('thesis-island-mode',value);
}
function expandView(value) {
 expanded=value;document.querySelector('.world-card').classList.toggle('expanded',value);document.body.classList.toggle('view-expanded',value);
 $('expand-view').setAttribute('aria-pressed',String(value));$('expand-view').setAttribute('aria-label',value?'收起逛園區畫面':'展開逛園區');$('expand-view').firstChild.textContent=value?'⤡':'⤢';$('expand-view').querySelector('span').textContent=value?'收起':'展開';
 for(const node of document.querySelectorAll('.skip,.site-header,.intro,.fair-program,.below-map,footer'))node.inert=value;
 if(!value)$('expand-view').focus({preventScroll:true});
}
function updateSelection(id) {
 selected=id;
 document.querySelectorAll('.island-tab').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.id===id)));
 document.querySelectorAll('[data-item-id]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.itemId===selectedItem)));
}
function showDetail(){const world=document.querySelector('.world-card'),r=world.getBoundingClientRect();if(!expanded&&(r.top< -60||r.top>innerHeight*.24))world.scrollIntoView({block:'start',behavior:reduced.matches?'instant':'smooth'});if(!$('detail').open)$('detail').show();$('detail').scrollTop=0;$('detail').querySelector('.dialog-close').focus({preventScroll:true});}
function boothButton(item,island,cls='booth-entry') {
 const b=el('button',undefined,cls);b.type='button';b.dataset.itemId=item.id;
 b.append(el('span',item.title,'booth-title'),el('span',item.status,'booth-status'));
 b.addEventListener('click',()=>selectItem(item.id));return b;
}
function relatedZones(island) {
 const section=el('section',undefined,'related-zones');section.append(el('h3','接著，逛到哪裡？'),el('p','以下為研究步驟的導覽關聯。','source-meta'));
 DATA.flows.filter(f=>f.from===island.id||f.to===island.id).forEach(f=>{
  const target=DATA.islands.find(i=>i.id===(f.from===island.id?f.to:f.from));if(!target)return;
  const b=el('button',f.label+' · '+target.title+' →','related-chip');b.addEventListener('click',()=>select(target.id));section.append(b);
 });return section;
}
function select(id) {
 const island=DATA.islands.find(i=>i.id===id);if(!island)return;selectedItem=null;updateSelection(id);scene?.select(id);
 const body=$('detail-body');body.replaceChildren();const title=el('h2',island.title);title.id='detail-title';
 body.append(el('p','展區導覽 · '+island.items.length+' 個研究攤位','eyebrow'),title,el('p',island.subtitle,'detail-subtitle'),el('p',island.summary));
 const list=el('div',undefined,'zone-booths');island.items.forEach(item=>{const wrap=el('article',undefined,'zone-booth');wrap.append(boothButton(item,island),el('p',item.description));list.append(wrap);});body.append(list,relatedZones(island));showDetail();
}
function selectItem(id) {
 const island=DATA.islands.find(i=>i.items.some(item=>item.id===id));if(!island)return;const item=island.items.find(item=>item.id===id);
 selectedItem=id;updateSelection(island.id);if(scene?.selectItem)scene.selectItem(id);else scene?.select(island.id);
 const body=$('detail-body');body.replaceChildren();const back=el('button','← '+island.title,'detail-back');back.addEventListener('click',()=>select(island.id));
 const title=el('h2',item.title);title.id='detail-title';body.append(back,el('p','研究攤位 · '+String(island.items.indexOf(item)+1).padStart(2,'0'),'eyebrow'),title,itemCard(item));
 const peers=el('section',undefined,'peer-booths');peers.append(el('h3','同區還有這些攤位'));
 island.items.filter(other=>other.id!==id).forEach(other=>peers.append(boothButton(other,island,'peer-booth')));
 body.append(peers,relatedZones(island));showDetail();
}
function failScene(error) {
 failed3D=true;scene?.dispose();scene=null;$('scene-loading').hidden=true;$('scene-error').hidden=false;$('scene-error').textContent='3D 暫時無法顯示，妳仍可使用下方清單與全部資料連結。';$('map-tab').disabled=true;setMode('list');
 console.warn('Island scene unavailable:',error?.name||'WebGL unavailable');
}
function statusInfo(){
 const body=$('status-body');body.replaceChildren();body.append(el('p',DATA.snapshotNote),el('p','園區中的文字來自紫區研究資料；攤位、舞台、人物、日夜與路線是視覺示意。此頁不呼叫語言模型，不會啟動任務。'));
 const dl=el('dl');for(const [key,value]of [['快照更新',new Date(DATA.generatedAt).toLocaleString('zh-TW',{timeZone:'Asia/Taipei'})+'（台北時間）'],['研究來源版本',DATA.sourceCommits.research],['平台來源版本',DATA.sourceCommits.platform],['現有實驗模型',DATA.runtimeModel.embedding+' / '+DATA.runtimeModel.generation],['模型狀態',DATA.runtimeModel.status],['真實執行事件',DATA.events.length?'已有公開刪敏事件':'尚未接入；沒有即時任務紀錄']])dl.append(el('dt',key),el('dd',value));body.append(dl,link('查看設計與模型分工 ↗',DATA.planUrl));
}
function motionPref(){if(reduced.matches){$('motion').setAttribute('aria-pressed','false');scene?.setMotion(false);}$('motion').disabled=reduced.matches;$('motion').title=reduced.matches?'依系統「減少動態效果」設定，動畫已停用':'只播放場景動畫，不執行 AI 任務';}
async function init(){
 try {
  const response=await fetch('./data.json?v=festival-1023');if(!response.ok)throw new Error('Snapshot unavailable');DATA=await response.json();
  if(DATA.schemaVersion!=='1.0.0'||!Array.isArray(DATA.islands))throw new Error('Unsupported snapshot');
  $('brand-logo').src=safeUrl(DATA.brand.logoUrl);$('brand-logo').alt=DATA.brand.logoAlt;$('motion').setAttribute('aria-pressed',String(DATA.avatar.autoWalk&&!reduced.matches));$('history-link').href=safeUrl(DATA.historyUrl);$('focus').textContent=DATA.currentFocus;$('focus-status').textContent=DATA.currentStatus;$('next-action').textContent=DATA.nextAction;$('continue').href=safeUrl(DATA.primaryUrl);$('continue').firstChild.textContent=DATA.primaryLabel+' ';
  const age=(Date.now()-Date.parse(DATA.generatedAt))/3600000;const date=new Date(DATA.generatedAt).toLocaleDateString('zh-TW',{timeZone:'Asia/Taipei'});
  $('snapshot-text').textContent=`${date} 核對快照${age>24?' · 已超過 24 小時，非即時':''}`;
  DATA.islands.forEach((island,index)=>{
   const group=el('article',undefined,'fair-zone');group.style.setProperty('--island-color',island.color);
   const b=el('button',undefined,'island-tab');b.type='button';b.dataset.id=island.id;b.setAttribute('aria-pressed','false');
   const text=el('span');text.append(el('small',`${island.items.length} 個研究攤位`),el('strong',island.title));
   b.append(el('span',island.icon,'island-icon'),text);b.addEventListener('click',()=>select(island.id));group.append(b);
   const entries=el('div',undefined,'fair-entries');island.items.forEach(item=>entries.append(boothButton(item,island)));group.append(entries);$('island-nav').append(group);
  });
  renderList();statusInfo();motionPref();
  $('search').addEventListener('input',e=>renderList(e.target.value));$('list-tab').addEventListener('click',()=>setMode('list'));$('map-tab').addEventListener('click',()=>setMode('map'));$('reset').addEventListener('click',()=>{scene?.reset();selected=null;selectedItem=null;updateSelection(null);});
  $('expand-view').addEventListener('click',()=>expandView(!expanded));$('zoom-in').addEventListener('click',()=>scene?.zoom(.8));$('zoom-out').addEventListener('click',()=>scene?.zoom(1.25));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('detail').open){e.preventDefault();$('detail').close();return;}if(e.key==='Escape'&&expanded&&!document.querySelector('dialog[open]')){e.preventDefault();expandView(false);}});
  $('follow-walker').addEventListener('click',()=>scene?.followWalker($('follow-walker').getAttribute('aria-pressed')!=='true'));
  $('flows').addEventListener('click',()=>{const enabled=$('flows').getAttribute('aria-pressed')!=='true';$('flows').setAttribute('aria-pressed',String(enabled));scene?.setFlows(enabled);$('flow-legend').hidden=!enabled;});
  $('motion').addEventListener('click',()=>{const enabled=$('motion').getAttribute('aria-pressed')!=='true';$('motion').setAttribute('aria-pressed',String(enabled));$('motion').firstChild.textContent=enabled?'Ⅱ ':'▷ ';scene?.setMotion(enabled);});
  document.querySelectorAll('[data-time]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('[data-time]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));scene?.setTime(b.dataset.time);}));
  reduced.addEventListener('change',motionPref);
  if(saved('thesis-island-mode')==='list')setMode('list');
  // The list is built first. All WebGL/module errors are contained below.
  try { const {createIslandScene}=await import('./scene.js?v=festival-1023');scene=await createIslandScene({container:$('scene'),data:DATA,onSelect:select,onSelectItem:selectItem,onError:failScene,onFollowChange:value=>{$('follow-walker').setAttribute('aria-pressed',String(value));document.querySelector('.world-card').classList.toggle('following',value);}});$('scene-loading').hidden=true;scene.setVisible(mode==='map');motionPref(); }
  catch(error){failScene(error);}
  if(!saved('thesis-island-welcome')){$('help-open').classList.add('welcome-hint');$('map-hint').textContent='按「展開」自在逛園區 · 按 ＋ 看細節';save('thesis-island-welcome','shown');}
  // Read-only diagnostics for reproducible browser checks. No query engine calls.
  window.islandDiagnostics=()=>({mode,expanded,selected,selectedItem,failed3D,revision:DATA.sourceCommits,items:DATA.islands.reduce((n,i)=>n+i.items.length,0),scene:scene?.getStats()});
 } catch(error){$('scene-loading').hidden=true;$('focus-status').textContent='快照讀取失敗；研究正本仍可開啟。';const box=$('data-error');box.hidden=false;box.replaceChildren(el('p','研究快照暫時無法載入。可重新整理，或開啟紫區資料庫。'),link('開啟紫區資料庫 ↗','https://tarshar4242.github.io/learn-ai-with-tarshar/thesis-library/purple/'));setMode('list');}
}
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>$(b.dataset.close).close()));
$('help-open').addEventListener('click',()=>$('help').showModal());$('status-open').addEventListener('click',()=>$('status-dialog').showModal());
for(const d of document.querySelectorAll('dialog'))d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}});
init();
