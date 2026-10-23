> 紫區選用的綠區研讀快照。用途：全文檢索與用詞選擇限制；不可當作 Ctrl＋F 實驗證據。下方原筆記包含舊訪談設計或章節建議，僅保留作閱讀脈絡，不代表紫區決策。正式引述仍需對照原文頁碼。

---
updated: 2026-09-16
tags: [論文線, 文獻卡, F2, F4]
summary: Blair 與 Maron 1985 年實測 IBM STAIRS 全文檢索系統在近 4 萬份法律訴訟文件上的表現，發現 Precision 平均 79.0%、Recall 平均只有 20.0%，律師卻誤以為自己找到超過 75% 的相關文件；根本原因是使用者無法預先猜中文件裡實際用的詞。這是「詞彙不匹配」最經典的實證，同時撐住本研究不能只問使用者滿不滿意、要用任務式觀察去客觀判斷有沒有找到的方法論。全文（PDF 11 頁）已讀完。
---

# 文獻卡｜A18｜Blair-Maron1985_法律文件全文檢索實證

## 書目（DOI 查證狀態）
Blair, D. C., & Maron, M. E. (1985). An evaluation of retrieval effectiveness for a full-text document-retrieval system. *Communications of the ACM*, 28(3), 289–299. https://doi.org/10.1145/3166.3197

- DOI 查證：依派工說明已用 Crossref 查證通過（本次未重跑查證，沿用既有結果）。
- 原文取得：**已取得並全文讀完**，PDF 共 11 頁（對應印刷頁 289–299）。PDF 是掃描＋OCR 版，OCR 有明顯錯字（例如標題被辨識成「COhfPUTlNG PRACTICES」），但正文內容可讀，關鍵數字與段落已與原文逐一核對。

## 研究問題
一個大型、實際運作中（非實驗室小型測試集）的全文檢索系統，在真實的法律訴訟支援情境下，Recall（找全所有相關文件的能力）與 Precision（找到的文件裡有多少真的相關）表現如何？表現不佳的話，理論上的原因是什麼？

## 方法與樣本
- 場域：一件大型企業訴訟案的辯護支援，資料庫近 4 萬份文件（約 35 萬頁紙本文字），用 IBM STAIRS/TLS 全文檢索系統（PDF 第 1–2 頁／印刷頁 289–290）。
- 參與者：2 位主辯護律師提出共 51 個資訊需求，由 2 位熟悉案情與 STAIRS 的助理律師（paralegal）轉譯成正式布林查詢並實際搜尋；律師拿到取回的文件後，把每份標成「vital／satisfactory／marginally relevant／irrelevant」，不滿意就要求助理律師修改查詢再搜，直到律師書面表示滿意為止（PDF 第 3 頁／印刷頁 291）。
- Precision 計算：以律師最終滿意時所有取回文件的聯集，算相關文件占比。
- Recall 計算：因為母體中相關文件比例通常低於 2%，改用「從未取回的資料庫子集中抽樣」估計未取回相關文件數，抽樣結果交由律師做盲測評分（律師不知道自己在評的是抽樣組還是自己搜到的取回組）（PDF 第 3–5 頁／印刷頁 291–293）。
- 51 個資訊需求中 40 個算出 Precision 與 Recall，另 11 個用於檢核抽樣方法與偏誤（PDF 第 5 頁／印刷頁 293）。
- 整個實驗歷時約 6 個月，動用 2 位研究者與 6 位支援人力，總成本近 50 萬美元（PDF 第 9 頁／印刷頁 297）。

## 主要發現（附頁碼）
1. 律師事前的預期：他們認為必須、也應該能找到某資訊需求全部相關文件的至少 75%，並把這 75% 視為辯護該案「不可或缺」（essential）（PDF 第 3 頁／印刷頁 291）。
2. 實測結果：Precision 平均 79.0%（標準差 23.2，範圍 19.6%–100.0%）；Recall 平均只有 20.0%（標準差 15.9，範圍 2.8%–78.7%）。換句話說平均每取回 100 份文件裡 79 份真的相關，但相關文件裡只有 20% 真的被找到（PDF 第 5 頁／印刷頁 293）。
3. 律師的自我認知與實測落差：律師使用系統時「相信」自己找到的比例遠高於實際，作者明確寫「STAIRS could be used to retrieve only 20 percent of the relevant documents, whereas the lawyers using the system believed they were retrieving a much higher percentage (i.e., over 75 percent)」（PDF 第 5 頁／印刷頁 293）。
4. 使用者為何沒發現 Recall 這麼低：因為使用者只看得到「取回」的那組文件，而那組裡相關比例（Precision）本來就有 8 成左右，看起來效果不錯；他們看不到「沒被取回」的那一大塊相關文件，所以無從得知自己漏掉了什麼（PDF 第 7 頁／印刷頁 295）。
5. Recall 低的理論根源：全文檢索的預設是「使用者能事先準確猜到目標文件裡究竟會用哪些確切字詞」，但這個假設在實務上站不住腳——同一件「意外事故」在文件裡分別被稱為 event、incident、situation、problem、difficulty，用詞會隨當事人的立場（究竟是批評者還是可能有責任的當事人）而改變，甚至只用「上週發生的事」這種完全不含關鍵詞的說法帶過（PDF 第 7 頁／印刷頁 295）。
6. 更誇張的詞彙漂移案例：研究者追蹤同一個技術問題「trap correction」，一路發現不同文件裡分別稱為「wire warp」「shunt correction system」，最後循著發明人姓名又找到「Roman circle method」與「air truck」等說法，光這一個查詢就耗掉超過 40 小時線上搜尋時間（PDF 第 7 頁／印刷頁 295）。
7. 查詢詞交集會讓 Recall 以相乘方式驟降：作者用機率模型示範，兩個詞交集查詢在中等機率假設下 Recall 只剩 0.126（Table II，PDF 第 8–9 頁／印刷頁 296–297）；若查詢詞增加到 5 個且用較寫實的機率（每項機率約 .5），Recall 只剩 0.0009，意思是資料庫裡若有 1000 份相關文件，這個查詢預期只能找到 1 份（PDF 第 9 頁／印刷頁 297）。
8. 全篇結論：全文檢索在大型實際資料庫下系統性表現不佳，早期樂觀的研究（Swanson 1960、Salton 1970）都只在小於 750 份文件的實驗性小資料庫上測試，無法類推到大型系統；資訊檢索系統「不會等比例擴大」（do not scale up），小系統上有效的策略在大系統上不必然有效，主因是輸出過載（output overload）（PDF 第 9–10 頁／印刷頁 297–298）。

## 可直接引用的原句（原文＋頁碼）
1. "It is impossibly difficult for users to predict the exact words, word combinations, and phrases that are used by all (or most) relevant documents and only (or primarily) by those documents."（PDF 第 7 頁／印刷頁 295）
   知臨譯：使用者幾乎不可能事先預測出，所有（或大部分）相關文件都會用、而且只有（或主要只有）這些文件才會用的確切字詞、詞語組合與片語。
2. "A full-text retrieval system does not give us something for nothing."（PDF 第 10 頁／印刷頁約 298，見「讀取狀態」頁碼說明）
   知臨譯：全文檢索系統不會讓你不勞而獲。

## 支撐本研究哪個面向與哪一節
- **F2 檢索機制**：發現 5、6、7（詞彙不匹配的具體案例、查詢詞交集使 Recall 驟降的機率模型）是「關鍵字全文檢索」機制性缺陷的最經典實證，直接支撐第二章 **2.3.1 詞彙不匹配**——用來說明為什麼關鍵字比對本質上要求使用者「猜中作者的用詞」，而這件事在真實語料裡幾乎做不到；可與 Furnas 1987 的 vocabulary problem 並列引用，Blair & Maron 提供的是「訴訟文件」這個真實大型場域的實測數字，Furnas 補理論框架。
- **F4 使用者**：發現 1、3、4（律師事前預期 75%、實際只有 20%、使用者靠「取回集裡相關比例高」誤判自己表現良好）支撐第三章 **3.4 研究工具與任務設計**——說明本研究為什麼不能只問受訪者「你覺得找得到嗎」「你滿不滿意」（自陳滿意度不可靠，Blair & Maron 已證明使用者的主觀判斷與客觀 Recall 可以差 3.75 倍），而要設計「任務式操作觀察＋研究者事後核對是否真的找到既定答案」的方法，才能拿到接近真實的判斷依據。

## 引用限制
- 場域是 1980 年代美國企業訴訟的英文法律文件全文檢索（IBM STAIRS 布林檢索），不是台灣中高齡就業法規、也不是中文語料，不能直接類推語言與領域細節。
- 系統是純關鍵字／布林邏輯的全文檢索，完全不含任何語意向量或 AI 技術；只能拿來佐證「傳統關鍵字搜尋」這一側的詞彙不匹配問題，不能用來評論或預測 AI 語意向量檢索的表現（那需要另找 GenAI／embedding 檢索的文獻）。
- 樣本是 2 位律師、2 位助理律師、51 個資訊需求，屬單一案件的深度個案，不是具代表性的大樣本；作者自己也承認評估者（研究者本人）的搜尋能力優於一般 STAIRS 使用者，因此 20% 的 Recall 甚至可能還高估了一般使用者的實際表現。
- Recall 的估計是用抽樣推算，作者明言「no extrapolation to the entire database could be made from these Recall calculations」（PDF 第 5 頁／印刷頁 293），只能拿來說明量級與方向，不是精確母體值。

## 讀取狀態
全文（PDF 11 頁，對應印刷頁 289–299）已用 pymupdf 逐頁讀完，重點段落（THE TEST ENVIRONMENT、TEST RESULTS、WHY WAS RECALL SO LOW、DETERIORATION OF RECALL AS A FUNCTION OF FILE SIZE、DISCUSSION、SUMMARY）均核對過原文。

頁碼對應說明：這是掃描＋OCR 的 PDF，各頁印刷頁碼多數清晰可辨（PDF 第 1–9 頁分別對應印刷頁 289–297，逐頁遞增、與頁尾頁碼完全吻合）。PDF 第 10 頁頁尾的印刷頁碼因 OCR 誤植顯示為「299」，但依前後頁遞增規律（297 之後、且 PDF 第 11 頁頁尾清楚印著 299）判斷應為 **298** 的辨識錯誤，本卡以 298 標註並在此處註記，供之後核對原始掃描檔或找到乾淨版 PDF 時覆核。

原句 grep 驗證（對象：PDF 全文抽取後，把換行/跨行斷字以空白字元還原成連續字串，理由是原 PDF 為雙欄且逐行斷字排版，直接照行印會把單一句子切成多段）：
- 原句 1「it is impossibly difficult for users to predict the exact words, word combinations, and phrases that are used by all (or most) relevant documents and only (or primarily) by those documents」：**命中**（上下文：「...on realistically large databases. Stated succinctly, it is impossibly difficult for users to predict the exact words...primarily) by those documents, as can be seen in the following examples.」）。
- 原句 2「A full-text retrieval system does not give us something for nothing.」：**命中**（上下文：「...could be as much as 50 times larger on a full-text system than on a manually indexed system. A full-text retrieval system does not give us something for nothing. Full-text searching is one of those things, as Samuel Johnson...」）。

下一步：無待辦，此卡可直接進論文第二章 2.3.1 與第三章 3.4 引用。
