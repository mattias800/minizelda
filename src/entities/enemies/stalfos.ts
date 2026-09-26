import type { Renderer, Variant } from "../../gfx/renderer";
import { GridWalker } from "./walker";

/** A skeleton that wanders dungeon rooms. */
export class Stalfos extends GridWalker {
  constructor(x: number, y: number) {
    super(x, y, 2);
    this.speed = 0.75;
    this.turnChance = 0.2;
    this.chaseChance = 0.35;
  }

  protected drawBody(r: Renderer, variant: Variant): void {
    r.sprite(`stalfos_${Math.floor(this.anim / 12) % 2}`, this.x, this.y, variant);
  }
}
