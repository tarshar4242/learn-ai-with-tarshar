---
name: build-tarshar-course-three-pack
description: "Build or revise Tarshar's coordinated three-part teaching package: facilitator guide, learner handbook, and teaching presentation. Use when the user says「教材三件包」「教案＋講義＋簡報」「教師教案、學員手冊與PPT」「照AI協作日誌風格做教材」「沿用我的教學風格」「零基礎陪跑班教材」or asks to turn one lesson into aligned teacher, learner, and presentation artifacts. This skill must preserve an approved visual reference, disclose format mismatches before production, run a three-page style proof gate, and validate both technical correctness and visual fidelity."
---

# Tarshar 教材三件包總控

把同一堂課製作成三個互相配合、但不互相複製的成品：

1. 教師教案：教師如何帶課。
2. 學員手冊：學員如何理解、操作、書寫與帶走成果。
3. 教學簡報：現場如何聚焦、示範與推動行動。

## 必要載入

開始前完整讀取：

- `references/artifact-contract.md`
- `references/format-routing.md`
- `references/style-gates.md`
- `references/acceptance-checklist.md`
- `references/presentation-guardrails.md`

依輸出再載入：

- 教師教案：`$documents`
- 學員正式視覺版：`$create-xiaod-manual`
- 簡報：`$presentations`；需要 HTML 演講版或模板庫時再使用 `$html-ppt`
- 零基礎課程結構：`$beginner-interactive-course`
- 品牌決策：`$tarshar-brand-director`

若任何必要 Skill 或指定母版無法讀取，停止視覺製作，說明缺少什麼；不可只憑色票模仿。

## 不可跳過的工作流

### 1. 建立設計正本

在動工前明確寫下：

- 內容正本。
- 教學正本。
- 視覺正本。
- 哪些參考只提供次要靈感。
- 三件成品的正式格式與編輯格式。

「像 AI 協作日誌」代表使用實際核准成品或母版，不代表只取奶油色與綠色。

若使用者指定的風格與需要的格式不相容，立即說明。例如：

> 小D版手冊正式母版原生輸出 HTML／PDF；DOCX 可作內容編輯稿，但不能宣稱具備完全相同的版面 fidelity。

### 2. 先建立內容母稿

建立一份中立內容母稿，至少包含：

- 對象、時間、工具與限制。
- 本週可觀察成果。
- 分鐘流程。
- 教師話術與卡點救援。
- 學員操作、書寫欄位與帶走模板。
- 簡報敘事節點。
- 來源、資安與待確認事項。

三件成品共用事實與教學邏輯，不共用相同版面或相同文字密度。

其中的簡報敘事節點必須依 `references/presentation-guardrails.md` 記錄文字保留層級、解析頁面註記並建立字體角色表。這三項是內容與一致性護欄，不是新視覺風格；視覺正本、品牌資產與已核准版型仍具有優先權。

### 3. 完成格式路由

依 `references/format-routing.md` 選定每件成品的原生格式、正式交付格式與衍生格式。不得默默跨格式仿製。

### 4. 通過三頁風格校準

全量製作前先完成：

- 封面／開場頁。
- 一般內容頁。
- 互動、表格或實作頁。

將三頁與視覺正本並排檢查。若使用者先前已明確不滿意，必須交付這三頁供本人驗收；未核准不得全量展開。

### 5. 分別製作三件成品

遵守 `references/artifact-contract.md`。禁止把講義頁直接貼進簡報，或把簡報大字稿當教師教案。

### 6. 執行雙重驗收

技術驗收：

- 檔案可開啟。
- 無截字、溢位、亂碼、失效連結。
- 頁數、備註、來源與可編輯性符合約定。

視覺驗收：

- 與指定正本並排比較。
- 比較版面比例、留白、字體階層、格線、元件密度、插圖、Logo、色彩比例與閱讀節奏。
- 不得以「沒有溢位」代替美感與品牌 fidelity。
- 確認字體角色的一致性沒有覆蓋視覺正本，也沒有把不同功能頁做成同一版型。

依 `references/acceptance-checklist.md` 完成逐項記錄。

### 7. 留下可接力紀錄

保存：

- 設計正本與版本。
- 內容母稿。
- 三頁校準結果。
- 正式輸出與可編輯原稿。
- 技術與視覺 QA。
- 未完成、風險與下一步。

## 硬性停止條件

遇到下列情況必須停下說明，不可自行猜：

- 使用者說「照某成品」，但找不到該成品。
- 母版原生格式與指定交付格式不同，且 fidelity 會明顯下降。
- 正式 Logo、字型、人物或插圖參考缺失。
- 三件成品的對象、時長或實作成果互相矛盾。
- 風格校準頁與正本的差異明顯。
- 只完成技術 QA，尚未完成視覺對照。

## 禁止事項

- 只讀 Skill 說明，不使用 Skill 的正式母版或資產。
- 只抽取色票就宣稱符合品牌。
- 用大量圓角色塊、卡片或儀表板元件填滿所有頁面。
- 把 A4 手冊版面放大成簡報。
- 為了「看起來完成」而跨格式低 fidelity 仿製。
- 未經三頁風格校準就批量產生整份教材。
- 用「乾淨」「無溢位」宣稱風格通過。

## 專案清單

製作時複製 `assets/three-pack-manifest.template.json`，填寫後執行：

```bash
python scripts/validate_three_pack_manifest.py <manifest.json>
```

驗證器只檢查必要證據是否存在；人工視覺判斷仍須依正本逐頁完成。
