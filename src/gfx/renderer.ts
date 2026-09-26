import { ALL_ART } from "./art";
import { CHAR_ADVANCE, GLYPH_H, GLYPH_W, glyphRows, textWidth } from "./font";
import { TRANSPARENT, type Art } from "./pixelart";

/** Palette effects applied to a whole sprite, e.g. the flashing when something takes damage. */
export type Variant = "normal" | "hurtA" | "hurtB" | "white" | "silhouette";

type ColorFn = (hex: string) => string;

const VARIANTS: Record<Exclude<Variant, "normal">, ColorFn> = {
  hurtA: (hex) => {
    const [r, g, b] = parseHex(hex);
    return toHex(255 - r, 255 - g, 255 - b);
  },
  hurtB: (hex) => {
    const [r, g, b] = parseHex(hex);
    const l = (r + g + b) / 3;
    return toHex(Math.min(255, l + 120), l * 0.5, l * 0.3);
  },
  white: () => "#fcfcfc",
  silhouette: () => "#000000",
};

function parseHex(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex(r: number, g: number, b: number): string {
  const c = (v: number) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

function rasterize(a: Art, colorFn?: ColorFn): HTMLCanvasElement {
  const h = a.rows.length;
  const w = a.rows[0].length;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  const image = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ch = a.rows[y][x];
      if (ch === TRANSPARENT) continue;
      const hex = colorFn ? colorFn(a.palette[ch]) : a.palette[ch];
      const [r, g, b] = parseHex(hex);
      const i = (y * w + x) * 4;
      image.data[i] = r;
      image.data[i + 1] = g;
      image.data[i + 2] = b;
      image.data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}

/** Lazily rasterizes pixel art into canvases, cached per sprite and variant. */
export class SpriteCache {
  private cache = new Map<string, HTMLCanvasElement>();

  get(name: string, variant: Variant = "normal"): HTMLCanvasElement {
    const key = `${name}|${variant}`;
    let canvas = this.cache.get(key);
    if (!canvas) {
      const a = ALL_ART[name];
      if (!a) throw new Error(`Unknown sprite '${name}'`);
      canvas = rasterize(a, variant === "normal" ? undefined : VARIANTS[variant]);
      this.cache.set(key, canvas);
    }
    return canvas;
  }

  size(name: string): { w: number; h: number } {
    const a = ALL_ART[name];
    return { w: a.rows[0].length, h: a.rows.length };
  }
}

/** Thin drawing API over a 2D context at native resolution. */
export class Renderer {
  readonly sprites = new SpriteCache();
  private glyphCache = new Map<string, HTMLCanvasElement>();

  constructor(readonly ctx: CanvasRenderingContext2D) {
    ctx.imageSmoothingEnabled = false;
  }

  clear(color: string): void {
    this.rect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height, color);
  }

  sprite(name: string, x: number, y: number, variant: Variant = "normal", flipX = false): void {
    const img = this.sprites.get(name, variant);
    if (!flipX) {
      this.ctx.drawImage(img, Math.round(x), Math.round(y));
      return;
    }
    this.ctx.save();
    this.ctx.translate(Math.round(x) + img.width, Math.round(y));
    this.ctx.scale(-1, 1);
    this.ctx.drawImage(img, 0, 0);
    this.ctx.restore();
  }

  /** Draws a sprite so that its center lands on (cx, cy). */
  spriteCentered(name: string, cx: number, cy: number, variant: Variant = "normal"): void {
    const { w, h } = this.sprites.size(name);
    this.sprite(name, cx - w / 2, cy - h / 2, variant);
  }

  rect(x: number, y: number, w: number, h: number, color: string): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  strokeRect(x: number, y: number, w: number, h: number, color: string): void {
    this.rect(x, y, w, 1, color);
    this.rect(x, y + h - 1, w, 1, color);
    this.rect(x, y, 1, h, color);
    this.rect(x + w - 1, y, 1, h, color);
  }

  text(text: string, x: number, y: number, color = "#fcfcfc"): void {
    let cx = Math.round(x);
    for (const ch of text) {
      const glyph = this.glyph(ch, color);
      if (glyph) this.ctx.drawImage(glyph, cx, Math.round(y));
      cx += CHAR_ADVANCE;
    }
  }

  /** Draws text magnified by an integer factor (for titles). */
  textScaled(text: string, x: number, y: number, scale: number, color = "#fcfcfc"): void {
    let cx = Math.round(x);
    for (const ch of text) {
      const glyph = this.glyph(ch, color);
      if (glyph) this.ctx.drawImage(glyph, cx, Math.round(y), GLYPH_W * scale, GLYPH_H * scale);
      cx += CHAR_ADVANCE * scale;
    }
  }

  /** Draws a sprite magnified by an integer factor. */
  spriteScaled(name: string, x: number, y: number, scale: number, variant: Variant = "normal"): void {
    const img = this.sprites.get(name, variant);
    this.ctx.drawImage(img, Math.round(x), Math.round(y), img.width * scale, img.height * scale);
  }

  textCentered(text: string, cx: number, y: number, color = "#fcfcfc"): void {
    this.text(text, cx - textWidth(text) / 2, y, color);
  }

  /** Runs `draw` with the origin translated by (dx, dy). */
  withOffset(dx: number, dy: number, draw: () => void): void {
    this.ctx.save();
    this.ctx.translate(Math.round(dx), Math.round(dy));
    draw();
    this.ctx.restore();
  }

  /** Runs `draw` with drawing restricted to the given rectangle. */
  withClip(x: number, y: number, w: number, h: number, draw: () => void): void {
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.rect(x, y, w, h);
    this.ctx.clip();
    draw();
    this.ctx.restore();
  }

  withAlpha(alpha: number, draw: () => void): void {
    this.ctx.save();
    this.ctx.globalAlpha = alpha;
    draw();
    this.ctx.restore();
  }

  private glyph(ch: string, color: string): HTMLCanvasElement | undefined {
    const key = `${ch}|${color}`;
    let canvas = this.glyphCache.get(key);
    if (!canvas) {
      const rows = glyphRows(ch);
      if (!rows) return undefined;
      canvas = document.createElement("canvas");
      canvas.width = GLYPH_W;
      canvas.height = GLYPH_H;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = color;
      rows.forEach((row, y) => [...row].forEach((c, x) => c === "#" && ctx.fillRect(x, y, 1, 1)));
      this.glyphCache.set(key, canvas);
    }
    return canvas;
  }
}
