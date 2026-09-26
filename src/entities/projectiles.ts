import { ROOM_H, ROOM_W } from "../engine/constants";
import { dirFromVector, DIR_VEC, type Dir } from "../engine/math";
import type { Renderer } from "../gfx/renderer";
import type { CollisionMode } from "../world/tilemap";
import { Spark } from "./effects";
import { Entity } from "./entity";
import type { World } from "./world";

export abstract class Projectile extends Entity {
  /** True for the player's projectiles, false for enemies'. */
  abstract readonly friendly: boolean;
  /** Damage in half hearts (or enemy hit points for friendly projectiles). */
  damage = 1;
  /** Can the player's shield stop it? */
  blockable = false;
  protected collision: CollisionMode = "projectile";
  protected age = 0;

  constructor(
    x: number,
    y: number,
    public vx: number,
    public vy: number,
  ) {
    super(x, y);
    this.layer = 2;
  }

  get dir(): Dir {
    return dirFromVector(this.vx, this.vy);
  }

  override update(world: World): void {
    this.age++;
    this.x += this.vx;
    this.y += this.vy;
    const b = this.box;
    const outside = b.x + b.w < 0 || b.y + b.h < 0 || b.x > ROOM_W || b.y > ROOM_H;
    if (outside || world.map.rectBlocked(b, this.collision, true)) this.onWall(world);
  }

  onWall(_world: World): void {
    this.dead = true;
  }

  /** Called when the projectile hits its target (or is blocked by the shield). */
  onImpact(_world: World): void {
    this.dead = true;
  }
}

/** Octorok ammunition. */
export class Rock extends Projectile {
  readonly friendly = false;

  constructor(cx: number, cy: number, dir: Dir) {
    const v = DIR_VEC[dir];
    super(cx - 4, cy - 4, v.x * 2.5, v.y * 2.5);
    this.hitbox = { ox: 1, oy: 1, w: 6, h: 6 };
    this.blockable = true;
  }

  draw(r: Renderer): void {
    r.sprite("rock", this.x, this.y);
  }
}

/** The dragon's fireballs fly over blocks and can't be blocked by the small shield. */
export class Fireball extends Projectile {
  readonly friendly = false;

  constructor(cx: number, cy: number, vx: number, vy: number) {
    super(cx - 5, cy - 5, vx, vy);
    this.hitbox = { ox: 2, oy: 2, w: 6, h: 6 };
    this.collision = "fly";
  }

  draw(r: Renderer): void {
    r.sprite(this.age % 8 < 4 ? "fireball_0" : "fireball_1", this.x, this.y);
  }
}

/** Fired from the sword when the player has full health. */
export class SwordBeam extends Projectile {
  readonly friendly = true;
  private readonly facing: Dir;

  constructor(x: number, y: number, dir: Dir) {
    const v = DIR_VEC[dir];
    super(x, y, v.x * 4, v.y * 4);
    this.facing = dir;
    this.hitbox = dir === "up" || dir === "down" ? { ox: 1, oy: 0, w: 5, h: 16 } : { ox: 0, oy: 1, w: 16, h: 5 };
  }

  override onWall(world: World): void {
    this.burst(world);
  }

  override onImpact(world: World): void {
    this.burst(world);
  }

  private burst(world: World): void {
    if (this.dead) return;
    this.dead = true;
    const cx = Math.max(4, Math.min(ROOM_W - 4, this.cx));
    const cy = Math.max(4, Math.min(ROOM_H - 4, this.cy));
    for (const [sx, sy] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ]) {
      world.spawn(new Spark(cx, cy, sx * 2, sy * 2, 14));
    }
  }

  draw(r: Renderer): void {
    r.sprite(`${this.age % 4 < 2 ? "beam_a" : "beam_b"}_${this.facing}`, this.x, this.y);
  }
}
