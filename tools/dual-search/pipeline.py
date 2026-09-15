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
    d = re.search(r'<th>(?:修正|公發布|公布|發布)日期：</th>\s*<td>(.*?)</td>', h, re.S); date = strip(d.group(1)) if d else ""
    # 依序掃：章名（div.h3）與條文（col-no ＋ col-data > law-article > line-XXXX 逐行）
    out, chapter = [], ""
    tokens = re.finditer(r'<div class="h3[^"]*"[^>]*>(.*?)</div>|<div class="col-no">\s*<a[^>]*>(.*?)</a>\s*</div>\s*<div class="col-data">\s*<div class="law-article">(.*?)</div>\s*</div>', h, re.S)
    for t in tokens:
        if t.group(1) is not None:
            chapter = re.sub(r"\s+", " ", strip(t.group(1))); continue
        no = strip(t.group(2))
        lines = [strip(x) for x in re.findall(r'<div class="line-\d+">(.*?)</div>', t.group(3), re.S)]
        text = "\n".join(l for l in lines if l)
        if not text: text = strip(t.group(3))
        out.append({"id": f"{pcode}-{no.replace(' ', '')}", "law": name, "pcode": pcode, "chapter": chapter, "no": no,
                    "text": text, "url": url, "type": "法條", "date": date})
    if not out: raise ValueError(f"{pcode} 解析不到任何條文，頁面結構可能改了")
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
            safe = re.sub(r"[^A-Za-z0-9_]+", "_", key)
            docs.append({"id": f"{safe}-p{i}-{j}", "law": name, "pcode": key, "chapter": "", "no": f"第 {i} 頁",
                         "text": c, "url": "", "type": "指引", "date": ""})
    return name, docs

# 凍結：sources/frozen_corpus.json 存在時，直接沿用它（正式訪談期間文件集不可變動）；要更新就刪掉這個檔再推
FROZEN = os.path.join(SRC, "frozen_corpus.json")
if os.path.exists(FROZEN):
    import shutil; shutil.copy(FROZEN, os.path.join(BUILD, "corpus.json"))
    fz = json.load(open(FROZEN, encoding="utf-8"))
    print(f"文件集已凍結（{fz.get('built')}，{len(fz['docs'])} 段），沿用 sources/frozen_corpus.json，未重抓。要更新請刪除該檔。")
    sys.exit(0)


def fetch_45plus_faq():
    """勞動力發展署 45+ 中高齡專區「常見問題」（政府公開問答，承辦端寫給民眾的白話說明）"""
    url = "https://45plus.wda.gov.tw/News_Toggle.aspx?n=55212&sms=10596"
    h = get(url); out = []
    for i, m in enumerate(re.finditer(r'<div class="caption"><span>(.*?)</span></div>.*?<div class="qa_ans"[^>]*>(.*?)</div>\s*</span>', h, re.S), 1):
        q = strip(m.group(1)).lstrip("Q：:").strip(); a = strip(m.group(2)).lstrip("A：:").strip()
        if len(a) < 30: continue
        out.append({"id": f"FAQ45-{i}", "law": "45+ 中高齡專區常見問題", "pcode": "FAQ45", "chapter": "", "no": f"問 {i}",
                    "text": f"問：{q}\n答：{a}", "url": url, "type": "問答", "date": ""})
    return out

def fetch_mol_fint(keywords):
    """勞動部勞動法令查詢系統的行政函釋（承辦端對個案怎麼適用法規的判斷，寫成公文）"""
    import urllib.parse
    out, seen = [], set()
    for kw in keywords:
        url = "https://laws.mol.gov.tw/FINT/results.aspx?etype=%2a%2c%20002%2c%20007&now=1&lnabndn=1&keyword=" + urllib.parse.quote(kw) + "&title=out&type=etype%2c"
        h = get(url)
        for blk in h.split('<div class="col-serial">')[1:]:
            t = re.search(r'href="([^"]+)"[^>]*>(.*?)</a>', blk, re.S)
            d = re.search(r'發文日期：</div>\s*<div class="col-td">(.*?)</div>', blk, re.S)
            y = re.search(r'要\s*旨：</div>\s*<div class="col-td">\s*<pre>(.*?)</pre>', blk, re.S)
            if not (t and y): continue
            no = strip(t.group(2)); gist = strip(y.group(1)); date = strip(d.group(1)) if d else ""
            if no in seen or "公告" in no or gist.startswith("勞動部公告") or "委辦" in gist: continue  # 委辦公告不是判斷，略過
            seen.add(no)
            detail = "https://laws.mol.gov.tw" + html.unescape(t.group(1))
            body = ""
            try:
                dh = get(detail)
                bm = re.search(r'<pre[^>]*>(.*?)</pre>', dh, re.S)
                body = strip(bm.group(1)) if bm else ""
            except Exception: pass
            text = f"要旨：{gist}" + (f"\n全文：{body}" if body and body != gist else "")
            out.append({"id": f"FINT-{len(out)+1}", "law": "勞動部行政函釋", "pcode": "FINT", "chapter": kw, "no": no,
                        "text": text[:1800], "url": detail, "type": "函釋", "date": date})
    return out

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
if not os.path.isdir(pdfdir) or not any(f.lower().endswith(".pdf") for f in os.listdir(pdfdir)):
    print("⚠️ sources/pdf/ 不存在或沒有 PDF，指引層會整個消失；中止。", file=sys.stderr); sys.exit(1)
for fn in sorted(os.listdir(pdfdir)):
    if not fn.lower().endswith(".pdf"): continue
    try:
        name, segs = split_pdf(os.path.join(pdfdir, fn)); docs += segs
        report.append(f"PDF {fn}：{len(segs)} 段" + ("（⚠️ 無文字層，可能是純圖片）" if not segs else ""))
    except Exception as e:
        report.append(f"⚠️ PDF {fn} 失敗：{e}"); print(report[-1], file=sys.stderr)

try:
    faq = fetch_45plus_faq(); docs += faq; report.append(f"問答 45+ 常見問題：{len(faq)} 題")
except Exception as e:
    report.append(f"⚠️ 45+ 常見問題失敗：{e}"); print(report[-1], file=sys.stderr)
try:
    fint = fetch_mol_fint(["中高齡者及高齡者就業促進法", "中高齡", "高齡者", "職務再設計", "銀髮", "年齡歧視", "退休再就業", "繼續僱用"]); docs += fint; report.append(f"函釋 勞動部行政函釋：{len(fint)} 則")
except Exception as e:
    report.append(f"⚠️ 函釋失敗：{e}"); print(report[-1], file=sys.stderr)
# 太短的段（目錄、標題頁）不進文件集
before = len(docs); docs = [d for d in docs if len(d["text"]) >= 60 or d["type"] == "法條"]; report.append(f"剔除過短段落 {before-len(docs)} 段")

json.dump({"built": str(datetime.date.today()), "report": report, "docs": docs},
          open(os.path.join(BUILD, "corpus.json"), "w", encoding="utf-8"), ensure_ascii=False)
print("\n".join(report)); print(f"合計 {len(docs)} 段 → build/corpus.json")
