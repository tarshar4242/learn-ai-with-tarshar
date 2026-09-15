// 雙路徑檢索台｜第二步：算向量、打包網頁
// 讀 build/corpus.json → 用 @xenova/transformers（multilingual-e5-small）替每段算向量 → 灌進 template.html
// → 輸出 ../../public/thesis-library/tools/dual-search/index.html
// 用法：cd tools/dual-search && npm ci && node embed_build.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { pipeline, env } from '@xenova/transformers';

env.allowLocalModels = false;
const MODEL = 'Xenova/multilingual-e5-small';
const corpus = JSON.parse(readFileSync(new URL('./build/corpus.json', import.meta.url), 'utf8'));
const docs = corpus.docs;
console.log(`文件 ${docs.length} 段，開始算向量…`);
const ex = await pipeline('feature-extraction', MODEL, { quantized: true });
const vecs = [];
for (let i = 0; i < docs.length; i++) {
  const d = docs[i];
  const r = await ex(`passage: ${d.law} ${d.no} ${d.text}`.slice(0, 1500), { pooling: 'mean', normalize: true });
  vecs.push(Array.from(r.data).map(x => Math.round(x * 10000) / 10000));
  if ((i + 1) % 50 === 0) console.log(`${i + 1}/${docs.length}`);
}
const laws = [...new Set(docs.filter(d => d.type === '法條').map(d => d.law))];
const guides = [...new Set(docs.filter(d => d.type === '指引').map(d => d.law))];
const label = `法規 ${laws.length} 部 ${docs.filter(d => d.type === '法條').length} 條＋指引 ${guides.length} 冊 ${docs.filter(d => d.type === '指引').length} 段`;
let html = readFileSync(new URL('./template.html', import.meta.url), 'utf8');
html = html.replace('{{DOCS}}', JSON.stringify(docs)).replace('{{VECS}}', JSON.stringify(vecs))
  .replace('{{MODEL}}', JSON.stringify(MODEL)).replace('{{CORPUS_LABEL}}', label).replace('{{BUILT}}', corpus.built);
const out = new URL('../../public/thesis-library/tools/dual-search/index.html', import.meta.url);
mkdirSync(new URL('../../public/thesis-library/tools/dual-search/', import.meta.url), { recursive: true });
writeFileSync(out, html);
writeFileSync(new URL('./build/report.txt', import.meta.url), corpus.report.join('\n') + `\n${label}\n`);
console.log(`完成 → ${out.pathname}（${Math.round(html.length / 1024)} KB）`);
