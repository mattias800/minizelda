import { art, generate, hash2, type Art } from "../pixelart";
import { BUSH, CLIFF, COLOR, FOLIAGE, STONE } from "../palettes";

// ---------------------------------------------------------------------------
// Overworld
// ---------------------------------------------------------------------------

const GRASS_PALETTE = { g: "#5aa83c", d: "#3e8c2c", l: "#84c858" };

function grass(seed: number): string[] {
  return generate(16, 16, (x, y) => {
    // Little "v" shaped tufts scattered on a hashed grid.
    const cellX = Math.floor(x / 8);
    const cellY = Math.floor(y / 8);
    const tx = 1 + Math.floor(hash2(cellX, cellY, seed) * 5);
    const ty = 2 + Math.floor(hash2(cellY, cellX, seed + 7) * 4);
    const lx = x % 8;
    const ly = y % 8;
    if ((ly === ty && (lx === tx || lx === tx + 2)) || (ly === ty + 1 && lx === tx + 1)) return "d";
    if (ly === ty - 1 && lx === tx + 1 && hash2(x, y, seed) > 0.5) return "l";
    return "g";
  });
}

const SAND_PALETTE = { s: "#e8c890", d: "#c8a068", l: "#f8e0b0" };
const SAND = generate(16, 16, (x, y) => {
  const n = hash2(x, y, 3);
  if (n > 0.93) return "d";
  if (n < 0.05) return "l";
  return "s";
});

const FLOWERS = (frame: number) =>
  generate(16, 16, (x, y) => {
    const base = grass(1)[y][x];
    const spots = [
      [3, 3],
      [11, 10],
    ];
    for (const [fx, fy] of spots) {
      const dx = x - fx;
      const dy = y - fy;
      const petal = frame === 0 ? Math.abs(dx) + Math.abs(dy) === 1 : Math.abs(dx) === 1 && Math.abs(dy) === 1;
      if (dx === 0 && dy === 0) return "y";
      if (petal) return "w";
    }
    return base;
  });
const FLOWER_PALETTE = { ...GRASS_PALETTE, w: COLOR.white, y: COLOR.gold };

const TREE = [
  "....kkkkkkkk....",
  "..kkllltttttkk..",
  ".klllltttttTTTk.",
  ".klltttlttttTTk.",
  "klltttlllttttTTk",
  "klttttllttttTTTk",
  "kltttttttlttTTTk",
  "kttlltttllltTTTk",
  "kttlllttlltTTTTk",
  "ktttlttttttTTTTk",
  ".kttttttttTTTTk.",
  ".kTttttTTTTTTTk.",
  "..kkTTTTTTTTkk..",
  "....kkkbbkkk....",
  "......kbbk......",
  "......kkkk......",
];

const BUSH_ROWS = [
  "................",
  "................",
  ".....kkkkkk.....",
  "...kkllltttkk...",
  "..klllttltttTk..",
  "..klltttlltTTk..",
  ".klttlttttttTTk.",
  ".kttllttlltTTTk.",
  ".kttttttttTTTTk.",
  ".kTtttlttTTTTTk.",
  "..kTTttTTTTTTk..",
  "..kTTTTTTTTTTk..",
  "...kkTTTTTTkk...",
  ".....kkkkkk.....",
  "................",
  "................",
];

const BOULDER = generate(16, 16, (x, y) => {
  const dx = (x + 0.5 - 8) / 7;
  const dy = (y + 0.5 - 8.5) / 6.5;
  const d = dx * dx + dy * dy;
  if (d > 1) return ".";
  if (d > 0.78) return "k";
  const light = -dx * 0.6 - dy * 0.8;
  if (light > 0.55) return "w";
  if (light > 0.1) return "E";
  if (light > -0.45) return "e";
  return "d";
});

/** Rough brown cliff made from irregular stones. */
const CLIFF_ROWS = [
  "hhhhhhhkhhhhhhhk",
  "hoooobbkhoooobbk",
  "hoobbbbkhoobbbbk",
  "hobbbbbkhobbbbbk",
  "hbbbbbdkhbbbbbdk",
  "hbbbbddkhbbbbddk",
  "hbbdddkkhbbdddkk",
  "kkkkkkkkkkkkkkkk",
  "hhhkhhhhhhhkhhhh",
  "oobkhoooobbkhooo",
  "bbbkhoobbbbkhoob",
  "bbbkhobbbbbkhobb",
  "bbdkhbbbbbdkhbbb",
  "bddkhbbbbddkhbbb",
  "ddkkhbbdddkkhbbd",
  "kkkkkkkkkkkkkkkk",
];

const CAVE = CLIFF_ROWS.map((row, y) =>
  [...row]
    .map((ch, x) => {
      const dx = x + 0.5 - 8;
      if (y >= 7 && Math.abs(dx) < 5) return "x";
      if (y >= 3 && y < 7 && Math.hypot(dx, y - 7) < 5) return "x";
      return ch;
    })
    .join(""),
);
const CAVE_PALETTE = { ...CLIFF, x: COLOR.black };

const WATER_PALETTE = { u: "#2c6cd8", U: "#7cbcfc", n: "#2458b8" };
function water(frame: number): string[] {
  return generate(16, 16, (x, y) => {
    const band = y % 8;
    const phase = (x + Math.floor(y / 8) * 6 + frame * 3) % 16;
    if (band === 2 && phase >= 1 && phase <= 4) return "U";
    if (band === 3 && (phase === 0 || phase === 5)) return "U";
    if (band === 6 && hash2(x, y, frame) > 0.85) return "n";
    return "u";
  });
}

const BRIDGE = generate(16, 16, (x, y) => {
  if (x === 0 || x === 15) return "k";
  if (y % 4 === 3) return "d";
  if (x === 1 || x === 14) return "d";
  return (y % 4 === 0) ? "l" : "b";
});
const BRIDGE_PALETTE = { k: "#401808", d: "#7a3410", b: "#b8702c", l: "#d89048" };

const STAIRS = generate(16, 16, (x, y) => {
  if (x === 0 || x === 15 || y === 0) return "k";
  const step = Math.floor((y - 1) / 3);
  const inset = step;
  if (x <= inset || x >= 15 - inset) return "k";
  return (y - 1) % 3 === 0 ? "w" : (y - 1) % 3 === 1 ? "E" : "d";
});

// Ancient stone blocks used for the dungeon facade on the overworld.
const FACADE_PALETTE = { k: "#1c2420", w: "#b8c8b0", E: "#88a088", e: "#5c7460", d: "#3c4c40", x: COLOR.black };
const FACADE = generate(16, 16, (x, y) => {
  const lx = x % 8;
  const ly = y % 8;
  if (lx === 7 || ly === 7) return "k";
  if (lx === 0 || ly === 0) return "w";
  if (lx === 6 || ly === 6) return "d";
  return hash2(x, y, 11) > 0.8 ? "e" : "E";
});
/** One wide arched doorway spanning two tiles; split into left and right halves. */
function facadeDoor(half: 0 | 1): string[] {
  return FACADE.map((row, y) =>
    [...row]
      .map((ch, lx) => {
        const x = lx + half * 16 + 0.5 - 16;
        const inside = Math.abs(x) < 12 && (y >= 7 || Math.hypot(x, (y - 7) * 1.7) < 12);
        return inside ? "x" : ch;
      })
      .join(""),
  );
}
const FACADE_SKULL = generate(16, 16, (x, y) => {
  const base = FACADE[y][x];
  const dx = x + 0.5 - 8;
  const dy = y + 0.5 - 7;
  if (Math.hypot(dx, dy * 1.1) < 6.5) {
    if (Math.hypot(Math.abs(dx) - 2.5, dy + 0.5) < 1.6) return "x";
    if (y === 10 && Math.abs(dx) < 3 && x % 2 === 0) return "x";
    if (Math.hypot(dx, dy * 1.1) > 5.6) return "k";
    return "w";
  }
  return base;
});

// ---------------------------------------------------------------------------
// Caves and dungeon
// ---------------------------------------------------------------------------

const CAVE_FLOOR = generate(16, 16, (x, y) => (hash2(x, y, 5) > 0.97 ? "d" : "k"));
const CAVE_FLOOR_PALETTE = { k: "#0c0808", d: "#2c1c14" };

const DUNGEON_PALETTE = { k: "#081828", d: "#184870", f: "#246090", l: "#3c84b8", w: "#7cc0e8", x: COLOR.black };

const DUNGEON_FLOOR = generate(16, 16, (x, y) => {
  const lx = x % 8;
  const ly = y % 8;
  if (lx === 7 || ly === 7) return "d";
  if (lx === 0 || ly === 0) return "l";
  return "f";
});

const DUNGEON_BLOCK = generate(16, 16, (x, y) => {
  if (x === 15 || y === 15) return "k";
  if (x === 0 || y === 0) return "w";
  if (x === 14 || y === 14) return "d";
  if (x === 1 || y === 1) return "l";
  // Beveled pyramid shading.
  const dx = x - 7.5;
  const dy = y - 7.5;
  if (Math.abs(dx) < 3.5 && Math.abs(dy) < 3.5) return "f";
  return Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? "l" : "d") : dy < 0 ? "l" : "d";
});

const PIT = generate(16, 16, (x, y) => (y === 0 && x % 2 === 0 ? "d" : "x"));

const STATUE_ROWS = [
  "....kkkkkkkk....",
  "...kwwllllffk...",
  "..kwllllllllfk..",
  "..klxxllllxxfk..",
  "..klxxllllxxfk..",
  "..kllllffllllk..",
  "...kllfxxflfk...",
  "..kkllfxxflfkk..",
  ".kwlkllffllkffk.",
  ".kllkllllllkffk.",
  ".klfkkllllkkffk.",
  ".kfffkllllkfffk.",
  "..kfffkllkfffk..",
  "..kkkkkkkkkkkk..",
  ".kwlllllllllffk.",
  ".kkkkkkkkkkkkkk.",
];

const PEDESTAL = generate(16, 16, (x, y) => {
  if (y < 6 || y > 13 || x < 1 || x > 14) return ".";
  if (y === 6 || y === 13 || x === 1 || x === 14) return "k";
  if (y === 7) return "w";
  return y < 10 ? "E" : "e";
});

export const TILE_ART: Record<string, Art> = {
  grass_0: art(GRASS_PALETTE, grass(0)),
  grass_1: art(GRASS_PALETTE, grass(9)),
  sand: art(SAND_PALETTE, SAND),
  flowers_0: art(FLOWER_PALETTE, FLOWERS(0)),
  flowers_1: art(FLOWER_PALETTE, FLOWERS(1)),
  tree: art(FOLIAGE, TREE),
  bush: art(BUSH, BUSH_ROWS),
  boulder: art(STONE, BOULDER),
  cliff: art(CLIFF, CLIFF_ROWS),
  cave: art(CAVE_PALETTE, CAVE),
  water_0: art(WATER_PALETTE, water(0)),
  water_1: art(WATER_PALETTE, water(1)),
  bridge: art(BRIDGE_PALETTE, BRIDGE),
  stairs: art(STONE, STAIRS),
  facade: art(FACADE_PALETTE, FACADE),
  facade_door_l: art(FACADE_PALETTE, facadeDoor(0)),
  facade_door_r: art(FACADE_PALETTE, facadeDoor(1)),
  facade_skull: art(FACADE_PALETTE, FACADE_SKULL),
  cave_floor: art(CAVE_FLOOR_PALETTE, CAVE_FLOOR),
  dungeon_floor: art(DUNGEON_PALETTE, DUNGEON_FLOOR),
  dungeon_block: art(DUNGEON_PALETTE, DUNGEON_BLOCK),
  pit: art(DUNGEON_PALETTE, PIT),
  statue: art(DUNGEON_PALETTE, STATUE_ROWS),
  pedestal: art(STONE, PEDESTAL),
};
