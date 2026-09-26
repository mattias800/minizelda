import { DIR_VEC } from "../../engine/math";
import type { Renderer, Variant } from "../../gfx/renderer";
import { Rock } from "../projectiles";
import type { World } from "../world";
import { GridWalker } from "./walker";

const SHOOT_WINDUP = 18;
const SHOOT_RECOVER = 12;

/** Wanders the overworld and spits rocks. Blue ones are tougher and faster. */
export class Octorok extends GridWalker {
  private shootTimer = 0;

  constructor(
    x: number,
    y: number,
    private readonly color: "red" | "blue",
  ) {
    super(x, y, color === "red" ? 1 : 2);
    this.speed = color === "red" ? 0.5 : 1;
  }

  protected override think(world: World): void {
    if (this.shootTimer > 0) {
      this.shootTimer--;
      if (this.shootTimer === SHOOT_RECOVER) {
        const v = DIR_VEC[this.dir];
        world.spawn(new Rock(this.cx + v.x * 8, this.cy + v.y * 8, this.dir));
      }
      return;
    }
    super.think(world);
  }

  protected override atGridPoint(world: World): boolean {
    if (world.rng.chance(0.06) && !this.blockedAhead(world, this.dir)) {
      this.shootTimer = SHOOT_WINDUP + SHOOT_RECOVER;
      return true;
    }
    return false;
  }

  protected drawBody(r: Renderer, variant: Variant): void {
    const frame = Math.floor(this.anim / 10) % 2;
    r.sprite(`octorok_${this.color}_${frame}_${this.dir}`, this.x, this.y, variant);
  }
}
