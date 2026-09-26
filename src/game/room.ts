import { ROOM_COLS, ROOM_ROWS, TILE } from "../engine/constants";
import { overlaps, type Dir, type Rect, type Rng } from "../engine/math";
import { Fire, Npc, Pedestal } from "../entities/decorations";
import { createEnemy, Enemy } from "../entities/enemies";
import type { Entity } from "../entities/entity";
import { Chest, Pickup } from "../entities/pickup";
import { DOOR_TILES } from "../world/rooms";
import { TileMap } from "../world/tilemap";
import type { DoorKind, ObjectSpawn, RoomDef } from "../world/types";
import type { GameState } from "./state";

export const unlockFlag = (roomId: string, dir: Dir) => `unlocked:${roomId}:${dir}`;
export const secretFlag = (roomId: string, tx: number, ty: number) => `secret:${roomId}:${tx}:${ty}`;
export const clearedFlag = (roomId: string) => `cleared:${roomId}`;

export interface DoorState {
  kind: DoorKind;
  open: boolean;
}

/** A live instance of a room: its (mutable) tile map, its entities and its doors. */
export class RoomSession {
  readonly map: TileMap;
  readonly doors = new Map<Dir, DoorState>();
  entities: Entity[] = [];
  /** Whether enemies were spawned here, so that clearing the room can trigger rewards. */
  hadEnemies = false;
  clearHandled = false;
  /** Characters of the room message revealed so far. */
  messageChars = 0;

  constructor(
    readonly def: RoomDef,
    private readonly state: GameState,
  ) {
    this.map = new TileMap(def.map, def.style);
    this.applySecrets();
    for (const [dir, kind] of Object.entries(def.doors ?? {}) as [Dir, DoorKind][]) {
      const open = kind !== "locked" || state.has(unlockFlag(def.id, dir));
      this.doors.set(dir, { kind, open });
    }
    this.syncDoorTiles();
  }

  get isCleared(): boolean {
    return this.def.staysCleared === true && this.state.has(clearedFlag(this.def.id));
  }

  get enemies(): Enemy[] {
    return this.entities.filter((e): e is Enemy => e instanceof Enemy && !e.dead);
  }

  /** Spawns enemies and objects. `avoid` is kept free of randomly placed enemies (the player). */
  populate(rng: Rng, avoid: Rect): void {
    for (const obj of this.def.objects ?? []) this.spawnObject(obj);
    if (!this.isCleared) {
      for (const spawn of this.def.enemies ?? []) {
        const pos = spawn.at ? { x: spawn.at.x * TILE, y: spawn.at.y * TILE } : this.randomSpot(rng, avoid);
        if (pos) this.entities.push(createEnemy(spawn.kind, pos.x, pos.y));
      }
    } else if (this.def.clearReward) {
      // Came back after clearing the room but never picked up the reward.
      this.spawnObject(this.def.clearReward);
    }
    this.hadEnemies = this.enemies.length > 0;
  }

  /** Returns false if the object was not spawned because it was already collected. */
  spawnObject(obj: ObjectSpawn): boolean {
    const px = obj.at.x * TILE;
    const py = obj.at.y * TILE;
    switch (obj.kind) {
      case "npc":
        this.entities.push(new Npc(obj.sprite, px, py));
        break;
      case "fire":
        this.entities.push(new Fire(px, py));
        break;
      case "pedestal":
        this.entities.push(new Pedestal(px, py));
        break;
      case "item":
        if (obj.flag && this.state.has(obj.flag)) return false;
        this.entities.push(Pickup.atTile(obj.item, obj.at.x, obj.at.y, { price: obj.price, flag: obj.flag }));
        break;
      case "chest":
        if (this.state.has(obj.flag)) return false;
        this.entities.push(new Chest(obj.item, obj.flag, obj.at.x, obj.at.y));
        break;
    }
    return true;
  }

  setDoorOpen(dir: Dir, open: boolean): void {
    const door = this.doors.get(dir);
    if (!door) return;
    door.open = open;
    this.syncDoorTiles();
  }

  /** Door tiles the rectangle overlaps, with the door's direction. */
  doorAt(r: Rect): Dir | undefined {
    for (const dir of this.doors.keys()) {
      for (const { tx, ty } of DOOR_TILES[dir]) {
        if (overlaps(r, { x: tx * TILE, y: ty * TILE, w: TILE, h: TILE })) return dir;
      }
    }
    return undefined;
  }

  /** Reveals a cut secret (e.g. a staircase under a bush) and remembers it. */
  revealSecret(tx: number, ty: number): void {
    this.state.set(secretFlag(this.def.id, tx, ty));
  }

  private applySecrets(): void {
    for (let ty = 0; ty < ROOM_ROWS; ty++) {
      for (let tx = 0; tx < ROOM_COLS; tx++) {
        const def = this.map.def(tx, ty);
        if (def.secret && def.cutInto && this.state.has(secretFlag(this.def.id, tx, ty))) {
          this.map.set(tx, ty, def.cutInto);
        }
      }
    }
  }

  private syncDoorTiles(): void {
    for (const [dir, door] of this.doors) {
      for (const { tx, ty } of DOOR_TILES[dir]) this.map.set(tx, ty, door.open ? "d" : "#");
    }
  }

  private randomSpot(rng: Rng, avoid: Rect): { x: number; y: number } | undefined {
    const taken = this.enemies.map((e) => e.box);
    for (let attempt = 0; attempt < 60; attempt++) {
      const tx = 2 + rng.int(ROOM_COLS - 4);
      const ty = 2 + rng.int(ROOM_ROWS - 4);
      const box = { x: tx * TILE, y: ty * TILE, w: TILE, h: TILE };
      const far = { x: avoid.x - 40, y: avoid.y - 40, w: avoid.w + 80, h: avoid.h + 80 };
      if (this.map.rectBlocked(box, "enemy")) continue;
      if (overlaps(box, far) || taken.some((t) => overlaps(t, box))) continue;
      return { x: box.x, y: box.y };
    }
    return undefined;
  }
}
