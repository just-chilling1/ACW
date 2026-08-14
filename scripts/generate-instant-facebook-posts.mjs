/**
 * One-shot generator for Instant Income Facebook post catalog files.
 * Run: node scripts/generate-instant-facebook-posts.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "../src/lib/instant/content");

const STYLES = [
  "helpful",
  "short",
  "detailed",
  "curiosity",
  "empathetic",
  "expert",
  "soft_sell",
  "skeptical_friend",
];

const NICHES = [
  {
    niche: "weight_loss",
    prefix: "wl",
    exportName: "WEIGHT_LOSS_POSTS",
    file: "weight-loss.ts",
    count: 31,
    topics: [
      ["plateau checklist", "When the scale stalls for two weeks"],
      ["evening grazing", "Late-night snacks keep showing up"],
      ["walking habit", "Starting with walks before workouts"],
      ["protein at lunch", "A simple lunch upgrade"],
      ["sleep and hunger", "Sleep debt and next-day appetite"],
      ["weekend reset", "Weekends undoing weekday progress"],
      ["water first", "Drinking water before second helpings"],
      ["scale timing", "Weighing at the same time daily"],
      ["group support", "What actually helps in weight loss groups"],
      ["meal prep lite", "Prep without cooking all Sunday"],
      ["cravings journal", "Writing the craving before acting"],
      ["step count", "Adding 1,000 steps before buying gear"],
      ["label reading", "Serving size surprises on labels"],
      ["stress eating", "Stress snacks vs. actual hunger"],
      ["morning routine", "A 10-minute morning that sticks"],
      ["soda swap", "Replacing one drink, not all habits"],
      ["photo progress", "Non-scale progress people forget"],
      ["gym anxiety", "Starting without a gym membership"],
      ["family meals", "Eating differently when cooking for others"],
      ["travel weeks", "Keeping a plan on trips"],
      ["sugar crash", "Afternoon crash after sweet snacks"],
      ["portion check", "Plate size before calorie apps"],
      ["friend pressure", "Social meals without derailing"],
      ["habit stacking", "Tying walks to an existing habit"],
      ["supplement filter", "Questions before buying fat burners"],
      ["realistic goals", "Choosing a 4-week goal you can keep"],
      ["tracking fatigue", "When logging food becomes a chore"],
      ["morning weigh-in", "One weigh-in rule that reduces noise"],
      ["group etiquette", "Posting in Facebook weight loss groups"],
      ["soft start", "A gentle first week plan"],
      ["resource share", "A checklist worth saving"],
    ],
  },
  {
    niche: "make_money_online",
    prefix: "mmo",
    exportName: "MAKE_MONEY_ONLINE_POSTS",
    file: "make-money-online.ts",
    count: 32,
    topics: [
      ["method hopping", "Why beginners keep restarting"],
      ["one hour day", "What fits in a real one-hour session"],
      ["first proof", "Treating the first sale as proof, not lifestyle"],
      ["scam filter", "Red flags on income promises"],
      ["free traffic", "Starting without paid ads"],
      ["niche pick", "Picking a niche you can talk about"],
      ["daily quota", "A sticky-note daily quota"],
      ["link etiquette", "When a link belongs in a group post"],
      ["comment first", "Helping before promoting"],
      ["tool overload", "Too many tools, not enough posts"],
      ["affiliate basics", "What affiliate marketing actually is"],
      ["group rules", "Reading Facebook group rules first"],
      ["consistency", "Boring repetition beats new tactics"],
      ["click tracking", "Tracking clicks before revenue"],
      ["offer fit", "Matching offer to audience questions"],
      ["time blocks", "Protecting a work block like a class"],
      ["beginner week", "A simple first-week plan"],
      ["inbox noise", "Ignoring shiny new opportunities"],
      ["writing tips", "Writing answers people finish reading"],
      ["soft CTA", "Soft closes that do not sound salesy"],
      ["platform focus", "One platform for 30 days"],
      ["skill vs product", "Selling skills vs. promoting products"],
      ["budget zero", "Starting with zero ad spend"],
      ["feedback loop", "Using comments as product research"],
      ["burnout check", "When side hustles feel heavy"],
      ["disclosure", "Being clear about affiliate links"],
      ["weekend only", "Weekend-only schedules that still ship"],
      ["copy reuse", "Why identical posts get ignored"],
      ["learning vs doing", "Research that never ships"],
      ["audience first", "Starting from questions people ask"],
      ["resource share", "A walkthrough worth saving"],
      ["group posting", "Posting without looking like spam"],
    ],
  },
  {
    niche: "health_fitness",
    prefix: "hf",
    exportName: "HEALTH_FITNESS_POSTS",
    file: "health-fitness.ts",
    count: 31,
    topics: [
      ["sofa start", "Starting fitness from the sofa"],
      ["walking ladder", "Building minutes without a bootcamp"],
      ["joint friendly", "Options when knees complain"],
      ["energy crash", "Afternoon energy without more coffee"],
      ["sleep wind-down", "A simple evening wind-down"],
      ["home strength", "Chair and counter strength"],
      ["mobility morning", "Two minutes of morning mobility"],
      ["hydration habit", "Water timing that is realistic"],
      ["step goal", "A step goal that does not overwhelm"],
      ["rest days", "Rest without losing the streak"],
      ["label filter", "Reading supplement labels carefully"],
      ["desk stretch", "Stretches between meetings"],
      ["beginner shoes", "Shoes before fancy gear"],
      ["consistency over intensity", "Showing up vs. crushing it"],
      ["breathing reset", "A short breathing reset"],
      ["posture check", "Posture cues that are actually usable"],
      ["weekend warrior", "Avoiding Monday injuries"],
      ["family fitness", "Movement that includes kids or partners"],
      ["pain vs soreness", "Knowing when to stop"],
      ["habit slot", "Booking movement like an appointment"],
      ["tracker trap", "When trackers create pressure"],
      ["gentle cardio", "Cardio that stays conversational"],
      ["strength basics", "Three basic moves to learn first"],
      ["stretch timing", "Stretch after warm muscles"],
      ["motivation dip", "What to do when motivation dips"],
      ["group tips", "Useful posts in fitness Facebook groups"],
      ["recovery sleep", "Sleep as part of training"],
      ["outdoor walk", "Outdoor walks as the main plan"],
      ["checklist share", "A starter checklist worth saving"],
      ["small wins", "Logging tiny wins on purpose"],
      ["resource share", "A sequence worth trying"],
    ],
  },
  {
    niche: "beauty_skincare",
    prefix: "bs",
    exportName: "BEAUTY_SKINCARE_POSTS",
    file: "beauty-skincare.ts",
    count: 31,
    topics: [
      ["routine minimal", "A three-step routine that sticks"],
      ["patch test", "Patch testing before new actives"],
      ["sunscreen habit", "Making sunscreen automatic"],
      ["product pile", "Too many products, not enough patience"],
      ["dry skin winter", "Dry skin when the heat is on"],
      ["oily t-zone", "Oily T-zone without stripping"],
      ["acne patience", "Waiting through the adjustment period"],
      ["ingredient list", "Reading the first five ingredients"],
      ["night routine", "A night routine under five minutes"],
      ["morning rush", "Skincare that survives busy mornings"],
      ["fragrance caution", "Fragrance-sensitive skin notes"],
      ["retinoid start", "Starting slow with stronger products"],
      ["cleanser swap", "When cleansing feels too harsh"],
      ["moisturizer layers", "Moisturizer before makeup"],
      ["group advice", "Filtering advice in beauty groups"],
      ["budget focus", "Spending on basics first"],
      ["photo lighting", "Judging skin in consistent light"],
      ["hormonal shifts", "Tracking changes across the month"],
      ["lips and hands", "Often-forgotten dryness spots"],
      ["sheet masks", "Masks as optional, not required"],
      ["eye cream myth", "Expectations vs. marketing"],
      ["water and sleep", "Basics that still matter"],
      ["travel kit", "A travel kit that is not a suitcase"],
      ["sensitive reset", "Resetting when everything stings"],
      ["spf reapply", "Reapplying without wrecking makeup"],
      ["texture vs type", "Matching texture to climate"],
      ["derm visit", "When to see a professional"],
      ["shelf life", "Checking expiration dates"],
      ["gentle exfoliation", "Exfoliation without overdoing it"],
      ["routine log", "Logging what you actually used"],
      ["resource share", "A simple guide worth saving"],
    ],
  },
  {
    niche: "relationships",
    prefix: "rel",
    exportName: "RELATIONSHIPS_POSTS",
    file: "relationships.ts",
    count: 31,
    topics: [
      ["listening first", "Listening before fixing"],
      ["phone at dinner", "Phones during meals"],
      ["check-in habit", "A weekly check-in that is short"],
      ["tone matters", "Same words, different tone"],
      ["apology steps", "Apologies that include a change"],
      ["date night home", "Low-cost date nights at home"],
      ["text fights", "Why text fights escalate"],
      ["boundaries soft", "Boundaries without drama"],
      ["appreciation notes", "Small appreciation that lands"],
      ["busy seasons", "Staying connected during busy weeks"],
      ["family visits", "Planning family visits as a team"],
      ["money talks", "Money conversations without blame"],
      ["repair attempt", "Repair attempts after a spat"],
      ["solo time", "Needing alone time without rejection"],
      ["love languages", "Actions over labels"],
      ["group support", "Using relationship groups carefully"],
      ["jealousy talk", "Naming jealousy without accusation"],
      ["shared calendar", "One shared calendar habit"],
      ["chore fairness", "Chores as a system, not a score"],
      ["friend time", "Keeping friendships while dating"],
      ["hard conversations", "Scheduling hard conversations"],
      ["praise public", "Praising in public, correcting private"],
      ["sleep conflict", "Different sleep schedules"],
      ["parenting team", "Presenting a united front"],
      ["tech boundaries", "Tech boundaries that are realistic"],
      ["gratitude loop", "A two-minute gratitude habit"],
      ["conflict pause", "Taking a pause before escalating"],
      ["reconnection", "Reconnecting after distance"],
      ["expectations", "Saying expectations out loud"],
      ["resource share", "A conversation guide worth saving"],
      ["kind curiosity", "Curiosity instead of assumptions"],
    ],
  },
  {
    niche: "tech_gadgets",
    prefix: "tg",
    exportName: "TECH_GADGETS_POSTS",
    file: "tech-gadgets.ts",
    count: 31,
    topics: [
      ["vpn basics", "When a VPN actually helps"],
      ["wifi dead zones", "Fixing dead zones before buying more gear"],
      ["password manager", "One password manager habit"],
      ["streaming setup", "Streaming without endless buffering"],
      ["smart plug", "A smart plug as a first smart-home step"],
      ["cable clutter", "Cable clutter that slows you down"],
      ["backup habit", "Backups before the crash"],
      ["phone storage", "Freeing storage without deleting everything"],
      ["laptop heat", "Heat and fan noise checklist"],
      ["headphones fit", "Fit before fancy features"],
      ["router placement", "Router placement myths"],
      ["update timing", "When to update, when to wait"],
      ["privacy basics", "Privacy settings worth checking"],
      ["gadget FOMO", "Buying tools you will not use"],
      ["battery health", "Battery habits that matter"],
      ["two factor", "Turning on two-factor authentication"],
      ["smart speaker", "Privacy notes for smart speakers"],
      ["monitor height", "Monitor height for fewer headaches"],
      ["keyboard comfort", "Keyboard comfort before upgrades"],
      ["cloud vs local", "Cloud vs local storage tradeoffs"],
      ["group recommendations", "Asking for recs in tech groups"],
      ["warranty check", "Checking warranty before returns"],
      ["power strip", "Surge protection basics"],
      ["focus mode", "Focus modes that actually stick"],
      ["tablet vs laptop", "Choosing tablet vs laptop honestly"],
      ["earbud care", "Keeping earbuds from dying early"],
      ["home office light", "Lighting before camera upgrades"],
      ["app subscriptions", "Auditing forgotten subscriptions"],
      ["slow internet", "A slow-internet checklist"],
      ["beginner buy", "A beginner buy that is enough"],
      ["resource share", "A setup checklist worth saving"],
    ],
  },
  {
    niche: "pets",
    prefix: "pet",
    exportName: "PETS_POSTS",
    file: "pets.ts",
    count: 32,
    topics: [
      ["puppy routine", "A calm puppy evening routine"],
      ["crate training", "Crate training without panic"],
      ["walk manners", "Loose leash progress"],
      ["cat litter", "Litter box placement basics"],
      ["food transition", "Switching food slowly"],
      ["enrichment toys", "Enrichment that is not expensive"],
      ["vet prep", "Preparing for vet visits"],
      ["separation practice", "Short alone-time practice"],
      ["leash reactivity", "Noticing early reactivity cues"],
      ["senior pets", "Adjusting walks for senior pets"],
      ["grooming start", "Short grooming sessions"],
      ["chew management", "Chewing that is not destruction"],
      ["cat scratching", "Scratching posts that get used"],
      ["multi pet", "Introducing pets carefully"],
      ["hot weather", "Hot weather walking adjustments"],
      ["training treats", "Treats as information, not bribes"],
      ["group advice", "Filtering pet advice online"],
      ["sleep spots", "Sleep spots and nighttime wakeups"],
      ["car rides", "Making car rides less stressful"],
      ["nail trims", "Nail trims in tiny steps"],
      ["boredom signals", "Boredom vs. bad behavior"],
      ["water intake", "Water intake checks"],
      ["new home", "First week in a new home"],
      ["kids and pets", "Teaching kids calm approaches"],
      ["recall games", "Recall games in the yard"],
      ["allergy season", "Allergy season itch notes"],
      ["crate alternative", "When crates are not the fit"],
      ["feeding schedule", "Consistent feeding times"],
      ["socialization", "Calm socialization over chaos"],
      ["vet questions", "Questions worth asking the vet"],
      ["resource share", "A training checklist worth saving"],
      ["daily enrichment", "Ten minutes of daily enrichment"],
    ],
  },
  {
    niche: "home_garden",
    prefix: "hg",
    exportName: "HOME_GARDEN_POSTS",
    file: "home-garden.ts",
    count: 31,
    topics: [
      ["windowsill herbs", "Herbs on a real windowsill"],
      ["overwatering", "Overwatering as the quiet killer"],
      ["drainage pots", "Drainage before pretty pots"],
      ["light audit", "Auditing light at three times of day"],
      ["seed starting", "Seed starting without a greenhouse"],
      ["soil mix", "Soil mix vs. garden dirt indoors"],
      ["watering schedule", "Checking the mix before watering"],
      ["pest check", "Catching pests early"],
      ["balcony garden", "A balcony garden that stays small"],
      ["compost basics", "Compost basics for beginners"],
      ["tool minimal", "Tools you actually need first"],
      ["season timing", "Planting timing for your zone"],
      ["prune lightly", "Light pruning over hard cuts"],
      ["herb harvest", "Harvesting outer leaves first"],
      ["raised bed", "A first raised bed that is manageable"],
      ["mulch layer", "Mulch that saves watering"],
      ["indoor humidity", "Humidity for indoor plants"],
      ["repot signs", "Signs it is time to repot"],
      ["group tips", "Useful posts in garden groups"],
      ["fail restart", "Restarting after a plant dies"],
      ["sun map", "Mapping sun across the yard"],
      ["watering can", "A watering can habit that works"],
      ["kids garden", "A kid-friendly garden project"],
      ["kitchen scraps", "Kitchen scraps that help plants"],
      ["shade plants", "Choosing plants for shade honestly"],
      ["winter prep", "Simple winter prep"],
      ["label plants", "Labeling so you remember varieties"],
      ["container tomatoes", "Tomatoes in containers"],
      ["weed early", "Weeding early and often"],
      ["checklist share", "A starter checklist worth saving"],
      ["resource share", "A setup guide worth saving"],
    ],
  },
];

function styleForIndex(i) {
  return STYLES[i % STYLES.length];
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function buildBody(niche, style, topic) {
  const [, titleHint] = topic;
  const subject = titleHint.replace(/\.$/, "").replace(/^[A-Z]/, (c) => c.toLowerCase());
  const openers = {
    helpful: `Quick tip if you are dealing with this: ${subject}.`,
    short: `${titleHint.replace(/\.$/, "")}.`,
    detailed: `I have been thinking about this a lot lately (${subject}), so here is the longer version.`,
    curiosity: `Curious how other people handle this: ${subject}?`,
    empathetic: `If this sounds familiar (${subject}), you are not alone.`,
    expert: `A practical way to approach this: ${subject}.`,
    soft_sell: `For anyone researching this (${subject}), this framing helped me stay grounded.`,
    skeptical_friend: `Honest take on this (${subject}). Skip the hype.`,
  };

  const middles = {
    weight_loss: [
      "Focus on one change you can repeat on a busy weekday, not a perfect plan.",
      "Track what you did, not just what the scale says.",
      "If a tip needs a perfect kitchen and free Saturdays, it will not stick.",
      "Start smaller than you think. Consistency beats intensity here.",
    ],
    make_money_online: [
      "Pick one offer and one place to post. Finish a week before switching.",
      "Helpful posts beat opportunity posts in most groups.",
      "Read the group rules. Some allow links, some want them in comments or DMs only.",
      "Ship something a stranger can see before you buy another tool.",
    ],
    health_fitness: [
      "Choose movement you can do in the clothes you already own.",
      "Pain is a stop sign. Mild effort you can talk through is usually enough to start.",
      "Book the session like an appointment, even if it is ten minutes.",
      "Recovery and sleep count as part of the plan.",
    ],
    beauty_skincare: [
      "Introduce one new product at a time and give it a fair window.",
      "Basics beat a crowded shelf if you are inconsistent.",
      "If it stings beyond a mild tingle, pause and simplify.",
      "Same lighting when you check progress. Bathroom selfies lie.",
    ],
    relationships: [
      "Name the need without assigning blame.",
      "Short check-ins beat long speeches that never happen.",
      "Repair after conflict matters more than winning the point.",
      "Say the expectation out loud instead of assuming mind-reading.",
    ],
    tech_gadgets: [
      "Fix placement and settings before buying another device.",
      "Write down the problem you are solving. Gadgets without a job become clutter.",
      "Security basics (updates, 2FA, backups) beat shiny features.",
      "Ask what you will use weekly, not what looks cool in a review.",
    ],
    pets: [
      "Short, calm sessions beat long chaotic ones.",
      "Manage the environment while you teach the skill.",
      "If advice conflicts with your vet, ask your vet.",
      "Enrichment and routine prevent a lot of 'behavior' problems.",
    ],
    home_garden: [
      "Check light and drainage before blaming your thumb.",
      "Water when the mix needs it, not on a rigid calendar alone.",
      "Start with one or two plants you will actually harvest or enjoy.",
      "Label what you planted. Future you will thank you.",
    ],
  };

  const closers = {
    helpful: `If you want a simple checklist that continues this, I saved one here: {{LINK}}`,
    short: `More detail here if useful: {{LINK}}`,
    detailed: `I put the step-by-step version here so this post stays readable: {{LINK}}`,
    curiosity: `Curious what worked for you too — and if you want a walkthrough, it is here: {{LINK}}`,
    empathetic: `No pressure. If a calmer walkthrough helps, it is here: {{LINK}}`,
    expert: `Full sequence with the order of operations: {{LINK}}`,
    soft_sell: `If you want the longer resource version of this tip: {{LINK}}`,
    skeptical_friend: `Ignore anything that promises miracles. A grounded checklist is here: {{LINK}}`,
  };

  const midList = middles[niche];
  const mid = midList[Math.abs(hash(`${titleHint}-${style}`)) % midList.length];
  const mid2 = midList[(Math.abs(hash(`${titleHint}-${style}`)) + 1) % midList.length];

  const styleExtra = {
    helpful: `One concrete move: do the smallest version today, then repeat tomorrow.`,
    short: `Keep it small enough to repeat.`,
    detailed: `Write the next action on a sticky note. When you feel like adding three more habits, read the note and finish the one action first. That is how plans survive real weeks.`,
    curiosity: `What is the smallest version of this you have tried?`,
    empathetic: `Busy weeks happen. The goal is a plan that bends without breaking.`,
    expert: `Order of operations matters: environment, then habit, then tools.`,
    soft_sell: `You do not need a perfect setup to start. You need a clear next step.`,
    skeptical_friend: `If a tip needs a perfect life, it is marketing, not a method.`,
  };

  return [
    openers[style],
    "",
    mid,
    mid2,
    styleExtra[style],
    "",
    closers[style],
  ].join("\n");
}

function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return h;
}

function titleFor(topic, style) {
  const [, hint] = topic;
  const prefixes = {
    helpful: "Tip:",
    short: "",
    detailed: "Longer take:",
    curiosity: "Question:",
    empathetic: "If this is you:",
    expert: "Practical note:",
    soft_sell: "Worth saving:",
    skeptical_friend: "Honest take:",
  };
  const p = prefixes[style];
  return p ? `${p} ${hint}` : hint;
}

function escapeTs(str) {
  return str.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
}

function generateNicheFile(cfg) {
  const posts = [];
  for (let i = 0; i < cfg.count; i++) {
    const topic = cfg.topics[i];
    const style = styleForIndex(i);
    const id = `fb-${cfg.prefix}-${pad(i + 1)}`;
    const title = titleFor(topic, style);
    const body = buildBody(cfg.niche, style, topic);
    posts.push({ id, niche: cfg.niche, style, title, body });
  }

  const lines = [
    `import type { InstantFacebookPost } from "./types";`,
    ``,
    `export const ${cfg.exportName}: InstantFacebookPost[] = [`,
  ];

  for (const p of posts) {
    lines.push(`  {`);
    lines.push(`    id: ${JSON.stringify(p.id)},`);
    lines.push(`    niche: ${JSON.stringify(p.niche)},`);
    lines.push(`    style: ${JSON.stringify(p.style)},`);
    lines.push(`    title: ${JSON.stringify(p.title)},`);
    lines.push(`    body: \`${escapeTs(p.body)}\`,`);
    lines.push(`  },`);
  }

  lines.push(`];`);
  lines.push(``);
  return { content: lines.join("\n"), count: posts.length };
}

let total = 0;
for (const cfg of NICHES) {
  const { content, count } = generateNicheFile(cfg);
  fs.writeFileSync(path.join(outDir, cfg.file), content, "utf8");
  total += count;
  console.log(`Wrote ${cfg.file}: ${count} posts`);
}

const catalog = `import type { NicheId } from "@/lib/niches";
import type { InstantFacebookPost } from "./types";
import { WEIGHT_LOSS_POSTS } from "./weight-loss";
import { MAKE_MONEY_ONLINE_POSTS } from "./make-money-online";
import { HEALTH_FITNESS_POSTS } from "./health-fitness";
import { BEAUTY_SKINCARE_POSTS } from "./beauty-skincare";
import { RELATIONSHIPS_POSTS } from "./relationships";
import { TECH_GADGETS_POSTS } from "./tech-gadgets";
import { PETS_POSTS } from "./pets";
import { HOME_GARDEN_POSTS } from "./home-garden";

export const INSTANT_FACEBOOK_POSTS: InstantFacebookPost[] = [
  ...WEIGHT_LOSS_POSTS,
  ...MAKE_MONEY_ONLINE_POSTS,
  ...HEALTH_FITNESS_POSTS,
  ...BEAUTY_SKINCARE_POSTS,
  ...RELATIONSHIPS_POSTS,
  ...TECH_GADGETS_POSTS,
  ...PETS_POSTS,
  ...HOME_GARDEN_POSTS,
];

export const INSTANT_POST_COUNT = INSTANT_FACEBOOK_POSTS.length;

const byNicheCache = new Map<NicheId, InstantFacebookPost[]>();

export function getPostsByNiche(niche: NicheId): InstantFacebookPost[] {
  const cached = byNicheCache.get(niche);
  if (cached) return cached;
  const posts = INSTANT_FACEBOOK_POSTS.filter((p) => p.niche === niche);
  byNicheCache.set(niche, posts);
  return posts;
}

export function getAllPostsByNiche(): Record<NicheId, InstantFacebookPost[]> {
  const result = {} as Record<NicheId, InstantFacebookPost[]>;
  for (const post of INSTANT_FACEBOOK_POSTS) {
    if (!result[post.niche]) result[post.niche] = [];
    result[post.niche].push(post);
  }
  return result;
}

export function getPostById(id: string): InstantFacebookPost | undefined {
  return INSTANT_FACEBOOK_POSTS.find((p) => p.id === id);
}
`;

fs.writeFileSync(path.join(outDir, "catalog.ts"), catalog, "utf8");
console.log(`Total posts: ${total}`);
if (total !== 250) {
  console.error(`Expected 250 posts, got ${total}`);
  process.exit(1);
}
