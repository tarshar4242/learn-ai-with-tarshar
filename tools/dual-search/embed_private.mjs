// 私人版：讀雲端不公開資料夾的 corpus_private.json，向量沿用公開凍結向量＋私人向量檔（同 id 不重算），輸出 index_private.html 到同一資料夾。不進 git、不上網。
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { pipeline, env } from '@xenova/transformers';
env.allowLocalModels = false;
const PRIV = '/Users/kin145lo42/Library/CloudStorage/GoogleDrive-tarshar4242@gmail.com/我的雲端硬碟/###Tar_2025自我實踐/📚⛪0.淡大開學/📚📚📚115_1_開學資料夾/1.🎯畢業論文/研究材料_不公開/私人版檢索台/';
const MODEL = 'Xenova/bge-base-zh-v1.5', QPREFIX = '為這個句子生成表示以用於檢索相關文章：';
const corpus = JSON.parse(readFileSync(PRIV + 'corpus_private.json', 'utf8')); const docs = corpus.docs;
const reuse = new Map();
for (const f of [new URL('./sources/frozen_vecs.json', import.meta.url), PRIV + 'vecs_private.json']) {
  if (!existsSync(f)) continue; const fz = JSON.parse(readFileSync(f, 'utf8')); if (fz.model !== MODEL) continue; fz.ids.forEach((id, i) => reuse.set(id, fz.vectors[i]));
}
const todo = docs.map((d, i) => i).filter(i => !reuse.has(docs[i].id)); console.log(`文件 ${docs.length} 段，需計算 ${todo.length} 段`);
const ex = todo.length ? await pipeline('feature-extraction', MODEL, { quantized: true }) : null; let n = 0;
const vecs = [];
for (const d of docs) {
  if (reuse.has(d.id)) { vecs.push(reuse.get(d.id)); continue; }
  const r = await ex(`${d.law} ${d.no} ${d.text}`.slice(0, 1500), { pooling: 'mean', normalize: true });
  vecs.push(Array.from(r.data).map(x => Math.round(x * 10000) / 10000)); if (++n % 50 === 0) console.log(`${n}/${todo.length}`);
}
writeFileSync(PRIV + 'vecs_private.json', JSON.stringify({ model: MODEL, built: corpus.built, ids: docs.map(d => d.id), vectors: vecs }));
const q8 = v => { const sc = Math.max(...v.map(Math.abs)) / 127 || 1; const u = new Uint8Array(v.length); for (let i = 0; i < v.length; i++) u[i] = Math.round(v[i] / sc) & 255; return [Math.round(sc * 1e6) / 1e6, Buffer.from(u).toString('base64')]; };
const cards = readFileSync(new URL('./sources/cards.txt', import.meta.url), 'utf8').split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#')).map(l => { const i = l.indexOf('|'); return { id: l.slice(0, i).trim(), text: l.slice(i + 1).trim() }; });
const label = `私人版：法規 ${new Set(docs.filter(d => d.type === '法條').map(d => d.pcode)).size} 部＋指引＋問答＋函釋＋講義 ${docs.filter(d => d.type === '講義').length} 段，共 ${docs.length} 段`;
let html = readFileSync(new URL('./template.html', import.meta.url), 'utf8');
html = html.replace('{{DOCS}}', JSON.stringify(docs)).replace('{{VECS}}', JSON.stringify(vecs.map(q8))).replace('{{CARDS}}', JSON.stringify(cards))
  .replace('{{MODEL}}', JSON.stringify(MODEL)).replace('{{QPREFIX}}', JSON.stringify(QPREFIX)).replace('{{CORPUS_LABEL}}', label).replace('{{BUILT}}', corpus.built)
  .replace('<title>雙路徑檢索台</title>', '<title>雙路徑檢索台（私人版，不公開）</title>');
writeFileSync(PRIV + 'index_private.html', html); console.log(`完成 → ${PRIV}index_private.html（${Math.round(html.length / 1024)} KB）`);
