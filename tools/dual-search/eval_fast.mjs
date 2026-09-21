// 快速評測：沿用 sources/frozen_vecs.json 的文件向量，只算查詢向量（不重算 1700 段）
// 用法：cd tools/dual-search && node eval_fast.mjs
import { readFileSync } from 'node:fs';
import { pipeline, env } from '@xenova/transformers';
env.allowLocalModels = false;
const corpus = JSON.parse(readFileSync(new URL('./build/corpus.json', import.meta.url), 'utf8'));
const fz = JSON.parse(readFileSync(new URL('./sources/frozen_vecs.json', import.meta.url), 'utf8'));
const docs = corpus.docs; if (fz.ids.length !== docs.length) throw new Error('向量與文件集不符');
// 與 embed_build.mjs 相同的 int8 量化，評測的就是線上實際用的向量
const q8r = v => { const sc = Math.max(...v.map(Math.abs)) / 127 || 1; return v.map(x => Math.round(x / sc) * sc); };
fz.vectors = fz.vectors.map(q8r);
const QPREFIX = '為這個句子生成表示以用於檢索相關文章：';
const EVAL = [
  // 9/16 的 12 句民眾白話
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
  // 9/21 就服乙級範圍的案例式問句（術科題型）
  { q: '外籍看護工跑掉了，雇主幾天內要通報', kw: ['連續曠職三日', '失去聯繫', '通報'] },
  { q: '公司一次要資遣幾十個人，要提前多久告訴政府', kw: ['大量解僱', '六十日'] },
  { q: '懷孕被公司調到很差的職位，可以怎麼辦', kw: ['懷孕', '差別待遇', '申訴'] },
  { q: '做工受傷住院，有什麼給付', kw: ['職業災害', '傷病給付', '醫療給付'] },
  { q: '老闆沒幫我提撥退休金怎麼辦', kw: ['提繳', '退休金', '檢舉'] },
  { q: '跟公司吵薪水吵不攏，可以找誰調解', kw: ['勞資爭議', '調解'] },
  { q: '身心障礙的人找工作，公司一定要僱用一定比例嗎', kw: ['身心障礙者', '進用', '百分之'] },
  { q: '參加職訓期間有生活費可以領嗎', kw: ['職業訓練生活津貼'] },
];
const relevant = e => new Set(docs.filter(d => e.kw.some(k => d.text.includes(k))).map(d => d.id));
const ex = await pipeline('feature-extraction', fz.model, { quantized: true });
let h3 = 0, h5 = 0, mrr = 0; const rows = [];
for (const e of EVAL) {
  const r = await ex(QPREFIX + e.q, { pooling: 'mean', normalize: true }); const v = Array.from(r.data);
  const top = fz.vectors.map((w, i) => { let s = 0; for (let k = 0; k < v.length; k++) s += v[k] * w[k]; return { i, s }; }).sort((a, b) => b.s - a.s).slice(0, 8);
  const rel = relevant(e); const rank = top.findIndex(t => rel.has(docs[t.i].id)) + 1;
  if (rank && rank <= 3) h3++; if (rank && rank <= 5) h5++; if (rank) mrr += 1 / rank;
  rows.push(`${rank ? '第' + rank + '名' : '未命中'}｜${e.q}｜前3：${top.slice(0, 3).map(t => docs[t.i].law.slice(0, 8) + docs[t.i].no).join('／')}`);
}
console.log(rows.join('\n'));
console.log(`\n${EVAL.length} 句：hit@3 ${(h3 / EVAL.length).toFixed(2)}，hit@5 ${(h5 / EVAL.length).toFixed(2)}，MRR ${(mrr / EVAL.length).toFixed(2)}`);
