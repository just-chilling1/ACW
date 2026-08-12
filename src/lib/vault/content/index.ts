import type { VaultEntry } from "@/lib/vault/types";
import { MAKE_MONEY_ONLINE_ENTRIES } from "./make-money-online";
import { WEIGHT_LOSS_ENTRIES } from "./weight-loss";
import { HEALTH_FITNESS_ENTRIES } from "./health-fitness";
import { BEAUTY_SKINCARE_ENTRIES } from "./beauty-skincare";
import { RELATIONSHIPS_ENTRIES } from "./relationships";
import { TECH_GADGETS_ENTRIES } from "./tech-gadgets";
import { PETS_ENTRIES } from "./pets";
import { HOME_GARDEN_ENTRIES } from "./home-garden";

export const VAULT_ENTRIES: VaultEntry[] = [
  ...MAKE_MONEY_ONLINE_ENTRIES,
  ...WEIGHT_LOSS_ENTRIES,
  ...HEALTH_FITNESS_ENTRIES,
  ...BEAUTY_SKINCARE_ENTRIES,
  ...RELATIONSHIPS_ENTRIES,
  ...TECH_GADGETS_ENTRIES,
  ...PETS_ENTRIES,
  ...HOME_GARDEN_ENTRIES,
];
