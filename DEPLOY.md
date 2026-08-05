# AI CashWave — deployment notes

`.env.local.example` is committed as a template; copy it to `.env.local` locally (gitignored).

## Required environment variables

Set these on your host **before** `npm run build` (Next.js bakes `NEXT_PUBLIC_*` into the client bundle):

| Variable | Value |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://vbrondpoorcnjhavhfja.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Full anon key from Supabase → Settings → API |
| `NEXT_PUBLIC_SITE_URL` | `https://aicashwavemembersarea.com` |

**Important:** The anon key must include all three JWT segments (two dots). If only `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9` is set, signup/login will fail with **Invalid API key**.

After updating env vars, rebuild and redeploy:

```bash
npm run build && npm run start
```

## Supabase dashboard

Add redirect URLs in **Authentication → URL Configuration**:

- `https://aicashwavemembersarea.com/**`

See [SUPABASE_AUTH_SETUP.md](./SUPABASE_AUTH_SETUP.md).

Support email placeholder: `cashtapai@neoai.freshdesk.com` — update in `src/components/dashboard/SupportBanner.tsx` when your Freshdesk address is ready.
