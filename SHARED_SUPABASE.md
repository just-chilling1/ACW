# AI CashWave — Shared Supabase with 1-Tap Cashflow

AI CashWave uses the **same Supabase project** as 1-Tap Cashflow (`1tap`).

## Environment variables

Copy your existing values from the 1tap Vercel project (or local setup) into `.env.local` and the AI CashWave Vercel project:

```env
NEXT_PUBLIC_SUPABASE_URL=https://vbrondpoorcnjhavhfja.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<full anon key from Supabase → Settings → API>
NEXT_PUBLIC_SITE_URL=https://aicashwavemembersarea.com
```

The anon key must be the **full** JWT (three dot-separated parts). A partial key causes **Invalid API key** on signup/login.

Add any server-side keys your 1tap deployment uses (e.g. RapidAPI, LLM).

## Implications

- **Same accounts** — users can sign in on either domain with the same email/password.
- **Same data** — `search_history`, `keyword_variations`, `analysis_results`, onboarding state, etc. are shared.
- **`onboarding_completed` metadata** — completing onboarding on one app affects the other.

## Supabase Auth URL configuration

In **Authentication → URL Configuration**:

1. Keep `https://1tapcashflowaccess.com/**` (and localhost if used).
2. Add `https://aicashwavemembersarea.com/**` and `https://cashtapaiaccess.com/**`.

## Password reset (both products)

Use the **Reset Password** email template with `{{ .ConfirmationURL }}` so each app’s `redirectTo` in `resetPasswordForEmail` sends users to the correct domain:

- 1tap: `https://1tapcashflowaccess.com/auth/callback?next=/reset-password`
- AI CashWave: `https://cashtapaiaccess.com/auth/callback?next=/reset-password`

Do not hardcode a single domain in the template when both apps share one Supabase project.
