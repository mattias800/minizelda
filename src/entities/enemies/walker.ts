import { DIR_VEC, DIRS, dirFromVector, type Dir } from "../../engine/math";
import { isAligned } from "../physics";
import type { World } from "../world";
import { Enemy } from "./enemy";

/**
 * Classic grid-based wandering: walks in a cardinal direction and only considers
 * turning when lined up with the 8px grid, which gives the NES enemies their feel.
 */
export abstract class GridWalker extends Enemy {
  dir: Dir = "down";
  protected speed = 0.5;
  /** Chance to turn at each grid point. */
  protected turnChance = 0.12;
  /** Chance that a turn heads toward the player instead of a random direction. */
  protected chaseChance = 0.3;

  protected think(world: World): void {
    if (isAligned(this.x) && isAligned(this.y)) {
      this.x = Math.round(this.x);
      this.y = Math.round(this.y);
      if (this.atGridPoint(world)) return;
      if (world.rng.chance(this.turnChance) || this.blockedAhead(world, this.dir)) this.pickDirection(world);
    }
    const v = DIR_VEC[this.dir];
    if (this.move(world, v.x * this.speed, v.y * this.speed)) {
      this.snapToGrid(world);
      this.pickDirection(world);
    }
  }

  /** Hook for subclasses: return true to skip moving this frame (e.g. to shoot). */
  protected atGridPoint(_world: World): boolean {
    return false;
  }

  protected blockedAhead(world: World, dir: Dir): boolean {
    const v = DIR_VEC[dir];
    const b = this.box;
    return this.blockedAt(world, { x: b.x + v.x, y: b.y + v.y, w: b.w, h: b.h });
  }

  protected pickDirection(world: World): void {
    const open = DIRS.filter((d) => !this.blockedAhead(world, d));
    if (open.length === 0) return;
    const towardPlayer = dirFromVector(world.player.cx - this.cx, world.player.cy - this.cy);
    if (world.rng.chance(this.chaseChance) && open.includes(towardPlayer)) {
      this.dir = towardPlayer;
    } else {
      this.dir = world.rng.pick(open);
    }
  }
}
