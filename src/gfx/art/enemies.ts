import { art, flipX, flipY, generate, rotateCW, type Art } from "../pixelart";
import { BLUE_ENEMY, COLOR, RED_ENEMY } from "../palettes";

// Octorok, drawn facing up. Other directions are rotations, just like on the NES.
const OCTOROK_BODY = [
  "......kkkk......",
  "......krrk......",
  "....kkkrrkkk....",
  "...krrrrrrrrk...",
  "..krrrrrrrrrrk..",
  "..krwkrrrrwkrk..",
  "..krwkrrrrwkrk..",
  "..krrrrrrrrrrk..",
  "..krrrrrrrrrrk..",
  "...krrrrrrrrk...",
  "..kkRkkRRkkRkk..",
];
const OCTOROK_UP_0 = [
  ...OCTOROK_BODY,
  ".krRk.kRRk.kRrk.",
  ".kRk..kRRk..kRk.",
  "kRk...kRRk...kRk",
  "kk.....kk.....kk",
  "................",
];
const OCTOROK_UP_1 = [
  ...OCTOROK_BODY,
  "..kRk.kRRk.kRk..",
  "..kRk..kk..kRk..",
  "..kRk......kRk..",
  "...k........k...",
  "................",
];

const TEKTITE_BODY = [
  "................",
  "................",
  "................",
  "................",
  ".....kkkkkk.....",
  "....krrrrrrk....",
  "...krwwrrwwrk...",
  "...krwkrrkwrk...",
  "...krrrrrrrrk...",
  "..kkkrrrrrrkkk..",
];
const TEKTITE_0 = [
  ...TEKTITE_BODY,
  ".krrkkkkkkkkrrk.",
  "krk..........krk",
  "krk..........krk",
  "kk............kk",
  "................",
  "................",
];
const TEKTITE_1 = [
  ...TEKTITE_BODY.slice(2),
  ".krk.kkkkkk.krk.",
  ".krk........krk.",
  "krk..........krk",
  "krk..........krk",
  "kk............kk",
  "................",
  "................",
  "................",
];

const KEESE_UP = [
  "................",
  "................",
  "................",
  "k..............k",
  "kk............kk",
  "kuk..........kuk",
  ".kuk..kkkk..kuk.",
  ".kuuk.krrk.kuuk.",
  "..kuukkuukkuuk..",
  "...kuuuuuuuuk...",
  "....kkkuukkk....",
  "......kkkk......",
  "................",
  "................",
  "................",
  "................",
];
const KEESE_DOWN = [
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "......kkkk......",
  "......krrk......",
  "..kkkkkuukkkkk..",
  ".kuuuuuuuuuuuuk.",
  "kuuk.kkuukk.kuuk",
  "kuk....kk....kuk",
  "kk............kk",
  "................",
  "................",
  "................",
];
const KEESE_PALETTE = { k: "#0c0c3c", u: "#4c64e0", r: COLOR.red };

const STALFOS = [
  ".....kkkkkk.....",
  "....kwwwwwwk....",
  "...kwwwwwwwwk...",
  "...kwkkwwkkwk...",
  "...kwkkwwkkwk...",
  "...kwwwwwwwwk...",
  "....kwwkkwwk....",
  "....kwkwwkwk....",
  ".....kkkkkk.....",
  "..kk..kwwk..kke.",
  ".kwwkkwwwwkkwwke",
  ".kwk.kwkkwk.kwke",
  "..k..kwwwwk..kek",
  "....kwk..kwk..k.",
  "...kwk....kwk...",
  "...kk......kk...",
];
const STALFOS_PALETTE = { k: "#3c1008", w: "#f0e8d8", e: COLOR.lightGrey };

// The dungeon boss: a big horned dragon facing left. 32x32.
const DRAGON_TOP = [
  "................................",
  ".....kk.........................",
  "....kyyk........................",
  ".....kyyk.......................",
  "...kkkkyk.......................",
  "..kggggkk.......kk....kk........",
  ".kgggwkggk.....kGGk..kGGk.......",
  ".kggwkkgggk...kGGGGkkGGGGk......",
  "kgggggggggk..kggggggggggggkk....",
  "kgGGGGGgggk.kggggggggggggggGk...",
];
const DRAGON_JAW_CLOSED = [
  "kgkkkkkGggkkgggggggggggggggggk..",
  ".kwkwkkgggggggggggggggggggggGk..",
  "..kkk.kggggggggyyyyyyggggggggk..",
];
const DRAGON_JAW_OPEN = [
  "kgkrrrrkggkkgggggggggggggggggk..",
  "kwrrrkkgggggggggggggggggggggGk..",
  ".kwkwkkggggggggyyyyyyggggggggk..",
];
const DRAGON_BODY = [
  "......kgggggggyyyyyyyyggggggGGk.",
  ".......kgggggyyyyyyyyyyggggggGkk",
  ".......kggggyyyyyyyyyyyyggggggkg",
  "........kgggyyyyyyyyyyyyggggggkg",
  "........kgggyyyyyyyyyyyygggggGkg",
  "........kggggyyyyyyyyyygggggGGkk",
  ".........kgggyyyyyyyyyggggggGk..",
  ".........kggggyyyyyyyggggggGGk..",
  "..........kgggggggggggggggGGk...",
  "..........kGggggggggggggggGk....",
  "...........kGGgggggggggGGk......",
  "...........kkGGkkkkkkkGGkk......",
];
const DRAGON_LEGS_0 = [
  "...........kgGk.....kgGk........",
  "..........kggGk.....kggGk.......",
  "..........kggk......kggk........",
  ".........kkggk.....kkggk........",
  ".........kwkwk.....kwkwk........",
  ".........kkkkk.....kkkkk........",
  "................................",
];
const DRAGON_LEGS_1 = [
  "............kgGk...kgGk.........",
  "............kggGk..kggGk........",
  "...........kkggk..kkggk.........",
  "..........kwkwkk.kwkwk..........",
  "..........kkkkk..kkkkk..........",
  "................................",
  "................................",
];
const DRAGON_PALETTE = { k: "#0c2c0c", g: "#58b848", G: "#2c7c2c", y: "#d8e890", w: COLOR.white, r: COLOR.red };

const dragon = (jaw: string[], legs: string[]) => [...DRAGON_TOP, ...jaw, ...DRAGON_BODY, ...legs];

const ROCK = [
  "..kkkk..",
  ".keEEek.",
  "keEwEeek",
  "keEEeeek",
  "keeeeedk",
  "keeeeddk",
  ".kddddk.",
  "..kkkk..",
];
const ROCK_PALETTE = { k: COLOR.outline, w: COLOR.white, E: COLOR.lightGrey, e: COLOR.grey, d: COLOR.darkGrey };

const FIREBALL = generate(10, 10, (x, y) => {
  const d = Math.hypot(x - 4.5, y - 4.5);
  if (d < 1.8) return "w";
  if (d < 3.2) return "y";
  if (d < 4.4) return "o";
  if (d < 5) return "k";
  return ".";
});
const FIREBALL_A = { k: COLOR.darkRed, o: COLOR.red, y: COLOR.orange, w: COLOR.yellow };
const FIREBALL_B = { k: COLOR.darkRed, o: COLOR.orange, y: COLOR.yellow, w: COLOR.white };

function directional(name: string, palette: Record<string, string>, up: string[]): Record<string, Art> {
  const right = rotateCW(up);
  return {
    [`${name}_up`]: art(palette, up),
    [`${name}_down`]: art(palette, flipY(up)),
    [`${name}_right`]: art(palette, right),
    [`${name}_left`]: art(palette, flipX(right)),
  };
}

export const ENEMY_ART: Record<string, Art> = {
  ...directional("octorok_red_0", RED_ENEMY, OCTOROK_UP_0),
  ...directional("octorok_red_1", RED_ENEMY, OCTOROK_UP_1),
  ...directional("octorok_blue_0", BLUE_ENEMY, OCTOROK_UP_0),
  ...directional("octorok_blue_1", BLUE_ENEMY, OCTOROK_UP_1),
  tektite_0: art(BLUE_ENEMY, TEKTITE_0),
  tektite_1: art(BLUE_ENEMY, TEKTITE_1),
  keese_0: art(KEESE_PALETTE, KEESE_UP),
  keese_1: art(KEESE_PALETTE, KEESE_DOWN),
  stalfos_0: art(STALFOS_PALETTE, STALFOS),
  stalfos_1: art(STALFOS_PALETTE, flipX(STALFOS)),
  dragon_0: art(DRAGON_PALETTE, dragon(DRAGON_JAW_CLOSED, DRAGON_LEGS_0)),
  dragon_1: art(DRAGON_PALETTE, dragon(DRAGON_JAW_CLOSED, DRAGON_LEGS_1)),
  dragon_open_0: art(DRAGON_PALETTE, dragon(DRAGON_JAW_OPEN, DRAGON_LEGS_0)),
  dragon_open_1: art(DRAGON_PALETTE, dragon(DRAGON_JAW_OPEN, DRAGON_LEGS_1)),
  rock: art(ROCK_PALETTE, ROCK),
  fireball_0: art(FIREBALL_A, FIREBALL),
  fireball_1: art(FIREBALL_B, FIREBALL),
};
