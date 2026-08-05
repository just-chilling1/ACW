# AI CashWave

Next.js affiliate earnings app (clone of 1-Tap Cashflow), deployed at **https://cashtapaiaccess.com**.

Uses the **same Supabase project** as 1tap — see [SHARED_SUPABASE.md](./SHARED_SUPABASE.md) and [SUPABASE_AUTH_SETUP.md](./SUPABASE_AUTH_SETUP.md).

## Setup

```bash
npm install
cp .env.local.example .env.local
# Paste the same NEXT_PUBLIC_SUPABASE_* values as the 1tap Vercel project
npm run dev
```

## Deploy

1. Push to [neoai2020/cashtapai](https://github.com/neoai2020/cashtapai).
2. Create a **new** Vercel project linked to this repo.
3. Copy environment variables from the 1tap Vercel project.
4. Add custom domain `cashtapaiaccess.com`.
5. Complete Supabase redirect URL steps in `SUPABASE_AUTH_SETUP.md`.
