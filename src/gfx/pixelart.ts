/**
 * Pixel art is authored as arrays of strings, one character per pixel.
 * '.' is always transparent; every other character is looked up in the palette.
 * Everything in this module is pure data manipulation so it can be unit tested without a DOM.
 */

export type Palette = Readonly<Record<string, string>>;

export interface Art {
  readonly rows: readonly string[];
  readonly palette: Palette;
}

export const TRANSPARENT = ".";

export function art(palette: Palette, rows: readonly string[]): Art {
  return { palette, rows };
}

/** Builds rows from a per-pixel function. Handy for textures and geometric shapes. */
export function generate(w: number, h: number, pixel: (x: number, y: number) => string): string[] {
  const rows: string[] = [];
  for (let y = 0; y < h; y++) {
    let row = "";
    for (let x = 0; x < w; x++) row += pixel(x, y);
    rows.push(row);
  }
  return rows;
}

export function flipX(rows: readonly string[]): string[] {
  return rows.map((r) => [...r].reverse().join(""));
}

export function flipY(rows: readonly string[]): string[] {
  return [...rows].reverse();
}

/** Rotates 90 degrees clockwise. */
export function rotateCW(rows: readonly string[]): string[] {
  const h = rows.length;
  const w = rows[0]?.length ?? 0;
  return generate(h, w, (x, y) => rows[h - 1 - x][y]);
}

/** Replaces palette entries, producing a recolored copy (e.g. red vs. blue enemies). */
export function recolor(a: Art, overrides: Palette): Art {
  return { rows: a.rows, palette: { ...a.palette, ...overrides } };
}

/** Stamps `top` onto `base` at (ox, oy); transparent pixels in `top` are skipped. */
export function overlay(base: readonly string[], top: readonly string[], ox: number, oy: number): string[] {
  return base.map((row, y) => {
    const src = top[y - oy];
    if (src === undefined) return row;
    return [...row]
      .map((ch, x) => {
        const t = src[x - ox];
        return t !== undefined && t !== TRANSPARENT ? t : ch;
      })
      .join("");
  });
}

/** Deterministic hash noise in [0, 1) used for texture generation. */
export function hash2(x: number, y: number, seed = 0): number {
  let h = (x * 374761393 + y * 668265263 + seed * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** Returns a list of problems with the art (inconsistent row width, unknown colors). */
export function validateArt(name: string, a: Art): string[] {
  const problems: string[] = [];
  if (a.rows.length === 0) problems.push(`${name}: no rows`);
  const width = a.rows[0]?.length ?? 0;
  a.rows.forEach((row, y) => {
    if (row.length !== width) problems.push(`${name}: row ${y} has width ${row.length}, expected ${width}`);
    for (const ch of row) {
      if (ch !== TRANSPARENT && !(ch in a.palette)) problems.push(`${name}: row ${y} uses unknown color '${ch}'`);
    }
  });
  return problems;
}
