// 雙路徑檢索台｜第二步：算向量、打包網頁
// 讀 build/corpus.json → 用 @xenova/transformers（multilingual-e5-small）替每段算向量 → 灌進 template.html
// → 輸出 ../../public/thesis-library/tools/dual-search/index.html
// 用法：cd tools/dual-search && npm ci && node embed_build.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { pipeline, env } from '@xenova/transformers';

env.allowLocalModels = false;
const MODEL = 'Xenova/bge-base-zh-v1.5';
const QPREFIX = '為這個句子生成表示以用於檢索相關文章：';  // bge-zh 查詢端指令，文件端不加
const corpus = JSON.parse(readFileSync(new URL('./build/corpus.json', import.meta.url), 'utf8'));
const docs = corpus.docs;
// 向量也凍結：sources/frozen_vecs.json 存在且 id 對得上就直接用，避免每次部署在不同機器重算造成排名漂移
import { existsSync } from 'node:fs';
const FROZEN = new URL('./sources/frozen_vecs.json', import.meta.url);
let vecs = null, reuse = null;
if (existsSync(FROZEN)) {
  const fz = JSON.parse(readFileSync(FROZEN, 'utf8'));
  if (fz.model === MODEL && fz.ids.length === docs.length && fz.ids.every((id, i) => id === docs[i].id)) { vecs = fz.vectors; console.log(`向量已凍結（${fz.built}），沿用 ${vecs.length} 筆，未重算。`); }
  else if (fz.model === MODEL) { reuse = new Map(fz.ids.map((id, i) => [id, fz.vectors[i]])); console.log(`凍結向量與文件集不符，同 id 沿用、只算新增段（9/21 增量）。`); }
  else console.log('凍結向量模型不同，全部重算。');
}
if (!vecs) {
const todo = docs.map((d, i) => i).filter(i => !(reuse && reuse.has(docs[i].id)));
console.log(`文件 ${docs.length} 段，需計算 ${todo.length} 段…`);
const ex = todo.length ? await pipeline('feature-extraction', MODEL, { quantized: true }) : null;
vecs = new Array(docs.length); let n = 0;
for (let i = 0; i < docs.length; i++) {
  const d = docs[i];
  if (reuse && reuse.has(d.id)) { vecs[i] = reuse.get(d.id); continue; }
  const r = await ex(`${d.law} ${d.no} ${d.text}`.slice(0, 1500), { pooling: 'mean', normalize: true });
  vecs[i] = Array.from(r.data).map(x => Math.round(x * 10000) / 10000);
  if (++n % 50 === 0) console.log(`${n}/${todo.length}`);
}
writeFileSync(FROZEN, JSON.stringify({ model: MODEL, built: corpus.built, ids: docs.map(d => d.id), vectors: vecs }));
console.log('已寫入 sources/frozen_vecs.json（向量凍結）');
}
const laws = [...new Set(docs.filter(d => d.type === '法條').map(d => d.law))];
const guides = [...new Set(docs.filter(d => d.type === '指引').map(d => d.law))];
const label = `法規 ${new Set(docs.filter(d => d.type === '法條').map(d => d.pcode)).size} 部 ${docs.filter(d => d.type === '法條').length} 條＋指引 ${guides.length} 冊＋問答＋函釋 ${docs.filter(d => d.type === '函釋').length} 則，共 ${docs.length} 段`;
// 情境卡：sources/cards.txt 每行「編號|正面」
const cards = readFileSync(new URL('./sources/cards.txt', import.meta.url), 'utf8').split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#')).map(l => { const i = l.indexOf('|'); return { id: l.slice(0, i).trim(), text: l.slice(i + 1).trim() }; });
console.log(`情境卡 ${cards.length} 張`);
let html = readFileSync(new URL('./template.html', import.meta.url), 'utf8');
// 9/21 頁面瘦身：向量以 int8（每向量一個 scale）＋ base64 內嵌，10 MB → 約 2 MB；瀏覽器端解回 Float32。eval_fast.mjs 用同一套量化，評測數字與線上一致
const q8 = v => { const sc = Math.max(...v.map(Math.abs)) / 127 || 1; const u = new Uint8Array(v.length); for (let i = 0; i < v.length; i++) u[i] = Math.round(v[i] / sc) & 255; return [Math.round(sc * 1e6) / 1e6, Buffer.from(u).toString('base64')]; };
html = html.replace('{{DOCS}}', JSON.stringify(docs)).replace('{{VECS}}', JSON.stringify(vecs.map(q8)))
  .replace('{{CARDS}}', JSON.stringify(cards)).replace('{{MODEL}}', JSON.stringify(MODEL)).replace('{{QPREFIX}}', JSON.stringify(QPREFIX)).replace('{{CORPUS_LABEL}}', label).replace('{{BUILT}}', corpus.built);
const out = new URL('../../public/thesis-library/tools/dual-search/index.html', import.meta.url);
mkdirSync(new URL('../../public/thesis-library/tools/dual-search/', import.meta.url), { recursive: true });
writeFileSync(out, html);
writeFileSync(new URL('./build/report.txt', import.meta.url), corpus.report.join('\n') + `\n${label}\n`);
console.log(`完成 → ${out.pathname}（${Math.round(html.length / 1024)} KB）`);
