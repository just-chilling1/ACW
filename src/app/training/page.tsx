"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    GraduationCap, Search, Brain, Radar, MessageSquare,
    ArrowRight, Lightbulb, HelpCircle,
    CheckCircle2, Target, Copy, ExternalLink, DollarSign, Zap,
    BookOpen, Star, Play
} from "lucide-react";
import Link from "next/link";
import { clsx } from "clsx";
import { PageHeader } from "@/components/ui/page-header";
import { VideoThumbnail } from "@/components/ui/video-thumbnail";
import { VideoOverlay } from "@/components/ui/video-overlay";
import { Accordion } from "@/components/ui/accordion";

type TrainingTab = "videos" | "faq";

const TABS: { id: TrainingTab; label: string; icon: typeof Play }[] = [
    { id: "videos", label: "Videos", icon: Play },
    { id: "faq", label: "FAQ", icon: HelpCircle },
];

const VIDEOS = [
    {
        id: "1214645007",
        title: "Getting Started with AI CashWave",
        description: "Watch this first. Learn the basics — how to search for a topic, check demand, find ads, and create replies that earn commissions.",
    },
    {
        id: "1214645006",
        title: "Advanced Strategies & Tips",
        description: "Go deeper. Learn how to pick the best keywords, find high-value ads, and write replies that get more clicks on your affiliate link.",
    },
];

const STEPS_GUIDE = [
    {
        step: 1,
        title: "Enter Your Topic",
        icon: Search,
        page: "/search",
        description: "Type any topic you want to promote. It can be a product category, a niche, or a problem people have.",
        tips: [
            "Keep it simple — one or two words work best (e.g. \"weight loss\", \"dog food\")",
            "Think about what your affiliate product solves",
            "Try different angles of the same topic for more results",
        ],
        examples: ["weight loss", "crypto trading", "skincare routine", "home gym equipment", "keto diet"],
    },
    {
        step: 2,
        title: "Check Demand",
        icon: Brain,
        page: "/analysis",
        description: "We analyze how active each topic is on Reddit and YouTube. The table shows you which keywords have the most demand.",
        tips: [
            "Look for keywords with \"High\" demand — they have the most conversations",
            "Higher confidence means more reliable data",
            "Click any row to see the full analysis details",
            "All keywords are analyzed automatically — just wait for the table to fill up",
        ],
        examples: [],
    },
    {
        step: 3,
        title: "Find Ads",
        icon: Radar,
        page: "/radar",
        description: "Browse real ads and conversations from Reddit and YouTube. Click to select the ones you want to reply to.",
        tips: [
            "Select ads with high engagement — more people will see your reply",
            "Pick at least 3 ads for the best results",
            "Try different keyword tabs to find more ads",
            "Reddit posts with lots of comments are goldmines",
        ],
        examples: [],
    },
    {
        step: 4,
        title: "Create Replies",
        icon: MessageSquare,
        page: "/replies",
        description: "Our AI writes 3 different reply styles for each ad. Just copy the one you like and paste it under the ad.",
        tips: [
            "Paste your affiliate link in the box at the top — it gets inserted into replies",
            "\"Curiosity Hook\" replies tend to get the most clicks",
            "Copy the reply, go to the original ad, and paste it as a comment",
            "You can regenerate replies if you don't like the first batch",
        ],
        examples: [],
    },
];

const FAQ_SECTIONS = [
    {
        title: "Getting Started",
        items: [
            {
                q: "How do I actually earn money with this?",
                a: "AI CashWave gives you multiple ways to earn. The core 4-step system finds real conversations online, then our AI writes replies that include your affiliate link. When someone clicks and buys, you earn a commission. You also get Done-For-You keywords with pre-made replies, 200+ ready-to-post Facebook posts via Instant Income, and 100+ traffic sources through Automated Profits. Just copy, paste, and earn.",
            },
            {
                q: "Do I need any experience or technical skills?",
                a: "None at all. Every feature is designed for complete beginners. The app finds the ads, analyzes demand, writes the replies, and gives you ready-made posts. You just need to copy and paste. If you can use a web browser, you can use AI CashWave.",
            },
            {
                q: "What should I do first after logging in?",
                a: "Start by watching the two training videos at the top of this page. Then watch the Premium Feature videos for Done-For-You, Automated Profits, and Instant Access. After that, follow the Quick Start Checklist: search for your first topic, check demand, find ads, and create your first replies. You can also jump straight into the Done-For-You vault or Instant Income if you want results faster.",
            },
            {
                q: "Can I use this on my phone or tablet?",
                a: "Yes. AI CashWave works in any web browser on desktop, tablet, or phone. You can search for topics, copy replies, and post them right from your phone — making it easy to earn on the go.",
            },
            {
                q: "How long does it take to see results?",
                a: "Some members see their first commission within days. The key is consistency — members who post 5-10 replies or Facebook posts per day see the best results. The more content you have out there with your link, the more chances you have to earn. Most active users start seeing commissions within the first 1-2 weeks.",
            },
        ],
    },
    {
        title: "Affiliate Links & Earnings",
        items: [
            {
                q: "What is an affiliate link and where do I get one?",
                a: "An affiliate link is a special URL that tracks when someone buys through your recommendation. You earn a commission for every sale. You can get one for free from platforms like DigiStore24, ClickBank, Amazon Associates, ShareASale, or CJ Affiliate. We recommend DigiStore24 — just create a free account, browse products in your niche, click \"Promote\", and copy your unique link.",
            },
            {
                q: "How much money can I make?",
                a: "Earnings depend on your niche, the product you promote, and how many replies/posts you put out. A single affiliate product can pay $20-$100+ per sale. If you post 5-10 replies per day across Reddit and YouTube, plus Facebook posts, you can realistically earn $100-$500/day. Top earners who combine all features (core system + DFY + Instant Income + Automated Profits) report $5,000-$10,000+/month.",
            },
            {
                q: "What niches and topics work best?",
                a: "The top-performing niches are health, wealth, and relationships. Think: weight loss, making money online, fitness, skincare, dating, crypto, VPNs, home office gear, email marketing tools, pets, tech gadgets, and home improvement. Anything where people are actively searching for solutions and there are affiliate products to promote.",
            },
            {
                q: "Can I promote any product or only specific ones?",
                a: "You can promote any product that has an affiliate program. The app doesn't restrict you — just paste your affiliate link and it gets inserted into your replies and posts. Whether it's a weight loss supplement, a software tool, an online course, or a physical product — if it has an affiliate link, it works with AI CashWave.",
            },
            {
                q: "Do I need to pay for ads or spend any money?",
                a: "No. Everything you do with AI CashWave is free traffic. You're posting replies on Reddit, YouTube, and Facebook — all free platforms. You're submitting your link to free traffic sources. There's zero ad spend required. Your only investment is your time.",
            },
        ],
    },
    {
        title: "Core 4-Step System (Search → Analyze → Find Ads → Replies)",
        items: [
            {
                q: "How does Step 1 (Search) work?",
                a: "Go to the Search page and type any topic you want to promote — like \"weight loss\", \"crypto trading\", or \"skincare routine\". Keep it simple: one or two words work best. The app will generate related keywords and search angles automatically. Think about what problem your affiliate product solves and search for that.",
            },
            {
                q: "What does Step 2 (Check Demand) show me?",
                a: "The Analysis page shows you how active each keyword is on Reddit and YouTube. It displays demand level (High, Medium, Low), confidence scores, and activity data. Focus on keywords marked \"High\" demand — they have the most active conversations, which means more people will see your replies. The data updates automatically, so just wait for the table to fill up.",
            },
            {
                q: "How do I use Step 3 (Find Ads)?",
                a: "The Radar page shows you real posts and conversations from Reddit and YouTube related to your keywords. Browse through them and click to select the ones you want to reply to. Pick ads with high engagement (lots of comments/upvotes) since more people will see your reply. Select at least 3 ads for the best results, and try different keyword tabs to find more opportunities.",
            },
            {
                q: "How does Step 4 (Create Replies) work?",
                a: "Once you've selected ads, go to the Replies page. Paste your affiliate link in the box at the top. Our AI will write 3 different reply styles for each ad — including a Curiosity Hook style that gets the highest click-through rate. Copy the reply you like, go to the original post on Reddit or YouTube, and paste it as a comment. That's it — you're earning!",
            },
            {
                q: "How many replies should I post per day?",
                a: "We recommend at least 5 per day. Top earners post 10-20 replies daily. The more replies you have out there with your link, the more commissions you'll earn. Consistency is the #1 factor — posting every single day beats posting a lot once a week.",
            },
            {
                q: "What if my reply gets deleted?",
                a: "It happens sometimes on Reddit and YouTube. That's why volume matters — post across multiple ads and keywords so removing one reply doesn't affect your income. Our AI writes natural-sounding replies that blend in with normal conversation, which significantly reduces removal rates. The Curiosity Hook style is especially effective at avoiding detection.",
            },
        ],
    },
    {
        title: "Done-For-You Vault",
        items: [
            {
                q: "What is the Done-For-You Vault?",
                a: "The Done-For-You Vault is the fastest way to start earning. We've pre-selected 5 proven, high-demand keywords across popular niches (weight loss, VPNs, AI tools, office chairs, email marketing). Just pick a keyword, enter your affiliate link, and the app instantly finds real Reddit posts and generates AI-powered replies with your link already included. No searching or analyzing required.",
            },
            {
                q: "How do I use the Done-For-You feature?",
                a: "It's 3 simple steps: (1) Pick a keyword from the curated list — each one has been tested for high demand. (2) Paste your affiliate link. (3) Click Generate and wait about 30 seconds. The app will find real posts and write 3 custom replies for each one. Then just copy a reply, click \"Go to Post\" to visit the actual Reddit thread, and paste your reply as a comment.",
            },
            {
                q: "Are the posts in Done-For-You real?",
                a: "Yes. The app searches for real, active Reddit posts for each keyword. These are real conversations from real people looking for solutions — which is exactly why your reply with an affiliate link works so well. The posts link directly to the actual Reddit threads where you can paste your comment.",
            },
            {
                q: "Can I use Done-For-You and the core 4-step system together?",
                a: "Absolutely — and we recommend it. Use Done-For-You for quick, guaranteed results with proven keywords. Use the core 4-step system to discover new keywords and niches on your own. The more angles you cover, the more money you make.",
            },
        ],
    },
    {
        title: "Instant Income (Facebook Posts)",
        items: [
            {
                q: "What is Instant Income?",
                a: "Instant Income gives you 200+ pre-written Facebook posts across 9 niches (Weight Loss, Make Money Online, Health & Fitness, Beauty & Skincare, Relationships, Tech & Gadgets, Pets, Home & Garden, and more). Each post is written as a personal success story designed to get engagement in Facebook groups. Just pick your niche, paste your affiliate link, and copy the posts into Facebook groups.",
            },
            {
                q: "How do I use the Facebook posts?",
                a: "Step 1: Choose your niche from the selector. Step 2: Paste your affiliate link — it gets auto-inserted into every post replacing the {LINK} placeholder. Step 3: Click \"Show Me My Posts\" and browse through them. Step 4: Copy any post and paste it into a Facebook group. That's it! Post in 3-5 groups per day for best results.",
            },
            {
                q: "Where do I find Facebook groups to post in?",
                a: "Go to Facebook and search for keywords related to your niche (e.g., \"weight loss support\", \"make money online\", \"fitness motivation\"). Click \"Groups\" in the left sidebar. Join 10-15 groups with 5,000+ members. Wait for admin approval (1-24 hours). Then start posting! Bigger groups mean more eyeballs on your posts.",
            },
            {
                q: "Will my posts get removed from Facebook groups?",
                a: "Our posts are written as personal success stories, not ads — so they blend in naturally. However, always read the group rules first. If a group says \"no links\", you can post the message without the link and send it via private message to people who comment. Best posting times are 7-9 AM, 12-1 PM, and 7-9 PM when people are most active.",
            },
            {
                q: "How much can I make with Facebook posts?",
                a: "Each post can generate $40-$400 per day depending on the niche and how many groups you post in. If you post in 5 groups per day and each post makes $50/day, that's $250/day or $7,500/month — just from copying and pasting. The more groups you join and post in, the more you earn.",
            },
        ],
    },
    {
        title: "Automated Profits (Traffic Sources)",
        items: [
            {
                q: "What is Automated Profits?",
                a: "Automated Profits gives you 100+ free traffic sources across 9 niches — forums, social media platforms, directories, Q&A sites, blogs, and classifieds. Each source comes with step-by-step instructions, a pre-written description, and a direct link to the site. Just enter your page URL, follow the instructions for each source, and submit your link. The traffic keeps coming in on autopilot.",
            },
            {
                q: "How do I use Automated Profits?",
                a: "Enter your affiliate link or page URL at the top. Pick your niche to filter the relevant traffic sources. Open any source card to see the step-by-step instructions. Follow the instructions to submit your link to that site. Use the \"Copy Description\" button to copy a pre-written submission text with your link already included. Mark each source as complete to track your progress.",
            },
            {
                q: "What types of traffic sources are included?",
                a: "You get a mix of: Forums (MyFitnessPal, Warrior Forum, BlackHatWorld), Social platforms (Reddit, Pinterest, DietBet), Q&A sites (Quora), Directories (health & fitness listings, business directories), Blog platforms (Medium), and Classifieds. Each source is tagged with its type, difficulty level, estimated traffic, and time to complete.",
            },
            {
                q: "How long does it take to submit to all sources?",
                a: "Each source takes 5-15 minutes. You don't need to do them all at once — even submitting to 3-5 sources per day adds up quickly. The progress tracker shows how many you've completed. Focus on the \"Easy\" difficulty sources first for quick wins, then tackle the \"Medium\" ones.",
            },
            {
                q: "Does the traffic really keep coming automatically?",
                a: "Yes. Once your link is posted on a forum, directory, or Q&A site, it stays there permanently. People who search for those topics in the future will find your link and click on it. The more sources you submit to, the more passive traffic streams you create. It's a one-time effort that pays off over and over.",
            },
        ],
    },
    {
        title: "Account & Technical",
        items: [
            {
                q: "Is my data and affiliate link safe?",
                a: "Yes. Your affiliate link is only used locally within the app to insert into replies and posts. We don't store, share, or use your affiliate links for any other purpose. Your data stays on your device.",
            },
            {
                q: "Can I change my affiliate link at any time?",
                a: "Yes. You can update your affiliate link at any point — just paste a new one in the input field. All new replies and posts will use the updated link. Previously copied content will still have the old link, so be sure to re-copy if needed.",
            },
            {
                q: "What browsers are supported?",
                a: "AI CashWave works on all modern browsers — Chrome, Safari, Firefox, Edge, and Brave. It works on Windows, Mac, iOS, and Android. For the best experience, we recommend using the latest version of Chrome.",
            },
            {
                q: "I'm getting an error or the page won't load. What should I do?",
                a: "Try these steps: (1) Refresh the page. (2) Clear your browser cache and cookies. (3) Try a different browser. (4) Check your internet connection. If the issue persists, try logging out and back in. Most errors resolve with a simple page refresh.",
            },
            {
                q: "Can I use multiple niches at the same time?",
                a: "Absolutely. You can search different topics in the core system, pick different niches in Instant Income, and submit to multiple niche sources in Automated Profits. Many top earners run 2-3 niches simultaneously to diversify their income streams.",
            },
        ],
    },
    {
        title: "Strategy & Maximizing Earnings",
        items: [
            {
                q: "What's the best strategy to maximize my income?",
                a: "Use ALL the features together: (1) Start with Done-For-You for instant results with proven keywords. (2) Post 3-5 Facebook posts daily via Instant Income. (3) Submit to 3-5 traffic sources daily via Automated Profits. (4) Use the core 4-step system to discover new keywords and reply to fresh ads. Combining all four creates multiple income streams that compound over time.",
            },
            {
                q: "Which reply style gets the most clicks?",
                a: "The \"Curiosity Hook\" style consistently gets the highest click-through rate. It teases a benefit or result without revealing everything, making people curious enough to click your link. Use it as your default choice when the AI generates replies.",
            },
            {
                q: "Should I promote high-ticket or low-ticket products?",
                a: "High-ticket products are almost always better. A $50-$100 commission per sale means you need far fewer clicks to earn significant income. One sale of a $97 product beats fifty sales of a $2 product. Look for products on DigiStore24 or ClickBank that pay $30+ per conversion.",
            },
            {
                q: "How do I avoid getting my accounts flagged or banned?",
                a: "Follow these rules: (1) Don't spam — post across different ads, groups, and keywords instead of hitting the same one repeatedly. (2) Be genuinely helpful in your replies. (3) Space out your posts throughout the day. (4) Read group/subreddit rules before posting. (5) Mix up the posts you use — don't paste the exact same text everywhere. Our AI writes natural-sounding content specifically to avoid detection.",
            },
            {
                q: "How often should I use the app?",
                a: "For best results, use it daily. Even 30 minutes a day can produce significant income if you're consistent. A typical daily routine: spend 10 minutes on Done-For-You replies, 10 minutes posting Facebook posts from Instant Income, and 10 minutes submitting to new traffic sources in Automated Profits. That's $200-$500+/day potential with just 30 minutes of work.",
            },
        ],
    },
];


const PREMIUM_VIDEOS = [
    { id: "1214651948", badge: "Premium Feature 1", title: "Done For You", desc: "Learn how to use the Done-For-You feature to pick a keyword, add your link, and get ready-made replies to post and earn." },
    { id: "1214661265", badge: "Premium Feature 2", title: "Automated Profits", desc: "Learn how to use the Automated Profits feature to submit your link to 100+ traffic sources and get automated traffic forever." },
    { id: "1214657449", badge: "Premium Feature 3", title: "Instant Income", desc: "Learn how to use the Instant Income feature to copy proven Facebook posts and start earning commissions right away." },
];

const PRO_TIPS = [
    { icon: Target, title: "Pick trending topics", text: "Topics with \"High\" demand have the most active conversations. More eyeballs on your reply = more clicks." },
    { icon: Copy, title: "Volume wins", text: "Post at least 5-10 replies per day across different ads. Consistency is the #1 factor for earning." },
    { icon: Lightbulb, title: "Use Curiosity Hook replies", text: "The \"Curiosity Hook\" style gets the highest click-through rate. It makes people want to learn more." },
    { icon: DollarSign, title: "Promote high-ticket products", text: "A $50 commission per sale beats a $2 one. Pick affiliate products that pay well per conversion." },
    { icon: ExternalLink, title: "Reply on Reddit AND YouTube", text: "Don't stick to one platform. Reddit comments and YouTube comments are both goldmines for traffic." },
    { icon: Star, title: "Be helpful first", text: "Replies that genuinely answer the question AND include your link perform 3x better than spammy ones." },
];


export default function TrainingPage() {
    const [tab, setTab] = useState<TrainingTab>("videos");
    const [openVideo, setOpenVideo] = useState<{ id: string; title: string } | null>(null);
    const faqCount = FAQ_SECTIONS.reduce((acc, s) => acc + s.items.length, 0);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto flex w-full max-w-6xl flex-col gap-6 py-6"
        >
            <PageHeader
                eyebrow="TRAINING"
                title={
                    <>
                        Training <span className="text-gradient">Academy</span>
                    </>
                }
                subtitle="Everything you need to start earning with AI CashWave."
            />

            <div
                role="tablist"
                aria-label="Training sections"
                className="surface-panel flex gap-1 p-1"
            >
                {TABS.map((item) => {
                    const Icon = item.icon;
                    const active = tab === item.id;
                    return (
                        <button
                            key={item.id}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            onClick={() => setTab(item.id)}
                            className={clsx(
                                "flex flex-1 items-center justify-center gap-2 rounded-[var(--radius-md)] px-4 py-3 text-sm font-semibold transition-colors",
                                active
                                    ? "bg-[var(--gold)] text-[var(--text-on-accent)]"
                                    : "text-text-muted hover:bg-[var(--surface-2)] hover:text-text-primary"
                            )}
                        >
                            <Icon size={16} strokeWidth={2} />
                            {item.label}
                            {item.id === "faq" && (
                                <span
                                    className={clsx(
                                        "rounded-md px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
                                        active ? "surface-tab-active" : "surface-tab-idle"
                                    )}
                                >
                                    {faqCount}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            <AnimatePresence mode="wait">
                {tab === "videos" ? (
                    <motion.div
                        key="videos"
                        role="tabpanel"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.18 }}
                        className="flex flex-col gap-8"
                    >
                        <section className="flex flex-col gap-4">
                            <div className="flex items-center gap-2">
                                <GraduationCap size={16} className="text-accent" />
                                <h2 className="ds-h2">Video Training</h2>
                                <span className="ml-2 text-[10px] font-bold uppercase tracking-widest text-text-muted">
                                    Watch these first
                                </span>
                            </div>
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                {VIDEOS.map((video, i) => (
                                    <div
                                        key={video.id}
                                        className="surface-panel overflow-hidden"
                                    >
                                        <VideoThumbnail
                                            videoId={video.id}
                                            title={video.title}
                                            onPlay={() => setOpenVideo({ id: video.id, title: video.title })}
                                        />
                                        <div className="flex flex-col gap-1.5 p-4">
                                            <span className="w-fit rounded bg-accent/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-accent">
                                                Video {i + 1}
                                            </span>
                                            <h3 className="ds-h6">{video.title}</h3>
                                            <p className="text-[12px] leading-relaxed text-text-muted">{video.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="flex flex-col gap-4">
                            <div className="flex items-center gap-2">
                                <Star size={16} className="text-accent" />
                                <h2 className="ds-h2">Premium Features</h2>
                            </div>
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {PREMIUM_VIDEOS.map((video) => (
                                    <div
                                        key={video.id}
                                        className="surface-panel overflow-hidden"
                                    >
                                        <VideoThumbnail
                                            videoId={video.id}
                                            title={video.title}
                                            onPlay={() => setOpenVideo({ id: video.id, title: video.title })}
                                        />
                                        <div className="flex flex-col gap-1.5 p-4">
                                            <span className="w-fit rounded bg-accent/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-accent">
                                                {video.badge}
                                            </span>
                                            <h3 className="ds-h6">{video.title}</h3>
                                            <p className="text-[12px] leading-relaxed text-text-muted">{video.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <details className="surface-panel group">
                            <summary className="flex cursor-pointer list-none items-center gap-2 px-5 py-4 text-sm font-semibold text-text-primary [&::-webkit-details-marker]:hidden">
                                <BookOpen size={16} className="text-accent" />
                                Step-by-Step Guide
                                <span className="ml-auto text-[11px] font-medium text-text-muted group-open:hidden">Show</span>
                                <span className="ml-auto hidden text-[11px] font-medium text-text-muted group-open:inline">Hide</span>
                            </summary>
                            <div className="flex flex-col gap-4 border-t border-[var(--border-subtle)] px-5 py-5">
                                {STEPS_GUIDE.map((s) => {
                                    const Icon = s.icon;
                                    return (
                                        <div
                                            key={s.step}
                                            className="surface-nested flex flex-col gap-3"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-accent/20 bg-accent/10">
                                                    <Icon size={16} className="text-accent" />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[9px] font-bold uppercase tracking-widest text-accent">
                                                        Step {s.step}
                                                    </span>
                                                    <h3 className="ds-h6">{s.title}</h3>
                                                    <p className="text-[13px] leading-relaxed text-text-secondary">{s.description}</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-2 pl-12">
                                                {s.tips.map((tip, j) => (
                                                    <div key={j} className="flex items-start gap-2">
                                                        <CheckCircle2 size={12} className="mt-0.5 shrink-0 icon-trust-success" />
                                                        <span className="text-[12px] leading-relaxed text-text-secondary">{tip}</span>
                                                    </div>
                                                ))}
                                                {s.examples.length > 0 && (
                                                    <div className="mt-1 flex flex-wrap gap-2">
                                                        <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Try:</span>
                                                        {s.examples.map((ex) => (
                                                            <span
                                                                key={ex}
                                                                className="rounded-md border border-accent/15 bg-accent/5 px-2.5 py-1 text-[11px] font-medium text-accent"
                                                            >
                                                                {ex}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </details>

                        <details className="surface-panel group">
                            <summary className="flex cursor-pointer list-none items-center gap-2 px-5 py-4 text-sm font-semibold text-text-primary [&::-webkit-details-marker]:hidden">
                                <Zap size={16} className="text-accent" />
                                Pro Tips for More Earnings
                                <span className="ml-auto text-[11px] font-medium text-text-muted group-open:hidden">Show</span>
                                <span className="ml-auto hidden text-[11px] font-medium text-text-muted group-open:inline">Hide</span>
                            </summary>
                            <div className="grid grid-cols-1 gap-3 border-t border-[var(--border-subtle)] px-5 py-5 md:grid-cols-2 lg:grid-cols-3">
                                {PRO_TIPS.map((tip) => {
                                    const Icon = tip.icon;
                                    return (
                                        <div
                                            key={tip.title}
                                            className="surface-nested flex flex-col gap-2.5"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                                                    <Icon size={15} className="text-accent" />
                                                </div>
                                                <h3 className="ds-h6">{tip.title}</h3>
                                            </div>
                                            <p className="text-[12px] leading-relaxed text-text-muted">{tip.text}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </details>

                        <details className="checklist-panel group rounded-[var(--radius-lg)]" open>
                            <summary className="flex cursor-pointer list-none items-center gap-2 px-5 py-4 text-sm font-semibold text-text-primary [&::-webkit-details-marker]:hidden">
                                <CheckCircle2 size={16} className="icon-trust-success" />
                                Quick Start Checklist
                                <span className="ml-auto text-[11px] font-medium text-text-muted group-open:hidden">Show</span>
                                <span className="ml-auto hidden text-[11px] font-medium text-text-muted group-open:inline">Hide</span>
                            </summary>
                            <div className="flex flex-col gap-3 border-t border-[var(--success-border)] px-5 py-5">
                                {[
                                    "Watch both training videos above",
                                    "Go to Step 1 and search for your first topic",
                                    "Check demand in Step 2 — look for \"High\" activity keywords",
                                    "Select at least 3 ads in Step 3",
                                    "Paste your affiliate link in Step 4 and create replies",
                                    "Copy a reply, go to the original ad, and paste it as a comment",
                                    "Repeat daily — aim for 5-10 replies per day",
                                ].map((item, i) => (
                                    <div key={item} className="flex items-start gap-3">
                                        <div className="checklist-step">
                                            <span>{i + 1}</span>
                                        </div>
                                        <span className="text-[13px] leading-relaxed text-text-secondary">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </details>

                        <section className="flex flex-col items-center justify-between gap-4 rounded-[var(--radius-lg)] border border-accent/20 bg-accent/5 p-6 md:flex-row">
                            <div className="flex flex-col gap-1">
                                <h3 className="ds-h5">Ready to start earning?</h3>
                                <p className="text-[13px] text-text-muted">Go to Step 1 and search for your first topic now.</p>
                            </div>
                            <Link
                                href="/search"
                                className="btn-primary flex h-11 shrink-0 items-center gap-2 rounded-lg px-6 text-sm"
                            >
                                <Search size={16} />
                                <span>Go to Step 1</span>
                                <ArrowRight size={14} />
                            </Link>
                        </section>
                    </motion.div>
                ) : (
                    <motion.div
                        key="faq"
                        role="tabpanel"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.18 }}
                        className="flex flex-col gap-5"
                    >
                        <div className="flex items-center gap-2">
                            <HelpCircle size={16} strokeWidth={1.75} className="text-[var(--gold)]" />
                            <h2 className="ds-h2">Frequently Asked Questions</h2>
                            <span className="ml-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted">
                                {faqCount} answers
                            </span>
                        </div>
                        <Accordion
                            groups={FAQ_SECTIONS.map((section) => ({
                                category: section.title,
                                items: section.items.map((item) => ({
                                    question: item.q,
                                    answer: item.a,
                                })),
                            }))}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {openVideo && (
                <VideoOverlay
                    open={!!openVideo}
                    onClose={() => setOpenVideo(null)}
                    videoUrl={`https://player.vimeo.com/video/${openVideo.id}`}
                    title={openVideo.title}
                />
            )}
        </motion.div>
    );
}
