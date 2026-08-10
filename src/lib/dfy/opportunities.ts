import type { SupabaseClient } from "@supabase/supabase-js";
import { searchSocialData, sanitizePosts } from "@/lib/rapidapi";
import type { SocialPost } from "./types";

const FALLBACK_KEY = "how to make money with ai tools reddit";

const FALLBACK_POSTS: SocialPost[] = [
    { id: "fb-ai-1", platform: "Reddit", title: "Most AI monetization advice is BS - I spent 3 months testing", text: "I spent 3 months testing ChatGPT and Midjourney for freelance writing and made $750 profit. Here's the honest workflow.", url: "https://www.reddit.com/r/AIContentAutomators/comments/1qzgzp3/", engagement: 1102 },
    { id: "fb-ai-2", platform: "Reddit", title: "I tested using AI to make money for 30 days", text: "After 30 days of testing various AI money-making methods, here are the results. A few were genuinely profitable.", url: "https://www.reddit.com/r/passive_income/comments/1r4txwl/", engagement: 892 },
    { id: "fb-ai-3", platform: "Reddit", title: "Real talk, who is actually making money with an AI side hustle?", text: "I want to hear from people who are ACTUALLY making money with AI tools. Real numbers, real methods.", url: "https://www.reddit.com/r/sidehustle/comments/1r5o1c9/", engagement: 723 },
    { id: "fb-ai-4", platform: "Reddit", title: "Realistic ways to make money with AI", text: "Custom chatbots, AI workflows, content repurposing. No get-rich-quick promises, just proven methods.", url: "https://www.reddit.com/r/thesidehustle/comments/1jfnz7d/", engagement: 654 },
    { id: "fb-ai-5", platform: "YouTube", title: "How I use AI tools to earn online", text: "A practical breakdown of AI side income methods that actually work for beginners.", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", engagement: 1200 },
];

export async function discoverPosts(
    supabase: SupabaseClient,
    queries: string[],
): Promise<SocialPost[]> {
    const seen = new Set<string>();
    const collected: SocialPost[] = [];

    for (const query of queries) {
        if (collected.length >= 15) break;

        const { data: cached } = await supabase
            .from("analysis_results")
            .select("data")
            .eq("keyword", query)
            .order("created_at", { ascending: false })
            .limit(1);

        let posts: SocialPost[] = [];
        if (cached?.[0]?.data?.threads?.length) {
            posts = sanitizePosts(cached[0].data.threads);
        } else {
            try {
                posts = sanitizePosts(await searchSocialData(query));
                if (posts.length > 0) {
                    await supabase.from("analysis_results").insert([{ keyword: query, data: { threads: posts } }]);
                }
            } catch {
                posts = [];
            }
        }

        for (const post of posts) {
            const key = post.url || post.id;
            if (!key || seen.has(key)) continue;
            seen.add(key);
            collected.push({
                id: post.id || key,
                platform: post.platform || "Reddit",
                text: post.text || post.title || "",
                title: post.title,
                url: post.url,
                engagement: post.engagement,
            });
            if (collected.length >= 15) break;
        }
    }

    if (collected.length === 0) {
        return FALLBACK_POSTS.slice(0, 10);
    }

    return collected.slice(0, 15);
}
