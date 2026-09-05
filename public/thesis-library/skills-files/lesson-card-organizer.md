---
name: lesson-card-organizer
description: Creates, reviews, names, organizes, and archives teaching knowledge cards from initial brief through local and Google Drive delivery. Use when the user says「整理圖卡」, asks for a 教案整理助理 Agent, wants knowledge-card series or execution-manual cards, or needs cards checked, versioned, grouped by case and style, uploaded to TAR_私房圖卡, and verified. Works with Codex and Claude when suitable image-generation and Google Drive tools are available.
---

# 教案整理助理 Agent

Treat「整理圖卡」as the direct trigger. Complete the workflow from intake to verified archive; do not stop after image generation.

## Progress checklist

Track these stages internally and complete every applicable item:

```text
- [ ] 1. Parse the brief and source material
- [ ] 2. Plan the card series and content hierarchy
- [ ] 3. Create or collect the final cards
- [ ] 4. Run brand, content, and visual QA
- [ ] 5. Apply final filenames
- [ ] 6. Preserve a structured local archive
- [ ] 7. Compare against the Drive archive
- [ ] 8. Create case and series folders as needed
- [ ] 9. Upload only missing or versioned files
- [ ] 10. Read back and report the verified result
```

## 1. Parse the brief

Extract the case name, teaching purpose, audience, source material, requested card count, visual series, and deliverable format. Use the user's supplied wording as the source of truth.

If creating cards, read [references/brand-and-visual-rules.md](references/brand-and-visual-rules.md). If only archiving approved cards, skip creation and begin at QA.

## 2. Plan the series

Turn the material into a small teaching sequence instead of repeating the same summary. For a four-card execution manual, default to:

1. Role, problem, and intended outcome.
2. Inputs, preparation, and task handoff.
3. Decision logic, operating steps, and safety boundaries.
4. Verification, result, teaching insight, and reusable method.

Keep each visual series internally consistent. Different series may use different styles but must present the same verified facts.

## 3. Create or collect cards

Use the available raster-image generation/editing tool when the user requests designed cards. Issue one generation request per distinct card. Preserve exact Traditional Chinese copy, series numbering, the user's mascot identity, and the permanent brand signature.

When the environment lacks image-generation capability, prepare the complete card copy and layout specification, clearly report the missing capability, and do not claim the images were created.

## 4. Run QA before archiving

Read [references/qa-checklist.md](references/qa-checklist.md) and inspect every final card. Do not archive a card as final when it is missing the brand signature, uses the wrong mascot, has cropped text, has an incorrect sequence number, or contains material factual errors.

Fix correctable issues when authorized. Otherwise place the card in `需要處理` and report the exact problem.

## 5. Name and organize

Read [references/naming-and-folders.md](references/naming-and-folders.md). Use one case folder per project and one subfolder per visual series. Never place a case's cards loose in the Drive root.

## 6. Preserve the local archive

Keep final cards under the active workspace using the same case/series hierarchy used in Drive. Do not overwrite a different prior version. Use a version suffix when content changes.

## 7. Archive to Google Drive

Read [references/cloud-archive.md](references/cloud-archive.md) and [references/platforms.md](references/platforms.md).

Always list and compare before writing. Upload only missing cards. Preserve every existing Drive file. Never delete, overwrite, replace bytes, or flatten folders unless the user explicitly requests it.

## 8. Verify and report

List the case folder and every target series folder after upload. Confirm the intended filenames exist in the correct hierarchy.

Report in Taiwanese Traditional Chinese:

```text
整理圖卡完成

案例：<案例名稱>
雲端資料夾：<連結>

已上傳：<數量與檔名>
原本已有：<數量與檔名>
需要處理：<數量、檔名與原因>
本機歸檔：<路徑>
```

Lead with the result. Do not make the user ask where the files are.

## Fixed archive destination

- Root folder: `TAR_私房圖卡`
- Google Drive folder ID: `1k3GZ8r0LtiKcHw1tz12iABFaUtJU_prN`
- URL: `https://drive.google.com/drive/folders/1k3GZ8r0LtiKcHw1tz12iABFaUtJU_prN`

## Bundled assets

- Mascot identity reference: `assets/tarshar-mascot-reference.jpg`
- Modern blue style reference: `assets/style-a-modern-reference.png`
- Warm editorial style reference: `assets/style-b-editorial-reference.png`

Use assets only as references. Do not copy text or third-party branding embedded in any external reference image.
