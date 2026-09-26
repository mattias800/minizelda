import { TILE } from "../../engine/constants";
import type { Rect } from "../../engine/math";
import type { Renderer, Variant } from "../../gfx/renderer";
import type { World } from "../world";
import { Enemy } from "./enemy";

const JUMP_FRAMES = 30;
const JUMP_HEIGHT = 18;

/** A one-eyed spider that hops unpredictably across the field. */
export class Tektite extends Enemy {
  private resting = true;
  private timer = 30;
  private fromX = 0;
  private fromY = 0;
  private toX = 0;
  private toY = 0;
  private t = 0;
  private z = 0;

  constructor(x: number, y: number) {
    super(x, y, 1);
    this.hitbox = { ox: 1, oy: 4, w: 14, h: 10 };
  }

  override get box(): Rect {
    return { x: this.x + this.hitbox.ox, y: this.y + this.hitbox.oy - this.z, w: this.hitbox.w, h: this.hitbox.h };
  }

  protected think(world: World): void {
    if (this.resting) {
      if (--this.timer <= 0) this.startJump(world);
      return;
    }
    this.t++;
    const p = this.t / JUMP_FRAMES;
    this.x = this.fromX + (this.toX - this.fromX) * p;
    this.y = this.fromY + (this.toY - this.fromY) * p;
    this.z = Math.sin(p * Math.PI) * JUMP_HEIGHT;
    if (this.t >= JUMP_FRAMES) {
      this.z = 0;
      this.resting = true;
      this.timer = 20 + world.rng.int(60);
    }
  }

  private startJump(world: World): void {
    for (let attempt = 0; attempt < 10; attempt++) {
      // Lean toward the player so tektites feel aggressive but erratic.
      const bias = world.rng.chance(0.5);
      const dx = bias ? Math.sign(world.player.x - this.x) * (1 + world.rng.int(2)) : world.rng.int(5) - 2;
      const dy = bias ? Math.sign(world.player.y - this.y) * (1 + world.rng.int(2)) : world.rng.int(5) - 2;
      if (dx === 0 && dy === 0) continue;
      const tx = this.x + dx * TILE;
      const ty = this.y + dy * TILE;
      const { ox, oy, w, h } = this.hitbox;
      if (!this.blockedAt(world, { x: tx + ox, y: ty + oy, w, h })) {
        this.fromX = this.x;
        this.fromY = this.y;
        this.toX = tx;
        this.toY = ty;
        this.t = 0;
        this.resting = false;
        return;
      }
    }
    this.timer = 15;
  }

  protected drawBody(r: Renderer, variant: Variant): void {
    if (this.z > 1) r.rect(this.x + 4, this.y + 13, 8, 2, "rgba(0,0,0,0.35)");
    const frame = this.resting ? Math.floor(this.anim / 16) % 2 : 1;
    r.sprite(`tektite_${frame}`, this.x, this.y - this.z, variant);
  }
}
