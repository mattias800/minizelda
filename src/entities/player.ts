import { approach, DIR_VEC, isHorizontal, opposite, type Dir, type Rect } from "../engine/math";
import { ALL_ART } from "../gfx/art";
import type { Renderer, Variant } from "../gfx/renderer";
import type { ItemKind } from "../world/types";
import { Boomerang } from "./boomerang";
import { Entity } from "./entity";
import { ITEM_SPRITE } from "./pickup";
import { moveWithCollision, nearestGrid } from "./physics";
import { SwordBeam, type Projectile } from "./projectiles";
import type { World } from "./world";

export const PLAYER_SPEED = 1.5;
const ATTACK_FRAMES = 16;
const BEAM_FRAME = 4;
const INVULN_FRAMES = 60;
const KNOCKBACK_FRAMES = 8;
const KNOCKBACK_SPEED = 4;
export const DEATH_FRAMES = 110;

interface SwordPlacement {
  sprite: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Where the sword sits for each facing, relative to the player's top-left, fully extended. */
const SWORD_OFFSETS: Record<Dir, { x: number; y: number; w: number; h: number }> = {
  up: { x: 3, y: -12, w: 7, h: 16 },
  down: { x: 6, y: 12, w: 7, h: 16 },
  left: { x: -12, y: 7, w: 16, h: 7 },
  right: { x: 12, y: 7, w: 16, h: 7 },
};

export class Player extends Entity {
  dir: Dir = "down";
  attackTimer = 0;
  holdTimer = 0;
  heldItem?: ItemKind;
  invuln = 0;
  dyingTimer = 0;
  /** Frames of automatic walking (entering dungeon rooms through a door). */
  autoWalk = 0;
  private walkAnim = 0;
  private knockFrames = 0;
  private knockDir: Dir = "down";
  private boomerang?: Boomerang;
  private beam?: SwordBeam;

  constructor(x: number, y: number) {
    super(x, y);
    this.hitbox = { ox: 3, oy: 3, w: 10, h: 12 };
    this.layer = 1.5;
  }

  /** The box used against walls: just the feet, so the head can overlap walls above. */
  static terrainBox(x: number, y: number): Rect {
    return { x: x + 2, y: y + 8, w: 12, h: 8 };
  }

  get terrain(): Rect {
    return Player.terrainBox(this.x, this.y);
  }

  get isDying(): boolean {
    return this.dyingTimer > 0;
  }

  get isBusy(): boolean {
    return this.holdTimer > 0 || this.isDying;
  }

  /** Called when entering a new room: forget projectiles that belonged to the old one. */
  resetForRoom(): void {
    this.boomerang = undefined;
    this.beam = undefined;
    this.attackTimer = 0;
    this.knockFrames = 0;
  }

  override update(world: World): void {
    if (this.isDying) {
      this.dyingTimer++;
      return;
    }
    if (this.invuln > 0) this.invuln--;
    if (this.holdTimer > 0) {
      if (--this.holdTimer === 0) this.heldItem = undefined;
      return;
    }
    if (this.knockFrames > 0) {
      this.knockFrames--;
      const v = DIR_VEC[this.knockDir];
      this.moveBy(world, v.x * KNOCKBACK_SPEED, v.y * KNOCKBACK_SPEED);
      return;
    }
    if (this.autoWalk > 0) {
      this.autoWalk--;
      const v = DIR_VEC[this.dir];
      this.x += v.x;
      this.y += v.y;
      this.walkAnim++;
      return;
    }
    if (this.attackTimer > 0) {
      this.attackTimer--;
      if (ATTACK_FRAMES - this.attackTimer === BEAM_FRAME) this.maybeFireBeam(world);
      return;
    }

    const { input, state } = world;
    if (input.wasPressed("a") && state.hasSword) {
      this.attackTimer = ATTACK_FRAMES;
      world.audio.sfx("sword");
      return;
    }
    if (input.wasPressed("b") && state.hasBoomerang && (!this.boomerang || this.boomerang.dead)) {
      this.boomerang = new Boomerang(this.cx, this.cy, this.dir);
      world.spawn(this.boomerang);
    }

    const d = input.direction();
    if (d) {
      this.dir = d;
      const v = DIR_VEC[d];
      // Slide onto the 8px grid on the other axis, like the original. Makes doorways easy.
      let ax = 0;
      let ay = 0;
      if (isHorizontal(d)) ay = approach(this.y, nearestGrid(this.y), PLAYER_SPEED) - this.y;
      else ax = approach(this.x, nearestGrid(this.x), PLAYER_SPEED) - this.x;
      this.moveBy(world, v.x * PLAYER_SPEED + ax, v.y * PLAYER_SPEED + ay);
      this.walkAnim++;
    }
  }

  private moveBy(world: World, dx: number, dy: number): void {
    moveWithCollision(this, dx, dy, Player.terrainBox, (r) => world.playerBlocked(r));
  }

  private maybeFireBeam(world: World): void {
    if (!world.state.isFullHealth || (this.beam && !this.beam.dead)) return;
    const s = this.swordPlacement(true);
    this.beam = new SwordBeam(s.x, s.y, this.dir);
    world.spawn(this.beam);
    world.audio.sfx("beam");
  }

  /** The sword's sprite and rectangle, if the player is swinging. */
  swordPlacement(forceFull = false): SwordPlacement {
    const phase = ATTACK_FRAMES - this.attackTimer;
    const extended = forceFull || (phase >= 3 && phase < ATTACK_FRAMES - 3);
    const o = SWORD_OFFSETS[this.dir];
    const v = DIR_VEC[this.dir];
    const pull = extended ? 0 : 6;
    return {
      sprite: `sword_${this.dir}`,
      x: this.x + o.x - v.x * pull,
      y: this.y + o.y - v.y * pull,
      w: o.w,
      h: o.h,
    };
  }

  /** The sword's hit rectangle while it can hurt things. */
  swordHitbox(): Rect | null {
    const phase = ATTACK_FRAMES - this.attackTimer;
    if (this.attackTimer <= 0 || phase < 1 || phase > ATTACK_FRAMES - 3) return null;
    const s = this.swordPlacement();
    return { x: s.x, y: s.y, w: s.w, h: s.h };
  }

  /** The small shield stops rocks when facing them and not swinging. */
  canBlock(p: Projectile): boolean {
    return p.blockable && this.attackTimer === 0 && !this.isBusy && this.knockFrames === 0 && this.dir === opposite(p.dir);
  }

  hurt(world: World, amount: number, fromX: number, fromY: number): void {
    if (this.invuln > 0 || this.isBusy) return;
    world.state.damage(amount);
    world.audio.sfx("hurt");
    this.invuln = INVULN_FRAMES;
    this.attackTimer = 0;
    const dx = this.cx - fromX;
    const dy = this.cy - fromY;
    this.knockDir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? "left" : "right") : dy < 0 ? "up" : "down";
    this.knockFrames = KNOCKBACK_FRAMES;
    if (world.state.health <= 0) {
      this.dyingTimer = 1;
      this.knockFrames = 0;
      world.audio.stopMusic();
      world.audio.sfx("die");
    }
  }

  holdUp(item: ItemKind, frames: number): void {
    this.heldItem = item;
    this.holdTimer = frames;
    this.attackTimer = 0;
    this.knockFrames = 0;
    this.dir = "down";
  }

  draw(r: Renderer): void {
    if (this.isDying) {
      const spin: Dir[] = ["down", "left", "up", "right"];
      const dir = this.dyingTimer < 70 ? spin[Math.floor(this.dyingTimer / 4) % 4] : "down";
      const variant: Variant = this.dyingTimer > 70 && this.dyingTimer % 8 < 4 ? "hurtB" : "normal";
      r.sprite(`hero_${dir}_0`, this.x, this.y, variant);
      return;
    }
    let variant: Variant = "normal";
    if (this.invuln > 0 && this.invuln % 4 < 2) variant = this.invuln % 8 < 4 ? "hurtA" : "hurtB";

    if (this.holdTimer > 0 && this.heldItem) {
      r.sprite("hero_down_1", this.x, this.y, variant);
      const sprite = ITEM_SPRITE[this.heldItem];
      const art = ALL_ART[sprite];
      const w = art.rows[0].length;
      const h = art.rows.length;
      r.sprite(sprite, this.x + 8 - w / 2, this.y - h + 2);
      r.sprite("hand", this.x + 8 - w / 2 - 3, this.y - 2);
      r.sprite("hand", this.x + 8 + w / 2 - 1, this.y - 2);
      return;
    }

    if (this.attackTimer > 0) {
      const s = this.swordPlacement();
      const v = DIR_VEC[this.dir];
      // Draw the sword behind the body when facing up so the hilt is hidden by the head.
      if (this.dir === "up") r.sprite(s.sprite, s.x, s.y);
      r.sprite(`hero_${this.dir}_1`, this.x + v.x * 2, this.y + v.y * 2, variant);
      if (this.dir !== "up") r.sprite(s.sprite, s.x, s.y);
      return;
    }

    const frame = Math.floor(this.walkAnim / 6) % 2;
    r.sprite(`hero_${this.dir}_${frame}`, this.x, this.y, variant);
  }
}

