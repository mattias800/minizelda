import { DIR_VEC, type Dir } from "../engine/math";
import type { Renderer } from "../gfx/renderer";
import { Entity } from "./entity";
import type { Pickup } from "./pickup";
import type { World } from "./world";

const SPEED = 3;
const RETURN_SPEED = 3.5;
const RANGE = 88;

/** Flies out, stuns enemies, grabs items and comes back. */
export class Boomerang extends Entity {
  private returning = false;
  private traveled = 0;
  private age = 0;
  private readonly vx: number;
  private readonly vy: number;
  private readonly carried: Pickup[] = [];

  constructor(cx: number, cy: number, dir: Dir) {
    super(cx - 4, cy - 4);
    const v = DIR_VEC[dir];
    this.vx = v.x * SPEED;
    this.vy = v.y * SPEED;
    this.hitbox = { ox: 0, oy: 0, w: 8, h: 8 };
    this.layer = 2;
  }

  get isReturning(): boolean {
    return this.returning;
  }

  comeBack(): void {
    this.returning = true;
  }

  grab(pickup: Pickup): void {
    if (pickup.carried) return;
    pickup.carried = true;
    this.carried.push(pickup);
    this.comeBack();
  }

  override update(world: World): void {
    this.age++;
    if (this.age % 8 === 1) world.audio.sfx("boomerang");
    if (!this.returning) {
      this.x += this.vx;
      this.y += this.vy;
      this.traveled += SPEED;
      if (this.traveled >= RANGE || world.map.rectBlocked(this.box, "projectile")) this.comeBack();
    } else {
      const dx = world.player.cx - this.cx;
      const dy = world.player.cy - this.cy;
      const dist = Math.hypot(dx, dy);
      if (dist <= RETURN_SPEED + 2) {
        this.dead = true;
        // Drop what we carried right on the player so it gets collected this frame.
        for (const p of this.carried) {
          p.carried = false;
          p.x = world.player.cx - p.hitbox.w / 2;
          p.y = world.player.cy - p.hitbox.h / 2;
        }
        return;
      }
      this.x += (dx / dist) * RETURN_SPEED;
      this.y += (dy / dist) * RETURN_SPEED;
    }
    for (const p of this.carried) {
      p.x = this.cx - p.hitbox.w / 2;
      p.y = this.cy - p.hitbox.h / 2;
    }
  }

  draw(r: Renderer): void {
    r.sprite(`boomerang_${Math.floor(this.age / 3) % 4}`, this.x, this.y);
  }
}
