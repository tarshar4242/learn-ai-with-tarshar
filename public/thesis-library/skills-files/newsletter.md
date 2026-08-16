---
name: newsletter
version: 1.0.0
description: |
  主題式電子報產生器 — 把「剛完成的一件事」或一篇素材，寫成 Learn AI with Tarshar「主題式電子報」系列的新一期，發佈到課程筆記館（大水池 kt-sweet-journey）。第一人稱幕後信口吻（怎麼做的、為什麼這樣選、中間卡在哪），圖文並茂、看內容決定圖片量，自動接系列卡片與網站地圖、發佈前先讓 Tarshar 過目、推上線後實抓驗證、回傳可點網址。觸發時機：Tarshar 說「做成電子報」「這個做一封電子報」「發一期電子報」「把今天做的事寫成電子報」「電子報」「edm」，或做完一件事後想把過程寫成一封主題信時。即使她只說「這個寫成電子報」也應觸發。
user-invocable: true
last-updated: 2026-07-31
author: 知臨（for Tarshar）
tags:
  - newsletter
  - edm
  - kt-sweet-journey
  - publishing
  - learn-ai-with-tarshar
---

# 主題式電子報產生器

把一件**已經完成的工作**（或一篇素材、一個主題），寫成大水池「主題式電子報」系列的新一期 `edm-NNN`，圖文並茂、發佈、驗證、回網址。

## 最重要的三條（動手前先讀）

1. **家固定在大水池，不要另開 repo。**
   電子報一律住在 `~/kt-site/kt-sweet-journey`（這個資料夾不在 ray 底下；**本 skill 就是「做電子報」這件事的明確授權**，可以跨進去讀寫）。每一期就是一個 `edm-NNN.html`，跟 `edm-001`／`002`／`003` 排在同一個「主題式電子報」系列。
   > 踩坑背景：2026-07-31 第一次做電子報時誤開了獨立 repo `learn-ai-newsletter`，格式跟系列不一致、也沒放進大水池。這個 skill 就是為了以後不再發生。

2. **口吻是第一人稱「幕後信」，不是教學稿、不是公關稿。**
   系列的身分（寫在 `lessons.html` 的 `SERIES_META.edm`）是：「每做完一件事，就寫成一封主題信：怎麼做的、為什麼這樣選、中間卡在哪。」用 Tarshar 本人的口吻，白話、溫暖、非工程師視角。台灣繁體中文、全形標點、**不用破折號**。不自我標榜口吻（不可出現「用我自己的口吻寫」這類句子）。

3. **圖文並茂，看文章內容決定圖片量。**（Tarshar 核心偏好，2026-07-31 指定）
   有「看得到的成品」（圖卡、簡報、截圖、網頁、圖表、對照圖）→ 一定要開一個「成果展示」區把成品秀出來，點圖可放大。沒有現成成品（一個決策、一段純文字流程、一個習慣）→ 用結構化視覺元件＋自製簡單示意圖，不要整封都是字。詳細判準與元件選擇見 `references/visual-playbook.md`。

## 完整流程

### Step 0｜定位與接力（避免撞號、避免覆寫別人的成果）
```bash
cd ~/kt-site/kt-sweet-journey
git checkout main && git pull --rebase origin main
ls edm-*.html            # 看現有到第幾期
```
- 算出下一個編號 `NNN`（現有最大 + 1，補零三位）。日期用今天。
- 若發現有並行 session 正在動電子報相關檔案，先接續、不要另起。

### Step 1｜收素材、讀懂它
來源三種，擇一：
- **剛完成的一件事**（最常見）：把這次或近期做的工作，寫成「我怎麼做這件事」的幕後信。
- **一篇文章或草稿**：Tarshar 給檔案或文字。若它是教學稿，改寫成幕後信角度（我為什麼做、怎麼做、卡在哪），以符合系列身分。
- **一個主題**：她口述主題，從對話脈絡與實際成果組出內容。

### Step 2｜定視覺策略
問一句：**這封有沒有看得到的成品？** 依 `references/visual-playbook.md` 決定圖片量與元件組合。

### Step 3｜起草內容（用房子的版型）
複製 `references/template.html` 當基底，套上幕後信骨架（見下）。**內容逐段寫進 `edm-NNN.html`**，長內容邊寫邊落檔。

### Step 4｜放視覺
- 有成品圖：用 `sips` 縮到寬 1080、JPEG 85，放進 `edm-NNN-img/`，相對路徑引用，包 `<a target="_blank">` 讓點圖放大。**不要把大圖用 base64 內嵌**（系列頁一律用圖檔資料夾）。
- 沒成品：做流程圖／前後對照／概念示意（SVG 或結構卡片），至少一張。
- 節奏檢核：若連續兩個 section 完全沒有任何視覺元素，補一個（引言框、示意圖、對照、清單卡、成果圖）。

### Step 5｜本機預覽 + 給 Tarshar 過目（對外發布關卡，不可省）
用 Playwright 於手機寬（約 390–420px）全頁截圖，傳給 Tarshar 看。
> 這是把她未過目、Claude 生成的內容發到公開網站前的唯一該停關卡。**等她說 OK 或改完，才進 Step 6。** 她若已明說「直接發不用等我看」，才可跳過。

### Step 6｜發佈（照 publish-checklist 逐項做）
接系列卡片、網站地圖，commit、`pull --rebase`、push `main`。細節與確切要改的檔案見 `references/publish-checklist.md`。

### Step 7｜驗證（實抓，不是推完就算）
`curl` 抓線上 `edm-NNN.html` 與**每一張圖片**確認 HTTP 200、系列頁確實出現新卡片。GitHub Pages 有建置延遲，抓到 404 就等 15 秒重試，最多約 6 次。

### Step 8｜回報
給可點網址（`https://tarshar4242.github.io/kt-sweet-journey/edm-NNN.html` 與 `.../lessons.html#edm`）＋一句「你現在可以怎麼用」。

## 幕後信骨架（依內容增減，不是硬填十段）

`edm-002`／`edm-003` 是範例。常用段落：
1. 情境／痛點（我一直在逃避、我很討厭的一刻）
2. 我要的條件（我開的條件也有點貪）
3. 我只做幾個動作（含 `ul.flow` 步驟）
4. 〔成果展示〕— **有成品就放這裡**，`.shots` 圖卡格
5. 我藏了一個原理（`.pull` 一句話金句）
6. 途中出了什麼事／我多做了一件小事（踩坑或習慣）
7. 我做過的兩個取捨
8. 下一步
9. 想跟你說的一句話
10. 🍀 關於我（用 template 內的標準介紹，逐字不改）
- footer 固定：`📮 主題式電子報 · 電子報 NNN · 🍀Learn AI with Tarshar · YYYY.MM.DD`
- 報頭 chips：3–4 個關鍵字。

## 觸發條件

- 「做成電子報」「這個做一封電子報」「發一期電子報」
- 「把今天做的事寫成電子報」「這件事寫成電子報」
- 「電子報」「edm」「主題式電子報」

## 邊界與注意

- 只發到 `kt-sweet-journey` 的「主題式電子報」系列，**不另開 repo、不落在 ray 草稿夾就當完成**。
- push 前一定 `git pull --rebase`（這個 repo 常有多個 session 共寫）。
- 圖片放 `edm-NNN-img/`，相對路徑；不要 base64 巨檔塞進 HTML。
- 對外發布關卡（Step 5）不可自行省略，除非 Tarshar 當次明說不用等她看。
- 兩份鏡像檔（`index.html`、`lessons.html`）都要接上同一張系列卡片，缺一邊會不同步。

## 參考檔

- `references/template.html` — 電子報房屋版型 + 視覺元件庫（報頭、chips、金句框、流程、分類卡、步驟、成果圖格、內文插圖、關於我、footer）。
- `references/visual-playbook.md` — 圖文並茂的判準：什麼內容配什麼視覺、圖片處理指令、節奏檢核。
- `references/publish-checklist.md` — 發佈時確切要改哪些檔、git 流程、驗證指令。
