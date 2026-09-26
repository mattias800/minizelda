import type { Rect } from "../engine/math";

export interface Movable {
  x: number;
  y: number;
}

/**
 * Moves one pixel at a time on each axis so fast movers can't tunnel through walls.
 * `boxAt` returns the collision box for a given position; `blocked` says if that box is obstructed.
 */
export function moveWithCollision(
  e: Movable,
  dx: number,
  dy: number,
  boxAt: (x: number, y: number) => Rect,
  blocked: (r: Rect) => boolean,
): { hitX: boolean; hitY: boolean } {
  let hitX = false;
  let hitY = false;
  let remaining = dx;
  while (Math.abs(remaining) > 1e-9) {
    const step = Math.max(-1, Math.min(1, remaining));
    if (blocked(boxAt(e.x + step, e.y))) {
      hitX = true;
      break;
    }
    e.x += step;
    remaining -= step;
  }
  remaining = dy;
  while (Math.abs(remaining) > 1e-9) {
    const step = Math.max(-1, Math.min(1, remaining));
    if (blocked(boxAt(e.x, e.y + step))) {
      hitY = true;
      break;
    }
    e.y += step;
    remaining -= step;
  }
  return { hitX, hitY };
}

export function nearestGrid(v: number, grid = 8): number {
  return Math.round(v / grid) * grid;
}

export function isAligned(v: number, grid = 8, tolerance = 0.01): boolean {
  return Math.abs(v - nearestGrid(v, grid)) <= tolerance;
}
