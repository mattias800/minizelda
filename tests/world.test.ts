import { describe, expect, it } from "vitest";
import { ROOM_COLS, ROOM_ROWS, TILE } from "../src/engine/constants";
import { DIRS, DIR_VEC, type Dir } from "../src/engine/math";
import { Player } from "../src/entities/player";
import { DOOR_TILES } from "../src/world/rooms";
import { TileMap } from "../src/world/tilemap";
import { isKnownTile, tileDef } from "../src/world/tiles";
import type { Destination, RoomDef } from "../src/world/types";
import { allRooms, getRoom, neighbor, START_ROOM } from "../src/world/world";

const rooms = allRooms();

function edgeTiles(dir: Dir): { tx: number; ty: number }[] {
  switch (dir) {
    case "up":
      return Array.from({ length: ROOM_COLS }, (_, tx) => ({ tx, ty: 0 }));
    case "down":
      return Array.from({ length: ROOM_COLS }, (_, tx) => ({ tx, ty: ROOM_ROWS - 1 }));
    case "left":
      return Array.from({ length: ROOM_ROWS }, (_, ty) => ({ tx: 0, ty }));
    case "right":
      return Array.from({ length: ROOM_ROWS }, (_, ty) => ({ tx: ROOM_COLS - 1, ty }));
  }
}

function walkable(room: RoomDef, tx: number, ty: number): boolean {
  return !tileDef(room.map[ty][tx], room.style).solid;
}

function destinationIsFree(dest: Destination): boolean {
  const room = getRoom(dest.room);
  const map = new TileMap(room.map, room.style);
  return !map.rectBlocked(Player.terrainBox(dest.at.x * TILE, dest.at.y * TILE), "walk");
}

describe("world data", () => {
  it("has unique room ids", () => {
    expect(new Set(rooms.map((r) => r.id)).size).toBe(rooms.length);
  });

  it.each(rooms.map((r) => [r.id, r] as const))("%s has a valid 16x11 map", (_id, room) => {
    expect(room.map).toHaveLength(ROOM_ROWS);
    for (const row of room.map) {
      expect(row).toHaveLength(ROOM_COLS);
      for (const ch of row) expect(isKnownTile(ch), `tile '${ch}'`).toBe(true);
    }
  });

  it("room edges line up with their neighbors", () => {
    for (const room of rooms) {
      for (const dir of DIRS) {
        const other = neighbor(room, dir);
        if (!other) continue;
        const v = DIR_VEC[dir];
        for (const { tx, ty } of edgeTiles(dir)) {
          if (!walkable(room, tx, ty)) continue;
          const ox = v.x === 0 ? tx : v.x > 0 ? 0 : ROOM_COLS - 1;
          const oy = v.y === 0 ? ty : v.y > 0 ? 0 : ROOM_ROWS - 1;
          expect(walkable(other, ox, oy), `${room.id} ${dir} edge at ${tx},${ty} leads into a wall in ${other.id}`).toBe(true);
        }
      }
    }
  });

  it("every warp sits on a warp tile and leads somewhere walkable", () => {
    for (const room of rooms) {
      for (const warp of room.warps ?? []) {
        const ch = room.map[warp.tile.y][warp.tile.x];
        const isSecret = tileDef(ch, room.style).secret === true;
        expect(tileDef(ch, room.style).warp || isSecret, `${room.id} warp at ${warp.tile.x},${warp.tile.y}`).toBe(true);
        expect(destinationIsFree(warp.to), `${room.id} -> ${warp.to.room}`).toBe(true);
      }
      for (const exit of Object.values(room.exits ?? {})) {
        expect(destinationIsFree(exit), `${room.id} exit -> ${exit.room}`).toBe(true);
      }
    }
  });

  it("every dungeon door leads to a room or out of the dungeon", () => {
    for (const room of rooms.filter((r) => r.style === "dungeon")) {
      for (const dir of Object.keys(room.doors ?? {}) as Dir[]) {
        const leads = neighbor(room, dir) !== undefined || room.exits?.[dir] !== undefined;
        expect(leads, `${room.id} ${dir} door`).toBe(true);
        for (const { tx, ty } of DOOR_TILES[dir]) expect(room.map[ty][tx]).toBe("d");
      }
    }
  });

  it("every room is reachable from the start", () => {
    const seen = new Set([START_ROOM]);
    const queue = [START_ROOM];
    while (queue.length) {
      const room = getRoom(queue.shift()!);
      const next = [
        ...DIRS.map((d) => neighbor(room, d)?.id),
        ...(room.warps ?? []).map((w) => w.to.room),
        ...Object.values(room.exits ?? {}).map((e) => e.room),
      ];
      for (const id of next) {
        if (id && !seen.has(id)) {
          seen.add(id);
          queue.push(id);
        }
      }
    }
    expect([...seen].sort()).toEqual(rooms.map((r) => r.id).sort());
  });
});
