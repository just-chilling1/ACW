# Vercel deployment checklist

## 1. Import project

- Vercel Dashboard → **Add New** → **Project**
- Import Git repo: `neoai2020/cashtapai`
- Framework: Next.js (auto-detected)

## 2. Environment variables

Copy from the existing **1tap** Vercel project (Settings → Environment Variables):

| Variable | Notes |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Same as 1tap |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same as 1tap |
| Any RapidAPI / LLM keys | Same as 1tap if used in production |

Apply to **Production**, **Preview**, and **Development**.

## 3. Custom domain

- Project → **Settings** → **Domains**
- Add `cashtapaiaccess.com` (and `www.cashtapaiaccess.com` if needed)
- Point DNS at your registrar per Vercel’s instructions (CNAME to `cname.vercel-dns.com` or A records shown in the UI)

## 4. Supabase

Complete [SUPABASE_AUTH_SETUP.md](./SUPABASE_AUTH_SETUP.md) before testing forgot-password in production.

## 5. Smoke test

- [ ] `https://cashtapaiaccess.com/login` shows **AI CashWave**
- [ ] Sign in with an existing 1tap user works
- [ ] Forgot password email redirects to `cashtapaiaccess.com`
