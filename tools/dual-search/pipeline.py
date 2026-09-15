#!/usr/bin/env python3
"""雙路徑檢索台｜文件集建置（第一步：抓法規、切 PDF）
讀 sources/laws.txt 的 pcode 逐部抓全國法規資料庫，逐條存；讀 sources/pdf/*.pdf 逐頁切段。
產出 build/corpus.json（給第二步 embed_build.mjs 算向量、打包網頁）。
需要：Python 3 ＋ pymupdf（pip install pymupdf）
"""
import re, json, html, os, sys, datetime, urllib.request
import fitz

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "sources"); BUILD = os.path.join(HERE, "build"); os.makedirs(BUILD, exist_ok=True)
UA = {"User-Agent": "Mozilla/5.0"}

def get(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60).read().decode("utf-8", "ignore")

def strip(s):
    s = re.sub(r"<[^>]+>", "\n", html.unescape(s)); s = re.sub(r"[ \t　]+", " ", s); return re.sub(r"\n\s*\n+", "\n", s).strip()

def fetch_law(pcode):
    url = f"https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode={pcode}"
    h = get(url)
    m = re.search(r'id="hlLawName"[^>]*>(.*?)<', h)
    if not m: raise ValueError(f"{pcode} 找不到法規名稱，pcode 可能打錯")
    name = m.group(1).strip()
    d = re.search(r"(?:修正|公發布)日期[^民]*?(民國[^<]+)", h); date = d.group(1).strip() if d else ""
    out, chapter = [], ""
    for kind, a, body in re.findall(r'<div class="(col-th|col-no)">(.*?)</div>\s*(?:<div class="col-data">(.*?)</div>)?', h, re.S):
        if kind == "col-th": chapter = strip(a); continue
        no = strip(a)
        out.append({"id": f"{pcode}-{no.replace(' ', '')}", "law": name, "pcode": pcode, "chapter": chapter, "no": no,
                    "text": strip(body or ""), "url": url, "type": "法條", "date": date})
    return name, out

def split_pdf(path):
    key = os.path.splitext(os.path.basename(path))[0]
    name = re.sub(r"^[A-Za-z0-9]+_", "", key).replace("_", " ")
    pdf = fitz.open(path); docs = []
    for i, page in enumerate(pdf, 1):
        t = page.get_text().replace("　", " "); t = re.sub(r"[ \t]+", " ", t); t = re.sub(r"\n{3,}", "\n\n", t).strip()
        if len(t) < 40: continue
        chunks, buf = [], ""
        for para in re.split(r"\n\s*\n", t):
            buf = (buf + "\n" + para).strip()
            if len(buf) >= 120: chunks.append(buf); buf = ""
        if buf:
            if chunks: chunks[-1] += "\n" + buf
            else: chunks.append(buf)
        for j, c in enumerate(chunks, 1):
            digits = len(re.findall(r"[0-9\-（）()：:/.]", c)); urls = c.count("http")
            if digits / max(len(c), 1) > 0.25 or urls >= 2 or "......" in c: continue  # 地址表、網址堆、目錄頁不進文件集
            docs.append({"id": f"{key}-p{i}-{j}", "law": name, "pcode": key, "chapter": "", "no": f"第 {i} 頁",
                         "text": c, "url": "", "type": "指引", "date": ""})
    return name, docs

docs, report = [], []
for line in open(os.path.join(SRC, "laws.txt"), encoding="utf-8"):
    line = line.strip()
    if not line or line.startswith("#"): continue
    pcode = line.split()[0]
    try:
        name, arts = fetch_law(pcode); docs += arts; report.append(f"法規 {pcode} {name}：{len(arts)} 條")
    except Exception as e:
        report.append(f"⚠️ 法規 {pcode} 失敗：{e}"); print(report[-1], file=sys.stderr)
pdfdir = os.path.join(SRC, "pdf")
for fn in sorted(os.listdir(pdfdir)) if os.path.isdir(pdfdir) else []:
    if not fn.lower().endswith(".pdf"): continue
    try:
        name, segs = split_pdf(os.path.join(pdfdir, fn)); docs += segs
        report.append(f"PDF {fn}：{len(segs)} 段" + ("（⚠️ 無文字層，可能是純圖片）" if not segs else ""))
    except Exception as e:
        report.append(f"⚠️ PDF {fn} 失敗：{e}"); print(report[-1], file=sys.stderr)

json.dump({"built": str(datetime.date.today()), "report": report, "docs": docs},
          open(os.path.join(BUILD, "corpus.json"), "w", encoding="utf-8"), ensure_ascii=False)
print("\n".join(report)); print(f"合計 {len(docs)} 段 → build/corpus.json")
