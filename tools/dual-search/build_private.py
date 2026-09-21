# -*- coding: utf-8 -*-
"""私人版檢索台：公開凍結文件集 ＋ 不公開講義（PDF），輸出到雲端「不公開」資料夾，不進 git、不上網。
用法：cd tools/dual-search && /usr/bin/python3 build_private.py && node embed_private.mjs
講義放在 PRIV/講義_請放這裡/*.pdf；輸出 PRIV/私人版檢索台/corpus_private.json、vecs_private.json、index_private.html
"""
import os, re, json, datetime, importlib.util
PRIV = "/Users/kin145lo42/Library/CloudStorage/GoogleDrive-tarshar4242@gmail.com/我的雲端硬碟/###Tar_2025自我實踐/📚⛪0.淡大開學/📚📚📚115_1_開學資料夾/1.🎯畢業論文/研究材料_不公開"
SRC = os.path.join(PRIV, "講義_請放這裡"); OUT = os.path.join(PRIV, "私人版檢索台"); os.makedirs(OUT, exist_ok=True)
HERE = os.path.dirname(os.path.abspath(__file__))
# 借用 pipeline.py 的 split_pdf（不執行它的主流程）
src = open(os.path.join(HERE, "pipeline.py"), encoding="utf-8").read()
head = src.split("# 凍結：")[0]
ns = {"__file__": os.path.join(HERE, "pipeline.py")}; exec(compile(head, "pipeline_head", "exec"), ns); split_pdf = ns["split_pdf"]
pub = json.load(open(os.path.join(HERE, "sources", "frozen_corpus.json"), encoding="utf-8"))
docs, report = list(pub["docs"]), [f"公開文件集（凍結 {pub['built']}）：{len(pub['docs'])} 段"]
for fn in sorted(os.listdir(SRC)):
    if not fn.lower().endswith(".pdf"): continue
    name, segs = split_pdf(os.path.join(SRC, fn))
    for d in segs:
        d["type"] = "講義"; d["id"] = "JY-" + d["id"]; d["law"] = re.sub(r"^J\d+ ", "", name)
    docs += segs; report.append(f"講義 {fn}：{len(segs)} 段")
before = len(docs); docs = [d for d in docs if len(d["text"]) >= 60 or d["type"] == "法條"]; report.append(f"剔除過短段落 {before-len(docs)} 段")
json.dump({"built": str(datetime.date.today()), "report": report, "docs": docs}, open(os.path.join(OUT, "corpus_private.json"), "w", encoding="utf-8"), ensure_ascii=False)
print("\n".join(report)); print(f"合計 {len(docs)} 段 → {OUT}/corpus_private.json")
