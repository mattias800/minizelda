import { art, flipX, flipY, rotateCW, recolor, type Art } from "../pixelart";
import { COLOR, HERO } from "../palettes";

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

const HERO_HEAD_DOWN = [
  ".....kkkkkk.....",
  "....kggggggk....",
  "...kggggggggk...",
  "..kgggggggggGk..",
  "..khhhhhhhhhhk..",
  "..khsssssssshk..",
  "..khsskssksshk..",
  "..khsssssssshk..",
];

const FEET_A = ["...khhhk.khhk...", "...kkkkk..kk...."];
const FEET_B = ["...khhk.khhhk...", "....kk..kkkkk..."];

const HERO_BODY_DOWN = [
  "...kssssssskkkkk",
  "...kggGssGgkehek",
  ".kskgggggggkhyhk",
  ".kskhhhyyhhkhyhk",
  "..kkgggggggkehek",
  "...kgggGGgg.kkk.",
];

const HERO_HEAD_UP = [
  ".....kkkkkk.....",
  "....kggggggk....",
  "...kggggggggk...",
  "..kggggggggggk..",
  "..kgggggggggGk..",
  "..khgggggggghk..",
  "..khhhhhhhhhhk..",
  "..khhhhhhhhhhk..",
];

const HERO_BODY_UP = [
  "...khhhhhhhhk...",
  "...kggGggGggk...",
  ".kskggggggggksk.",
  ".kskhhhhhhhhksk.",
  "..kkggggggggkk..",
  "...kgggGGgggk...",
];

const HERO_RIGHT_TOP = [
  ".....kkkkkk.....",
  "....kggggggkk...",
  "...kggggggggGk..",
  "..kggggggggggGk.",
  ".kggghhhhhhhhhk.",
  "kggkhhsssssssk..",
  "kgk.khsssskssk..",
  ".k..khssssssssk.",
  "....kkssssssk...",
  "....kggggkkkk...",
  "...kgggggkyhyk..",
  "...khhhhhkyhyk..",
  "...kgggggkyhyk..",
  "...kggggGkkkk...",
];

const RIGHT_FEET_A = ["..khhk.khhhk....", "..kkk..kkkkk...."];
const RIGHT_FEET_B = ["....khhhhk......", "....kkkkkk......"];

const heroDownA = [...HERO_HEAD_DOWN, ...HERO_BODY_DOWN, ...FEET_A];
const heroDownB = [...HERO_HEAD_DOWN, ...HERO_BODY_DOWN, ...FEET_B];
const heroUpA = [...HERO_HEAD_UP, ...HERO_BODY_UP, ...FEET_A];
const heroUpB = [...HERO_HEAD_UP, ...HERO_BODY_UP, ...FEET_B];
const heroRightA = [...HERO_RIGHT_TOP, ...RIGHT_FEET_A];
const heroRightB = [...HERO_RIGHT_TOP, ...RIGHT_FEET_B];

/** Sword pointing up; the hilt is at the bottom. 7x16 pixels. */
const SWORD_UP = [
  "...k...",
  "..kwk..",
  "..kwk..",
  "..kwk..",
  "..kek..",
  "..kwk..",
  "..kwk..",
  "..kwk..",
  "..kek..",
  "kkkkkkk",
  "khyyyhk",
  "kkkkkkk",
  "..khk..",
  "..khk..",
  "..kyk..",
  "...k...",
];

const SWORD_PALETTE = { ...HERO, e: COLOR.lightGrey };
const BEAM_PALETTE_A = { ...HERO, w: COLOR.lightBlue, e: COLOR.white, h: COLOR.blue, y: COLOR.lightBlue };
const BEAM_PALETTE_B = { ...HERO, w: COLOR.yellow, e: COLOR.orange, h: COLOR.red, y: COLOR.pink };

// ---------------------------------------------------------------------------
// NPCs
// ---------------------------------------------------------------------------

const OLD_MAN = [
  ".....kkkkkk.....",
  "....krrrrrrk....",
  "...krrrrrrrrk...",
  "...krssssssrk...",
  "...krskssksrk...",
  "...krssssssrk...",
  "...krwwsswwrk...",
  "..krrwwwwwwrrk..",
  "..krrkwwwwkrrk..",
  ".krrrrkwwkrrrrk.",
  ".krskrrkkrrksrk.",
  "..krrrrrrrrrrk..",
  "..krrrrrrrrrrk..",
  ".krrrrrrrrrrrrk.",
  ".krrrrrrrrrrrrk.",
  ".kkkkkkkkkkkkkk.",
];

const OLD_MAN_PALETTE = { k: COLOR.outline, r: COLOR.red, s: COLOR.skin, w: COLOR.white };
const MERCHANT_PALETTE = { k: COLOR.outline, r: COLOR.green, s: COLOR.skin, w: COLOR.brown };

const MOBLIN = [
  "..kk........kk..",
  ".krrk......krrk.",
  ".krrrkkkkkkrrrk.",
  "..krrrrrrrrrrk..",
  "..krwkrrrrkwrk..",
  "..krrrrrrrrrrk..",
  "..krrkkkkkkrrk..",
  "...krkwkkwkrk...",
  "...krrkkkkrrk...",
  "..kkbkrrrrkbkk..",
  ".kbbbbkkkkbbbbk.",
  ".kbkbbbbbbbbkbk.",
  ".krkbbbbbbbbkrk.",
  "..kkbbbkkbbbkk..",
  "...krrk..krrk...",
  "...kkkk..kkkk...",
];

const MOBLIN_PALETTE = { k: COLOR.outline, r: COLOR.orange, b: COLOR.darkBrown, w: COLOR.white };

export const CHARACTER_ART: Record<string, Art> = {
  hero_down_0: art(HERO, heroDownA),
  hero_down_1: art(HERO, heroDownB),
  hero_up_0: art(HERO, heroUpA),
  hero_up_1: art(HERO, heroUpB),
  hero_right_0: art(HERO, heroRightA),
  hero_right_1: art(HERO, heroRightB),
  hero_left_0: art(HERO, flipX(heroRightA)),
  hero_left_1: art(HERO, flipX(heroRightB)),

  sword_up: art(SWORD_PALETTE, SWORD_UP),
  sword_down: art(SWORD_PALETTE, flipY(SWORD_UP)),
  sword_right: art(SWORD_PALETTE, rotateCW(SWORD_UP)),
  sword_left: art(SWORD_PALETTE, flipX(rotateCW(SWORD_UP))),
  beam_a_up: art(BEAM_PALETTE_A, SWORD_UP),
  beam_a_down: art(BEAM_PALETTE_A, flipY(SWORD_UP)),
  beam_a_right: art(BEAM_PALETTE_A, rotateCW(SWORD_UP)),
  beam_a_left: art(BEAM_PALETTE_A, flipX(rotateCW(SWORD_UP))),
  beam_b_up: art(BEAM_PALETTE_B, SWORD_UP),
  beam_b_down: art(BEAM_PALETTE_B, flipY(SWORD_UP)),
  beam_b_right: art(BEAM_PALETTE_B, rotateCW(SWORD_UP)),
  beam_b_left: art(BEAM_PALETTE_B, flipX(rotateCW(SWORD_UP))),

  hand: art(HERO, [".kk.", "kssk", "kssk", ".kk."]),

  old_man: art(OLD_MAN_PALETTE, OLD_MAN),
  merchant: recolor(art(OLD_MAN_PALETTE, OLD_MAN), MERCHANT_PALETTE),
  moblin: art(MOBLIN_PALETTE, MOBLIN),
};
