import type { SourceType } from "./sources";

export type TrafficCategory = "search" | "social" | "communities" | "content";

export function getSourceCategory(type: SourceType): TrafficCategory {
  switch (type) {
    case "Q&A":
      return "search";
    case "Social":
      return "social";
    case "Forum":
      return "communities";
    case "Blog":
    case "Directory":
    case "Classified":
      return "content";
    default:
      return "communities";
  }
}

export const CATEGORY_LABELS: Record<TrafficCategory, string> = {
  search: "Search",
  social: "Social",
  communities: "Communities",
  content: "Content",
};
