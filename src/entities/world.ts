import type { AudioEngine } from "../audio/audio";
import type { Input } from "../engine/input";
import type { Rect, Rng } from "../engine/math";
import type { GameState } from "../game/state";
import type { RoomDef } from "../world/types";
import type { TileMap } from "../world/tilemap";
import type { ItemKind } from "../world/types";
import type { Entity } from "./entity";
import type { Player } from "./player";

/** What entities can see and do. Implemented by the play scene. */
export interface World {
  readonly room: RoomDef;
  readonly map: TileMap;
  readonly player: Player;
  readonly state: GameState;
  readonly audio: AudioEngine;
  readonly input: Input;
  readonly rng: Rng;
  /** Frames since the room was entered. */
  readonly frame: number;
  readonly entities: readonly Entity[];
  spawn(entity: Entity): void;
  /** True if the player may not occupy this rectangle (tiles, solid entities, room edges). */
  playerBlocked(r: Rect): boolean;
  /** Give an item to the player, with the "hold it up" ceremony for important items. */
  collectItem(item: ItemKind): void;
}
