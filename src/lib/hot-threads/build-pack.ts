import type { SupabaseClient } from "@supabase/supabase-js";
import { getNicheById, type NicheId } from "@/lib/niches";
import { searchSocialData, sanitizePosts } from "@/lib/rapidapi";
import { generateReplies } from "@/lib/llm";
import { getFallbackPostsForNiche } from "@/lib/dfy/search-fallbacks";
import {
  LINK_PLACEHOLDER,
  MIN_PACK_SIZE,
  TARGET_PACK_SIZE,
  type HotThreadItem,
  type HotThreadPackRow,
} from "./types";
import { utcPackDate } from "./ttl";

function engagementNum(value: string | number | undefined): number {
  if (typeof value === "number") return value;
  if (!value) return 0;
  const n = Number(String(value).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function dedupeKey(post: { id?: string; url?: string; platform?: string; title?: string }): string {
  return post.id || post.url || `${post.platform || "x"}-${post.title || ""}`;
}

function toThreadSeed(post: Record<string, unknown>): HotThreadItem {
  const id = String(post.id || post.url || `ht-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  return {
    id,
    platform: String(post.platform || "Reddit"),
    title: post.title ? String(post.title) : undefined,
    text: String(post.text || post.title || ""),
    url: String(post.url || ""),
    engagement: (post.engagement as string | number) ?? 0,
    replies: [],
  };
}

async function discoverThreads(nicheId: NicheId): Promise<HotThreadItem[]> {
  const niche = getNicheById(nicheId);
  if (!niche) return [];

  const seen = new Set<string>();
  const collected: HotThreadItem[] = [];

  for (const term of niche.searchTerms.slice(0, 3)) {
    if (collected.length >= TARGET_PACK_SIZE) break;
    try {
      const posts = sanitizePosts(await searchSocialData(term));
      for (const post of posts) {
        const key = dedupeKey(post);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        collected.push(toThreadSeed(post));
        if (collected.length >= TARGET_PACK_SIZE * 2) break;
      }
    } catch {
      // try next term
    }
  }

  collected.sort((a, b) => engagementNum(b.engagement) - engagementNum(a.engagement));

  if (collected.length < MIN_PACK_SIZE) {
    for (const fb of getFallbackPostsForNiche(nicheId)) {
      const key = dedupeKey(fb);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      collected.push(toThreadSeed(fb as unknown as Record<string, unknown>));
      if (collected.length >= TARGET_PACK_SIZE) break;
    }
  }

  return collected.slice(0, TARGET_PACK_SIZE);
}

function fallbackReplies(topic: string): string[] {
  const t = topic.slice(0, 60) || "this";
  return [
    `This is exactly what I was looking for. I've been researching "${t}" and the best thing I found was this: ${LINK_PLACEHOLDER}`,
    `I was in the same spot. What finally helped me with "${t}" was this: ${LINK_PLACEHOLDER} — worth a look.`,
    `Has anyone tried ${LINK_PLACEHOLDER} for "${t}"? Curious if it lives up to the hype.`,
  ];
}

async function attachReplies(threads: HotThreadItem[]): Promise<HotThreadItem[]> {
  if (threads.length === 0) return [];

  try {
    const results = await generateReplies(
      threads.map((t) => ({ id: t.id, text: t.text || t.title || "" })),
      LINK_PLACEHOLDER,
    );

    const byId = new Map<string, string[]>();
    for (const row of results || []) {
      if (row?.id && Array.isArray(row.replies) && row.replies.length > 0) {
        byId.set(String(row.id), row.replies.map(String));
      }
    }

    return threads.map((t) => ({
      ...t,
      replies: byId.get(t.id) || fallbackReplies(t.title || t.text),
    }));
  } catch {
    return threads.map((t) => ({
      ...t,
      replies: fallbackReplies(t.title || t.text),
    }));
  }
}

export async function buildHotThreadPack(
  supabase: SupabaseClient,
  nicheId: NicheId,
): Promise<HotThreadPackRow> {
  const packDate = utcPackDate();
  const seeds = await discoverThreads(nicheId);
  const items = await attachReplies(seeds);
  const refreshedAt = new Date().toISOString();

  const { data, error } = await supabase
    .from("hot_thread_packs")
    .upsert(
      {
        niche_id: nicheId,
        pack_date: packDate,
        items,
        refreshed_at: refreshedAt,
      },
      { onConflict: "niche_id,pack_date" },
    )
    .select("id, niche_id, pack_date, items, refreshed_at")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to save hot thread pack");
  }

  return {
    id: data.id,
    niche_id: data.niche_id,
    pack_date: data.pack_date,
    items: (data.items || []) as HotThreadItem[],
    refreshed_at: data.refreshed_at,
  };
}
