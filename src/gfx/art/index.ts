import type { Art } from "../pixelart";
import { CHARACTER_ART } from "./characters";
import { EFFECT_ART } from "./effects";
import { ENEMY_ART } from "./enemies";
import { ICON_ART, ITEM_ART } from "./items";
import { TILE_ART } from "./tiles";

export const ALL_ART: Readonly<Record<string, Art>> = {
  ...CHARACTER_ART,
  ...ENEMY_ART,
  ...ITEM_ART,
  ...ICON_ART,
  ...EFFECT_ART,
  ...TILE_ART,
};

export type SpriteName = keyof typeof ALL_ART & string;
