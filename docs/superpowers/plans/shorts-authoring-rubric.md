# Shorts Authoring Rubric

Read this before writing any script. Then read
`src/lib/vault/content/shorts/make-money-online.ts` as the quality reference.

## Hard rules (the validator enforces these)

- Exactly 5 scripts per niche, one per format: Three mistakes, Myth vs truth,
  POV story, Screen demo, Before and after.
- `durationSeconds` 25 to 45. 4 to 6 beats.
- `hook` at most 140 characters, spoken from 0:00 to the first beat's start.
- The first beat starts between 2 and 5 seconds. Beats are contiguous with no
  gaps or overlaps. The last beat ends exactly at `durationSeconds`.
- `caption` contains `__LINK__` exactly once, at most 2200 characters.
- `hook`, `cta`, and every beat field contain zero `__LINK__`.
- 3 to 8 hashtags, no `#` prefix, no whitespace inside a tag.
- No duplicate hooks or captions anywhere in the library.

## Voice

Match the existing vault content in `src/lib/vault/content/<niche>.ts`. Plain,
concrete, specific. Short sentences. No hype, no "secret", no "crazy hack", no
fake urgency, no invented statistics. Name the real mistake and the real fix.

Be honest about limits. On health, money, and pet-health topics, avoid
guarantees and defer to a professional where the existing Quora answers do.
Never promise income, weight loss, or medical outcomes.

## Faceless only

Every `visual` must be achievable without appearing on camera: stock footage,
a screen recording, a plain text card, a product or object shot, or a simple
graphic. Never write "look at the camera", "point at yourself", or anything
requiring a face or a presenter.

## The link

Spoken lines never read a URL aloud. The `cta` points to the bio. The
`caption` carries `__LINK__` once, which serves as the YouTube Shorts
description and as the link the user pastes into their bio.

## Generic to the niche

Scripts must work for any offer in the niche. Never name a specific product,
brand, price, or company. Say "the plan", "the routine", "the tool" and let
the user's link supply the specifics.

## Per-beat shape

- `voiceover`: what is said. One to three sentences.
- `onScreen`: the burned-in overlay. Short. Under about 40 characters.
- `visual`: the concrete shot direction. Name what is on screen.
