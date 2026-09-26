import { ROOM_COLS, ROOM_ROWS, TILE } from "../engine/constants";
import type { Rect } from "../engine/math";
import { tileDef, type RoomStyle, type TileDef } from "./tiles";

/**
 * What kind of thing is asking about collision:
 * - walk: the player, blocked by solid tiles
 * - enemy: ground enemies, additionally kept out of doorways and warp tiles
 * - fly: flying enemies, only blocked by dungeon walls and doorways
 * - projectile: rocks, beams and the boomerang, which fly over water and pits
 */
export type CollisionMode = "walk" | "enemy" | "fly" | "projectile";

/** A mutable 16x11 grid of tile characters for one room. */
export class TileMap {
  private readonly cells: string[];

  constructor(
    rows: readonly string[],
    readonly style: RoomStyle,
  ) {
    if (rows.length !== ROOM_ROWS || rows.some((r) => r.length !== ROOM_COLS)) {
      throw new Error(`Room map must be ${ROOM_COLS}x${ROOM_ROWS}`);
    }
    this.cells = rows.join("").split("");
  }

  inBounds(tx: number, ty: number): boolean {
    return tx >= 0 && ty >= 0 && tx < ROOM_COLS && ty < ROOM_ROWS;
  }

  char(tx: number, ty: number): string {
    return this.inBounds(tx, ty) ? this.cells[ty * ROOM_COLS + tx] : "#";
  }

  set(tx: number, ty: number, ch: string): void {
    if (this.inBounds(tx, ty)) this.cells[ty * ROOM_COLS + tx] = ch;
  }

  def(tx: number, ty: number): TileDef {
    return tileDef(this.char(tx, ty), this.style);
  }

  blocks(tx: number, ty: number, mode: CollisionMode): boolean {
    const ch = this.char(tx, ty);
    const def = this.def(tx, ty);
    switch (mode) {
      case "walk":
        return def.solid;
      case "enemy":
        return def.solid || ch === "d" || def.warp === true;
      case "fly":
        return ch === "#" || ch === "d" || ch === "M" || ch === "T";
      case "projectile":
        return def.blocksProjectiles;
    }
  }

  /**
   * True if the rectangle (room pixel coordinates) touches a blocking tile.
   * Areas outside the room count as blocking unless `outsideIsOpen` is set.
   */
  rectBlocked(r: Rect, mode: CollisionMode, outsideIsOpen = false): boolean {
    const x0 = Math.floor(r.x / TILE);
    const y0 = Math.floor(r.y / TILE);
    const x1 = Math.floor((r.x + r.w - 0.001) / TILE);
    const y1 = Math.floor((r.y + r.h - 0.001) / TILE);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        if (!this.inBounds(tx, ty)) {
          if (!outsideIsOpen) return true;
          continue;
        }
        if (this.blocks(tx, ty, mode)) return true;
      }
    }
    return false;
  }

  /** All tile coordinates overlapped by the rectangle. */
  tilesIn(r: Rect): { tx: number; ty: number }[] {
    const out: { tx: number; ty: number }[] = [];
    const x0 = Math.max(0, Math.floor(r.x / TILE));
    const y0 = Math.max(0, Math.floor(r.y / TILE));
    const x1 = Math.min(ROOM_COLS - 1, Math.floor((r.x + r.w - 0.001) / TILE));
    const y1 = Math.min(ROOM_ROWS - 1, Math.floor((r.y + r.h - 0.001) / TILE));
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) out.push({ tx, ty });
    return out;
  }

  rows(): string[] {
    const out: string[] = [];
    for (let y = 0; y < ROOM_ROWS; y++) out.push(this.cells.slice(y * ROOM_COLS, (y + 1) * ROOM_COLS).join(""));
    return out;
  }
}
