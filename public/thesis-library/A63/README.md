# Saad-Falcon 等 2024：ARES，以少量人工標註校正的檢索增強生成自動評估

> **Title:** ARES: An Automated Evaluation Framework for Retrieval-Augmented Generation Systems

| 欄位 | 內容 |
|---|---|
| 作者 | Saad-Falcon, Khattab, Potts & Zaharia |
| 出處 | Proceedings of NAACL 2024 (Volume 1: Long Papers), pp. 338–354（2024） |
| DOI | https://doi.org/10.18653/v1/2024.naacl-long.20 |
| 授權 | CC BY 4.0（ACL Anthology 頁尾標示，2026-11-25 查；PDF 頁尾僅印 ©2024 ACL） |
| 方法 | 以合成資料微調評審，再用少量人工標註與PPI給評分信賴區間。 |
| 查證 | 2026-11-25 已讀全文並經獨立驗收，授權以原文標示與期刊或登錄資料核對 |

譯文非原作者提供，依 CC BY 4.0 為中文翻譯改作，引用請回查原文。

## 一句話判讀

思路可借來說明專家驗證；整套做法預設英文與大量回答。

## 研究問題

少量人工標註加信賴區間，是否適合專家驗證樣本設計？

## 主要發現

300筆標註下多數設定排名優於RAGAS；低於約100至150筆時τ明顯下降。

## 怎麼用進本研究

借專家判定當對照並報告區間；回答少時可全判。（研讀建議，待老師判斷）

## 限制

僅英文資料、無標註者一致性；數個數字前後不一致，原文未解釋。

## 檔案

- [文獻卡](README.md)
- [中英對照 PDF](A63_bilingual.pdf)
- [中英對照 Word](A63_bilingual.docx)
- [研讀摘要 PDF](A63_summary.pdf)
- [研讀摘要 Word](A63_summary.docx)
- [DOI](https://doi.org/10.18653/v1/2024.naacl-long.20)
