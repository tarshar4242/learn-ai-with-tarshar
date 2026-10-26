# ★重要｜實驗平台外部審查提交包

版本：2026-10-26 v1。研究者羅靜娟；知臨整理與實跑，茜茜獨立審查。

[公開閱讀與下載](https://tarshar4242.github.io/learn-ai-with-tarshar/thesis-library/purple/submission/)／[Drive](https://drive.google.com/drive/folders/1yA7Vx4kZUW0Im2B24o4K813Wxh6N5BlY)

先讀 submission.pdf（43 頁）或 submission.md。給新 AI 可先提供 ai-review-input.md，再提供 submission-bundle.zip，要求依報告第 11 節核對，列出可重現依據與問題嚴重度。整合文字含完整核心程式、提示詞及本輪探測；完整語料與其他原始檔位於 platform-source.zip。

## 範圍與狀態

A 為同庫 Ctrl＋F 式連續字面查找，B 為口語改寫、向量查找、來源問答及接續對話。已證明有真實模型呼叫，未證明完整能力無誤。正式題名與文件定位、離線或真人研究、題數與評閱安排仍待研究者與教授核定。

本輪發現：一筆真實回答把「三十日以上」改成「超過30日」；50 筆資料超過嵌入上限；157 筆缺來源網址；引用 ID 檢查不驗證語義支持；一般助理回答的前文保留不足。全部有證據及待修正條件。35 項測試通過不代表回答正確率。

## 重現與驗證

平台來源固定 commit `62a37d9f213e4057929d31352d96f1bc4007f3fe`；source-manifest.json 列全部 89 個封存檔的 SHA256。這是審查快照，不另開第二條程式維護主線。平台後續展示更新未改動本次核心引擎、前端問答、語料與鎖檔。

下載完整審查包後解壓，先執行 `python3 verify-package.py`。此動作驗證 SHA256SUMS.txt 的所有檔案，並核對 platform-source.zip 及其內全部檔案；不呼叫 API。平台安裝與真實模型重跑指令見報告第 6 節。重跑生成 API 需要評審自己的金鑰與配額。

audit-corpus.py 與 run-development-probes.py 為本輪附帶腳本。前者重算語料及 token 長度；後者重跑已曝光開發案例，不能充當正式題組。原私人測試日誌、.env、金鑰及配額資料庫未納入。

## 接力

下一步依報告第 10 節修正工具與來源缺口，完善正式程序，再送研究者與教授確認。先保存本審查版本，不用改過的結果覆寫失敗證據；新版本另留差異與回測。原 47 頁論文稿與綠區歷史保留。
