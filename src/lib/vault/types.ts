import type { NicheId } from "@/lib/niches";

export type VaultPlatform = "quora" | "pinterest";

type VaultEntryBase = {
  id: string;
  platform: VaultPlatform;
  nicheId: NicheId;
  angle: string;
};

export type QuoraEntry = VaultEntryBase & {
  platform: "quora";
  question: string;
  searchQuery: string;
  answer: string;
  topics: string[];
};

export type PinterestEntry = VaultEntryBase & {
  platform: "pinterest";
  pinTitle: string;
  pinDescription: string;
  boardName: string;
  imageConcept: string;
  keywords: string[];
};

export type VaultEntry = QuoraEntry | PinterestEntry;

export type VaultEntryState = {
  saved: boolean;
  used: boolean;
};

export type VaultStateResponse = {
  saved: string[];
  used: string[];
};

export type VaultStateUpdate = {
  entryId: string;
  saved?: boolean;
  used?: boolean;
};
