import type { ShortsScript } from "@/lib/vault/shorts-types";
import { MAKE_MONEY_ONLINE_SHORTS } from "./make-money-online";
import { WEIGHT_LOSS_SHORTS } from "./weight-loss";
import { HEALTH_FITNESS_SHORTS } from "./health-fitness";
import { BEAUTY_SKINCARE_SHORTS } from "./beauty-skincare";
import { RELATIONSHIPS_SHORTS } from "./relationships";
import { TECH_GADGETS_SHORTS } from "./tech-gadgets";
import { PETS_SHORTS } from "./pets";
import { HOME_GARDEN_SHORTS } from "./home-garden";

export const SHORTS_SCRIPTS: ShortsScript[] = [
  ...MAKE_MONEY_ONLINE_SHORTS,
  ...WEIGHT_LOSS_SHORTS,
  ...HEALTH_FITNESS_SHORTS,
  ...BEAUTY_SKINCARE_SHORTS,
  ...RELATIONSHIPS_SHORTS,
  ...TECH_GADGETS_SHORTS,
  ...PETS_SHORTS,
  ...HOME_GARDEN_SHORTS,
];
