import type { Renderer } from "../gfx/renderer";
import { Entity } from "./entity";

/** Short-lived visual effect that removes itself after `duration` frames. */
abstract class Effect extends Entity {
  protected age = 0;

  constructor(
    x: number,
    y: number,
    protected readonly duration: number,
  ) {
    super(x, y);
    this.layer = 3;
  }

  override update(): void {
    if (++this.age >= this.duration) this.dead = true;
  }
}

/** The starburst shown when an enemy is defeated. Centered on (cx, cy). */
export class Sparkle extends Effect {
  constructor(cx: number, cy: number) {
    super(cx - 8, cy - 8, 18);
  }

  draw(r: Renderer): void {
    const frame = this.age < 6 ? 0 : this.age < 12 ? 1 : 0;
    r.sprite(`sparkle_${frame}`, this.x, this.y, this.age % 4 < 2 ? "normal" : "hurtA");
  }
}

/** A puff of smoke (enemy spawn, boss defeat). */
export class Puff extends Effect {
  constructor(cx: number, cy: number) {
    super(cx - 8, cy - 8, 18);
  }

  draw(r: Renderer): void {
    r.sprite(`puff_${Math.min(2, Math.floor(this.age / 6))}`, this.x, this.y);
  }
}

/** A tiny spark flying in a direction; used for shield blocks and sword beam bursts. */
export class Spark extends Effect {
  constructor(
    cx: number,
    cy: number,
    private readonly vx = 0,
    private readonly vy = 0,
    duration = 12,
  ) {
    super(cx - 2, cy - 2, duration);
  }

  override update(): void {
    super.update();
    this.x += this.vx;
    this.y += this.vy;
  }

  draw(r: Renderer): void {
    if (this.age % 2 === 0) r.sprite("spark", this.x, this.y);
  }
}

/** Leaves flying off a cut bush. */
export class Leaf extends Effect {
  private vy: number;

  constructor(
    cx: number,
    cy: number,
    private readonly vx: number,
    vy: number,
    private readonly color: string,
  ) {
    super(cx, cy, 20);
    this.vy = vy;
  }

  override update(): void {
    super.update();
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.12;
  }

  draw(r: Renderer): void {
    r.rect(this.x, this.y, 3, 2, this.color);
    r.rect(this.x + 1, this.y + 2, 1, 1, "#0c3c10");
  }
}
