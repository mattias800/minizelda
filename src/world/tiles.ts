import { hash2 } from "../gfx/pixelart";

export type RoomStyle = "overworld" | "cave" | "dungeon";

export interface TileDef {
  /** Sprite to draw for this tile. `frame` is a slow global animation counter. */
  sprite(tx: number, ty: number, frame: number): string | null;
  /** Optional sprite drawn beneath (for tiles with transparent pixels). */
  base?(tx: number, ty: number): string;
  /** Blocks anything that walks. */
  solid: boolean;
  /** Blocks rocks, sword beams and the boomerang. Water and pits do not. */
  blocksProjectiles: boolean;
  /** When hit by the sword, the tile turns into this tile character. */
  cutInto?: string;
  /** Cutting this tile reveals a secret that is remembered for the rest of the game. */
  secret?: boolean;
  /** Stepping onto this tile triggers the room's warp at this position. */
  warp?: boolean;
}

const grass = (tx: number, ty: number) => (hash2(tx, ty, 42) > 0.5 ? "grass_0" : "grass_1");

const FLOOR_BY_STYLE: Record<RoomStyle, TileDef> = {
  overworld: { sprite: grass, solid: false, blocksProjectiles: false },
  cave: { sprite: () => "cave_floor", solid: false, blocksProjectiles: false },
  dungeon: { sprite: () => "dungeon_floor", solid: false, blocksProjectiles: false },
};

const solid = (sprite: string, base?: (tx: number, ty: number) => string): TileDef => ({
  sprite: () => sprite,
  base,
  solid: true,
  blocksProjectiles: true,
});

/** Tile legend shared by all rooms. '.' means "floor" and depends on the room style. */
const TILES: Record<string, TileDef> = {
  ",": { sprite: () => "sand", solid: false, blocksProjectiles: false },
  f: { sprite: (_x, _y, frame) => (frame % 2 === 0 ? "flowers_0" : "flowers_1"), solid: false, blocksProjectiles: false },
  T: solid("tree", grass),
  R: solid("boulder", grass),
  M: solid("cliff"),
  B: { ...solid("bush", grass), cutInto: "." },
  X: { ...solid("bush", grass), cutInto: "S", secret: true },
  C: { sprite: () => "cave", solid: false, blocksProjectiles: true, warp: true },
  S: { sprite: () => "stairs", solid: false, blocksProjectiles: false, warp: true },
  W: { sprite: (_x, _y, frame) => (frame % 2 === 0 ? "water_0" : "water_1"), solid: true, blocksProjectiles: false },
  "=": { sprite: () => "bridge", solid: false, blocksProjectiles: false },
  Q: solid("facade"),
  q: solid("facade_skull"),
  "[": { sprite: () => "facade_door_l", solid: false, blocksProjectiles: true, warp: true },
  "]": { sprite: () => "facade_door_r", solid: false, blocksProjectiles: true, warp: true },
  O: solid("dungeon_block"),
  H: solid("statue", () => "dungeon_floor"),
  P: { sprite: () => "pit", solid: true, blocksProjectiles: false },
  // Dungeon walls and door gaps are drawn by the dungeon frame renderer, not per tile.
  "#": { sprite: () => null, solid: true, blocksProjectiles: true },
  d: { sprite: () => null, solid: false, blocksProjectiles: false },
};

export function tileDef(ch: string, style: RoomStyle): TileDef {
  if (ch === ".") return FLOOR_BY_STYLE[style];
  const def = TILES[ch];
  if (!def) throw new Error(`Unknown tile '${ch}'`);
  return def;
}

export function isKnownTile(ch: string): boolean {
  return ch === "." || ch in TILES;
}
