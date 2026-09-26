import type { Dir } from "../engine/math";
import type { RoomStyle } from "./tiles";

export type EnemyKind = "octorok_red" | "octorok_blue" | "tektite" | "keese" | "stalfos" | "dragon";

export type ItemKind =
  | "sword"
  | "boomerang"
  | "key"
  | "heart"
  | "heart_container"
  | "rupee"
  | "rupee_blue"
  | "rupee_gift"
  | "potion"
  | "triforce";

export type TrackName = "title" | "overworld" | "cave" | "dungeon" | "boss" | "triforce";

/** Position in tile units. Fractions are allowed (7.5 is centered between two tiles). */
export interface TilePoint {
  x: number;
  y: number;
}

export interface EnemySpawn {
  kind: EnemyKind;
  /** Fixed position; if omitted the enemy appears at a random free spot. */
  at?: TilePoint;
}

export type ObjectSpawn =
  | { kind: "npc"; sprite: string; at: TilePoint }
  | { kind: "fire"; at: TilePoint }
  | { kind: "pedestal"; at: TilePoint }
  | {
      kind: "item";
      item: ItemKind;
      at: TilePoint;
      /** Cost in rupees; makes this a shop item. */
      price?: number;
      /** Once collected, this flag is set and the item never appears again. */
      flag?: string;
    }
  | { kind: "chest"; item: ItemKind; at: TilePoint; flag: string };

export interface Destination {
  room: string;
  at: TilePoint;
  facing: Dir;
}

/**
 * open: a plain doorway. locked: needs a key. shutter: closes while enemies are alive.
 * exit: a doorway that leaves the area (handled through `exits`).
 */
export type DoorKind = "open" | "locked" | "shutter" | "exit";

export interface RoomDef {
  id: string;
  /** Rooms in the same area with adjacent grid positions connect by scrolling. */
  area: string;
  gx: number;
  gy: number;
  style: RoomStyle;
  /** 16x11 tile characters, see world/tiles.ts for the legend. */
  map: string[];
  music: TrackName;
  doors?: Partial<Record<Dir, DoorKind>>;
  enemies?: EnemySpawn[];
  objects?: ObjectSpawn[];
  /** Tiles that take you somewhere else (caves, stairs, the dungeon entrance). */
  warps?: { tile: TilePoint; to: Destination }[];
  /** Walking off this edge leaves the area. */
  exits?: Partial<Record<Dir, Destination>>;
  /** Text typed out when entering (cave dwellers love to talk). */
  message?: string;
  /** Spawned once all enemies in the room are defeated. */
  clearReward?: ObjectSpawn;
  /** Once cleared, enemies never return (dungeon rooms). */
  staysCleared?: boolean;
}
