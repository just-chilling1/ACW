# DFY Reply Cards + 60-Per-Niche Seed Design

**Date:** 2026-08-13  
**Status:** Approved (user chose Approach 1; directed to implement)

## Summary

Upgrade DFY Hybrid replies to a BlackBox-style card browse UX with View modal + per-user Mark done, preload all niches for instant switching, improve the saved-link picker, and wipe/reseed **60 varied-tone replies per niche**.

## Decisions

| Topic | Choice |
|---|---|
| Done persistence | Per-user DB (`dfy_reply_completions`) |
| Done UI | Stay in grid, dimmed + Done badge, can unmark |
| View | Modal with full reply, Copy, Go to Post |
| Existing seeds | Wipe and reseed all |
| Card look | BlackBox layout pattern in CashWave dark/gold theme |
| Load speed | One-shot fetch of all niches + in-memory cache |
| Link picker | Searchable combobox |

## Data

### `dfy_reply_completions`
- `user_id` UUID FK auth.users
- `reply_id` UUID FK dfy_seed_replies
- `completed_at` timestamptz
- PRIMARY KEY (`user_id`, `reply_id`)
- RLS: user can select/insert/delete own rows only

### Seed target
- 8 niches × 60 replies = 480
- Rotate 8 tones: helpful, short, detailed, curiosity, empathetic, expert, soft_sell, skeptical_friend
- Prefer unique real Reddit posts; if discovery yields fewer than 60, add multiple tone variants per post until 60

## APIs
- `GET /api/dfy/replies/seeded?all=1` → `{ byNiche: Record<niche, replies[]> }`
- `GET /api/dfy/replies/completions` → `{ replyIds: string[] }`
- `POST /api/dfy/replies/completions` `{ replyId }` → mark done
- `DELETE /api/dfy/replies/completions?replyId=` → unmark

## UI
- Compact cards: niche label, title, tone, context preview; View + Mark done
- Modal for full body
- Prefetch all niches + completions on mount
- Searchable link combobox over saved offers

## Out of scope
- `/dfy/custom`
- Links Library page
- Light BlackBox cream theme
