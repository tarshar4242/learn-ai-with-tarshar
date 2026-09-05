---
name: create-xiaod-manual
description: Create a branded Traditional Chinese A4 interactive handbook with a clickable table of contents, concise main reading path, related-handbook cards, and validated PDF links. Use when the user says「小D版手冊」「做成小D版」「用小D版手冊整理」「做成互動手冊」「新增延伸閱讀手冊」or asks to turn notes, Q&A, course material, research, procedures, or project knowledge into a consistent phone-readable PDF/HTML handbook network.
---

# 小D版手冊

把來源內容整理成聚焦、溫暖、可點擊的品牌手冊。主冊只保留本次必懂內容；超出範圍但值得深入的內容，改用關聯卡連到另一冊專題手冊。

## 載入規則

開始前：

1. 讀取 `references/brand-system.md`。
2. 讀取 `references/content-architecture.md`。
3. 需要延伸卡、跨冊連結或知識庫關聯時，讀取 `references/relation-model.md`。
4. 交付前讀取 `references/qa-checklist.md`。
5. 不要載入與本次手冊無關的長篇資料。

## 品牌固定規則（不可省略）

**每一頁的頁尾都必須出現 Tarshar 的品牌標記**：

```html
<div class="footer">
  <span>小D版手冊</span>
  <span class="brand-mark">🍀 Learn AI with Tarshar | 2026</span>
  <span>頁碼或章節名</span>
</div>
```

模板 `assets/manual-template.html` 已內建這段與對應的 `.brand-mark` 樣式，照著模板做就會有。
但每次交付前仍要**實際檢查產出的 HTML 與 PDF 每一頁都有這行**，不要只相信模板。
這是 Tarshar 對外交付物的識別，漏掉等於交了一份沒有署名的東西。

年份隨當年更新（例如 2027 年產出的手冊寫 `| 2027`）。

## 工作流程

### 1. 定義本冊邊界

從來源資料提煉：

- 讀者。
- 本冊要解決的核心問題。
- 讀完後應能做到的事。
- 必須放進主冊的內容。
- 可短提但不展開的內容。
- 應分支成另一冊的內容。

若資訊足以安全推進，直接提出合理範圍並繼續。只有範圍會造成完全不同成品時才問一個最短問題。

### 2. 建立內容地圖

先產生：

- 暫定書名與副標。
- 3–10 個主章節。
- 每章的核心問題或任務。
- 關聯手冊候選。
- 預估頁數。

若使用者要求「先核對」，停在內容地圖與元件清單；否則繼續製作。

### 3. 壓縮主閱讀路徑

依 `references/content-architecture.md`：

- 使用繁體中文（台灣）。
- 結論先行。
- 一個問答或任務只解決一件事。
- 以句中粗體、短條列與步驟控制層級。
- 不把完整資料庫、長篇背景或所有例外塞進正文。
- 讓正文在不點延伸卡時仍可獨立理解。

### 4. 建立關聯手冊

依 `references/relation-model.md` 建立 relation manifest。

- 每個問答原則上 0–1 張關聯卡。
- 一般內容頁原則上最多 2 張。
- 只有 `published` 且有可開啟 HTTPS 網址的關聯可以顯示為正式卡片。
- 尚未完成的分支只記入 manifest，不輸出死連結。
- 延伸冊需保存來源手冊、來源章節與返回路徑。
- 卡片整張可點，箭頭只是視覺提示。

### 5. 套用品牌視覺

依 `references/brand-system.md`：

- 固定奶油日光、象牙白、鼠尾草綠與深暖墨色。
- 固定 A4 直式「上方情境插圖＋下方標題區＋波浪轉場」封面骨架。
- 人物小於主視覺四分之一；AI 夥伴更小。
- 正式 Logo 預設以小尺寸放在封面與內頁的底部中央，不放在版面視覺中心；只有特殊構圖需求才能調整位置。
- 《AI協作日誌》系列封面使用已核准的「芫荽 Iansui」字型，輸出 PDF 時必須嵌入；正文仍使用高可讀性的繁體中文字型。
- 每本只變化主題象徵物、少量道具、圖示與低飽和輔色。
- 不直接複製參考圖、人物、商標或來源品牌。
- 不讓圖片模型生成正式標題文字；文字由 HTML 排版疊加。

需要新封面插圖時，使用可用的圖像生成工具產生「無文字主視覺」，再放入 HTML。若無圖像工具，先使用純色、波浪與主題圖示完成可交付封面，不用不明來源圖片代替。

### 6. 製作 HTML

複製 `assets/manual-template.html` 到本次輸出資料夾並替換示例內容。

必須保留：

- A4 `@page`。
- 封面、可點目錄、章節標頭、短底線、細分隔線。
- 人物補充卡與延伸閱讀卡的不同視覺。
- 內部章節 anchor。
- 外部關聯卡完整 `<a>` 熱區。
- 適合列印的背景色與避免元件跨頁規則。

刪除未使用的示例區塊，不把 placeholder 留在成品。

### 7. 產生 PDF

使用：

```bash
node scripts/render_manual.cjs <input.html> <output.pdf>
```

若 Node 無法解析 Playwright，先載入工作區提供的 Node 依賴路徑，再執行。不要下載不必要的新套件。

正式 PDF 儲存於：

```text
output/pdf/小D版手冊/<manual-id>/<manual-id>-v<version>.pdf
```

可維護原稿與關聯資料儲存於：

```text
output/manuals/小D版手冊/<manual-id>/
├── index.html
├── relation-manifest.json
├── cover-visual.png
└── link-report.txt
```

沒有使用封面圖片時可省略 `cover-visual.png`。

### 8. 驗證

依序執行：

```bash
python3 scripts/check_relations.py relation-manifest.json
python3 scripts/inspect_pdf_links.py output.pdf
pdftoppm -png output.pdf tmp/pdfs/<manual-id>/page
```

逐頁檢查渲染圖：

- 無裁切、重疊、黑方塊或亂碼。
- 封面人物與 AI 夥伴沒有搶過主題。
- Logo 位於底部中央且不搶主標，並確認未與日期、頁碼或正文重疊。
- 《AI協作日誌》封面使用芫荽 Iansui 且字型已嵌入。
- 目錄、章節與卡片層級一致。
- 所有內部跳轉有目標。
- 所有正式關聯卡有正確網址。
- 畫面文字、顯示網址與實際目標一致。
- 手機縮圖仍能辨認標題。

發現錯誤時修正 HTML 或 manifest，重新輸出並重新驗證。

## 隱私與專案用語

- 匿名化個資、客戶資料、帳號、金鑰與機密內容。
- 在雙引擎計畫中，只使用「雙引擎計畫」與「第一線業務團隊」。
- 不輸出或保存可反推目的對象的舊名稱、品牌名或組織特徵。
- 不把來源 PDF 的原品牌、人物或文章內容直接複製成新品牌資產。

## 交付

先給結果，再簡短回報：

```text
手冊：<名稱與版本>
主冊範圍：<一句話>
關聯手冊：<已發布數／待建數>
已驗證：版面／目錄／PDF 連結／手機縮圖／Word標題層級與表格（若有交 Word）
檔案：<Word（.docx，若她要能改的版本則為主交付）、PDF、HTML、manifest>
```

若只完成本機版本，明確標示「尚未同步共同大腦或雲端」，不要稱為三方完成交班。
