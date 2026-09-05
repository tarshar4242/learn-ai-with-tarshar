---
name: beginner-interactive-course
description: Turn notes, email digests, research summaries, study materials, or rough outlines into beginner-friendly teaching scripts and interactive review webpages. Use when the user asks to explain material for complete beginners, teach step by step with analogies and checkpoints, create self-study lessons, build visual interactive course pages, add quizzes, flashcards, glossary cards, habit trackers, or convert a completed explanation into a reusable learning experience.
---

# Beginner Interactive Course

## Quick Start

Use this skill to transform source material into a patient, beginner-first lesson and, when requested, a self-contained interactive webpage.

Prefer a single-file HTML/CSS/JS output when no framework is already present. It should open locally without a build step unless the existing project requires one.

Read `references/pedagogy.md` when designing the lesson structure, tone, checkpoints, glossary, quiz, or review flow.

Use `assets/interactive-course-template.html` as a starting point when creating a standalone webpage.

## Workflow

1. Identify the teachable units.
   - Collapse repetitive source material into 5-10 core concepts.
   - Keep the original order only when it helps learning.
   - Name each unit with a concrete learner-facing title.

2. Write the lesson script.
   - Start each important idea with a life analogy.
   - Then explain the principle in plain language.
   - Define specialist terms twice: first plain-language, then formal definition.
   - End each unit with a short checkpoint: "停一下，整理重點".

3. Turn concepts into practice.
   - Add a smallest possible action for each unit.
   - Add reflection prompts for places where learners commonly get stuck.
   - If the material is habit-oriented, include daily/weekly trackers.

4. Build the interactive page when requested.
   - Include lesson navigation, progress state, glossary cards, quiz questions, review cards, and any domain-specific tracker.
   - Use localStorage only for local progress; do not require accounts or external services.
   - Make the first screen the learning interface, not a landing page.

5. Verify the artifact.
   - Open the HTML through a local static server when browser tooling blocks `file://`.
   - Check desktop and mobile widths.
   - Test at least one navigation click, one progress action, one quiz answer, and one tracker input.
   - Reset test progress before final delivery.

## Output Requirements

For a teaching script:

- Use warm, patient Traditional Chinese if the user writes in Traditional Chinese.
- Avoid assuming technical background.
- Use "比喻 -> 原理 -> 名詞解釋 -> 重點整理" for each unit.
- Keep checkpoints short enough that a beginner can repeat them back.

For an interactive webpage:

- Use stable responsive layout constraints; avoid horizontal overflow on mobile.
- Avoid decorative-only hero pages.
- Keep cards to individual lessons, glossary entries, quiz blocks, or trackers.
- Make buttons and tabs clear: `上課`, `名詞卡`, `日課表`, `測驗`, `複習` are good defaults for Chinese learning pages.
- Persist progress locally and provide a reset control.

## Optimization Pass

After creating the first version, review for:

- Cognitive load: too many concepts per unit, unexplained terms, or long paragraphs.
- Beginner fit: missing analogy, abstract checkpoint, or formal definition appearing before plain explanation.
- Interaction value: quiz answers too obvious, tracker not tied to behavior, review cards not useful without the source.
- Frontend quality: mobile overflow, cramped buttons, nested cards, unclear active states, missing local verification.
- Reusability: repeated boilerplate that belongs in the template asset or a concise reference.
