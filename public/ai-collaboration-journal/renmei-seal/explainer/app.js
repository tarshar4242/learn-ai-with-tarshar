const DATA = {"provider": "macOS say", "voice": "Meijia / zh_TW", "rate": 208, "atempo": 0.9, "duration": 79.591882, "scenes": [{"id": "compare", "title": "四個字進框，還差什麼？", "voice": "四個字排進框，為什麼還不像印章？先拉動中間的圓鈕，看同一份印文，留白和滿版差在哪裡。", "subtitle": "同一份印文，拖曳看差別", "source_duration": 8.286259, "audio": "assets/audio/00-compare.m4a", "start": 0, "duration": 9.645986, "end": 9.646}, {"id": "fit", "title": "讓每個字，都找到自己的位置", "voice": "關鍵是每個字。先去掉字外的空白，再各自調整寬高，靠近四邊；字裡的空間仍然留著，才不會全部擠成一團。", "subtitle": "逐字調整寬高，保留字內留白", "source_duration": 9.923946, "audio": "assets/audio/01-fit.m4a", "start": 9.646, "duration": 11.465986, "end": 21.112}, {"id": "fonts", "title": "先選字的樣子", "voice": "接著挑書體。小篆、甲骨文、草書，一次看見實際印樣。缺字可以創作補上，但要寫清楚，哪些是當代組字。", "subtitle": "七種書體並列，補字標示來源", "source_duration": 9.995283, "audio": "assets/audio/02-fonts.m4a", "start": 21.112, "duration": 11.541995, "end": 32.654}, {"id": "styles", "title": "再選整方印的氣質", "voice": "同一種字，也能有不同印風。方整、清雅、蒼厚，八款可以一起比較。這是章法取意，不是複製大師的刀法。", "subtitle": "書體 × 印風，是兩層選擇", "source_duration": 9.528889, "audio": "assets/audio/03-styles.m4a", "start": 32.654, "duration": 11.024989, "end": 43.679}, {"id": "mobile", "title": "手機上，也要看得清楚", "voice": "小圖看不清，就點開放大。先比較，再套用，不用每一款來回切換。圖片也只是選填，只有文字照樣可以製作。", "subtitle": "點圖放大；圖片選填", "source_duration": 10.121723, "audio": "assets/audio/04-mobile.m4a", "start": 43.679, "duration": 11.681995, "end": 55.361}, {"id": "export", "title": "把選好的小印帶走", "voice": "選好後，下載原尺寸的 P D F，或含握柄、已鏡像的 S T L 模型。數位檢查過關，實際效果還要切片、試印和蓋印。", "subtitle": "PDF 原尺寸；STL 含柄鏡像模型", "source_duration": 11.503356, "audio": "assets/audio/05-export.m4a", "start": 55.361, "duration": 13.216009, "end": 68.577}, {"id": "close", "title": "把你的眼光，變成工具的選項", "voice": "這方小印，是從一次次看見差別長出來的。你決定喜歡的樣子，AI 把要求做成選項，再把作品交回你手上。", "subtitle": "你的眼光，決定最後一方印", "source_duration": 9.475374, "audio": "assets/audio/06-close.m4a", "start": 68.577, "duration": 10.967982, "end": 79.545}], "source_sha256": "74ddaddf33c3ed9f871f799ac60e5b13a2c89480d8dd60e0e85311e3d04c8034", "disclosure": "電腦合成聲音，不是本人聲音。", "music": "無配樂"};

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const audio=$('#audio'), scenes=DATA.scenes, progress=$('#progress');
const styles=[['natural','自然書寫'],['han','漢印方整'],['yuan','元朱清雅'],['upright','古拙直伸'],['flow','圓轉舒展'],['wu','蒼厚錯落'],['qi','縱橫疏密'],['huang','縱欄疏密']];
let current=-1, zoom=100, wasPlaying=false, modalKind='image';
const fmt=t=>`${Math.floor(t/60)}:${String(Math.floor(t%60)).padStart(2,'0')}`;
progress.max=DATA.duration;
$('#styleGrid').innerHTML=styles.map(([id,title])=>`<button class="style-choice" data-style="${id}" aria-label="放大${title}實際印樣"><div class="stamp ${id}" role="img" aria-label="${title}印樣"></div><strong>${title}</strong><span>＋ 放大看</span></button>`).join('');
$('#chapters').innerHTML=scenes.map((s,i)=>`<button class="chapter ${i===0?'active':''}" data-index="${i}" aria-label="跳到第${i+1}段：${s.title}"><span>${String(i+1).padStart(2,'0')}</span>${s.title}</button>`).join('');
function showScene(i){
 if(i===current)return;current=i;const s=scenes[i];
 $$('.scene').forEach(x=>{x.hidden=x.dataset.id!==s.id;x.classList.toggle('active',!x.hidden)});
 $$('.chapter').forEach((x,n)=>{x.classList.toggle('active',n===i);x.setAttribute('aria-current',n===i?'step':'false')});
 $('#chapterNumber').textContent=`${String(i+1).padStart(2,'0')} / 07`;$('#chapterTitle').textContent=s.title;
 $('#keyline').textContent=s.subtitle;$('#caption').textContent=s.voice;
}
function update(){
 const t=audio.currentTime;let i=scenes.findIndex(s=>t>=s.start && t<s.end);if(i<0)i=t>=scenes.at(-1).start?scenes.length-1:0;
 showScene(i);progress.value=t;$('#timer').textContent=`${fmt(t)} / ${fmt(DATA.duration)}`;
}
function pause(message='已暫停，可以慢慢看') {audio.pause();$('#status').textContent=message}
async function play(){
 if(audio.ended)audio.currentTime=0;
 try{await audio.play();$('#status').textContent='合成旁白播放中 · 隨時暫停比較'}catch(e){$('#status').textContent='請再點播放，讓瀏覽器開啟聲音'}
}
function jump(i){i=Math.max(0,Math.min(scenes.length-1,i));audio.currentTime=scenes[i].start+.025;showScene(i);update();$('#status').textContent=audio.paused?'已切換段落 · 按播放接著聽':'已切換段落'}
$('#play').addEventListener('click',()=>audio.paused?play():pause());
audio.addEventListener('play',()=>{$('#play').textContent='Ⅱ 暫停解說';$('#play').setAttribute('aria-label','暫停解說')});
audio.addEventListener('pause',()=>{$('#play').textContent=audio.ended?'↻ 再看一次':'▶ 播放解說';$('#play').setAttribute('aria-label','播放解說')});
audio.addEventListener('ended',()=>{$('#play').textContent='↻ 再看一次';$('#status').textContent='看完了，喜歡哪一種由你決定'});
audio.addEventListener('timeupdate',update);audio.addEventListener('loadedmetadata',update);
audio.addEventListener('error',()=>{$('#status').textContent='音軌暫時無法載入；可先閱讀字幕與腳本'});
progress.addEventListener('input',()=>{audio.currentTime=Number(progress.value);update()});
$('#previous').addEventListener('click',()=>jump(current-1));$('#next').addEventListener('click',()=>jump(current+1));
$$('.chapter').forEach(x=>x.addEventListener('click',()=>jump(Number(x.dataset.index))));
$('#mute').addEventListener('click',()=>{audio.muted=!audio.muted;$('#mute').textContent=audio.muted?'聲音：關':'聲音：開';$('#mute').setAttribute('aria-label',audio.muted?'開啟旁白聲音':'靜音旁白')});
$('#compare').addEventListener('input',e=>{const v=e.target.value;$('#reveal').style.clipPath=`inset(0 0 0 ${v}%)`;$('#divider').style.left=v+'%';if(!audio.paused)pause('已暫停，拖曳比較後可接著播放')});
const modal=$('#lightbox'), large=$('#largeImage'), holder=$('#modalImage');
const selected=document.createElement('div');selected.id='selectedStamp';selected.hidden=true;holder.appendChild(selected);
function setZoom(n){zoom=Math.max(100,Math.min(250,n));(modalKind==='stamp'?selected:large).style.width=zoom+'%';$('#zoomLabel').textContent=zoom+'%';$('#zoomOut').disabled=zoom===100;$('#zoomIn').disabled=zoom===250}
function openModal(caption){wasPlaying=!audio.paused;audio.pause();$('#lightboxCaption').textContent=caption;setZoom(100);modal.showModal();document.body.style.overflow='hidden';$('#status').textContent='正在放大查看';holder.scrollTo(0,0)}
$$('[data-image]').forEach(x=>x.addEventListener('click',()=>{modalKind='image';large.hidden=false;selected.hidden=true;large.src=x.dataset.image;large.alt=x.dataset.caption;openModal(x.dataset.caption)}));
$$('[data-style]').forEach(x=>x.addEventListener('click',()=>{const id=x.dataset.style,title=styles.find(s=>s[0]===id)[1];modalKind='stamp';large.hidden=true;selected.hidden=false;selected.className='stamp '+id;selected.setAttribute('role','img');selected.setAttribute('aria-label',title+'實際印樣');openModal(title+'｜第 5 版實際輸出，原圖局部查看')}));
$('#closeLightbox').addEventListener('click',()=>modal.close());
modal.addEventListener('click',e=>{if(e.target===modal)modal.close()});
modal.addEventListener('close',()=>{document.body.style.overflow='';if(wasPlaying)play();else $('#status').textContent='已關閉大圖，可繼續比較或播放'});
$('#zoomIn').addEventListener('click',()=>setZoom(zoom+50));$('#zoomOut').addEventListener('click',()=>setZoom(zoom-50));
showScene(0);update();
window.explainerDiagnostics=()=>({scene:current,duration:audio.duration,currentTime:audio.currentTime,paused:audio.paused,zoom,modal:modal.open,reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches});

// Load a local blob so seeking also works on static hosts without Range support.
fetch('assets/audio/narration.m4a').then(r=>{if(!r.ok)throw Error('audio');return r.blob()}).then(b=>{audio.src=URL.createObjectURL(b);audio.load()}).catch(()=>{audio.src='assets/audio/narration.m4a';audio.load()});
