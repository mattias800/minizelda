import { art, flipX, generate, recolor, rotateCW, type Art } from "../pixelart";
import { COLOR, PICKUP } from "../palettes";

const HEART = [
  ".kk..kk.",
  "krrkkrrk",
  "krwrrrrk",
  "krrrrrrk",
  ".krrrrk.",
  "..krrk..",
  "...kk...",
  "........",
];
const HEART_HALF = [
  ".kk..kk.",
  "krrkkeek",
  "krwreeek",
  "krrreeek",
  ".krreek.",
  "..krek..",
  "...kk...",
  "........",
];
const HEART_EMPTY = [
  ".kk..kk.",
  "keekkeek",
  "keeeeeek",
  "keeeeeek",
  ".keeeek.",
  "..keek..",
  "...kk...",
  "........",
];
const HEART_PALETTE = { ...PICKUP, e: "#48182c" };

const HEART_CONTAINER = [
  "..kkkk....kkkk..",
  ".kRrrrk..kRrrrk.",
  "kRrwwrrkkrrrrrRk",
  "kRrwrrrrrrrrrrRk",
  "kRrrrrrrrrrrrrRk",
  "kRrrrrrrrrrrrrRk",
  ".kRrrrrrrrrrrRk.",
  "..kRrrrrrrrrRk..",
  "...kRrrrrrrRk...",
  "....kRrrrrRk....",
  ".....kRrrRk.....",
  "......kRRk......",
  ".......kk.......",
  "................",
  "................",
  "................",
];

const RUPEE = [
  "...kk...",
  "..kwgk..",
  ".kwwggk.",
  ".kwgggk.",
  "kwwgggGk",
  "kwggggGk",
  "kwggggGk",
  "kwggggGk",
  "kwggggGk",
  "kwwgggGk",
  ".kwgGGk.",
  ".kwgGGk.",
  "..kgGk..",
  "...kk...",
];

const KEY = [
  "..kkkk..",
  ".kYYYYk.",
  "kYykkyYk",
  "kyk..kyk",
  "kyykkyyk",
  ".kyyyyk.",
  "..kyyk..",
  "..kyyk..",
  "..kyyk..",
  "..kyykk.",
  "..kyyyyk",
  "..kyykk.",
  "..kyyk..",
  "..kyykk.",
  "..kyyyyk",
  "..kkkkk.",
];

const BOOMERANG = [
  ".kkkkk..",
  "kbbbbbk.",
  "kbYkkk..",
  "kbk.....",
  "kbk.....",
  ".k......",
  "........",
  "........",
];

/** A golden triangle made of three smaller triangles (16x14). */
const TRIFORCE = generate(16, 14, (x, y) => {
  const sub = y < 7 ? [8] : [4, 12];
  const row = y % 7;
  const half = Math.floor(row / 2) + 1;
  for (const center of sub) {
    const left = center - half;
    const right = center + half - 1;
    if (x < left || x > right) continue;
    if (row === 6) return "o";
    return x === left ? "Y" : x === right ? "o" : "y";
  }
  return ".";
});

const CHEST_CLOSED = [
  "................",
  "................",
  "..kkkkkkkkkkkk..",
  ".kbbbbbbbbbbbbk.",
  ".kbYbbbbbbbbYbk.",
  ".kbbbbbbbbbbbbk.",
  ".kkkkkkYYkkkkkk.",
  ".kbbbbkYYkbbbbk.",
  ".kbYbbbkkbbbYbk.",
  ".kbbbbbbbbbbbbk.",
  ".kbbbbbbbbbbbbk.",
  ".kbYbbbbbbbbYbk.",
  ".kbbbbbbbbbbbbk.",
  ".kkkkkkkkkkkkkk.",
  "................",
  "................",
];

export const ITEM_ART: Record<string, Art> = {
  heart: art(HEART_PALETTE, HEART),
  heart_half: art(HEART_PALETTE, HEART_HALF),
  heart_empty: art(HEART_PALETTE, HEART_EMPTY),
  heart_container: art(PICKUP, HEART_CONTAINER),
  rupee: art(PICKUP, RUPEE),
  rupee_blue: recolor(art(PICKUP, RUPEE), { g: COLOR.blue, G: COLOR.navy, w: COLOR.lightBlue }),
  rupee_flash: recolor(art(PICKUP, RUPEE), { g: COLOR.orange, G: COLOR.red, w: COLOR.yellow }),
  key: art(PICKUP, KEY),
  boomerang_0: art(PICKUP, BOOMERANG),
  boomerang_1: art(PICKUP, rotateCW(BOOMERANG)),
  boomerang_2: art(PICKUP, rotateCW(rotateCW(BOOMERANG))),
  boomerang_3: art(PICKUP, rotateCW(rotateCW(rotateCW(BOOMERANG)))),
  triforce: art(PICKUP, TRIFORCE),
  triforce_flash: recolor(art(PICKUP, TRIFORCE), { y: COLOR.white, Y: COLOR.yellow }),
  chest: art(PICKUP, CHEST_CLOSED),
  potion: art(PICKUP, [
    "...kk...",
    "..kbbk..",
    "..kwwk..",
    ".kwrrwk.",
    "krrrrrrk",
    "krwrrrrk",
    "krwrrrrk",
    "krrrrrrk",
    "kRrrrrRk",
    ".kRRRRk.",
    "..kkkk..",
  ]),
};

// Small UI glyphs used by the HUD.
export const ICON_ART: Record<string, Art> = {
  icon_rupee: art(PICKUP, [
    "..kk..",
    ".kwgk.",
    "kwggGk",
    "kwggGk",
    "kwggGk",
    ".kgGk.",
    "..kk..",
  ]),
  icon_key: art(PICKUP, [".kkk..", "kyYyk.", "kykyk.", ".kyk..", ".kyykk", ".kyk..", ".kyykk", "..kk.."]),
  cursor: art(PICKUP, flipX(["..k.", ".kYk", "kYYk", ".kYk", "..k."])),
};
