import { ROOM_COLS, ROOM_ROWS } from "../engine/constants";
import type { Dir } from "../engine/math";
import type { DoorKind, RoomDef } from "./types";

/**
 * The entire game world. It is tiny on purpose: a 2x2 overworld, three caves and a
 * five-room dungeon. Map legend (see tiles.ts):
 *
 *   .  floor (grass / cave floor / dungeon floor)   ,  sand path     f  flowers
 *   T  tree          R  boulder      M  cliff        B  bush (cuttable)
 *   X  bush hiding a staircase       C  cave entrance              S  stairs
 *   W  water         =  bridge       Q/q  dungeon facade           []  dungeon entrance
 *   O  block         P  pit          H  statue
 */

/** Tile positions of the doorway gaps in a dungeon room's 2-tile thick walls. */
export const DOOR_TILES: Record<Dir, { tx: number; ty: number }[]> = {
  up: [
    { tx: 7, ty: 0 },
    { tx: 8, ty: 0 },
    { tx: 7, ty: 1 },
    { tx: 8, ty: 1 },
  ],
  down: [
    { tx: 7, ty: 9 },
    { tx: 8, ty: 9 },
    { tx: 7, ty: 10 },
    { tx: 8, ty: 10 },
  ],
  left: [
    { tx: 0, ty: 5 },
    { tx: 1, ty: 5 },
  ],
  right: [
    { tx: 14, ty: 5 },
    { tx: 15, ty: 5 },
  ],
};

/** Wraps a 12x7 interior in walls and punches door gaps. */
export function dungeonMap(interior: string[], doors: Partial<Record<Dir, DoorKind>>): string[] {
  if (interior.length !== ROOM_ROWS - 4 || interior.some((r) => r.length !== ROOM_COLS - 4)) {
    throw new Error("Dungeon interior must be 12x7");
  }
  const rows = Array.from({ length: ROOM_ROWS }, (_, y) =>
    y < 2 || y >= ROOM_ROWS - 2 ? "#".repeat(ROOM_COLS) : `##${interior[y - 2]}##`,
  );
  const grid = rows.map((r) => r.split(""));
  for (const dir of Object.keys(doors) as Dir[]) {
    for (const { tx, ty } of DOOR_TILES[dir]) grid[ty][tx] = "d";
  }
  return grid.map((r) => r.join(""));
}

const CAVE_MAP = [
  "MMMMMMMMMMMMMMMM",
  "MMMMMMMMMMMMMMMM",
  "MM............MM",
  "MM............MM",
  "MM............MM",
  "MM............MM",
  "MM............MM",
  "MM............MM",
  "MM............MM",
  "MMMMMMM..MMMMMMM",
  "MMMMMMM..MMMMMMM",
];

const entryDoors = { up: "locked", down: "exit", left: "open", right: "open" } as const;
const eastDoors = { left: "shutter" } as const;
const westDoors = { right: "open" } as const;
const bossDoors = { up: "shutter", down: "shutter" } as const;
const triforceDoors = { down: "open" } as const;

export const ROOMS: RoomDef[] = [
  // -------------------------------------------------------------------------
  // Overworld (2x2)
  // -------------------------------------------------------------------------
  {
    id: "ow_start",
    area: "overworld",
    gx: 0,
    gy: 1,
    style: "overworld",
    music: "overworld",
    map: [
      "MMMMMMMM..MMMMMM",
      "MMMCMMMM..MMMMMM",
      "MM.,......,..MMM",
      "M..,,,,,,,,.....",
      "M.......,.....f.",
      "M..T....,..T....",
      "M.......,,,,,,,,",
      "M.f..T.......B..",
      "MT.............T",
      "MTTTTTTTTTTTTTTT",
      "MTTTTTTTTTTTTTTT",
    ],
    warps: [{ tile: { x: 3, y: 1 }, to: { room: "cave_sword", at: { x: 7.5, y: 8 }, facing: "up" } }],
  },
  {
    id: "ow_lake",
    area: "overworld",
    gx: 1,
    gy: 1,
    style: "overworld",
    music: "overworld",
    map: [
      "MMMMMMM....MMMMM",
      "MMMMMM......MMMM",
      "M..............T",
      "......WWW.....TT",
      ".....WWWWW..B.TT",
      ".....WWWWW....TT",
      ",,,,,,WWW..B..TT",
      "......,...R...TT",
      "M..B..,..R..B.TT",
      "MTTTTTTTTTTTTTTT",
      "MTTTTTTTTTTTTTTT",
    ],
    enemies: [{ kind: "octorok_red" }, { kind: "octorok_red" }, { kind: "octorok_red" }, { kind: "octorok_blue" }],
  },
  {
    id: "ow_woods",
    area: "overworld",
    gx: 0,
    gy: 0,
    style: "overworld",
    music: "overworld",
    map: [
      "TTTTTTTTTTTTTTTT",
      "TTMMMMCMMMMMMTTT",
      "TT....,......TTT",
      "T.....,..B.X....",
      "T.WWW.,..BB.....",
      "T.WWW.,,,,,,,,,,",
      "T.WWW...,.......",
      "T.......,....T..",
      "TT..T...,...T..T",
      "TTTTTTTT..TTTTTT",
      "MMMMMMMM..MMMMMM",
    ],
    enemies: [{ kind: "tektite" }, { kind: "tektite" }, { kind: "octorok_red" }],
    warps: [
      { tile: { x: 6, y: 1 }, to: { room: "cave_shop", at: { x: 7.5, y: 8 }, facing: "up" } },
      { tile: { x: 11, y: 3 }, to: { room: "cave_secret", at: { x: 7.5, y: 8 }, facing: "up" } },
    ],
  },
  {
    id: "ow_temple",
    area: "overworld",
    gx: 1,
    gy: 0,
    style: "overworld",
    music: "overworld",
    map: [
      "TTTTTTTTTTTTTTTT",
      "TTTTQQQQQQQQTTTT",
      "TTTTQqQQQQqQTTTT",
      "....QQQ[]QQQ..TT",
      ".......,,.....TT",
      ",,,,,,,,,,....TT",
      ".......,......TT",
      ".....T.,..T...TT",
      "TT.....,,.....TT",
      "TTTTTT..,..TTTTT",
      "TTTTTTT....TTTTT",
    ],
    enemies: [{ kind: "octorok_blue" }, { kind: "octorok_blue" }, { kind: "tektite" }],
    warps: [
      { tile: { x: 7, y: 3 }, to: { room: "d_entry", at: { x: 7.5, y: 8 }, facing: "up" } },
      { tile: { x: 8, y: 3 }, to: { room: "d_entry", at: { x: 7.5, y: 8 }, facing: "up" } },
    ],
  },

  // -------------------------------------------------------------------------
  // Caves
  // -------------------------------------------------------------------------
  {
    id: "cave_sword",
    area: "cave_sword",
    gx: 0,
    gy: 0,
    style: "cave",
    music: "cave",
    map: CAVE_MAP,
    message: "IT'S DANGEROUS TO GO\nALONE! TAKE THIS.",
    objects: [
      { kind: "fire", at: { x: 4.5, y: 4 } },
      { kind: "npc", sprite: "old_man", at: { x: 7.5, y: 4 } },
      { kind: "fire", at: { x: 10.5, y: 4 } },
      { kind: "item", item: "sword", at: { x: 7.5, y: 6 }, flag: "got_sword" },
    ],
    exits: { down: { room: "ow_start", at: { x: 3, y: 2 }, facing: "down" } },
  },
  {
    id: "cave_shop",
    area: "cave_shop",
    gx: 0,
    gy: 0,
    style: "cave",
    music: "cave",
    map: CAVE_MAP,
    message: "BUY SOMETHIN', WILL YA!",
    objects: [
      { kind: "fire", at: { x: 4.5, y: 4 } },
      { kind: "npc", sprite: "merchant", at: { x: 7.5, y: 4 } },
      { kind: "fire", at: { x: 10.5, y: 4 } },
      { kind: "item", item: "potion", at: { x: 5.5, y: 6 }, price: 10 },
      { kind: "item", item: "heart_container", at: { x: 9.5, y: 6 }, price: 40, flag: "bought_heart" },
    ],
    exits: { down: { room: "ow_woods", at: { x: 6, y: 2 }, facing: "down" } },
  },
  {
    id: "cave_secret",
    area: "cave_secret",
    gx: 0,
    gy: 0,
    style: "cave",
    music: "cave",
    map: CAVE_MAP,
    message: "IT'S A SECRET TO\nEVERYBODY.",
    objects: [
      { kind: "fire", at: { x: 4.5, y: 4 } },
      { kind: "npc", sprite: "moblin", at: { x: 7.5, y: 4 } },
      { kind: "fire", at: { x: 10.5, y: 4 } },
      { kind: "item", item: "rupee_gift", at: { x: 7.5, y: 6 }, flag: "got_secret_rupees" },
    ],
    exits: { down: { room: "ow_woods", at: { x: 11, y: 4 }, facing: "down" } },
  },

  // -------------------------------------------------------------------------
  // Dungeon: Level 1
  //
  //            [triforce]
  //              [boss]
  //   [west] -- [entry] -- [east]
  // -------------------------------------------------------------------------
  {
    id: "d_entry",
    area: "dungeon",
    gx: 1,
    gy: 2,
    style: "dungeon",
    music: "dungeon",
    doors: entryDoors,
    map: dungeonMap(
      ["............", "..O......O..", "............", "............", "............", "..O......O..", "............"],
      entryDoors,
    ),
    enemies: [{ kind: "keese" }, { kind: "keese" }, { kind: "keese" }],
    exits: { down: { room: "ow_temple", at: { x: 7.5, y: 4 }, facing: "down" } },
    staysCleared: true,
  },
  {
    id: "d_east",
    area: "dungeon",
    gx: 2,
    gy: 2,
    style: "dungeon",
    music: "dungeon",
    doors: eastDoors,
    map: dungeonMap(
      ["............", ".O........O.", "....OOOO....", "............", "....OOOO....", ".O........O.", "............"],
      eastDoors,
    ),
    enemies: [
      { kind: "stalfos", at: { x: 5, y: 3 } },
      { kind: "stalfos", at: { x: 10, y: 3 } },
      { kind: "stalfos", at: { x: 5, y: 7 } },
      { kind: "stalfos", at: { x: 10, y: 7 } },
    ],
    clearReward: { kind: "chest", item: "boomerang", at: { x: 7.5, y: 5 }, flag: "got_boomerang" },
    staysCleared: true,
  },
  {
    id: "d_west",
    area: "dungeon",
    gx: 0,
    gy: 2,
    style: "dungeon",
    music: "dungeon",
    doors: westDoors,
    map: dungeonMap(
      ["............", "...PPPPP....", "...PPPPP....", "...PP.PP....", "...PPPPP....", "...PPPPP....", "............"],
      westDoors,
    ),
    enemies: [{ kind: "keese" }, { kind: "keese" }],
    objects: [{ kind: "item", item: "key", at: { x: 7, y: 5 }, flag: "got_dungeon_key" }],
    staysCleared: true,
  },
  {
    id: "d_boss",
    area: "dungeon",
    gx: 1,
    gy: 1,
    style: "dungeon",
    music: "boss",
    doors: bossDoors,
    map: dungeonMap(
      ["............", ".O..........", "............", "............", "............", ".O..........", "............"],
      bossDoors,
    ),
    enemies: [{ kind: "dragon", at: { x: 10, y: 4 } }],
    clearReward: { kind: "item", item: "heart_container", at: { x: 7.5, y: 5 }, flag: "got_boss_heart" },
    staysCleared: true,
  },
  {
    id: "d_triforce",
    area: "dungeon",
    gx: 1,
    gy: 0,
    style: "dungeon",
    music: "triforce",
    doors: triforceDoors,
    map: dungeonMap(
      ["............", ".H........H.", "............", "............", "............", ".H........H.", "............"],
      triforceDoors,
    ),
    objects: [
      { kind: "fire", at: { x: 5.5, y: 4 } },
      { kind: "fire", at: { x: 9.5, y: 4 } },
      { kind: "pedestal", at: { x: 7.5, y: 4.5 } },
      { kind: "item", item: "triforce", at: { x: 7.5, y: 4.5 }, flag: "got_triforce" },
    ],
  },
];

