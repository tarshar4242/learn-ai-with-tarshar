# 紫區口語知識查找平台

同一文件庫，A 是嚴格字面查找，B 是完整 AI 語意檢索與來源問答。NotebookLM 是來源問答體驗參照；本專案為可追溯的自建研究工具，不宣稱效果相同。

私人手機入口：**http://100.83.58.39:8771**（需加入原有 Tailscale 網路）。綠區 8765 已暫停保留。沒有啟用 Funnel。

互動架構圖與平台入口：**http://100.83.58.39:8771/architecture**。沿用綠區互動架構形式，點選上方按鈕即可進入平台。

## 紫區知識庫與寫作正本

[第三章底稿、文獻沿用與缺口清單](https://github.com/tarshar4242/tarshar-vault/tree/main/projects/%E8%AB%96%E6%96%87%E7%B7%9A/%E7%B4%AB%E5%8D%80) 位於共同大腦紫區。此 repo 保留程式、語料版本和工程驗證；研究寫作不再另外複製一份。綠區只供歷史回溯，取材須記來源版本與用途。

## 開始操作

1. A 輸入想找的完整文字；沒找到可自行縮短或換詞。保留空白、標點及大小寫，逐字比對，不斷詞、不放寬成 OR。
2. B 用自己的話描述需求與情況；必要時補充條件。回答的 `[1]` 等標記對應來源按鈕，點開核對原文。
3. 延續同題可以直接追問。換成新任務請按「開始新問題」。
4. 「下載評分紀錄 CSV」提供本機開發紀錄的人工評分表。原始查詢、前文、來源、模型輸出與版本留在本機 JSONL，不提交 GitHub。

## 建置與執行

Python 3.11。使用獨立虛擬環境與凍結依賴 `requirements.lock.txt`，不 import 綠區。

```sh
python3.11 -m venv .venv
.venv/bin/python -m pip install -r requirements.lock.txt
cp .env.example .env
chmod 600 .env
# 在本機安全填入 API key，勿提交 .env。
.venv/bin/python -m pytest -q
.venv/bin/python -m uvicorn app.server:app --host 127.0.0.1 --port 8771 --workers 1 --no-access-log
```

BGE 模型使用 Hugging Face 本機固定快取 `BAAI/bge-base-zh-v1.5`，revision `f03589ceff5aac7111bd60cfc7d497ca17ecac65`。新機首次需用官方 SentenceTransformer 下載此 revision；日常服務設 `HF_HUB_OFFLINE=1`。文件向量建在本專案 `data/cache/`。

本機已安裝 `~/Library/LaunchAgents/com.tarshar.thesis-purple.plist`：登入時啟動、異常退出重啟，僅綁定 Tailscale IP，8771 埠。它是使用者 LaunchAgent，不保證尚未登入或 FileVault 尚未解鎖時執行。

## 研究界線

目前是工程開發版。固定來源快照含 1781 段（原 1772 段＋補入辦法 9 條），157 段指引缺原始網址，尚未完成正式語料查核。公開法規未必能代表原題「隱性知識外化文件」，題目、研究問題與正式方法仍須對齊。舊 A1 成績不併入新結果。

A 可自行換詞，B 可釐清與追問；正式比較需先定兩組操作及停止規程，不能只拿整句查無資料就宣稱 AI 勝出。答案與引用需人工評分，不將離線成績說成真人省時效果。

## 成本與資料

生成暫定 `gpt-5.4-mini-2026-03-17`；模型不是正式選型勝者。固定供應端、無自動換模型或隱性重試。配額持久記錄在 `data/runtime/llm_budget.sqlite3`，初期上限為 100 次模型呼叫；一次完整問答通常兩次，釐清通常一次。這是開發批次上限，不是永久無限額服務。單次輸入上限 50,000 字元、輸出 1,800 tokens。

問題、前文與取回的公開文件片段會送到 OpenAI API；請勿輸入個資或未授權內部文件。查詢紀錄僅存本機。相同 tailnet 的可連線裝置可查看本平台及匯出，遵守既有 Tailscale 存取規則。

- [研究規格與驗收](docs/研究｜紫區平台｜需求與驗收.md)
- [綠區保全及恢復](docs/維運｜綠區保全｜恢復說明.md)
- [操作說明 Word](docs/研究｜紫區平台｜操作與建置說明.docx)／[PDF](docs/研究｜紫區平台｜操作與建置說明.pdf)
- [架構圖](docs/研究｜紫區平台｜架構圖.png)
- [語料來源與雜湊](data/manifest.json)
- 共同研究決策與交班：`tarshar4242/tarshar-vault` 的論文線現行接力。
