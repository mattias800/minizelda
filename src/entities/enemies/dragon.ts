import type { Renderer, Variant } from "../../gfx/renderer";
import { Puff, Sparkle } from "../effects";
import { Fireball } from "../projectiles";
import type { World } from "../world";
import { Enemy } from "./enemy";

const FIRE_SPEED = 1.6;
const SPREAD = 0.32;
const MOUTH_OPEN_FRAMES = 24;

/** The dungeon boss: a horned dragon pacing on the right side and breathing fireball fans. */
export class Dragon extends Enemy {
  private readonly homeX: number;
  private walkDir = -1;
  private fireTimer = 80;
  private roared = false;
  private mouthTimer = 0;

  constructor(x: number, y: number) {
    super(x, y, 6);
    this.isBoss = true;
    this.contactDamage = 2;
    this.dropChance = 0;
    this.homeX = x;
    this.hitbox = { ox: 2, oy: 4, w: 28, h: 24 };
  }

  protected think(world: World): void {
    if (!this.roared) {
      this.roared = true;
      world.audio.sfx("roar");
    }
    if (this.anim % 2 === 0) {
      this.x += this.walkDir * 0.5;
      if (this.x <= this.homeX - 36 || this.x >= this.homeX || world.rng.chance(0.004)) {
        this.walkDir = this.x >= this.homeX ? -1 : this.x <= this.homeX - 36 ? 1 : -this.walkDir;
      }
    }
    if (this.mouthTimer > 0) this.mouthTimer--;
    if (--this.fireTimer <= 0) {
      this.breatheFire(world);
      this.fireTimer = 90 + world.rng.int(70);
      this.mouthTimer = 16;
    }
  }

  private breatheFire(world: World): void {
    const mx = this.x + 4;
    const my = this.y + 12;
    const base = Math.atan2(world.player.cy - my, world.player.cx - mx);
    for (const offset of [-SPREAD, 0, SPREAD]) {
      const a = base + offset;
      world.spawn(new Fireball(mx, my, Math.cos(a) * FIRE_SPEED, Math.sin(a) * FIRE_SPEED));
    }
    world.audio.sfx("fireball");
  }

  override die(world: World): void {
    super.die(world);
    world.audio.sfx("bossDie");
    for (let i = 0; i < 6; i++) {
      const cx = this.x + 4 + world.rng.int(24);
      const cy = this.y + 4 + world.rng.int(24);
      world.spawn(i % 2 === 0 ? new Sparkle(cx, cy) : new Puff(cx, cy));
    }
  }

  protected drawBody(r: Renderer, variant: Variant): void {
    const open = this.fireTimer < MOUTH_OPEN_FRAMES || this.mouthTimer > 0;
    const legs = Math.floor(this.x / 4) % 2 === 0 ? 0 : 1;
    const hitFlash = this.invuln > 0 ? (this.invuln % 4 < 2 ? "white" : variant) : variant;
    r.sprite(`dragon${open ? "_open" : ""}_${legs}`, this.x, this.y, hitFlash);
  }
}
