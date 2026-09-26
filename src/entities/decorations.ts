import type { Renderer } from "../gfx/renderer";
import { Entity } from "./entity";

/** A cave dweller. They just stand there and talk (the talking is the room's message). */
export class Npc extends Entity {
  constructor(
    readonly sprite: string,
    x: number,
    y: number,
  ) {
    super(x, y);
    this.solid = true;
  }

  draw(r: Renderer): void {
    r.sprite(this.sprite, this.x, this.y);
  }
}

/** The flickering fires that flank every cave dweller. */
export class Fire extends Entity {
  private age = 0;

  constructor(x: number, y: number) {
    super(x, y);
    this.solid = true;
    this.hitbox = { ox: 2, oy: 2, w: 12, h: 14 };
  }

  override update(): void {
    this.age++;
  }

  draw(r: Renderer): void {
    // Fires flicker by mirroring, like on the NES.
    r.sprite("fire", this.x, this.y, "normal", this.age % 12 < 6);
  }
}

/** Stone pedestal the Triforce rests on. */
export class Pedestal extends Entity {
  constructor(x: number, y: number) {
    super(x, y);
    this.layer = -1;
  }

  draw(r: Renderer): void {
    r.sprite("pedestal", this.x, this.y + 4);
  }
}
