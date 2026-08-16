---
name: comfy-h3-video-batch
description: 用 Codex 或 Claude 經由本機 Comfy MCP，自動規劃並執行 MiniMax H3 多圖參考影片批次。只要使用者提到 ComfyUI 自動生影片、MiniMax H3、兩張主角參考照、三段 10 秒影片、Ref2VA、多圖參考工作流、批次排隊或生成後收檔，就應使用本 Skill；也適用於只想先做提示詞、工作流程檢查或新手教學的情況。
compatibility: 需要 Python 3.10+、comfy-cli 1.14+、comfy-mcp、本機 ComfyUI，以及 h3-prompt-writing Skill。H3 API 生成需要 Comfy 帳號與可用點數。
---

# MiniMax H3 三段影片自動化

把「兩張參考照＋一個影片概念」整理成三段連續的 10 秒 H3 影片任務。Mac 負責工作流程、佇列與收檔；MiniMax API 負責實際生成；最後由人判斷與剪接。

## 預設成果

- 3 段影片，每段 10 秒。
- 同一主角、造型與視覺世界，三段各自有清楚功能：建立、發展、收束。
- 768P；社群直式內容預設 9:16，其餘使用 adaptive，除非使用者指定。
- 原始生成檔、三份工作流程、提示詞、批次狀態與人工剪接建議放在同一個執行資料夾。
- 生成前一定先驗證，不因「自動化」而略過付費確認。

## 使用資源

- 提示詞：先完整讀取相鄰 Skill `../h3-prompt-writing/SKILL.md`，Ref2VA 任務再完整讀取其 `references/ref-en.txt`。
- 官方原始模板：`assets/workflows/api_minimax_h3_r2v.json`。
- 雙圖衍生模板：`assets/workflows/api_minimax_h3_r2v_two_images.json`。
- 批次準備工具：`scripts/prepare_batch.py`。
- 新手操作與故障排除：`references/新手操作指南.md`。

## 工作流程

### 1. 先確認輸入是否齊全

從對話與附件先找答案，不重問已知資訊。最少需要：

1. 兩張有權使用的主角參考照之本機絕對路徑。
2. 影片用途或一句核心概念。
3. 畫面比例；未指定時，社群短影音用 9:16，其餘用 adaptive。

若使用者只給一張照片，也可以改成單圖模式，但要清楚說明人物一致性可能較弱。沒有實際檔案路徑時，不假裝已能送出，請使用者附檔或提供路徑。

### 2. 規劃三段敘事

先交付一張簡短規劃表：

| 段落 | 功能 | 動作與鏡頭 | 與下一段的接點 |
|---|---|---|---|
| 01 | 建立人物與場景 | 一個主要動作 | 保留視線、方向或道具 |
| 02 | 發展或轉折 | 一個更明確的變化 | 讓動勢可以接到結尾 |
| 03 | 收束 | 完成動作或情緒落點 | 留可剪接的穩定尾幀 |

每段只安排模型在 10 秒內能清楚完成的事件。避免一段塞入大量場景、角色、換裝與鏡頭切換。

### 3. 用 H3 Ref2VA 格式寫提示詞

依 `h3-prompt-writing` 的 Ref2VA 規格產出英文提示詞，保留原語言的對白、歌詞與畫面文字。三段共用：

- 相同的 `subject_definitions` 與參考圖標籤。
- 相同的臉部、髮型、服裝、身形、道具與色彩錨點。
- 清楚的時間碼、鏡頭運動、環境聲與音樂方向。

每段提示詞都必須能獨立生成；不要用「跟上一段一樣」這類模型看不到的指代。

### 4. 建立批次資料夾

依 `references/批次規格範例.json` 建立規格檔，再執行：

```bash
python3 scripts/prepare_batch.py \
  --spec /絕對路徑/batch-spec.json \
  --output-dir /絕對路徑/執行資料夾
```

工具會拒絕覆寫非空資料夾，避免重跑時混入舊任務。成功後確認：

- `inputs/` 有兩張參考圖副本。
- `workflows/` 有 3 份工作流程。
- `manifest.json` 的 `spend_status` 是 `not_approved`。

### 5. 連線與免費預檢

使用 Comfy MCP，依序執行：

1. `server_info`：確認本機 ComfyUI 正在執行且工作區正確。
2. `auth_status`：只讀確認 Comfy／MiniMax API 登入狀態，不讀取或顯示金鑰。
3. 未登入時呼叫 `auth_login`，把官方登入網址交給使用者本人完成，再重查 `auth_status`。
4. `upload_file`：上傳批次資料夾中的兩張參考圖。
5. 對三份工作流程逐一執行 `validate_workflow`。

任一步失敗就先修正，不進入付費生成。缺少 `MinimaxHailuo03ReferenceNode` 時，先確認 ComfyUI 版本與 API Nodes；不要猜測第三方節點名稱或擅自安裝套件。

### 6. 付費動作前停下確認

用手機可掃讀的格式回報：

```text
準備送出 MiniMax H3：3 段 × 10 秒
比例：9:16｜解析度：768P
素材：2 張參考照
狀態：工作流程全部驗證通過
注意：下一步會使用 MiniMax／Comfy 點數
```

只有使用者明確同意這一批 3 段任務後，才能繼續。不要把過去的同意當成這次的同意，也不要繞過 MCP 的平台確認提示。

### 7. 非同步送出、監看與收檔

對三份工作流程逐一呼叫：

- `run_workflow(workflow_path=..., wait=False, confirm_spend=True)`，保存每個 `prompt_id`。
- 用 `job(action="wait", prompt_id=...)` 分段等待；逾時不代表失敗，繼續查狀態。
- 失敗時用 `job(action="error", prompt_id=...)` 取得具體節點錯誤，只重送失敗片段。
- 完成後用 `fetch_outputs(prompt_id=..., out_dir=...)` 收到各段 `outputs/clip-01` 等資料夾。

將 `manifest.json` 更新為各片段的 `submitted`、`completed` 或 `failed`，避免整批重複扣點。

### 8. 人工判斷與剪接交班

不要自動宣稱成品可發布。逐段整理：

- 人物一致性：臉、髮型、服裝、身形。
- 動作可信度：手指、肢體、接觸、物件軌跡。
- 鏡頭可剪性：開頭與結尾是否有穩定幀、運動方向是否接得起來。
- 聲音：環境聲、對白、音樂是否突兀。
- 建議：保留、局部剪用、或只重生該段。

## 安全與成本原則

- 參考照必須是使用者有權使用的素材；不協助未授權冒用他人肖像。
- 不在規格、日誌、Git 或回覆中保存 API 金鑰。
- `validate_workflow`、查模板與查登入狀態不會生成影片；`run_workflow` 才是付費界線。
- 發生錯誤只重跑失敗段，不整批重送。
- 原始影片與大型素材留本機或 Google Drive；Git 只保存 Skill、規格、狀態與索引。

## 完成回報

先說結果，再列出：完成幾段、各段檔案位置、失敗或待重生項目、人工剪接建議，以及是否仍有點數或登入事項需要使用者處理。
