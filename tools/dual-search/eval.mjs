// 語意端品質評測：民眾白話問句 → 正確段落應該出現在前 5 名
// 用法：node eval.mjs [model...]；比較多個模型與「向量＋字面融合」的命中率
import { readFileSync, writeFileSync } from 'node:fs';
import { pipeline, env } from '@xenova/transformers';
import * as OpenCC from 'opencc-js';
const t2s = OpenCC.Converter({ from: 'tw', to: 'cn' });
const T2S = process.env.T2S === '1';
const norm = t => T2S ? t2s(t) : t;
env.allowLocalModels = false;
const corpus = JSON.parse(readFileSync(new URL('./build/corpus.json', import.meta.url), 'utf8'));
const noisy = t => (t.match(/[0-9\-（）()：:/.]/g) || []).length / t.length > 0.25 || (t.match(/http/g) || []).length >= 2;
const docs = corpus.docs.filter(d => !(d.type === '指引' && noisy(d.text)));
console.log(`文件 ${corpus.docs.length} 段，去雜訊後 ${docs.length} 段`);

// 評測題：query → 正確段落須包含的關鍵詞（任一即算對）
const EVAL = [
  { q: '公司叫我不用再去上班了', kw: ['資遣', '解僱', '非自願離職', '終止勞動契約', '預告'] },
  { q: '被公司叫回家不用來了，可以拿到什麼補助', kw: ['非自願離職', '失業給付', '職業訓練生活津貼', '求職交通補助', '資遣費'] },
  { q: '公司不能因為我年紀大就不錄取我嗎', kw: ['差別待遇', '年齡歧視', '就業歧視'] },
  { q: '我六十五歲了還想繼續做，公司可以用什麼方式僱用我', kw: ['定期契約', '繼續僱用'] },
  { q: '雇主請年紀大的人有沒有獎金可以領', kw: ['僱用獎助', '獎勵'] },
  { q: '我退休了想再找工作，政府有幫忙嗎', kw: ['退休', '再就業'] },
  { q: '工作的設備對老人家不方便，可以申請改善嗎', kw: ['職務再設計'] },
  { q: '失業超過三個月的中高齡去哪裡登記找工作', kw: ['求職登記', '公立就業服務機構', '失業'] },
  { q: '老員工想把經驗教給年輕人，有沒有什麼方案', kw: ['世代', '傳承', '合作'] },
  { q: '我想去上課學新技能，有沒有補貼', kw: ['職業訓練', '訓練費用', '津貼'] },
  { q: '銀髮人才服務據點是做什麼的', kw: ['銀髮人才服務據點'] },
  { q: '被年齡歧視要去哪裡申訴', kw: ['申訴', '差別待遇', '歧視'] },
];
const relevant = e => new Set(docs.filter(d => e.kw.some(k => d.text.includes(k))).map(d => d.id));

// 字面訊號：字元 bigram BM25
function bigrams(s) { const t = s.replace(/[\s，。、；：！？（）()「」『』]/g, ''); const g = []; for (let i = 0; i < t.length - 1; i++) g.push(t.slice(i, i + 2)); return g; }
const DF = new Map(); const DL = docs.map(d => { const g = bigrams(d.text); new Set(g).forEach(x => DF.set(x, (DF.get(x) || 0) + 1)); return g; });
const avgdl = DL.reduce((s, g) => s + g.length, 0) / DL.length;
function bm25(q) { const qg = bigrams(q); const k1 = 1.2, b = 0.75; return docs.map((d, i) => { const g = DL[i]; const tf = new Map(); g.forEach(x => tf.set(x, (tf.get(x) || 0) + 1)); let s = 0; for (const x of new Set(qg)) { const df = DF.get(x); if (!df) continue; const idf = Math.log(1 + (docs.length - df + 0.5) / (df + 0.5)); const f = tf.get(x) || 0; s += idf * (f * (k1 + 1)) / (f + k1 * (1 - b + b * g.length / avgdl)); } return s; }); }

async function run(model, prefix) {
  const ex = await pipeline('feature-extraction', model, { quantized: true });
  const emb = async t => Array.from((await ex(norm(t), { pooling: 'mean', normalize: true })).data);
  const V = []; for (const d of docs) V.push(await emb(`${prefix.p}${d.law} ${d.no} ${d.text}`.slice(0, 1500)));
  const res = { model, vec: { hit5: 0, mrr: 0 }, hyb: { hit5: 0, mrr: 0 }, detail: [] };
  for (const e of EVAL) {
    const rel = relevant(e); const qv = await emb(prefix.q + e.q);
    const vs = V.map(w => w.reduce((s, x, k) => s + x * qv[k], 0));
    const bs = bm25(e.q); const bmax = Math.max(...bs) || 1;
    const vmin = Math.min(...vs), vmax = Math.max(...vs);
    const hs = vs.map((v, i) => 0.7 * (v - vmin) / (vmax - vmin + 1e-9) + 0.3 * bs[i] / bmax);
    const rank = arr => arr.map((s, i) => [s, i]).sort((a, b) => b[0] - a[0]).map(x => docs[x[1]].id);
    for (const [key, r] of [['vec', rank(vs)], ['hyb', rank(hs)]]) {
      const pos = r.findIndex(id => rel.has(id));
      if (pos >= 0 && pos < 3) res[key].hit3 = (res[key].hit3 || 0) + 1;
      if (pos >= 0 && pos < 5) res[key].hit5++;
      if (pos >= 0) res[key].mrr += 1 / (pos + 1);
      if (key === 'vec') res.detail.push({ q: e.q, rel: rel.size, vecTop: r.slice(0, 3), vecPos: pos, hybPos: rank(hs).findIndex(id => rel.has(id)) });
    }
  }
  for (const k of ['vec', 'hyb']) { res[k].hit3 = (res[k].hit3 || 0) / EVAL.length; res[k].hit5 = res[k].hit5 / EVAL.length; res[k].mrr = res[k].mrr / EVAL.length; }
  return res;
}
const MODELS = process.argv.slice(2).length ? process.argv.slice(2) : ['Xenova/multilingual-e5-small', 'Xenova/multilingual-e5-base', 'Xenova/paraphrase-multilingual-MiniLM-L12-v2', 'Xenova/text2vec-base-chinese', 'Xenova/bge-m3'];
const out = [];
for (const m of MODELS) {
  const prefix = m.includes('e5') ? { q: 'query: ', p: 'passage: ' } : m.includes('bge') && m.includes('zh') ? { q: '為這個句子生成表示以用於檢索相關文章：', p: '' } : { q: '', p: '' };
  try { const r = await run(m, prefix); out.push(r); console.log(m, 'vec hit@3', r.vec.hit3.toFixed(2), 'hit@5', r.vec.hit5.toFixed(2), 'mrr', r.vec.mrr.toFixed(2), '| hybrid hit@3', r.hyb.hit3.toFixed(2), 'hit@5', r.hyb.hit5.toFixed(2), 'mrr', r.hyb.mrr.toFixed(2)); writeFileSync(new URL(`./build/eval_${m.replace(/[^A-Za-z0-9]+/g,'_')}_${new Date().toISOString().slice(0,10)}.json`, import.meta.url), JSON.stringify(r, null, 1)); }
  catch (e) { console.log(m, '失敗：', e.message.slice(0, 120)); }
}
writeFileSync(new URL('./build/eval.json', import.meta.url), JSON.stringify(out, null, 1));
