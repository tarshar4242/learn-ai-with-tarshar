---
name: mac-notes
description: 讀取、搜尋、整理與新增 Apple 備忘錄（Mac 備忘錄），並從筆記中盤點尚未完成的文字待辦。只要使用者提到「備忘錄」「Apple Notes」「幫我看最近的筆記」「找某則筆記」「備忘錄還有哪些事沒做」「把這段記到備忘錄」，即使沒有說 skill 名稱，也應使用本 Skill。
compatibility: macOS，需有 Notes.app 與系統內建 osascript；首次使用須允許目前的終端或 AI 應用程式控制「備忘錄」。
---

# Mac 備忘錄

透過 macOS 內建的 Notes 腳本介面操作 Apple 備忘錄，不讀取 Notes 的內部資料庫，也不需要 API Key 或第三方 MCP。

## 使用工具

執行同資料夾的 `scripts/apple_notes.py`。所有讀取結果都輸出為 JSON，方便 AI 再整理成手機可讀的繁體中文。

```bash
python3 scripts/apple_notes.py status
python3 scripts/apple_notes.py recent --limit 5
python3 scripts/apple_notes.py search "關鍵字" --limit 10
python3 scripts/apple_notes.py read "完整標題或筆記 ID"
python3 scripts/apple_notes.py todos --limit 30
python3 scripts/apple_notes.py create "標題" "本文" --folder "備忘錄"
```

從其他工作目錄執行時，使用此 Skill 的絕對路徑。

## 工作流程

1. 先判斷使用者要讀取、搜尋、盤點待辦，或新增筆記。
2. 讀取任務可直接執行；新增筆記前，確認這是使用者當次明確要求的內容。
3. 若使用者只說「最近」，預設列 5 則；若只說「找」，同時搜尋標題與純文字內文。
4. 結果先給結論，再列筆記標題、資料夾與修改時間；除非使用者要求，不要在回覆中展開整篇筆記。
5. 不顯示密碼保護筆記的本文。腳本會回傳 `password_protected: true`，此時只回報無法讀取。
6. 不提供刪除功能。刪除是不可逆動作，應留在 Notes app 由使用者自行完成。

## 待辦盤點的限制

`todos` 能辨識一般文字中的未完成標記，例如：

- `- [ ] 買教材`
- `☐ 回覆信件`
- `○ 整理講義`
- `◯ 預約時間`
- 行首含「待辦：」「TODO:」或「未完成：」

Apple 原生圓圈 Checklist 的勾選狀態沒有出現在 Notes 官方 AppleScript 的 `plaintext` 或 `body` 欄位。不要假裝能可靠辨識它；若使用者的待辦全是原生 Checklist，清楚說明目前只能讀到文字，建議改用上述文字標記，或另行評估 Apple 捷徑／提醒事項整合。

## 錯誤處理

- `-1743` 或提到「不允許傳送 Apple 事件」：請使用者到「系統設定 → 隱私權與安全性 → 自動化」，允許目前使用的終端或 AI 應用程式控制「備忘錄」，再重試。
- 找不到筆記：先跑 `search`，不要直接猜標題。
- 同名筆記：列出候選的資料夾、修改時間與 ID，讓使用者指定。
- Notes 無回應：只重試一次；仍失敗就回報，不要連續啟動大量程序。
- **手機剛加的內容讀不到、`modified_at` 停在舊時間**（2026-07-29 實測）：iPhone 停在筆記編輯畫面時不會推送到 iCloud。**先請使用者退出筆記、回到備忘錄列表**，再等約一分鐘重讀。不要急著判斷同步壞掉或叫使用者改設定 —— 十之八九只是還停在編輯狀態。

## 隱私原則

- 只讀取完成當次任務所需的最少內容。
- 不把筆記本文寫入日誌、GitHub、測試檔或交班文件。
- 測試只驗證數量、欄位與功能，不保存真實筆記內容。
