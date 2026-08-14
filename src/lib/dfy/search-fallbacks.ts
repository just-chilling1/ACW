import { APP_NICHES, detectNicheFromText, type NicheId } from "@/lib/niches";
import { isRealPostUrl } from "./post-url";
import { isUsableReplyTarget } from "./post-quality";
import type { OfferSnapshot, SocialPost } from "./types";

/** Curated real Reddit comment permalinks used when live search + DB seeds are empty. */
const FALLBACK_POSTS: Record<NicheId, SocialPost[]> = {
    weight_loss: [
        { id: "fb-wl-1", platform: "Reddit", title: "L Tyrosine and L Theanine for appetite and cravings", text: "Has anyone tried L-Tyrosine and L-Theanine for reducing appetite? Looking for real experiences with amino acid supplements that help with cravings.", url: "https://www.reddit.com/r/Supplements/comments/1oyicqr/l_tyrosine_and_l_theanine/", engagement: 342 },
        { id: "fb-wl-2", platform: "Reddit", title: "Almonds for appetite control - largest study of its kind", text: "Australian researchers found that including almonds in an energy restricted diet helped people lose weight. What natural appetite approaches worked for you?", url: "https://www.reddit.com/r/intermittentfasting/comments/16mzi0l/in_the_largest_study_of_its_kind_australian/", engagement: 456 },
        { id: "fb-wl-3", platform: "Reddit", title: "Appetite Suppression vs High Metabolism weight loss strategy", text: "What's the better approach — suppressing appetite or boosting metabolism? Looking for practical advice that actually sticks.", url: "https://www.reddit.com/r/raypeat/comments/1if6tsg/appetite_supression_vs_high_metabolism_weight/", engagement: 287 },
        { id: "fb-wl-4", platform: "Reddit", title: "Wegovy or any weight loss injectable experience?", text: "Looking for real experiences with weight loss solutions and natural alternatives for appetite control.", url: "https://www.reddit.com/r/IrishWomensHealth/comments/1qzd7ui/wegovy_or_any_weight_loss_injectable_experience/", engagement: 521 },
        { id: "fb-wl-5", platform: "Reddit", title: "Zepbound / GLP-1 muscle loss concerns", text: "Worried about losing muscle while losing weight. What are people doing to protect lean mass?", url: "https://www.reddit.com/r/Zepbound/comments/1omi2rx/", engagement: 398 },
        { id: "fb-wl-6", platform: "Reddit", title: "Fitness after 40 — preserving muscle while cutting", text: "Trying to lose fat without sacrificing muscle. What training and nutrition approaches worked for you?", url: "https://www.reddit.com/r/fitness40plus/comments/1pj1yek/", engagement: 312 },
        { id: "fb-wl-7", platform: "Reddit", title: "Aging and muscle loss — what actually helps?", text: "Noticing more muscle loss with age. Looking for practical supplement and training recommendations.", url: "https://www.reddit.com/r/Aging/comments/1nwvlng/", engagement: 267 },
        { id: "fb-wl-8", platform: "Reddit", title: "Proactive health for sarcopenia risk", text: "Family history of muscle loss. What proactive steps are worth taking for strength and protein intake?", url: "https://www.reddit.com/r/ProactiveHealth/comments/1r8h85e/", engagement: 221 },
    ],
    make_money_online: [
        { id: "fb-mmo-1", platform: "Reddit", title: "Most AI monetization advice is BS - I spent 3 months testing ChatGPT & Midjourney", text: "I spent 3 months testing ChatGPT and Midjourney for freelance writing and made $750 profit. Looking for other realistic workflows.", url: "https://www.reddit.com/r/AIContentAutomators/comments/1qzgzp3/most_ai_monetization_advice_is_bs_i_spent_3/", engagement: 1102 },
        { id: "fb-mmo-2", platform: "Reddit", title: "I tested using AI to make money for 30 days. Here's what actually worked.", text: "After 30 days of testing various AI money-making methods, here are the results. Curious what worked for others.", url: "https://www.reddit.com/r/passive_income/comments/1r4txwl/i_tested_using_ai_to_make_money_for_30_days_heres/", engagement: 892 },
        { id: "fb-mmo-3", platform: "Reddit", title: "Real talk, who in here is actually making money with an AI side hustle?", text: "I want to hear from people who are ACTUALLY making money with AI tools. Real numbers, real methods.", url: "https://www.reddit.com/r/sidehustle/comments/1r5o1c9/real_talk_who_in_here_is_actually_making_money/", engagement: 723 },
        { id: "fb-mmo-4", platform: "Reddit", title: "Realistic ways to make money with AI in 2025 (my action plan)", text: "Here's my realistic action plan for making money with AI. Looking for feedback from people further along.", url: "https://www.reddit.com/r/thesidehustle/comments/1jfnz7d/realistic_ways_to_make_money_with_ai_in_2025_my/", engagement: 654 },
        { id: "fb-mmo-5", platform: "Reddit", title: "6 ways to monetize your expertise using AI", text: "Here are 6 practical ways to use AI tools to monetize your existing skills. What would you add?", url: "https://www.reddit.com/r/passive_income/comments/1q5pj94/6_ways_to_monetize_your_expertise_using_ai_in_2026/", engagement: 367 },
        { id: "fb-mmo-6", platform: "Reddit", title: "Kit Free-tier vs Sender Free-tier? Which one for a startup?", text: "Need email automation and room to grow for a small online business. Which free tier is better?", url: "https://www.reddit.com/r/Emailmarketing/comments/1r3fwkb/kit_freetier_vs_sender_freetier_which_one_to_go/", engagement: 345 },
        { id: "fb-mmo-7", platform: "Reddit", title: "Go-to ecommerce email marketing software?", text: "Comparing tools for ecommerce email automation and Shopify integration. Budget is flexible for the right fit.", url: "https://www.reddit.com/r/ecommerce/comments/1r83pxc/goto_ecommerce_email_marketing_software/", engagement: 678 },
        { id: "fb-mmo-8", platform: "Reddit", title: "Wix and Mailchimp integration - worth it?", text: "Considering Mailchimp for email marketing with a small creator site. Better options for ~1k subscribers?", url: "https://www.reddit.com/r/WIX/comments/1qpj6oj/wix_mailchimp/", engagement: 234 },
    ],
    health_fitness: [
        { id: "fb-hf-1", platform: "Reddit", title: "Muscle loss / sarcopenia prevention tips", text: "Looking for practical ways to slow muscle loss — training, protein, and supplements that actually help.", url: "https://www.reddit.com/r/immortalists/comments/1o9fz7s/", engagement: 412 },
        { id: "fb-hf-2", platform: "Reddit", title: "Aging and lean mass — what worked for you?", text: "Noticing strength dropping with age. What training or nutrition changes made a difference?", url: "https://www.reddit.com/r/Aging/comments/1k6s6iv/", engagement: 334 },
        { id: "fb-hf-3", platform: "Reddit", title: "Protein powder without bloating?", text: "Every protein I try makes me bloated. What brands or types worked for you?", url: "https://www.reddit.com/r/veganfitness/comments/1i0ezfn/", engagement: 378 },
        { id: "fb-hf-4", platform: "Reddit", title: "Beginner fitness consistency tips", text: "I keep starting and stopping workouts. What helped you stay consistent as a beginner?", url: "https://www.reddit.com/r/beginnerfitness/comments/1kujup5/", engagement: 445 },
        { id: "fb-hf-5", platform: "Reddit", title: "Natural joint pain supplements", text: "Morning stiffness is getting worse. What natural approaches actually helped your joints?", url: "https://www.reddit.com/r/Osteoarthritis/comments/1qgqh27/", engagement: 356 },
        { id: "fb-hf-6", platform: "Reddit", title: "Afternoon energy crash — supplements that help?", text: "I crash hard around 2pm every day. What supplements or habits fixed this for you?", url: "https://www.reddit.com/r/Supplements/comments/1t76y9r/", engagement: 423 },
        { id: "fb-hf-7", platform: "Reddit", title: "Biohacking energy without jitters", text: "Looking for natural options for focus and energy that do not wreck sleep.", url: "https://www.reddit.com/r/Biohackers/comments/1bjgunp/", engagement: 312 },
        { id: "fb-hf-8", platform: "Reddit", title: "Home workout plan that actually sticks", text: "Tried multiple programs and quit. What simple plan worked long-term for you?", url: "https://www.reddit.com/r/workout/comments/1mglpnj/", engagement: 389 },
    ],
    beauty_skincare: [
        { id: "fb-bs-1", platform: "Reddit", title: "Skincare routine that finally helped with acne", text: "Been dealing with breakouts for years. What products or routines actually made a visible difference?", url: "https://www.reddit.com/r/SkincareAddiction/comments/1g9yy09/", engagement: 567 },
        { id: "fb-bs-2", platform: "Reddit", title: "Asian beauty routine recommendations", text: "Overwhelmed by serums and steps. Looking for a simpler routine that still works for texture and glow.", url: "https://www.reddit.com/r/AsianBeauty/comments/1saand9/", engagement: 423 },
        { id: "fb-bs-3", platform: "Reddit", title: "Korean skincare for beginners", text: "Want to start a minimal K-beauty routine. What are the must-haves vs. hype?", url: "https://www.reddit.com/r/koreanskincare/comments/1gc4zuu/", engagement: 389 },
        { id: "fb-bs-4", platform: "Reddit", title: "Skincare after 40 — what is actually worth it?", text: "Fine lines and dull skin are getting worse. What products earned a permanent spot in your routine?", url: "https://www.reddit.com/r/AskWomenOver40/comments/1kmzdh0/", engagement: 445 },
        { id: "fb-bs-5", platform: "Reddit", title: "Hygiene / skin barrier basics that helped", text: "I keep stripping my barrier. Looking for gentle approaches that still clear acne.", url: "https://www.reddit.com/r/hygiene/comments/1tie19b/", engagement: 312 },
        { id: "fb-bs-6", platform: "Reddit", title: "Asian beauty haul — what would you repurchase?", text: "Tried a bunch of products with mixed results. What is actually worth repurchase money?", url: "https://www.reddit.com/r/AsianBeauty/comments/1ozhaco/", engagement: 278 },
        { id: "fb-bs-7", platform: "Reddit", title: "Simple skincare for dry flaky skin", text: "Nothing seems to hydrate long-term. Affordable recommendations that actually stick?", url: "https://www.reddit.com/r/SkincareAddiction/comments/190xdzc/", engagement: 345 },
        { id: "fb-bs-8", platform: "Reddit", title: "Asian beauty essentials for texture", text: "Looking for a short list of products that improved texture without a 10-step routine.", url: "https://www.reddit.com/r/AsianBeauty/comments/11yoh3r/", engagement: 298 },
    ],
    relationships: [
        { id: "fb-rel-1", platform: "Reddit", title: "Habits that keep a marriage strong", text: "Looking for practical daily habits that helped couples stay connected.", url: "https://www.reddit.com/r/HappyMarriages/comments/1jfbm0o/", engagement: 445 },
        { id: "fb-rel-2", platform: "Reddit", title: "How to rebuild communication in marriage", text: "We keep having the same arguments. Looking for resources that actually helped couples reconnect.", url: "https://www.reddit.com/r/Marriage/comments/1iru41e/", engagement: 512 },
        { id: "fb-rel-3", platform: "Reddit", title: "Relationship advice that is actually useful", text: "Looking for practical advice beyond clichés for rebuilding trust and communication.", url: "https://www.reddit.com/r/AskReddit/comments/1u4rgbj/", engagement: 298 },
        { id: "fb-rel-4", platform: "Reddit", title: "Conflict patterns in long-term relationships", text: "Same fight on loop. Looking for frameworks or books that improved how we talk.", url: "https://www.reddit.com/r/Marriage/comments/1k6ru0d/", engagement: 334 },
        { id: "fb-rel-5", platform: "Reddit", title: "AskMen: advice on healthier relationships", text: "Tired of repeating toxic patterns. What mindset shift actually helped?", url: "https://www.reddit.com/r/AskMen/comments/18u8hjo/", engagement: 367 },
        { id: "fb-rel-6", platform: "Reddit", title: "Wedding planning stress and partnership", text: "Planning is straining our communication. How did you stay on the same team?", url: "https://www.reddit.com/r/weddingplanning/comments/1dh583r/", engagement: 278 },
        { id: "fb-rel-7", platform: "Reddit", title: "What improved your relationship the most?", text: "Curious what single change made the biggest difference for couples here.", url: "https://www.reddit.com/r/ask/comments/1djfler/", engagement: 312 },
        { id: "fb-rel-8", platform: "Reddit", title: "Relationship advice that is actually useful", text: "Looking for practical advice beyond clichés for rebuilding trust and communication.", url: "https://www.reddit.com/r/AskReddit/comments/1u4rgbj/", engagement: 298 },
    ],
    tech_gadgets: [
        { id: "fb-tg-1", platform: "Reddit", title: "Surfshark not working with Netflix anymore", text: "Surfshark stopped working with Netflix today. Looking for alternatives that still work for streaming.", url: "https://www.reddit.com/r/surfshark/comments/1r442gn/surfshark_not_work_with_netflix_from_today/", engagement: 612 },
        { id: "fb-tg-2", platform: "Reddit", title: "Best cheap VPN right now? Any recommendation?", text: "Looking for a reliable VPN that works for streaming without breaking the bank.", url: "https://www.reddit.com/r/VPN_Question/comments/1r3rvf9/best_cheap_vpn_right_now_any_recommendation/", engagement: 834 },
        { id: "fb-tg-3", platform: "Reddit", title: "Any VPN still bypassing proxy detection?", text: "Netflix's proxy detection has gotten absurdly good. Has anyone found a service that still works?", url: "https://www.reddit.com/r/VPN_Question/comments/1pavchj/any_vpn_still_bypassing_proxy_detection/", engagement: 389 },
        { id: "fb-tg-4", platform: "Reddit", title: "What VPN works for streaming apps?", text: "Need a VPN that works reliably for streaming apps. Looking for recent user experiences.", url: "https://www.reddit.com/r/F1TV/comments/1oas3qs/what_vpn_works_on_f1_app/", engagement: 276 },
        { id: "fb-tg-5", platform: "Reddit", title: "Need help finding a comfortable ergonomic chair", text: "WFH setup is killing my back. Looking for tech/gear under $300 that actually helps.", url: "https://www.reddit.com/r/OfficeChairs/comments/1pbpb9u/need_help_finding_a_comfortable_ergonomic_chair/", engagement: 478 },
        { id: "fb-tg-6", platform: "Reddit", title: "Gaming chair vs ergonomic upgrade", text: "Current gaming chair hurts after long sessions. Better comfort options?", url: "https://www.reddit.com/r/gamingchairs/comments/1p9dgdh/currently_have_a_dps_gaming_chair_from_costco/", engagement: 412 },
        { id: "fb-tg-7", platform: "Reddit", title: "Wix and Mailchimp integration - worth it?", text: "Considering Mailchimp for email marketing with a small creator site. Better options?", url: "https://www.reddit.com/r/WIX/comments/1qpj6oj/wix_mailchimp/", engagement: 234 },
        { id: "fb-tg-8", platform: "Reddit", title: "Autonomous ErgoChair options for long desk days", text: "Comparing mesh chairs for 8+ hour computer work. What features matter most?", url: "https://www.reddit.com/r/OfficeChairs/comments/1r5su2l/autonomous_ergochair_pro_vs_ergochair_mesh_vs_pro/", engagement: 567 },
    ],
    pets: [
        { id: "fb-pet-1", platform: "Reddit", title: "Puppy training basics that actually stick", text: "First-time puppy owner. Looking for training approaches that work without overwhelm.", url: "https://www.reddit.com/r/puppy101/comments/1g3fsys/", engagement: 423 },
        { id: "fb-pet-2", platform: "Reddit", title: "Puppy101 — settling a reactive pup", text: "Neighborhood walks are stressful. What training tips helped reduce reactivity?", url: "https://www.reddit.com/r/puppy101/comments/1gixblx/", engagement: 389 },
        { id: "fb-pet-3", platform: "Reddit", title: "Puppy schedule and crate training", text: "Need a realistic daily routine for a new puppy. What worked in the first months?", url: "https://www.reddit.com/r/puppy101/comments/1ly71pv/", engagement: 356 },
        { id: "fb-pet-4", platform: "Reddit", title: "Puppy biting and manners", text: "Teething and jumping are out of control. Looking for practical training resources.", url: "https://www.reddit.com/r/puppy101/comments/1olwysc/", engagement: 312 },
        { id: "fb-pet-5", platform: "Reddit", title: "Dog training for beginners", text: "Want a clear training plan for a new dog. What programs or methods helped most?", url: "https://www.reddit.com/r/Dogtraining/comments/13ngrw4/", engagement: 445 },
        { id: "fb-pet-6", platform: "Reddit", title: "Positive reinforcement training tips", text: "Looking for positive training approaches that stick with a stubborn dog.", url: "https://www.reddit.com/r/Dogtraining/comments/146jzdn/", engagement: 378 },
        { id: "fb-pet-7", platform: "Reddit", title: "General dog care advice for new owners", text: "Just got my first dog and feeling overwhelmed. What guides made things easier?", url: "https://www.reddit.com/r/dogs/comments/1dxk75w/", engagement: 298 },
        { id: "fb-pet-8", platform: "Reddit", title: "Local dog training recommendations thread", text: "Curious what training approaches people recommend for first-time owners.", url: "https://www.reddit.com/r/akron/comments/1i9misx/", engagement: 187 },
    ],
    home_garden: [
        { id: "fb-hg-1", platform: "Reddit", title: "Beginner vegetable garden setup", text: "Complete beginner wanting to grow herbs and veggies. What's the simplest way to start?", url: "https://www.reddit.com/r/vegetablegardening/comments/1j0atkm/", engagement: 512 },
        { id: "fb-hg-2", platform: "Reddit", title: "Vegetable gardening tips for beginners", text: "Overwhelmed by advice online. Looking for one clear starter approach.", url: "https://www.reddit.com/r/vegetablegardening/comments/1cvx73z/", engagement: 445 },
        { id: "fb-hg-3", platform: "Reddit", title: "Gardening Australia beginner tips", text: "Want practical beginner advice for a small home garden.", url: "https://www.reddit.com/r/GardeningAustralia/comments/1qis8vs/", engagement: 367 },
        { id: "fb-hg-4", platform: "Reddit", title: "PNW gardening for first season", text: "First season gardening — what crops and herbs are realistic to start with?", url: "https://www.reddit.com/r/pnwgardening/comments/1jxw769/", engagement: 334 },
        { id: "fb-hg-5", platform: "Reddit", title: "PNW garden planning basics", text: "Looking for a simple plan for herbs and useful plants in a small yard.", url: "https://www.reddit.com/r/pnwgardening/comments/1d89u7w/", engagement: 289 },
        { id: "fb-hg-6", platform: "Reddit", title: "Indoor garden kit recommendations", text: "Only have indoor space. Looking for kits or setups that actually work for herbs.", url: "https://www.reddit.com/r/IndoorGarden/comments/15wqgqb/", engagement: 412 },
        { id: "fb-hg-7", platform: "Reddit", title: "Growing cooking herbs at home", text: "Want kitchen herbs that are hard to kill. What should beginners start with?", url: "https://www.reddit.com/r/Cooking/comments/1snbkeh/", engagement: 278 },
        { id: "fb-hg-8", platform: "Reddit", title: "Beginner gardening guide recommendations", text: "Looking for a clear beginner gardening resource or kit worth following.", url: "https://www.reddit.com/r/gardening/comments/1hwooep/", engagement: 356 },
    ],
};

export function detectOfferNiche(snapshot: OfferSnapshot, audienceMode?: string): NicheId {
    if (audienceMode && audienceMode !== "auto") {
        const niche = APP_NICHES.find((n) => n.id === audienceMode);
        if (niche) return niche.id;
    }

    const combined = [
        snapshot.productName,
        snapshot.category,
        snapshot.mainPromise,
        ...snapshot.painPoints,
        ...snapshot.primaryBenefits,
    ].join(" ");

    return detectNicheFromText(combined);
}

export function getFallbackPostsForNiche(nicheId: NicheId): SocialPost[] {
    const posts = FALLBACK_POSTS[nicheId] || FALLBACK_POSTS.make_money_online;
    return posts.filter((p) => isRealPostUrl(p.url) && isUsableReplyTarget(p));
}

export function getFallbackPostsForOffer(snapshot: OfferSnapshot, audienceMode?: string): SocialPost[] {
    const nicheId = detectOfferNiche(snapshot, audienceMode);
    const nichePosts = FALLBACK_POSTS[nicheId] || [];
    const seen = new Set<string>();
    const combined: SocialPost[] = [];

    for (const post of nichePosts) {
        if (!isRealPostUrl(post.url) || !isUsableReplyTarget(post)) continue;
        const key = post.id || post.url;
        if (key && !seen.has(key)) {
            seen.add(key);
            combined.push(post);
        }
    }

    if (combined.length < 15) {
        for (const posts of Object.values(FALLBACK_POSTS)) {
            for (const post of posts) {
                if (!isRealPostUrl(post.url) || !isUsableReplyTarget(post)) continue;
                const key = post.id || post.url;
                if (key && !seen.has(key)) {
                    seen.add(key);
                    combined.push(post);
                }
                if (combined.length >= 15) break;
            }
            if (combined.length >= 15) break;
        }
    }

    return combined.slice(0, 15);
}

export function buildOfferRelevanceTerms(snapshot: OfferSnapshot): string[] {
    return [
        snapshot.productName,
        snapshot.category,
        snapshot.mainPromise,
        ...snapshot.painPoints,
        ...snapshot.primaryBenefits,
        ...snapshot.contentAngles,
    ]
        .flatMap((t) => t.toLowerCase().split(/\s+/))
        .filter((w) => w.length > 3);
}

export function scoreOfferRelevance(text: string, snapshot: OfferSnapshot): number {
    const lower = text.toLowerCase();
    const terms = buildOfferRelevanceTerms(snapshot);
    let score = 0;

    for (const term of terms) {
        if (term.length > 4 && lower.includes(term)) score += 12;
        else if (term.length > 3 && lower.includes(term.slice(0, Math.min(term.length, 8)))) score += 6;
    }

    const niche = APP_NICHES.find((n) => n.id === detectOfferNiche(snapshot));
    if (niche) {
        for (const term of niche.searchTerms) {
            if (lower.includes(term)) score += 8;
        }
    }

    if (/best|recommend|how|help|looking|need|advice|which|what|review|worth/.test(lower)) score += 10;
    return score;
}
