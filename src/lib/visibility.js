/* build time 用：算出一份清單（系列/文章/工具…）裡，哪些身分至少看得到一項。
   'public' 代表沒有解鎖任何身分的一般訪客。用來判斷「這個區塊/連結對某身分來說
   會不會整個是空的」，是空的就不要讓對方點進去、也不要讓對方看到入口。 */
export function visibleAudiences(items) {
  const ids = new Set();
  (items || []).forEach((it) => {
    if (!it.aud || it.aud.length === 0) ids.add('public');
    else it.aud.forEach((a) => ids.add(a));
  });
  return [...ids];
}
