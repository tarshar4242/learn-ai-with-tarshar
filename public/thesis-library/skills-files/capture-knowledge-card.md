---
name: capture-knowledge-card
description: Turn pasted text or attached PDF, DOCX, PPTX, spreadsheet, Markdown, text, image, or scan files into polished phone-readable Traditional Chinese knowledge-card images. Read the source, choose from three favorite house styles or ten specialized layouts, generate the actual image, verify text and composition, and save a compact source record. Use when the user says「圖卡快拍」「把這段做成圖卡」「把這份檔案做成圖卡」「整理成知識圖卡」「用第 X 款」「有哪些圖卡風格」「換一款比較」or uploads course material, notes, reports, slides, tables, or images that should become one card or a card series.
---

# 圖卡快拍

把當下值得留下的內容快速轉成可收藏、可追溯的知識圖卡。減少重複提示詞、避免主題聊天室被反覆製圖淹沒。

## 快速觸發

接受這些短指令，不要求使用者補寫完整提示詞：

- `圖卡快拍`
- `把剛才這個重點做成圖卡`
- `這個值得留卡`
- `圖卡快拍 A`
- `用第 5 款做成圖卡`
- `有哪些圖卡風格`
- `沿用上一張風格`
- `給我三個常用風格`

## 工作流程

1. 擷取最近且直接相關的討論，通常只使用最近 2～6 個來回。
2. 若有附件，先依「檔案轉圖卡」讀取指定檔案；不要要求使用者重新貼出檔案內文字。
3. 不為製卡重讀整串聊天室、整個 repository 或無關文件。
4. 提煉一個核心命題，判斷為靈感、概念、決策、流程、實驗或階段成果卡。
5. 依「風格選擇」決定使用常用風格或十款專用版型。
6. 先寫精簡卡稿，再組成結構化圖像提示。
7. 使用內建 `image_gen` 產生點陣圖；不要改用 CLI，除非使用者明確要求。
8. 檢查構圖、繁體中文、文字正確性、手機可讀性及風格一致性。
9. 若只有一處明顯錯誤，做一次針對性修正並重新檢查；不要在主題聊天室無限改版。
10. 保存圖片與精簡文字原稿，回報圖卡編號、風格、來源及路徑。

若無法從最近脈絡判斷使用者指的是哪個概念，只問一個最短問題。

## 檔案轉圖卡

有附件時讀 `references/file-to-card.md`，依檔案格式使用對應的文件讀取能力，再進入一般製卡流程。

核心原則：

- 使用者只上傳檔案或說「把這份做成圖卡」時，直接讀取、提煉並生圖。
- 除非使用者明確只要提示詞，否則不可停在摘要、卡稿或 prompt；必須交付真正的圖卡圖片。
- 短文件預設產生一張核心圖卡；多章節或長文件先規劃 3～8 張系列，只有範圍會明顯改變結果時才問一個最短問題。
- 數字、引文、章節、頁碼與投影片編號必須可回查；看不清楚的掃描內容不可猜測。
- 文字過多時拆卡，不以縮小字體硬塞。

## 風格選擇

先讀 `references/style-library.md`。

當使用者指定數字、要求完整風格選單，或內容明顯適合時間軸、漫畫、便利貼、報紙、數據圖表等專用版型時，再讀 `references/style-profiles-10.md`。不要為一般圖卡預先載入全部十款細節。

依序判斷：

1. 使用者已指定 A、B、C、1–10、風格名稱或參考圖：直接使用。
2. 當前對話已有一張明確被使用者說「喜歡」「就是這個」的圖卡：沿用它，只在回覆中簡短註明。
3. 風格偏好已有至少兩次明確採用紀錄：預設使用最高順位風格，不先打斷使用者。
4. 第一次使用、風格不明或使用者要求選擇：主動顯示 A、B、C 三張預覽與一句差異，請使用者只回 A、B 或 C。

若使用者問「有哪些款式」，顯示十款名稱、結構與各自最適合的內容，但每款只用一行。若使用者只貼內容而沒有指定樣式，先根據內容選一個最合適版型並用一句話確認；只有風格會明顯改變結果時才請使用者選擇。

顯示預覽時使用：

- `assets/style-a-cute-notebook.png`
- `assets/style-b-library-handbook.png`
- `assets/style-c-hypercard-grid.png`

不要把三張風格長篇解釋成選項清單。只說：

- A 可愛手帳教學風：溫暖、親切、適合概念學習。
- B 圖書館手冊風：溫暖正式、適合規格、方法與長期知識。
- C 復古 HyperCard 九宮格：關係明確、適合流程與架構。

使用者提供喜歡的圖卡時，把它視為「風格參考圖」，先用 `view_image` 檢視，再抽取版型、色彩、字體感、插畫密度、資訊密度及裝飾語言。只有使用者明確說「加入常用風格」時，才更新風格庫；不要從一次使用擅自推定永久偏好。

## 十款專用版型

十款版型用於內容結構明確的任務：

- 九宮格：入門指南、原則、Q&A。
- 生活拼貼：活動、旅行、心得與回顧。
- 黑板教室：初學教學與白話解釋。
- 報紙頭條：歷史、事件脈絡與深度議題。
- 日系手帳：習慣、日程、月計畫。
- 漫畫對話：情境模擬、迷思破解、問答。
- 時間軸捲軸：歷程、品牌故事、學習軌跡。
- 便利貼牆：腦力激盪、靈感整理、團隊共識。
- 資訊圖表：KPI、調查與數據比較。
- 暗夜霓虹：創作靈感、深度思考與夜讀摘要。

完整的構圖、材質、色彩、限制與英文提示骨架在 `references/style-profiles-10.md`。

## 卡稿原則

- 一張卡只講一個完整概念。
- 標題優先控制在 12 個中文字內。
- 內文使用 3～6 個短區塊；每區一個訊息。
- 保留來源內容的意思，不添加未經討論的結論。
- 使用繁體中文（台灣）；專有名詞可保留英文。
- 避免把整段文章塞進圖片。
- 把詳細補充留在文字原稿，不擠入圖卡。
- 對話若包含機密、客戶個資或敏感資料，先匿名化或改用模擬內容。
- 分享給學員或公開使用時，移除個人簽名、內部品牌、客戶名稱與來源中不可公開的細節。

## 圖像提示與生成

把卡稿整理為精簡的製作規格：

```text
Use case: infographic-diagram 或 productivity-visual
Asset type: phone-readable Traditional Chinese knowledge card
Primary request: <核心命題>
Reference image: <如有，標記為 style reference>
Style/medium: <選定風格>
Composition/framing: <資訊層級與尺寸>
Color palette: <選定風格色彩>
Text (verbatim): "<所有必須出現的文字>"
Constraints: Traditional Chinese; phone-readable; preserve meaning
Avoid: watermark; signatures; invented facts; tiny dense paragraphs; unrelated decoration
```

有參考圖時使用風格參考，不把它當成編輯目標。每個不同圖卡或風格變體各呼叫一次生成工具。

## 品質檢查

交付前確認：

- 核心概念與來源討論一致。
- 必要文字為繁體中文且沒有錯字。
- 標題、主次層級及閱讀順序清楚。
- 手機縮圖仍能辨認標題與主要區塊。
- 沒有浮水印、亂碼、額外品牌或虛構資訊。
- 沒有個人簽名、內部專案名稱或未授權品牌元素。
- 參考風格的主要特徵有被保留。

圖像模型若無法穩定呈現大量文字，縮減圖片文字，將完整內容保存在原稿；不要用更小字硬塞。

## 保存與 Token 控制

若有可寫入的專案工作區，預設保存至：

```text
圖卡紀錄/YYYY-MM-DD/
├── KC-YYYYMMDD-001-短標題.png
└── KC-YYYYMMDD-001-短標題.md
```

同日編號依現有檔案遞增，不覆蓋舊圖。文字原稿遵循 `references/card-record-template.md`。

只保存製卡所需的精簡來源摘要，不逐字複製整串對話。第一次生成留在原主題聊天室；若使用者開始反覆改版、一次需要多個版本或管理整套圖卡，建議移到獨立「圖卡工作室」，並以圖卡編號接續。

若目前環境不可寫入檔案，仍先交付圖卡，再清楚說明尚未建立永久紀錄。

## 回覆格式

先顯示圖卡，再用三行內回報：

```text
圖卡編號：KC-YYYYMMDD-001
使用風格：A／B／C／自訂名稱
已保存：<圖片與原稿路徑>
```

不要在交付後重貼完整生成提示詞，除非使用者要求。
