# 雙路徑檢索台｜研究工具說明

網址：https://tarshar4242.github.io/learn-ai-with-tarshar/thesis-library/tools/dual-search/

同一個輸入框、同一批文件、同一種結果呈現，切換「字面比對」（逐字找）與「語意比對」（向量最近鄰）。操作日誌只存在使用者裝置的瀏覽器，研究者在「日誌與筆記」匯出 CSV。

## 目前版本（2026-09-16 定版，文件集 v2 已凍結）

| 項目 | 內容 |
| :-- | :-- |
| 文件集 v2 | 法規 10 部 398 條（中高齡專法家族 7 部＋勞動基準法、就業保險法、就業服務法）＋勞動力發展署指引手冊 2 冊 159 段（已剔除地址表、網址堆、目錄頁 26 段）。凍結檔 `sources/frozen_corpus.json` |
| 語意模型 | `Xenova/bge-base-zh-v1.5`（量化 98MB，第一次使用下載一次；查詢端加指令前綴；文件向量部署時預算） |
| 字面比對 | 純子字串比對（等同 Ctrl+F），結果依命中次數排序 |
| 語意比對 | 餘弦相似度前 8 名，顯示相對名次條；不做關鍵字融合、不做重排、不做 LLM 生成（2026-09-16 Tarshar 決定方案 A：保持純向量，把失手當研究現象） |

## 品質評測（`eval.mjs`，12 句民眾白話問句，答案是否在前 5 名）

| 模型 | 命中率 hit@5 | 說明 |
| :-- | :-- | :-- |
| multilingual-e5-small（9/15 舊版） | 0.67 | 章節開頭、地址表常排前面 |
| **bge-base-zh-v1.5（現用）** | **0.92** | 10 題第一名合理 |
| bge-small-zh-v1.5 | 0.75 | 23MB，較弱 |
| bge-m3（543MB，瀏覽器跑不動） | 0.67 | 上限參考，沒比較好 |

**已知失手**：「公司叫我不用再去上班了」「被公司叫回家不用來了」這類口語，正確條文（資遣、預告、失業給付）排在第 4 到第 7，前三名不對；所有模型皆如此。**這是研究設計刻意保留的現象**：訪談任務 3 用這類句子，觀察受訪者怎麼判斷結果、怎麼改寫查詢（對應 RQ1、RQ2）。

重跑評測：`cd tools/dual-search && npm ci && node eval.mjs Xenova/bge-base-zh-v1.5`

## 訪談期間：不要動文件集
`sources/frozen_corpus.json` 存在時，部署不會重抓法規，文件集固定。正式訪談全部做完前不要刪它、不要改 `laws.txt`。

## 之後要新增法規或 PDF（研究結束後，或前導階段）
1. 刪掉 `sources/frozen_corpus.json`。
2. 在 GitHub 網頁編輯 `sources/laws.txt` 加一行 pcode（全國法規資料庫網址 `pcode=` 後面那串），或把 PDF 上傳到 `sources/pdf/`。
3. Commit 到 main，等 5 到 8 分鐘自動重抓、重算、部署。純圖片掃描的 PDF 抓不到字。
4. 想再凍結：本機 `python3 pipeline.py && cp build/corpus.json sources/frozen_corpus.json`，commit。

## 檔案
`pipeline.py`（抓法規、切 PDF、凍結判斷）→ `build/corpus.json` → `embed_build.mjs`（Node 算向量、灌 `template.html`）→ `../../public/thesis-library/tools/dual-search/index.html`。`eval.mjs` 是評測。部署流程在 `.github/workflows/deploy.yml`。

## 資料與隱私
法規依著作權法第 9 條不受保護；政府出版品僅供研究使用。網頁不連後端；查詢文字只在瀏覽器內計算；語意模型從 jsDelivr／Hugging Face 下載到瀏覽器快取。
