import type { Renderer, Variant } from "../../gfx/renderer";
import { moveWithCollision } from "../physics";
import type { World } from "../world";
import { Enemy } from "./enemy";

const MAX_SPEED = 1.3;

/** A bat that flutters around in erratic bursts, ignoring pits and blocks. */
export class Keese extends Enemy {
  private speed = 0;
  private targetSpeed = 0;
  private angle = 0;
  private timer = 30;

  constructor(x: number, y: number) {
    super(x, y, 1);
    this.movement = "fly";
    this.diesToBoomerang = true;
    this.dropChance = 0.3;
    this.hitbox = { ox: 2, oy: 5, w: 12, h: 8 };
  }

  protected think(world: World): void {
    if (--this.timer <= 0) {
      if (this.targetSpeed === 0) {
        this.targetSpeed = MAX_SPEED;
        this.angle = world.rng.range(0, Math.PI * 2);
        this.timer = 60 + world.rng.int(90);
      } else if (world.rng.chance(0.25)) {
        this.targetSpeed = 0;
        this.timer = 40 + world.rng.int(60);
      } else {
        this.angle += world.rng.range(-Math.PI / 2, Math.PI / 2);
        this.timer = 20 + world.rng.int(40);
      }
    }
    this.speed += Math.sign(this.targetSpeed - this.speed) * 0.03;
    if (Math.abs(this.targetSpeed - this.speed) < 0.03) this.speed = this.targetSpeed;
    const { ox, oy, w, h } = this.hitbox;
    const hit = moveWithCollision(
      this,
      Math.cos(this.angle) * this.speed,
      Math.sin(this.angle) * this.speed,
      (x, y) => ({ x: x + ox, y: y + oy, w, h }),
      (r) => this.blockedAt(world, r),
    );
    // Bounce off walls.
    if (hit.hitX) this.angle = Math.PI - this.angle;
    if (hit.hitY) this.angle = -this.angle;
  }

  protected drawBody(r: Renderer, variant: Variant): void {
    const flapRate = this.speed > 0.1 ? 6 : 1000;
    const frame = this.speed > 0.1 ? Math.floor(this.anim / flapRate) % 2 : 1;
    r.sprite(`keese_${frame}`, this.x, this.y, variant);
  }
}
