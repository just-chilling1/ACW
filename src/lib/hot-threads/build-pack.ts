import type { SupabaseClient } from "@supabase/supabase-js";
import { getNicheById, type NicheId } from "@/lib/niches";
import { searchSocialData, sanitizePosts } from "@/lib/rapidapi";
import { generateReplies } from "@/lib/llm";
import { getFallbackPostsForNiche } from "@/lib/dfy/search-fallbacks";
import {
  LINK_PLACEHOLDER,
  MIN_PACK_SIZE,
  QUICK_PACK_MARKER,
  TARGET_PACK_SIZE,
  type HotThreadItem,
  type HotThreadPackRow,
} from "./types";
import { utcPackDate } from "./ttl";

const LIVE_SEARCH_MS = 4500;
const LLM_MS = 8000;

function engagementNum(value: string | number | undefined): number {
  if (typeof value === "number") return value;
  if (!value) return 0;
  const n = Number(String(value).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function dedupeKey(post: { id?: string; url?: string; platform?: string; title?: string }): string {
  return post.id || post.url || `${post.platform || "x"}-${post.title || ""}`;
}

function toThreadSeed(
  post: Record<string, unknown>,
  source: HotThreadItem["source"] = "live",
): HotThreadItem {
  const rawId = String(post.id || post.url || `ht-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  return {
    id: source === "quick" && !rawId.startsWith(QUICK_PACK_MARKER) ? `${QUICK_PACK_MARKER}${rawId}` : rawId,
    platform: String(post.platform || "Reddit"),
    title: post.title ? String(post.title) : undefined,
    text: String(post.text || post.title || ""),
    url: String(post.url || ""),
    engagement: (post.engagement as string | number) ?? 0,
    replies: [],
    source,
  };
}

export function fallbackReplies(topic: string): string[] {
  const t = topic.slice(0, 60) || "this";
  return [
    `This is exactly what I was looking for. I've been researching "${t}" and the best thing I found was this: ${LINK_PLACEHOLDER}`,
    `I was in the same spot. What finally helped me with "${t}" was this: ${LINK_PLACEHOLDER} — worth a look.`,
    `Has anyone tried ${LINK_PLACEHOLDER} for "${t}"? Curious if it lives up to the hype.`,
  ];
}

function withFallbackReplies(threads: HotThreadItem[]): HotThreadItem[] {
  return threads.map((t) => ({
    ...t,
    replies: t.replies?.length ? t.replies : fallbackReplies(t.title || t.text),
  }));
}

function mergePosts(existing: HotThreadItem[], incoming: HotThreadItem[]): HotThreadItem[] {
  const seen = new Set(existing.map((p) => dedupeKey(p)));
  const out = [...existing];
  for (const post of incoming) {
    const key = dedupeKey(post);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(post);
  }
  return out;
}

/** Parallel DB cache lookup — no live network. */
async function discoverFromAnalysisCache(
  supabase: SupabaseClient,
  nicheId: NicheId,
): Promise<HotThreadItem[]> {
  const niche = getNicheById(nicheId);
  if (!niche) return [];

  const terms = niche.searchTerms.slice(0, 3);
  const results = await Promise.all(
    terms.map(async (term) => {
      const { data } = await supabase
        .from("analysis_results")
        .select("data")
        .eq("keyword", term)
        .order("created_at", { ascending: false })
        .limit(1);
      const threads = data?.[0]?.data?.threads;
      return Array.isArray(threads) ? sanitizePosts(threads) : [];
    }),
  );

  let collected: HotThreadItem[] = [];
  for (const posts of results) {
    collected = mergePosts(
      collected,
      posts.map((p) => toThreadSeed(p as Record<string, unknown>, "quick")),
    );
  }

  collected.sort((a, b) => engagementNum(b.engagement) - engagementNum(a.engagement));
  return collected.slice(0, TARGET_PACK_SIZE);
}

function discoverFromNicheFallbacks(nicheId: NicheId): HotThreadItem[] {
  return getFallbackPostsForNiche(nicheId)
    .slice(0, TARGET_PACK_SIZE)
    .map((p) => toThreadSeed(p as unknown as Record<string, unknown>, "quick"));
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function discoverLive(nicheId: NicheId): Promise<HotThreadItem[]> {
  const niche = getNicheById(nicheId);
  if (!niche) return [];

  // One primary term only — parallel RapidAPI/Scraper calls already happen inside searchSocialData
  const term = niche.searchTerms[0];
  const posts = await withTimeout(searchSocialData(term).then(sanitizePosts), LIVE_SEARCH_MS);
  if (!posts?.length) return [];

  return posts
    .map((p) => toThreadSeed(p as Record<string, unknown>, "live"))
    .sort((a, b) => engagementNum(b.engagement) - engagementNum(a.engagement))
    .slice(0, TARGET_PACK_SIZE);
}

async function attachAiReplies(threads: HotThreadItem[]): Promise<HotThreadItem[]> {
  if (threads.length === 0) return [];

  const results = await withTimeout(
    generateReplies(
      threads.map((t) => ({ id: t.id, text: t.text || t.title || "" })),
      LINK_PLACEHOLDER,
    ),
    LLM_MS,
  );

  if (!results?.length) return withFallbackReplies(threads);

  const byId = new Map<string, string[]>();
  for (const row of results) {
    if (row?.id && Array.isArray(row.replies) && row.replies.length > 0) {
      byId.set(String(row.id), row.replies.map(String));
    }
  }

  return threads.map((t) => ({
    ...t,
    source: "live" as const,
    replies: byId.get(t.id) || fallbackReplies(t.title || t.text),
  }));
}

async function persistPack(
  supabase: SupabaseClient,
  nicheId: NicheId,
  items: HotThreadItem[],
): Promise<HotThreadPackRow> {
  const packDate = utcPackDate();
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

/** Instant path: analysis cache + curated fallbacks + template replies (no live scrape / LLM). */
export async function buildQuickHotThreadPack(
  supabase: SupabaseClient,
  nicheId: NicheId,
): Promise<HotThreadPackRow> {
  let seeds = await discoverFromAnalysisCache(supabase, nicheId);

  if (seeds.length < MIN_PACK_SIZE) {
    seeds = mergePosts(seeds, discoverFromNicheFallbacks(nicheId)).slice(0, TARGET_PACK_SIZE);
  }

  const items = withFallbackReplies(seeds.slice(0, TARGET_PACK_SIZE));
  return persistPack(supabase, nicheId, items);
}

/** Slow path: live search + AI replies, overwrites today's pack. */
export async function enrichHotThreadPack(
  supabase: SupabaseClient,
  nicheId: NicheId,
): Promise<HotThreadPackRow | null> {
  try {
    const [cached, live] = await Promise.all([
      discoverFromAnalysisCache(supabase, nicheId),
      discoverLive(nicheId),
    ]);

    let seeds = mergePosts(live, cached);
    if (seeds.length < MIN_PACK_SIZE) {
      seeds = mergePosts(seeds, discoverFromNicheFallbacks(nicheId));
    }
    seeds = seeds.slice(0, TARGET_PACK_SIZE).map((s) => ({ ...s, source: "live" as const, id: s.id.replace(QUICK_PACK_MARKER, "") }));

    const items = await attachAiReplies(seeds);
    return await persistPack(supabase, nicheId, items);
  } catch (e) {
    console.error("[hot-threads] enrich failed", e);
    return null;
  }
}

/** Full sync build (used by force refresh). Prefers live+AI with timeouts, falls back to quick. */
export async function buildHotThreadPack(
  supabase: SupabaseClient,
  nicheId: NicheId,
): Promise<HotThreadPackRow> {
  const enriched = await enrichHotThreadPack(supabase, nicheId);
  if (enriched?.items?.length) return enriched;
  return buildQuickHotThreadPack(supabase, nicheId);
}
