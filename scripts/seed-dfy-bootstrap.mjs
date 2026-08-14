/**
 * One-shot seed of dfy_seed_posts from curated real Reddit permalinks.
 * Run: node scripts/seed-dfy-bootstrap.mjs
 */
import { resolve } from "node:path";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

function assertSupabaseServiceRoleMatchesUrl(url, serviceKey) {
  let urlRef = "";
  try {
    urlRef = new URL(url).hostname.split(".")[0] || "";
  } catch {
    throw new Error(`Invalid NEXT_PUBLIC_SUPABASE_URL: ${url}`);
  }

  let serviceRef = "";
  try {
    const payload = JSON.parse(Buffer.from(serviceKey.split(".")[1] || "", "base64url").toString("utf8"));
    serviceRef = typeof payload.ref === "string" ? payload.ref : "";
  } catch {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not a valid JWT");
  }

  if (!urlRef || !serviceRef || urlRef !== serviceRef) {
    throw new Error(
      `Supabase project mismatch: URL is "${urlRef}" but SUPABASE_SERVICE_ROLE_KEY is for "${serviceRef || "unknown"}". ` +
        `Update SUPABASE_SERVICE_ROLE_KEY in .env.local to the service_role key from the same project as NEXT_PUBLIC_SUPABASE_URL (${urlRef}).`,
    );
  }
}

// Inline curated real Reddit permalinks for bootstrap.
const rows = [
  // weight_loss
  ["weight_loss", "Reddit", "Supplements", "L Tyrosine and L Theanine for appetite and cravings", "Has anyone tried L-Tyrosine and L-Theanine for reducing appetite?", "https://www.reddit.com/r/Supplements/comments/1oyicqr/l_tyrosine_and_l_theanine/", 342],
  ["weight_loss", "Reddit", "intermittentfasting", "Almonds for appetite control - largest study of its kind", "Australian researchers found almonds helped with appetite control.", "https://www.reddit.com/r/intermittentfasting/comments/16mzi0l/in_the_largest_study_of_its_kind_australian/", 456],
  ["weight_loss", "Reddit", "raypeat", "Appetite Suppression vs High Metabolism weight loss strategy", "What's better — suppressing appetite or boosting metabolism?", "https://www.reddit.com/r/raypeat/comments/1if6tsg/appetite_supression_vs_high_metabolism_weight/", 287],
  ["weight_loss", "Reddit", "IrishWomensHealth", "Wegovy or any weight loss injectable experience?", "Looking for real experiences and natural alternatives for appetite control.", "https://www.reddit.com/r/IrishWomensHealth/comments/1qzd7ui/wegovy_or_any_weight_loss_injectable_experience/", 521],
  ["weight_loss", "Reddit", "Zepbound", "Zepbound / GLP-1 muscle loss concerns", "Worried about losing muscle while losing weight.", "https://www.reddit.com/r/Zepbound/comments/1omi2rx/", 398],
  ["weight_loss", "Reddit", "fitness40plus", "Fitness after 40 — preserving muscle while cutting", "Trying to lose fat without sacrificing muscle.", "https://www.reddit.com/r/fitness40plus/comments/1pj1yek/", 312],
  ["weight_loss", "Reddit", "Aging", "Aging and muscle loss — what actually helps?", "Looking for practical supplement and training recommendations.", "https://www.reddit.com/r/Aging/comments/1nwvlng/", 267],
  ["weight_loss", "Reddit", "ProactiveHealth", "Proactive health for sarcopenia risk", "What proactive steps are worth taking for strength and protein intake?", "https://www.reddit.com/r/ProactiveHealth/comments/1r8h85e/", 221],
  // make_money_online
  ["make_money_online", "Reddit", "AIContentAutomators", "Most AI monetization advice is BS", "I spent 3 months testing ChatGPT and Midjourney for freelance writing.", "https://www.reddit.com/r/AIContentAutomators/comments/1qzgzp3/most_ai_monetization_advice_is_bs_i_spent_3/", 1102],
  ["make_money_online", "Reddit", "passive_income", "I tested using AI to make money for 30 days", "After 30 days of testing various AI money-making methods.", "https://www.reddit.com/r/passive_income/comments/1r4txwl/i_tested_using_ai_to_make_money_for_30_days_heres/", 892],
  ["make_money_online", "Reddit", "sidehustle", "Real talk, who is actually making money with an AI side hustle?", "Real numbers, real methods. What are you doing?", "https://www.reddit.com/r/sidehustle/comments/1r5o1c9/real_talk_who_in_here_is_actually_making_money/", 723],
  ["make_money_online", "Reddit", "thesidehustle", "Realistic ways to make money with AI in 2025", "Here's my realistic action plan for making money with AI.", "https://www.reddit.com/r/thesidehustle/comments/1jfnz7d/realistic_ways_to_make_money_with_ai_in_2025_my/", 654],
  ["make_money_online", "Reddit", "passive_income", "6 ways to monetize your expertise using AI", "Practical ways to use AI tools to monetize existing skills.", "https://www.reddit.com/r/passive_income/comments/1q5pj94/6_ways_to_monetize_your_expertise_using_ai_in_2026/", 367],
  ["make_money_online", "Reddit", "Emailmarketing", "Kit Free-tier vs Sender Free-tier?", "Need email automation for a small online business.", "https://www.reddit.com/r/Emailmarketing/comments/1r3fwkb/kit_freetier_vs_sender_freetier_which_one_to_go/", 345],
  ["make_money_online", "Reddit", "ecommerce", "Go-to ecommerce email marketing software?", "Comparing tools for ecommerce email automation.", "https://www.reddit.com/r/ecommerce/comments/1r83pxc/goto_ecommerce_email_marketing_software/", 678],
  ["make_money_online", "Reddit", "WIX", "Wix and Mailchimp integration - worth it?", "Considering Mailchimp with a small creator site.", "https://www.reddit.com/r/WIX/comments/1qpj6oj/wix_mailchimp/", 234],
  // health_fitness
  ["health_fitness", "Reddit", "immortalists", "Muscle loss / sarcopenia prevention tips", "Practical ways to slow muscle loss.", "https://www.reddit.com/r/immortalists/comments/1o9fz7s/", 412],
  ["health_fitness", "Reddit", "Aging", "Aging and lean mass — what worked for you?", "Strength dropping with age. What helped?", "https://www.reddit.com/r/Aging/comments/1k6s6iv/", 334],
  ["health_fitness", "Reddit", "veganfitness", "Protein powder without bloating?", "Every protein I try makes me bloated.", "https://www.reddit.com/r/veganfitness/comments/1i0ezfn/", 378],
  ["health_fitness", "Reddit", "beginnerfitness", "Beginner fitness consistency tips", "I keep starting and stopping workouts.", "https://www.reddit.com/r/beginnerfitness/comments/1kujup5/", 445],
  ["health_fitness", "Reddit", "Osteoarthritis", "Natural joint pain supplements", "Morning stiffness is getting worse.", "https://www.reddit.com/r/Osteoarthritis/comments/1qgqh27/", 356],
  ["health_fitness", "Reddit", "Supplements", "Afternoon energy crash — supplements that help?", "I crash hard around 2pm every day.", "https://www.reddit.com/r/Supplements/comments/1t76y9r/", 423],
  ["health_fitness", "Reddit", "Biohackers", "Biohacking energy without jitters", "Natural options for focus and energy.", "https://www.reddit.com/r/Biohackers/comments/1bjgunp/", 312],
  ["health_fitness", "Reddit", "workout", "Home workout plan that actually sticks", "Tried multiple programs and quit.", "https://www.reddit.com/r/workout/comments/1mglpnj/", 389],
  // beauty_skincare
  ["beauty_skincare", "Reddit", "SkincareAddiction", "Skincare routine that finally helped with acne", "What products actually made a visible difference?", "https://www.reddit.com/r/SkincareAddiction/comments/1g9yy09/", 567],
  ["beauty_skincare", "Reddit", "AsianBeauty", "Asian beauty routine recommendations", "Looking for a simpler routine that still works.", "https://www.reddit.com/r/AsianBeauty/comments/1saand9/", 423],
  ["beauty_skincare", "Reddit", "koreanskincare", "Korean skincare for beginners", "What are the must-haves vs hype?", "https://www.reddit.com/r/koreanskincare/comments/1gc4zuu/", 389],
  ["beauty_skincare", "Reddit", "AskWomenOver40", "Skincare after 40 — what is actually worth it?", "Fine lines and dull skin — permanent keepers?", "https://www.reddit.com/r/AskWomenOver40/comments/1kmzdh0/", 445],
  ["beauty_skincare", "Reddit", "hygiene", "Hygiene / skin barrier basics that helped", "Looking for gentle approaches that still clear acne.", "https://www.reddit.com/r/hygiene/comments/1tie19b/", 312],
  ["beauty_skincare", "Reddit", "AsianBeauty", "Asian beauty haul — what would you repurchase?", "What is actually worth repurchase money?", "https://www.reddit.com/r/AsianBeauty/comments/1ozhaco/", 278],
  ["beauty_skincare", "Reddit", "SkincareAddiction", "Simple skincare for dry flaky skin", "Affordable recommendations that actually stick?", "https://www.reddit.com/r/SkincareAddiction/comments/190xdzc/", 345],
  ["beauty_skincare", "Reddit", "AsianBeauty", "Asian beauty essentials for texture", "Short list that improved texture.", "https://www.reddit.com/r/AsianBeauty/comments/11yoh3r/", 298],
  // relationships
  ["relationships", "Reddit", "HappyMarriages", "Habits that keep a marriage strong", "Practical daily habits that helped couples stay connected.", "https://www.reddit.com/r/HappyMarriages/comments/1jfbm0o/", 445],
  ["relationships", "Reddit", "Marriage", "How to rebuild communication in marriage", "We keep having the same arguments.", "https://www.reddit.com/r/Marriage/comments/1iru41e/", 512],
  ["relationships", "Reddit", "AskReddit", "Relationship advice that is actually useful", "Practical advice beyond clichés.", "https://www.reddit.com/r/AskReddit/comments/1u4rgbj/", 298],
  ["relationships", "Reddit", "Marriage", "Conflict patterns in long-term relationships", "Same fight on loop. Looking for frameworks.", "https://www.reddit.com/r/Marriage/comments/1k6ru0d/", 334],
  ["relationships", "Reddit", "AskMen", "AskMen: advice on healthier relationships", "Tired of repeating toxic patterns.", "https://www.reddit.com/r/AskMen/comments/18u8hjo/", 367],
  ["relationships", "Reddit", "weddingplanning", "Wedding planning stress and partnership", "Planning is straining our communication.", "https://www.reddit.com/r/weddingplanning/comments/1dh583r/", 278],
  ["relationships", "Reddit", "ask", "What improved your relationship the most?", "Curious what single change made the biggest difference.", "https://www.reddit.com/r/ask/comments/1djfler/", 312],
  ["relationships", "Reddit", "AskReddit", "Relationship advice that is actually useful", "Practical advice beyond clichés.", "https://www.reddit.com/r/AskReddit/comments/1u4rgbj/", 298],
  // tech_gadgets
  ["tech_gadgets", "Reddit", "surfshark", "Surfshark not working with Netflix anymore", "Looking for alternatives that still work for streaming.", "https://www.reddit.com/r/surfshark/comments/1r442gn/surfshark_not_work_with_netflix_from_today/", 612],
  ["tech_gadgets", "Reddit", "VPN_Question", "Best cheap VPN right now?", "Reliable VPN for streaming without breaking the bank.", "https://www.reddit.com/r/VPN_Question/comments/1r3rvf9/best_cheap_vpn_right_now_any_recommendation/", 834],
  ["tech_gadgets", "Reddit", "VPN_Question", "Any VPN still bypassing proxy detection?", "Netflix proxy detection has gotten absurdly good.", "https://www.reddit.com/r/VPN_Question/comments/1pavchj/any_vpn_still_bypassing_proxy_detection/", 389],
  ["tech_gadgets", "Reddit", "F1TV", "What VPN works for streaming apps?", "Need recent user experiences.", "https://www.reddit.com/r/F1TV/comments/1oas3qs/what_vpn_works_on_f1_app/", 276],
  ["tech_gadgets", "Reddit", "OfficeChairs", "Need help finding a comfortable ergonomic chair", "WFH setup is killing my back.", "https://www.reddit.com/r/OfficeChairs/comments/1pbpb9u/need_help_finding_a_comfortable_ergonomic_chair/", 478],
  ["tech_gadgets", "Reddit", "gamingchairs", "Gaming chair vs ergonomic upgrade", "Current gaming chair hurts after long sessions.", "https://www.reddit.com/r/gamingchairs/comments/1p9dgdh/currently_have_a_dps_gaming_chair_from_costco/", 412],
  ["tech_gadgets", "Reddit", "WIX", "Wix and Mailchimp integration - worth it?", "Considering Mailchimp for a small creator site.", "https://www.reddit.com/r/WIX/comments/1qpj6oj/wix_mailchimp/", 234],
  ["tech_gadgets", "Reddit", "OfficeChairs", "Autonomous ErgoChair options for long desk days", "Comparing mesh chairs for 8+ hour computer work.", "https://www.reddit.com/r/OfficeChairs/comments/1r5su2l/autonomous_ergochair_pro_vs_ergochair_mesh_vs_pro/", 567],
  // pets
  ["pets", "Reddit", "puppy101", "Puppy training basics that actually stick", "First-time puppy owner looking for training approaches.", "https://www.reddit.com/r/puppy101/comments/1g3fsys/", 423],
  ["pets", "Reddit", "puppy101", "Puppy101 — settling a reactive pup", "Neighborhood walks are stressful.", "https://www.reddit.com/r/puppy101/comments/1gixblx/", 389],
  ["pets", "Reddit", "puppy101", "Puppy schedule and crate training", "Need a realistic daily routine for a new puppy.", "https://www.reddit.com/r/puppy101/comments/1ly71pv/", 356],
  ["pets", "Reddit", "puppy101", "Puppy biting and manners", "Teething and jumping are out of control.", "https://www.reddit.com/r/puppy101/comments/1olwysc/", 312],
  ["pets", "Reddit", "Dogtraining", "Dog training for beginners", "Want a clear training plan for a new dog.", "https://www.reddit.com/r/Dogtraining/comments/13ngrw4/", 445],
  ["pets", "Reddit", "Dogtraining", "Positive reinforcement training tips", "Looking for positive training approaches.", "https://www.reddit.com/r/Dogtraining/comments/146jzdn/", 378],
  ["pets", "Reddit", "dogs", "General dog care advice for new owners", "Just got my first dog and feeling overwhelmed.", "https://www.reddit.com/r/dogs/comments/1dxk75w/", 298],
  ["pets", "Reddit", "akron", "Local dog training recommendations thread", "What training approaches do people recommend?", "https://www.reddit.com/r/akron/comments/1i9misx/", 187],
  // home_garden
  ["home_garden", "Reddit", "vegetablegardening", "Beginner vegetable garden setup", "Complete beginner wanting to grow herbs and veggies.", "https://www.reddit.com/r/vegetablegardening/comments/1j0atkm/", 512],
  ["home_garden", "Reddit", "vegetablegardening", "Vegetable gardening tips for beginners", "Looking for one clear starter approach.", "https://www.reddit.com/r/vegetablegardening/comments/1cvx73z/", 445],
  ["home_garden", "Reddit", "GardeningAustralia", "Gardening Australia beginner tips", "Practical beginner advice for a small home garden.", "https://www.reddit.com/r/GardeningAustralia/comments/1qis8vs/", 367],
  ["home_garden", "Reddit", "pnwgardening", "PNW gardening for first season", "What crops and herbs are realistic to start with?", "https://www.reddit.com/r/pnwgardening/comments/1jxw769/", 334],
  ["home_garden", "Reddit", "pnwgardening", "PNW garden planning basics", "Simple plan for herbs in a small yard.", "https://www.reddit.com/r/pnwgardening/comments/1d89u7w/", 289],
  ["home_garden", "Reddit", "IndoorGarden", "Indoor garden kit recommendations", "Kits or setups that actually work for herbs.", "https://www.reddit.com/r/IndoorGarden/comments/15wqgqb/", 412],
  ["home_garden", "Reddit", "Cooking", "Growing cooking herbs at home", "Kitchen herbs that are hard to kill.", "https://www.reddit.com/r/Cooking/comments/1snbkeh/", 278],
  ["home_garden", "Reddit", "gardening", "Beginner gardening guide recommendations", "Clear beginner gardening resource worth following.", "https://www.reddit.com/r/gardening/comments/1hwooep/", 356],
];

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  try {
    assertSupabaseServiceRoleMatchesUrl(url, key);
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const payload = rows.map(([niche, platform, subreddit, title, body, postUrl, engagement]) => ({
    niche,
    platform,
    subreddit,
    title,
    body,
    url: postUrl.endsWith("/") ? postUrl : `${postUrl}/`,
    engagement,
    active: true,
    verified_at: new Date().toISOString(),
  }));

  const { data, error } = await supabase
    .from("dfy_seed_posts")
    .upsert(payload, { onConflict: "url", ignoreDuplicates: false })
    .select("id, niche");

  if (error) {
    console.error("Upsert failed:", error.message);
    process.exit(1);
  }

  const counts = {};
  for (const row of data || []) {
    counts[row.niche] = (counts[row.niche] || 0) + 1;
  }
  console.log(`Upserted ${data?.length || 0} seed posts`);
  console.log(counts);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
