import type { SongName } from "../audio/tracks";
import { HUD_H, ROOM_H, ROOM_W, TILE } from "../engine/constants";
import { DIR_VEC, isHorizontal, opposite, overlaps, Rng, type Dir, type Rect } from "../engine/math";
import { Boomerang } from "../entities/boomerang";
import { Leaf, Spark } from "../entities/effects";
import { Enemy } from "../entities/enemies";
import type { Entity } from "../entities/entity";
import { Chest, MAJOR_ITEMS, Pickup } from "../entities/pickup";
import { DEATH_FRAMES, Player } from "../entities/player";
import { Projectile } from "../entities/projectiles";
import type { World } from "../entities/world";
import type { Game, Scene } from "../game/game";
import { clearedFlag, RoomSession, unlockFlag } from "../game/room";
import { drawRoomBackground } from "../game/roomRenderer";
import type { GameState } from "../game/state";
import { COLOR } from "../gfx/palettes";
import type { Renderer } from "../gfx/renderer";
import { drawHud } from "../ui/hud";
import { drawPauseScreen } from "../ui/pause";
import type { Destination, ItemKind, RoomDef } from "../world/types";
import { DUNGEON_ENTRY, getRoom, neighbor, START_POS, START_ROOM } from "../world/world";
import { EndingScene } from "./ending";
import { GameOverScene } from "./gameover";

const FADE_FRAMES = 18;
const SCROLL_FRAMES_H = 64;
const SCROLL_FRAMES_V = 44;
const DOOR_WALK_IN = 32;
const HOLD_FRAMES = 100;
const TRIFORCE_HOLD_FRAMES = 300;

type Transition =
  | { kind: "scroll"; dir: Dir; to: RoomSession; t: number; duration: number; startX: number; startY: number }
  | { kind: "fade"; t: number; dest: Destination; switched: boolean };

/** The game itself: one room at a time, with scrolling and fading between rooms. */
export class PlayScene implements Scene, World {
  readonly player = new Player(0, 0);
  readonly rng = new Rng();
  private session!: RoomSession;
  private transition?: Transition;
  private paused = false;
  private pendingVictory = false;
  private shuttersClosed = false;
  private errorCooldown = 0;
  private roomFrame = 0;
  private clock = 0;

  constructor(
    private readonly game: Game,
    readonly state: GameState,
    start: Destination = state.respawn,
  ) {
    this.enterRoom(start);
  }

  // ---------------------------------------------------------------------------
  // World interface (what entities see)
  // ---------------------------------------------------------------------------

  get room(): RoomDef {
    return this.session.def;
  }

  get map() {
    return this.session.map;
  }

  get audio() {
    return this.game.audio;
  }

  get input() {
    return this.game.input;
  }

  get frame(): number {
    return this.roomFrame;
  }

  get entities(): readonly Entity[] {
    return this.session.entities;
  }

  spawn(entity: Entity): void {
    this.session.entities.push(entity);
  }

  playerBlocked(r: Rect): boolean {
    if (r.x < 0 && !this.canExit("left")) return true;
    if (r.x + r.w > ROOM_W && !this.canExit("right")) return true;
    if (r.y < 0 && !this.canExit("up")) return true;
    if (r.y + r.h > ROOM_H && !this.canExit("down")) return true;
    if (this.map.rectBlocked(r, "walk", true)) return true;
    return this.session.entities.some((e) => e.solid && overlaps(r, e.box));
  }

  collectItem(item: ItemKind): void {
    const s = this.state;
    switch (item) {
      case "rupee":
        s.addRupees(1);
        this.audio.sfx("rupee");
        return;
      case "rupee_blue":
        s.addRupees(5);
        this.audio.sfx("rupee");
        return;
      case "heart":
        s.heal(2);
        this.audio.sfx("heart");
        return;
      case "key":
        s.keys++;
        this.audio.sfx("key");
        return;
      case "potion":
        s.heal(s.maxHealth);
        this.audio.sfx("fairy");
        return;
      case "rupee_gift":
        s.addRupees(30);
        break;
      case "sword":
        s.hasSword = true;
        break;
      case "boomerang":
        s.hasBoomerang = true;
        break;
      case "heart_container":
        s.addHeartContainer();
        break;
      case "triforce":
        s.hasTriforce = true;
        this.pendingVictory = true;
        this.player.holdUp(item, TRIFORCE_HOLD_FRAMES);
        this.audio.playJingle("fanfare");
        return;
    }
    if (MAJOR_ITEMS.has(item)) {
      this.player.holdUp(item, HOLD_FRAMES);
      this.audio.playJingle(item === "heart_container" ? "heart_container" : "item", this.musicFor(this.room));
    }
  }

  // ---------------------------------------------------------------------------
  // Simulation
  // ---------------------------------------------------------------------------

  update(): void {
    this.clock++;
    if (this.transition) {
      this.updateTransition(this.transition);
      return;
    }
    if (this.input.wasPressed("start") && !this.player.isBusy) {
      this.paused = !this.paused;
      this.audio.sfx("pause");
    }
    if (this.paused) return;

    this.roomFrame++;
    this.state.frames++;
    if (this.errorCooldown > 0) this.errorCooldown--;

    if (this.player.isDying) {
      this.player.update(this);
      if (this.player.dyingTimer > DEATH_FRAMES) this.game.setScene(new GameOverScene(this.game, this.state));
      return;
    }
    if (this.player.holdTimer > 0) {
      this.player.update(this);
      if (this.player.holdTimer === 0 && this.pendingVictory) this.game.setScene(new EndingScene(this.game, this.state));
      return;
    }
    if (this.updateMessage()) return;

    this.player.update(this);
    this.tryUnlockDoor();
    for (const e of [...this.session.entities]) if (!e.dead) e.update(this);
    this.resolveCollisions();
    this.session.entities = this.session.entities.filter((e) => !e.dead);
    this.updateRoomClear();
    this.updateShutters();
    if (this.state.health <= 2 && this.roomFrame % 36 === 0) this.audio.sfx("lowHealth");
    if (!this.checkWarps()) this.checkEdges();
  }

  /** Types out the room message. Returns true while typing (the player waits). */
  private updateMessage(): boolean {
    const msg = this.room.message;
    if (!msg || this.session.messageChars >= msg.length) return false;
    if (this.roomFrame % 4 === 0) {
      this.session.messageChars++;
      const ch = msg[this.session.messageChars - 1];
      if (ch !== " " && ch !== "\n") this.audio.sfx("text");
    }
    return true;
  }

  private resolveCollisions(): void {
    const player = this.player;
    const sword = player.swordHitbox();
    const enemies = this.session.enemies.filter((e) => e.active);

    if (sword) {
      for (const enemy of enemies) if (overlaps(sword, enemy.box)) enemy.hurt(this, { amount: 1, push: player.dir });
      this.cutTiles(sword);
    }

    for (const e of this.session.entities) {
      if (e.dead) continue;
      if (e instanceof Enemy) {
        if (e.active && overlaps(player.box, e.box)) player.hurt(this, e.contactDamage, e.cx, e.cy);
      } else if (e instanceof Projectile) {
        this.resolveProjectile(e, enemies);
      } else if (e instanceof Boomerang) {
        for (const enemy of enemies) {
          if (!enemy.dead && overlaps(e.box, enemy.box)) {
            enemy.onBoomerang(this);
            e.comeBack();
          }
        }
        for (const p of this.session.entities) {
          if (p instanceof Pickup && !p.isShopItem && !p.dead && overlaps(e.box, p.box)) e.grab(p);
        }
      } else if (e instanceof Pickup) {
        if (!e.carried && (overlaps(player.box, e.box) || (sword && !e.isShopItem && overlaps(sword, e.box)))) {
          this.tryCollect(e);
        }
      } else if (e instanceof Chest) {
        if (overlaps(player.box, e.box)) {
          e.dead = true;
          this.state.set(e.flag);
          this.collectItem(e.item);
        }
      }
    }
  }

  private resolveProjectile(p: Projectile, enemies: Enemy[]): void {
    if (p.friendly) {
      for (const enemy of enemies) {
        if (!enemy.dead && overlaps(p.box, enemy.box)) {
          enemy.hurt(this, { amount: p.damage, push: p.dir });
          p.onImpact(this);
          return;
        }
      }
      return;
    }
    if (!overlaps(this.player.box, p.box)) return;
    if (this.player.canBlock(p)) {
      this.audio.sfx("shield");
      this.spawn(new Spark(p.cx, p.cy));
    } else {
      this.player.hurt(this, p.damage, p.cx - p.vx * 4, p.cy - p.vy * 4);
    }
    p.onImpact(this);
  }

  private tryCollect(p: Pickup): void {
    if (p.price !== undefined) {
      if (this.state.rupees < p.price) {
        if (this.errorCooldown === 0) this.audio.sfx("error");
        this.errorCooldown = 40;
        return;
      }
      this.state.addRupees(-p.price);
    }
    p.dead = true;
    if (p.flag) this.state.set(p.flag);
    this.collectItem(p.item);
  }

  /** The sword cuts bushes. One special bush hides a staircase. */
  private cutTiles(sword: Rect): void {
    const tip = { x: sword.x + 1, y: sword.y + 1, w: sword.w - 2, h: sword.h - 2 };
    for (const { tx, ty } of this.map.tilesIn(tip)) {
      const def = this.map.def(tx, ty);
      if (!def.cutInto) continue;
      this.map.set(tx, ty, def.cutInto);
      const cx = tx * TILE + 8;
      const cy = ty * TILE + 8;
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        this.spawn(new Leaf(cx, cy, Math.cos(a) * 1.2, Math.sin(a) * 1.2 - 1, i % 2 ? "#6cc038" : "#b0e860"));
      }
      this.audio.sfx("cut");
      if (def.secret) {
        this.session.revealSecret(tx, ty);
        this.audio.playJingle("secret", this.musicFor(this.room));
      } else if (this.rng.chance(0.15)) {
        this.spawn(Pickup.dropped(this.rng.chance(0.6) ? "rupee" : "heart", cx, cy));
      }
    }
  }

  private tryUnlockDoor(): void {
    if (this.state.keys <= 0 || this.player.isBusy) return;
    const dir = this.input.direction();
    if (!dir) return;
    const door = this.session.doors.get(dir);
    if (!door || door.kind !== "locked" || door.open) return;
    const v = DIR_VEC[dir];
    const t = this.player.terrain;
    if (this.session.doorAt({ x: t.x + v.x * 2, y: t.y + v.y * 2, w: t.w, h: t.h }) !== dir) return;
    this.state.keys--;
    this.session.setDoorOpen(dir, true);
    this.state.set(unlockFlag(this.room.id, dir));
    const other = neighbor(this.room, dir);
    if (other) this.state.set(unlockFlag(other.id, opposite(dir)));
    this.audio.sfx("unlock");
  }

  private updateRoomClear(): void {
    const s = this.session;
    if (!s.hadEnemies || s.clearHandled || s.enemies.length > 0) return;
    s.clearHandled = true;
    if (this.room.staysCleared) this.state.set(clearedFlag(this.room.id));
    let opened = false;
    for (const [dir, door] of s.doors) {
      if (door.kind === "shutter" && !door.open) {
        s.setDoorOpen(dir, true);
        opened = true;
      }
    }
    if (opened) this.audio.sfx("shutter");
    const reward = this.room.clearReward;
    if (reward && s.spawnObject(reward)) this.audio.sfx("fairy");
    this.audio.playMusic(this.musicFor(this.room));
  }

  /** Shutter doors slam shut once the player is inside a room with enemies. */
  private updateShutters(): void {
    if (this.shuttersClosed || this.session.enemies.length === 0 || this.player.autoWalk > 0) return;
    if (this.session.doorAt(this.player.terrain)) return;
    let closed = false;
    for (const [dir, door] of this.session.doors) {
      if (door.kind === "shutter" && door.open) {
        this.session.setDoorOpen(dir, false);
        closed = true;
      }
    }
    this.shuttersClosed = true;
    if (closed) this.audio.sfx("shutter");
  }

  private canExit(dir: Dir): boolean {
    return neighbor(this.room, dir) !== undefined || this.room.exits?.[dir] !== undefined;
  }

  private checkWarps(): boolean {
    const t = this.player.terrain;
    const tx = Math.floor((t.x + t.w / 2) / TILE);
    const ty = Math.floor((t.y + t.h / 2) / TILE);
    if (!this.map.def(tx, ty).warp) return false;
    const warp = this.room.warps?.find((w) => w.tile.x === tx && w.tile.y === ty);
    if (!warp) return false;
    this.audio.sfx("stairs");
    this.transition = { kind: "fade", t: 0, dest: warp.to, switched: false };
    return true;
  }

  private checkEdges(): void {
    const p = this.player;
    const dir: Dir | null = p.x < 0 ? "left" : p.x > ROOM_W - TILE ? "right" : p.y < 0 ? "up" : p.y > ROOM_H - TILE ? "down" : null;
    if (!dir || !this.canExit(dir)) return;
    const next = neighbor(this.room, dir);
    if (next) {
      this.player.resetForRoom();
      this.transition = {
        kind: "scroll",
        dir,
        to: new RoomSession(next, this.state),
        t: 0,
        duration: isHorizontal(dir) ? SCROLL_FRAMES_H : SCROLL_FRAMES_V,
        startX: p.x,
        startY: p.y,
      };
    } else {
      this.transition = { kind: "fade", t: 0, dest: this.room.exits![dir]!, switched: false };
    }
  }

  private updateTransition(tr: Transition): void {
    tr.t++;
    if (tr.kind === "fade") {
      if (!tr.switched && tr.t >= FADE_FRAMES) {
        tr.switched = true;
        this.enterRoom(tr.dest);
      }
      if (tr.t >= FADE_FRAMES * 2) this.transition = undefined;
      return;
    }
    if (tr.t < tr.duration) return;
    const p = this.player;
    this.session = tr.to;
    if (tr.dir === "left") p.x = ROOM_W - TILE;
    if (tr.dir === "right") p.x = 0;
    if (tr.dir === "up") p.y = ROOM_H - TILE;
    if (tr.dir === "down") p.y = 0;
    if (this.room.style === "dungeon") p.autoWalk = DOOR_WALK_IN;
    this.transition = undefined;
    this.onRoomEntered();
  }

  private enterRoom(dest: Destination): void {
    this.session = new RoomSession(getRoom(dest.room), this.state);
    this.player.x = dest.at.x * TILE;
    this.player.y = dest.at.y * TILE;
    this.player.dir = dest.facing;
    this.player.resetForRoom();
    this.onRoomEntered();
  }

  private onRoomEntered(): void {
    this.roomFrame = 0;
    this.shuttersClosed = false;
    const def = this.room;
    if (def.area === "dungeon") {
      this.state.visited.add(def.id);
      this.state.respawn = { room: DUNGEON_ENTRY, at: { x: 7.5, y: 8 }, facing: "up" };
    } else if (def.area === "overworld") {
      this.state.respawn = { room: START_ROOM, at: START_POS, facing: "down" };
    }
    this.session.populate(this.rng, this.player.box);
    this.audio.playMusic(this.musicFor(def));
  }

  private musicFor(def: RoomDef): SongName {
    if (def.music === "boss" && this.state.has(clearedFlag(def.id))) return "dungeon";
    return def.music;
  }

  // ---------------------------------------------------------------------------
  // Drawing
  // ---------------------------------------------------------------------------

  draw(r: Renderer): void {
    r.clear(COLOR.black);
    const anim = Math.floor(this.clock / 20);
    r.withOffset(0, HUD_H, () =>
      r.withClip(0, 0, ROOM_W, ROOM_H, () => {
        const tr = this.transition;
        if (tr?.kind === "scroll") this.drawScroll(r, tr, anim);
        else this.drawRoom(r, this.session, anim, true);
      }),
    );
    drawHud(r, this.state, this.room, this.clock);
    if (this.paused) drawPauseScreen(r, this.state);
    const tr = this.transition;
    if (tr?.kind === "fade") {
      const alpha = tr.t < FADE_FRAMES ? tr.t / FADE_FRAMES : 2 - tr.t / FADE_FRAMES;
      r.withAlpha(Math.max(0, Math.min(1, alpha)), () => r.rect(0, HUD_H, ROOM_W, ROOM_H, COLOR.black));
    }
  }

  private drawRoom(r: Renderer, session: RoomSession, anim: number, withEntities: boolean): void {
    drawRoomBackground(r, session, anim);
    if (!withEntities) return;
    const drawables: Entity[] = [...session.entities, this.player].sort((a, b) => a.layer - b.layer);
    for (const e of drawables) e.draw(r, this);
    this.drawMessage(r, session);
  }

  private drawScroll(r: Renderer, tr: Extract<Transition, { kind: "scroll" }>, anim: number): void {
    const v = DIR_VEC[tr.dir];
    const p = tr.t / tr.duration;
    const span = isHorizontal(tr.dir) ? ROOM_W : ROOM_H;
    const camX = v.x * span * p;
    const camY = v.y * span * p;
    r.withOffset(-camX, -camY, () => this.drawRoom(r, this.session, anim, false));
    r.withOffset(v.x * ROOM_W - camX, v.y * ROOM_H - camY, () => this.drawRoom(r, tr.to, anim, false));
    // The player glides from the old edge to the matching edge of the new room.
    const endX = tr.dir === "left" ? -TILE : tr.dir === "right" ? ROOM_W : tr.startX;
    const endY = tr.dir === "up" ? -TILE : tr.dir === "down" ? ROOM_H : tr.startY;
    this.player.x = tr.startX + (endX - tr.startX) * p - camX;
    this.player.y = tr.startY + (endY - tr.startY) * p - camY;
    this.player.draw(r);
    this.player.x = tr.startX;
    this.player.y = tr.startY;
  }

  private drawMessage(r: Renderer, session: RoomSession): void {
    const msg = session.def.message;
    if (!msg) return;
    const shown = msg.slice(0, session.messageChars);
    shown.split("\n").forEach((line, i) => {
      const full = msg.split("\n")[i];
      // Keep lines anchored where the complete line will be, so text doesn't jump while typing.
      const x = ROOM_W / 2 - (full.length * 7 - 2) / 2;
      r.text(line, x, 40 + i * 11);
    });
  }
}
