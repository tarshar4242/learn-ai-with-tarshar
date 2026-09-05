---
name: convert-youtube-to-pptx
description: Convert a YouTube or Bilibili video into a fact-checked, editable PowerPoint deck by obtaining and validating captions or audio transcription, cleaning and segmenting the transcript, designing a coherent slide narrative, generating a .pptx file, and visually inspecting every slide. Use when a user pastes a YouTube, youtu.be, YouTube Shorts, bilibili.com, or b23.tv URL and asks for a presentation, slides, PPT, PPTX, teaching deck, course deck, or video summary deck.
---

# Convert YouTube or Bilibili to PPTX

Turn a YouTube or Bilibili link into an editable Traditional Chinese PowerPoint without guessing from the title or description. Treat transcript fidelity, complete coverage, and visual QA as required gates.

## Use safe defaults

When the user provides only a link, proceed without asking:

- Language: Traditional Chinese used in Taiwan
- Format: editable 16:9 `.pptx`
- Length: 10–15 slides, adjusted to content density
- Style: warm, professional teaching style from `references/default-style.md`
- Density: one teaching job and one main claim per slide
- Attribution: source details in speaker notes, not visible URLs or source logos
- Page numbers: none

Ask one concise question only when the answer materially changes the deck and cannot be inferred:

- A formal external deck needs an audience or event context.
- The user mentions a brand/template but has not provided it.
- The user explicitly asks to choose among visual styles.

If the user does not answer a nonessential style question, continue with the defaults.

## Route by evidence quality

Read `references/workflow.md` before starting.

Use the quick route only when all are true:

- public captions are available and readable;
- the video is short or structurally simple;
- the deck is not for a high-stakes external setting.

Use the verified route when any are true:

- captions are missing, incomplete, or error-prone;
- the video exceeds 15 minutes;
- names, dates, figures, quotations, or technical terms matter;
- the deck will be used for teaching, a meeting, a public talk, or publication;
- the user wants control over the structure.

Default to the verified route when uncertain.

## Execute the workflow

### 1. Inspect the source

Confirm the canonical video URL, title, duration, language, channel, and caption availability. Do not claim to have analyzed the video until transcript content has actually been obtained.

For YouTube, try the bundled caption extractor first:

```bash
python3 scripts/fetch_youtube_transcript.py "<youtube-url>" --out-dir "<work-dir>/transcript"
```

The script writes `metadata.json`, `transcript.json`, and `transcript.txt`. Prefer a manually authored caption track over automatic speech recognition, and prefer Traditional Chinese over Simplified Chinese or English when comparable tracks exist.

If the YouTube extractor fails, try an available transcript connector or browser transcript view.

For Bilibili or `b23.tv`:

1. Resolve the short URL to the canonical `bilibili.com/video/...` page.
2. Inspect the page for public subtitles and metadata.
3. If subtitles are unavailable, use the authenticated browser session to obtain the public playback audio URL, download the audio into the task work directory, and invoke the `transcribe` skill locally.
4. Extract timestamped key frames when they materially improve the deck, and crop them to remove irrelevant page chrome.

Do not ask the user for a transcript while a public audio track can be safely retrieved and transcribed. Ask for a transcript or uploaded audio/video only after the public source routes fail. Never infer substantive content from the title, thumbnail, description, comments, or chapter names.

### 2. Preserve evidence before summarizing

Keep the raw transcript unchanged. Create a cleaned working copy that:

- removes timestamps, caption duplication, filler sounds, and channel calls to action;
- preserves meaning, examples, caveats, figures, names, dates, quotations, and technical terms;
- marks uncertain caption readings instead of silently correcting them;
- retains timestamp links for all claims that may require checking.

For videos longer than 15 minutes, split by topic boundaries into roughly 10–15 minute units. Build a coverage ledger with one row per unit: time range, main idea, essential evidence, planned slide, and disposition.

### 3. Define the communication job

Write one sentence:

> By the end, [audience] should [understand/do] because [central takeaway].

Choose a cumulative narrative suited to the content. Do not turn the video into a feature inventory or a transcript pasted across slides. Each slide must advance the story.

### 4. Plan the deck

Create a slide plan before implementation. Use 10–15 slides as a default, not a quota. For each slide specify:

- audience-facing takeaway title;
- single narrative job;
- no more than 3–5 visible points;
- evidence and timestamp;
- best representation: prose, comparison, timeline, process, table, or one meaningful visual;
- speaker-note source block.

Prefer editable native text and shapes. Use diagrams only when they materially improve understanding. Never convert the whole deck into flattened slide images.

### 5. Build with the presentation workflow

Invoke the `Presentations` skill and follow it completely. When no user template is supplied, treat `references/default-style.md` as explicit visual direction.

Required presentation behaviors:

- write audience-facing Traditional Chinese;
- use source notes for every non-trivial claim and external visual;
- keep visible URLs, original channel/platform logos, and page numbers off the slides;
- use at least 50 pt for the cover title, 35 pt for slide titles, and 20–24 pt or larger for teaching body text when space permits;
- vary silhouettes every 2–3 slides without losing visual consistency;
- keep all user-editable wording as native text;
- preserve source meaning and label uncertainty as `【待確認】`.

### 6. Run three QA gates

Do not deliver until all pass.

**Evidence gate**

- Cross-check every name, number, date, quotation, formula, and technical term against the transcript.
- Confirm no claim came only from the title, description, or model memory.
- Mark unresolved items `【待確認】`; do not invent.

**Coverage gate**

- Every transcript unit maps to a slide or a documented intentional omission.
- The opening establishes why the topic matters.
- The ending resolves the opening with application, action, or implications.
- No important caveat or counterpoint was removed for neatness.

**Presentation gate**

- Render every slide and inspect each at full size.
- Fix overflow, clipping, unintended overlap, broken wrapping, weak contrast, inconsistent alignment, and blurry crops.
- Run the presentation overflow test required by the `Presentations` skill.
- Open or inspect the exported `.pptx` to confirm it is editable and not an image-only deck.

## Deliver

Return:

1. the final `.pptx`;
2. a concise verification summary covering transcript source, fact-check status, and any `【待確認】` items;
3. the cleaned transcript or coverage ledger only when useful or requested.

Do not call an unverified first draft “finished.”
