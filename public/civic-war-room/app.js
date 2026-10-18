'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const STATUSES=['我要做','我在等','等主管','待釐清','知道就好','已完成'];
const CATEGORIES=['會議與交辦','公文與簽辦','跨單位協調','專案與活動','例行行政','知識與制度'];
const KEY='civic-room-v1';let timer,editing=null,storageBlocked=false,unreadableStored=null,recoveryReady=false,lastStored=null,hasUnsavedChanges=false,lastRemoved=null;
const day=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
function relativeDate(n){if(n===null||n===undefined)return '';const d=new Date();d.setDate(d.getDate()+n);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function seedTasks(){return CIVIC_SEED.tasks.map(t=>({...t,start:relativeDate(t.startOffset),due:relativeDate(t.dueOffset),follow:relativeDate(t.followOffset),updated:new Date().toISOString(),completedEvidence:t.status==='已完成'?'示範檢查清單已確認':'',history:[]}))}
let state={version:1,links:structuredClone(CIVIC_SEED.links),tasks:seedTasks()};
const initialTasks=structuredClone(state.tasks);
function uid(){return 'item-'+(crypto.randomUUID?crypto.randomUUID():Date.now()+'-'+Math.random().toString(36).slice(2))}
function safeURL(value){try{const u=new URL(value);if(!['https:','http:'].includes(u.protocol)||u.username||u.password)return '';return u.href}catch{return ''}}
const text=(v,max=3000)=>typeof v==='string'?v.trim().slice(0,max):'';
function validDate(v){if(v==='')return true;if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v))return false;const d=new Date(v+'T12:00:00Z');return !isNaN(d)&&d.toISOString().slice(0,10)===v}
function validate(data){
 if(!data||data.version!==1||!Array.isArray(data.links)||!Array.isArray(data.tasks))throw Error('備份格式不符。');
 if(data.links.length>500)throw Error('入口超過 500 筆上限，請先移除不需要的入口。');
 if(data.tasks.length>500)throw Error('工作超過 500 筆上限，請先移除不需要的工作。');
 let ids=new Set();const links=data.links.map(x=>{if(!x||!text(x.name,100)||!safeURL(x.url)||!text(x.id,100)||ids.has(text(x.id,100)))throw Error('入口含空白名稱、不安全網址或重複代碼。');ids.add(text(x.id,100));return {id:text(x.id,100),name:text(x.name,100),category:text(x.category,40)||'其他',url:safeURL(x.url),description:text(x.description,500),verification:text(x.verification,120),access:text(x.access,120),favorite:x.favorite===true};});
 ids=new Set();const tasks=data.tasks.map(x=>{if(!x||!text(x.title,160)||!text(x.id,100)||ids.has(text(x.id,100))||!STATUSES.includes(x.status)||!validDate(x.start??'')||!validDate(x.due)||!validDate(x.follow))throw Error('工作卡含不完整標題、重複代碼、無效狀態或日期。');ids.add(text(x.id,100));const t={id:text(x.id,100),status:x.status,importSourceId:text(x.importSourceId,100),judgmentConfirmed:x.judgmentConfirmed===true};for(const k of ['title','category','source','fact','next','owner','waiting','judgment','reason','start','due','follow','updated','completedEvidence'])t[k]=text(x[k]);t.history=Array.isArray(x.history)?x.history.slice(-30).map(h=>({at:text(h.at,80),note:text(h.note,200)})):[];if(t.start&&t.due&&t.start>t.due)throw Error('開始日不可晚於到期日。');if(t.judgmentConfirmed&&!t.judgment)throw Error('確認的判斷不可空白。');if(['我在等','等主管'].includes(t.status)&&(!t.waiting||!t.follow))throw Error('等待中的工作須有對象與追蹤日。');if(t.status==='已完成'&&!t.completedEvidence)throw Error('已完成工作須有完成依據。');return t;});return {version:1,links,tasks,removedSeedIds:Array.isArray(data.removedSeedIds)?[...new Set(data.removedSeedIds.map(x=>text(x,100)).filter(Boolean))].slice(0,500):[]};
}
state=validate(state);
try{
 unreadableStored=localStorage.getItem(KEY);lastStored=unreadableStored;
 if(unreadableStored){
  state=validate(JSON.parse(unreadableStored));
  const additions=CIVIC_SEED.links.filter(l=>!state.removedSeedIds.includes(l.id)&&!state.links.some(x=>x.id===l.id||safeURL(x.url)===safeURL(l.url))).slice(0,Math.max(0,500-state.links.length));
  if(additions.length){state.links.push(...structuredClone(additions));save();}
 }
 unreadableStored=null;
}catch(e){
 storageBlocked=true;
 $('#storageWarning').hidden=false;
 $('#storageWarning').textContent='原儲存資料無法讀取，已停止寫入以保留原值。目前畫面使用示範資料；請先下載原始資料，再決定是否恢復保存。';
 $('#storageRecovery').hidden=unreadableStored===null;
}
function save(){
 if(storageBlocked){hasUnsavedChanges=true;return false;}
 try{if(localStorage.getItem(KEY)!==lastStored){hasUnsavedChanges=true;showStorageConflict();return false;}const value=JSON.stringify(state);localStorage.setItem(KEY,value);lastStored=value;hasUnsavedChanges=false;return true;}catch(e){hasUnsavedChanges=true;$('#storageWarning').hidden=false;$('#storageWarning').textContent='瀏覽器無法保存變更，目前只留在畫面記憶體；請匯出備份再關閉。';return false}
}
function toast(s){clearTimeout(timer);$('#toast').textContent=s;$('#toast').hidden=false;timer=setTimeout(()=>$('#toast').hidden=true,4000)}
function node(tag,cls,content){const e=document.createElement(tag);if(cls)e.className=cls;if(content!==undefined)e.textContent=content;return e}
function btn(label,fn,cls=''){const b=node('button',cls,label);b.type='button';b.addEventListener('click',fn);return b}
function opts(select,values){const current=select.value;select.replaceChildren(new Option(select.options[0]?.text||'全部分類',''),...values.map(v=>new Option(v,v)));select.value=values.includes(current)?current:''}
function view(v){for(const x of ['links','tasks','guide','schedule'])$('#'+x+'View').hidden=x!==v;$$('[data-view]').forEach(b=>{b.classList.toggle('selected',b.dataset.view===v);b.setAttribute('aria-pressed',String(b.dataset.view===v))});if(v==='schedule'){renderSchedule();$('#scheduleView').scrollIntoView({block:'start'});}}
function overdue(t){return t.status!=='已完成'&&t.status!=='知道就好'&&t.due&&t.due<day()}
function needsFollow(t){return ['我在等','等主管'].includes(t.status)&&t.follow&&t.follow<=day()}
function render(){opts($('#linkCategory'),[...new Set(state.links.map(x=>x.category))]);opts($('#taskStatus'),STATUSES);opts($('#taskCategory'),CATEGORIES);renderLinks();renderTasks();renderSchedule();const active=state.tasks.filter(t=>t.status!=='已完成'&&t.status!=='知道就好');const late=active.filter(overdue).length;const follow=active.filter(needsFollow).length;$('#dailyTitle').textContent=`${late} 件逾期 · ${follow} 件該追蹤`;$('#dailyText').textContent=`還有 ${active.filter(t=>t.status==='待釐清').length} 件待釐清。摘要由目前 ${state.tasks.length} 張示範卡即時計算。`;}
function renderLinks(){const q=$('#linkSearch').value.trim().toLowerCase(),cat=$('#linkCategory').value,fav=$('#favOnly').checked;const links=state.links.filter(x=>(!cat||x.category===cat)&&(!fav||x.favorite)&&[x.name,x.description,x.category].join(' ').toLowerCase().includes(q)).sort((a,b)=>Number(b.favorite)-Number(a.favorite));$('#linkCount').textContent=`顯示 ${links.length} / ${state.links.length} 個入口 · 收藏 ${state.links.filter(x=>x.favorite).length} 個`;const grid=$('#linkGrid');grid.replaceChildren();for(const x of links){const card=node('article','entry');const top=node('div','cardtop');top.append(node('span','badge',x.category));const favorite=btn(x.favorite?'★':'☆',()=>{x.favorite=!x.favorite;save();renderLinks()},'favorite');favorite.setAttribute('aria-label',(x.favorite?'取消收藏 ':'收藏 ')+x.name);favorite.setAttribute('aria-pressed',String(x.favorite));top.append(favorite);const actions=node('div','actions');const a=node('a','button primary open','開啟入口 ↗');a.href=safeURL(x.url);a.target='_blank';a.rel='noopener noreferrer';actions.append(a,btn('編輯',()=>editLink(x)),btn('移除',()=>removeItem('links',x)));card.append(top,node('h3','',x.name),node('p','',x.description),node('div','muted',x.verification),node('div','muted',x.access),actions);grid.append(card)}if(!links.length)grid.append(node('div','empty','沒有符合的入口，請換一個搜尋詞或分類。'))}
function suggestion(t){if(t.status==='已完成')return '已留完成依據；若需求改變，可編輯狀態重新開啟。';if(t.status==='待釐清')return '先核對來源差異、責任與期限，保留不一致的說法。';if(!t.due&&t.status!=='知道就好')return '截止日尚未確認；先確認期限，不自行推定。';if(needsFollow(t))return '已到追蹤日，先確認最新回覆，再決定是否使用追詢草稿。';if(overdue(t))return '已過示範期限，先核對進度與影響，必要時重新協調。';if(t.status==='等主管')return '整理待決問題、選項與影響，再請主管判斷。';if(t.status==='知道就好')return '先保留來源，有明確行動需求時再轉為工作。';return '依下一步檢查交付物，完成後留下依據。'}
function draft(t){return `【示範草稿，尚未寄送】\n關於「${t.title}」，目前掌握：${t.fact||'待補事實'}\n想請協助：${t.next||'待確認下一步'}\n期望交付日期：${t.due||'待確認，不自行指定'}\n期待成果：${t.next||'待確認交付物'}\n請確認上述理解與可行時間。`;}
function renderTasks(){const q=$('#taskSearch').value.trim().toLowerCase(),s=$('#taskStatus').value,c=$('#taskCategory').value;$('#metrics').replaceChildren(...STATUSES.map(st=>{const b=btn('',()=>{$('#taskStatus').value=st;renderTasks()},'metric');b.append(node('strong','',String(state.tasks.filter(t=>t.status===st).length)),node('span','',st));b.setAttribute('aria-label',st+' '+state.tasks.filter(t=>t.status===st).length+'件');return b}));let tasks=state.tasks.filter(t=>(!s||t.status===s)&&(!c||t.category===c)&&[t.title,t.source,t.next].join(' ').toLowerCase().includes(q));tasks.sort((a,b)=>(a.status==='已完成')-(b.status==='已完成')||Number(!!overdue(b))-Number(!!overdue(a))||(a.due||'9999').localeCompare(b.due||'9999'));$('#taskCount').textContent=`顯示 ${tasks.length} / ${state.tasks.length} 張示範工作卡`;const grid=$('#taskGrid');grid.replaceChildren();for(const t of tasks){const card=node('article','task');const top=node('div','cardtop');top.append(node('span','badge '+(overdue(t)?'warn':t.status==='已完成'?'done':'work'),t.status+(overdue(t)?' · 逾期':'')),node('span','muted',t.importSourceId?'匯入副本 · 模擬資料':'模擬資料'));const dl=node('dl');for(const [label,val] of [['來源',t.source||'待補來源'],['來源事實',t.fact||'待釐清'],['下一步',t.next||'待確認'],['等待對象',t.waiting||'無'],['我的判斷',t.judgmentConfirmed?t.judgment:'尚未確認'],['判斷理由',t.reason||'待本人補充']])dl.append(node('dt','',label),node('dd','',val));const sug=node('div','suggestion','規則建議（非 AI 自動判斷）：'+suggestion(t));const detail=node('details');detail.append(node('summary','','檢視草稿與修改紀錄'),node('div','draft',draft(t)),btn('複製草稿',()=>copy(draft(t))));detail.append(node('p','muted',t.history.slice(-3).map(h=>h.at.slice(0,16)+' '+h.note).join('\n')||'尚無修改紀錄'));const actions=node('div','actions');actions.append(btn('移除',()=>removeItem('tasks',t)),btn('編輯進度',()=>editTask(t),'primary'),btn('複製接續指令',()=>copy(`請接續這件示範工作，先核對來源再提出下一步，不代為傳送。\n標題：${t.title}\n來源：${t.source}\n狀態：${t.status}\n下一步：${t.next}\n期限：${t.due||'待確認'}\n本人判斷：${t.judgmentConfirmed?t.judgment:'尚未確認'}`)));card.append(top,node('h3','',t.title),node('div','muted',t.category),node('div','dates',`開始 ${t.start||'未設定'} ｜ 到期 ${t.due||'待確認'} ｜ 追蹤 ${t.follow||'未設定'}`),sug,dl,detail,actions);grid.append(card)}if(!tasks.length)grid.append(node('div','empty','沒有符合的示範工作。'))}
function field(label,name,value='',type='text',choices=null){const l=node('label','',label);let input;if(choices){input=node('select');for(const o of choices)input.append(new Option(o,o));input.value=value}else if(type==='textarea'){input=node('textarea');input.rows=3;input.value=value}else{input=node('input');input.type=type;if(type==='checkbox')input.checked=!!value;else input.value=value;}input.name=name;if(['name','title','url'].includes(name))input.required=true;if(type==='text')input.maxLength=name==='url'?2000:500;l.append(input);return l;}
function openEditor(title,fields,kind,item){editing={kind,item};$('#dialogTitle').textContent=title;$('#formFields').replaceChildren(...fields);$('#formError').textContent='';$('#editor').showModal();}
function editLink(x={}){openEditor(x.id?'編輯入口':'新增入口',[field('名稱','name',x.name),field('分類','category',x.category||'其他','text'),field('網址（http 或 https）','url',x.url,'url'),field('用途','description',x.description,'textarea'),field('存取限制','access',x.access),field('放到收藏','favorite',x.favorite,'checkbox')],'link',x)}
function editTask(t={}){openEditor(t.id?'編輯示範工作':'新增示範工作',[field('標題（僅用模擬內容）','title',t.title),field('工作類別','category',t.category||CATEGORIES[0],'text',CATEGORIES),field('處理佇列','status',t.status||'待釐清','text',STATUSES),field('來源代碼／一般描述','source',t.source),field('來源事實','fact',t.fact,'textarea'),field('下一步與交付物','next',t.next,'textarea'),field('責任角色','owner',t.owner||'我'),field('等待對象（角色稱呼）','waiting',t.waiting),field('開始日；不知道可留白','start',t.start,'date'),field('到期日；不知道可留白','due',t.due,'date'),field('下次追蹤日','follow',t.follow,'date'),field('我的判斷','judgment',t.judgment,'textarea'),field('判斷理由','reason',t.reason,'textarea'),field('我已確認上面的判斷','judgmentConfirmed',t.judgmentConfirmed,'checkbox'),field('完成依據（結案時必填）','completedEvidence',t.completedEvidence,'textarea')],'task',t)}
$('#editForm').addEventListener('submit',e=>{e.preventDefault();try{
 const fd=new FormData(e.target);let x=Object.fromEntries(fd);const old=editing.item,candidate=structuredClone(state);x.id=old.id||uid();
 if(editing.kind==='link'){
  x.favorite=fd.has('favorite');x.url=safeURL(x.url);x.name=text(x.name,100);
  if(!x.url||!x.name)throw Error('請填名稱與有效的 http／https 網址。');
  if(candidate.links.some(l=>l.id!==x.id&&safeURL(l.url)===x.url))throw Error('這個網址已在入口清單中，請搜尋現有入口再編輯。');
  x.category=text(x.category,40)||'其他';x.verification=old.id&&x.url===safeURL(old.url)?old.verification:'使用者新增／修改，尚未核對';
  if(old.id)candidate.links[candidate.links.findIndex(l=>l.id===old.id)]=x;else candidate.links.push(x);
 }else{
  x.importSourceId=old.importSourceId||'';x.judgmentConfirmed=fd.has('judgmentConfirmed');x.updated=new Date().toISOString();x.history=[...(old.history||[]),{at:x.updated,note:old.id?`${old.status} → ${x.status}；已更新工作卡`:'建立示範工作'}].slice(-30);
  if(!x.source||!x.next)throw Error('請填來源與下一步；不明確時寫出待確認的事項。');
  if(old.id)candidate.tasks[candidate.tasks.findIndex(t=>t.id===old.id)]=x;else candidate.tasks.push(x);
 }
 state=validate(candidate);const saved=save();$('#editor').close();render();toast(saved?'已儲存於目前瀏覽器':'已更新畫面，尚未保存；請匯出備份');
}catch(err){$('#formError').textContent=err.message;}});
async function copy(value){try{await navigator.clipboard.writeText(value);toast('已複製；尚未傳送')}catch{const t=node('textarea');t.value=value;t.style.position='fixed';t.style.top='0';document.body.append(t);t.select();try{if(!document.execCommand('copy'))throw Error();toast('已複製；尚未傳送')}catch{toast('瀏覽器未允許自動複製，請選取文字手動複製')}finally{t.remove()}}}
function download(name,content){const a=node('a');a.href=URL.createObjectURL(new Blob([content],{type:'application/json'}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),5000)}
$('#exportData').onclick=()=>download('公務戰情室備份_'+day()+'.json',JSON.stringify({...state,exportedAt:new Date().toISOString()},null,2));
function taskFingerprint(task){const item={...task};delete item.id;delete item.importSourceId;delete item.updated;delete item.history;item.title=item.title.replace(/（匯入副本）$/,'');return JSON.stringify(item);}
$('#importData').onchange=async e=>{try{
 const f=e.target.files[0];if(!f)return;if(f.size>16*1024*1024)throw Error('檔案超過 16 MB，未匯入。');
 const incoming=validate(JSON.parse(await f.text())),merged=structuredClone(state);let count=0;
 for(const l of incoming.links)if(!merged.links.some(x=>safeURL(x.url)===safeURL(l.url))){merged.links.push({...l,id:merged.links.some(x=>x.id===l.id)?uid():l.id,verification:'備份匯入，待重新核對'});count++;}
 for(const t of incoming.tasks){
  const origin=t.importSourceId||t.id,fingerprint=taskFingerprint(t);
  if(merged.tasks.some(x=>(x.id===origin||x.importSourceId===origin||(!x.importSourceId&&x.title===t.title+'（匯入副本）'))&&taskFingerprint(x)===fingerprint))continue;
  const existing=merged.tasks.find(x=>x.id===t.id);
  const fresh=lastStored===null&&existing&&initialTasks.some(x=>x.id===existing.id&&taskFingerprint(validate({version:1,links:[],tasks:[x]}).tasks[0])===taskFingerprint(existing));
  if(fresh){merged.tasks[merged.tasks.indexOf(existing)]=t;count++;continue;}
  merged.tasks.push(existing?{...t,id:uid(),importSourceId:origin}:t);count++;
 }
 state=validate(merged);const saved=save();render();$('#importResult').textContent=saved?`匯入完成並保存，新增 ${count} 筆。相同網址與相同版本不重複加入，既有工作不覆蓋。`:`已合併到畫面 ${count} 筆，尚未保存。請匯出備份後再關閉；原儲存值保留。`;
}catch(err){$('#importResult').textContent='未匯入：'+err.message}finally{e.target.value=''}};
$('#restoreDemo').onclick=()=>{try{const candidate=structuredClone(state);let count=0;for(const t of seedTasks())if(!candidate.tasks.some(x=>x.id===t.id)){candidate.tasks.push(t);count++;}state=validate(candidate);const saved=save();render();toast(saved?`已補回 ${count} 張缺少的示範卡；既有修改保留。`:`畫面補回 ${count} 張，尚未保存；請匯出備份。`);}catch(e){toast(e.message);}};
$('#exportOriginal').onclick=()=>{if(unreadableStored!==null){download('公務戰情室原始資料_'+day()+'.json',unreadableStored);recoveryReady=true;$('#resumeStorage').disabled=false;}};
$('#resumeStorage').onclick=()=>{
 if(!recoveryReady||!confirm('請先確認原始資料已下載。接下來會以目前畫面取代瀏覽器中的損壞資料，恢復保存。'))return;
 storageBlocked=false;if(save()){unreadableStored=null;$('#storageRecovery').hidden=true;$('#storageWarning').hidden=true;toast('已恢復保存；原始下載檔請留存。');}else storageBlocked=true;
};
$('#auditPrompt').value="請幫我檢核「熟成局」ChatGPT 專案與既有 Notion 資料庫的收錄缺漏，讓後續 AI 能依據來源查找與接續。\n\n1. 先列出本次實際可讀取的聊天室、專案檔案與 Notion 頁面／資料庫；看不到的列為「無法核對」，不能當成沒有，也不能宣稱已讀完所有聊天。\n2. 逐項對照重要決策、工作事件、會議／交辦、進度與待辦、學習心得、公文知識、可重用做法及常用連結。區分「已收錄」「缺漏」「過時／衝突」「疑似重複」「無法核對」。\n3. 優先使用既有熟成事件池、工作日誌、學習熟成、公文熟成局及關鍵句練習庫。工作日誌與學習熟成用途不同，不合併資料庫。\n4. 輸出缺漏表：項目、來源連結或可定位資訊、目前 Notion 位置、缺漏或差異、建議補入的既有資料庫、可直接補登的內容、優先順序。未確定的事實明確標記，不自行補寫。\n5. 另外整理「公務生態系戰情室入口清單」：名稱、用途、完整網址、分類、是否常用、存取限制。涵蓋實際找到的聊天室、Notion 資料庫、工具、檔案及工作系統；沒有網址就註明待補，不編造。\n6. 最後提供可交給 Codex 的接續摘要：已核對範圍、重要缺漏、待補入口與下一步。未公開公務內容及個資留在原本允許環境，接續摘要只含可共享資訊。\n\n這一輪先完成核對與補登草稿，不刪除、合併或覆蓋既有資料，也不把尚未寫入的內容說成已同步。";
$('#copyAudit').onclick=()=>copy($('#auditPrompt').value);
// The calendar and timeline use the same saved work cards as the task view.
let scheduleMonth=day().slice(0,7), scheduleDay=day(), scheduleMode='calendar';
function monthDates(month){
 const [y,m]=month.split('-').map(Number), count=new Date(y,m,0).getDate();
 return Array.from({length:count},(_,i)=>`${month}-${String(i+1).padStart(2,'0')}`);
}
function scheduleTasks(){const status=$('#scheduleStatus').value;return state.tasks.filter(t=>!status||t.status===status);}
function eventsOn(t,date){return [['start','開始'],['due','到期'],['follow','追蹤']].filter(([key])=>t[key]===date).map(([,label])=>label);}
function taskTone(t){return t.status==='已完成'?'finished':overdue(t)?'late':['我在等','等主管'].includes(t.status)?'waiting':'active';}
function scheduleRow(t,description){
 const row=node('article','agenda-row '+taskTone(t)),body=node('div');
 body.append(node('h4','',t.title),node('p','muted',description),node('p','',t.next||'下一步待確認'));
 const edit=btn('編輯工作',()=>editTask(t));edit.setAttribute('aria-label','編輯工作 '+t.title);
 row.append(body,node('span','badge',t.status),edit);return row;
}
function moveMonth(offset){
 const [y,m]=scheduleMonth.split('-').map(Number),d=new Date(y,m-1+offset,1,12);
 if(d.getFullYear()<1000||d.getFullYear()>9999)return;
 scheduleMonth=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
 scheduleDay=scheduleMonth===day().slice(0,7)?day():scheduleMonth+'-01';renderSchedule();
}
function renderSchedule(){
 const tasks=scheduleTasks(),dates=monthDates(scheduleMonth),[y,m]=scheduleMonth.split('-');
 $('#scheduleMonthLabel').textContent=`${y} 年 ${Number(m)} 月`;
 const open=state.tasks.filter(t=>!['已完成','知道就好'].includes(t.status));
 $('#scheduleSummary').textContent=`${open.length} 件待處理 · ${open.filter(overdue).length} 件逾期 · ${open.filter(needsFollow).length} 件待追蹤`;
 $('#calendarPanel').hidden=scheduleMode!=='calendar';$('#ganttPanel').hidden=scheduleMode!=='gantt';
 for(const b of $$('[data-schedule-mode]')){b.setAttribute('aria-pressed',String(b.dataset.scheduleMode===scheduleMode));b.classList.toggle('primary',b.dataset.scheduleMode===scheduleMode);}
 const grid=$('#calendarGrid');grid.replaceChildren();
 for(const name of ['日','一','二','三','四','五','六'])grid.append(node('div','weekday',name));
 const offset=new Date(Number(y),Number(m)-1,1,12).getDay();
 for(let i=0;i<offset;i++){const blank=node('div','calendar-blank');blank.setAttribute('aria-hidden','true');grid.append(blank);}
 for(const date of dates){
  const items=tasks.filter(t=>eventsOn(t,date).length),button=btn('',()=>{scheduleDay=date;renderSchedule();document.querySelector(`[data-date="${date}"]`)?.focus({preventScroll:true});if(matchMedia('(max-width:600px)').matches)$('#agendaDate').scrollIntoView({block:'start'});},'calendar-day');
  button.dataset.date=date;
  button.classList.toggle('is-today',date===day());button.classList.toggle('is-selected',date===scheduleDay);
  button.setAttribute('aria-label',`${date}，${items.length} 件工作`);button.setAttribute('aria-pressed',String(date===scheduleDay));
  if(date===day())button.setAttribute('aria-current','date');
  button.append(node('strong','',String(Number(date.slice(-2)))));
  if(items.length){button.append(node('span','day-count',`${items.length} 件`));const dots=node('span','day-dots');dots.setAttribute('aria-hidden','true');for(const t of items.slice(0,4))dots.append(node('i',taskTone(t)));button.append(dots);}
  grid.append(button);
 }
 $('#agendaDate').textContent=`${scheduleDay} 的工作`;
 const agenda=$('#agendaList');agenda.replaceChildren();
 const selected=tasks.filter(t=>eventsOn(t,scheduleDay).length);
 for(const t of selected)agenda.append(scheduleRow(t,eventsOn(t,scheduleDay).join('、')+' · '+(t.waiting?'等待 '+t.waiting:'目前由 '+(t.owner||'我')+' 處理')));
 if(!selected.length)agenda.append(node('p','empty','這一天沒有符合篩選的工作日期。'));
 renderGantt(tasks,dates);
 const unplanned=tasks.filter(t=>!t.start&&!t.due&&!t.follow),pending=$('#unscheduledList');pending.replaceChildren();
 $('#unscheduledTitle').textContent=`尚未排定日期（${unplanned.length} 件）`;
 for(const t of unplanned)pending.append(scheduleRow(t,'開始、到期與追蹤日皆未設定'));
 if(!unplanned.length)pending.append(node('p','muted','目前沒有完全未排日期的工作。'));
}
function renderGantt(tasks,dates){
 const table=$('#ganttTable'),first=dates[0],last=dates.at(-1),count=dates.length;table.replaceChildren();
 table.style.setProperty('--days',String(count));table.style.minWidth=`${matchMedia('(max-width:600px)').matches?130+count*44:210+count*44}px`;
 const header=node('div','gantt-row gantt-head');header.append(node('div','gantt-name','工作／狀態'));
 for(const date of dates){const cell=node('div','gantt-date',String(Number(date.slice(-2))));if(date===day())cell.classList.add('gantt-today');header.append(cell);}table.append(header);
 const included=tasks.filter(t=>(t.start&&t.due&&t.start<=last&&t.due>=first)||['start','due','follow'].some(k=>t[k]>=first&&t[k]<=last));
 for(const t of included){
  const row=node('div','gantt-row'),label=btn('',()=>editTask(t),'gantt-name');
  label.append(node('strong','',t.title),node('span','muted',t.status));label.setAttribute('aria-label','編輯工作 '+t.title);
  const track=node('div','gantt-track');
  const todayIndex=dates.indexOf(day());if(todayIndex>=0){const line=node('span','today-line');line.style.gridColumn=String(todayIndex+1);line.setAttribute('aria-hidden','true');track.append(line);}
  if(t.start&&t.due){
   const start=dates.indexOf(t.start<first?first:t.start),end=dates.indexOf(t.due>last?last:t.due);
   if(start>=0&&end>=start){const bar=btn('',()=>editTask(t),'gantt-bar '+taskTone(t));bar.style.gridColumn=`${start+1} / ${end+2}`;bar.setAttribute('aria-label',`${t.title}，排定期間 ${t.start} 至 ${t.due}，${t.status}`);bar.title=`${t.start} → ${t.due}｜${t.status}`;track.append(bar);}
  }
  for(const [key,kind,symbol] of [['start','開始','○'],['due','到期','◆'],['follow','追蹤','●']]){
   const index=dates.indexOf(t[key]);if(index<0||(key==='start'&&t.due))continue;
   const marker=btn(symbol,()=>editTask(t),'gantt-marker '+key+' '+taskTone(t));marker.style.gridColumn=String(index+1);marker.style.gridRow=key==='follow'?'2':'1';marker.setAttribute('aria-label',`${t.title}，${kind} ${t[key]}，${t.status}`);marker.title=`${kind} ${t[key]}`;track.append(marker);
  }
  row.append(label,track);table.append(row);
 }
 $('#ganttEmpty').hidden=!!included.length;
 $('#ganttCount').textContent=`本月顯示 ${included.length} / ${tasks.length} 件工作。色帶表示排定期間；只有到期日的工作以菱形標記，不推算開始日或完成百分比。`;
}
function initSchedule(){
 opts($('#scheduleStatus'),STATUSES);
 $('#scheduleStatus').addEventListener('change',renderSchedule);
 $('#schedulePrev').onclick=()=>moveMonth(-1);$('#scheduleNext').onclick=()=>moveMonth(1);
 $('#scheduleToday').onclick=()=>{scheduleMonth=day().slice(0,7);scheduleDay=day();renderSchedule();};
 for(const b of $$('[data-schedule-mode]'))b.onclick=()=>{scheduleMode=b.dataset.scheduleMode;renderSchedule();};
}

initSchedule();
$('#addLink').onclick=()=>editLink();$('#addTask').onclick=()=>editTask();$('#closeEditor').onclick=$('#cancelEdit').onclick=()=>$('#editor').close();$('#toTasks').onclick=()=>view('tasks');$$('[data-view]').forEach(b=>b.onclick=()=>view(b.dataset.view));['linkSearch','linkCategory','favOnly'].forEach(id=>$('#'+id).addEventListener('input',renderLinks));['taskSearch','taskStatus','taskCategory'].forEach(id=>$('#'+id).addEventListener('input',renderTasks));$('#today').textContent=new Date().toLocaleDateString('zh-TW',{month:'long',day:'numeric',weekday:'long'});render();

if(window.CIVIC_IMPORTED){
 const missing=CIVIC_SEED.links.filter(l=>!state.removedSeedIds.includes(l.id)&&!state.links.some(x=>x.id===l.id||safeURL(x.url)===safeURL(l.url))).length;
 const persisted=save();$('#setupNotice').textContent=missing?`入口已達 500 筆上限，尚有 ${missing} 個入口未加入。請先匯出備份，整理後再啟用。`:(persisted?'已載入你的私人入口。之後可以從網站首頁直接進來。':'私人入口已載入畫面，尚未保存；請先匯出備份。');
}

function showStorageConflict(){
 $('#storageConflict').hidden=false;$('#storageWarning').hidden=false;
 $('#storageWarning').textContent='另一個分頁已更新或清除資料。這個分頁暫停保存，避免覆蓋；可以先匯出目前畫面，再載入已保存版本。';
}
function syncFromStorage(){
 try{
  const raw=localStorage.getItem(KEY);if(raw===lastStored)return;
  if(storageBlocked||hasUnsavedChanges||$('#editor').open||raw===null){showStorageConflict();return;}
  state=validate(JSON.parse(raw));lastStored=raw;render();toast('已載入另一個分頁保存的變更。');
 }catch{showStorageConflict();}
}
window.addEventListener('storage',event=>{if(event.key===KEY||event.key===null)syncFromStorage();});
$('#exportMemory').onclick=()=>$('#exportData').click();
$('#reloadSaved').onclick=()=>{if(confirm('載入已保存版本會放棄這個分頁尚未保存的變更。需要保留的話，請先匯出目前畫面。'))location.reload();};
$('#openImport').onclick=()=>$('#importData').click();
function removeItem(kind,item){
 if(!confirm(`移除「${item.name||item.title}」？只從戰情室移除，不會刪除來源網站或資料。`))return;
 const candidate=structuredClone(state);candidate[kind]=candidate[kind].filter(x=>x.id!==item.id);if(kind==='links')candidate.removedSeedIds=[...new Set([...candidate.removedSeedIds,item.id])];state=validate(candidate);
 lastRemoved={kind,item:structuredClone(item)};$('#undoRemoval').hidden=false;const saved=save();render();toast(saved?'已移除。可按「復原上次移除」；重新整理後無法復原。':'畫面已移除，尚未保存。');
}
$('#undoRemoval').onclick=()=>{if(!lastRemoved)return;try{const candidate=structuredClone(state);if(!candidate[lastRemoved.kind].some(x=>x.id===lastRemoved.item.id))candidate[lastRemoved.kind].push(lastRemoved.item);candidate.removedSeedIds=candidate.removedSeedIds.filter(id=>id!==lastRemoved.item.id);state=validate(candidate);lastRemoved=null;$('#undoRemoval').hidden=true;const saved=save();render();toast(saved?'已復原上次移除。':'畫面已復原，尚未保存。');}catch(e){toast(e.message);}};
let renderedDay=day();
function refreshDate(){if(day()===renderedDay)return;const previous=renderedDay;renderedDay=day();if(scheduleDay===previous){scheduleDay=renderedDay;scheduleMonth=renderedDay.slice(0,7);}$('#today').textContent=new Date().toLocaleDateString('zh-TW',{month:'long',day:'numeric',weekday:'long'});render();}
setInterval(()=>{if(!document.hidden)refreshDate();},60000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden){syncFromStorage();refreshDate();}});
window.addEventListener('resize',()=>{if(!$('#scheduleView').hidden)renderSchedule();});
