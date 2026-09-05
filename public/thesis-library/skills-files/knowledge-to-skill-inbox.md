---
name: knowledge-to-skill-inbox
description: Turn a phone-pasted note, voice memo transcript, article excerpt, book insight, research idea, SOP fragment, or AI collaboration observation into a compact Traditional Chinese Skill seed card that can later be folded into a formal Codex/Claude Skill. Use when the user says「知識收件箱」「這個可以變成 Skill 嗎」「把這段收成 Skill 素材」「Knowledge-to-Skill」「我在手機看到這篇」「先幫我留起來」「這個以後可能會重複用」. Do not use when the user wants an immediate finished output such as a Facebook post, image card, lesson pack, report, or complete new Skill.
---

# 知識轉 Skill 收件箱

把手機上臨時看到、想到、口述或貼上的內容，整理成日後可升級為 Skill 的種子卡。這個 Skill 的任務是「先收好、拆清楚、留下下一步」，不是一次把素材硬做成完整 Skill。

## 核心判斷

先判斷素材屬於哪一類：

- **方法**：使用者、高手或團隊做事的步驟與判斷。
- **心智模型**：書、文章、訪談或研究中的思考框架。
- **規則**：反覆發生的偏好、限制、踩坑、停止條件。
- **案例**：一次真實任務、成功作品、失敗修正或接力紀錄。
- **工具知識**：repo、API、產品功能、安裝方法或限制。

若素材只是一次性靈感，仍可保存，但標記為「暫不升級」。

## 手機優先流程

1. 直接處理使用者貼上的內容，不要求改格式。
2. 若內容太長，先擷取最相關的 1 到 3 個核心點，並註明還有哪些段落未處理。
3. 只問一個必要問題；能從脈絡合理判斷時不要問。
4. 用繁體中文整理，保留必要英文專有名詞。
5. 產出一張「Skill 種子卡」。
6. 若可寫入檔案，保存到收件箱資料夾；若不可寫入，先在對話中交付完整卡片。
7. 每累積 3 張同主題種子卡，主動提醒可評估建立或更新正式 Skill。

## 保存位置

預設保存到：

```text
100_Todo/projects/專案｜知識轉Skill｜收件箱/
```

同日檔名使用：

```text
KS-YYYYMMDD-001-短標題.md
```

同日編號依既有檔案遞增，不覆蓋舊檔。若來源涉及付費課程、私人文件、客戶、第三方書籍或未公開內容，只保存轉化後的短摘要、規則與來源索引，不大量複製原文。

## 種子卡格式

每張卡使用這個格式：

```markdown
# KS-YYYYMMDD-001｜<短標題>

## 一句話
<這段素材真正值得留下的是什麼>

## 類型
方法／心智模型／規則／案例／工具知識／暫不升級

## 可能變成的 Skill
<建議的 skill 名稱或方向；不成熟時寫「先累積」>

## 可重複使用的判斷
- <規則 1>
- <規則 2>
- <規則 3>

## 適合觸發的話
- 「<使用者自然會說的句子>」
- 「<另一個自然觸發句>」

## 不適用或要小心
- <版權、權限、個資、投資醫療法律等風險>
- <資料不足時要停下來的地方>

## 下一步
保留觀察／再收 2 則同主題素材／建立正式 Skill／更新既有 Skill：<名稱>

## 來源索引
- 來源：<對話、檔案、網址、書名、repo、備忘錄或使用者口述>
- 收錄時間：YYYY-MM-DD
```

## 升級判斷

只有符合下列任一條件，才建議升級為正式 Skill：

- 同一類工作已出現 3 次以上。
- 每次都需要相同判斷順序、輸出格式或停止條件。
- 現有 Agent 常常漏掉使用者偏好、邊界或驗收標準。
- 素材已足以提供 2 個成功案例與 1 個邊界案例。

若只是想保存知識，不要硬建 Skill；可以留在收件箱或整理成一般知識筆記。

## 與其他 Skill 的分工

- 要寫 Facebook 貼文：轉用 `write-facebook-post`。
- 要做知識圖卡：轉用 `capture-knowledge-card` 或 `cards`。
- 要做完整教案包：轉用 `lesson-pack`。
- 要正式建立新 Skill：收件箱已有足夠素材後，轉用 `create-good-skills` 或 `skill-creator`。
- 要記工作日誌或 AI 協作歷程：轉用 `journal` 或相關協作日誌 Skill。

## 回覆格式

先給結論，再給保存狀態：

```text
已收成 Skill 種子卡：<短標題>
判斷：先累積／可更新既有 Skill／可建立新 Skill
已保存：<路徑；若未保存則說明原因>
```

若使用者人在手機上，避免要求她立刻補檔案、整理來源或回答長問卷。缺的資訊先用「待補」標記，等下次她有空再補。
