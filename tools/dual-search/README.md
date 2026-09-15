# 雙路徑檢索台｜怎麼新增法規或文件

網址：https://tarshar4242.github.io/learn-ai-with-tarshar/thesis-library/tools/dual-search/

這個工具的文件庫不是資料庫，是每次部署時**重新從來源產生**的：
`sources/laws.txt` 裡的法規代碼 → 抓全國法規資料庫逐條；`sources/pdf/` 裡的 PDF → 逐頁切段；再算向量、打包成一個網頁。

## 新增一部法規（手機也能做）
1. 到全國法規資料庫找到那部法規，看網址裡的 `pcode=`，例如 `N0090001`（就業服務法）。
2. 打開 GitHub 的 `tools/dual-search/sources/laws.txt`，按鉛筆編輯，最下面加一行：`N0090001 就業服務法`。
3. 按 Commit changes（直接 commit 到 main）。
4. 等約 5 到 8 分鐘，網站自動重抓、重算、重新部署。重新整理網頁，上方「文件庫：法規 N 部」的數字會變。

## 新增一份 PDF（指引、手冊、函釋彙編）
1. GitHub 打開 `tools/dual-search/sources/pdf/`，Add file → Upload files，把 PDF 拖進去，檔名建議 `G4_檔名.pdf`（前面的編號會被去掉、底線變空格，當作顯示名稱）。
2. Commit 到 main，等部署。
3. 純圖片掃描的 PDF 抓不到文字，會顯示 0 段；那種要先 OCR。

## 移除
把 `laws.txt` 那行刪掉、或把 PDF 刪掉，commit，等部署。

## 本機重跑（工程用）
```
cd tools/dual-search
pip install pymupdf && npm ci
python3 pipeline.py && node embed_build.mjs
```
產出：`public/thesis-library/tools/dual-search/index.html`；`build/report.txt` 有每個來源抓到幾條幾段。

## 資料與隱私
- 法規依著作權法第 9 條不受保護；政府出版品僅供研究使用。
- 網頁不連任何後端；受訪者的操作日誌只存在該裝置的瀏覽器（localStorage），研究者在「日誌與筆記」匯出 CSV。
- 語意模型（multilingual-e5-small）第一次使用時從 jsDelivr／Hugging Face 下載到瀏覽器快取，查詢文字不會送到任何伺服器。
