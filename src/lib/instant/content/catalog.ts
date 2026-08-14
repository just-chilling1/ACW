import type { NicheId } from "@/lib/niches";
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
