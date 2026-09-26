import { DIR_VEC, type Dir } from "../engine/math";
import { ROOMS } from "./rooms";
import type { RoomDef } from "./types";

const BY_ID = new Map(ROOMS.map((r) => [r.id, r]));

export const START_ROOM = "ow_start";
export const START_POS = { x: 7.5, y: 5 };
export const DUNGEON_ENTRY = "d_entry";

export function getRoom(id: string): RoomDef {
  const room = BY_ID.get(id);
  if (!room) throw new Error(`Unknown room '${id}'`);
  return room;
}

/** The room you scroll into when walking off `dir`, if it's in the same area. */
export function neighbor(room: RoomDef, dir: Dir): RoomDef | undefined {
  const v = DIR_VEC[dir];
  return ROOMS.find((r) => r.area === room.area && r.gx === room.gx + v.x && r.gy === room.gy + v.y);
}

export function roomsInArea(area: string): RoomDef[] {
  return ROOMS.filter((r) => r.area === area);
}

export function allRooms(): readonly RoomDef[] {
  return ROOMS;
}
