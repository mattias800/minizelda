import type { Rect } from "../engine/math";
import type { Renderer } from "../gfx/renderer";
import type { World } from "./world";

export interface Hitbox {
  ox: number;
  oy: number;
  w: number;
  h: number;
}

/** Anything that lives in a room. Positions are the top-left of the sprite in room pixels. */
export abstract class Entity {
  dead = false;
  /** Solid entities (NPCs, fires) block the player like walls. */
  solid = false;
  /** Draw order; higher is drawn later (on top). */
  layer = 1;
  hitbox: Hitbox = { ox: 0, oy: 0, w: 16, h: 16 };

  constructor(
    public x: number,
    public y: number,
  ) {}

  get box(): Rect {
    return { x: this.x + this.hitbox.ox, y: this.y + this.hitbox.oy, w: this.hitbox.w, h: this.hitbox.h };
  }

  get cx(): number {
    const b = this.box;
    return b.x + b.w / 2;
  }

  get cy(): number {
    const b = this.box;
    return b.y + b.h / 2;
  }

  update(_world: World): void {}

  abstract draw(r: Renderer, world: World): void;
}
