# AI CashWave — Training Video Setup (Phase 1)

**Software slug:** `ai-cashwave`  
**Repo:** `c:\Users\gt\Desktop\cashtapai`  
**Product URL:** https://cashtapaiaccess.com  
**Output folder:** `training-video-system/ai-cashwave/`  
**Mined:** 2026-08-05 (latest `main`, ff-only pull confirmed)

---

## 1.1 Product Fact Sheet

| Field | Value |
|---|---|
| **Product name** | AI CashWave |
| **Tagline (onboarding)** | High-intent ads. Replies that convert. |
| **Promise** | Find real conversations on Reddit & YouTube, get AI-written replies with your affiliate link, earn commissions — plus ready-made DFY replies, 200+ Facebook posts, and 100+ traffic sources |
| **Price** | [OWNER INPUT: exact front-end price from sales page — not in repo] |
| **Dream customer** | Complete beginner who wants affiliate income without writing skills, ad spend, or tech experience |
| **Point A** | Just bought, unsure how affiliate reply marketing works, maybe doubting the purchase |
| **Point B** | Posting daily replies & optional premium content with affiliate link out in the wild, earning commissions |
| **Vehicle** | AI CashWave member area (4-step core workflow + 3 premium tools + Training Academy) |
| **Mechanism** | Search topic → check demand → pick high-engagement ads → AI writes reply styles with your link → copy/paste to original post |
| **Unfair advantage** | AI does the writing; app finds the conversations; premium vaults skip research entirely |
| **Core loop** | Topic → demand check → select ads → generate replies → paste on Reddit/YouTube → clicks → commission |
| **First win** | Complete Step 1–4 once: one topic searched, ads selected, at least one reply copied and pasted live |
| **Proof** | FAQ cites member patterns ($100–$500/day, top earners $5k–$10k+/month); Automated Profits hero cites "2.8 million visitors" from sources — no named testimonials in repo |
| **Guarantee** | Money-back guarantee referenced on dashboard footer disclaimer context; exact terms [OWNER INPUT: sales page guarantee copy] |

---

## 1.2 Branding Map

| Old / internal / stale | Current user-facing name |
|---|---|
| CashTap / cashtapai / 1-Tap Cashflow | **AI CashWave** |
| Charge HQ (voice-reference only) | **Home** (dashboard) |
| Instant Access (FAQ) | **Instant Income** (sidebar) |
| Automated Income page title vs sidebar | Sidebar: **Automated Profits** → page H1: **Automated Income — Traffic On Autopilot** |
| BatteryProfits / Profit Loop (other products) | Never use in AI CashWave scripts |

---

## 1.3 UI Inventory (exact labels)

### Sidebar — Navigation
- Home
- Step 1: Enter Topic → `/search`
- Step 2: Check Demand → `/analysis` (locked until Step 1 done)
- Step 3: Find Ads → `/radar` (locked until Step 2 done)
- Step 4: Create Replies → `/replies` (locked until Step 3 done)
- Training → `/training`
- Scale to $1k–$5k/day → `/scale-training`
- Support → `/support`
- Logout

### Sidebar — Exclusive Offers (opens new tab)
1. **Earn $400/Day Testing New Apps** → `https://jvz4.com/c/3547097/442443/`
2. **Get Paid To Copy & Paste** → `https://jvz1.com/c/3547097/442055/`
3. **Fast Cash Training** → `https://www.breakoutai.net/5k-passive-9`

### Sidebar — Premium Features
- **Done-For-You** → `/dfy`
- **Instant Income** → `/instant`
- **Automated Profits** → `/autopilot`

### Home (`/dashboard`)
- Eyebrow: **HOME**
- Title: **Welcome to AI CashWave**
- Section: **Start Here** → Video 1 chip **VIDEO 1** — **Watch This First**
- **BonusTrainingCard** (promo between videos) — CTA: **Yes! Show Me How To Earn $1,000-$5,000 A Day**
- Video 2 chip **VIDEO 2** — **How The Money Flows**
- Another BonusTrainingCard
- Video 3 chip **VIDEO 3** — **Your 5-Minute Tour**
- Buttons: **Get Started Now — Enter Topic** | **Know More from the Training Academy**
- **Need Help?** → **Contact Support**
- Right rail (desktop): Contact Support widget, Tips, Premium Upgrades

### Core workflow pages
| Step | Eyebrow | Title | Key buttons |
|---|---|---|---|
| 1 | STEP 1 OF 4 | Enter Your Ad Topic | **Find Ads** (disabled until topic entered; loading: **Finding Ads...**) |
| 2 | STEP 2 OF 4 | Check Demand | Auto-analyzes; demand badges **High** / **Active** / **Low** |
| 3 | STEP 3 OF 4 | Find Ads | **Click to select** / **Selected**; **View original** |
| 4 | STEP 4 OF 4 | Create Replies | **Affiliate link** field; reply style labels include **Curiosity Hook** |

### Training (`/training`)
- Tabs: **Videos** | **FAQ**
- Academy placeholder titles (being replaced by this pipeline): Getting Started with AI CashWave, Advanced Strategies & Tips

### Premium pages
| Sidebar label | Page title | Subtitle |
|---|---|---|
| Done-For-You | Done-For-You **Vault** | 5 proven search angles and keywords — pick one, add your link, get ready-made replies |
| Instant Income | Instant Income: **Facebook Posts** | 200+ ready-to-post messages for Facebook groups |
| Automated Profits | Automated Income — Traffic On **Autopilot** | 100+ free traffic sources — submit once and get ongoing visitors automatically |

---

## 1.4 Free Training / Offer Surfaces

| Surface | Verbatim copy (key lines) | Destination |
|---|---|---|
| **BonusTrainingCard** (Home, between dashboard videos) | "Imagine rolling out of bed… $1,000, $3,000, or even $5,000 deposited…" → CTA **Yes! Show Me How To Earn $1,000-$5,000 A Day** | `https://www.breakoutai.net/5k-passive-9` |
| **EarningsBanner** (loading states, `offer="earnings"`) | Badge **Free Training**; headline **Multiply Your Earnings To $1,000 – $5,000 A Day**; CTA **Click Here To Learn How**; warning **Warning: this will be taken down soon** | same URL |
| **WelcomeOfferBanner** (loading states, `offer="welcome"`) | **Limited Free Training** / **Free Training: $1k–$5k/Day**; CTA **Claim My Free Spot**; scarcity **Only 2 FREE spots remaining!** | same URL |
| **Sidebar Exclusive Offers** | **Fast Cash Training** (gold title) | same URL |
| **Scale to $1k–$5k/day** nav | **Scale Your AI CashWave To $1,000+ Per Day**; CTA **Click Here To Access Training** | same URL |
| **Contact Support success** | **Watch The Free Training >>** | same URL |

**Video 01 CTA placement (real):** After Video 1 on Home, scroll to the **gold promo card** between Video 1 and Video 2 — click **Yes! Show Me How To Earn $1,000-$5,000 A Day**. Alternate path: sidebar → **Fast Cash Training** under Exclusive Offers.

**Spoken pitch (match banner):** scale to one thousand — even five thousand dollars a day; automate your workflow; limited / taken down soon.

---

## 1.5 Loading States & Free-Training Mention Map

| Video | Loading moment | Banner type | Ad? |
|---|---|---|---|
| 01 Buyer's Remorse | N/A — uses Home BonusTrainingCard CTA | BonusTrainingCard | YES (1×, Beat 10) |
| 02 Disconnect | N/A | — | NO |
| 03 Quick Overview | N/A | — | NO |
| 04 Core workflow academy | Step 1 **Finding ads...** or Step 4 **Creating replies...** | EarningsBanner | YES (1×, woven in wait) |
| 05 Done-For-You | **Finding high-ranking posts...** / **Generating replies with your link...** | WelcomeOfferBanner | YES (1×) |
| 06 Instant Income | **Preparing your Facebook posts...** / **Loading {niche} posts...** | WelcomeOfferBanner | YES (1×) |
| 07 Automated Profits | **Loading {niche} traffic sources...** | WelcomeOfferBanner | YES (1×) |

Banner sits **below** the progress bar during active loading; persists after run until dismissed (showBanner stays true).

---

## 1.6 Jargon Ledger (top terms)

| Term | Plain definition | Why you care |
|---|---|---|
| **Affiliate link** | Your special tracking URL from DigiStore24, ClickBank, etc. | Gets inserted into replies — you earn when someone buys |
| **Ad topic / keyword** | The subject people search for (e.g. "weight loss") | Starts the whole search — one or two words work best |
| **Demand / High / Active / Low** | How many conversations exist on Reddit & YouTube for that keyword | High = more people will see your reply |
| **Engagement** | Comments, upvotes, views on a post | Higher engagement = more eyeballs on your reply |
| **Curiosity Hook** | One of three AI reply styles designed for clicks | FAQ says it tends to get the most clicks |
| **Commission** | Your cut when someone buys through your link | Often $20–$100+ per sale depending on product |
| **Niche** | Category like Weight Loss, Make Money Online | Instant Income & Automated Profits filter by niche |
| **Traffic source** | A site where you submit your link once for ongoing visitors | Automated Profits library — forums, Quora, Pinterest, etc. |
| **Done-For-You Vault** | Pre-picked keywords with instant replies | Skips Steps 1–3 for speed |

---

## 1.7 Money Map

1. **Stranger** has a problem → searches Reddit / YouTube / Facebook  
2. **They find** a conversation (or Facebook post) that mentions a solution  
3. **Your reply/post** includes your affiliate link naturally  
4. **They click** → land on product sales page  
5. **They buy** → network (DigiStore24, ClickBank, etc.) pays **you commission**  
6. **Weakest link for beginners:** writing replies that sound human + finding high-traffic conversations  
7. **What AI CashWave changes:** finds conversations, scores demand, writes replies, supplies DFY keywords & Facebook posts & traffic source list  

---

## 1.8 First Win

Complete the 4-step loop once: enter topic **weight loss** (or any niche) → let demand analyze → select 3 ads on Radar → paste affiliate link → generate **Curiosity Hook** reply → copy → paste on live Reddit/YouTube thread.

---

## 1.9 Video Roster

| # | File | Track | Public title | Feature | Target |
|---|---|---|---|---|---|
| 1 | `01-buyers-remorse.md` | Dashboard | Watch This First | Post-purchase reassurance + free training CTA | 10+ min |
| 2 | `02-disconnect.md` | Dashboard | How The Money Flows | Money model + jargon | 10+ min |
| 3 | `03-quick-overview.md` | Dashboard | Your 5-Minute Tour | Shallow app map | 3–5 min |
| 4 | `04-core-four-step-workflow.md` | Academy | Getting Started with AI CashWave | Steps 1–4 full walkthrough | 5+ min |
| 5 | `05-done-for-you-vault.md` | Academy | Done-For-You Vault | Premium #1 | 5+ min |
| 6 | `06-instant-income-facebook-posts.md` | Academy | Instant Income | Premium #2 | 5+ min |
| 7 | `07-automated-profits-traffic-sources.md` | Academy | Automated Profits | Premium #3 (final) | 5+ min |

**Academy split rationale:** Core app = one job (find conversations → reply with link) = **1 video**. Three premium upgrades = **3 videos** (one each).

---

## 1.10 On-Screen Numbers (scripts must match)

- FAQ recommends **5–10 replies per day** minimum; top earners **10–20/day**
- Instant Income: **200+** Facebook posts
- Automated Profits: **100+** traffic sources; hero claims **2.8 million visitors** generated by members
- DFY: **5** curated keywords; ~**30 seconds** generate time (FAQ)
- WelcomeOfferBanner scarcity: **8 / 10 Claimed**, **Only 2 FREE spots remaining!**
- Earnings per sale: **$20–$100+** (FAQ)
- Realistic daily: **$100–$500/day** with consistent posting (FAQ)

---

## 1.11 Live Audit Notes

- **No `DEV_BYPASS_AUTH` in repo** — audit performed via source-code mining + component render paths; full Playwright pass pending auth bypass or test credentials.
- Home layout confirmed in `dashboard/page.tsx`: Video 1 → BonusTrainingCard → Video 2 → BonusTrainingCard → Video 3 (top to bottom).
- Sidebar is **left** fixed rail; dashboard quick-links/widgets on **right** at xl breakpoint.
- Workflow steps lock until prior step completed (`Sidebar.tsx` + `workflow-progress.ts`).
