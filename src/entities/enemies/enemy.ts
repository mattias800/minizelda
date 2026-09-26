import { ROOM_H, ROOM_W } from "../../engine/constants";
import { DIR_VEC, type Dir, type Rect } from "../../engine/math";
import type { Renderer, Variant } from "../../gfx/renderer";
import type { CollisionMode } from "../../world/tilemap";
import { Sparkle } from "../effects";
import { Entity } from "../entity";
import { moveWithCollision, nearestGrid } from "../physics";
import { Pickup } from "../pickup";
import type { World } from "../world";

const SPAWN_FRAMES = 30;
const KNOCKBACK_FRAMES = 8;
const KNOCKBACK_SPEED = 2;
const HURT_INVULN = 20;

export interface DamageSource {
  amount: number;
  /** Direction the hit pushes the enemy. */
  push?: Dir;
}

export abstract class Enemy extends Entity {
  hp: number;
  /** Contact damage in half hearts. */
  contactDamage = 1;
  /** Collision mode used when moving. */
  movement: CollisionMode = "enemy";
  isBoss = false;
  /** Chance of dropping an item when defeated. */
  dropChance = 0.4;
  /** The boomerang defeats weak enemies outright instead of stunning them. */
  diesToBoomerang = false;
  invuln = 0;
  stun = 0;
  protected spawnTimer = SPAWN_FRAMES;
  protected knockFrames = 0;
  protected knockDir: Dir = "down";
  protected anim = 0;

  constructor(x: number, y: number, hp: number) {
    super(x, y);
    this.hp = hp;
    this.hitbox = { ox: 1, oy: 1, w: 14, h: 14 };
  }

  /** Enemies can't hurt or be hurt while materializing. */
  get active(): boolean {
    return this.spawnTimer <= 0;
  }

  override update(world: World): void {
    if (this.spawnTimer > 0) {
      this.spawnTimer--;
      return;
    }
    if (this.invuln > 0) this.invuln--;
    if (this.knockFrames > 0) {
      this.knockFrames--;
      const v = DIR_VEC[this.knockDir];
      this.move(world, v.x * KNOCKBACK_SPEED, v.y * KNOCKBACK_SPEED);
      if (this.knockFrames === 0) this.snapToGrid(world);
      return;
    }
    if (this.stun > 0) {
      this.stun--;
      return;
    }
    this.anim++;
    this.think(world);
  }

  /** Per-frame behavior when not spawning, stunned or knocked back. */
  protected abstract think(world: World): void;

  protected abstract drawBody(r: Renderer, variant: Variant, world: World): void;

  draw(r: Renderer, world: World): void {
    if (this.spawnTimer > 0) {
      const frame = this.spawnTimer > 20 ? 0 : this.spawnTimer > 10 ? 1 : 2;
      r.sprite(`puff_${frame}`, this.x + (this.box.w - 16) / 2 + this.hitbox.ox, this.y + (this.box.h - 16) / 2 + this.hitbox.oy);
      return;
    }
    let variant: Variant = "normal";
    if (this.invuln > 0) variant = this.invuln % 4 < 2 ? "hurtA" : "hurtB";
    else if (this.stun > 0 && this.stun < 40 && this.stun % 8 < 4) variant = "hurtB";
    this.drawBody(r, variant, world);
  }

  /** Returns true if the hit landed. */
  hurt(world: World, source: DamageSource): boolean {
    if (!this.active || this.invuln > 0) return false;
    this.hp -= source.amount;
    this.stun = 0;
    if (this.hp <= 0) {
      this.die(world);
      return true;
    }
    world.audio.sfx(this.isBoss ? "bossHit" : "hit");
    this.invuln = HURT_INVULN;
    if (source.push && !this.isBoss) {
      this.knockDir = source.push;
      this.knockFrames = KNOCKBACK_FRAMES;
    }
    return true;
  }

  /** Reaction to being hit by the boomerang. */
  onBoomerang(world: World): void {
    if (!this.active) return;
    if (this.diesToBoomerang) {
      this.die(world);
    } else if (!this.isBoss) {
      this.stun = 150;
      world.audio.sfx("hit");
    } else {
      world.audio.sfx("shield");
    }
  }

  die(world: World): void {
    this.dead = true;
    world.state.enemiesDefeated++;
    world.audio.sfx("kill");
    world.spawn(new Sparkle(this.cx, this.cy));
    if (world.rng.chance(this.dropChance)) {
      const roll = world.rng.next();
      const item = roll < 0.55 ? "rupee" : roll < 0.9 ? "heart" : "rupee_blue";
      world.spawn(Pickup.dropped(item, this.cx, this.cy));
    }
  }

  /** Moves with tile collision; returns true if blocked on any axis. */
  protected move(world: World, dx: number, dy: number): boolean {
    const { ox, oy, w, h } = this.hitbox;
    const res = moveWithCollision(
      this,
      dx,
      dy,
      (x, y) => ({ x: x + ox, y: y + oy, w, h }),
      (r) => this.blockedAt(world, r),
    );
    return res.hitX || res.hitY;
  }

  protected blockedAt(world: World, r: Rect): boolean {
    if (r.x < 0 || r.y < 0 || r.x + r.w > ROOM_W || r.y + r.h > ROOM_H) return true;
    return world.map.rectBlocked(r, this.movement);
  }

  /** After being pushed around, settle back onto the 8px movement grid if possible. */
  protected snapToGrid(world: World): void {
    const gx = nearestGrid(this.x);
    const gy = nearestGrid(this.y);
    const { ox, oy, w, h } = this.hitbox;
    if (!this.blockedAt(world, { x: gx + ox, y: gy + oy, w, h })) {
      this.x = gx;
      this.y = gy;
    }
  }
}
