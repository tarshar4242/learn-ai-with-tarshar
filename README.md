# Learn AI with Tarshar — 品牌首頁

給 Tarshar 看的白話說明。技術細節寫在程式碼註解裡，這份只講「妳要怎麼用」。

## 這是什麼

妳的新品牌首頁，網址：**https://tarshar4242.github.io/learn-ai-with-tarshar/**

跟課程筆記館（kt-sweet-journey）不一樣的地方：這個網站可以依對象給不同的專屬網址（分眾），
而且有一個可以自己改內容的後台。

## 怎麼改內容（不用寫程式）

1. 打開後台：**https://tarshar4242.github.io/learn-ai-with-tarshar/admin/**
2. 挑分頁（文案／課程系列／文章／工具……），直接改文字、加新的一筆、刪掉不要的、用上下箭頭排順序。
3. 想指定「這筆只有誰能看」，每筆下面有身分按鈕可以點（不點就是公開，所有人都看得到）。
4. 改完，按最下面**「下載 content.json」**，檔案會存到妳電腦的「下載」資料夾。
5. 到 GitHub 網頁把這個檔案上傳、蓋掉原本的 `src/data/content.json`：
   - 打開 https://github.com/tarshar4242/learn-ai-with-tarshar/blob/main/src/data/content.json
   - 按右上角鉛筆圖示旁的「...」選「Upload files」（或直接把下載的檔案拖進去）
   - 選妳剛下載的 `content.json`，下面填一句話說明改了什麼，按「Commit changes」
6. 等 1-2 分鐘（GitHub 會自動重新建置網站），重新整理網頁就會看到新內容。

**小提醒**：後台頁面本身不用密碼，因為它只是在妳的瀏覽器裡編輯、下載檔案，不會連到任何資料庫，
不用擔心被陌生人亂改——真正會讓網站改變的，是妳自己上傳檔案那一步。

**草稿保護**：如果妳在後台改到一半沒下載就關掉，下次打開會自動接續（存在瀏覽器裡）。
如果別人（或另一個裝置）已經上傳了新版 `content.json`，後台會提醒妳「草稿是舊的」，讓妳選要繼續用草稿還是改用新版。

## 分眾網址（誰看得到什麼）

每個身分有自己的專屬網址，在後台「觀眾群」分頁可以直接複製：

| 對象 | 網址結尾 |
|---|---|
| 一般訪客 | 不用加任何東西 |
| 學員 | `?k=cssai2026` |
| 知心朋友 | `?k=fai2026` |
| 職場同事 | `?k=bnn2010` |
| TAR（妳本人完整入口） | `?k=145` |

把整串網址（例如 `https://tarshar4242.github.io/learn-ai-with-tarshar/?k=cssai2026`）發給對方，
他打開就只看得到公開內容 + 給他那個身分專屬的內容。網站上沒有讓人自己切換身分的按鈕，是刻意設計成這樣。

**要注意**：這是「軟性」保護，擋得住不小心點錯的人，擋不住真的想繞過的人（打開網頁原始碼看得到全部內容）。
不要拿來放真正機密的東西。

## 短網址：對外一律發 `/go/` 開頭的連結

以後要把連結貼到 FB、電子報、LINE 給別人，**不要直接貼真實檔案路徑**，改貼短網址：

```
真實路徑（不要對外發）  https://tarshar4242.github.io/learn-ai-with-tarshar/notes/tools.html
對外發這個              https://tarshar4242.github.io/learn-ai-with-tarshar/go/tools/
```

### 為什麼要多這一層

1. **以後檔案搬家、改名、換資料夾，發出去的連結永遠不會壞。** 只要回來改對照表的一行就好，
   不用回頭去改已經貼出去的 FB 貼文、寄出去的電子報。（2026-08 從 kt-sweet-journey 搬到新站那次的痛點，就是這個。）
2. **網址短、乾淨、口頭唸得出來。**
3. **有人把尾巴砍掉也看不到東西**：`.../go/tools/` 砍成 `.../go/` → 直接被帶回公開首頁，
   不會列出有哪些短網址存在。
4. `?k=` 身分和 `#` 錨點都會自動帶過去，換頁不會掉身分。

### 怎麼新增一組短網址

改 `src/data/redirects.json`，在 `links` 裡加一行：

```json
{ "slug": "ep25", "to": "notes/ep25-notes.html", "note": "第25集課程筆記" }
```

- `slug` = 對外網址的結尾（`.../go/ep25/`）
- `to` = 真正的位置。站內就寫 `notes/xxx.html`（開頭不用加 `/learn-ai-with-tarshar/`），
  站外就寫完整 `https://...`
- `note` = 給妳自己看的備註，會顯示在轉址那一瞬間的畫面上

上傳到 GitHub → 等 1-2 分鐘自動重建 → 短網址就生效。流程跟上傳 `content.json` 一模一樣。

### slug 怎麼取

- 想讓人記得住、電話裡唸得出來 → 取好唸的：`thesis`、`ep25`、`calendar`
- 只想給特定幾個人、不想被別人猜到 → 後面加一段亂碼：`ep25-h7k2m9`

**亂碼只是「不好猜」，不是「不能看」。** 這個 repo 是公開的，任何人打開 GitHub 都能看到全部檔案，
包含這份對照表。真正機密的東西不要放這個網站。

## 還有一步妳要做：接上表單

首頁的電子報訂閱框、聯絡頁的邀約表單，目前都還沒有真的接到任何地方——填了會顯示送出，但妳收不到信。

1. 到 https://formspree.io 免費註冊帳號
2. 建立表單，拿到一組表單代碼
3. 跟我（或任何一位 AI 助手）說這組代碼，我幫妳把 `src/pages/contact.astro` 和
   `src/components/NewsletterBox.astro` 裡的 `YOUR_FORM_ID` 換掉

這步驟需要妳本人註冊帳號，AI 不能代辦。

## 技術細節（給接手的工程師／AI 看）

- Astro 靜態站，`npm run build` 產出純 HTML/CSS/JS，部署到 GitHub Pages
- push 到 `main` 會觸發 `.github/workflows/deploy.yml` 自動建置＋部署
- 內容全部來自 `src/data/content.json`，不要把文案寫死在元件裡
- 分眾邏輯在 `src/scripts/audience.js`，身分完全由網址 `?k=` 決定，不要加切換 UI（見 `content.json` 裡 `audiences` 欄位的注解）
- 新增內容頁時，若有返回導覽的按鈕，記得用 `history.back()` 寫法，不要用固定網址，否則 `?k=` 身分會在換頁時遺失
