"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    TrendingUp, CheckCircle2, ArrowRight,
    Users, Clock, ExternalLink, Sparkles, Lightbulb,
    ChevronDown, ChevronUp, BookOpen, Clipboard, Copy
} from "lucide-react";
import { clsx } from "clsx";
import { InfoHint } from "@/components/ui/InfoHint";
import { Field } from "@/components/ui/field";
import { SelectableChip } from "@/components/ui/selectable-chip";
import { PageHeader } from "@/components/ui/page-header";
import { GenerationProgress } from "@/components/ui/generation-progress";
import { VideoThumbnail } from "@/components/ui/video-thumbnail";
import { VideoOverlay } from "@/components/ui/video-overlay";

const AUTOPILOT_VIDEO_ID = "1214661265";

function randomDelay(minMs: number, maxMs: number) {
    return minMs + Math.floor(Math.random() * (maxMs - minMs + 1));
}

const NICHES = [
    "All",
    "Weight Loss",
    "Make Money Online",
    "Health & Fitness",
    "Tech & Gadgets",
    "Beauty & Skincare",
    "Relationships",
    "Pets",
    "Home & Garden",
];

type SourceType = "Forum" | "Social" | "Directory" | "Blog" | "Q&A" | "Classified";
type Difficulty = "Easy" | "Medium";

interface TrafficSource {
    id: string;
    name: string;
    niche: string;
    type: SourceType;
    difficulty: Difficulty;
    traffic: string;
    time: string;
    url: string;
    description: string;
    instructions: string[];
}

const SOURCES: TrafficSource[] = [
    // Weight Loss
    { id: "wl-1", name: "MyFitnessPal Community", niche: "Weight Loss", type: "Forum", difficulty: "Easy", traffic: "200-500 visitors/month", time: "10 minutes", url: "https://community.myfitnesspal.com", description: "I found this complete weight loss guide with science-backed tips that actually helped me drop pounds: {LINK}", instructions: ["Create a free account on MyFitnessPal", "Go to the Community forums section", "Find threads related to your niche (weight loss tips, diet advice)", "Reply to existing threads with helpful advice and naturally include your link", "Create 2-3 new discussion posts per week sharing useful tips with your link in your profile or post"] },
    { id: "wl-2", name: "SparkPeople Forums", niche: "Weight Loss", type: "Forum", difficulty: "Easy", traffic: "150-400 visitors/month", time: "10 minutes", url: "https://www.sparkpeople.com", description: "Sharing this incredible weight loss resource that completely changed my approach to dieting: {LINK}", instructions: ["Sign up for a free SparkPeople account", "Navigate to the Community Message Boards", "Join weight loss and healthy eating groups", "Share helpful posts and include your page URL in your signature", "Engage with other members' posts to build visibility"] },
    { id: "wl-3", name: "3FatChicks Forum", niche: "Weight Loss", type: "Forum", difficulty: "Easy", traffic: "100-300 visitors/month", time: "8 minutes", url: "https://www.3fatchicks.com/forum", description: "This step-by-step weight loss plan helped me break through my plateau — totally free: {LINK}", instructions: ["Register for a free account", "Browse the diet and weight loss discussion boards", "Reply to threads with genuine advice", "Add your page URL to your forum signature", "Start new threads sharing your weight loss journey or tips"] },
    { id: "wl-4", name: "LoseIt! Reddit Community", niche: "Weight Loss", type: "Social", difficulty: "Easy", traffic: "300-800 visitors/month", time: "5 minutes", url: "https://www.reddit.com/r/loseit", description: "Just found this amazing free guide with proven weight loss strategies that actually deliver results: {LINK}", instructions: ["Create a Reddit account if you don't have one", "Subscribe to r/loseit (3M+ members)", "Share a genuine weight loss story or helpful tip", "Include your link naturally when relevant", "Comment on other posts with helpful advice — never spam"] },
    { id: "wl-5", name: "Weight Loss Directory", niche: "Weight Loss", type: "Directory", difficulty: "Easy", traffic: "50-150 visitors/month", time: "5 minutes", url: "https://www.healthline.com", description: "Complete Weight Loss Guide — Science-backed tips and strategies for sustainable fat loss: {LINK}", instructions: ["Search for health and fitness directories online", "Submit your page URL to free directory listings", "Fill in all fields: title, description, category", "Use keywords related to weight loss in your description", "Submit and wait for approval (usually 1-7 days)"] },
    { id: "wl-6", name: "Quora Weight Loss Topics", niche: "Weight Loss", type: "Q&A", difficulty: "Easy", traffic: "500-2000 visitors/month", time: "10 minutes", url: "https://www.quora.com", description: "Here's a free guide with evidence-based weight loss methods that don't require starving yourself: {LINK}", instructions: ["Create a Quora account with a credible bio", "Search for weight loss related questions", "Write detailed, helpful answers (200+ words)", "Include your page URL naturally as a resource", "Answer 2-3 questions per day for best results"] },
    { id: "wl-7", name: "DietBet Community", niche: "Weight Loss", type: "Social", difficulty: "Easy", traffic: "100-400 visitors/month", time: "8 minutes", url: "https://www.dietbet.com", description: "This free weight loss blueprint helped me stay consistent and finally hit my goal weight: {LINK}", instructions: ["Create a DietBet profile", "Join active weight loss challenges", "Engage in community discussions and share tips", "Add your page URL to your profile bio", "Post motivational updates with your link included naturally"] },
    { id: "wl-8", name: "CalorieCount Forum", niche: "Weight Loss", type: "Forum", difficulty: "Easy", traffic: "80-250 visitors/month", time: "8 minutes", url: "https://www.caloriecount.com", description: "Check out this calorie-smart weight loss guide with practical meal plans that make dieting easy: {LINK}", instructions: ["Register a free account", "Navigate to the community discussion boards", "Share helpful calorie counting tips and meal ideas", "Include your link in relevant discussions", "Stay active with 2-3 posts per week"] },
    { id: "wl-9", name: "FatSecret Community", niche: "Weight Loss", type: "Social", difficulty: "Easy", traffic: "150-500 visitors/month", time: "7 minutes", url: "https://www.fatsecret.com", description: "Discovered this nutrition-focused weight loss system that simplifies everything — highly recommend: {LINK}", instructions: ["Sign up for free at FatSecret", "Join community groups related to weight loss", "Share food logs, recipes, and progress updates", "Include your page link in your profile and relevant posts", "Engage consistently for best traffic results"] },
    { id: "wl-10", name: "Weight Watchers Community", niche: "Weight Loss", type: "Forum", difficulty: "Medium", traffic: "200-600 visitors/month", time: "12 minutes", url: "https://www.weightwatchers.com", description: "Comprehensive guide to sustainable weight loss using portion control and smart eating habits: {LINK}", instructions: ["Create a WW community profile", "Browse the success stories and discussion boards", "Share your own tips and helpful advice", "Link to your page as an additional resource", "Be genuine and helpful — avoid hard selling"] },
    { id: "wl-11", name: "Pinterest Weight Loss Boards", niche: "Weight Loss", type: "Social", difficulty: "Easy", traffic: "500-2000 visitors/month", time: "10 minutes", url: "https://www.pinterest.com", description: "Ultimate Weight Loss Guide — Simple daily habits and meal ideas to burn fat naturally: {LINK}", instructions: ["Create a Pinterest business account", "Create boards: 'Weight Loss Tips', 'Healthy Recipes', 'Fitness Motivation'", "Pin images with helpful weight loss tips", "Link each pin back to your page URL", "Pin 5-10 times per day using free scheduling tools"] },
    { id: "wl-12", name: "Medium Health Publication", niche: "Weight Loss", type: "Blog", difficulty: "Medium", traffic: "300-1500 visitors/month", time: "15 minutes", url: "https://medium.com", description: "I wrote about my weight loss journey and the science-backed strategies that finally worked for me: {LINK}", instructions: ["Create a free Medium account", "Write a 500-800 word article about weight loss tips", "Include your page URL naturally in the article", "Submit to health & fitness publications for more reach", "Publish 1-2 articles per week for ongoing traffic"] },

    // Make Money Online
    { id: "mmo-1", name: "Warrior Forum", niche: "Make Money Online", type: "Forum", difficulty: "Easy", traffic: "300-800 visitors/month", time: "10 minutes", url: "https://www.warriorforum.com", description: "Free guide reveals the exact steps I used to build a profitable online income from scratch: {LINK}", instructions: ["Create a free Warrior Forum account", "Set up your forum signature with your page URL", "Browse the main discussion boards", "Reply to threads with genuinely helpful advice", "Start 1-2 new threads per week sharing value"] },
    { id: "mmo-2", name: "BlackHatWorld Forum", niche: "Make Money Online", type: "Forum", difficulty: "Easy", traffic: "200-600 visitors/month", time: "10 minutes", url: "https://www.blackhatworld.com", description: "Here's a proven method for generating passive income online — step-by-step blueprint inside: {LINK}", instructions: ["Register for a free account", "Add your page URL to your signature", "Browse 'Making Money' and 'Affiliate Marketing' sections", "Contribute helpful responses to existing threads", "Avoid spammy posting — focus on adding real value"] },
    { id: "mmo-3", name: "r/WorkOnline Reddit", niche: "Make Money Online", type: "Social", difficulty: "Easy", traffic: "400-1200 visitors/month", time: "5 minutes", url: "https://www.reddit.com/r/WorkOnline", description: "This free guide shows how to start earning real money online without any upfront investment: {LINK}", instructions: ["Join r/WorkOnline on Reddit", "Share a genuine income story or helpful guide", "Include your link as a resource, not an ad", "Comment on other posts with useful tips", "Follow subreddit rules carefully to avoid bans"] },
    { id: "mmo-4", name: "Digital Point Forums", niche: "Make Money Online", type: "Forum", difficulty: "Easy", traffic: "150-500 visitors/month", time: "8 minutes", url: "https://www.digitalpoint.com", description: "Sharing my complete roadmap for building a sustainable online income stream from zero: {LINK}", instructions: ["Create your free account", "Add your page link to your forum signature", "Participate in the Business & Marketing forums", "Share case studies and results", "Post consistently 3-5 times per week"] },
    { id: "mmo-5", name: "Quora Money Topics", niche: "Make Money Online", type: "Q&A", difficulty: "Easy", traffic: "800-3000 visitors/month", time: "10 minutes", url: "https://www.quora.com", description: "Free step-by-step guide to building a real online income from scratch — no experience needed: {LINK}", instructions: ["Set up your Quora profile with expertise in online income", "Search for 'how to make money online' questions", "Write detailed, credible answers with real examples", "Include your page URL as a helpful resource", "Answer 3-5 questions daily for maximum traffic"] },
    { id: "mmo-6", name: "IndieHackers Community", niche: "Make Money Online", type: "Social", difficulty: "Easy", traffic: "200-700 visitors/month", time: "8 minutes", url: "https://www.indiehackers.com", description: "Here's the exact system I used to go from zero to consistent online revenue as a solo founder: {LINK}", instructions: ["Create your IndieHackers profile", "Share your income journey or project", "Engage in group discussions about side income", "Link to your page in relevant conversations", "Post milestone updates to build credibility"] },
    { id: "mmo-7", name: "Medium Entrepreneurship", niche: "Make Money Online", type: "Blog", difficulty: "Medium", traffic: "500-2000 visitors/month", time: "15 minutes", url: "https://medium.com", description: "I broke down my entire process for building a profitable online business into this free guide: {LINK}", instructions: ["Write an article about your online income method", "Include your page URL as the primary resource", "Submit to publications like 'The Startup' or 'Better Marketing'", "Add relevant tags: 'Make Money', 'Side Hustle', 'Passive Income'", "Share your article on social media for extra reach"] },
    { id: "mmo-8", name: "r/Entrepreneur Reddit", niche: "Make Money Online", type: "Social", difficulty: "Easy", traffic: "500-1500 visitors/month", time: "5 minutes", url: "https://www.reddit.com/r/Entrepreneur", description: "This actionable guide covers everything you need to start making money online this week: {LINK}", instructions: ["Subscribe to r/Entrepreneur (2M+ members)", "Share a value-packed post about a real strategy", "Include your link naturally as a resource", "Engage in comments to boost post visibility", "Post during peak hours (8-10 AM EST) for best reach"] },
    { id: "mmo-9", name: "HackerNews", niche: "Make Money Online", type: "Social", difficulty: "Medium", traffic: "1000-5000 visitors/month", time: "5 minutes", url: "https://news.ycombinator.com", description: "Built a side income using this framework — sharing the full breakdown for anyone interested: {LINK}", instructions: ["Create a HackerNews account", "Submit interesting content related to online income", "Participate in Show HN discussions", "Add your link in relevant comment threads", "Focus on providing genuine value — this community hates spam"] },
    { id: "mmo-10", name: "Pinterest Business Pins", niche: "Make Money Online", type: "Social", difficulty: "Easy", traffic: "400-1500 visitors/month", time: "10 minutes", url: "https://www.pinterest.com", description: "Make Money Online Blueprint — Proven strategies for building passive income from home: {LINK}", instructions: ["Create business-focused boards: 'Side Hustle Ideas', 'Make Money From Home'", "Design eye-catching pins with income tips (use Canva)", "Link every pin to your page URL", "Use keywords in pin descriptions for SEO", "Pin 10-15 times per day for maximum reach"] },
    { id: "mmo-11", name: "Craigslist Services", niche: "Make Money Online", type: "Classified", difficulty: "Easy", traffic: "100-400 visitors/month", time: "5 minutes", url: "https://www.craigslist.org", description: "Free guide to earning extra income online — real, proven methods that actually work: {LINK}", instructions: ["Go to your local Craigslist", "Post in 'Services' or 'Gigs' section", "Write a compelling title mentioning earning potential", "Include your page URL in the post body", "Repost every 48 hours for continuous visibility"] },
    { id: "mmo-12", name: "Facebook Groups (MMO)", niche: "Make Money Online", type: "Social", difficulty: "Easy", traffic: "300-1000 visitors/month", time: "10 minutes", url: "https://www.facebook.com/groups", description: "This free training shows the simplest way to start generating income online from day one: {LINK}", instructions: ["Search Facebook for 'make money online' groups", "Join 10-15 active groups with 5K+ members", "Share value posts with your link", "Engage with other members' posts", "Post 2-3 times per week per group"] },

    // Health & Fitness
    { id: "hf-1", name: "Bodybuilding.com Forums", niche: "Health & Fitness", type: "Forum", difficulty: "Easy", traffic: "300-800 visitors/month", time: "10 minutes", url: "https://forum.bodybuilding.com", description: "Complete fitness guide with workout routines and nutrition tips to build your best physique: {LINK}", instructions: ["Create a free account at Bodybuilding.com", "Navigate to the supplement or fitness forums", "Share workout tips or supplement reviews", "Add your page URL to your forum signature", "Reply to 3-5 threads daily with helpful advice"] },
    { id: "hf-2", name: "r/Fitness Reddit", niche: "Health & Fitness", type: "Social", difficulty: "Easy", traffic: "500-2000 visitors/month", time: "5 minutes", url: "https://www.reddit.com/r/fitness", description: "Found this incredible free resource for building strength and improving overall fitness: {LINK}", instructions: ["Join r/fitness on Reddit (10M+ members)", "Share workout routines or fitness transformations", "Include your page as a supplementary resource", "Follow community rules strictly", "Engage in daily discussion threads"] },
    { id: "hf-3", name: "MyFitnessPal Forums", niche: "Health & Fitness", type: "Forum", difficulty: "Easy", traffic: "200-500 visitors/month", time: "8 minutes", url: "https://community.myfitnesspal.com", description: "This all-in-one fitness and nutrition guide made my training so much more effective: {LINK}", instructions: ["Log into MyFitnessPal community", "Browse fitness and exercise discussion boards", "Share your routine and results", "Include your page link in relevant posts", "Be consistent with weekly contributions"] },
    { id: "hf-4", name: "Quora Fitness Topics", niche: "Health & Fitness", type: "Q&A", difficulty: "Easy", traffic: "400-1500 visitors/month", time: "10 minutes", url: "https://www.quora.com", description: "Here's a free science-based fitness guide covering workouts, nutrition, and recovery strategies: {LINK}", instructions: ["Search for fitness and health questions on Quora", "Write detailed answers about workouts, supplements, and nutrition", "Link to your page as a helpful resource", "Include before/after results when possible", "Answer 2-3 questions daily"] },
    { id: "hf-5", name: "Fitocracy Community", niche: "Health & Fitness", type: "Social", difficulty: "Easy", traffic: "100-400 visitors/month", time: "8 minutes", url: "https://www.fitocracy.com", description: "Sharing this game-changing fitness resource that helped me level up my training results: {LINK}", instructions: ["Sign up for a free Fitocracy account", "Log workouts and engage with the community", "Join fitness groups and challenges", "Share your page link in your bio and relevant posts", "Help others with workout advice"] },
    { id: "hf-6", name: "T-Nation Forums", niche: "Health & Fitness", type: "Forum", difficulty: "Medium", traffic: "200-700 visitors/month", time: "10 minutes", url: "https://forums.t-nation.com", description: "Evidence-based training guide with programs for building real muscle and strength: {LINK}", instructions: ["Register at T-Nation forums", "Participate in training and nutrition discussions", "Share evidence-based advice and personal experiences", "Include your page URL in your signature", "This is a knowledgeable community — provide quality content"] },
    { id: "hf-7", name: "Pinterest Fitness Boards", niche: "Health & Fitness", type: "Social", difficulty: "Easy", traffic: "500-2000 visitors/month", time: "10 minutes", url: "https://www.pinterest.com", description: "Ultimate Fitness Guide — Expert workout plans and healthy nutrition tips for real results: {LINK}", instructions: ["Create boards: 'Home Workouts', 'Fitness Tips', 'Healthy Meals'", "Pin workout images and infographics", "Link each pin back to your page URL", "Use fitness-related keywords in descriptions", "Pin consistently — 5-10 pins per day"] },
    { id: "hf-8", name: "Medium Fitness Articles", niche: "Health & Fitness", type: "Blog", difficulty: "Medium", traffic: "300-1200 visitors/month", time: "15 minutes", url: "https://medium.com", description: "I put together a comprehensive guide to getting fit with practical, no-BS workout and diet advice: {LINK}", instructions: ["Write a helpful fitness article (500-800 words)", "Include your page URL as a resource", "Add tags: 'Fitness', 'Health', 'Workout', 'Wellness'", "Submit to fitness publications for more reach", "Publish 1-2 articles per week"] },

    // Tech & Gadgets
    { id: "tg-1", name: "Reddit r/gadgets", niche: "Tech & Gadgets", type: "Social", difficulty: "Easy", traffic: "500-2000 visitors/month", time: "5 minutes", url: "https://www.reddit.com/r/gadgets", description: "Just discovered this awesome tech guide with the best gadget picks and honest reviews: {LINK}", instructions: ["Join r/gadgets on Reddit", "Share genuine tech reviews or discoveries", "Include your link in relevant discussions", "Follow community posting rules", "Comment helpfully on other tech posts"] },
    { id: "tg-2", name: "Tom's Hardware Forums", niche: "Tech & Gadgets", type: "Forum", difficulty: "Easy", traffic: "200-600 visitors/month", time: "10 minutes", url: "https://forums.tomshardware.com", description: "This comprehensive tech buying guide saved me hours of research — covers all the top gadgets: {LINK}", instructions: ["Create your free forum account", "Help people with tech questions and recommendations", "Add your page URL to your forum signature", "Participate in buying guide discussions", "Post 3-5 helpful replies per week"] },
    { id: "tg-3", name: "Quora Tech Topics", niche: "Tech & Gadgets", type: "Q&A", difficulty: "Easy", traffic: "500-2000 visitors/month", time: "10 minutes", url: "https://www.quora.com", description: "Here's a curated guide to the best tech and gadgets right now with honest comparisons: {LINK}", instructions: ["Search for tech product questions on Quora", "Write detailed comparison and recommendation answers", "Include your page URL as a resource", "Focus on 'best gadget for...' type questions", "Answer 2-3 questions daily"] },
    { id: "tg-4", name: "SlickDeals Forums", niche: "Tech & Gadgets", type: "Forum", difficulty: "Easy", traffic: "300-1000 visitors/month", time: "8 minutes", url: "https://slickdeals.net/forums", description: "Found this amazing resource with top-rated tech deals and unbiased gadget reviews: {LINK}", instructions: ["Create a SlickDeals account", "Share deals and tech product reviews", "Include your link when discussing relevant products", "Participate in the Hot Deals forum", "Build reputation by sharing genuine value"] },
    { id: "tg-5", name: "Pinterest Tech Boards", niche: "Tech & Gadgets", type: "Social", difficulty: "Easy", traffic: "300-1200 visitors/month", time: "10 minutes", url: "https://www.pinterest.com", description: "Best Tech Gadgets Guide — Expert reviews and top picks for smart home, audio, and more: {LINK}", instructions: ["Create boards: 'Cool Gadgets', 'Tech Must-Haves', 'Smart Home'", "Pin product images with short reviews", "Link pins to your page URL", "Use tech keywords in descriptions", "Pin 5-10 times daily"] },
    { id: "tg-6", name: "Medium Tech Articles", niche: "Tech & Gadgets", type: "Blog", difficulty: "Medium", traffic: "400-1500 visitors/month", time: "15 minutes", url: "https://medium.com", description: "I reviewed the top gadgets worth buying right now and put everything in one easy guide: {LINK}", instructions: ["Write a gadget review or tech comparison article", "Include your page URL in the article", "Add tags: 'Technology', 'Gadgets', 'Reviews'", "Submit to tech publications on Medium", "Publish weekly for consistent traffic"] },

    // Beauty & Skincare
    { id: "bs-1", name: "MakeupAlley Forums", niche: "Beauty & Skincare", type: "Forum", difficulty: "Easy", traffic: "200-600 visitors/month", time: "10 minutes", url: "https://www.makeupalley.com", description: "This skincare routine guide transformed my skin — includes product recs for every skin type: {LINK}", instructions: ["Create a free MakeupAlley account", "Write product reviews and share your skincare routine", "Include your page link in relevant discussions", "Engage with other members' reviews", "Post consistently 3-5 times per week"] },
    { id: "bs-2", name: "Reddit r/SkincareAddiction", niche: "Beauty & Skincare", type: "Social", difficulty: "Easy", traffic: "500-2000 visitors/month", time: "5 minutes", url: "https://www.reddit.com/r/SkincareAddiction", description: "Free skincare guide with dermatologist-approved tips and affordable product recommendations: {LINK}", instructions: ["Join r/SkincareAddiction (2M+ members)", "Share your skincare routine or product reviews", "Include your link naturally in helpful posts", "Follow the strict community rules", "Engage in daily help threads"] },
    { id: "bs-3", name: "Quora Beauty Topics", niche: "Beauty & Skincare", type: "Q&A", difficulty: "Easy", traffic: "400-1500 visitors/month", time: "10 minutes", url: "https://www.quora.com", description: "Here's a complete beauty and skincare guide with routines that actually deliver visible results: {LINK}", instructions: ["Find beauty and skincare questions on Quora", "Write detailed answers about routines and products", "Include your page URL as a resource", "Focus on 'best product for...' questions", "Answer 2-3 questions daily"] },
    { id: "bs-4", name: "Pinterest Beauty Boards", niche: "Beauty & Skincare", type: "Social", difficulty: "Easy", traffic: "600-2500 visitors/month", time: "10 minutes", url: "https://www.pinterest.com", description: "Ultimate Skincare Guide — Expert tips, product picks, and routines for glowing, healthy skin: {LINK}", instructions: ["Create boards: 'Skincare Tips', 'Beauty Hacks', 'Anti-Aging'", "Pin skincare routine infographics and product images", "Link all pins to your page URL", "Use beauty-related keywords in descriptions", "Pin 10-15 times per day for maximum reach"] },
    { id: "bs-5", name: "EssentialDay Spa Forum", niche: "Beauty & Skincare", type: "Forum", difficulty: "Easy", traffic: "100-300 visitors/month", time: "8 minutes", url: "https://www.essentialdayspa.com/forum", description: "Sharing my go-to skincare resource with spa-quality tips you can easily do at home: {LINK}", instructions: ["Register for the forum", "Share skincare advice and product experiences", "Add your page URL to your signature", "Participate in skincare routine discussions", "Post weekly to stay visible"] },
    { id: "bs-6", name: "Medium Beauty Articles", niche: "Beauty & Skincare", type: "Blog", difficulty: "Medium", traffic: "300-1200 visitors/month", time: "15 minutes", url: "https://medium.com", description: "I compiled everything I've learned about skincare into this simple, results-driven beauty guide: {LINK}", instructions: ["Write a skincare tips or product review article", "Include your page URL naturally in the content", "Use tags: 'Beauty', 'Skincare', 'Self Care'", "Submit to beauty publications for more reach", "Publish 1-2 articles per week"] },

    // Relationships
    { id: "rel-1", name: "Reddit r/relationships", niche: "Relationships", type: "Social", difficulty: "Easy", traffic: "400-1500 visitors/month", time: "5 minutes", url: "https://www.reddit.com/r/relationships", description: "This relationship guide has genuinely helpful advice for building stronger, healthier connections: {LINK}", instructions: ["Join r/relationships on Reddit", "Offer genuinely helpful relationship advice", "Include your link when sharing relevant resources", "Be empathetic and follow community rules", "Engage with multiple posts daily"] },
    { id: "rel-2", name: "Quora Relationship Topics", niche: "Relationships", type: "Q&A", difficulty: "Easy", traffic: "600-2500 visitors/month", time: "10 minutes", url: "https://www.quora.com", description: "Here's a free guide with practical tips for improving communication and deepening your relationship: {LINK}", instructions: ["Search for relationship and dating questions", "Write thoughtful, detailed answers", "Include your page as a helpful resource", "Focus on 'how to improve relationship' questions", "Answer 2-3 questions daily"] },
    { id: "rel-3", name: "LoveShack Forum", niche: "Relationships", type: "Forum", difficulty: "Easy", traffic: "100-400 visitors/month", time: "8 minutes", url: "https://www.loveshack.org", description: "Found this amazing relationship resource full of expert advice on love, trust, and real connection: {LINK}", instructions: ["Create a free forum account", "Participate in relationship discussion threads", "Share helpful advice based on experience", "Add your page URL to your signature", "Post 3-5 times per week"] },
    { id: "rel-4", name: "Pinterest Relationship Boards", niche: "Relationships", type: "Social", difficulty: "Easy", traffic: "300-1200 visitors/month", time: "10 minutes", url: "https://www.pinterest.com", description: "Relationship Tips Guide — Strengthen your bond with these expert-backed communication strategies: {LINK}", instructions: ["Create boards: 'Relationship Tips', 'Date Ideas', 'Love Quotes'", "Pin relationship advice infographics", "Link pins to your page URL", "Use relationship keywords in descriptions", "Pin consistently every day"] },
    { id: "rel-5", name: "Talk About Marriage Forum", niche: "Relationships", type: "Forum", difficulty: "Easy", traffic: "150-500 visitors/month", time: "8 minutes", url: "https://www.talkaboutmarriage.com", description: "This guide to building a stronger marriage covers communication, trust, and keeping the spark alive: {LINK}", instructions: ["Register for the forum", "Offer supportive advice in discussion threads", "Share your page link in your forum signature", "Be genuine and empathetic in your responses", "Engage regularly with the community"] },
    { id: "rel-6", name: "Medium Relationship Articles", niche: "Relationships", type: "Blog", difficulty: "Medium", traffic: "400-1500 visitors/month", time: "15 minutes", url: "https://medium.com", description: "I wrote about the relationship habits that actually make a difference — based on research and experience: {LINK}", instructions: ["Write a relationship advice article (500-800 words)", "Include your page URL as a resource", "Add tags: 'Relationships', 'Love', 'Dating', 'Marriage'", "Submit to relationship publications", "Publish weekly for consistent traffic"] },

    // Pets
    { id: "pet-1", name: "DogForum Community", niche: "Pets", type: "Forum", difficulty: "Easy", traffic: "200-600 visitors/month", time: "10 minutes", url: "https://www.dogforum.com", description: "Complete dog care guide with training tips, health advice, and product recommendations from real owners: {LINK}", instructions: ["Create a free account", "Join dog training and health discussion threads", "Share helpful tips and personal experiences", "Add your page URL to your signature", "Post 3-5 times per week"] },
    { id: "pet-2", name: "Reddit r/dogs", niche: "Pets", type: "Social", difficulty: "Easy", traffic: "400-1500 visitors/month", time: "5 minutes", url: "https://www.reddit.com/r/dogs", description: "This free pet care resource has everything you need to keep your dog happy and healthy: {LINK}", instructions: ["Join r/dogs on Reddit (3M+ members)", "Share pet care tips and product recommendations", "Include your link naturally in helpful posts", "Follow community rules carefully", "Engage in daily discussion threads"] },
    { id: "pet-3", name: "TheCatSite Forum", niche: "Pets", type: "Forum", difficulty: "Easy", traffic: "150-500 visitors/month", time: "8 minutes", url: "https://thecatsite.com/forums", description: "Found this awesome guide for cat owners covering health, behavior, and the best products: {LINK}", instructions: ["Register at TheCatSite forums", "Participate in cat health and behavior discussions", "Share your expertise and product recommendations", "Include your page link in your signature", "Post consistently for visibility"] },
    { id: "pet-4", name: "Quora Pet Topics", niche: "Pets", type: "Q&A", difficulty: "Easy", traffic: "300-1200 visitors/month", time: "10 minutes", url: "https://www.quora.com", description: "Here's a comprehensive pet care guide with expert tips for keeping your furry friend thriving: {LINK}", instructions: ["Search for pet care questions on Quora", "Write detailed answers about pet health and products", "Include your page URL as a resource", "Focus on 'best product for dogs/cats' questions", "Answer 2-3 questions daily"] },
    { id: "pet-5", name: "Pinterest Pet Boards", niche: "Pets", type: "Social", difficulty: "Easy", traffic: "400-1500 visitors/month", time: "10 minutes", url: "https://www.pinterest.com", description: "Ultimate Pet Care Guide — Expert tips for dog and cat owners who want the best for their pets: {LINK}", instructions: ["Create boards: 'Dog Tips', 'Cat Care', 'Pet Products'", "Pin pet care infographics and product images", "Link all pins to your page URL", "Use pet-related keywords in descriptions", "Pin 5-10 times daily"] },
    { id: "pet-6", name: "PetForums.co.uk", niche: "Pets", type: "Forum", difficulty: "Easy", traffic: "100-400 visitors/month", time: "8 minutes", url: "https://www.petforums.co.uk", description: "Sharing this wonderful pet care resource packed with practical advice from experienced pet owners: {LINK}", instructions: ["Create a free account", "Join relevant pet discussion threads", "Share helpful advice about pet products and care", "Add your page link to your signature", "Be a genuine, active community member"] },

    // Home & Garden
    { id: "hg-1", name: "GardenWeb Forums", niche: "Home & Garden", type: "Forum", difficulty: "Easy", traffic: "200-600 visitors/month", time: "10 minutes", url: "https://www.houzz.com/discussions", description: "This home and garden guide is packed with DIY tips and project ideas that actually save money: {LINK}", instructions: ["Create a free Houzz account", "Browse the garden and home improvement forums", "Share DIY tips and product recommendations", "Include your page URL in relevant discussions", "Post consistently 3-5 times per week"] },
    { id: "hg-2", name: "Reddit r/HomeImprovement", niche: "Home & Garden", type: "Social", difficulty: "Easy", traffic: "400-1500 visitors/month", time: "5 minutes", url: "https://www.reddit.com/r/HomeImprovement", description: "Free guide with the best home improvement hacks and garden projects for every skill level: {LINK}", instructions: ["Join r/HomeImprovement (5M+ members)", "Share DIY tips, product reviews, or before/after projects", "Include your link naturally as a resource", "Follow community rules", "Engage with other posts daily"] },
    { id: "hg-3", name: "Quora Home Topics", niche: "Home & Garden", type: "Q&A", difficulty: "Easy", traffic: "300-1200 visitors/month", time: "10 minutes", url: "https://www.quora.com", description: "Here's a practical home improvement guide with step-by-step projects anyone can tackle: {LINK}", instructions: ["Search for home improvement and gardening questions", "Write detailed answers with practical advice", "Include your page URL as a resource", "Focus on 'how to' and 'best product for' questions", "Answer 2-3 questions daily"] },
    { id: "hg-4", name: "Pinterest Home & Garden", niche: "Home & Garden", type: "Social", difficulty: "Easy", traffic: "600-2500 visitors/month", time: "10 minutes", url: "https://www.pinterest.com", description: "Home & Garden Guide — Beautiful DIY projects and gardening tips to transform your space: {LINK}", instructions: ["Create boards: 'DIY Home', 'Garden Ideas', 'Home Hacks'", "Pin before/after images and DIY infographics", "Link all pins to your page URL", "Use home improvement keywords in descriptions", "Pin 10-15 times per day for maximum reach"] },
    { id: "hg-5", name: "DIY Chatroom Forum", niche: "Home & Garden", type: "Forum", difficulty: "Easy", traffic: "150-500 visitors/month", time: "8 minutes", url: "https://www.diychatroom.com", description: "Discovered this fantastic DIY resource with simple home projects that make a big impact: {LINK}", instructions: ["Register for the forum", "Browse home improvement discussion threads", "Share your DIY experiences and product recommendations", "Add your page URL to your signature", "Help others with their home projects"] },
    { id: "hg-6", name: "Medium Home Articles", niche: "Home & Garden", type: "Blog", difficulty: "Medium", traffic: "300-1200 visitors/month", time: "15 minutes", url: "https://medium.com", description: "I put together my best home improvement tips and garden hacks into one easy-to-follow guide: {LINK}", instructions: ["Write a home improvement tips or gardening article", "Include your page URL naturally in the content", "Add tags: 'Home', 'DIY', 'Garden', 'Home Improvement'", "Submit to relevant publications for more reach", "Publish 1-2 articles per week"] },
];

const STORAGE_KEY = "cashtap_autopilot_completed";

function loadCompleted(): Set<string> {
    if (typeof window === "undefined") return new Set();
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
}

export default function AutomatedProfitsPage() {
    const [selectedNiche, setSelectedNiche] = useState("All");
    const [pageUrl, setPageUrl] = useState("");
    const [completed, setCompleted] = useState<Set<string>>(new Set());
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [copiedDescId, setCopiedDescId] = useState<string | null>(null);
    const [showOfferBanner, setShowOfferBanner] = useState(false);
    const [loadingNiche, setLoadingNiche] = useState(false);
    const [loadingLabel, setLoadingLabel] = useState("Loading traffic sources...");
    const [videoOpen, setVideoOpen] = useState(false);
    const [visibleCount, setVisibleCount] = useState(24);
    const delayRef = useRef<number | null>(null);

    useEffect(() => () => {
        if (delayRef.current) window.clearTimeout(delayRef.current);
    }, []);

    useEffect(() => { setCompleted(loadCompleted()); }, []);

    const toggleCompleted = (id: string) => {
        setCompleted(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
            return next;
        });
    };

    const handleNicheChange = (niche: string) => {
        if (niche === selectedNiche || loadingNiche) return;
        if (delayRef.current) window.clearTimeout(delayRef.current);
        setShowOfferBanner(true);
        setLoadingNiche(true);
        setLoadingLabel(`Loading ${niche} traffic sources...`);
        delayRef.current = window.setTimeout(() => {
            setSelectedNiche(niche);
            setVisibleCount(24);
            setLoadingNiche(false);
            delayRef.current = null;
        }, randomDelay(3500, 4500));
    };

    const filteredSources = useMemo(() => {
        return selectedNiche === "All" ? SOURCES : SOURCES.filter(s => s.niche === selectedNiche);
    }, [selectedNiche]);

    const completedCount = useMemo(() => {
        return filteredSources.filter(s => completed.has(s.id)).length;
    }, [filteredSources, completed]);

    const progressPercent = filteredSources.length > 0 ? Math.round((completedCount / filteredSources.length) * 100) : 0;

    const typeBadgeColor: Record<SourceType, string> = {
        Forum: "border-[var(--border-subtle)] bg-[var(--surface-2)] text-text-muted",
        Social: "border-[var(--border-subtle)] bg-[var(--surface-2)] text-text-muted",
        Directory: "border-[var(--border-subtle)] bg-[var(--surface-2)] text-text-muted",
        Blog: "border-[var(--border-subtle)] bg-[var(--surface-2)] text-text-muted",
        "Q&A": "border-[var(--border-subtle)] bg-[var(--surface-2)] text-text-muted",
        Classified: "border-[var(--border-subtle)] bg-[var(--surface-2)] text-text-muted",
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mx-auto flex w-full max-w-6xl flex-col gap-0 py-6"
        >
            <PageHeader
                eyebrow="PREMIUM"
                title={
                    <>
                        Automated Income — Traffic On <span className="text-gradient">Autopilot</span>
                    </>
                }
                subtitle="100+ free traffic sources — submit once and get ongoing visitors automatically."
            />

            {(loadingNiche || showOfferBanner) && (
                <GenerationProgress
                    active={loadingNiche}
                    showBanner={showOfferBanner}
                    label={loadingLabel}
                    offer="welcome"
                />
            )}

            {/* Hero */}
            <section className="card-base relative flex flex-col items-center gap-4 overflow-hidden p-8 text-center md:p-12">
                <div className="relative z-10 flex flex-col items-center gap-6">
                    <div className="flex h-16 w-16 items-center justify-center rounded-[var(--radius-lg)] border border-[rgba(234,179,8,0.3)] bg-[rgba(234,179,8,0.08)]">
                        <TrendingUp size={32} strokeWidth={1.5} className="text-[var(--gold)]" />
                    </div>
                    <h2 className="ds-h2">100+ Free Traffic Sources — Submit Once, Get Traffic Forever</h2>
                    <p className="max-w-2xl text-base leading-relaxed text-text-secondary">
                        Stop chasing traffic every day. Submit your link to these 100+ sites ONCE and get ongoing traffic automatically. Our members have generated over 2.8 million visitors using these sources.
                    </p>
                </div>
            </section>

            {/* Video Tutorial */}
            <section className="card-base mt-10 overflow-hidden p-0!">
                <div className="flex flex-col md:flex-row">
                    <div className="md:w-1/2">
                        <VideoThumbnail
                            videoId={AUTOPILOT_VIDEO_ID}
                            title="How to Use Automated Income"
                            onPlay={() => setVideoOpen(true)}
                            className="rounded-none border-0"
                        />
                    </div>
                    <div className="md:w-1/2 p-8 md:p-10 flex flex-col justify-center gap-4">
                        <div className="flex items-center gap-2">
                            <Sparkles size={14} className="text-[var(--gold)]" />
                            <span className="page-eyebrow text-[11px]!">Watch First</span>
                        </div>
                        <h2 className="ds-h2">How to Use Automated Income</h2>
                        <p className="text-text-secondary leading-relaxed">
                            Watch this quick tutorial to learn how to submit your link to these 100+ traffic sources and get automated traffic forever!
                        </p>
                    </div>
                </div>
            </section>

            {/* How This Works */}
            <section className="card-base mt-10 flex flex-col gap-8 p-8!">
                <div className="flex items-center gap-3">
                    <BookOpen size={22} className="text-[var(--gold)]" />
                    <h2 className="text-xl font-bold text-text-primary">How This Works (Super Simple!)</h2>
                </div>

                <div className="flex flex-col gap-4 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-2)] p-6">
                    <h3 className="text-base font-bold text-text-primary">The Secret To Automated Traffic:</h3>
                    <p className="text-sm text-text-secondary leading-relaxed">Most people waste hours every day posting on social media for traffic.</p>
                    <p className="text-sm text-text-secondary leading-relaxed">But what if you could submit your link ONCE and get traffic for months or even YEARS?</p>
                    <p className="text-sm font-bold leading-relaxed text-[var(--gold)]">That&apos;s exactly what these traffic sources do. You submit once, and they send you visitors automatically - no daily work required!</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {[
                        { num: "1", title: "Pick Your Niche", desc: "Choose your niche below and get 100+ traffic sources specifically for your market." },
                        { num: "2", title: "Submit Your Link", desc: "Follow the simple step-by-step instructions to submit your link to each site. Takes 5-15 minutes per site." },
                        { num: "3", title: "Get Automatic Traffic", desc: "Once submitted, these sites send you traffic automatically. No daily work needed!" },
                    ].map((step) => (
                        <div key={step.num} className="flex flex-col gap-4 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-2)] p-6">
                            <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--gold)] text-sm font-semibold text-[#0A0A0B]">
                                {step.num}
                            </div>
                            <h3 className="text-lg font-bold text-text-primary">{step.title}</h3>
                            <p className="text-sm text-text-secondary leading-relaxed">{step.desc}</p>
                        </div>
                    ))}
                </div>

                <div className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-[rgba(234,179,8,0.2)] bg-[rgba(234,179,8,0.06)] p-5">
                    <Lightbulb size={18} className="mt-0.5 shrink-0 text-[var(--gold)]" />
                    <div>
                        <span className="text-sm font-bold text-[var(--gold)]">Pro Tip: </span>
                        <span className="text-sm text-text-secondary">Set aside 2-3 hours and submit to as many sources as possible. The more you submit to, the more automatic traffic you get. Most members submit to 50+ sources in their first week!</span>
                    </div>
                </div>
            </section>

            {/* ====== INTERACTIVE SECTION ====== */}
            <section className="mt-14 flex flex-col gap-8">
                {/* Page URL Input */}
                <div className="card-base flex flex-col gap-4 p-8!">
                    <h3 className="inline-flex items-center gap-2 text-lg font-bold text-text-primary">
                        Enter Your Page URL:
                        <InfoHint
                            label="What is a page URL or affiliate link?"
                            text="This is the web address you want to promote — usually your affiliate link (your own special link that pays you when someone buys through it)."
                        />
                    </h3>
                    <Field
                        type="url"
                        placeholder="https://your-page-url.com"
                        value={pageUrl}
                        onChange={(e) => setPageUrl(e.target.value)}
                        hint="This is the page you want to promote. We&apos;ll automatically insert it in all the submission descriptions below."
                    />
                </div>

                {/* Niche Selector */}
                <div className="flex flex-wrap gap-2">
                    {NICHES.map((niche) => (
                        <SelectableChip
                            key={niche}
                            label={niche}
                            selected={selectedNiche === niche}
                            disabled={loadingNiche}
                            onClick={() => handleNicheChange(niche)}
                        />
                    ))}
                </div>

                {/* Progress Tracker */}
                <div className="card-base flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="ds-h3">Your Progress:</h3>
                            <p className="text-sm text-text-secondary">{completedCount} of {filteredSources.length} sources completed</p>
                        </div>
                        <div className="text-right">
                            <span className="text-2xl font-bold tabular-nums text-[var(--gold)]">{progressPercent}%</span>
                            <p className="text-xs text-text-muted">Complete</p>
                        </div>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full border border-[var(--border-subtle)] bg-[var(--surface-2)]">
                        <motion.div
                            className="h-full rounded-full"
                            style={{ background: "var(--grad-brand)" }}
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 0.5 }}
                        />
                    </div>
                </div>

                {/* Traffic Sources Grid (windowed for long lists) */}
                <div id="generation-results" className="grid grid-cols-1 md:grid-cols-2 gap-5 scroll-mt-24">
                    {!loadingNiche && filteredSources.slice(0, visibleCount).map((source, idx) => {
                        const isExpanded = expandedId === source.id;
                        const isDone = completed.has(source.id);

                        return (
                            <motion.div
                                key={source.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: Math.min(idx * 0.03, 0.8) }}
                                className={clsx(
                                    "card-base overflow-hidden p-0! transition-all",
                                    isDone ? "border-[rgba(16,185,129,0.35)]" : "hover:border-[rgba(234,179,8,0.3)]"
                                )}
                            >
                                <div className="flex flex-col gap-3 p-5">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className={clsx("rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", typeBadgeColor[source.type])}>
                                            {source.type}
                                        </span>
                                        <span className={clsx(
                                            "rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                                            source.difficulty === "Easy"
                                                ? "bg-[rgba(16,185,129,0.12)] text-[var(--success)]"
                                                : "bg-[rgba(245,179,1,0.12)] text-[var(--warning)]"
                                        )}>
                                            {source.difficulty}
                                        </span>
                                        {isDone && (
                                            <span className="ml-auto rounded-md border border-[rgba(16,185,129,0.25)] bg-[rgba(16,185,129,0.12)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--success)]">
                                                Done
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="text-base font-bold text-text-primary">{source.name}</h3>

                                    <div className="flex items-center gap-4 text-xs text-text-muted">
                                        <div className="flex items-center gap-1.5">
                                            <Users size={12} className="text-accent" />
                                            <span>Traffic: {source.traffic}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Clock size={12} className="text-accent" />
                                            <span>Time: {source.time}</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setExpandedId(isExpanded ? null : source.id)}
                                        className="w-full btn-primary py-3 text-sm mt-1"
                                    >
                                        <ExternalLink size={14} />
                                        <span>{isExpanded ? "Hide Instructions" : "View Instructions"}</span>
                                    </button>
                                </div>

                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="flex flex-col gap-4 border-t border-[var(--border-subtle)] px-5 pb-5 pt-4">
                                                <div className="flex flex-col gap-2.5">
                                                    {source.instructions.map((step, i) => (
                                                        <div key={i} className="flex items-start gap-2.5 text-sm text-text-secondary">
                                                            <span className="text-accent font-bold shrink-0 mt-0.5">{i + 1}.</span>
                                                            <span>{pageUrl ? step.replace(/your (page )?(URL|link|page url)/gi, pageUrl) : step}</span>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="flex flex-col gap-2">
                                                    <div className="flex items-center gap-2 text-sm font-bold text-[var(--gold)]">
                                                        <Clipboard size={14} />
                                                        <span>Use This Description When Submitting:</span>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] p-3">
                                                        <p className="flex-1 break-all text-sm text-text-secondary">
                                                            {source.description.replace("{LINK}", pageUrl || "[YOUR_LINK]")}
                                                        </p>
                                                        <button
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(source.description.replace("{LINK}", pageUrl || "[YOUR_LINK]"));
                                                                setCopiedDescId(source.id);
                                                                setTimeout(() => setCopiedDescId(null), 2000);
                                                            }}
                                                            className={clsx(
                                                                "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                                                                copiedDescId === source.id
                                                                    ? "border border-[rgba(16,185,129,0.25)] bg-[rgba(16,185,129,0.12)] text-[var(--success)]"
                                                                    : "btn-secondary px-3 py-1.5 text-xs"
                                                            )}
                                                        >
                                                            {copiedDescId === source.id ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                                                            <span>{copiedDescId === source.id ? "Copied!" : "Copy Description"}</span>
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <a
                                                        href={source.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="btn-secondary py-2.5 text-xs flex-1"
                                                    >
                                                        <ExternalLink size={13} />
                                                        <span>Open {source.name}</span>
                                                    </a>
                                                    <button
                                                        onClick={() => toggleCompleted(source.id)}
                                                        className={clsx(
                                                            "flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold transition-all",
                                                            isDone
                                                                ? "border border-[rgba(16,185,129,0.25)] bg-[rgba(16,185,129,0.12)] text-[var(--success)]"
                                                                : "btn-secondary px-4 py-2.5 text-xs"
                                                        )}
                                                    >
                                                        <CheckCircle2 size={13} />
                                                        <span>{isDone ? "Completed" : "Mark Done"}</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>
                {!loadingNiche && visibleCount < filteredSources.length && (
                    <div className="mt-6 flex justify-center">
                        <button
                            type="button"
                            onClick={() => setVisibleCount((c) => c + 24)}
                            className="btn-secondary px-6 py-2.5 text-sm"
                        >
                            Show more sources ({filteredSources.length - visibleCount} remaining)
                        </button>
                    </div>
                )}
            </section>

            {/* Footer */}
            <footer className="mt-16 flex flex-col items-center gap-4 border-t border-[var(--border-subtle)] pt-8 pb-10">
                <div className="flex flex-wrap items-center justify-center gap-6">
                    {["100+ Sources", "9 Niches", "Submit Once", "Traffic Forever"].map((b, i) => (
                        <div key={i} className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-text-muted">
                            <div className="h-1 w-1 rounded-full bg-[var(--gold)]" />
                            {b}
                        </div>
                    ))}
                </div>
                <p className="text-[12px] text-text-muted font-medium">
                    © 2026 CashTap AI. All rights reserved.
                </p>
            </footer>

            <VideoOverlay
                open={videoOpen}
                onClose={() => setVideoOpen(false)}
                videoUrl={`https://player.vimeo.com/video/${AUTOPILOT_VIDEO_ID}`}
                title="How to Use Automated Income"
            />
        </motion.div>
    );
}
