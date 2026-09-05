---
name: causal-chain-assumption-audit
description: Causal-chain and implicit-assumption audit for an article or academic paper's argumentation — surfaces where the author's own reasoning jumps (a missing or unstated Warrant between Grounds and Claim) and lists the implicit premises that need spelling out. Use when asked to analyze a text for logical/causal-chain jumps, hidden or implicit assumptions, or a "因果鏈"/"假設清單" audit. Not for reader-comprehension or terminology alignment (use general-reader-simulator), not for citation/source verification (use verify-citation-fidelity).
---

# 因果鏈與假設清單分析（Causal-Chain & Assumption Audit）

分析寫作者自己的論述，找出因果鏈跳躍（Grounds 到 Claim 之間缺漏或未言明的 Warrant）與需要說清楚的隱含假設。只做鏡子，不做真理仲裁——不判斷立場對錯，只呈現作者自己的推論結構有沒有跳躍。

先讀 `references/extraction-criteria.md`（段落層／骨幹層萃取準則）、`references/negation-test-and-classification.md`（否定測試與假設分類定義）與 `references/report-schema.md`（最終報告的章節與欄位契約），再開始分析。

## 管線

1. **取得可分析文字**
   - 已是 `.txt`：直接使用。
   - `.pdf`：`python scripts/pdf_to_txt.py <path>`；`.docx`：`python scripts/word_to_txt.py <path>`（兩者皆在 repo 根目錄，會在同目錄產生 `.txt`）。
   - 網址：用 WebFetch 抓取並萃取正文，存成同目錄 `.txt`。抓不到正文（登入牆、動態渲染頁面）就停下告知使用者改用檔案輸入，不做進階抓取。

2. **段落層萃取**：逐段列出該段的所有重要主張，不限數量，求涵蓋、不做深度分析。

3. **骨幹層選定**：從段落層主張中，選出承載全文理論骨幹、後續推論會依賴的主張。**Checkpoint**：把選定結果列給使用者看，讓使用者增刪，等待確認後才繼續下一步；其餘步驟不中途打斷。

4. **因果鏈分析**（只對確認後的骨幹層主張做）：對每個骨幹主張標出 Claim／Grounds，補出候選 Warrant，標記是否跳躍，並做範疇對齊檢查。細節見 `references/extraction-criteria.md`。

5. **假設清單分析**（只對候選 Warrant 本身有疑義、需要專業判斷的項目做）：用否定測試判斷必要性，套用 5 類分類，往後追蹤受影響的段落。細節與分類定義見 `references/negation-test-and-classification.md`。

6. **產出報告**：整理成單一報告檔案，存在輸入文件同目錄，檔名 `因果鏈與假設清單分析報告-<文件名>.md`。章節與欄位結構見 `references/report-schema.md`。

## 停止條件

報告檔案已寫出，包含分析文檔基本資訊、段落層重要主張、骨幹層的選定結果（使用者確認後的版本）、因果鏈清單、假設清單（否定測試後）五個部分，且假設清單每一列都完整填了假設內容／支撐哪一段推論／移除後受影響的段落／分類／是否需要在前段明說。不延伸做讀者理解度分析或事實查核。
