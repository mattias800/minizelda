import { ROOM_COLS, ROOM_H, ROOM_ROWS, ROOM_W, TILE } from "../engine/constants";
import type { Dir } from "../engine/math";
import type { Renderer } from "../gfx/renderer";
import type { DoorState, RoomSession } from "./room";

const WALL = 32;

const WALL_COLORS = {
  top: "#2c78a8",
  side: "#236593",
  bottom: "#1b547e",
  mortar: "#0c3050",
  edge: "#081828",
  highlight: "#5ca8d8",
};

/** Draws a room's tiles and, for dungeons, the beveled walls and doors. */
export function drawRoomBackground(r: Renderer, room: RoomSession, animFrame: number): void {
  const map = room.map;
  for (let ty = 0; ty < ROOM_ROWS; ty++) {
    for (let tx = 0; tx < ROOM_COLS; tx++) {
      const def = map.def(tx, ty);
      const x = tx * TILE;
      const y = ty * TILE;
      if (def.base) r.sprite(def.base(tx, ty), x, y);
      const sprite = def.sprite(tx, ty, animFrame);
      if (sprite) r.sprite(sprite, x, y);
    }
  }
  if (map.style === "dungeon") {
    drawDungeonWalls(r);
    for (const [dir, door] of room.doors) drawDoor(r, dir, door);
  }
}

function drawDungeonWalls(r: Renderer): void {
  // Each wall is a trapezoid drawn row by row so the diagonal corners stay pixel-crisp.
  for (let i = 0; i < WALL; i++) {
    const brickRow = i % 8 === 7;
    // Top and bottom walls.
    r.rect(i, i, ROOM_W - i * 2, 1, brickRow ? WALL_COLORS.mortar : WALL_COLORS.top);
    r.rect(i, ROOM_H - 1 - i, ROOM_W - i * 2, 1, brickRow ? WALL_COLORS.mortar : WALL_COLORS.bottom);
    // Left and right walls.
    r.rect(i, i + 1, 1, ROOM_H - i * 2 - 2, brickRow ? WALL_COLORS.mortar : WALL_COLORS.side);
    r.rect(ROOM_W - 1 - i, i + 1, 1, ROOM_H - i * 2 - 2, brickRow ? WALL_COLORS.mortar : WALL_COLORS.side);
  }
  // Vertical mortar seams, staggered per brick row.
  for (let row = 0; row < 4; row++) {
    const offset = row % 2 === 0 ? 0 : 8;
    for (let x = WALL + offset; x < ROOM_W - WALL; x += 16) {
      r.rect(x, row * 8, 1, 7, WALL_COLORS.mortar);
      r.rect(x, ROOM_H - (row + 1) * 8 + 1, 1, 7, WALL_COLORS.mortar);
    }
    for (let y = WALL + offset; y < ROOM_H - WALL; y += 16) {
      r.rect(row * 8, y, 7, 1, WALL_COLORS.mortar);
      r.rect(ROOM_W - (row + 1) * 8 + 1, y, 7, 1, WALL_COLORS.mortar);
    }
  }
  // Corner diagonals and the inner rim.
  for (let i = 0; i < WALL; i++) {
    r.rect(i, i, 1, 1, WALL_COLORS.edge);
    r.rect(ROOM_W - 1 - i, i, 1, 1, WALL_COLORS.edge);
    r.rect(i, ROOM_H - 1 - i, 1, 1, WALL_COLORS.edge);
    r.rect(ROOM_W - 1 - i, ROOM_H - 1 - i, 1, 1, WALL_COLORS.edge);
  }
  r.strokeRect(WALL - 1, WALL - 1, ROOM_W - WALL * 2 + 2, ROOM_H - WALL * 2 + 2, WALL_COLORS.edge);
  r.rect(WALL, WALL, ROOM_W - WALL * 2, 1, WALL_COLORS.highlight);
}

/** Door graphics are 32x32 (top/bottom) or 32x32 around a 16px opening (sides). */
function drawDoor(r: Renderer, dir: Dir, door: DoorState): void {
  const vertical = dir === "up" || dir === "down";
  // Outer frame rectangle and inner opening.
  const frame = vertical
    ? { x: 104, y: dir === "up" ? 0 : ROOM_H - WALL, w: 48, h: WALL }
    : { x: dir === "left" ? 0 : ROOM_W - WALL, y: 64, w: WALL, h: 48 };
  const hole = vertical
    ? { x: 112, y: dir === "up" ? 0 : ROOM_H - WALL, w: 32, h: WALL }
    : { x: dir === "left" ? 0 : ROOM_W - WALL, y: 80, w: WALL, h: 16 };

  r.rect(frame.x, frame.y, frame.w, frame.h, WALL_COLORS.edge);
  r.rect(frame.x + 2, frame.y + 2, frame.w - 4, frame.h - 4, WALL_COLORS.highlight);
  r.rect(frame.x + 4, frame.y + 4, frame.w - 8, frame.h - 8, WALL_COLORS.top);
  r.rect(hole.x, hole.y, hole.w, hole.h, "#000000");

  if (door.open) return;

  if (door.kind === "locked") {
    // A heavy wooden door with a keyhole.
    r.rect(hole.x + 1, hole.y + 1, hole.w - 2, hole.h - 2, "#8c4c1c");
    const stripes = vertical ? 4 : 2;
    for (let i = 1; i < stripes; i++) {
      if (vertical) r.rect(hole.x + (hole.w / stripes) * i, hole.y + 1, 1, hole.h - 2, "#5c2c08");
      else r.rect(hole.x + 1, hole.y + (hole.h / stripes) * i, hole.w - 2, 1, "#5c2c08");
    }
    const kx = hole.x + hole.w / 2;
    const ky = hole.y + hole.h / 2;
    r.rect(kx - 3, ky - 4, 6, 8, "#f8b800");
    r.rect(kx - 1, ky - 2, 2, 2, "#000000");
    r.rect(kx - 0.5, ky, 1, 3, "#000000");
  } else {
    // Shutter: iron bars.
    r.rect(hole.x, hole.y, hole.w, hole.h, "#303848");
    if (vertical) {
      for (let x = hole.x + 2; x < hole.x + hole.w - 1; x += 5) r.rect(x, hole.y, 2, hole.h, "#9ca4b8");
      r.rect(hole.x, hole.y + hole.h / 2 - 1, hole.w, 2, "#6c7488");
    } else {
      for (let y = hole.y + 1; y < hole.y + hole.h - 1; y += 5) r.rect(hole.x, y, hole.w, 2, "#9ca4b8");
      r.rect(hole.x + hole.w / 2 - 1, hole.y, 2, hole.h, "#6c7488");
    }
  }
}
