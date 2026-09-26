import { describe, expect, it } from "vitest";
import { ALL_ART } from "../src/gfx/art";
import { ALL_GLYPHS } from "../src/gfx/font";
import { flipX, overlay, rotateCW, validateArt } from "../src/gfx/pixelart";

describe("pixel art", () => {
  it("every sprite has consistent row widths and only known colors", () => {
    const problems = Object.entries(ALL_ART).flatMap(([name, a]) => validateArt(name, a));
    expect(problems).toEqual([]);
  });

  it("all 16x16 tiles and characters are the expected size", () => {
    const sixteen = ["hero_down_0", "hero_up_1", "hero_right_0", "octorok_red_0_left", "tree", "cliff", "stalfos_0"];
    for (const name of sixteen) {
      expect(ALL_ART[name].rows.length, name).toBe(16);
      expect(ALL_ART[name].rows[0].length, name).toBe(16);
    }
    expect(ALL_ART.dragon_0.rows.length).toBe(32);
  });

  it("font glyphs are 5x7", () => {
    for (const [ch, rows] of Object.entries(ALL_GLYPHS)) {
      expect(rows.length, ch).toBe(7);
      for (const row of rows) expect(row.length, ch).toBe(5);
    }
  });
});

describe("pixel art transforms", () => {
  const rows = ["ab", "cd", "ef"];

  it("flips horizontally", () => {
    expect(flipX(rows)).toEqual(["ba", "dc", "fe"]);
  });

  it("rotates clockwise", () => {
    expect(rotateCW(rows)).toEqual(["eca", "fdb"]);
    expect(rotateCW(rotateCW(rotateCW(rotateCW(rows))))).toEqual(rows);
  });

  it("overlays with transparency", () => {
    expect(overlay(["....", "...."], ["x.", ".y"], 1, 0)).toEqual([".x..", "..y."]);
  });
});
