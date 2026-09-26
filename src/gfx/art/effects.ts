import { art, generate, type Art } from "../pixelart";
import { COLOR } from "../palettes";

const PUFF_PALETTE = { k: COLOR.darkGrey, w: COLOR.white, e: COLOR.lightGrey };

function puff(radius: number, seed: number): string[] {
  return generate(16, 16, (x, y) => {
    // A few overlapping circles make a cloud.
    const blobs = [
      [8, 8, radius],
      [5 + seed, 6, radius * 0.7],
      [11 - seed, 10, radius * 0.7],
      [10, 5 + seed, radius * 0.6],
    ];
    let best = Infinity;
    for (const [cx, cy, r] of blobs) best = Math.min(best, Math.hypot(x + 0.5 - cx, y + 0.5 - cy) - r);
    if (best < -1.5) return "w";
    if (best < -0.5) return "e";
    if (best < 0.3) return "k";
    return ".";
  });
}

function sparkle(len: number): string[] {
  return generate(16, 16, (x, y) => {
    const dx = Math.abs(x + 0.5 - 8);
    const dy = Math.abs(y + 0.5 - 8);
    const onCross = (dx < 1 && dy < len) || (dy < 1 && dx < len);
    const onDiag = Math.abs(dx - dy) < 0.8 && dx < len * 0.6;
    if (dx < 1.5 && dy < 1.5) return "w";
    if (onCross) return "y";
    if (onDiag) return "r";
    return ".";
  });
}

const FIRE = [
  "................",
  "................",
  ".......kk.......",
  "......krk.......",
  "......krrk......",
  ".....krrrk......",
  "....krroork.....",
  "....kroooork....",
  "...kroooyyork...",
  "...kroooyyork...",
  "...kroyyyyyork..",
  "...kroyywwyork..",
  "...kroyywwyork..",
  "....kroyyyyrk...",
  ".....krrrrrk....",
  "......kkkkk.....",
];
const FIRE_PALETTE = { k: COLOR.darkRed, r: COLOR.red, o: COLOR.orange, y: COLOR.yellow, w: COLOR.white };

const SPARKLE_PALETTE = { w: COLOR.white, y: COLOR.yellow, r: COLOR.red };

export const EFFECT_ART: Record<string, Art> = {
  puff_0: art(PUFF_PALETTE, puff(3, 0)),
  puff_1: art(PUFF_PALETTE, puff(5, 1)),
  puff_2: art(PUFF_PALETTE, puff(6.5, 2)),
  sparkle_0: art(SPARKLE_PALETTE, sparkle(4)),
  sparkle_1: art(SPARKLE_PALETTE, sparkle(8)),
  fire: art(FIRE_PALETTE, FIRE),
  spark: art(SPARKLE_PALETTE, ["..y..", ".yyy.", "yywyy", ".yyy.", "..y.."]),
};
